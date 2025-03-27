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

  // const account = await merak.storage.getAccount({
  //   address:
  //     '0xbb3e90c52cb585aeb926edb6fb3d01146d47e96d9692394bd9d691ce1b0bd693',
  //   orderBy: ['ID_ASC'],
  // });
  // console.log('account', account);

  // // First get account information
  // const account_info_currentPage = await merak.storage.getAccount({
  //   address: `0xbb3e90c52cb585aeb926edb6fb3d01146d47e96d9692394bd9d691ce1b0bd693`,
  //   first: 10,
  //   orderBy: ['ID_ASC'],
  // });

  // // Get asset metadata based on account information length
  // const metadataResults = await Promise.all(
  //   account_info_currentPage.data.map((item) =>
  //     merak.storage.getAssetMetadata({
  //       assetId: item.key1,
  //     })
  //   )
  // );

  // console.log('Account Info:', account_info_currentPage);
  // console.log('Metadata Results:', JSON.stringify(metadataResults));

  // const pairList = await merak.allPoolListWithId(2);
  // console.log('pairList', JSON.stringify(pairList, null, 2));

  // const swappableTokens = await merak.getAllSwappableTokens({
  //   startTokenId: 2,
  // });
  // console.log('swappableTokens', JSON.stringify(swappableTokens, null, 2));

  // const swappableTokensWithMetadata =
  //   await merak.getAllSwappableTokensWithMetadata({
  //     startTokenId: 2,
  //   });
  // console.log(
  //   'swappableTokensWithMetadata',
  //   JSON.stringify(swappableTokensWithMetadata, null, 2)
  // );

  // const ownedWrapperAssets = await merak.listOwnedWrapperAssets({
  //   address:
  //     '0xbb3e90c52cb585aeb926edb6fb3d01146d47e96d9692394bd9d691ce1b0bd693',
  // });
  // console.log(
  //   'ownedWrapperAssets',
  //   JSON.stringify(ownedWrapperAssets, null, 2)
  // );

  const events = await merak.listEvents({
    sender:
      '0x1fe342c436eff7ed90988fbe3a85aea7d922517ab6d9bc86e800025f8afcba7a',
  });
  console.log('events', JSON.stringify(events, null, 2));
  // const connectedTokens = await merak.getConnectedTokens(4);
  // console.log('connectedTokens', connectedTokens);

  // const swapPaths = await merak.querySwapPaths(4, 5);
  // console.log('swapPaths', swapPaths);

  // const poolList = await merak.listPoolsInfo();
  // console.log('poolList', JSON.stringify(poolList, null, 2));

  // const ownedAssetsInfo = await merak.listOwnedAssetsInfo({
  //   address:
  //     '0x95a99e27a30c993dc82c78cc8285643ab81a12a73a46882afb35bd2d5d5c47ed',
  // });
  // console.log('ownedAssetsInfo', JSON.stringify(ownedAssetsInfo, null, 2));
}

main();
