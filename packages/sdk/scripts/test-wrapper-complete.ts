/**
 * Complete Wrapper System Test
 *
 * This test covers the full wrapper functionality:
 * - Wrapping native SUI tokens to Merak assets
 * - Unwrapping Merak assets back to native SUI
 * - Balance verification at each step
 *
 * Usage:
 * 1. Set PRIVATE_KEY in .env file
 * 2. Run: pnpm test:wrapper
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

  logSection('Wrapper System Complete Test');
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

  // Test configuration
  const suiDecimals = 9;
  const wrappedSuiAssetId = TEST_CONFIG.testAssetId2; // Wrapped SUI asset
  const coinType = TEST_CONFIG.testCoinType; // 0x2::sui::SUI

  // ==================== Test 1: Query Initial Balances ====================
  logSection('Test 1: Query Initial Balances');

  logStep('Querying native SUI balance');
  const initialSuiBalance = await merak.dubhe.balanceOf();
  logInfo('SUI Balance', `${Number(initialSuiBalance.totalBalance) / 10 ** suiDecimals} SUI`);

  logStep('Querying wrapped SUI balance');
  const initialWrappedBalance = await merak.balanceOf(wrappedSuiAssetId);
  logInfo('Wrapped SUI Balance', initialWrappedBalance.balance);

  // ==================== Test 2: Wrap SUI ====================
  logSection('Test 2: Wrap SUI to Merak Asset');

  const amountToWrap = 0.0001; // Small amount to save gas
  const amountInSmallestUnit = Math.floor(amountToWrap * 10 ** suiDecimals);

  logStep(`Preparing to wrap ${amountToWrap} SUI`);
  logInfo('Amount (smallest unit)', amountInSmallestUnit);

  // Check if we have enough SUI
  if (Number(initialSuiBalance) < amountInSmallestUnit * 2) {
    logError('Insufficient SUI balance for test');
    logInfo('Required', `${(amountInSmallestUnit * 2) / 10 ** suiDecimals} SUI (including gas)`);
    logInfo('Current', `${Number(initialSuiBalance) / 10 ** suiDecimals} SUI`);
    process.exit(1);
  }

  logStep('Selecting coins for wrap operation');
  const selectCoins = await merak.dubhe.selectCoinsWithAmount(
    amountInSmallestUnit,
    coinType,
    accountAddress
  );

  if (!selectCoins || selectCoins.length === 0) {
    logError('Unable to select sufficient coins');
    process.exit(1);
  }
  logInfo('Selected Coins', selectCoins.length);

  logStep('Building wrap transaction');
  const wrapTx = new Transaction();
  const [coin] = wrapTx.splitCoins(wrapTx.gas, [wrapTx.pure.u64(amountInSmallestUnit)]);

  logStep('Executing wrap transaction');
  const wrapRes = (await merak.wrap(
    wrapTx,
    coin,
    accountAddress,
    coinType
  )) as SuiTransactionBlockResponse;

  logSuccess('Wrap transaction submitted');
  logInfo('Transaction Hash', wrapRes.digest);

  await waitForTransaction();

  // Verify wrap result
  logStep('Verifying wrap result');
  const balanceAfterWrap = await merak.balanceOf(wrappedSuiAssetId);
  logInfo('New Wrapped SUI Balance', balanceAfterWrap.balance);

  const expectedIncrease = BigInt(amountInSmallestUnit);
  const actualIncrease = BigInt(balanceAfterWrap.balance) - BigInt(initialWrappedBalance.balance);

  if (actualIncrease === expectedIncrease) {
    logSuccess(`Wrap successful! Balance increased by ${actualIncrease.toString()}`);
    logInfo('Expected', expectedIncrease.toString());
    logInfo('Actual', actualIncrease.toString());
  } else {
    logError('Wrap verification failed!');
    logInfo('Expected Increase', expectedIncrease.toString());
    logInfo('Actual Increase', actualIncrease.toString());
    throw new Error('Wrap verification failed');
  }

  // ==================== Test 3: Unwrap Back to SUI ====================
  logSection('Test 3: Unwrap Merak Asset to SUI');

  const amountToUnwrap = 0.00005; // Smaller amount
  const unwrapAmountInSmallestUnit = BigInt(Math.floor(amountToUnwrap * Math.pow(10, suiDecimals)));

  logStep(`Preparing to unwrap ${amountToUnwrap} wrapped SUI`);
  logInfo('Amount (smallest unit)', unwrapAmountInSmallestUnit.toString());

  // Check if we have enough wrapped SUI
  if (BigInt(balanceAfterWrap.balance) < unwrapAmountInSmallestUnit) {
    logError('Insufficient wrapped SUI balance for unwrap test');
    logInfo('Required', unwrapAmountInSmallestUnit.toString());
    logInfo('Current', balanceAfterWrap.balance);
    process.exit(1);
  }

  logStep('Building unwrap transaction');
  const unwrapTx = new Transaction();

  logStep('Executing unwrap transaction');
  const unwrapRes = (await merak.unwrap(
    unwrapTx,
    unwrapAmountInSmallestUnit,
    accountAddress,
    coinType
  )) as SuiTransactionBlockResponse;

  logSuccess('Unwrap transaction submitted');
  logInfo('Transaction Hash', unwrapRes.digest);

  await waitForTransaction();

  // Verify unwrap result
  logStep('Verifying unwrap result');
  const balanceAfterUnwrap = await merak.balanceOf(wrappedSuiAssetId);
  logInfo('New Wrapped SUI Balance', balanceAfterUnwrap.balance);

  const expectedDecrease = unwrapAmountInSmallestUnit;
  const actualDecrease = BigInt(balanceAfterWrap.balance) - BigInt(balanceAfterUnwrap.balance);

  if (actualDecrease === expectedDecrease) {
    logSuccess(`Unwrap successful! Balance decreased by ${actualDecrease.toString()}`);
    logInfo('Expected', expectedDecrease.toString());
    logInfo('Actual', actualDecrease.toString());
  } else {
    logError('Unwrap verification failed!');
    logInfo('Expected Decrease', expectedDecrease.toString());
    logInfo('Actual Decrease', actualDecrease.toString());
    throw new Error('Unwrap verification failed');
  }

  // ==================== Test 4: Final Balance Check ====================
  logSection('Test 4: Final Balance Verification');

  logStep('Querying final balances');
  const finalWrappedBalance = await merak.balanceOf(wrappedSuiAssetId);
  const finalSuiBalance = await merak.dubhe.balanceOf();

  logInfo('Final Wrapped SUI', finalWrappedBalance.balance);
  logInfo('Final SUI', `${Number(finalSuiBalance) / 10 ** suiDecimals} SUI`);

  // Calculate net changes
  const netWrappedChange =
    BigInt(finalWrappedBalance.balance) - BigInt(initialWrappedBalance.balance);
  const expectedNetChange = expectedIncrease - expectedDecrease;

  logStep('Verifying net balance changes');
  logInfo('Initial Wrapped', initialWrappedBalance.balance);
  logInfo('Final Wrapped', finalWrappedBalance.balance);
  logInfo('Net Change', netWrappedChange.toString());
  logInfo('Expected Net Change', expectedNetChange.toString());

  if (netWrappedChange === expectedNetChange) {
    logSuccess('Net balance change matches expected value!');
  } else {
    logError('Net balance change mismatch!');
    throw new Error('Balance verification failed');
  }

  // ==================== Test Summary ====================
  logSection('Test Summary');

  console.log('\n✅ All Wrapper tests passed!\n');
  console.log('Test Results:');
  console.log('  ✅ Test 1: Initial balance query - PASSED');
  console.log('  ✅ Test 2: Wrap SUI to Merak asset - PASSED');
  console.log('  ✅ Test 3: Unwrap Merak asset to SUI - PASSED');
  console.log('  ✅ Test 4: Final balance verification - PASSED');
  console.log('\nTransactions:');
  console.log(`  - Wrap: ${wrapRes.digest}`);
  console.log(`  - Unwrap: ${unwrapRes.digest}`);
  console.log('\nBalance Changes:');
  console.log(`  - Wrapped: ${netWrappedChange.toString()} units`);
  console.log(`  - Expected: ${expectedNetChange.toString()} units`);
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
