import { Dubhe, DevInspectResults, Transaction, TransactionArgument } from '@0xobelisk/sui-client';

export class Assets {
  public dubhe: Dubhe;
  public readonly schemaId: string;
  private readonly schemaModuleName = 'assets_system';

  constructor(dubhe: Dubhe, schemaId: string) {
    this.dubhe = dubhe;
    this.schemaId = schemaId;
  }

  // <=== Assets Transactions ===>
  async setMetadata(
    tx: Transaction,
    asset_id: string,
    name: string,
    symbol: string,
    description: string,
    icon_url: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.address(asset_id),
      tx.pure.string(name),
      tx.pure.string(symbol),
      tx.pure.string(description),
      tx.pure.string(icon_url)
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].set_metadata({
      tx,
      params,
      isRaw
    });
  }

  async mint(
    tx: Transaction,
    asset_id: string,
    to: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.address(asset_id),
      tx.pure.address(to),
      tx.pure.u256(amount)
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].mint({
      tx,
      params,
      isRaw
    });
  }

  async burn(
    tx: Transaction,
    asset_id: string,
    from: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.address(asset_id),
      tx.pure.address(from),
      tx.pure.u256(amount)
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].burn({
      tx,
      params,
      isRaw
    });
  }

  async transfer(
    tx: Transaction,
    asset_id: string,
    to: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.address(asset_id),
      tx.pure.address(to),
      tx.pure.u256(amount)
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].transfer({
      tx,
      params,
      isRaw
    });
  }

  async transferAll(tx: Transaction, asset_id: string, to: string, isRaw?: boolean) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.address(asset_id),
      tx.pure.address(to)
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].transfer_all({
      tx,
      params,
      isRaw
    });
  }

  async freezeAddress(tx: Transaction, asset_id: string, address: string, isRaw?: boolean) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.address(asset_id),
      tx.pure.address(address)
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].freeze_address({
      tx,
      params,
      isRaw
    });
  }

  async blockAddress(tx: Transaction, asset_id: string, address: string, isRaw?: boolean) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.address(asset_id),
      tx.pure.address(address)
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].block_address({
      tx,
      params,
      isRaw
    });
  }

  async thawAddress(tx: Transaction, asset_id: string, address: string, isRaw?: boolean) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.address(asset_id),
      tx.pure.address(address)
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].thaw_address({
      tx,
      params,
      isRaw
    });
  }

  async freezeAsset(tx: Transaction, asset_id: string, isRaw?: boolean) {
    const params = [tx.object(this.schemaId), tx.pure.address(asset_id)] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].freeze_asset({
      tx,
      params,
      isRaw
    });
  }

  async thawAsset(tx: Transaction, asset_id: string, isRaw?: boolean) {
    const params = [tx.object(this.schemaId), tx.pure.address(asset_id)] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].thaw_asset({
      tx,
      params,
      isRaw
    });
  }

  async transferOwnership(tx: Transaction, asset_id: string, to: string, isRaw?: boolean) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.address(asset_id),
      tx.pure.address(to)
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].transfer_ownership({
      tx,
      params,
      isRaw
    });
  }

  // <=== Assets Queries ===>
  async balanceOf(asset_id: string, accountAddress?: string) {
    const tx = new Transaction();

    if (accountAddress === undefined) {
      accountAddress = this.dubhe.accountManager.getAddress();
    }

    const params = [
      tx.object(this.schemaId),
      tx.pure.address(asset_id),
      tx.pure.address(accountAddress)
    ] as TransactionArgument[];

    const dryResult = (await this.dubhe.query[this.schemaModuleName].balance_of({
      tx,
      params
    })) as DevInspectResults;

    return this.dubhe.view(dryResult);
  }

  async supplyOf(asset_id: string) {
    const tx = new Transaction();

    const params = [tx.object(this.schemaId), tx.pure.address(asset_id)] as TransactionArgument[];

    const dryResult = (await this.dubhe.query[this.schemaModuleName].supply_of({
      tx,
      params
    })) as DevInspectResults;

    return this.dubhe.view(dryResult);
  }

  async metadataOf(asset_id: string) {
    const tx = new Transaction();

    const params = [tx.object(this.schemaId), tx.pure.address(asset_id)] as TransactionArgument[];

    const dryResult = (await this.dubhe.query[this.schemaModuleName].metadata_of({
      tx,
      params
    })) as DevInspectResults;

    return this.dubhe.view(dryResult);
  }

  async ownerOf(asset_id: string) {
    const tx = new Transaction();

    const params = [tx.object(this.schemaId), tx.pure.address(asset_id)] as TransactionArgument[];

    const dryResult = (await this.dubhe.query[this.schemaModuleName].owner_of({
      tx,
      params
    })) as DevInspectResults;

    return this.dubhe.view(dryResult);
  }
}
