'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAtom } from 'jotai';
import { AssetsStateAtom } from '@/app/jotai/assets';
import type {
  RegistryAsset,
  RegistryAssetsResponse,
  SingleRegistryAssetResponse,
  EnrichedAsset
} from '@/app/types/registry';
import { AssetInfo } from '@0xobelisk/merak-sdk';

interface UseRegistryAssetsOptions {
  status?: 'live' | 'deprecated' | 'testing';
  enabled?: boolean;
}

/**
 * Hook to fetch all registry assets
 * Returns the whitelist of configured assets from the local registry
 *
 * @param options - Optional configuration
 * @param options.status - Filter by status (live, deprecated, testing)
 * @param options.enabled - Enable/disable the query
 *
 * @example
 * const { data, isLoading } = useRegistryAssets();
 * const { data: liveAssets } = useRegistryAssets({ status: 'live' });
 */
export function useRegistryAssets(options: UseRegistryAssetsOptions = {}) {
  const { status, enabled = true } = options;

  return useQuery<RegistryAssetsResponse>({
    queryKey: ['registryAssets', status],
    queryFn: async () => {
      const url = status ? `/api/registry?status=${status}` : '/api/registry';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch registry assets');
      }
      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes (registry changes rarely)
    refetchOnWindowFocus: false
  });
}

/**
 * Hook to fetch a single registry asset by name
 *
 * @param name - Asset name (e.g., 'sui', 'dubhe')
 * @param enabled - Enable/disable the query
 *
 * @example
 * const { data } = useRegistryAsset('sui');
 */
export function useRegistryAsset(name: string | undefined, enabled: boolean = true) {
  return useQuery<SingleRegistryAssetResponse>({
    queryKey: ['registryAsset', name],
    queryFn: async () => {
      if (!name) {
        throw new Error('Asset name is required');
      }
      const response = await fetch(`/api/registry/${name}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch registry asset: ${name}`);
      }
      return response.json();
    },
    enabled: enabled && !!name,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });
}

/**
 * Hook to get enriched assets combining registry config with on-chain data
 * This merges the whitelist from registry with dynamic balance/supply data from chain
 *
 * @param options - Optional configuration
 * @param options.status - Filter registry assets by status
 * @param options.enabled - Enable/disable the query
 *
 * @example
 * const { data: enrichedAssets, isLoading } = useEnrichedAssets();
 */
export function useEnrichedAssets(options: UseRegistryAssetsOptions = {}) {
  const { status = 'live', enabled = true } = options;

  // Get registry assets (whitelist)
  const { data: registryData, isLoading: isRegistryLoading } = useRegistryAssets({
    status,
    enabled
  });

  // Get on-chain asset data
  const [assetsState] = useAtom(AssetsStateAtom);

  // Merge registry and on-chain data
  const enrichedAssets = useMemo<EnrichedAsset[]>(() => {
    if (!registryData?.success || !registryData.data) {
      return [];
    }

    return registryData.data.map((registryAsset) => {
      // Find matching on-chain data by assetId
      const onChainAsset = assetsState.assetInfos.find(
        (asset) => asset.assetId.toString() === registryAsset.metadata.assetId
      );

      // Create enriched asset
      const enriched: EnrichedAsset = {
        ...registryAsset,
        balance: onChainAsset?.balance,
        formattedBalance: onChainAsset?.balance
          ? formatBalance(onChainAsset.balance, registryAsset.metadata.decimals)
          : '0',
        // Override with fresh on-chain data if available
        onChainMetadata: onChainAsset?.metadata
          ? {
              assetId: onChainAsset.metadata.assetId,
              assetType: onChainAsset.metadata.assetType as 'Wrapped' | 'Native' | 'Synthetic',
              createdAtTimestampMs: onChainAsset.metadata.createdAtTimestampMs,
              decimals: onChainAsset.metadata.decimals,
              description: onChainAsset.metadata.description,
              iconUrl: onChainAsset.metadata.iconUrl,
              isBurnable: onChainAsset.metadata.isBurnable,
              isDeleted: onChainAsset.metadata.isDeleted,
              isFreezable: onChainAsset.metadata.isFreezable,
              isMintable: onChainAsset.metadata.isMintable,
              lastUpdateDigest: onChainAsset.metadata.lastUpdateDigest,
              name: onChainAsset.metadata.name,
              nodeId: onChainAsset.metadata.nodeId,
              owner: onChainAsset.metadata.owner,
              status: onChainAsset.metadata.status as 'Liquid' | 'Frozen' | 'Locked',
              symbol: onChainAsset.metadata.symbol,
              updatedAtTimestampMs: onChainAsset.metadata.updatedAtTimestampMs
            }
          : undefined
      };

      return enriched;
    });
  }, [registryData, assetsState.assetInfos]);

  return {
    data: enrichedAssets,
    isLoading: isRegistryLoading,
    registryAssets: registryData?.data || [],
    totalCount: enrichedAssets.length
  };
}

/**
 * Hook to convert registry assets to AssetInfo format
 * This provides backward compatibility with existing code
 *
 * @example
 * const { data: assetInfos } = useRegistryAsAssetInfo();
 */
export function useRegistryAsAssetInfo(options: UseRegistryAssetsOptions = {}) {
  const { status = 'live', enabled = true } = options;
  const { data: enrichedAssets, isLoading } = useEnrichedAssets({ status, enabled });

  const assetInfos = useMemo<AssetInfo[]>(() => {
    return enrichedAssets.map((asset) => {
      // Use on-chain metadata if available, fallback to registry
      const metadata = asset.onChainMetadata || asset.metadata;

      return {
        assetId: asset.metadata.assetId,
        balance: asset.balance || '0',
        metadata: {
          assetId: asset.metadata.assetId,
          assetType: asset.metadata.assetType,
          name: metadata.name,
          symbol: metadata.symbol,
          description: metadata.description,
          decimals: metadata.decimals,
          // Priority: logo_URIs > metadata.iconUrl
          iconUrl:
            asset.asset.logo_URIs?.svg ||
            asset.asset.logo_URIs?.png ||
            asset.asset.logo_URIs?.jpg ||
            metadata.iconUrl ||
            '/registry/sui/images/sui.svg',
          owner: asset.metadata.owner,
          status: asset.metadata.status,
          isMintable: asset.metadata.isMintable,
          isBurnable: asset.metadata.isBurnable,
          isFreezable: asset.metadata.isFreezable,
          isDeleted: asset.metadata.isDeleted,
          createdAtTimestampMs: asset.metadata.createdAtTimestampMs,
          updatedAtTimestampMs: asset.metadata.updatedAtTimestampMs,
          lastUpdateDigest: asset.metadata.lastUpdateDigest,
          nodeId: asset.metadata.nodeId
        }
      };
    });
  }, [enrichedAssets]);

  return {
    data: assetInfos,
    isLoading,
    totalCount: assetInfos.length
  };
}

/**
 * Helper function to format balance
 */
function formatBalance(balance: string, decimals: number): string {
  try {
    const numBalance = Number(balance);
    if (isNaN(numBalance)) return '0';

    const formattedBalance = numBalance / Math.pow(10, decimals);
    if (isNaN(formattedBalance)) return '0';

    return formattedBalance.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    });
  } catch (e) {
    console.error('Error formatting balance:', e);
    return '0';
  }
}
