"""Pydantic models for Statistics API endpoints.

Provides data models for statistics dashboard including summary statistics,
demographic breakdowns, weapon/circumstance/relationship distributions,
geographic statistics, trends, and seasonal patterns.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# =============================================================================
# SUMMARY STATISTICS MODELS
# =============================================================================


class StatisticsSummary(BaseModel):
    """Overall summary statistics for the dataset.
    
    Provides high-level metrics about the filtered case data including
    total counts, solve rates, and coverage information.
    
    Attributes:
        total_cases: Total number of cases matching filters
        solved_cases: Number of solved cases
        unsolved_cases: Number of unsolved cases
        overall_solve_rate: Percentage of cases solved (0-100)
        date_range: Dictionary with start_year and end_year
        states_covered: Number of unique states in the data
        counties_covered: Number of unique counties in the data
    """
    total_cases: int = Field(..., ge=0, description="Total number of cases")
    solved_cases: int = Field(..., ge=0, description="Number of solved cases")
    unsolved_cases: int = Field(..., ge=0, description="Number of unsolved cases")
    overall_solve_rate: float = Field(..., ge=0, le=100, description="Percentage of cases solved (0-100)")
    date_range: Dict[str, int] = Field(..., description="Dictionary with start_year and end_year")
    states_covered: int = Field(..., ge=0, description="Number of unique states")
    counties_covered: int = Field(..., ge=0, description="Number of unique counties")


# =============================================================================
# DEMOGRAPHIC BREAKDOWN MODELS
# =============================================================================


class DemographicBreakdown(BaseModel):
    """Breakdown of cases by a demographic category.
    
    Represents statistics for a single category value (e.g., "Male", "Female")
    within a demographic dimension (e.g., victim sex).
    
    Attributes:
        category: Category name (e.g., "Male", "Female", "Unknown")
        total_cases: Total cases in this category
        solved_cases: Solved cases in this category
        unsolved_cases: Unsolved cases in this category
        solve_rate: Solve rate for this category (0-100)
        percentage_of_total: Percentage this category represents of all cases
    """
    category: str = Field(..., description="Category name (e.g., 'Male', 'Female', 'Unknown')")
    total_cases: int = Field(..., ge=0, description="Total cases in this category")
    solved_cases: int = Field(..., ge=0, description="Solved cases in this category")
    unsolved_cases: int = Field(..., ge=0, description="Unsolved cases in this category")
    solve_rate: float = Field(..., ge=0, le=100, description="Solve rate for this category (0-100)")
    percentage_of_total: float = Field(..., ge=0, le=100, description="Percentage of total cases")


class DemographicsResponse(BaseModel):
    """Response model for demographics endpoint.
    
    Contains breakdowns by sex, race, and age group.
    
    Attributes:
        by_sex: List of breakdowns by victim sex
        by_race: List of breakdowns by victim race
        by_age_group: List of breakdowns by victim age group
    """
    by_sex: List[DemographicBreakdown] = Field(..., description="Breakdown by victim sex")
    by_race: List[DemographicBreakdown] = Field(..., description="Breakdown by victim race")
    by_age_group: List[DemographicBreakdown] = Field(..., description="Breakdown by victim age group")


# =============================================================================
# CATEGORY BREAKDOWN MODELS
# =============================================================================


class CategoryBreakdown(BaseModel):
    """Generic breakdown for categorical data.
    
    Used for weapons, circumstances, relationships, etc.
    
    Attributes:
        category: Category name
        count: Number of cases in this category
        percentage: Percentage of total cases
        solve_rate: Solve rate for this category (0-100)
    """
    category: str = Field(..., description="Category name")
    count: int = Field(..., ge=0, description="Number of cases")
    percentage: float = Field(..., ge=0, le=100, description="Percentage of total")
    solve_rate: float = Field(..., ge=0, le=100, description="Solve rate (0-100)")


class WeaponStatistics(BaseModel):
    """Response model for weapon statistics endpoint.
    
    Attributes:
        weapons: List of weapon category breakdowns
        total_cases: Total cases analyzed
    """
    weapons: List[CategoryBreakdown] = Field(..., description="Weapon category breakdowns")
    total_cases: int = Field(..., ge=0, description="Total cases analyzed")


class CircumstanceStatistics(BaseModel):
    """Response model for circumstance statistics endpoint.
    
    Attributes:
        circumstances: List of circumstance category breakdowns
        total_cases: Total cases analyzed
    """
    circumstances: List[CategoryBreakdown] = Field(..., description="Circumstance category breakdowns")
    total_cases: int = Field(..., ge=0, description="Total cases analyzed")


class RelationshipStatistics(BaseModel):
    """Response model for relationship statistics endpoint.
    
    Attributes:
        relationships: List of relationship category breakdowns
        total_cases: Total cases analyzed
    """
    relationships: List[CategoryBreakdown] = Field(..., description="Relationship category breakdowns")
    total_cases: int = Field(..., ge=0, description="Total cases analyzed")


# =============================================================================
# GEOGRAPHIC STATISTICS MODELS
# =============================================================================


class StateStatistic(BaseModel):
    """Statistics for a single state.
    
    Attributes:
        state: State name
        total_cases: Total cases in this state
        solved_cases: Solved cases in this state
        unsolved_cases: Unsolved cases in this state
        solve_rate: Solve rate for this state (0-100)
    """
    state: str = Field(..., description="State name")
    total_cases: int = Field(..., ge=0, description="Total cases")
    solved_cases: int = Field(..., ge=0, description="Solved cases")
    unsolved_cases: int = Field(..., ge=0, description="Unsolved cases")
    solve_rate: float = Field(..., ge=0, le=100, description="Solve rate (0-100)")


class CountyStatistic(BaseModel):
    """Statistics for a single county.
    
    Attributes:
        county: County name
        state: State name
        county_fips: County FIPS code
        total_cases: Total cases in this county
        solved_cases: Solved cases in this county
        unsolved_cases: Unsolved cases in this county
        solve_rate: Solve rate for this county (0-100)
    """
    county: str = Field(..., description="County name")
    state: str = Field(..., description="State name")
    county_fips: int = Field(..., description="County FIPS code")
    total_cases: int = Field(..., ge=0, description="Total cases")
    solved_cases: int = Field(..., ge=0, description="Solved cases")
    unsolved_cases: int = Field(..., ge=0, description="Unsolved cases")
    solve_rate: float = Field(..., ge=0, le=100, description="Solve rate (0-100)")


class GeographicStatistics(BaseModel):
    """Response model for geographic statistics endpoint.
    
    Attributes:
        top_states: List of top states by case count
        top_counties: List of top counties by case count
    """
    top_states: List[StateStatistic] = Field(..., description="Top states by case count")
    top_counties: List[CountyStatistic] = Field(..., description="Top counties by case count")


# =============================================================================
# TREND STATISTICS MODELS
# =============================================================================


class YearlyTrendPoint(BaseModel):
    """Single data point in yearly trend analysis.
    
    Attributes:
        year: Year
        total_cases: Total cases in this year
        solved_cases: Solved cases in this year
        unsolved_cases: Unsolved cases in this year
        solve_rate: Solve rate for this year (0-100)
    """
    year: int = Field(..., description="Year")
    total_cases: int = Field(..., ge=0, description="Total cases")
    solved_cases: int = Field(..., ge=0, description="Solved cases")
    unsolved_cases: int = Field(..., ge=0, description="Unsolved cases")
    solve_rate: float = Field(..., ge=0, le=100, description="Solve rate (0-100)")


class TrendStatistics(BaseModel):
    """Response model for trend statistics endpoint.
    
    Attributes:
        yearly_data: List of yearly trend data points
        overall_trend: Trend direction ("increasing", "decreasing", "stable")
        average_annual_cases: Average number of cases per year
    """
    yearly_data: List[YearlyTrendPoint] = Field(..., description="Yearly trend data")
    overall_trend: str = Field(..., description="Trend direction: increasing, decreasing, or stable")
    average_annual_cases: float = Field(..., ge=0, description="Average cases per year")


# =============================================================================
# SEASONAL STATISTICS MODELS
# =============================================================================


class SeasonalPattern(BaseModel):
    """Statistics for a single month in seasonal analysis.
    
    Attributes:
        month: Month number (1-12)
        month_name: Month name (e.g., "January")
        average_cases: Average cases per year for this month
        percentage_of_annual: Percentage of annual cases this month represents
    """
    month: int = Field(..., ge=1, le=12, description="Month number (1-12)")
    month_name: str = Field(..., description="Month name")
    average_cases: float = Field(..., ge=0, description="Average cases per year for this month")
    percentage_of_annual: float = Field(..., ge=0, le=100, description="Percentage of annual cases")


class SeasonalStatistics(BaseModel):
    """Response model for seasonal statistics endpoint.
    
    Attributes:
        patterns: List of monthly seasonal patterns
        peak_month: Month with highest average cases
        lowest_month: Month with lowest average cases
    """
    patterns: List[SeasonalPattern] = Field(..., description="Monthly patterns")
    peak_month: str = Field(..., description="Month with highest average cases")
    lowest_month: str = Field(..., description="Month with lowest average cases")


# =============================================================================
# FILTER PARAMETERS
# =============================================================================


class StatisticsFilterParams(BaseModel):
    """Filter parameters for statistics queries.
    
    Supports all standard case filters for consistent filtering
    across all statistics endpoints.
    
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