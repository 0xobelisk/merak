import {
  DevInspectResults,
  Dubhe,
  Transaction,
  TransactionArgument,
} from '@0xobelisk/sui-client';

export class Wrapper {
  public dubhe: Dubhe;
  public readonly schemaId: string;
  private readonly schemaModuleName = 'merak_wrapper_system';

  constructor(dubhe: Dubhe, schemaId: string) {
    this.dubhe = dubhe;
    this.schemaId = schemaId;
  }

  // <=== Wrapper Transactions ===>
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
    const params = [
      tx.object(this.schemaId),
      tx.pure.string(name),
      tx.pure.string(symbol),
      tx.pure.string(description),
      tx.pure.u8(decimals),
      tx.pure.string(url),
      tx.pure.string(info),
    ] as TransactionArgument[];

    const typeArguments = [coinType ?? '0x2::sui::SUI'];

    return this.dubhe.tx[this.schemaModuleName].register({
      tx,
      params,
      typeArguments,
      isRaw,
    });
  }

  async wrap(
    tx: Transaction,
    coin: TransactionArgument,
    beneficiary: string,
    coinType?: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      coin,
      tx.pure.address(beneficiary),
    ] as TransactionArgument[];

    const typeArguments = [coinType ?? '0x2::sui::SUI'];

    return this.dubhe.tx[this.schemaModuleName].wrap({
      tx,
      params,
      typeArguments,
      isRaw,
    });
  }

  async unwrap(
    tx: Transaction,
    amount: bigint | number | string,
    beneficiary: string,
    coinType?: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(amount),
      tx.pure.address(beneficiary),
    ] as TransactionArgument[];

    const typeArguments = [coinType ?? '0x2::sui::SUI'];

    return this.dubhe.tx[this.schemaModuleName].unwrap({
      tx,
      params,
      typeArguments,
      isRaw,
    });
  }
}
