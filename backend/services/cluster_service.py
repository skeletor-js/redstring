"""Service layer for cluster analysis operations.

Bridges the clustering algorithm with the database, handling data retrieval,
analysis execution, result persistence, and export functionality.
"""

import json
import logging
import time
from typing import Dict, List, Optional

from analysis.clustering import (
    Case,
    ClusterConfig,
    ClusterResult,
    SimilarityWeights,
    detect_clusters,
)
from database.connection import get_db_connection
from models.case import CaseFilter
from models.cluster import (
    ClusterAnalysisRequest,
    ClusterAnalysisResponse,
    ClusterDetailResponse,
    ClusterSummaryResponse,
)

logger = logging.getLogger(__name__)


# =============================================================================
# CASE RETRIEVAL
# =============================================================================


def fetch_cases_for_clustering(case_filter: Optional[CaseFilter] = None) -> List[Case]:
    """Fetch cases from database for clustering analysis.

    Applies optional filter criteria and returns simplified Case objects
    with only the fields needed for similarity calculation.

    Args:
        case_filter: Optional filter criteria (CaseFilter model)

    Returns:
        List of Case objects ready for clustering

    Raises:
        sqlite3.OperationalError: If database query fails
    """
    logger.info("Fetching cases for clustering analysis")

    # Build SQL query with filters
    query = """
        SELECT
            id,
            state,
            county_fips_code,
            latitude,
            longitude,
            year,
            month,
            solved,
            weapon_code,
            weapon,
            vic_sex_code,
            vic_sex,
            vic_age,
            vic_race,
            off_age,
            off_sex,
            off_race,
            relationship,
            circumstance
        FROM cases
        WHERE 1=1
    """
    params = []

    # Apply filters if provided
    if case_filter:
        if case_filter.states:
            placeholders = ",".join("?" * len(case_filter.states))
            query += f" AND state IN ({placeholders})"
            params.extend(case_filter.states)

        if case_filter.year_min is not None:
            query += " AND year >= ?"
            params.append(case_filter.year_min)

        if case_filter.year_max is not None:
            query += " AND year <= ?"
            params.append(case_filter.year_max)

        if case_filter.solved is not None:
            query += " AND solved = ?"
            params.append(case_filter.solved)

        if case_filter.vic_sex:
            placeholders = ",".join("?" * len(case_filter.vic_sex))
            query += f" AND vic_sex IN ({placeholders})"
            params.extend(case_filter.vic_sex)

        if case_filter.vic_race:
            placeholders = ",".join("?" * len(case_filter.vic_race))
            query += f" AND vic_race IN ({placeholders})"
            params.extend(case_filter.vic_race)

        if case_filter.weapon:
            placeholders = ",".join("?" * len(case_filter.weapon))
            query += f" AND weapon IN ({placeholders})"
            params.extend(case_filter.weapon)

        if case_filter.county:
            placeholders = ",".join("?" * len(case_filter.county))
            query += f" AND cntyfips IN ({placeholders})"
            params.extend(case_filter.county)

        # Age range handling
        if case_filter.vic_age_min is not None or case_filter.vic_age_max is not None:
            if case_filter.include_unknown_age:
                # Include unknown ages (999) OR ages in range
                age_conditions = []
                if case_filter.vic_age_min is not None:
                    age_conditions.append("vic_age >= ?")
                    params.append(case_filter.vic_age_min)
                if case_filter.vic_age_max is not None:
                    age_conditions.append("vic_age <= ?")
                    params.append(case_filter.vic_age_max)

                if age_conditions:
                    query += f" AND (vic_age = 999 OR ({' AND '.join(age_conditions)}))"
            else:
                # Only include ages in range (exclude 999)
                if case_filter.vic_age_min is not None:
                    query += " AND vic_age >= ?"
                    params.append(case_filter.vic_age_min)
                if case_filter.vic_age_max is not None:
                    query += " AND vic_age <= ? AND vic_age != 999"
                    params.append(case_filter.vic_age_max)

    # Execute query
    with get_db_connection() as conn:
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()

    # Convert to Case objects
    cases = []
    for row in rows:
        case = Case(
            id=row["id"],
            state=row["state"],
            county_fips_code=row["county_fips_code"],
            latitude=row["latitude"],
            longitude=row["longitude"],
            year=row["year"],
            month=row["month"],
            solved=row["solved"],
            weapon_code=row["weapon_code"],
            weapon=row["weapon"],
            vic_sex_code=row["vic_sex_code"],
            vic_sex=row["vic_sex"],
            vic_age=row["vic_age"],
            vic_race=row["vic_race"],
            off_age=row["off_age"],
            off_sex=row["off_sex"],
            off_race=row["off_race"],
            relationship=row["relationship"],
            circumstance=row["circumstance"],
        )
        cases.append(case)

    logger.info(f"Fetched {len(cases)} cases for clustering")
    return cases


