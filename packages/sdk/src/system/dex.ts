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
    asset1: bigint | number | string,
    asset2: bigint | number | string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset1),
      tx.pure.u256(asset2),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].create_pool({
      tx,
      params,
      isRaw,
    });
  }

  async addLiquidity(
    tx: Transaction,
    asset1: bigint | number | string,
    asset2: bigint | number | string,
    amount1Desired: bigint | number | string,
    amount2Desired: bigint | number | string,
    amount1Min: bigint | number | string,
    amount2Min: bigint | number | string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset1),
      tx.pure.u256(asset2),
      tx.pure.u256(amount1Desired),
      tx.pure.u256(amount2Desired),
      tx.pure.u256(amount1Min),
      tx.pure.u256(amount2Min),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].add_liquidity({
      tx,
      params,
      isRaw,
    });
  }

  async removeLiquidity(
    tx: Transaction,
    asset1: bigint | number | string,
    asset2: bigint | number | string,
    lpTokenBurn: bigint | number | string,
    amount1MinReceive: bigint | number | string,
    amount2MinReceive: bigint | number | string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.u256(asset1),
      tx.pure.u256(asset2),
      tx.pure.u256(lpTokenBurn),
      tx.pure.u256(amount1MinReceive),
      tx.pure.u256(amount2MinReceive),
    ] as TransactionArgument[];

    return this.dubhe.tx[this.schemaModuleName].remove_liquidity({
      tx,
      params,
      isRaw,
    });
  }

  async swapExactTokensForTokens(
    tx: Transaction,
    path: bigint[] | number[] | string[],
    amountIn: bigint | number | string,
    amountOutMin: bigint | number | string,
    to: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.vector('u256', path),
      tx.pure.u256(amountIn),
      tx.pure.u256(amountOutMin),
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
    path: bigint[] | number[] | string[],
    amountOut: bigint | number | string,
    amountInMax: bigint | number | string,
    to: string,
    isRaw?: boolean
  ) {
    const params = [
      tx.object(this.schemaId),
      tx.pure.vector('u256', path),
      tx.pure.u256(amountOut),
      tx.pure.u256(amountInMax),
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
  async getAmountOut(
    path: bigint[] | number[] | string[],
    amountIn: bigint | number | string
  ): Promise<any[] | undefined> {
    const tx = new Transaction();
    const params = [
      tx.object(this.schemaId),
      tx.pure.vector('u256', path),
      tx.pure.u256(amountIn),
    ] as TransactionArgument[];

    const dryResult = (await this.dubhe.query[
      this.schemaModuleName
    ].get_amount_out({
      tx,
      params,
    })) as DevInspectResults;
    return this.dubhe.view(dryResult);
  }

  async getAmountIn(
    path: bigint[] | number[] | string[],
    amountOut: bigint | number | string
  ): Promise<any[] | undefined> {
    const tx = new Transaction();
    const params = [
      tx.object(this.schemaId),
      tx.pure.vector('u256', path),
      tx.pure.u256(amountOut),
    ] as TransactionArgument[];

    const dryResult = (await this.dubhe.query[
      this.schemaModuleName
    ].get_amount_in({
      tx,
      params,
    })) as DevInspectResults;
    return this.dubhe.view(dryResult);
  }
}
