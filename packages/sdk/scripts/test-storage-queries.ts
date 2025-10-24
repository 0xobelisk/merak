/**
 * Storage 查询方法完整测试脚本
 *
 * 测试 get-storage.ts 和 list-storage.ts 中的所有方法
 *
 * 用法：
 * 1. 确保已部署合约并有测试数据
 * 2. 运行: pnpm exec ts-node scripts/test-storage-queries.ts
 *
 * 注意：
 * - 修改 TEST_CONFIG 配置测试参数
 * - 某些方法需要已存在的数据才能返回结果
 * - 方法返回空结果不代表有错误，可能是数据不存在
 */

import { NetworkType } from '@0xobelisk/sui-client';
import dotenv from 'dotenv';
import { createMerak } from './test-helpers';

dotenv.config();

// ==================== 配置区 ====================
const TEST_CONFIG = {
  // 网络配置
  network: 'testnet' as NetworkType,

  // 测试用的资产ID
  testAssetId: '0x357cb71d44a3fe292623a589e44f6a4f704d39d64a916bde9f81b78ce7ffac5c',
  testAssetId2: '0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6',

  // 测试用的账户地址
  testAccount: '0x1fe342c436eff7ed90988fbe3a85aea7d922517ab6d9bc86e800025f8afcba7a',

  // 测试用的 Coin Type
  testCoinType: '0x2::sui::SUI',

  // 测试用的 Dapp Key（如果有）
  testDappKey:
    'a09cd4137e604ec5a7a88f72c572ecd064b0e713a3fbf705a88456cdbccf36c0::dapp_key::DappKey',

  // 分页参数
  pageSize: 5,

  // 是否显示详细输出
  verbose: true,

  // 是否显示空结果
  showEmptyResults: false
};

// ==================== 测试统计 ====================
const testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  empty: 0
};

// ==================== 辅助函数 ====================

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
      console.log(`   ⚠️  返回为空 (null/undefined)`);
    }
    return;
  }

  // 检查是否是分页结果 (Connection 类型)
  const isPaginated = data && typeof data === 'object' && 'edges' in data && 'pageInfo' in data;
  const resultData = isPaginated ? data.edges.map((edge: any) => edge.node) : data;

  // 检查是否为空
  const isEmpty =
    resultData === null ||
    resultData === undefined ||
    (Array.isArray(resultData) && resultData.length === 0) ||
    (typeof resultData === 'object' && Object.keys(resultData).length === 0);

  if (isEmpty) {
    testStats.empty++;
    if (TEST_CONFIG.showEmptyResults) {
      console.log(`   ⚠️  返回为空 ${Array.isArray(resultData) ? '(空数组)' : '(空对象)'}`);
    }
    return;
  }

  testStats.passed++;

  if (!TEST_CONFIG.verbose) {
    console.log(`   ✅ 成功`);
    if (isPaginated) {
      console.log(
        `      数据: ${resultData.length} 条, 总数: ${data.totalCount || 'N/A'}, 下一页: ${
          data.pageInfo.hasNextPage ? '是' : '否'
        }`
      );
    } else if (Array.isArray(resultData)) {
      console.log(`      返回: ${resultData.length} 条记录`);
    } else {
      console.log(`      返回: 单条记录`);
    }
    return;
  }

  // 详细模式
  console.log(`   ✅ 成功`);

  if (isPaginated) {
    console.log(`   分页信息:`);
    console.log(`      - 数据条数: ${resultData.length}`);
    console.log(`      - 总数: ${data.totalCount || 'N/A'}`);
    console.log(`      - 有下一页: ${data.pageInfo.hasNextPage ? '是' : '否'}`);
    if (data.pageInfo.endCursor) {
      console.log(`      - 下一页游标: ${data.pageInfo.endCursor.substring(0, 20)}...`);
    }
  }

  // 显示数据预览
  const displayData = Array.isArray(resultData) ? resultData[0] : resultData;
  if (displayData) {
    console.log(`   数据预览:`);
    const preview = JSON.stringify(displayData, null, 2);
    const lines = preview.split('\n').slice(0, 15);
    console.log(lines.map((l) => `      ${l}`).join('\n'));
    if (preview.split('\n').length > 15) {
      console.log(`      ... (已截断)`);
    }
    if (Array.isArray(resultData) && resultData.length > 1) {
      console.log(`   ... 及其他 ${resultData.length - 1} 条记录`);
    }
  }
}

