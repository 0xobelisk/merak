import { Merak, getMerakConfig } from './../src';
import { NetworkType, loadMetadata } from '@0xobelisk/sui-client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const network = 'testnet';
  const config = getMerakConfig(network);

  const metadata = await loadMetadata(network, config.packageId);
  console.log(metadata);
  fs.writeFileSync(
    path.join(__dirname, `../metadata/${network}/${config.packageId}.json`),
    JSON.stringify(metadata, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, `../src/metadata/${network}/metadata.json`),
    JSON.stringify(metadata, null, 2)
  );
}

main();
