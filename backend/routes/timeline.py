"""Timeline API routes for temporal visualization.

Provides endpoints for timeline data aggregation and trend analysis
with support for various time granularities and filters.
"""

import logging
from typing import Literal, Optional

from fastapi import APIRouter, Query

from models.timeline import TimelineDataResponse, TimelineTrendResponse
from services.timeline_service import get_timeline_data, get_timeline_trends

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/timeline", tags=["timeline"])


@router.get("/data", response_model=TimelineDataResponse)
async def timeline_data(
    granularity: Literal["year", "month", "decade"] = Query(
        default="year",
        description="Time aggregation granularity"
    ),
    state: Optional[str] = Query(
        default=None,
        description="Filter by state name"
    ),
    county: Optional[str] = Query(
        default=None,
        description="Filter by county FIPS code"
    ),
    year_start: Optional[int] = Query(
        default=None,
        ge=1965,
        le=2030,
        description="Start year (inclusive)"
    ),
    year_end: Optional[int] = Query(
        default=None,
        ge=1965,
        le=2030,
        description="End year (inclusive)"
    ),
    solved: Optional[bool] = Query(
        default=None,
        description="Filter by solved status"
    ),
    victim_sex: Optional[str] = Query(
        default=None,
        description="Filter by victim sex"
    ),
    victim_race: Optional[str] = Query(
        default=None,
        description="Filter by victim race"
    ),
    victim_age_min: Optional[int] = Query(
        default=None,
        ge=0,
        le=999,
        description="Minimum victim age"
    ),
    victim_age_max: Optional[int] = Query(
        default=None,
        ge=0,
        le=999,
        description="Maximum victim age"
    ),
    weapon: Optional[str] = Query(
        default=None,
        description="Filter by weapon type"
    ),
    relationship: Optional[str] = Query(
        default=None,
        description="Filter by relationship"
    ),
    circumstance: Optional[str] = Query(
        default=None,
        description="Filter by circumstance"
    ),
) -> TimelineDataResponse:
    """Get aggregated case data by time period for timeline visualization.
    
    Aggregates cases by the specified time granularity (year, month, or decade),
    calculating total cases, solved/unsolved counts, and solve rates.
    
    Args:
        granularity: Time aggregation level ("year", "month", or "decade")
        state: Filter by state name
        county: Filter by county FIPS code
        year_start: Filter by start year (inclusive)
        year_end: Filter by end year (inclusive)
        solved: Filter by solved status
        victim_sex: Filter by victim sex
        victim_race: Filter by victim race
        victim_age_min: Filter by minimum victim age
        victim_age_max: Filter by maximum victim age
        weapon: Filter by weapon type
        relationship: Filter by relationship
        circumstance: Filter by circumstance
        
    Returns:
        TimelineDataResponse with aggregated data points and metadata
        
    Example:
        GET /api/timeline/data?granularity=year&state=California&year_start=2000
    """
    logger.info(
        f"Timeline data request: granularity={granularity}, "
        f"state={state}, year_start={year_start}, year_end={year_end}"
    )
    
    return get_timeline_data(
        granularity=granularity,
        state=state,
        county=county,
        year_start=year_start,
        year_end=year_end,
        solved=solved,
        victim_sex=victim_sex,
        victim_race=victim_race,
        victim_age_min=victim_age_min,
        victim_age_max=victim_age_max,
        weapon=weapon,
        relationship=relationship,
        circumstance=circumstance,
    )


@router.get("/trends", response_model=TimelineTrendResponse)
async def timeline_trends(
    metric: Literal["solve_rate", "total_cases", "unsolved_cases", "solved_cases"] = Query(
        default="solve_rate",
        description="Metric to analyze"
    ),
    granularity: Literal["year", "month", "decade"] = Query(
        default="year",
        description="Time aggregation granularity"
    ),
    moving_average_window: int = Query(
        default=3,
        ge=2,
        le=10,
        description="Window size for moving average calculation"
    ),
    state: Optional[str] = Query(
        default=None,
        description="Filter by state name"
    ),
    county: Optional[str] = Query(
        default=None,
        description="Filter by county FIPS code"
    ),
    year_start: Optional[int] = Query(
        default=None,
        ge=1965,
        le=2030,
        description="Start year (inclusive)"
    ),
    year_end: Optional[int] = Query(
        default=None,
        ge=1965,
        le=2030,
        description="End year (inclusive)"
    ),
    solved: Optional[bool] = Query(
        default=None,
        description="Filter by solved status"
    ),
    victim_sex: Optional[str] = Query(
        default=None,
        description="Filter by victim sex"
    ),
    victim_race: Optional[str] = Query(
        default=None,
        description="Filter by victim race"
    ),
    victim_age_min: Optional[int] = Query(
        default=None,
        ge=0,
        le=999,
        description="Minimum victim age"
    ),
    victim_age_max: Optional[int] = Query(
        default=None,
        ge=0,
        le=999,
        description="Maximum victim age"
    ),
    weapon: Optional[str] = Query(
        default=None,
        description="Filter by weapon type"
    ),
    relationship: Optional[str] = Query(
        default=None,
        description="Filter by relationship"
    ),
    circumstance: Optional[str] = Query(
        default=None,
        description="Filter by circumstance"
    ),
) -> TimelineTrendResponse:
    """Get trend analysis data with moving averages.
    
    Calculates trends for the specified metric over time, including
    moving averages for smoothing. Useful for identifying patterns
    and long-term trends in the data.
    
    Args:
        metric: Metric to analyze ("solve_rate", "total_cases", "unsolved_cases", "solved_cases")
        granularity: Time aggregation level ("year", "month", or "decade")
        moving_average_window: Window size for moving average (2-10)
        state: Filter by state name
        county: Filter by county FIPS code
        year_start: Filter by start year (inclusive)
        year_end: Filter by end year (inclusive)
        solved: Filter by solved status
        victim_sex: Filter by victim sex
        victim_race: Filter by victim race
        victim_age_min: Filter by minimum victim age
        victim_age_max: Filter by maximum victim age
        weapon: Filter by weapon type
        relationship: Filter by relationship
        circumstance: Filter by circumstance
        
    Returns:
        TimelineTrendResponse with trend data points and moving averages
        
    Example:
        GET /api/timeline/trends?metric=solve_rate&granularity=year&moving_average_window=5
    """
    logger.info(
        f"Timeline trends request: metric={metric}, granularity={granularity}, "
        f"window={moving_average_window}, state={state}"
    )
    
    return get_timeline_trends(
        metric=metric,
        granularity=granularity,
        moving_average_window=moving_average_window,
        state=state,
        county=county,
        year_start=year_start,
        year_end=year_end,
        solved=solved,
        victim_sex=victim_sex,
        victim_race=victim_race,
        victim_age_min=victim_age_min,
        victim_age_max=victim_age_max,
        weapon=weapon,
        relationship=relationship,
        circumstance=circumstance,
    )