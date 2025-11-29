import { useUIStore, type AppTab } from '../../stores/useUIStore'
import { ThemeToggle } from '../ThemeToggle'

interface TabConfig {
  id: AppTab
  label: string
  icon: string
}

const tabs: TabConfig[] = [
  { id: 'filters', label: 'Cases', icon: '📊' },
  { id: 'map', label: 'Map', icon: '🗺️' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'stats', label: 'Statistics', icon: '📈' },
  { id: 'clusters', label: 'Clusters', icon: '🔗' },
]

export function Header() {
  const { activeTab, setActiveTab } = useUIStore()

  return (
    <header className="header">
      <div className="header-brand">
        <h1 className="header-title">Redstring</h1>
        <p className="header-subtitle">Murder Accountability Project Analyzer</p>
      </div>

      <nav className="header-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="nav-tab-icon">{tab.icon}</span>
            <span className="nav-tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="header-actions">
        <ThemeToggle />
      </div>
    </header>
  )
}
