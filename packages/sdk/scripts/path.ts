import { Merak } from '../src/merak';
import { NetworkType } from '@0xobelisk/sui-client';

async function main() {
  const network = 'testnet';

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

  console.log('getPairList');

  const start = 0;
  const end = 2;
  const paths = await merak.querySwapPaths(start, end);
  console.log('querySwapPaths start 0 end 2', paths);
  console.log('fastest path querySwapPaths start 0 end 2', paths[0]);

  const result = await merak.getConnectedTokens(0);
  console.log('getConnectedTokens 0', result);

  const result1 = await merak.getConnectedTokens(1);
  console.log('getConnectedTokens 1', result1);
  const result2 = await merak.getConnectedTokens(2);
  console.log('getConnectedTokens 2', result2);

  const result4 = await merak.getConnectedTokens(4);
  console.log('getConnectedTokens 4', result4);

  const result10 = await merak.getConnectedTokens(10);
  console.log('getConnectedTokens 10', result10);
  // const amount = '1';
}

main();
