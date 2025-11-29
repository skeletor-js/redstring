/**
 * Test suite for PrimaryFilters component.
 *
 * Tests state multi-select dropdown, year range slider, solved status radio buttons,
 * and filter store updates.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from '@testing-library/react'
import { PrimaryFilters } from '../../../src/components/filters/PrimaryFilters'
import { useFilterStore } from '../../../src/stores/useFilterStore'
import { STATES } from '../../../src/types/filter'

describe('PrimaryFilters', () => {
  beforeEach(() => {
    // Reset store before each test
    const { resetFilters } = useFilterStore.getState()
    act(() => {
      resetFilters()
    })
  })

  describe('Rendering', () => {
    it('should render the filter group', () => {
      render(<PrimaryFilters />)

      expect(screen.getByText('Case Status')).toBeInTheDocument()
      expect(screen.getByText('Year Range')).toBeInTheDocument()
      expect(screen.getByText('States')).toBeInTheDocument()
    })

    it('should render solved status radio buttons', () => {
      render(<PrimaryFilters />)

      expect(screen.getByText('All Cases')).toBeInTheDocument()
      expect(screen.getByText('Solved')).toBeInTheDocument()
      expect(screen.getByText('Unsolved')).toBeInTheDocument()
    })

    it('should render year range inputs with correct bounds', () => {
      render(<PrimaryFilters />)

      const yearMinInput = screen.getByLabelText('From')
      const yearMaxInput = screen.getByLabelText('To')

      expect(yearMinInput).toHaveAttribute('min', '1976')
      expect(yearMinInput).toHaveAttribute('max', '2023')
      expect(yearMaxInput).toHaveAttribute('min', '1976')
      expect(yearMaxInput).toHaveAttribute('max', '2023')
    })

    it('should render state checkboxes for all 51 states', () => {
      render(<PrimaryFilters />)

      // Check a few states are rendered
      expect(screen.getByText('ALABAMA')).toBeInTheDocument()
      expect(screen.getByText('CALIFORNIA')).toBeInTheDocument()
      expect(screen.getByText('NEW YORK')).toBeInTheDocument()
      expect(screen.getByText('WYOMING')).toBeInTheDocument()

      // Verify all states are rendered
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBe(STATES.length)
    })

    it('should render Select All button', () => {
      render(<PrimaryFilters />)

      expect(screen.getByText('Select All')).toBeInTheDocument()
    })
  })

  describe('Default Values', () => {
    it('should have "All Cases" selected by default', () => {
      render(<PrimaryFilters />)

      const allCasesRadio = screen.getByRole('radio', { name: /All Cases/i })
      expect(allCasesRadio).toBeChecked()
    })

    it('should have default year range [1976, 2023]', () => {
      render(<PrimaryFilters />)

      const yearMinInput = screen.getByLabelText('From')
      const yearMaxInput = screen.getByLabelText('To')

      expect(yearMinInput).toHaveValue(1976)
      expect(yearMaxInput).toHaveValue(2023)
    })

    it('should have no states selected by default', () => {
      render(<PrimaryFilters />)

      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked()
      })
    })

    it('should not show Clear button when no states selected', () => {
      render(<PrimaryFilters />)

      expect(screen.queryByText('Clear')).not.toBeInTheDocument()
    })
  })

  describe('Solved Status Changes', () => {
    it('should update filter store when Solved is selected', () => {
      render(<PrimaryFilters />)

      const solvedRadio = screen.getByRole('radio', { name: /^Solved$/i })
      fireEvent.click(solvedRadio)

      const state = useFilterStore.getState()
      expect(state.solved).toBe('solved')
    })

    it('should update filter store when Unsolved is selected', () => {
      render(<PrimaryFilters />)

      const unsolvedRadio = screen.getByRole('radio', { name: /Unsolved/i })
      fireEvent.click(unsolvedRadio)

      const state = useFilterStore.getState()
      expect(state.solved).toBe('unsolved')
    })

    it('should update filter store when All Cases is selected', () => {
      // First set to solved
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('solved', 'solved')
      })

      render(<PrimaryFilters />)

      const allCasesRadio = screen.getByRole('radio', { name: /All Cases/i })
      fireEvent.click(allCasesRadio)

      const state = useFilterStore.getState()
      expect(state.solved).toBe('all')
    })

    it('should reflect store state in radio buttons', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('solved', 'unsolved')
      })

      render(<PrimaryFilters />)

      const unsolvedRadio = screen.getByRole('radio', { name: /Unsolved/i })
      expect(unsolvedRadio).toBeChecked()
    })
  })

  describe('Year Range Changes', () => {
    it('should update filter store when year min changes', () => {
      render(<PrimaryFilters />)

      const yearMinInput = screen.getByLabelText('From')
      fireEvent.change(yearMinInput, { target: { value: '1990' } })

      const state = useFilterStore.getState()
      expect(state.yearRange[0]).toBe(1990)
      expect(state.yearRange[1]).toBe(2023)
    })

    it('should update filter store when year max changes', () => {
      render(<PrimaryFilters />)

      const yearMaxInput = screen.getByLabelText('To')
      fireEvent.change(yearMaxInput, { target: { value: '2000' } })

      const state = useFilterStore.getState()
      expect(state.yearRange[0]).toBe(1976)
      expect(state.yearRange[1]).toBe(2000)
    })

    it('should update both year values independently', () => {
      render(<PrimaryFilters />)

      const yearMinInput = screen.getByLabelText('From')
      const yearMaxInput = screen.getByLabelText('To')

      fireEvent.change(yearMinInput, { target: { value: '1990' } })
      fireEvent.change(yearMaxInput, { target: { value: '2000' } })

      const state = useFilterStore.getState()
      expect(state.yearRange).toEqual([1990, 2000])
    })

    it('should reflect store state in year inputs', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('yearRange', [1985, 2010])
      })

      render(<PrimaryFilters />)

      const yearMinInput = screen.getByLabelText('From')
      const yearMaxInput = screen.getByLabelText('To')

      expect(yearMinInput).toHaveValue(1985)
      expect(yearMaxInput).toHaveValue(2010)
    })
  })

  describe('State Selection', () => {
    it('should update filter store when a state is selected', () => {
      render(<PrimaryFilters />)

      const californiaCheckbox = screen.getByRole('checkbox', { name: /CALIFORNIA/i })
      fireEvent.click(californiaCheckbox)

      const state = useFilterStore.getState()
      expect(state.states).toContain('CALIFORNIA')
    })

    it('should update filter store when a state is deselected', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('states', ['CALIFORNIA'])
      })

      render(<PrimaryFilters />)

      const californiaCheckbox = screen.getByRole('checkbox', { name: /CALIFORNIA/i })
      fireEvent.click(californiaCheckbox)

      const state = useFilterStore.getState()
      expect(state.states).not.toContain('CALIFORNIA')
    })

    it('should allow multiple states to be selected', () => {
      render(<PrimaryFilters />)

      const californiaCheckbox = screen.getByRole('checkbox', { name: /CALIFORNIA/i })
      const newYorkCheckbox = screen.getByRole('checkbox', { name: /NEW YORK/i })
      const texasCheckbox = screen.getByRole('checkbox', { name: /TEXAS/i })

      fireEvent.click(californiaCheckbox)
      fireEvent.click(newYorkCheckbox)
      fireEvent.click(texasCheckbox)

      const state = useFilterStore.getState()
      expect(state.states).toContain('CALIFORNIA')
      expect(state.states).toContain('NEW YORK')
      expect(state.states).toContain('TEXAS')
      expect(state.states.length).toBe(3)
    })

    it('should show Clear button when states are selected', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('states', ['CALIFORNIA'])
      })

      render(<PrimaryFilters />)

      expect(screen.getByText('Clear')).toBeInTheDocument()
    })

    it('should display selected states as chips', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('states', ['CALIFORNIA', 'NEW YORK'])
      })

      render(<PrimaryFilters />)

      const chips = screen.getAllByRole('button', { name: /Remove/i })
      expect(chips.length).toBe(2)
    })

    it('should remove state when chip remove button is clicked', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('states', ['CALIFORNIA', 'NEW YORK'])
      })

      render(<PrimaryFilters />)

      const removeCaliforniaButton = screen.getByRole('button', {
        name: /Remove CALIFORNIA/i,
      })
      fireEvent.click(removeCaliforniaButton)

      const state = useFilterStore.getState()
      expect(state.states).not.toContain('CALIFORNIA')
      expect(state.states).toContain('NEW YORK')
    })
  })

  describe('Select All / Clear All', () => {
    it('should select all states when Select All is clicked', () => {
      render(<PrimaryFilters />)

      const selectAllButton = screen.getByText('Select All')
      fireEvent.click(selectAllButton)

      const state = useFilterStore.getState()
      expect(state.states.length).toBe(STATES.length)
      STATES.forEach((stateName) => {
        expect(state.states).toContain(stateName)
      })
    })

    it('should clear all states when Clear is clicked', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('states', ['CALIFORNIA', 'NEW YORK', 'TEXAS'])
      })

      render(<PrimaryFilters />)

      const clearButton = screen.getByText('Clear')
      fireEvent.click(clearButton)

      const state = useFilterStore.getState()
      expect(state.states.length).toBe(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for year inputs', () => {
      render(<PrimaryFilters />)

      expect(screen.getByLabelText('From')).toBeInTheDocument()
      expect(screen.getByLabelText('To')).toBeInTheDocument()
    })

    it('should have proper labels for radio buttons', () => {
      render(<PrimaryFilters />)

      const radios = screen.getAllByRole('radio')
      expect(radios.length).toBe(3)
    })

    it('should have aria-label on chip remove buttons', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('states', ['CALIFORNIA'])
      })

      render(<PrimaryFilters />)

      const removeButton = screen.getByRole('button', { name: /Remove CALIFORNIA/i })
      expect(removeButton).toHaveAttribute('aria-label', 'Remove CALIFORNIA')
    })
  })
})
