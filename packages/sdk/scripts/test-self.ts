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

import { NetworkType } from '@0xobelisk/sui-client';
import dotenv from 'dotenv';
import { createMerak } from './test-helpers';

dotenv.config();

// ==================== Configuration ====================
const TEST_CONFIG = {
  // Network configuration
  network: 'testnet' as NetworkType,

  // Test asset IDs
  testAssetId: '0x357cb71d44a3fe292623a589e44f6a4f704d39d64a916bde9f81b78ce7ffac5c',
  testAssetId2: '0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6',

  // Test account address
  testAccount: '0x1fe342c436eff7ed90988fbe3a85aea7d922517ab6d9bc86e800025f8afcba7a',

  // Test Coin Type
  testCoinType: '0x2::sui::SUI',

  // Test Dapp Key (if any)
  testDappKey:
    'a09cd4137e604ec5a7a88f72c572ecd064b0e713a3fbf705a88456cdbccf36c0::dapp_key::DappKey',

  // Pagination parameters
  pageSize: 5,

  // Whether to show detailed output
  verbose: true,

  // Whether to show empty results
  showEmptyResults: false
};

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
    networkType: TEST_CONFIG.network
  });

  console.log('✅ Merak instance created successfully');
  console.log(`   Package ID: ${merak.packageId}`);
  console.log(`   Schema ID: ${merak.schemaId}`);

  const pool = await merak.getPoolListWithId({
    asset1Id: TEST_CONFIG.testAssetId,
    asset2Id: TEST_CONFIG.testAssetId2
  });

  console.log('Pool:', pool);

  const allPoolList = await merak.allPoolList({
    asset1Id: TEST_CONFIG.testAssetId
  });

  console.log('All Pool List:', allPoolList);
}

// ==================== Error Handling ====================

process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled Promise rejection:', error);
  process.exit(1);
});

// ==================== Execution ====================

main().catch((error) => {
  console.error('\n❌ Test script execution failed:', error);
  process.exit(1);
});
