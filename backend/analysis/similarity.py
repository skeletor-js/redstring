"""Case similarity scoring algorithm.

Implements weighted multi-factor similarity scoring to find cases
similar to a reference case. Supports configurable weights and
multiple similarity factors.
"""

import logging
import math
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from database.connection import get_db_connection

logger = logging.getLogger(__name__)


# =============================================================================
# DATA CLASSES
# =============================================================================


@dataclass
class SimilarityWeights:
    """Configurable weights for similarity factors.

    Default weights prioritize MO pattern indicators:
    - Weapon type (30%): Strong indicator of offender MO
    - Geographic proximity (25%): Serial offenders operate in defined areas
    - Victim age (20%): Victim selection patterns
    - Temporal proximity (15%): Active period clustering
    - Victim race (5%): Secondary demographic indicator
    - Circumstance (3%): Contextual pattern
    - Relationship (2%): Contextual pattern
    """

    weapon: float = 0.30
    geographic: float = 0.25
    victim_age: float = 0.20
    temporal: float = 0.15
    victim_race: float = 0.05
    circumstance: float = 0.03
    relationship: float = 0.02

    def total(self) -> float:
        """Calculate total weight (should be 1.0)."""
        return (
            self.weapon
            + self.geographic
            + self.victim_age
            + self.temporal
            + self.victim_race
            + self.circumstance
            + self.relationship
        )


@dataclass
class SimilarCase:
    """A case similar to the reference case."""

    case_id: str
    similarity_score: float
    matching_factors: Dict[str, float]
    case_data: Dict


