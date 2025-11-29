/**
 * Test suite for CrimeFilters component.
 *
 * Tests weapon checkboxes (18 types), relationship checkboxes (18 types),
 * circumstance checkboxes (6 types), situation checkboxes (6 types),
 * and filter store updates.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from '@testing-library/react'
import { CrimeFilters } from '../../../src/components/filters/CrimeFilters'
import { useFilterStore } from '../../../src/stores/useFilterStore'
import {
  WEAPON_TYPES,
  RELATIONSHIP_OPTIONS,
  CIRCUMSTANCE_OPTIONS,
  SITUATION_OPTIONS,
} from '../../../src/types/filter'

describe('CrimeFilters', () => {
  beforeEach(() => {
    // Reset store before each test
    const { resetFilters } = useFilterStore.getState()
    act(() => {
      resetFilters()
    })
  })

  describe('Rendering', () => {
    it('should render the filter group', () => {
      render(<CrimeFilters />)

      expect(screen.getByText('Weapon Type')).toBeInTheDocument()
      expect(screen.getByText('Relationship')).toBeInTheDocument()
      expect(screen.getByText('Circumstance')).toBeInTheDocument()
      expect(screen.getByText('Situation')).toBeInTheDocument()
    })

    it('should render weapon checkboxes (18 types)', () => {
      render(<CrimeFilters />)

      WEAPON_TYPES.forEach((weapon) => {
        expect(screen.getByText(weapon)).toBeInTheDocument()
      })

      // Verify count
      expect(WEAPON_TYPES.length).toBe(18)
    })

    it('should render relationship checkboxes (18 types)', () => {
      render(<CrimeFilters />)

      RELATIONSHIP_OPTIONS.forEach((relationship) => {
        expect(screen.getByText(relationship)).toBeInTheDocument()
      })

      // Verify count
      expect(RELATIONSHIP_OPTIONS.length).toBe(18)
    })

    it('should render circumstance checkboxes (6 types)', () => {
      render(<CrimeFilters />)

      CIRCUMSTANCE_OPTIONS.forEach((circumstance) => {
        expect(screen.getByText(circumstance)).toBeInTheDocument()
      })

      // Verify count
      expect(CIRCUMSTANCE_OPTIONS.length).toBe(6)
    })

    it('should render situation checkboxes (6 types)', () => {
      render(<CrimeFilters />)

      SITUATION_OPTIONS.forEach((situation) => {
        expect(screen.getByText(situation)).toBeInTheDocument()
      })

      // Verify count
      expect(SITUATION_OPTIONS.length).toBe(6)
    })
  })

  describe('Default Values', () => {
    it('should have no weapons selected by default', () => {
      render(<CrimeFilters />)

      // Check a few weapon checkboxes
      const handgunCheckbox = screen.getByRole('checkbox', {
        name: 'Handgun - pistol, revolver, etc',
      })
      const rifleCheckbox = screen.getByRole('checkbox', { name: 'Rifle' })

      expect(handgunCheckbox).not.toBeChecked()
      expect(rifleCheckbox).not.toBeChecked()
    })

    it('should have no relationships selected by default', () => {
      render(<CrimeFilters />)

      const strangerCheckbox = screen.getByRole('checkbox', { name: 'Stranger' })
      const acquaintanceCheckbox = screen.getByRole('checkbox', {
        name: 'Acquaintance',
      })

      expect(strangerCheckbox).not.toBeChecked()
      expect(acquaintanceCheckbox).not.toBeChecked()
    })

    it('should have no circumstances selected by default', () => {
      render(<CrimeFilters />)

      const argumentCheckbox = screen.getByRole('checkbox', { name: 'Argument' })
      const felonyCheckbox = screen.getByRole('checkbox', { name: 'Felony type' })

      expect(argumentCheckbox).not.toBeChecked()
      expect(felonyCheckbox).not.toBeChecked()
    })

    it('should have no situations selected by default', () => {
      render(<CrimeFilters />)

      const singleVictimCheckbox = screen.getByRole('checkbox', {
        name: 'Single victim/single offender',
      })

      expect(singleVictimCheckbox).not.toBeChecked()
    })

    it('should not show Clear buttons when no selections', () => {
      render(<CrimeFilters />)

      // Clear buttons should not be visible when no selections
      const clearButtons = screen.queryAllByText('Clear')
      expect(clearButtons.length).toBe(0)
    })
  })

  describe('Weapon Checkbox Selections', () => {
    it('should update filter store when a weapon is selected', () => {
      render(<CrimeFilters />)

      const handgunCheckbox = screen.getByRole('checkbox', {
        name: 'Handgun - pistol, revolver, etc',
      })
      fireEvent.click(handgunCheckbox)

      const state = useFilterStore.getState()
      expect(state.weapon).toContain('Handgun - pistol, revolver, etc')
    })

    it('should allow multiple weapon selections', () => {
      render(<CrimeFilters />)

      const handgunCheckbox = screen.getByRole('checkbox', {
        name: 'Handgun - pistol, revolver, etc',
      })
      const rifleCheckbox = screen.getByRole('checkbox', { name: 'Rifle' })
      const knifeCheckbox = screen.getByRole('checkbox', {
        name: 'Knife or cutting instrument',
      })

      fireEvent.click(handgunCheckbox)
      fireEvent.click(rifleCheckbox)
      fireEvent.click(knifeCheckbox)

      const state = useFilterStore.getState()
      expect(state.weapon).toContain('Handgun - pistol, revolver, etc')
      expect(state.weapon).toContain('Rifle')
      expect(state.weapon).toContain('Knife or cutting instrument')
      expect(state.weapon.length).toBe(3)
    })

    it('should deselect weapon when clicked again', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('weapon', ['Handgun - pistol, revolver, etc'])
      })

      render(<CrimeFilters />)

      const handgunCheckbox = screen.getByRole('checkbox', {
        name: 'Handgun - pistol, revolver, etc',
      })
      fireEvent.click(handgunCheckbox)

      const state = useFilterStore.getState()
      expect(state.weapon).not.toContain('Handgun - pistol, revolver, etc')
    })

    it('should show Clear button when weapons are selected', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('weapon', ['Rifle'])
      })

      render(<CrimeFilters />)

      // Should have at least one Clear button visible
      expect(screen.getAllByText('Clear').length).toBeGreaterThan(0)
    })

    it('should display selected weapons as chips', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('weapon', ['Rifle', 'Shotgun'])
      })

      render(<CrimeFilters />)

      expect(screen.getByRole('button', { name: /Remove Rifle/i })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Remove Shotgun/i })
      ).toBeInTheDocument()
    })

    it('should remove weapon when chip remove button is clicked', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('weapon', ['Rifle', 'Shotgun'])
      })

      render(<CrimeFilters />)

      const removeRifleButton = screen.getByRole('button', { name: /Remove Rifle/i })
      fireEvent.click(removeRifleButton)

      const state = useFilterStore.getState()
      expect(state.weapon).not.toContain('Rifle')
      expect(state.weapon).toContain('Shotgun')
    })

    it('should clear all weapons when Clear button is clicked', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('weapon', ['Rifle', 'Shotgun', 'Handgun - pistol, revolver, etc'])
      })

      render(<CrimeFilters />)

      // Find the Clear button in the Weapon Type section
      const clearButtons = screen.getAllByText('Clear')
      fireEvent.click(clearButtons[0])

      const state = useFilterStore.getState()
      expect(state.weapon.length).toBe(0)
    })
  })

  describe('Relationship Checkbox Selections', () => {
    it('should update filter store when a relationship is selected', () => {
      render(<CrimeFilters />)

      const strangerCheckbox = screen.getByRole('checkbox', { name: 'Stranger' })
      fireEvent.click(strangerCheckbox)

      const state = useFilterStore.getState()
      expect(state.relationship).toContain('Stranger')
    })

    it('should allow multiple relationship selections', () => {
      render(<CrimeFilters />)

      const strangerCheckbox = screen.getByRole('checkbox', { name: 'Stranger' })
      const acquaintanceCheckbox = screen.getByRole('checkbox', {
        name: 'Acquaintance',
      })
      const wifeCheckbox = screen.getByRole('checkbox', { name: 'Wife' })

      fireEvent.click(strangerCheckbox)
      fireEvent.click(acquaintanceCheckbox)
      fireEvent.click(wifeCheckbox)

      const state = useFilterStore.getState()
      expect(state.relationship).toContain('Stranger')
      expect(state.relationship).toContain('Acquaintance')
      expect(state.relationship).toContain('Wife')
      expect(state.relationship.length).toBe(3)
    })

    it('should deselect relationship when clicked again', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('relationship', ['Stranger'])
      })

      render(<CrimeFilters />)

      const strangerCheckbox = screen.getByRole('checkbox', { name: 'Stranger' })
      fireEvent.click(strangerCheckbox)

      const state = useFilterStore.getState()
      expect(state.relationship).not.toContain('Stranger')
    })

    it('should display selected relationships as chips', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('relationship', ['Stranger', 'Wife'])
      })

      render(<CrimeFilters />)

      expect(
        screen.getByRole('button', { name: /Remove Stranger/i })
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Remove Wife/i })).toBeInTheDocument()
    })
  })

  describe('Circumstance Checkbox Selections', () => {
    it('should update filter store when a circumstance is selected', () => {
      render(<CrimeFilters />)

      const argumentCheckbox = screen.getByRole('checkbox', { name: 'Argument' })
      fireEvent.click(argumentCheckbox)

      const state = useFilterStore.getState()
      expect(state.circumstance).toContain('Argument')
    })

    it('should allow multiple circumstance selections', () => {
      render(<CrimeFilters />)

      const argumentCheckbox = screen.getByRole('checkbox', { name: 'Argument' })
      const felonyCheckbox = screen.getByRole('checkbox', { name: 'Felony type' })
      const ganglandCheckbox = screen.getByRole('checkbox', { name: 'Gangland' })

      fireEvent.click(argumentCheckbox)
      fireEvent.click(felonyCheckbox)
      fireEvent.click(ganglandCheckbox)

      const state = useFilterStore.getState()
      expect(state.circumstance).toContain('Argument')
      expect(state.circumstance).toContain('Felony type')
      expect(state.circumstance).toContain('Gangland')
      expect(state.circumstance.length).toBe(3)
    })

    it('should deselect circumstance when clicked again', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('circumstance', ['Argument'])
      })

      render(<CrimeFilters />)

      const argumentCheckbox = screen.getByRole('checkbox', { name: 'Argument' })
      fireEvent.click(argumentCheckbox)

      const state = useFilterStore.getState()
      expect(state.circumstance).not.toContain('Argument')
    })

    it('should display selected circumstances as chips', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('circumstance', ['Argument', 'Gangland'])
      })

      render(<CrimeFilters />)

      expect(
        screen.getByRole('button', { name: /Remove Argument/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Remove Gangland/i })
      ).toBeInTheDocument()
    })
  })

  describe('Situation Checkbox Selections', () => {
    it('should update filter store when a situation is selected', () => {
      render(<CrimeFilters />)

      const singleVictimCheckbox = screen.getByRole('checkbox', {
        name: 'Single victim/single offender',
      })
      fireEvent.click(singleVictimCheckbox)

      const state = useFilterStore.getState()
      expect(state.situation).toContain('Single victim/single offender')
    })

    it('should allow multiple situation selections', () => {
      render(<CrimeFilters />)

      const singleVictimCheckbox = screen.getByRole('checkbox', {
        name: 'Single victim/single offender',
      })
      const multipleVictimsCheckbox = screen.getByRole('checkbox', {
        name: 'Multiple victims/single offender',
      })

      fireEvent.click(singleVictimCheckbox)
      fireEvent.click(multipleVictimsCheckbox)

      const state = useFilterStore.getState()
      expect(state.situation).toContain('Single victim/single offender')
      expect(state.situation).toContain('Multiple victims/single offender')
      expect(state.situation.length).toBe(2)
    })

    it('should deselect situation when clicked again', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('situation', ['Single victim/single offender'])
      })

      render(<CrimeFilters />)

      const singleVictimCheckbox = screen.getByRole('checkbox', {
        name: 'Single victim/single offender',
      })
      fireEvent.click(singleVictimCheckbox)

      const state = useFilterStore.getState()
      expect(state.situation).not.toContain('Single victim/single offender')
    })
  })

  describe('Multiple Selections Work Correctly', () => {
    it('should handle selections across all filter types', () => {
      render(<CrimeFilters />)

      // Select one from each category
      const handgunCheckbox = screen.getByRole('checkbox', {
        name: 'Handgun - pistol, revolver, etc',
      })
      const strangerCheckbox = screen.getByRole('checkbox', { name: 'Stranger' })
      const argumentCheckbox = screen.getByRole('checkbox', { name: 'Argument' })
      const singleVictimCheckbox = screen.getByRole('checkbox', {
        name: 'Single victim/single offender',
      })

      fireEvent.click(handgunCheckbox)
      fireEvent.click(strangerCheckbox)
      fireEvent.click(argumentCheckbox)
      fireEvent.click(singleVictimCheckbox)

      const state = useFilterStore.getState()
      expect(state.weapon).toContain('Handgun - pistol, revolver, etc')
      expect(state.relationship).toContain('Stranger')
      expect(state.circumstance).toContain('Argument')
      expect(state.situation).toContain('Single victim/single offender')
    })

    it('should maintain selections independently', () => {
      render(<CrimeFilters />)

      // Select weapons
      const handgunCheckbox = screen.getByRole('checkbox', {
        name: 'Handgun - pistol, revolver, etc',
      })
      const rifleCheckbox = screen.getByRole('checkbox', { name: 'Rifle' })
      fireEvent.click(handgunCheckbox)
      fireEvent.click(rifleCheckbox)

      // Select relationships
      const strangerCheckbox = screen.getByRole('checkbox', { name: 'Stranger' })
      fireEvent.click(strangerCheckbox)

      // Deselect one weapon
      fireEvent.click(handgunCheckbox)

      const state = useFilterStore.getState()
      expect(state.weapon).not.toContain('Handgun - pistol, revolver, etc')
      expect(state.weapon).toContain('Rifle')
      expect(state.relationship).toContain('Stranger')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on chip remove buttons', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('weapon', ['Rifle'])
      })

      render(<CrimeFilters />)

      const removeButton = screen.getByRole('button', { name: /Remove Rifle/i })
      expect(removeButton).toHaveAttribute('aria-label', 'Remove Rifle')
    })

    it('should have proper checkbox roles', () => {
      render(<CrimeFilters />)

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBe(
        WEAPON_TYPES.length +
          RELATIONSHIP_OPTIONS.length +
          CIRCUMSTANCE_OPTIONS.length +
          SITUATION_OPTIONS.length
      )
    })
  })
})
