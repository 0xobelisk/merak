'use client';

import { RefreshCw, ArrowRight, Wallet, TrendingUp, Droplets } from 'lucide-react';
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
import RemoveLiquidityModal from '@/app/components/pool/remove-liquidity-modal';

export default function PositionsList() {
  const merak = useMerak();
  const account = useCurrentAccount();
  const router = useRouter();
  const [isRemoveLiquidityModalOpen, setIsRemoveLiquidityModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{
    asset1Id: string;
    asset2Id: string;
    lpTokenId: string;
  } | null>(null);

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
  const { data: poolInfoList = [], isLoading: isLoadingPoolInfo } = useQuery({
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
  const { data: metadataMap, isLoading: isLoadingMetadata } = useBatchAssetMetadata(
    assetIds,
    assetIds.length > 0
  );

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
  const {
    data: positions = [],
    refetch: refetchPositions,
    isLoading: isLoadingPositions
  } = useQuery({
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
    setSelectedPosition({
      asset1Id: position.asset1Id,
      asset2Id: position.asset2Id,
      lpTokenId: position.lpAssetId
    });
    setIsRemoveLiquidityModalOpen(true);
  };

  if (!account?.address) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-sui-blue-50 rounded-full p-4">
              <Wallet className="h-12 w-12 text-sui-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-500">
            Please connect your wallet to view your liquidity positions
          </p>
        </div>
      </div>
    );
  }

  // Determine if we're still loading - include all loading states
  // If LP assets are loaded and empty, we know user has no positions
  const hasNoLpAssets = !isLoadingLpAssets && lpAssetsData?.data?.length === 0;
  const isProcessing =
    isLoadingLpAssets || isLoadingPoolInfo || isLoadingMetadata || isLoadingPositions;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Positions</h1>
          <p className="text-gray-500 mt-2 flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Manage your liquidity positions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchPositions()}
          disabled={isProcessing}
          className="flex items-center space-x-2 hover:bg-gray-50 transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Loading State */}
      {isProcessing && !hasNoLpAssets && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center -space-x-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <div className="flex gap-8 flex-1 justify-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <Skeleton className="h-10 w-40 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State with Better Design */}
      {!isProcessing && (hasNoLpAssets || positions.length === 0) && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-full p-6 shadow-md">
              <TrendingUp className="h-16 w-16 text-gray-400" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Positions Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You don't have any liquidity positions. Start providing liquidity to earn trading fees!
          </p>
          <Button
            onClick={() => router.push('/pool')}
            className="bg-gradient-to-r from-sui-blue-600 to-sui-blue-700 hover:from-sui-blue-700 hover:to-sui-blue-800 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Browse Pools
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Positions List with Enhanced Design */}
      {!isProcessing && positions.length > 0 && (
        <div className="space-y-4">
          {/* <div className="bg-gradient-to-r from-sui-blue-50 to-sui-blue-100 rounded-xl p-4 border border-sui-blue-200">
            <div className="flex items-center gap-2 text-sm text-sui-blue-800">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">
                You have {positions.length} active position{positions.length > 1 ? 's' : ''}
              </span>
            </div>
          </div> */}

          {positions.map((position, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-6">
                {/* Left: Token Pair Info */}
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* Token Icons with Enhanced Style */}
                  <div className="flex items-center -space-x-3">
                    <div className="relative">
                      <img
                        src={getTokenLogo(position.asset1Id, position.asset1Image)}
                        alt={position.asset1Symbol}
                        className="w-12 h-12 rounded-full border-3 border-white shadow-md"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                        }}
                      />
                    </div>
                    <div className="relative">
                      <img
                        src={getTokenLogo(position.asset2Id, position.asset2Image)}
                        alt={position.asset2Symbol}
                        className="w-12 h-12 rounded-full border-3 border-white shadow-md"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                        }}
                      />
                    </div>
                  </div>

                  {/* Token Names and Balance */}
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {position.asset1Symbol} / {position.asset2Symbol}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <span className="font-medium">LP Balance:</span>
                      <span className="text-gray-900">{position.lpBalance}</span>
                    </p>
                  </div>
                </div>

                {/* Middle: Pool Stats with Better Layout */}
                <div className="flex gap-8 flex-1 justify-center">
                  <div className="bg-gray-50 rounded-xl px-4 py-3 min-w-[140px]">
                    <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                      Pool Liquidity
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{position.poolLiquidity}</p>
                  </div>
                  <div className="bg-sui-blue-50 rounded-xl px-4 py-3 min-w-[100px]">
                    <p className="text-xs font-medium text-sui-blue-600 mb-1 uppercase tracking-wide">
                      Your Share
                    </p>
                    <p className="text-sm font-semibold text-sui-blue-700">
                      {position.sharePercentage}%
                    </p>
                  </div>
                </div>

                {/* Right: Action Button with Sui Blue Color */}
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleRemoveLiquidity(position)}
                    className="bg-gradient-to-r from-sui-blue-600 to-sui-blue-700 hover:from-sui-blue-700 hover:to-sui-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2.5 rounded-xl"
                  >
                    <span className="font-medium">Manage Position</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Remove Liquidity Modal */}
      <RemoveLiquidityModal
        isOpen={isRemoveLiquidityModalOpen}
        onClose={() => {
          setIsRemoveLiquidityModalOpen(false);
          setSelectedPosition(null);
          refetchPositions();
        }}
        asset1Id={selectedPosition?.asset1Id}
        asset2Id={selectedPosition?.asset2Id}
        lpTokenId={selectedPosition?.lpTokenId}
      />
    </div>
  );
}
