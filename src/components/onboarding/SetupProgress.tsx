import { useEffect, useState } from 'react';
import './SetupProgress.css';

interface ProgressResponse {
  current: number;
  total: number;
  stage: string;
  percentage: number;
  error?: string | null;
}

interface SetupProgressProps {
  onComplete: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  idle: 'Preparing...',
  schema: 'Creating database schema...',
  metadata: 'Initializing metadata...',
  importing: 'Importing case data...',
  indexing: 'Creating indexes for fast queries...',
  complete: 'Setup complete!',
  error: 'Setup failed',
};

export function SetupProgress({ onComplete }: SetupProgressProps) {
  const [progress, setProgress] = useState<ProgressResponse>({
    current: 0,
    total: 894636,
    stage: 'idle',
    percentage: 0,
    error: null,
  });
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let isSetupRunning = false;

    const startSetup = async () => {
      try {
        isSetupRunning = true;

        // Start the setup process
        const response = await fetch('http://localhost:5000/api/setup/initialize', {
          method: 'POST',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Setup failed');
        }

        // Setup completed successfully
        await response.json();

        // Stop polling
        if (pollInterval) {
          clearInterval(pollInterval);
        }

        // Notify parent component
        setTimeout(() => {
          onComplete();
        }, 1000);
      } catch (error) {
        console.error('Setup error:', error);
        setSetupError(error instanceof Error ? error.message : 'Unknown error');

        if (pollInterval) {
          clearInterval(pollInterval);
        }
      } finally {
        isSetupRunning = false;
      }
    };

    const pollProgress = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/setup/progress');
        if (response.ok) {
          const data: ProgressResponse = await response.json();
          setProgress(data);

          if (data.error) {
            setSetupError(data.error);
            if (pollInterval) {
              clearInterval(pollInterval);
            }
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    };

    // Start polling for progress updates
    pollInterval = setInterval(pollProgress, 500);

    // Start the setup process
    startSetup();

    // Cleanup on unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [onComplete]);

  const retrySetup = () => {
    setSetupError(null);
    window.location.reload();
  };

  if (setupError) {
    return (
      <div className="setup-progress">
        <div className="setup-error">
          <h2>Setup Failed</h2>
          <p className="error-message">{setupError}</p>
          <button onClick={retrySetup} className="retry-button">
            Retry Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-progress">
      <div className="setup-content">
        <h1>Setting Up Redstring</h1>
        <p className="setup-subtitle">
          Importing 894,636 homicide records from the Murder Accountability Project
        </p>

        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="progress-text">{progress.percentage.toFixed(1)}%</div>
        </div>

        <div className="progress-details">
          <p className="stage-label">{STAGE_LABELS[progress.stage] || progress.stage}</p>
          {progress.stage === 'importing' && (
            <p className="record-count">
              Processing record {progress.current.toLocaleString()} of{' '}
              {progress.total.toLocaleString()}
            </p>
          )}
        </div>

        <div className="setup-tips">
          <p className="tip-title">Did you know?</p>
          <p className="tip-text">
            The Murder Accountability Project has collected data on over 894,000 homicides
            spanning from 1976 to 2023 - the most comprehensive database of its kind.
          </p>
        </div>
      </div>
    </div>
  );
}
