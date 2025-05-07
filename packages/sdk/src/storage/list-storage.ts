import { Dubhe } from '@0xobelisk/sui-client';

export class ListStorage {
  private readonly dubhe: Dubhe;

  constructor(dubhe: Dubhe) {
    this.dubhe = dubhe;
  }

  // StorageMap queries
  async assetMetadata({
    assetId,
    first,
    after,
    orderBy,
  }: {
    assetId?: bigint | number | string;
    first?: number;
    after?: string;
    orderBy?: string[];
  } = {}) {
    const item = await this.dubhe.getStorage({
      name: 'asset_metadata',
      key1: assetId?.toString(),
      first,
      after,
      orderBy,
    });
    return item;
  }

  async assetDetails({
    assetId,
    first,
    after,
    orderBy,
  }: {
    assetId?: bigint | number | string;
    first?: number;
    after?: string;
    orderBy?: string[];
  } = {}) {
    const item = await this.dubhe.getStorage({
      name: 'asset_details',
      key1: assetId?.toString(),
      first,
      after,
      orderBy,
    });
    return item;
  }

  async wrapperPools({
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
    const item = await this.dubhe.getStorage({
      name: 'wrapper_pools',
      key1: coinType,
      first,
      after,
      orderBy,
    });
    return item;
  }

  async wrapperAssets({
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
    const item = await this.dubhe.getStorage({
      name: 'wrapper_assets',
      key1: coinType,
      first,
      after,
      orderBy,
    });
    return item;
  }

  async bridge({
    chainName,
    first,
    after,
    orderBy,
  }: {
    chainName?: string;
    first?: number;
    after?: string;
    orderBy?: string[];
  } = {}) {
    const item = await this.dubhe.getStorage({
      name: 'bridge',
      key1: chainName,
      first,
      after,
      orderBy,
    });
    return item;
  }

  // StorageDoubleMap queries
  async account({
    assetId,
    address,
    first,
    after,
    orderBy,
  }: {
    assetId?: bigint | number | string;
    address?: string;
    first?: number;
    after?: string;
    orderBy?: string[];
  } = {}) {
    const item = await this.dubhe.getStorage({
      name: 'account',
      key1: assetId?.toString(),
      key2: address,
      first,
      after,
      orderBy,
    });
    return item;
  }

  async pool({
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
    const item = await this.dubhe.getStorage({
      name: 'pools',
      key1: asset1Id?.toString(),
      key2: asset2Id?.toString(),
      first,
      after,
      orderBy,
      is_removed: false,
    });
    return item;
  }

  // Event queries
  async events({
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
  } = {}) {
    const item = await this.dubhe.getEvents({
      names,
      sender,
      checkpoint,
      digest,
      first,
      after,
      orderBy,
    });
    return item;
  }
}
