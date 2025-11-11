/**
 * Asset Setup Helpers
 *
 * Auto wrap/unwrap assets for testing
 */

import { Transaction } from '@0xobelisk/sui-client';
import type { Merak } from '../../src/merak';
import {
  logSection,
  logStep,
  logSuccess,
  logInfo,
  logWarning,
  waitForTransaction
} from './test-utils';

export interface AssetRequirements {
  assetId: string;
  coinType: string;
  requiredAmount: bigint;
  decimals?: number;
}

/**
 * Auto-wrap assets if balance is insufficient
 */
export async function ensureWrappedAssets(
  merak: Merak,
  accountAddress: string,
  requirements: AssetRequirements[]
): Promise<Map<string, bigint>> {
  logSection('Auto-Preparing Test Assets');

  const wrappedAmounts = new Map<string, bigint>();

  for (const req of requirements) {
    logStep(`Checking ${req.coinType}`);

    // Check current wrapped balance
    const wrappedBalance = await merak.balanceOf(req.assetId);
    const currentBalance = BigInt(wrappedBalance.balance);

    logInfo('Current Wrapped Balance', currentBalance.toString());
    logInfo('Required', req.requiredAmount.toString());

    if (currentBalance >= req.requiredAmount) {
      logSuccess('Already have sufficient wrapped assets');
      wrappedAmounts.set(req.assetId, 0n);
      continue;
    }

    // Calculate how much to wrap
    const shortage = req.requiredAmount - currentBalance;
    // Add 10% buffer for safety
    const amountToWrap = (shortage * 110n) / 100n;

    logWarning(`Need to wrap ${amountToWrap.toString()} more`);

    // Check native balance
    const decimals = req.decimals || 9;
    let nativeBalance: bigint;

    // Check if this is SUI (both short and long form)
    const isSui =
      req.coinType === '0x2::sui::SUI' ||
      req.coinType ===
        '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';

    if (isSui) {
      const suiBalance = await merak.dubhe.balanceOf();
      nativeBalance = BigInt(suiBalance.totalBalance);
    } else {
      // For other coin types (like DUBHE), use getBalance with coin type
      try {
        const balance = await merak.dubhe.balanceOf(accountAddress, req.coinType);
        nativeBalance = BigInt(balance.totalBalance);
      } catch (error) {
        logWarning(`Could not query native balance for ${req.coinType}`);
        logWarning('Skipping auto-wrap for this asset');
        wrappedAmounts.set(req.assetId, 0n);
        continue;
      }
    }

    logInfo('Native Balance', nativeBalance.toString());

    // Add gas buffer (0.01 for SUI to cover gas fees)
    const gasBuffer = isSui ? BigInt(0.01 * 10 ** decimals) : 0n;

    if (nativeBalance < amountToWrap + gasBuffer) {
      logWarning(
        `Insufficient native balance to wrap. Have ${nativeBalance}, need ${
          amountToWrap + gasBuffer
        }`
      );
      logWarning('Skipping auto-wrap for this asset');
      wrappedAmounts.set(req.assetId, 0n);
      continue;
    }

    // Perform wrap
    logStep(`Wrapping ${amountToWrap.toString()} ${req.coinType}`);

    try {
      const tx = new Transaction();

      // For SUI, use gas; for others, select coins
      let coin;
      if (isSui) {
        // For SUI, split from gas object
        [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountToWrap)]);
      } else {
        // For other coins (like DUBHE), select coins from balance
        const selectCoins = await merak.dubhe.selectCoinsWithAmount(
          Number(amountToWrap),
          req.coinType,
          accountAddress
        );

        if (!selectCoins || selectCoins.length === 0) {
          throw new Error('Unable to select sufficient coins');
        }

        [coin] = tx.splitCoins(tx.object(selectCoins[0]), [tx.pure.u64(amountToWrap)]);
      }

      const result = await merak.wrap(tx, coin, accountAddress, req.coinType);

      logSuccess('Wrap transaction submitted');
      logInfo('Transaction Hash', (result as any).digest);
      logInfo('Waiting for indexer...', '3 seconds');

      await waitForTransaction(3);

      // Verify new balance
      const newBalance = await merak.balanceOf(req.assetId);
      const actualWrapped = BigInt(newBalance.balance) - currentBalance;

      logSuccess(`Wrapped ${actualWrapped.toString()} successfully`);
      wrappedAmounts.set(req.assetId, actualWrapped);
    } catch (error: any) {
      logWarning(`Failed to wrap: ${error.message}`);
      wrappedAmounts.set(req.assetId, 0n);
    }
  }

  return wrappedAmounts;
}

/**
 * Auto-unwrap all wrapped assets
 */
export async function cleanupWrappedAssets(
  merak: Merak,
  accountAddress: string,
  assetConfigs: Array<{ assetId: string; coinType: string }>
): Promise<void> {
  logSection('Auto-Cleanup: Unwrapping Test Assets');

  for (const config of assetConfigs) {
    logStep(`Checking ${config.coinType}`);

    try {
      // Check wrapped balance
      const wrappedBalance = await merak.balanceOf(config.assetId);
      const balance = BigInt(wrappedBalance.balance);

      if (balance === 0n) {
        logInfo('No wrapped assets to unwrap', config.assetId);
        continue;
      }

      logInfo('Wrapped Balance', balance.toString());
      logStep(`Unwrapping ${balance.toString()}`);

      const tx = new Transaction();
      const result = await merak.unwrap(tx, balance, accountAddress, config.coinType);

      logSuccess('Unwrap transaction submitted');
      logInfo('Transaction Hash', (result as any).digest);
      logInfo('Waiting for transaction...', '3 seconds');

      await waitForTransaction(3);

      // Verify unwrap
      const newBalance = await merak.balanceOf(config.assetId);
      if (BigInt(newBalance.balance) === 0n) {
        logSuccess('All assets unwrapped successfully');
      } else {
        logInfo('Remaining wrapped balance', newBalance.balance);
      }
    } catch (error: any) {
      logWarning(`Failed to unwrap ${config.assetId}: ${error.message}`);
    }
  }
}
