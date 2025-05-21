'use client';

import { atom } from 'jotai';
import { Dubhe, loadMetadata } from '@0xobelisk/sui-client';
import { NETWORK, PACKAGE_ID } from '@/app/chain/config';

const initDubheClient = () => {
  const dubhe = new Dubhe({
    networkType: NETWORK,
    packageId: PACKAGE_ID,
    fullnodeUrls: ['https://sui-testnet.blockvision.org/v1/2xPTS0M17DOdeIX7MVSykPktK7d'],
    indexerUrl: 'https://merak-indexer-testnet-api-1.obelisk.build'
    // indexerWsUrl: 'wss://merak-indexer-testnet-api.obelisk.build'
  });
  return dubhe;
};

const dubheClient = atom(initDubheClient);

export { dubheClient, initDubheClient };
