/**
 * Complete DEX System Test
 *
 * This test covers the full DEX functionality:
 * - Creating trading pools
 * - Adding liquidity
 * - Swapping tokens (both exact input and exact output)
 * - Removing liquidity
 * - Query functions for amount calculations
 *
 * Usage:
 * 1. Set PRIVATE_KEY in .env file
 * 2. Ensure test account has sufficient balance of both test assets
 * 3. Run: pnpm test:dex
 */

import { createMerak, TEST_CONFIG } from './test-helpers';
import { SuiTransactionBlockResponse, Transaction } from '@0xobelisk/sui-client';
import dotenv from 'dotenv';

dotenv.config();

// ==================== Helper Functions ====================

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

function logStep(step: string) {
  console.log(`\n📍 ${step}`);
}

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logError(message: string) {
  console.error(`❌ ${message}`);
}

function logInfo(key: string, value: any) {
  console.log(`   ${key}: ${value}`);
}

function logWarning(message: string) {
  console.log(`⚠️  ${message}`);
}

async function waitForTransaction(seconds: number = 3) {
  console.log(`⏳ Waiting ${seconds}s for transaction confirmation...`);
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

// ==================== Main Test Function ====================

async function main() {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    logError('PRIVATE_KEY environment variable not set');
    console.log('Please set PRIVATE_KEY in .env file');
    process.exit(1);
  }

  logSection('DEX System Complete Test');
  console.log(`📡 Network: ${TEST_CONFIG.network}`);
  console.log(`🔑 Account: ${TEST_CONFIG.testAccount.slice(0, 10)}...`);

  // Initialize Merak
  const merak = createMerak({
    networkType: TEST_CONFIG.network,
    secretKey: privateKey
  });

  logSuccess('Merak instance created successfully');
  logInfo('Package ID', merak.packageId);
  logInfo('Schema ID', merak.schemaId);

  const accountAddress = merak.dubhe.currentAddress();
  logInfo('Current Address', accountAddress);

  // Test assets
  const assetA = TEST_CONFIG.testAssetId;
  const assetB = TEST_CONFIG.testAssetId2;

  logInfo('Asset A', assetA);
  logInfo('Asset B', assetB);

  // ==================== Test 1: Query Initial Balances ====================
  logSection('Test 1: Query Initial Asset Balances');

  logStep('Querying balance of Asset A');
  const initialBalanceA = await merak.balanceOf(assetA);
  logInfo('Asset A Balance', initialBalanceA.balance);

  logStep('Querying balance of Asset B');
  const initialBalanceB = await merak.balanceOf(assetB);
  logInfo('Asset B Balance', initialBalanceB.balance);

  // Check if we have sufficient balance for testing
  const minRequiredBalance = BigInt(1000000); // Minimum 0.001 tokens
  if (BigInt(initialBalanceA.balance) < minRequiredBalance) {
    logError(`Insufficient Asset A balance. Need at least ${minRequiredBalance.toString()}`);
    process.exit(1);
  }
  if (BigInt(initialBalanceB.balance) < minRequiredBalance) {
    logError(`Insufficient Asset B balance. Need at least ${minRequiredBalance.toString()}`);
    process.exit(1);
  }

  // ==================== Test 2: Check/Create Pool ====================
  logSection('Test 2: Pool Management');

  logStep('Checking if pool exists between Asset A and Asset B');
  let poolExists = false;
  let poolInfo: any = null;

  try {
    poolInfo = await merak.getPoolListWithId({
      asset1Id: assetA,
      asset2Id: assetB
    });
    if (poolInfo) {
      poolExists = true;
      logSuccess('Pool already exists!');
      logInfo('Pool Address', poolInfo.poolAddress);
      logInfo('LP Asset ID', poolInfo.lpAsset);
      logInfo('Reserve A', poolInfo.reserve0);
      logInfo('Reserve B', poolInfo.reserve1);
    }
  } catch (error) {
    logInfo('Pool Status', 'Does not exist');
  }

  if (!poolExists) {
    logStep('Creating new pool');
    const createPoolTx = new Transaction();

    try {
      const createPoolRes = (await merak.createPool(
        createPoolTx,
        assetA,
        assetB
      )) as SuiTransactionBlockResponse;

      logSuccess('Pool creation transaction submitted');
      logInfo('Transaction Hash', createPoolRes.digest);

      await waitForTransaction();

      // Query pool info after creation
      poolInfo = await merak.getPoolListWithId({
        asset1Id: assetA,
        asset2Id: assetB
      });
      logSuccess('Pool created successfully!');
      logInfo('Pool Address', poolInfo.poolAddress);
      logInfo('LP Asset ID', poolInfo.lpAsset);
    } catch (error: any) {
      logError(`Failed to create pool: ${error.message}`);
      throw error;
    }
  }

  const lpAssetId = poolInfo.lpAsset;

  // ==================== Test 3: Add Liquidity ====================
  logSection('Test 3: Add Liquidity to Pool');

  // Query current pool state to get correct ratio
  const poolInfoBeforeAdd = await merak.getPoolListWithId({
    asset1Id: assetA,
    asset2Id: assetB
  });

  if (!poolInfoBeforeAdd) {
    logError('Failed to query pool information');
    throw new Error('Pool information not available');
  }

  const reserveA = BigInt(poolInfoBeforeAdd.reserve0);
  const reserveB = BigInt(poolInfoBeforeAdd.reserve1);

  // Use small amounts for testing
  const amountADesired = BigInt(100000); // 0.0001 tokens
  // Calculate required amount B based on pool ratio
  const amountBDesired = (amountADesired * reserveB) / reserveA;

  // Set 5% slippage protection
  const minAmountA = String((amountADesired * 95n) / 100n);
  const minAmountB = String((amountBDesired * 95n) / 100n);

  logStep('Querying LP token balance before adding liquidity');
  // Use on-chain query for more reliable results (GraphQL indexer may have delays)
  const lpBalanceBeforeRaw = await merak.assets.balanceOf(lpAssetId, accountAddress);
  const lpBalanceBefore = lpBalanceBeforeRaw ? String(lpBalanceBeforeRaw) : '0';
  logInfo('LP Balance Before', lpBalanceBefore);

  logStep('Preparing liquidity addition');
  logInfo('Current Pool Ratio (B/A)', (Number(reserveB) / Number(reserveA)).toFixed(4));
  logInfo('Amount A Desired', amountADesired.toString());
  logInfo('Amount B Desired', amountBDesired.toString());
  logInfo('Amount A Min', minAmountA);
  logInfo('Amount B Min', minAmountB);

  const addLiquidityTx = new Transaction();
  const addLiquidityRes = (await merak.addLiquidity(
    addLiquidityTx,
    assetA,
    assetB,
    amountADesired.toString(),
    amountBDesired.toString(),
    minAmountA,
    minAmountB,
    accountAddress
  )) as SuiTransactionBlockResponse;

  logSuccess('Add liquidity transaction submitted');
  logInfo('Transaction Hash', addLiquidityRes.digest);
  logInfo('Transaction Status', (addLiquidityRes.effects?.status as any)?.status || 'unknown');

  // Check if transaction failed
  if ((addLiquidityRes.effects?.status as any)?.status === 'failure') {
    logError('Transaction failed!');
    logInfo('Error', (addLiquidityRes.effects?.status as any)?.error || 'Unknown error');
    throw new Error('Add liquidity transaction failed');
  }

  await waitForTransaction(5); // Increase wait time to 5 seconds

  // Verify liquidity addition
  logStep('Verifying liquidity addition');

  // Use on-chain query for reliable results (GraphQL indexer has delays)
  const lpBalanceAfterRaw = await merak.assets.balanceOf(lpAssetId, accountAddress);
  const lpBalanceAfter = lpBalanceAfterRaw ? String(lpBalanceAfterRaw) : '0';
  logInfo('LP Balance After', lpBalanceAfter);

  const lpReceived = BigInt(lpBalanceAfter) - BigInt(lpBalanceBefore);
  if (lpReceived > 0n) {
    logSuccess(`Liquidity added! Received ${lpReceived.toString()} LP tokens`);
  } else {
    logError('No LP tokens received!');
    throw new Error('Liquidity addition verification failed');
  }

  // Query updated pool info
  const poolInfoAfterAdd = await merak.getPoolListWithId({
    asset1Id: assetA,
    asset2Id: assetB
  });
  if (poolInfoAfterAdd) {
    logInfo('Updated Reserve A', poolInfoAfterAdd.reserve0);
    logInfo('Updated Reserve B', poolInfoAfterAdd.reserve1);
  }

  // ==================== Test 4: Query Swap Amounts ====================
  logSection('Test 4: Query Swap Amount Calculations');

  const swapAmountIn = '10000'; // Small amount for swap
  const path = [assetA, assetB];

  logStep('Calculating output amount for given input');
  logInfo('Input Amount', swapAmountIn);
  logInfo('Path', `${path[0].slice(0, 10)}... -> ${path[1].slice(0, 10)}...`);

  const amountsOut = await merak.getAmountsOut(swapAmountIn, path);
  if (amountsOut && amountsOut.length > 0) {
    logSuccess('Amount calculation successful');
    // amountsOut returns nested array: [[inputAmount, outputAmount]]
    const amounts = amountsOut[0];
    logInfo('Input Amount', amounts[0]);
    logInfo('Output Amount', amounts[amounts.length - 1]);
  } else {
    logError('Failed to calculate amounts');
  }

  // Extract the output amount: amountsOut is [[input, output]]
  const expectedOutput =
    amountsOut && amountsOut[0] ? amountsOut[0][amountsOut[0].length - 1] : '0';

  logStep('Calculating input amount for desired output');
  const desiredOutput = '5000';
  const amountsIn = await merak.getAmountsIn(desiredOutput, path);
  if (amountsIn && amountsIn.length > 0) {
    logSuccess('Input amount calculation successful');
    // amountsIn also returns nested array: [[inputAmount, outputAmount]]
    const amounts = amountsIn[0];
    logInfo('Required Input', amounts[0]);
    logInfo('Desired Output', desiredOutput);
  } else {
    logError('Failed to calculate required input');
  }

  // ==================== Test 5: Swap Exact Tokens for Tokens ====================
  logSection('Test 5: Swap with Exact Input Amount');

  logStep('Recording balances before swap');
  // Use on-chain query for consistency
  const balanceABeforeSwapRaw = await merak.assets.balanceOf(assetA, accountAddress);
  const balanceBBeforeSwapRaw = await merak.assets.balanceOf(assetB, accountAddress);
  const balanceABeforeSwap = balanceABeforeSwapRaw ? String(balanceABeforeSwapRaw) : '0';
  const balanceBBeforeSwap = balanceBBeforeSwapRaw ? String(balanceBBeforeSwapRaw) : '0';
  logInfo('Asset A Before', balanceABeforeSwap);
  logInfo('Asset B Before', balanceBBeforeSwap);

  // Calculate minimum output with 1% slippage tolerance
  const expectedOutputBigInt = BigInt(expectedOutput);
  const amountOutMin = String((expectedOutputBigInt * 99n) / 100n);
  logStep('Executing swap with exact input');
  logInfo('Amount In', swapAmountIn);
  logInfo('Expected Output', expectedOutput);
  logInfo('Amount Out Min', amountOutMin);

  const swapTx1 = new Transaction();
  const swapRes1 = (await merak.swapExactTokensForTokens(
    swapTx1,
    swapAmountIn,
    amountOutMin,
    path,
    accountAddress
  )) as SuiTransactionBlockResponse;

  logSuccess('Swap transaction submitted');
  logInfo('Transaction Hash', swapRes1.digest);
  logInfo('Transaction Status', (swapRes1.effects?.status as any)?.status || 'unknown');

  // Check if transaction failed
  if ((swapRes1.effects?.status as any)?.status === 'failure') {
    logError('Transaction failed!');
    logInfo('Error', (swapRes1.effects?.status as any)?.error || 'Unknown error');
    throw new Error('Swap transaction failed');
  }

  await waitForTransaction(5);

  // Verify swap result using on-chain query for reliability
  logStep('Verifying swap result');
  const balanceAAfterSwapRaw = await merak.assets.balanceOf(assetA, accountAddress);
  const balanceBAfterSwapRaw = await merak.assets.balanceOf(assetB, accountAddress);
  const balanceAAfterSwap = balanceAAfterSwapRaw ? String(balanceAAfterSwapRaw) : '0';
  const balanceBAfterSwap = balanceBAfterSwapRaw ? String(balanceBAfterSwapRaw) : '0';
  logInfo('Asset A After', balanceAAfterSwap);
  logInfo('Asset B After', balanceBAfterSwap);

  const assetASpent = BigInt(balanceABeforeSwap) - BigInt(balanceAAfterSwap);
  const assetBReceived = BigInt(balanceBAfterSwap) - BigInt(balanceBBeforeSwap);

  logInfo('Asset A Spent', assetASpent.toString());
  logInfo('Asset B Received', assetBReceived.toString());

  if (assetASpent === BigInt(swapAmountIn) && assetBReceived > 0n) {
    logSuccess('Swap executed successfully!');
  } else {
    logError('Swap verification failed!');
    throw new Error('Swap verification failed');
  }

  // ==================== Test 6: Swap Tokens for Exact Output ====================
  logSection('Test 6: Swap for Exact Output Amount');

  logStep('Recording balances before second swap');
  // Use on-chain query for consistency
  const balanceABeforeSwap2Raw = await merak.assets.balanceOf(assetA, accountAddress);
  const balanceBBeforeSwap2Raw = await merak.assets.balanceOf(assetB, accountAddress);
  const balanceABeforeSwap2 = balanceABeforeSwap2Raw ? String(balanceABeforeSwap2Raw) : '0';
  const balanceBBeforeSwap2 = balanceBBeforeSwap2Raw ? String(balanceBBeforeSwap2Raw) : '0';

  const exactAmountOut = '5000';
  const reversePath = [assetB, assetA]; // Reverse direction

  // Calculate required input
  const requiredAmountsIn = await merak.getAmountsIn(exactAmountOut, reversePath);
  // Extract from nested array: [[inputAmount, outputAmount]]
  const requiredInput = requiredAmountsIn && requiredAmountsIn[0] ? requiredAmountsIn[0][0] : '0';
  // Add 1% slippage tolerance
  const requiredInputBigInt = BigInt(requiredInput);
  const maxAmountIn = String((requiredInputBigInt * 101n) / 100n);

  logStep('Executing swap with exact output');
  logInfo('Amount Out', exactAmountOut);
  logInfo('Required Input', requiredInput);
  logInfo('Max Amount In', maxAmountIn);

  const swapTx2 = new Transaction();
  const swapRes2 = (await merak.swapTokensForExactTokens(
    swapTx2,
    exactAmountOut,
    maxAmountIn,
    reversePath,
    accountAddress
  )) as SuiTransactionBlockResponse;

  logSuccess('Swap transaction submitted');
  logInfo('Transaction Hash', swapRes2.digest);
  logInfo('Transaction Status', (swapRes2.effects?.status as any)?.status || 'unknown');

  // Check if transaction failed
  if ((swapRes2.effects?.status as any)?.status === 'failure') {
    logError('Transaction failed!');
    logInfo('Error', (swapRes2.effects?.status as any)?.error || 'Unknown error');
    throw new Error('Swap transaction failed');
  }

  await waitForTransaction(5);

  // Verify swap result using on-chain query
  logStep('Verifying swap result');
  const balanceAAfterSwap2Raw = await merak.assets.balanceOf(assetA, accountAddress);
  const balanceBAfterSwap2Raw = await merak.assets.balanceOf(assetB, accountAddress);
  const balanceAAfterSwap2 = balanceAAfterSwap2Raw ? String(balanceAAfterSwap2Raw) : '0';
  const balanceBAfterSwap2 = balanceBAfterSwap2Raw ? String(balanceBAfterSwap2Raw) : '0';

  const assetBSpent = BigInt(balanceBBeforeSwap2) - BigInt(balanceBAfterSwap2);
  const assetAReceived = BigInt(balanceAAfterSwap2) - BigInt(balanceABeforeSwap2);

  logInfo('Asset B Spent', assetBSpent.toString());
  logInfo('Asset A Received', assetAReceived.toString());

  if (assetAReceived === BigInt(exactAmountOut) && assetBSpent > 0n) {
    logSuccess('Exact output swap executed successfully!');
  } else {
    logError('Exact output swap verification failed!');
    throw new Error('Swap verification failed');
  }

  // ==================== Test 7: Remove Liquidity ====================
  logSection('Test 7: Remove Liquidity from Pool');

  // Remove a portion of liquidity
  // Use on-chain query for LP balance
  const currentLpBalanceRaw = await merak.assets.balanceOf(lpAssetId, accountAddress);
  const currentLpBalance = currentLpBalanceRaw ? String(currentLpBalanceRaw) : '0';
  const liquidityToRemove = String(BigInt(currentLpBalance) / 2n); // Remove 50%

  logStep('Preparing to remove liquidity');
  logInfo('Current LP Balance', currentLpBalance);
  logInfo('LP to Remove', liquidityToRemove);

  logStep('Recording balances before removal');
  // Use on-chain query for consistency
  const balanceABeforeRemoveRaw = await merak.assets.balanceOf(assetA, accountAddress);
  const balanceBBeforeRemoveRaw = await merak.assets.balanceOf(assetB, accountAddress);
  const balanceABeforeRemove = balanceABeforeRemoveRaw ? String(balanceABeforeRemoveRaw) : '0';
  const balanceBBeforeRemove = balanceBBeforeRemoveRaw ? String(balanceBBeforeRemoveRaw) : '0';

  const removeLiquidityTx = new Transaction();
  const minReceiveA = '1'; // Minimal amounts due to small liquidity
  const minReceiveB = '1';

  const removeLiquidityRes = (await merak.removeLiquidity(
    removeLiquidityTx,
    assetA,
    assetB,
    liquidityToRemove,
    minReceiveA,
    minReceiveB,
    accountAddress
  )) as SuiTransactionBlockResponse;

  logSuccess('Remove liquidity transaction submitted');
  logInfo('Transaction Hash', removeLiquidityRes.digest);
  logInfo('Transaction Status', (removeLiquidityRes.effects?.status as any)?.status || 'unknown');

  // Check if transaction failed
  if ((removeLiquidityRes.effects?.status as any)?.status === 'failure') {
    logError('Transaction failed!');
    logInfo('Error', (removeLiquidityRes.effects?.status as any)?.error || 'Unknown error');
    throw new Error('Remove liquidity transaction failed');
  }

  await waitForTransaction(5);

  // Verify liquidity removal using on-chain query
  logStep('Verifying liquidity removal');
  const balanceAAfterRemoveRaw = await merak.assets.balanceOf(assetA, accountAddress);
  const balanceBAfterRemoveRaw = await merak.assets.balanceOf(assetB, accountAddress);
  const balanceAAfterRemove = balanceAAfterRemoveRaw ? String(balanceAAfterRemoveRaw) : '0';
  const balanceBAfterRemove = balanceBAfterRemoveRaw ? String(balanceBAfterRemoveRaw) : '0';
  // Use on-chain query for LP balance
  const lpBalanceAfterRemoveRaw = await merak.assets.balanceOf(lpAssetId, accountAddress);
  const lpBalanceAfterRemove = lpBalanceAfterRemoveRaw ? String(lpBalanceAfterRemoveRaw) : '0';

  const assetARecovered = BigInt(balanceAAfterRemove) - BigInt(balanceABeforeRemove);
  const assetBRecovered = BigInt(balanceBAfterRemove) - BigInt(balanceBBeforeRemove);
  const lpBurned = BigInt(currentLpBalance) - BigInt(lpBalanceAfterRemove);

  logInfo('Asset A Recovered', assetARecovered.toString());
  logInfo('Asset B Recovered', assetBRecovered.toString());
  logInfo('LP Tokens Burned', lpBurned.toString());

  if (lpBurned === BigInt(liquidityToRemove) && assetARecovered > 0n && assetBRecovered > 0n) {
    logSuccess('Liquidity removed successfully!');
  } else {
    logError('Liquidity removal verification failed!');
    throw new Error('Liquidity removal verification failed');
  }

  // ==================== Test Summary ====================
  logSection('Test Summary');

  console.log('\n✅ All DEX tests passed!\n');
  console.log('Test Results:');
  console.log('  ✅ Test 1: Initial balance query - PASSED');
  console.log('  ✅ Test 2: Pool management - PASSED');
  console.log('  ✅ Test 3: Add liquidity - PASSED');
  console.log('  ✅ Test 4: Amount calculations - PASSED');
  console.log('  ✅ Test 5: Swap exact input - PASSED');
  console.log('  ✅ Test 6: Swap exact output - PASSED');
  console.log('  ✅ Test 7: Remove liquidity - PASSED');
  console.log('\nPool Information:');
  console.log(`  - Pool Address: ${poolInfo.poolAddress}`);
  console.log(`  - LP Asset: ${lpAssetId}`);
  console.log('\nTransactions:');
  // if (!poolExists) console.log(`  - Create Pool: ${createPoolRes.digest}`);
  console.log(`  - Add Liquidity: ${addLiquidityRes.digest}`);
  console.log(`  - Swap 1 (Exact In): ${swapRes1.digest}`);
  console.log(`  - Swap 2 (Exact Out): ${swapRes2.digest}`);
  console.log(`  - Remove Liquidity: ${removeLiquidityRes.digest}`);
}

// ==================== Error Handling ====================

process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled Promise rejection:', error);
  process.exit(1);
});

// ==================== Execution ====================

main().catch((error) => {
  console.error('\n❌ Test execution failed:', error.message);
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
});
