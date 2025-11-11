/**
 * Wrap SUI for Tests
 *
 * Quick script to wrap SUI to get enough Asset B (Wrapped SUI) for testing
 *
 * Usage:
 * pnpm exec ts-node -r tsconfig-paths/register scripts/wrap-sui-for-tests.ts
 */

import { Dubhe, NetworkType, Transaction, SuiMoveNormalizedModules } from '@0xobelisk/sui-client';
import { DubheGraphqlClient } from '@0xobelisk/graphql-client';
import { Merak } from '../src/merak';
import * as deployment from '../../contracts/deployment';
import contractMetadataJson from '../../contracts/metadata.json';
import dubheMetadataJson from '../../contracts/dubhe.config.json';
import dotenv from 'dotenv';

dotenv.config();

const contractMetadata = contractMetadataJson as SuiMoveNormalizedModules;
const dubheMetadata = dubheMetadataJson;
const PACKAGE_ID = deployment.PACKAGE_ID;
const DUBHE_SCHEMA_ID = deployment.DUBHE_SCHEMA_ID;

const WRAPPED_SUI_ASSET_ID = '0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6';

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

async function main() {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    logError('PRIVATE_KEY environment variable not set');
    console.log('Please set PRIVATE_KEY in .env file');
    process.exit(1);
  }

  logSection('Wrap SUI for Testing');

  // Initialize Merak
  const networkType = 'testnet' as NetworkType;
  const fullnodeUrl = 'https://fullnode.testnet.sui.io:443';

  const dubhe = new Dubhe({
    networkType,
    secretKey: privateKey,
    fullnodeUrls: [fullnodeUrl, ''],
    packageId: PACKAGE_ID,
    metadata: contractMetadata
  });

  const graphql = new DubheGraphqlClient({
    endpoint: 'https://dubhe-framework-testnet-api.obelisk.build/graphql',
    subscriptionEndpoint: 'wss://dubhe-framework-testnet-api.obelisk.build/graphql',
    dubheMetadata
  });

  const merak = new Merak({
    network: networkType,
    dubhe,
    graphql,
    schemaId: DUBHE_SCHEMA_ID
  });

  const accountAddress = merak.dubhe.currentAddress();
  logInfo('Account Address', accountAddress);

  // Check current balances
  logStep('Checking current balances');
  const suiBalance = await merak.dubhe.balanceOf();
  const suiBalanceInSUI = Number(suiBalance) / 1e9;
  logInfo('Native SUI Balance', `${suiBalanceInSUI.toFixed(6)} SUI`);

  const wrappedBalance = await merak.balanceOf(WRAPPED_SUI_ASSET_ID);
  logInfo('Current Wrapped SUI Balance', wrappedBalance.balance);

  // Calculate how much we need
  const currentWrapped = BigInt(wrappedBalance.balance);
  const requiredWrapped = BigInt(25000000); // Need 25M for tests
  const shortage = requiredWrapped - currentWrapped;

  if (shortage <= 0n) {
    logSuccess('You already have enough Wrapped SUI for all tests!');
    return;
  }

  const wrapAmountInSUI = Number(shortage) / 1e9;
  logInfo('Shortage', `${shortage.toString()} (${wrapAmountInSUI.toFixed(6)} SUI)`);

  // Add a bit extra for safety (10% buffer)
  const wrapAmountWithBuffer = Number(shortage) * 1.1;
  const wrapAmountWithBufferInSUI = wrapAmountWithBuffer / 1e9;

  if (suiBalanceInSUI < wrapAmountWithBufferInSUI + 0.01) {
    logError(`Insufficient SUI balance for wrapping`);
    logInfo('Available', `${suiBalanceInSUI.toFixed(6)} SUI`);
    logInfo('Needed', `${(wrapAmountWithBufferInSUI + 0.01).toFixed(6)} SUI (including gas)`);
    console.log(
      '\n💡 Get more testnet SUI from: https://discord.com/channels/916379725201563759/971488439931392130'
    );
    process.exit(1);
  }

  // Wrap SUI
  logSection('Wrapping SUI');
  logStep(`Wrapping ${wrapAmountWithBufferInSUI.toFixed(6)} SUI`);
  const wrapAmount = Math.floor(wrapAmountWithBuffer);
  logInfo('Amount (smallest units)', wrapAmount.toString());

  const tx = new Transaction();

  // Split coins from gas to get the amount to wrap
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(wrapAmount)]);

  logStep('Building and executing wrap transaction');
  const coinType = '0x2::sui::SUI';
  const result = await merak.wrap(tx, coin, accountAddress, coinType);

  logSuccess('Wrap transaction submitted');
  logInfo('Transaction Hash', (result as any).digest);
  console.log('\n⏳ Waiting 10 seconds for transaction to be confirmed...');

  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Check new balance
  logStep('Verifying new balance');
  const newWrappedBalance = await merak.balanceOf(WRAPPED_SUI_ASSET_ID);
  logInfo('New Wrapped SUI Balance', newWrappedBalance.balance);

  const balanceIncrease = BigInt(newWrappedBalance.balance) - currentWrapped;
  logSuccess(`Wrapped ${balanceIncrease.toString()} successfully!`);

  const newShortage = requiredWrapped - BigInt(newWrappedBalance.balance);
  if (newShortage <= 0n) {
    logSuccess('✨ You now have enough Wrapped SUI for all tests!');
    console.log('\n📝 You can now run: pnpm test');
  } else {
    logInfo('Still need', newShortage.toString());
    console.log('\n💡 Run this script again to wrap more SUI');
  }
}

main().catch(console.error);
