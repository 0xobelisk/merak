import { Merak } from './../src/merak';
import { NetworkType, loadMetadata } from '@0xobelisk/sui-client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const network = 'testnet';
  const packageId =
    '0x2300e4f190870ae8cee2f648f745e96c06fa4ce9c3bd5439d3ee4287df0d9887';

  const metadata = await loadMetadata(network, packageId);
  console.log(metadata);
  fs.writeFileSync(
    path.join(__dirname, `../metadata/testnet/${packageId}.json`),
    JSON.stringify(metadata, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, `../src/metadata/testnet/metadata.json`),
    JSON.stringify(metadata, null, 2)
  );
}

main();
