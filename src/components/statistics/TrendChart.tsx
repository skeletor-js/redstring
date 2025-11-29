/**
 * TrendChart - Yearly trends mini-chart visualization.
 *
 * Displays yearly case data with trend analysis
 * as a line chart with trend direction indicator.
 */

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendStatistics } from '../../types/statistics'

interface TrendChartProps {
  /** Trend statistics data */
  data: TrendStatistics | undefined
  /** Loading state */
  isLoading: boolean
}

/**
 * Get trend icon based on direction.
 */
const TrendIcon: React.FC<{ direction: 'increasing' | 'decreasing' | 'stable' }> = ({
  direction,
}) => {
  if (direction === 'increasing') {
    return (
      <svg
        className="trend-indicator-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M7 17l5-5 5 5M7 7l5 5 5-5" />
      </svg>
    )
  }
  if (direction === 'decreasing') {
    return (
      <svg
        className="trend-indicator-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M7 7l5 5 5-5M7 17l5-5 5 5" />
      </svg>
    )
  }
  return (
    <svg
      className="trend-indicator-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14" />
    </svg>
  )
}

/**
 * Custom tooltip component for trend chart.
 */
const CustomTooltip: React.FC<{
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="statistics-tooltip">
      <p className="statistics-tooltip-label">{label}</p>
      <div className="statistics-tooltip-content">
        {payload.map((entry, index) => (
          <div key={index} className="statistics-tooltip-row">
            <span>{entry.name}</span>
            <span className="statistics-tooltip-value" style={{ color: entry.color }}>
              {entry.name === 'Solve Rate'
                ? `${entry.value.toFixed(1)}%`
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * TrendChart component.
 *
 * Renders a line chart showing yearly trends with trend indicator.
 */
export const TrendChart: React.FC<TrendChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="statistics-chart-card">
        <div className="statistics-chart-header">
          <div className="statistics-chart-title">
            <h3>Yearly Trends</h3>
          </div>
        </div>
        <div className="statistics-chart-body">
          <div className="statistics-chart-skeleton" />
        </div>
      </div>
    )
  }

  if (!data || !data.yearly_data || data.yearly_data.length === 0) {
    return (
      <div className="statistics-chart-card">
        <div className="statistics-chart-header">
          <div className="statistics-chart-title">
            <h3>Yearly Trends</h3>
          </div>
        </div>
        <div className="statistics-chart-body">
          <div className="statistics-chart-empty">
            <p>No trend data available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="statistics-chart-card">
      <div className="statistics-chart-header">
        <div className="statistics-chart-title">
          <h3>Yearly Trends</h3>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className={`trend-indicator ${data.overall_trend}`}>
            <TrendIcon direction={data.overall_trend} />
            <span>
              {data.overall_trend.charAt(0).toUpperCase() + data.overall_trend.slice(1)}
            </span>
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Avg: {Math.round(data.average_annual_cases).toLocaleString()} cases/year
          </span>
        </div>
      </div>
      <div className="statistics-chart-body">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={data.yearly_data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => value.toString()}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="total_cases"
              name="Total Cases"
              stroke="#58a6ff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="solve_rate"
              name="Solve Rate"
              stroke="#3fb950"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default TrendChart
