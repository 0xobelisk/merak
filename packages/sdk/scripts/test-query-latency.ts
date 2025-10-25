/**
 * Query Latency Comparison Test
 *
 * This test compares the latency between GraphQL queries and on-chain queries
 * by measuring how long it takes for GraphQL indexer to sync with on-chain data
 * after a transaction is executed.
 *
 * Usage:
 * 1. Set PRIVATE_KEY in .env file
 * 2. Run: pnpm test:latency
 */

import { createMerak, TEST_CONFIG } from './test-helpers';
import { SuiTransactionBlockResponse, Transaction } from '@0xobelisk/sui-client';
import dotenv from 'dotenv';

dotenv.config();

// ==================== Helper Functions ====================

function logSection(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70));
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

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==================== Latency Test Functions ====================

interface LatencyTestResult {
  testNumber: number;
  transactionHash: string;
  initialGraphQLBalance: string;
  initialOnChainBalance: string;
  finalGraphQLBalance: string;
  finalOnChainBalance: string;
  syncTimeMs: number;
  synced: boolean;
}

/**
 * Perform a single latency test by executing a transaction and measuring sync time
 */
async function performLatencyTest(
  merak: any,
  testNumber: number,
  assetId: string,
  accountAddress: string
): Promise<LatencyTestResult> {
  logStep(`Test #${testNumber}: Executing wrap transaction`);

  // Execute a wrap transaction to change balance
  const wrapAmount = '50000'; // Small amount for testing
  const wrapTx = new Transaction();

  // Split SUI and wrap it
  const [coin] = wrapTx.splitCoins(wrapTx.gas, [wrapAmount]);

  const wrapRes = (await merak.wrap(
    wrapTx,
    coin,
    accountAddress,
    TEST_CONFIG.testCoinType // SUI coin type
  )) as SuiTransactionBlockResponse;

  logInfo('Transaction Hash', wrapRes.digest);
  logInfo('Transaction Status', (wrapRes.effects?.status as any)?.status || 'unknown');

  if ((wrapRes.effects?.status as any)?.status === 'failure') {
    throw new Error('Transaction failed');
  }

  // Immediately query both methods
  const startTime = Date.now();

  logStep('Querying balances immediately after transaction');
  const initialGraphQLQuery = await merak.balanceOf(assetId, accountAddress);
  const initialGraphQLBalance = initialGraphQLQuery.balance;

  const initialOnChainBalanceRaw = await merak.assets.balanceOf(assetId, accountAddress);
  const initialOnChainBalance = initialOnChainBalanceRaw ? String(initialOnChainBalanceRaw) : '0';

  logInfo('GraphQL Balance (immediate)', initialGraphQLBalance);
  logInfo('On-chain Balance (immediate)', initialOnChainBalance);

  // Poll GraphQL until it syncs with on-chain
  let syncTimeMs = 0;
  let synced = false;
  const maxWaitTime = 60000; // Maximum 60 seconds
  const pollInterval = 500; // Check every 500ms

  logStep('Waiting for GraphQL to sync with on-chain data...');

  let finalGraphQLBalance = initialGraphQLBalance;
  let finalOnChainBalance = initialOnChainBalance;

  while (Date.now() - startTime < maxWaitTime) {
    await sleep(pollInterval);

    const graphQLQuery = await merak.balanceOf(assetId, accountAddress);
    finalGraphQLBalance = graphQLQuery.balance;

    const onChainBalanceRaw = await merak.assets.balanceOf(assetId, accountAddress);
    finalOnChainBalance = onChainBalanceRaw ? String(onChainBalanceRaw) : '0';

    if (finalGraphQLBalance === finalOnChainBalance) {
      syncTimeMs = Date.now() - startTime;
      synced = true;
      logSuccess(`GraphQL synced after ${syncTimeMs}ms`);
      logInfo('Final Balance', finalGraphQLBalance);
      break;
    }

    // Log progress every 5 seconds
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    if (elapsedSeconds % 5 === 0 && (Date.now() - startTime) % 5000 < pollInterval + 100) {
      logInfo(
        `Still waiting (${elapsedSeconds}s)...`,
        `GraphQL: ${finalGraphQLBalance}, On-chain: ${finalOnChainBalance}`
      );
    }
  }

  if (!synced) {
    syncTimeMs = Date.now() - startTime;
    logError(`GraphQL did not sync within ${maxWaitTime / 1000}s`);
    logInfo('GraphQL Balance (final)', finalGraphQLBalance);
    logInfo('On-chain Balance (final)', finalOnChainBalance);
  }

  return {
    testNumber,
    transactionHash: wrapRes.digest,
    initialGraphQLBalance,
    initialOnChainBalance,
    finalGraphQLBalance,
    finalOnChainBalance,
    syncTimeMs,
    synced
  };
}

