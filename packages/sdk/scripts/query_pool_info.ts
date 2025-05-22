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
  });

  // await merak.dubhe.requestFaucet();
  const userBalance = await merak.assets.balanceOf(1);
  const poolInfo = await merak.getPoolListWithId({
    asset1Id: 0,
    asset2Id: 1,
  });
  console.log('pool info:', poolInfo);
  // const tx = new Transaction();
  // tx.setGasBudget(10000000000);
  // const mintRes = await merak.transfer(
  //   tx,
  //   1,
  //   '0xbab5f11f7578828ab19cf3bef7df2738d39791e60a043d73174837b096bc7e4d',
  //   BigInt(100 * 10 ** 7)
  // );
  // console.log(mintRes);
  // // await merak.dubhe.requestFaucet();
  // const asset1Balance = await merak.assets.balanceOf(1);
  // const asset2Balance = await merak.assets.balanceOf(
  //   1,
  //   '0xbab5f11f7578828ab19cf3bef7df2738d39791e60a043d73174837b096bc7e4d'
  // );
  // console.log('user dubhe balance:', asset1Balance);
  // console.log('numeron dubhe balance:', asset2Balance);
}

main();
