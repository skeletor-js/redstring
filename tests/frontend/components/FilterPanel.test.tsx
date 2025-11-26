/**
 * Test suite for FilterPanel component.
 *
 * Tests filter panel rendering, collapsible sections, active filter count badge,
 * and reset functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { FilterPanel } from '../../../src/components/filters/FilterPanel'
import { useFilterStore } from '../../../src/stores/useFilterStore'
import { act } from '@testing-library/react'

// Mock child filter components
vi.mock('../../../src/components/filters/PrimaryFilters', () => ({
  PrimaryFilters: () => <div data-testid="primary-filters">Primary Filters</div>,
}))

vi.mock('../../../src/components/filters/VictimFilters', () => ({
  VictimFilters: () => <div data-testid="victim-filters">Victim Filters</div>,
}))

vi.mock('../../../src/components/filters/CrimeFilters', () => ({
  CrimeFilters: () => <div data-testid="crime-filters">Crime Filters</div>,
}))

vi.mock('../../../src/components/filters/GeographyFilters', () => ({
  GeographyFilters: () => <div data-testid="geography-filters">Geography Filters</div>,
}))

vi.mock('../../../src/components/filters/SearchFilters', () => ({
  SearchFilters: () => <div data-testid="search-filters">Search Filters</div>,
}))

describe('FilterPanel', () => {
  beforeEach(() => {
    // Reset store before each test
    const { resetFilters, collapseAllSections } = useFilterStore.getState()
    act(() => {
      resetFilters()
      collapseAllSections()
    })
  })

  describe('Rendering', () => {
    it('should render the filter panel', () => {
      render(<FilterPanel />)

      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    it('should render all filter sections', () => {
      render(<FilterPanel />)

      expect(screen.getByText('Primary Filters')).toBeInTheDocument()
      expect(screen.getByText('Victim Demographics')).toBeInTheDocument()
      expect(screen.getByText('Crime Details')).toBeInTheDocument()
      expect(screen.getByText('Geography')).toBeInTheDocument()
      expect(screen.getByText('Search')).toBeInTheDocument()
    })

    it('should render help text', () => {
      render(<FilterPanel />)

      expect(
        screen.getByText('Filters apply automatically as you change them.')
      ).toBeInTheDocument()
    })

    it('should not show reset button when no filters are active', () => {
      render(<FilterPanel />)

      expect(screen.queryByText('Reset All')).not.toBeInTheDocument()
    })
  })

  describe('Filter Sections', () => {
    it('should show primary filters section collapsed by default', () => {
      render(<FilterPanel />)

      const primarySection = screen.getByRole('button', { name: /Primary Filters/i })
      expect(primarySection).toHaveAttribute('aria-expanded', 'false')
    })

    it('should expand section when header is clicked', () => {
      render(<FilterPanel />)

      const primaryHeader = screen.getByRole('button', { name: /Primary Filters/i })

      fireEvent.click(primaryHeader)

      expect(primaryHeader).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByTestId('primary-filters')).toBeInTheDocument()
    })

    it('should collapse section when header is clicked again', () => {
      render(<FilterPanel />)

      const primaryHeader = screen.getByRole('button', { name: /Primary Filters/i })

      // Expand
      fireEvent.click(primaryHeader)
      expect(primaryHeader).toHaveAttribute('aria-expanded', 'true')

      // Collapse
      fireEvent.click(primaryHeader)
      expect(primaryHeader).toHaveAttribute('aria-expanded', 'false')
    })

    it('should toggle section independently', () => {
      render(<FilterPanel />)

      const primaryHeader = screen.getByRole('button', { name: /Primary Filters/i })
      const victimHeader = screen.getByRole('button', { name: /Victim Demographics/i })

      // Expand primary
      fireEvent.click(primaryHeader)
      expect(primaryHeader).toHaveAttribute('aria-expanded', 'true')
      expect(victimHeader).toHaveAttribute('aria-expanded', 'false')

      // Expand victim
      fireEvent.click(victimHeader)
      expect(primaryHeader).toHaveAttribute('aria-expanded', 'true')
      expect(victimHeader).toHaveAttribute('aria-expanded', 'true')

      // Collapse primary
      fireEvent.click(primaryHeader)
      expect(primaryHeader).toHaveAttribute('aria-expanded', 'false')
      expect(victimHeader).toHaveAttribute('aria-expanded', 'true')
    })

    it('should have correct aria-controls attributes', () => {
      render(<FilterPanel />)

      const primaryHeader = screen.getByRole('button', { name: /Primary Filters/i })
      expect(primaryHeader).toHaveAttribute('aria-controls', 'filter-section-primary')
    })
  })

  describe('Active Filter Count', () => {
    it('should show reset button with count when filters are active', () => {
      const { setFilters } = useFilterStore.getState()

      act(() => {
        setFilters({
          states: ['CALIFORNIA'],
          yearRange: [2000, 2020],
          solved: 'unsolved',
        })
      })

      render(<FilterPanel />)

      const resetButton = screen.getByRole('button', { name: /Reset All/i })
      expect(resetButton).toBeInTheDocument()

      // Check badge
      const badge = within(resetButton).getByText('3')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('filter-count-badge')
    })

    it('should update count when filters change', () => {
      const { setFilters } = useFilterStore.getState()

      act(() => {
        setFilters({
          states: ['CALIFORNIA'],
        })
      })

      const { rerender } = render(<FilterPanel />)

      expect(screen.getByText('1')).toBeInTheDocument()

      // Add more filters
      act(() => {
        setFilters({
          states: ['CALIFORNIA'],
          yearRange: [2000, 2020],
          solved: 'unsolved',
        })
      })

      rerender(<FilterPanel />)

      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should hide reset button when all filters are cleared', () => {
      const { setFilters, resetFilters } = useFilterStore.getState()

      act(() => {
        setFilters({
          states: ['CALIFORNIA'],
        })
      })

      const { rerender } = render(<FilterPanel />)

      expect(screen.getByText('Reset All')).toBeInTheDocument()

      // Reset filters
      act(() => {
        resetFilters()
      })

      rerender(<FilterPanel />)

      expect(screen.queryByText('Reset All')).not.toBeInTheDocument()
    })
  })

  describe('Reset Functionality', () => {
    it('should reset all filters when reset button is clicked', () => {
      const { setFilters } = useFilterStore.getState()

      act(() => {
        setFilters({
          states: ['CALIFORNIA', 'NEW YORK'],
          yearRange: [2000, 2020],
          solved: 'unsolved',
          vicSex: ['Male'],
        })
      })

      render(<FilterPanel />)

      const resetButton = screen.getByRole('button', { name: /Reset All/i })
      fireEvent.click(resetButton)

      const state = useFilterStore.getState()
      expect(state.states).toEqual([])
      expect(state.yearRange).toEqual([1976, 2023])
      expect(state.solved).toBe('all')
      expect(state.vicSex).toEqual([])
    })

    it('should hide reset button after resetting', () => {
      const { setFilters } = useFilterStore.getState()

      act(() => {
        setFilters({
          states: ['CALIFORNIA'],
        })
      })

      const { rerender } = render(<FilterPanel />)

      const resetButton = screen.getByRole('button', { name: /Reset All/i })
      fireEvent.click(resetButton)

      rerender(<FilterPanel />)

      expect(screen.queryByText('Reset All')).not.toBeInTheDocument()
    })

    it('should have correct title attribute on reset button', () => {
      const { setFilters } = useFilterStore.getState()

      act(() => {
        setFilters({
          states: ['CALIFORNIA'],
        })
      })

      render(<FilterPanel />)

      const resetButton = screen.getByRole('button', { name: /Reset All/i })
      expect(resetButton).toHaveAttribute('title', 'Clear all filters')
    })
  })

  describe('Section Content Visibility', () => {
    it('should only show content for expanded sections', () => {
      render(<FilterPanel />)

      // All sections start collapsed
      expect(screen.queryByTestId('primary-filters')).not.toBeInTheDocument()
      expect(screen.queryByTestId('victim-filters')).not.toBeInTheDocument()
      expect(screen.queryByTestId('crime-filters')).not.toBeInTheDocument()

      // Expand primary
      const primaryHeader = screen.getByRole('button', { name: /Primary Filters/i })
      fireEvent.click(primaryHeader)

      expect(screen.getByTestId('primary-filters')).toBeInTheDocument()
      expect(screen.queryByTestId('victim-filters')).not.toBeInTheDocument()
    })

    it('should maintain expanded state when filters change', () => {
      const { setFilters } = useFilterStore.getState()

      render(<FilterPanel />)

      // Expand primary section
      const primaryHeader = screen.getByRole('button', { name: /Primary Filters/i })
      fireEvent.click(primaryHeader)

      expect(screen.getByTestId('primary-filters')).toBeInTheDocument()

      // Change filters
      act(() => {
        setFilters({ states: ['CALIFORNIA'] })
      })

      // Section should still be expanded
      expect(screen.getByTestId('primary-filters')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<FilterPanel />)

      const primaryHeader = screen.getByRole('button', { name: /Primary Filters/i })

      expect(primaryHeader).toHaveAttribute('aria-expanded')
      expect(primaryHeader).toHaveAttribute('aria-controls')
    })

    it('should update aria-expanded when section is toggled', () => {
      render(<FilterPanel />)

      const primaryHeader = screen.getByRole('button', { name: /Primary Filters/i })

      expect(primaryHeader).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(primaryHeader)

      expect(primaryHeader).toHaveAttribute('aria-expanded', 'true')
    })

    it('should have semantic HTML structure', () => {
      render(<FilterPanel />)

      expect(screen.getByRole('complementary')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Filters' })).toBeInTheDocument()
    })
  })

  describe('CSS Classes', () => {
    it('should apply correct classes to sections', () => {
      const { expandAllSections } = useFilterStore.getState()

      act(() => {
        expandAllSections()
      })

      const { container } = render(<FilterPanel />)

      const sections = container.querySelectorAll('.filter-section')
      expect(sections.length).toBeGreaterThan(0)

      sections.forEach((section) => {
        expect(section).toHaveClass('expanded')
      })
    })

    it('should apply collapsed class when section is collapsed', () => {
      const { container } = render(<FilterPanel />)

      const sections = container.querySelectorAll('.filter-section')
      sections.forEach((section) => {
        expect(section).toHaveClass('collapsed')
      })
    })
  })
})
