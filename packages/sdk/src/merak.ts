import { Dubhe, NetworkType, Transaction, TransactionArgument } from '@0xobelisk/sui-client';
import { DubheGraphqlClient, OrderBy } from '@0xobelisk/graphql-client';

import {
  AssetMetadataType,
  AssetSupplyType,
  MerakParams,
  AssetInfo,
  AssetInfoResponse,
  PoolInfo,
  AssetType
} from 'src/types';
import { Assets, Dex, Wrapper } from './system';
import { Storage } from './storage';
import { getMerakConfig } from './utils';

const MAX_PATH_LENGTH = 5;

/**
 * @class Merak
 * @description This class is used to aggregate the tools that used to interact with SUI network.
 */
export class Merak {
  public dubhe: Dubhe;
  public graphql: DubheGraphqlClient;

  public assets: Assets;
  public dex: Dex;
  public wrapper: Wrapper;

  public storage: Storage;

  public packageId: string;
  public network: NetworkType;
  public schemaId: string;
  public apiBaseUrl?: string;
  // public treasuryCap: string;

  /**
   * @argument params - The parameters for the Merak instance.
   */
  constructor({ dubhe, graphql, schemaId, apiBaseUrl }: MerakParams) {
    this.dubhe = dubhe;
    this.graphql = graphql;
    this.network = dubhe.getNetwork() as NetworkType;
    this.schemaId = schemaId;
    this.apiBaseUrl = apiBaseUrl;
    this.packageId = dubhe.getPackageId();
    this.assets = new Assets(this.dubhe, schemaId);
    this.dex = new Dex(this.dubhe, schemaId);
    this.wrapper = new Wrapper(this.dubhe, schemaId);
    this.storage = new Storage(this.graphql);
  }

  get coinType() {
    return `${this.packageId}::dubhe::DUBHE`;
  }

  // Assets Functions
  async setMetadata(
    tx: Transaction,
    asset_id: string,
    name: string,
    symbol: string,
    description: string,
    icon_url: string,
    isRaw?: boolean
  ) {
    return this.assets.setMetadata(tx, asset_id, name, symbol, description, icon_url, isRaw);
  }

  async mint(
    tx: Transaction,
    asset_id: string,
    to: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    return this.assets.mint(tx, asset_id, to, amount, isRaw);
  }

  async burn(
    tx: Transaction,
    asset_id: string,
    from: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    return this.assets.burn(tx, asset_id, from, amount, isRaw);
  }

  async transfer(
    tx: Transaction,
    asset_id: string,
    to: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    return this.assets.transfer(tx, asset_id, to, amount, isRaw);
  }

  async transferAll(tx: Transaction, asset_id: string, to: string, isRaw?: boolean) {
    return this.assets.transferAll(tx, asset_id, to, isRaw);
  }

  async freezeAddress(tx: Transaction, asset_id: string, address: string, isRaw?: boolean) {
    return this.assets.freezeAddress(tx, asset_id, address, isRaw);
  }

  async blockAddress(tx: Transaction, asset_id: string, address: string, isRaw?: boolean) {
    return this.assets.blockAddress(tx, asset_id, address, isRaw);
  }

  async thawAddress(tx: Transaction, asset_id: string, address: string, isRaw?: boolean) {
    return this.assets.thawAddress(tx, asset_id, address, isRaw);
  }

  async freezeAsset(tx: Transaction, asset_id: string, isRaw?: boolean) {
    return this.assets.freezeAsset(tx, asset_id, isRaw);
  }

  async thawAsset(tx: Transaction, asset_id: string, isRaw?: boolean) {
    return this.assets.thawAsset(tx, asset_id, isRaw);
  }

  async transferOwnership(tx: Transaction, asset_id: string, to: string, isRaw?: boolean) {
    return this.assets.transferOwnership(tx, asset_id, to, isRaw);
  }

  async balanceOf(asset_id: string, accountAddress?: string) {
    if (!accountAddress) {
      accountAddress = this.dubhe.accountManager.getAddress();
    }

    // return this.assets.balanceOf(asset_id, accountAddress);
    const account = await this.queryAccount({
      address: accountAddress,
      assetId: asset_id
    });
    return account;
  }

  async metadataOf(asset_id: string) {
    return this.assets.metadataOf(asset_id);
  }

  async ownerOf(asset_id: string) {
    return this.assets.ownerOf(asset_id);
  }

