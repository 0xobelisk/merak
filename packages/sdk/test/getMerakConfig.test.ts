import { describe, it, expect } from 'vitest';
import { getMerakConfig } from '../src/utils';

describe('getMerakConfig', () => {
  it('returns testnet config', () => {
    const cfg = getMerakConfig('testnet');
    expect(cfg.packageId).toBeDefined();
    expect(cfg.schemaId).toBeDefined();
  });
});
