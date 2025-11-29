"""SQL query builder for case filtering and retrieval.

Provides functions to build parameterized SQL queries with complex filtering,
cursor-based pagination, and statistics calculation. All queries are optimized
to leverage existing database indexes.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

from database.connection import get_db_connection
from models.case import CaseFilter

logger = logging.getLogger(__name__)

# =============================================================================
# QUERY BUILDER
# =============================================================================


def build_filter_query(filters: CaseFilter) -> Tuple[str, List[Any]]:
    """Build parameterized SQL query from filter criteria.

    Constructs WHERE clause and parameter list for case filtering. Uses
    parameterized queries to prevent SQL injection. Optimized to leverage
    existing indexes on state, year, solved, vic_sex, weapon_code, etc.

    Args:
        filters: CaseFilter object with filter criteria

    Returns:
        Tuple of (WHERE clause SQL, parameter list)

    Example:
        sql, params = build_filter_query(filters)
        query = f"SELECT * FROM cases WHERE {sql} ORDER BY year DESC, id"
    """
    conditions: List[str] = []
    params: List[Any] = []

    # State filter (indexed)
    # Note: Database stores states in Title Case (e.g., "California")
    # Frontend sends UPPERCASE (e.g., "CALIFORNIA")
    # We use UPPER() for case-insensitive matching
    if filters.states:
        upper_states = [s.upper() for s in filters.states]
        placeholders = ",".join("?" * len(upper_states))
        conditions.append(f"UPPER(state) IN ({placeholders})")
        params.extend(upper_states)

    # Year range filter (indexed)
    if filters.year_min is not None:
        conditions.append("year >= ?")
        params.append(filters.year_min)
    if filters.year_max is not None:
        conditions.append("year <= ?")
        params.append(filters.year_max)

    # Solved status filter (indexed)
    if filters.solved is not None:
        conditions.append("solved = ?")
        params.append(filters.solved)

    # Victim sex filter (indexed)
    if filters.vic_sex:
        placeholders = ",".join("?" * len(filters.vic_sex))
        conditions.append(f"vic_sex IN ({placeholders})")
        params.extend(filters.vic_sex)

    # Victim race filter (indexed)
    if filters.vic_race:
        placeholders = ",".join("?" * len(filters.vic_race))
        conditions.append(f"vic_race IN ({placeholders})")
        params.extend(filters.vic_race)

    # Victim ethnicity filter
    if filters.vic_ethnic:
        placeholders = ",".join("?" * len(filters.vic_ethnic))
        conditions.append(f"vic_ethnic IN ({placeholders})")
        params.extend(filters.vic_ethnic)

    # Victim age range filter (indexed)
    # Special handling: 999 = unknown age
    if filters.vic_age_min is not None or filters.vic_age_max is not None:
        age_conditions: List[str] = []

        if filters.vic_age_min is not None and filters.vic_age_max is not None:
            # Both min and max specified
            age_conditions.append("(vic_age >= ? AND vic_age <= ?)")
            params.extend([filters.vic_age_min, filters.vic_age_max])
        elif filters.vic_age_min is not None:
            # Only min specified
            age_conditions.append("vic_age >= ?")
            params.append(filters.vic_age_min)
        elif filters.vic_age_max is not None:
            # Only max specified
            age_conditions.append("vic_age <= ?")
            params.append(filters.vic_age_max)

        # Include unknown age (999) if requested
        if filters.include_unknown_age:
            age_conditions.append("vic_age = 999")

        # Combine age conditions with OR
        if len(age_conditions) > 1:
            conditions.append(f"({' OR '.join(age_conditions)})")
        else:
            conditions.append(age_conditions[0])
    elif filters.include_unknown_age:
        # Only unknown age filter without min/max
        conditions.append("vic_age = 999")

    # Weapon filter (indexed on weapon_code)
    if filters.weapon:
        placeholders = ",".join("?" * len(filters.weapon))
        conditions.append(f"weapon IN ({placeholders})")
        params.extend(filters.weapon)

    # Relationship filter
    if filters.relationship:
        placeholders = ",".join("?" * len(filters.relationship))
        conditions.append(f"relationship IN ({placeholders})")
        params.extend(filters.relationship)

    # Circumstance filter
    if filters.circumstance:
        placeholders = ",".join("?" * len(filters.circumstance))
        conditions.append(f"circumstance IN ({placeholders})")
        params.extend(filters.circumstance)

    # Situation filter
    if filters.situation:
        placeholders = ",".join("?" * len(filters.situation))
        conditions.append(f"situation IN ({placeholders})")
        params.extend(filters.situation)

    # County filter (indexed on county_fips_code)
    if filters.county:
        placeholders = ",".join("?" * len(filters.county))
        conditions.append(f"cntyfips IN ({placeholders})")
        params.extend(filters.county)

    # MSA filter (indexed)
    if filters.msa:
        placeholders = ",".join("?" * len(filters.msa))
        conditions.append(f"msa IN ({placeholders})")
        params.extend(filters.msa)

    # Agency search (substring match, case-insensitive)
    if filters.agency_search:
        conditions.append("agency LIKE ?")
        params.append(f"%{filters.agency_search}%")

    # Case ID exact match
    if filters.case_id:
        conditions.append("id = ?")
        params.append(filters.case_id)

    # Cursor pagination
    # Format: "year:id" - ensures stable ordering and efficient pagination
    if filters.cursor:
        try:
            cursor_year, cursor_id = filters.cursor.split(":", 1)
            # Continue from after cursor position
            # Using (year, id) composite comparison for efficiency
            conditions.append("(year < ? OR (year = ? AND id > ?))")
            params.extend([int(cursor_year), int(cursor_year), cursor_id])
        except (ValueError, IndexError):
            logger.warning(f"Invalid cursor format: {filters.cursor}")
            # Ignore invalid cursor and start from beginning

    # Combine all conditions
    where_clause = " AND ".join(conditions) if conditions else "1=1"

    return where_clause, params


# =============================================================================
# QUERY EXECUTION
# =============================================================================


def get_cases_paginated(
    filters: CaseFilter,
) -> Tuple[List[Dict[str, Any]], Optional[str], int]:
    """Execute paginated case query with filters.

    Retrieves cases matching filter criteria with cursor-based pagination.
    Returns results ordered by year DESC, id ASC for stable pagination.

    Args:
        filters: CaseFilter object with filter criteria and pagination params

    Returns:
        Tuple of:
        - List of case dictionaries
        - Next cursor string (None if no more results)
        - Total count of matching records

    Raises:
        sqlite3.OperationalError: If query execution fails

    Example:
        cases, next_cursor, total = get_cases_paginated(filters)
        has_more = next_cursor is not None
    """
    where_clause, params = build_filter_query(filters)

    # Build main query with pagination
    # Order by year DESC (most recent first), then id for stable ordering
    query = f"""
        SELECT *
        FROM cases
        WHERE {where_clause}
        ORDER BY year DESC, id ASC
        LIMIT ?
    """

    # Add limit + 1 to detect if there are more results
    query_params = params + [filters.limit + 1]

    logger.debug(f"Executing query: {query}")
    logger.debug(f"Parameters: {query_params}")

    with get_db_connection() as conn:
        # Execute main query
        cursor = conn.execute(query, query_params)
        rows = cursor.fetchall()

        # Get total count (for statistics and large result warning)
        count_query = f"""
            SELECT COUNT(*) as total
            FROM cases
            WHERE {where_clause}
        """
        count_result = conn.execute(count_query, params).fetchone()
        total_count = count_result["total"] if count_result else 0

    # Convert rows to dictionaries
    cases = [dict(row) for row in rows[: filters.limit]]

    # Determine if there are more results
    has_more = len(rows) > filters.limit
    next_cursor = None

    if has_more and cases:
        # Create cursor from last case
        last_case = cases[-1]
        next_cursor = f"{last_case['year']}:{last_case['id']}"

    logger.info(f"Query returned {len(cases)} cases (total matching: {total_count})")

    return cases, next_cursor, total_count


def get_case_by_id(case_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a single case by ID.

    Args:
        case_id: Case ID string

    Returns:
        Case dictionary or None if not found

    Raises:
        sqlite3.OperationalError: If query execution fails

    Example:
        case = get_case_by_id("IL-12345-1990")
        if case:
            print(f"Found case in {case['state']}")
    """
    query = "SELECT * FROM cases WHERE id = ?"

    logger.debug(f"Fetching case by ID: {case_id}")

    try:
        with get_db_connection() as conn:
            cursor = conn.execute(query, [case_id])
            row = cursor.fetchone()

            if row:
                return dict(row)
            else:
                logger.info(f"Case not found: {case_id}")
                return None

    except Exception as e:
        logger.error(f"Error fetching case {case_id}: {e}", exc_info=True)
        raise


