/**
 * Create Test Asset
 *
 * Create your own test asset if the current Asset A is not accessible
 *
 * Usage:
 * pnpm exec ts-node -r tsconfig-paths/register scripts/create-test-asset.ts
 *
 * Note: This requires the contract to support asset creation
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

  logSection('Create Test Asset');

  logWarning('This script attempts to create a custom test asset');
  logWarning('It may fail if the contract does not support asset creation');
  console.log('\n💡 If this fails, please contact the project team for test tokens\n');

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

  // Check if 'create' method exists
  if (typeof (merak as any).create === 'function') {
    logStep('Asset creation method found');

    const tx = new Transaction();

    try {
      const result = await (merak as any).create(
        tx,
        'Test Asset A', // name
        'TESTA', // symbol
        'Test Asset for DEX Testing', // description
        9, // decimals
        '', // icon_url
        'Test asset for integration testing', // info
        BigInt(100000000 * 10 ** 9), // initial_supply: 100 million
        accountAddress, // send_to
        accountAddress, // owner
        true, // is_mintable
        true, // is_burnable
        false // is_freezable
      );

      logSuccess('Asset creation transaction submitted');
      logInfo('Transaction Hash', (result as any).digest);

      console.log('\n⏳ Waiting 10 seconds for transaction to be confirmed...');
      await new Promise((resolve) => setTimeout(resolve, 10000));

      logSuccess('✨ Test asset created successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Find your new asset ID from the transaction');
      console.log('   2. Update TEST_ASSET_1_ID in your .env file');
      console.log('   3. Run: pnpm test');
    } catch (error: any) {
      logError('Asset creation failed: ' + error.message);
      console.log('\n💡 The contract may not support asset creation or you may lack permissions');
      console.log('   Please contact the project team for test tokens');
    }
  } else {
    logError('Asset creation method not found in SDK');
    console.log('\n💡 Options:');
    console.log('   1. Contact the project team for Asset A test tokens');
    console.log('   2. Check if there is a faucet for test assets');
    console.log('   3. Use a different asset that you have access to');
    console.log('\n📝 To use a different asset, update tests/helpers/test-config.ts:');
    console.log('   export const TEST_ASSETS = {');
    console.log('     ASSET_1: "your-asset-id",');
    console.log(
      '     ASSET_2: "0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6",'
    );
    console.log('   };');
  }
}

main().catch(console.error);
