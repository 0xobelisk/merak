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
    indexerUrl: 'https://merak-indexer-testnet-api-1.obelisk.build',
  });

  const metadata = await merak.getMetadata(1);
  console.log('metadata:', metadata);

  const metadata2 = await merak.getMetadataWithGraphql(1);
  console.log('metadata2:', metadata2);
}

main();
