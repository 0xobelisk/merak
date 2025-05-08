'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@repo/ui/components/ui/table';
import { RefreshCw, Search, ArrowUpDown } from 'lucide-react';
import { initMerakClient } from '@/app/jotai/merak';
import { AllAssetsStateAtom, AssetsLoadingAtom } from '@/app/jotai/assets';

export default function AssetsPage() {
  // DApp Kit hooks
  const account = useCurrentAccount();
  const router = useRouter();

  // Global state management with Jotai
  const [allAssetsState, setAllAssetsState] = useAtom(AllAssetsStateAtom);
  const [isLoading, setIsLoading] = useAtom(AssetsLoadingAtom);

  // Local UI state management
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  } | null>(null);

  /**
   * Query asset list
   * Get account information and asset metadata
   */
  const queryAssets = useCallback(async () => {
    if (!account?.address) return;

    try {
      setIsLoading(true);
      const merak = initMerakClient();

      const metadataResults = await merak.listAssetsInfo();

      console.log(metadataResults, 'metadataResults');

      // Update state
      setAllAssetsState({
        assetInfos: metadataResults.data
      });

      console.log('Retrieved assets:', metadataResults.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      toast.error('Failed to fetch assets, please try again');
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, setAllAssetsState, setIsLoading]);

  // Initialize asset loading
  useEffect(() => {
    if (account?.address) {
      queryAssets();
    }
  }, [account?.address, queryAssets]);

  // Refresh asset list
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryAssets();
    setIsRefreshing(false);
    toast.success('Asset list updated');
  };

  // Sorting functionality
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting and search filtering
  const filteredAndSortedAssets = React.useMemo(() => {
    let filteredItems = [...allAssetsState.assetInfos];

    // Apply search filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filteredItems = filteredItems.filter(
        (asset) =>
          asset.metadata?.name?.toLowerCase().includes(lowercasedTerm) ||
          asset.metadata?.symbol?.toLowerCase().includes(lowercasedTerm) ||
          asset.assetId.toString().includes(lowercasedTerm)
      );
    }

    // Apply sorting
    if (sortConfig !== null) {
      filteredItems.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === 'symbol') {
          aValue = a.metadata?.symbol?.toLowerCase() || '';
          bValue = b.metadata?.symbol?.toLowerCase() || '';
        } else if (sortConfig.key === 'name') {
          aValue = a.metadata?.name?.toLowerCase() || '';
          bValue = b.metadata?.name?.toLowerCase() || '';
        } else if (sortConfig.key === 'balance') {
          aValue = Number(a.balance) / Math.pow(10, a.metadata?.decimals || 0);
          bValue = Number(b.balance) / Math.pow(10, b.metadata?.decimals || 0);
        } else if (sortConfig.key === 'assetId') {
          aValue = Number(a.assetId);
          bValue = Number(b.assetId);
        } else if (sortConfig.key === 'decimals') {
          aValue = a.metadata?.decimals || 0;
          bValue = b.metadata?.decimals || 0;
        } else if (sortConfig.key === 'supply') {
          aValue = a.metadata?.supply
            ? Number(a.metadata.supply) / Math.pow(10, a.metadata?.decimals || 0)
            : 0;
          bValue = b.metadata?.supply
            ? Number(b.metadata.supply) / Math.pow(10, b.metadata?.decimals || 0)
            : 0;
        } else if (sortConfig.key === 'accounts') {
          aValue = a.metadata?.accounts ? Number(a.metadata.accounts) : 0;
          bValue = b.metadata?.accounts ? Number(b.metadata.accounts) : 0;
        } else {
          return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    } else {
      // Default sort by asset ID from low to high
      filteredItems.sort((a, b) => {
        const aId = Number(a.assetId);
        const bId = Number(b.assetId);
        return aId - bId;
      });
    }

    return filteredItems;
  }, [allAssetsState.assetInfos, searchTerm, sortConfig]);

  // Show prompt if user hasn't connected wallet
  if (!account) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg text-center mb-4">
              Please connect your wallet to view your assets
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Assets</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Asset Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Number of Total Assets</p>
              <p className="text-2xl font-bold">{allAssetsState.assetInfos.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading assets...</span>
            </div>
          ) : filteredAndSortedAssets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? 'No matching assets found' : 'No assets at this time'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('assetId')}>
                    <div className="flex items-center">
                      ID
                      {sortConfig?.key === 'assetId' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('symbol')}>
                    <div className="flex items-center">
                      Symbol
                      {sortConfig?.key === 'symbol' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('decimals')}>
                    <div className="flex items-center">
                      Decimals
                      {sortConfig?.key === 'decimals' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('supply')}>
                    <div className="flex items-center">
                      Supply
                      {sortConfig?.key === 'supply' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('accounts')}>
                    <div className="flex items-center">
                      Accounts
                      {sortConfig?.key === 'accounts' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedAssets.map((asset) => (
                  <TableRow key={asset.assetId}>
                    <TableCell className="font-mono text-xs">{asset.assetId}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-start">
                        <img
                          src={asset.metadata?.icon_url || 'https://hop.ag/tokens/SUI.svg'}
                          alt={asset.metadata?.name || `Token ${asset.assetId}`}
                          className="w-8 h-8 mr-3 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://hop.ag/tokens/SUI.svg';
                          }}
                        />
                        <span className="font-bold">{asset.metadata?.symbol || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {asset.metadata?.name || `Unknown Asset #${asset.assetId}`}
                    </TableCell>
                    <TableCell>{asset.metadata?.decimals || 0}</TableCell>
                    <TableCell>
                      {asset.metadata?.supply
                        ? formatSupply(asset.metadata.supply, asset.metadata.decimals || 0)
                        : '-'}
                    </TableCell>
                    <TableCell>{asset.metadata?.accounts || '-'}</TableCell>
                    <TableCell>
                      <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-xs font-semibold border border-gray-200">
                        {asset.metadata?.asset_type ? Object.keys(asset.metadata.asset_type)[0] : '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const formatSupply = (supply: string, decimals: number): string => {
  if (!supply) return '-';

  try {
    // Convert supply to number, considering decimals
    const supplyNum = Number(supply) / Math.pow(10, decimals);

    // Use toLocaleString to add thousand separators, maximum 2 decimal places
    return supplyNum.toLocaleString(undefined, {
      maximumFractionDigits: 2
    });
  } catch (error) {
    console.error('Error formatting supply:', error);
    return supply; // Return original value if formatting fails
  }
};
