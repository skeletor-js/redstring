import React from 'react';
import { useFilterStore } from '../../stores/useFilterStore';
import { VIC_SEX_OPTIONS, VIC_RACE_OPTIONS, VIC_ETHNIC_OPTIONS } from '../../types/filter';
import './Filters.css';

export const VictimFilters: React.FC = () => {
  const {
    vicSex,
    vicAgeRange,
    includeUnknownAge,
    vicRace,
    vicEthnic,
    setFilter,
  } = useFilterStore();

  const toggleVicSex = (sex: string) => {
    if (vicSex.includes(sex)) {
      setFilter('vicSex', vicSex.filter((s) => s !== sex));
    } else {
      setFilter('vicSex', [...vicSex, sex]);
    }
  };

  const toggleVicRace = (race: string) => {
    if (vicRace.includes(race)) {
      setFilter('vicRace', vicRace.filter((r) => r !== race));
    } else {
      setFilter('vicRace', [...vicRace, race]);
    }
  };

  const toggleVicEthnic = (ethnic: string) => {
    if (vicEthnic.includes(ethnic)) {
      setFilter('vicEthnic', vicEthnic.filter((e) => e !== ethnic));
    } else {
      setFilter('vicEthnic', [...vicEthnic, ethnic]);
    }
  };

  return (
    <div className="filter-group">
      {/* Victim Age Range */}
      <div className="filter-field">
        <label className="filter-label">Victim Age Range</label>
        <div className="filter-range">
          <div className="filter-range-input">
            <label htmlFor="vic-age-min" className="filter-range-label">
              Min
            </label>
            <input
              id="vic-age-min"
              type="number"
              min={0}
              max={99}
              value={vicAgeRange[0]}
              onChange={(e) =>
                setFilter('vicAgeRange', [parseInt(e.target.value, 10), vicAgeRange[1]])
              }
              className="filter-input"
            />
          </div>
          <span className="filter-range-separator">—</span>
          <div className="filter-range-input">
            <label htmlFor="vic-age-max" className="filter-range-label">
              Max
            </label>
            <input
              id="vic-age-max"
              type="number"
              min={0}
              max={99}
              value={vicAgeRange[1]}
              onChange={(e) =>
                setFilter('vicAgeRange', [vicAgeRange[0], parseInt(e.target.value, 10)])
              }
              className="filter-input"
            />
          </div>
        </div>
        <div className="filter-toggle">
          <button
            type="button"
            role="switch"
            aria-checked={includeUnknownAge}
            className="filter-toggle-switch"
            data-checked={includeUnknownAge}
            onClick={() => setFilter('includeUnknownAge', !includeUnknownAge)}
          >
            <span className="filter-toggle-thumb" />
          </button>
          <label className="filter-toggle-label">Include Unknown Age (999)</label>
        </div>
      </div>

      {/* Victim Sex */}
      <div className="filter-field">
        <label className="filter-label">Victim Sex</label>
        <div className="filter-checkbox-grid">
          {VIC_SEX_OPTIONS.map((sex) => (
            <label key={sex} className="filter-checkbox">
              <input
                type="checkbox"
                checked={vicSex.includes(sex)}
                onChange={() => toggleVicSex(sex)}
              />
              <span>{sex}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Victim Race */}
      <div className="filter-field">
        <label className="filter-label">Victim Race</label>
        <div className="filter-checkbox-grid">
          {VIC_RACE_OPTIONS.map((race) => (
            <label key={race} className="filter-checkbox">
              <input
                type="checkbox"
                checked={vicRace.includes(race)}
                onChange={() => toggleVicRace(race)}
              />
              <span>{race}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Victim Ethnicity */}
      <div className="filter-field">
        <label className="filter-label">Victim Ethnicity</label>
        <div className="filter-checkbox-grid">
          {VIC_ETHNIC_OPTIONS.map((ethnic) => (
            <label key={ethnic} className="filter-checkbox">
              <input
                type="checkbox"
                checked={vicEthnic.includes(ethnic)}
                onChange={() => toggleVicEthnic(ethnic)}
              />
              <span>{ethnic}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
