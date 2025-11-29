/**
 * Test suite for VictimFilters component.
 *
 * Tests victim sex checkboxes, age range slider, include unknown age toggle,
 * victim race checkboxes, victim ethnicity checkboxes, and filter store updates.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from '@testing-library/react'
import { VictimFilters } from '../../../src/components/filters/VictimFilters'
import { useFilterStore } from '../../../src/stores/useFilterStore'
import {
  VIC_SEX_OPTIONS,
  VIC_RACE_OPTIONS,
  VIC_ETHNIC_OPTIONS,
} from '../../../src/types/filter'

describe('VictimFilters', () => {
  beforeEach(() => {
    // Reset store before each test
    const { resetFilters } = useFilterStore.getState()
    act(() => {
      resetFilters()
    })
  })

  describe('Rendering', () => {
    it('should render the filter group', () => {
      render(<VictimFilters />)

      expect(screen.getByText('Victim Age Range')).toBeInTheDocument()
      expect(screen.getByText('Victim Sex')).toBeInTheDocument()
      expect(screen.getByText('Victim Race')).toBeInTheDocument()
      expect(screen.getByText('Victim Ethnicity')).toBeInTheDocument()
    })

    it('should render victim sex checkboxes (Male, Female, Unknown)', () => {
      render(<VictimFilters />)

      VIC_SEX_OPTIONS.forEach((sex) => {
        expect(screen.getByText(sex)).toBeInTheDocument()
      })
    })

    it('should render victim age range slider with bounds [0, 99]', () => {
      render(<VictimFilters />)

      const ageMinInput = screen.getByLabelText('Min')
      const ageMaxInput = screen.getByLabelText('Max')

      expect(ageMinInput).toHaveAttribute('min', '0')
      expect(ageMinInput).toHaveAttribute('max', '99')
      expect(ageMaxInput).toHaveAttribute('min', '0')
      expect(ageMaxInput).toHaveAttribute('max', '99')
    })

    it('should render include unknown age toggle', () => {
      render(<VictimFilters />)

      expect(screen.getByText('Include Unknown Age (999)')).toBeInTheDocument()
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('should render victim race checkboxes', () => {
      render(<VictimFilters />)

      VIC_RACE_OPTIONS.forEach((race) => {
        expect(screen.getByText(race)).toBeInTheDocument()
      })
    })

    it('should render victim ethnicity checkboxes', () => {
      render(<VictimFilters />)

      VIC_ETHNIC_OPTIONS.forEach((ethnic) => {
        expect(screen.getByText(ethnic)).toBeInTheDocument()
      })
    })
  })

  describe('Default Values', () => {
    it('should have default age range [0, 99]', () => {
      render(<VictimFilters />)

      const ageMinInput = screen.getByLabelText('Min')
      const ageMaxInput = screen.getByLabelText('Max')

      expect(ageMinInput).toHaveValue(0)
      expect(ageMaxInput).toHaveValue(99)
    })

    it('should have no victim sex selected by default', () => {
      render(<VictimFilters />)

      VIC_SEX_OPTIONS.forEach((sex) => {
        const checkbox = screen.getByRole('checkbox', { name: sex })
        expect(checkbox).not.toBeChecked()
      })
    })

    it('should have no victim race selected by default', () => {
      render(<VictimFilters />)

      VIC_RACE_OPTIONS.forEach((race) => {
        const checkbox = screen.getByRole('checkbox', { name: race })
        expect(checkbox).not.toBeChecked()
      })
    })

    it('should have no victim ethnicity selected by default', () => {
      render(<VictimFilters />)

      VIC_ETHNIC_OPTIONS.forEach((ethnic) => {
        const checkbox = screen.getByRole('checkbox', { name: ethnic })
        expect(checkbox).not.toBeChecked()
      })
    })

    it('should have include unknown age toggle off by default', () => {
      render(<VictimFilters />)

      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('Victim Sex Checkbox Selections', () => {
    it('should update filter store when Male is selected', () => {
      render(<VictimFilters />)

      const maleCheckbox = screen.getByRole('checkbox', { name: 'Male' })
      fireEvent.click(maleCheckbox)

      const state = useFilterStore.getState()
      expect(state.vicSex).toContain('Male')
    })

    it('should update filter store when Female is selected', () => {
      render(<VictimFilters />)

      const femaleCheckbox = screen.getByRole('checkbox', { name: 'Female' })
      fireEvent.click(femaleCheckbox)

      const state = useFilterStore.getState()
      expect(state.vicSex).toContain('Female')
    })

    it('should update filter store when Unknown is selected', () => {
      render(<VictimFilters />)

      const unknownCheckbox = screen.getByRole('checkbox', { name: 'Unknown' })
      fireEvent.click(unknownCheckbox)

      const state = useFilterStore.getState()
      expect(state.vicSex).toContain('Unknown')
    })

    it('should allow multiple sex selections', () => {
      render(<VictimFilters />)

      const maleCheckbox = screen.getByRole('checkbox', { name: 'Male' })
      const femaleCheckbox = screen.getByRole('checkbox', { name: 'Female' })

      fireEvent.click(maleCheckbox)
      fireEvent.click(femaleCheckbox)

      const state = useFilterStore.getState()
      expect(state.vicSex).toContain('Male')
      expect(state.vicSex).toContain('Female')
      expect(state.vicSex.length).toBe(2)
    })

    it('should deselect sex when clicked again', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('vicSex', ['Male'])
      })

      render(<VictimFilters />)

      const maleCheckbox = screen.getByRole('checkbox', { name: 'Male' })
      fireEvent.click(maleCheckbox)

      const state = useFilterStore.getState()
      expect(state.vicSex).not.toContain('Male')
    })
  })

  describe('Age Range Changes', () => {
    it('should update filter store when age min changes', () => {
      render(<VictimFilters />)

      const ageMinInput = screen.getByLabelText('Min')
      fireEvent.change(ageMinInput, { target: { value: '18' } })

      const state = useFilterStore.getState()
      expect(state.vicAgeRange[0]).toBe(18)
      expect(state.vicAgeRange[1]).toBe(99)
    })

    it('should update filter store when age max changes', () => {
      render(<VictimFilters />)

      const ageMaxInput = screen.getByLabelText('Max')
      fireEvent.change(ageMaxInput, { target: { value: '65' } })

      const state = useFilterStore.getState()
      expect(state.vicAgeRange[0]).toBe(0)
      expect(state.vicAgeRange[1]).toBe(65)
    })

    it('should update both age values independently', () => {
      render(<VictimFilters />)

      const ageMinInput = screen.getByLabelText('Min')
      const ageMaxInput = screen.getByLabelText('Max')

      fireEvent.change(ageMinInput, { target: { value: '25' } })
      fireEvent.change(ageMaxInput, { target: { value: '30' } })

      const state = useFilterStore.getState()
      expect(state.vicAgeRange).toEqual([25, 30])
    })

    it('should reflect store state in age inputs', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('vicAgeRange', [18, 65])
      })

      render(<VictimFilters />)

      const ageMinInput = screen.getByLabelText('Min')
      const ageMaxInput = screen.getByLabelText('Max')

      expect(ageMinInput).toHaveValue(18)
      expect(ageMaxInput).toHaveValue(65)
    })
  })

  describe('Unknown Age Toggle', () => {
    it('should update filter store when toggle is clicked', () => {
      render(<VictimFilters />)

      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)

      const state = useFilterStore.getState()
      expect(state.includeUnknownAge).toBe(true)
    })

    it('should toggle off when clicked again', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('includeUnknownAge', true)
      })

      render(<VictimFilters />)

      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)

      const state = useFilterStore.getState()
      expect(state.includeUnknownAge).toBe(false)
    })

    it('should reflect store state in toggle', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('includeUnknownAge', true)
      })

      render(<VictimFilters />)

      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Victim Race Checkbox Selections', () => {
    it('should update filter store when a race is selected', () => {
      render(<VictimFilters />)

      const whiteCheckbox = screen.getByRole('checkbox', { name: 'White' })
      fireEvent.click(whiteCheckbox)

      const state = useFilterStore.getState()
      expect(state.vicRace).toContain('White')
    })

    it('should allow multiple race selections', () => {
      render(<VictimFilters />)

      const whiteCheckbox = screen.getByRole('checkbox', { name: 'White' })
      const blackCheckbox = screen.getByRole('checkbox', { name: 'Black' })

      fireEvent.click(whiteCheckbox)
      fireEvent.click(blackCheckbox)

      const state = useFilterStore.getState()
      expect(state.vicRace).toContain('White')
      expect(state.vicRace).toContain('Black')
      expect(state.vicRace.length).toBe(2)
    })

    it('should deselect race when clicked again', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('vicRace', ['White'])
      })

      render(<VictimFilters />)

      const whiteCheckbox = screen.getByRole('checkbox', { name: 'White' })
      fireEvent.click(whiteCheckbox)

      const state = useFilterStore.getState()
      expect(state.vicRace).not.toContain('White')
    })
  })

  describe('Victim Ethnicity Checkbox Selections', () => {
    it('should update filter store when an ethnicity is selected', () => {
      render(<VictimFilters />)

      const hispanicCheckbox = screen.getByRole('checkbox', {
        name: 'Hispanic or Latino',
      })
      fireEvent.click(hispanicCheckbox)

      const state = useFilterStore.getState()
      expect(state.vicEthnic).toContain('Hispanic or Latino')
    })

    it('should allow multiple ethnicity selections', () => {
      render(<VictimFilters />)

      const hispanicCheckbox = screen.getByRole('checkbox', {
        name: 'Hispanic or Latino',
      })
      const notHispanicCheckbox = screen.getByRole('checkbox', {
        name: 'Not Hispanic or Latino',
      })

      fireEvent.click(hispanicCheckbox)
      fireEvent.click(notHispanicCheckbox)

      const state = useFilterStore.getState()
      expect(state.vicEthnic).toContain('Hispanic or Latino')
      expect(state.vicEthnic).toContain('Not Hispanic or Latino')
      expect(state.vicEthnic.length).toBe(2)
    })

    it('should deselect ethnicity when clicked again', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('vicEthnic', ['Hispanic or Latino'])
      })

      render(<VictimFilters />)

      const hispanicCheckbox = screen.getByRole('checkbox', {
        name: 'Hispanic or Latino',
      })
      fireEvent.click(hispanicCheckbox)

      const state = useFilterStore.getState()
      expect(state.vicEthnic).not.toContain('Hispanic or Latino')
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for age inputs', () => {
      render(<VictimFilters />)

      expect(screen.getByLabelText('Min')).toBeInTheDocument()
      expect(screen.getByLabelText('Max')).toBeInTheDocument()
    })

    it('should have proper role for unknown age toggle', () => {
      render(<VictimFilters />)

      const toggle = screen.getByRole('switch')
      expect(toggle).toBeInTheDocument()
    })

    it('should have aria-checked attribute on toggle', () => {
      render(<VictimFilters />)

      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('aria-checked')
    })
  })
})
