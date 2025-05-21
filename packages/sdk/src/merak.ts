import { Dubhe, Transaction, TransactionArgument } from '@0xobelisk/sui-client';
import {
  AssetMetadataType,
  MerakParams,
  AssetInfo,
  AssetInfoResponse,
  PoolInfo,
  EventInfoResponse,
  EventInfo,
  BridgeChainName,
  AssetType,
  TransactionInfoResponse,
  TransactionInfo,
  TransactionHistoryInfoResponse,
  TransactionHistoryInfo,
} from 'src/types';
import { Assets, Dex, Wrapper, Bridge } from './system';
import { Storage } from './storage';
import { getMerakConfig } from './utils';

const MAX_PATH_LENGTH = 6;

/**
 * @class Merak
 * @description This class is used to aggregate the tools that used to interact with SUI network.
 */
export class Merak {
  public params: MerakParams;
  public dubhe: Dubhe;
  public assets: Assets;
  public dex: Dex;
  public wrapper: Wrapper;
  public bridge: Bridge;

  public storage: Storage;

  public packageId: string;
  public schemaId: string;
  public treasuryCap: string;

  /**
   * @argument params - The parameters for the Merak instance.
   */
  constructor(params: MerakParams) {
    const config = getMerakConfig(params.networkType ?? 'testnet');
    const packageId = params.packageId ?? config.packageId;
    const schemaId = params.schemaId ?? config.schemaId;
    const metadata = params.metadata ?? config.metadata;
    const treasuryCap = params.treasuryCap ?? config.treasuryCap;

    this.params = params;
    this.packageId = packageId;
    this.schemaId = schemaId;
    this.treasuryCap = treasuryCap;
    this.dubhe = new Dubhe({
      ...params,
      packageId,
      metadata,
    });
    this.assets = new Assets(this.dubhe, schemaId);
    this.dex = new Dex(this.dubhe, schemaId);
    this.wrapper = new Wrapper(this.dubhe, schemaId);
    this.bridge = new Bridge(this.dubhe, schemaId);
    this.storage = new Storage(this.dubhe);
  }

  get coinType() {
    return `${this.packageId}::dubhe::DUBHE`;
  }

  // Assets Functions
  async create(
    tx: Transaction,
    name: string,
    symbol: string,
    description: string,
    decimals: number,
    icon_url: string,
    extra_info: string,
    initial_supply: bigint | number | string,
    send_to: string,
    owner: string,
    is_mintable: boolean,
    is_burnable: boolean,
    is_freezable: boolean,
    isRaw?: boolean
  ) {
    return this.assets.create(
      tx,
      name,
      symbol,
      description,
      decimals,
      icon_url,
      extra_info,
      initial_supply,
      send_to,
      owner,
      is_mintable,
      is_burnable,
      is_freezable,
      isRaw
    );
  }

  async mint(
    tx: Transaction,
    asset_id: bigint | number | string,
    to: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    return this.assets.mint(tx, asset_id, to, amount, isRaw);
  }

  async burn(
    tx: Transaction,
    asset_id: bigint | number | string,
    from: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    return this.assets.burn(tx, asset_id, from, amount, isRaw);
  }

  async transfer(
    tx: Transaction,
    asset_id: bigint | number | string,
    to: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    return this.assets.transfer(tx, asset_id, to, amount, isRaw);
  }

  async transferAll(
    tx: Transaction,
    asset_id: bigint | number | string,
    to: string,
    isRaw?: boolean
  ) {
    return this.assets.transferAll(tx, asset_id, to, isRaw);
  }

  async freezeAddress(
    tx: Transaction,
    asset_id: bigint | number | string,
    address: string,
    isRaw?: boolean
  ) {
    return this.assets.freezeAddress(tx, asset_id, address, isRaw);
  }

  async blockAddress(
    tx: Transaction,
    asset_id: bigint | number | string,
    address: string,
    isRaw?: boolean
  ) {
    return this.assets.blockAddress(tx, asset_id, address, isRaw);
  }

  async thawAddress(
    tx: Transaction,
    asset_id: bigint | number | string,
    address: string,
    isRaw?: boolean
  ) {
    return this.assets.thawAddress(tx, asset_id, address, isRaw);
  }

  async freezeAsset(
    tx: Transaction,
    asset_id: bigint | number | string,
    isRaw?: boolean
  ) {
    return this.assets.freezeAsset(tx, asset_id, isRaw);
  }

