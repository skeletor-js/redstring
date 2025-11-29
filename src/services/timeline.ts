/**
 * API client methods for timeline-related endpoints.
 *
 * Provides typed functions for fetching timeline data and trend analysis
 * for temporal visualization of case statistics.
 */

import { apiClient } from './api'
import { FilterState } from '../types/filter'
import { buildQueryParams } from './cases'
import {
  TimelineDataResponse,
  TimelineTrendResponse,
  TimelineGranularity,
  TimelineMetric,
  TimelineDataParams,
  TimelineTrendParams,
} from '../types/timeline'

/**
 * Build timeline-specific query parameters from filter state.
 *
 * Extends the base query params with timeline-specific options.
 *
 * @param filters - Filter state from Zustand store
 * @param granularity - Time granularity (year, month, decade)
 * @returns API-compatible query parameters for timeline endpoints
 */
const buildTimelineParams = (
  filters: FilterState,
  granularity: TimelineGranularity = 'year'
): TimelineDataParams => {
  const baseParams = buildQueryParams(filters)

  return {
    granularity,
    year_start: filters.yearRange[0],
    year_end: filters.yearRange[1],
    state_code: filters.states.length === 1 ? filters.states[0] : undefined,
    solved_status: filters.solved !== 'all' ? filters.solved : undefined,
  }
}

/**
 * Fetch timeline data for case statistics over time.
 *
 * Returns aggregated case counts (total, solved, unsolved) grouped by
 * the specified time granularity.
 *
 * @param filters - Filter criteria from the filter store
 * @param granularity - Time granularity: 'year', 'month', or 'decade'
 * @returns Promise resolving to timeline data response
 */
export const fetchTimelineData = async (
  filters: FilterState,
  granularity: TimelineGranularity = 'year'
): Promise<TimelineDataResponse> => {
  const params = buildTimelineParams(filters, granularity)

  const response = await apiClient.get<TimelineDataResponse>('/api/timeline/data', {
    params,
  })
  return response.data
}

/**
 * Fetch trend analysis data for a specific metric.
 *
 * Returns time series data with optional moving average calculation
 * for trend visualization.
 *
 * @param filters - Filter criteria from the filter store
 * @param metric - Metric to analyze: 'solve_rate', 'total_cases', etc.
 * @param granularity - Time granularity: 'year', 'month', or 'decade'
 * @param movingAverageWindow - Window size for moving average (default: 3)
 * @returns Promise resolving to trend response
 */
export const fetchTimelineTrends = async (
  filters: FilterState,
  metric: TimelineMetric = 'solve_rate',
  granularity: TimelineGranularity = 'year',
  movingAverageWindow: number = 3
): Promise<TimelineTrendResponse> => {
  const baseParams = buildTimelineParams(filters, granularity)

  const params: TimelineTrendParams = {
    ...baseParams,
    metric,
    moving_average_window: movingAverageWindow,
  }

  const response = await apiClient.get<TimelineTrendResponse>('/api/timeline/trends', {
    params,
  })
  return response.data
}

/**
 * Fetch timeline data for a specific state.
 *
 * Convenience method for state-level timeline analysis.
 *
 * @param stateCode - State code (e.g., "CA", "TX")
 * @param granularity - Time granularity
 * @param yearStart - Start year for the range
 * @param yearEnd - End year for the range
 * @returns Promise resolving to timeline data response
 */
export const fetchStateTimeline = async (
  stateCode: string,
  granularity: TimelineGranularity = 'year',
  yearStart: number = 1976,
  yearEnd: number = 2023
): Promise<TimelineDataResponse> => {
  const params: TimelineDataParams = {
    granularity,
    year_start: yearStart,
    year_end: yearEnd,
    state_code: stateCode,
  }

  const response = await apiClient.get<TimelineDataResponse>('/api/timeline/data', {
    params,
  })
  return response.data
}

/**
 * Fetch comparison timeline data for multiple states.
 *
 * Useful for comparing trends across different regions.
 *
 * @param stateCodes - Array of state codes to compare
 * @param granularity - Time granularity
 * @param yearStart - Start year for the range
 * @param yearEnd - End year for the range
 * @returns Promise resolving to array of timeline responses
 */
export const fetchStateComparison = async (
  stateCodes: string[],
  granularity: TimelineGranularity = 'year',
  yearStart: number = 1976,
  yearEnd: number = 2023
): Promise<Map<string, TimelineDataResponse>> => {
  const results = new Map<string, TimelineDataResponse>()

  // Fetch data for each state in parallel
  const promises = stateCodes.map(async (stateCode) => {
    const data = await fetchStateTimeline(stateCode, granularity, yearStart, yearEnd)
    return { stateCode, data }
  })

  const responses = await Promise.all(promises)

  responses.forEach(({ stateCode, data }) => {
    results.set(stateCode, data)
  })

  return results
}
