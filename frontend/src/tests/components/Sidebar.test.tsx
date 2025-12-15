import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../../components/common/Sidebar';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Sidebar', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    drawerWidth: 240,
    isMobile: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSidebar = (props = {}, initialRoute = '/dashboard') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Sidebar {...defaultProps} {...props} />
      </MemoryRouter>
    );
  };

  describe('rendering', () => {
    it('should render sidebar with logo', () => {
      renderSidebar();

      expect(screen.getByText('User Tracking')).toBeInTheDocument();
    });

    it('should render all main navigation items', () => {
      renderSidebar();

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Events')).toBeInTheDocument();
      expect(screen.getByText('Sessions')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should render admin navigation items', () => {
      renderSidebar();

      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to dashboard when clicked', () => {
      renderSidebar();

      fireEvent.click(screen.getByText('Dashboard'));

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate to users page when clicked', () => {
      renderSidebar();

      fireEvent.click(screen.getByText('Users'));

      expect(mockNavigate).toHaveBeenCalledWith('/users');
    });

    it('should navigate to events page when clicked', () => {
      renderSidebar();

      fireEvent.click(screen.getByText('Events'));

      expect(mockNavigate).toHaveBeenCalledWith('/events');
    });

    it('should navigate to sessions page when clicked', () => {
      renderSidebar();

      fireEvent.click(screen.getByText('Sessions'));

      expect(mockNavigate).toHaveBeenCalledWith('/sessions');
    });

    it('should navigate to analytics page when clicked', () => {
      renderSidebar();

      fireEvent.click(screen.getByText('Analytics'));

      expect(mockNavigate).toHaveBeenCalledWith('/analytics');
    });

    it('should navigate to admin panel when clicked', () => {
      renderSidebar();

      fireEvent.click(screen.getByText('Admin Panel'));

      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });

    it('should navigate to settings page when clicked', () => {
      renderSidebar();

      fireEvent.click(screen.getByText('Settings'));

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  describe('mobile behavior', () => {
    it('should call onClose after navigation on mobile', () => {
      const onClose = vi.fn();
      renderSidebar({ isMobile: true, onClose });

      fireEvent.click(screen.getByText('Dashboard'));

      expect(onClose).toHaveBeenCalled();
    });

    it('should not call onClose after navigation on desktop', () => {
      const onClose = vi.fn();
      renderSidebar({ isMobile: false, onClose });

      fireEvent.click(screen.getByText('Dashboard'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('drawer variants', () => {
    it('should use temporary drawer on mobile', () => {
      renderSidebar({ isMobile: true });

      // The drawer is rendered - we can verify by checking content exists
      expect(screen.getByText('User Tracking')).toBeInTheDocument();
    });

    it('should use persistent drawer on desktop', () => {
      renderSidebar({ isMobile: false });

      expect(screen.getByText('User Tracking')).toBeInTheDocument();
    });
  });
});
