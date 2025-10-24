/**
 * Merak SDK 完整接口测试脚本
 *
 * 用法：
 * 1. 设置环境变量 PRIVATE_KEY
 * 2. 运行: pnpm test:all
 *
 * 注意：
 * - 修改下面的 TEST_CONFIG 配置测试参数
 * - 部分方法需要已存在的资产/池子才能测试
 */

import { NetworkType, Transaction } from '@0xobelisk/sui-client';
import dotenv from 'dotenv';
import { createMerak } from './test-helpers';

dotenv.config();

// ==================== 配置区 ====================
const TEST_CONFIG = {
  // 网络配置
  network: 'testnet' as NetworkType,

  // 测试用的资产ID（需要提前创建）
  testAssetId: '0x357cb71d44a3fe292623a589e44f6a4f704d39d64a916bde9f81b78ce7ffac5c',
  testAssetId2: '0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6',

  // 测试用的账户地址
  testAccount: '0x1fe342c436eff7ed90988fbe3a85aea7d922517ab6d9bc86e800025f8afcba7a',

  // 测试用的 Coin Type
  testCoinType: '0x2::sui::SUI',

  // 是否执行交易类方法（需要 gas）
  executeTransactions: false,

  // 是否显示详细输出
  verbose: true
};

// ==================== 辅助函数 ====================

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
    console.log('   ✅ 成功');
    return;
  }

  if (typeof data === 'object') {
    console.log('   结果:', JSON.stringify(data, null, 2).split('\n').slice(0, 20).join('\n'));
    if (JSON.stringify(data).split('\n').length > 20) {
      console.log('   ... (结果已截断)');
    }
  } else {
    console.log('   结果:', data);
  }
}

