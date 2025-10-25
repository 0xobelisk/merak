/**
 * Diagnostic test script for contract call parameter errors
 */

import { NetworkType, Transaction } from '@0xobelisk/sui-client';
import dotenv from 'dotenv';
import { createMerak } from './test-helpers';

dotenv.config();

const TEST_CONFIG = {
  network: 'testnet' as NetworkType,
  testAssetId: '0x357cb71d44a3fe292623a589e44f6a4f704d39d64a916bde9f81b78ce7ffac5c',
  testAccount: '0x1fe342c436eff7ed90988fbe3a85aea7d922517ab6d9bc86e800025f8afcba7a'
};

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ PRIVATE_KEY not set');
    process.exit(1);
  }

  const merak = createMerak({
    networkType: TEST_CONFIG.network,
    secretKey: privateKey
  });

  console.log('✅ 3. Merak instance created successfully');
  console.log(`   Package ID: ${merak.packageId}`);
  console.log(`   Schema ID: ${merak.schemaId}`);
  console.log(`   Test Asset ID: ${TEST_CONFIG.testAssetId}`);

  // Test 1: Direct call to dubhe.query
  console.log('\n=== Test 1: Direct call to dubhe.query ===');
  try {
    const tx = new Transaction();
    const params = [tx.object(merak.schemaId), tx.pure.address(TEST_CONFIG.testAssetId)];

    console.log('Parameters:', {
      schemaId: merak.schemaId,
      assetId: TEST_CONFIG.testAssetId,
      params: params.map((p: any) => JSON.stringify(p))
    });

    const dryResult = (await merak.dubhe.query.assets_system.supply_of({
      tx,
      params
    })) as any;

    console.log('✅ Call succeeded');
    console.log('Result type:', typeof dryResult);
    console.log('Result:', JSON.stringify(dryResult, null, 2).substring(0, 500));

    // Try to parse result
    const supply = merak.dubhe.view(dryResult as any);
    console.log('Supply:', supply);
  } catch (error: any) {
    console.error('❌ Call failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
  }

  // Test 2: Test balanceOf (this one succeeds)
  console.log('\n=== Test 2: Test balanceOf (compare successful call) ===');
  try {
    const tx = new Transaction();
    const params = [
      tx.object(merak.schemaId),
      tx.pure.address(TEST_CONFIG.testAssetId),
      tx.pure.address(TEST_CONFIG.testAccount)
    ];

    console.log('Parameters:', {
      schemaId: merak.schemaId,
      assetId: TEST_CONFIG.testAssetId,
      account: TEST_CONFIG.testAccount
    });

    const dryResult = (await merak.dubhe.query.assets_system.balance_of({
      tx,
      params
    })) as any;

    console.log('✅ Call succeeded');
    const balance = merak.dubhe.view(dryResult as any);
    console.log('Balance:', balance);
  } catch (error: any) {
    console.error('❌ Call failed:', error.message);
  }

  // Test 3: Check schema object
  console.log('\n=== Test 3: Check Schema object ===');
  try {
    const schemaObject = await merak.dubhe.suiInteractor.currentClient.getObject({
      id: merak.schemaId,
      options: { showContent: true, showType: true }
    });

    console.log('Schema object type:', schemaObject.data?.type);
    console.log(
      'Schema object content:',
      JSON.stringify(schemaObject.data?.content, null, 2).substring(0, 300)
    );
  } catch (error: any) {
    console.error('❌ Get failed:', error.message);
  }

  // Test 4: Try different parameter formats
  console.log('\n=== Test 4: Try different parameter formats ===');

  // 4a: Use pure.id instead of pure.address
  console.log('\n4a: Use tx.pure.id()');
  try {
    const tx = new Transaction();
    const params = [tx.object(merak.schemaId), tx.pure.id(TEST_CONFIG.testAssetId)];

    const dryResult = (await merak.dubhe.query.assets_system.supply_of({
      tx,
      params
    })) as any;

    console.log('✅ Call succeeded');
    const supply = merak.dubhe.view(dryResult as any);
    console.log('Supply:', supply);
  } catch (error: any) {
    console.error('❌ Call failed:', error.message);
  }

  // 4b: Use object directly
  console.log('\n4b: Use tx.object()');
  try {
    const tx = new Transaction();
    const params = [tx.object(merak.schemaId), tx.object(TEST_CONFIG.testAssetId)];

    const dryResult = (await merak.dubhe.query.assets_system.supply_of({
      tx,
      params
    })) as any;

    console.log('✅ Call succeeded');
    const supply = merak.dubhe.view(dryResult as any);
    console.log('Supply:', supply);
  } catch (error: any) {
    console.error('❌ Call failed:', error.message);
  }
}

main().catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
