/**
 * React hooks for cluster analysis operations.
 *
 * Provides TanStack Query hooks for cluster analysis, detail fetching,
 * and case retrieval with automatic caching and error handling.
 */

import { useMutation, useQuery } from '@tanstack/react-query';

import type {
  ClusterAnalysisRequest,
  ClusterAnalysisResponse,
  ClusterDetail,
} from '../types/cluster';
import type { Case } from '../types/case';
import {
  analyzeCluster,
  exportClusterCases,
  getClusterCases,
  getClusterDetail,
} from '../services/clusters';

/**
 * Hook for running cluster analysis.
 *
 * Uses mutation since analysis is a POST request and should not be cached.
 *
 * @example
 * ```tsx
 * const { mutate, isPending, data } = useClusterAnalysis();
 *
 * const handleAnalyze = () => {
 *   mutate({
 *     min_cluster_size: 5,
 *     max_solve_rate: 33.0,
 *     similarity_threshold: 70.0,
 *   });
 * };
 * ```
 */
export function useClusterAnalysis() {
  return useMutation<ClusterAnalysisResponse, Error, ClusterAnalysisRequest>({
    mutationFn: analyzeCluster,
    mutationKey: ['cluster-analysis'],
  });
}

/**
 * Hook for fetching cluster detail.
 *
 * @param clusterId - Unique cluster identifier (null to disable query)
 *
 * @example
 * ```tsx
 * const { data: cluster, isLoading } = useClusterDetail(selectedClusterId);
 * ```
 */
export function useClusterDetail(clusterId: string | null) {
  return useQuery<ClusterDetail, Error>({
    queryKey: ['cluster-detail', clusterId],
    queryFn: () => getClusterDetail(clusterId!),
    enabled: !!clusterId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for fetching cases in a cluster.
 *
 * @param clusterId - Unique cluster identifier (null to disable query)
 *
 * @example
 * ```tsx
 * const { data: cases, isLoading } = useClusterCases(selectedClusterId);
 * ```
 */
export function useClusterCases(clusterId: string | null) {
  return useQuery<Case[], Error>({
    queryKey: ['cluster-cases', clusterId],
    queryFn: () => getClusterCases(clusterId!),
    enabled: !!clusterId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for exporting cluster cases to CSV.
 *
 * @example
 * ```tsx
 * const { mutate: exportCases, isPending } = useExportClusterCases();
 *
 * const handleExport = () => {
 *   exportCases(clusterId);
 * };
 * ```
 */
export function useExportClusterCases() {
  return useMutation<void, Error, string>({
    mutationFn: exportClusterCases,
    mutationKey: ['export-cluster-cases'],
  });
}
