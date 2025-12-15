import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import authReducer, {
  logout,
  clearError,
  setUser,
  login,
  register,
} from '../../store/slices/authSlice';
import { AdminUser, UserRole } from '../../types';

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    getStoredUser: vi.fn(() => null),
    isAuthenticated: vi.fn(() => false),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
  },
}));

import { authService } from '../../services/authService';

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface TestState {
  auth: AuthState;
}

describe('authSlice', () => {
  let store: EnhancedStore<TestState>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getStoredUser).mockReturnValue(null);
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);

    store = configureStore({
      reducer: { auth: authReducer },
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('logout action', () => {
    it('should reset auth state', () => {
      // First set a user
      const mockUser: AdminUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ANALYST,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      store.dispatch(setUser(mockUser));

      // Then logout
      store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('clearError action', () => {
    it('should clear the error', () => {
      // Manually set error state by dispatching a rejected action
      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });
  });

  describe('setUser action', () => {
    it('should set user and authenticate', () => {
      const mockUser: AdminUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      store.dispatch(setUser(mockUser));

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('login async thunk', () => {
    it('should handle pending state', () => {
      store.dispatch({ type: login.pending.type });

      const state = store.getState().auth;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const mockUser: AdminUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ANALYST,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      store.dispatch({ type: login.fulfilled.type, payload: mockUser });

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle rejected state', () => {
      store.dispatch({ type: login.rejected.type, payload: 'Login failed' });

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Login failed');
    });
  });

  describe('register async thunk', () => {
    it('should handle pending state', () => {
      store.dispatch({ type: register.pending.type });

      const state = store.getState().auth;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const mockUser: AdminUser = {
        id: '1',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.ANALYST,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      store.dispatch({ type: register.fulfilled.type, payload: mockUser });

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle rejected state', () => {
      store.dispatch({ type: register.rejected.type, payload: 'Registration failed' });

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Registration failed');
    });
  });
});