  async thawAsset(
    tx: Transaction,
    asset_id: bigint | number | string,
    isRaw?: boolean
  ) {
    return this.assets.thawAsset(tx, asset_id, isRaw);
  }

  async transferOwnership(
    tx: Transaction,
    asset_id: bigint | number | string,
    to: string,
    isRaw?: boolean
  ) {
    return this.assets.transferOwnership(tx, asset_id, to, isRaw);
  }

  async balanceOf(asset_id: bigint | number | string, accountAddress?: string) {
    return this.assets.balanceOf(asset_id, accountAddress);
  }

  async supplyOf(asset_id: bigint | number | string) {
    return this.assets.supplyOf(asset_id);
  }

  async metadataOf(asset_id: bigint | number | string) {
    return this.assets.metadataOf(asset_id);
  }

  // Dex Functions
  async createPool(
    tx: Transaction,
    assetA: bigint | number | string,
    assetB: bigint | number | string,
    isRaw?: boolean
  ) {
    return this.dex.createPool(tx, assetA, assetB, isRaw);
  }

  async addLiquidity(
    tx: Transaction,
    assetA: bigint | number | string,
    assetB: bigint | number | string,
    amountADesired: bigint | number | string,
    amountBDesired: bigint | number | string,
    amountAMin: bigint | number | string,
    amountBMin: bigint | number | string,
    to: string,
    isRaw?: boolean
  ) {
    return this.dex.addLiquidity(
      tx,
      assetA,
      assetB,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      to,
      isRaw
    );
  }

  async removeLiquidity(
    tx: Transaction,
    assetA: bigint | number | string,
    assetB: bigint | number | string,
    liquidity: bigint | number | string,
    amountAMinReceive: bigint | number | string,
    amountBMinReceive: bigint | number | string,
    to: string,
    isRaw?: boolean
  ) {
    return this.dex.removeLiquidity(
      tx,
      assetA,
      assetB,
      liquidity,
      amountAMinReceive,
      amountBMinReceive,
      to,
      isRaw
    );
  }

  async swapExactTokensForTokens(
    tx: Transaction,
    amountIn: bigint | number | string,
    amountOutMin: bigint | number | string,
    path: bigint[] | number[] | string[],
    to: string,
    isRaw?: boolean
  ) {
    return this.dex.swapExactTokensForTokens(
      tx,
      amountIn,
      amountOutMin,
      path,
      to,
      isRaw
    );
  }

  async swapTokensForExactTokens(
    tx: Transaction,
    amountOut: bigint | number | string,
    amountInMax: bigint | number | string,
    path: bigint[] | number[] | string[],
    to: string,
    isRaw?: boolean
  ) {
    return this.dex.swapTokensForExactTokens(
      tx,
      amountOut,
      amountInMax,
      path,
      to,
      isRaw
    );
  }

  // async swapExactCoinForTokens(
  //   tx: Transaction,
  //   path: bigint[] | number[] | string[],
  //   amountIn: TransactionArgument,
  //   amountOutMin: bigint | number | string,
  //   to: string,
  //   coinType?: string,
  //   isRaw?: boolean
  // ) {
  //   return this.dex.swapExactCoinForTokens(
  //     tx,
  //     path,
  //     amountIn,
  //     amountOutMin,
  //     to,
  //     coinType,
  //     isRaw
  //   );
  // }

  async getAmountsOut(
    amountIn: bigint | number | string,
    path: bigint[] | number[] | string[]
  ) {
    return this.dex.getAmountsOut(amountIn, path);
  }

  async getAmountsIn(
    amountOut: bigint | number | string,
    path: bigint[] | number[] | string[]
  ) {
    return this.dex.getAmountsIn(amountOut, path);
  }

  async getPoolList({
    asset1Id,
    asset2Id,
    poolAddress,
    poolAssetId,
    first,
    after,
    orderBy,
  }: {
    asset1Id?: bigint | number | string;
    asset2Id?: bigint | number | string;
    poolAddress?: string;
    poolAssetId?: bigint | number | string;
    first?: number;
    after?: string;
    orderBy?: string[];
  } = {}) {
    return this.storage.list.pool({
      asset1Id,
      asset2Id,
      poolAddress,
      poolAssetId,
      first,
      after,
      orderBy,
    });
  }

  async allPoolList({
    asset1Id,
    asset2Id,
    pageSize,
  }: {
    asset1Id?: bigint | number | string;
    asset2Id?: bigint | number | string;
    pageSize?: number;
  } = {}) {
    pageSize = pageSize ?? 9999;
    let pool = await this.storage.list.pool({
      first: pageSize,
      asset1Id: asset1Id?.toString(),
      asset2Id: asset2Id?.toString(),
    });

    return pool.data;
  }

