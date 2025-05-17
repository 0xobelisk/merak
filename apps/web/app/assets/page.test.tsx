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
  initMerakClient: () => ({
    listAssetsInfo: vi.fn().mockResolvedValue({ data: [] })
  })
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

describe('Assets Page', () => {
  it('renders asset overview header', async () => {
    render(<Page />);
    expect(await screen.findByText('Asset Overview')).toBeInTheDocument();
  });
});
