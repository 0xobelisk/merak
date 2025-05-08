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

  // const events = await merak.listOwnedAssetsInfo({
  //   address:
  //     '0x1fe342c436eff7ed90988fbe3a85aea7d922517ab6d9bc86e800025f8afcba7a',
  //   assetType: 'Lp',
  // });

  // console.log(JSON.stringify(events, null, 2));

  const amount = await merak.calRemoveLpAmount({
    address:
      '0x379aa1cc401f024e2fee2ea25bdb85e48355491bd6fcaf685e39a7fcc84b2101',
    poolAssetId: 2,
    amount: 15291000,
    // amount: 1000000000000000000n,
  });

  console.log(JSON.stringify(amount, null, 2));
}

main();