@dataclass
class SimilarityConfig:
    """Configuration for similarity search."""

    weights: SimilarityWeights = field(default_factory=SimilarityWeights)
    radius_miles: float = 100.0
    age_range: int = 10
    year_range: int = 5
    min_score: float = 30.0
    limit: int = 50


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in miles using Haversine formula.

    Args:
        lat1: Latitude of first point
        lon1: Longitude of first point
        lat2: Latitude of second point
        lon2: Longitude of second point

    Returns:
        Distance in miles
    """
    R = 3959  # Earth's radius in miles

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(
        lat2_rad
    ) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def same_weapon_category(code1: Optional[int], code2: Optional[int]) -> bool:
    """Check if two weapon codes are in the same category.

    Weapon categories based on MAP data dictionary:
    - Firearms: 11 (Firearm type unknown), 12 (Handgun), 13 (Rifle),
                14 (Shotgun), 15 (Other gun)
    - Sharp: 20 (Knife/cutting instrument)
    - Blunt: 30 (Blunt object)
    - Personal: 40 (Personal weapons - hands, fists, feet)
    - Asphyxiation: 80 (Strangulation), 85 (Asphyxiation)

    Args:
        code1: First weapon code
        code2: Second weapon code

    Returns:
        True if weapons are in the same category
    """
    if code1 is None or code2 is None:
        return False

    categories = {
        "firearms": {11, 12, 13, 14, 15},
        "sharp": {20},
        "blunt": {30},
        "personal": {40},
        "asphyxiation": {80, 85},
        "fire": {60},
        "poison": {70},
        "explosives": {65},
        "narcotics": {75},
        "drowning": {90},
        "other": {50, 55},
    }

    for category_codes in categories.values():
        if code1 in category_codes and code2 in category_codes:
            return True

    return False


# =============================================================================
# SIMILARITY CALCULATION
# =============================================================================


def calculate_similarity(
    reference_case: Dict,
    candidate_case: Dict,
    config: SimilarityConfig,
) -> Tuple[float, Dict[str, float]]:
    """Calculate similarity score between two cases.

    Uses weighted multi-factor scoring across weapon, geography, victim
    demographics, and temporal proximity.

    Args:
        reference_case: The case to compare against
        candidate_case: The case being evaluated
        config: Similarity configuration with weights and thresholds

    Returns:
        Tuple of (overall_score, factor_scores) where factor_scores
        contains individual scores (0-100) for each factor
    """
    weights = config.weights
    factor_scores: Dict[str, float] = {}

    # 1. Weapon match (30% default)
    if reference_case.get("weapon") == candidate_case.get("weapon"):
        factor_scores["weapon"] = 100.0
    elif same_weapon_category(
        reference_case.get("weapon_code"), candidate_case.get("weapon_code")
    ):
        factor_scores["weapon"] = 70.0
    else:
        factor_scores["weapon"] = 0.0

    # 2. Geographic proximity (25% default)
    ref_lat = reference_case.get("latitude")
    ref_lon = reference_case.get("longitude")
    cand_lat = candidate_case.get("latitude")
    cand_lon = candidate_case.get("longitude")

    if all([ref_lat, ref_lon, cand_lat, cand_lon]):
        distance = haversine_distance(ref_lat, ref_lon, cand_lat, cand_lon)
        if distance <= config.radius_miles:
            # Linear decay: 100 at 0 miles, 50 at radius_miles
            factor_scores["geographic"] = max(
                0, 100 - (distance / config.radius_miles * 50)
            )
        else:
            factor_scores["geographic"] = 0.0
    else:
        # Same county fallback
        if reference_case.get("county_fips_code") == candidate_case.get(
            "county_fips_code"
        ):
            factor_scores["geographic"] = 100.0
        elif reference_case.get("state") == candidate_case.get("state"):
            factor_scores["geographic"] = 30.0
        else:
            factor_scores["geographic"] = 0.0

    # 3. Victim age similarity (20% default)
    ref_age = reference_case.get("vic_age", 999)
    cand_age = candidate_case.get("vic_age", 999)

    if ref_age == 999 or cand_age == 999:
        factor_scores["victim_age"] = 50.0  # Neutral for unknown
    else:
        age_diff = abs(ref_age - cand_age)
        if age_diff <= config.age_range:
            factor_scores["victim_age"] = 100.0
        else:
            # Gradual decay beyond threshold
            factor_scores["victim_age"] = max(
                0, 100 - (age_diff - config.age_range) * 5
            )

    # 4. Temporal proximity (15% default)
    ref_year = reference_case.get("year", 0)
    cand_year = candidate_case.get("year", 0)
    year_diff = abs(ref_year - cand_year)

    if year_diff <= config.year_range:
        factor_scores["temporal"] = 100.0
    else:
        # Gradual decay beyond threshold
        factor_scores["temporal"] = max(0, 100 - (year_diff - config.year_range) * 10)

    # 5. Victim race match (5% default)
    factor_scores["victim_race"] = (
        100.0
        if reference_case.get("vic_race") == candidate_case.get("vic_race")
        else 0.0
    )

    # 6. Circumstance match (3% default)
    ref_circumstance = reference_case.get("circumstance")
    cand_circumstance = candidate_case.get("circumstance")
    if ref_circumstance and cand_circumstance:
        factor_scores["circumstance"] = (
            100.0 if ref_circumstance == cand_circumstance else 0.0
        )
    else:
        factor_scores["circumstance"] = 50.0  # Neutral for unknown

    # 7. Relationship match (2% default)
    ref_relationship = reference_case.get("relationship")
    cand_relationship = candidate_case.get("relationship")
    if ref_relationship and cand_relationship:
        factor_scores["relationship"] = (
            100.0 if ref_relationship == cand_relationship else 0.0
        )
    else:
        factor_scores["relationship"] = 50.0  # Neutral for unknown

    # Calculate weighted overall score
    overall_score = (
        factor_scores["weapon"] * weights.weapon
        + factor_scores["geographic"] * weights.geographic
        + factor_scores["victim_age"] * weights.victim_age
        + factor_scores["temporal"] * weights.temporal
        + factor_scores["victim_race"] * weights.victim_race
        + factor_scores["circumstance"] * weights.circumstance
        + factor_scores["relationship"] * weights.relationship
    )

    return overall_score, factor_scores


# =============================================================================
# MAIN SEARCH FUNCTION
# =============================================================================


def find_similar_cases(
    case_id: str,
    limit: int = 50,
    min_score: float = 30.0,
) -> List[SimilarCase]:
    """Find cases similar to the specified case.

    Queries the database for the reference case and compares it against
    candidates with the same victim sex (as per PRD requirements).

    Args:
        case_id: ID of the reference case (the 'id' column, not case_id)
        limit: Maximum number of similar cases to return
        min_score: Minimum similarity score threshold (0-100)

    Returns:
        List of similar cases sorted by similarity score (descending)

    Raises:
        ValueError: If the reference case is not found
    """
    config = SimilarityConfig(min_score=min_score, limit=limit)

    logger.info(f"Finding similar cases for case {case_id}")

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Get reference case
        cursor.execute(
            """
            SELECT id, state, year, month, vic_age, vic_sex, vic_race,
                   weapon, weapon_code, relationship, circumstance,
                   county_fips_code, latitude, longitude, solved
            FROM cases WHERE id = ?
            """,
            (case_id,),
        )
        ref_row = cursor.fetchone()

        if not ref_row:
            raise ValueError(f"Case not found: {case_id}")

        ref_case = dict(ref_row)
        vic_sex = ref_case.get("vic_sex")

        logger.debug(f"Reference case: {ref_case.get('id')}, vic_sex: {vic_sex}")

        # Get candidate cases (same victim sex, exclude reference case)
        # Limit to 50000 candidates for performance
        cursor.execute(
            """
            SELECT id, state, year, month, vic_age, vic_sex, vic_race,
                   weapon, weapon_code, relationship, circumstance,
                   county_fips_code, latitude, longitude, solved
            FROM cases
            WHERE vic_sex = ? AND id != ?
            LIMIT 50000
            """,
            (vic_sex, case_id),
        )

        similar_cases: List[SimilarCase] = []

        for row in cursor.fetchall():
            candidate = dict(row)
            score, factors = calculate_similarity(ref_case, candidate, config)

            if score >= min_score:
                similar_cases.append(
                    SimilarCase(
                        case_id=str(candidate["id"]),
                        similarity_score=round(score, 1),
                        matching_factors={k: round(v, 1) for k, v in factors.items()},
                        case_data=candidate,
                    )
                )

        # Sort by score descending and limit
        similar_cases.sort(key=lambda x: x.similarity_score, reverse=True)
        result = similar_cases[:limit]

        logger.info(
            f"Found {len(result)} similar cases for case {case_id} "
            f"(from {len(similar_cases)} candidates above threshold)"
        )

        return result
