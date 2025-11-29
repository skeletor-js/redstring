/**
 * StatisticsView - Main dashboard container for statistics visualization.
 *
 * Renders the statistics dashboard with summary cards and various charts.
 * Integrates with the filter system for data filtering.
 */

import React from 'react'
import { useStatistics } from '../../hooks/useStatistics'
import { getUserMessage } from '../../utils/errorHandler'
import { SummaryCards } from './SummaryCards'
import { DemographicsChart } from './DemographicsChart'
import { WeaponsChart } from './WeaponsChart'
import { CircumstancesChart } from './CircumstancesChart'
import { RelationshipsChart } from './RelationshipsChart'
import { GeographicChart } from './GeographicChart'
import { TrendChart } from './TrendChart'
import { SeasonalChart } from './SeasonalChart'
import { ExportButton } from './ExportButton'
import './StatisticsView.css'

/**
 * StatisticsView component props.
 */
interface StatisticsViewProps {
  /** Optional class name for styling */
  className?: string
}

/**
 * StatisticsView component.
 *
 * Main container for the statistics dashboard feature.
 * Displays various statistical breakdowns and visualizations.
 */
export const StatisticsView: React.FC<StatisticsViewProps> = ({ className }) => {
  const {
    summary,
    demographics,
    weapons,
    circumstances,
    relationships,
    geographic,
    trends,
    seasonal,
    isLoading,
    isSummaryLoading,
    isDemographicsLoading,
    isWeaponsLoading,
    isCircumstancesLoading,
    isRelationshipsLoading,
    isGeographicLoading,
    isTrendsLoading,
    isSeasonalLoading,
    error,
  } = useStatistics()

  // Show initial loading state
  if (isLoading && !summary) {
    return (
      <div className={`statistics-view ${className || ''}`}>
        <div className="statistics-loading">
          <div className="statistics-loading-spinner" />
          <p>Loading statistics...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !summary) {
    return (
      <div className={`statistics-view ${className || ''}`}>
        <div className="statistics-error">
          <p>Failed to load statistics</p>
          <p className="statistics-error-detail">{getUserMessage(error)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`statistics-view ${className || ''}`}>
      {/* Header */}
      <div className="statistics-header">
        <div className="statistics-title">
          <h2>Statistics Dashboard</h2>
          <span className="statistics-subtitle">
            Comprehensive analysis of homicide data
          </span>
        </div>
        <div className="statistics-actions">
          <ExportButton
            data={{
              summary,
              demographics,
              weapons,
              circumstances,
              relationships,
              geographic,
              trends,
              seasonal,
            }}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards data={summary} isLoading={isSummaryLoading} />

      {/* Charts Grid */}
      <div className="statistics-charts-grid">
        {/* Demographics Chart */}
        <DemographicsChart data={demographics} isLoading={isDemographicsLoading} />

        {/* Relationships Chart */}
        <RelationshipsChart data={relationships} isLoading={isRelationshipsLoading} />

        {/* Weapons Chart */}
        <WeaponsChart data={weapons} isLoading={isWeaponsLoading} />

        {/* Circumstances Chart */}
        <CircumstancesChart data={circumstances} isLoading={isCircumstancesLoading} />

        {/* Trend Chart */}
        <TrendChart data={trends} isLoading={isTrendsLoading} />

        {/* Seasonal Chart */}
        <SeasonalChart data={seasonal} isLoading={isSeasonalLoading} />

        {/* Geographic Chart (full width) */}
        <GeographicChart data={geographic} isLoading={isGeographicLoading} />
      </div>
    </div>
  )
}

export default StatisticsView
