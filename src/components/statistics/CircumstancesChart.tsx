/**
 * CircumstancesChart - Circumstance breakdown visualization.
 *
 * Displays case statistics broken down by circumstance type
 * as a horizontal bar chart.
 */

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { CircumstanceStatistics } from '../../types/statistics'

interface CircumstancesChartProps {
  /** Circumstance statistics data */
  data: CircumstanceStatistics | undefined
  /** Loading state */
  isLoading: boolean
}

// Chart colors - warm tones
const CHART_COLORS = [
  '#d29922',
  '#e5a832',
  '#f8b742',
  '#ffc652',
  '#ffd562',
  '#ffe472',
  '#fff382',
  '#ffff92',
  '#f0f0a2',
  '#e0e0b2',
]

/**
 * Custom tooltip component for circumstances chart.
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
 * CircumstancesChart component.
 *
 * Renders a horizontal bar chart showing circumstance distribution.
 */
export const CircumstancesChart: React.FC<CircumstancesChartProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="statistics-chart-card">
        <div className="statistics-chart-header">
          <div className="statistics-chart-title">
            <h3>Circumstances</h3>
          </div>
        </div>
        <div className="statistics-chart-body">
          <div className="statistics-chart-skeleton" />
        </div>
      </div>
    )
  }

  if (!data || !data.circumstances || data.circumstances.length === 0) {
    return (
      <div className="statistics-chart-card">
        <div className="statistics-chart-header">
          <div className="statistics-chart-title">
            <h3>Circumstances</h3>
          </div>
        </div>
        <div className="statistics-chart-body">
          <div className="statistics-chart-empty">
            <p>No circumstance data available</p>
          </div>
        </div>
      </div>
    )
  }

  // Take top 10 circumstances
  const chartData = data.circumstances.slice(0, 10)

  return (
    <div className="statistics-chart-card">
      <div className="statistics-chart-header">
        <div className="statistics-chart-title">
          <h3>Circumstances</h3>
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
          Top 10 of {data.total_cases.toLocaleString()} cases
        </span>
      </div>
      <div className="statistics-chart-body">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" tickFormatter={(value) => value.toLocaleString()} />
            <YAxis
              type="category"
              dataKey="category"
              width={110}
              tick={{ fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Cases" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default CircumstancesChart
