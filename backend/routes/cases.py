"""Case filtering and retrieval API endpoints.

Provides REST API endpoints for querying homicide cases with comprehensive
filtering, pagination, and statistics. Supports 894,636 cases from 1976-2023.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from database.queries.cases import (
    get_case_by_id,
    get_cases_paginated,
    get_filter_stats,
)
from models.case import (
    CaseFilter,
    CaseListResponse,
    CaseResponse,
    PaginationInfo,
    StatsSummary,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["cases"])

# =============================================================================
# ENDPOINTS
# =============================================================================


@router.get("/cases", response_model=CaseListResponse)
async def list_cases(
    # Demographic filters
    states: Optional[str] = Query(
        None, description="Comma-separated state names (e.g., 'ILLINOIS,CALIFORNIA')"
    ),
    vic_sex: Optional[str] = Query(
        None, description="Comma-separated victim sex (e.g., 'Male,Female')"
    ),
    vic_race: Optional[str] = Query(None, description="Comma-separated victim race"),
    vic_ethnic: Optional[str] = Query(
        None, description="Comma-separated victim ethnicity"
    ),
    vic_age_min: Optional[int] = Query(
        None, ge=0, le=999, description="Minimum victim age (0-99, 999=unknown)"
    ),
    vic_age_max: Optional[int] = Query(
        None, ge=0, le=999, description="Maximum victim age (0-99, 999=unknown)"
    ),
    include_unknown_age: bool = Query(
        False, description="Include cases with unknown age (999)"
    ),
    # Temporal filters
    year_min: Optional[int] = Query(
        None, ge=1976, le=2023, description="Minimum year (1976-2023)"
    ),
    year_max: Optional[int] = Query(
        None, ge=1976, le=2023, description="Maximum year (1976-2023)"
    ),
    # Case status
    solved: Optional[int] = Query(
        None, ge=0, le=1, description="Solved status: 0=unsolved, 1=solved"
    ),
    # Crime characteristics
    weapon: Optional[str] = Query(None, description="Comma-separated weapon types"),
    relationship: Optional[str] = Query(
        None, description="Comma-separated relationships"
    ),
    circumstance: Optional[str] = Query(
        None, description="Comma-separated circumstances"
    ),
    situation: Optional[str] = Query(None, description="Comma-separated situations"),
    # Geographic filters
    county: Optional[str] = Query(None, description="Comma-separated county names"),
    msa: Optional[str] = Query(None, description="Comma-separated MSA names"),
    # Search filters
    agency_search: Optional[str] = Query(
        None, description="Agency name substring (case-insensitive)"
    ),
    case_id: Optional[str] = Query(None, description="Exact case ID match"),
    # Pagination
    cursor: Optional[str] = Query(None, description="Pagination cursor (year:id)"),
    limit: int = Query(100, ge=1, le=10000, description="Results per page (max 10000)"),
):
    """Get paginated list of cases with optional filtering.

    Supports comprehensive filtering across all case dimensions. Results are
    ordered by year (descending) and case ID for stable pagination.

    Query parameters:
    - Demographic: states, vic_sex, vic_race, vic_ethnic, vic_age_min/max
    - Temporal: year_min, year_max
    - Status: solved (0 or 1)
    - Crime: weapon, relationship, circumstance, situation
    - Geographic: county, msa
    - Search: agency_search, case_id
    - Pagination: cursor, limit

    Performance targets:
    - Single filter: <500ms
    - Multi-filter: <2s
    - Large result warning if total > 50,000

    Returns:
        CaseListResponse with paginated cases and pagination metadata

    Raises:
        HTTPException: 500 if query execution fails

    Example:
        GET /api/cases?states=ILLINOIS&year_min=1990&solved=0&limit=100
        {
            "cases": [...],
            "pagination": {
                "next_cursor": "1995:IL-12345",
                "has_more": true,
                "current_page_size": 100,
                "total_count": 1523,
                "large_result_warning": false
            }
        }
    """
    try:
        # Parse comma-separated list parameters
        def parse_list(value: Optional[str]) -> Optional[list]:
            return value.split(",") if value else None

        # Build filter object
        filters = CaseFilter(
            states=parse_list(states),
            vic_sex=parse_list(vic_sex),
            vic_race=parse_list(vic_race),
            vic_ethnic=parse_list(vic_ethnic),
            vic_age_min=vic_age_min,
            vic_age_max=vic_age_max,
            include_unknown_age=include_unknown_age,
            year_min=year_min,
            year_max=year_max,
            solved=solved,
            weapon=parse_list(weapon),
            relationship=parse_list(relationship),
            circumstance=parse_list(circumstance),
            situation=parse_list(situation),
            county=parse_list(county),
            msa=parse_list(msa),
            agency_search=agency_search,
            case_id=case_id,
            cursor=cursor,
            limit=limit,
        )

        logger.info(f"Fetching cases with filters: {filters.model_dump()}")

        # Execute query
        cases, next_cursor, total_count = get_cases_paginated(filters)

        # Convert to response models
        case_responses = [CaseResponse(**case) for case in cases]

        # Build pagination info
        pagination = PaginationInfo(
            next_cursor=next_cursor,
            has_more=next_cursor is not None,
            current_page_size=len(case_responses),
            total_count=total_count,
            large_result_warning=total_count > 50000,
        )

        logger.info(
            f"Returning {len(case_responses)} cases "
            f"(total: {total_count}, has_more: {pagination.has_more})"
        )

        return CaseListResponse(cases=case_responses, pagination=pagination)

    except ValueError as e:
        logger.error(f"Invalid filter parameters: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid parameters: {str(e)}")

    except Exception as e:
        logger.error(f"Error fetching cases: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail="Failed to fetch cases. Please try again."
        )


@router.get("/cases/{case_id}", response_model=CaseResponse)
async def get_case(case_id: str):
    """Get detailed information for a single case.

    Args:
        case_id: Case ID string (e.g., "IL-12345-1990")

    Returns:
        CaseResponse with full case details

    Raises:
        HTTPException: 404 if case not found, 500 on query error

    Example:
        GET /api/cases/IL-12345-1990
        {
            "id": "IL-12345-1990",
            "state": "ILLINOIS",
            "year": 1990,
            "solved": 0,
            "vic_sex": "Female",
            ...
        }
    """
    try:
        logger.info(f"Fetching case: {case_id}")

        case = get_case_by_id(case_id)

        if not case:
            logger.warning(f"Case not found: {case_id}")
            raise HTTPException(status_code=404, detail="Case not found")

        return CaseResponse(**case)

    except HTTPException:
        # Re-raise HTTP exceptions (404)
        raise

    except Exception as e:
        logger.error(f"Error fetching case {case_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail="Failed to fetch case. Please try again."
        )


@router.get("/stats/summary", response_model=StatsSummary)
async def get_statistics(
    # Same filter parameters as list_cases (excluding pagination)
    states: Optional[str] = Query(None, description="Comma-separated state names"),
    vic_sex: Optional[str] = Query(None, description="Comma-separated victim sex"),
    vic_race: Optional[str] = Query(None, description="Comma-separated victim race"),
    vic_ethnic: Optional[str] = Query(
        None, description="Comma-separated victim ethnicity"
    ),
    vic_age_min: Optional[int] = Query(
        None, ge=0, le=999, description="Minimum victim age"
    ),
    vic_age_max: Optional[int] = Query(
        None, ge=0, le=999, description="Maximum victim age"
    ),
    include_unknown_age: bool = Query(False, description="Include unknown age cases"),
    year_min: Optional[int] = Query(None, ge=1976, le=2023, description="Minimum year"),
    year_max: Optional[int] = Query(None, ge=1976, le=2023, description="Maximum year"),
    solved: Optional[int] = Query(None, ge=0, le=1, description="Solved status"),
    weapon: Optional[str] = Query(None, description="Comma-separated weapon types"),
    relationship: Optional[str] = Query(
        None, description="Comma-separated relationships"
    ),
    circumstance: Optional[str] = Query(
        None, description="Comma-separated circumstances"
    ),
    situation: Optional[str] = Query(None, description="Comma-separated situations"),
    county: Optional[str] = Query(None, description="Comma-separated county names"),
    msa: Optional[str] = Query(None, description="Comma-separated MSA names"),
    agency_search: Optional[str] = Query(None, description="Agency name substring"),
    case_id: Optional[str] = Query(None, description="Exact case ID"),
):
    """Get statistical summary for filtered cases.

    Calculates aggregate counts and solve rate for cases matching the
    provided filter criteria. Does not perform pagination.

    Query parameters: Same as /api/cases (except cursor and limit)

    Returns:
        StatsSummary with counts and solve rate

    Raises:
        HTTPException: 500 if query execution fails

    Example:
        GET /api/stats/summary?states=ILLINOIS&year_min=1990&solved=0
        {
            "total_cases": 15234,
            "solved_cases": 0,
            "unsolved_cases": 15234,
            "solve_rate": 0.0
        }
    """
    try:
        # Parse comma-separated list parameters
        def parse_list(value: Optional[str]) -> Optional[list]:
            return value.split(",") if value else None

        # Build filter object (no pagination)
        filters = CaseFilter(
            states=parse_list(states),
            vic_sex=parse_list(vic_sex),
            vic_race=parse_list(vic_race),
            vic_ethnic=parse_list(vic_ethnic),
            vic_age_min=vic_age_min,
            vic_age_max=vic_age_max,
            include_unknown_age=include_unknown_age,
            year_min=year_min,
            year_max=year_max,
            solved=solved,
            weapon=parse_list(weapon),
            relationship=parse_list(relationship),
            circumstance=parse_list(circumstance),
            situation=parse_list(situation),
            county=parse_list(county),
            msa=parse_list(msa),
            agency_search=agency_search,
            case_id=case_id,
        )

        logger.info(f"Calculating statistics with filters: {filters.model_dump()}")

        # Get statistics
        stats = get_filter_stats(filters)

        logger.info(f"Statistics: {stats}")

        return StatsSummary(**stats)

    except ValueError as e:
        logger.error(f"Invalid filter parameters: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid parameters: {str(e)}")

    except Exception as e:
        logger.error(f"Error calculating statistics: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail="Failed to calculate statistics. Please try again."
        )
