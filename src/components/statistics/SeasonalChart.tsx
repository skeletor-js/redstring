/**
 * SeasonalChart - Seasonal patterns visualization.
 *
 * Displays monthly case patterns and seasonal analysis
 * as a bar chart with peak/lowest month indicators.
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
  ReferenceLine,
} from 'recharts'
import { SeasonalStatistics } from '../../types/statistics'

interface SeasonalChartProps {
  /** Seasonal statistics data */
  data: SeasonalStatistics | undefined
  /** Loading state */
  isLoading: boolean
}

// Chart colors - seasonal gradient
const getMonthColor = (
  month: number,
  peakMonth: string,
  lowestMonth: string,
  monthName: string
): string => {
  if (monthName === peakMonth) return '#f85149' // Peak - red
  if (monthName === lowestMonth) return '#3fb950' // Lowest - green

  // Seasonal colors
  if (month >= 3 && month <= 5) return '#56d364' // Spring - green
  if (month >= 6 && month <= 8) return '#f8b742' // Summer - yellow/orange
  if (month >= 9 && month <= 11) return '#d29922' // Fall - orange
  return '#58a6ff' // Winter - blue
}

/**
 * Custom tooltip component for seasonal chart.
 */
const CustomTooltip: React.FC<{
  active?: boolean
  payload?: Array<{
    payload: { month_name: string; average_cases: number; percentage_of_annual: number }
  }>
}> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload

  return (
    <div className="statistics-tooltip">
      <p className="statistics-tooltip-label">{data.month_name}</p>
      <div className="statistics-tooltip-content">
        <div className="statistics-tooltip-row">
          <span>Average Cases</span>
          <span className="statistics-tooltip-value">
            {Math.round(data.average_cases).toLocaleString()}
          </span>
        </div>
        <div className="statistics-tooltip-row">
          <span>% of Annual</span>
          <span className="statistics-tooltip-value">
            {data.percentage_of_annual.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * SeasonalChart component.
 *
 * Renders a bar chart showing monthly case patterns.
 */
export const SeasonalChart: React.FC<SeasonalChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="statistics-chart-card">
        <div className="statistics-chart-header">
          <div className="statistics-chart-title">
            <h3>Seasonal Patterns</h3>
          </div>
        </div>
        <div className="statistics-chart-body">
          <div className="statistics-chart-skeleton" />
        </div>
      </div>
    )
  }

  if (!data || !data.patterns || data.patterns.length === 0) {
    return (
      <div className="statistics-chart-card">
        <div className="statistics-chart-header">
          <div className="statistics-chart-title">
            <h3>Seasonal Patterns</h3>
          </div>
        </div>
        <div className="statistics-chart-body">
          <div className="statistics-chart-empty">
            <p>No seasonal data available</p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate average for reference line
  const avgCases =
    data.patterns.reduce((sum, p) => sum + p.average_cases, 0) / data.patterns.length

  return (
    <div className="statistics-chart-card">
      <div className="statistics-chart-header">
        <div className="statistics-chart-title">
          <h3>Seasonal Patterns</h3>
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
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--color-danger)' }}>
            Peak: <strong>{data.peak_month}</strong>
          </span>
          <span style={{ color: 'var(--color-success)' }}>
            Lowest: <strong>{data.lowest_month}</strong>
          </span>
        </div>
      </div>
      <div className="statistics-chart-body">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data.patterns}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month_name"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => value.substring(0, 3)}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={avgCases}
              stroke="var(--color-text-muted)"
              strokeDasharray="3 3"
              label={{
                value: 'Avg',
                position: 'right',
                fill: 'var(--color-text-muted)',
                fontSize: 10,
              }}
            />
            <Bar dataKey="average_cases" name="Average Cases" radius={[4, 4, 0, 0]}>
              {data.patterns.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getMonthColor(
                    entry.month,
                    data.peak_month,
                    data.lowest_month,
                    entry.month_name
                  )}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Season legend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginTop: '0.5rem',
            fontSize: '0.7rem',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: '#58a6ff',
                borderRadius: '2px',
              }}
            />
            Winter
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: '#56d364',
                borderRadius: '2px',
              }}
            />
            Spring
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: '#f8b742',
                borderRadius: '2px',
              }}
            />
            Summer
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: '#d29922',
                borderRadius: '2px',
              }}
            />
            Fall
          </span>
        </div>
      </div>
    </div>
  )
}

export default SeasonalChart
