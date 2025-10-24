'use client';

import { useMemo } from 'react';
import { Merak } from '@0xobelisk/merak-sdk';
import { useDubhe } from '@0xobelisk/react/sui';
import { NETWORK } from 'dubhe-framework/deployment';

/**
 * Hook to get Merak client instance
 * Uses the useDubhe hook to get contract and graphql clients
 */
export function useMerak() {
  const { contract, graphqlClient } = useDubhe();

  const merakClient = useMemo(() => {
    if (!contract || !graphqlClient) {
      return null;
    }

    return new Merak({
      network: NETWORK,
      dubhe: contract,
      graphql: graphqlClient
    });
  }, [contract, graphqlClient]);

  return merakClient;
}
