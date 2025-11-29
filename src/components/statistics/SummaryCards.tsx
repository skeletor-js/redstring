/**
 * SummaryCards - Top-level KPI cards for statistics dashboard.
 *
 * Displays key metrics including total cases, solve rate, and coverage.
 */

import React from 'react'
import { StatisticsSummary } from '../../types/statistics'

interface SummaryCardsProps {
  /** Summary statistics data */
  data: StatisticsSummary | undefined
  /** Loading state */
  isLoading: boolean
}

/**
 * Format a number with locale-specific formatting.
 */
const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

/**
 * Format a percentage value.
 */
const formatPercent = (num: number): string => {
  return `${num.toFixed(1)}%`
}

/**
 * SummaryCards component.
 *
 * Renders a grid of KPI cards showing key statistics.
 */
export const SummaryCards: React.FC<SummaryCardsProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="statistics-summary-grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="summary-card-skeleton" />
        ))}
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="statistics-summary-grid">
      {/* Total Cases */}
      <div className="summary-card">
        <div className="summary-card-header">
          <span className="summary-card-label">Total Cases</span>
          <svg
            className="summary-card-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <span className="summary-card-value">{formatNumber(data.total_cases)}</span>
        <span className="summary-card-subtext">
          {data.date_range.start_year} - {data.date_range.end_year}
        </span>
      </div>

      {/* Solve Rate */}
      <div className="summary-card">
        <div className="summary-card-header">
          <span className="summary-card-label">Solve Rate</span>
          <svg
            className="summary-card-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span
          className={`summary-card-value ${data.overall_solve_rate >= 50 ? 'success' : 'danger'}`}
        >
          {formatPercent(data.overall_solve_rate)}
        </span>
        <span className="summary-card-subtext">Overall clearance rate</span>
      </div>

      {/* Solved Cases */}
      <div className="summary-card">
        <div className="summary-card-header">
          <span className="summary-card-label">Solved Cases</span>
          <svg
            className="summary-card-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="summary-card-value success">
          {formatNumber(data.solved_cases)}
        </span>
        <span className="summary-card-subtext">
          {formatPercent((data.solved_cases / data.total_cases) * 100)} of total
        </span>
      </div>

      {/* Unsolved Cases */}
      <div className="summary-card">
        <div className="summary-card-header">
          <span className="summary-card-label">Unsolved Cases</span>
          <svg
            className="summary-card-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="summary-card-value danger">
          {formatNumber(data.unsolved_cases)}
        </span>
        <span className="summary-card-subtext">
          {formatPercent((data.unsolved_cases / data.total_cases) * 100)} of total
        </span>
      </div>

      {/* States Covered */}
      <div className="summary-card">
        <div className="summary-card-header">
          <span className="summary-card-label">States Covered</span>
          <svg
            className="summary-card-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="summary-card-value accent">{data.states_covered}</span>
        <span className="summary-card-subtext">U.S. states and territories</span>
      </div>

      {/* Counties Covered */}
      <div className="summary-card">
        <div className="summary-card-header">
          <span className="summary-card-label">Counties Covered</span>
          <svg
            className="summary-card-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="summary-card-value accent">
          {formatNumber(data.counties_covered)}
        </span>
        <span className="summary-card-subtext">Unique county jurisdictions</span>
      </div>
    </div>
  )
}

export default SummaryCards
