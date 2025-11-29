"""Map data service for geographic visualization.

Provides aggregation and query functions for map visualization including
county-level aggregations and individual case points.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

from database.connection import get_db_connection
from models.map import (
    CountyMapData,
    MapBounds,
    MapCasePoint,
    MapCasesResponse,
    MapDataResponse,
)
from utils.mappings import get_county_centroids

logger = logging.getLogger(__name__)


# =============================================================================
# COUNTY CENTROID LOOKUP
# =============================================================================

# Load county centroids data for enrichment
_COUNTY_INFO_CACHE: Optional[Dict[int, Dict[str, Any]]] = None


def _load_county_info() -> Dict[int, Dict[str, Any]]:
    """Load county information including names and coordinates.
    
    Returns:
        Dictionary mapping FIPS codes to county info dicts with
        state_name, county_name, latitude, longitude.
    """
    global _COUNTY_INFO_CACHE
    
    if _COUNTY_INFO_CACHE is not None:
        return _COUNTY_INFO_CACHE
    
    try:
        from config import get_data_path
        
        data_path = get_data_path()
        csv_path = data_path / "US County Centroids.csv"
        
        df = pd.read_csv(csv_path)
        
        county_info = {}
        for _, row in df.iterrows():
            fips = int(row["cfips"])
            county_info[fips] = {
                "state_name": row["state"],
                "county_name": row["county"],
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
            }
        
        _COUNTY_INFO_CACHE = county_info
        logger.info(f"Loaded {len(county_info)} county info records")
        return county_info
        
    except Exception as e:
        logger.error(f"Error loading county info: {e}", exc_info=True)
        return {}


# =============================================================================
# FILTER QUERY BUILDER
# =============================================================================


def _build_map_filter_conditions(
    state: Optional[str] = None,
    county: Optional[str] = None,
    year_start: Optional[int] = None,
    year_end: Optional[int] = None,
    solved: Optional[bool] = None,
    vic_sex: Optional[List[str]] = None,
    vic_race: Optional[List[str]] = None,
    vic_age_min: Optional[int] = None,
    vic_age_max: Optional[int] = None,
    weapon: Optional[List[str]] = None,
    relationship: Optional[List[str]] = None,
    circumstance: Optional[List[str]] = None,
) -> Tuple[str, List[Any]]:
    """Build SQL WHERE clause from filter parameters.
    
    Args:
        state: State name filter
        county: County FIPS code filter
        year_start: Start year (inclusive)
        year_end: End year (inclusive)
        solved: Solved status filter
        vic_sex: Victim sex filter list
        vic_race: Victim race filter list
        vic_age_min: Minimum victim age
        vic_age_max: Maximum victim age
        weapon: Weapon type filter list
        relationship: Relationship filter list
        circumstance: Circumstance filter list
        
    Returns:
        Tuple of (WHERE clause SQL, parameter list)
    """
    conditions: List[str] = []
    params: List[Any] = []
    
    # Require valid county_fips_code for geographic queries
    conditions.append("county_fips_code IS NOT NULL")
    
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
    if vic_sex:
        placeholders = ",".join("?" * len(vic_sex))
        conditions.append(f"vic_sex IN ({placeholders})")
        params.extend(vic_sex)
    
    # Victim race
    if vic_race:
        placeholders = ",".join("?" * len(vic_race))
        conditions.append(f"vic_race IN ({placeholders})")
        params.extend(vic_race)
    
    # Victim age range
    if vic_age_min is not None:
        conditions.append("vic_age >= ?")
        params.append(vic_age_min)
    if vic_age_max is not None:
        conditions.append("vic_age <= ?")
        params.append(vic_age_max)
    
    # Weapon
    if weapon:
        placeholders = ",".join("?" * len(weapon))
        conditions.append(f"weapon IN ({placeholders})")
        params.extend(weapon)
    
    # Relationship
    if relationship:
        placeholders = ",".join("?" * len(relationship))
        conditions.append(f"relationship IN ({placeholders})")
        params.extend(relationship)
    
    # Circumstance
    if circumstance:
        placeholders = ",".join("?" * len(circumstance))
        conditions.append(f"circumstance IN ({placeholders})")
        params.extend(circumstance)
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    return where_clause, params


# =============================================================================
# COUNTY AGGREGATION SERVICE
# =============================================================================


def get_county_aggregations(
    state: Optional[str] = None,
    county: Optional[str] = None,
    year_start: Optional[int] = None,
    year_end: Optional[int] = None,
    solved: Optional[bool] = None,
    vic_sex: Optional[List[str]] = None,
    vic_race: Optional[List[str]] = None,
    vic_age_min: Optional[int] = None,
    vic_age_max: Optional[int] = None,
    weapon: Optional[List[str]] = None,
    relationship: Optional[List[str]] = None,
    circumstance: Optional[List[str]] = None,
) -> MapDataResponse:
    """Get aggregated case data by county for map visualization.
    
    Aggregates cases by county FIPS code, calculating total cases,
    solved/unsolved counts, and solve rates. Enriches with county
    centroid coordinates for map display.
    
    Args:
        state: Filter by state name
        county: Filter by county FIPS code
        year_start: Filter by start year (inclusive)
        year_end: Filter by end year (inclusive)
        solved: Filter by solved status
        vic_sex: Filter by victim sex
        vic_race: Filter by victim race
        vic_age_min: Filter by minimum victim age
        vic_age_max: Filter by maximum victim age
        weapon: Filter by weapon type
        relationship: Filter by relationship
        circumstance: Filter by circumstance
        
    Returns:
        MapDataResponse with county aggregations and bounds
    """
    logger.info("Getting county aggregations for map")
    
    # Build filter conditions
    where_clause, params = _build_map_filter_conditions(
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
    )
    
    # SQL aggregation query
    # Note: We only GROUP BY county_fips_code (not state) to ensure unique FIPS codes.
    # County names and state info are looked up from the centroids CSV which is authoritative.
    query = f"""
        SELECT
            county_fips_code,
            COUNT(*) as total_cases,
            SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solved_cases,
            SUM(CASE WHEN solved = 0 THEN 1 ELSE 0 END) as unsolved_cases
        FROM cases
        WHERE {where_clause}
        GROUP BY county_fips_code
        ORDER BY total_cases DESC
    """
    
    logger.debug(f"Executing county aggregation query: {query}")
    logger.debug(f"Parameters: {params}")
    
    # Load county info for enrichment
    county_info = _load_county_info()
    
    counties: List[CountyMapData] = []
    total_cases = 0
    
    # Track bounds
    min_lat, max_lat = 90.0, -90.0
    min_lon, max_lon = 180.0, -180.0
    
    with get_db_connection() as conn:
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        
        for row in rows:
            fips = row["county_fips_code"]
            if fips is None:
                continue
                
            fips_int = int(fips)
            info = county_info.get(fips_int)
            
            if info is None:
                # Skip counties without centroid data
                logger.debug(f"No centroid data for FIPS {fips_int}")
                continue
            
            row_total = row["total_cases"]
            row_solved = row["solved_cases"] or 0
            row_unsolved = row["unsolved_cases"] or 0
            solve_rate = round((row_solved / row_total) * 100, 1) if row_total > 0 else 0.0
            
            county_data = CountyMapData(
                fips=str(fips_int).zfill(5),
                state_name=info["state_name"],
                county_name=info["county_name"],
                latitude=info["latitude"],
                longitude=info["longitude"],
                total_cases=row_total,
                solved_cases=row_solved,
                unsolved_cases=row_unsolved,
                solve_rate=solve_rate,
            )
            
            counties.append(county_data)
            total_cases += row_total
            
            # Update bounds
            lat, lon = info["latitude"], info["longitude"]
            min_lat = min(min_lat, lat)
            max_lat = max(max_lat, lat)
            min_lon = min(min_lon, lon)
            max_lon = max(max_lon, lon)
    
    # Handle empty results
    if not counties:
        bounds = MapBounds(north=49.0, south=25.0, east=-66.0, west=-125.0)
    else:
        # Add padding to bounds
        lat_padding = (max_lat - min_lat) * 0.1 or 1.0
        lon_padding = (max_lon - min_lon) * 0.1 or 1.0
        bounds = MapBounds(
            north=min(max_lat + lat_padding, 72.0),
            south=max(min_lat - lat_padding, 18.0),
            east=min(max_lon + lon_padding, -66.0),
            west=max(min_lon - lon_padding, -180.0),
        )
    
    logger.info(f"Returning {len(counties)} county aggregations with {total_cases} total cases")
    
    return MapDataResponse(
        counties=counties,
        bounds=bounds,
        total_cases=total_cases,
        total_counties=len(counties),
    )


# =============================================================================
# CASE POINTS SERVICE
# =============================================================================


def get_case_points(
    state: Optional[str] = None,
    county: Optional[str] = None,
    year_start: Optional[int] = None,
    year_end: Optional[int] = None,
    solved: Optional[bool] = None,
    vic_sex: Optional[List[str]] = None,
    vic_race: Optional[List[str]] = None,
    vic_age_min: Optional[int] = None,
    vic_age_max: Optional[int] = None,
    weapon: Optional[List[str]] = None,
    relationship: Optional[List[str]] = None,
    circumstance: Optional[List[str]] = None,
    limit: int = 1000,
) -> MapCasesResponse:
    """Get individual case points for map marker display.
    
    Returns individual cases with coordinates for marker display.
    Limited to prevent overwhelming the frontend.
    
    Args:
        state: Filter by state name
        county: Filter by county FIPS code
        year_start: Filter by start year (inclusive)
        year_end: Filter by end year (inclusive)
        solved: Filter by solved status
        vic_sex: Filter by victim sex
        vic_race: Filter by victim race
        vic_age_min: Filter by minimum victim age
        vic_age_max: Filter by maximum victim age
        weapon: Filter by weapon type
        relationship: Filter by relationship
        circumstance: Filter by circumstance
        limit: Maximum number of cases to return (default 1000, max 5000)
        
    Returns:
        MapCasesResponse with case points and total count
    """
    logger.info(f"Getting case points for map (limit={limit})")
    
    # Enforce limit bounds
    limit = min(max(limit, 1), 5000)
    
    # Build filter conditions
    where_clause, params = _build_map_filter_conditions(
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
    )
    
    # Also require latitude/longitude for case points
    where_clause += " AND latitude IS NOT NULL AND longitude IS NOT NULL"
    
    # Count total matching cases
    count_query = f"""
        SELECT COUNT(*) as total
        FROM cases
        WHERE {where_clause}
    """
    
    # Get case points with limit
    query = f"""
        SELECT 
            id,
            latitude,
            longitude,
            year,
            solved,
            vic_sex,
            vic_age,
            weapon
        FROM cases
        WHERE {where_clause}
        ORDER BY year DESC, id
        LIMIT ?
    """
    
    logger.debug(f"Executing case points query: {query}")
    
    cases: List[MapCasePoint] = []
    total = 0
    
    with get_db_connection() as conn:
        # Get total count
        count_result = conn.execute(count_query, params).fetchone()
        total = count_result["total"] if count_result else 0
        
        # Get case points
        cursor = conn.execute(query, params + [limit])
        rows = cursor.fetchall()
        
        for row in rows:
            case_point = MapCasePoint(
                case_id=row["id"],
                latitude=row["latitude"],
                longitude=row["longitude"],
                year=row["year"],
                solved=bool(row["solved"]),
                victim_sex=row["vic_sex"],
                victim_age=row["vic_age"] if row["vic_age"] != 999 else None,
                weapon=row["weapon"],
            )
            cases.append(case_point)
    
    limited = total > limit
    
    logger.info(f"Returning {len(cases)} case points (total matching: {total}, limited: {limited})")
    
    return MapCasesResponse(
        cases=cases,
        total=total,
        limited=limited,
    )