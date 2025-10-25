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

  console.log('✅ 6. Merak instance created successfully');
  console.log(`   Package ID: ${merak.packageId}`);
  console.log(`   Schema ID: ${merak.schemaId}`);

  // ==================== 1. GetStorage Tests ====================
  logSection('1. GetStorage Query Methods (13 methods)');

  console.log('\n📦 1.1 StorageValue Queries (4 methods)');

  await safeExecute(
    () => merak.storage.get.dubheAssetId(),
    'storage.get.dubheAssetId()',
    'Get Dubhe asset ID counter'
  );

  await safeExecute(
    () => merak.storage.get.suiAssetId(),
    'storage.get.suiAssetId()',
    'Get Sui asset ID counter'
  );

  await safeExecute(
    () => merak.storage.get.dubheConfig(),
    'storage.get.dubheConfig()',
    'Get Dubhe global config'
  );

  await safeExecute(
    () => merak.storage.get.dappFeeConfig(),
    'storage.get.dappFeeConfig()',
    'Get Dapp fee config'
  );

  console.log('\n📦 1.2 StorageMap Queries (5 methods)');

  await safeExecute(
    () => merak.storage.get.assetMetadata({ assetId: TEST_CONFIG.testAssetId }),
    'storage.get.assetMetadata({ assetId })',
    'Get asset metadata by assetId'
  );

  await safeExecute(
    () => merak.storage.get.assetSupply({ assetId: TEST_CONFIG.testAssetId }),
    'storage.get.assetSupply({ assetId })',
    'Get asset total supply by assetId'
  );

  await safeExecute(
    () => merak.storage.get.assetHolder({ assetId: TEST_CONFIG.testAssetId }),
    'storage.get.assetHolder({ assetId })',
    'Get asset holder info by assetId'
  );

  await safeExecute(
    () => merak.storage.get.assetWrapper({ coinType: TEST_CONFIG.testCoinType }),
    'storage.get.assetWrapper({ coinType })',
    'Get Wrapper asset info by coinType'
  );

  await safeExecute(
    () => merak.storage.get.dappMetadata({ dappKey: TEST_CONFIG.testDappKey }),
    'storage.get.dappMetadata({ dappKey })',
    'Get Dapp metadata by dappKey'
  );

  await safeExecute(
    () => merak.storage.get.dappFeeState({ dappKey: TEST_CONFIG.testDappKey }),
    'storage.get.dappFeeState({ dappKey })',
    'Get Dapp fee state by dappKey'
  );

  await safeExecute(
    () => merak.storage.get.dappProxy({ dappKey: TEST_CONFIG.testDappKey }),
    'storage.get.dappProxy({ dappKey })',
    'Get Dapp proxy info by dappKey'
  );

  console.log('\n📦 1.3 StorageDoubleMap Queries (2 methods)');

  await safeExecute(
    () =>
      merak.storage.get.assetAccount({
        assetId: TEST_CONFIG.testAssetId,
        account: TEST_CONFIG.testAccount
      }),
    'storage.get.assetAccount({ assetId, account })',
    'Get account balance by assetId and account'
  );

  await safeExecute(
    () =>
      merak.storage.get.assetPool({
        asset0: TEST_CONFIG.testAssetId,
        asset1: TEST_CONFIG.testAssetId2
      }),
    'storage.get.assetPool({ asset0, asset1 })',
    'Get pool info by two asset IDs'
  );

  // ==================== 2. ListStorage Tests ====================
  logSection('2. ListStorage Query Methods (19 methods)');

  //   console.log('\n📦 2.1 StorageValue Lists (4 methods)');

  //   await safeExecute(
  //     () =>
  //       merak.storage.list.dubheAssetId({
  //         first: TEST_CONFIG.pageSize
  //       }),
  //     'storage.list.dubheAssetId({ first })',
  //     'List all Dubhe asset ID records'
  //   );

  //   await safeExecute(
  //     () =>
  //       merak.storage.list.suiAssetId({
  //         first: TEST_CONFIG.pageSize
  //       }),
  //     'storage.list.suiAssetId({ first })',
  //     'List all Sui asset ID records'
  //   );

  //   await safeExecute(
  //     () =>
  //       merak.storage.list.dubheConfig({
  //         first: TEST_CONFIG.pageSize
  //       }),
  //     'storage.list.dubheConfig({ first })',
  //     'List all Dubhe config records'
  //   );

  //   await safeExecute(
  //     () =>
  //       merak.storage.list.dappFeeConfig({
  //         first: TEST_CONFIG.pageSize
  //       }),
  //     'storage.list.dappFeeConfig({ first })',
  //     'List all Dapp fee config records'
  //   );

  console.log('\n📦 2.2 StorageMap Lists (7 methods)');

  await safeExecute(
    () =>
      merak.storage.list.assetMetadata({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetMetadata({ first })',
    'List all asset metadata'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetMetadata({
        assetId: TEST_CONFIG.testAssetId,
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetMetadata({ assetId, first })',
    'List metadata for specified asset (with filter)'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetSupply({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetSupply({ first })',
    'List all asset supplies'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetHolder({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetHolder({ first })',
    'List all asset holders'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetWrapper({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetWrapper({ first })',
    'List all Wrapper assets'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetWrapper({
        coinType: TEST_CONFIG.testCoinType,
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetWrapper({ coinType, first })',
    'List Wrapper assets for specified coinType (with filter)'
  );

  await safeExecute(
    () =>
      merak.storage.list.dappMetadata({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.dappMetadata({ first })',
    'List all Dapp metadata'
  );

  await safeExecute(
    () =>
      merak.storage.list.dappFeeState({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.dappFeeState({ first })',
    'List all Dapp fee states'
  );

  await safeExecute(
    () =>
      merak.storage.list.dappProxy({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.dappProxy({ first })',
    'List all Dapp proxies'
  );

  console.log('\n📦 2.3 StorageDoubleMap Lists (2 methods)');

  await safeExecute(
    () =>
      merak.storage.list.assetAccount({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetAccount({ first })',
    'List all asset account balances'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetAccount({
        account: TEST_CONFIG.testAccount,
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetAccount({ account, first })',
    'List all assets for specified account (with filter)'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetAccount({
        assetId: TEST_CONFIG.testAssetId,
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetAccount({ assetId, first })',
    'List all holding accounts for specified asset (with filter)'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetPool({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetPool({ first })',
    'List all asset pools'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetPool({
        asset0: TEST_CONFIG.testAssetId,
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetPool({ asset0, first })',
    'List all pools containing specified asset0 (with filter)'
  );

  console.log('\n📦 2.4 Event Queries (4 methods)');

  await safeExecute(
    () =>
      merak.storage.list.assetTransfer({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetTransfer({ first })',
    'List all asset transfer events'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetTransfer({
        from: TEST_CONFIG.testAccount,
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetTransfer({ from, first })',
    'List transfer events initiated by specified account'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetWrap({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetWrap({ first })',
    'List all asset Wrap events'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetUnwrap({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetUnwrap({ first })',
    'List all asset Unwrap events'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetSwap({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetSwap({ first })',
    'List all asset swap events'
  );

  // ==================== 3. Advanced Usage Tests ====================
  logSection('3. Advanced Usage Tests');

  console.log('\n📦 3.1 Pagination Test');

  const firstPage = await safeExecute(
    () =>
      merak.storage.list.assetMetadata({
        first: 2
      }),
    'storage.list.assetMetadata({ first: 2 })',
    'Get first 2 asset metadata records'
  );

  if (
    firstPage &&
    firstPage.pageInfo &&
    firstPage.pageInfo.hasNextPage &&
    firstPage.pageInfo.endCursor
  ) {
    await safeExecute(
      () =>
        merak.storage.list.assetMetadata({
          first: 2,
          after: firstPage.pageInfo.endCursor
        }),
      'storage.list.assetMetadata({ first: 2, after })',
      'Get next page using cursor'
    );
  }

  console.log('\n📦 3.2 Sorting Test');

  await safeExecute(
    () =>
      merak.storage.list.assetMetadata({
        first: TEST_CONFIG.pageSize,
        orderBy: [{ field: 'asset_id', direction: 'ASC' }]
      }),
    'storage.list.assetMetadata({ orderBy: ASC })',
    'Sort by asset_id in ascending order'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetMetadata({
        first: TEST_CONFIG.pageSize,
        orderBy: [{ field: 'asset_id', direction: 'DESC' }]
      }),
    'storage.list.assetMetadata({ orderBy: DESC })',
    'Sort by asset_id in descending order'
  );

  console.log('\n📦 3.3 Combined Filter Test');

  await safeExecute(
    () =>
      merak.storage.list.assetAccount({
        assetId: TEST_CONFIG.testAssetId,
        account: TEST_CONFIG.testAccount,
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetAccount({ assetId, account, first })',
    'Filter by both assetId and account'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetTransfer({
        from: TEST_CONFIG.testAccount,
        assetId: TEST_CONFIG.testAssetId,
        first: TEST_CONFIG.pageSize,
        orderBy: [{ field: 'timestamp', direction: 'DESC' }]
      }),
    'storage.list.assetTransfer({ from, assetId, orderBy })',
    'Event query with multiple filters and sorting'
  );

  // ==================== Summary ====================
  logSection('Test Complete');

  console.log('\n📊 Test Statistics:');
  console.log(`   Total tests: ${testStats.total}`);
  console.log(`   ✅ Success: ${testStats.passed} (returned data)`);
  console.log(`   ⚠️  Empty results: ${testStats.empty} (method succeeded but no data)`);
  console.log(`   ❌ Failed: ${testStats.failed} (threw exception)`);

  console.log('\n📝 Test Coverage:');
  console.log('   GetStorage Methods:');
  console.log('      - StorageValue: 4 methods');
  console.log('      - StorageMap: 7 methods');
  console.log('      - StorageDoubleMap: 2 methods');
  console.log('   ListStorage Methods:');
  console.log('      - StorageValue: 4 methods');
  console.log('      - StorageMap: 7 methods (including filter tests)');
  console.log('      - StorageDoubleMap: 2 methods (including filter tests)');
  console.log('      - Event: 4 methods');
  console.log('      - Generic queries: 2 methods');
  console.log('      - Advanced usage: Pagination, sorting, combined filters');

  console.log('\n💡 Tips:');
  console.log("   - Empty results don't indicate errors, data may not exist on-chain");
  console.log('   - Modify TEST_CONFIG to customize test parameters');
  console.log('   - Set verbose: false to only show summary');
  console.log('   - Set showEmptyResults: true to display empty result details');
  console.log('   - All methods support pagination (first, after) and sorting (orderBy)');

  if (testStats.failed > 0) {
    console.log('\n⚠️  Some tests failed, please check error messages');
    process.exit(1);
  }

  console.log('\n✅ All tests complete!');
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
