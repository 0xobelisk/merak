'use client';

import { Search, RefreshCw, Grid, List, TrendingUp, Droplets } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { Button } from '@repo/ui/components/ui/button';
import { useEnrichedAssets } from '@/app/hooks/useRegistryAssets';
import { getLogoUrl } from '@/app/types/registry';
import { usePools } from '@/app/hooks/usePools';
import { PoolInfo } from '@0xobelisk/merak-sdk';
import AddLiquidityModal from '@/app/components/pool/add-liquidity-modal';

export default function LiquidityPools() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPools, setFilteredPools] = useState<PoolInfo[]>([]);
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Default');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [isAddLiquidityModalOpen, setIsAddLiquidityModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<{ asset1: string; asset2: string } | null>(null);

  // Use React Query hook for pools data with automatic caching
  const { data: pools = [], isLoading, refetch: refetchPools } = usePools({ pageSize: 3 });

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

  const categories = [
    'All',
    'Rewards',
    'Stablecoin',
    'MEME coin',
    'LST',
    'High APR',
    'Low Risk',
    'New Pools'
  ];

  const sortOptions = [
    'Default',
    'Volume',
    'Liquidity',
    'APR',
    'Fee Tier',
    'Newest',
    'Rewards',
    '24h Change'
  ];

  // Filter pools based on search term
  useEffect(() => {
    if (pools.length > 0) {
      const filtered = pools.filter((pool) =>
        pool.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPools(filtered);
    } else {
      setFilteredPools([]);
    }
  }, [searchTerm, pools]);

  const handleViewModeChange = () => {
    setViewMode((prevMode) => (prevMode === 'card' ? 'table' : 'card'));
  };

  // Helper function to format numbers
  const formatLiquidity = (value: string) => {
    // Check if contains "/"
    if (value.includes('/')) {
      // Split and format each part
      const parts = value.split('/').map((part) => {
        const num = parseFloat(part.trim());
        return isNaN(num) ? '0' : num.toString();
      });
      return `${parts[0]} / ${parts[1]}`;
    }

    // Check if contains ":"
    if (value.includes(':')) {
      // Split and format each part
      const parts = value.split(':').map((part) => {
        const num = parseFloat(part.trim());
        return isNaN(num) ? '0' : num.toString();
      });
      return `${parts[0]}:${parts[1]}`;
    }

    // If there's no separator, return formatted number
    const num = parseFloat(value.replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? '0' : num.toString();
  };

  // Add a helper function to format numbers
  const formatNumber = (value: string) => {
    // Remove all non-numeric characters (except for decimal point)
    const num = parseFloat(value.replace(/[^0-9.-]+/g, ''));
    // Round to nearest integer
    return isNaN(num) ? '0' : Math.round(num).toLocaleString();
  };

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredPools.map((pool, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-all cursor-pointer border border-gray-100"
          onClick={() => {
            setSelectedPool({ asset1: pool.asset1Id, asset2: pool.asset2Id });
            setIsAddLiquidityModalOpen(true);
          }}
        >
          {/* Token Pair Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center -space-x-2">
              <img
                src={getTokenLogo(pool.asset1Id, pool.token1Image)}
                alt={pool.name.split(' / ')[0]}
                className="w-10 h-10 rounded-full border-2 border-white"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                }}
              />
              <img
                src={getTokenLogo(pool.asset2Id, pool.token2Image)}
                alt={pool.name.split(' / ')[1]}
                className="w-10 h-10 rounded-full border-2 border-white"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{pool.name}</h3>
              <p className="text-xs text-gray-500">Fee: {pool.feeTier}</p>
            </div>
          </div>

          {/* Pool Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center">
                <Droplets className="w-4 h-4 mr-1" />
                Liquidity
              </span>
              <span className="text-sm font-medium text-gray-900">
                {formatLiquidity(pool.liquidity)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                24h Volume
              </span>
              <span className="text-sm font-medium text-gray-900">{formatNumber(pool.volume)}</span>
            </div>
          </div>

          {/* Add Liquidity Hint */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-center text-indigo-600 font-medium">
              Click to add liquidity
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pool
              </th>
              <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Liquidity
              </th>
              <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                24h Volume
              </th>
              <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fee Tier
              </th>
              <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredPools.map((pool, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center -space-x-2">
                      <img
                        src={getTokenLogo(pool.asset1Id, pool.token1Image)}
                        alt={pool.name.split(' / ')[0]}
                        className="w-8 h-8 rounded-full border-2 border-white"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                        }}
                      />
                      <img
                        src={getTokenLogo(pool.asset2Id, pool.token2Image)}
                        alt={pool.name.split(' / ')[1]}
                        className="w-8 h-8 rounded-full border-2 border-white"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                        }}
                      />
                    </div>
                    <span className="font-medium text-gray-900">{pool.name}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-right text-sm text-gray-900">
                  {formatLiquidity(pool.liquidity)}
                </td>
                <td className="py-4 px-6 text-right text-sm text-gray-900">
                  {formatNumber(pool.volume)}
                </td>
                <td className="py-4 px-6 text-right text-sm text-gray-900">{pool.feeTier}</td>
                <td className="py-4 px-6 text-right">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedPool({ asset1: pool.asset1Id, asset2: pool.asset2Id });
                      setIsAddLiquidityModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Liquidity
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            {/* Token pair skeleton */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full -ml-2" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            {/* APR skeleton */}
            <div className="text-right space-y-2">
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-6 w-20 ml-auto" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>

          {/* Button skeleton */}
          <div className="mt-4">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Liquidity Pools</h1>
          <p className="text-gray-500 mt-2">Earn fees and rewards by providing liquidity</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewModeChange}
            className="flex items-center space-x-2"
          >
            {viewMode === 'card' ? (
              <>
                <List className="h-4 w-4" />
                <span>Table View</span>
              </>
            ) : (
              <>
                <Grid className="h-4 w-4" />
                <span>Card View</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchPools()}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#4DA2FF] to-sui-blue-700 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#C0E6FF] text-sm mb-1 font-medium">Total Value Locked</p>
              <p className="text-3xl font-bold text-white">$13.48M</p>
            </div>
            <Droplets className="h-12 w-12 text-[#C0E6FF] opacity-60" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#4DA2FF] to-sui-blue-600 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#C0E6FF] text-sm mb-1 font-medium">24h Volume</p>
              <p className="text-3xl font-bold text-white">$9.49M</p>
            </div>
            <TrendingUp className="h-12 w-12 text-[#C0E6FF] opacity-60" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search pools by token name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {sortOptions.map((sort) => (
              <option key={sort} value={sort}>
                Sort: {sort}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && renderSkeleton()}

      {/* Empty State */}
      {!isLoading && filteredPools.length === 0 && (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <Droplets className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No pools found</p>
          <p className="text-gray-400 text-sm">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Check back later for available pools'}
          </p>
        </div>
      )}

      {/* Pools List */}
      {!isLoading && filteredPools.length > 0 && (
        <div>{viewMode === 'card' ? renderCardView() : renderTableView()}</div>
      )}

      {/* Add Liquidity Modal */}
      <AddLiquidityModal
        isOpen={isAddLiquidityModalOpen}
        onClose={() => {
          setIsAddLiquidityModalOpen(false);
          setSelectedPool(null);
          refetchPools();
        }}
        initialAsset1={selectedPool?.asset1}
        initialAsset2={selectedPool?.asset2}
      />
    </div>
  );
}
