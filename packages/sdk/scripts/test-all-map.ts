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

  const account = await merak.balanceOf(
    TEST_CONFIG.testAssetId
    // '0x62dc79e388dfa16f3b02d974108a6ccd189b72a267667818ae69d1a816e3b6b6'
  );
  console.log('Account balanceOf with merak:', account);
  const account2 = await merak.balanceOf(
    TEST_CONFIG.testAssetId2
    // '0x62dc79e388dfa16f3b02d974108a6ccd189b72a267667818ae69d1a816e3b6b6'
  );
  console.log('Account 2 balanceOf with merak:', account2);

  const tx = new Transaction();

  const amountToWrap = 0.0001;
  const suiDecimals = 9;

  const amountInSmallestUnit = Math.floor(amountToWrap * 10 ** suiDecimals);

  ///
  /// ====================== wrap
  ///
  console.log('\n🔄 开始执行 WRAP 操作...');

  // 记录 wrap 前的余额
  const balanceBeforeWrap = await merak.balanceOf(TEST_CONFIG.testAssetId2);
  console.log('💰 Wrap 前余额:', balanceBeforeWrap);

  // Ensure sufficient tokens are selected
  const selectCoins = await merak.dubhe.selectCoinsWithAmount(
    amountInSmallestUnit,
    '0x2::sui::SUI',
    accountAddress
  );

  if (!selectCoins || selectCoins.length === 0) {
    throw new Error('Unable to select sufficient tokens');
  }
  console.log('Select Coins:', selectCoins);

  // Use tx.gas for SUI tokens, otherwise use selected tokens
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInSmallestUnit)]);
  // const [coin] = sourceToken.includes('0x2::sui::SUI')
  // ?
  // : tx.splitCoins(tx.object(selectCoins[0]), [tx.pure.u64(amountInSmallestUnit)]);

  // Use processed token format
  const res = (await merak.wrap(
    tx,
    coin,
    accountAddress,
    '0x2::sui::SUI'
  )) as SuiTransactionBlockResponse;

  console.log('📝 交易哈希:', res.digest);
  console.log('⏳ 等待交易确认...');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // 验证 wrap 后的余额
  const balanceAfterWrap = await merak.balanceOf(TEST_CONFIG.testAssetId2);
  console.log('💰 Wrap 后余额:', balanceAfterWrap);

  const expectedIncrease = BigInt(amountInSmallestUnit);
  const actualIncrease = BigInt(balanceAfterWrap.balance) - BigInt(balanceBeforeWrap.balance);

  if (actualIncrease === expectedIncrease) {
    console.log(
      '✅ WRAP 成功! 余额增加:',
      actualIncrease.toString(),
      '(预期:',
      expectedIncrease.toString(),
      ')'
    );
  } else {
    console.error(
      '❌ WRAP 失败! 余额增加:',
      actualIncrease.toString(),
      '(预期:',
      expectedIncrease.toString(),
      ')'
    );
    throw new Error('Wrap verification failed');
  }

  ///
  /// ====================== unwrap
  ///
  console.log('\n🔄 开始执行 UNWRAP 操作...');

  const unwrapTx = new Transaction();
  const amountToUnwrap = 0.00001;
  const unwrapAmountInSmallestUnit = BigInt(Math.floor(amountToUnwrap * Math.pow(10, suiDecimals)));

  // 记录 unwrap 前的余额
  const balanceBeforeUnwrap = await merak.balanceOf(TEST_CONFIG.testAssetId2);
  console.log('💰 Unwrap 前余额:', balanceBeforeUnwrap);
  console.log('📤 Unwrap 数量:', unwrapAmountInSmallestUnit.toString());

  const unwrapRes = (await merak.unwrap(
    unwrapTx,
    unwrapAmountInSmallestUnit,
    accountAddress,
    '0x2::sui::SUI'
  )) as SuiTransactionBlockResponse;
  console.log('📝 交易哈希:', unwrapRes.digest);
  console.log('⏳ 等待交易确认...');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // 验证 unwrap 后的余额
  const balanceAfterUnwrap = await merak.balanceOf(TEST_CONFIG.testAssetId2);
  console.log('💰 Unwrap 后余额:', balanceAfterUnwrap);

  const expectedDecrease = unwrapAmountInSmallestUnit;
  const actualDecrease = BigInt(balanceBeforeUnwrap.balance) - BigInt(balanceAfterUnwrap.balance);

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
