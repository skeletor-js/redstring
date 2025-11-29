"""Pydantic models for Timeline API endpoints.

Provides data models for timeline visualization including time-based
aggregations, trend analysis, and filter parameters.
"""

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


# =============================================================================
# TIMELINE DATA MODELS
# =============================================================================


class TimelineDataPoint(BaseModel):
    """Single data point in timeline aggregation.
    
    Represents aggregated case statistics for a specific time period
    (year, month, or decade).
    
    Attributes:
        period: Time period identifier (e.g., "2020", "2020-01", "2020s")
        total_cases: Total number of cases in this period
        solved_cases: Number of solved cases
        unsolved_cases: Number of unsolved cases
        solve_rate: Percentage of cases solved (0-100)
    """
    period: str = Field(..., description="Time period identifier (e.g., '2020', '2020-01', '2020s')")
    total_cases: int = Field(..., ge=0, description="Total number of cases in this period")
    solved_cases: int = Field(..., ge=0, description="Number of solved cases")
    unsolved_cases: int = Field(..., ge=0, description="Number of unsolved cases")
    solve_rate: float = Field(..., ge=0, le=100, description="Percentage of cases solved (0-100)")


class TimelineTrendPoint(BaseModel):
    """Single point in trend analysis.
    
    Represents a metric value at a specific time period with optional
    moving average for trend smoothing.
    
    Attributes:
        period: Time period identifier
        value: Raw metric value for this period
        moving_average: Smoothed value using moving average (optional)
    """
    period: str = Field(..., description="Time period identifier")
    value: float = Field(..., description="Raw metric value for this period")
    moving_average: Optional[float] = Field(None, description="Smoothed value using moving average")


class TimelineDateRange(BaseModel):
    """Date range for timeline data.
    
    Attributes:
        start: Start period (e.g., "1976" or "1976-01")
        end: End period (e.g., "2023" or "2023-12")
    """
    start: str = Field(..., description="Start period")
    end: str = Field(..., description="End period")


# =============================================================================
# TIMELINE RESPONSE MODELS
# =============================================================================


class TimelineDataResponse(BaseModel):
    """Response model for timeline data endpoint.
    
    Contains aggregated case data over time with metadata about
    the granularity and date range.
    
    Attributes:
        data: List of timeline data points
        granularity: Time granularity used (year, month, or decade)
        total_cases: Total cases across all periods
        date_range: Start and end of the data range
    """
    data: List[TimelineDataPoint] = Field(..., description="List of timeline data points")
    granularity: Literal["year", "month", "decade"] = Field(..., description="Time granularity")
    total_cases: int = Field(..., ge=0, description="Total cases across all periods")
    date_range: TimelineDateRange = Field(..., description="Start and end of the data range")


class TimelineTrendResponse(BaseModel):
    """Response model for timeline trends endpoint.
    
    Contains trend analysis data with moving averages for
    visualizing patterns over time.
    
    Attributes:
        trends: List of trend data points with moving averages
        metric: The metric being analyzed (solve_rate, total_cases, etc.)
        granularity: Time granularity used
        moving_average_window: Window size used for moving average calculation
    """
    trends: List[TimelineTrendPoint] = Field(..., description="List of trend data points")
    metric: str = Field(..., description="The metric being analyzed")
    granularity: str = Field(..., description="Time granularity used")
    moving_average_window: int = Field(..., ge=2, description="Window size for moving average")


# =============================================================================
# TIMELINE FILTER PARAMETERS
# =============================================================================


class TimelineFilterParams(BaseModel):
    """Filter parameters for timeline queries.
    
    Supports all standard case filters plus timeline-specific
    granularity setting.
    
    Attributes:
        state: Filter by state name
        county: Filter by county FIPS code
        year_start: Start year (inclusive)
        year_end: End year (inclusive)
        solved: Filter by solved status
        victim_sex: Filter by victim sex
        victim_race: Filter by victim race
        victim_age_min: Minimum victim age
        victim_age_max: Maximum victim age
        weapon: Filter by weapon type
        relationship: Filter by relationship
        circumstance: Filter by circumstance
        granularity: Time aggregation granularity
    """
    state: Optional[str] = Field(None, description="Filter by state name")
    county: Optional[str] = Field(None, description="Filter by county FIPS code")
    year_start: Optional[int] = Field(None, ge=1965, le=2030, description="Start year (inclusive)")
    year_end: Optional[int] = Field(None, ge=1965, le=2030, description="End year (inclusive)")
    solved: Optional[bool] = Field(None, description="Filter by solved status")
    victim_sex: Optional[str] = Field(None, description="Filter by victim sex")
    victim_race: Optional[str] = Field(None, description="Filter by victim race")
    victim_age_min: Optional[int] = Field(None, ge=0, le=999, description="Minimum victim age")
    victim_age_max: Optional[int] = Field(None, ge=0, le=999, description="Maximum victim age")
    weapon: Optional[str] = Field(None, description="Filter by weapon type")
    relationship: Optional[str] = Field(None, description="Filter by relationship")
    circumstance: Optional[str] = Field(None, description="Filter by circumstance")
    granularity: Literal["year", "month", "decade"] = Field(
        "year", description="Time aggregation granularity"
    )