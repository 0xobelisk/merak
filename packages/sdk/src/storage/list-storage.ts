import { DubheGraphqlClient, OrderBy } from '@0xobelisk/graphql-client';

export class ListStorage {
  private readonly graphql: DubheGraphqlClient;

  constructor(graphql: DubheGraphqlClient) {
    this.graphql = graphql;
  }

  // StorageMap queries
  async assetMetadata({
    assetId,
    first,
    after,
    orderBy
  }: {
    assetId?: string;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
  } = {}) {
    const filter = assetId ? { asset_id: { equalTo: assetId } } : undefined;
    const item = await this.graphql.getAllTables('asset_metadata', {
      filter,
      first,
      after,
      orderBy
    });
    return item;
  }

  async assetSupply({
    assetId,
    first,
    after,
    orderBy
  }: {
    assetId?: string;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
  } = {}) {
    const filter = assetId ? { assetId: { equalTo: assetId } } : undefined;
    const item = await this.graphql.getAllTables('asset_supply', {
      filter,
      first,
      after,
      orderBy
    });
    return item;
  }

  async assetHolder({
    assetId,
    first,
    after,
    orderBy
  }: {
    assetId?: string;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
  } = {}) {
    const filter = assetId ? { assetId: { equalTo: assetId } } : undefined;
    const item = await this.graphql.getAllTables('asset_holder', {
      filter,
      first,
      after,
      orderBy
    });
    return item;
  }

  async assetWrapper({
    coinType,
    assetId,
    first,
    after,
    orderBy
  }: {
    coinType?: string;
    assetId?: string;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
  } = {}) {
    const filter: any = {};
    if (coinType) filter.coinType = { equalTo: coinType };
    if (assetId) filter.assetId = { equalTo: assetId };
    const item = await this.graphql.getAllTables('asset_wrapper', {
      filter,
      first,
      after,
      orderBy
    });
    return item;
  }

  async dappMetadata({
    dappKey,
    first,
    after,
    orderBy
  }: {
    dappKey?: string;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
  } = {}) {
    const filter = dappKey ? { dappKey: { equalTo: dappKey } } : undefined;
    const item = await this.graphql.getAllTables('dapp_metadata', {
      filter,
      first,
      after,
      orderBy
    });
    return item;
  }

  async dappFeeState({
    dappKey,
    first,
    after,
    orderBy
  }: {
    dappKey?: string;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
  } = {}) {
    const filter = dappKey ? { dappKey: { equalTo: dappKey } } : undefined;
    const item = await this.graphql.getAllTables('dapp_fee_state', {
      filter,
      first,
      after,
      orderBy
    });
    return item;
  }

  async dappProxy({
    dappKey,
    first,
    after,
    orderBy
  }: {
    dappKey?: string;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
  } = {}) {
    const filter = dappKey ? { dappKey: { equalTo: dappKey } } : undefined;
    const item = await this.graphql.getAllTables('dapp_proxy', {
      filter,
      first,
      after,
      orderBy
    });
    return item;
  }

  // StorageDoubleMap queries
  async assetAccount({
    assetId,
    account,
    first,
    after,
    orderBy
  }: {
    assetId?: string;
    account?: string;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
  } = {}) {
    const filter: any = {};
    if (assetId) filter.assetId = { equalTo: assetId };
    if (account) filter.account = { equalTo: account };

    const item = await this.graphql.getAllTables('asset_account', {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      first,
      after,
      orderBy
    });
    return item;
  }

  async assetPool({
    asset0,
    asset1,
    poolAddress,
    poolAssetId,
    assetId,
    assetIds,
    first,
    after,
    orderBy
  }: {
    asset0?: string;
    asset1?: string;
    poolAddress?: string;
    poolAssetId?: string;
    assetId?: string;
    assetIds?: string[];
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
  } = {}) {
    const filter: any = {};

    // If assetIds array is provided, search for pools where either asset0 or asset1 is in the array
    if (assetIds && assetIds.length > 0) {
      filter.or = [{ asset0: { in: assetIds } }, { asset1: { in: assetIds } }];
    }
    // If single assetId is provided, search for pools where asset is either asset0 or asset1
    else if (assetId) {
      filter.or = [{ asset0: { equalTo: assetId } }, { asset1: { equalTo: assetId } }];
    }
    // Otherwise use individual asset0/asset1 filters
    else {
      if (asset0) filter.asset0 = { equalTo: asset0 };
      if (asset1) filter.asset1 = { equalTo: asset1 };
    }

    if (poolAddress) filter.pool_address = { equalTo: poolAddress };
    if (poolAssetId) filter.lpAsset = { equalTo: poolAssetId };

    const item = await this.graphql.getAllTables('asset_pool', {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      first,
      after,
      orderBy
    });
    return item;
  }

  // Event queries
  async assetTransfer({
    from,
    to,
    assetId,
    first,
    after,
    orderBy
  }: {
    from?: string;
    to?: string;
    assetId?: string;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
  } = {}) {
    const filter: any = {};
    if (from) filter.from = { equalTo: from };
    if (to) filter.to = { equalTo: to };
    if (assetId) filter.assetId = { equalTo: assetId };

    const item = await this.graphql.getAllTables('asset_transfer', {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      first,
      after,
      orderBy
    });
    return item;
  }

  async assetWrap({
    from,
    to,
    coinType,
    assetId,
    first,
    after,
    orderBy
  }: {
    from?: string;
    to?: string;
    coinType?: string;
    assetId?: string;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
  } = {}) {
    const filter: any = {};
    if (from) filter.from = { equalTo: from };
    if (to) filter.to = { equalTo: to };
    if (coinType) filter.coinType = { equalTo: coinType };
    if (assetId) filter.asset_id = { equalTo: assetId };

    const item = await this.graphql.getAllTables('asset_wrap', {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      first,
      after,
      orderBy
    });
    return item;
  }

  async assetUnwrap({
    from,
    to,
    coinType,
    assetId,
    first,
    after,
    orderBy
  }: {
    from?: string;
    to?: string;
    coinType?: string;
    assetId?: string;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
  } = {}) {
    const filter: any = {};
    if (from) filter.from = { equalTo: from };
    if (to) filter.to = { equalTo: to };
    if (coinType) filter.coinType = { equalTo: coinType };
    if (assetId) filter.assetId = { equalTo: assetId };

    const item = await this.graphql.getAllTables('asset_unwrap', {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      first,
      after,
      orderBy
    });
    return item;
  }

  async assetSwap({
    from,
    to,
    asset0,
    asset1,
    first,
    after,
    orderBy
  }: {
    from?: string;
    to?: string;
    asset0?: string;
    asset1?: string;
    first?: number;
    after?: string;
    orderBy?: OrderBy[];
  } = {}) {
    const filter: any = {};
    if (from) filter.from = { equalTo: from };
    if (to) filter.to = { equalTo: to };
    if (asset0) filter.asset0 = { equalTo: asset0 };
    if (asset1) filter.asset1 = { equalTo: asset1 };

    const item = await this.graphql.getAllTables('asset_swap', {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      first,
      after,
      orderBy
    });
    return item;
  }
}
