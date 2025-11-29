/**
 * TrendChart - Trend analysis chart component.
 *
 * Renders a line chart with moving average overlay for trend visualization.
 */

import React, { useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps,
  ReferenceLine,
} from 'recharts'
import {
  TimelineTrendPoint,
  TimelineMetric,
  TimelineGranularity,
} from '../../types/timeline'

/**
 * Get metric display name.
 */
const getMetricDisplayName = (metric: TimelineMetric): string => {
  switch (metric) {
    case 'solve_rate':
      return 'Solve Rate'
    case 'total_cases':
      return 'Total Cases'
    case 'solved_cases':
      return 'Solved Cases'
    case 'unsolved_cases':
      return 'Unsolved Cases'
    default:
      return metric
  }
}

/**
 * Format metric value for display.
 */
const formatMetricValue = (value: number, metric: TimelineMetric): string => {
  if (metric === 'solve_rate') {
    return `${value.toFixed(1)}%`
  }
  return value.toLocaleString()
}

/**
 * Custom tooltip component for the trend chart.
 */
interface TrendTooltipProps extends TooltipProps<number, string> {
  metric: TimelineMetric
}

const CustomTooltip: React.FC<TrendTooltipProps> = ({
  active,
  payload,
  label,
  metric,
}) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const data = payload[0]?.payload as TimelineTrendPoint

  return (
    <div className="timeline-tooltip">
      <p className="timeline-tooltip-label">{label}</p>
      <div className="timeline-tooltip-content">
        <div className="timeline-tooltip-row">
          <span className="timeline-tooltip-dot trend" />
          <span>
            {getMetricDisplayName(metric)}: {formatMetricValue(data.value, metric)}
          </span>
        </div>
        {data.moving_average !== undefined && (
          <div className="timeline-tooltip-row">
            <span className="timeline-tooltip-dot average" />
            <span>Moving Avg: {formatMetricValue(data.moving_average, metric)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * TrendChart component props.
 */
interface TrendChartProps {
  /** Trend data points to display */
  data: TimelineTrendPoint[]
  /** Metric being displayed */
  metric: TimelineMetric
  /** Time granularity for axis formatting */
  granularity: TimelineGranularity
  /** Moving average window size */
  movingAverageWindow: number
  /** Height of the chart */
  height?: number
  /** Whether to show the average reference line */
  showAverageLine?: boolean
}

/**
 * TrendChart component.
 *
 * Displays trend analysis with moving average overlay.
 */
export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  metric,
  granularity,
  movingAverageWindow,
  height = 300,
  showAverageLine = true,
}) => {
  // Colors from theme
  const trendColor = 'var(--color-accent, #58a6ff)'
  const averageColor = 'var(--color-chart-5, #bc8cff)'
  const gridColor = 'var(--color-border, #30363d)'
  const textColor = 'var(--color-text-secondary, #8b949e)'

  // Calculate average value for reference line
  const averageValue =
    data.length > 0 ? data.reduce((sum, d) => sum + d.value, 0) / data.length : 0

  // Format X-axis tick based on granularity
  const formatXAxis = useCallback(
    (value: string) => {
      if (granularity === 'month') {
        const parts = value.split('-')
        if (parts.length === 2) {
          return `${parts[1]}/${parts[0].slice(2)}`
        }
      }
      return value
    },
    [granularity]
  )

  // Format Y-axis based on metric
  const formatYAxis = useCallback(
    (value: number) => {
      if (metric === 'solve_rate') {
        return `${value.toFixed(0)}%`
      }
      return value.toLocaleString()
    },
    [metric]
  )

  // Custom tooltip wrapper to pass metric
  const TooltipWrapper: React.FC<TooltipProps<number, string>> = (props) => (
    <CustomTooltip {...props} metric={metric} />
  )

  return (
    <div className="trend-chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="period"
            stroke={textColor}
            tick={{ fill: textColor, fontSize: 12 }}
            tickFormatter={formatXAxis}
          />
          <YAxis
            stroke={textColor}
            tick={{ fill: textColor, fontSize: 12 }}
            tickFormatter={formatYAxis}
            domain={metric === 'solve_rate' ? [0, 100] : ['auto', 'auto']}
          />
          <Tooltip content={<TooltipWrapper />} />
          <Legend />

          {/* Average reference line */}
          {showAverageLine && (
            <ReferenceLine
              y={averageValue}
              stroke="var(--color-text-muted, #6e7681)"
              strokeDasharray="3 3"
              label={{
                value: `Avg: ${formatMetricValue(averageValue, metric)}`,
                fill: textColor,
                fontSize: 11,
                position: 'right',
              }}
            />
          )}

          {/* Main trend line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={trendColor}
            strokeWidth={2}
            dot={false}
            name={getMetricDisplayName(metric)}
            activeDot={{ r: 4, fill: trendColor }}
          />

          {/* Moving average line */}
          <Line
            type="monotone"
            dataKey="moving_average"
            stroke={averageColor}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name={`${movingAverageWindow}-Period Moving Avg`}
            activeDot={{ r: 4, fill: averageColor }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TrendChart
