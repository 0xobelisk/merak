import { render, screen } from '@testing-library/react';
import NotFound from './not-found';
import { describe, it, expect } from 'vitest';

describe('NotFound component', () => {
  it('renders 404 message and link', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/');
  });
});
