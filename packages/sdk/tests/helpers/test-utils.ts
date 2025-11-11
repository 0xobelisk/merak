/**
 * Test Utilities
 *
 * Common utilities and helpers for testing
 */

import { expect } from 'vitest';

// ==================== Logging Utilities ====================

export function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

export function logStep(step: string) {
  console.log(`\n📍 ${step}`);
}

export function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

export function logError(message: string) {
  console.error(`❌ ${message}`);
}

export function logInfo(key: string, value: any) {
  console.log(`   ${key}: ${value}`);
}

export function logWarning(message: string) {
  console.log(`⚠️  ${message}`);
}

// ==================== Wait Utilities ====================

export async function waitForTransaction(seconds: number = 3) {
  console.log(`⏳ Waiting ${seconds}s for transaction confirmation...`);
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==================== Balance Utilities ====================

export function formatBalance(balance: bigint | string | number, decimals: number = 9): string {
  const balanceBigInt = typeof balance === 'bigint' ? balance : BigInt(balance);
  const divisor = BigInt(10 ** decimals);
  const integerPart = balanceBigInt / divisor;
  const fractionalPart = balanceBigInt % divisor;

  return `${integerPart}.${fractionalPart.toString().padStart(decimals, '0')}`;
}

export function parseAmount(amount: number, decimals: number = 9): bigint {
  return BigInt(Math.floor(amount * 10 ** decimals));
}

// ==================== Assertion Helpers ====================

export function expectBalanceIncrease(
  initialBalance: bigint | string,
  finalBalance: bigint | string,
  expectedIncrease: bigint,
  tolerance: bigint = BigInt(0)
) {
  const initial = typeof initialBalance === 'bigint' ? initialBalance : BigInt(initialBalance);
  const final = typeof finalBalance === 'bigint' ? finalBalance : BigInt(finalBalance);
  const actualIncrease = final - initial;

  const diff =
    actualIncrease > expectedIncrease
      ? actualIncrease - expectedIncrease
      : expectedIncrease - actualIncrease;

  expect(diff).toBeLessThanOrEqual(tolerance);

  return actualIncrease;
}

export function expectBalanceDecrease(
  initialBalance: bigint | string,
  finalBalance: bigint | string,
  expectedDecrease: bigint,
  tolerance: bigint = BigInt(0)
) {
  const initial = typeof initialBalance === 'bigint' ? initialBalance : BigInt(initialBalance);
  const final = typeof finalBalance === 'bigint' ? finalBalance : BigInt(finalBalance);
  const actualDecrease = initial - final;

  const diff =
    actualDecrease > expectedDecrease
      ? actualDecrease - expectedDecrease
      : expectedDecrease - actualDecrease;

  expect(diff).toBeLessThanOrEqual(tolerance);

  return actualDecrease;
}

// ==================== Transaction Helpers ====================

export function extractDigest(response: any): string {
  return response.digest || response.effects?.transactionDigest || '';
}

export function isTransactionSuccessful(response: any): boolean {
  return response.effects?.status?.status === 'success';
}

// ==================== Error Handling ====================

export async function expectToThrow(fn: () => Promise<any>, expectedError?: string | RegExp) {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error: any) {
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect(error.message).toContain(expectedError);
      } else {
        expect(error.message).toMatch(expectedError);
      }
    }
  }
}

// ==================== Retry Utilities ====================

export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (i < maxRetries - 1) {
        console.log(`Retry ${i + 1}/${maxRetries} after error: ${error.message}`);
        await sleep(delayMs);
      }
    }
  }

  throw lastError!;
}
