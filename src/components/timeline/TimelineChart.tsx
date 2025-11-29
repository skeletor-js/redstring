/**
 * TimelineChart - Main chart component for timeline visualization.
 *
 * Renders a stacked area/bar/line chart showing solved vs unsolved cases
 * over time using Recharts.
 */

import React, { useCallback } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
  TooltipProps,
} from 'recharts'
import {
  TimelineDataPoint,
  TimelineChartType,
  TimelineGranularity,
} from '../../types/timeline'

/**
 * Custom tooltip component for the timeline chart.
 */
const CustomTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const data = payload[0]?.payload as TimelineDataPoint

  return (
    <div className="timeline-tooltip">
      <p className="timeline-tooltip-label">{label}</p>
      <div className="timeline-tooltip-content">
        <div className="timeline-tooltip-row">
          <span className="timeline-tooltip-dot solved" />
          <span>Solved: {data.solved_cases.toLocaleString()}</span>
        </div>
        <div className="timeline-tooltip-row">
          <span className="timeline-tooltip-dot unsolved" />
          <span>Unsolved: {data.unsolved_cases.toLocaleString()}</span>
        </div>
        <div className="timeline-tooltip-row total">
          <span>Total: {data.total_cases.toLocaleString()}</span>
        </div>
        <div className="timeline-tooltip-row rate">
          <span>Solve Rate: {data.solve_rate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}

/**
 * TimelineChart component props.
 */
interface TimelineChartProps {
  /** Timeline data points to display */
  data: TimelineDataPoint[]
  /** Chart type: area, bar, or line */
  chartType: TimelineChartType
  /** Time granularity for axis formatting */
  granularity: TimelineGranularity
  /** Callback when brush selection changes */
  onBrushChange?: (startIndex: number, endIndex: number) => void
  /** Whether to show the brush selector */
  showBrush?: boolean
  /** Height of the chart */
  height?: number
}

/**
 * TimelineChart component.
 *
 * Displays case statistics over time with stacked visualization
 * of solved and unsolved cases.
 */
export const TimelineChart: React.FC<TimelineChartProps> = ({
  data,
  chartType,
  granularity,
  onBrushChange,
  showBrush = true,
  height = 400,
}) => {
  // Colors from theme
  const solvedColor = 'var(--color-success, #3fb950)'
  const unsolvedColor = 'var(--color-danger, #f85149)'
  const gridColor = 'var(--color-border, #30363d)'
  const textColor = 'var(--color-text-secondary, #8b949e)'

  // Handle brush change
  const handleBrushChange = useCallback(
    (brushData: { startIndex?: number; endIndex?: number }) => {
      if (
        onBrushChange &&
        brushData.startIndex !== undefined &&
        brushData.endIndex !== undefined
      ) {
        onBrushChange(brushData.startIndex, brushData.endIndex)
      }
    },
    [onBrushChange]
  )

  // Format X-axis tick based on granularity
  const formatXAxis = useCallback(
    (value: string) => {
      if (granularity === 'month') {
        // For months, show abbreviated format
        const parts = value.split('-')
        if (parts.length === 2) {
          return `${parts[1]}/${parts[0].slice(2)}`
        }
      }
      return value
    },
    [granularity]
  )

  // Common chart props
  const commonProps = {
    data,
    margin: { top: 10, right: 30, left: 0, bottom: 0 },
  }

  // Common axis props
  const xAxisProps = {
    dataKey: 'period',
    stroke: textColor,
    tick: { fill: textColor, fontSize: 12 },
    tickFormatter: formatXAxis,
  }

  const yAxisProps = {
    stroke: textColor,
    tick: { fill: textColor, fontSize: 12 },
    tickFormatter: (value: number) => value.toLocaleString(),
  }

  // Render area chart
  const renderAreaChart = () => (
    <AreaChart {...commonProps}>
      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
      <XAxis {...xAxisProps} />
      <YAxis {...yAxisProps} />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Area
        type="monotone"
        dataKey="solved_cases"
        stackId="1"
        stroke={solvedColor}
        fill={solvedColor}
        fillOpacity={0.6}
        name="Solved Cases"
      />
      <Area
        type="monotone"
        dataKey="unsolved_cases"
        stackId="1"
        stroke={unsolvedColor}
        fill={unsolvedColor}
        fillOpacity={0.6}
        name="Unsolved Cases"
      />
      {showBrush && (
        <Brush
          dataKey="period"
          height={30}
          stroke="var(--color-accent, #58a6ff)"
          fill="var(--color-bg-secondary, #161b22)"
          onChange={handleBrushChange}
        />
      )}
    </AreaChart>
  )

  // Render bar chart
  const renderBarChart = () => (
    <BarChart {...commonProps}>
      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
      <XAxis {...xAxisProps} />
      <YAxis {...yAxisProps} />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Bar dataKey="solved_cases" stackId="1" fill={solvedColor} name="Solved Cases" />
      <Bar
        dataKey="unsolved_cases"
        stackId="1"
        fill={unsolvedColor}
        name="Unsolved Cases"
      />
      {showBrush && (
        <Brush
          dataKey="period"
          height={30}
          stroke="var(--color-accent, #58a6ff)"
          fill="var(--color-bg-secondary, #161b22)"
          onChange={handleBrushChange}
        />
      )}
    </BarChart>
  )

  // Render line chart
  const renderLineChart = () => (
    <LineChart {...commonProps}>
      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
      <XAxis {...xAxisProps} />
      <YAxis {...yAxisProps} />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Line
        type="monotone"
        dataKey="solved_cases"
        stroke={solvedColor}
        strokeWidth={2}
        dot={false}
        name="Solved Cases"
      />
      <Line
        type="monotone"
        dataKey="unsolved_cases"
        stroke={unsolvedColor}
        strokeWidth={2}
        dot={false}
        name="Unsolved Cases"
      />
      <Line
        type="monotone"
        dataKey="total_cases"
        stroke="var(--color-accent, #58a6ff)"
        strokeWidth={2}
        strokeDasharray="5 5"
        dot={false}
        name="Total Cases"
      />
      {showBrush && (
        <Brush
          dataKey="period"
          height={30}
          stroke="var(--color-accent, #58a6ff)"
          fill="var(--color-bg-secondary, #161b22)"
          onChange={handleBrushChange}
        />
      )}
    </LineChart>
  )

  // Select chart type
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return renderBarChart()
      case 'line':
        return renderLineChart()
      case 'area':
      default:
        return renderAreaChart()
    }
  }

  return (
    <div className="timeline-chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}

export default TimelineChart