// ==================== Main Test Function ====================

async function main() {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    logError('PRIVATE_KEY environment variable not set');
    console.log('Please set PRIVATE_KEY in .env file');
    process.exit(1);
  }

  logSection('GraphQL vs On-chain Query Latency Test');
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

  // Use Wrapped SUI as test asset
  const wrappedSuiAssetId = TEST_CONFIG.testAssetId2;
  logInfo('Test Asset (Wrapped SUI)', wrappedSuiAssetId);

  // Check initial balance
  logStep('Checking initial wrapped SUI balance');
  const initialBalance = await merak.balanceOf(wrappedSuiAssetId);
  logInfo('Initial Balance', initialBalance.balance);

  // Perform multiple latency tests
  const numTests = 5;
  const results: LatencyTestResult[] = [];

  logSection(`Performing ${numTests} Latency Tests`);

  for (let i = 1; i <= numTests; i++) {
    try {
      const result = await performLatencyTest(merak, i, wrappedSuiAssetId, accountAddress);
      results.push(result);

      // Wait a bit between tests to avoid rate limiting
      if (i < numTests) {
        logInfo('Waiting before next test', '3 seconds...');
        await sleep(3000);
      }
    } catch (error: any) {
      logError(`Test #${i} failed: ${error.message}`);
      // Continue with other tests
    }
  }

  // ==================== Results Summary ====================
  logSection('Test Results Summary');

  console.log('\n📊 Individual Test Results:');
  console.log('─'.repeat(70));

  results.forEach((result) => {
    console.log(`\nTest #${result.testNumber}:`);
    console.log(`  Transaction: ${result.transactionHash}`);
    console.log(
      `  Initial - GraphQL: ${result.initialGraphQLBalance}, On-chain: ${result.initialOnChainBalance}`
    );
    console.log(
      `  Final   - GraphQL: ${result.finalGraphQLBalance}, On-chain: ${result.finalOnChainBalance}`
    );
    console.log(`  Sync Time: ${result.syncTimeMs}ms (${(result.syncTimeMs / 1000).toFixed(2)}s)`);
    console.log(`  Status: ${result.synced ? '✅ Synced' : '❌ Not Synced'}`);
  });

  // Calculate statistics
  const syncedResults = results.filter((r) => r.synced);
  if (syncedResults.length > 0) {
    const syncTimes = syncedResults.map((r) => r.syncTimeMs);
    const avgSyncTime = syncTimes.reduce((a, b) => a + b, 0) / syncTimes.length;
    const minSyncTime = Math.min(...syncTimes);
    const maxSyncTime = Math.max(...syncTimes);

    console.log('\n' + '─'.repeat(70));
    console.log('\n📈 Statistics:');
    console.log(`  Total Tests: ${results.length}`);
    console.log(`  Successful Syncs: ${syncedResults.length}`);
    console.log(`  Failed Syncs: ${results.length - syncedResults.length}`);
    console.log(`\n⏱️  Sync Time Statistics:`);
    console.log(`  Average: ${avgSyncTime.toFixed(0)}ms (${(avgSyncTime / 1000).toFixed(2)}s)`);
    console.log(`  Minimum: ${minSyncTime}ms (${(minSyncTime / 1000).toFixed(2)}s)`);
    console.log(`  Maximum: ${maxSyncTime}ms (${(maxSyncTime / 1000).toFixed(2)}s)`);
  } else {
    console.log('\n⚠️  No successful syncs to calculate statistics');
  }

  // ==================== Recommendations ====================
  logSection('Recommendations');

  if (syncedResults.length > 0) {
    const avgSyncTime =
      syncedResults.map((r) => r.syncTimeMs).reduce((a, b) => a + b, 0) / syncedResults.length;

    console.log('\nBased on the test results:');
    console.log(`\n1. GraphQL Indexer Delay: ~${(avgSyncTime / 1000).toFixed(1)}s on average`);
    console.log(`   - Use on-chain queries (merak.assets.balanceOf) for real-time data`);
    console.log(`   - Use GraphQL queries (merak.balanceOf) for historical/analytical data`);

    console.log(`\n2. For Testing:`);
    console.log(
      `   - Wait at least ${
        Math.ceil(avgSyncTime / 1000) + 2
      }s after transactions before verifying with GraphQL`
    );
    console.log(`   - Use on-chain queries for immediate verification`);

    console.log(`\n3. For Production:`);
    console.log(`   - Critical paths: Use on-chain queries`);
    console.log(`   - UI display: GraphQL is acceptable with proper loading states`);
    console.log(`   - Consider caching on-chain queries to reduce RPC load`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Latency test completed!\n');
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
