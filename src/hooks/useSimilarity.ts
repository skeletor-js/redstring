/**
 * TanStack Query hook for case similarity data fetching.
 *
 * Provides a React hook for finding cases similar to a reference case.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { findSimilarCases } from '../services/similarity'
import { FindSimilarResponse, SimilarityOptions } from '../types/similarity'
import { AppError, logError } from '../utils/errorHandler'

/**
 * Query key factory for similarity-related queries.
 */
export const similarityKeys = {
  all: ['similarity'] as const,
  similar: (caseId: string, options?: SimilarityOptions) =>
    [...similarityKeys.all, 'similar', caseId, options] as const,
}

/**
 * Hook to find cases similar to a reference case.
 *
 * Uses weighted multi-factor similarity scoring to find cases
 * with similar characteristics. Only fetches when caseId is provided.
 *
 * @param caseId - ID of the reference case (null to disable query)
 * @param options - Optional search parameters
 * @returns Query result with similar cases
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useSimilarCases(selectedCaseId, { limit: 50 })
 *
 * if (isLoading) return <LoadingSpinner />
 * if (error) return <ErrorMessage>{getUserMessage(error)}</ErrorMessage>
 *
 * return (
 *   <div>
 *     {data?.similar_cases.map(similar => (
 *       <SimilarCaseCard key={similar.case_id} case={similar} />
 *     ))}
 *   </div>
 * )
 * ```
 */
export const useSimilarCases = (
  caseId: string | null,
  options?: SimilarityOptions
): UseQueryResult<FindSimilarResponse, AppError> => {
  return useQuery({
    queryKey: similarityKeys.similar(caseId ?? '', options),
    queryFn: async () => {
      if (!caseId) {
        throw new Error('Case ID is required')
      }
      try {
        return await findSimilarCases(caseId, options)
      } catch (error) {
        logError(error, { caseId, options, context: 'useSimilarCases' })
        throw error
      }
    },
    enabled: !!caseId,
    staleTime: 1000 * 60 * 5, // 5 minutes - similarity results don't change often
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 404s
      if ((error as AppError)?.statusCode === 404) return false
      // Retry up to 2 times for other errors
      if (failureCount >= 2) return false
      return (error as AppError)?.retryable ?? false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}
