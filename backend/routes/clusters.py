"""API routes for cluster analysis operations.

Provides endpoints for running cluster analysis, retrieving cluster details,
fetching cases within clusters, and exporting results.
"""

import csv
import io
import logging
from typing import List

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.cluster import (
    ClusterAnalysisRequest,
    ClusterAnalysisResponse,
    ClusterDetailResponse,
)
from services.cluster_service import (
    get_cluster_cases,
    get_cluster_detail,
    run_cluster_analysis,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/clusters", tags=["clusters"])


# =============================================================================
# CLUSTER ANALYSIS
# =============================================================================


@router.post("/analyze", response_model=ClusterAnalysisResponse)
async def analyze_clusters(request: ClusterAnalysisRequest) -> ClusterAnalysisResponse:
    """Run cluster analysis on filtered case set.

    Executes the custom clustering algorithm to identify suspicious patterns
    in homicide cases. Groups cases by geographic proximity and detects
    clusters with high similarity and low solve rates.

    **Request Body:**
    ```json
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
    ```

    **Response:**
    - `clusters`: List of detected clusters (sorted by unsolved count)
    - `total_clusters`: Number of clusters found
    - `total_cases_analyzed`: Number of cases included in analysis
    - `analysis_time_seconds`: Execution time

    **Performance:**
    - Target: < 5 seconds for full dataset
    - Actual time varies by filter scope and cluster count

    Args:
        request: Cluster analysis configuration

    Returns:
        ClusterAnalysisResponse with detected clusters

    Raises:
        HTTPException: If analysis fails (500)
    """
    try:
        logger.info(f"POST /api/clusters/analyze - config: {request.model_dump()}")
        result = run_cluster_analysis(request)
        logger.info(
            f"Analysis complete: {result.total_clusters} clusters, {result.analysis_time_seconds}s"
        )
        return result

    except Exception as e:
        logger.error(f"Cluster analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Cluster analysis failed: {str(e)}"
        )


# =============================================================================
# CLUSTER DETAILS
# =============================================================================


@router.get("/{cluster_id}", response_model=ClusterDetailResponse)
async def get_cluster(cluster_id: str) -> ClusterDetailResponse:
    """Get detailed information for a specific cluster.

    Returns cluster statistics and list of case IDs. Use `/api/clusters/{cluster_id}/cases`
    to retrieve full case details.

    **Path Parameters:**
    - `cluster_id`: Unique cluster identifier (format: STATE_FIPS_TIMESTAMP)

    **Response:**
    ```json
    {
        "cluster_id": "ILLINOIS_17031_1701234567890",
        "location_description": "ILLINOIS - County 17031",
        "total_cases": 12,
        "solved_cases": 2,
        "unsolved_cases": 10,
        "solve_rate": 16.7,
        "avg_similarity_score": 82.3,
        "first_year": 1995,
        "last_year": 2005,
        "primary_weapon": "Handgun - pistol, revolver, etc",
        "primary_victim_sex": "Female",
        "avg_victim_age": 28.5,
        "case_ids": ["IL-12345-95", "IL-12346-96", ...]
    }
    ```

    Args:
        cluster_id: Unique cluster identifier

    Returns:
        ClusterDetailResponse with cluster statistics and case IDs

    Raises:
        HTTPException: If cluster not found (404)
    """
    try:
        logger.info(f"GET /api/clusters/{cluster_id}")
        cluster = get_cluster_detail(cluster_id)

        if cluster is None:
            raise HTTPException(
                status_code=404, detail=f"Cluster {cluster_id} not found"
            )

        return cluster

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching cluster {cluster_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Error fetching cluster: {str(e)}"
        )


@router.get("/{cluster_id}/cases")
async def get_cluster_cases_endpoint(cluster_id: str) -> List[dict]:
    """Get full case details for all cases in a cluster.

    Returns complete case information (all 37 fields) for every case
    in the specified cluster.

    **Path Parameters:**
    - `cluster_id`: Unique cluster identifier

    **Response:**
    ```json
    [
        {
            "id": "IL-12345-95",
            "state": "ILLINOIS",
            "year": 1995,
            "solved": 0,
            "vic_sex": "Female",
            "weapon": "Handgun - pistol, revolver, etc",
            ... (all case fields)
        },
        ...
    ]
    ```

    Args:
        cluster_id: Unique cluster identifier

    Returns:
        List of case dictionaries (all fields)

    Raises:
        HTTPException: If cluster not found (404) or query fails (500)
    """
    try:
        logger.info(f"GET /api/clusters/{cluster_id}/cases")
        cases = get_cluster_cases(cluster_id)

        if not cases:
            raise HTTPException(
                status_code=404,
                detail=f"Cluster {cluster_id} not found or has no cases",
            )

        logger.info(f"Returning {len(cases)} cases for cluster {cluster_id}")
        return cases

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error fetching cases for cluster {cluster_id}: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=500, detail=f"Error fetching cluster cases: {str(e)}"
        )


# =============================================================================
# EXPORT
# =============================================================================


@router.get("/{cluster_id}/export")
async def export_cluster_cases(cluster_id: str):
    """Export all cases in a cluster to CSV.

    Downloads a CSV file containing all case fields for every case
    in the specified cluster. Useful for external analysis or reporting.

    **Path Parameters:**
    - `cluster_id`: Unique cluster identifier

    **Response:**
    - Content-Type: text/csv
    - Content-Disposition: attachment; filename="cluster_{cluster_id}_cases.csv"

    **CSV Format:**
    - Header row with all 37 case field names
    - One row per case
    - Proper CSV escaping for special characters

    Args:
        cluster_id: Unique cluster identifier

    Returns:
        StreamingResponse with CSV file

    Raises:
        HTTPException: If cluster not found (404) or export fails (500)
    """
    try:
        logger.info(f"GET /api/clusters/{cluster_id}/export")

        # Fetch cases
        cases = get_cluster_cases(cluster_id)

        if not cases:
            raise HTTPException(
                status_code=404,
                detail=f"Cluster {cluster_id} not found or has no cases",
            )

        # Generate CSV
        output = io.StringIO()
        if cases:
            fieldnames = list(cases[0].keys())
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(cases)

        # Create streaming response
        output.seek(0)
        response = StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=cluster_{cluster_id}_cases.csv"
            },
        )

        logger.info(f"Exported {len(cases)} cases for cluster {cluster_id}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error exporting cluster {cluster_id}: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=500, detail=f"Error exporting cluster: {str(e)}"
        )
