import { Merak } from '../src';
import { NetworkType } from '@0xobelisk/sui-client';

import { Dubhe } from '@0xobelisk/sui-client';
import { DubheGraphqlClient } from '@0xobelisk/graphql-client';

import contractMetadata from '../../contracts/metadata.json';
import dubheMetadata from '../../contracts/dubhe.config.json';
import { DUBHE_SCHEMA_ID, PACKAGE_ID, NETWORK } from '../../contracts/deployment';

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

async function testQueryMetadata() {
  const merak = createServerMerak();

  const pools = await merak.allPoolListWithId(
    '0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6'
  );
  console.log('pools:', pools);

  const path = await merak.querySwapPaths(
    '0x357cb71d44a3fe292623a589e44f6a4f704d39d64a916bde9f81b78ce7ffac5c',
    '0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6'
  );
  console.log('path:', path);
  // const metadata = await merak.getLatestMetadata(
  //   '0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6'
  // );
  // console.log('metadata:', metadata);
  const supply = await merak.supplyOf(
    '0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6'
  );
  console.log('supply:', supply);

  const ownedAssets = await merak.listOwnedWrapperAssets({
    account: '0x95a99e27a30c993dc82c78cc8285643ab81a12a73a46882afb35bd2d5d5c47ed',
    first: 50,
    orderBy: [{ field: 'CREATED_AT_TIMESTAMP_MS', direction: 'ASC' }]
  });
  console.log('ownedAssets:', JSON.stringify(ownedAssets, null, 2));
}

testQueryMetadata();
