'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMerak } from '@/app/jotai/merak';
import { PoolInfo } from '@0xobelisk/merak-sdk';
import { useBatchAssetMetadata } from './useAssetMetadata';

export interface UsePoolsOptions {
  pageSize?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch pool list with caching
 *
 * This hook replaces direct calls to merak.listPoolsInfo() throughout the app
 * Benefits:
 * - Automatic caching via React Query (5 min stale time)
 * - Prevents duplicate queries across components
 * - Batch concurrent queries in SDK for better performance
 * - Uses cached metadata to avoid redundant queries
 *
 * @example
 * const { data: pools, isLoading } = usePools();
 * const { data: morePools } = usePools({ pageSize: 10 });
 */
export function usePools(options: UsePoolsOptions = {}) {
  const merak = useMerak();
  const { pageSize = 3, enabled = true } = options;

  // First, get the basic pool list to extract asset IDs
  const { data: basicPools, isLoading: isLoadingBasicPools } = useQuery({
    queryKey: ['basicPoolList', pageSize],
    queryFn: async () => {
      if (!merak) {
        throw new Error('Merak not initialized');
      }
      return merak.allPoolList({ pageSize });
    },
    enabled: enabled && !!merak,
    staleTime: 5 * 60 * 1000
  });

  // Extract unique asset IDs from pools
  const assetIds = React.useMemo(() => {
    if (!basicPools || basicPools.length === 0) return [];
    const ids = new Set<string>();
    basicPools.forEach((pool: any) => {
      ids.add(pool.asset0);
      ids.add(pool.asset1);
    });
    return Array.from(ids);
  }, [basicPools]);

  // Batch fetch metadata for all assets in pools (using cache)
  const { data: metadataMap, isLoading: isLoadingMetadata } = useBatchAssetMetadata(
    assetIds,
    assetIds.length > 0
  );

  // Finally, get full pool info with cached metadata
  return useQuery<PoolInfo[]>({
    queryKey: ['pools', pageSize, metadataMap],
    queryFn: async () => {
      if (!merak) {
        throw new Error('Merak not initialized');
      }

      const poolList = await merak.listPoolsInfo({
        pageSize,
        metadataMap // Pass cached metadata to SDK
      });

      return poolList;
    },
    enabled: enabled && !!merak && !!metadataMap && !isLoadingBasicPools && !isLoadingMetadata,
    // Cache for 5 minutes (pool data changes less frequently than user balances)
    staleTime: 5 * 60 * 1000,
    // Keep in cache for 15 minutes after last use
    gcTime: 15 * 60 * 1000,
    // Don't refetch on window focus for pool data
    refetchOnWindowFocus: false
  });
}

/**
 * Hook to fetch a specific pool by asset IDs
 *
 * @example
 * const { data: pool } = usePool({ asset1Id: '0', asset2Id: '1' });
 */
export function usePool({
  asset1Id,
  asset2Id,
  enabled = true
}: {
  asset1Id?: string;
  asset2Id?: string;
  enabled?: boolean;
}) {
  const merak = useMerak();

  return useQuery({
    queryKey: ['pool', asset1Id, asset2Id],
    queryFn: async () => {
      if (!merak || !asset1Id || !asset2Id) {
        throw new Error('Merak not initialized or missing asset IDs');
      }

      const pool = await merak.getPoolListWithId({
        asset1Id,
        asset2Id
      });

      return pool;
    },
    enabled: enabled && !!merak && !!asset1Id && !!asset2Id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });
}
