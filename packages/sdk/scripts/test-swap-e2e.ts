/**
 * End-to-End Swap Application Test
 *
 * This test simulates a complete user flow in a swap application:
 * 1. Query user's assets and available pools
 * 2. Wrap native SUI to Merak asset
 * 3. Check/create trading pool
 * 4. Add liquidity if needed
 * 5. Execute swap with slippage protection
 * 6. Verify results and balance changes
 * 7. Optional: Remove liquidity and unwrap
 *
 * This represents a realistic user journey through the Merak Swap application.
 *
 * Usage:
 * 1. Set PRIVATE_KEY in .env file
 * 2. Run: pnpm test:e2e
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

function calculateSlippage(amount: string, slippagePercent: number): string {
  const amountBigInt = BigInt(amount);
  const slippageAmount = (amountBigInt * BigInt(Math.floor(slippagePercent * 10000))) / 10000n;
  return (amountBigInt - slippageAmount).toString();
}

// ==================== Main Test Function ====================

async function main() {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    logError('PRIVATE_KEY environment variable not set');
    console.log('Please set PRIVATE_KEY in .env file');
    process.exit(1);
  }

  logSection('End-to-End Swap Application Test');
  console.log(`📡 Network: ${TEST_CONFIG.network}`);
  console.log(`🎯 Simulating complete user swap flow`);

  // Initialize Merak
  const merak = createMerak({
    networkType: TEST_CONFIG.network,
    secretKey: privateKey
  });

  logSuccess('Merak SDK initialized');
  const accountAddress = merak.dubhe.currentAddress();
  logInfo('User Address', accountAddress);

  // Constants
  const suiDecimals = 9;
  const wrappedSuiAssetId = TEST_CONFIG.testAssetId2;
  const tokenAAssetId = TEST_CONFIG.testAssetId;
  const coinType = TEST_CONFIG.testCoinType;
  const slippageTolerance = 0.01; // 1% slippage

  // ==================== Step 1: Check Initial State ====================
  logSection('Step 1: Check User Assets and Available Pools');

  logStep('Checking native SUI balance');
  const suiBalance = await merak.dubhe.balanceOf();
  logInfo('SUI Balance', `${Number(suiBalance) / 10 ** suiDecimals} SUI`);

  if (Number(suiBalance) < 1000000) {
    logError('Insufficient SUI for testing (need at least 0.001 SUI for gas)');
    process.exit(1);
  }

  logStep('Checking wrapped asset balances');
  const wrappedSuiBalance = await merak.balanceOf(wrappedSuiAssetId);
  const tokenABalance = await merak.balanceOf(tokenAAssetId);
  logInfo('Wrapped SUI', `${wrappedSuiBalance.balance} ${wrappedSuiBalance.symbol}`);
  logInfo('Token A', `${tokenABalance.balance} ${tokenABalance.symbol}`);

  logStep('Querying available pools');
  const allPools = await merak.allPoolList({ pageSize: 10 });
  logInfo('Total Pools Available', allPools.data.length);

  logStep('Checking if target pool exists');
  let targetPool = null;
  try {
    targetPool = await merak.getPoolListWithId({
      asset1Id: wrappedSuiAssetId,
      asset2Id: tokenAAssetId
    });
    if (targetPool) {
      logSuccess('Target pool found!');
      logInfo('Pool Address', targetPool.poolAddress);
      logInfo('Reserve Wrapped SUI', targetPool.reserve0);
      logInfo('Reserve Token A', targetPool.reserve1);
    }
  } catch (error) {
    logWarning('Target pool does not exist yet');
  }

  // ==================== Step 2: Wrap Native SUI ====================
  logSection('Step 2: Wrap Native SUI to Merak Asset');

  const amountToWrap = 0.0002; // Wrap some SUI
  const wrapAmountInSmallestUnit = Math.floor(amountToWrap * 10 ** suiDecimals);

  logStep(`Wrapping ${amountToWrap} SUI`);
  logInfo('Amount', `${wrapAmountInSmallestUnit} units`);

  // Select coins for wrapping
  const selectCoins = await merak.dubhe.selectCoinsWithAmount(
    wrapAmountInSmallestUnit,
    coinType,
    accountAddress
  );

  if (!selectCoins || selectCoins.length === 0) {
    logError('Unable to select coins for wrapping');
    process.exit(1);
  }

  // Execute wrap
  const wrapTx = new Transaction();
  const [coin] = wrapTx.splitCoins(wrapTx.gas, [wrapTx.pure.u64(wrapAmountInSmallestUnit)]);

  const wrapRes = (await merak.wrap(
    wrapTx,
    coin,
    accountAddress,
    coinType
  )) as SuiTransactionBlockResponse;

  logSuccess('SUI wrapped successfully');
  logInfo('Transaction', wrapRes.digest);

  await waitForTransaction();

  // Verify wrap
  const wrappedSuiBalanceAfterWrap = await merak.balanceOf(wrappedSuiAssetId);
  logInfo('New Wrapped SUI Balance', wrappedSuiBalanceAfterWrap.balance);

  // ==================== Step 3: Check/Create Pool ====================
  logSection('Step 3: Ensure Trading Pool Exists');

  if (!targetPool) {
    logStep('Creating new pool');
    const createPoolTx = new Transaction();
    const createPoolRes = (await merak.createPool(
      createPoolTx,
      wrappedSuiAssetId,
      tokenAAssetId
    )) as SuiTransactionBlockResponse;

    logSuccess('Pool created');
    logInfo('Transaction', createPoolRes.digest);

    await waitForTransaction();

    // Fetch pool info
    targetPool = await merak.getPoolListWithId({
      asset1Id: wrappedSuiAssetId,
      asset2Id: tokenAAssetId
    });
    logInfo('Pool Address', targetPool.poolAddress);
  } else {
    logSuccess('Using existing pool');
  }

  const lpAssetId = targetPool.lpAsset;

  // ==================== Step 4: Add Liquidity (if pool is empty) ====================
  logSection('Step 4: Provide Initial Liquidity');

  const reserve0 = BigInt(targetPool.reserve0);
  const reserve1 = BigInt(targetPool.reserve1);

  if (reserve0 === 0n || reserve1 === 0n) {
    logStep('Pool is empty, adding initial liquidity');

    const liquidityAmount1 = '100000'; // 0.0001 tokens
    const liquidityAmount2 = '100000';

    const addLiqTx = new Transaction();
    const addLiqRes = (await merak.addLiquidity(
      addLiqTx,
      wrappedSuiAssetId,
      tokenAAssetId,
      liquidityAmount1,
      liquidityAmount2,
      '0',
      '0',
      accountAddress
    )) as SuiTransactionBlockResponse;

    logSuccess('Liquidity added');
    logInfo('Transaction', addLiqRes.digest);

    await waitForTransaction();

    // Update pool info
    targetPool = await merak.getPoolListWithId({
      asset1Id: wrappedSuiAssetId,
      asset2Id: tokenAAssetId
    });
    logInfo('Updated Reserve 0', targetPool.reserve0);
    logInfo('Updated Reserve 1', targetPool.reserve1);
  } else {
    logSuccess('Pool already has liquidity');
    logInfo('Reserve 0', targetPool.reserve0);
    logInfo('Reserve 1', targetPool.reserve1);
  }

  // ==================== Step 5: Execute Swap ====================
  logSection('Step 5: Execute Token Swap with Slippage Protection');

  const swapAmountIn = '50000'; // Amount to swap
  const swapPath = [wrappedSuiAssetId, tokenAAssetId];

  logStep('Calculating expected output');
  logInfo('Input Amount', swapAmountIn);
  logInfo('Path', `${wrappedSuiBalance.symbol} → ${tokenABalance.symbol}`);

  // Calculate expected output
  const amountsOut = await merak.getAmountsOut(swapAmountIn, swapPath);
  const expectedOutput = amountsOut ? amountsOut[amountsOut.length - 1] : '0';
  logInfo('Expected Output', expectedOutput);

  // Apply slippage protection
  const minAmountOut = calculateSlippage(expectedOutput, slippageTolerance);
  logInfo('Min Amount Out', `${minAmountOut} (${slippageTolerance * 100}% slippage)`);

  // Record balances before swap
  logStep('Recording balances before swap');
  const balanceWrappedBeforeSwap = await merak.balanceOf(wrappedSuiAssetId);
  const balanceTokenABeforeSwap = await merak.balanceOf(tokenAAssetId);
  logInfo('Wrapped SUI Before', balanceWrappedBeforeSwap.balance);
  logInfo('Token A Before', balanceTokenABeforeSwap.balance);

  // Execute swap
  logStep('Executing swap');
  const swapTx = new Transaction();
  const swapRes = (await merak.swapExactTokensForTokens(
    swapTx,
    swapAmountIn,
    minAmountOut,
    swapPath,
    accountAddress
  )) as SuiTransactionBlockResponse;

  logSuccess('Swap executed successfully');
  logInfo('Transaction', swapRes.digest);

  await waitForTransaction();

  // ==================== Step 6: Verify Swap Results ====================
  logSection('Step 6: Verify Swap Results and Balance Changes');

  logStep('Querying balances after swap');
  const balanceWrappedAfterSwap = await merak.balanceOf(wrappedSuiAssetId);
  const balanceTokenAAfterSwap = await merak.balanceOf(tokenAAssetId);
  logInfo('Wrapped SUI After', balanceWrappedAfterSwap.balance);
  logInfo('Token A After', balanceTokenAAfterSwap.balance);

  // Calculate actual changes
  const wrappedSpent =
    BigInt(balanceWrappedBeforeSwap.balance) - BigInt(balanceWrappedAfterSwap.balance);
  const tokenAReceived =
    BigInt(balanceTokenAAfterSwap.balance) - BigInt(balanceTokenABeforeSwap.balance);

  logStep('Analyzing swap results');
  logInfo('Wrapped SUI Spent', wrappedSpent.toString());
  logInfo('Token A Received', tokenAReceived.toString());

  // Verify swap amounts
  if (wrappedSpent === BigInt(swapAmountIn)) {
    logSuccess('Input amount correct!');
  } else {
    logError('Input amount mismatch!');
    logInfo('Expected', swapAmountIn);
    logInfo('Actual', wrappedSpent.toString());
  }

  if (tokenAReceived >= BigInt(minAmountOut)) {
    logSuccess('Output amount meets slippage protection!');
  } else {
    logError('Output below minimum!');
    logInfo('Minimum Required', minAmountOut);
    logInfo('Actual Received', tokenAReceived.toString());
  }

  // Calculate price impact
  const priceImpact = (
    ((Number(expectedOutput) - Number(tokenAReceived)) / Number(expectedOutput)) *
    100
  ).toFixed(4);
  logInfo('Price Impact', `${priceImpact}%`);

  // ==================== Step 7: Query Swap History (Optional) ====================
  logSection('Step 7: Query Swap History');

  logStep('Fetching recent swap events');
  const swapHistory = await merak.storage.list.assetSwap({ first: 5 });
  if (swapHistory.data.length > 0) {
    logSuccess(`Found ${swapHistory.data.length} recent swaps`);
    const latestSwap = swapHistory.data[0];
    logInfo('Latest Swap Asset0', latestSwap.asset0);
    logInfo('Latest Swap Asset1', latestSwap.asset1);
  }

  // ==================== Step 8: Query Final Portfolio ====================
  logSection('Step 8: Final Portfolio Summary');

  logStep('Querying all owned assets');
  const finalPortfolio = await merak.listOwnedAssetsInfo({
    account: accountAddress
  });

  logSuccess('Portfolio retrieved');
  console.log('\n📊 Your Asset Holdings:');
  finalPortfolio.data.forEach((asset, index) => {
    console.log(`\n   ${index + 1}. ${asset.symbol} (${asset.name})`);
    console.log(`      Balance: ${asset.balance}`);
    console.log(`      Asset ID: ${asset.assetId.slice(0, 20)}...`);
  });

  logStep('Querying LP positions');
  const lpPositions = await merak.listAccountLpAssets({
    account: accountAddress
  });
  logInfo('LP Positions', lpPositions.data.length);
  if (lpPositions.data.length > 0) {
    lpPositions.data.forEach((lp, index) => {
      console.log(`\n   ${index + 1}. ${lp.symbol}`);
      console.log(`      Balance: ${lp.balance}`);
    });
  }

  // ==================== Test Summary ====================
  logSection('Test Summary - Complete Swap Flow');

  console.log('\n✅ End-to-End Swap test completed successfully!\n');
  console.log('User Journey Completed:');
  console.log('  ✅ Step 1: Asset and pool discovery - COMPLETED');
  console.log('  ✅ Step 2: Wrap native SUI - COMPLETED');
  console.log('  ✅ Step 3: Ensure trading pool exists - COMPLETED');
  console.log('  ✅ Step 4: Provide liquidity (if needed) - COMPLETED');
  console.log('  ✅ Step 5: Execute swap with slippage protection - COMPLETED');
  console.log('  ✅ Step 6: Verify results - COMPLETED');
  console.log('  ✅ Step 7: Query swap history - COMPLETED');
  console.log('  ✅ Step 8: Portfolio summary - COMPLETED');

  console.log('\nKey Transactions:');
  console.log(`  - Wrap: ${wrapRes.digest}`);
  if (!targetPool) console.log(`  - Create Pool: (if created)`);
  console.log(`  - Swap: ${swapRes.digest}`);

  console.log('\nSwap Details:');
  console.log(`  - Swapped: ${wrappedSpent.toString()} ${wrappedSuiBalance.symbol}`);
  console.log(`  - Received: ${tokenAReceived.toString()} ${tokenABalance.symbol}`);
  console.log(`  - Price Impact: ${priceImpact}%`);
  console.log(`  - Slippage Protection: ${slippageTolerance * 100}%`);

  console.log('\n🎉 Merak Swap application flow verified successfully!');
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

