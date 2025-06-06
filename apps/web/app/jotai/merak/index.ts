'use client';

import { atom } from 'jotai';
import { Merak } from '@0xobelisk/merak-sdk';
import { NETWORK } from '@/app/chain/config';

const initMerakClient = () => {
  const merak = new Merak({
    networkType: NETWORK,
    // indexerUrl: 'http://127.0.0.1:4002',
    // indexerWsUrl: 'ws://127.0.0.1:4002'
    fullnodeUrls: ['https://sui-testnet.blockvision.org/v1/2xPTS0M17DOdeIX7MVSykPktK7d'],
    indexerUrl: 'https://merak-indexer-testnet-api-1.obelisk.build'
    // indexerWsUrl: 'wss://merak-indexer-testnet-api.obelisk.build'
  });
  return merak;
};

const merakClient = atom(initMerakClient);

export { merakClient, initMerakClient };
