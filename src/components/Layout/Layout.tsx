import { useUIStore } from '../../stores/useUIStore'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { FilterView, CaseDetail } from '../cases'
import { ClusterView } from '../clusters'
import { MapView } from '../map'
import { TimelineView } from '../timeline'
import { StatisticsView } from '../statistics'
import '../../styles/layout.css'

export function Layout() {
  const { activeTab, sidebarCollapsed } = useUIStore()

  const renderContent = () => {
    switch (activeTab) {
      case 'filters':
        return <FilterView />
      case 'clusters':
        return <ClusterView />
      case 'map':
        return <MapView />
      case 'timeline':
        return <TimelineView />
      case 'stats':
        return <StatisticsView />
      default:
        return (
          <div className="tab-content">
            <div className="placeholder-view">
              <h2>Unknown View</h2>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="layout">
      <Header />
      <div className="layout-body">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="layout-main">{renderContent()}</main>
      </div>
      <CaseDetail />
    </div>
  )
}
