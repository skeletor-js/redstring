/**
 * Test suite for GeographyFilters component.
 *
 * Tests county FIPS input with chip display, MSA input with chip display,
 * adding/removing counties and MSAs, and filter store updates.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from '@testing-library/react'
import { GeographyFilters } from '../../../src/components/filters/GeographyFilters'
import { useFilterStore } from '../../../src/stores/useFilterStore'

describe('GeographyFilters', () => {
  beforeEach(() => {
    // Reset store before each test
    const { resetFilters } = useFilterStore.getState()
    act(() => {
      resetFilters()
    })
  })

  describe('Rendering', () => {
    it('should render the filter group', () => {
      render(<GeographyFilters />)

      expect(screen.getByText('County')).toBeInTheDocument()
      expect(screen.getByText('Metropolitan Area (MSA)')).toBeInTheDocument()
    })

    it('should render county FIPS input', () => {
      render(<GeographyFilters />)

      const countyInput = screen.getByLabelText('County')
      expect(countyInput).toBeInTheDocument()
      expect(countyInput).toHaveAttribute('placeholder', 'Enter county name...')
    })

    it('should render MSA input', () => {
      render(<GeographyFilters />)

      const msaInput = screen.getByLabelText('Metropolitan Area (MSA)')
      expect(msaInput).toBeInTheDocument()
      expect(msaInput).toHaveAttribute('placeholder', 'Enter MSA name...')
    })

    it('should render Add buttons for both inputs', () => {
      render(<GeographyFilters />)

      const addButtons = screen.getAllByText('Add')
      expect(addButtons.length).toBe(2)
    })
  })

  describe('Default Values', () => {
    it('should have empty county input by default', () => {
      render(<GeographyFilters />)

      const countyInput = screen.getByLabelText('County')
      expect(countyInput).toHaveValue('')
    })

    it('should have empty MSA input by default', () => {
      render(<GeographyFilters />)

      const msaInput = screen.getByLabelText('Metropolitan Area (MSA)')
      expect(msaInput).toHaveValue('')
    })

    it('should have no county chips by default', () => {
      render(<GeographyFilters />)

      // No remove buttons should be present for counties
      const state = useFilterStore.getState()
      expect(state.counties.length).toBe(0)
    })

    it('should have no MSA chips by default', () => {
      render(<GeographyFilters />)

      // No remove buttons should be present for MSAs
      const state = useFilterStore.getState()
      expect(state.msa.length).toBe(0)
    })
  })

  describe('Adding Counties', () => {
    it('should update filter store when a county is added via button', () => {
      render(<GeographyFilters />)

      const countyInput = screen.getByLabelText('County')
      const addButtons = screen.getAllByText('Add')

      fireEvent.change(countyInput, { target: { value: 'Cook County' } })
      fireEvent.click(addButtons[0])

      const state = useFilterStore.getState()
      expect(state.counties).toContain('Cook County')
    })

    it('should update filter store when a county is added via Enter key', () => {
      render(<GeographyFilters />)

      const countyInput = screen.getByLabelText('County')

      fireEvent.change(countyInput, { target: { value: 'Los Angeles County' } })
      fireEvent.keyPress(countyInput, { key: 'Enter', code: 'Enter', charCode: 13 })

      const state = useFilterStore.getState()
      expect(state.counties).toContain('Los Angeles County')
    })

    it('should clear input after adding a county', () => {
      render(<GeographyFilters />)

      const countyInput = screen.getByLabelText('County')
      const addButtons = screen.getAllByText('Add')

      fireEvent.change(countyInput, { target: { value: 'Cook County' } })
      fireEvent.click(addButtons[0])

      expect(countyInput).toHaveValue('')
    })

    it('should not add empty county', () => {
      render(<GeographyFilters />)

      const addButtons = screen.getAllByText('Add')
      fireEvent.click(addButtons[0])

      const state = useFilterStore.getState()
      expect(state.counties.length).toBe(0)
    })

    it('should not add duplicate county', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('counties', ['Cook County'])
      })

      render(<GeographyFilters />)

      const countyInput = screen.getByLabelText('County')
      const addButtons = screen.getAllByText('Add')

      fireEvent.change(countyInput, { target: { value: 'Cook County' } })
      fireEvent.click(addButtons[0])

      const state = useFilterStore.getState()
      expect(state.counties.length).toBe(1)
    })

    it('should trim whitespace from county input', () => {
      render(<GeographyFilters />)

      const countyInput = screen.getByLabelText('County')
      const addButtons = screen.getAllByText('Add')

      fireEvent.change(countyInput, { target: { value: '  Cook County  ' } })
      fireEvent.click(addButtons[0])

      const state = useFilterStore.getState()
      expect(state.counties).toContain('Cook County')
    })
  })

  describe('Removing Counties', () => {
    it('should update filter store when a county is removed', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('counties', ['Cook County', 'Los Angeles County'])
      })

      render(<GeographyFilters />)

      const removeCookButton = screen.getByRole('button', {
        name: /Remove Cook County/i,
      })
      fireEvent.click(removeCookButton)

      const state = useFilterStore.getState()
      expect(state.counties).not.toContain('Cook County')
      expect(state.counties).toContain('Los Angeles County')
    })

    it('should display counties as chips', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('counties', ['Cook County', 'Los Angeles County'])
      })

      render(<GeographyFilters />)

      expect(
        screen.getByRole('button', { name: /Remove Cook County/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Remove Los Angeles County/i })
      ).toBeInTheDocument()
    })
  })

  describe('Adding MSAs', () => {
    it('should update filter store when an MSA is added via button', () => {
      render(<GeographyFilters />)

      const msaInput = screen.getByLabelText('Metropolitan Area (MSA)')
      const addButtons = screen.getAllByText('Add')

      fireEvent.change(msaInput, { target: { value: 'Chicago-Naperville-Elgin' } })
      fireEvent.click(addButtons[1])

      const state = useFilterStore.getState()
      expect(state.msa).toContain('Chicago-Naperville-Elgin')
    })

    it('should update filter store when an MSA is added via Enter key', () => {
      render(<GeographyFilters />)

      const msaInput = screen.getByLabelText('Metropolitan Area (MSA)')

      fireEvent.change(msaInput, {
        target: { value: 'Los Angeles-Long Beach-Anaheim' },
      })
      fireEvent.keyPress(msaInput, { key: 'Enter', code: 'Enter', charCode: 13 })

      const state = useFilterStore.getState()
      expect(state.msa).toContain('Los Angeles-Long Beach-Anaheim')
    })

    it('should clear input after adding an MSA', () => {
      render(<GeographyFilters />)

      const msaInput = screen.getByLabelText('Metropolitan Area (MSA)')
      const addButtons = screen.getAllByText('Add')

      fireEvent.change(msaInput, { target: { value: 'Chicago-Naperville-Elgin' } })
      fireEvent.click(addButtons[1])

      expect(msaInput).toHaveValue('')
    })

    it('should not add empty MSA', () => {
      render(<GeographyFilters />)

      const addButtons = screen.getAllByText('Add')
      fireEvent.click(addButtons[1])

      const state = useFilterStore.getState()
      expect(state.msa.length).toBe(0)
    })

    it('should not add duplicate MSA', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('msa', ['Chicago-Naperville-Elgin'])
      })

      render(<GeographyFilters />)

      const msaInput = screen.getByLabelText('Metropolitan Area (MSA)')
      const addButtons = screen.getAllByText('Add')

      fireEvent.change(msaInput, { target: { value: 'Chicago-Naperville-Elgin' } })
      fireEvent.click(addButtons[1])

      const state = useFilterStore.getState()
      expect(state.msa.length).toBe(1)
    })

    it('should trim whitespace from MSA input', () => {
      render(<GeographyFilters />)

      const msaInput = screen.getByLabelText('Metropolitan Area (MSA)')
      const addButtons = screen.getAllByText('Add')

      fireEvent.change(msaInput, { target: { value: '  Chicago-Naperville-Elgin  ' } })
      fireEvent.click(addButtons[1])

      const state = useFilterStore.getState()
      expect(state.msa).toContain('Chicago-Naperville-Elgin')
    })
  })

  describe('Removing MSAs', () => {
    it('should update filter store when an MSA is removed', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('msa', ['Chicago-Naperville-Elgin', 'Los Angeles-Long Beach-Anaheim'])
      })

      render(<GeographyFilters />)

      const removeChicagoButton = screen.getByRole('button', {
        name: /Remove Chicago-Naperville-Elgin/i,
      })
      fireEvent.click(removeChicagoButton)

      const state = useFilterStore.getState()
      expect(state.msa).not.toContain('Chicago-Naperville-Elgin')
      expect(state.msa).toContain('Los Angeles-Long Beach-Anaheim')
    })

    it('should display MSAs as chips', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('msa', ['Chicago-Naperville-Elgin', 'Los Angeles-Long Beach-Anaheim'])
      })

      render(<GeographyFilters />)

      expect(
        screen.getByRole('button', { name: /Remove Chicago-Naperville-Elgin/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Remove Los Angeles-Long Beach-Anaheim/i })
      ).toBeInTheDocument()
    })
  })

  describe('Multiple Entries', () => {
    it('should allow adding multiple counties', () => {
      render(<GeographyFilters />)

      const countyInput = screen.getByLabelText('County')
      const addButtons = screen.getAllByText('Add')

      fireEvent.change(countyInput, { target: { value: 'Cook County' } })
      fireEvent.click(addButtons[0])

      fireEvent.change(countyInput, { target: { value: 'Los Angeles County' } })
      fireEvent.click(addButtons[0])

      fireEvent.change(countyInput, { target: { value: 'Harris County' } })
      fireEvent.click(addButtons[0])

      const state = useFilterStore.getState()
      expect(state.counties.length).toBe(3)
      expect(state.counties).toContain('Cook County')
      expect(state.counties).toContain('Los Angeles County')
      expect(state.counties).toContain('Harris County')
    })

    it('should allow adding multiple MSAs', () => {
      render(<GeographyFilters />)

      const msaInput = screen.getByLabelText('Metropolitan Area (MSA)')
      const addButtons = screen.getAllByText('Add')

      fireEvent.change(msaInput, { target: { value: 'Chicago-Naperville-Elgin' } })
      fireEvent.click(addButtons[1])

      fireEvent.change(msaInput, {
        target: { value: 'Los Angeles-Long Beach-Anaheim' },
      })
      fireEvent.click(addButtons[1])

      const state = useFilterStore.getState()
      expect(state.msa.length).toBe(2)
      expect(state.msa).toContain('Chicago-Naperville-Elgin')
      expect(state.msa).toContain('Los Angeles-Long Beach-Anaheim')
    })

    it('should handle counties and MSAs independently', () => {
      render(<GeographyFilters />)

      const countyInput = screen.getByLabelText('County')
      const msaInput = screen.getByLabelText('Metropolitan Area (MSA)')
      const addButtons = screen.getAllByText('Add')

      // Add county
      fireEvent.change(countyInput, { target: { value: 'Cook County' } })
      fireEvent.click(addButtons[0])

      // Add MSA
      fireEvent.change(msaInput, { target: { value: 'Chicago-Naperville-Elgin' } })
      fireEvent.click(addButtons[1])

      const state = useFilterStore.getState()
      expect(state.counties).toContain('Cook County')
      expect(state.msa).toContain('Chicago-Naperville-Elgin')
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for inputs', () => {
      render(<GeographyFilters />)

      expect(screen.getByLabelText('County')).toBeInTheDocument()
      expect(screen.getByLabelText('Metropolitan Area (MSA)')).toBeInTheDocument()
    })

    it('should have aria-label on chip remove buttons', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('counties', ['Cook County'])
      })

      render(<GeographyFilters />)

      const removeButton = screen.getByRole('button', { name: /Remove Cook County/i })
      expect(removeButton).toHaveAttribute('aria-label', 'Remove Cook County')
    })
  })
})
