"""Clustering algorithm for identifying suspicious patterns in homicide data.

Implements a custom multi-factor similarity scoring algorithm that groups cases
by geographic proximity and detects clusters with high similarity scores and
low solve rates.
"""

import logging
from collections import defaultdict
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from utils.geo import calculate_geographic_score, get_county_key

logger = logging.getLogger(__name__)


# =============================================================================
# DATA CLASSES
# =============================================================================


@dataclass
class Case:
    """Simplified case data for clustering analysis.

    Contains only the fields needed for similarity calculation and clustering.
    """

    id: str
    state: str
    county_fips_code: Optional[int]
    latitude: Optional[float]
    longitude: Optional[float]
    year: int
    month: int
    solved: int
    weapon_code: int
    weapon: str
    vic_sex_code: int
    vic_sex: str
    vic_age: int
    vic_race: str
    off_age: int
    off_sex: str
    off_race: str
    relationship: str
    circumstance: str


@dataclass
class SimilarityWeights:
    """Weight configuration for similarity scoring.

    Default weights based on PRD specifications (Section 6.3.2):
    - Geographic: 35%
    - Weapon: 25%
    - Victim sex: 20%
    - Victim age: 10%
    - Temporal: 7%
    - Victim race: 3%
    """

    geographic: float = 35.0
    weapon: float = 25.0
    victim_sex: float = 20.0
    victim_age: float = 10.0
    temporal: float = 7.0
    victim_race: float = 3.0

    def total(self) -> float:
        """Calculate total weight (should be 100.0)."""
        return (
            self.geographic
            + self.weapon
            + self.victim_sex
            + self.victim_age
            + self.temporal
            + self.victim_race
        )


@dataclass
class ClusterConfig:
    """Configuration for cluster detection.

    Default values based on PRD Phase 1 specifications.
    """

    min_cluster_size: int = 5
    max_solve_rate: float = 33.0
    similarity_threshold: float = 70.0
    weights: SimilarityWeights = None

    def __post_init__(self):
        if self.weights is None:
            self.weights = SimilarityWeights()


@dataclass
class ClusterResult:
    """Result of cluster analysis."""

    cluster_id: str
    location_description: str
    cases: List[Case]
    total_cases: int
    solved_cases: int
    unsolved_cases: int
    solve_rate: float
    avg_similarity_score: float
    first_year: int
    last_year: int
    primary_weapon: str
    primary_victim_sex: str
    avg_victim_age: float


# =============================================================================
# WEAPON CATEGORIES (for partial matches)
# =============================================================================

WEAPON_CATEGORIES = {
    # Firearms (codes 11-15)
    "firearm": [11, 12, 13, 14, 15],
    # Bladed weapons (codes 20-21)
    "blade": [20, 21],
    # Blunt objects (codes 30-31)
    "blunt": [30, 31],
    # Personal weapons (codes 40-41)
    "personal": [40, 41],
    # Other (codes 50, 60, 65, 70, 80, 90, 99)
    "other": [50, 60, 65, 70, 80, 90, 99],
}


def get_weapon_category(weapon_code: int) -> Optional[str]:
    """Get the weapon category for a given weapon code.

    Args:
        weapon_code: Numeric weapon code (11-99)

    Returns:
        Category name or None if unknown
    """
    for category, codes in WEAPON_CATEGORIES.items():
        if weapon_code in codes:
            return category
    return None


# =============================================================================
# SIMILARITY CALCULATION
# =============================================================================


