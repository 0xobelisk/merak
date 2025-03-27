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

  const balance = await merak.dubhe.balanceOf();
  // await merak.dubhe.requestFaucet();
  console.log(balance);
  const accountAddress = merak.dubhe.currentAddress();
  console.log(accountAddress);
  // const tx = new Transaction();
  // tx.setGasBudget(10000000000);
  // const res = await merak.create(
  //   tx,
  //   'C', // name
  //   'C', // symbol
  //   'C', // description
  //   9, // decimals
  //   'https://example.com/icon.png', // icon_url
  //   'C', // info
  //   BigInt(10000000 * 10 ** 9), // initial_supply - changed to string format
  //   accountAddress, // send_to
  //   accountAddress, // owner
  //   true, // is_mintable
  //   true, // is_burnable
  //   true // is_freezable
  // );
  // console.log(res);
  // const tx2 = new Transaction();
  // tx2.setGasBudget(10000000000);
  // const res2 = await merak.create(
  //   tx2,
  //   'D', // name
  //   'D', // symbol
  //   'D', // description
  //   9, // decimals
  //   'https://example.com/icon.png', // icon_url
  //   'D', // info
  //   BigInt(1000000000000 * 10 ** 9), // initial_supply - changed to string format
  //   accountAddress, // send_to
  //   accountAddress, // owner
  //   true, // is_mintable
  //   true, // is_burnable
  //   true // is_freezable
  // );
  // console.log(res2);
  // await new Promise((resolve) => setTimeout(resolve, 6000));
  const asset1Balance = await merak.assets.balanceOf(0);
  const asset2Balance = await merak.assets.balanceOf(1);
  console.log('asset1Balance', asset1Balance);
  console.log('asset2Balance', asset2Balance);
  const asset1Supply = await merak.assets.supplyOf(0);
  console.log('asset1Supply', asset1Supply);
  const asset2Supply = await merak.assets.supplyOf(1);
  console.log('asset2Supply', asset2Supply);
  // await new Promise((resolve) => setTimeout(resolve, 1000));

  // const tx4 = new Transaction();
  // tx4.setGasBudget(10000000000);
  // const res4 = await merak.createPool(tx4, 0, 1);
  // console.log(res4);
  // await new Promise((resolve) => setTimeout(resolve, 1000));

  // const tx3 = new Transaction();
  // tx3.setGasBudget(10000000000);
  // const res3 = await merak.addLiquidity(
  //   tx3,
  //   0,
  //   1,
  //   BigInt(999999999000000),
  //   BigInt(99999999999999000000),
  //   0,
  //   0
  // );
  // console.log(res3);
}

main();
