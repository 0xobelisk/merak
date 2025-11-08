'use client';

import { RefreshCw, ArrowRight } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { Button } from '@repo/ui/components/ui/button';
import { useMerak } from '@/app/jotai/merak';
import { useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useEnrichedAssets } from '@/app/hooks/useRegistryAssets';
import { getLogoUrl } from '@/app/types/registry';

export default function PositionsList() {
  const merak = useMerak();
  const account = useCurrentAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [positions, setPositions] = useState<PositionType[]>([]);
  const router = useRouter();

  // Get registry assets for local logos
  const { data: enrichedAssets } = useEnrichedAssets({ status: 'live' });

  // Helper function to get logo from registry or fallback to provided URL
  const getTokenLogo = useCallback(
    (assetId: string, fallbackUrl: string) => {
      const registryAsset = enrichedAssets.find(
        (asset) => asset.metadata.assetId === assetId
      );
      return registryAsset ? getLogoUrl(registryAsset) : fallbackUrl;
    },
    [enrichedAssets]
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

  const fetchPositions = useCallback(async () => {
    if (!merak || !account?.address) return;
    setIsLoading(true);

    try {
      // Get all LP tokens owned by user
      const lpAssets = await merak.listAccountLpAssets({
        account: account.address,
        first: 50
      });

      console.log('LP Assets:', lpAssets);

      // For each LP token, get pool details
      const positionsData = await Promise.all(
        lpAssets.data.map(async (lpAsset) => {
          try {
            // Query pool info using LP asset ID
            const poolInfo = await merak.storage.list.assetPool({
              poolAssetId: lpAsset.assetId,
              first: 1
            });

            if (!poolInfo || poolInfo.edges.length === 0) {
              console.log(`No pool found for LP asset ${lpAsset.assetId}`);
              return null;
            }

            const pool = poolInfo.edges[0].node;

            // Get metadata for both tokens in the pool
            const [asset1Metadata, asset2Metadata] = await Promise.all([
              merak.getMetadata(pool.asset0),
              merak.getMetadata(pool.asset1)
            ]);

            if (!asset1Metadata || !asset2Metadata) {
              console.log('Missing metadata for pool assets');
              return null;
            }

            // Calculate share percentage
            const lpBalance = BigInt(lpAsset.balance || '0');
            const totalSupply = await merak.supplyOf(lpAsset.assetId);
            const sharePercentage =
              totalSupply && totalSupply > 0n
                ? ((Number(lpBalance) / Number(totalSupply)) * 100).toFixed(4)
                : '0';

            // Format liquidity (sum of reserves in their respective decimals)
            const reserve0Formatted = (
              Number(pool.reserve0) / Math.pow(10, asset1Metadata.decimals)
            ).toFixed(4);
            const reserve1Formatted = (
              Number(pool.reserve1) / Math.pow(10, asset2Metadata.decimals)
            ).toFixed(4);

            return {
              lpAssetId: lpAsset.assetId,
              lpBalance: (
                Number(lpAsset.balance || '0') / Math.pow(10, lpAsset.metadata.decimals)
              ).toFixed(9),
              lpSymbol: lpAsset.metadata.symbol || 'LP',
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
            console.error(`Error processing LP asset ${lpAsset.assetId}:`, error);
            return null;
          }
        })
      );

      // Filter out null values
      const validPositions = positionsData.filter(
        (position): position is PositionType => position !== null
      );
      setPositions(validPositions);
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [merak, account?.address]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

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
          onClick={fetchPositions}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && positions.length === 0 && (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">You don't have any liquidity positions yet</p>
          <Button onClick={() => router.push('/pool')}>Browse Pools</Button>
        </div>
      )}

      {/* Positions List */}
      {!isLoading && positions.length > 0 && (
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

