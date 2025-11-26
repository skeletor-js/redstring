/**
 * Test suite for useClusters hooks (TanStack Query hooks for cluster analysis).
 *
 * Tests useAnalyzeClusters mutation, useClusterDetails query, useClusterCases query,
 * and error handling.
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useClusterAnalysis,
  useClusterDetail,
  useClusterCases,
  useExportClusterCases,
} from '../../../src/hooks/useClusters'
import * as clustersService from '../../../src/services/clusters'
import type {
  ClusterAnalysisRequest,
  ClusterAnalysisResponse,
  ClusterDetail,
  ClusterSummary,
} from '../../../src/types/cluster'
import type { Case } from '../../../src/types/case'

// Mock the clusters service
vi.mock('../../../src/services/clusters')

// Mock data
const mockClusterSummary: ClusterSummary = {
  cluster_id: 'cluster_1',
  location_description: 'CALIFORNIA - County 06037',
  total_cases: 10,
  solved_cases: 2,
  unsolved_cases: 8,
  solve_rate: 20.0,
  avg_similarity_score: 85.5,
  first_year: 2015,
  last_year: 2020,
  primary_weapon: 'Handgun - pistol, revolver, etc',
  primary_victim_sex: 'Male',
  avg_victim_age: 32.5,
}

const mockAnalysisResponse: ClusterAnalysisResponse = {
  clusters: [mockClusterSummary],
  total_clusters: 1,
  total_cases_analyzed: 1000,
  analysis_time_seconds: 2.5,
  config: {
    min_cluster_size: 5,
    max_solve_rate: 33.0,
    similarity_threshold: 70.0,
  },
}

const mockClusterDetail: ClusterDetail = {
  ...mockClusterSummary,
  case_ids: ['CA_2020_1', 'CA_2020_2', 'CA_2020_3'],
}

const mockCase: Case = {
  id: 'CA_2020_12345',
  state: 'CALIFORNIA',
  year: 2020,
  month: 6,
  month_name: 'June',
  agency: 'Los Angeles Police Department',
  solved: 0,
  vic_age: 35,
  vic_sex: 'Male',
  vic_race: 'White',
  vic_ethnic: 'Not Hispanic or Latino',
  off_age: 999,
  off_sex: 'Unknown',
  off_race: 'Unknown',
  off_ethnic: 'Unknown',
  weapon: 'Handgun - pistol, revolver, etc',
  relationship: 'Stranger',
  circumstance: 'Felony type',
  situation: 'Single victim/single offender',
  cntyfips: 'Los Angeles County',
  county_fips_code: '06037',
  latitude: 34.0522,
  longitude: -118.2437,
}

describe('useClusters Hooks', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })

    // Reset mocks
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  describe('useClusterAnalysis', () => {
    it('should run cluster analysis', async () => {
      vi.mocked(clustersService.analyzeCluster).mockResolvedValue(mockAnalysisResponse)

      const { result } = renderHook(() => useClusterAnalysis(), { wrapper })

      const request: ClusterAnalysisRequest = {
        min_cluster_size: 5,
        max_solve_rate: 33.0,
        similarity_threshold: 70.0,
      }

      result.current.mutate(request)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockAnalysisResponse)
      expect(clustersService.analyzeCluster).toHaveBeenCalledWith(request)
    })

    it('should handle pending state', () => {
      vi.mocked(clustersService.analyzeCluster).mockImplementation(
        () => new Promise(() => {})
      )

      const { result } = renderHook(() => useClusterAnalysis(), { wrapper })

      const request: ClusterAnalysisRequest = {
        min_cluster_size: 5,
        max_solve_rate: 33.0,
        similarity_threshold: 70.0,
      }

      result.current.mutate(request)

      expect(result.current.isPending).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle error state', async () => {
      const error = new Error('Analysis failed')
      vi.mocked(clustersService.analyzeCluster).mockRejectedValue(error)

      const { result } = renderHook(() => useClusterAnalysis(), { wrapper })

      const request: ClusterAnalysisRequest = {
        min_cluster_size: 5,
        max_solve_rate: 33.0,
        similarity_threshold: 70.0,
      }

      result.current.mutate(request)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toBe('Analysis failed')
    })

    it('should accept custom weights in analysis request', async () => {
      vi.mocked(clustersService.analyzeCluster).mockResolvedValue(mockAnalysisResponse)

      const { result } = renderHook(() => useClusterAnalysis(), { wrapper })

      const request: ClusterAnalysisRequest = {
        min_cluster_size: 5,
        max_solve_rate: 33.0,
        similarity_threshold: 70.0,
        weights: {
          geographic: 40.0,
          weapon: 30.0,
          victim_sex: 15.0,
          victim_age: 10.0,
          temporal: 3.0,
          victim_race: 2.0,
        },
      }

      result.current.mutate(request)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(clustersService.analyzeCluster).toHaveBeenCalledWith(request)
    })

    it('should accept filter criteria in analysis request', async () => {
      vi.mocked(clustersService.analyzeCluster).mockResolvedValue(mockAnalysisResponse)

      const { result } = renderHook(() => useClusterAnalysis(), { wrapper })

      const request: ClusterAnalysisRequest = {
        min_cluster_size: 5,
        max_solve_rate: 33.0,
        similarity_threshold: 70.0,
        filter: {
          states: ['CALIFORNIA'],
          year_min: 2010,
          year_max: 2020,
        },
      }

      result.current.mutate(request)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(clustersService.analyzeCluster).toHaveBeenCalledWith(request)
    })
  })

  describe('useClusterDetail', () => {
    it('should fetch cluster detail by ID', async () => {
      vi.mocked(clustersService.getClusterDetail).mockResolvedValue(mockClusterDetail)

      const { result } = renderHook(() => useClusterDetail('cluster_1'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockClusterDetail)
      expect(clustersService.getClusterDetail).toHaveBeenCalledWith('cluster_1')
    })

    it('should handle loading state', () => {
      vi.mocked(clustersService.getClusterDetail).mockImplementation(
        () => new Promise(() => {})
      )

      const { result } = renderHook(() => useClusterDetail('cluster_1'), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle error state', async () => {
      const error = new Error('Cluster not found')
      vi.mocked(clustersService.getClusterDetail).mockRejectedValue(error)

      const { result } = renderHook(() => useClusterDetail('cluster_1'), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error?.message).toBe('Cluster not found')
    })

    it('should not fetch when cluster ID is null', () => {
      const { result } = renderHook(() => useClusterDetail(null), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(clustersService.getClusterDetail).not.toHaveBeenCalled()
    })

    it('should be enabled only when cluster ID is provided', () => {
      const { result: result1 } = renderHook(() => useClusterDetail('cluster_1'), {
        wrapper,
      })

      expect(result1.current.fetchStatus).not.toBe('idle')

      const { result: result2 } = renderHook(() => useClusterDetail(null), { wrapper })

      expect(result2.current.fetchStatus).toBe('idle')
    })
  })

  describe('useClusterCases', () => {
    it('should fetch cases in a cluster', async () => {
      vi.mocked(clustersService.getClusterCases).mockResolvedValue([mockCase])

      const { result } = renderHook(() => useClusterCases('cluster_1'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0]).toEqual(mockCase)
      expect(clustersService.getClusterCases).toHaveBeenCalledWith('cluster_1')
    })

    it('should handle loading state', () => {
      vi.mocked(clustersService.getClusterCases).mockImplementation(
        () => new Promise(() => {})
      )

      const { result } = renderHook(() => useClusterCases('cluster_1'), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle error state', async () => {
      const error = new Error('Failed to fetch cluster cases')
      vi.mocked(clustersService.getClusterCases).mockRejectedValue(error)

      const { result } = renderHook(() => useClusterCases('cluster_1'), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error?.message).toBe('Failed to fetch cluster cases')
    })

    it('should not fetch when cluster ID is null', () => {
      const { result } = renderHook(() => useClusterCases(null), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(clustersService.getClusterCases).not.toHaveBeenCalled()
    })

    it('should handle empty cluster cases', async () => {
      vi.mocked(clustersService.getClusterCases).mockResolvedValue([])

      const { result } = renderHook(() => useClusterCases('cluster_1'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([])
    })
  })

  describe('useExportClusterCases', () => {
    it('should export cluster cases to CSV', async () => {
      vi.mocked(clustersService.exportClusterCases).mockResolvedValue()

      const { result } = renderHook(() => useExportClusterCases(), { wrapper })

      result.current.mutate('cluster_1')

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(clustersService.exportClusterCases).toHaveBeenCalledWith('cluster_1')
    })

    it('should handle pending state', () => {
      vi.mocked(clustersService.exportClusterCases).mockImplementation(
        () => new Promise(() => {})
      )

      const { result } = renderHook(() => useExportClusterCases(), { wrapper })

      result.current.mutate('cluster_1')

      expect(result.current.isPending).toBe(true)
    })

    it('should handle error state', async () => {
      const error = new Error('Export failed')
      vi.mocked(clustersService.exportClusterCases).mockRejectedValue(error)

      const { result } = renderHook(() => useExportClusterCases(), { wrapper })

      result.current.mutate('cluster_1')

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error?.message).toBe('Export failed')
    })
  })

  describe('Query Caching', () => {
    it('should cache cluster detail queries', async () => {
      vi.mocked(clustersService.getClusterDetail).mockResolvedValue(mockClusterDetail)

      const { result: result1 } = renderHook(() => useClusterDetail('cluster_1'), {
        wrapper,
      })

      await waitFor(() => expect(result1.current.isSuccess).toBe(true))

      // Second render with same ID should use cache
      const { result: result2 } = renderHook(() => useClusterDetail('cluster_1'), {
        wrapper,
      })

      // Should immediately have data from cache
      expect(result2.current.data).toEqual(mockClusterDetail)
    })

    it('should cache cluster cases queries', async () => {
      vi.mocked(clustersService.getClusterCases).mockResolvedValue([mockCase])

      const { result: result1 } = renderHook(() => useClusterCases('cluster_1'), {
        wrapper,
      })

      await waitFor(() => expect(result1.current.isSuccess).toBe(true))

      // Second render with same ID should use cache
      const { result: result2 } = renderHook(() => useClusterCases('cluster_1'), {
        wrapper,
      })

      // Should immediately have data from cache
      expect(result2.current.data).toEqual([mockCase])
    })
  })

  describe('Mutation State Management', () => {
    it('should reset mutation state after successful analysis', async () => {
      vi.mocked(clustersService.analyzeCluster).mockResolvedValue(mockAnalysisResponse)

      const { result } = renderHook(() => useClusterAnalysis(), { wrapper })

      const request: ClusterAnalysisRequest = {
        min_cluster_size: 5,
        max_solve_rate: 33.0,
        similarity_threshold: 70.0,
      }

      result.current.mutate(request)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Reset mutation
      result.current.reset()

      expect(result.current.isIdle).toBe(true)
      expect(result.current.data).toBeUndefined()
    })
  })
})
