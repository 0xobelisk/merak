import { isAtom } from 'jotai';
import { initMerakClient, merakClient } from './index';
import { describe, it, expect, vi } from 'vitest';
import { Merak } from '@0xobelisk/merak-sdk';

describe('merakClient atom', () => {
  it('creates Merak instance', () => {
    const merak = initMerakClient();
    expect(merak).toBeInstanceOf(Merak);
  });

  it('exports an atom', () => {
    expect(isAtom(merakClient)).toBe(true);
  });
});
