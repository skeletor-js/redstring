/**
 * WeaponsChart - Weapon distribution visualization.
 *
 * Displays case statistics broken down by weapon type
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
import { WeaponStatistics } from '../../types/statistics'

interface WeaponsChartProps {
  /** Weapon statistics data */
  data: WeaponStatistics | undefined
  /** Loading state */
  isLoading: boolean
}

// Chart colors - gradient from blue to purple
const CHART_COLORS = [
  '#58a6ff',
  '#6b9fff',
  '#7e98ff',
  '#9191ff',
  '#a48aff',
  '#b783ff',
  '#ca7cff',
  '#dd75ff',
  '#f06eff',
  '#ff67f0',
]

/**
 * Custom tooltip component for weapons chart.
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
 * WeaponsChart component.
 *
 * Renders a horizontal bar chart showing weapon distribution.
 */
export const WeaponsChart: React.FC<WeaponsChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="statistics-chart-card">
        <div className="statistics-chart-header">
          <div className="statistics-chart-title">
            <h3>Weapons Used</h3>
          </div>
        </div>
        <div className="statistics-chart-body">
          <div className="statistics-chart-skeleton" />
        </div>
      </div>
    )
  }

  if (!data || !data.weapons || data.weapons.length === 0) {
    return (
      <div className="statistics-chart-card">
        <div className="statistics-chart-header">
          <div className="statistics-chart-title">
            <h3>Weapons Used</h3>
          </div>
        </div>
        <div className="statistics-chart-body">
          <div className="statistics-chart-empty">
            <p>No weapon data available</p>
          </div>
        </div>
      </div>
    )
  }

  // Take top 10 weapons
  const chartData = data.weapons.slice(0, 10)

  return (
    <div className="statistics-chart-card">
      <div className="statistics-chart-header">
        <div className="statistics-chart-title">
          <h3>Weapons Used</h3>
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
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" tickFormatter={(value) => value.toLocaleString()} />
            <YAxis
              type="category"
              dataKey="category"
              width={90}
              tick={{ fontSize: 11 }}
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

export default WeaponsChart