# =============================================================================
# CLUSTER ANALYSIS
# =============================================================================


def run_cluster_analysis(request: ClusterAnalysisRequest) -> ClusterAnalysisResponse:
    """Execute cluster analysis on filtered case set.

    Main entry point for cluster detection. Fetches cases, runs clustering
    algorithm, persists results to database, and returns response.

    Args:
        request: Cluster analysis configuration and filters

    Returns:
        ClusterAnalysisResponse with detected clusters and metadata

    Raises:
        ValueError: If analysis parameters are invalid
        sqlite3.OperationalError: If database operations fail
    """
    start_time = time.time()

    # Parse filter if provided
    case_filter = None
    if request.filter:
        case_filter = CaseFilter(**request.filter)

    # Fetch cases
    cases = fetch_cases_for_clustering(case_filter)

    if len(cases) == 0:
        logger.warning("No cases found matching filter criteria")
        return ClusterAnalysisResponse(
            clusters=[],
            total_clusters=0,
            total_cases_analyzed=0,
            analysis_time_seconds=round(time.time() - start_time, 2),
            config=request.model_dump(),
        )

    # Build clustering configuration
    weights = SimilarityWeights()
    if request.weights:
        weights = SimilarityWeights(
            geographic=request.weights.geographic,
            weapon=request.weights.weapon,
            victim_sex=request.weights.victim_sex,
            victim_age=request.weights.victim_age,
            temporal=request.weights.temporal,
            victim_race=request.weights.victim_race,
        )

    config = ClusterConfig(
        min_cluster_size=request.min_cluster_size,
        max_solve_rate=request.max_solve_rate,
        similarity_threshold=request.similarity_threshold,
        weights=weights,
    )

    # Run clustering algorithm
    logger.info(f"Running cluster analysis on {len(cases)} cases")
    clusters = detect_clusters(cases, config)

    # Persist results to database
    persist_cluster_results(clusters, config)

    # Build response
    cluster_summaries = [
        ClusterSummaryResponse(
            cluster_id=c.cluster_id,
            location_description=c.location_description,
            total_cases=c.total_cases,
            solved_cases=c.solved_cases,
            unsolved_cases=c.unsolved_cases,
            solve_rate=c.solve_rate,
            avg_similarity_score=c.avg_similarity_score,
            first_year=c.first_year,
            last_year=c.last_year,
            primary_weapon=c.primary_weapon,
            primary_victim_sex=c.primary_victim_sex,
            avg_victim_age=c.avg_victim_age,
        )
        for c in clusters
    ]

    analysis_time = round(time.time() - start_time, 2)
    logger.info(
        f"Cluster analysis complete: {len(clusters)} clusters detected in {analysis_time}s"
    )

    return ClusterAnalysisResponse(
        clusters=cluster_summaries,
        total_clusters=len(clusters),
        total_cases_analyzed=len(cases),
        analysis_time_seconds=analysis_time,
        config=request.model_dump(),
    )


# =============================================================================
# RESULT PERSISTENCE
# =============================================================================


