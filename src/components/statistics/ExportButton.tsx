/**
 * ExportButton - Export functionality for statistics data.
 *
 * Provides options to export statistics as CSV or JSON.
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  StatisticsSummary,
  DemographicsResponse,
  WeaponStatistics,
  CircumstanceStatistics,
  RelationshipStatistics,
  GeographicStatistics,
  TrendStatistics,
  SeasonalStatistics,
} from '../../types/statistics'

interface ExportButtonProps {
  /** Statistics data to export */
  data: {
    summary?: StatisticsSummary
    demographics?: DemographicsResponse
    weapons?: WeaponStatistics
    circumstances?: CircumstanceStatistics
    relationships?: RelationshipStatistics
    geographic?: GeographicStatistics
    trends?: TrendStatistics
    seasonal?: SeasonalStatistics
  }
  /** Whether data is loading */
  isLoading: boolean
}

/**
 * Convert statistics data to CSV format.
 */
const convertToCSV = (data: ExportButtonProps['data']): string => {
  const rows: string[] = []

  // Summary section
  if (data.summary) {
    rows.push('=== SUMMARY ===')
    rows.push('Metric,Value')
    rows.push(`Total Cases,${data.summary.total_cases}`)
    rows.push(`Solved Cases,${data.summary.solved_cases}`)
    rows.push(`Unsolved Cases,${data.summary.unsolved_cases}`)
    rows.push(`Overall Solve Rate,${data.summary.overall_solve_rate.toFixed(2)}%`)
    rows.push(
      `Date Range,${data.summary.date_range.start_year}-${data.summary.date_range.end_year}`
    )
    rows.push(`States Covered,${data.summary.states_covered}`)
    rows.push(`Counties Covered,${data.summary.counties_covered}`)
    rows.push('')
  }

  // Demographics section
  if (data.demographics) {
    rows.push('=== DEMOGRAPHICS BY SEX ===')
    rows.push('Category,Total Cases,Solved Cases,Unsolved Cases,Solve Rate,% of Total')
    data.demographics.by_sex.forEach((item) => {
      rows.push(
        `${item.category},${item.total_cases},${item.solved_cases},${item.unsolved_cases},${item.solve_rate.toFixed(2)}%,${item.percentage_of_total.toFixed(2)}%`
      )
    })
    rows.push('')

    rows.push('=== DEMOGRAPHICS BY RACE ===')
    rows.push('Category,Total Cases,Solved Cases,Unsolved Cases,Solve Rate,% of Total')
    data.demographics.by_race.forEach((item) => {
      rows.push(
        `${item.category},${item.total_cases},${item.solved_cases},${item.unsolved_cases},${item.solve_rate.toFixed(2)}%,${item.percentage_of_total.toFixed(2)}%`
      )
    })
    rows.push('')

    rows.push('=== DEMOGRAPHICS BY AGE GROUP ===')
    rows.push('Category,Total Cases,Solved Cases,Unsolved Cases,Solve Rate,% of Total')
    data.demographics.by_age_group.forEach((item) => {
      rows.push(
        `${item.category},${item.total_cases},${item.solved_cases},${item.unsolved_cases},${item.solve_rate.toFixed(2)}%,${item.percentage_of_total.toFixed(2)}%`
      )
    })
    rows.push('')
  }

  // Weapons section
  if (data.weapons) {
    rows.push('=== WEAPONS ===')
    rows.push('Weapon,Count,Percentage,Solve Rate')
    data.weapons.weapons.forEach((item) => {
      rows.push(
        `"${item.category}",${item.count},${item.percentage.toFixed(2)}%,${item.solve_rate.toFixed(2)}%`
      )
    })
    rows.push('')
  }

  // Circumstances section
  if (data.circumstances) {
    rows.push('=== CIRCUMSTANCES ===')
    rows.push('Circumstance,Count,Percentage,Solve Rate')
    data.circumstances.circumstances.forEach((item) => {
      rows.push(
        `"${item.category}",${item.count},${item.percentage.toFixed(2)}%,${item.solve_rate.toFixed(2)}%`
      )
    })
    rows.push('')
  }

  // Relationships section
  if (data.relationships) {
    rows.push('=== RELATIONSHIPS ===')
    rows.push('Relationship,Count,Percentage,Solve Rate')
    data.relationships.relationships.forEach((item) => {
      rows.push(
        `"${item.category}",${item.count},${item.percentage.toFixed(2)}%,${item.solve_rate.toFixed(2)}%`
      )
    })
    rows.push('')
  }

  // Geographic section
  if (data.geographic) {
    rows.push('=== TOP STATES ===')
    rows.push('State,Total Cases,Solved Cases,Solve Rate')
    data.geographic.top_states.forEach((item) => {
      rows.push(
        `${item.state},${item.total_cases},${item.solved_cases},${item.solve_rate.toFixed(2)}%`
      )
    })
    rows.push('')

    rows.push('=== TOP COUNTIES ===')
    rows.push('County,State,Total Cases,Solved Cases,Solve Rate')
    data.geographic.top_counties.forEach((item) => {
      rows.push(
        `"${item.county}",${item.state},${item.total_cases},${item.solved_cases},${item.solve_rate.toFixed(2)}%`
      )
    })
    rows.push('')
  }

  // Trends section
  if (data.trends) {
    rows.push('=== YEARLY TRENDS ===')
    rows.push('Year,Total Cases,Solved Cases,Solve Rate')
    data.trends.yearly_data.forEach((item) => {
      rows.push(
        `${item.year},${item.total_cases},${item.solved_cases},${item.solve_rate.toFixed(2)}%`
      )
    })
    rows.push('')
  }

  // Seasonal section
  if (data.seasonal) {
    rows.push('=== SEASONAL PATTERNS ===')
    rows.push('Month,Average Cases,% of Annual')
    data.seasonal.patterns.forEach((item) => {
      rows.push(
        `${item.month_name},${item.average_cases.toFixed(0)},${item.percentage_of_annual.toFixed(2)}%`
      )
    })
    rows.push('')
  }

  return rows.join('\n')
}

/**
 * Download data as a file.
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * ExportButton component.
 *
 * Renders a dropdown button for exporting statistics data.
 */
export const ExportButton: React.FC<ExportButtonProps> = ({ data, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExportCSV = () => {
    const csv = convertToCSV(data)
    const timestamp = new Date().toISOString().split('T')[0]
    downloadFile(csv, `statistics_${timestamp}.csv`, 'text/csv;charset=utf-8;')
    setIsOpen(false)
  }

  const handleExportJSON = () => {
    const json = JSON.stringify(data, null, 2)
    const timestamp = new Date().toISOString().split('T')[0]
    downloadFile(json, `statistics_${timestamp}.json`, 'application/json')
    setIsOpen(false)
  }

  const hasData = Object.values(data).some((value) => value !== undefined)

  return (
    <div className="export-dropdown" ref={dropdownRef}>
      <button
        className="export-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || !hasData}
      >
        <svg
          className="export-button-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Export
      </button>

      {isOpen && (
        <div className="export-dropdown-menu">
          <button className="export-dropdown-item" onClick={handleExportCSV}>
            Export as CSV
          </button>
          <button className="export-dropdown-item" onClick={handleExportJSON}>
            Export as JSON
          </button>
        </div>
      )}
    </div>
  )
}

export default ExportButton
