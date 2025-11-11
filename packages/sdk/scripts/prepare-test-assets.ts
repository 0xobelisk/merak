/**
 * Prepare Test Assets
 *
 * This script helps you prepare assets for testing by:
 * 1. Checking current balances
 * 2. Wrapping SUI to get Asset B if needed
 * 3. Providing instructions for getting Asset A
 *
 * Usage:
 * 1. Set PRIVATE_KEY in .env file
 * 2. Run: pnpm exec ts-node -r tsconfig-paths/register scripts/prepare-test-assets.ts
 */

import { Merak } from '../src/merak';
import { Dubhe, NetworkType, Transaction, SuiMoveNormalizedModules } from '@0xobelisk/sui-client';
import { DubheGraphqlClient } from '@0xobelisk/graphql-client';
import * as deployment from '../../contracts/deployment';
import contractMetadataJson from '../../contracts/metadata.json';
import dubheMetadataJson from '../../contracts/dubhe.config.json';
import dotenv from 'dotenv';

dotenv.config();

const contractMetadata = contractMetadataJson as SuiMoveNormalizedModules;
const dubheMetadata = dubheMetadataJson;
const PACKAGE_ID = deployment.PACKAGE_ID;
const DUBHE_SCHEMA_ID = deployment.DUBHE_SCHEMA_ID;

const TEST_ASSETS = {
  ASSET_A: '0x357cb71d44a3fe292623a589e44f6a4f704d39d64a916bde9f81b78ce7ffac5c',
  ASSET_B: '0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6' // Wrapped SUI
};

const REQUIRED_BALANCES = {
  ASSET_A_FOR_DEX: '10000000', // 10 million for liquidity
  ASSET_B_FOR_DEX: '25000000', // 25 million for liquidity
  ASSET_A_FOR_TRANSFER: '1' // 1 for transfer test
};

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

