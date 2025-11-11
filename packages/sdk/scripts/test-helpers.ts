/**
 * Test script helper functions
 * Help create Merak instance and other common functionalities
 */

import { Merak, getMerakConfig } from '../src';
import { Dubhe, NetworkType, SuiMoveNormalizedModules } from '@0xobelisk/sui-client';
import { DubheGraphqlClient } from '@0xobelisk/graphql-client';
import dubheMetadata from '../../contracts/dubhe.config.json';
import contractMetadata from '../../contracts/metadata.json';
import { NETWORK, PACKAGE_ID, DUBHE_SCHEMA_ID } from '../../contracts/deployment';

// ==================== Configuration ====================
export const TEST_CONFIG = {
  // Network configuration
  network: 'testnet' as NetworkType,

  // Test asset IDs
  testAssetId: '0x357cb71d44a3fe292623a589e44f6a4f704d39d64a916bde9f81b78ce7ffac5c',
  testAssetId2: '0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6',

  // Test account address
  testAccount: '0x1fe342c436eff7ed90988fbe3a85aea7d922517ab6d9bc86e800025f8afcba7a',

  // Test Coin Type
  testCoinType: '0x2::sui::SUI',

  // Test Dapp Key (if any)
  testDappKey:
    'a09cd4137e604ec5a7a88f72c572ecd064b0e713a3fbf705a88456cdbccf36c0::dapp_key::DappKey',

  // Pagination parameters
  pageSize: 5,

  // Whether to show detailed output
  verbose: true,

  // Whether to show empty results
  showEmptyResults: false
};

/**
 * Get default Indexer URL
 */
export function getDefaultIndexerUrl(network: NetworkType): string {
  switch (network) {
    case 'testnet':
      return 'https://dubhe-framework-testnet-api.obelisk.build/graphql';
    case 'mainnet':
      return 'https://dubhe-framework-mainnet-api.obelisk.build/graphql';
    case 'localnet':
      return 'http://localhost:4000/graphql';
    case 'devnet':
      return 'http://localhost:4000/graphql';
    default:
      return 'https://dubhe-framework-testnet-api.obelisk.build/graphql';
  }
}

/**
 * Helper function to create Merak instance
 */
export function createMerak(params: {
  networkType: NetworkType;
  secretKey?: string;
  fullnodeUrl?: string;
  indexerUrl?: string;
}): Merak {
  const { networkType, secretKey, fullnodeUrl, indexerUrl } = params;

  // Create Dubhe instance
  const dubhe = new Dubhe({
    networkType,
    secretKey,
    fullnodeUrls: fullnodeUrl ? [fullnodeUrl] : undefined,
    packageId: PACKAGE_ID,
    metadata: contractMetadata as SuiMoveNormalizedModules
  });

  // Create GraphQL client
  const graphql = new DubheGraphqlClient({
    endpoint: 'https://dubhe-framework-testnet-api.obelisk.build/graphql',
    subscriptionEndpoint: 'wss://dubhe-framework-testnet-api.obelisk.build/graphql',
    dubheMetadata
  });

  // Create Merak instance
  return new Merak({
    network: networkType,
    dubhe,
    graphql,
    schemaId: DUBHE_SCHEMA_ID
  });
}
