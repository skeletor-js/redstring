/**
 * DemographicsChart - Demographics breakdown visualization.
 *
 * Displays case statistics broken down by sex, race, and age group
 * with tabs to switch between different breakdowns.
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
  Legend,
} from 'recharts'
import { DemographicsResponse, DemographicBreakdown } from '../../types/statistics'

interface DemographicsChartProps {
  /** Demographics data */
  data: DemographicsResponse | undefined
  /** Loading state */
  isLoading: boolean
}

type DemographicTab = 'sex' | 'race' | 'age'

// Chart colors
const CHART_COLORS = {
  total: '#58a6ff',
  solved: '#3fb950',
  unsolved: '#f85149',
}

/**
 * Custom tooltip component for demographics chart.
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
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * DemographicsChart component.
 *
 * Renders a bar chart showing demographic breakdowns with tabs.
 */
export const DemographicsChart: React.FC<DemographicsChartProps> = ({
  data,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<DemographicTab>('sex')

  if (isLoading) {
    return (
      <div className="statistics-chart-card">
        <div className="statistics-chart-header">
          <div className="statistics-chart-title">
            <h3>Demographics</h3>
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
      <div className="statistics-chart-card">
        <div className="statistics-chart-header">
          <div className="statistics-chart-title">
            <h3>Demographics</h3>
          </div>
        </div>
        <div className="statistics-chart-body">
          <div className="statistics-chart-empty">
            <p>No demographic data available</p>
          </div>
        </div>
      </div>
    )
  }

  // Get the appropriate data based on active tab
  const getChartData = (): DemographicBreakdown[] => {
    switch (activeTab) {
      case 'sex':
        return data.by_sex
      case 'race':
        return data.by_race
      case 'age':
        return data.by_age_group
      default:
        return data.by_sex
    }
  }

  const chartData = getChartData()

  return (
    <div className="statistics-chart-card">
      <div className="statistics-chart-header">
        <div className="statistics-chart-title">
          <h3>Demographics</h3>
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
            className={`demographics-tab ${activeTab === 'sex' ? 'active' : ''}`}
            onClick={() => setActiveTab('sex')}
          >
            Sex
          </button>
          <button
            className={`demographics-tab ${activeTab === 'race' ? 'active' : ''}`}
            onClick={() => setActiveTab('race')}
          >
            Race
          </button>
          <button
            className={`demographics-tab ${activeTab === 'age' ? 'active' : ''}`}
            onClick={() => setActiveTab('age')}
          >
            Age Group
          </button>
        </div>
      </div>
      <div className="statistics-chart-body">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" tickFormatter={(value) => value.toLocaleString()} />
            <YAxis
              type="category"
              dataKey="category"
              width={70}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="solved_cases"
              name="Solved"
              stackId="a"
              fill={CHART_COLORS.solved}
            />
            <Bar
              dataKey="unsolved_cases"
              name="Unsolved"
              stackId="a"
              fill={CHART_COLORS.unsolved}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Solve rate summary */}
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          {chartData.slice(0, 5).map((item) => (
            <div
              key={item.category}
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
              }}
            >
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {item.category}:{' '}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  color:
                    item.solve_rate >= 50
                      ? 'var(--color-success)'
                      : 'var(--color-danger)',
                }}
              >
                {item.solve_rate.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DemographicsChart
