"""Timeline data service for temporal visualization.

Provides aggregation and query functions for timeline visualization including
time-based aggregations by year, month, or decade, and trend analysis with
moving averages.
"""

import logging
from typing import Any, List, Optional, Tuple

from database.connection import get_db_connection
from models.timeline import (
    TimelineDataPoint,
    TimelineDataResponse,
    TimelineDateRange,
    TimelineTrendPoint,
    TimelineTrendResponse,
)

logger = logging.getLogger(__name__)


# =============================================================================
# FILTER QUERY BUILDER
# =============================================================================


def _build_timeline_filter_conditions(
    state: Optional[str] = None,
    county: Optional[str] = None,
    year_start: Optional[int] = None,
    year_end: Optional[int] = None,
    solved: Optional[bool] = None,
    victim_sex: Optional[str] = None,
    victim_race: Optional[str] = None,
    victim_age_min: Optional[int] = None,
    victim_age_max: Optional[int] = None,
    weapon: Optional[str] = None,
    relationship: Optional[str] = None,
    circumstance: Optional[str] = None,
) -> Tuple[str, List[Any]]:
    """Build SQL WHERE clause from filter parameters.
    
    Args:
        state: State name filter
        county: County FIPS code filter
        year_start: Start year (inclusive)
        year_end: End year (inclusive)
        solved: Solved status filter
        victim_sex: Victim sex filter
        victim_race: Victim race filter
        victim_age_min: Minimum victim age
        victim_age_max: Maximum victim age
        weapon: Weapon type filter
        relationship: Relationship filter
        circumstance: Circumstance filter
        
    Returns:
        Tuple of (WHERE clause SQL, parameter list)
    """
    conditions: List[str] = []
    params: List[Any] = []
    
    # State filter (case-insensitive)
    if state:
        conditions.append("UPPER(state) = UPPER(?)")
        params.append(state)
    
    # County FIPS filter
    if county:
        conditions.append("county_fips_code = ?")
        params.append(int(county))
    
    # Year range
    if year_start is not None:
        conditions.append("year >= ?")
        params.append(year_start)
    if year_end is not None:
        conditions.append("year <= ?")
        params.append(year_end)
    
    # Solved status
    if solved is not None:
        conditions.append("solved = ?")
        params.append(1 if solved else 0)
    
    # Victim sex
    if victim_sex:
        conditions.append("vic_sex = ?")
        params.append(victim_sex)
    
    # Victim race
    if victim_race:
        conditions.append("vic_race = ?")
        params.append(victim_race)
    
    # Victim age range
    if victim_age_min is not None:
        conditions.append("vic_age >= ?")
        params.append(victim_age_min)
    if victim_age_max is not None:
        conditions.append("vic_age <= ?")
        params.append(victim_age_max)
    
    # Weapon
    if weapon:
        conditions.append("weapon = ?")
        params.append(weapon)
    
    # Relationship
    if relationship:
        conditions.append("relationship = ?")
        params.append(relationship)
    
    # Circumstance
    if circumstance:
        conditions.append("circumstance = ?")
        params.append(circumstance)
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    return where_clause, params


# =============================================================================
# PERIOD FORMATTING HELPERS
# =============================================================================


def _format_year_period(year: int) -> str:
    """Format year as period string."""
    return str(year)


def _format_month_period(year: int, month: int) -> str:
    """Format year and month as period string (YYYY-MM)."""
    return f"{year}-{month:02d}"


def _format_decade_period(decade: int) -> str:
    """Format decade as period string (e.g., '1980s')."""
    return f"{decade}s"


