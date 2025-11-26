"""Pydantic models for cluster analysis requests and responses.

Defines request/response models for the clustering API, including
configuration, results, and cluster details.
"""

from typing import List, Optional

from pydantic import BaseModel, Field


# =============================================================================
# REQUEST MODELS
# =============================================================================


class SimilarityWeightsRequest(BaseModel):
    """Weight configuration for similarity scoring.

    All weights should sum to 100.0 for proper normalization.
    Default values match PRD specifications (Section 6.3.2).
    """

    geographic: float = Field(
        35.0, ge=0, le=100, description="Geographic proximity weight (default 35%)"
    )
    weapon: float = Field(25.0, ge=0, le=100, description="Weapon match weight (default 25%)")
    victim_sex: float = Field(
        20.0, ge=0, le=100, description="Victim sex match weight (default 20%)"
    )
    victim_age: float = Field(
        10.0, ge=0, le=100, description="Victim age proximity weight (default 10%)"
    )
    temporal: float = Field(
        7.0, ge=0, le=100, description="Temporal proximity weight (default 7%)"
    )
    victim_race: float = Field(
        3.0, ge=0, le=100, description="Victim race match weight (default 3%)"
    )


class ClusterAnalysisRequest(BaseModel):
    """Request model for cluster analysis.

    Includes both filter criteria (to select cases for analysis) and
    clustering configuration (similarity thresholds, weights, etc.).

    Example:
        {
            "min_cluster_size": 5,
            "max_solve_rate": 33.0,
            "similarity_threshold": 70.0,
            "weights": {
                "geographic": 35.0,
                "weapon": 25.0,
                "victim_sex": 20.0,
                "victim_age": 10.0,
                "temporal": 7.0,
                "victim_race": 3.0
            },
            "filter": {
                "states": ["ILLINOIS"],
                "year_min": 1990,
                "year_max": 2020,
                "solved": 0
            }
        }
    """

    # Clustering configuration
    min_cluster_size: int = Field(
        5,
        ge=3,
        le=100,
        description="Minimum number of cases required to form a cluster",
    )
    max_solve_rate: float = Field(
        33.0,
        ge=0,
        le=100,
        description="Maximum solve rate (%) for suspicious clusters",
    )
    similarity_threshold: float = Field(
        70.0,
        ge=0,
        le=100,
        description="Minimum similarity score for cases to be clustered together",
    )
    weights: Optional[SimilarityWeightsRequest] = Field(
        None, description="Custom similarity weights (defaults if not provided)"
    )

    # Optional filter criteria (from CaseFilter model)
    # If provided, only analyze cases matching these filters
    filter: Optional[dict] = Field(
        None, description="Filter criteria for case selection (CaseFilter format)"
    )


# =============================================================================
# RESPONSE MODELS
# =============================================================================


class ClusterSummaryResponse(BaseModel):
    """Summary information for a single cluster.

    Returned in list views and analysis results. Does not include full case details.
    """

    cluster_id: str = Field(description="Unique cluster identifier")
    location_description: str = Field(
        description="Human-readable location (e.g., 'ILLINOIS - County 17031')"
    )
    total_cases: int = Field(description="Total number of cases in cluster")
    solved_cases: int = Field(description="Number of solved cases")
    unsolved_cases: int = Field(description="Number of unsolved cases")
    solve_rate: float = Field(
        description="Percentage of cases solved (0-100)", ge=0, le=100
    )
    avg_similarity_score: float = Field(
        description="Average pairwise similarity score", ge=0, le=100
    )
    first_year: int = Field(description="Earliest case year in cluster")
    last_year: int = Field(description="Latest case year in cluster")
    primary_weapon: str = Field(description="Most common weapon type in cluster")
    primary_victim_sex: str = Field(description="Most common victim sex in cluster")
    avg_victim_age: float = Field(description="Average victim age (excluding unknown)")


class ClusterAnalysisResponse(BaseModel):
    """Response for cluster analysis request.

    Contains list of detected clusters and analysis metadata.

    Example:
        {
            "clusters": [...],
            "total_clusters": 42,
            "total_cases_analyzed": 15234,
            "analysis_time_seconds": 3.2,
            "config": {...}
        }
    """

    clusters: List[ClusterSummaryResponse] = Field(
        description="Detected clusters, sorted by unsolved count (descending)"
    )
    total_clusters: int = Field(description="Number of clusters detected")
    total_cases_analyzed: int = Field(
        description="Total number of cases included in analysis"
    )
    analysis_time_seconds: float = Field(
        description="Time taken to complete analysis"
    )
    config: dict = Field(description="Configuration used for analysis")


class ClusterDetailResponse(BaseModel):
    """Detailed information for a single cluster.

    Includes full case list and all cluster statistics.
    """

    cluster_id: str
    location_description: str
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
    case_ids: List[str] = Field(
        description="List of case IDs in this cluster (for fetching full case details)"
    )


class ClusterExportFormat(BaseModel):
    """Export configuration for cluster results."""

    include_case_details: bool = Field(
        True, description="Include full case details in export"
    )
    format: str = Field(
        "csv", description="Export format (currently only 'csv' supported)"
    )