  // Dex Functions
  async createPool(tx: Transaction, assetA: string, assetB: string, isRaw?: boolean) {
    return this.dex.createPool(tx, assetA, assetB, isRaw);
  }

  async addLiquidity(
    tx: Transaction,
    assetA: string,
    assetB: string,
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
    assetA: string,
    assetB: string,
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
    path: string[],
    to: string,
    isRaw?: boolean
  ) {
    return this.dex.swapExactTokensForTokens(tx, amountIn, amountOutMin, path, to, isRaw);
  }

  async swapTokensForExactTokens(
    tx: Transaction,
    amountOut: bigint | number | string,
    amountInMax: bigint | number | string,
    path: string[],
    to: string,
    isRaw?: boolean
  ) {
    return this.dex.swapTokensForExactTokens(tx, amountOut, amountInMax, path, to, isRaw);
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

  async getAmountsOut(amountIn: bigint | number | string, path: string[]) {
    return this.dex.getAmountsOut(amountIn, path);
  }

  async getAmountsIn(amountOut: bigint | number | string, path: string[]) {
    return this.dex.getAmountsIn(amountOut, path);
  }

  async getPoolList({
    asset1Id,
    asset2Id,
    poolAddress,
    first,
    after,
    orderBy
  }: {
    asset1Id?: string;
    asset2Id?: string;
    poolAddress?: string;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
  } = {}) {
    return this.storage.list.assetPool({
      asset0: asset1Id,
      asset1: asset2Id,
      poolAddress,
      first: first ?? 3,
      after,
      orderBy
    });
  }

  async getPoolListWithId({ asset1Id, asset2Id }: { asset1Id: string; asset2Id: string }): Promise<{
    kLast: string;
    lpAsset: string;
    reserve0: string;
    reserve1: string;
  } | null> {
    const pool = await this.storage.get.assetPool({
      asset0: asset1Id,
      asset1: asset2Id
    });

    if (!pool) {
      return null;
    }

    return {
      kLast: pool.kLast,
      lpAsset: pool.lpAsset,
      reserve0: pool.reserve0,
      reserve1: pool.reserve1
    };
  }

  async allPoolList({
    asset1Id,
    asset2Id,
    pageSize
  }: {
    asset1Id?: string;
    asset2Id?: string;
    pageSize?: number;
  } = {}) {
    pageSize = pageSize ?? 3;
    let pool = await this.storage.list.assetPool({
      first: pageSize,
      asset0: asset1Id,
      asset1: asset2Id
    });

    return pool.edges.map((edge: any) => edge.node);
  }

  async allPoolListWithId(assetId: string, pageSize?: number) {
    pageSize = pageSize ?? 3;
    const pool = await this.storage.list.assetPool({
      first: pageSize,
      assetId
    });

    return pool.edges.map((edge: any) => edge.node);
  }

  // Wrapper Functions
  async register(
    tx: Transaction,
    name: string,
    symbol: string,
    description: string,
    decimals: number,
    icon_url: string,
    coinType?: string,
    isRaw?: boolean
  ) {
    return this.wrapper.register(
      tx,
      name,
      symbol,
      description,
      decimals,
      icon_url,
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
    orderBy
  }: {
    coinType?: string;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
  } = {}) {
    return this.storage.list.assetWrapper({
      coinType,
      first,
      after,
      orderBy
    });
  }

  async querySwapPaths(start: string, end: string): Promise<string[][]> {
    // Optimized: fetch all pools for both assets in a single query
    const pool = await this.storage.list.assetPool({
      assetIds: [start, end],
      first: 1000 // Increased limit for path finding
    });
    const pairListResult = pool.edges.map((edge: any) => edge.node);

    if (!pairListResult) throw new Error('Failed to fetch pair list');
    const pairList = pairListResult;
    // Build adjacency list
    const graph = new Map<string, string[]>();
    pairList.forEach((item) => {
      const token0 = item.asset0;
      const token1 = item.asset1;
      if (!graph.has(token0)) graph.set(token0, []);
      if (!graph.has(token1)) graph.set(token1, []);
      graph.get(token0)!.push(token1);
      graph.get(token1)!.push(token0);
    });

    // Store all found paths
    const allPaths: string[][] = [];

    // BFS to find all paths
    function bfs() {
      const queue: { path: string[]; node: string }[] = [{ path: [start], node: start }];
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
              node: next
            });
          }
        }
      }
    }

    bfs();

    // Sort by path length
    return allPaths.sort((a, b) => a.length - b.length);
  }

  async getConnectedTokens(tokenId: string): Promise<string[]> {
    const pairListResult = await this.allPoolListWithId(tokenId);
    if (!pairListResult) throw new Error('Failed to fetch pair list');

    const connectedTokens = new Set<string>();

    // Traverse all pairs
    pairListResult.forEach((item) => {
      const token0 = item.asset0;
      const token1 = item.asset1;

      if (token0 === tokenId) {
        connectedTokens.add(token1);
      }
      if (token1 === tokenId) {
        connectedTokens.add(token0);
      }
    });

    // Convert to array and sort
    return Array.from(connectedTokens).sort((a, b) => Number(a) - Number(b));
  }

  async queryAccount({ address, assetId }: { address: string; assetId: string }): Promise<{
    assetId: string;
    address: string;
    balance: string;
  }> {
    const account = await this.storage.get.assetAccount({
      assetId: assetId,
      account: address
    });

    if (!account) {
      return {
        assetId,
        address,
        balance: '0'
      };
    }

    return {
      assetId,
      address,
      balance: account.balance
    };
  }

  async getAllSwappableTokens({ startTokenId }: { startTokenId: string }): Promise<string[]> {
    // Get all trading pairs
    const allPools = await this.allPoolList();
    if (!allPools) throw new Error('Failed to fetch pool list');

    // Build adjacency list
    const graph = new Map<string, string[]>();
    allPools.forEach((item) => {
      const token0 = item.asset0;
      const token1 = item.asset1;
      if (!graph.has(token0)) graph.set(token0, []);
      if (!graph.has(token1)) graph.set(token1, []);
      graph.get(token0)!.push(token1);
      graph.get(token1)!.push(token0);
    });

    // Store all reachable tokens
    const swappableTokens = new Set<string>();
    const visited = new Set<string>();
    const maxLength = MAX_PATH_LENGTH;
    const queue: { token: string; depth: number }[] = [{ token: startTokenId, depth: 1 }];
    visited.add(startTokenId);

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
    return Array.from(swappableTokens).sort();
  }

  // TODO: fix
  // async getAllSwappableTokensWithMetadata({
  //   startTokenId,
  //   address
  // }: {
  //   startTokenId: string;
  //   address?: string;
  // }): Promise<AssetInfo[]> {
  //   const swappableTokens = await this.getAllSwappableTokens({
  //     startTokenId
  //   });

  //   const swappableTokensWithMetadata: AssetInfo[] = await Promise.all(
  //     swappableTokens.map(async (assetId) => {
  //       const metadata = await this.getMetadata(assetId);

  //       let balanceNum = '0';
  //       let creator = undefined;
  //       if (address) {
  //         const balance = await this.queryAccount({
  //           address,
  //           assetId
  //         });
  //         balanceNum = balance?.value.balance ?? '0';
  //         creator = balance?.key2;
  //       }

  //       return {
  //         balance: balanceNum,
  //         metadata: metadata!,
  //         assetId,
  //         creator
  //       };
  //     })
  //   );
  //   return swappableTokensWithMetadata;
  // }

  // async listAssetsInfo({
  //   assetType,
  //   first,
  //   after,
  //   orderBy
  // }: {
  //   assetType?: AssetType;
  //   first?: number;
  //   after?: string;
  //   orderBy?: OrderBy[];
  // } = {}): Promise<AssetInfoResponse> {
  //   const assetsMetadata = await this.storage.list.assetMetadata({
  //     first: first ?? 6,
  //     after: after,
  //     orderBy: orderBy ?? [{ field: 'CREATED_AT_TIMESTAMP_MS', direction: 'ASC' }]
  //   });

  //   let assetsMetadataResults: AssetInfo[] = await Promise.all(
  //     assetsMetadata.edges.map(async (item) => {
  //       const metadata: AssetMetadataType = {
  //         name: item.node.name || '',
  //         symbol: item.node.symbol || '',
  //         description: item.node.description || '',
  //         decimals: item.node.decimals || 0,
  //         iconUrl: item.node.iconUrl || '',
  //         extra_info: '',
  //         owner: item.node.owner || '',
  //         supply: '0',
  //         accounts: '0',
  //         status: item.node.status || '',
  //         is_mintable: item.node.isMintable || false,
  //         is_burnable: item.node.isBurnable || false,
  //         is_freezable: item.node.isFreezable || false,
  //         asset_type: (() => {
  //           if (!item.node.assetType) return {};

  //           if (typeof item.node.assetType === 'string') {
  //             // Try to parse as JSON first
  //             try {
  //               return JSON.parse(item.node.assetType);
  //             } catch {
  //               // If parsing fails, it's a simple enum value like "Wrapped", "Lp", "Native"
  //               // Convert to object format: "Wrapped" -> { "Wrapped": {} }
  //               return { [item.node.assetType]: {} };
  //             }
  //           }

  //           return item.node.assetType;
  //         })()
  //       };
  //       return {
  //         assetId: Number(item.node.assetId),
  //         metadata
  //       };
  //     })
  //   );
  //   if (assetType) {
  //     assetsMetadataResults = assetsMetadataResults.filter((item) => {
  //       return item.metadata.assetType !== undefined;
  //     });
  //   }

  //   assetsMetadataResults.sort((a, b) => Number(a.assetId) - Number(b.assetId));

  //   return {
  //     data: assetsMetadataResults,
  //     pageInfo: assetsMetadata.pageInfo,
  //     totalCount: assetsMetadataResults.length
  //   };
  // }

  async getMetadata(assetId: bigint | number | string) {
    // If apiBaseUrl is configured, use API endpoint with caching
    if (this.apiBaseUrl) {
      try {
        console.log('============== this.apiBaseUrl ==============', this.apiBaseUrl);
        console.log('============== assetId ==============', assetId.toString());
        const response = await fetch(
          `${this.apiBaseUrl}/api/assets/metadata/${assetId.toString()}`
        );
        console.log('============== response ==============', response);

        if (!response.ok) {
          // If API fails, fall back to storage query
          console.warn(`API request failed (${response.status}), falling back to storage query`);
        } else {
          const result = await response.json();

          if (result.success && result.data) {
            return result.data as AssetMetadataType;
          }
        }
      } catch (error) {
        console.warn('API request error, falling back to storage query:', error);
      }
    }

    // Fallback to storage query (original implementation)
    const result = await this.storage.get.assetMetadata({
      assetId
    });
    if (!result) return null;
    return result as AssetMetadataType;
  }

  async getLatestMetadata(assetId: bigint | number | string) {
    const result = await this.storage.get.assetMetadata({
      assetId
    });

    if (!result) return null;
    return result as AssetMetadataType;
  }

  async listAccountLpAssets({
    account,
    assetType,
    first,
    after,
    orderBy,
    metadataMap: providedMetadataMap
  }: {
    account: string;
    assetType?: AssetType;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
    metadataMap?: Map<string, AssetMetadataType>;
  }): Promise<AssetInfoResponse> {
    const assetsData = await this.storage.list.assetAccount({
      account,
      first: first ?? 20,
      after,
      orderBy: orderBy ?? [{ field: 'CREATED_AT_TIMESTAMP_MS', direction: 'ASC' }]
    });

    // If metadata map is provided, use it; otherwise fetch each individually
    const allResults = await Promise.all(
      assetsData.edges.map(async (item) => {
        let metadata: AssetMetadataType | null = null;

        if (providedMetadataMap && providedMetadataMap.has(item.node.assetId)) {
          // Use provided metadata from cache
          metadata = providedMetadataMap.get(item.node.assetId) || null;
        } else {
          // Fetch metadata if not provided
          metadata = await this.getMetadata(item.node.assetId);
        }

        // Skip if metadata is not found
        if (!metadata) {
          return null;
        }

        return {
          balance: item.node.balance,
          metadata: metadata,
          assetId: item.node.assetId,
          status: item.node.status
        };
      })
    );

    let metadataResults: AssetInfo[] = allResults.filter(
      (item): item is NonNullable<typeof item> => item !== null
    );

    if (assetType) {
      metadataResults = metadataResults.filter((item) => {
        return item.metadata?.assetType !== undefined;
      });
    }

    const sortedMetadataResults = metadataResults.sort((a, b) => {
      const balanceA = BigInt(a.balance || '0');
      const balanceB = BigInt(b.balance || '0');
      return balanceA > balanceB ? -1 : balanceA < balanceB ? 1 : 0;
    });

    return {
      data: sortedMetadataResults,
      pageInfo: assetsData.pageInfo,
      totalCount: sortedMetadataResults.length
    };
  }

  async listOwnedAssetsInfo({
    account,
    assetType,
    first,
    after,
    orderBy,
    metadataMap
  }: {
    account: string;
    assetType?: AssetType;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
    metadataMap?: Map<string, AssetMetadataType>;
  }): Promise<AssetInfoResponse> {
    return this.listAccountLpAssets({ account, assetType, first, after, orderBy, metadataMap });
  }

  async listPoolsInfo({
    pageSize,
    metadataMap: providedMetadataMap
  }: {
    pageSize?: number;
    metadataMap?: Map<string, AssetMetadataType>;
  } = {}): Promise<PoolInfo[]> {
    const poolList = await this.allPoolList({
      pageSize
    });

    if (!poolList || poolList.length === 0) {
      return [];
    }

    // Collect unique asset IDs and pool addresses for batch querying
    const uniqueAssetIds = new Set<string>();
    const accountQueries: Array<{
      address: string;
      assetId: string;
      poolIndex: number;
      assetIndex: number;
    }> = [];

    poolList.forEach((item, poolIndex) => {
      uniqueAssetIds.add(item.asset0);
      uniqueAssetIds.add(item.asset1);
      accountQueries.push({
        address: item.poolAddress,
        assetId: item.asset0,
        poolIndex,
        assetIndex: 0
      });
      accountQueries.push({
        address: item.poolAddress,
        assetId: item.asset1,
        poolIndex,
        assetIndex: 1
      });
    });

    // Create metadata map: use provided metadata or fetch missing ones
    let metadataMap: Map<string, AssetMetadataType>;

    if (providedMetadataMap) {
      // Use provided metadata, only fetch missing ones
      metadataMap = new Map(providedMetadataMap);
      const missingAssetIds = Array.from(uniqueAssetIds).filter(
        (assetId) => !metadataMap.has(assetId)
      );

      if (missingAssetIds.length > 0) {
        const missingMetadataPromises = missingAssetIds.map((assetId) =>
          this.getMetadata(assetId).then((metadata) => ({ assetId, metadata }))
        );
        const missingMetadataResults = await Promise.all(missingMetadataPromises);
        missingMetadataResults.forEach(({ assetId, metadata }) => {
          if (metadata) {
            metadataMap.set(assetId, metadata);
          }
        });
      }
    } else {
      // Fetch all metadata if not provided
      const metadataPromises = Array.from(uniqueAssetIds).map((assetId) =>
        this.getMetadata(assetId).then((metadata) => ({ assetId, metadata }))
      );
      const metadataResults = await Promise.all(metadataPromises);
      metadataMap = new Map<string, AssetMetadataType>();
      metadataResults.forEach(({ assetId, metadata }) => {
        if (metadata) {
          metadataMap.set(assetId, metadata);
        }
      });
    }

    // Batch fetch all account balances concurrently
    const balancePromises = accountQueries.map((query) =>
      this.queryAccount({ address: query.address, assetId: query.assetId }).then((balance) => ({
        ...query,
        balance
      }))
    );
    const balanceResults = await Promise.all(balancePromises);

    // Create balance map indexed by poolIndex and assetIndex
    const balanceMap = new Map<string, string>();
    balanceResults.forEach(({ poolIndex, assetIndex, balance }) => {
      balanceMap.set(`${poolIndex}-${assetIndex}`, balance?.balance ?? '0');
    });

    // Build pool info array
    const savedPools: PoolInfo[] = [];
    for (let i = 0; i < poolList.length; i++) {
      const item = poolList[i];
      const asset1Metadata = metadataMap.get(item.asset0);
      const asset2Metadata = metadataMap.get(item.asset1);

      if (!asset1Metadata || !asset2Metadata) {
        console.warn(`Skipping pool ${i}: metadata not found for ${item.asset0} or ${item.asset1}`);
        continue;
      }

      const poolAsset1Balance = balanceMap.get(`${i}-0`) ?? '0';
      const poolAsset2Balance = balanceMap.get(`${i}-1`) ?? '0';

      const poolAsset1AmountNum = parseFloat(poolAsset1Balance) / 10 ** asset1Metadata.decimals;
      const poolAsset2AmountNum = parseFloat(poolAsset2Balance) / 10 ** asset2Metadata.decimals;

      const poolInfo = {
        name: `${asset1Metadata.symbol} / ${asset2Metadata.symbol}`,
        asset1Id: item.asset0,
        asset2Id: item.asset1,
        lpAssetId: item.lpAsset,
        apr: '10%',
        liquidity: `${poolAsset1AmountNum} ${asset1Metadata.symbol} / ${poolAsset2AmountNum} ${asset2Metadata.symbol}`,
        volume: `${poolAsset1AmountNum + poolAsset2AmountNum}`,
        feeTier: '1%',
        token1Image: asset1Metadata.iconUrl,
        token2Image: asset2Metadata.iconUrl
      };
      savedPools.push(poolInfo);
    }

    return savedPools;
  }

  async listOwnedWrapperAssets({
    account,
    first,
    after,
    orderBy,
    metadataMap
  }: {
    account: string;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
    metadataMap?: Map<string, AssetMetadataType>;
  }): Promise<AssetInfoResponse> {
    return this.listOwnedAssetsInfo({
      account,
      assetType: 'Wrapped',
      first,
      after,
      orderBy,
      metadataMap
    });
  }

  async calRemoveLpAmount({
    address,
    poolAssetId,
    poolSupply,
    amount,
    metadataMap: providedMetadataMap
  }: {
    address: string;
    poolAssetId: string;
    poolSupply: number;
    amount?: bigint | number | string;
    metadataMap?: Map<string, AssetMetadataType>;
  }) {
    // const poolAssetMetadata = await this.getLatestMetadata(poolAssetId);

    // if (!poolAssetMetadata) {
    // throw new Error(`Pool asset metadata not found: ${poolAssetId}`);
    // }

    const poolAssetAmount = await this.queryAccount({
      address,
      assetId: poolAssetId
    });

    if (!poolAssetAmount) {
      throw new Error(`Pool asset amount not found: ${poolAssetId}`);
    }

    const amountNum = Number(amount ?? poolAssetAmount.balance);

    if (Number(poolAssetAmount.balance) < amountNum) {
      throw new Error(
        `Pool asset amount is less than the amount: ${Number(poolAssetAmount.balance)}`
      );
    }

    const shareAmount = amountNum / Number(poolSupply);

    const poolsInfo = await this.storage.list.assetPool({
      poolAssetId: poolAssetId.toString(),
      first: 1
    });

    if (!poolsInfo || poolsInfo.edges.length === 0) {
      throw new Error(`Pool info not found: ${poolAssetId}`);
    }

    const poolInfoData = poolsInfo.edges[0].node;
    const poolInfoValue = await this.getPoolListWithId({
      asset1Id: poolInfoData.asset0,
      asset2Id: poolInfoData.asset1
    });

    if (!poolInfoValue) {
      throw new Error(`Pool info not found: ${poolAssetId}`);
    }

    // Convert to floating-point calculation
    const amountA = Number(poolInfoValue.reserve0) * shareAmount;
    const amountB = Number(poolInfoValue.reserve1) * shareAmount;

    // Get asset precision information
    let asset1Metadata: AssetMetadataType | null = null;
    let asset2Metadata: AssetMetadataType | null = null;

    if (providedMetadataMap) {
      // Use provided metadata if available
      asset1Metadata = providedMetadataMap.get(poolInfoData.asset0) || null;
      asset2Metadata = providedMetadataMap.get(poolInfoData.asset1) || null;

      // Fetch missing metadata
      if (!asset1Metadata) {
        asset1Metadata = await this.getMetadata(poolInfoData.asset0);
      }
      if (!asset2Metadata) {
        asset2Metadata = await this.getMetadata(poolInfoData.asset1);
      }
    } else {
      // Fetch both if no metadata map provided
      asset1Metadata = await this.getMetadata(poolInfoData.asset0);
      asset2Metadata = await this.getMetadata(poolInfoData.asset1);
    }

    if (!asset1Metadata || !asset2Metadata) {
      throw new Error('Asset metadata not found');
    }

    return {
      amountA: Math.floor(amountA), // Round down to ensure it doesn't exceed the actual available amount
      amountB: Math.floor(amountB)
      // amountASymbol: asset1Metadata.symbol,
      // amountBSymbol: asset2Metadata.symbol,
      // decimalsA: asset1Metadata.decimals,
      // decimalsB: asset2Metadata.decimals,
      // // Add formatted amounts for easy frontend display
      // formattedAmountA: amountA / Math.pow(10, asset1Metadata.decimals),
      // formattedAmountB: amountB / Math.pow(10, asset2Metadata.decimals)
    };
  }

  async supplyOf(assetId: string): Promise<AssetSupplyType | null> {
    const supply = await this.storage.get.assetSupply({
      assetId
    });
    return supply as AssetSupplyType | null;
  }
}
