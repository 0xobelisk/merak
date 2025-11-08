'use client';

import { RefreshCw, ArrowRight } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { Button } from '@repo/ui/components/ui/button';
import { useMerak } from '@/app/jotai/merak';
import { useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useEnrichedAssets } from '@/app/hooks/useRegistryAssets';
import { getLogoUrl } from '@/app/types/registry';
import { useUserLpAssets } from '@/app/hooks/useUserAssets';
import { useBatchAssetMetadata } from '@/app/hooks/useAssetMetadata';
import { useQuery } from '@tanstack/react-query';

export default function PositionsList() {
  const merak = useMerak();
  const account = useCurrentAccount();
  const router = useRouter();

  // Use React Query hook for LP assets
  const { data: lpAssetsData, isLoading: isLoadingLpAssets } = useUserLpAssets({ first: 50 });

  // Get registry assets for local logos
  const { data: enrichedAssets } = useEnrichedAssets({ status: 'live' });

  // Helper function to get logo from registry or fallback to provided URL
  const getTokenLogo = useCallback(
    (assetId: string, fallbackUrl: string) => {
      const registryAsset = enrichedAssets.find((asset) => asset.metadata.assetId === assetId);
      return registryAsset ? getLogoUrl(registryAsset) : fallbackUrl;
    },
    [enrichedAssets]
  );

  // Fetch pool info for all LP assets to extract asset IDs
  const { data: poolInfoList = [] } = useQuery({
    queryKey: ['lpPoolsInfo', lpAssetsData?.data],
    queryFn: async () => {
      if (!merak || !lpAssetsData?.data || lpAssetsData.data.length === 0) {
        return [];
      }

      const poolInfoPromises = lpAssetsData.data.map(async (lpAsset) => {
        try {
          const poolInfo = await merak.storage.list.assetPool({
            poolAssetId: lpAsset.assetId,
            first: 1
          });

          if (!poolInfo || poolInfo.edges.length === 0) {
            return null;
          }

          return {
            lpAssetId: lpAsset.assetId,
            lpBalance: lpAsset.balance,
            lpMetadata: lpAsset.metadata,
            pool: poolInfo.edges[0].node
          };
        } catch (error) {
          console.error(`Error fetching pool for LP asset ${lpAsset.assetId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(poolInfoPromises);
      return results.filter((item): item is NonNullable<typeof item> => item !== null);
    },
    enabled: !!merak && !!lpAssetsData?.data && lpAssetsData.data.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000
  });

  // Extract all unique asset IDs for batch metadata fetching
  const assetIds = useMemo(() => {
    const ids = new Set<string>();
    poolInfoList.forEach((poolInfo) => {
      ids.add(poolInfo.pool.asset0);
      ids.add(poolInfo.pool.asset1);
    });
    return Array.from(ids);
  }, [poolInfoList]);

  // Batch fetch metadata with React Query caching
  const { data: metadataMap } = useBatchAssetMetadata(assetIds, assetIds.length > 0);

  type PositionType = {
    lpAssetId: string;
    lpBalance: string;
    lpSymbol: string;
    asset1Id: string;
    asset2Id: string;
    asset1Symbol: string;
    asset2Symbol: string;
    asset1Image: string;
    asset2Image: string;
    poolLiquidity: string;
    sharePercentage: string;
    reserve0: string;
    reserve1: string;
  };

  // Build positions using cached metadata
  const { data: positions = [], refetch: refetchPositions } = useQuery({
    queryKey: ['positions', poolInfoList, metadataMap],
    queryFn: async () => {
      if (!merak || !metadataMap || poolInfoList.length === 0) {
        return [];
      }

      try {
        const positionsData = await Promise.all(
          poolInfoList.map(async (poolInfo) => {
            try {
              const { pool, lpAssetId, lpBalance, lpMetadata } = poolInfo;

              // Get metadata from cached map
              const asset1Metadata = metadataMap.get(pool.asset0);
              const asset2Metadata = metadataMap.get(pool.asset1);

              if (!asset1Metadata || !asset2Metadata) {
                console.log('Missing metadata for pool assets');
                return null;
              }

              // Calculate share percentage
              const lpBalanceBigInt = BigInt(lpBalance || '0');
              const totalSupply = await merak.supplyOf(lpAssetId);
              const sharePercentage =
                totalSupply && BigInt(totalSupply.supply) > 0n
                  ? ((Number(lpBalanceBigInt) / Number(BigInt(totalSupply.supply))) * 100).toFixed(
                      4
                    )
                  : '0';

              // Format liquidity
              const reserve0Formatted = (
                Number(pool.reserve0) / Math.pow(10, asset1Metadata.decimals)
              ).toFixed(4);
              const reserve1Formatted = (
                Number(pool.reserve1) / Math.pow(10, asset2Metadata.decimals)
              ).toFixed(4);

              return {
                lpAssetId,
                lpBalance: (Number(lpBalance || '0') / Math.pow(10, lpMetadata.decimals)).toFixed(
                  9
                ),
                lpSymbol: lpMetadata.symbol || 'LP',
                asset1Id: pool.asset0,
                asset2Id: pool.asset1,
                asset1Symbol: asset1Metadata.symbol || 'Unknown',
                asset2Symbol: asset2Metadata.symbol || 'Unknown',
                asset1Image: asset1Metadata.iconUrl || '/registry/sui/images/sui.svg',
                asset2Image: asset2Metadata.iconUrl || '/registry/sui/images/sui.svg',
                poolLiquidity: `${reserve0Formatted} / ${reserve1Formatted}`,
                sharePercentage,
                reserve0: pool.reserve0,
                reserve1: pool.reserve1
              } as PositionType;
            } catch (error) {
              console.error(`Error processing position:`, error);
              return null;
            }
          })
        );

        return positionsData.filter((position): position is PositionType => position !== null);
      } catch (error) {
        console.error('Failed to build positions:', error);
        return [];
      }
    },
    enabled: !!merak && !!metadataMap && poolInfoList.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true
  });

  const handleRemoveLiquidity = (position: PositionType) => {
    const queryParams = new URLSearchParams();
    queryParams.append('asset1', position.asset1Id);
    queryParams.append('asset2', position.asset2Id);
    queryParams.append('lpTokenId', position.lpAssetId);
    router.push(`/pool/remove?${queryParams.toString()}`);
  };

  if (!account?.address) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Please connect your wallet to view your positions</p>
        </div>
      </div>
    );
  }

  // Determine if we're still loading
  const isProcessing = isLoadingLpAssets || (!metadataMap && poolInfoList.length > 0);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Positions</h1>
          <p className="text-gray-500 mt-2">Manage your liquidity positions</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchPositions()}
          disabled={isProcessing}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Loading State */}
      {isProcessing && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isProcessing && positions.length === 0 && (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">You don't have any liquidity positions yet</p>
          <Button onClick={() => router.push('/pool')}>Browse Pools</Button>
        </div>
      )}

      {/* Positions List */}
      {!isProcessing && positions.length > 0 && (
        <div className="space-y-4">
          {positions.map((position, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                {/* Left: Token Pair Info */}
                <div className="flex items-center space-x-4 flex-1">
                  {/* Token Icons */}
                  <div className="flex items-center -space-x-2">
                    <img
                      src={getTokenLogo(position.asset1Id, position.asset1Image)}
                      alt={position.asset1Symbol}
                      className="w-10 h-10 rounded-full border-2 border-white"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                      }}
                    />
                    <img
                      src={getTokenLogo(position.asset2Id, position.asset2Image)}
                      alt={position.asset2Symbol}
                      className="w-10 h-10 rounded-full border-2 border-white"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                      }}
                    />
                  </div>

                  {/* Token Names */}
                  <div>
                    <h3 className="text-lg font-semibold">
                      {position.asset1Symbol} / {position.asset2Symbol}
                    </h3>
                    <p className="text-sm text-gray-500">LP Balance: {position.lpBalance}</p>
                  </div>
                </div>

                {/* Middle: Pool Stats */}
                <div className="flex space-x-8 flex-1 justify-center">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Pool Liquidity</p>
                    <p className="text-sm font-medium">{position.poolLiquidity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Your Share</p>
                    <p className="text-sm font-medium">{position.sharePercentage}%</p>
                  </div>
                </div>

                {/* Right: Action Button */}
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleRemoveLiquidity(position)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Remove Liquidity
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