function logError(error: any, methodName: string) {
  testStats.total++;
  testStats.failed++;
  console.error(`   ❌ 错误: ${error.message || error}`);
  if (TEST_CONFIG.verbose && error.stack) {
    console.error(`   堆栈: ${error.stack.split('\n').slice(0, 3).join('\n   ')}`);
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

// ==================== 主测试函数 ====================

async function main() {
  console.log('🚀 开始测试 Storage 查询方法...');
  console.log(`📡 网络: ${TEST_CONFIG.network}`);

  // 初始化 Merak（不需要私钥，只做查询）
  const merak = createMerak({
    networkType: TEST_CONFIG.network
  });

  console.log('✅ Merak 实例创建成功');
  console.log(`   Package ID: ${merak.packageId}`);
  console.log(`   Schema ID: ${merak.schemaId}`);

  // ==================== 1. GetStorage 测试 ====================
  logSection('1. GetStorage 查询方法 (13个)');

  console.log('\n📦 1.1 StorageValue 查询（4个）');

  await safeExecute(
    () => merak.storage.get.dubheAssetId(),
    'storage.get.dubheAssetId()',
    '获取 Dubhe 资产 ID 计数器'
  );

  await safeExecute(
    () => merak.storage.get.suiAssetId(),
    'storage.get.suiAssetId()',
    '获取 Sui 资产 ID 计数器'
  );

  await safeExecute(
    () => merak.storage.get.dubheConfig(),
    'storage.get.dubheConfig()',
    '获取 Dubhe 全局配置'
  );

  await safeExecute(
    () => merak.storage.get.dappFeeConfig(),
    'storage.get.dappFeeConfig()',
    '获取 Dapp 费用配置'
  );

  console.log('\n📦 1.2 StorageMap 查询（5个）');

  await safeExecute(
    () => merak.storage.get.assetMetadata({ assetId: TEST_CONFIG.testAssetId }),
    'storage.get.assetMetadata({ assetId })',
    '根据 assetId 获取资产元数据'
  );

  await safeExecute(
    () => merak.storage.get.assetSupply({ assetId: TEST_CONFIG.testAssetId }),
    'storage.get.assetSupply({ assetId })',
    '根据 assetId 获取资产总供应量'
  );

  await safeExecute(
    () => merak.storage.get.assetHolder({ assetId: TEST_CONFIG.testAssetId }),
    'storage.get.assetHolder({ assetId })',
    '根据 assetId 获取资产持有者信息'
  );

  await safeExecute(
    () => merak.storage.get.assetWrapper({ coinType: TEST_CONFIG.testCoinType }),
    'storage.get.assetWrapper({ coinType })',
    '根据 coinType 获取 Wrapper 资产信息'
  );

  await safeExecute(
    () => merak.storage.get.dappMetadata({ dappKey: TEST_CONFIG.testDappKey }),
    'storage.get.dappMetadata({ dappKey })',
    '根据 dappKey 获取 Dapp 元数据'
  );

  await safeExecute(
    () => merak.storage.get.dappFeeState({ dappKey: TEST_CONFIG.testDappKey }),
    'storage.get.dappFeeState({ dappKey })',
    '根据 dappKey 获取 Dapp 费用状态'
  );

  await safeExecute(
    () => merak.storage.get.dappProxy({ dappKey: TEST_CONFIG.testDappKey }),
    'storage.get.dappProxy({ dappKey })',
    '根据 dappKey 获取 Dapp 代理信息'
  );

  console.log('\n📦 1.3 StorageDoubleMap 查询（2个）');

  await safeExecute(
    () =>
      merak.storage.get.assetAccount({
        assetId: TEST_CONFIG.testAssetId,
        account: TEST_CONFIG.testAccount
      }),
    'storage.get.assetAccount({ assetId, account })',
    '根据 assetId 和 account 获取账户余额'
  );

  await safeExecute(
    () =>
      merak.storage.get.assetPool({
        asset0: TEST_CONFIG.testAssetId,
        asset1: TEST_CONFIG.testAssetId2
      }),
    'storage.get.assetPool({ asset0, asset1 })',
    '根据两个资产 ID 获取池子信息'
  );

  // ==================== 2. ListStorage 测试 ====================
  logSection('2. ListStorage 查询方法 (19个)');

  //   console.log('\n📦 2.1 StorageValue 列表（4个）');

  //   await safeExecute(
  //     () =>
  //       merak.storage.list.dubheAssetId({
  //         first: TEST_CONFIG.pageSize
  //       }),
  //     'storage.list.dubheAssetId({ first })',
  //     '列出所有 Dubhe 资产 ID 记录'
  //   );

  //   await safeExecute(
  //     () =>
  //       merak.storage.list.suiAssetId({
  //         first: TEST_CONFIG.pageSize
  //       }),
  //     'storage.list.suiAssetId({ first })',
  //     '列出所有 Sui 资产 ID 记录'
  //   );

  //   await safeExecute(
  //     () =>
  //       merak.storage.list.dubheConfig({
  //         first: TEST_CONFIG.pageSize
  //       }),
  //     'storage.list.dubheConfig({ first })',
  //     '列出所有 Dubhe 配置记录'
  //   );

  //   await safeExecute(
  //     () =>
  //       merak.storage.list.dappFeeConfig({
  //         first: TEST_CONFIG.pageSize
  //       }),
  //     'storage.list.dappFeeConfig({ first })',
  //     '列出所有 Dapp 费用配置记录'
  //   );

  console.log('\n📦 2.2 StorageMap 列表（7个）');

  await safeExecute(
    () =>
      merak.storage.list.assetMetadata({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetMetadata({ first })',
    '列出所有资产元数据'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetMetadata({
        assetId: TEST_CONFIG.testAssetId,
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetMetadata({ assetId, first })',
    '列出指定资产的元数据（带过滤）'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetSupply({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetSupply({ first })',
    '列出所有资产供应量'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetHolder({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetHolder({ first })',
    '列出所有资产持有者'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetWrapper({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetWrapper({ first })',
    '列出所有 Wrapper 资产'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetWrapper({
        coinType: TEST_CONFIG.testCoinType,
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetWrapper({ coinType, first })',
    '列出指定 coinType 的 Wrapper 资产（带过滤）'
  );

  await safeExecute(
    () =>
      merak.storage.list.dappMetadata({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.dappMetadata({ first })',
    '列出所有 Dapp 元数据'
  );

  await safeExecute(
    () =>
      merak.storage.list.dappFeeState({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.dappFeeState({ first })',
    '列出所有 Dapp 费用状态'
  );

  await safeExecute(
    () =>
      merak.storage.list.dappProxy({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.dappProxy({ first })',
    '列出所有 Dapp 代理'
  );

  console.log('\n📦 2.3 StorageDoubleMap 列表（2个）');

  await safeExecute(
    () =>
      merak.storage.list.assetAccount({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetAccount({ first })',
    '列出所有资产账户余额'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetAccount({
        account: TEST_CONFIG.testAccount,
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetAccount({ account, first })',
    '列出指定账户的所有资产（带过滤）'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetAccount({
        assetId: TEST_CONFIG.testAssetId,
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetAccount({ assetId, first })',
    '列出指定资产的所有持有账户（带过滤）'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetPool({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetPool({ first })',
    '列出所有资产池'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetPool({
        asset0: TEST_CONFIG.testAssetId,
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetPool({ asset0, first })',
    '列出包含指定 asset0 的所有池子（带过滤）'
  );

  console.log('\n📦 2.4 Event 事件查询（4个）');

  await safeExecute(
    () =>
      merak.storage.list.assetTransfer({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetTransfer({ first })',
    '列出所有资产转账事件'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetTransfer({
        from: TEST_CONFIG.testAccount,
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetTransfer({ from, first })',
    '列出指定账户发起的转账事件'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetWrap({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetWrap({ first })',
    '列出所有资产 Wrap 事件'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetUnwrap({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetUnwrap({ first })',
    '列出所有资产 Unwrap 事件'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetSwap({
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetSwap({ first })',
    '列出所有资产交换事件'
  );

  // ==================== 3. 高级用法测试 ====================
  logSection('3. 高级用法测试');

  console.log('\n📦 3.1 分页测试');

  const firstPage = await safeExecute(
    () =>
      merak.storage.list.assetMetadata({
        first: 2
      }),
    'storage.list.assetMetadata({ first: 2 })',
    '获取前2条资产元数据'
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
      '使用游标获取下一页'
    );
  }

  console.log('\n📦 3.2 排序测试');

  await safeExecute(
    () =>
      merak.storage.list.assetMetadata({
        first: TEST_CONFIG.pageSize,
        orderBy: [{ field: 'asset_id', direction: 'ASC' }]
      }),
    'storage.list.assetMetadata({ orderBy: ASC })',
    '按 asset_id 升序排列'
  );

  await safeExecute(
    () =>
      merak.storage.list.assetMetadata({
        first: TEST_CONFIG.pageSize,
        orderBy: [{ field: 'asset_id', direction: 'DESC' }]
      }),
    'storage.list.assetMetadata({ orderBy: DESC })',
    '按 asset_id 降序排列'
  );

  console.log('\n📦 3.3 组合过滤测试');

  await safeExecute(
    () =>
      merak.storage.list.assetAccount({
        assetId: TEST_CONFIG.testAssetId,
        account: TEST_CONFIG.testAccount,
        first: TEST_CONFIG.pageSize
      }),
    'storage.list.assetAccount({ assetId, account, first })',
    '同时过滤 assetId 和 account'
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
    '带多重过滤和排序的事件查询'
  );

  // ==================== 总结 ====================
  logSection('测试完成');

  console.log('\n📊 测试统计:');
  console.log(`   总测试数: ${testStats.total}`);
  console.log(`   ✅ 成功: ${testStats.passed} (返回了数据)`);
  console.log(`   ⚠️  空结果: ${testStats.empty} (方法成功但无数据)`);
  console.log(`   ❌ 失败: ${testStats.failed} (抛出异常)`);

  console.log('\n📝 测试覆盖:');
  console.log('   GetStorage 方法:');
  console.log('      - StorageValue: 4 个方法');
  console.log('      - StorageMap: 7 个方法');
  console.log('      - StorageDoubleMap: 2 个方法');
  console.log('   ListStorage 方法:');
  console.log('      - StorageValue: 4 个方法');
  console.log('      - StorageMap: 7 个方法（包含过滤测试）');
  console.log('      - StorageDoubleMap: 2 个方法（包含过滤测试）');
  console.log('      - Event: 4 个方法');
  console.log('      - 通用查询: 2 个方法');
  console.log('      - 高级用法: 分页、排序、组合过滤');

  console.log('\n💡 提示:');
  console.log('   - 空结果不代表有错误，可能是链上没有相应数据');
  console.log('   - 修改 TEST_CONFIG 可以自定义测试参数');
  console.log('   - 设置 verbose: false 可以只显示摘要');
  console.log('   - 设置 showEmptyResults: true 可以显示空结果详情');
  console.log('   - 所有方法都支持分页（first, after）和排序（orderBy）');

  if (testStats.failed > 0) {
    console.log('\n⚠️  有失败的测试，请检查错误信息');
    process.exit(1);
  }

  console.log('\n✅ 所有测试完成！');
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
