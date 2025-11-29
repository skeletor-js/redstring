/**
 * API client methods for map-related endpoints.
 *
 * Provides typed functions for fetching county data and case points
 * for map visualization.
 */

import { apiClient } from './api'
import { FilterState } from '../types/filter'
import { buildQueryParams } from './cases'
import {
  MapDataResponse,
  MapCasesResponse,
  CountyMapData,
  MapCasePoint,
} from '../types/map'

/**
 * Fetch county-level aggregated data for map visualization.
 *
 * Returns county centroids with case statistics for choropleth/marker display.
 *
 * @param filters - Filter criteria from the filter store
 * @returns Promise resolving to county map data with bounds
 */
export const fetchCountyData = async (
  filters: FilterState
): Promise<MapDataResponse> => {
  const params = buildQueryParams(filters)

  const response = await apiClient.get<MapDataResponse>('/api/map/counties', {
    params,
  })
  return response.data
}

/**
 * Fetch individual case points for map visualization.
 *
 * Returns case locations for marker display when zoomed in.
 * Limited to prevent performance issues with large datasets.
 *
 * @param filters - Filter criteria from the filter store
 * @param limit - Maximum number of cases to return (default: 1000)
 * @returns Promise resolving to case points with total count
 */
export const fetchCasePoints = async (
  filters: FilterState,
  limit: number = 1000
): Promise<MapCasesResponse> => {
  const params = {
    ...buildQueryParams(filters),
    limit,
  }

  const response = await apiClient.get<MapCasesResponse>('/api/map/cases', {
    params,
  })
  return response.data
}

/**
 * Fetch county data for a specific state.
 *
 * Useful for state-level zoom views.
 *
 * @param stateCode - State code (e.g., "CA", "TX")
 * @param filters - Additional filter criteria
 * @returns Promise resolving to county data for the state
 */
export const fetchStateCounties = async (
  stateCode: string,
  filters: FilterState
): Promise<CountyMapData[]> => {
  const params = {
    ...buildQueryParams(filters),
    state: stateCode,
  }

  const response = await apiClient.get<{ counties: CountyMapData[] }>(
    '/api/map/counties',
    { params }
  )
  return response.data.counties
}

/**
 * Fetch case points within a bounding box.
 *
 * Used for loading cases in the current map viewport.
 *
 * @param bounds - Map bounds { north, south, east, west }
 * @param filters - Filter criteria
 * @param limit - Maximum number of cases
 * @returns Promise resolving to case points within bounds
 */
export const fetchCasesInBounds = async (
  bounds: { north: number; south: number; east: number; west: number },
  filters: FilterState,
  limit: number = 1000
): Promise<MapCasePoint[]> => {
  const params = {
    ...buildQueryParams(filters),
    bounds_north: bounds.north,
    bounds_south: bounds.south,
    bounds_east: bounds.east,
    bounds_west: bounds.west,
    limit,
  }

  const response = await apiClient.get<MapCasesResponse>('/api/map/cases', {
    params,
  })
  return response.data.cases
}
