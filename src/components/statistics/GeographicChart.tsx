/**
 * GeographicChart - Geographic distribution visualization.
 *
 * Displays top states and counties by case count
 * with bar chart and table views.
 */

import React, { useState } from 'react'
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
import { GeographicStatistics } from '../../types/statistics'

interface GeographicChartProps {
  /** Geographic statistics data */
  data: GeographicStatistics | undefined
  /** Loading state */
  isLoading: boolean
}

type GeoTab = 'states' | 'counties'

// Chart colors
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
 * Get solve rate class for styling.
 */
const getSolveRateClass = (rate: number): string => {
  if (rate >= 60) return 'high'
  if (rate >= 40) return 'medium'
  return 'low'
}

/**
 * Custom tooltip component for geographic chart.
 */
const CustomTooltip: React.FC<{
  active?: boolean
  payload?: Array<{
    payload: {
      state?: string
      county?: string
      total_cases: number
      solved_cases: number
      solve_rate: number
    }
  }>
}> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload

  return (
    <div className="statistics-tooltip">
      <p className="statistics-tooltip-label">{data.state || data.county}</p>
      <div className="statistics-tooltip-content">
        <div className="statistics-tooltip-row">
          <span>Total Cases</span>
          <span className="statistics-tooltip-value">
            {data.total_cases.toLocaleString()}
          </span>
        </div>
        <div className="statistics-tooltip-row">
          <span>Solved</span>
          <span
            className="statistics-tooltip-value"
            style={{ color: 'var(--color-success)' }}
          >
            {data.solved_cases.toLocaleString()}
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
 * GeographicChart component.
 *
 * Renders a bar chart and table showing geographic distribution.
 */
export const GeographicChart: React.FC<GeographicChartProps> = ({
  data,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<GeoTab>('states')

  if (isLoading) {
    return (
      <div className="statistics-chart-card full-width">
        <div className="statistics-chart-header">
          <div className="statistics-chart-title">
            <h3>Geographic Distribution</h3>
          </div>
        </div>
        <div className="statistics-chart-body">
          <div className="statistics-chart-skeleton" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="statistics-chart-card full-width">
        <div className="statistics-chart-header">
          <div className="statistics-chart-title">
            <h3>Geographic Distribution</h3>
          </div>
        </div>
        <div className="statistics-chart-body">
          <div className="statistics-chart-empty">
            <p>No geographic data available</p>
          </div>
        </div>
      </div>
    )
  }

  const chartData = activeTab === 'states' ? data.top_states : data.top_counties
  const nameKey = activeTab === 'states' ? 'state' : 'county'

  return (
    <div className="statistics-chart-card full-width">
      <div className="statistics-chart-header">
        <div className="statistics-chart-title">
          <h3>Geographic Distribution</h3>
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
        <div className="demographics-tabs">
          <button
            className={`demographics-tab ${activeTab === 'states' ? 'active' : ''}`}
            onClick={() => setActiveTab('states')}
          >
            Top States
          </button>
          <button
            className={`demographics-tab ${activeTab === 'counties' ? 'active' : ''}`}
            onClick={() => setActiveTab('counties')}
          >
            Top Counties
          </button>
        </div>
      </div>
      <div className="statistics-chart-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Bar Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(value) => value.toLocaleString()} />
              <YAxis
                type="category"
                dataKey={nameKey}
                width={50}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_cases" name="Cases" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="geographic-table">
              <thead>
                <tr>
                  <th>{activeTab === 'states' ? 'State' : 'County'}</th>
                  {activeTab === 'counties' && <th>State</th>}
                  <th>Cases</th>
                  <th>Solved</th>
                  <th>Solve Rate</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item, index) => (
                  <tr key={index}>
                    <td>
                      {activeTab === 'states' ? item.state : (item as any).county}
                    </td>
                    {activeTab === 'counties' && <td>{item.state}</td>}
                    <td>{item.total_cases.toLocaleString()}</td>
                    <td>{item.solved_cases.toLocaleString()}</td>
                    <td className={`solve-rate ${getSolveRateClass(item.solve_rate)}`}>
                      {item.solve_rate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GeographicChart
