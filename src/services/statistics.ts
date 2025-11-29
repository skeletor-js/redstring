/**
 * API client methods for statistics-related endpoints.
 *
 * Provides typed functions for fetching various statistical breakdowns
 * and analytics for the RedString application.
 */

import { apiClient } from './api'
import { FilterState } from '../types/filter'
import {
  StatisticsSummary,
  DemographicsResponse,
  WeaponStatistics,
  CircumstanceStatistics,
  RelationshipStatistics,
  GeographicStatistics,
  TrendStatistics,
  SeasonalStatistics,
  StatisticsFilters,
} from '../types/statistics'

/**
 * Convert FilterState to statistics-specific query parameters.
 *
 * Transforms the internal filter state into the format expected by
 * the statistics API endpoints.
 *
 * @param filters - Filter state from Zustand store
 * @returns API-compatible query parameters for statistics endpoints
 */
const buildStatisticsParams = (filters: FilterState): StatisticsFilters => {
  // Map to statistics-specific parameter names
  const params: StatisticsFilters = {}

  if (filters.yearRange[0] !== 1976) {
    params.start_year = filters.yearRange[0]
  }
  if (filters.yearRange[1] !== 2023) {
    params.end_year = filters.yearRange[1]
  }
  if (filters.states.length === 1) {
    params.state = filters.states[0]
  }
  if (filters.solved !== 'all') {
    params.solved = filters.solved === 'solved'
  }
  if (filters.weapon.length === 1) {
    params.weapon = filters.weapon[0]
  }
  if (filters.vicSex.length === 1) {
    params.victim_sex = filters.vicSex[0]
  }
  if (filters.vicRace.length === 1) {
    params.victim_race = filters.vicRace[0]
  }
  if (filters.vicAgeRange[0] !== 0) {
    params.victim_age_min = filters.vicAgeRange[0]
  }
  if (filters.vicAgeRange[1] !== 99) {
    params.victim_age_max = filters.vicAgeRange[1]
  }
  if (filters.relationship.length === 1) {
    params.relationship = filters.relationship[0]
  }
  if (filters.circumstance.length === 1) {
    params.circumstance = filters.circumstance[0]
  }

  return params
}

/**
 * Fetch summary statistics for the current filter state.
 *
 * Returns high-level KPIs including total cases, solve rates,
 * and coverage information.
 *
 * @param filters - Filter criteria from the filter store
 * @returns Promise resolving to statistics summary
 */
export const fetchSummary = async (
  filters: FilterState
): Promise<StatisticsSummary> => {
  const params = buildStatisticsParams(filters)

  const response = await apiClient.get<StatisticsSummary>('/api/statistics/summary', {
    params,
  })
  return response.data
}

/**
 * Fetch demographic breakdown statistics.
 *
 * Returns case statistics broken down by sex, race, and age group.
 *
 * @param filters - Filter criteria from the filter store
 * @returns Promise resolving to demographics response
 */
export const fetchDemographics = async (
  filters: FilterState
): Promise<DemographicsResponse> => {
  const params = buildStatisticsParams(filters)

  const response = await apiClient.get<DemographicsResponse>(
    '/api/statistics/demographics',
    { params }
  )
  return response.data
}

/**
 * Fetch weapon statistics.
 *
 * Returns case statistics broken down by weapon type.
 *
 * @param filters - Filter criteria from the filter store
 * @returns Promise resolving to weapon statistics
 */
export const fetchWeapons = async (filters: FilterState): Promise<WeaponStatistics> => {
  const params = buildStatisticsParams(filters)

  const response = await apiClient.get<WeaponStatistics>('/api/statistics/weapons', {
    params,
  })
  return response.data
}

/**
 * Fetch circumstance statistics.
 *
 * Returns case statistics broken down by circumstance type.
 *
 * @param filters - Filter criteria from the filter store
 * @returns Promise resolving to circumstance statistics
 */
