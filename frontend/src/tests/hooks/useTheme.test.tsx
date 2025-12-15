import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ReactNode } from 'react';
import { useTheme } from '../../hooks/useTheme';
import uiReducer, { setDarkMode } from '../../store/slices/uiSlice';

describe('useTheme', () => {
  let store: ReturnType<typeof configureStore>;

  const createWrapper = (initialDarkMode = false) => {
    // Set localStorage before store creation
    localStorage.setItem('darkMode', initialDarkMode.toString());

    store = configureStore({
      reducer: { ui: uiReducer },
      preloadedState: {
        ui: {
          sidebarOpen: true,
          darkMode: initialDarkMode,
          dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
        },
      },
    });

    return ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
  };

  beforeEach(() => {
    localStorage.clear();
  });

  describe('theme object', () => {
    it('should return theme object', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(),
      });

      expect(result.current.theme).toBeDefined();
      expect(result.current.theme.palette).toBeDefined();
    });

    it('should return isDarkMode boolean', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.isDarkMode).toBe('boolean');
    });
  });

  describe('light mode', () => {
    it('should return light mode theme when darkMode is false', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(false),
      });

      expect(result.current.isDarkMode).toBe(false);
      expect(result.current.theme.palette.mode).toBe('light');
    });

    it('should have light background colors', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(false),
      });

      expect(result.current.theme.palette.background.default).toBe('#f5f5f5');
      expect(result.current.theme.palette.background.paper).toBe('#ffffff');
    });
  });

  describe('dark mode', () => {
    it('should return dark mode theme when darkMode is true', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(true),
      });

      expect(result.current.isDarkMode).toBe(true);
      expect(result.current.theme.palette.mode).toBe('dark');
    });

    it('should have dark background colors', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(true),
      });

      expect(result.current.theme.palette.background.default).toBe('#121212');
      expect(result.current.theme.palette.background.paper).toBe('#1e1e1e');
    });
  });

  describe('theme palette', () => {
    it('should have primary colors', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(),
      });

      expect(result.current.theme.palette.primary.main).toBe('#1976d2');
      expect(result.current.theme.palette.primary.light).toBe('#42a5f5');
      expect(result.current.theme.palette.primary.dark).toBe('#1565c0');
    });

    it('should have secondary colors', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(),
      });

      expect(result.current.theme.palette.secondary.main).toBe('#9c27b0');
    });

    it('should have success colors', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(),
      });

      expect(result.current.theme.palette.success.main).toBe('#2e7d32');
    });

    it('should have warning colors', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(),
      });

      expect(result.current.theme.palette.warning.main).toBe('#ed6c02');
    });

    it('should have error colors', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(),
      });

      expect(result.current.theme.palette.error.main).toBe('#d32f2f');
    });
  });

  describe('theme typography', () => {
    it('should have correct font family', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(),
      });

      expect(result.current.theme.typography.fontFamily).toContain('Inter');
    });
  });

  describe('theme shape', () => {
    it('should have border radius of 8', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(),
      });

      expect(result.current.theme.shape.borderRadius).toBe(8);
    });
  });

  describe('theme updates', () => {
    it('should update theme when store darkMode changes', () => {
      const { result, rerender } = renderHook(() => useTheme(), {
        wrapper: createWrapper(false),
      });

      expect(result.current.isDarkMode).toBe(false);

      // Dispatch action to change dark mode
      store.dispatch(setDarkMode(true));
      rerender();

      expect(result.current.isDarkMode).toBe(true);
      expect(result.current.theme.palette.mode).toBe('dark');
    });
  });
});
