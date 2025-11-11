'use client';

import { useMemo } from 'react';
import { Merak } from '@0xobelisk/merak-sdk';
import { useDubhe } from '@0xobelisk/react/sui';
import { DUBHE_SCHEMA_ID } from 'dubhe-framework/deployment';

/**
 * Hook to get Merak client instance
 * Uses the useDubhe hook to get contract and graphql clients
 *
 * Automatically configures apiBaseUrl to use the API endpoints with server-side caching:
 * - In browser: uses window.location.origin to call /api/assets/metadata endpoints
 * - Benefits from 60-second ISR cache for faster metadata queries
 * - Falls back to direct storage queries if API is unavailable
 */
export function useMerak() {
  const { contract, graphqlClient } = useDubhe();

  const merakClient = useMemo(() => {
    if (!contract || !graphqlClient) {
      return null;
    }
    console.log('============== contract1111 ==============', contract.getNetwork());

    // Get API base URL - use window.location.origin in browser, undefined in SSR
    const apiBaseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    console.log('============== apiBaseUrl ==============', apiBaseUrl);
    return new Merak({
      dubhe: contract,
      graphql: graphqlClient,
      schemaId: DUBHE_SCHEMA_ID,
      apiBaseUrl
    });
  }, [contract, graphqlClient]);

  return merakClient;
}
