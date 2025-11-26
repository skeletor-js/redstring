/**
 * API client for cluster analysis operations.
 *
 * Provides methods to interact with the clustering endpoints including
 * running analysis, fetching cluster details, and exporting results.
 */

import type { Case } from '../types/case';
import type {
  ClusterAnalysisRequest,
  ClusterAnalysisResponse,
  ClusterDetail,
} from '../types/cluster';
import { apiClient } from './api';

/**
 * Run cluster analysis on filtered case set.
 *
 * @param request - Cluster analysis configuration and filters
 * @returns Analysis results with detected clusters
 */
export async function analyzeCluster(
  request: ClusterAnalysisRequest
): Promise<ClusterAnalysisResponse> {
  const response = await apiClient.post<ClusterAnalysisResponse>(
    '/api/clusters/analyze',
    request
  );
  return response.data;
}

/**
 * Get detailed information for a specific cluster.
 *
 * @param clusterId - Unique cluster identifier
 * @returns Cluster detail with statistics and case IDs
 */
export async function getClusterDetail(
  clusterId: string
): Promise<ClusterDetail> {
  const response = await apiClient.get<ClusterDetail>(`/api/clusters/${clusterId}`);
  return response.data;
}

/**
 * Get full case details for all cases in a cluster.
 *
 * @param clusterId - Unique cluster identifier
 * @returns Array of complete case objects
 */
export async function getClusterCases(clusterId: string): Promise<Case[]> {
  const response = await apiClient.get<Case[]>(`/api/clusters/${clusterId}/cases`);
  return response.data;
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
  });

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `cluster_${clusterId}_cases.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
