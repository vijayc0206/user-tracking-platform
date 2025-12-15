import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { AdminUser } from '../../types';

describe('ProtectedRoute', () => {
  const createStore = (isAuthenticated: boolean, user: AdminUser | null = null) => {
    return configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user,
          isAuthenticated,
          isLoading: false,
          error: null,
        },
      },
    });
  };

  const renderWithProviders = (
    store: ReturnType<typeof createStore>,
    initialRoute: string = '/protected',
    requiredRole?: string
  ) => {
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute requiredRole={requiredRole}>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
  };

  describe('authentication check', () => {
    it('should render children when user is authenticated', () => {
      const store = createStore(true, {
        id: '1',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ANALYST',
        isActive: true,
      });

      renderWithProviders(store);

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated', () => {
      const store = createStore(false);

      renderWithProviders(store);

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('role-based access', () => {
    it('should render children when user has required role', () => {
      const store = createStore(true, {
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
      });

      renderWithProviders(store, '/protected', 'ADMIN');

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect to dashboard when user does not have required role', () => {
      const store = createStore(true, {
        id: '1',
        email: 'analyst@test.com',
        firstName: 'Analyst',
        lastName: 'User',
        role: 'ANALYST',
        isActive: true,
      });

      renderWithProviders(store, '/protected', 'ADMIN');

      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should allow access when no role is required', () => {
      const store = createStore(true, {
        id: '1',
        email: 'viewer@test.com',
        firstName: 'Viewer',
        lastName: 'User',
        role: 'VIEWER',
        isActive: true,
      });

      renderWithProviders(store);

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
