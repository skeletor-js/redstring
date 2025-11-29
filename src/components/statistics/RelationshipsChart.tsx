/**
 * RelationshipsChart - Victim-offender relationship visualization.
 *
 * Displays case statistics broken down by relationship type
 * as a pie chart.
 */

import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { RelationshipStatistics } from '../../types/statistics'

interface RelationshipsChartProps {
  /** Relationship statistics data */
  data: RelationshipStatistics | undefined
  /** Loading state */
  isLoading: boolean
}

// Chart colors - varied palette
const CHART_COLORS = [
  '#58a6ff',
  '#3fb950',
  '#f85149',
  '#d29922',
  '#bc8cff',
  '#f778ba',
  '#79c0ff',
  '#56d364',
  '#ff7b72',
  '#e3b341',
]

/**
 * Custom tooltip component for relationships chart.
 */
const CustomTooltip: React.FC<{
  active?: boolean
  payload?: Array<{
    payload: { category: string; count: number; percentage: number; solve_rate: number }
  }>
}> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload

  return (
    <div className="statistics-tooltip">
      <p className="statistics-tooltip-label">{data.category}</p>
      <div className="statistics-tooltip-content">
        <div className="statistics-tooltip-row">
          <span>Cases</span>
          <span className="statistics-tooltip-value">
            {data.count.toLocaleString()}
          </span>
        </div>
        <div className="statistics-tooltip-row">
          <span>Percentage</span>
          <span className="statistics-tooltip-value">
            {data.percentage.toFixed(1)}%
          </span>
        </div>
        <div className="statistics-tooltip-row">
          <span>Solve Rate</span>
          <span
            className="statistics-tooltip-value"
            style={{
              color:
                data.solve_rate >= 50 ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          >
            {data.solve_rate.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Custom legend renderer.
 */
const renderLegend = (props: any) => {
  const { payload } = props
  if (!payload) return null

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        justifyContent: 'center',
        marginTop: '1rem',
      }}
    >
      {payload
        .slice(0, 8)
        .map((entry: { value: string; color?: string }, index: number) => (
          <div
            key={`legend-${index}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                backgroundColor:
                  entry.color || CHART_COLORS[index % CHART_COLORS.length],
              }}
            />
            <span>{entry.value}</span>
          </div>
        ))}
    </div>
  )
}

/**
 * RelationshipsChart component.
 *
 * Renders a pie chart showing relationship distribution.
 */
export const RelationshipsChart: React.FC<RelationshipsChartProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="statistics-chart-card">
        <div className="statistics-chart-header">
          <div className="statistics-chart-title">
            <h3>Victim-Offender Relationships</h3>
          </div>
        </div>
        <div className="statistics-chart-body">
          <div className="statistics-chart-skeleton" />
        </div>
      </div>
    )
  }

  if (!data || !data.relationships || data.relationships.length === 0) {
    return (
      <div className="statistics-chart-card">
        <div className="statistics-chart-header">
          <div className="statistics-chart-title">
            <h3>Victim-Offender Relationships</h3>
          </div>
        </div>
        <div className="statistics-chart-body">
          <div className="statistics-chart-empty">
            <p>No relationship data available</p>
          </div>
        </div>
      </div>
    )
  }

  // Take top 8 relationships for pie chart
  const chartData = data.relationships.slice(0, 8)

  return (
    <div className="statistics-chart-card">
      <div className="statistics-chart-header">
        <div className="statistics-chart-title">
          <h3>Victim-Offender Relationships</h3>
          <svg
            className="statistics-chart-info"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {data.total_cases.toLocaleString()} total cases
        </span>
      </div>
      <div className="statistics-chart-body">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="count"
              nameKey="category"
              label={({ percentage }) => `${percentage.toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default RelationshipsChart