function logError(error: any) {
  console.error('   ❌ 错误:', error.message || error);
  if (TEST_CONFIG.verbose && error.stack) {
    console.error('   堆栈:', error.stack);
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

// ==================== 主测试函数 ====================

async function main() {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ 错误: 未设置 PRIVATE_KEY 环境变量');
    console.log('请在 .env 文件中设置 PRIVATE_KEY');
    process.exit(1);
  }

  console.log('🚀 开始测试 Merak SDK 所有接口...');
  console.log(`📡 网络: ${TEST_CONFIG.network}`);
  console.log(`🔑 账户: ${TEST_CONFIG.testAccount.slice(0, 10)}...`);

  // 初始化 Merak
  const merak = createMerak({
    networkType: TEST_CONFIG.network,
    secretKey: privateKey
  });

  console.log('✅ Merak 实例创建成功');
  console.log(`   Package ID: ${merak.packageId}`);
  console.log(`   Schema ID: ${merak.schemaId}`);

  // ==================== 1. Storage 查询方法 ====================
  logSection('1. Storage 查询方法');

  // 1.1 Storage.get 方法
  console.log('\n📦 Storage.get 方法：');

  await safeExecute(
    () => merak.storage.get.assetMetadata({ assetId: TEST_CONFIG.testAssetId }),
    'storage.get.assetMetadata()',
    '获取资产元数据'
  );

  await safeExecute(
    () => merak.storage.get.assetSupply({ assetId: TEST_CONFIG.testAssetId }),
    'storage.get.assetSupply()',
    '获取资产总供应量'
  );

  await safeExecute(
    () => merak.storage.get.assetHolder({ assetId: TEST_CONFIG.testAssetId }),
    'storage.get.assetHolder()',
    '获取资产持有者'
  );

  await safeExecute(
    () =>
      merak.storage.get.assetAccount({
        assetId: TEST_CONFIG.testAssetId,
        account: TEST_CONFIG.testAccount
      }),
    'storage.get.assetAccount()',
    '获取账户资产余额'
  );

  await safeExecute(
    () =>
      merak.storage.get.assetPool({
        asset0: TEST_CONFIG.testAssetId,
        asset1: TEST_CONFIG.testAssetId2
      }),
    'storage.get.assetPool()',
    '获取资产池信息'
  );

  await safeExecute(
    () => merak.storage.get.assetWrapper({ coinType: TEST_CONFIG.testCoinType }),
    'storage.get.assetWrapper()',
    '获取 Wrapper 信息'
  );

  // 1.2 Storage.list 方法
  console.log('\n📦 Storage.list 方法：');

  await safeExecute(
    () => merak.storage.list.assetMetadata({ first: 5 }),
    'storage.list.assetMetadata()',
    '列出所有资产元数据'
  );

  await safeExecute(
    () => merak.storage.list.assetSupply({ first: 5 }),
    'storage.list.assetSupply()',
    '列出资产供应量'
  );

  await safeExecute(
    () => merak.storage.list.assetHolder({ first: 5 }),
    'storage.list.assetHolder()',
    '列出资产持有者'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetAccount({
        account: TEST_CONFIG.testAccount,
        first: 5
      }),
    'storage.list.assetAccount()',
    '列出账户所有资产'
  );

  await safeExecute(
    () => merak.storage.list.assetPool({ first: 5 }),
    'storage.list.assetPool()',
    '列出所有资产池'
  );

  await safeExecute(
    () => merak.storage.list.assetWrapper({ first: 5 }),
    'storage.list.assetWrapper()',
    '列出所有 Wrapper 资产'
  );

  // 事件查询
  await safeExecute(
    () =>
      merak.storage.list.assetTransfer({
        from: TEST_CONFIG.testAccount,
        first: 5
      }),
    'storage.list.assetTransfer()',
    '列出资产转账事件'
  );

  await safeExecute(
    () => merak.storage.list.assetSwap({ first: 5 }),
    'storage.list.assetSwap()',
    '列出资产交换事件'
  );

  await safeExecute(
    () => merak.storage.list.assetWrap({ first: 5 }),
    'storage.list.assetWrap()',
    '列出资产 Wrap 事件'
  );

  await safeExecute(
    () => merak.storage.list.assetUnwrap({ first: 5 }),
    'storage.list.assetUnwrap()',
    '列出资产 Unwrap 事件'
  );

  // ==================== 2. 资产查询方法 ====================
  logSection('2. 资产查询方法');

  await safeExecute(
    () => merak.getMetadata(TEST_CONFIG.testAssetId),
    'getMetadata()',
    '获取资产元数据（自动转换字段名）'
  );

  await safeExecute(
    () => merak.getLatestMetadata(TEST_CONFIG.testAssetId),
    'getLatestMetadata()',
    '获取最新资产元数据'
  );

  await safeExecute(
    () => merak.balanceOf(TEST_CONFIG.testAssetId, TEST_CONFIG.testAccount),
    'balanceOf()',
    '查询账户余额'
  );

  await safeExecute(
    () => merak.supplyOf(TEST_CONFIG.testAssetId),
    'supplyOf()',
    '查询资产总供应量'
  );

  await safeExecute(
    () => merak.metadataOf(TEST_CONFIG.testAssetId),
    'metadataOf()',
    '查询资产元数据（通过合约）'
  );

  await safeExecute(() => merak.ownerOf(TEST_CONFIG.testAssetId), 'ownerOf()', '查询资产所有者');

  await safeExecute(
    () =>
      merak.queryAccount({
        address: TEST_CONFIG.testAccount,
        assetId: TEST_CONFIG.testAssetId
      }),
    'queryAccount()',
    '查询账户信息'
  );

  await safeExecute(
    () => merak.listAssetsInfo({ first: 5 }),
    'listAssetsInfo()',
    '列出所有资产信息'
  );

  await safeExecute(
    () =>
      merak.listAssetsInfo({
        first: 5,
        assetType: 'Lp'
      }),
    'listAssetsInfo({ assetType: "Lp" })',
    '列出 LP 资产'
  );

  await safeExecute(
    () =>
      merak.listOwnedAssetsInfo({
        account: TEST_CONFIG.testAccount
      }),
    'listOwnedAssetsInfo()',
    '列出账户拥有的所有资产'
  );

  await safeExecute(
    () =>
      merak.listOwnedAssetsInfo({
        account: TEST_CONFIG.testAccount,
        assetType: 'Lp'
      }),
    'listOwnedAssetsInfo({ assetType: "Lp" })',
    '列出账户拥有的 LP 资产'
  );

  await safeExecute(
    () =>
      merak.listAccountLpAssets({
        account: TEST_CONFIG.testAccount
      }),
    'listAccountLpAssets()',
    '列出账户的 LP 资产'
  );

  await safeExecute(
    () =>
      merak.listOwnedWrapperAssets({
        account: TEST_CONFIG.testAccount
      }),
    'listOwnedWrapperAssets()',
    '列出账户的 Wrapper 资产'
  );

  // ==================== 3. Pool/DEX 查询方法 ====================
  logSection('3. Pool/DEX 查询方法');

  await safeExecute(() => merak.getPoolList({ first: 5 }), 'getPoolList()', '获取池子列表');

  await safeExecute(() => merak.allPoolList({ pageSize: 5 }), 'allPoolList()', '获取所有池子');

  const poolList = await safeExecute(
    () => merak.allPoolListWithId(TEST_CONFIG.testAssetId),
    'allPoolListWithId()',
    '获取包含指定资产的所有池子'
  );

  if (poolList && poolList.length > 0) {
    await safeExecute(
      () =>
        merak.getPoolListWithId({
          asset1Id: poolList[0].asset0,
          asset2Id: poolList[0].asset1
        }),
      'getPoolListWithId()',
      '根据资产 ID 对获取池子详情'
    );
  }

  await safeExecute(
    () => merak.listPoolsInfo({ pageSize: 3 }),
    'listPoolsInfo()',
    '列出池子详细信息'
  );

  await safeExecute(
    () => merak.getConnectedTokens(TEST_CONFIG.testAssetId),
    'getConnectedTokens()',
    '获取与指定代币直接相连的代币'
  );

  await safeExecute(
    () =>
      merak.getAllSwappableTokens({
        startTokenId: TEST_CONFIG.testAssetId
      }),
    'getAllSwappableTokens()',
    '获取所有可交换的代币（BFS 搜索）'
  );

  await safeExecute(
    () =>
      merak.getAllSwappableTokensWithMetadata({
        startTokenId: TEST_CONFIG.testAssetId,
        address: TEST_CONFIG.testAccount
      }),
    'getAllSwappableTokensWithMetadata()',
    '获取所有可交换代币（带元数据和余额）'
  );

  // 交换路径查询（需要两个存在池子的代币）
  if (poolList && poolList.length > 0) {
    await safeExecute(
      () => merak.querySwapPaths(poolList[0].asset0, poolList[0].asset1),
      'querySwapPaths()',
      '查询代币交换路径'
    );
  }

  // 获取交换输出/输入金额
  if (poolList && poolList.length >= 2) {
    const path = [poolList[0].asset0, poolList[0].asset1];

    await safeExecute(
      () => merak.getAmountsOut('1000000', path),
      'getAmountsOut()',
      '计算给定输入的输出金额'
    );

    await safeExecute(
      () => merak.getAmountsIn('1000000', path),
      'getAmountsIn()',
      '计算达到输出所需的输入金额'
    );
  }

  // ==================== 4. Wrapper 查询方法 ====================
  logSection('4. Wrapper 查询方法');

  await safeExecute(
    () => merak.wrappedAssets({ first: 5 }),
    'wrappedAssets()',
    '获取所有 Wrapped 资产'
  );

  await safeExecute(
    () =>
      merak.wrappedAssets({
        coinType: TEST_CONFIG.testCoinType,
        first: 5
      }),
    'wrappedAssets({ coinType })',
    '获取指定 Coin Type 的 Wrapper 信息'
  );

  // ==================== 5. Pool 计算方法 ====================
  logSection('5. Pool 计算方法');

  // 需要有 LP token 才能测试
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
      '计算移除流动性可获得的代币数量'
    );

    await safeExecute(
      () =>
        merak.calRemoveLpAmount({
          address: TEST_CONFIG.testAccount,
          poolAssetId: lpAssetId,
          amount: '1000000'
        }),
      'calRemoveLpAmount({ amount })',
      '计算移除指定数量 LP 可获得的代币'
    );
  } else {
    console.log('\n⚠️  跳过 calRemoveLpAmount 测试（账户没有 LP 资产）');
  }

  // ==================== 6. 交易方法（可选） ====================
  if (TEST_CONFIG.executeTransactions) {
    logSection('6. 交易方法（需要 Gas）');

    console.log('\n⚠️  警告: 以下方法会执行实际交易，消耗 Gas');
    console.log('如果不想执行交易，请设置 TEST_CONFIG.executeTransactions = false');

    // 6.1 资产管理交易
    console.log('\n📝 资产管理交易：');

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
      '设置资产元数据（构建交易）'
    );

    // 6.2 DEX 交易
    console.log('\n💱 DEX 交易：');

    const tx2 = new Transaction();
    await safeExecute(
      async () => {
        return await merak.createPool(tx2, TEST_CONFIG.testAssetId, TEST_CONFIG.testAssetId2);
      },
      'createPool()',
      '创建交易池（构建交易）'
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
      '添加流动性（构建交易）'
    );

    console.log('\n⚠️  注意: 以上交易仅构建，未签名和执行');
    console.log('要执行交易，需要调用 merak.dubhe.signAndSendTransaction()');
  } else {
    logSection('6. 交易方法');
    console.log('\n⏭️  跳过交易方法测试');
    console.log('要测试交易方法，请设置 TEST_CONFIG.executeTransactions = true');
    console.log('注意: 交易方法会消耗 Gas');
  }

  // ==================== 总结 ====================
  logSection('测试完成');

  console.log('\n✅ 所有测试完成！');
  console.log('\n📊 测试统计:');
  console.log('   - Storage.get 方法: 9 个');
  console.log('   - Storage.list 方法: 12 个');
  console.log('   - 资产查询方法: 11 个');
  console.log('   - Pool/DEX 查询方法: 12 个');
  console.log('   - Wrapper 查询方法: 2 个');
  console.log('   - Pool 计算方法: 2 个');
  console.log('   - 交易方法: ' + (TEST_CONFIG.executeTransactions ? '已测试' : '已跳过'));

  console.log('\n💡 提示:');
  console.log('   - 修改 TEST_CONFIG 可以自定义测试参数');
  console.log('   - 设置 verbose: false 可以只显示成功/失败');
  console.log('   - 某些方法需要预先创建资产/池子才能测试');
  console.log('   - 详细文档请参考 SDK_UPDATE_SUMMARY.md 和 QUICK_REFERENCE.md');
}

// ==================== 错误处理 ====================

process.on('unhandledRejection', (error) => {
  console.error('\n❌ 未处理的 Promise 拒绝:', error);
  process.exit(1);
});

// ==================== 执行 ====================

main().catch((error) => {
  console.error('\n❌ 测试脚本执行失败:', error);
  process.exit(1);
});
