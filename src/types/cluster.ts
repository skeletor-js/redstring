/**
 * TypeScript type definitions for cluster analysis.
 *
 * Defines request/response types for the clustering API, matching the
 * backend Pydantic models.
 */

// =============================================================================
// REQUEST TYPES
// =============================================================================

/**
 * Weight configuration for similarity scoring.
 *
 * All weights should sum to 100.0 for proper normalization.
 * Default values match PRD specifications (Section 6.3.2).
 */
export interface SimilarityWeights {
  /** Geographic proximity weight (default 35%) */
  geographic: number
  /** Weapon match weight (default 25%) */
  weapon: number
  /** Victim sex match weight (default 20%) */
  victim_sex: number
  /** Victim age proximity weight (default 10%) */
  victim_age: number
  /** Temporal proximity weight (default 7%) */
  temporal: number
  /** Victim race match weight (default 3%) */
  victim_race: number
}

/**
 * Default similarity weights from PRD.
 */
export const DEFAULT_SIMILARITY_WEIGHTS: SimilarityWeights = {
  geographic: 35.0,
  weapon: 25.0,
  victim_sex: 20.0,
  victim_age: 10.0,
  temporal: 7.0,
  victim_race: 3.0,
}

/**
 * Request for cluster analysis.
 *
 * Includes both filter criteria (to select cases) and clustering
 * configuration (similarity thresholds, weights, etc.).
 */
export interface ClusterAnalysisRequest {
  /** Minimum number of cases required to form a cluster (3-100) */
  min_cluster_size: number
  /** Maximum solve rate (%) for suspicious clusters (0-100) */
  max_solve_rate: number
  /** Minimum similarity score for cases to be clustered together (0-100) */
  similarity_threshold: number
  /** Custom similarity weights (uses defaults if not provided) */
  weights?: SimilarityWeights
  /** Optional filter criteria for case selection (CaseFilter format) */
  filter?: Record<string, any>
}

/**
 * Default cluster configuration from PRD.
 */
export const DEFAULT_CLUSTER_CONFIG: ClusterAnalysisRequest = {
  min_cluster_size: 5,
  max_solve_rate: 33.0,
  similarity_threshold: 70.0,
  weights: DEFAULT_SIMILARITY_WEIGHTS,
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Summary information for a single cluster.
 *
 * Returned in list views and analysis results.
 */
export interface ClusterSummary {
  /** Unique cluster identifier */
  cluster_id: string
  /** Human-readable location (e.g., "ILLINOIS - County 17031") */
  location_description: string
  /** Total number of cases in cluster */
  total_cases: number
  /** Number of solved cases */
  solved_cases: number
  /** Number of unsolved cases */
  unsolved_cases: number
  /** Percentage of cases solved (0-100) */
  solve_rate: number
  /** Average pairwise similarity score (0-100) */
  avg_similarity_score: number
  /** Earliest case year in cluster */
  first_year: number
  /** Latest case year in cluster */
  last_year: number
  /** Most common weapon type in cluster */
  primary_weapon: string
  /** Most common victim sex in cluster */
  primary_victim_sex: string
  /** Average victim age (excluding unknown) */
  avg_victim_age: number
}

/**
 * Response for cluster analysis request.
 */
export interface ClusterAnalysisResponse {
  /** Detected clusters, sorted by unsolved count (descending) */
  clusters: ClusterSummary[]
  /** Number of clusters detected */
  total_clusters: number
  /** Total number of cases included in analysis */
  total_cases_analyzed: number
  /** Time taken to complete analysis (seconds) */
  analysis_time_seconds: number
  /** Configuration used for analysis */
  config: ClusterAnalysisRequest
}

/**
 * Detailed information for a single cluster.
 */
export interface ClusterDetail {
  /** Unique cluster identifier */
  cluster_id: string
  /** Human-readable location */
  location_description: string
  /** Total number of cases in cluster */
  total_cases: number
  /** Number of solved cases */
  solved_cases: number
  /** Number of unsolved cases */
  unsolved_cases: number
  /** Percentage of cases solved (0-100) */
  solve_rate: number
  /** Average pairwise similarity score */
  avg_similarity_score: number
  /** Earliest case year in cluster */
  first_year: number
  /** Latest case year in cluster */
  last_year: number
  /** Most common weapon type in cluster */
  primary_weapon: string
  /** Most common victim sex in cluster */
  primary_victim_sex: string
  /** Average victim age (excluding unknown) */
  avg_victim_age: number
  /** List of case IDs in this cluster */
  case_ids: string[]
}

// =============================================================================
// PREFLIGHT TYPES (Tiered Size Limit System)
// =============================================================================

/**
 * Dataset size tier for clustering analysis.
 *
 * - Tier 1: < 10,000 cases - runs immediately
 * - Tier 2: 10,000 - 50,000 cases - requires confirmation
 * - Tier 3: > 50,000 cases - blocked, requires filters
 */
export type DatasetTier = 1 | 2 | 3

/**
 * Response for cluster analysis preflight check.
 *
 * Provides case count and tier classification to help the frontend
 * decide whether to proceed, warn, or block the analysis.
 */
export interface ClusterPreflightResponse {
  /** Number of cases matching filter criteria */
  case_count: number
  /** Dataset size tier classification (1, 2, or 3) */
  tier: DatasetTier
  /** Estimated analysis time in seconds (for Tier 2, null otherwise) */
  estimated_time_seconds: number | null
  /** Whether analysis can proceed (false for Tier 3) */
  can_proceed: boolean
  /** User-friendly message about the dataset size */
  message: string
  /** Suggestions for reducing dataset size (for Tier 3, null otherwise) */
  filter_suggestions: string[] | null
}

/**
 * Error response types for tier validation.
 *
 * Returned when the analyze endpoint rejects a request due to
 * dataset size constraints.
 */
export interface ClusterTierError {
  /** Error status indicating the type of tier validation failure */
  status: 'confirmation_required' | 'dataset_too_large'
  /** Number of cases in the filtered dataset */
  case_count: number
  /** Dataset tier classification */
  tier: DatasetTier
  /** Estimated analysis time in seconds (for confirmation_required) */
  estimated_time_seconds?: number
  /** User-friendly error message */
  message: string
  /** Suggestions for reducing dataset size (for dataset_too_large) */
  filter_suggestions?: string[]
}

/**
 * Tier threshold constants (must match backend).
 */
export const TIER_THRESHOLDS = {
  /** Maximum cases for Tier 1 (immediate processing) */
  TIER_1_MAX: 10_000,
  /** Maximum cases for Tier 2 (requires confirmation) */
  TIER_2_MAX: 50_000,
} as const

// =============================================================================
// UI STATE TYPES
// =============================================================================

/**
 * UI state for cluster analysis view.
 */
export interface ClusterUIState {
  /** Current analysis results (null if no analysis run) */
  results: ClusterAnalysisResponse | null
  /** Currently selected cluster for detail view */
  selectedCluster: ClusterSummary | null
  /** Loading state for analysis */
  isAnalyzing: boolean
  /** Error message (null if no error) */
  error: string | null
}
