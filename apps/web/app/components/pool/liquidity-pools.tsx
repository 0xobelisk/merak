'use client';

import { Search, ChevronDown, RefreshCw, Grid, List, Info } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import TokenCreate from '@/app/components/pool/create/token-create';
import LiquidityPoolSetup from '@/app/components/pool/create/liquidity-pool-setup';
import { Dialog, DialogContent } from '@repo/ui/components/ui/dialog';
import { SelectedPoolTokens } from '@/app/jotai/pool/pool';
import { useAtom } from 'jotai';
import { initMerakClient } from '@/app/jotai/merak';
import { useRouter } from 'next/navigation';

export default function LiquidityPools() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPools, setFilteredPools] = useState<PoolType[]>([]);
  const [pools, setPools] = useState<PoolType[]>([]);
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Default');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'setup'>('select');
  const [selectedTokens, setSelectedTokens] = useAtom(SelectedPoolTokens);
  const router = useRouter();

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

  type PoolType = {
    name: string;
    asset1Id: number;
    asset2Id: number;
    lpAssetId: number;
    apr: string;
    liquidity: string;
    volume: string;
    feeTier: string;
    token1Image: string;
    token2Image: string;
  };

  const queryPoolList = async () => {
    const merak = initMerakClient();
    try {
      const poolList = await merak.listPoolsInfo({
        pageSize: 5
      });

      setPools(poolList);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPools = useCallback(async () => {
    setIsLoading(true);

    try {
      await queryPoolList();
    } catch (error) {
      console.error('Failed to fetch pools:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  useEffect(() => {
    if (pools.length > 0) {
      const filtered = pools.filter((pool) =>
        pool.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPools(filtered);
    }
  }, [searchTerm, pools]);

  const handleViewModeChange = () => {
    setViewMode((prevMode) => (prevMode === 'card' ? 'table' : 'card'));
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setCurrentStep('select');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentStep('select');
  };

  const handleSelectTokens = (base: any, quote: any) => {
    setSelectedTokens({ base, quote });
    setCurrentStep('setup');
  };

  const handleBackToSelect = () => {
    setCurrentStep('select');
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredPools.map((pool, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow">
          {/* Token Pair Header */}
          <div className="flex items-center space-x-2 mb-4">
            <img
              src={pool.token1Image}
              alt={pool.name.split(' / ')[0]}
              width={24}
              height={24}
              className="rounded-full"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/sui-logo.svg';
              }}
            />
            <img
              src={pool.token2Image}
              alt={pool.name.split(' / ')[1]}
              width={24}
              height={24}
              className="rounded-full"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/sui-logo.svg';
              }}
            />
            <span className="font-medium text-gray-900">{pool.name}</span>
          </div>

          {/* Pool Details */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Liquidity</span>
              <span className="text-gray-900">{formatLiquidity(pool.liquidity)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">24h Volume</span>
              <span className="text-gray-900">{formatNumber(pool.volume)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Fee Tier</span>
              <span className="text-gray-900">{pool.feeTier}</span>
            </div>
          </div>

          {/* Add Liquidity Button */}
          <button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded transition-colors"
            onClick={() => {
              const queryParams = new URLSearchParams();
              queryParams.append('asset1', pool.asset1Id.toString());
              queryParams.append('asset2', pool.asset2Id.toString());
              queryParams.append('lpAssetId', pool.lpAssetId.toString());
              router.push(`/pool/liquidity?${queryParams.toString()}`);
            }}
          >
            Add Liquidity
          </button>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-3 px-4 text-gray-600 font-medium">Pool</th>
            <th className="py-3 px-4 text-gray-600 font-medium text-right">Liquidity</th>
            <th className="py-3 px-4 text-gray-600 font-medium text-right">24h Volume</th>
            <th className="py-3 px-4 text-gray-600 font-medium text-right">Fee Tier</th>
            <th className="py-3 px-4 text-gray-600 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredPools.map((pool, index) => (
            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-4 px-4">
                <div className="flex items-center space-x-2">
                  <img
                    src={pool.token1Image}
                    alt={pool.name.split(' / ')[0]}
                    width={20}
                    height={20}
                    className="rounded-full"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/sui-logo.svg';
                    }}
                  />
                  <img
                    src={pool.token2Image}
                    alt={pool.name.split(' / ')[1]}
                    width={20}
                    height={20}
                    className="rounded-full"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/sui-logo.svg';
                    }}
                  />
                  <span className="font-medium text-gray-900">{pool.name}</span>
                </div>
              </td>
              <td className="py-4 px-4 text-right text-gray-900">
                {formatLiquidity(pool.liquidity)}
              </td>
              <td className="py-4 px-4 text-right text-gray-900">{formatNumber(pool.volume)}</td>
              <td className="py-4 px-4 text-right text-gray-900">{pool.feeTier}</td>
              <td className="py-4 px-4 text-right">
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  onClick={() => {
                    const queryParams = new URLSearchParams();
                    queryParams.append('asset1', pool.asset1Id.toString());
                    queryParams.append('asset2', pool.asset2Id.toString());
                    queryParams.append('token1Name', pool.name.split(' / ')[0]);
                    queryParams.append('token2Name', pool.name.split(' / ')[1]);
                    queryParams.append('token1Image', pool.token1Image);
                    queryParams.append('token2Image', pool.token2Image);
                    router.push(`/pool/liquidity?${queryParams.toString()}`);
                  }}
                >
                  Add Liquidity
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSkeleton = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex flex-wrap gap-4 mb-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array(8)
          .fill(0)
          .map((_, index) => (
            <Skeleton key={index} className="h-64 w-full" />
          ))}
      </div>
    </>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br  via-pink-100 to-purple-100 p-4">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Earn Fees and Rewards by Providing Liquidity
          </h1>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded" onClick={handleOpenModal}>
            + Create a Pool
          </button>
        </div>

        <div className="flex space-x-4 mb-8 overflow-x-auto">
          <button className="text-indigo-600 border-b-2 border-indigo-600 pb-2 whitespace-nowrap">
            Concentrated Liquidity Pools
          </button>
        </div>

        {isLoading ? (
          renderSkeleton()
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-4 rounded shadow">
                <div className="text-gray-600 mb-2">Total Value Locked</div>
                <div className="text-2xl font-bold text-gray-800">$ 13,482,691</div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-gray-600 mb-2">Volume (24H)</div>
                <div className="text-2xl font-bold text-gray-800">$ 9,488,068</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-8">
              <input
                type="text"
                placeholder="Input coin symbol"
                className="bg-white p-2 rounded border border-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="bg-white p-2 rounded border border-gray-300"
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
                className="bg-white p-2 rounded border border-gray-300"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {sortOptions.map((sort) => (
                  <option key={sort} value={sort}>
                    {sort}
                  </option>
                ))}
              </select>
              <button
                className={`bg-white p-2 rounded border border-gray-300 transition-all duration-200 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
                onClick={fetchPools}
                disabled={isLoading}
              >
                <RefreshCw
                  size={20}
                  className={`text-gray-600 ${isLoading ? 'animate-spin' : ''}`}
                />
              </button>
              <button
                className="bg-white p-2 rounded border border-gray-300"
                onClick={handleViewModeChange}
              >
                {viewMode === 'card' ? (
                  <List size={20} className="text-gray-600" />
                ) : (
                  <Grid size={20} className="text-gray-600" />
                )}
              </button>
            </div>

            <div className="h-[calc(100vh-300px)] overflow-y-auto">
              {viewMode === 'card' ? renderCardView() : renderTableView()}
            </div>
          </>
        )}
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {currentStep === 'select' ? (
            <TokenCreate onClose={handleCloseModal} onSelectTokens={handleSelectTokens} />
          ) : (
            <LiquidityPoolSetup selectedTokens={selectedTokens} onClose={handleBackToSelect} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
