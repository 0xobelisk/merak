/**
 * GraphQL Field Verification Script
 *
 * Verify that all GraphQL returned fields use correct naming (camelCase)
 * and that SDK methods correctly convert field names
 */

import { NetworkType } from '@0xobelisk/sui-client';
import dotenv from 'dotenv';
import { createMerak } from './test-helpers';

dotenv.config();

interface TestCase {
  name: string;
  method: () => Promise<any>;
  expectedFields: {
    path: string;
    camelCase?: string[]; // camelCase fields that GraphQL should return (optional)
    snakeCase?: string[]; // snake_case fields after SDK conversion (optional)
  };
}

async function verifyFields() {
  console.log('🔍 GraphQL Field Verification\n');

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ PRIVATE_KEY not set');
    process.exit(1);
  }

  const merak = createMerak({
    networkType: 'testnet' as NetworkType,
    secretKey: privateKey
  });

  console.log('✅ Merak initialized successfully\n');

  const testCases: TestCase[] = [
    {
      name: 'Verify AssetMetadata fields (GraphQL direct return)',
      method: () => merak.storage.list.assetMetadata({ first: 1 }),
      expectedFields: {
        path: 'edges[0].node',
        camelCase: [
          'assetId',
          'name',
          'symbol',
          'iconUrl',
          'isMintable',
          'isBurnable',
          'isFreezable',
          'assetType'
        ]
      }
    },
    {
      name: 'Verify AssetPool fields (GraphQL direct return)',
      method: () => merak.storage.list.assetPool({ first: 1 }),
      expectedFields: {
        path: 'edges[0].node',
        camelCase: ['asset0', 'asset1', 'poolAddress', 'lpAsset', 'reserve0', 'reserve1', 'kLast']
      }
    },
    {
      name: 'Verify AssetAccount fields (GraphQL direct return)',
      method: () => merak.storage.list.assetAccount({ first: 1 }),
      expectedFields: {
        path: 'edges[0].node',
        camelCase: ['assetId', 'account', 'balance', 'status']
      }
    },
    {
      name: 'Verify AssetWrapper fields (GraphQL direct return)',
      method: () => merak.storage.list.assetWrapper({ first: 1 }),
      expectedFields: {
        path: 'edges[0].node',
        camelCase: ['coinType', 'assetId']
      }
    },
    {
      name: 'Verify getMetadata field conversion',
      method: async () => {
        const metadata = await merak.getMetadata('1');
        return { metadata };
      },
      expectedFields: {
        path: 'metadata',
        snakeCase: [
          'name',
          'symbol',
          'icon_url',
          'is_mintable',
          'is_burnable',
          'is_freezable',
          'asset_type'
        ]
      }
    },
    {
      name: 'Verify allPoolList return fields',
      method: () => merak.allPoolList({ pageSize: 1 }),
      expectedFields: {
        path: '[0]',
        camelCase: ['asset0', 'asset1', 'poolAddress', 'lpAsset']
      }
    },
    {
      name: 'Verify listAssetsInfo return fields',
      method: () => merak.listAssetsInfo({ first: 1 }),
      expectedFields: {
        path: 'data[0].metadata',
        snakeCase: ['icon_url', 'is_mintable', 'is_burnable', 'is_freezable', 'asset_type']
      }
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 ${testCase.name}`);

    try {
      const result = await testCase.method();

      // Get target object
      let target: any = result;
      const pathParts = testCase.expectedFields.path.split('.');

      for (const part of pathParts) {
        if (part.includes('[')) {
          const [key, indexStr] = part.split('[');
          const index = parseInt(indexStr.replace(']', ''));
          target = key ? target[key][index] : target[index];
        } else {
          target = target[part];
        }
      }

      if (!target) {
        console.log('   ⚠️  Data is empty, skipping verification');
        continue;
      }

      // Verify camelCase fields
      if (testCase.expectedFields.camelCase) {
        console.log('   Checking GraphQL camelCase fields:');
        let allPresent = true;

        for (const field of testCase.expectedFields.camelCase) {
          const exists = field in target;
          const icon = exists ? '✅' : '❌';
          console.log(`     ${icon} ${field}: ${exists ? 'present' : 'missing'}`);
          if (!exists) allPresent = false;
        }

        if (allPresent) {
          console.log('   ✅ All camelCase fields verified');
          passedTests++;
        } else {
          console.log('   ❌ Some camelCase fields missing');
          failedTests++;
        }
      }

      // Verify snake_case fields (after conversion)
      if (testCase.expectedFields.snakeCase) {
        console.log('   Checking SDK converted snake_case fields:');
        let allPresent = true;

        for (const field of testCase.expectedFields.snakeCase) {
          const exists = field in target;
          const icon = exists ? '✅' : '❌';
          console.log(`     ${icon} ${field}: ${exists ? 'present' : 'missing'}`);
          if (!exists) allPresent = false;
        }

        if (allPresent) {
          console.log('   ✅ All snake_case fields verified');
          passedTests++;
        } else {
          console.log('   ❌ Some snake_case fields missing');
          failedTests++;
        }
      }

      // Display actual fields present (for debugging)
      if (failedTests > 0) {
        console.log('   Actual fields:', Object.keys(target).join(', '));
      }
    } catch (error: any) {
      console.log(`   ❌ Test failed: ${error.message}`);
      failedTests++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Verification Results Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedTests} tests`);
  console.log(`❌ Failed: ${failedTests} tests`);
  console.log(`📝 Total: ${passedTests + failedTests} tests`);

  if (failedTests === 0) {
    console.log('\n🎉 All field verifications passed! GraphQL integration is working correctly.');
  } else {
    console.log('\n⚠️  Some verifications failed, please check field naming.');
    console.log('Reference documentation: GRAPHQL_FIELD_MAPPING.md');
  }
}

verifyFields().catch(console.error);
