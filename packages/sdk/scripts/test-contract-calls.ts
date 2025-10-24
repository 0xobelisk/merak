/**
 * 诊断合约调用参数错误的测试脚本
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
    console.error('❌ 未设置 PRIVATE_KEY');
    process.exit(1);
  }

  const merak = createMerak({
    networkType: TEST_CONFIG.network,
    secretKey: privateKey
  });

  console.log('✅ Merak 实例创建成功');
  console.log(`   Package ID: ${merak.packageId}`);
  console.log(`   Schema ID: ${merak.schemaId}`);
  console.log(`   Test Asset ID: ${TEST_CONFIG.testAssetId}`);

  // 测试 1: 直接调用 dubhe.query
  console.log('\n=== 测试 1: 直接调用 dubhe.query ===');
  try {
    const tx = new Transaction();
    const params = [tx.object(merak.schemaId), tx.pure.address(TEST_CONFIG.testAssetId)];

    console.log('参数:', {
      schemaId: merak.schemaId,
      assetId: TEST_CONFIG.testAssetId,
      params: params.map((p: any) => JSON.stringify(p))
    });

    const dryResult = (await merak.dubhe.query.assets_system.supply_of({
      tx,
      params
    })) as any;

    console.log('✅ 调用成功');
    console.log('结果类型:', typeof dryResult);
    console.log('结果:', JSON.stringify(dryResult, null, 2).substring(0, 500));

    // 尝试解析结果
    const supply = merak.dubhe.view(dryResult as any);
    console.log('Supply:', supply);
  } catch (error: any) {
    console.error('❌ 调用失败:', error.message);
    if (error.stack) {
      console.error('堆栈:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
  }

  // 测试 2: 测试 balanceOf (这个是成功的)
  console.log('\n=== 测试 2: 测试 balanceOf (对比成功的调用) ===');
  try {
    const tx = new Transaction();
    const params = [
      tx.object(merak.schemaId),
      tx.pure.address(TEST_CONFIG.testAssetId),
      tx.pure.address(TEST_CONFIG.testAccount)
    ];

    console.log('参数:', {
      schemaId: merak.schemaId,
      assetId: TEST_CONFIG.testAssetId,
      account: TEST_CONFIG.testAccount
    });

    const dryResult = (await merak.dubhe.query.assets_system.balance_of({
      tx,
      params
    })) as any;

    console.log('✅ 调用成功');
    const balance = merak.dubhe.view(dryResult as any);
    console.log('Balance:', balance);
  } catch (error: any) {
    console.error('❌ 调用失败:', error.message);
  }

  // 测试 3: 检查 schema 对象
  console.log('\n=== 测试 3: 检查 Schema 对象 ===');
  try {
    const schemaObject = await merak.dubhe.suiInteractor.currentClient.getObject({
      id: merak.schemaId,
      options: { showContent: true, showType: true }
    });

    console.log('Schema 对象类型:', schemaObject.data?.type);
    console.log(
      'Schema 对象内容:',
      JSON.stringify(schemaObject.data?.content, null, 2).substring(0, 300)
    );
  } catch (error: any) {
    console.error('❌ 获取失败:', error.message);
  }

  // 测试 4: 尝试不同的参数格式
  console.log('\n=== 测试 4: 尝试不同的参数格式 ===');

  // 4a: 使用 pure.id 代替 pure.address
  console.log('\n4a: 使用 tx.pure.id()');
  try {
    const tx = new Transaction();
    const params = [tx.object(merak.schemaId), tx.pure.id(TEST_CONFIG.testAssetId)];

    const dryResult = (await merak.dubhe.query.assets_system.supply_of({
      tx,
      params
    })) as any;

    console.log('✅ 调用成功');
    const supply = merak.dubhe.view(dryResult as any);
    console.log('Supply:', supply);
  } catch (error: any) {
    console.error('❌ 调用失败:', error.message);
  }

  // 4b: 直接使用对象
  console.log('\n4b: 使用 tx.object()');
  try {
    const tx = new Transaction();
    const params = [tx.object(merak.schemaId), tx.object(TEST_CONFIG.testAssetId)];

    const dryResult = (await merak.dubhe.query.assets_system.supply_of({
      tx,
      params
    })) as any;

    console.log('✅ 调用成功');
    const supply = merak.dubhe.view(dryResult as any);
    console.log('Supply:', supply);
  } catch (error: any) {
    console.error('❌ 调用失败:', error.message);
  }
}

main().catch((error) => {
  console.error('\n❌ 测试失败:', error);
  process.exit(1);
});
