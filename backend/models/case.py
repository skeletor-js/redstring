"""Pydantic models for case filtering and responses.

Defines request/response models for the cases API, including comprehensive
filter criteria, paginated responses, and statistics summaries.
"""

from typing import List, Optional

from pydantic import BaseModel, Field


# =============================================================================
# REQUEST MODELS
# =============================================================================


class CaseFilter(BaseModel):
    """Request model for filtering cases.

    Supports comprehensive filtering across all case dimensions including
    demographics, crime characteristics, geographic location, and temporal range.

    Example:
        {
            "states": ["ILLINOIS", "INDIANA"],
            "year_min": 1990,
            "year_max": 2020,
            "solved": 0,
            "vic_sex": ["Female"],
            "weapon": ["Strangulation - hanging"],
            "limit": 100
        }
    """

    # Demographic filters
    states: Optional[List[str]] = Field(
        None, description="State names (e.g., ['ILLINOIS', 'CALIFORNIA'])"
    )
    vic_sex: Optional[List[str]] = Field(
        None, description="Victim sex: 'Male', 'Female', 'Unknown'"
    )
    vic_race: Optional[List[str]] = Field(
        None,
        description="Victim race: 'White', 'Black', 'Asian', 'American Indian/Alaskan Native', 'Unknown'",
    )
    vic_ethnic: Optional[List[str]] = Field(
        None,
        description="Victim ethnicity: 'Hispanic Origin', 'Not Hispanic', 'Unknown'",
    )
    vic_age_min: Optional[int] = Field(
        None, ge=0, le=999, description="Minimum victim age (0-99, 999=unknown)"
    )
    vic_age_max: Optional[int] = Field(
        None, ge=0, le=999, description="Maximum victim age (0-99, 999=unknown)"
    )
    include_unknown_age: bool = Field(
        False, description="Include cases where age is unknown (999)"
    )

    # Temporal filters
    year_min: Optional[int] = Field(
        None, ge=1976, le=2023, description="Minimum year (1976-2023)"
    )
    year_max: Optional[int] = Field(
        None, ge=1976, le=2023, description="Maximum year (1976-2023)"
    )

    # Case status
    solved: Optional[int] = Field(
        None, ge=0, le=1, description="Solved status: 0=unsolved, 1=solved"
    )

    # Crime characteristic filters
    weapon: Optional[List[str]] = Field(
        None, description="Weapon types (18 categories)"
    )
    relationship: Optional[List[str]] = Field(
        None, description="Victim-offender relationship (28 categories)"
    )
    circumstance: Optional[List[str]] = Field(
        None, description="Circumstance/motive categories"
    )
    situation: Optional[List[str]] = Field(
        None,
        description="Situation: Single/multiple victim/offender combinations",
    )

    # Geographic filters
    county: Optional[List[str]] = Field(
        None, description="County names (e.g., ['Cook County', 'Los Angeles County'])"
    )
    msa: Optional[List[str]] = Field(
        None, description="Metropolitan Statistical Area names"
    )

    # Search filters
    agency_search: Optional[str] = Field(
        None, description="Agency name substring search (case-insensitive)"
    )
    case_id: Optional[str] = Field(None, description="Exact case ID match")

    # Pagination
    cursor: Optional[str] = Field(
        None, description="Pagination cursor (format: 'year:id')"
    )
    limit: int = Field(
        100,
        ge=1,
        le=10000,
        description="Number of results per page (max 10000)",
    )


# =============================================================================
# RESPONSE MODELS
# =============================================================================


class CaseResponse(BaseModel):
    """Response model for a single case.

    Contains all case fields with both original labels and numeric codes
    where applicable for downstream analysis.
    """

    # Core identification
    id: str
    cntyfips: str
    county_fips_code: Optional[int]
    ori: str
    state: str
    agency: str
    agentype: str
    source: str

    # Case status and details
    solved: int
    year: int
    month: int
    month_name: str
    incident: int
    action_type: str
    homicide: str
    situation: str

    # Victim demographics
    vic_age: int
    vic_sex: str
    vic_sex_code: int
    vic_race: str
    vic_ethnic: str

    # Offender demographics
    off_age: int
    off_sex: str
    off_race: str
    off_ethnic: str

    # Crime characteristics
    weapon: str
    weapon_code: int
    relationship: str
    circumstance: str
    subcircum: str

    # Counts
    vic_count: int
    off_count: int

    # Additional metadata
    file_date: str
    msa: str
    msa_fips_code: Optional[int]
    decade: int

    # Geographic data
    latitude: Optional[float]
    longitude: Optional[float]

    class Config:
        """Pydantic configuration."""

        from_attributes = True


class PaginationInfo(BaseModel):
    """Pagination metadata for result sets."""

    next_cursor: Optional[str] = Field(
        None, description="Cursor for next page (null if no more results)"
    )
    has_more: bool = Field(description="Whether more results are available")
    current_page_size: int = Field(description="Number of results in current page")
    total_count: Optional[int] = Field(
        None, description="Total matching records (may be null for performance)"
    )
    large_result_warning: bool = Field(
        False,
        description="True if total_count > 50,000 (suggests narrowing filters)",
    )


class CaseListResponse(BaseModel):
    """Paginated response for case list queries.

    Example:
        {
            "cases": [...],
            "pagination": {
                "next_cursor": "1995:IL-12345",
                "has_more": true,
                "current_page_size": 100,
                "total_count": 45231,
                "large_result_warning": false
            }
        }
    """

    cases: List[CaseResponse]
    pagination: PaginationInfo


class StatsSummary(BaseModel):
    """Statistical summary for filtered case set.

    Provides aggregate counts and solve rate for current filter criteria.

    Example:
        {
            "total_cases": 45231,
            "solved_cases": 28442,
            "unsolved_cases": 16789,
            "solve_rate": 62.9
        }
    """

    total_cases: int = Field(description="Total cases matching filters")
    solved_cases: int = Field(description="Number of solved cases")
    unsolved_cases: int = Field(description="Number of unsolved cases")
    solve_rate: float = Field(
        description="Percentage of cases solved (0-100)", ge=0, le=100
    )
