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
  // await new Promise((resolve) => setTimeout(resolve, 6000));
  const asset1Balance = await merak.assets.balanceOf(0);
  const asset2Balance = await merak.assets.balanceOf(1);
  console.log('asset1Balance', asset1Balance);
  console.log('asset2Balance', asset2Balance);
  const receiverAddress =
    '0xe96078ade5590941edb2525c011912b6a0c3401810e9ed69f856a7989c905f27';
  const assetReceiverBalance = await merak.assets.balanceOf(1, receiverAddress);
  console.log('assetReceiverBalance', assetReceiverBalance);

  // const tx4 = new Transaction();
  // tx4.setGasBudget(10000000000);
  // const res4 = await merak.transfer(
  //   tx4,
  //   1,
  //   '0xe96078ade5590941edb2525c011912b6a0c3401810e9ed69f856a7989c905f27',
  //   99999999999999000000n
  // );
  // console.log(res4);
}

main();
