/**
 * TanStack Query hooks for timeline data fetching and caching.
 *
 * Provides React hooks that manage server state for timeline visualization,
 * including timeline data and trend analysis with automatic caching.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useFilterStore } from '../stores/useFilterStore'
import { FilterState } from '../types/filter'
import {
  TimelineDataResponse,
  TimelineTrendResponse,
  TimelineGranularity,
  TimelineMetric,
  TimelineChartType,
  TimelineDataPoint,
  TimelineSummaryStats,
} from '../types/timeline'
import { fetchTimelineData, fetchTimelineTrends } from '../services/timeline'
import { AppError, logError } from '../utils/errorHandler'
import { useState, useCallback, useMemo } from 'react'

/**
 * Query key factory for timeline-related queries.
 *
 * Provides consistent query keys for caching and invalidation.
 */
export const timelineKeys = {
  all: ['timeline'] as const,
  data: () => [...timelineKeys.all, 'data'] as const,
  dataWithFilters: (filters: FilterState, granularity: TimelineGranularity) =>
    [...timelineKeys.data(), filters, granularity] as const,
  trends: () => [...timelineKeys.all, 'trends'] as const,
  trendsWithParams: (
    filters: FilterState,
    metric: TimelineMetric,
    granularity: TimelineGranularity,
    window: number
  ) => [...timelineKeys.trends(), filters, metric, granularity, window] as const,
}

/**
 * Hook to fetch timeline data for case statistics over time.
 *
 * Returns aggregated case counts grouped by the specified time granularity.
 * Integrates with the filter store for automatic filter synchronization.
 *
 * @param granularity - Time granularity: 'year', 'month', or 'decade'
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with timeline data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTimelineData('year');
 *
 * if (isLoading) return <TimelineSkeleton />;
 * if (error) return <ErrorMessage>{getUserMessage(error)}</ErrorMessage>;
 *
 * return <TimelineChart data={data.data} />;
 * ```
 */
