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
      '0xc560cf6c5d6f5f11f8184be7c0ef72e3cce34d715f4cab91d5ef8adfcb4248e7',
    poolAssetId: 2,
    // amount: 1000000000000000000n,
  });

  console.log(JSON.stringify(amount, null, 2));
}

main();
