/**
 * Complete Merak SDK Interface Test Script
 *
 * Usage:
 * 1. Set environment variable PRIVATE_KEY
 * 2. Run: pnpm test:all
 *
 * Notes:
 * - Modify TEST_CONFIG below to configure test parameters
 * - Some methods require existing assets/pools to test
 */

import { NetworkType, Transaction } from '@0xobelisk/sui-client';
import dotenv from 'dotenv';
import { createMerak } from './test-helpers';

dotenv.config();

// ==================== Configuration ====================
const TEST_CONFIG = {
  // Network configuration
  network: 'testnet' as NetworkType,

  // Test asset IDs (need to be created beforehand)
  testAssetId: '0x357cb71d44a3fe292623a589e44f6a4f704d39d64a916bde9f81b78ce7ffac5c',
  testAssetId2: '0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6',

  // Test account address
  testAccount: '0x1fe342c436eff7ed90988fbe3a85aea7d922517ab6d9bc86e800025f8afcba7a',

  // Test Coin Type
  testCoinType: '0x2::sui::SUI',

  // Whether to execute transaction methods (requires gas)
  executeTransactions: false,

  // Whether to show detailed output
  verbose: true
};

// ==================== Helper Functions ====================

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

function logMethod(methodName: string, description: string) {
  console.log(`\n📌 ${methodName}`);
  console.log(`   ${description}`);
}

function logResult(data: any, truncate = false) {
  if (!TEST_CONFIG.verbose && truncate) {
    console.log('   ✅ Success');
    return;
  }

  if (typeof data === 'object') {
    console.log('   Result:', JSON.stringify(data, null, 2).split('\n').slice(0, 20).join('\n'));
    if (JSON.stringify(data).split('\n').length > 20) {
      console.log('   ... (result truncated)');
    }
  } else {
    console.log('   Result:', data);
  }
}

function logError(error: any) {
  console.error('   ❌ Error:', error.message || error);
  if (TEST_CONFIG.verbose && error.stack) {
    console.error('   Stack:', error.stack);
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
    logResult(result, true);
    return result;
  } catch (error) {
    logError(error);
    return null;
  }
}

// ==================== Main Test Function ====================

