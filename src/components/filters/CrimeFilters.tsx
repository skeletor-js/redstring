import React from 'react';
import { useFilterStore } from '../../stores/useFilterStore';
import { WEAPON_TYPES, RELATIONSHIP_OPTIONS, CIRCUMSTANCE_OPTIONS, SITUATION_OPTIONS } from '../../types/filter';
import './Filters.css';

export const CrimeFilters: React.FC = () => {
  const { weapon, relationship, circumstance, situation, setFilter } = useFilterStore();

  const toggleWeapon = (w: string) => {
    if (weapon.includes(w)) {
      setFilter('weapon', weapon.filter((item: string) => item !== w));
    } else {
      setFilter('weapon', [...weapon, w]);
    }
  };

  const toggleRelationship = (r: string) => {
    if (relationship.includes(r)) {
      setFilter('relationship', relationship.filter((item: string) => item !== r));
    } else {
      setFilter('relationship', [...relationship, r]);
    }
  };

  const toggleCircumstance = (c: string) => {
    if (circumstance.includes(c)) {
      setFilter('circumstance', circumstance.filter((item: string) => item !== c));
    } else {
      setFilter('circumstance', [...circumstance, c]);
    }
  };

  const toggleSituation = (s: string) => {
    if (situation.includes(s)) {
      setFilter('situation', situation.filter((item: string) => item !== s));
    } else {
      setFilter('situation', [...situation, s]);
    }
  };

  return (
    <div className="filter-group">
      {/* Weapon Type */}
      <div className="filter-field">
        <div className="filter-label-row">
          <label className="filter-label">Weapon Type</label>
          {weapon.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter('weapon', [])}
              className="filter-link-button"
            >
              Clear
            </button>
          )}
        </div>
        {weapon.length > 0 && (
          <div className="filter-chips">
            {weapon.map((w) => (
              <span key={w} className="filter-chip">
                {w}
                <button
                  type="button"
                  onClick={() => toggleWeapon(w)}
                  className="filter-chip-remove"
                  aria-label={`Remove ${w}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="filter-checkbox-grid">
          {WEAPON_TYPES.map((w) => (
            <label key={w} className="filter-checkbox">
              <input
                type="checkbox"
                checked={weapon.includes(w)}
                onChange={() => toggleWeapon(w)}
              />
              <span>{w}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Relationship */}
      <div className="filter-field">
        <div className="filter-label-row">
          <label className="filter-label">Relationship</label>
          {relationship.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter('relationship', [])}
              className="filter-link-button"
            >
              Clear
            </button>
          )}
        </div>
        {relationship.length > 0 && (
          <div className="filter-chips">
            {relationship.map((r) => (
              <span key={r} className="filter-chip">
                {r}
                <button
                  type="button"
                  onClick={() => toggleRelationship(r)}
                  className="filter-chip-remove"
                  aria-label={`Remove ${r}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="filter-checkbox-grid">
          {RELATIONSHIP_OPTIONS.map((r) => (
            <label key={r} className="filter-checkbox">
              <input
                type="checkbox"
                checked={relationship.includes(r)}
                onChange={() => toggleRelationship(r)}
              />
              <span>{r}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Circumstance */}
      <div className="filter-field">
        <div className="filter-label-row">
          <label className="filter-label">Circumstance</label>
          {circumstance.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter('circumstance', [])}
              className="filter-link-button"
            >
              Clear
            </button>
          )}
        </div>
        {circumstance.length > 0 && (
          <div className="filter-chips">
            {circumstance.map((c) => (
              <span key={c} className="filter-chip">
                {c}
                <button
                  type="button"
                  onClick={() => toggleCircumstance(c)}
                  className="filter-chip-remove"
                  aria-label={`Remove ${c}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="filter-checkbox-grid">
          {CIRCUMSTANCE_OPTIONS.map((c) => (
            <label key={c} className="filter-checkbox">
              <input
                type="checkbox"
                checked={circumstance.includes(c)}
                onChange={() => toggleCircumstance(c)}
              />
              <span>{c}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Situation */}
      <div className="filter-field">
        <label className="filter-label">Situation</label>
        <div className="filter-checkbox-grid">
          {SITUATION_OPTIONS.map((s) => (
            <label key={s} className="filter-checkbox">
              <input
                type="checkbox"
                checked={situation.includes(s)}
                onChange={() => toggleSituation(s)}
              />
              <span>{s}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