export const useTimelineData = (
  granularity: TimelineGranularity = 'year',
  enabled: boolean = true
): UseQueryResult<TimelineDataResponse, AppError> => {
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
    queryKey: timelineKeys.dataWithFilters(filters, granularity),
    queryFn: async () => {
      try {
        return await fetchTimelineData(filters, granularity)
      } catch (error) {
        logError(error, { filters, granularity, context: 'useTimelineData' })
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
 * Hook to fetch trend analysis data for a specific metric.
 *
 * Returns time series data with optional moving average calculation.
 *
 * @param metric - Metric to analyze: 'solve_rate', 'total_cases', etc.
 * @param granularity - Time granularity: 'year', 'month', or 'decade'
 * @param movingAverageWindow - Window size for moving average (default: 3)
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with trend data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTimelineTrends('solve_rate', 'year', 5);
 *
 * if (isLoading) return <Spinner />;
 *
 * return <TrendChart trends={data.trends} />;
 * ```
 */
export const useTimelineTrends = (
  metric: TimelineMetric = 'solve_rate',
  granularity: TimelineGranularity = 'year',
  movingAverageWindow: number = 3,
  enabled: boolean = true
): UseQueryResult<TimelineTrendResponse, AppError> => {
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
    queryKey: timelineKeys.trendsWithParams(
      filters,
      metric,
      granularity,
      movingAverageWindow
    ),
    queryFn: async () => {
      try {
        return await fetchTimelineTrends(
          filters,
          metric,
          granularity,
          movingAverageWindow
        )
      } catch (error) {
        logError(error, {
          filters,
          metric,
          granularity,
          movingAverageWindow,
          context: 'useTimelineTrends',
        })
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
 * Hook to manage timeline view state (granularity, chart type, metric).
 *
 * Provides state management for timeline visualization options.
 *
 * @returns Timeline view state and setters
 *
 * @example
 * ```tsx
 * const { granularity, setGranularity, chartType, setChartType } = useTimelineViewState();
 *
 * return (
 *   <TimelineControls
 *     granularity={granularity}
 *     onGranularityChange={setGranularity}
 *     chartType={chartType}
 *     onChartTypeChange={setChartType}
 *   />
 * );
 * ```
 */
export const useTimelineViewState = () => {
  const [granularity, setGranularity] = useState<TimelineGranularity>('year')
  const [chartType, setChartType] = useState<TimelineChartType>('area')
  const [metric, setMetric] = useState<TimelineMetric>('solve_rate')
  const [movingAverageWindow, setMovingAverageWindow] = useState<number>(3)
  const [showTrends, setShowTrends] = useState<boolean>(false)

  const handleGranularityChange = useCallback((g: TimelineGranularity) => {
    setGranularity(g)
  }, [])

  const handleChartTypeChange = useCallback((type: TimelineChartType) => {
    setChartType(type)
  }, [])

  const handleMetricChange = useCallback((m: TimelineMetric) => {
    setMetric(m)
  }, [])

  const handleMovingAverageWindowChange = useCallback((window: number) => {
    setMovingAverageWindow(window)
  }, [])

  const handleShowTrendsChange = useCallback((show: boolean) => {
    setShowTrends(show)
  }, [])

  return {
    granularity,
    setGranularity: handleGranularityChange,
    chartType,
    setChartType: handleChartTypeChange,
    metric,
    setMetric: handleMetricChange,
    movingAverageWindow,
    setMovingAverageWindow: handleMovingAverageWindowChange,
    showTrends,
    setShowTrends: handleShowTrendsChange,
  }
}

/**
 * Calculate summary statistics from timeline data.
 *
 * @param data - Array of timeline data points
 * @returns Summary statistics object
 */
const calculateSummaryStats = (data: TimelineDataPoint[]): TimelineSummaryStats => {
  if (!data || data.length === 0) {
    return {
      totalCases: 0,
      averageSolveRate: 0,
      peakPeriod: '',
      peakCases: 0,
      trendDirection: 'stable',
      trendPercentage: 0,
    }
  }

  // Calculate totals
  const totalCases = data.reduce((sum, d) => sum + d.total_cases, 0)
  const averageSolveRate = data.reduce((sum, d) => sum + d.solve_rate, 0) / data.length

  // Find peak period
  const peakPoint = data.reduce(
    (max, d) => (d.total_cases > max.total_cases ? d : max),
    data[0]
  )

  // Calculate trend (compare first and last thirds)
  const thirdLength = Math.floor(data.length / 3)
  if (thirdLength > 0) {
    const firstThird = data.slice(0, thirdLength)
    const lastThird = data.slice(-thirdLength)

    const firstAvg = firstThird.reduce((sum, d) => sum + d.total_cases, 0) / thirdLength
    const lastAvg = lastThird.reduce((sum, d) => sum + d.total_cases, 0) / thirdLength

    const percentChange = ((lastAvg - firstAvg) / firstAvg) * 100

    let trendDirection: 'up' | 'down' | 'stable' = 'stable'
    if (percentChange > 5) trendDirection = 'up'
    else if (percentChange < -5) trendDirection = 'down'

    return {
      totalCases,
      averageSolveRate,
      peakPeriod: peakPoint.period,
      peakCases: peakPoint.total_cases,
      trendDirection,
      trendPercentage: Math.abs(percentChange),
    }
  }

  return {
    totalCases,
    averageSolveRate,
    peakPeriod: peakPoint.period,
    peakCases: peakPoint.total_cases,
    trendDirection: 'stable',
    trendPercentage: 0,
  }
}

/**
 * Combined hook for timeline data and view state.
 *
 * Provides all timeline-related data and state in a single hook.
 *
 * @returns Combined timeline data and view state
 *
 * @example
 * ```tsx
 * const {
 *   timelineData,
 *   trendData,
 *   isLoading,
 *   error,
 *   granularity,
 *   setGranularity,
 *   summaryStats,
 * } = useTimeline();
 * ```
 */
export const useTimeline = () => {
  const viewState = useTimelineViewState()
  const timelineQuery = useTimelineData(viewState.granularity)
  const trendQuery = useTimelineTrends(
    viewState.metric,
    viewState.granularity,
    viewState.movingAverageWindow,
    viewState.showTrends
  )

  // Calculate summary statistics from timeline data
  const summaryStats = useMemo(() => {
    if (timelineQuery.data?.data) {
      return calculateSummaryStats(timelineQuery.data.data)
    }
    return null
  }, [timelineQuery.data])

  return {
    // Data
    timelineData: timelineQuery.data,
    trendData: trendQuery.data,
    summaryStats,

    // Loading states
    isLoading: timelineQuery.isLoading,
    isTimelineLoading: timelineQuery.isLoading,
    isTrendLoading: trendQuery.isLoading,

    // Error states
    error: timelineQuery.error || trendQuery.error,
    timelineError: timelineQuery.error,
    trendError: trendQuery.error,

    // Refetch functions
    refetchTimeline: timelineQuery.refetch,
    refetchTrends: trendQuery.refetch,

    // View state
    ...viewState,
  }
}
