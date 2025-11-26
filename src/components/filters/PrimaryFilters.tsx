import React from 'react';
import { useFilterStore } from '../../stores/useFilterStore';
import { STATES } from '../../types/filter';
import './Filters.css';

export const PrimaryFilters: React.FC = () => {
  const { states, yearRange, solved, setFilter } = useFilterStore();

  const handleStatesChange = (selectedStates: string[]) => {
    setFilter('states', selectedStates);
  };

  const handleYearMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const min = parseInt(e.target.value, 10);
    setFilter('yearRange', [min, yearRange[1]]);
  };

  const handleYearMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = parseInt(e.target.value, 10);
    setFilter('yearRange', [yearRange[0], max]);
  };

  const toggleState = (state: string) => {
    if (states.includes(state)) {
      handleStatesChange(states.filter((s) => s !== state));
    } else {
      handleStatesChange([...states, state]);
    }
  };

  const selectAllStates = () => {
    handleStatesChange([...STATES]);
  };

  const clearAllStates = () => {
    handleStatesChange([]);
  };

  return (
    <div className="filter-group">
      {/* Solved Status */}
      <div className="filter-field">
        <label className="filter-label">Case Status</label>
        <div className="filter-radio-group">
          <label className="filter-radio">
            <input
              type="radio"
              name="solved"
              checked={solved === 'all'}
              onChange={() => setFilter('solved', 'all')}
            />
            <span>All Cases</span>
          </label>
          <label className="filter-radio">
            <input
              type="radio"
              name="solved"
              checked={solved === 'solved'}
              onChange={() => setFilter('solved', 'solved')}
            />
            <span>Solved</span>
          </label>
          <label className="filter-radio">
            <input
              type="radio"
              name="solved"
              checked={solved === 'unsolved'}
              onChange={() => setFilter('solved', 'unsolved')}
            />
            <span>Unsolved</span>
          </label>
        </div>
      </div>

      {/* Year Range */}
      <div className="filter-field">
        <label className="filter-label">Year Range</label>
        <div className="filter-range">
          <div className="filter-range-input">
            <label htmlFor="year-min" className="filter-range-label">
              From
            </label>
            <input
              id="year-min"
              type="number"
              min={1976}
              max={2023}
              value={yearRange[0]}
              onChange={handleYearMinChange}
              className="filter-input"
            />
          </div>
          <span className="filter-range-separator">—</span>
          <div className="filter-range-input">
            <label htmlFor="year-max" className="filter-range-label">
              To
            </label>
            <input
              id="year-max"
              type="number"
              min={1976}
              max={2023}
              value={yearRange[1]}
              onChange={handleYearMaxChange}
              className="filter-input"
            />
          </div>
        </div>
      </div>

      {/* States Multi-Select */}
      <div className="filter-field">
        <div className="filter-label-row">
          <label className="filter-label">States</label>
          <div className="filter-label-actions">
            <button
              type="button"
              onClick={selectAllStates}
              className="filter-link-button"
            >
              Select All
            </button>
            {states.length > 0 && (
              <>
                <span className="filter-label-separator">|</span>
                <button
                  type="button"
                  onClick={clearAllStates}
                  className="filter-link-button"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
        {states.length > 0 && (
          <div className="filter-chips">
            {states.map((state) => (
              <span key={state} className="filter-chip">
                {state}
                <button
                  type="button"
                  onClick={() => toggleState(state)}
                  className="filter-chip-remove"
                  aria-label={`Remove ${state}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="filter-checkbox-grid">
          {STATES.map((state) => (
            <label key={state} className="filter-checkbox">
              <input
                type="checkbox"
                checked={states.includes(state)}
                onChange={() => toggleState(state)}
              />
              <span>{state}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
