/**
 * Zustand store for case filter state management.
 *
 * Manages all filter selections with persistence to localStorage.
 * The expanded sections state is NOT persisted (resets on app restart).
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  FilterState,
  FilterUIState,
  FilterSection,
  DEFAULT_FILTER_STATE,
  DEFAULT_FILTER_UI_STATE,
} from '../types/filter'

/**
 * Combined filter store state (data + UI).
 */
interface FilterStore extends FilterState, FilterUIState {
  /**
   * Update a single filter field.
   *
   * @param key - Filter field name
   * @param value - New value for the field
   */
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void

  /**
   * Update multiple filter fields at once.
   *
   * @param updates - Partial filter state to merge
   */
  setFilters: (updates: Partial<FilterState>) => void

  /**
   * Reset all filters to default state.
   */
  resetFilters: () => void

  /**
   * Get the number of active (non-default) filters.
   *
   * @returns Count of active filters
   */
  getActiveFilterCount: () => number

  /**
   * Toggle a filter section's expanded state.
   *
   * @param section - Section to toggle
   */
  toggleSection: (section: FilterSection) => void

  /**
   * Set a section's expanded state directly.
   *
   * @param section - Section to update
   * @param expanded - New expanded state
   */
  setSection: (section: FilterSection, expanded: boolean) => void

  /**
   * Expand all filter sections.
   */
  expandAllSections: () => void

  /**
   * Collapse all filter sections.
   */
  collapseAllSections: () => void
}

/**
 * Zustand store for filter state management.
 *
 * Filter selections are persisted to localStorage.
 * UI state (expanded sections) is NOT persisted.
 */
export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      // === Filter State (Persisted) ===
      ...DEFAULT_FILTER_STATE,

      // === UI State (NOT Persisted) ===
      ...DEFAULT_FILTER_UI_STATE,

      // === Actions ===

      setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        set({ [key]: value })
      },

      setFilters: (updates: Partial<FilterState>) => {
        set(updates)
      },

      resetFilters: () => {
        set(DEFAULT_FILTER_STATE)
      },

      getActiveFilterCount: () => {
        const state = get()
        let count = 0

        // Count non-default filters
        if (state.states.length > 0) count++
        if (
          state.yearRange[0] !== DEFAULT_FILTER_STATE.yearRange[0] ||
          state.yearRange[1] !== DEFAULT_FILTER_STATE.yearRange[1]
        ) {
          count++
        }
        if (state.solved !== DEFAULT_FILTER_STATE.solved) count++
        if (state.vicSex.length > 0) count++
        if (
          state.vicAgeRange[0] !== DEFAULT_FILTER_STATE.vicAgeRange[0] ||
          state.vicAgeRange[1] !== DEFAULT_FILTER_STATE.vicAgeRange[1]
        ) {
          count++
        }
        if (!state.includeUnknownAge) count++
        if (state.vicRace.length > 0) count++
        if (state.vicEthnic.length > 0) count++
        if (state.weapon.length > 0) count++
        if (state.relationship.length > 0) count++
        if (state.circumstance.length > 0) count++
        if (state.counties.length > 0) count++
        if (state.msa.length > 0) count++
        if (state.agencySearch.length > 0) count++
        if (state.caseId.length > 0) count++

        return count
      },

      toggleSection: (section: FilterSection) => {
        set((state) => ({
          expandedSections: {
            ...state.expandedSections,
            [section]: !state.expandedSections[section],
          },
        }))
      },

      setSection: (section: FilterSection, expanded: boolean) => {
        set((state) => ({
          expandedSections: {
            ...state.expandedSections,
            [section]: expanded,
          },
        }))
      },

      expandAllSections: () => {
        set({
          expandedSections: {
            primary: true,
            victim: true,
            crime: true,
            geography: true,
            search: true,
          },
        })
      },

      collapseAllSections: () => {
        set({
          expandedSections: {
            primary: false,
            victim: false,
            crime: false,
            geography: false,
            search: false,
          },
        })
      },
    }),
    {
      name: 'redstring-filters', // localStorage key
      partialize: (state) => ({
        // Only persist filter state, NOT UI state
        states: state.states,
        yearRange: state.yearRange,
        solved: state.solved,
        vicSex: state.vicSex,
        vicAgeRange: state.vicAgeRange,
        includeUnknownAge: state.includeUnknownAge,
        vicRace: state.vicRace,
        vicEthnic: state.vicEthnic,
        weapon: state.weapon,
        relationship: state.relationship,
        circumstance: state.circumstance,
        situation: state.situation,
        counties: state.counties,
        msa: state.msa,
        agencySearch: state.agencySearch,
        caseId: state.caseId,
      }),
    }
  )
)
