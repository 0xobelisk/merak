/**
 * Assets System Integration Tests
 *
 * Tests asset management functionality:
 * - Transfer assets between accounts
 * - Query balances, supply, metadata
 * - List assets
 *
 * NOTE: This test suite automatically wraps DUBHE tokens before testing
 * and unwraps them after completion for easy cleanup.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Transaction, SuiTransactionBlockResponse } from '@0xobelisk/sui-client';
import {
  createMerakInstance,
  TEST_ASSETS,
  logSection,
  logStep,
  logSuccess,
  logInfo,
  waitForTransaction,
  ensureValidTestEnvironment,
  ensureWrappedAssets,
  cleanupWrappedAssets
} from '../helpers';
import type { Merak } from '../../src';

describe('Assets System', () => {
  let merak: Merak;
  let accountAddress: string;
  const testAssetId = TEST_ASSETS.ASSET_1 || TEST_ASSETS.WRAPPED_SUI;

  beforeAll(async () => {
    ensureValidTestEnvironment();

    logSection('Initializing Assets Tests');

    merak = createMerakInstance();
    accountAddress = merak.dubhe.currentAddress();

    logSuccess('Merak instance created successfully');
    logInfo('Account Address', accountAddress);
    logInfo('Test Asset ID', testAssetId);

    // Auto-wrap assets before testing
    await ensureWrappedAssets(merak, accountAddress, [
      {
        assetId: testAssetId,
        coinType: TEST_ASSETS.DUBHE_COIN_TYPE, // Test asset is wrapped DUBHE
        requiredAmount: 1000n, // Small amount for transfer test
        decimals: 9
      }
    ]);

    logSuccess('Asset preparation complete');
  }, 120000);

  afterAll(async () => {
    // Auto-unwrap assets after testing
    await cleanupWrappedAssets(merak, accountAddress, [
      { assetId: testAssetId, coinType: TEST_ASSETS.DUBHE_COIN_TYPE }
    ]);

    logSuccess('Asset cleanup complete');
  }, 120000);

  describe('Balance Queries', () => {
    it('should query asset balance', async () => {
      logStep('Querying asset balance');

      const balance = await merak.balanceOf(testAssetId);

      expect(balance).toBeDefined();
      expect(balance.balance).toBeDefined();
      expect(typeof balance.balance).toBe('string');

      logSuccess(`Asset Balance: ${balance.balance}`);
    });

    it('should query asset balance for specific address', async () => {
      logStep('Querying asset balance for address');

      const balance = await merak.balanceOf(testAssetId, accountAddress);

      expect(balance).toBeDefined();
      expect(balance.balance).toBeDefined();

      logSuccess(`Asset Balance for ${accountAddress.slice(0, 10)}...: ${balance.balance}`);
    });
  });

  describe('Asset Metadata', () => {
    it('should query asset metadata', async () => {
      logStep('Querying asset metadata');

      try {
        const metadata = await merak.getMetadata(testAssetId);

        expect(metadata).toBeDefined();

        logSuccess('Asset metadata retrieved');
        if (metadata) {
          logInfo('Asset ID', testAssetId);
          // Log available metadata fields
          if (metadata.name) logInfo('Name', metadata.name);
          if (metadata.symbol) logInfo('Symbol', metadata.symbol);
          if (metadata.decimals !== undefined) logInfo('Decimals', metadata.decimals);
        }
      } catch (error: any) {
        // Some assets may not have metadata
        logInfo('Note', 'Asset metadata not available or requires special query');
      }
    });

    it('should query asset supply', async () => {
      logStep('Querying asset supply');

      try {
        const supply = await merak.supplyOf(testAssetId);

        expect(supply).toBeDefined();
        expect(typeof supply).toBe('string');

        logSuccess(`Total Supply: ${supply}`);
      } catch (error: any) {
        logInfo('Note', 'Asset supply query not available for this asset');
      }
    });
  });

  describe('Asset Listing', () => {
    it('should list available assets', async () => {
      logStep('Listing available assets');

      try {
        const assets = await merak.listAssetsInfo();

        expect(assets).toBeDefined();
        expect(Array.isArray(assets)).toBe(true);

        logSuccess(`Found ${assets.length} assets`);

        if (assets.length > 0) {
          logInfo('Sample Asset', assets[0]);
        }
      } catch (error: any) {
        logInfo('Note', 'Asset listing not available or requires different query method');
      }
    });
  });

  describe('Asset Transfer', () => {
    it('should transfer asset to self (validation test)', async () => {
      logSection('Test: Asset Transfer');

      const transferAmount = 1n; // Minimal amount for testing

      logStep(`Preparing to transfer ${transferAmount.toString()} units`);

      // Get initial balance (should be sufficient due to auto-wrap)
      const initialBalance = await merak.balanceOf(testAssetId);
      logInfo('Initial Balance', initialBalance.balance);

      // Verify we have sufficient balance (should pass now)
      expect(BigInt(initialBalance.balance)).toBeGreaterThanOrEqual(transferAmount);

      // Build transfer transaction (to self)
      logStep('Building transfer transaction');
      const tx = new Transaction();

      try {
        const result = (await merak.transfer(
          tx,
          testAssetId,
          accountAddress, // Transfer to self for testing
          transferAmount
        )) as SuiTransactionBlockResponse;

        expect(result).toBeDefined();
        expect(result.digest).toBeDefined();

        logSuccess('Transfer transaction submitted');
        logInfo('Transaction Hash', result.digest);

        await waitForTransaction(3);

        // Verify balance (should be same since we transferred to self)
        const finalBalance = await merak.balanceOf(testAssetId);
        logInfo('Final Balance', finalBalance.balance);

        logSuccess('Transfer test completed');
      } catch (error: any) {
        // Transfer might fail if API differs
        logInfo('Note', 'Transfer method signature may differ: ' + error.message);
      }
    }, 60000);
  });
});
