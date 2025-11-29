/**
 * TanStack Query hooks for statistics data fetching and caching.
 *
 * Provides React hooks that manage server state for statistics visualization,
 * including summary, demographics, weapons, and other statistical breakdowns.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useFilterStore } from '../stores/useFilterStore'
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
} from '../types/statistics'
import {
  fetchSummary,
  fetchDemographics,
  fetchWeapons,
  fetchCircumstances,
  fetchRelationships,
  fetchGeographic,
  fetchTrends,
  fetchSeasonal,
} from '../services/statistics'
import { AppError, logError } from '../utils/errorHandler'

/**
 * Query key factory for statistics-related queries.
 *
 * Provides consistent query keys for caching and invalidation.
 */
export const statisticsKeys = {
  all: ['statistics'] as const,
  summary: () => [...statisticsKeys.all, 'summary'] as const,
  summaryWithFilters: (filters: FilterState) =>
    [...statisticsKeys.summary(), filters] as const,
  demographics: () => [...statisticsKeys.all, 'demographics'] as const,
  demographicsWithFilters: (filters: FilterState) =>
    [...statisticsKeys.demographics(), filters] as const,
  weapons: () => [...statisticsKeys.all, 'weapons'] as const,
  weaponsWithFilters: (filters: FilterState) =>
    [...statisticsKeys.weapons(), filters] as const,
  circumstances: () => [...statisticsKeys.all, 'circumstances'] as const,
  circumstancesWithFilters: (filters: FilterState) =>
    [...statisticsKeys.circumstances(), filters] as const,
  relationships: () => [...statisticsKeys.all, 'relationships'] as const,
  relationshipsWithFilters: (filters: FilterState) =>
    [...statisticsKeys.relationships(), filters] as const,
  geographic: () => [...statisticsKeys.all, 'geographic'] as const,
  geographicWithFilters: (filters: FilterState, topN: number) =>
    [...statisticsKeys.geographic(), filters, topN] as const,
  trends: () => [...statisticsKeys.all, 'trends'] as const,
  trendsWithFilters: (filters: FilterState) =>
    [...statisticsKeys.trends(), filters] as const,
  seasonal: () => [...statisticsKeys.all, 'seasonal'] as const,
  seasonalWithFilters: (filters: FilterState) =>
    [...statisticsKeys.seasonal(), filters] as const,
}

/**
 * Helper to get current filters from the store.
 */