def persist_cluster_results(
    clusters: List[ClusterResult], config: ClusterConfig
) -> None:
    """Persist cluster analysis results to database.

    Stores cluster summaries and case memberships for later retrieval.
    Results are session-ephemeral by default (not tied to saved_analyses).

    Args:
        clusters: List of detected clusters
        config: Configuration used for analysis

    Raises:
        sqlite3.OperationalError: If database write fails
    """
    logger.info(f"Persisting {len(clusters)} cluster results to database")

    with get_db_connection() as conn:
        for cluster in clusters:
            # Insert cluster summary
            conn.execute(
                """
                INSERT OR REPLACE INTO cluster_results (
                    cluster_id,
                    geographic_mode,
                    config_json,
                    location_description,
                    total_cases,
                    solved_cases,
                    unsolved_cases,
                    solve_rate,
                    avg_similarity_score,
                    first_year,
                    last_year,
                    primary_weapon,
                    primary_victim_sex,
                    avg_victim_age
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    cluster.cluster_id,
                    "county",  # MVP Phase 1 only supports county-based
                    json.dumps(
                        {
                            "min_cluster_size": config.min_cluster_size,
                            "max_solve_rate": config.max_solve_rate,
                            "similarity_threshold": config.similarity_threshold,
                            "weights": {
                                "geographic": config.weights.geographic,
                                "weapon": config.weights.weapon,
                                "victim_sex": config.weights.victim_sex,
                                "victim_age": config.weights.victim_age,
                                "temporal": config.weights.temporal,
                                "victim_race": config.weights.victim_race,
                            },
                        }
                    ),
                    cluster.location_description,
                    cluster.total_cases,
                    cluster.solved_cases,
                    cluster.unsolved_cases,
                    cluster.solve_rate,
                    cluster.avg_similarity_score,
                    cluster.first_year,
                    cluster.last_year,
                    cluster.primary_weapon,
                    cluster.primary_victim_sex,
                    cluster.avg_victim_age,
                ),
            )

            # Insert case memberships
            for case in cluster.cases:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO cluster_membership (
                        cluster_id,
                        case_id,
                        similarity_score
                    ) VALUES (?, ?, ?)
                    """,
                    (
                        cluster.cluster_id,
                        case.id,
                        cluster.avg_similarity_score,  # Use cluster average for now
                    ),
                )

    logger.info("Cluster results persisted successfully")


def get_cluster_detail(cluster_id: str) -> Optional[ClusterDetailResponse]:
    """Retrieve detailed information for a specific cluster.

    Args:
        cluster_id: Unique cluster identifier

    Returns:
        ClusterDetailResponse or None if not found

    Raises:
        sqlite3.OperationalError: If database query fails
    """
    logger.info(f"Fetching cluster detail for {cluster_id}")

    with get_db_connection() as conn:
        # Get cluster summary
        cluster_row = conn.execute(
            """
            SELECT * FROM cluster_results
            WHERE cluster_id = ?
            """,
            (cluster_id,),
        ).fetchone()

        if not cluster_row:
            logger.warning(f"Cluster {cluster_id} not found")
            return None

        # Get case IDs in cluster
        case_rows = conn.execute(
            """
            SELECT case_id FROM cluster_membership
            WHERE cluster_id = ?
            """,
            (cluster_id,),
        ).fetchall()

        case_ids = [row["case_id"] for row in case_rows]

    return ClusterDetailResponse(
        cluster_id=cluster_row["cluster_id"],
        location_description=cluster_row["location_description"],
        total_cases=cluster_row["total_cases"],
        solved_cases=cluster_row["solved_cases"],
        unsolved_cases=cluster_row["unsolved_cases"],
        solve_rate=cluster_row["solve_rate"],
        avg_similarity_score=cluster_row["avg_similarity_score"],
        first_year=cluster_row["first_year"],
        last_year=cluster_row["last_year"],
        primary_weapon=cluster_row["primary_weapon"],
        primary_victim_sex=cluster_row["primary_victim_sex"],
        avg_victim_age=cluster_row["avg_victim_age"],
        case_ids=case_ids,
    )


def get_cluster_cases(cluster_id: str) -> List[Dict]:
    """Retrieve full case details for all cases in a cluster.

    Args:
        cluster_id: Unique cluster identifier

    Returns:
        List of case dictionaries (all fields)

    Raises:
        sqlite3.OperationalError: If database query fails
    """
    logger.info(f"Fetching cases for cluster {cluster_id}")

    with get_db_connection() as conn:
        # Get case IDs in cluster
        case_ids = [
            row["case_id"]
            for row in conn.execute(
                "SELECT case_id FROM cluster_membership WHERE cluster_id = ?",
                (cluster_id,),
            ).fetchall()
        ]

        if not case_ids:
            return []

        # Fetch full case details
        placeholders = ",".join("?" * len(case_ids))
        cases = conn.execute(
            f"SELECT * FROM cases WHERE id IN ({placeholders})",
            case_ids,
        ).fetchall()

    return [dict(row) for row in cases]
