/**
 * Test suite for ClusterConfig component.
 *
 * Tests weight sliders, weight validation (must sum to 100%), threshold inputs,
 * and analyze button disabled when invalid.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClusterConfig } from '../../../src/components/clusters/ClusterConfig'
import { useFilterStore } from '../../../src/stores/useFilterStore'
import { act } from '@testing-library/react'
import { DEFAULT_CLUSTER_CONFIG } from '../../../src/types/cluster'

describe('ClusterConfig', () => {
  const mockOnAnalyze = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset filter store
    const filterStore = useFilterStore.getState()
    act(() => {
      filterStore.resetFilters()
    })
  })

  describe('Rendering', () => {
    it('should render configuration form', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      expect(screen.getByText('Cluster Analysis Configuration')).toBeInTheDocument()
      expect(
        screen.getByText('Configure parameters for detecting suspicious case patterns')
      ).toBeInTheDocument()
    })

    it('should render detection parameters', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      expect(screen.getByLabelText(/Minimum Cluster Size/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Max Solve Rate/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Similarity Threshold/i)).toBeInTheDocument()
    })

    it('should render reset to defaults button', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      expect(
        screen.getByRole('button', { name: /Reset to Defaults/i })
      ).toBeInTheDocument()
    })

    it('should render analyze button', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      expect(
        screen.getByRole('button', { name: /Run Cluster Analysis/i })
      ).toBeInTheDocument()
    })
  })

  describe('Detection Parameters', () => {
    it('should have default values for parameters', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      const minClusterSize = screen.getByLabelText(
        /Minimum Cluster Size/i
      ) as HTMLInputElement
      const maxSolveRate = screen.getByLabelText(/Max Solve Rate/i) as HTMLInputElement
      const similarityThreshold = screen.getByLabelText(
        /Similarity Threshold/i
      ) as HTMLInputElement

      expect(minClusterSize.value).toBe('5')
      expect(maxSolveRate.value).toBe('33')
      expect(similarityThreshold.value).toBe('70')
    })

    it('should update minimum cluster size', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      const input = screen.getByLabelText(/Minimum Cluster Size/i) as HTMLInputElement

      fireEvent.change(input, { target: { value: '10' } })

      expect(input.value).toBe('10')
    })

    it('should update max solve rate', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      const input = screen.getByLabelText(/Max Solve Rate/i) as HTMLInputElement

      fireEvent.change(input, { target: { value: '25.5' } })

      expect(input.value).toBe('25.5')
    })

    it('should update similarity threshold', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      const input = screen.getByLabelText(/Similarity Threshold/i) as HTMLInputElement

      fireEvent.change(input, { target: { value: '80' } })

      expect(input.value).toBe('80')
    })

    it('should enforce min/max constraints on inputs', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      const minClusterSize = screen.getByLabelText(
        /Minimum Cluster Size/i
      ) as HTMLInputElement

      expect(minClusterSize.min).toBe('3')
      expect(minClusterSize.max).toBe('100')
    })
  })

  describe('Advanced Weights Section', () => {
    it('should be collapsed by default', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      expect(screen.queryByText(/Geographic Proximity/i)).not.toBeInTheDocument()
    })

    it('should expand when toggle button is clicked', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      const toggleButton = screen.getByRole('button', {
        name: /Advanced: Similarity Weights/i,
      })
      fireEvent.click(toggleButton)

      expect(screen.getByText('Geographic Proximity')).toBeInTheDocument()
      expect(screen.getByText('Weapon Match')).toBeInTheDocument()
      expect(screen.getByText('Victim Sex Match')).toBeInTheDocument()
      expect(screen.getByText('Victim Age Proximity')).toBeInTheDocument()
      expect(screen.getByText('Temporal Proximity')).toBeInTheDocument()
      expect(screen.getByText('Victim Race Match')).toBeInTheDocument()
    })

    it('should collapse when toggle button is clicked again', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      const toggleButton = screen.getByRole('button', {
        name: /Advanced: Similarity Weights/i,
      })

      // Expand
      fireEvent.click(toggleButton)
      expect(screen.getByText('Geographic Proximity')).toBeInTheDocument()

      // Collapse
      fireEvent.click(toggleButton)
      expect(screen.queryByText('Geographic Proximity')).not.toBeInTheDocument()
    })
  })

  describe('Similarity Weights', () => {
    beforeEach(() => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      // Expand advanced section
      const toggleButton = screen.getByRole('button', {
        name: /Advanced: Similarity Weights/i,
      })
      fireEvent.click(toggleButton)
    })

    it('should display default weights', () => {
      expect(screen.getByText('35%')).toBeInTheDocument() // Geographic
      expect(screen.getByText('25%')).toBeInTheDocument() // Weapon
      expect(screen.getByText('20%')).toBeInTheDocument() // Victim Sex
      expect(screen.getByText('10%')).toBeInTheDocument() // Victim Age
      expect(screen.getByText('7%')).toBeInTheDocument() // Temporal
      expect(screen.getByText('3%')).toBeInTheDocument() // Victim Race
    })

    it('should update weight values when sliders are moved', () => {
      const sliders = screen.getAllByRole('slider')
      const geographicSlider = sliders[0] // First slider is geographic

      fireEvent.change(geographicSlider, { target: { value: '40' } })

      expect(screen.getByText('40%')).toBeInTheDocument()
    })

    it('should show total weight sum', () => {
      expect(screen.getByText(/Total Weight:/i)).toBeInTheDocument()
      expect(screen.getByText('100.0%')).toBeInTheDocument()
    })

    it('should validate that weights sum to 100', () => {
      const sliders = screen.getAllByRole('slider')

      // Change geographic weight to 40 (from 35)
      fireEvent.change(sliders[0], { target: { value: '40' } })

      // Total is now 105, should show as invalid
      const totalText = screen.getByText(/105\.0%/)
      expect(totalText).toHaveClass('cluster-config-weight-total-invalid')
    })

    it('should show valid styling when weights sum to 100', () => {
      // Default weights sum to 100
      const totalText = screen.getByText(/100\.0%/)
      expect(totalText).toHaveClass('cluster-config-weight-total-valid')
    })

    it('should show warning when weights do not sum to 100', () => {
      const sliders = screen.getAllByRole('slider')

      // Change weight to make total invalid
      fireEvent.change(sliders[0], { target: { value: '40' } })

      expect(screen.getByText(/⚠ Must sum to 100%/)).toBeInTheDocument()
    })
  })

  describe('Filter Summary', () => {
    it('should show message when no filters are applied', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      expect(screen.getByText(/No filters applied/i)).toBeInTheDocument()
      expect(screen.getByText(/894,636 cases/)).toBeInTheDocument()
    })

    it('should display active filters', () => {
      const filterStore = useFilterStore.getState()
      act(() => {
        filterStore.setFilters({
          states: ['CALIFORNIA'],
          yearRange: [2010, 2020],
          solved: 'unsolved',
        })
      })

      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      expect(screen.getByText('States:')).toBeInTheDocument()
      expect(screen.getByText('CALIFORNIA')).toBeInTheDocument()
      expect(screen.getByText('Year Range:')).toBeInTheDocument()
      expect(screen.getByText('2010 – 2020')).toBeInTheDocument()
      expect(screen.getByText('Status:')).toBeInTheDocument()
      expect(screen.getByText('Unsolved')).toBeInTheDocument()
    })

    it('should truncate long filter lists', () => {
      const filterStore = useFilterStore.getState()
      act(() => {
        filterStore.setFilters({
          weapon: ['Weapon 1', 'Weapon 2', 'Weapon 3', 'Weapon 4', 'Weapon 5'],
        })
      })

      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      expect(screen.getByText(/\+2 more/)).toBeInTheDocument()
    })
  })

  describe('Reset to Defaults', () => {
    it('should reset parameters to default values', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      // Change values
      const minClusterSize = screen.getByLabelText(
        /Minimum Cluster Size/i
      ) as HTMLInputElement
      fireEvent.change(minClusterSize, { target: { value: '10' } })
      expect(minClusterSize.value).toBe('10')

      // Reset
      const resetButton = screen.getByRole('button', { name: /Reset to Defaults/i })
      fireEvent.click(resetButton)

      expect(minClusterSize.value).toBe('5')
    })

    it('should reset weights to default values', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      // Expand advanced section
      const toggleButton = screen.getByRole('button', {
        name: /Advanced: Similarity Weights/i,
      })
      fireEvent.click(toggleButton)

      // Change weight
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '40' } })

      expect(screen.getByText('40%')).toBeInTheDocument()

      // Reset
      const resetButton = screen.getByRole('button', { name: /Reset to Defaults/i })
      fireEvent.click(resetButton)

      // Should be back to default
      expect(screen.getByText('35%')).toBeInTheDocument()
    })
  })

  describe('Submit Functionality', () => {
    it('should call onAnalyze when form is submitted', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      const submitButton = screen.getByRole('button', { name: /Run Cluster Analysis/i })
      fireEvent.click(submitButton)

      expect(mockOnAnalyze).toHaveBeenCalledTimes(1)
    })

    it('should pass configuration to onAnalyze', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      const submitButton = screen.getByRole('button', { name: /Run Cluster Analysis/i })
      fireEvent.click(submitButton)

      expect(mockOnAnalyze).toHaveBeenCalledWith(
        expect.objectContaining({
          min_cluster_size: 5,
          max_solve_rate: 33.0,
          similarity_threshold: 70.0,
        })
      )
    })

    it('should disable submit button when analyzing', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={true} />)

      const submitButton = screen.getByRole('button', { name: /Analyzing.../i })
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when weights are invalid', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      // Expand advanced section
      const toggleButton = screen.getByRole('button', {
        name: /Advanced: Similarity Weights/i,
      })
      fireEvent.click(toggleButton)

      // Make weights invalid
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '40' } })

      const submitButton = screen.getByRole('button', { name: /Run Cluster Analysis/i })
      expect(submitButton).toBeDisabled()
    })

    it('should show spinner when analyzing', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={true} />)

      expect(screen.getByText('Analyzing...')).toBeInTheDocument()
    })

    it('should include filter criteria in analysis request', () => {
      const filterStore = useFilterStore.getState()
      act(() => {
        filterStore.setFilters({
          states: ['CALIFORNIA'],
        })
      })

      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      const submitButton = screen.getByRole('button', { name: /Run Cluster Analysis/i })
      fireEvent.click(submitButton)

      expect(mockOnAnalyze).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({
            states: ['CALIFORNIA'],
          }),
        })
      )
    })
  })

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      expect(screen.getByRole('form')).toBeInTheDocument()
    })

    it('should have labels for all inputs', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      expect(screen.getByLabelText(/Minimum Cluster Size/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Max Solve Rate/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Similarity Threshold/i)).toBeInTheDocument()
    })

    it('should have help text for parameters', () => {
      render(<ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />)

      expect(
        screen.getByText('Minimum cases required to form a cluster')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Only show clusters below this solve rate (suspicious)')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Minimum similarity score to group cases together')
      ).toBeInTheDocument()
    })
  })

  describe('CSS Classes', () => {
    it('should apply correct CSS classes', () => {
      const { container } = render(
        <ClusterConfig onAnalyze={mockOnAnalyze} isAnalyzing={false} />
      )

      expect(container.querySelector('.cluster-config')).toBeInTheDocument()
      expect(container.querySelector('.cluster-config-form')).toBeInTheDocument()
      expect(container.querySelector('.cluster-config-section')).toBeInTheDocument()
    })
  })
})