const useCurrentFilters = (): FilterState => {
  return useFilterStore((state) => ({
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
}

/**
 * Hook to fetch summary statistics.
 *
 * Returns high-level KPIs including total cases, solve rates,
 * and coverage information.
 *
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with statistics summary
 */
export const useStatisticsSummary = (
  enabled: boolean = true
): UseQueryResult<StatisticsSummary, AppError> => {
  const filters = useCurrentFilters()

  return useQuery({
    queryKey: statisticsKeys.summaryWithFilters(filters),
    queryFn: async () => {
      try {
        return await fetchSummary(filters)
      } catch (error) {
        logError(error, { filters, context: 'useStatisticsSummary' })
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
 * Hook to fetch demographics statistics.
 *
 * Returns case statistics broken down by sex, race, and age group.
 *
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with demographics data
 */
export const useDemographics = (
  enabled: boolean = true
): UseQueryResult<DemographicsResponse, AppError> => {
  const filters = useCurrentFilters()

  return useQuery({
    queryKey: statisticsKeys.demographicsWithFilters(filters),
    queryFn: async () => {
      try {
        return await fetchDemographics(filters)
      } catch (error) {
        logError(error, { filters, context: 'useDemographics' })
        throw error
      }
    },
    enabled,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false
      return (error as unknown as AppError)?.retryable ?? false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Hook to fetch weapon statistics.
 *
 * Returns case statistics broken down by weapon type.
 *
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with weapon statistics
 */
export const useWeaponStatistics = (
  enabled: boolean = true
): UseQueryResult<WeaponStatistics, AppError> => {
  const filters = useCurrentFilters()

  return useQuery({
    queryKey: statisticsKeys.weaponsWithFilters(filters),
    queryFn: async () => {
      try {
        return await fetchWeapons(filters)
      } catch (error) {
        logError(error, { filters, context: 'useWeaponStatistics' })
        throw error
      }
    },
    enabled,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false
      return (error as unknown as AppError)?.retryable ?? false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Hook to fetch circumstance statistics.
 *
 * Returns case statistics broken down by circumstance type.
 *
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with circumstance statistics
 */
export const useCircumstanceStatistics = (
  enabled: boolean = true
): UseQueryResult<CircumstanceStatistics, AppError> => {
  const filters = useCurrentFilters()

  return useQuery({
    queryKey: statisticsKeys.circumstancesWithFilters(filters),
    queryFn: async () => {
      try {
        return await fetchCircumstances(filters)
      } catch (error) {
        logError(error, { filters, context: 'useCircumstanceStatistics' })
        throw error
      }
    },
    enabled,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false
      return (error as unknown as AppError)?.retryable ?? false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Hook to fetch relationship statistics.
 *
 * Returns case statistics broken down by victim-offender relationship.
 *
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with relationship statistics
 */
export const useRelationshipStatistics = (
  enabled: boolean = true
): UseQueryResult<RelationshipStatistics, AppError> => {
  const filters = useCurrentFilters()

  return useQuery({
    queryKey: statisticsKeys.relationshipsWithFilters(filters),
    queryFn: async () => {
      try {
        return await fetchRelationships(filters)
      } catch (error) {
        logError(error, { filters, context: 'useRelationshipStatistics' })
        throw error
      }
    },
    enabled,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false
      return (error as unknown as AppError)?.retryable ?? false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Hook to fetch geographic statistics.
 *
 * Returns top states and counties by case count.
 *
 * @param topN - Number of top results to return (default: 10)
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with geographic statistics
 */
export const useGeographicStatistics = (
  topN: number = 10,
  enabled: boolean = true
): UseQueryResult<GeographicStatistics, AppError> => {
  const filters = useCurrentFilters()

  return useQuery({
    queryKey: statisticsKeys.geographicWithFilters(filters, topN),
    queryFn: async () => {
      try {
        return await fetchGeographic(filters, topN)
      } catch (error) {
        logError(error, { filters, topN, context: 'useGeographicStatistics' })
        throw error
      }
    },
    enabled,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false
      return (error as unknown as AppError)?.retryable ?? false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Hook to fetch trend statistics.
 *
 * Returns yearly case data with trend analysis.
 *
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with trend statistics
 */
export const useTrendStatistics = (
  enabled: boolean = true
): UseQueryResult<TrendStatistics, AppError> => {
  const filters = useCurrentFilters()

  return useQuery({
    queryKey: statisticsKeys.trendsWithFilters(filters),
    queryFn: async () => {
      try {
        return await fetchTrends(filters)
      } catch (error) {
        logError(error, { filters, context: 'useTrendStatistics' })
        throw error
      }
    },
    enabled,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false
      return (error as unknown as AppError)?.retryable ?? false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Hook to fetch seasonal statistics.
 *
 * Returns monthly case patterns and seasonal analysis.
 *
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with seasonal statistics
 */
export const useSeasonalStatistics = (
  enabled: boolean = true
): UseQueryResult<SeasonalStatistics, AppError> => {
  const filters = useCurrentFilters()

  return useQuery({
    queryKey: statisticsKeys.seasonalWithFilters(filters),
    queryFn: async () => {
      try {
        return await fetchSeasonal(filters)
      } catch (error) {
        logError(error, { filters, context: 'useSeasonalStatistics' })
        throw error
      }
    },
    enabled,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false
      return (error as unknown as AppError)?.retryable ?? false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Combined hook for all statistics data.
 *
 * Provides all statistics-related data in a single hook for the dashboard.
 *
 * @returns Combined statistics data and loading states
 *
 * @example
 * ```tsx
 * const {
 *   summary,
 *   demographics,
 *   weapons,
 *   isLoading,
 *   error,
 * } = useStatistics();
 * ```
 */
export const useStatistics = () => {
  const summaryQuery = useStatisticsSummary()
  const demographicsQuery = useDemographics()
  const weaponsQuery = useWeaponStatistics()
  const circumstancesQuery = useCircumstanceStatistics()
  const relationshipsQuery = useRelationshipStatistics()
  const geographicQuery = useGeographicStatistics()
  const trendsQuery = useTrendStatistics()
  const seasonalQuery = useSeasonalStatistics()

  const isLoading =
    summaryQuery.isLoading ||
    demographicsQuery.isLoading ||
    weaponsQuery.isLoading ||
    circumstancesQuery.isLoading ||
    relationshipsQuery.isLoading ||
    geographicQuery.isLoading ||
    trendsQuery.isLoading ||
    seasonalQuery.isLoading

  const error =
    summaryQuery.error ||
    demographicsQuery.error ||
    weaponsQuery.error ||
    circumstancesQuery.error ||
    relationshipsQuery.error ||
    geographicQuery.error ||
    trendsQuery.error ||
    seasonalQuery.error

  return {
    // Data
    summary: summaryQuery.data,
    demographics: demographicsQuery.data,
    weapons: weaponsQuery.data,
    circumstances: circumstancesQuery.data,
    relationships: relationshipsQuery.data,
    geographic: geographicQuery.data,
    trends: trendsQuery.data,
    seasonal: seasonalQuery.data,

    // Loading states
    isLoading,
    isSummaryLoading: summaryQuery.isLoading,
    isDemographicsLoading: demographicsQuery.isLoading,
    isWeaponsLoading: weaponsQuery.isLoading,
    isCircumstancesLoading: circumstancesQuery.isLoading,
    isRelationshipsLoading: relationshipsQuery.isLoading,
    isGeographicLoading: geographicQuery.isLoading,
    isTrendsLoading: trendsQuery.isLoading,
    isSeasonalLoading: seasonalQuery.isLoading,

    // Error states
    error,
    summaryError: summaryQuery.error,
    demographicsError: demographicsQuery.error,
    weaponsError: weaponsQuery.error,
    circumstancesError: circumstancesQuery.error,
    relationshipsError: relationshipsQuery.error,
    geographicError: geographicQuery.error,
    trendsError: trendsQuery.error,
    seasonalError: seasonalQuery.error,

    // Refetch functions
    refetchSummary: summaryQuery.refetch,
    refetchDemographics: demographicsQuery.refetch,
    refetchWeapons: weaponsQuery.refetch,
    refetchCircumstances: circumstancesQuery.refetch,
    refetchRelationships: relationshipsQuery.refetch,
    refetchGeographic: geographicQuery.refetch,
    refetchTrends: trendsQuery.refetch,
    refetchSeasonal: seasonalQuery.refetch,
  }
}
