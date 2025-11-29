"""Similarity API routes for finding similar cases.

Provides endpoints for case similarity search with weighted
multi-factor scoring.
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from analysis.similarity import find_similar_cases

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/similarity", tags=["similarity"])


# =============================================================================
# RESPONSE MODELS
# =============================================================================


class MatchingFactors(BaseModel):
    """Breakdown of similarity scores by factor."""

    weapon: float = Field(description="Weapon match score (0-100)")
    geographic: float = Field(description="Geographic proximity score (0-100)")
    victim_age: float = Field(description="Victim age similarity score (0-100)")
    temporal: float = Field(description="Temporal proximity score (0-100)")
    victim_race: float = Field(description="Victim race match score (0-100)")
    circumstance: float = Field(description="Circumstance match score (0-100)")
    relationship: float = Field(description="Relationship match score (0-100)")


class SimilarCaseResponse(BaseModel):
    """Response model for a similar case."""

    case_id: str = Field(description="Case ID")
    similarity_score: float = Field(description="Overall similarity score (0-100)")
    matching_factors: MatchingFactors = Field(
        description="Individual factor scores"
    )
    year: int = Field(description="Year of the case")
    state: str = Field(description="State where case occurred")
    weapon: Optional[str] = Field(description="Weapon used")
    vic_age: Optional[int] = Field(description="Victim age")
    vic_sex: Optional[str] = Field(description="Victim sex")
    vic_race: Optional[str] = Field(description="Victim race")
    solved: int = Field(description="Solved status (0=unsolved, 1=solved)")
    circumstance: Optional[str] = Field(description="Circumstance")
    relationship: Optional[str] = Field(description="Victim-offender relationship")


class FindSimilarResponse(BaseModel):
    """Response model for find similar cases endpoint."""

    reference_case_id: str = Field(description="ID of the reference case")
    similar_cases: List[SimilarCaseResponse] = Field(
        description="List of similar cases"
    )
    total_found: int = Field(description="Total number of similar cases found")


# =============================================================================
# ENDPOINTS
# =============================================================================


@router.get("/find/{case_id}", response_model=FindSimilarResponse)
async def find_similar(
    case_id: str,
    limit: int = Query(
        default=50, ge=1, le=100, description="Maximum cases to return"
    ),
    min_score: float = Query(
        default=30.0, ge=0, le=100, description="Minimum similarity score"
    ),
) -> FindSimilarResponse:
    """Find cases similar to the specified case.

    Uses weighted multi-factor similarity scoring across:
    - Weapon type (30%): Exact match or same category
    - Geographic proximity (25%): Distance-based scoring
    - Victim age similarity (20%): Age difference scoring
    - Temporal proximity (15%): Year difference scoring
    - Victim race (5%): Exact match
    - Circumstance (3%): Exact match
    - Relationship (2%): Exact match

    Only compares cases with the same victim sex as the reference case.

    **Path Parameters:**
    - `case_id`: ID of the reference case (database ID)

    **Query Parameters:**
    - `limit`: Maximum cases to return (default 50, max 100)
    - `min_score`: Minimum similarity score threshold (default 30)

    **Response:**
    - `reference_case_id`: The case being compared against
    - `similar_cases`: List of similar cases with scores and factors
    - `total_found`: Total number of similar cases found
    """
    logger.info(
        f"Finding similar cases for case_id={case_id}, limit={limit}, min_score={min_score}"
    )

    try:
        results = find_similar_cases(
            case_id=case_id,
            limit=limit,
            min_score=min_score,
        )

        similar_cases = [
            SimilarCaseResponse(
                case_id=r.case_id,
                similarity_score=r.similarity_score,
                matching_factors=MatchingFactors(**r.matching_factors),
                year=r.case_data.get("year", 0),
                state=r.case_data.get("state", "Unknown"),
                weapon=r.case_data.get("weapon"),
                vic_age=r.case_data.get("vic_age"),
                vic_sex=r.case_data.get("vic_sex"),
                vic_race=r.case_data.get("vic_race"),
                solved=r.case_data.get("solved", 0),
                circumstance=r.case_data.get("circumstance"),
                relationship=r.case_data.get("relationship"),
            )
            for r in results
        ]

        logger.info(f"Returning {len(similar_cases)} similar cases for {case_id}")

        return FindSimilarResponse(
            reference_case_id=case_id,
            similar_cases=similar_cases,
            total_found=len(similar_cases),
        )

    except ValueError as e:
        logger.warning(f"Case not found: {case_id}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error finding similar cases: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
