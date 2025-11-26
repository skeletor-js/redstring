/**
 * Test suite for useCases hooks (TanStack Query hooks for case data).
 *
 * Tests useCases query hook, useCase by ID hook, infinite scroll behavior,
 * error states, and loading states.
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useCases,
  useCase,
  useStatsSummary,
  useTotalCount,
  useAllCases,
} from '../../../src/hooks/useCases'
import * as casesService from '../../../src/services/cases'
import { DEFAULT_FILTER_STATE } from '../../../src/types/filter'
import type { Case, CaseListResponse, StatsSummary } from '../../../src/types/case'

// Mock the cases service
vi.mock('../../../src/services/cases')

// Mock case data
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

const mockCaseListResponse: CaseListResponse = {
  cases: [mockCase],
  total_count: 1,
  has_more: false,
  next_cursor: undefined,
  large_result_warning: false,
}

const mockStatsSummary: StatsSummary = {
  total_count: 1000,
  solved_count: 600,
  unsolved_count: 400,
  solve_rate: 60.0,
  year_range: [1976, 2023],
  most_common_weapon: 'Handgun - pistol, revolver, etc',
  most_common_state: 'CALIFORNIA',
}

describe('useCases Hooks', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    // Reset mocks
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  describe('useCases', () => {
    it('should fetch cases with filters', async () => {
      vi.mocked(casesService.getCases).mockResolvedValue(mockCaseListResponse)

      const { result } = renderHook(() => useCases(DEFAULT_FILTER_STATE), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.pages).toHaveLength(1)
      expect(result.current.data?.pages[0].cases).toHaveLength(1)
      expect(result.current.data?.pages[0].cases[0].id).toBe('CA_2020_12345')
    })

    it('should handle loading state', () => {
      vi.mocked(casesService.getCases).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(() => useCases(DEFAULT_FILTER_STATE), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle error state', async () => {
      const error = new Error('Failed to fetch cases')
      vi.mocked(casesService.getCases).mockRejectedValue(error)

      const { result } = renderHook(() => useCases(DEFAULT_FILTER_STATE), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toBe('Failed to fetch cases')
    })

    it('should support infinite scroll with pagination', async () => {
      const firstPage: CaseListResponse = {
        cases: [{ ...mockCase, id: 'CA_2020_1' }],
        total_count: 2,
        has_more: true,
        next_cursor: 'cursor_1',
        large_result_warning: false,
      }

      const secondPage: CaseListResponse = {
        cases: [{ ...mockCase, id: 'CA_2020_2' }],
        total_count: 2,
        has_more: false,
        next_cursor: undefined,
        large_result_warning: false,
      }

      vi.mocked(casesService.getCases)
        .mockResolvedValueOnce(firstPage)
        .mockResolvedValueOnce(secondPage)

      const { result } = renderHook(() => useCases(DEFAULT_FILTER_STATE), { wrapper })

      // Wait for first page
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.pages).toHaveLength(1)
      expect(result.current.hasNextPage).toBe(true)

      // Fetch next page
      result.current.fetchNextPage()

      await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))

      expect(result.current.data?.pages[0].cases[0].id).toBe('CA_2020_1')
      expect(result.current.data?.pages[1].cases[0].id).toBe('CA_2020_2')
      expect(result.current.hasNextPage).toBe(false)
    })

    it('should pass correct cursor to API on pagination', async () => {
      const firstPage: CaseListResponse = {
        cases: [mockCase],
        total_count: 2,
        has_more: true,
        next_cursor: 'test_cursor',
        large_result_warning: false,
      }

      vi.mocked(casesService.getCases).mockResolvedValue(firstPage)

      const { result } = renderHook(() => useCases(DEFAULT_FILTER_STATE, 50), {
        wrapper,
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Fetch next page
      result.current.fetchNextPage()

      await waitFor(() => {
        expect(casesService.getCases).toHaveBeenCalledWith(
          DEFAULT_FILTER_STATE,
          'test_cursor',
          50
        )
      })
    })

    it('should show fetching next page state', async () => {
      const firstPage: CaseListResponse = {
        cases: [mockCase],
        total_count: 2,
        has_more: true,
        next_cursor: 'cursor_1',
        large_result_warning: false,
      }

      vi.mocked(casesService.getCases)
        .mockResolvedValueOnce(firstPage)
        .mockImplementation(() => new Promise(() => {})) // Hang on second call

      const { result } = renderHook(() => useCases(DEFAULT_FILTER_STATE), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Start fetching next page
      result.current.fetchNextPage()

      await waitFor(() => expect(result.current.isFetchingNextPage).toBe(true))
    })
  })

  describe('useCase', () => {
    it('should fetch a single case by ID', async () => {
      vi.mocked(casesService.getCaseById).mockResolvedValue(mockCase)

      const { result } = renderHook(() => useCase('CA_2020_12345'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockCase)
      expect(casesService.getCaseById).toHaveBeenCalledWith('CA_2020_12345')
    })

    it('should handle loading state', () => {
      vi.mocked(casesService.getCaseById).mockImplementation(
        () => new Promise(() => {})
      )

      const { result } = renderHook(() => useCase('CA_2020_12345'), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle error state', async () => {
      const error = new Error('Case not found')
      vi.mocked(casesService.getCaseById).mockRejectedValue(error)

      const { result } = renderHook(() => useCase('CA_2020_12345'), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toBe('Case not found')
    })

    it('should not fetch when ID is empty', () => {
      const { result } = renderHook(() => useCase(''), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(casesService.getCaseById).not.toHaveBeenCalled()
    })

    it('should respect enabled parameter', () => {
      const { result } = renderHook(() => useCase('CA_2020_12345', false), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(casesService.getCaseById).not.toHaveBeenCalled()
    })
  })

  describe('useStatsSummary', () => {
    it('should fetch summary statistics', async () => {
      vi.mocked(casesService.getStatsSummary).mockResolvedValue(mockStatsSummary)

      const { result } = renderHook(() => useStatsSummary(DEFAULT_FILTER_STATE), {
        wrapper,
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockStatsSummary)
      expect(result.current.data?.total_count).toBe(1000)
      expect(result.current.data?.solve_rate).toBe(60.0)
    })

    it('should handle loading state', () => {
      vi.mocked(casesService.getStatsSummary).mockImplementation(
        () => new Promise(() => {})
      )

      const { result } = renderHook(() => useStatsSummary(DEFAULT_FILTER_STATE), {
        wrapper,
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle error state', async () => {
      const error = new Error('Failed to fetch stats')
      vi.mocked(casesService.getStatsSummary).mockRejectedValue(error)

      const { result } = renderHook(() => useStatsSummary(DEFAULT_FILTER_STATE), {
        wrapper,
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error?.message).toBe('Failed to fetch stats')
    })

    it('should respect enabled parameter', () => {
      const { result } = renderHook(
        () => useStatsSummary(DEFAULT_FILTER_STATE, false),
        { wrapper }
      )

      expect(result.current.fetchStatus).toBe('idle')
      expect(casesService.getStatsSummary).not.toHaveBeenCalled()
    })
  })

  describe('useTotalCount', () => {
    it('should extract total count from query data', () => {
      const data = {
        pages: [
          { ...mockCaseListResponse, total_count: 500 },
          { ...mockCaseListResponse, total_count: 500 },
        ],
        pageParams: [undefined, 'cursor_1'],
      }

      const { result } = renderHook(() => useTotalCount(data))

      expect(result.current).toBe(500)
    })

    it('should return 0 when data is undefined', () => {
      const { result } = renderHook(() => useTotalCount(undefined))

      expect(result.current).toBe(0)
    })

    it('should return 0 when pages array is empty', () => {
      const data = {
        pages: [],
        pageParams: [],
      }

      const { result } = renderHook(() => useTotalCount(data))

      expect(result.current).toBe(0)
    })
  })

  describe('useAllCases', () => {
    it('should flatten all pages into single array', () => {
      const data = {
        pages: [
          {
            cases: [
              { ...mockCase, id: 'CA_2020_1' },
              { ...mockCase, id: 'CA_2020_2' },
            ],
            total_count: 4,
            has_more: true,
            next_cursor: 'cursor_1',
            large_result_warning: false,
          },
          {
            cases: [
              { ...mockCase, id: 'CA_2020_3' },
              { ...mockCase, id: 'CA_2020_4' },
            ],
            total_count: 4,
            has_more: false,
            next_cursor: undefined,
            large_result_warning: false,
          },
        ],
        pageParams: [undefined, 'cursor_1'],
      }

      const { result } = renderHook(() => useAllCases(data))

      expect(result.current).toHaveLength(4)
      expect(result.current[0].id).toBe('CA_2020_1')
      expect(result.current[1].id).toBe('CA_2020_2')
      expect(result.current[2].id).toBe('CA_2020_3')
      expect(result.current[3].id).toBe('CA_2020_4')
    })

    it('should return empty array when data is undefined', () => {
      const { result } = renderHook(() => useAllCases(undefined))

      expect(result.current).toEqual([])
    })

    it('should return empty array when pages is undefined', () => {
      const data = {
        pages: undefined as any,
        pageParams: [],
      }

      const { result } = renderHook(() => useAllCases(data))

      expect(result.current).toEqual([])
    })
  })

  describe('Query Key Factory', () => {
    it('should use consistent query keys for caching', async () => {
      vi.mocked(casesService.getCases).mockResolvedValue(mockCaseListResponse)

      const filters = { ...DEFAULT_FILTER_STATE, states: ['CALIFORNIA'] }

      const { result: result1 } = renderHook(() => useCases(filters), { wrapper })

      await waitFor(() => expect(result1.current.isSuccess).toBe(true))

      // Second render with same filters should use cache
      const { result: result2 } = renderHook(() => useCases(filters), { wrapper })

      // Should immediately have data from cache
      expect(result2.current.data).toBeDefined()
      expect(result2.current.data?.pages[0].cases[0].id).toBe('CA_2020_12345')
    })
  })
})
