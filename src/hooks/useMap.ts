/**
 * TanStack Query hooks for map data fetching and caching.
 *
 * Provides React hooks that manage server state for map visualization,
 * including county data and case points with automatic caching.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useFilterStore } from '../stores/useFilterStore'
import { FilterState } from '../types/filter'
import {
  MapDataResponse,
  MapCasesResponse,
  MapViewMode,
  MapColorMetric,
} from '../types/map'
import { fetchCountyData, fetchCasePoints } from '../services/map'
import { AppError, logError } from '../utils/errorHandler'
import { useState, useCallback } from 'react'

/**
 * Query key factory for map-related queries.
 *
 * Provides consistent query keys for caching and invalidation.
 */
export const mapKeys = {
  all: ['map'] as const,
  counties: () => [...mapKeys.all, 'counties'] as const,
  county: (filters: FilterState) => [...mapKeys.counties(), filters] as const,
  cases: () => [...mapKeys.all, 'cases'] as const,
  case: (filters: FilterState, limit: number) =>
    [...mapKeys.cases(), filters, limit] as const,
}

/**
 * Hook to fetch county-level aggregated data for map visualization.
 *
 * Returns county centroids with case statistics for choropleth/marker display.
 * Integrates with the filter store for automatic filter synchronization.
 *
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with county map data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCountyData();
 *
 * if (isLoading) return <MapSkeleton />;
 * if (error) return <ErrorMessage>{getUserMessage(error)}</ErrorMessage>;
 *
 * return <CountyLayer counties={data.counties} />;
 * ```
 */
export const useCountyData = (
  enabled: boolean = true
): UseQueryResult<MapDataResponse, AppError> => {
  // Get current filters from the store
  const filters = useFilterStore((state) => ({
    states: state.states,
    yearRange: state.yearRange,
    solved: state.solved,
    vicSex: state.vicSex,
    vicAgeRange: state.vicAgeRange,
    includeUnknownAge: state.includeUnknownAge,
    vicRace: state.vicRace,
    vicEthnic: state.vicEthnic,
    weapon: state.weapon,
    relationship: state.relationship,
    circumstance: state.circumstance,
    situation: state.situation,
    counties: state.counties,
    msa: state.msa,
    agencySearch: state.agencySearch,
    caseId: state.caseId,
  }))

  return useQuery({
    queryKey: mapKeys.county(filters),
    queryFn: async () => {
      try {
        return await fetchCountyData(filters)
      } catch (error) {
        logError(error, { filters, context: 'useCountyData' })
        throw error
      }
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes (map data changes less frequently)
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false
      return (error as unknown as AppError)?.retryable ?? false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Hook to fetch individual case points for map visualization.
 *
 * Returns case locations for marker display when zoomed in.
 * Limited to prevent performance issues with large datasets.
 *
 * @param limit - Maximum number of cases to return (default: 1000)
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with case points
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCasePoints(500);
 *
 * if (isLoading) return <Spinner />;
 *
 * return <CaseMarkers cases={data.cases} />;
 * ```
 */
export const useCasePoints = (
  limit: number = 1000,
  enabled: boolean = true
): UseQueryResult<MapCasesResponse, AppError> => {
  // Get current filters from the store
  const filters = useFilterStore((state) => ({
    states: state.states,
    yearRange: state.yearRange,
    solved: state.solved,
    vicSex: state.vicSex,
    vicAgeRange: state.vicAgeRange,
    includeUnknownAge: state.includeUnknownAge,
    vicRace: state.vicRace,
    vicEthnic: state.vicEthnic,
    weapon: state.weapon,
    relationship: state.relationship,
    circumstance: state.circumstance,
    situation: state.situation,
    counties: state.counties,
    msa: state.msa,
    agencySearch: state.agencySearch,
    caseId: state.caseId,
  }))

  return useQuery({
    queryKey: mapKeys.case(filters, limit),
    queryFn: async () => {
      try {
        return await fetchCasePoints(filters, limit)
      } catch (error) {
        logError(error, { filters, limit, context: 'useCasePoints' })
        throw error
      }
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false
      return (error as unknown as AppError)?.retryable ?? false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Hook to manage map view state (view mode, color metric, zoom level).
 *
 * Provides state management for map visualization options.
 *
 * @returns Map view state and setters
 *
 * @example
 * ```tsx
 * const { viewMode, setViewMode, colorMetric, setColorMetric } = useMapViewState();
 *
 * return (
 *   <MapControls
 *     viewMode={viewMode}
 *     onViewModeChange={setViewMode}
 *     colorMetric={colorMetric}
 *     onColorMetricChange={setColorMetric}
 *   />
 * );
 * ```
 */
export const useMapViewState = () => {
  const [viewMode, setViewMode] = useState<MapViewMode>('markers')
  const [colorMetric, setColorMetric] = useState<MapColorMetric>('solve_rate')
  const [zoomLevel, setZoomLevel] = useState<number>(4)

  const handleViewModeChange = useCallback((mode: MapViewMode) => {
    setViewMode(mode)
  }, [])

  const handleColorMetricChange = useCallback((metric: MapColorMetric) => {
    setColorMetric(metric)
  }, [])

  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(zoom)
  }, [])

  return {
    viewMode,
    setViewMode: handleViewModeChange,
    colorMetric,
    setColorMetric: handleColorMetricChange,
    zoomLevel,
    setZoomLevel: handleZoomChange,
  }
}

/**
 * Combined hook for map data and view state.
 *
 * Provides all map-related data and state in a single hook.
 *
 * @returns Combined map data and view state
 *
 * @example
 * ```tsx
 * const {
 *   countyData,
 *   casePoints,
 *   isLoading,
 *   error,
 *   viewMode,
 *   setViewMode,
 * } = useMap();
 * ```
 */
export const useMap = () => {
  const viewState = useMapViewState()
  const countyQuery = useCountyData()
  const caseQuery = useCasePoints(1000, viewState.viewMode === 'markers')

  return {
    // Data
    countyData: countyQuery.data,
    casePoints: caseQuery.data,

    // Loading states
    isLoading: countyQuery.isLoading || caseQuery.isLoading,
    isCountyLoading: countyQuery.isLoading,
    isCaseLoading: caseQuery.isLoading,

    // Error states
    error: countyQuery.error || caseQuery.error,
    countyError: countyQuery.error,
    caseError: caseQuery.error,

    // Refetch functions
    refetchCounties: countyQuery.refetch,
    refetchCases: caseQuery.refetch,

    // View state
    ...viewState,
  }
}