function logWarning(message: string) {
  console.log(`⚠️  ${message}`);
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

  logSection('Test Assets Preparation Check');

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

  // Check native SUI balance
  logSection('Step 1: Check Native SUI Balance');
  const suiBalance = await merak.dubhe.balanceOf();
  const suiBalanceInSUI = Number(suiBalance) / 1e9;
  logInfo('Native SUI Balance', `${suiBalanceInSUI.toFixed(6)} SUI`);

  if (suiBalanceInSUI < 0.1) {
    logWarning('Low SUI balance. You may need more SUI for gas fees.');
    console.log(
      '\n💡 Get testnet SUI from: https://discord.com/channels/916379725201563759/971488439931392130'
    );
  } else {
    logSuccess('Sufficient SUI balance for gas fees');
  }

  // Check Asset A balance
  logSection('Step 2: Check Asset A Balance');
  logStep('Querying Asset A balance');
  const balanceA = await merak.balanceOf(TEST_ASSETS.ASSET_A);
  logInfo('Asset A Balance', balanceA.balance);
  logInfo('Asset A ID', TEST_ASSETS.ASSET_A);

  const assetABalance = BigInt(balanceA.balance);
  const requiredAssetA = BigInt(REQUIRED_BALANCES.ASSET_A_FOR_DEX);

  if (assetABalance < requiredAssetA) {
    logWarning(`Insufficient Asset A for DEX tests`);
    logInfo('Current', balanceA.balance);
    logInfo('Required', REQUIRED_BALANCES.ASSET_A_FOR_DEX);
    logInfo('Shortage', (requiredAssetA - assetABalance).toString());
  } else {
    logSuccess('Sufficient Asset A for all tests');
  }

  // Check Asset B (Wrapped SUI) balance
  logSection('Step 3: Check Asset B (Wrapped SUI) Balance');
  logStep('Querying Asset B balance');
  const balanceB = await merak.balanceOf(TEST_ASSETS.ASSET_B);
  logInfo('Wrapped SUI Balance', balanceB.balance);
  logInfo('Asset B ID', TEST_ASSETS.ASSET_B);

  const assetBBalance = BigInt(balanceB.balance);
  const requiredAssetB = BigInt(REQUIRED_BALANCES.ASSET_B_FOR_DEX);

  if (assetBBalance < requiredAssetB) {
    logWarning(`Insufficient Asset B (Wrapped SUI) for DEX tests`);
    logInfo('Current', balanceB.balance);
    logInfo('Required', REQUIRED_BALANCES.ASSET_B_FOR_DEX);
    logInfo('Shortage', (requiredAssetB - assetBBalance).toString());

    // Suggest wrapping SUI
    const shortageInSUI = Number(requiredAssetB - assetBBalance) / 1e9;
    console.log(`\n💡 You can wrap ${shortageInSUI.toFixed(6)} SUI to get enough Asset B`);
    console.log(
      '   Run the wrapper tests first or use the wrap function to convert SUI to Asset B'
    );
  } else {
    logSuccess('Sufficient Asset B for all tests');
  }

  // Summary and recommendations
  logSection('Summary and Recommendations');

  const needsAssetA = assetABalance < requiredAssetA;
  const needsAssetB = assetBBalance < requiredAssetB;

  if (!needsAssetA && !needsAssetB) {
    logSuccess('✨ All assets prepared! You can run full tests now.');
    console.log('\n   Run: pnpm test');
  } else {
    logWarning("Some assets are missing. Here's what to do:\n");

    if (needsAssetA) {
      console.log('📦 To get Asset A:');
      console.log('   Option 1: If this asset is mintable, mint some using:');
      console.log('             const tx = new Transaction();');
      console.log('             await merak.mint(tx, assetId, yourAddress, amount);');
      console.log('             await merak.dubhe.signAndSendTransaction(tx);');
      console.log('');
      console.log('   Option 2: If you have another account with Asset A, transfer from it');
      console.log('');
      console.log('   Option 3: Check the asset owner and request some tokens');
      console.log('');
      console.log('   💡 Check asset metadata and owner:');
      console.log('      - Metadata: await merak.getMetadata(assetId)');
      console.log('      - Owner: await merak.ownerOf(assetId)');
      console.log('');
    }

    if (needsAssetB) {
      console.log('🔄 To get Asset B (Wrapped SUI):');
      const wrapAmount = Number(requiredAssetB - assetBBalance) / 1e9;
      console.log(`   Wrap ${wrapAmount.toFixed(6)} SUI using:`);
      console.log('   const tx = new Transaction();');
      console.log(`   await merak.wrap(tx, '${(wrapAmount * 1e9).toFixed(0)}');`);
      console.log('   const result = await merak.dubhe.signAndSendTransaction(tx);');
      console.log('   console.log(result);');
      console.log('');
    }

    console.log('📝 After getting the required assets, run: pnpm test');
  }

  // Check if Asset A is mintable
  logSection('Step 4: Check Asset A Properties');
  try {
    const metadataA = await merak.getMetadata(TEST_ASSETS.ASSET_A);
    logInfo('Asset A Metadata', JSON.stringify(metadataA, null, 2));

    const ownerResult = await merak.ownerOf(TEST_ASSETS.ASSET_A);
    // ownerOf returns an array, get the owner address
    const ownerA = Array.isArray(ownerResult) ? ownerResult[0] : (ownerResult as any).owner;
    logInfo('Asset A Owner', ownerA);

    if (ownerA === accountAddress) {
      logSuccess('✨ You own Asset A! You can mint more tokens.');
      console.log('\n💡 To mint Asset A:');
      console.log('   const tx = new Transaction();');
      console.log(
        `   await merak.mint(tx, '${TEST_ASSETS.ASSET_A}', '${accountAddress}', '100000000');`
      );
      console.log('   const result = await merak.dubhe.signAndSendTransaction(tx);');
    } else {
      logWarning("You don't own Asset A. Contact the owner or use another method to get tokens.");
    }
  } catch (error: any) {
    logWarning('Could not fetch Asset A metadata: ' + error.message);
  }
}

main().catch(console.error);
