/**
 * Test Configuration
 *
 * Centralized configuration for all tests
 */

import dotenv from 'dotenv';

dotenv.config();

// ==================== Environment Configuration ====================

export const TEST_ENV = {
  // Private key for testing (from .env)
  PRIVATE_KEY: process.env.PRIVATE_KEY || '',

  // Network configuration
  NETWORK: (process.env.TEST_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'localnet',

  //   // Test account address
  //   TEST_ACCOUNT: process.env.TEST_ACCOUNT || '',

  // Enable verbose logging
  VERBOSE: process.env.TEST_VERBOSE === 'true',

  // Test timeout (milliseconds)
  TIMEOUT: parseInt(process.env.TEST_TIMEOUT || '60000', 10),

  // Fullnode URL
  FULLNODE_URL: process.env.FULLNODE_URL || 'https://fullnode.testnet.sui.io:443'
};

// ==================== Test Assets ====================

export const TEST_ASSETS = {
  // Wrapped SUI asset ID
  WRAPPED_SUI:
    process.env.TEST_WRAPPED_SUI_ID ||
    '0x0000000000000000000000000000000000000000000000000000000000000002',

  // Test asset 1 (Wrapped DUBHE)
  ASSET_1:
    process.env.TEST_ASSET_1_ID ||
    '0x357cb71d44a3fe292623a589e44f6a4f704d39d64a916bde9f81b78ce7ffac5c',

  // Test asset 2 (Wrapped SUI)
  ASSET_2:
    process.env.TEST_ASSET_2_ID ||
    '0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6',

  // Native SUI coin type (short form, equivalent to full form)
  SUI_COIN_TYPE: '0x2::sui::SUI',

  // Full SUI coin type
  SUI_COIN_TYPE_FULL:
    '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',

  // DUBHE coin type
  DUBHE_COIN_TYPE:
    process.env.DUBHE_COIN_TYPE ||
    '0x8c7013745af0eb1ab211cde05b40ee6e2130276664d7e3e3741a36f11fa9f20b::dubhe::DUBHE'
};

// ==================== Test Amounts ====================

export const TEST_AMOUNTS = {
  // Small amount for testing (in SUI)
  SMALL: 0.0001,

  // Medium amount for testing (in SUI)
  MEDIUM: 0.001,

  // Large amount for testing (in SUI)
  LARGE: 0.01,

  // SUI decimals
  SUI_DECIMALS: 9
};

// ==================== Pool Configuration ====================

export const TEST_POOL = {
  // Initial liquidity amounts
  INITIAL_LIQUIDITY_A: 1000000n,
  INITIAL_LIQUIDITY_B: 1000000n,

  // Swap amounts
  SWAP_AMOUNT_IN: 10000n,
  SWAP_AMOUNT_OUT: 9900n,

  // Fee basis points (0.3% = 30 basis points)
  FEE_BPS: 30
};

// ==================== Validation ====================

export function validateTestEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!TEST_ENV.PRIVATE_KEY) {
    errors.push('PRIVATE_KEY environment variable is not set');
  }

  //   if (!TEST_ENV.TEST_ACCOUNT) {
  //     errors.push('TEST_ACCOUNT environment variable is not set');
  //   }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ==================== Helper to validate environment (throws error if invalid) ====================

export function ensureValidTestEnvironment(): void {
  // Throw error if required env vars are not set
  const validation = validateTestEnvironment();
  if (!validation.valid) {
    throw new Error(
      `Test environment validation failed: ${validation.errors.join(', ')}\n` +
        'Please ensure all required environment variables are set before running tests.'
    );
  }
}
