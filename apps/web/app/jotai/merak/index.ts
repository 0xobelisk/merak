'use client';

import { atom } from 'jotai';
import { Merak } from '@0xobelisk/merak-sdk';
import { NETWORK } from '@/app/chain/config';

const initMerakClient = () => {
  const merak = new Merak({
    networkType: 'localnet',
    // indexerUrl: 'http://127.0.0.1:4002',
    // indexerWsUrl: 'ws://127.0.0.1:4002'
    indexerUrl: 'https://merak-indexer-testnet-api.obelisk.build',
    indexerWsUrl: 'wss://merak-indexer-testnet-api.obelisk.build'
  });
  return merak;
};

const merakClient = atom(initMerakClient);

export { merakClient, initMerakClient };
