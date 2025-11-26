/**
 * React hooks for cluster analysis operations.
 *
 * Provides TanStack Query hooks for cluster analysis, detail fetching,
 * and case retrieval with automatic caching, error handling, and retry logic.
 */

import { useMutation, useQuery } from '@tanstack/react-query'

import type {
  ClusterAnalysisRequest,
  ClusterAnalysisResponse,
  ClusterDetail,
} from '../types/cluster'
import type { Case } from '../types/case'
import {
  analyzeCluster,
  exportClusterCases,
  getClusterCases,
  getClusterDetail,
} from '../services/clusters'
import { AppError, logError } from '../utils/errorHandler'

/**
 * Hook for running cluster analysis.
 *
 * Uses mutation since analysis is a POST request and should not be cached.
 * Includes error handling and logging for analysis failures.
 *
 * @example
 * ```tsx
 * const { mutate, isPending, data, error } = useClusterAnalysis();
 *
 * const handleAnalyze = () => {
 *   mutate({
 *     min_cluster_size: 5,
 *     max_solve_rate: 33.0,
 *     similarity_threshold: 70.0,
 *   }, {
 *     onError: (error) => {
 *       toast.error(getUserMessage(error));
 *     }
 *   });
 * };
 * ```
 */
export function useClusterAnalysis() {
  return useMutation<ClusterAnalysisResponse, AppError, ClusterAnalysisRequest>({
    mutationFn: async (request) => {
      try {
        return await analyzeCluster(request)
      } catch (error) {
        logError(error, {
          request,
          context: 'useClusterAnalysis',
        })
        throw error
      }
    },
    mutationKey: ['cluster-analysis'],
    retry: (failureCount, error) => {
      // Retry up to 1 time for retryable errors (analysis is expensive)
      if (failureCount >= 1) return false
      return error?.retryable ?? false
    },
    retryDelay: 2000, // 2 seconds
  })
}

/**
 * Hook for fetching cluster detail.
 *
 * Includes automatic retry logic and error handling.
 *
 * @param clusterId - Unique cluster identifier (null to disable query)
 *
 * @example
 * ```tsx
 * const { data: cluster, isLoading, error } = useClusterDetail(selectedClusterId);
 *
 * if (error) {
 *   return <ErrorMessage>{getUserMessage(error)}</ErrorMessage>;
 * }
 * ```
 */
export function useClusterDetail(clusterId: string | null) {
  return useQuery<ClusterDetail, AppError>({
    queryKey: ['cluster-detail', clusterId],
    queryFn: async () => {
      try {
        return await getClusterDetail(clusterId!)
      } catch (error) {
        logError(error, { clusterId, context: 'useClusterDetail' })
        throw error
      }
    },
    enabled: !!clusterId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry 404 errors (cluster not found)
      if (error?.statusCode === 404) return false
      // Retry up to 2 times for retryable errors
      if (failureCount >= 2) return false
      return error?.retryable ?? false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Hook for fetching cases in a cluster.
 *
 * Includes automatic retry logic and error handling.
 *
 * @param clusterId - Unique cluster identifier (null to disable query)
 *
 * @example
 * ```tsx
 * const { data: cases, isLoading, error } = useClusterCases(selectedClusterId);
 *
 * if (error) {
 *   return <ErrorMessage>{getUserMessage(error)}</ErrorMessage>;
 * }
 * ```
 */
export function useClusterCases(clusterId: string | null) {
  return useQuery<Case[], AppError>({
    queryKey: ['cluster-cases', clusterId],
    queryFn: async () => {
      try {
        return await getClusterCases(clusterId!)
      } catch (error) {
        logError(error, { clusterId, context: 'useClusterCases' })
        throw error
      }
    },
    enabled: !!clusterId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry 404 errors (cluster not found)
      if (error?.statusCode === 404) return false
      // Retry up to 2 times for retryable errors
      if (failureCount >= 2) return false
      return error?.retryable ?? false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Hook for exporting cluster cases to CSV.
 *
 * Includes error handling and logging for export failures.
 *
 * @example
 * ```tsx
 * const { mutate: exportCases, isPending, error } = useExportClusterCases();
 *
 * const handleExport = () => {
 *   exportCases(clusterId, {
 *     onError: (error) => {
 *       toast.error(getUserMessage(error));
 *     },
 *     onSuccess: () => {
 *       toast.success('Export complete');
 *     }
 *   });
 * };
 * ```
 */
export function useExportClusterCases() {
  return useMutation<void, AppError, string>({
    mutationFn: async (clusterId) => {
      try {
        return await exportClusterCases(clusterId)
      } catch (error) {
        logError(error, { clusterId, context: 'useExportClusterCases' })
        throw error
      }
    },
    mutationKey: ['export-cluster-cases'],
    retry: (failureCount, error) => {
      // Retry up to 1 time for retryable errors
      if (failureCount >= 1) return false
      return error?.retryable ?? false
    },
    retryDelay: 1000, // 1 second
  })
}
