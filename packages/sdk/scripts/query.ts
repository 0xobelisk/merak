import { Merak } from '../src/merak';
import { NetworkType, Transaction } from '@0xobelisk/sui-client';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const network = 'testnet';
  const privateKey = process.env.PRIVATE_KEY;

  const merak = new Merak({
    networkType: network as NetworkType,
    secretKey: privateKey,
    indexerUrl: 'https://merak-indexer-testnet-api.obelisk.build',
    indexerWsUrl: 'wss://merak-indexer-testnet-api.obelisk.build',
  });

  const events = await merak.listEvents();

  console.log(events);
}

main();