def calculate_similarity(
    case1: Case, case2: Case, weights: SimilarityWeights
) -> Tuple[float, Dict[str, float]]:
    """Calculate weighted similarity score between two cases.

    Returns a score from 0-100 based on multiple factors including geographic
    proximity, weapon type, victim demographics, and temporal proximity.

    Args:
        case1: First case
        case2: Second case
        weights: Weight configuration for scoring

    Returns:
        Tuple of (total_score, factor_scores_dict)

    Example:
        >>> score, factors = calculate_similarity(case1, case2, weights)
        >>> print(f"Total: {score}, Geographic: {factors['geographic']}")
        Total: 85.3, Geographic: 100.0
    """
    scores: Dict[str, float] = {}

    # Geographic similarity (35% default)
    scores["geographic"] = calculate_geographic_score(
        case1.county_fips_code,
        case1.latitude,
        case1.longitude,
        case2.county_fips_code,
        case2.latitude,
        case2.longitude,
    )

    # Weapon similarity (25% default)
    if case1.weapon_code == case2.weapon_code:
        scores["weapon"] = 100.0
    elif get_weapon_category(case1.weapon_code) == get_weapon_category(
        case2.weapon_code
    ):
        # Same weapon category (e.g., both firearms) = 70%
        scores["weapon"] = 70.0
    else:
        scores["weapon"] = 0.0

    # Victim sex similarity (20% default)
    if case1.vic_sex_code == case2.vic_sex_code:
        scores["victim_sex"] = 100.0
    else:
        scores["victim_sex"] = 0.0

    # Victim age similarity (10% default)
    # Exclude unknown ages (999) from scoring
    if case1.vic_age == 999 or case2.vic_age == 999:
        scores["victim_age"] = 0.0
    else:
        age_diff = abs(case1.vic_age - case2.vic_age)
        # 5-point penalty per year of difference (max 20 years = 0 score)
        scores["victim_age"] = max(0.0, 100.0 - (age_diff * 5.0))

    # Temporal similarity (7% default)
    year_diff = abs(case1.year - case2.year)
    # 10-point penalty per year (max 10 years = 0 score)
    scores["temporal"] = max(0.0, 100.0 - (year_diff * 10.0))

    # Victim race similarity (3% default)
    if case1.vic_race == case2.vic_race:
        scores["victim_race"] = 100.0
    else:
        scores["victim_race"] = 0.0

    # Calculate weighted total
    total_weight = weights.total()
    total_score = (
        scores["geographic"] * weights.geographic
        + scores["weapon"] * weights.weapon
        + scores["victim_sex"] * weights.victim_sex
        + scores["victim_age"] * weights.victim_age
        + scores["temporal"] * weights.temporal
        + scores["victim_race"] * weights.victim_race
    ) / total_weight

    return round(total_score, 1), scores


# =============================================================================
# CLUSTER DETECTION
# =============================================================================


def detect_clusters(
    cases: List[Case], config: ClusterConfig
) -> List[ClusterResult]:
    """Detect suspicious clusters in a set of cases.

    Groups cases by county, calculates pairwise similarities within each group,
    identifies clusters that meet similarity and solve rate thresholds, and
    ranks them by unsolved case count.

    Args:
        cases: List of cases to analyze
        config: Configuration for cluster detection

    Returns:
        List of cluster results, sorted by unsolved count (descending)

    Algorithm:
        1. Group cases by county (state:county_fips)
        2. For each county group with >= min_cluster_size cases:
           a. Calculate pairwise similarities for all cases
           b. Identify highly similar case pairs (>= similarity_threshold)
           c. Group connected cases into clusters
           d. Calculate cluster statistics (solve rate, avg similarity)
           e. Filter clusters by solve rate (<= max_solve_rate)
        3. Sort clusters by unsolved count (descending)
        4. Return top clusters
    """
    logger.info(f"Detecting clusters in {len(cases)} cases with config: {config}")

    # Group cases by county
    county_groups: Dict[str, List[Case]] = defaultdict(list)
    for case in cases:
        county_key = get_county_key(case.county_fips_code, case.state)
        county_groups[county_key].append(case)

    logger.info(f"Grouped cases into {len(county_groups)} county groups")

    all_clusters: List[ClusterResult] = []

    # Process each county group
    for county_key, county_cases in county_groups.items():
        # Skip groups smaller than minimum cluster size
        if len(county_cases) < config.min_cluster_size:
            continue

        # Calculate pairwise similarities
        similar_pairs: List[Tuple[Case, Case, float]] = []

        for i in range(len(county_cases)):
            for j in range(i + 1, len(county_cases)):
                case1 = county_cases[i]
                case2 = county_cases[j]

                similarity, _ = calculate_similarity(case1, case2, config.weights)

                if similarity >= config.similarity_threshold:
                    similar_pairs.append((case1, case2, similarity))

        # If no similar pairs found, skip this county
        if not similar_pairs:
            continue

        # Build adjacency list for connected components
        adjacency: Dict[str, List[Tuple[str, float]]] = defaultdict(list)
        for case1, case2, similarity in similar_pairs:
            adjacency[case1.id].append((case2.id, similarity))
            adjacency[case2.id].append((case1.id, similarity))

        # Find connected components using DFS
        visited = set()
        case_by_id = {case.id: case for case in county_cases}
        clusters_in_county = []

        for case_id in adjacency:
            if case_id in visited:
                continue

            # DFS to find all connected cases
            cluster_case_ids = []
            cluster_similarities = []
            stack = [case_id]

            while stack:
                current_id = stack.pop()
                if current_id in visited:
                    continue

                visited.add(current_id)
                cluster_case_ids.append(current_id)

                # Add neighbors to stack
                for neighbor_id, similarity in adjacency[current_id]:
                    if neighbor_id not in visited:
                        stack.append(neighbor_id)
                        cluster_similarities.append(similarity)

            # Create cluster if meets minimum size
            if len(cluster_case_ids) >= config.min_cluster_size:
                cluster_cases = [case_by_id[cid] for cid in cluster_case_ids]
                cluster = _build_cluster_result(
                    county_key, cluster_cases, cluster_similarities
                )

                # Filter by solve rate
                if cluster.solve_rate <= config.max_solve_rate:
                    clusters_in_county.append(cluster)

        all_clusters.extend(clusters_in_county)

    # Sort by unsolved count (descending)
    all_clusters.sort(key=lambda c: c.unsolved_cases, reverse=True)

    logger.info(f"Detected {len(all_clusters)} clusters meeting criteria")
    return all_clusters


