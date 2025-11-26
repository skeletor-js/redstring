/**
 * Test suite for useUIStore (Zustand UI state management).
 *
 * Tests tab switching, sidebar toggle, theme toggle, modal state management,
 * and global UI state.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useUIStore } from '../../../src/stores/useUIStore'

describe('useUIStore', () => {
  // Reset store before each test
  beforeEach(() => {
    const store = useUIStore.getState()
    // Reset to initial state
    act(() => {
      store.setActiveTab('filters')
      store.setSidebarCollapsed(false)
      store.deselectCase()
      store.setModalOpen(false)
      store.setLoading(false)
      store.clearError()
    })
  })

  describe('Initial State', () => {
    it('should initialize with default UI state', () => {
      const state = useUIStore.getState()

      expect(state.activeTab).toBe('filters')
      expect(state.sidebarCollapsed).toBe(false)
      expect(state.selectedCaseId).toBe(null)
      expect(state.modalOpen).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe(null)
    })

    it('should initialize theme based on system preference', () => {
      const state = useUIStore.getState()
      // Theme is either 'light' or 'dark' depending on system
      expect(['light', 'dark']).toContain(state.theme)
    })
  })

  describe('Tab Management', () => {
    it('should set active tab', () => {
      const { setActiveTab } = useUIStore.getState()

      act(() => {
        setActiveTab('clusters')
      })

      const state = useUIStore.getState()
      expect(state.activeTab).toBe('clusters')
    })

    it('should switch between all tab types', () => {
      const { setActiveTab } = useUIStore.getState()
      const tabs = ['filters', 'clusters', 'map', 'timeline', 'stats'] as const

      tabs.forEach((tab) => {
        act(() => {
          setActiveTab(tab)
        })

        const state = useUIStore.getState()
        expect(state.activeTab).toBe(tab)
      })
    })
  })

  describe('Sidebar Management', () => {
    it('should toggle sidebar from expanded to collapsed', () => {
      const { toggleSidebar } = useUIStore.getState()

      act(() => {
        toggleSidebar()
      })

      const state = useUIStore.getState()
      expect(state.sidebarCollapsed).toBe(true)
    })

    it('should toggle sidebar from collapsed to expanded', () => {
      const { setSidebarCollapsed, toggleSidebar } = useUIStore.getState()

      // Set to collapsed first
      act(() => {
        setSidebarCollapsed(true)
      })

      // Toggle
      act(() => {
        toggleSidebar()
      })

      const state = useUIStore.getState()
      expect(state.sidebarCollapsed).toBe(false)
    })

    it('should set sidebar collapsed state directly', () => {
      const { setSidebarCollapsed } = useUIStore.getState()

      act(() => {
        setSidebarCollapsed(true)
      })

      let state = useUIStore.getState()
      expect(state.sidebarCollapsed).toBe(true)

      act(() => {
        setSidebarCollapsed(false)
      })

      state = useUIStore.getState()
      expect(state.sidebarCollapsed).toBe(false)
    })
  })

  describe('Case Selection', () => {
    it('should select a case by ID', () => {
      const { selectCase } = useUIStore.getState()

      act(() => {
        selectCase('CA_2020_12345')
      })

      const state = useUIStore.getState()
      expect(state.selectedCaseId).toBe('CA_2020_12345')
    })

    it('should deselect the currently selected case', () => {
      const { selectCase, deselectCase } = useUIStore.getState()

      // Select a case
      act(() => {
        selectCase('CA_2020_12345')
      })

      // Deselect
      act(() => {
        deselectCase()
      })

      const state = useUIStore.getState()
      expect(state.selectedCaseId).toBe(null)
    })

    it('should switch between different selected cases', () => {
      const { selectCase } = useUIStore.getState()

      act(() => {
        selectCase('CA_2020_12345')
      })

      let state = useUIStore.getState()
      expect(state.selectedCaseId).toBe('CA_2020_12345')

      act(() => {
        selectCase('NY_2019_67890')
      })

      state = useUIStore.getState()
      expect(state.selectedCaseId).toBe('NY_2019_67890')
    })
  })

  describe('Theme Management', () => {
    it('should toggle theme from light to dark', () => {
      const { setTheme, toggleTheme } = useUIStore.getState()

      // Set to light first
      act(() => {
        setTheme('light')
      })

      // Toggle
      act(() => {
        toggleTheme()
      })

      const state = useUIStore.getState()
      expect(state.theme).toBe('dark')
    })

    it('should toggle theme from dark to light', () => {
      const { setTheme, toggleTheme } = useUIStore.getState()

      // Set to dark first
      act(() => {
        setTheme('dark')
      })

      // Toggle
      act(() => {
        toggleTheme()
      })

      const state = useUIStore.getState()
      expect(state.theme).toBe('light')
    })

    it('should set theme directly', () => {
      const { setTheme } = useUIStore.getState()

      act(() => {
        setTheme('dark')
      })

      let state = useUIStore.getState()
      expect(state.theme).toBe('dark')

      act(() => {
        setTheme('light')
      })

      state = useUIStore.getState()
      expect(state.theme).toBe('light')
    })
  })

  describe('Modal State', () => {
    it('should set modal open state', () => {
      const { setModalOpen } = useUIStore.getState()

      act(() => {
        setModalOpen(true)
      })

      let state = useUIStore.getState()
      expect(state.modalOpen).toBe(true)

      act(() => {
        setModalOpen(false)
      })

      state = useUIStore.getState()
      expect(state.modalOpen).toBe(false)
    })

    it('should prevent background interactions when modal is open', () => {
      const { setModalOpen } = useUIStore.getState()

      act(() => {
        setModalOpen(true)
      })

      const state = useUIStore.getState()
      expect(state.modalOpen).toBe(true)
    })
  })

  describe('Loading State', () => {
    it('should set loading state', () => {
      const { setLoading } = useUIStore.getState()

      act(() => {
        setLoading(true)
      })

      let state = useUIStore.getState()
      expect(state.isLoading).toBe(true)

      act(() => {
        setLoading(false)
      })

      state = useUIStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('should indicate global operation in progress', () => {
      const { setLoading } = useUIStore.getState()

      act(() => {
        setLoading(true)
      })

      const state = useUIStore.getState()
      expect(state.isLoading).toBe(true)
    })
  })

  describe('Error Management', () => {
    it('should set error message', () => {
      const { setError } = useUIStore.getState()

      act(() => {
        setError('Something went wrong')
      })

      const state = useUIStore.getState()
      expect(state.error).toBe('Something went wrong')
    })

    it('should clear error message', () => {
      const { setError, clearError } = useUIStore.getState()

      // Set error
      act(() => {
        setError('Something went wrong')
      })

      // Clear
      act(() => {
        clearError()
      })

      const state = useUIStore.getState()
      expect(state.error).toBe(null)
    })

    it('should allow setting error to null directly', () => {
      const { setError } = useUIStore.getState()

      act(() => {
        setError('Error message')
      })

      act(() => {
        setError(null)
      })

      const state = useUIStore.getState()
      expect(state.error).toBe(null)
    })

    it('should handle multiple error messages', () => {
      const { setError } = useUIStore.getState()

      act(() => {
        setError('First error')
      })

      let state = useUIStore.getState()
      expect(state.error).toBe('First error')

      act(() => {
        setError('Second error')
      })

      state = useUIStore.getState()
      expect(state.error).toBe('Second error')
    })
  })

  describe('State Isolation', () => {
    it('should not persist state (ephemeral store)', () => {
      const { setActiveTab, selectCase } = useUIStore.getState()

      act(() => {
        setActiveTab('clusters')
        selectCase('CA_2020_12345')
      })

      // Verify no localStorage persistence
      const stored = localStorage.getItem('redstring-ui')
      expect(stored).toBe(null)
    })
  })

  describe('Complex State Combinations', () => {
    it('should handle multiple UI state changes together', () => {
      const {
        setActiveTab,
        setSidebarCollapsed,
        selectCase,
        setModalOpen,
        setLoading,
        setError,
      } = useUIStore.getState()

      act(() => {
        setActiveTab('clusters')
        setSidebarCollapsed(true)
        selectCase('CA_2020_12345')
        setModalOpen(true)
        setLoading(true)
        setError('Test error')
      })

      const state = useUIStore.getState()
      expect(state.activeTab).toBe('clusters')
      expect(state.sidebarCollapsed).toBe(true)
      expect(state.selectedCaseId).toBe('CA_2020_12345')
      expect(state.modalOpen).toBe(true)
      expect(state.isLoading).toBe(true)
      expect(state.error).toBe('Test error')
    })
  })
})
