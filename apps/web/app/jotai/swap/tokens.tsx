'use client';

import { atom } from 'jotai';

export type Token = {
  id: string | null;
  name: string;
  symbol: string;
  description: string;
  decimals: number;
  iconUrl: string;
  balance: string;
};

export const fromTokenAtom = atom<Token>({
  id: null,
  name: '',
  symbol: '',
  description: '',
  decimals: 1,
  iconUrl: '',
  balance: ''
});
export const toTokenAtom = atom<Token>({
  id: null,
  name: '',
  symbol: '',
  description: '',
  decimals: 1,
  iconUrl: '',
  balance: ''
});
