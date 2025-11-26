import React from 'react';
import { useFilterStore } from '../../stores/useFilterStore';
import './Filters.css';

export const GeographyFilters: React.FC = () => {
  const { counties, msa, setFilter } = useFilterStore();

  const [countyInput, setCountyInput] = React.useState('');
  const [msaInput, setMsaInput] = React.useState('');

  const addCounty = () => {
    if (countyInput.trim() && !counties.includes(countyInput.trim())) {
      setFilter('counties', [...counties, countyInput.trim()]);
      setCountyInput('');
    }
  };

  const removeCounty = (c: string) => {
    setFilter('counties', counties.filter((item: string) => item !== c));
  };

  const addMSA = () => {
    if (msaInput.trim() && !msa.includes(msaInput.trim())) {
      setFilter('msa', [...msa, msaInput.trim()]);
      setMsaInput('');
    }
  };

  const removeMSA = (m: string) => {
    setFilter('msa', msa.filter((item: string) => item !== m));
  };

  return (
    <div className="filter-group">
      {/* County */}
      <div className="filter-field">
        <label htmlFor="county-input" className="filter-label">
          County
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            id="county-input"
            type="text"
            value={countyInput}
            onChange={(e) => setCountyInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCounty()}
            placeholder="Enter county name..."
            className="filter-input"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={addCounty}
            className="filter-link-button"
            style={{
              padding: '8px 16px',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
            }}
          >
            Add
          </button>
        </div>
        {counties.length > 0 && (
          <div className="filter-chips">
            {counties.map((c) => (
              <span key={c} className="filter-chip">
                {c}
                <button
                  type="button"
                  onClick={() => removeCounty(c)}
                  className="filter-chip-remove"
                  aria-label={`Remove ${c}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* MSA/Metropolitan Area */}
      <div className="filter-field">
        <label htmlFor="msa-input" className="filter-label">
          Metropolitan Area (MSA)
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            id="msa-input"
            type="text"
            value={msaInput}
            onChange={(e) => setMsaInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addMSA()}
            placeholder="Enter MSA name..."
            className="filter-input"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={addMSA}
            className="filter-link-button"
            style={{
              padding: '8px 16px',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
            }}
          >
            Add
          </button>
        </div>
        {msa.length > 0 && (
          <div className="filter-chips">
            {msa.map((m) => (
              <span key={m} className="filter-chip">
                {m}
                <button
                  type="button"
                  onClick={() => removeMSA(m)}
                  className="filter-chip-remove"
                  aria-label={`Remove ${m}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