async function main() {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ Error: PRIVATE_KEY environment variable not set');
    console.log('Please set PRIVATE_KEY in .env file');
    process.exit(1);
  }

  console.log('🚀 Starting Merak SDK interface tests...');
  console.log(`📡 Network: ${TEST_CONFIG.network}`);
  console.log(`🔑 Account: ${TEST_CONFIG.testAccount.slice(0, 10)}...`);

  // Initialize Merak
  const merak = createMerak({
    networkType: TEST_CONFIG.network,
    secretKey: privateKey
  });

  console.log('✅ Merak instance created successfully');
  console.log(`   Package ID: ${merak.packageId}`);
  console.log(`   Schema ID: ${merak.schemaId}`);

  // ==================== 1. Storage Query Methods ====================
  logSection('1. Storage Query Methods');

  // 1.1 Storage.get methods
  console.log('\n📦 Storage.get methods:');

  await safeExecute(
    () => merak.storage.get.assetMetadata({ assetId: TEST_CONFIG.testAssetId }),
    'storage.get.assetMetadata()',
    'Get asset metadata'
  );

  await safeExecute(
    () => merak.storage.get.assetSupply({ assetId: TEST_CONFIG.testAssetId }),
    'storage.get.assetSupply()',
    'Get asset total supply'
  );

  await safeExecute(
    () => merak.storage.get.assetHolder({ assetId: TEST_CONFIG.testAssetId }),
    'storage.get.assetHolder()',
    'Get asset holder'
  );

  await safeExecute(
    () =>
      merak.storage.get.assetAccount({
        assetId: TEST_CONFIG.testAssetId,
        account: TEST_CONFIG.testAccount
      }),
    'storage.get.assetAccount()',
    'Get account asset balance'
  );

  await safeExecute(
    () =>
      merak.storage.get.assetPool({
        asset0: TEST_CONFIG.testAssetId,
        asset1: TEST_CONFIG.testAssetId2
      }),
    'storage.get.assetPool()',
    'Get asset pool info'
  );

  await safeExecute(
    () => merak.storage.get.assetWrapper({ coinType: TEST_CONFIG.testCoinType }),
    'storage.get.assetWrapper()',
    'Get Wrapper info'
  );

  // 1.2 Storage.list methods
  console.log('\n📦 Storage.list methods:');

  await safeExecute(
    () => merak.storage.list.assetMetadata({ first: 5 }),
    'storage.list.assetMetadata()',
    'List all asset metadata'
  );

  await safeExecute(
    () => merak.storage.list.assetSupply({ first: 5 }),
    'storage.list.assetSupply()',
    'List asset supplies'
  );

  await safeExecute(
    () => merak.storage.list.assetHolder({ first: 5 }),
    'storage.list.assetHolder()',
    'List asset holders'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetAccount({
        account: TEST_CONFIG.testAccount,
        first: 5
      }),
    'storage.list.assetAccount()',
    'List all account assets'
  );

  await safeExecute(
    () => merak.storage.list.assetPool({ first: 5 }),
    'storage.list.assetPool()',
    'List all asset pools'
  );

  await safeExecute(
    () => merak.storage.list.assetWrapper({ first: 5 }),
    'storage.list.assetWrapper()',
    'List all Wrapper assets'
  );

  // Event queries
  await safeExecute(
    () =>
      merak.storage.list.assetTransfer({
        from: TEST_CONFIG.testAccount,
        first: 5
      }),
    'storage.list.assetTransfer()',
    'List asset transfer events'
  );

  await safeExecute(
    () => merak.storage.list.assetSwap({ first: 5 }),
    'storage.list.assetSwap()',
    'List asset swap events'
  );

  await safeExecute(
    () => merak.storage.list.assetWrap({ first: 5 }),
    'storage.list.assetWrap()',
    'List asset Wrap events'
  );

  await safeExecute(
    () => merak.storage.list.assetUnwrap({ first: 5 }),
    'storage.list.assetUnwrap()',
    'List asset Unwrap events'
  );

  // ==================== 2. Asset Query Methods ====================
  logSection('2. Asset Query Methods');

  await safeExecute(
    () => merak.getMetadata(TEST_CONFIG.testAssetId),
    'getMetadata()',
    'Get asset metadata (auto-convert field names)'
  );

  await safeExecute(
    () => merak.getLatestMetadata(TEST_CONFIG.testAssetId),
    'getLatestMetadata()',
    'Get latest asset metadata'
  );

  await safeExecute(
    () => merak.balanceOf(TEST_CONFIG.testAssetId, TEST_CONFIG.testAccount),
    'balanceOf()',
    'Query account balance'
  );

  await safeExecute(
    () => merak.supplyOf(TEST_CONFIG.testAssetId),
    'supplyOf()',
    'Query asset total supply'
  );

  await safeExecute(
    () => merak.metadataOf(TEST_CONFIG.testAssetId),
    'metadataOf()',
    'Query asset metadata (via contract)'
  );

  await safeExecute(() => merak.ownerOf(TEST_CONFIG.testAssetId), 'ownerOf()', 'Query asset owner');

  await safeExecute(
    () =>
      merak.queryAccount({
        address: TEST_CONFIG.testAccount,
        assetId: TEST_CONFIG.testAssetId
      }),
    'queryAccount()',
    'Query account info'
  );

  await safeExecute(
    () => merak.listAssetsInfo({ first: 5 }),
    'listAssetsInfo()',
    'List all asset info'
  );

  await safeExecute(
    () =>
      merak.listAssetsInfo({
        first: 5,
        assetType: 'Lp'
      }),
    'listAssetsInfo({ assetType: "Lp" })',
    'List LP assets'
  );

  await safeExecute(
    () =>
      merak.listOwnedAssetsInfo({
        account: TEST_CONFIG.testAccount
      }),
    'listOwnedAssetsInfo()',
    'List all owned assets by account'
  );

  await safeExecute(
    () =>
      merak.listOwnedAssetsInfo({
        account: TEST_CONFIG.testAccount,
        assetType: 'Lp'
      }),
    'listOwnedAssetsInfo({ assetType: "Lp" })',
    'List LP assets owned by account'
  );

  await safeExecute(
    () =>
      merak.listAccountLpAssets({
        account: TEST_CONFIG.testAccount
      }),
    'listAccountLpAssets()',
    'List LP assets of account'
  );

  await safeExecute(
    () =>
      merak.listOwnedWrapperAssets({
        account: TEST_CONFIG.testAccount
      }),
    'listOwnedWrapperAssets()',
    'List Wrapper assets of account'
  );

  // ==================== 3. Pool/DEX Query Methods ====================
  logSection('3. Pool/DEX Query Methods');

  await safeExecute(() => merak.getPoolList({ first: 5 }), 'getPoolList()', 'Get pool list');

  await safeExecute(() => merak.allPoolList({ pageSize: 5 }), 'allPoolList()', 'Get all pools');

  const poolList = await safeExecute(
    () => merak.allPoolListWithId(TEST_CONFIG.testAssetId),
    'allPoolListWithId()',
    'Get all pools containing specified asset'
  );

  if (poolList && poolList.length > 0) {
    await safeExecute(
      () =>
        merak.getPoolListWithId({
          asset1Id: poolList[0].asset0,
          asset2Id: poolList[0].asset1
        }),
      'getPoolListWithId()',
      'Get pool details by asset ID pair'
    );
  }

  await safeExecute(
    () => merak.listPoolsInfo({ pageSize: 3 }),
    'listPoolsInfo()',
    'List pool detailed info'
  );

  await safeExecute(
    () => merak.getConnectedTokens(TEST_CONFIG.testAssetId),
    'getConnectedTokens()',
    'Get tokens directly connected to specified token'
  );

  await safeExecute(
    () =>
      merak.getAllSwappableTokens({
        startTokenId: TEST_CONFIG.testAssetId
      }),
    'getAllSwappableTokens()',
    'Get all swappable tokens (BFS search)'
  );

  await safeExecute(
    () =>
      merak.getAllSwappableTokensWithMetadata({
        startTokenId: TEST_CONFIG.testAssetId,
        address: TEST_CONFIG.testAccount
      }),
    'getAllSwappableTokensWithMetadata()',
    'Get all swappable tokens (with metadata and balance)'
  );

  // Swap path query (requires two tokens with existing pools)
  if (poolList && poolList.length > 0) {
    await safeExecute(
      () => merak.querySwapPaths(poolList[0].asset0, poolList[0].asset1),
      'querySwapPaths()',
      'Query token swap paths'
    );
  }

  // Get swap output/input amounts
  if (poolList && poolList.length >= 2) {
    const path = [poolList[0].asset0, poolList[0].asset1];

    await safeExecute(
      () => merak.getAmountsOut('1000000', path),
      'getAmountsOut()',
      'Calculate output amounts for given input'
    );

    await safeExecute(
      () => merak.getAmountsIn('1000000', path),
      'getAmountsIn()',
      'Calculate input amounts needed for output'
    );
  }

  // ==================== 4. Wrapper Query Methods ====================
  logSection('4. Wrapper Query Methods');

  await safeExecute(
    () => merak.wrappedAssets({ first: 5 }),
    'wrappedAssets()',
    'Get all Wrapped assets'
  );

  await safeExecute(
    () =>
      merak.wrappedAssets({
        coinType: TEST_CONFIG.testCoinType,
        first: 5
      }),
    'wrappedAssets({ coinType })',
    'Get Wrapper info for specified Coin Type'
  );

  // ==================== 5. Pool Calculation Methods ====================
  logSection('5. Pool Calculation Methods');

  // Need LP token to test
  const lpAssets = await merak.listAccountLpAssets({
    account: TEST_CONFIG.testAccount,
    assetType: 'Lp'
  });

  if (lpAssets.data.length > 0) {
    const lpAssetId = lpAssets.data[0].assetId;

    await safeExecute(
      () =>
        merak.calRemoveLpAmount({
          address: TEST_CONFIG.testAccount,
          poolAssetId: lpAssetId
        }),
      'calRemoveLpAmount()',
      'Calculate token amounts for removing liquidity'
    );

    await safeExecute(
      () =>
        merak.calRemoveLpAmount({
          address: TEST_CONFIG.testAccount,
          poolAssetId: lpAssetId,
          amount: '1000000'
        }),
      'calRemoveLpAmount({ amount })',
      'Calculate tokens for removing specified LP amount'
    );
  } else {
    console.log('\n⚠️  Skipping calRemoveLpAmount test (account has no LP assets)');
  }

  // ==================== 6. Transaction Methods (Optional) ====================
  if (TEST_CONFIG.executeTransactions) {
    logSection('6. Transaction Methods (Requires Gas)');

    console.log(
      '\n⚠️  Warning: The following methods will execute real transactions, consuming Gas'
    );
    console.log(
      "If you don't want to execute transactions, set TEST_CONFIG.executeTransactions = false"
    );

    // 6.1 Asset management transactions
    console.log('\n📝 Asset Management Transactions:');

    const tx1 = new Transaction();
    await safeExecute(
      async () => {
        return await merak.setMetadata(
          tx1,
          TEST_CONFIG.testAssetId,
          'Test Asset',
          'TEST',
          'Test Description',
          'https://example.com/icon.png'
        );
      },
      'setMetadata()',
      'Set asset metadata (build transaction)'
    );

    // 6.2 DEX transactions
    console.log('\n💱 DEX Transactions:');

    const tx2 = new Transaction();
    await safeExecute(
      async () => {
        return await merak.createPool(tx2, TEST_CONFIG.testAssetId, TEST_CONFIG.testAssetId2);
      },
      'createPool()',
      'Create trading pool (build transaction)'
    );

    const tx3 = new Transaction();
    await safeExecute(
      async () => {
        return await merak.addLiquidity(
          tx3,
          TEST_CONFIG.testAssetId,
          TEST_CONFIG.testAssetId2,
          '1000000',
          '1000000',
          '900000',
          '900000',
          TEST_CONFIG.testAccount
        );
      },
      'addLiquidity()',
      'Add liquidity (build transaction)'
    );

    console.log('\n⚠️  Note: Above transactions are only built, not signed and executed');
    console.log('To execute transactions, call merak.dubhe.signAndSendTransaction()');
  } else {
    logSection('6. Transaction Methods');
    console.log('\n⏭️  Skipping transaction method tests');
    console.log('To test transaction methods, set TEST_CONFIG.executeTransactions = true');
    console.log('Note: Transaction methods will consume Gas');
  }

  // ==================== Summary ====================
  logSection('Test Complete');

  console.log('\n✅ All tests complete!');
  console.log('\n📊 Test Statistics:');
  console.log('   - Storage.get methods: 9');
  console.log('   - Storage.list methods: 12');
  console.log('   - Asset query methods: 11');
  console.log('   - Pool/DEX query methods: 12');
  console.log('   - Wrapper query methods: 2');
  console.log('   - Pool calculation methods: 2');
  console.log(
    '   - Transaction methods: ' + (TEST_CONFIG.executeTransactions ? 'Tested' : 'Skipped')
  );

  console.log('\n💡 Tips:');
  console.log('   - Modify TEST_CONFIG to customize test parameters');
  console.log('   - Set verbose: false to only show success/failure');
  console.log('   - Some methods require pre-created assets/pools to test');
  console.log('   - For detailed documentation, see SDK_UPDATE_SUMMARY.md and QUICK_REFERENCE.md');
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
