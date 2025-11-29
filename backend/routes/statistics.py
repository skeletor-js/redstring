"""Statistics API routes for dashboard visualization.

Provides endpoints for statistics dashboard including summary statistics,
demographic breakdowns, weapon/circumstance/relationship distributions,
geographic statistics, trends, and seasonal patterns.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Query

from models.statistics import (
    CircumstanceStatistics,
    DemographicsResponse,
    GeographicStatistics,
    RelationshipStatistics,
    SeasonalStatistics,
    StatisticsSummary,
    TrendStatistics,
    WeaponStatistics,
)
from services.statistics_service import (
    get_circumstance_statistics,
    get_demographics,
    get_geographic_statistics,
    get_relationship_statistics,
    get_seasonal_statistics,
    get_summary_statistics,
    get_trend_statistics,
    get_weapon_statistics,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/statistics", tags=["statistics"])


@router.get("/summary", response_model=StatisticsSummary)
async def summary_statistics(
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
) -> StatisticsSummary:
    """Get overall summary statistics for the filtered dataset.
    
    Returns high-level metrics including total cases, solve rates,
    date range, and geographic coverage.
    
    Args:
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
        StatisticsSummary with overall statistics
        
    Example:
        GET /api/statistics/summary?state=California&year_start=2000
    """
    logger.info(
        f"Summary statistics request: state={state}, "
        f"year_start={year_start}, year_end={year_end}"
    )
    
    return get_summary_statistics(
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


@router.get("/demographics", response_model=DemographicsResponse)
async def demographics_statistics(
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
) -> DemographicsResponse:
    """Get demographic breakdowns by sex, race, and age group.
    
    Returns breakdowns showing case counts, solve rates, and percentages
    for each demographic category.
    
    Args:
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
        DemographicsResponse with breakdowns by sex, race, and age group
        
    Example:
        GET /api/statistics/demographics?year_start=2010&year_end=2020
    """
    logger.info(
        f"Demographics statistics request: state={state}, "
        f"year_start={year_start}, year_end={year_end}"
    )
    
    return get_demographics(
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


@router.get("/weapons", response_model=WeaponStatistics)
async def weapon_statistics(
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
) -> WeaponStatistics:
    """Get weapon type distribution statistics.
    
    Returns breakdown of cases by weapon type with counts,
    percentages, and solve rates.
    
    Args:
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
        WeaponStatistics with weapon category breakdowns
        
    Example:
        GET /api/statistics/weapons?state=Texas
    """
    logger.info(
        f"Weapon statistics request: state={state}, "
        f"year_start={year_start}, year_end={year_end}"
    )
    
    return get_weapon_statistics(
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


@router.get("/circumstances", response_model=CircumstanceStatistics)
async def circumstance_statistics(
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
) -> CircumstanceStatistics:
    """Get circumstance distribution statistics.
    
    Returns breakdown of cases by circumstance/motive with counts,
    percentages, and solve rates.
    
    Args:
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
        CircumstanceStatistics with circumstance category breakdowns
        
    Example:
        GET /api/statistics/circumstances?solved=false
    """
    logger.info(
        f"Circumstance statistics request: state={state}, "
        f"year_start={year_start}, year_end={year_end}"
    )
    
    return get_circumstance_statistics(
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


@router.get("/relationships", response_model=RelationshipStatistics)
async def relationship_statistics(
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
) -> RelationshipStatistics:
    """Get victim-offender relationship distribution statistics.
    
    Returns breakdown of cases by relationship type with counts,
    percentages, and solve rates.
    
    Args:
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
        RelationshipStatistics with relationship category breakdowns
        
    Example:
        GET /api/statistics/relationships?victim_sex=Female
    """
    logger.info(
        f"Relationship statistics request: state={state}, "
        f"year_start={year_start}, year_end={year_end}"
    )
    
    return get_relationship_statistics(
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


@router.get("/geographic", response_model=GeographicStatistics)
async def geographic_statistics(
    top_n: int = Query(
        default=10,
        ge=1,
        le=50,
        description="Number of top states/counties to return"
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
) -> GeographicStatistics:
    """Get geographic distribution statistics.
    
    Returns top states and counties by case count with solve rates.
    
    Args:
        top_n: Number of top states/counties to return (1-50)
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
        GeographicStatistics with top states and counties
        
    Example:
        GET /api/statistics/geographic?top_n=20&year_start=2015
    """
    logger.info(
        f"Geographic statistics request: top_n={top_n}, state={state}, "
        f"year_start={year_start}, year_end={year_end}"
    )
    
    return get_geographic_statistics(
        top_n=top_n,
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


@router.get("/trends", response_model=TrendStatistics)
async def trend_statistics(
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
) -> TrendStatistics:
    """Get yearly trend statistics with trend analysis.
    
    Returns yearly data points with case counts and solve rates,
    plus overall trend direction (increasing, decreasing, or stable).
    
    Args:
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
        TrendStatistics with yearly data and trend analysis
        
    Example:
        GET /api/statistics/trends?state=Florida
    """
    logger.info(
        f"Trend statistics request: state={state}, "
        f"year_start={year_start}, year_end={year_end}"
    )
    
    return get_trend_statistics(
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


@router.get("/seasonal", response_model=SeasonalStatistics)
async def seasonal_statistics(
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
) -> SeasonalStatistics:
    """Get seasonal (monthly) pattern statistics.
    
    Returns monthly patterns showing average cases per month
    and identifying peak and lowest months.
    
    Args:
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
        SeasonalStatistics with monthly patterns
        
    Example:
        GET /api/statistics/seasonal?year_start=2000&year_end=2020
    """
    logger.info(
        f"Seasonal statistics request: state={state}, "
        f"year_start={year_start}, year_end={year_end}"
    )
    
    return get_seasonal_statistics(
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