import { useUIStore } from '../../stores/useUIStore'
import { useFilterStore } from '../../stores/useFilterStore'
import { useStatsSummary } from '../../hooks/useCases'
import { DEFAULT_FILTER_STATE } from '../../types/filter'

interface SidebarProps {
  collapsed: boolean
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { toggleSidebar } = useUIStore()
  const { resetFilters, getActiveFilterCount } = useFilterStore()
  const activeFilterCount = getActiveFilterCount()

  // Use default filter state for overall stats
  const { data: stats, isLoading, isError } = useStatsSummary(DEFAULT_FILTER_STATE)

  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '0'
    return num.toLocaleString('en-US')
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '▶️' : '◀️'}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-content">
          {/* Quick Stats Section */}
          <section className="sidebar-section">
            <h2 className="sidebar-section-title">Quick Stats</h2>
            {isLoading ? (
              <div className="stats-loading">Loading...</div>
            ) : isError ? (
              <div className="stats-error">Failed to load stats</div>
            ) : stats ? (
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Total Cases</div>
                  <div className="stat-value">{formatNumber(stats.total_cases)}</div>
                </div>
                <div className="stat-item stat-solved">
                  <div className="stat-label">Solved</div>
                  <div className="stat-value">{formatNumber(stats.solved_cases)}</div>
                </div>
                <div className="stat-item stat-unsolved">
                  <div className="stat-label">Unsolved</div>
                  <div className="stat-value">{formatNumber(stats.unsolved_cases)}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Solve Rate</div>
                  <div className="stat-value">{formatPercentage(stats.solve_rate)}</div>
                </div>
              </div>
            ) : null}
          </section>

          {/* Active Filters Section */}
          <section className="sidebar-section">
            <div className="sidebar-section-header">
              <h2 className="sidebar-section-title">
                Active Filters
                {activeFilterCount > 0 && (
                  <span className="filter-count-badge">{activeFilterCount}</span>
                )}
              </h2>
              {activeFilterCount > 0 && (
                <button className="clear-filters-button" onClick={resetFilters}>
                  Clear All
                </button>
              )}
            </div>
            {activeFilterCount === 0 ? (
              <div className="no-filters">No active filters</div>
            ) : (
              <div className="active-filters-info">
                <p>
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </aside>
  )
}
