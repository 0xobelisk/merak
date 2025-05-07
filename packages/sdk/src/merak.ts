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

  async ownedAssets({
    address,
    assetId,
    first,
    after,
    orderBy,
  }: {
    assetId?: bigint | number | string;
    address?: string;
    first?: number;
    after?: string;
    orderBy?: string[];
  }) {
    return this.storage.list.account({
      address,
      assetId,
      first,
      after,
      orderBy,
    });
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
    first,
    after,
    orderBy,
  }: {
    asset1Id?: bigint | number | string;
    asset2Id?: bigint | number | string;
    first?: number;
    after?: string;
    orderBy?: string[];
  } = {}) {
    return this.storage.list.pool({
      asset1Id,
      asset2Id,
      first,
      after,
      orderBy,
    });
  }

  async allPoolList({
    asset1Id,
    asset2Id,
  }: {
    asset1Id?: bigint | number | string;
    asset2Id?: bigint | number | string;
  } = {}) {
    const pageSize = 10;
    let pool = await this.storage.list.pool({
      first: pageSize,
      asset1Id: asset1Id?.toString(),
      asset2Id: asset2Id?.toString(),
    });

    let allPoolData = [...pool.data];

    while (pool.pageInfo.hasNextPage) {
      const nextPage = await this.storage.list.pool({
        first: pageSize,
        after: pool.pageInfo.endCursor,
        asset1Id: asset1Id?.toString(),
        asset2Id: asset2Id?.toString(),
      });

      allPoolData = [...allPoolData, ...nextPage.data];
      pool = nextPage;
    }

    if (allPoolData.length === 0) {
      return [];
    }

    return allPoolData;
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
        let status = undefined;
        if (address) {
          const balance = await this.storage.get.account({
            address: address,
            assetId,
          });
          balanceNum = balance?.value.balance ?? '0';
          creator = balance?.data.key2;
          status = balance?.value.status;
        }

        return {
          balance: balanceNum,
          metadata,
          assetId,
          creator,
          status,
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
      first: first ?? 9999,
      after: after,
      orderBy: orderBy ?? ['KEY1_ASC'],
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
    return {
      data: assetsMetadataResults,
      pageInfo: assetsMetadata.pageInfo,
      totalCount: assetsMetadataResults.length,
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
    const currentAccountInfo = await this.storage.list.account({
      address: address,
      first: first ?? 9999,
      after: after,
      orderBy: orderBy ?? ['KEY1_ASC'],
    });

    let metadataResults: AssetInfo[] = await Promise.all(
      currentAccountInfo.data.map(async (item) => {
        const metadata = (
          await this.storage.get.assetMetadata({
            assetId: item.key1.toString(),
          })
        )?.value as AssetMetadataType;
        return {
          balance: item.value.balance,
          metadata,
          assetId: item.key1,
          status: item.value.status,
        };
      })
    );
    if (assetType) {
      metadataResults = metadataResults.filter((item) => {
        return item.metadata.asset_type[assetType] !== undefined;
      });
    }
    return {
      data: metadataResults,
      pageInfo: currentAccountInfo.pageInfo,
      totalCount: metadataResults.length,
    };
  }

  async listPoolsInfo(): Promise<PoolInfo[]> {
    const poolList = await this.allPoolList();
    const savedPools: PoolInfo[] = [];
    if (poolList && poolList.length > 0) {
      await Promise.all(
        poolList.map(async (item) => {
          const asset1Metadata = await this.storage.get.assetMetadata({
            assetId: item.key1,
          });
          const asset2Metadata = await this.storage.get.assetMetadata({
            assetId: item.key2,
          });
          const poolAsset1Amount = await this.storage.get.account({
            address: item.value.pool_address,
            assetId: item.key1,
          });
          const poolAsset2Amount = await this.storage.get.account({
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
            apr: '10%',
            liquidity: `${poolAsset1AmountNum} ${asset1Metadata.value.symbol} / ${poolAsset2AmountNum} ${asset2Metadata.value.symbol}`,
            volume: `${poolAsset1AmountNum + poolAsset2AmountNum}`,
            feeTier: '1%',
            token1Image: asset1Metadata.value.icon_url,
            token2Image: asset2Metadata.value.icon_url,
          };
          savedPools.push(poolInfo);
        })
      );
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
    return this.listOwnedAssetsInfo({
      address,
      assetType: 'Wrapped',
      first,
      after,
      orderBy,
    });
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
      'lp_minted_event',
      'lp_burned_event',
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
}
