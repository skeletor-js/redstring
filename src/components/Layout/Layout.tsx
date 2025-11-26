import { useUIStore } from '../../stores/useUIStore';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { FilterView, CaseDetail } from '../cases';
import '../../styles/layout.css';

export function Layout() {
  const { activeTab, sidebarCollapsed } = useUIStore();

  const renderContent = () => {
    switch (activeTab) {
      case 'filters':
        return <FilterView />;
      case 'clusters':
        return (
          <div className="tab-content">
            <div className="placeholder-view">
              <h2>Clusters View</h2>
              <p>Coming in Phase 5 - Clustering Analysis</p>
            </div>
          </div>
        );
      case 'map':
        return (
          <div className="tab-content">
            <div className="placeholder-view">
              <h2>Map View</h2>
              <p>Coming in Phase 6 - Map Visualization</p>
            </div>
          </div>
        );
      case 'timeline':
        return (
          <div className="tab-content">
            <div className="placeholder-view">
              <h2>Timeline View</h2>
              <p>Coming in Phase 7 - Timeline Visualization</p>
            </div>
          </div>
        );
      case 'stats':
        return (
          <div className="tab-content">
            <div className="placeholder-view">
              <h2>Statistics View</h2>
              <p>Coming in Phase 8 - Statistical Analysis</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="tab-content">
            <div className="placeholder-view">
              <h2>Unknown View</h2>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="layout">
      <Header />
      <div className="layout-body">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="layout-main">{renderContent()}</main>
      </div>
      <CaseDetail />
    </div>
  );
}
