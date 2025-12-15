import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { Header } from '../../components/common/Header';
import authReducer from '../../store/slices/authSlice';
import uiReducer from '../../store/slices/uiSlice';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Header', () => {
  const createStore = (authState = {}, uiState = {}) => {
    return configureStore({
      reducer: {
        auth: authReducer,
        ui: uiReducer,
      },
      preloadedState: {
        auth: {
          user: {
            id: '1',
            email: 'test@test.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'ADMIN',
            isActive: true,
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
          ...authState,
        },
        ui: {
          sidebarOpen: true,
          darkMode: false,
          dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
          ...uiState,
        },
      },
    });
  };

  const renderHeader = (store = createStore(), onMenuClick = vi.fn()) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Header onMenuClick={onMenuClick} />
        </BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render header with title', () => {
      renderHeader();

      expect(screen.getByText('User Tracking Platform')).toBeInTheDocument();
    });

    it('should render menu button', () => {
      renderHeader();

      expect(screen.getByLabelText('menu')).toBeInTheDocument();
    });

    it('should render user avatar with first initial', () => {
      renderHeader();

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should render notifications badge', () => {
      renderHeader();

      // Badge shows unread count (2 unread notifications in sample data)
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('menu button', () => {
    it('should call onMenuClick when menu button clicked', () => {
      const onMenuClick = vi.fn();
      renderHeader(createStore(), onMenuClick);

      fireEvent.click(screen.getByLabelText('menu'));

      expect(onMenuClick).toHaveBeenCalled();
    });
  });

  describe('dark mode toggle', () => {
    it('should show dark mode icon when in light mode', () => {
      renderHeader(createStore({}, { darkMode: false }));

      // Dark mode icon is shown to switch TO dark mode
      expect(screen.getByTestId('DarkModeIcon')).toBeInTheDocument();
    });

    it('should show light mode icon when in dark mode', () => {
      renderHeader(createStore({}, { darkMode: true }));

      // Light mode icon is shown to switch TO light mode
      expect(screen.getByTestId('LightModeIcon')).toBeInTheDocument();
    });
  });

  describe('notifications popover', () => {
    it('should open notifications when clicking notifications button', () => {
      renderHeader();

      fireEvent.click(screen.getByTestId('NotificationsIcon').closest('button')!);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('New user registered')).toBeInTheDocument();
    });
  });

  describe('profile menu', () => {
    it('should open profile menu when clicking avatar', () => {
      renderHeader();

      fireEvent.click(screen.getByText('J'));

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('test@test.com')).toBeInTheDocument();
    });

    it('should show profile option in menu', () => {
      renderHeader();

      fireEvent.click(screen.getByText('J'));

      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('should show settings option in menu', () => {
      renderHeader();

      fireEvent.click(screen.getByText('J'));

      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should show logout option in menu', () => {
      renderHeader();

      fireEvent.click(screen.getByText('J'));

      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should navigate to profile when clicking profile option', () => {
      renderHeader();

      fireEvent.click(screen.getByText('J'));
      fireEvent.click(screen.getByText('Profile'));

      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    it('should navigate to settings when clicking settings option', () => {
      renderHeader();

      fireEvent.click(screen.getByText('J'));
      fireEvent.click(screen.getByText('Settings'));

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });

    it('should logout and navigate when clicking logout option', () => {
      renderHeader();

      fireEvent.click(screen.getByText('J'));
      fireEvent.click(screen.getByText('Logout'));

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('user display', () => {
    it('should display U as fallback when no firstName', () => {
      const store = createStore({
        user: {
          id: '1',
          email: 'test@test.com',
          firstName: '',
          lastName: 'User',
          role: 'ADMIN',
          isActive: true,
        },
      });
      renderHeader(store);

      expect(screen.getByText('U')).toBeInTheDocument();
    });
  });
});
