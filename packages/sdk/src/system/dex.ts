import {
  DevInspectResults,
  Dubhe,
  Transaction,
  TransactionArgument,
} from '@0xobelisk/sui-client';

export class Dex {
  public dubhe: Dubhe;
  public readonly schemaId: string;
  private readonly schemaModuleName = 'dubhe_dex_system';

  constructor(dubhe: Dubhe, schemaId: string) {
    this.dubhe = dubhe;
    this.schemaId = schemaId;
  }

  // <=== Dex Transactions ===>
  async createPool(
    tx: Transaction,
    assetA: bigint | number | string,
    assetB: bigint | number | string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(assetA),
      tx.pure.u256(assetB),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].create_pool({
      tx,
      params,
      isRaw,
    });
  }

  async addLiquidity(
    tx: Transaction,
    assetA: bigint | number | string,
    assetB: bigint | number | string,
    amountADesired: bigint | number | string,
    amountBDesired: bigint | number | string,
    amountAMin: bigint | number | string,
    amountBMin: bigint | number | string,
    to: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(assetA),
      tx.pure.u256(assetB),
      tx.pure.u256(amountADesired),
      tx.pure.u256(amountBDesired),
      tx.pure.u256(amountAMin),
      tx.pure.u256(amountBMin),
      tx.pure.address(to),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].add_liquidity({
      tx,
      params,
      isRaw,
    });
  }

  async removeLiquidity(
    tx: Transaction,
    assetA: bigint | number | string,
    assetB: bigint | number | string,
    liquidity: bigint | number | string,
    amountAMinReceive: bigint | number | string,
    amountBMinReceive: bigint | number | string,
    to: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(assetA),
      tx.pure.u256(assetB),
      tx.pure.u256(liquidity),
      tx.pure.u256(amountAMinReceive),
      tx.pure.u256(amountBMinReceive),
      tx.pure.address(to),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].remove_liquidity({
      tx,
      params,
      isRaw,
    });
  }

  async swapExactTokensForTokens(
    tx: Transaction,
    amountIn: bigint | number | string,
    amountOutMin: bigint | number | string,
    path: bigint[] | number[] | string[],
    to: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(amountIn),
      tx.pure.u256(amountOutMin),
      tx.pure.vector('u256', path),
      tx.pure.address(to),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].swap_exact_tokens_for_tokens({
      tx,
      params,
      isRaw,
    });
  }

  async swapTokensForExactTokens(
    tx: Transaction,
    amountOut: bigint | number | string,
    amountInMax: bigint | number | string,
    path: bigint[] | number[] | string[],
    to: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(amountOut),
      tx.pure.u256(amountInMax),
      tx.pure.vector('u256', path),
      tx.pure.address(to),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].swap_tokens_for_exact_tokens({
      tx,
      params,
      isRaw,
    });
  }

  async swapExactCoinForTokens(
    tx: Transaction,
    path: bigint[] | number[] | string[],
    amountIn: TransactionArgument,
    amountOutMin: bigint | number | string,
    to: string,
    coinType?: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.vector('u256', path),
      amountIn,
      tx.pure.u256(amountOutMin),
      tx.pure.address(to),
    ] as TransactionArgument[];

    const typeArguments = [coinType ?? '0x2::sui::SUI'];

    return this.dubhe.tx[this.schemaModuleName].swap_exact_coin_for_tokens({
      tx,
      params,
      typeArguments,
      isRaw,
    });
  }

  // <=== Dex Queries ===>
  async getAmountsOut(
    amountIn: bigint | number | string,
    path: bigint[] | number[] | string[]
  ): Promise<any[] | undefined> {
    const tx = new Transaction();
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(amountIn),
      tx.pure.vector('u256', path),
    ] as TransactionArgument[];

    const dryResult = (await this.dubhe.query[
      this.schemaModuleName
    ].get_amounts_out({
      tx,
      params,
    })) as DevInspectResults;
    return this.dubhe.view(dryResult);
  }

  async getAmountsIn(
    amountOut: bigint | number | string,
    path: bigint[] | number[] | string[]
  ): Promise<any[] | undefined> {
    const tx = new Transaction();
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(amountOut),
      tx.pure.vector('u256', path),
    ] as TransactionArgument[];

    const dryResult = (await this.dubhe.query[
      this.schemaModuleName
    ].get_amounts_in({
      tx,
      params,
    })) as DevInspectResults;
    return this.dubhe.view(dryResult);
  }
}
