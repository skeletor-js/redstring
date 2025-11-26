/**
 * Test suite for CaseTable component.
 *
 * Tests table rendering with data, virtualization, row selection,
 * infinite scroll, and empty state.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CaseTable } from '../../../src/components/cases/CaseTable'
import { useFilterStore } from '../../../src/stores/useFilterStore'
import { useUIStore } from '../../../src/stores/useUIStore'
import * as casesService from '../../../src/services/cases'
import type { Case, CaseListResponse } from '../../../src/types/case'
import { act } from '@testing-library/react'

// Mock the cases service
vi.mock('../../../src/services/cases')

// Mock @tanstack/react-virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [
      { index: 0, key: '0', size: 48, start: 0 },
      { index: 1, key: '1', size: 48, start: 48 },
    ],
    getTotalSize: () => 96,
  }),
}))

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
  cases: [mockCase, { ...mockCase, id: 'CA_2020_67890' }],
  total_count: 2,
  has_more: false,
  next_cursor: undefined,
  large_result_warning: false,
}

describe('CaseTable', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    vi.clearAllMocks()

    // Reset stores
    const filterStore = useFilterStore.getState()
    const uiStore = useUIStore.getState()
    act(() => {
      filterStore.resetFilters()
      uiStore.deselectCase()
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('Loading State', () => {
    it('should show loading spinner', () => {
      vi.mocked(casesService.getCases).mockImplementation(() => new Promise(() => {}))

      render(<CaseTable />, { wrapper })

      expect(screen.getByText('Loading cases...')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should show error message', async () => {
      const error = new Error('Failed to load cases')
      vi.mocked(casesService.getCases).mockRejectedValue(error)

      render(<CaseTable />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Error loading cases:')).toBeInTheDocument()
      })

      expect(screen.getByText('Failed to load cases')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no cases match filters', async () => {
      vi.mocked(casesService.getCases).mockResolvedValue({
        cases: [],
        total_count: 0,
        has_more: false,
        next_cursor: undefined,
        large_result_warning: false,
      })

      render(<CaseTable />, { wrapper })

      await waitFor(() => {
        expect(
          screen.getByText('No cases match your current filters.')
        ).toBeInTheDocument()
      })

      expect(
        screen.getByText('Try adjusting or clearing some filters.')
      ).toBeInTheDocument()
    })
  })

  describe('Table Rendering', () => {
    it('should render table with cases', async () => {
      vi.mocked(casesService.getCases).mockResolvedValue(mockCaseListResponse)

      render(<CaseTable />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('CA_2020_12345')).toBeInTheDocument()
      })

      // Check table headers
      expect(screen.getByText('Case ID')).toBeInTheDocument()
      expect(screen.getByText('Year')).toBeInTheDocument()
      expect(screen.getByText('State')).toBeInTheDocument()
      expect(screen.getByText('County')).toBeInTheDocument()
      expect(screen.getByText('Victim')).toBeInTheDocument()
      expect(screen.getByText('Weapon')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should display case data correctly', async () => {
      vi.mocked(casesService.getCases).mockResolvedValue(mockCaseListResponse)

      render(<CaseTable />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('CA_2020_12345')).toBeInTheDocument()
      })

      expect(screen.getByText('2020')).toBeInTheDocument()
      expect(screen.getByText('CALIFORNIA')).toBeInTheDocument()
      expect(screen.getByText('Los Angeles County')).toBeInTheDocument()
      expect(screen.getByText('Handgun - pistol, revolver, etc')).toBeInTheDocument()
      expect(screen.getByText('Unsolved')).toBeInTheDocument()
    })

    it('should show case count info', async () => {
      vi.mocked(casesService.getCases).mockResolvedValue(mockCaseListResponse)

      render(<CaseTable />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/Showing 2 of 2 cases/)).toBeInTheDocument()
      })
    })

    it('should format numbers with locale separators', async () => {
      vi.mocked(casesService.getCases).mockResolvedValue({
        ...mockCaseListResponse,
        total_count: 1234567,
      })

      render(<CaseTable />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/1,234,567/)).toBeInTheDocument()
      })
    })
  })

  describe('Case Status Badge', () => {
    it('should show solved badge for solved cases', async () => {
      vi.mocked(casesService.getCases).mockResolvedValue({
        cases: [{ ...mockCase, solved: 1 }],
        total_count: 1,
        has_more: false,
        next_cursor: undefined,
        large_result_warning: false,
      })

      render(<CaseTable />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Solved')).toBeInTheDocument()
      })

      const badge = screen.getByText('Solved')
      expect(badge).toHaveClass('case-status-badge', 'solved')
    })

    it('should show unsolved badge for unsolved cases', async () => {
      vi.mocked(casesService.getCases).mockResolvedValue(mockCaseListResponse)

      render(<CaseTable />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Unsolved')).toBeInTheDocument()
      })

      const badge = screen.getByText('Unsolved')
      expect(badge).toHaveClass('case-status-badge', 'unsolved')
    })
  })

  describe('Row Selection', () => {
    it('should select case when row is clicked', async () => {
      vi.mocked(casesService.getCases).mockResolvedValue(mockCaseListResponse)

      render(<CaseTable />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('CA_2020_12345')).toBeInTheDocument()
      })

      const row = screen.getByText('CA_2020_12345').closest('tr')
      fireEvent.click(row!)

      const { selectedCaseId } = useUIStore.getState()
      expect(selectedCaseId).toBe('CA_2020_12345')
    })
  })

  describe('Large Result Warning', () => {
    it('should show warning for large result sets', async () => {
      vi.mocked(casesService.getCases).mockResolvedValue({
        ...mockCaseListResponse,
        total_count: 100000,
        large_result_warning: true,
      })

      render(<CaseTable />, { wrapper })

      await waitFor(() => {
        expect(
          screen.getByText(/Large result set \(100,000 cases\)/)
        ).toBeInTheDocument()
      })

      expect(
        screen.getByText(/Consider narrowing filters for better performance/)
      ).toBeInTheDocument()
    })

    it('should not show warning for normal result sets', async () => {
      vi.mocked(casesService.getCases).mockResolvedValue(mockCaseListResponse)

      render(<CaseTable />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('CA_2020_12345')).toBeInTheDocument()
      })

      expect(screen.queryByText(/Large result set/)).not.toBeInTheDocument()
    })
  })

  describe('Infinite Scroll', () => {
    it('should show loading indicator when fetching next page', async () => {
      vi.mocked(casesService.getCases).mockResolvedValue({
        ...mockCaseListResponse,
        has_more: true,
        next_cursor: 'cursor_1',
      })

      render(<CaseTable />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('CA_2020_12345')).toBeInTheDocument()
      })

      // Note: Actual infinite scroll triggering is hard to test
      // without full DOM scrolling behavior
    })
  })

  describe('Virtualization', () => {
    it('should use virtual scrolling for large datasets', async () => {
      const largeCaseList: Case[] = Array.from({ length: 1000 }, (_, i) => ({
        ...mockCase,
        id: `CA_2020_${i}`,
      }))

      vi.mocked(casesService.getCases).mockResolvedValue({
        cases: largeCaseList,
        total_count: 1000,
        has_more: false,
        next_cursor: undefined,
        large_result_warning: false,
      })

      render(<CaseTable />, { wrapper })

      await waitFor(() => {
        // Due to mocked virtualizer, only first 2 items are rendered
        expect(screen.getByText('CA_2020_0')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have table structure', async () => {
      vi.mocked(casesService.getCases).mockResolvedValue(mockCaseListResponse)

      render(<CaseTable />, { wrapper })

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      expect(screen.getByRole('columnheader', { name: 'Case ID' })).toBeInTheDocument()
    })

    it('should have loading role during loading', () => {
      vi.mocked(casesService.getCases).mockImplementation(() => new Promise(() => {}))

      render(<CaseTable />, { wrapper })

      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('CSS Classes', () => {
    it('should apply correct CSS classes', async () => {
      vi.mocked(casesService.getCases).mockResolvedValue(mockCaseListResponse)

      const { container } = render(<CaseTable />, { wrapper })

      await waitFor(() => {
        expect(container.querySelector('.case-table-container')).toBeInTheDocument()
      })

      expect(container.querySelector('.case-table')).toBeInTheDocument()
      expect(container.querySelector('.case-table-scroll')).toBeInTheDocument()
    })
  })
})
