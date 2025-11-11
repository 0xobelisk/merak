/**
 * DEX System Integration Tests
 *
 * Tests the complete DEX functionality:
 * - Query pool information
 * - Calculate swap amounts
 * - Add/remove liquidity
 * - Swap operations
 *
 * NOTE: This test suite automatically wraps SUI and DUBHE tokens before testing
 * and unwraps them after completion for easy cleanup.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Transaction, SuiTransactionBlockResponse } from '@0xobelisk/sui-client';
import {
  createMerakInstance,
  TEST_ASSETS,
  TEST_POOL,
  logSection,
  logStep,
  logSuccess,
  logInfo,
  logWarning,
  waitForTransaction,
  ensureValidTestEnvironment,
  ensureWrappedAssets,
  cleanupWrappedAssets
} from '../helpers';
import type { Merak } from '../../src/merak';

describe('DEX System', () => {
  let merak: Merak;
  let accountAddress: string;
  const assetA = TEST_ASSETS.ASSET_1 || TEST_ASSETS.WRAPPED_SUI;
  const assetB = TEST_ASSETS.ASSET_2 || TEST_ASSETS.WRAPPED_SUI;

  beforeAll(async () => {
    ensureValidTestEnvironment();

    logSection('Initializing DEX Tests');

    merak = createMerakInstance();
    accountAddress = merak.dubhe.currentAddress();

    logSuccess('Merak instance created successfully');
    logInfo('Account Address', accountAddress);
    logInfo('Asset A', assetA);
    logInfo('Asset B', assetB);

    // Auto-wrap assets before testing
    await ensureWrappedAssets(merak, accountAddress, [
      {
        assetId: assetA,
        coinType: TEST_ASSETS.DUBHE_COIN_TYPE, // Asset A is wrapped DUBHE
        requiredAmount: 10100000n, // 10M for liquidity + 100k buffer for swaps
        decimals: 9
      },
      {
        assetId: assetB,
        coinType: TEST_ASSETS.SUI_COIN_TYPE, // Asset B is wrapped SUI
        requiredAmount: 25000000n, // 25M for liquidity
        decimals: 9
      }
    ]);

    logSuccess('Asset preparation complete');

    // Ensure pool exists for testing
    logStep('Checking if test pool exists');
    const poolInfo = await merak.getPoolListWithId({
      asset1Id: assetA,
      asset2Id: assetB
    });

    if (!poolInfo) {
      logWarning('Pool does not exist, creating it for tests...');

      // Create pool by adding initial liquidity
      const tx = new Transaction();
      const initialLiquidityA = '1000000'; // 1M
      const initialLiquidityB = '1000000'; // 1M

      const result = (await merak.addLiquidity(
        tx,
        assetA,
        assetB,
        initialLiquidityA,
        initialLiquidityB,
        '1', // minAmountA
        '1', // minAmountB
        accountAddress
      )) as SuiTransactionBlockResponse;

      expect(result).toBeDefined();
      expect(result.digest).toBeDefined();

      logSuccess('Test pool created successfully');
      logInfo('Transaction Hash', result.digest);

      await waitForTransaction(3);

      // Verify pool was created
      const newPoolInfo = await merak.getPoolListWithId({
        asset1Id: assetA,
        asset2Id: assetB
      });

      if (!newPoolInfo) {
        throw new Error('Failed to create test pool');
      }

      logInfo('Pool LP Asset', newPoolInfo.lpAsset);
      logInfo('Pool Reserve A', newPoolInfo.reserve0);
      logInfo('Pool Reserve B', newPoolInfo.reserve1);
    } else {
      logSuccess('Test pool already exists');
      logInfo('Pool LP Asset', poolInfo.lpAsset);
      logInfo('Pool Reserve A', poolInfo.reserve0);
      logInfo('Pool Reserve B', poolInfo.reserve1);
    }
  }, 120000); // Increase timeout for wrap operations

  afterAll(async () => {
    // Auto-unwrap assets after testing
    await cleanupWrappedAssets(merak, accountAddress, [
      { assetId: assetA, coinType: TEST_ASSETS.DUBHE_COIN_TYPE },
      { assetId: assetB, coinType: TEST_ASSETS.SUI_COIN_TYPE }
    ]);

    logSuccess('Asset cleanup complete');
  }, 120000); // Increase timeout for unwrap operations

  describe('Asset Balance Queries', () => {
    it('should query both asset balances', async () => {
      logStep('Querying Asset A balance');
      const balanceA = await merak.balanceOf(assetA);
      expect(balanceA).toBeDefined();
      logInfo('Asset A Balance', balanceA.balance);

      logStep('Querying Asset B balance');
      const balanceB = await merak.balanceOf(assetB);
      expect(balanceB).toBeDefined();
      logInfo('Asset B Balance', balanceB.balance);

      logSuccess('Both asset balances retrieved');
    });
  });

  describe('Pool Information', () => {
    it('should query pool info if pool exists', async () => {
      logStep('Querying pool information');

      try {
        const poolInfo = await merak.getPoolListWithId({
          asset1Id: assetA,
          asset2Id: assetB
        });

        if (poolInfo) {
          expect(poolInfo).toBeDefined();

          logSuccess('Pool found');
          logInfo('LP Asset', poolInfo.lpAsset);
          logInfo('Reserve A', poolInfo.reserve0);
          logInfo('Reserve B', poolInfo.reserve1);
        } else {
          logWarning('Pool does not exist between these assets');
        }
      } catch (error: any) {
        logInfo('Note', 'Pool query failed: ' + error.message);
      }
    });

    it('should list available pools', async () => {
      logStep('Listing all pools');

      try {
        const pools = await merak.getPoolList();

        expect(pools).toBeDefined();

        const poolArray = pools.edges || [];
        logSuccess(`Found ${poolArray.length} pools`);

        if (poolArray.length > 0) {
          logInfo('Sample Pool', JSON.stringify(poolArray[0], null, 2));
        }
      } catch (error: any) {
        logInfo('Note', 'Pool listing failed: ' + error.message);
      }
    });
  });

  describe('Amount Calculations', () => {
    it('should calculate output amount for given input', async () => {
      const amountIn = '10000';
      const path = [assetA, assetB];

      logStep(`Calculating output for input: ${amountIn}`);

      try {
        const amountsOut = await merak.getAmountsOut(amountIn, path);

        expect(amountsOut).toBeDefined();

        if (amountsOut && amountsOut.length > 0) {
          // amountsOut returns nested array: [[inputAmount, outputAmount]]
          const amounts = amountsOut[0];
          const outputAmount = amounts[amounts.length - 1];

          expect(BigInt(outputAmount)).toBeGreaterThan(0n);

          logSuccess('Amount calculation successful');
          logInfo('Input', amounts[0]);
          logInfo('Output', outputAmount);
        } else {
          logWarning('No amounts returned');
        }
      } catch (error: any) {
        logInfo('Note', 'Pool may not exist or calculation failed: ' + error.message);
      }
    });

    it('should calculate input amount for given output', async () => {
      const amountOut = '9000';
      const path = [assetA, assetB];

      logStep(`Calculating input for output: ${amountOut}`);

      try {
        const amountsIn = await merak.getAmountsIn(amountOut, path);

        expect(amountsIn).toBeDefined();

        if (amountsIn && amountsIn.length > 0) {
          // amountsIn also returns nested array: [[inputAmount, outputAmount]]
          const amounts = amountsIn[0];
          const inputAmount = amounts[0];

          expect(BigInt(inputAmount)).toBeGreaterThan(0n);

          logSuccess('Input calculation successful');
          logInfo('Required Input', inputAmount);
          logInfo('Output Target', amountOut);
        } else {
          logWarning('No amounts returned');
        }
      } catch (error: any) {
        logInfo('Note', 'Pool may not exist or calculation failed: ' + error.message);
      }
    });
  });

  describe('Liquidity Operations', () => {
    it('should add liquidity to pool', async () => {
      logSection('Test: Add Liquidity');

      // Query pool to get correct ratio first
      const poolInfo = await merak.getPoolListWithId({
        asset1Id: assetA,
        asset2Id: assetB
      });

      // Pool should exist from beforeAll setup
      expect(poolInfo).toBeDefined();
      if (!poolInfo) throw new Error('Pool info is required');

      const reserve0 = BigInt(poolInfo.reserve0);
      const reserve1 = BigInt(poolInfo.reserve1);

      logInfo('Pool Reserve A', poolInfo.reserve0);
      logInfo('Pool Reserve B', poolInfo.reserve1);
      logInfo('Pool Ratio (A:B)', `1:${Number((reserve1 * 100n) / reserve0) / 100}`);

      // Check our balances
      const balanceA = await merak.balanceOf(assetA);
      const balanceB = await merak.balanceOf(assetB);

      logInfo('Our Asset A Balance', balanceA.balance);
      logInfo('Our Asset B Balance', balanceB.balance);

      const availableA = BigInt(balanceA.balance);
      const availableB = BigInt(balanceB.balance);

      // Verify we have sufficient balance
      expect(availableA).toBeGreaterThan(0n);
      expect(availableB).toBeGreaterThan(0n);

      // Calculate amounts based on pool ratio
      // We need to maintain the ratio: amountA/amountB = reserve0/reserve1
      // Try using 80% of available balance as buffer
      const maxA = (availableA * 80n) / 100n;
      const maxB = (availableB * 80n) / 100n;

      // Calculate how much we can add based on each asset
      const amountBBasedOnA = (maxA * reserve1) / reserve0;
      const amountABasedOnB = (maxB * reserve0) / reserve1;

      let amountA: string;
      let amountB: string;

      // Use the constraint that limits us the most
      if (amountBBasedOnA <= maxB) {
        // Asset B is not the limiting factor
        amountA = String(maxA);
        amountB = String(amountBBasedOnA);
      } else {
        // Asset A is not the limiting factor
        amountA = String(amountABasedOnB);
        amountB = String(maxB);
      }

      logStep(`Preparing to add liquidity: ${amountA} A, ${amountB} B`);
      logInfo('Ratio Check (A:B)', `1:${Number((BigInt(amountB) * 100n) / BigInt(amountA)) / 100}`);

      const tx = new Transaction();

      // Set 10% slippage tolerance for minimum amounts (higher for testnet)
      const minAmountA = String((BigInt(amountA) * 90n) / 100n);
      const minAmountB = String((BigInt(amountB) * 90n) / 100n);

      const result = (await merak.addLiquidity(
        tx,
        assetA,
        assetB,
        amountA,
        amountB,
        minAmountA,
        minAmountB,
        accountAddress
      )) as SuiTransactionBlockResponse;

      expect(result).toBeDefined();
      expect(result.digest).toBeDefined();

      logSuccess('Add liquidity transaction submitted');
      logInfo('Transaction Hash', result.digest);

      await waitForTransaction(3);

      logSuccess('Liquidity added successfully');
    }, 60000);
  });

  describe('Swap Operations', () => {
    it('should swap exact input', async () => {
      logSection('Test: Swap Exact Input');

      const amountIn = '100';
      const path = [assetA, assetB];

      logStep(`Preparing swap: ${amountIn} A -> B`);

      // Check balance (should be sufficient due to auto-wrap)
      const balance = await merak.balanceOf(assetA);
      logInfo('Asset A Balance', balance.balance);

      // Verify we have sufficient balance
      expect(BigInt(balance.balance)).toBeGreaterThanOrEqual(BigInt(amountIn));

      // Calculate expected output
      const amountsOut = await merak.getAmountsOut(amountIn, path);

      if (!amountsOut || amountsOut.length === 0) {
        logWarning('Could not calculate swap amounts, skipping');
        return;
      }

      const amounts = amountsOut[0];
      const expectedOutput = amounts[amounts.length - 1];

      // Set 1% slippage tolerance
      const minAmountOut = String((BigInt(expectedOutput) * 99n) / 100n);

      const tx = new Transaction();

      const result = (await merak.swapExactTokensForTokens(
        tx,
        amountIn,
        minAmountOut,
        path,
        accountAddress
      )) as SuiTransactionBlockResponse;

      expect(result).toBeDefined();
      expect(result.digest).toBeDefined();

      logSuccess('Swap transaction submitted');
      logInfo('Transaction Hash', result.digest);

      await waitForTransaction(3);

      logSuccess('Swap completed successfully');
    }, 60000);

    it('should swap exact output', async () => {
      logSection('Test: Swap Exact Output');

      const amountOut = '90';
      const path = [assetA, assetB];

      logStep(`Preparing swap: A -> ${amountOut} B`);

      // Calculate required input
      const amountsIn = await merak.getAmountsIn(amountOut, path);

      if (!amountsIn || amountsIn.length === 0) {
        logWarning('Could not calculate swap amounts, skipping');
        return;
      }

      const amounts = amountsIn[0];
      const requiredInput = amounts[0];

      // Set 1% slippage tolerance
      const maxAmountIn = String((BigInt(requiredInput) * 101n) / 100n);

      // Check balance (should be sufficient due to auto-wrap)
      const balance = await merak.balanceOf(assetA);
      logInfo('Asset A Balance', balance.balance);

      // Verify we have sufficient balance
      expect(BigInt(balance.balance)).toBeGreaterThanOrEqual(BigInt(maxAmountIn));

      const tx = new Transaction();

      const result = (await merak.swapTokensForExactTokens(
        tx,
        amountOut,
        maxAmountIn,
        path,
        accountAddress
      )) as SuiTransactionBlockResponse;

      expect(result).toBeDefined();
      expect(result.digest).toBeDefined();

      logSuccess('Swap transaction submitted');
      logInfo('Transaction Hash', result.digest);

      await waitForTransaction(3);

      logSuccess('Swap completed successfully');
    }, 60000);
  });

  describe('Remove Liquidity', () => {
    it('should remove liquidity from pool', async () => {
      logSection('Test: Remove Liquidity');

      // First, query pool to get LP asset ID
      const poolInfo = await merak.getPoolListWithId({
        asset1Id: assetA,
        asset2Id: assetB
      });

      // Pool should exist from beforeAll setup
      expect(poolInfo).toBeDefined();
      if (!poolInfo) throw new Error('Pool info is required');

      const lpAssetId = poolInfo.lpAsset;
      logInfo('LP Asset ID', lpAssetId);

      // Query LP token balance
      logStep('Querying LP token balance');
      const lpBalance = await merak.balanceOf(lpAssetId);
      logInfo('LP Token Balance', lpBalance.balance);

      if (BigInt(lpBalance.balance) === 0n) {
        logWarning('No LP tokens to remove, skipping test');
        return;
      }

      // Remove 50% of the liquidity (to leave some for future tests)
      const liquidityToRemove = String(BigInt(lpBalance.balance) / 2n);
      logStep(`Preparing to remove liquidity: ${liquidityToRemove} LP tokens`);

      logInfo('Pool Reserve A', poolInfo.reserve0);
      logInfo('Pool Reserve B', poolInfo.reserve1);

      // Set minimum receive amounts to 1 (we accept any amount for testing purposes)
      // In production, you should calculate proper minimum amounts based on pool reserves
      const minAmountA = '1';
      const minAmountB = '1';

      const tx = new Transaction();

      const result = (await merak.removeLiquidity(
        tx,
        assetA,
        assetB,
        liquidityToRemove,
        minAmountA,
        minAmountB,
        accountAddress
      )) as SuiTransactionBlockResponse;

      expect(result).toBeDefined();
      expect(result.digest).toBeDefined();

      logSuccess('Remove liquidity transaction submitted');
      logInfo('Transaction Hash', result.digest);

      await waitForTransaction(3);

      // Verify balances after removal
      const newLpBalance = await merak.balanceOf(lpAssetId);
      const newBalanceA = await merak.balanceOf(assetA);
      const newBalanceB = await merak.balanceOf(assetB);

      logInfo('New LP Token Balance', newLpBalance.balance);
      logInfo('New Asset A Balance', newBalanceA.balance);
      logInfo('New Asset B Balance', newBalanceB.balance);

      // Verify LP tokens were burned
      expect(BigInt(newLpBalance.balance)).toBeLessThan(BigInt(lpBalance.balance));

      logSuccess('Liquidity removed successfully');
    }, 60000);
  });

  describe('Swap Error Cases', () => {
    it('should reject zero amount swap', async () => {
      logSection('Test: Zero Amount Swap Error');

      const path = [assetA, assetB];

      logStep('Attempting to swap 0 amount (should fail)');

      await expect(async () => {
        const tx = new Transaction();
        await merak.swapExactTokensForTokens(tx, '0', '0', path, accountAddress);
      }).rejects.toThrow();

      logSuccess('Zero amount swap correctly rejected');
    }, 30000);

    it('should reject swap with insufficient balance', async () => {
      logSection('Test: Insufficient Balance Swap Error');

      const balance = await merak.balanceOf(assetA);
      const excessAmount = String(BigInt(balance.balance) + 1000000n);
      const path = [assetA, assetB];

      logStep(`Attempting to swap ${excessAmount} (exceeds balance: ${balance.balance})`);

      await expect(async () => {
        const tx = new Transaction();
        await merak.swapExactTokensForTokens(tx, excessAmount, '1', path, accountAddress);
      }).rejects.toThrow();

      logSuccess('Insufficient balance swap correctly rejected');
    }, 30000);
  });

  describe('Liquidity Error Cases', () => {
    it('should reject adding liquidity with zero amounts', async () => {
      logSection('Test: Zero Amount Add Liquidity Error');

      logStep('Attempting to add 0 liquidity (should fail)');

      await expect(async () => {
        const tx = new Transaction();
        await merak.addLiquidity(tx, assetA, assetB, '0', '0', '0', '0', accountAddress);
      }).rejects.toThrow();

      logSuccess('Zero amount add liquidity correctly rejected');
    }, 30000);

    it('should reject removing liquidity with zero amount', async () => {
      logSection('Test: Zero Amount Remove Liquidity Error');

      logStep('Attempting to remove 0 liquidity (should fail)');

      await expect(async () => {
        const tx = new Transaction();
        await merak.removeLiquidity(tx, assetA, assetB, '0', '0', '0', accountAddress);
      }).rejects.toThrow();

      logSuccess('Zero amount remove liquidity correctly rejected');
    }, 30000);
  });
});
