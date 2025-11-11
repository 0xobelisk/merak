// ==================== Main Test Function ====================

import { createMerak, TEST_CONFIG } from './test-helpers';
import { NetworkType, SuiTransactionBlockResponse, Transaction } from '@0xobelisk/sui-client';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('🚀 Starting Storage query methods test...');
  console.log(`📡 Network: ${TEST_CONFIG.network}`);

  // Initialize Merak (no private key needed, query only)
  const merak = createMerak({
    networkType: TEST_CONFIG.network,
    secretKey: process.env.PRIVATE_KEY
  });

  console.log('✅ 1. Merak instance created successfully');
  console.log(`   Package ID: ${merak.packageId}`);
  console.log(`   Schema ID: ${merak.schemaId}`);

  const accountAddress = merak.dubhe.currentAddress();
  console.log('Account Address:', accountAddress);

  const balance = await merak.dubhe.balanceOf();
  console.log('Balance:', balance);

  const account = await merak.assets.balanceOf(
    TEST_CONFIG.testAssetId
    // '0x62dc79e388dfa16f3b02d974108a6ccd189b72a267667818ae69d1a816e3b6b6'
  );
  console.log('Account balanceOf with merak:', account);

  const dubheDecimals = 7;

  ///
  /// ====================== unwrap
  ///
  console.log('\n🔄 开始执行 UNWRAP 操作...');

  const unwrapTx = new Transaction();
  const amountToUnwrap = 100000;
  const unwrapAmountInSmallestUnit = BigInt(
    Math.floor(amountToUnwrap * Math.pow(10, dubheDecimals))
  );

  // 记录 unwrap 前的余额
  const balanceBeforeUnwrap = await merak.assets.balanceOf(TEST_CONFIG.testAssetId);
  console.log('💰 Unwrap 前余额:', balanceBeforeUnwrap);
  console.log('📤 Unwrap 数量:', unwrapAmountInSmallestUnit.toString());

  const unwrapRes = (await merak.unwrap(
    unwrapTx,
    unwrapAmountInSmallestUnit,
    accountAddress,
    '0x8c7013745af0eb1ab211cde05b40ee6e2130276664d7e3e3741a36f11fa9f20b::dubhe::DUBHE'
  )) as SuiTransactionBlockResponse;
  console.log('📝 交易哈希:', unwrapRes.digest);
  console.log('⏳ 等待交易确认...');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // 验证 unwrap 后的余额
  const balanceAfterUnwrap = await merak.assets.balanceOf(TEST_CONFIG.testAssetId);
  console.log('💰 Unwrap 后余额:', balanceAfterUnwrap);

  const expectedDecrease = unwrapAmountInSmallestUnit;
  const actualDecrease = BigInt(balanceBeforeUnwrap[0]) - BigInt(balanceAfterUnwrap[0]);

  if (actualDecrease === expectedDecrease) {
    console.log(
      '✅ UNWRAP 成功! 余额减少:',
      actualDecrease.toString(),
      '(预期:',
      expectedDecrease.toString(),
      ')'
    );
  } else {
    console.error(
      '❌ UNWRAP 失败! 余额减少:',
      actualDecrease.toString(),
      '(预期:',
      expectedDecrease.toString(),
      ')'
    );
    throw new Error('Unwrap verification failed');
  }

  console.log('\n🎉 所有测试通过!');
}

main();
