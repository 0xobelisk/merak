import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Page from './page';

vi.mock('@mysten/dapp-kit', () => ({
  useCurrentAccount: () => ({ address: '0x1' }),
  useSignAndExecuteTransaction: () => ({})
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}));

vi.mock('@/app/jotai/merak', () => ({
  initMerakClient: () => ({})
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

describe('Create Page', () => {
  it('renders create token header', async () => {
    render(<Page />);
    expect(await screen.findByText('Create a New Merak Token')).toBeInTheDocument();
  });
});
