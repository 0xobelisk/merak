/**
 * Merak Factory
 *
 * Factory functions to create Merak instances for testing
 */

import { Merak } from '../../src/merak';
import { Dubhe, NetworkType, SuiMoveNormalizedModules } from '@0xobelisk/sui-client';
import { DubheGraphqlClient } from '@0xobelisk/graphql-client';
import { TEST_ENV } from './test-config';
import * as deployment from '../../../contracts/deployment';
import contractMetadataJson from '../../../contracts/metadata.json';
import dubheMetadataJson from '../../../contracts/dubhe.config.json';

// Import contract metadata
const contractMetadata = contractMetadataJson as SuiMoveNormalizedModules;
const dubheMetadata = dubheMetadataJson;
const PACKAGE_ID = deployment.PACKAGE_ID;
const DUBHE_SCHEMA_ID = deployment.DUBHE_SCHEMA_ID;

// ==================== Merak Factory ====================

export interface MerakOptions {
  networkType?: NetworkType;
  secretKey?: string;
  fullnodeUrl?: string;
  indexerUrl?: string;
  packageId?: string;
  schemaId?: string;
}

export function createMerakInstance(options: MerakOptions = {}): Merak {
  const {
    networkType = TEST_ENV.NETWORK,
    secretKey = TEST_ENV.PRIVATE_KEY,
    fullnodeUrl = TEST_ENV.FULLNODE_URL,
    indexerUrl,
    packageId = PACKAGE_ID,
    schemaId = DUBHE_SCHEMA_ID
  } = options;

  if (!secretKey) {
    throw new Error(
      'Private key is required to create Merak instance. Set PRIVATE_KEY in .env file'
    );
  }

  console.log('networkType', networkType);
  console.log('secretKey', secretKey);
  console.log('fullnodeUrl', fullnodeUrl);
  console.log('indexerUrl', indexerUrl);
  console.log('packageId', packageId);
  console.log('schemaId', schemaId);
  // Create Dubhe instance
  const dubhe = new Dubhe({
    networkType,
    secretKey,
    fullnodeUrls: fullnodeUrl ? [fullnodeUrl] : undefined,
    packageId,
    metadata: contractMetadata
  });

  // Create GraphQL client
  const graphql = new DubheGraphqlClient({
    endpoint: indexerUrl || getDefaultIndexerUrl(networkType),
    subscriptionEndpoint: getDefaultSubscriptionUrl(networkType),
    dubheMetadata
  });

  // Create Merak instance
  return new Merak({
    network: networkType,
    dubhe,
    graphql,
    schemaId
  });
}

/**
 * Get default Indexer URL
 */
function getDefaultIndexerUrl(network: NetworkType): string {
  switch (network) {
    case 'testnet':
      return 'https://dubhe-framework-testnet-api.obelisk.build/graphql';
    case 'mainnet':
      return 'https://dubhe-framework-mainnet-api.obelisk.build/graphql';
    case 'localnet':
    case 'devnet':
      return 'http://localhost:4000/graphql';
    default:
      return 'https://dubhe-framework-testnet-api.obelisk.build/graphql';
  }
}

/**
 * Get default Subscription URL
 */
function getDefaultSubscriptionUrl(network: NetworkType): string {
  switch (network) {
    case 'testnet':
      return 'wss://dubhe-framework-testnet-api.obelisk.build/graphql';
    case 'mainnet':
      return 'wss://dubhe-framework-mainnet-api.obelisk.build/graphql';
    case 'localnet':
    case 'devnet':
      return 'ws://localhost:4000/graphql';
    default:
      return 'wss://dubhe-framework-testnet-api.obelisk.build/graphql';
  }
}

// ==================== Instance Cache ====================

let cachedMerakInstance: Merak | null = null;

/**
 * Get or create a cached Merak instance
 * Useful for tests that don't need a fresh instance
 */
export function getCachedMerakInstance(): Merak {
  if (!cachedMerakInstance) {
    cachedMerakInstance = createMerakInstance();
  }
  return cachedMerakInstance;
}

/**
 * Clear the cached Merak instance
 */
export function clearCachedMerakInstance(): void {
  cachedMerakInstance = null;
}

// ==================== Test Helpers ====================

export function getMerakInfo(merak: Merak) {
  return {
    packageId: merak.packageId,
    schemaId: merak.schemaId,
    address: merak.dubhe.currentAddress()
  };
}