  async allPoolListWithId(assetId: bigint | number | string) {
    const allAsset1List = await this.allPoolList({
      asset1Id: assetId,
    });

    const allAsset2List = await this.allPoolList({
      asset2Id: assetId,
    });

    const allAssetList = [...allAsset1List, ...allAsset2List];

    return allAssetList;
  }

  // Wrapper Functions
  async register(
    tx: Transaction,
    name: string,
    symbol: string,
    description: string,
    decimals: number,
    url: string,
    info: string,
    coinType?: string,
    isRaw?: boolean
  ) {
    return this.wrapper.register(
      tx,
      name,
      symbol,
      description,
      decimals,
      url,
      info,
      coinType,
      isRaw
    );
  }

  async wrap(
    tx: Transaction,
    coin: TransactionArgument,
    beneficiary: string,
    coinType?: string,
    isRaw?: boolean
  ) {
    return this.wrapper.wrap(tx, coin, beneficiary, coinType, isRaw);
  }

  async unwrap(
    tx: Transaction,
    amount: bigint | number | string,
    beneficiary: string,
    coinType?: string,
    isRaw?: boolean
  ) {
    return this.wrapper.unwrap(tx, amount, beneficiary, coinType, isRaw);
  }

  async wrappedAssets({
    coinType,
    first,
    after,
    orderBy,
  }: {
    coinType?: string;
    first?: number;
    after?: string;
    orderBy?: string[];
  } = {}) {
    return this.storage.list.wrapperAssets({
      coinType,
      first,
      after,
      orderBy,
    });
  }

  // Bridge Functions
  async withdraw(
    tx: Transaction,
    asset_id: bigint | number | string,
    to: string,
    to_chain: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    return this.bridge.withdraw(tx, asset_id, to, to_chain, amount, isRaw);
  }

  async deposit(
    tx: Transaction,
    asset_id: bigint | number | string,
    from: string,
    to: string,
    from_chain: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    return this.bridge.deposit(
      tx,
      this.treasuryCap,
      asset_id,
      from,
      to,
      from_chain,
      amount,
      isRaw
    );
  }

  async querySwapPaths(
    start: bigint | number | string,
    end: bigint | number | string
  ): Promise<number[][]> {
    const pairListResult1 = await this.allPoolListWithId(start);
    const pairListResult2 = await this.allPoolListWithId(end);
    const pairListResult = [...pairListResult1, ...pairListResult2];

    if (!pairListResult) throw new Error('Failed to fetch pair list');
    const pairList = pairListResult;
    // Build adjacency list
    const graph = new Map<number, number[]>();
    pairList.forEach((item) => {
      const token0 = item.key1;
      const token1 = item.key2;
      if (!graph.has(token0)) graph.set(token0, []);
      if (!graph.has(token1)) graph.set(token1, []);
      graph.get(token0)!.push(token1);
      graph.get(token1)!.push(token0);
    });

    // Store all found paths
    const allPaths: number[][] = [];

    // BFS to find all paths
    function bfs() {
      const queue: { path: number[]; node: number }[] = [
        { path: [Number(start)], node: Number(start) },
      ];
      const maxLength = MAX_PATH_LENGTH; // Limit max path length to prevent overly long paths
      const visited = new Set<string>();

      while (queue.length > 0) {
        const { path, node } = queue.shift()!;

        // If target node is found
        if (node === end) {
          allPaths.push([...path]);
          continue;
        }

        // Skip if path length has reached the maximum limit
        if (path.length >= maxLength) continue;

        // Traverse adjacent nodes
        const neighbors = graph.get(node) || [];
        for (const next of neighbors) {
          const pathKey = path.concat(next).join(',');
          if (!visited.has(pathKey)) {
            visited.add(pathKey);
            queue.push({
              path: [...path, next],
              node: next,
            });
          }
        }
      }
    }

    bfs();

    // Sort by path length
    return allPaths.sort((a, b) => a.length - b.length);
  }

  async getConnectedTokens(
    tokenId: bigint | number | string
  ): Promise<number[]> {
    const pairListResult = await this.allPoolListWithId(tokenId);
    if (!pairListResult) throw new Error('Failed to fetch pair list');

    const connectedTokens = new Set<number>();

    // Traverse all pairs
    pairListResult.forEach((item) => {
      const token0 = item.key1;
      const token1 = item.key2;

      if (Number(token0) === Number(tokenId)) {
        connectedTokens.add(token1);
      }
      if (Number(token1) === Number(tokenId)) {
        connectedTokens.add(token0);
      }
    });

    // Convert to array and sort
    return Array.from(connectedTokens).sort((a, b) => a - b);
  }

