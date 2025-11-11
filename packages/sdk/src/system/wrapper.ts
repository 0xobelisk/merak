import { Dubhe, DevInspectResults, Transaction, TransactionArgument } from '@0xobelisk/sui-client';

export class Wrapper {
  public dubhe: Dubhe;
  public readonly schemaId: string;
  private readonly schemaModuleName = 'wrapper_system';

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
    icon_url: string,
    coinType?: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.string(name),
      tx.pure.string(symbol),
      tx.pure.string(description),
      tx.pure.u8(decimals),
      tx.pure.string(icon_url)
    ] as TransactionArgument[];

    const typeArguments = [coinType ?? '0x2::sui::SUI'];

    return this.dubhe.tx[this.schemaModuleName].do_register({
      tx,
      params,
      typeArguments,
      isRaw
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
      tx.pure.address(beneficiary)
    ] as TransactionArgument[];

    const typeArguments = [coinType ?? '0x2::sui::SUI'];

    return this.dubhe.tx[this.schemaModuleName].wrap({
      tx,
      params,
      typeArguments,
      isRaw
    });
  }

  // public entry fun unwrap<T>(dapp_hub: &mut DappHub, amount: u256, beneficiary: address, ctx: &mut TxContext) {
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
      tx.pure.address(beneficiary)
    ] as TransactionArgument[];

    const typeArguments = [coinType ?? '0x2::sui::SUI'];

    return this.dubhe.tx[this.schemaModuleName].unwrap({
      tx,
      params,
      typeArguments,
      isRaw
    });
  }

  // <=== Wrapper Queries ===>
  async getCoinType(coinType?: string): Promise<string> {
    const tx = new Transaction();
    const typeArguments = [coinType ?? '0x2::sui::SUI'];

    const dryResult = (await this.dubhe.query[this.schemaModuleName].get_coin_type({
      tx,
      typeArguments
    })) as DevInspectResults;

    const result = this.dubhe.view(dryResult);
    return Array.isArray(result) ? result[0] : result;
  }
}
