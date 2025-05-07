'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@repo/ui/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@repo/ui/components/ui/pagination';
import { ChevronDown, Globe, Loader2 } from 'lucide-react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { initMerakClient } from '@/app/jotai/merak';
import { useAtom } from 'jotai';
import { AssetsStateAtom, AssetsLoadingAtom } from '@/app/jotai/assets';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface LPPosition {
  id: number;
  name: string;
  symbol: string;
  balance: string;
  value: string;
  apr: string;
  poolAddress?: string;
  token1Id?: number;
  token2Id?: number;
  icon_url?: string;
}

export default function PositionsPage() {
  // 状态管理
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProtocols, setSelectedProtocols] = useState(['SushiSwap v3', 'SushiSwap v2']);
  const [lpPositions, setLpPositions] = useState<LPPosition[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<LPPosition[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  // Global state management with Jotai
  const [assetsState, setAssetsState] = useAtom(AssetsStateAtom);
  const [isLoading, setIsLoading] = useAtom(AssetsLoadingAtom);

  const account = useCurrentAccount();
  const router = useRouter();

  // Query user assets and filter LP tokens
  const queryAssets = useCallback(async () => {
    if (!account?.address) return;

    try {
      setIsLoading(true);
      const merak = initMerakClient();

      const metadataResults = await merak.listOwnedAssetsInfo({
        address: account.address
      });

      console.log(metadataResults, 'metadataResults');

      // Update global state
      setAssetsState({
        assetInfos: metadataResults.data
      });

      // Filter LP tokens
      const lpTokens = metadataResults.data.filter(asset => 
        asset.metadata.asset_type === 'LP' || // Check for LP asset type
        (asset.metadata.symbol && asset.metadata.symbol.includes('-')) // Alternative check for LP tokens by symbol pattern
      );

      // Transform to LP positions format
      const positions = await Promise.all(lpTokens.map(async (token) => {
        // Try to get pool info for additional details
        let poolAddress = '';
        let token1Id = 0;
        let token2Id = 0;
        
        try {
          // If needed, call API to get pool details
          // const poolInfo = await merak.getPoolDetails(token.assetId);
          // if (poolInfo) {
          //   poolAddress = poolInfo.poolAddress;
          //   token1Id = poolInfo.asset1Id;
          //   token2Id = poolInfo.asset2Id;
          // }
        } catch (err) {
          console.error(`Failed to get pool details for token ${token.assetId}:`, err);
        }

        // Calculate token value - in a real app, you would use the actual value
        const balance = Number(token.balance) / Math.pow(10, token.metadata.decimals || 9);
        
        return {
          id: token.assetId,
          name: token.metadata.name || 'Unknown LP Token',
          symbol: token.metadata.symbol || `LP-${token.assetId}`,
          balance: balance.toFixed(4),
          value: '$0.00', // In a real app, calculate this from token prices
          apr: '0.00%', // In a real app, fetch this from an API
          poolAddress,
          token1Id,
          token2Id,
          icon_url: token.metadata.icon_url || 'https://hop.ag/tokens/SUI.svg'
        };
      }));

      setLpPositions(positions);
      console.log('LP Positions:', positions);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      toast.error('Failed to fetch LP positions, please try again');
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, setAssetsState]);

  // Initialize asset loading
  useEffect(() => {
    if (account?.address) {
      queryAssets();
    }
  }, [account?.address, queryAssets]);

  // Apply search filter and pagination
  useEffect(() => {
    let filtered = lpPositions;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(position => 
        position.name.toLowerCase().includes(term) || 
        position.symbol.toLowerCase().includes(term)
      );
    }
    
    // Calculate total pages
    setTotalPages(Math.max(1, Math.ceil(filtered.length / rowsPerPage)));
    
    // Apply pagination
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    setFilteredPositions(filtered.slice(startIndex, endIndex));
    
  }, [lpPositions, searchTerm, currentPage, rowsPerPage]);

  // 处理分页变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理每页行数变化
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // 重置到第一页
  };

  // Handle view pool details (now redirects to remove liquidity)
  const handleViewPool = (position: LPPosition) => {
    // We'll pass both token IDs and the LP token ID if available
    const queryParams = new URLSearchParams();
    
    if (position.token1Id) {
      queryParams.append('asset1', position.token1Id.toString());
    }
    
    if (position.token2Id) {
      queryParams.append('asset2', position.token2Id.toString());
    }
    
    // Always include the LP token ID
    queryParams.append('lpTokenId', position.id.toString());
    
    // 修正跳转链接，确保有问号
    router.push(`/pool/remove`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Manage Liquidity Positions</h1>
        <p className="text-gray-600">
          You can adjust and claim rewards for your liquidity positions on the
          connected network.
        </p>
      </div>
      
      {/* 搜索和筛选 */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* 我的头寸表格 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium">My Positions ({lpPositions.length})</h2>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
              <p>Loading your positions...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">APR</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPositions.length > 0 ? (
                  filteredPositions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <img 
                            src={position.icon_url} 
                            alt={position.symbol} 
                            className="w-6 h-6 mr-2 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://hop.ag/tokens/SUI.svg';
                            }} 
                          />
                          <div>
                            <div className="font-medium">{position.symbol}</div>
                            <div className="text-xs text-gray-500">{position.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{position.balance}</TableCell>
                      <TableCell className="text-right">{position.value}</TableCell>
                      <TableCell className="text-right">{position.apr}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() =>  
                            handleViewPool(position) 
                          }
                        >
                          Remove Liquidity
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
        
        {/* 分页控件 */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Rows per page</span>
            <select
              className="border rounded p-1 text-sm"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(i + 1);
                      }}
                      isActive={currentPage === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) handlePageChange(currentPage + 1);
                    }}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
}