def get_unique_state_values() -> List[str]:
    """Get all unique state values from the database.
    
    Returns:
        List of unique state values as they appear in the database
    """
    query = "SELECT DISTINCT state FROM cases ORDER BY state LIMIT 100"
    
    with get_db_connection() as conn:
        cursor = conn.execute(query)
        rows = cursor.fetchall()
        states = [row["state"] for row in rows if row["state"]]
        
    return states


def get_filter_stats(filters: CaseFilter) -> Dict[str, Any]:
    """Calculate statistics for filtered case set.

    Computes aggregate counts and solve rate for cases matching the
    provided filter criteria. Does not include pagination parameters.

    Args:
        filters: CaseFilter object (pagination params ignored)

    Returns:
        Dictionary with statistics:
        - total_cases: Total matching cases
        - solved_cases: Number of solved cases
        - unsolved_cases: Number of unsolved cases
        - solve_rate: Percentage solved (0-100)

    Raises:
        sqlite3.OperationalError: If query execution fails

    Example:
        stats = get_filter_stats(filters)
        print(f"Solve rate: {stats['solve_rate']:.1f}%")
    """
    # Build filter query (ignore cursor/limit for stats)
    filter_copy = filters.model_copy()
    filter_copy.cursor = None
    where_clause, params = build_filter_query(filter_copy)

    # Query for aggregate statistics
    query = f"""
        SELECT
            COUNT(*) as total_cases,
            SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solved_cases,
            SUM(CASE WHEN solved = 0 THEN 1 ELSE 0 END) as unsolved_cases
        FROM cases
        WHERE {where_clause}
    """

    logger.debug(f"Calculating stats with query: {query}")

    with get_db_connection() as conn:
        cursor = conn.execute(query, params)
        result = cursor.fetchone()

        if result and result["total_cases"] > 0:
            total = result["total_cases"]
            solved = result["solved_cases"] or 0
            unsolved = result["unsolved_cases"] or 0
            solve_rate = round((solved / total) * 100, 1) if total > 0 else 0.0

            stats = {
                "total_cases": total,
                "solved_cases": solved,
                "unsolved_cases": unsolved,
                "solve_rate": solve_rate,
            }
        else:
            # No matching cases
            stats = {
                "total_cases": 0,
                "solved_cases": 0,
                "unsolved_cases": 0,
                "solve_rate": 0.0,
            }

    logger.info(f"Stats calculated: {stats}")

    return stats
