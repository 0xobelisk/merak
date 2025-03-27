'use client';

import { atom } from 'jotai';

interface TokenAsset {
  id: string | number;
  metadata: any[];
  balance: any[];
}

interface SelectedTokens {
  base: TokenAsset | null;
  quote: TokenAsset | null;
}

export const PoolSetupOpen = atom(false);

export const SelectedPoolTokens = atom<SelectedTokens>({ base: null, quote: null });
