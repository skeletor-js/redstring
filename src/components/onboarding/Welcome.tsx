import './Welcome.css';

interface WelcomeProps {
  onBeginSetup: () => void;
}

export function Welcome({ onBeginSetup }: WelcomeProps) {
  return (
    <div className="welcome">
      <div className="welcome-content">
        <h1 className="welcome-title">Welcome to Redstring</h1>
        <p className="welcome-subtitle">
          Murder Accountability Project Case Analyzer
        </p>

        <div className="welcome-description">
          <p>
            Redstring helps researchers, journalists, and analysts explore over 894,000
            homicide records from 1976 to 2023 to identify suspicious clusters of unsolved
            murders.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">🔍</div>
              <div className="feature-text">
                <h3>Advanced Filtering</h3>
                <p>Search by location, time, victim demographics, and weapon type</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🎯</div>
              <div className="feature-text">
                <h3>Cluster Detection</h3>
                <p>Identify patterns in unsolved cases using custom algorithms</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-text">
                <h3>Data Export</h3>
                <p>Export findings to CSV for further analysis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="setup-notice">
          <p>
            <strong>First-time setup required:</strong> Redstring will import 894,636 case
            records into a local database. This process takes approximately 30-60 seconds.
          </p>
        </div>

        <button onClick={onBeginSetup} className="begin-setup-button">
          Begin Setup
        </button>

        <p className="privacy-note">
          All data is stored locally on your machine. No information is sent to external
          servers.
        </p>
      </div>
    </div>
  );
}
