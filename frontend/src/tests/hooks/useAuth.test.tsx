import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import authReducer from '../../store/slices/authSlice';

// Mock authService
vi.mock('../../services/authService', () => ({
  authService: {
    getStoredUser: vi.fn(() => null),
    isAuthenticated: vi.fn(() => false),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('useAuth', () => {
  let store: ReturnType<typeof configureStore>;

  const createWrapper = () => {
    store = configureStore({
      reducer: { auth: authReducer },
    });

    return ({ children }: { children: ReactNode }) => (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return auth state from store', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should provide login function', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.login).toBe('function');
    });

    it('should provide register function', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.register).toBe('function');
    });

    it('should provide logout function', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.logout).toBe('function');
    });

    it('should provide clearAuthError function', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.clearAuthError).toBe('function');
    });
  });

  describe('logout', () => {
    it('should call logout and navigate to login', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.logout();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('clearAuthError', () => {
    it('should clear error from state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.clearAuthError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
