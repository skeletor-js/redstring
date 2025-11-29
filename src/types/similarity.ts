/**
 * Type definitions for case similarity feature.
 */

/**
 * Breakdown of similarity scores by factor.
 */
export interface MatchingFactors {
  /** Weapon match score (0-100) */
  weapon: number
  /** Geographic proximity score (0-100) */
  geographic: number
  /** Victim age similarity score (0-100) */
  victim_age: number
  /** Temporal proximity score (0-100) */
  temporal: number
  /** Victim race match score (0-100) */
  victim_race: number
  /** Circumstance match score (0-100) */
  circumstance: number
  /** Relationship match score (0-100) */
  relationship: number
}

/**
 * A case similar to the reference case.
 */
export interface SimilarCase {
  /** Case ID */
  case_id: string
  /** Overall similarity score (0-100) */
  similarity_score: number
  /** Individual factor scores */
  matching_factors: MatchingFactors
  /** Year of the case */
  year: number
  /** State where case occurred */
  state: string
  /** Weapon used */
  weapon: string | null
  /** Victim age */
  vic_age: number | null
  /** Victim sex */
  vic_sex: string | null
  /** Victim race */
  vic_race: string | null
  /** Solved status (0=unsolved, 1=solved) */
  solved: number
  /** Circumstance */
  circumstance: string | null
  /** Victim-offender relationship */
  relationship: string | null
}

/**
 * Response from find similar cases endpoint.
 */
export interface FindSimilarResponse {
  /** ID of the reference case */
  reference_case_id: string
  /** List of similar cases */
  similar_cases: SimilarCase[]
  /** Total number of similar cases found */
  total_found: number
}

/**
 * Options for similarity search.
 */
export interface SimilarityOptions {
  /** Maximum cases to return (default 50) */
  limit?: number
  /** Minimum similarity score (default 30) */
  minScore?: number
}
