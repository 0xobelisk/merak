'use client';

import { atom } from 'jotai';

export type Token = {
  id: number | null;
  name: string;
  symbol: string;
  description: string;
  decimals: number;
  icon: string;
  balance: string;
};

export const fromTokenAtom = atom<Token>({
  id: null,
  name: '',
  symbol: '',
  description: '',
  decimals: 1,
  icon: '',
  balance: ''
});
export const toTokenAtom = atom<Token>({
  id: null,
  name: '',
  symbol: '',
  description: '',
  decimals: 1,
  icon: '',
  balance: ''
});