export const fetchCircumstances = async (
  filters: FilterState
): Promise<CircumstanceStatistics> => {
  const params = buildStatisticsParams(filters)

  const response = await apiClient.get<CircumstanceStatistics>(
    '/api/statistics/circumstances',
    { params }
  )
  return response.data
}

/**
 * Fetch relationship statistics.
 *
 * Returns case statistics broken down by victim-offender relationship.
 *
 * @param filters - Filter criteria from the filter store
 * @returns Promise resolving to relationship statistics
 */
export const fetchRelationships = async (
  filters: FilterState
): Promise<RelationshipStatistics> => {
  const params = buildStatisticsParams(filters)

  const response = await apiClient.get<RelationshipStatistics>(
    '/api/statistics/relationships',
    { params }
  )
  return response.data
}

/**
 * Fetch geographic statistics.
 *
 * Returns top states and counties by case count.
 *
 * @param filters - Filter criteria from the filter store
 * @param topN - Number of top results to return (default: 10)
 * @returns Promise resolving to geographic statistics
 */
export const fetchGeographic = async (
  filters: FilterState,
  topN: number = 10
): Promise<GeographicStatistics> => {
  const params = {
    ...buildStatisticsParams(filters),
    top_n: topN,
  }

  const response = await apiClient.get<GeographicStatistics>(
    '/api/statistics/geographic',
    { params }
  )
  return response.data
}

/**
 * Fetch trend statistics.
 *
 * Returns yearly case data with trend analysis.
 *
 * @param filters - Filter criteria from the filter store
 * @returns Promise resolving to trend statistics
 */
export const fetchTrends = async (filters: FilterState): Promise<TrendStatistics> => {
  const params = buildStatisticsParams(filters)

  const response = await apiClient.get<TrendStatistics>('/api/statistics/trends', {
    params,
  })
  return response.data
}

/**
 * Fetch seasonal statistics.
 *
 * Returns monthly case patterns and seasonal analysis.
 *
 * @param filters - Filter criteria from the filter store
 * @returns Promise resolving to seasonal statistics
 */
export const fetchSeasonal = async (
  filters: FilterState
): Promise<SeasonalStatistics> => {
  const params = buildStatisticsParams(filters)

  const response = await apiClient.get<SeasonalStatistics>('/api/statistics/seasonal', {
    params,
  })
  return response.data
}

/**
 * Fetch all statistics data in parallel.
 *
 * Convenience method to fetch all statistics at once for the dashboard.
 * Uses Promise.allSettled to handle partial failures gracefully.
 *
 * @param filters - Filter criteria from the filter store
 * @returns Promise resolving to object with all statistics data
 */
export const fetchAllStatistics = async (
  filters: FilterState
): Promise<{
  summary: StatisticsSummary | null
  demographics: DemographicsResponse | null
  weapons: WeaponStatistics | null
  circumstances: CircumstanceStatistics | null
  relationships: RelationshipStatistics | null
  geographic: GeographicStatistics | null
  trends: TrendStatistics | null
  seasonal: SeasonalStatistics | null
}> => {
  const results = await Promise.allSettled([
    fetchSummary(filters),
    fetchDemographics(filters),
    fetchWeapons(filters),
    fetchCircumstances(filters),
    fetchRelationships(filters),
    fetchGeographic(filters),
    fetchTrends(filters),
    fetchSeasonal(filters),
  ])

  return {
    summary: results[0].status === 'fulfilled' ? results[0].value : null,
    demographics: results[1].status === 'fulfilled' ? results[1].value : null,
    weapons: results[2].status === 'fulfilled' ? results[2].value : null,
    circumstances: results[3].status === 'fulfilled' ? results[3].value : null,
    relationships: results[4].status === 'fulfilled' ? results[4].value : null,
    geographic: results[5].status === 'fulfilled' ? results[5].value : null,
    trends: results[6].status === 'fulfilled' ? results[6].value : null,
    seasonal: results[7].status === 'fulfilled' ? results[7].value : null,
  }
}
