'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMerak } from '@/app/jotai/merak';
import { AssetInfo } from '@0xobelisk/merak-sdk';
import { OrderBy } from '@0xobelisk/graphql-client';

export interface UseUserAssetsOptions {
  assetType?: 'Wrapped' | 'Native' | 'Synthetic' | 'Lp';
  first?: number;
  after?: string;
  orderBy?: OrderBy[];
  enabled?: boolean;
}

export interface UserAssetsResponse {
  data: AssetInfo[];
  pageInfo?: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount: number;
}

/**
 * Unified hook to fetch user's owned assets with caching
 *
 * This hook replaces direct calls to merak.listOwnedAssetsInfo() throughout the app
 * Benefits:
 * - Automatic caching via React Query (5 min stale time)
 * - Prevents duplicate queries across components
 * - Refetches when wallet address changes
 *
 * Note: For user assets, we don't pre-fetch metadata because we don't know which assets
 * the user owns until after the first query. The SDK will use the API endpoint which has
 * its own caching (ISR with 60s revalidation).
 *
 * @example
 * const { data: userAssets, isLoading } = useUserAssets();
 * const { data: lpAssets } = useUserAssets({ assetType: 'Lp' });
 */
export function useUserAssets(options: UseUserAssetsOptions = {}) {
  const account = useCurrentAccount();
  const merak = useMerak();
  const { assetType, first, after, orderBy, enabled = true } = options;

  return useQuery<UserAssetsResponse>({
    queryKey: ['userAssets', account?.address, assetType, first, after, orderBy],
    queryFn: async () => {
      if (!account?.address || !merak) {
        throw new Error('Wallet not connected or Merak not initialized');
      }

      // Note: We don't pass metadataMap here because:
      // 1. We don't know which assets user owns until after the query
      // 2. The SDK's getMetadata already uses the API cache (/api/assets/metadata)
      // 3. For future optimization, we could do a 2-step process:
      //    a) Query to get asset IDs
      //    b) Batch fetch metadata
      //    c) Query again with cached metadata
      const result = await merak.listOwnedAssetsInfo({
        account: account.address,
        assetType,
        first,
        after,
        orderBy
      });

      return result;
    },
    enabled: enabled && !!account?.address && !!merak,
    // Cache for 5 minutes (user balances change relatively frequently)
    staleTime: 5 * 60 * 1000,
    // Keep in cache for 10 minutes after last use
    gcTime: 10 * 60 * 1000,
    // Refetch when user comes back to the tab
    refetchOnWindowFocus: true
  });
}

/**
 * Hook to fetch user's LP (Liquidity Provider) assets only
 *
 * @example
 * const { data: lpAssets } = useUserLpAssets();
 */
export function useUserLpAssets(options: Omit<UseUserAssetsOptions, 'assetType'> = {}) {
  return useUserAssets({ ...options, assetType: 'Lp' });
}

/**
 * Hook to fetch user's wrapped assets only
 *
 * @example
 * const { data: wrappedAssets } = useUserWrappedAssets();
 */
export function useUserWrappedAssets(options: Omit<UseUserAssetsOptions, 'assetType'> = {}) {
  return useUserAssets({ ...options, assetType: 'Wrapped' });
}
