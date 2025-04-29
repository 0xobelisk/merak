'use client';

import { atom } from 'jotai';

export type Token = {
  id: number | null;
  name: string;
  symbol: string;
  description: string;
  decimals: number;
  icon_url: string;
  balance: string;
};

export const fromTokenAtom = atom<Token>({
  id: null,
  name: '',
  symbol: '',
  description: '',
  decimals: 1,
  icon_url: '',
  balance: ''
});
export const toTokenAtom = atom<Token>({
  id: null,
  name: '',
  symbol: '',
  description: '',
  decimals: 1,
  icon_url: '',
  balance: ''
});
