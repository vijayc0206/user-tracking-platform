import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import uiReducer, {
  toggleSidebar,
  setSidebarOpen,
  toggleDarkMode,
  setDarkMode,
  setDateRange,
} from '../../store/slices/uiSlice';

interface UiState {
  sidebarOpen: boolean;
  darkMode: boolean;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface TestState {
  ui: UiState;
}

describe('uiSlice', () => {
  let store: EnhancedStore<TestState>;

  beforeEach(() => {
    store = configureStore({
      reducer: { ui: uiReducer },
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().ui;
      expect(state.sidebarOpen).toBe(true);
      expect(typeof state.darkMode).toBe('boolean');
      expect(state.dateRange).toHaveProperty('startDate');
      expect(state.dateRange).toHaveProperty('endDate');
    });

    it('should have date range spanning 30 days', () => {
      const state = store.getState().ui;
      const startDate = new Date(state.dateRange.startDate);
      const endDate = new Date(state.dateRange.endDate);
      const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);
    });
  });

  describe('toggleSidebar action', () => {
    it('should toggle sidebar from open to closed', () => {
      expect(store.getState().ui.sidebarOpen).toBe(true);

      store.dispatch(toggleSidebar());

      expect(store.getState().ui.sidebarOpen).toBe(false);
    });

    it('should toggle sidebar from closed to open', () => {
      store.dispatch(toggleSidebar()); // close
      expect(store.getState().ui.sidebarOpen).toBe(false);

      store.dispatch(toggleSidebar()); // open
      expect(store.getState().ui.sidebarOpen).toBe(true);
    });
  });

  describe('setSidebarOpen action', () => {
    it('should set sidebar to open', () => {
      store.dispatch(toggleSidebar()); // close first

      store.dispatch(setSidebarOpen(true));

      expect(store.getState().ui.sidebarOpen).toBe(true);
    });

    it('should set sidebar to closed', () => {
      store.dispatch(setSidebarOpen(false));

      expect(store.getState().ui.sidebarOpen).toBe(false);
    });
  });

  describe('toggleDarkMode action', () => {
    it('should toggle dark mode and persist to localStorage', () => {
      const initialDarkMode = store.getState().ui.darkMode;

      store.dispatch(toggleDarkMode());

      const newDarkMode = store.getState().ui.darkMode;
      expect(newDarkMode).toBe(!initialDarkMode);
      expect(localStorage.getItem('darkMode')).toBe(newDarkMode.toString());
    });

    it('should toggle dark mode twice and return to original', () => {
      const initialDarkMode = store.getState().ui.darkMode;

      store.dispatch(toggleDarkMode());
      store.dispatch(toggleDarkMode());

      expect(store.getState().ui.darkMode).toBe(initialDarkMode);
    });
  });

  describe('setDarkMode action', () => {
    it('should set dark mode to true and persist to localStorage', () => {
      store.dispatch(setDarkMode(true));

      expect(store.getState().ui.darkMode).toBe(true);
      expect(localStorage.getItem('darkMode')).toBe('true');
    });

    it('should set dark mode to false and persist to localStorage', () => {
      store.dispatch(setDarkMode(false));

      expect(store.getState().ui.darkMode).toBe(false);
      expect(localStorage.getItem('darkMode')).toBe('false');
    });
  });

  describe('setDateRange action', () => {
    it('should set custom date range', () => {
      const customRange = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      store.dispatch(setDateRange(customRange));

      expect(store.getState().ui.dateRange).toEqual(customRange);
    });

    it('should update date range with new values', () => {
      const firstRange = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const secondRange = {
        startDate: '2024-06-01',
        endDate: '2024-06-30',
      };

      store.dispatch(setDateRange(firstRange));
      store.dispatch(setDateRange(secondRange));

      expect(store.getState().ui.dateRange).toEqual(secondRange);
    });
  });
});
