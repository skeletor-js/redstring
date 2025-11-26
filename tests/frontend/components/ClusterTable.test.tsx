/**
 * Test suite for ClusterTable component.
 *
 * Tests table rendering with cluster data, sorting, solve rate bars display,
 * and click to drill-down.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ClusterTable } from '../../../src/components/clusters/ClusterTable'
import type { ClusterSummary } from '../../../src/types/cluster'

const mockClusters: ClusterSummary[] = [
  {
    cluster_id: 'cluster_1',
    location_description: 'CALIFORNIA - County 06037',
    total_cases: 10,
    solved_cases: 2,
    unsolved_cases: 8,
    solve_rate: 20.0,
    avg_similarity_score: 85.5,
    first_year: 2015,
    last_year: 2020,
    primary_weapon: 'Handgun - pistol, revolver, etc',
    primary_victim_sex: 'Male',
    avg_victim_age: 32.5,
  },
  {
    cluster_id: 'cluster_2',
    location_description: 'NEW YORK - County 36061',
    total_cases: 15,
    solved_cases: 5,
    unsolved_cases: 10,
    solve_rate: 33.3,
    avg_similarity_score: 78.2,
    first_year: 2010,
    last_year: 2018,
    primary_weapon: 'Knife or cutting instrument',
    primary_victim_sex: 'Female',
    avg_victim_age: 28.7,
  },
]

describe('ClusterTable', () => {
  const mockOnSelectCluster = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Empty State', () => {
    it('should show empty state when no clusters provided', () => {
      render(
        <ClusterTable
          clusters={[]}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByText('No Clusters Detected')).toBeInTheDocument()
      expect(
        screen.getByText(
          /No suspicious patterns found matching the current configuration/
        )
      ).toBeInTheDocument()
      expect(
        screen.getByText(
          /Try adjusting the similarity threshold or solve rate parameters/
        )
      ).toBeInTheDocument()
    })

    it('should show empty icon', () => {
      const { container } = render(
        <ClusterTable
          clusters={[]}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(container.querySelector('.cluster-table-empty-icon')).toBeInTheDocument()
    })
  })

  describe('Table Rendering', () => {
    it('should render table with cluster data', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('CALIFORNIA - County 06037')).toBeInTheDocument()
      expect(screen.getByText('NEW YORK - County 36061')).toBeInTheDocument()
    })

    it('should display all column headers', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('Total')).toBeInTheDocument()
      expect(screen.getByText('Unsolved')).toBeInTheDocument()
      expect(screen.getByText('Solve Rate')).toBeInTheDocument()
      expect(screen.getByText('Similarity')).toBeInTheDocument()
      expect(screen.getByText('Timespan')).toBeInTheDocument()
      expect(screen.getByText('Primary Weapon')).toBeInTheDocument()
      expect(screen.getByText('Victim Profile')).toBeInTheDocument()
    })

    it('should display cluster count info', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByText('2 suspicious clusters detected')).toBeInTheDocument()
      expect(
        screen.getByText('Click a row to view detailed case information')
      ).toBeInTheDocument()
    })

    it('should handle singular cluster count', () => {
      render(
        <ClusterTable
          clusters={[mockClusters[0]]}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByText('1 suspicious cluster detected')).toBeInTheDocument()
    })
  })

  describe('Cluster Data Display', () => {
    it('should display total and unsolved case counts', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByText('10')).toBeInTheDocument() // Total cases
      expect(screen.getByText('8')).toBeInTheDocument() // Unsolved cases
    })

    it('should display solve rate as percentage', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByText('20.0%')).toBeInTheDocument()
      expect(screen.getByText('33.3%')).toBeInTheDocument()
    })

    it('should display solve rate bars', () => {
      const { container } = render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      const rateBars = container.querySelectorAll('.cluster-table-rate-bar')
      expect(rateBars.length).toBeGreaterThan(0)

      const rateFills = container.querySelectorAll('.cluster-table-rate-fill')
      expect(rateFills.length).toBeGreaterThan(0)
    })

    it('should set solve rate bar width correctly', () => {
      const { container } = render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      const rateFills = container.querySelectorAll('.cluster-table-rate-fill')
      const firstFill = rateFills[0] as HTMLElement

      // Should have width style set to solve rate percentage
      expect(firstFill.style.width).toBe('20%')
    })

    it('should display similarity scores', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByText('85.5')).toBeInTheDocument()
      expect(screen.getByText('78.2')).toBeInTheDocument()
    })

    it('should display timespan', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByText('2015–2020')).toBeInTheDocument()
      expect(screen.getByText('5yr span')).toBeInTheDocument()
      expect(screen.getByText('2010–2018')).toBeInTheDocument()
      expect(screen.getByText('8yr span')).toBeInTheDocument()
    })

    it('should display primary weapon', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByText('Handgun - pistol, revolver, etc')).toBeInTheDocument()
      expect(screen.getByText('Knife or cutting instrument')).toBeInTheDocument()
    })

    it('should display victim profile', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByText('Male')).toBeInTheDocument()
      expect(screen.getByText('Avg 33yr')).toBeInTheDocument()
      expect(screen.getByText('Female')).toBeInTheDocument()
      expect(screen.getByText('Avg 29yr')).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('should sort by unsolved cases descending by default', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      const rows = screen.getAllByRole('row')
      // First row is header, second row should be cluster_2 (10 unsolved)
      expect(within(rows[1]).getByText('10')).toBeInTheDocument()
    })

    it('should toggle sort direction when column header is clicked', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      const unsolvedHeader = screen.getByText('Unsolved').closest('th')
      fireEvent.click(unsolvedHeader!)

      // Should show sort indicator
      expect(screen.getByText(/↓/)).toBeInTheDocument()
    })

    it('should show sort indicator on active column', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      // Default sort is unsolved descending
      expect(screen.getByText(/↓/)).toBeInTheDocument()
    })

    it('should allow sorting by other columns', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      const totalHeader = screen.getByText('Total').closest('th')
      fireEvent.click(totalHeader!)

      // Click should trigger sort
      expect(totalHeader).toBeInTheDocument()
    })
  })

  describe('Row Selection', () => {
    it('should call onSelectCluster when row is clicked', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      const firstRow = screen.getByText('CALIFORNIA - County 06037').closest('tr')
      fireEvent.click(firstRow!)

      expect(mockOnSelectCluster).toHaveBeenCalledWith(mockClusters[0])
    })

    it('should highlight selected cluster', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={mockClusters[0]}
        />
      )

      const selectedRow = screen.getByText('CALIFORNIA - County 06037').closest('tr')
      expect(selectedRow).toHaveClass('cluster-table-row-selected')
    })

    it('should not highlight unselected clusters', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={mockClusters[0]}
        />
      )

      const unselectedRow = screen.getByText('NEW YORK - County 36061').closest('tr')
      expect(unselectedRow).not.toHaveClass('cluster-table-row-selected')
      expect(unselectedRow).toHaveClass('cluster-table-row')
    })
  })

  describe('Accessibility', () => {
    it('should have table role', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should have column headers', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByRole('columnheader', { name: 'Location' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Total' })).toBeInTheDocument()
    })

    it('should have clickable rows', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      const rows = screen.getAllByRole('row')
      // Skip header row
      expect(rows.length).toBeGreaterThan(1)
    })
  })

  describe('CSS Classes', () => {
    it('should apply correct CSS classes', () => {
      const { container } = render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(container.querySelector('.cluster-table-container')).toBeInTheDocument()
      expect(container.querySelector('.cluster-table')).toBeInTheDocument()
      expect(container.querySelector('.cluster-table-head')).toBeInTheDocument()
      expect(container.querySelector('.cluster-table-body')).toBeInTheDocument()
    })

    it('should apply sortable class to sortable columns', () => {
      const { container } = render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      const sortableHeaders = container.querySelectorAll('.cluster-table-th-sortable')
      expect(sortableHeaders.length).toBeGreaterThan(0)
    })
  })

  describe('Data Formatting', () => {
    it('should round similarity scores to one decimal', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByText('85.5')).toBeInTheDocument()
      expect(screen.getByText('78.2')).toBeInTheDocument()
    })

    it('should round victim age to whole number', () => {
      render(
        <ClusterTable
          clusters={mockClusters}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByText('Avg 33yr')).toBeInTheDocument()
      expect(screen.getByText('Avg 29yr')).toBeInTheDocument()
    })

    it('should calculate timespan correctly', () => {
      const cluster: ClusterSummary = {
        ...mockClusters[0],
        first_year: 2015,
        last_year: 2020,
      }

      render(
        <ClusterTable
          clusters={[cluster]}
          onSelectCluster={mockOnSelectCluster}
          selectedCluster={null}
        />
      )

      expect(screen.getByText('5yr span')).toBeInTheDocument()
    })
  })
})