def _build_cluster_result(
    county_key: str, cases: List[Case], similarities: List[float]
) -> ClusterResult:
    """Build a ClusterResult from a set of similar cases.

    Args:
        county_key: County identifier (state:fips)
        cases: List of cases in the cluster
        similarities: List of pairwise similarity scores

    Returns:
        ClusterResult with calculated statistics
    """
    # Generate cluster ID (format: state_fips_timestamp)
    import time

    timestamp = int(time.time() * 1000)
    cluster_id = f"{county_key.replace(':', '_')}_{timestamp}"

    # Calculate statistics
    total_cases = len(cases)
    solved_cases = sum(1 for case in cases if case.solved == 1)
    unsolved_cases = total_cases - solved_cases
    solve_rate = round((solved_cases / total_cases) * 100, 1) if total_cases > 0 else 0.0
    avg_similarity = round(sum(similarities) / len(similarities), 1) if similarities else 0.0

    # Temporal range
    years = [case.year for case in cases]
    first_year = min(years)
    last_year = max(years)

    # Primary weapon (most common)
    weapon_counts: Dict[str, int] = defaultdict(int)
    for case in cases:
        weapon_counts[case.weapon] += 1
    primary_weapon = max(weapon_counts.items(), key=lambda x: x[1])[0]

    # Primary victim sex (most common)
    vic_sex_counts: Dict[str, int] = defaultdict(int)
    for case in cases:
        vic_sex_counts[case.vic_sex] += 1
    primary_victim_sex = max(vic_sex_counts.items(), key=lambda x: x[1])[0]

    # Average victim age (excluding unknown)
    valid_ages = [case.vic_age for case in cases if case.vic_age != 999]
    avg_victim_age = round(sum(valid_ages) / len(valid_ages), 1) if valid_ages else 0.0

    # Location description
    state = county_key.split(":")[0]
    location_description = f"{state} - County {county_key.split(':')[1]}"

    return ClusterResult(
        cluster_id=cluster_id,
        location_description=location_description,
        cases=cases,
        total_cases=total_cases,
        solved_cases=solved_cases,
        unsolved_cases=unsolved_cases,
        solve_rate=solve_rate,
        avg_similarity_score=avg_similarity,
        first_year=first_year,
        last_year=last_year,
        primary_weapon=primary_weapon,
        primary_victim_sex=primary_victim_sex,
        avg_victim_age=avg_victim_age,
    )
