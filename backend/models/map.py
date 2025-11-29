"""Pydantic models for map visualization API.

Defines request/response models for the map endpoints, including county
aggregations, case points, and geographic bounds.
"""

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


# =============================================================================
# RESPONSE MODELS
# =============================================================================


class CountyMapData(BaseModel):
    """Aggregated case data for a single county.
    
    Contains geographic coordinates (centroid) and case statistics
    for choropleth and marker visualization.
    """
    
    fips: str = Field(description="County FIPS code (5 digits)")
    state_name: str = Field(description="State name")
    county_name: str = Field(description="County name")
    latitude: float = Field(description="County centroid latitude")
    longitude: float = Field(description="County centroid longitude")
    total_cases: int = Field(description="Total cases in county", ge=0)
    solved_cases: int = Field(description="Number of solved cases", ge=0)
    unsolved_cases: int = Field(description="Number of unsolved cases", ge=0)
    solve_rate: float = Field(
        description="Percentage of cases solved (0-100)", 
        ge=0, 
        le=100
    )


class MapCasePoint(BaseModel):
    """Individual case point for marker display.
    
    Contains minimal case data for map markers with drill-down capability.
    """
    
    case_id: int = Field(description="Case primary key ID")
    latitude: float = Field(description="Case latitude (county centroid)")
    longitude: float = Field(description="Case longitude (county centroid)")
    year: int = Field(description="Year of the case")
    solved: bool = Field(description="Whether the case is solved")
    victim_sex: Optional[str] = Field(None, description="Victim sex")
    victim_age: Optional[int] = Field(None, description="Victim age")
    weapon: Optional[str] = Field(None, description="Weapon used")


class MapBounds(BaseModel):
    """Geographic bounding box for map viewport.
    
    Defines the extent of data for auto-zoom functionality.
    """
    
    north: float = Field(description="Northern latitude bound")
    south: float = Field(description="Southern latitude bound")
    east: float = Field(description="Eastern longitude bound")
    west: float = Field(description="Western longitude bound")


class MapDataResponse(BaseModel):
    """Response model for county aggregation endpoint.
    
    Contains aggregated county data and geographic bounds for
    choropleth/marker visualization.
    
    Example:
        {
            "counties": [...],
            "bounds": {"north": 49.0, "south": 25.0, "east": -66.0, "west": -125.0},
            "total_cases": 894636,
            "total_counties": 3079
        }
    """
    
    counties: List[CountyMapData] = Field(description="List of county aggregations")
    bounds: MapBounds = Field(description="Geographic bounds of data")
    total_cases: int = Field(description="Total cases across all counties", ge=0)
    total_counties: int = Field(description="Number of counties with data", ge=0)


class MapCasesResponse(BaseModel):
    """Response model for individual case points endpoint.
    
    Contains case points for marker display with pagination info.
    
    Example:
        {
            "cases": [...],
            "total": 1000,
            "limited": true
        }
    """
    
    cases: List[MapCasePoint] = Field(description="List of case points")
    total: int = Field(description="Total matching cases", ge=0)
    limited: bool = Field(
        default=False, 
        description="Whether results were limited (more available)"
    )


# =============================================================================
# REQUEST MODELS (for filter parameters)
# =============================================================================


class MapFilterParams(BaseModel):
    """Filter parameters for map data queries.
    
    Mirrors the CaseFilter model but with map-specific defaults.
    """
    
    # Geographic filters
    state: Optional[str] = Field(None, description="State name filter")
    county: Optional[str] = Field(None, description="County FIPS code filter")
    
    # Temporal filters
    year_start: Optional[int] = Field(
        None, ge=1976, le=2023, description="Start year (inclusive)"
    )
    year_end: Optional[int] = Field(
        None, ge=1976, le=2023, description="End year (inclusive)"
    )
    
    # Case status
    solved: Optional[bool] = Field(None, description="Filter by solved status")
    
    # Victim demographics
    vic_sex: Optional[List[str]] = Field(None, description="Victim sex filter")
    vic_race: Optional[List[str]] = Field(None, description="Victim race filter")
    vic_age_min: Optional[int] = Field(None, ge=0, le=999, description="Min victim age")
    vic_age_max: Optional[int] = Field(None, ge=0, le=999, description="Max victim age")
    
    # Crime characteristics
    weapon: Optional[List[str]] = Field(None, description="Weapon type filter")
    relationship: Optional[List[str]] = Field(None, description="Relationship filter")
    circumstance: Optional[List[str]] = Field(None, description="Circumstance filter")