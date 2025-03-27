import {
  DevInspectResults,
  Dubhe,
  Transaction,
  TransactionArgument,
} from '@0xobelisk/sui-client';

export class Assets {
  public dubhe: Dubhe;
  public readonly schemaId: string;
  private readonly schemaModuleName = 'merak_assets_system';

  constructor(dubhe: Dubhe, schemaId: string) {
    this.dubhe = dubhe;
    this.schemaId = schemaId;
  }

  // <=== Assets Transactions ===>
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
    const params = [
      tx.object(this.schemaId),
      tx.pure.string(name),
      tx.pure.string(symbol),
      tx.pure.string(description),
      tx.pure.u8(decimals),
      tx.pure.string(icon_url),
      tx.pure.string(extra_info),
      tx.pure.u256(initial_supply),
      tx.pure.address(send_to),
      tx.pure.address(owner),
      tx.pure.bool(is_mintable),
      tx.pure.bool(is_burnable),
      tx.pure.bool(is_freezable),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].create({
      tx,
      params,
      isRaw,
    });
  }

  async mint(
    tx: Transaction,
    asset_id: bigint | number | string,
    to: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset_id),
      tx.pure.address(to),
      tx.pure.u256(amount),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].mint({
      tx,
      params,
      isRaw,
    });
  }

  async burn(
    tx: Transaction,
    asset_id: bigint | number | string,
    from: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset_id),
      tx.pure.address(from),
      tx.pure.u256(amount),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].burn({
      tx,
      params,
      isRaw,
    });
  }

  async transfer(
    tx: Transaction,
    asset_id: bigint | number | string,
    to: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset_id),
      tx.pure.address(to),
      tx.pure.u256(amount),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].transfer({
      tx,
      params,
      isRaw,
    });
  }

  async transferAll(
    tx: Transaction,
    asset_id: bigint | number | string,
    to: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset_id),
      tx.pure.address(to),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].transfer_all({
      tx,
      params,
      isRaw,
    });
  }

  async freezeAddress(
    tx: Transaction,
    asset_id: bigint | number | string,
    address: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset_id),
      tx.pure.address(address),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].freeze_address({
      tx,
      params,
      isRaw,
    });
  }

  async blockAddress(
    tx: Transaction,
    asset_id: bigint | number | string,
    address: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset_id),
      tx.pure.address(address),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].block_address({
      tx,
      params,
      isRaw,
    });
  }

  async thawAddress(
    tx: Transaction,
    asset_id: bigint | number | string,
    address: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset_id),
      tx.pure.address(address),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].thaw_address({
      tx,
      params,
      isRaw,
    });
  }

  async freezeAsset(
    tx: Transaction,
    asset_id: bigint | number | string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset_id),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].freeze_asset({
      tx,
      params,
      isRaw,
    });
  }

  async thawAsset(
    tx: Transaction,
    asset_id: bigint | number | string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset_id),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].thaw_asset({
      tx,
      params,
      isRaw,
    });
  }

  async transferOwnership(
    tx: Transaction,
    asset_id: bigint | number | string,
    to: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset_id),
      tx.pure.address(to),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].transfer_ownership({
      tx,
      params,
      isRaw,
    });
  }

  // <=== Assets Queries ===>
  async balanceOf(asset_id: bigint | number | string, accountAddress?: string) {
    const tx = new Transaction();

    if (accountAddress === undefined) {
      accountAddress = this.dubhe.accountManager.getAddress();
    }

    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset_id),
      tx.pure.address(accountAddress),
    ] as TransactionArgument[];

    const dryResult = (await this.dubhe.query[this.schemaModuleName].balance_of(
      {
        tx,
        params,
      }
    )) as DevInspectResults;

    return this.dubhe.view(dryResult);
  }

  async supplyOf(asset_id: bigint | number | string) {
    const tx = new Transaction();

    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset_id),
    ] as TransactionArgument[];

    const dryResult = (await this.dubhe.query[this.schemaModuleName].supply_of({
      tx,
      params,
    })) as DevInspectResults;

    return this.dubhe.view(dryResult);
  }

  async metadataOf(asset_id: bigint | number | string) {
    const tx = new Transaction();

    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset_id),
    ] as TransactionArgument[];

    const dryResult = (await this.dubhe.query[
      this.schemaModuleName
    ].metadata_of({
      tx,
      params,
    })) as DevInspectResults;

    return this.dubhe.view(dryResult);
  }
}
