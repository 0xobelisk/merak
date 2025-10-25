/**
 * Complete Storage Query Methods Test Script
 *
 * Tests all methods in get-storage.ts and list-storage.ts
 *
 * Usage:
 * 1. Ensure contracts are deployed and test data exists
 * 2. Run: pnpm exec ts-node scripts/test-storage-queries.ts
 *
 * Notes:
 * - Modify TEST_CONFIG to configure test parameters
 * - Some methods require existing data to return results
 * - Empty results don't indicate errors, data may simply not exist
 */

import { NetworkType, SuiTransactionBlockResponse, Transaction } from '@0xobelisk/sui-client';
import dotenv from 'dotenv';
import { createMerak, TEST_CONFIG } from './test-helpers';

dotenv.config();

// ==================== Test Statistics ====================
const testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  empty: 0
};

// ==================== Helper Functions ====================

function logSection(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70));
}

function logMethod(methodName: string, description: string) {
  console.log(`\n📌 ${methodName}`);
  if (TEST_CONFIG.verbose) {
    console.log(`   ${description}`);
  }
}

function logResult(data: any, methodName: string) {
  testStats.total++;

  if (data === null || data === undefined) {
    testStats.empty++;
    if (TEST_CONFIG.showEmptyResults) {
      console.log(`   ⚠️  Empty return (null/undefined)`);
    }
    return;
  }

  // Check if result is paginated (Connection type)
  const isPaginated = data && typeof data === 'object' && 'edges' in data && 'pageInfo' in data;
  const resultData = isPaginated ? data.edges.map((edge: any) => edge.node) : data;

  // Check if empty
  const isEmpty =
    resultData === null ||
    resultData === undefined ||
    (Array.isArray(resultData) && resultData.length === 0) ||
    (typeof resultData === 'object' && Object.keys(resultData).length === 0);

  if (isEmpty) {
    testStats.empty++;
    if (TEST_CONFIG.showEmptyResults) {
      console.log(
        `   ⚠️  Empty return ${Array.isArray(resultData) ? '(empty array)' : '(empty object)'}`
      );
    }
    return;
  }

  testStats.passed++;

  if (!TEST_CONFIG.verbose) {
    console.log(`   ✅ Success`);
    if (isPaginated) {
      console.log(
        `      Data: ${resultData.length} items, Total: ${data.totalCount || 'N/A'}, Next page: ${
          data.pageInfo.hasNextPage ? 'Yes' : 'No'
        }`
      );
    } else if (Array.isArray(resultData)) {
      console.log(`      Returned: ${resultData.length} records`);
    } else {
      console.log(`      Returned: Single record`);
    }
    return;
  }

  // Verbose mode
  console.log(`   ✅ Success`);

  if (isPaginated) {
    console.log(`   Pagination info:`);
    console.log(`      - Data count: ${resultData.length}`);
    console.log(`      - Total: ${data.totalCount || 'N/A'}`);
    console.log(`      - Has next page: ${data.pageInfo.hasNextPage ? 'Yes' : 'No'}`);
    if (data.pageInfo.endCursor) {
      console.log(`      - Next page cursor: ${data.pageInfo.endCursor.substring(0, 20)}...`);
    }
  }

  // Display data preview
  const displayData = Array.isArray(resultData) ? resultData[0] : resultData;
  if (displayData) {
    console.log(`   Data preview:`);
    const preview = JSON.stringify(displayData, null, 2);
    const lines = preview.split('\n').slice(0, 15);
    console.log(lines.map((l) => `      ${l}`).join('\n'));
    if (preview.split('\n').length > 15) {
      console.log(`      ... (truncated)`);
    }
    if (Array.isArray(resultData) && resultData.length > 1) {
      console.log(`   ... and ${resultData.length - 1} more records`);
    }
  }
}

function logError(error: any, methodName: string) {
  testStats.total++;
  testStats.failed++;
  console.error(`   ❌ Error: ${error.message || error}`);
  if (TEST_CONFIG.verbose && error.stack) {
    console.error(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n   ')}`);
  }
}

async function safeExecute<T>(
  fn: () => Promise<T>,
  methodName: string,
  description: string
): Promise<T | null> {
  logMethod(methodName, description);
  try {
    const result = await fn();
    logResult(result, methodName);
    return result;
  } catch (error) {
    logError(error, methodName);
    return null;
  }
}

// ==================== Main Test Function ====================

async function main() {
  console.log('🚀 Starting Storage query methods test...');
  console.log(`📡 Network: ${TEST_CONFIG.network}`);

  // Initialize Merak (no private key needed, query only)
  const merak = createMerak({
    networkType: TEST_CONFIG.network,
    secretKey: process.env.PRIVATE_KEY
  });

  console.log('✅ 4. Merak instance created successfully');
  console.log(`   Package ID: ${merak.packageId}`);
  console.log(`   Schema ID: ${merak.schemaId}`);

  const accountAddress = merak.dubhe.currentAddress();
  console.log('Account Address:', accountAddress);

  const balance = await merak.dubhe.balanceOf();
  console.log('Balance:', balance);

  const assetBalance = await merak.assets.balanceOf(TEST_CONFIG.testAssetId);
  console.log('Asset Balance:', assetBalance);

  const assetBalance2 = await merak.assets.balanceOf(TEST_CONFIG.testAssetId2);
  console.log('Asset Balance 2:', assetBalance2);

  const account = await merak.balanceOf(
    TEST_CONFIG.testAssetId
    // '0x62dc79e388dfa16f3b02d974108a6ccd189b72a267667818ae69d1a816e3b6b6'
  );
  console.log('Account balanceOf with merak:', account);
  const account2 = await merak.balanceOf(
    TEST_CONFIG.testAssetId2
    // '0x62dc79e388dfa16f3b02d974108a6ccd189b72a267667818ae69d1a816e3b6b6'
  );
  console.log('Account 2 balanceOf with merak:', account2);

  const tx = new Transaction();

  const amountToWrap = 0.0001;
  const suiDecimals = 9;

  const amountInSmallestUnit = Math.floor(amountToWrap * 10 ** suiDecimals);

  // Ensure sufficient tokens are selected
  const selectCoins = await merak.dubhe.selectCoinsWithAmount(
    amountInSmallestUnit,
    '0x2::sui::SUI',
    accountAddress
  );

  if (!selectCoins || selectCoins.length === 0) {
    throw new Error('Unable to select sufficient tokens');
  }
  console.log('Select Coins:', selectCoins);

  // Use tx.gas for SUI tokens, otherwise use selected tokens
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInSmallestUnit)]);
  // const [coin] = sourceToken.includes('0x2::sui::SUI')
  // ?
  // : tx.splitCoins(tx.object(selectCoins[0]), [tx.pure.u64(amountInSmallestUnit)]);

  // Use processed token format
  const res = (await merak.wrap(
    tx,
    coin,
    accountAddress,
    '0x2::sui::SUI'
  )) as SuiTransactionBlockResponse;

  console.log('Res:', res.digest);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const account3 = await merak.balanceOf(
    TEST_CONFIG.testAssetId2
    // '0x62dc79e388dfa16f3b02d974108a6ccd189b72a267667818ae69d1a816e3b6b6'
  );
  console.log('Account 3 balanceOf with merak:', account3);
}

main();
