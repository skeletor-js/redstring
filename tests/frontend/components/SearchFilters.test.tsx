/**
 * Test suite for SearchFilters component.
 *
 * Tests agency search input, case ID input, and filter store updates.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from '@testing-library/react'
import { SearchFilters } from '../../../src/components/filters/SearchFilters'
import { useFilterStore } from '../../../src/stores/useFilterStore'

describe('SearchFilters', () => {
  beforeEach(() => {
    // Reset store before each test
    const { resetFilters } = useFilterStore.getState()
    act(() => {
      resetFilters()
    })
  })

  describe('Rendering', () => {
    it('should render the filter group', () => {
      render(<SearchFilters />)

      expect(screen.getByText('Case ID (Exact Match)')).toBeInTheDocument()
      expect(screen.getByText('Agency Name (Substring Match)')).toBeInTheDocument()
    })

    it('should render case ID input', () => {
      render(<SearchFilters />)

      const caseIdInput = screen.getByLabelText('Case ID (Exact Match)')
      expect(caseIdInput).toBeInTheDocument()
      expect(caseIdInput).toHaveAttribute('placeholder', 'Enter case ID...')
    })

    it('should render agency search input', () => {
      render(<SearchFilters />)

      const agencyInput = screen.getByLabelText('Agency Name (Substring Match)')
      expect(agencyInput).toBeInTheDocument()
      expect(agencyInput).toHaveAttribute('placeholder', 'Search agency names...')
    })
  })

  describe('Default Values', () => {
    it('should have empty case ID input by default', () => {
      render(<SearchFilters />)

      const caseIdInput = screen.getByLabelText('Case ID (Exact Match)')
      expect(caseIdInput).toHaveValue('')
    })

    it('should have empty agency search input by default', () => {
      render(<SearchFilters />)

      const agencyInput = screen.getByLabelText('Agency Name (Substring Match)')
      expect(agencyInput).toHaveValue('')
    })
  })

  describe('Case ID Updates', () => {
    it('should update filter store when case ID is entered', () => {
      render(<SearchFilters />)

      const caseIdInput = screen.getByLabelText('Case ID (Exact Match)')
      fireEvent.change(caseIdInput, { target: { value: 'IL-12345-1990' } })

      const state = useFilterStore.getState()
      expect(state.caseId).toBe('IL-12345-1990')
    })

    it('should update filter store when case ID is cleared', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('caseId', 'IL-12345-1990')
      })

      render(<SearchFilters />)

      const caseIdInput = screen.getByLabelText('Case ID (Exact Match)')
      fireEvent.change(caseIdInput, { target: { value: '' } })

      const state = useFilterStore.getState()
      expect(state.caseId).toBe('')
    })

    it('should reflect store state in case ID input', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('caseId', 'CA-67890-2000')
      })

      render(<SearchFilters />)

      const caseIdInput = screen.getByLabelText('Case ID (Exact Match)')
      expect(caseIdInput).toHaveValue('CA-67890-2000')
    })

    it('should update on each keystroke', () => {
      render(<SearchFilters />)

      const caseIdInput = screen.getByLabelText('Case ID (Exact Match)')

      fireEvent.change(caseIdInput, { target: { value: 'I' } })
      expect(useFilterStore.getState().caseId).toBe('I')

      fireEvent.change(caseIdInput, { target: { value: 'IL' } })
      expect(useFilterStore.getState().caseId).toBe('IL')

      fireEvent.change(caseIdInput, { target: { value: 'IL-' } })
      expect(useFilterStore.getState().caseId).toBe('IL-')
    })
  })

  describe('Agency Search Updates', () => {
    it('should update filter store when agency search is entered', () => {
      render(<SearchFilters />)

      const agencyInput = screen.getByLabelText('Agency Name (Substring Match)')
      fireEvent.change(agencyInput, { target: { value: 'Chicago' } })

      const state = useFilterStore.getState()
      expect(state.agencySearch).toBe('Chicago')
    })

    it('should update filter store when agency search is cleared', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('agencySearch', 'Chicago')
      })

      render(<SearchFilters />)

      const agencyInput = screen.getByLabelText('Agency Name (Substring Match)')
      fireEvent.change(agencyInput, { target: { value: '' } })

      const state = useFilterStore.getState()
      expect(state.agencySearch).toBe('')
    })

    it('should reflect store state in agency search input', () => {
      const { setFilter } = useFilterStore.getState()
      act(() => {
        setFilter('agencySearch', 'Los Angeles')
      })

      render(<SearchFilters />)

      const agencyInput = screen.getByLabelText('Agency Name (Substring Match)')
      expect(agencyInput).toHaveValue('Los Angeles')
    })

    it('should update on each keystroke', () => {
      render(<SearchFilters />)

      const agencyInput = screen.getByLabelText('Agency Name (Substring Match)')

      fireEvent.change(agencyInput, { target: { value: 'C' } })
      expect(useFilterStore.getState().agencySearch).toBe('C')

      fireEvent.change(agencyInput, { target: { value: 'Ch' } })
      expect(useFilterStore.getState().agencySearch).toBe('Ch')

      fireEvent.change(agencyInput, { target: { value: 'Chi' } })
      expect(useFilterStore.getState().agencySearch).toBe('Chi')
    })

    it('should handle case insensitive search input', () => {
      render(<SearchFilters />)

      const agencyInput = screen.getByLabelText('Agency Name (Substring Match)')

      fireEvent.change(agencyInput, { target: { value: 'CHICAGO' } })
      expect(useFilterStore.getState().agencySearch).toBe('CHICAGO')

      fireEvent.change(agencyInput, { target: { value: 'chicago' } })
      expect(useFilterStore.getState().agencySearch).toBe('chicago')
    })
  })

  describe('Both Inputs Work Together', () => {
    it('should allow both case ID and agency search to be set', () => {
      render(<SearchFilters />)

      const caseIdInput = screen.getByLabelText('Case ID (Exact Match)')
      const agencyInput = screen.getByLabelText('Agency Name (Substring Match)')

      fireEvent.change(caseIdInput, { target: { value: 'IL-12345-1990' } })
      fireEvent.change(agencyInput, { target: { value: 'Chicago' } })

      const state = useFilterStore.getState()
      expect(state.caseId).toBe('IL-12345-1990')
      expect(state.agencySearch).toBe('Chicago')
    })

    it('should update independently', () => {
      render(<SearchFilters />)

      const caseIdInput = screen.getByLabelText('Case ID (Exact Match)')
      const agencyInput = screen.getByLabelText('Agency Name (Substring Match)')

      // Set both
      fireEvent.change(caseIdInput, { target: { value: 'IL-12345-1990' } })
      fireEvent.change(agencyInput, { target: { value: 'Chicago' } })

      // Clear case ID
      fireEvent.change(caseIdInput, { target: { value: '' } })

      const state = useFilterStore.getState()
      expect(state.caseId).toBe('')
      expect(state.agencySearch).toBe('Chicago')
    })
  })

  describe('Special Characters', () => {
    it('should handle special characters in case ID', () => {
      render(<SearchFilters />)

      const caseIdInput = screen.getByLabelText('Case ID (Exact Match)')
      fireEvent.change(caseIdInput, { target: { value: 'IL-12345_1990-A' } })

      const state = useFilterStore.getState()
      expect(state.caseId).toBe('IL-12345_1990-A')
    })

    it('should handle special characters in agency search', () => {
      render(<SearchFilters />)

      const agencyInput = screen.getByLabelText('Agency Name (Substring Match)')
      fireEvent.change(agencyInput, { target: { value: "O'Brien County" } })

      const state = useFilterStore.getState()
      expect(state.agencySearch).toBe("O'Brien County")
    })

    it('should handle spaces in agency search', () => {
      render(<SearchFilters />)

      const agencyInput = screen.getByLabelText('Agency Name (Substring Match)')
      fireEvent.change(agencyInput, { target: { value: 'Chicago Police Department' } })

      const state = useFilterStore.getState()
      expect(state.agencySearch).toBe('Chicago Police Department')
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for inputs', () => {
      render(<SearchFilters />)

      expect(screen.getByLabelText('Case ID (Exact Match)')).toBeInTheDocument()
      expect(screen.getByLabelText('Agency Name (Substring Match)')).toBeInTheDocument()
    })

    it('should have proper input types', () => {
      render(<SearchFilters />)

      const caseIdInput = screen.getByLabelText('Case ID (Exact Match)')
      const agencyInput = screen.getByLabelText('Agency Name (Substring Match)')

      expect(caseIdInput).toHaveAttribute('type', 'text')
      expect(agencyInput).toHaveAttribute('type', 'text')
    })

    it('should have proper id attributes for label association', () => {
      render(<SearchFilters />)

      const caseIdInput = screen.getByLabelText('Case ID (Exact Match)')
      const agencyInput = screen.getByLabelText('Agency Name (Substring Match)')

      expect(caseIdInput).toHaveAttribute('id', 'case-id-input')
      expect(agencyInput).toHaveAttribute('id', 'agency-search-input')
    })
  })
})
