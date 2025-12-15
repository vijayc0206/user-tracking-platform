import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorFallback } from '../../components/common/ErrorFallback';

describe('ErrorFallback', () => {
  it('should render error message', () => {
    const error = new Error('Test error message');
    const resetFn = vi.fn();

    render(<ErrorFallback error={error} resetErrorBoundary={resetFn} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should show default message if error has no message', () => {
    const error = new Error();
    error.message = '';
    const resetFn = vi.fn();

    render(<ErrorFallback error={error} resetErrorBoundary={resetFn} />);

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('should call resetErrorBoundary when button is clicked', () => {
    const error = new Error('Test error');
    const resetFn = vi.fn();

    render(<ErrorFallback error={error} resetErrorBoundary={resetFn} />);

    const button = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(button);

    expect(resetFn).toHaveBeenCalledTimes(1);
  });

  it('should have a Try Again button', () => {
    const error = new Error('Test error');
    const resetFn = vi.fn();

    render(<ErrorFallback error={error} resetErrorBoundary={resetFn} />);

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
