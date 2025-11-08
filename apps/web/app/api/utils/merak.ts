import { Dubhe } from '@0xobelisk/sui-client';
import { DubheGraphqlClient } from '@0xobelisk/graphql-client';
import { Merak } from '@0xobelisk/merak-sdk';

import contractMetadata from 'dubhe-framework/metadata.json';
import dubheMetadata from 'dubhe-framework/dubhe.config.json';
import { DUBHE_SCHEMA_ID, PACKAGE_ID, NETWORK } from 'dubhe-framework/deployment';

/**
 * Create a server-side Merak instance for read-only operations
 *
 * This instance is used for:
 * - Querying blockchain data via GraphQL
 * - Accessing storage data
 * - No private key required (read-only)
 *
 * @returns Merak instance configured for server-side use
 */
export function createServerMerak(): Merak {
  // Create Dubhe instance without private key for read-only operations
  const dubhe = new Dubhe({
    networkType: NETWORK,
    packageId: PACKAGE_ID,
    metadata: contractMetadata as any
  });

  // Create GraphQL client
  const graphql = new DubheGraphqlClient({
    endpoint: 'https://dubhe-framework-testnet-api.obelisk.build/graphql',
    subscriptionEndpoint: 'wss://dubhe-framework-testnet-api.obelisk.build/graphql',
    dubheMetadata
  });

  // Create Merak instance
  return new Merak({
    dubhe,
    graphql,
    schemaId: DUBHE_SCHEMA_ID
  });
}
