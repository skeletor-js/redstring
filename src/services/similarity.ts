/**
 * API client methods for case similarity endpoints.
 *
 * Provides typed functions for finding similar cases.
 */

import { apiClient } from './api'
import type { FindSimilarResponse, SimilarityOptions } from '../types/similarity'

/**
 * Find cases similar to a given case.
 *
 * Uses weighted multi-factor similarity scoring to find cases
 * with similar characteristics.
 *
 * @param caseId - ID of the reference case
 * @param options - Optional search parameters
 * @returns Promise with similar cases response
 *
 * @example
 * ```ts
 * const response = await findSimilarCases('12345', { limit: 50, minScore: 30 })
 * console.log(`Found ${response.total_found} similar cases`)
 * ```
 */
export async function findSimilarCases(
  caseId: string,
  options?: SimilarityOptions
): Promise<FindSimilarResponse> {
  const params = new URLSearchParams()

  if (options?.limit) {
    params.set('limit', options.limit.toString())
  }
  if (options?.minScore !== undefined) {
    params.set('min_score', options.minScore.toString())
  }

  const queryString = params.toString()
  const url = queryString
    ? `/api/similarity/find/${caseId}?${queryString}`
    : `/api/similarity/find/${caseId}`

  const response = await apiClient.get<FindSimilarResponse>(url)
  return response.data
}
