import {
  DevInspectResults,
  Dubhe,
  Transaction,
  TransactionArgument,
} from '@0xobelisk/sui-client';

export class Bridge {
  public dubhe: Dubhe;
  public readonly schemaId: string;
  private readonly schemaModuleName = 'dubhe_bridge_system';

  constructor(dubhe: Dubhe, schemaId: string) {
    this.dubhe = dubhe;
    this.schemaId = schemaId;
  }

  // <=== Bridge Transactions ===>
  async withdraw(
    tx: Transaction,
    asset_id: bigint | number | string,
    to: string,
    to_chain: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset_id),
      tx.pure.address(to),
      tx.pure.string(to_chain),
      tx.pure.u256(amount),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].withdraw({
      tx,
      params,
      isRaw,
    });
  }

  async deposit(
    tx: Transaction,
    treasury_cap: string,
    asset_id: bigint | number | string,
    from: string,
    to: string,
    from_chain: string,
    amount: bigint | number | string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.object(treasury_cap),
      tx.pure.u256(asset_id),
      tx.pure.address(from),
      tx.pure.address(to),
      tx.pure.string(from_chain),
      tx.pure.u256(amount),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].deposit({
      tx,
      params,
      isRaw,
    });
  }
}
