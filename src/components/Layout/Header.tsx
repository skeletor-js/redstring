import { useUIStore, type AppTab } from '../../stores/useUIStore';

interface TabConfig {
  id: AppTab;
  label: string;
  icon: string;
}

const tabs: TabConfig[] = [
  { id: 'filters', label: 'Filters', icon: '🔍' },
  { id: 'clusters', label: 'Clusters', icon: '🎯' },
  { id: 'map', label: 'Map', icon: '🗺️' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'stats', label: 'Statistics', icon: '📊' },
];

export function Header() {
  const { activeTab, theme, setActiveTab, toggleTheme } = useUIStore();

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
        <button
          className="action-button theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          className="action-button settings-button"
          aria-label="Settings"
          title="Settings (Coming soon)"
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}
