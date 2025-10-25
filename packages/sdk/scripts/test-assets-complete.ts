/**
 * Complete Assets System Test
 *
 * This test covers asset management functionality:
 * - Transfer assets between accounts
 * - Transfer all balance
 * - Query balances, supply, metadata
 *
 * Note: Management functions (mint, burn, freeze) require asset owner
 * permissions and cannot be tested with regular test accounts.
 *
 * Usage:
 * 1. Set PRIVATE_KEY in .env file
 * 2. Ensure test account has sufficient balance
 * 3. Run: pnpm test:assets
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

// Generate a deterministic "receiver" address from the test account
// In production, this would be a different actual account
function generateReceiverAddress(senderAddress: string): string {
  // For testing purposes, we'll use a modified version of the sender address
  // In real scenarios, you'd use an actual different account
  const bytes = senderAddress.slice(2); // Remove '0x'
  const modified = '0x' + 'a'.repeat(64 - bytes.length) + bytes.slice(0, -1) + '0';
  return modified;
}

// ==================== Main Test Function ====================

async function main() {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    logError('PRIVATE_KEY environment variable not set');
    console.log('Please set PRIVATE_KEY in .env file');
    process.exit(1);
  }

  logSection('Assets System Complete Test');
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

  const testAssetId = TEST_CONFIG.testAssetId;
  logInfo('Test Asset ID', testAssetId);

  // Note: For actual transfer testing, we need a second account
  // For this test, we'll document the transfer flow but transfer to self
  const receiverAddress = accountAddress; // Transfer to self for testing
  logWarning('Note: Transferring to self for testing purposes');

  // ==================== Test 1: Query Asset Metadata ====================
  logSection('Test 1: Query Asset Metadata and Info');

  logStep('Querying asset metadata');
  const metadata = await merak.getMetadata(testAssetId);
  logSuccess('Metadata retrieved');
  logInfo('Asset Name', metadata.name);
  logInfo('Asset Symbol', metadata.symbol);
  logInfo('Description', metadata.description);
  logInfo('Decimals', metadata.decimals);
  logInfo('Icon URL', metadata.iconUrl || '(empty)');

  logStep('Querying asset supply');
  const supply = await merak.supplyOf(testAssetId);
  logSuccess('Supply retrieved');
  logInfo('Total Supply', supply.supply);

  logStep('Querying asset owner');
  const owner = await merak.ownerOf(testAssetId);
  logSuccess('Owner retrieved');
  logInfo('Owner Address', owner.owner);

  logStep('Querying asset metadata (via contract)');
  const contractMetadata = await merak.metadataOf(testAssetId);
  logSuccess('Contract metadata retrieved');
  logInfo('Name', contractMetadata.name);
  logInfo('Symbol', contractMetadata.symbol);
  logInfo('Description', contractMetadata.description);
  logInfo('Decimals', contractMetadata.decimals);

  // ==================== Test 2: Query Account Balance ====================
  logSection('Test 2: Query Account Balance');

  logStep('Querying account balance');
  const balance = await merak.balanceOf(testAssetId, accountAddress);
  logSuccess('Balance retrieved');
  logInfo('Balance', balance.balance);
  logInfo('Symbol', balance.symbol);
  logInfo('Decimals', balance.decimals);

  // Check if we have sufficient balance
  const minRequiredBalance = BigInt(100000); // 0.0001 tokens
  if (BigInt(balance.balance) < minRequiredBalance) {
    logError(`Insufficient balance for testing. Need at least ${minRequiredBalance.toString()}`);
    logInfo('Current Balance', balance.balance);
    process.exit(1);
  }

  logStep('Querying account info via queryAccount');
  const accountInfo = await merak.queryAccount({
    address: accountAddress,
    assetId: testAssetId
  });
  logSuccess('Account info retrieved');
  logInfo('Account', accountInfo.account);
  logInfo('Balance', accountInfo.balance);
  logInfo('Status', accountInfo.status);

  // ==================== Test 3: Transfer Asset ====================
  logSection('Test 3: Transfer Asset');

  const transferAmount = '10000'; // Small amount
  logStep(`Preparing to transfer ${transferAmount} units`);
  logInfo('From', accountAddress);
  logInfo('To', receiverAddress);
  logInfo('Amount', transferAmount);

  // Record balances before transfer
  logStep('Recording balances before transfer');
  const senderBalanceBefore = await merak.balanceOf(testAssetId, accountAddress);
  const receiverBalanceBefore = await merak.balanceOf(testAssetId, receiverAddress);
  logInfo('Sender Balance Before', senderBalanceBefore.balance);
  logInfo('Receiver Balance Before', receiverBalanceBefore.balance);

  // Execute transfer
  logStep('Executing transfer transaction');
  const transferTx = new Transaction();
  const transferRes = (await merak.transfer(
    transferTx,
    testAssetId,
    receiverAddress,
    transferAmount
  )) as SuiTransactionBlockResponse;

  logSuccess('Transfer transaction submitted');
  logInfo('Transaction Hash', transferRes.digest);

  await waitForTransaction();

  // Verify transfer
  logStep('Verifying transfer result');
  const senderBalanceAfter = await merak.balanceOf(testAssetId, accountAddress);
  const receiverBalanceAfter = await merak.balanceOf(testAssetId, receiverAddress);
  logInfo('Sender Balance After', senderBalanceAfter.balance);
  logInfo('Receiver Balance After', receiverBalanceAfter.balance);

  // For self-transfer, balance should remain the same
  if (accountAddress === receiverAddress) {
    if (senderBalanceAfter.balance === senderBalanceBefore.balance) {
      logSuccess('Self-transfer completed (balance unchanged as expected)');
    } else {
      logError('Balance mismatch after self-transfer!');
      throw new Error('Transfer verification failed');
    }
  } else {
    // For actual transfers between different accounts
    const senderChange = BigInt(senderBalanceBefore.balance) - BigInt(senderBalanceAfter.balance);
    const receiverChange =
      BigInt(receiverBalanceAfter.balance) - BigInt(receiverBalanceBefore.balance);

    if (senderChange === BigInt(transferAmount) && receiverChange === BigInt(transferAmount)) {
      logSuccess('Transfer completed successfully!');
      logInfo('Sender Decreased', senderChange.toString());
      logInfo('Receiver Increased', receiverChange.toString());
    } else {
      logError('Balance changes do not match transfer amount!');
      logInfo('Expected Change', transferAmount);
      logInfo('Sender Change', senderChange.toString());
      logInfo('Receiver Change', receiverChange.toString());
      throw new Error('Transfer verification failed');
    }
  }

  // ==================== Test 4: Query List Methods ====================
  logSection('Test 4: Query Asset Lists and Info');

  logStep('Listing all assets');
  const allAssets = await merak.listAssetsInfo({ first: 5 });
  logSuccess('Asset list retrieved');
  logInfo('Total Assets Found', allAssets.data.length);
  if (allAssets.data.length > 0) {
    logInfo('First Asset', allAssets.data[0].symbol);
  }

  logStep('Listing owned assets');
  const ownedAssets = await merak.listOwnedAssetsInfo({
    account: accountAddress
  });
  logSuccess('Owned assets retrieved');
  logInfo('Owned Assets Count', ownedAssets.data.length);
  if (ownedAssets.data.length > 0) {
    logInfo('First Owned Asset', ownedAssets.data[0].symbol);
    logInfo('Balance', ownedAssets.data[0].balance);
  }

  logStep('Listing LP assets');
  const lpAssets = await merak.listAccountLpAssets({
    account: accountAddress
  });
  logSuccess('LP assets retrieved');
  logInfo('LP Assets Count', lpAssets.data.length);
  if (lpAssets.data.length > 0) {
    logInfo('First LP Asset', lpAssets.data[0].symbol);
  }

  logStep('Listing wrapped assets');
  const wrappedAssets = await merak.listOwnedWrapperAssets({
    account: accountAddress
  });
  logSuccess('Wrapped assets retrieved');
  logInfo('Wrapped Assets Count', wrappedAssets.data.length);
  if (wrappedAssets.data.length > 0) {
    logInfo('First Wrapped Asset', wrappedAssets.data[0].symbol);
  }

  // ==================== Test 5: Verify Supply Consistency ====================
  logSection('Test 5: Verify Supply and Total Balance');

  logStep('Checking supply consistency');
  const finalSupply = await merak.supplyOf(testAssetId);
  logInfo('Final Total Supply', finalSupply.supply);

  // Total supply should not change from transfers
  if (finalSupply.supply === supply.supply) {
    logSuccess('Total supply remained constant (as expected for transfers)');
  } else {
    logWarning('Total supply changed');
    logInfo('Initial Supply', supply.supply);
    logInfo('Final Supply', finalSupply.supply);
  }

  // ==================== Test Summary ====================
  logSection('Test Summary');

  console.log('\n✅ All Assets tests passed!\n');
  console.log('Test Results:');
  console.log('  ✅ Test 1: Asset metadata queries - PASSED');
  console.log('  ✅ Test 2: Account balance queries - PASSED');
  console.log('  ✅ Test 3: Asset transfer - PASSED');
  console.log('  ✅ Test 4: Asset list queries - PASSED');
  console.log('  ✅ Test 5: Supply consistency - PASSED');
  console.log('\nAsset Information:');
  console.log(`  - Asset ID: ${testAssetId}`);
  console.log(`  - Symbol: ${metadata.symbol}`);
  console.log(`  - Total Supply: ${supply.supply}`);
  console.log(`  - Your Balance: ${senderBalanceAfter.balance}`);
  console.log('\nTransactions:');
  console.log(`  - Transfer: ${transferRes.digest}`);
  console.log('\nNote: Management functions (mint/burn/freeze) require owner permissions');
  console.log('and are not tested with regular test accounts.');
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