  async queryAccount({
    address,
    assetId,
  }: {
    address: string;
    assetId: bigint | number | string;
  }): Promise<{
    key1: string;
    key2: string;
    value: {
      balance: string;
    };
  }> {
    const allFields = await this.dubhe.client().getDynamicFieldObject({
      parentId:
        '0xa676f00193c93b812da927baf1e51bd408c2a32b14104df6c1af2b0e874f33ad',
      name: {
        type: '0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::storage_double_map_internal::Entry<u256, address>',
        value: {
          key1: assetId.toString(),
          key2: address,
        },
      },
    });

    if (!allFields.data) {
      return {
        key1: assetId.toString(),
        key2: address,
        value: {
          balance: '0',
        },
      };
    }

    try {
      const content = allFields.data.content as any;
      if (
        content &&
        content.fields &&
        content.fields.value &&
        content.fields.value.fields
      ) {
        return {
          key1: assetId.toString(),
          key2: address,
          value: {
            balance: content.fields.value.fields.balance || '0',
          },
        };
      }
    } catch (error) {
      console.error('Error in queryAccount:', error);
    }

    return {
      key1: assetId.toString(),
      key2: address,
      value: {
        balance: '0',
      },
    };
  }

  async getAllSwappableTokens({
    startTokenId,
  }: {
    startTokenId: bigint | number | string;
  }): Promise<number[]> {
    // Get all trading pairs
    const allPools = await this.allPoolList();
    if (!allPools) throw new Error('Failed to fetch pool list');

    // Build adjacency list
    const graph = new Map<number, number[]>();
    allPools.forEach((item) => {
      const token0 = item.key1;
      const token1 = item.key2;
      if (!graph.has(token0)) graph.set(token0, []);
      if (!graph.has(token1)) graph.set(token1, []);
      graph.get(token0)!.push(token1);
      graph.get(token1)!.push(token0);
    });

    // Store all reachable tokens
    const swappableTokens = new Set<number>();
    const visited = new Set<number>();
    const maxLength = MAX_PATH_LENGTH;
    const queue: { token: number; depth: number }[] = [
      { token: Number(startTokenId), depth: 1 },
    ];
    visited.add(Number(startTokenId));

    // Use BFS to find all reachable tokens
    while (queue.length > 0) {
      const { token: currentToken, depth } = queue.shift()!;

      // Skip if depth exceeds limit
      if (depth >= maxLength) continue;

      // Get all neighbors of current token
      const neighbors = graph.get(currentToken) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ token: neighbor, depth: depth + 1 });
          swappableTokens.add(neighbor);
        }
      }
    }

    // Convert to array and sort
    return Array.from(swappableTokens).sort((a, b) => a - b);
  }

  async getAllSwappableTokensWithMetadata({
    startTokenId,
    address,
  }: {
    startTokenId: bigint | number | string;
    address?: string;
  }): Promise<AssetInfo[]> {
    const swappableTokens = await this.getAllSwappableTokens({
      startTokenId,
    });
    const swappableTokensWithMetadata: AssetInfo[] = await Promise.all(
      swappableTokens.map(async (assetId) => {
        const metadata = (
          await this.storage.get.assetMetadata({
            assetId,
          })
        )?.value as AssetMetadataType;

        let balanceNum = '0';
        let creator = undefined;
        if (address) {
          const balance = await this.queryAccount({
            address: address,
            assetId,
          });
          balanceNum = balance?.value.balance ?? '0';
          creator = balance?.key2;
        }

        return {
          balance: balanceNum,
          metadata,
          assetId,
          creator,
        };
      })
    );
    return swappableTokensWithMetadata;
  }

  async listAssetsInfo({
    assetType,
    first,
    after,
    orderBy,
  }: {
    assetType?: AssetType;
    first?: number;
    after?: string;
    orderBy?: string[];
  } = {}): Promise<AssetInfoResponse> {
    const assetsMetadata = await this.storage.list.assetMetadata({
      first: first ?? 6,
      after: after,
      orderBy: orderBy ?? ['CREATED_AT_ASC'],
    });

    let assetsMetadataResults: AssetInfo[] = await Promise.all(
      assetsMetadata.data.map(async (item) => {
        return {
          assetId: item.key1,
          metadata: item.value,
        };
      })
    );
    if (assetType) {
      assetsMetadataResults = assetsMetadataResults.filter((item) => {
        return item.metadata.asset_type[assetType] !== undefined;
      });
    }

    assetsMetadataResults.sort((a, b) => Number(a.assetId) - Number(b.assetId));

    return {
      data: assetsMetadataResults,
      pageInfo: assetsMetadata.pageInfo,
      totalCount: assetsMetadataResults.length,
    };
  }

  async staticMetadataOf(assetId: bigint | number | string) {
    const metadatas: Record<string, any> = {
      '0': {
        name: 'asset_metadata',
        key1: 0,
        key2: null,
        value: {
          accounts: '57232',
          asset_type: {
            Wrapped: {},
          },
          decimals: 9,
          description: 'Wrapped SUI',
          extra_info: '',
          icon_url: 'https://cryptologos.cc/logos/sui-sui-logo.png?v=040',
          is_burnable: false,
          is_freezable: true,
          is_mintable: false,
          name: 'Wrapped SUI',
          owner:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          status: {
            Liquid: {},
          },
          supply: '60345806821961',
          symbol: 'wSUI',
        },
      },
      '1': {
        name: 'asset_metadata',
        key1: 1,
        key2: null,
        value: {
          accounts: '55993',
          asset_type: {
            Wrapped: {},
          },
          decimals: 7,
          description: 'Wrapped DUBHE',
          extra_info: '',
          icon_url:
            'https://raw.githubusercontent.com/0xobelisk/dubhe/refs/heads/main/assets/logo.jpg',
          is_burnable: false,
          is_freezable: true,
          is_mintable: false,
          name: 'Wrapped DUBHE',
          owner:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          status: {
            Liquid: {},
          },
          supply: '3173844183554',
          symbol: 'wDUBHE',
        },
      },
      '2': {
        name: 'asset_metadata',
        key1: 2,
        key2: null,
        value: {
          accounts: '49079',
          asset_type: {
            Lp: {},
          },
          decimals: 9,
          description: 'Merak LP Asset',
          extra_info: '',
          icon_url: '',
          is_burnable: false,
          is_freezable: false,
          is_mintable: false,
          name: 'Merak LP Asset',
          owner:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          status: {
            Liquid: {},
          },
          supply: '785526231398',
          symbol: 'wSUI-wDUBHE',
        },
      },
      '3': {
        name: 'asset_metadata',
        key1: 3,
        key2: null,
        value: {
          accounts: '47013',
          asset_type: {
            Wrapped: {},
          },
          decimals: 7,
          description: 'Stars point',
          extra_info: '""',
          icon_url:
            'https://raw.githubusercontent.com/0xobelisk/dubhe/main/assets/stars.gif',
          is_burnable: false,
          is_freezable: true,
          is_mintable: false,
          name: 'Wrapped STARS',
          owner:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          status: {
            Liquid: {},
          },
          supply: '14988587165891',
          symbol: 'wSTARS',
        },
      },
      '4': {
        name: 'asset_metadata',
        key1: 4,
        key2: null,
        value: {
          accounts: '39332',
          asset_type: {
            Lp: {},
          },
          decimals: 9,
          description: 'Merak LP Asset',
          extra_info: '',
          icon_url: '',
          is_burnable: false,
          is_freezable: false,
          is_mintable: false,
          name: 'Merak LP Asset',
          owner:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          status: {
            Liquid: {},
          },
          supply: '67606965062',
          symbol: 'wDUBHE-wSTARS',
        },
      },
      '5': {
        name: 'asset_metadata',
        key1: 5,
        key2: null,
        value: {
          accounts: '37229',
          asset_type: {
            Lp: {},
          },
          decimals: 9,
          description: 'Merak LP Asset',
          extra_info: '',
          icon_url: '',
          is_burnable: false,
          is_freezable: false,
          is_mintable: false,
          name: 'Merak LP Asset',
          owner:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          status: {
            Liquid: {},
          },
          supply: '234486484400',
          symbol: 'wSUI-wSTARS',
        },
      },
    };
    return metadatas[assetId.toString()];
  }

  async listAccountWrapperAssets({
    address,
  }: {
    address: string;
  }): Promise<AssetInfoResponse> {
    const assetIds = [0, 1, 3]; // 0: wSUI, 1: wDUBHE, 3: wSTARS
    const assetsData = await Promise.all(
      assetIds.map(async (assetId) => {
        const parentObjectId =
          '0xa676f00193c93b812da927baf1e51bd408c2a32b14104df6c1af2b0e874f33ad';

        const fieldDetail = await this.dubhe.client().getDynamicFieldObject({
          parentId: parentObjectId,
          name: {
            type: '0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::storage_double_map_internal::Entry<u256, address>',
            value: {
              key1: assetId.toString(),
              key2: address,
            },
          },
        });

        let balance = '0';

        if (
          fieldDetail.data &&
          fieldDetail.data.content &&
          typeof fieldDetail.data.content === 'object' &&
          'fields' in fieldDetail.data.content
        ) {
          const content = fieldDetail.data.content as any;
          if (
            content.fields &&
            content.fields.value &&
            content.fields.value.fields
          ) {
            balance = content.fields.value.fields.balance || '0';
          }
        }

        const metadata = (await this.staticMetadataOf(assetId))
          .value as AssetMetadataType;

        return {
          assetId,
          metadata,
          balance,
        };
      })
    );

    // 按assetId升序排序
    const sortedAssetsData = assetsData.sort((a, b) => a.assetId - b.assetId);

    return {
      data: sortedAssetsData,
      pageInfo: { hasNextPage: false, endCursor: '' },
      totalCount: assetsData.length,
    };
  }

  async listAccountLpAssets({
    address,
  }: {
    address: string;
  }): Promise<AssetInfoResponse> {
    const assetIds = [2, 4, 5]; // 0: wSUI, 1: wDUBHE, 3: wSTARS
    const assetsData = await Promise.all(
      assetIds.map(async (assetId) => {
        const parentObjectId =
          '0xa676f00193c93b812da927baf1e51bd408c2a32b14104df6c1af2b0e874f33ad';

        const fieldDetail = await this.dubhe.client().getDynamicFieldObject({
          parentId: parentObjectId,
          name: {
            type: '0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::storage_double_map_internal::Entry<u256, address>',
            value: {
              key1: assetId.toString(),
              key2: address,
            },
          },
        });

        let balance = '0';

        if (
          fieldDetail.data &&
          fieldDetail.data.content &&
          typeof fieldDetail.data.content === 'object' &&
          'fields' in fieldDetail.data.content
        ) {
          const content = fieldDetail.data.content as any;
          if (
            content.fields &&
            content.fields.value &&
            content.fields.value.fields
          ) {
            balance = content.fields.value.fields.balance || '0';
          }
        }

        const metadata = (await this.staticMetadataOf(assetId))
          .value as AssetMetadataType;

        return {
          assetId,
          metadata,
          balance,
        };
      })
    );

    const sortedAssetsData = assetsData.sort((a, b) => a.assetId - b.assetId);

    return {
      data: sortedAssetsData,
      pageInfo: { hasNextPage: false, endCursor: '' },
      totalCount: assetsData.length,
    };
  }

  async listOwnedAssetsInfo({
    address,
    assetType,
    first,
    after,
    orderBy,
  }: {
    address: string;
    assetType?: AssetType;
    first?: number;
    after?: string;
    orderBy?: string[];
  }): Promise<AssetInfoResponse> {
    // const currentAccountInfo = await this.storage.list.account({
    //   address: address,
    //   first: first ?? 9999,
    //   after: after,
    //   orderBy: orderBy ?? ['KEY1_ASC'],
    // });
    let data: AssetInfoResponse;
    if (assetType === 'Lp') {
      data = await this.listAccountLpAssets({ address });
    } else {
      data = await this.listAccountWrapperAssets({ address });
    }

    return data;
  }

  async listPoolsInfo({
    pageSize,
  }: {
    pageSize?: number;
  } = {}): Promise<PoolInfo[]> {
    const poolList = await this.allPoolList({
      pageSize,
    });
    const savedPools: PoolInfo[] = [];

    if (poolList && poolList.length > 0) {
      for (const item of poolList) {
        const asset1Metadata = await this.storage.get.assetMetadata({
          assetId: item.key1,
        });
        const asset2Metadata = await this.storage.get.assetMetadata({
          assetId: item.key2,
        });
        const poolAsset1Amount = await this.queryAccount({
          address: item.value.pool_address,
          assetId: item.key1,
        });
        const poolAsset2Amount = await this.queryAccount({
          address: item.value.pool_address,
          assetId: item.key2,
        });

        if (!asset1Metadata || !asset2Metadata) {
          throw new Error(
            `Failed to fetch pool info, metadata not found: ${item.key1} / ${item.key2}`
          );
        }

        const poolAsset1AmountNum =
          parseFloat(poolAsset1Amount?.value.balance ?? '0') /
          10 ** asset1Metadata.value.decimals;
        const poolAsset2AmountNum =
          parseFloat(poolAsset2Amount?.value.balance ?? '0') /
          10 ** asset2Metadata.value.decimals;
        const poolInfo = {
          name: `${asset1Metadata.value.symbol} / ${asset2Metadata.value.symbol}`,
          asset1Id: item.key1,
          asset2Id: item.key2,
          lpAssetId: item.value.lp_asset_id,
          apr: '10%',
          liquidity: `${poolAsset1AmountNum} ${asset1Metadata.value.symbol} / ${poolAsset2AmountNum} ${asset2Metadata.value.symbol}`,
          volume: `${poolAsset1AmountNum + poolAsset2AmountNum}`,
          feeTier: '1%',
          token1Image: asset1Metadata.value.icon_url,
          token2Image: asset2Metadata.value.icon_url,
        };
        savedPools.push(poolInfo);
      }
    }

    return savedPools;
  }

  async listOwnedWrapperAssets({
    address,
    first,
    after,
    orderBy,
  }: {
    address: string;
    first?: number;
    after?: string;
    orderBy?: string[];
  }): Promise<AssetInfoResponse> {
    return this.listAccountWrapperAssets({ address });
    // return this.listOwnedAssetsInfo({
    //   address,
    //   assetType: 'Wrapped',
    //   first,
    //   after,
    //   orderBy,
    // });
  }

  async listEvents({
    names,
    sender,
    checkpoint,
    digest,
    first,
    after,
    orderBy,
  }: {
    names?: string[];
    sender?: string;
    checkpoint?: string;
    digest?: string;
    first?: number;
    after?: string;
    orderBy?: string[];
  } = {}): Promise<EventInfoResponse> {
    const defaultEventNames = [
      'asset_created_event',
      'asset_transferred_event',
      'ownership_transferred_event',
      'pool_created_event',
      'liquidity_added_event',
      'liquidity_removed_event',
      'swap_event',
      'asset_wrapped_event',
      'asset_unwrapped_event',
      'bridge_withdraw_event',
      'bridge_deposit_event',
    ];

    const events = await this.storage.list.events({
      names: names ?? defaultEventNames,
      sender,
      checkpoint,
      digest,
      first: first ?? 9999,
      after,
      orderBy: orderBy ?? ['ID_DESC'],
    });
    const eventsWithMetadata: EventInfo[] = await Promise.all(
      events.edges.map(async (item) => {
        return {
          name: item.node.name,
          sender: item.node.sender,
          value: item.node.value,
          digest: item.node.digest,
          createdAt: item.node.created_at,
          checkpoint: item.node.checkpoint,
        };
      })
    );
    return {
      data: eventsWithMetadata,
      pageInfo: events.pageInfo,
      totalCount: events.totalCount,
    };
  }

  async listTransactions({
    functionName,
    sender,
    first,
    after,
    orderBy,
  }: {
    functionName?: string[];
    sender?: string;
    first?: number;
    after?: string;
    orderBy?: string[];
  } = {}): Promise<TransactionInfoResponse> {
    const transactions = await this.storage.list.transactions({
      functionName,
      sender,
      first: first ?? 9999,
      after,
      orderBy: orderBy ?? ['ID_DESC'],
      showEvent: true,
    });
    const transactionsWithMetadata: TransactionInfo[] = await Promise.all(
      transactions.edges.map(async (item) => {
        return {
          sender: item.node.sender,
          createdAt: item.node.created_at,
          digest: item.node.digest,
          functionName: item.node.function,
          events: item.node.events || [],
        };
      })
    );
    return {
      data: transactionsWithMetadata,
      pageInfo: transactions.pageInfo,
      totalCount: transactions.totalCount,
    };
  }

  async listTransactionHistory({
    functionName,
    sender,
    first,
    after,
    orderBy,
  }: {
    functionName?: string[];
    sender?: string;
    first?: number;
    after?: string;
    orderBy?: string[];
  } = {}): Promise<TransactionHistoryInfoResponse> {
    const transactions = await this.storage.list.transactions({
      functionName,
      sender,
      first: first ?? 9999,
      after,
      orderBy: orderBy ?? ['ID_DESC'],
      showEvent: true,
    });
    const transactionHistoryInfo: TransactionHistoryInfo[] = await Promise.all(
      transactions.edges.map(async (item) => {
        const event = item.node.events;
        return {
          sender: item.node.sender,
          createdAt: item.node.created_at,
          digest: item.node.digest,
          functionName: item.node.function,
          event: event![0],
        };
      })
    );
    return {
      data: transactionHistoryInfo,
      pageInfo: transactions.pageInfo,
      totalCount: transactions.totalCount,
    };
  }

  async getBridgeConfig({ chainName }: { chainName: BridgeChainName }) {
    return this.storage.get.bridge({ chainName });
  }

  async listBridgeConfig({
    chainName,
    first,
    after,
    orderBy,
  }: {
    chainName?: BridgeChainName;
    first?: number;
    after?: string;
    orderBy?: string[];
  } = {}) {
    return this.storage.list.bridge({ chainName, first, after, orderBy });
  }

  // async listOwnedLpAssetsInfo({ address }: { address: string }) {
  //   const lpAssets = await this.listOwnedAssetsInfo({
  //     address,
  //     assetType: 'Lp',
  //   });

  //   const lpAssetsWithRemoveInfo = await Promise.all(
  //     lpAssets.data.map(async (lpAsset) => {
  //       try {
  //         const liquidityInfo = await this.calRemoveLpAmount({
  //           address,
  //           poolAssetId: lpAsset.assetId,
  //         });

  //         return {
  //           ...lpAsset,
  //           liquidityInfo: {
  //             ...liquidityInfo,
  //             poolAssetId: lpAsset.assetId,
  //           },
  //         };
  //       } catch (error) {
  //         console.error(
  //           `Failed to calculate remove LP amount for asset ${lpAsset.assetId}:`,
  //           error
  //         );
  //         return {
  //           ...lpAsset,
  //           liquidityInfo: null,
  //         };
  //       }
  //     })
  //   );

  //   return {
  //     data: lpAssetsWithRemoveInfo,
  //     pageInfo: lpAssets.pageInfo,
  //     totalCount: lpAssets.totalCount,
  //   };
  // }

  async calRemoveLpAmount({
    address,
    poolAssetId,
    amount,
  }: {
    address: string;
    poolAssetId: bigint | number | string;
    amount?: bigint | number | string;
  }) {
    const poolAssetMetadata = await this.storage.get.assetMetadata({
      assetId: poolAssetId,
    });

    if (!poolAssetMetadata) {
      throw new Error(`Pool asset metadata not found: ${poolAssetId}`);
    }

    const poolAssetAmount = await this.queryAccount({
      address,
      assetId: poolAssetId,
    });

    if (!poolAssetAmount) {
      throw new Error(`Pool asset amount not found: ${poolAssetId}`);
    }

    const amountNum = Number(amount ?? poolAssetAmount.value.balance);

    if (Number(poolAssetAmount.value.balance) < amountNum) {
      throw new Error(
        `Pool asset amount is less than the amount: ${Number(
          poolAssetAmount.value.balance
        )}`
      );
    }

    const shareAmount = amountNum / Number(poolAssetMetadata.value.supply);

    const poolsInfo = await this.storage.list.pool({
      poolAssetId: poolAssetId.toString(),
    });

    if (!poolsInfo) {
      throw new Error(`Pool info not found: ${poolAssetId}`);
    }

    const poolInfoData = poolsInfo.data[0];
    const poolInfoValue = poolsInfo.value[0];
    // Convert to floating-point calculation
    const amountA = Number(poolInfoValue.reserve0) * shareAmount;
    const amountB = Number(poolInfoValue.reserve1) * shareAmount;

    // Get asset precision information
    const asset1Metadata = await this.storage.get.assetMetadata({
      assetId: poolInfoData.key1,
    });
    const asset2Metadata = await this.storage.get.assetMetadata({
      assetId: poolInfoData.key2,
    });

    if (!asset1Metadata || !asset2Metadata) {
      throw new Error('Asset metadata not found');
    }

    return {
      amountA: Math.floor(amountA), // Round down to ensure it doesn't exceed the actual available amount
      amountB: Math.floor(amountB),
      amountASymbol: asset1Metadata.value.symbol,
      amountBSymbol: asset2Metadata.value.symbol,
      decimalsA: asset1Metadata.value.decimals,
      decimalsB: asset2Metadata.value.decimals,
      // Add formatted amounts for easy frontend display
      formattedAmountA: amountA / Math.pow(10, asset1Metadata.value.decimals),
      formattedAmountB: amountB / Math.pow(10, asset2Metadata.value.decimals),
    };
  }
}
