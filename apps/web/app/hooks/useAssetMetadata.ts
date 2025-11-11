'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  AssetMetadata,
  AssetWrapper,
  SingleAssetMetadataResponse,
  AssetMetadataListResponse,
  AssetWrapperListResponse,
  SingleAssetWrapperResponse
} from '@/app/types/assets';

interface SingleAssetMetadataParams {
  assetId: string;
  enabled?: boolean;
}

interface SingleAssetWrapperParams {
  coinType?: string;
  assetId?: string;
  enabled?: boolean;
}

/**
 * Hook to fetch single asset metadata with server-side caching
 * Uses storage.get for optimized single asset query
 * Data is cached on the server and revalidated every 60 seconds
 */
export function useAssetMetadata({ assetId, enabled = true }: SingleAssetMetadataParams) {
  return useQuery<SingleAssetMetadataResponse>({
    queryKey: ['assetMetadata', assetId],
    queryFn: async () => {
      const response = await fetch(`/api/assets/metadata/${assetId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch asset metadata');
      }
      return response.json();
    },
    enabled,
    staleTime: 60 * 1000, // Consider data fresh for 60 seconds
    refetchOnWindowFocus: false
  });
}

/**
 * Hook to fetch all asset metadata with server-side caching
 * Uses storage.list for multiple assets query
 * Data is cached on the server and revalidated every 60 seconds
 *
 * @example
 * const { data } = useAllAssetMetadata();
 * console.log(`Total: ${data?.totalCount} assets`);
 */
export function useAllAssetMetadata(enabled: boolean = true) {
  return useQuery<AssetMetadataListResponse>({
    queryKey: ['allAssetMetadata'],
    queryFn: async () => {
      const response = await fetch('/api/assets/metadata');
      if (!response.ok) {
        throw new Error('Failed to fetch all asset metadata');
      }
      return response.json();
    },
    enabled,
    staleTime: 60 * 1000, // Consider data fresh for 60 seconds
    refetchOnWindowFocus: false
  });
}

/**
 * Hook to fetch single asset wrapper by coinType or assetId
 * Uses storage.get for optimized single wrapper query by coinType
 * Uses storage.list with assetId parameter for assetId query
 * Data is cached on the server and revalidated every 60 seconds
 *
 * @example
 * // By coinType (default, recommended)
 * const { data } = useAssetWrapper({ coinType: '0x2::sui::SUI' });
 *
 * // By assetId
 * const { data } = useAssetWrapper({ assetId: '0' });
 */
export function useAssetWrapper({ coinType, assetId, enabled = true }: SingleAssetWrapperParams) {
  // Determine id and type from parameters
  const id = coinType || assetId;
  const type = coinType ? 'coinType' : 'assetId';
  const hasParams = !!(coinType || assetId);

  return useQuery<SingleAssetWrapperResponse>({
    queryKey: ['assetWrapper', id, type],
    queryFn: async () => {
      const url = `/api/assets/wrapper/${id}?type=${type}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch asset wrapper');
      }
      return response.json();
    },
    enabled: enabled && hasParams,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false
  });
}

/**
 * Hook to fetch all asset wrappers with server-side caching
 * Uses storage.list for asset wrapper query
 * Data is cached on the server and revalidated every 60 seconds
 *
 * @example
 * const { data } = useAssetWrappers();
 * console.log(`Total: ${data?.totalCount} wrappers`);
 */
export function useAssetWrappers(enabled: boolean = true) {
  return useQuery<AssetWrapperListResponse>({
    queryKey: ['assetWrappers'],
    queryFn: async () => {
      const response = await fetch('/api/assets/wrapper');
      if (!response.ok) {
        throw new Error('Failed to fetch asset wrappers');
      }
      return response.json();
    },
    enabled,
    staleTime: 60 * 1000, // Consider data fresh for 60 seconds
    refetchOnWindowFocus: false
  });
}

/**
 * Hook to fetch metadata for multiple assets in batch (concurrent)
 * Uses React Query's built-in caching to dedupe requests
 * Each asset's metadata is cached individually, allowing efficient reuse
 *
 * @example
 * const { data, isLoading } = useBatchAssetMetadata(['0', '1', '2']);
 */
export function useBatchAssetMetadata(assetIds: string[], enabled: boolean = true) {
  return useQuery({
    queryKey: ['batchAssetMetadata', ...assetIds.sort()],
    queryFn: async () => {
      // Fetch all metadata concurrently
      // React Query will dedupe any individual requests that are already cached
      const results = await Promise.all(
        assetIds.map(async (assetId) => {
          try {
            const response = await fetch(`/api/assets/metadata/${assetId}`);
            if (!response.ok) {
              console.warn(`Failed to fetch metadata for asset ${assetId}`);
              return null;
            }
            const data: SingleAssetMetadataResponse = await response.json();
            return { assetId, metadata: data.data };
          } catch (error) {
            console.error(`Error fetching metadata for asset ${assetId}:`, error);
            return null;
          }
        })
      );

      // Filter out failed requests and create a map
      const metadataMap = new Map<string, AssetMetadata>();
      results.forEach((result) => {
        if (result && result.metadata) {
          metadataMap.set(result.assetId, result.metadata);
        }
      });

      return metadataMap;
    },
    enabled: enabled && assetIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });
}
