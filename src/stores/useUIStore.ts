/**
 * Zustand store for global UI state management.
 *
 * Manages application-wide UI state like active tab, sidebar, theme,
 * and selected case. This state is NOT persisted across sessions.
 */

import { create } from 'zustand'

/**
 * Available application tabs.
 */
export type AppTab = 'filters' | 'clusters' | 'map' | 'timeline' | 'stats'

/**
 * Theme options.
 */
export type Theme = 'light' | 'dark'

/**
 * UI store state and actions.
 */
interface UIStore {
  // === State ===

  /** Currently active tab */
  activeTab: AppTab

  /** Whether the sidebar is collapsed */
  sidebarCollapsed: boolean

  /** ID of the currently selected case (null = none selected) */
  selectedCaseId: string | null

  /** Current theme */
  theme: Theme

  /** Whether a modal is currently open (prevents background interactions) */
  modalOpen: boolean

  /** Loading state for global operations */
  isLoading: boolean

  /** Global error message (null = no error) */
  error: string | null

  // === Actions ===

  /**
   * Set the active tab.
   *
   * @param tab - Tab to activate
   */
  setActiveTab: (tab: AppTab) => void

  /**
   * Toggle the sidebar collapsed state.
   */
  toggleSidebar: () => void

  /**
   * Set the sidebar collapsed state directly.
   *
   * @param collapsed - New collapsed state
   */
  setSidebarCollapsed: (collapsed: boolean) => void

  /**
   * Select a case by ID.
   *
   * @param caseId - Case ID to select
   */
  selectCase: (caseId: string) => void

  /**
   * Deselect the currently selected case.
   */
  deselectCase: () => void

  /**
   * Toggle between light and dark theme.
   */
  toggleTheme: () => void

  /**
   * Set the theme directly.
   *
   * @param theme - Theme to set
   */
  setTheme: (theme: Theme) => void

  /**
   * Set the modal open state.
   *
   * @param open - New modal state
   */
  setModalOpen: (open: boolean) => void

  /**
   * Set the global loading state.
   *
   * @param loading - New loading state
   */
  setLoading: (loading: boolean) => void

  /**
   * Set a global error message.
   *
   * @param error - Error message (null to clear)
   */
  setError: (error: string | null) => void

  /**
   * Clear the global error.
   */
  clearError: () => void
}

/**
 * Detect system theme preference.
 */
const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Zustand store for UI state management.
 *
 * This state is NOT persisted. It resets on app restart.
 */
export const useUIStore = create<UIStore>((set) => ({
  // === Initial State ===
  activeTab: 'filters',
  sidebarCollapsed: false,
  selectedCaseId: null,
  theme: getSystemTheme(),
  modalOpen: false,
  isLoading: false,
  error: null,

  // === Actions ===

  setActiveTab: (tab: AppTab) => {
    set({ activeTab: tab })
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed })
  },

  selectCase: (caseId: string) => {
    set({ selectedCaseId: caseId })
  },

  deselectCase: () => {
    set({ selectedCaseId: null })
  },

  toggleTheme: () => {
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    }))
  },

  setTheme: (theme: Theme) => {
    set({ theme })
  },

  setModalOpen: (open: boolean) => {
    set({ modalOpen: open })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  setError: (error: string | null) => {
    set({ error })
  },

  clearError: () => {
    set({ error: null })
  },
}))

/**
 * Hook to sync theme changes to the DOM.
 *
 * Call this in the root component to apply theme data attribute to <html> element.
 */
export const useSyncTheme = () => {
  const theme = useUIStore((state) => state.theme)

  // Apply theme data attribute to document element
  if (typeof window !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }

  return theme
}
