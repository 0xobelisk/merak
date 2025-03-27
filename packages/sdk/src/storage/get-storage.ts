import { Dubhe } from '@0xobelisk/sui-client';

export class GetStorage {
  private readonly dubhe: Dubhe;

  constructor(dubhe: Dubhe) {
    this.dubhe = dubhe;
  }

  // StorageValue queries
  async nextAssetId() {
    const item = await this.dubhe.getStorageItem({
      name: 'next_asset_id',
    });
    return item;
  }

  async swapFee() {
    const item = await this.dubhe.getStorageItem({
      name: 'swap_fee',
    });
    return item;
  }

  async lpFee() {
    const item = await this.dubhe.getStorageItem({
      name: 'lp_fee',
    });
    return item;
  }

  async feeTo() {
    const item = await this.dubhe.getStorageItem({
      name: 'fee_to',
    });
    return item;
  }

  async maxSwapPathLen() {
    const item = await this.dubhe.getStorageItem({
      name: 'max_swap_path_len',
    });
    return item;
  }

  async minLiquidity() {
    const item = await this.dubhe.getStorageItem({
      name: 'min_liquidity',
    });
    return item;
  }

  // StorageMap queries
  async assetMetadata({ assetId }: { assetId: bigint | number | string }) {
    const item = await this.dubhe.getStorageItem({
      name: 'asset_metadata',
      key1: assetId.toString(),
    });
    return item;
  }

  async assetDetails({ assetId }: { assetId: bigint | number | string }) {
    const item = await this.dubhe.getStorageItem({
      name: 'asset_details',
      key1: assetId.toString(),
    });
    return item;
  }

  async wrapperPools({ coinType }: { coinType: string }) {
    const item = await this.dubhe.getStorageItem({
      name: 'wrapper_pools',
      key1: coinType,
    });
    return item;
  }

  async wrapperAssets({
    coinType,
    assetId,
  }: {
    coinType?: string;
    assetId?: bigint | number | string;
  }) {
    if (coinType) {
      const item = await this.dubhe.getStorageItem({
        name: 'wrapper_assets',
        key1: coinType,
      });
      return item;
    }

    if (assetId) {
      const item = await this.dubhe.getStorageItem({
        name: 'wrapper_assets',
        value: assetId.toString(),
      });
      return item;
    }
  }

  // StorageDoubleMap queries
  async account({
    assetId,
    address,
  }: {
    assetId: bigint | number | string;
    address: string;
  }) {
    const item = await this.dubhe.getStorageItem({
      name: 'account',
      key1: assetId.toString(),
      key2: address,
    });
    return item;
  }

  async pool({
    asset1Id,
    asset2Id,
  }: {
    asset1Id: bigint | number | string;
    asset2Id: bigint | number | string;
  }) {
    const item = await this.dubhe.getStorageItem({
      name: 'pools',
      key1: asset1Id.toString(),
      key2: asset2Id.toString(),
    });
    return item;
  }
}
