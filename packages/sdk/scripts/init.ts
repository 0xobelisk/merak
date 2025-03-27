import { Merak } from './../src/merak';
import { NetworkType, loadMetadata } from '@0xobelisk/sui-client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const network = 'testnet';
  const privateKey = process.env.PRIVATE_KEY;

  // const config = getMerakConfig(network);
  // console.log(config);

  const merak = new Merak({
    networkType: network as NetworkType,
  });

  const res = await merak.assets.balanceOf(
    0,
    '0x2a994a77dda48ddf2413eabe96b6577b3511ecbd473621af37e06e824a788c23'
  );
  console.log(res);

  console.log('getPoolList');
  const res2 = await merak.getPoolList();
  console.log(res2);

  const amount = '1';
  const path = [0, 1];
  console.log('amount', amount);
  const asset_metadata = await merak.metadataOf(0);
  console.log('asset_metadata', asset_metadata);

  // const asset_metadata2 = await merak.metadataOf(1);
  // console.log('asset_metadata2', asset_metadata2);

  // const asset_metadata3 = await merak.metadataOf(2);
  // console.log('asset_metadata3', asset_metadata3);

  // const asset_metadata4 = await merak.metadataOf(3);
  // console.log('asset_metadata4', asset_metadata4);

  // const asset_metadata5 = await merak.metadataOf(4);
  // console.log('asset_metadata5', asset_metadata5);

  // const asset_metadata8 = await merak.metadataOf(10);
  // console.log('asset_metadata8', asset_metadata8);

  // const asset_metadata9 = await merak.metadataOf(11);
  // console.log('asset_metadata9', asset_metadata9);

  if (!asset_metadata) {
    throw new Error('Failed to fetch asset metadata');
  }
  const decimals = asset_metadata[3];
  let amount_out = await merak.getAmountOut(
    path,
    parseFloat(amount) * 10 ** decimals
  );
  console.log(parseFloat(amount) * 10 ** decimals);
  console.log('amount_out', amount_out);

  let lp_amount = await merak.balanceOf(
    0,
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  );
  console.log('lp_amount', lp_amount);

  let lp_amount1 = await merak.balanceOf(
    1,
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  );
  console.log('lp_amount1', lp_amount1);

  let owner_amount = await merak.balanceOf(
    0,
    '0x379aa1cc401f024e2fee2ea25bdb85e48355491bd6fcaf685e39a7fcc84b2101'
  );
  console.log('owner_amount', owner_amount);

  let owner_amount1 = await merak.balanceOf(
    1,
    '0x379aa1cc401f024e2fee2ea25bdb85e48355491bd6fcaf685e39a7fcc84b2101'
  );
  console.log('owner_amount1', owner_amount1);
}

main();