def _get_decade(year: int) -> int:
    """Get decade from year (e.g., 1985 -> 1980)."""
    return (year // 10) * 10


# =============================================================================
# MOVING AVERAGE CALCULATION
# =============================================================================


def _calculate_moving_average(
    values: List[float],
    window: int
) -> List[Optional[float]]:
    """Calculate moving average for a list of values.
    
    Args:
        values: List of numeric values
        window: Window size for moving average
        
    Returns:
        List of moving averages (None for positions where window doesn't fit)
    """
    if window < 2 or len(values) < window:
        return [None] * len(values)
    
    result: List[Optional[float]] = []
    
    for i in range(len(values)):
        if i < window - 1:
            # Not enough data points yet
            result.append(None)
        else:
            # Calculate average of last 'window' values
            window_values = values[i - window + 1:i + 1]
            avg = sum(window_values) / len(window_values)
            result.append(round(avg, 2))
    
    return result


# =============================================================================
# TIMELINE DATA SERVICE
# =============================================================================


def get_timeline_data(
    granularity: str = "year",
    state: Optional[str] = None,
    county: Optional[str] = None,
    year_start: Optional[int] = None,
    year_end: Optional[int] = None,
    solved: Optional[bool] = None,
    victim_sex: Optional[str] = None,
    victim_race: Optional[str] = None,
    victim_age_min: Optional[int] = None,
    victim_age_max: Optional[int] = None,
    weapon: Optional[str] = None,
    relationship: Optional[str] = None,
    circumstance: Optional[str] = None,
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
    """
    logger.info(f"Getting timeline data with granularity={granularity}")
    
    # Build filter conditions
    where_clause, params = _build_timeline_filter_conditions(
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
    
    # Build aggregation query based on granularity
    if granularity == "month":
        # Aggregate by year and month
        group_by = "year, month"
        order_by = "year, month"
        select_period = "year, month"
    elif granularity == "decade":
        # Aggregate by decade
        group_by = "decade"
        order_by = "decade"
        select_period = "decade"
    else:
        # Default: aggregate by year
        group_by = "year"
        order_by = "year"
        select_period = "year"
    
    query = f"""
        SELECT 
            {select_period},
            COUNT(*) as total_cases,
            SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solved_cases,
            SUM(CASE WHEN solved = 0 THEN 1 ELSE 0 END) as unsolved_cases
        FROM cases
        WHERE {where_clause}
        GROUP BY {group_by}
        ORDER BY {order_by}
    """
    
    logger.debug(f"Executing timeline query: {query}")
    logger.debug(f"Parameters: {params}")
    
    data_points: List[TimelineDataPoint] = []
    total_cases = 0
    first_period: Optional[str] = None
    last_period: Optional[str] = None
    
    with get_db_connection() as conn:
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        
        for row in rows:
            # Format period based on granularity
            if granularity == "month":
                period = _format_month_period(row["year"], row["month"])
            elif granularity == "decade":
                period = _format_decade_period(row["decade"])
            else:
                period = _format_year_period(row["year"])
            
            row_total = row["total_cases"]
            row_solved = row["solved_cases"] or 0
            row_unsolved = row["unsolved_cases"] or 0
            solve_rate = round((row_solved / row_total) * 100, 1) if row_total > 0 else 0.0
            
            data_point = TimelineDataPoint(
                period=period,
                total_cases=row_total,
                solved_cases=row_solved,
                unsolved_cases=row_unsolved,
                solve_rate=solve_rate,
            )
            
            data_points.append(data_point)
            total_cases += row_total
            
            # Track date range
            if first_period is None:
                first_period = period
            last_period = period
    
    # Handle empty results
    if not data_points:
        date_range = TimelineDateRange(start="N/A", end="N/A")
    else:
        date_range = TimelineDateRange(
            start=first_period or "N/A",
            end=last_period or "N/A"
        )
    
    logger.info(f"Returning {len(data_points)} timeline data points with {total_cases} total cases")
    
    return TimelineDataResponse(
        data=data_points,
        granularity=granularity,
        total_cases=total_cases,
        date_range=date_range,
    )


# =============================================================================
# TIMELINE TRENDS SERVICE
# =============================================================================


def get_timeline_trends(
    metric: str = "solve_rate",
    granularity: str = "year",
    moving_average_window: int = 3,
    state: Optional[str] = None,
    county: Optional[str] = None,
    year_start: Optional[int] = None,
    year_end: Optional[int] = None,
    solved: Optional[bool] = None,
    victim_sex: Optional[str] = None,
    victim_race: Optional[str] = None,
    victim_age_min: Optional[int] = None,
    victim_age_max: Optional[int] = None,
    weapon: Optional[str] = None,
    relationship: Optional[str] = None,
    circumstance: Optional[str] = None,
) -> TimelineTrendResponse:
    """Get trend analysis data with moving averages.
    
    Calculates trends for the specified metric over time, including
    moving averages for smoothing.
    
    Args:
        metric: Metric to analyze ("solve_rate", "total_cases", "unsolved_cases")
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
    """
    logger.info(f"Getting timeline trends for metric={metric}, granularity={granularity}")
    
    # Validate metric
    valid_metrics = ["solve_rate", "total_cases", "unsolved_cases", "solved_cases"]
    if metric not in valid_metrics:
        logger.warning(f"Invalid metric '{metric}', defaulting to 'solve_rate'")
        metric = "solve_rate"
    
    # Validate moving average window
    moving_average_window = max(2, min(10, moving_average_window))
    
    # Get base timeline data
    timeline_data = get_timeline_data(
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
    
    # Extract metric values
    values: List[float] = []
    for point in timeline_data.data:
        if metric == "solve_rate":
            values.append(point.solve_rate)
        elif metric == "total_cases":
            values.append(float(point.total_cases))
        elif metric == "unsolved_cases":
            values.append(float(point.unsolved_cases))
        elif metric == "solved_cases":
            values.append(float(point.solved_cases))
    
    # Calculate moving averages
    moving_averages = _calculate_moving_average(values, moving_average_window)
    
    # Build trend points
    trend_points: List[TimelineTrendPoint] = []
    for i, point in enumerate(timeline_data.data):
        trend_point = TimelineTrendPoint(
            period=point.period,
            value=values[i],
            moving_average=moving_averages[i],
        )
        trend_points.append(trend_point)
    
    logger.info(f"Returning {len(trend_points)} trend points for metric={metric}")
    
    return TimelineTrendResponse(
        trends=trend_points,
        metric=metric,
        granularity=granularity,
        moving_average_window=moving_average_window,
    )