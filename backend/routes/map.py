"""Map API routes for geographic visualization.

Provides endpoints for county-level aggregations and individual case points
for map visualization in the frontend.
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from models.map import MapCasesResponse, MapDataResponse
from services.map_service import get_case_points, get_county_aggregations

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/map", tags=["map"])


@router.get("/counties", response_model=MapDataResponse)
async def get_county_data(
    state: Optional[str] = Query(
        None, 
        description="Filter by state name (e.g., 'California')"
    ),
    year_start: Optional[int] = Query(
        None, 
        ge=1976, 
        le=2023, 
        description="Start year (inclusive)"
    ),
    year_end: Optional[int] = Query(
        None, 
        ge=1976, 
        le=2023, 
        description="End year (inclusive)"
    ),
    solved: Optional[bool] = Query(
        None, 
        description="Filter by solved status (true/false)"
    ),
    vic_sex: Optional[List[str]] = Query(
        None, 
        description="Filter by victim sex (Male, Female, Unknown)"
    ),
    vic_race: Optional[List[str]] = Query(
        None, 
        description="Filter by victim race"
    ),
    vic_age_min: Optional[int] = Query(
        None, 
        ge=0, 
        le=999, 
        description="Minimum victim age"
    ),
    vic_age_max: Optional[int] = Query(
        None, 
        ge=0, 
        le=999, 
        description="Maximum victim age"
    ),
    weapon: Optional[List[str]] = Query(
        None, 
        description="Filter by weapon type"
    ),
    relationship: Optional[List[str]] = Query(
        None, 
        description="Filter by victim-offender relationship"
    ),
    circumstance: Optional[List[str]] = Query(
        None, 
        description="Filter by circumstance/motive"
    ),
) -> MapDataResponse:
    """Get aggregated case data by county for map visualization.
    
    Returns county-level aggregations with case counts, solve rates,
    and geographic coordinates for choropleth/marker visualization.
    
    **Query Parameters:**
    - `state`: Filter by state name (case-insensitive)
    - `year_start`, `year_end`: Filter by year range
    - `solved`: Filter by solved status
    - `vic_sex`, `vic_race`: Filter by victim demographics
    - `vic_age_min`, `vic_age_max`: Filter by victim age range
    - `weapon`, `relationship`, `circumstance`: Filter by crime characteristics
    
    **Response:**
    - `counties`: List of county aggregations with coordinates
    - `bounds`: Geographic bounding box for auto-zoom
    - `total_cases`: Total cases across all counties
    - `total_counties`: Number of counties with data
    
    **Example:**
    ```
    GET /api/map/counties?state=California&year_start=2000&year_end=2020
    ```
    """
    logger.info(
        f"GET /api/map/counties - state={state}, years={year_start}-{year_end}, "
        f"solved={solved}"
    )
    
    try:
        result = get_county_aggregations(
            state=state,
            year_start=year_start,
            year_end=year_end,
            solved=solved,
            vic_sex=vic_sex,
            vic_race=vic_race,
            vic_age_min=vic_age_min,
            vic_age_max=vic_age_max,
            weapon=weapon,
            relationship=relationship,
            circumstance=circumstance,
        )
        
        logger.info(
            f"Returning {result.total_counties} counties with {result.total_cases} cases"
        )
        return result
        
    except Exception as e:
        logger.error(f"Error getting county data: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve county data: {str(e)}"
        )


@router.get("/cases", response_model=MapCasesResponse)
async def get_case_points_endpoint(
    state: Optional[str] = Query(
        None, 
        description="Filter by state name (e.g., 'California')"
    ),
    county: Optional[str] = Query(
        None, 
        description="Filter by county FIPS code (e.g., '06037')"
    ),
    year_start: Optional[int] = Query(
        None, 
        ge=1976, 
        le=2023, 
        description="Start year (inclusive)"
    ),
    year_end: Optional[int] = Query(
        None, 
        ge=1976, 
        le=2023, 
        description="End year (inclusive)"
    ),
    solved: Optional[bool] = Query(
        None, 
        description="Filter by solved status (true/false)"
    ),
    vic_sex: Optional[List[str]] = Query(
        None, 
        description="Filter by victim sex (Male, Female, Unknown)"
    ),
    vic_race: Optional[List[str]] = Query(
        None, 
        description="Filter by victim race"
    ),
    vic_age_min: Optional[int] = Query(
        None, 
        ge=0, 
        le=999, 
        description="Minimum victim age"
    ),
    vic_age_max: Optional[int] = Query(
        None, 
        ge=0, 
        le=999, 
        description="Maximum victim age"
    ),
    weapon: Optional[List[str]] = Query(
        None, 
        description="Filter by weapon type"
    ),
    relationship: Optional[List[str]] = Query(
        None, 
        description="Filter by victim-offender relationship"
    ),
    circumstance: Optional[List[str]] = Query(
        None, 
        description="Filter by circumstance/motive"
    ),
    limit: int = Query(
        default=1000, 
        ge=1, 
        le=5000, 
        description="Maximum number of cases to return"
    ),
) -> MapCasesResponse:
    """Get individual case points for map marker display.
    
    Returns individual cases with coordinates for marker display.
    Results are limited to prevent overwhelming the frontend.
    
    **Query Parameters:**
    - `state`: Filter by state name (case-insensitive)
    - `county`: Filter by county FIPS code
    - `year_start`, `year_end`: Filter by year range
    - `solved`: Filter by solved status
    - `vic_sex`, `vic_race`: Filter by victim demographics
    - `vic_age_min`, `vic_age_max`: Filter by victim age range
    - `weapon`, `relationship`, `circumstance`: Filter by crime characteristics
    - `limit`: Maximum cases to return (default 1000, max 5000)
    
    **Response:**
    - `cases`: List of case points with coordinates
    - `total`: Total matching cases (may exceed limit)
    - `limited`: Whether results were truncated
    
    **Example:**
    ```
    GET /api/map/cases?county=06037&limit=500
    ```
    """
    logger.info(
        f"GET /api/map/cases - state={state}, county={county}, "
        f"years={year_start}-{year_end}, limit={limit}"
    )
    
    try:
        result = get_case_points(
            state=state,
            county=county,
            year_start=year_start,
            year_end=year_end,
            solved=solved,
            vic_sex=vic_sex,
            vic_race=vic_race,
            vic_age_min=vic_age_min,
            vic_age_max=vic_age_max,
            weapon=weapon,
            relationship=relationship,
            circumstance=circumstance,
            limit=limit,
        )
        
        logger.info(
            f"Returning {len(result.cases)} case points (total: {result.total})"
        )
        return result
        
    except Exception as e:
        logger.error(f"Error getting case points: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve case points: {str(e)}"
        )