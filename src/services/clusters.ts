/**
 * API client for cluster analysis operations.
 *
 * Provides methods to interact with the clustering endpoints including
 * running analysis, fetching cluster details, and exporting results.
 */

import axios from 'axios'
import type { Case } from '../types/case'
import type { FilterState } from '../types/filter'
import type {
  ClusterAnalysisRequest,
  ClusterAnalysisResponse,
  ClusterDetail,
  ClusterPreflightResponse,
  ClusterTierError,
} from '../types/cluster'
import { apiClient } from './api'

/**
 * Custom error class for tier-related errors.
 *
 * Thrown when the analyze endpoint returns a 400 status due to
 * dataset size constraints (confirmation_required or dataset_too_large).
 */
export class ClusterTierValidationError extends Error {
  public readonly isTierError = true
  public readonly status: 'confirmation_required' | 'dataset_too_large'
  public readonly case_count: number
  public readonly tier: 1 | 2 | 3
  public readonly estimated_time_seconds?: number
  public readonly filter_suggestions?: string[]

  constructor(tierError: ClusterTierError) {
    super(tierError.message)
    this.name = 'ClusterTierValidationError'
    this.status = tierError.status
    this.case_count = tierError.case_count
    this.tier = tierError.tier
    this.estimated_time_seconds = tierError.estimated_time_seconds
    this.filter_suggestions = tierError.filter_suggestions
  }
}

/**
 * Convert frontend FilterState to API filter format.
 *
 * @param filters - Frontend filter state
 * @returns Filter object in API format
 */
function buildApiFilter(filters: FilterState): Record<string, unknown> {
  const apiFilter: Record<string, unknown> = {}

  if (filters.states.length > 0) {
    apiFilter.states = filters.states
  }

  if (filters.yearRange[0] !== 1976) {
    apiFilter.year_min = filters.yearRange[0]
  }
  if (filters.yearRange[1] !== 2023) {
    apiFilter.year_max = filters.yearRange[1]
  }

  if (filters.solved !== 'all') {
    apiFilter.solved = filters.solved === 'solved' ? 1 : 0
  }

  if (filters.vicSex.length > 0) {
    apiFilter.vic_sex = filters.vicSex
  }

  if (filters.vicAgeRange[0] !== 0) {
    apiFilter.vic_age_min = filters.vicAgeRange[0]
  }
  if (filters.vicAgeRange[1] !== 99) {
    apiFilter.vic_age_max = filters.vicAgeRange[1]
  }

  if (filters.vicRace.length > 0) {
    apiFilter.vic_race = filters.vicRace
  }

  if (filters.weapon.length > 0) {
    apiFilter.weapon = filters.weapon
  }

  if (filters.relationship.length > 0) {
    apiFilter.relationship = filters.relationship
  }

  if (filters.circumstance.length > 0) {
    apiFilter.circumstance = filters.circumstance
  }

  if (filters.counties.length > 0) {
    apiFilter.counties = filters.counties
  }

  return apiFilter
}

/**
 * Perform preflight check before cluster analysis.
 *
 * Returns case count and tier classification to determine
 * whether to proceed, warn, or block the analysis.
 *
 * @param config - Cluster configuration (weights, thresholds)
 * @param filters - Current filter state
 * @returns Preflight response with tier and recommendations
 */
export async function clusterPreflight(
  config: ClusterAnalysisRequest,
  filters: FilterState
): Promise<ClusterPreflightResponse> {
  const apiFilter = buildApiFilter(filters)

  const response = await apiClient.post<ClusterPreflightResponse>(
    '/api/clusters/preflight',
    {
      ...config,
      filter: Object.keys(apiFilter).length > 0 ? apiFilter : undefined,
    }
  )
  return response.data
}

/**
 * Run cluster analysis on filtered case set.
 *
 * @param config - Cluster analysis configuration (weights, thresholds)
 * @param filters - Current filter state
 * @param force - Force analysis for Tier 2 datasets (requires confirmation)
 * @returns Analysis results with detected clusters
 * @throws ClusterTierValidationError if tier validation fails
 */
export async function analyzeCluster(
  config: ClusterAnalysisRequest,
  filters: FilterState,
  force: boolean = false
): Promise<ClusterAnalysisResponse> {
  const apiFilter = buildApiFilter(filters)

  const request: ClusterAnalysisRequest = {
    ...config,
    filter: Object.keys(apiFilter).length > 0 ? apiFilter : undefined,
  }

  try {
    const response = await apiClient.post<ClusterAnalysisResponse>(
      '/api/clusters/analyze',
      request,
      {
        params: force ? { force: true } : undefined,
        // Extend timeout for forced Tier 2 analyses (2 minutes vs default 30s)
        timeout: force ? 120000 : undefined,
      }
    )
    return response.data
  } catch (error) {
    // Check for tier validation errors (400 status)
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data

      // Check if this is a tier-related error
      if (
        data?.status === 'confirmation_required' ||
        data?.status === 'dataset_too_large'
      ) {
        throw new ClusterTierValidationError(data as ClusterTierError)
      }
    }

    // Re-throw other errors
    throw error
  }
}

/**
 * Get detailed information for a specific cluster.
 *
 * @param clusterId - Unique cluster identifier
 * @returns Cluster detail with statistics and case IDs
 */
export async function getClusterDetail(clusterId: string): Promise<ClusterDetail> {
  const response = await apiClient.get<ClusterDetail>(`/api/clusters/${clusterId}`)
  return response.data
}

/**
 * Get full case details for all cases in a cluster.
 *
 * @param clusterId - Unique cluster identifier
 * @returns Array of complete case objects
 */
export async function getClusterCases(clusterId: string): Promise<Case[]> {
  const response = await apiClient.get<Case[]>(`/api/clusters/${clusterId}/cases`)
  return response.data
}

/**
 * Export cluster cases to CSV file.
 *
 * Downloads a CSV file containing all case fields for every case
 * in the specified cluster.
 *
 * @param clusterId - Unique cluster identifier
 */
export async function exportClusterCases(clusterId: string): Promise<void> {
  const response = await apiClient.get(`/api/clusters/${clusterId}/export`, {
    responseType: 'blob',
  })

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `cluster_${clusterId}_cases.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
