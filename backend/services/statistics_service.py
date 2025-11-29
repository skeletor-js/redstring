"""Statistics data service for dashboard visualization.

Provides aggregation and query functions for statistics dashboard including
summary statistics, demographic breakdowns, weapon/circumstance/relationship
distributions, geographic statistics, trends, and seasonal patterns.
"""

import logging
from typing import Any, List, Optional, Tuple

from database.connection import get_db_connection
from models.statistics import (
    CategoryBreakdown,
    CircumstanceStatistics,
    CountyStatistic,
    DemographicBreakdown,
    DemographicsResponse,
    GeographicStatistics,
    RelationshipStatistics,
    SeasonalPattern,
    SeasonalStatistics,
    StateStatistic,
    StatisticsSummary,
    TrendStatistics,
    WeaponStatistics,
    YearlyTrendPoint,
)

logger = logging.getLogger(__name__)


# =============================================================================
# CONSTANTS
# =============================================================================

# Age group definitions
AGE_GROUPS = [
    ("0-17", 0, 17),
    ("18-24", 18, 24),
    ("25-34", 25, 34),
    ("35-44", 35, 44),
    ("45-54", 45, 54),
    ("55-64", 55, 64),
    ("65+", 65, 999),
]

# Month names for seasonal analysis
MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]


# =============================================================================
# FILTER QUERY BUILDER
# =============================================================================


