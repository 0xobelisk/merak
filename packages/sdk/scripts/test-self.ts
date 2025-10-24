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
