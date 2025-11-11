import { DubheGraphqlClient } from '@0xobelisk/graphql-client';

export class GetStorage {
  private readonly graphql: DubheGraphqlClient;

  constructor(graphql: DubheGraphqlClient) {
    this.graphql = graphql;
  }

  // StorageValue queries
  async dubheAssetId() {
    const item = await this.graphql.getTableByCondition('dubhe_asset_id', {
      uniqueResourceId: 1
    });
    return item;
  }

  async suiAssetId() {
    const item = await this.graphql.getTableByCondition('sui_asset_id', {
      uniqueResourceId: 1
    });
    return item;
  }

  async dubheConfig() {
    const item = await this.graphql.getTableByCondition('dubhe_config', {
      uniqueResourceId: 1
    });
    return item;
  }

  async dappFeeConfig() {
    const item = await this.graphql.getTableByCondition('dapp_fee_config', {
      uniqueResourceId: 1
    });
    return item;
  }

  // StorageMap queries
  async assetMetadata({ assetId }: { assetId: bigint | number | string }) {
    const item = await this.graphql.getTableByCondition('asset_metadata', {
      assetId: assetId.toString()
    });
    return item;
  }

  async assetSupply({ assetId }: { assetId: bigint | number | string }) {
    const item = await this.graphql.getTableByCondition('asset_supply', {
      assetId: assetId.toString()
    });
    return item;
  }

  async assetHolder({ assetId }: { assetId: bigint | number | string }) {
    const item = await this.graphql.getTableByCondition('asset_holder', {
      assetId: assetId.toString()
    });
    return item;
  }

  async assetWrapper({ coinType }: { coinType: string }) {
    const item = await this.graphql.getTableByCondition('asset_wrapper', {
      coinType: coinType
    });
    return item;
  }

  async dappMetadata({ dappKey }: { dappKey: string }) {
    const item = await this.graphql.getTableByCondition('dapp_metadata', {
      dappKey: dappKey
    });
    return item;
  }

  async dappFeeState({ dappKey }: { dappKey: string }) {
    const item = await this.graphql.getTableByCondition('dapp_fee_state', {
      dappKey: dappKey
    });
    return item;
  }

  async dappProxy({ dappKey }: { dappKey: string }) {
    const item = await this.graphql.getTableByCondition('dapp_proxy', {
      dappKey: dappKey
    });
    return item;
  }

  // StorageDoubleMap queries
  async assetAccount({ assetId, account }: { assetId: bigint | number | string; account: string }) {
    const item = await this.graphql.getTableByCondition('asset_account', {
      assetId: assetId.toString(),
      account: account
    });
    return item;
  }

  async assetPool({
    asset0,
    asset1
  }: {
    asset0: bigint | number | string;
    asset1: bigint | number | string;
  }) {
    const item = await this.graphql.getTableByCondition('asset_pool', {
      asset0: asset0.toString(),
      asset1: asset1.toString()
    });
    return item;
  }
}