def _build_statistics_filter_conditions(
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
# SUMMARY STATISTICS SERVICE
# =============================================================================


def get_summary_statistics(
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
) -> StatisticsSummary:
    """Get overall summary statistics for the filtered dataset.
    
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
    """
    logger.info("Getting summary statistics")
    
    where_clause, params = _build_statistics_filter_conditions(
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
    
    query = f"""
        SELECT 
            COUNT(*) as total_cases,
            SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solved_cases,
            SUM(CASE WHEN solved = 0 THEN 1 ELSE 0 END) as unsolved_cases,
            MIN(year) as start_year,
            MAX(year) as end_year,
            COUNT(DISTINCT state) as states_covered,
            COUNT(DISTINCT county_fips_code) as counties_covered
        FROM cases
        WHERE {where_clause}
    """
    
    with get_db_connection() as conn:
        cursor = conn.execute(query, params)
        row = cursor.fetchone()
        
        total_cases = row["total_cases"] or 0
        solved_cases = row["solved_cases"] or 0
        unsolved_cases = row["unsolved_cases"] or 0
        solve_rate = round((solved_cases / total_cases) * 100, 1) if total_cases > 0 else 0.0
        
        return StatisticsSummary(
            total_cases=total_cases,
            solved_cases=solved_cases,
            unsolved_cases=unsolved_cases,
            overall_solve_rate=solve_rate,
            date_range={
                "start_year": row["start_year"] or 0,
                "end_year": row["end_year"] or 0,
            },
            states_covered=row["states_covered"] or 0,
            counties_covered=row["counties_covered"] or 0,
        )


# =============================================================================
# DEMOGRAPHICS SERVICE
# =============================================================================


def get_demographics(
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
) -> DemographicsResponse:
    """Get demographic breakdowns by sex, race, and age group.
    
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
    """
    logger.info("Getting demographics statistics")
    
    where_clause, params = _build_statistics_filter_conditions(
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
    
    with get_db_connection() as conn:
        # Get total for percentage calculations
        total_query = f"SELECT COUNT(*) as total FROM cases WHERE {where_clause}"
        total_row = conn.execute(total_query, params).fetchone()
        total_cases = total_row["total"] or 0
        
        # Breakdown by sex
        sex_query = f"""
            SELECT 
                vic_sex as category,
                COUNT(*) as total_cases,
                SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solved_cases,
                SUM(CASE WHEN solved = 0 THEN 1 ELSE 0 END) as unsolved_cases
            FROM cases
            WHERE {where_clause}
            GROUP BY vic_sex
            ORDER BY total_cases DESC
        """
        sex_rows = conn.execute(sex_query, params).fetchall()
        by_sex = _build_demographic_breakdowns(sex_rows, total_cases)
        
        # Breakdown by race
        race_query = f"""
            SELECT 
                vic_race as category,
                COUNT(*) as total_cases,
                SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solved_cases,
                SUM(CASE WHEN solved = 0 THEN 1 ELSE 0 END) as unsolved_cases
            FROM cases
            WHERE {where_clause}
            GROUP BY vic_race
            ORDER BY total_cases DESC
        """
        race_rows = conn.execute(race_query, params).fetchall()
        by_race = _build_demographic_breakdowns(race_rows, total_cases)
        
        # Breakdown by age group
        by_age_group = _get_age_group_breakdown(conn, where_clause, params, total_cases)
        
        return DemographicsResponse(
            by_sex=by_sex,
            by_race=by_race,
            by_age_group=by_age_group,
        )


def _build_demographic_breakdowns(
    rows: List[Any],
    total_cases: int
) -> List[DemographicBreakdown]:
    """Build demographic breakdown list from query results."""
    breakdowns = []
    for row in rows:
        category = row["category"] or "Unknown"
        row_total = row["total_cases"] or 0
        row_solved = row["solved_cases"] or 0
        row_unsolved = row["unsolved_cases"] or 0
        solve_rate = round((row_solved / row_total) * 100, 1) if row_total > 0 else 0.0
        percentage = round((row_total / total_cases) * 100, 1) if total_cases > 0 else 0.0
        
        breakdowns.append(DemographicBreakdown(
            category=category,
            total_cases=row_total,
            solved_cases=row_solved,
            unsolved_cases=row_unsolved,
            solve_rate=solve_rate,
            percentage_of_total=percentage,
        ))
    return breakdowns


def _get_age_group_breakdown(
    conn: Any,
    where_clause: str,
    params: List[Any],
    total_cases: int
) -> List[DemographicBreakdown]:
    """Get breakdown by age groups."""
    breakdowns = []
    
    for group_name, min_age, max_age in AGE_GROUPS:
        # Build query for this age group
        age_query = f"""
            SELECT 
                COUNT(*) as total_cases,
                SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solved_cases,
                SUM(CASE WHEN solved = 0 THEN 1 ELSE 0 END) as unsolved_cases
            FROM cases
            WHERE {where_clause}
              AND vic_age >= ?
              AND vic_age <= ?
        """
        age_params = params + [min_age, max_age]
        row = conn.execute(age_query, age_params).fetchone()
        
        row_total = row["total_cases"] or 0
        row_solved = row["solved_cases"] or 0
        row_unsolved = row["unsolved_cases"] or 0
        solve_rate = round((row_solved / row_total) * 100, 1) if row_total > 0 else 0.0
        percentage = round((row_total / total_cases) * 100, 1) if total_cases > 0 else 0.0
        
        breakdowns.append(DemographicBreakdown(
            category=group_name,
            total_cases=row_total,
            solved_cases=row_solved,
            unsolved_cases=row_unsolved,
            solve_rate=solve_rate,
            percentage_of_total=percentage,
        ))
    
    return breakdowns


# =============================================================================
# WEAPON STATISTICS SERVICE
# =============================================================================


def get_weapon_statistics(
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
) -> WeaponStatistics:
    """Get weapon type distribution statistics.
    
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
    """
    logger.info("Getting weapon statistics")
    
    where_clause, params = _build_statistics_filter_conditions(
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
    
    query = f"""
        SELECT 
            weapon as category,
            COUNT(*) as count,
            SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solved_count
        FROM cases
        WHERE {where_clause}
        GROUP BY weapon
        ORDER BY count DESC
    """
    
    with get_db_connection() as conn:
        # Get total for percentage calculations
        total_query = f"SELECT COUNT(*) as total FROM cases WHERE {where_clause}"
        total_row = conn.execute(total_query, params).fetchone()
        total_cases = total_row["total"] or 0
        
        rows = conn.execute(query, params).fetchall()
        weapons = _build_category_breakdowns(rows, total_cases)
        
        return WeaponStatistics(
            weapons=weapons,
            total_cases=total_cases,
        )


# =============================================================================
# CIRCUMSTANCE STATISTICS SERVICE
# =============================================================================


def get_circumstance_statistics(
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
) -> CircumstanceStatistics:
    """Get circumstance distribution statistics.
    
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
    """
    logger.info("Getting circumstance statistics")
    
    where_clause, params = _build_statistics_filter_conditions(
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
    
    query = f"""
        SELECT 
            circumstance as category,
            COUNT(*) as count,
            SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solved_count
        FROM cases
        WHERE {where_clause}
        GROUP BY circumstance
        ORDER BY count DESC
    """
    
    with get_db_connection() as conn:
        # Get total for percentage calculations
        total_query = f"SELECT COUNT(*) as total FROM cases WHERE {where_clause}"
        total_row = conn.execute(total_query, params).fetchone()
        total_cases = total_row["total"] or 0
        
        rows = conn.execute(query, params).fetchall()
        circumstances = _build_category_breakdowns(rows, total_cases)
        
        return CircumstanceStatistics(
            circumstances=circumstances,
            total_cases=total_cases,
        )


# =============================================================================
# RELATIONSHIP STATISTICS SERVICE
# =============================================================================


def get_relationship_statistics(
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
) -> RelationshipStatistics:
    """Get victim-offender relationship distribution statistics.
    
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
    """
    logger.info("Getting relationship statistics")
    
    where_clause, params = _build_statistics_filter_conditions(
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
    
    query = f"""
        SELECT 
            relationship as category,
            COUNT(*) as count,
            SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solved_count
        FROM cases
        WHERE {where_clause}
        GROUP BY relationship
        ORDER BY count DESC
    """
    
    with get_db_connection() as conn:
        # Get total for percentage calculations
        total_query = f"SELECT COUNT(*) as total FROM cases WHERE {where_clause}"
        total_row = conn.execute(total_query, params).fetchone()
        total_cases = total_row["total"] or 0
        
        rows = conn.execute(query, params).fetchall()
        relationships = _build_category_breakdowns(rows, total_cases)
        
        return RelationshipStatistics(
            relationships=relationships,
            total_cases=total_cases,
        )


def _build_category_breakdowns(
    rows: List[Any],
    total_cases: int
) -> List[CategoryBreakdown]:
    """Build category breakdown list from query results."""
    breakdowns = []
    for row in rows:
        category = row["category"] or "Unknown"
        count = row["count"] or 0
        solved_count = row["solved_count"] or 0
        solve_rate = round((solved_count / count) * 100, 1) if count > 0 else 0.0
        percentage = round((count / total_cases) * 100, 1) if total_cases > 0 else 0.0
        
        breakdowns.append(CategoryBreakdown(
            category=category,
            count=count,
            percentage=percentage,
            solve_rate=solve_rate,
        ))
    return breakdowns


# =============================================================================
# GEOGRAPHIC STATISTICS SERVICE
# =============================================================================


def get_geographic_statistics(
    top_n: int = 10,
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
) -> GeographicStatistics:
    """Get geographic distribution statistics.
    
    Args:
        top_n: Number of top states/counties to return
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
    """
    logger.info(f"Getting geographic statistics (top {top_n})")
    
    try:
        where_clause, params = _build_statistics_filter_conditions(
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
        
        logger.debug(f"Geographic stats WHERE clause: {where_clause}")
        logger.debug(f"Geographic stats params: {params}")
        
        # Top states query
        state_query = f"""
            SELECT
                state,
                COUNT(*) as total_cases,
                SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solved_cases,
                SUM(CASE WHEN solved = 0 THEN 1 ELSE 0 END) as unsolved_cases
            FROM cases
            WHERE {where_clause}
            GROUP BY state
            ORDER BY total_cases DESC
            LIMIT ?
        """
        
        # Top counties query
        county_query = f"""
            SELECT
                cntyfips as county,
                state,
                county_fips_code,
                COUNT(*) as total_cases,
                SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solved_cases,
                SUM(CASE WHEN solved = 0 THEN 1 ELSE 0 END) as unsolved_cases
            FROM cases
            WHERE {where_clause}
            GROUP BY county_fips_code
            ORDER BY total_cases DESC
            LIMIT ?
        """
        
        with get_db_connection() as conn:
            logger.debug("Executing state query for geographic statistics")
            # Get top states
            state_rows = conn.execute(state_query, params + [top_n]).fetchall()
            logger.debug(f"Retrieved {len(state_rows)} state rows")
            
            top_states = []
            for row in state_rows:
                total = row["total_cases"] or 0
                solved_count = row["solved_cases"] or 0
                unsolved_count = row["unsolved_cases"] or 0
                solve_rate = round((solved_count / total) * 100, 1) if total > 0 else 0.0
                
                top_states.append(StateStatistic(
                    state=row["state"] or "Unknown",
                    total_cases=total,
                    solved_cases=solved_count,
                    unsolved_cases=unsolved_count,
                    solve_rate=solve_rate,
                ))
            
            logger.debug("Executing county query for geographic statistics")
            # Get top counties
            county_rows = conn.execute(county_query, params + [top_n]).fetchall()
            logger.debug(f"Retrieved {len(county_rows)} county rows")
            
            top_counties = []
            for row in county_rows:
                total = row["total_cases"] or 0
                solved_count = row["solved_cases"] or 0
                unsolved_count = row["unsolved_cases"] or 0
                solve_rate = round((solved_count / total) * 100, 1) if total > 0 else 0.0
                
                top_counties.append(CountyStatistic(
                    county=row["county"] or "Unknown",
                    state=row["state"] or "Unknown",
                    county_fips=row["county_fips_code"] or 0,
                    total_cases=total,
                    solved_cases=solved_count,
                    unsolved_cases=unsolved_count,
                    solve_rate=solve_rate,
                ))
            
            logger.info(f"Geographic statistics complete: {len(top_states)} states, {len(top_counties)} counties")
            return GeographicStatistics(
                top_states=top_states,
                top_counties=top_counties,
            )
    except Exception as e:
        logger.error(f"Error in get_geographic_statistics: {type(e).__name__}: {e}", exc_info=True)
        raise


# =============================================================================
# TREND STATISTICS SERVICE
# =============================================================================


def get_trend_statistics(
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
) -> TrendStatistics:
    """Get yearly trend statistics with trend analysis.
    
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
    """
    logger.info("Getting trend statistics")
    
    where_clause, params = _build_statistics_filter_conditions(
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
    
    query = f"""
        SELECT 
            year,
            COUNT(*) as total_cases,
            SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solved_cases,
            SUM(CASE WHEN solved = 0 THEN 1 ELSE 0 END) as unsolved_cases
        FROM cases
        WHERE {where_clause}
        GROUP BY year
        ORDER BY year
    """
    
    with get_db_connection() as conn:
        rows = conn.execute(query, params).fetchall()
        
        yearly_data = []
        solve_rates = []
        total_cases_sum = 0
        
        for row in rows:
            year = row["year"]
            total = row["total_cases"] or 0
            solved = row["solved_cases"] or 0
            unsolved = row["unsolved_cases"] or 0
            solve_rate = round((solved / total) * 100, 1) if total > 0 else 0.0
            
            yearly_data.append(YearlyTrendPoint(
                year=year,
                total_cases=total,
                solved_cases=solved,
                unsolved_cases=unsolved,
                solve_rate=solve_rate,
            ))
            
            solve_rates.append(solve_rate)
            total_cases_sum += total
        
        # Calculate trend direction based on solve rate
        overall_trend = _calculate_trend_direction(solve_rates)
        
        # Calculate average annual cases
        num_years = len(yearly_data)
        average_annual_cases = round(total_cases_sum / num_years, 1) if num_years > 0 else 0.0
        
        return TrendStatistics(
            yearly_data=yearly_data,
            overall_trend=overall_trend,
            average_annual_cases=average_annual_cases,
        )


def _calculate_trend_direction(values: List[float]) -> str:
    """Calculate trend direction from a list of values.
    
    Uses simple linear regression slope to determine trend.
    
    Args:
        values: List of numeric values over time
        
    Returns:
        "increasing", "decreasing", or "stable"
    """
    if len(values) < 2:
        return "stable"
    
    n = len(values)
    
    # Calculate means
    x_mean = (n - 1) / 2  # Mean of 0, 1, 2, ..., n-1
    y_mean = sum(values) / n
    
    # Calculate slope using least squares
    numerator = 0.0
    denominator = 0.0
    
    for i, y in enumerate(values):
        numerator += (i - x_mean) * (y - y_mean)
        denominator += (i - x_mean) ** 2
    
    if denominator == 0:
        return "stable"
    
    slope = numerator / denominator
    
    # Determine trend based on slope magnitude
    # Use a threshold to avoid calling small changes a trend
    threshold = 0.5  # 0.5% change per year
    
    if slope > threshold:
        return "increasing"
    elif slope < -threshold:
        return "decreasing"
    else:
        return "stable"


# =============================================================================
# SEASONAL STATISTICS SERVICE
# =============================================================================


def get_seasonal_statistics(
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
) -> SeasonalStatistics:
    """Get seasonal (monthly) pattern statistics.
    
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
    """
    logger.info("Getting seasonal statistics")
    
    where_clause, params = _build_statistics_filter_conditions(
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
    
    # Get monthly totals and year count for averaging
    query = f"""
        SELECT 
            month,
            COUNT(*) as total_cases,
            COUNT(DISTINCT year) as num_years
        FROM cases
        WHERE {where_clause}
        GROUP BY month
        ORDER BY month
    """
    
    # Get total cases for percentage calculation
    total_query = f"SELECT COUNT(*) as total FROM cases WHERE {where_clause}"
    
    with get_db_connection() as conn:
        total_row = conn.execute(total_query, params).fetchone()
        total_cases = total_row["total"] or 0
        
        rows = conn.execute(query, params).fetchall()
        
        patterns = []
        peak_avg = 0.0
        peak_month = ""
        lowest_avg = float('inf')
        lowest_month = ""
        
        # Create a dict for quick lookup
        month_data = {row["month"]: row for row in rows}
        
        for month_num in range(1, 13):
            month_name = MONTH_NAMES[month_num - 1]
            
            if month_num in month_data:
                row = month_data[month_num]
                total = row["total_cases"] or 0
                num_years = row["num_years"] or 1
                average_cases = round(total / num_years, 1)
                percentage = round((total / total_cases) * 100, 1) if total_cases > 0 else 0.0
            else:
                average_cases = 0.0
                percentage = 0.0
            
            patterns.append(SeasonalPattern(
                month=month_num,
                month_name=month_name,
                average_cases=average_cases,
                percentage_of_annual=percentage,
            ))
            
            # Track peak and lowest months
            if average_cases > peak_avg:
                peak_avg = average_cases
                peak_month = month_name
            if average_cases < lowest_avg:
                lowest_avg = average_cases
                lowest_month = month_name
        
        # Handle edge case where no data
        if not peak_month:
            peak_month = "N/A"
        if not lowest_month or lowest_avg == float('inf'):
            lowest_month = "N/A"
        
        return SeasonalStatistics(
            patterns=patterns,
            peak_month=peak_month,
            lowest_month=lowest_month,
        )