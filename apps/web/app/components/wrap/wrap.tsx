'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@repo/ui/components/ui/button';
import { Card, CardContent } from '@repo/ui/components/ui/card';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@repo/ui/components/ui/select';
import { Switch } from '@repo/ui/components/ui/switch';
import { useMerak } from '@/app/jotai/merak';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useDubhe } from '@0xobelisk/react/sui';
import { Transaction } from '@0xobelisk/sui-client';
import { toast } from 'sonner';
import { WALLETCHAIN } from '@/app/constants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@repo/ui/components/ui/dialog';
import { useEnrichedAssets } from '@/app/hooks/useRegistryAssets';
import { getLogoUrl } from '@/app/types/registry';
import { useBatchAssetMetadata } from '@/app/hooks/useAssetMetadata';
import { useQuery } from '@tanstack/react-query';

// Type definitions
interface TokenInfo {
  value: string; // coinType for wrap, assetId for unwrap
  symbol: string;
  balance: string;
  logoUrl: string; // Changed from JSX.Element to string URL
  rawBalance: string;
  decimals: number;
  coinType?: string; // Only for unwrap mode
}

interface WrapperAssetInfo {
  assetId: string;
  coinType: string;
  decimals: number;
  symbol: string;
  iconUrl: string;
}

// Utility functions
const formatCoinTypeToQuery = (coinType: string): string => {
  let formatted = coinType;
  if (formatted.startsWith('0x')) {
    formatted = formatted.substring(2);
  }
  if (formatted === '2::sui::SUI') {
    return '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
  }
  const parts = formatted.split('::');
  if (parts.length === 3 && parts[0].length < 64) {
    return `${parts[0].padStart(64, '0')}::${parts[1]}::${parts[2]}`;
  }
  return formatted;
};

const formatCoinTypeToDisplay = (coinType: string): string => {
  if (
    coinType.includes('0000000000000000000000000000000000000000000000000000000000000002::sui::SUI')
  ) {
    return '0x2::sui::SUI';
  }
  if (!coinType.startsWith('0x')) {
    return '0x' + coinType.replace(/^0+/, '');
  }
  return coinType;
};
export default function TokenWrapper() {
  const account = useCurrentAccount();
  const { contract: dubheContract } = useDubhe();
  const merak = useMerak();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // States
  const [isWrap, setIsWrap] = useState(true);
  const [amount, setAmount] = useState('');
  const [sourceToken, setSourceToken] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [nativeTokenBalances, setNativeTokenBalances] = useState<Map<string, string>>(new Map());
  const [isBalancesLoading, setIsBalancesLoading] = useState(true);

  // Get enriched assets from registry (whitelist with local logos)
  const { data: enrichedAssets = [], isLoading: isRegistryLoading } = useEnrichedAssets({
    status: 'live'
  });

  // Fetch wrapper assets list using React Query
  const { data: wrapperAssetsRaw = [], isLoading: isWrapperAssetsLoading } = useQuery({
    queryKey: ['wrapperAssetsList'],
    queryFn: async () => {
      if (!merak) return [];
      const result = await merak.storage.list.assetWrapper({ first: 100 });
      return result?.edges?.map((edge) => edge.node) || [];
    },
    enabled: !!merak,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000
  });

  // Extract assetIds for batch metadata fetching
  const wrapperAssetIds = useMemo(
    () => wrapperAssetsRaw.map((asset) => asset.assetId),
    [wrapperAssetsRaw]
  );

  // Batch fetch metadata with caching and auto-refresh
  const { data: wrapperMetadataMap, isLoading: isMetadataLoading } = useBatchAssetMetadata(
    wrapperAssetIds,
    wrapperAssetIds.length > 0
  );

  // Build wrapper assets with metadata
  const wrapperAssets = useMemo<WrapperAssetInfo[]>(() => {
    if (!wrapperMetadataMap || wrapperAssetsRaw.length === 0) return [];

    return wrapperAssetsRaw.map((node) => {
      // Find matching registry asset for better metadata and local logo
      const registryAsset = enrichedAssets.find((asset) => asset.metadata.assetId === node.assetId);

      // Use registry data or cached metadata
      const metadata = {
        decimals:
          registryAsset?.metadata.decimals || wrapperMetadataMap.get(node.assetId)?.decimals || 9,
        symbol:
          registryAsset?.metadata.symbol ||
          wrapperMetadataMap.get(node.assetId)?.symbol ||
          'Unknown',
        iconUrl: registryAsset ? getLogoUrl(registryAsset) : '/registry/sui/images/sui.svg'
      };

      return {
        assetId: node.assetId,
        coinType: node.coinType,
        ...metadata
      };
    });
  }, [wrapperAssetsRaw, wrapperMetadataMap, enrichedAssets]);

  // Fetch user's native token balances for wrapping
  const fetchNativeTokenBalances = useCallback(async () => {
    if (!account?.address || !dubheContract || wrapperAssets.length === 0) {
      setIsBalancesLoading(false);
      return;
    }

    setIsBalancesLoading(true);
    try {
      const balancesMap = new Map<string, string>();

      await Promise.all(
        wrapperAssets.map(async (asset) => {
          try {
            const coinTypeForQuery = formatCoinTypeToDisplay(asset.coinType);
            const balance = await dubheContract.suiInteractor.currentClient.getBalance({
              owner: account.address,
              coinType: coinTypeForQuery
            });
            balancesMap.set(asset.coinType, balance.totalBalance);
          } catch (err) {
            console.error(`Failed to fetch balance for ${asset.coinType}:`, err);
            balancesMap.set(asset.coinType, '0');
          }
        })
      );

      setNativeTokenBalances(balancesMap);
    } catch (error) {
      console.error('Error fetching native token balances:', error);
    } finally {
      setIsBalancesLoading(false);
    }
  }, [account?.address, dubheContract, wrapperAssets]);

  // Fetch user's owned wrapper tokens using React Query with cached metadata
  const { data: ownedWrapperTokens = [] } = useQuery({
    queryKey: ['ownedWrapperTokens', account?.address, wrapperMetadataMap, wrapperAssets],
    queryFn: async () => {
      if (!account?.address || !merak || !wrapperMetadataMap) return [];

      try {
        // Create a set of valid wrapper assetIds for quick lookup
        const validWrapperAssetIds = new Set(wrapperAssets.map((wa) => wa.assetId));

        // Pass cached metadata map to SDK
        const ownedAssets = await merak.listOwnedWrapperAssets({
          account: account.address,
          first: 50,
          orderBy: [{ field: 'CREATED_AT_TIMESTAMP_MS', direction: 'ASC' }],
          metadataMap: wrapperMetadataMap // Use React Query cached metadata
        });

        if (!ownedAssets?.data || !Array.isArray(ownedAssets.data)) {
          return [];
        }

        return ownedAssets.data
          .filter((asset) => {
            // Only include assets that:
            // 1. Have valid data and balance > 0
            // 2. Are in the wrapperAssets list (i.e., are valid wrapper tokens)
            return (
              asset &&
              asset.balance &&
              BigInt(asset.balance) > 0 &&
              validWrapperAssetIds.has(asset.assetId)
            );
          })
          .map((asset) => {
            // Find matching registry asset for better metadata and local logo
            const registryAsset = enrichedAssets.find(
              (regAsset) => regAsset.metadata.assetId === asset.assetId
            );

            // Use registry data or cached metadata (from wrapperMetadataMap)
            const cachedMetadata = wrapperMetadataMap.get(asset.assetId);
            const metadata = {
              decimals:
                registryAsset?.metadata.decimals ||
                cachedMetadata?.decimals ||
                asset.metadata?.decimals ||
                9,
              symbol:
                registryAsset?.metadata.symbol ||
                cachedMetadata?.symbol ||
                asset.metadata?.symbol ||
                'Unknown',
              iconUrl: registryAsset ? getLogoUrl(registryAsset) : '/registry/sui/images/sui.svg'
            };

            // Find coinType from wrapperAssets
            const wrapperAsset = wrapperAssets.find((wa) => wa.assetId === asset.assetId);

            return {
              value: asset.assetId,
              symbol: metadata.symbol,
              balance: (Number(asset.balance) / Math.pow(10, metadata.decimals)).toFixed(4),
              rawBalance: asset.balance,
              decimals: metadata.decimals,
              coinType: wrapperAsset?.coinType,
              logoUrl: metadata.iconUrl
            };
          });
      } catch (error) {
        console.error('Error fetching owned wrapper tokens:', error);
        toast.error('Failed to fetch owned wrapper tokens');
        return [];
      }
    },
    enabled: !!account?.address && !!merak && !!wrapperMetadataMap && wrapperAssets.length > 0,
    staleTime: 30 * 1000, // 30 seconds (balances change frequently)
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true, // Auto-refresh when user returns to tab
    refetchInterval: 30 * 1000 // Auto-refresh every 30 seconds
  });

  // Fetch native token balances when wrapperAssets change
  useEffect(() => {
    if (wrapperAssets.length > 0) {
      fetchNativeTokenBalances();
    }
  }, [wrapperAssets, fetchNativeTokenBalances]);

  // Build token list for wrap mode
  const wrapTokenList = useMemo<TokenInfo[]>(() => {
    return wrapperAssets
      .map((asset) => {
        const balance = nativeTokenBalances.get(asset.coinType) || '0';
        const balanceNum = Number(balance) / Math.pow(10, asset.decimals);

        // Only show tokens with balance > 0
        if (balanceNum === 0) return null;

        return {
          value: asset.coinType,
          symbol: asset.symbol,
          balance: balanceNum.toFixed(4),
          rawBalance: balance,
          decimals: asset.decimals,
          logoUrl: asset.iconUrl
        };
      })
      .filter((token): token is TokenInfo => token !== null);
  }, [wrapperAssets, nativeTokenBalances]);

  // Current token list based on mode
  const currentSourceTokens = useMemo<TokenInfo[]>(
    () => (isWrap ? wrapTokenList : ownedWrapperTokens),
    [isWrap, wrapTokenList, ownedWrapperTokens]
  );

  // Auto-select SUI token as default when data is loaded or mode changes
  useEffect(() => {
    // Only auto-select if sourceToken is empty and we have tokens available
    if (sourceToken || currentSourceTokens.length === 0) return;

    // Try to find SUI token (case-insensitive)
    const suiToken = currentSourceTokens.find((token) => token.symbol.toLowerCase() === 'sui');

    if (suiToken) {
      setSourceToken(suiToken.value);
    } else if (currentSourceTokens.length > 0) {
      // Fallback to first token if SUI not found
      setSourceToken(currentSourceTokens[0].value);
    }
  }, [currentSourceTokens, sourceToken, isWrap]);

  // Compute comprehensive loading state
  const isDataLoading = useMemo(() => {
    // Initial data loading
    if (isRegistryLoading || isWrapperAssetsLoading || isMetadataLoading) {
      return true;
    }

    // Balance loading for wrap mode
    if (isWrap && isBalancesLoading) {
      return true;
    }

    // No wrapper assets loaded yet
    if (wrapperAssets.length === 0) {
      return true;
    }

    return false;
  }, [
    isRegistryLoading,
    isWrapperAssetsLoading,
    isMetadataLoading,
    isWrap,
    isBalancesLoading,
    wrapperAssets.length
  ]);

  // Handle amount change
  const handleAmountChange = useCallback(
    (value: string) => {
      const regex = /^\d*\.?\d*$/;
      if (value === '' || regex.test(value)) {
        const [, decimal] = value.split('.');
        const selectedSource = currentSourceTokens.find((token) => token.value === sourceToken);
        if (decimal && decimal.length > (selectedSource?.decimals || 8)) {
          return;
        }
        setAmount(value);
        setError(null);
      }
    },
    [currentSourceTokens, sourceToken]
  );

  // Handle wrap operation
  const handleWrap = useCallback(async () => {
    if (!account?.address || !dubheContract || !merak) {
      toast.error('Client not initialized');
      return;
    }

    try {
      const amountToWrap = parseFloat(amount);
      if (isNaN(amountToWrap) || amountToWrap <= 0) {
        throw new Error('Invalid amount');
      }

      const selectedToken = currentSourceTokens.find((token) => token.value === sourceToken);
      console.log('============== selectedToken ==============', selectedToken);
      console.log('============== selectedToken ==============', sourceToken);
      if (!selectedToken) {
        throw new Error('Please select a token');
      }

      if (parseFloat(selectedToken.balance) < amountToWrap) {
        throw new Error('Insufficient balance');
      }

      const tx = new Transaction();
      const amountInSmallestUnit = Math.floor(amountToWrap * Math.pow(10, selectedToken.decimals));

      // Select coins
      const coinTypeForQuery = formatCoinTypeToDisplay(sourceToken);
      const selectCoins = await dubheContract.selectCoinsWithAmount(
        amountInSmallestUnit,
        coinTypeForQuery,
        account.address
      );

      if (!selectCoins || selectCoins.length === 0) {
        throw new Error('Unable to select sufficient tokens');
      }

      // Split coins
      const [coin] =
        sourceToken === '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'
          ? tx.splitCoins(tx.gas, [tx.pure.u64(amountInSmallestUnit)])
          : tx.splitCoins(tx.object(selectCoins[0]), [tx.pure.u64(amountInSmallestUnit)]);

      // Wrap
      await merak.wrap(tx, coin, account.address, coinTypeForQuery, true);

      await signAndExecuteTransaction(
        {
          transaction: tx.serialize(),
          chain: WALLETCHAIN
        },
        {
          onSuccess: async (result) => {
            await dubheContract.waitForTransaction(result.digest);
            await fetchNativeTokenBalances();
            // React Query will auto-refresh ownedWrapperTokens
            toast.success('Wrap successful');
            setAmount('');
          },
          onError: (error) => {
            console.error('Wrap transaction failed:', error);
            toast.error('Wrap failed');
          }
        }
      );
    } catch (error) {
      console.error('Wrap operation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    }
  }, [
    account?.address,
    amount,
    sourceToken,
    currentSourceTokens,
    dubheContract,
    merak,
    signAndExecuteTransaction,
    fetchNativeTokenBalances
  ]);

  // Handle unwrap operation
  const handleUnwrap = useCallback(async () => {
    if (!account?.address || !dubheContract || !merak) {
      toast.error('Client not initialized');
      return;
    }

    try {
      const amountToUnwrap = parseFloat(amount);
      if (isNaN(amountToUnwrap) || amountToUnwrap <= 0) {
        throw new Error('Invalid amount');
      }

      const selectedToken = currentSourceTokens.find((token) => token.value === sourceToken);
      if (!selectedToken) {
        throw new Error('Please select a token');
      }

      if (parseFloat(selectedToken.balance) < amountToUnwrap) {
        throw new Error('Insufficient balance');
      }

      if (!selectedToken.coinType) {
        throw new Error('Unable to find coin type for this token');
      }

      const tx = new Transaction();
      const amountInSmallestUnit = BigInt(
        Math.floor(amountToUnwrap * Math.pow(10, selectedToken.decimals))
      );

      // Format coin type for unwrap
      const coinTypeForUnwrap = formatCoinTypeToDisplay(selectedToken.coinType);

      // Unwrap
      await merak.unwrap(tx, amountInSmallestUnit, account.address, coinTypeForUnwrap, true);

      await signAndExecuteTransaction(
        {
          transaction: tx.serialize(),
          chain: WALLETCHAIN
        },
        {
          onSuccess: async (result) => {
            await dubheContract.waitForTransaction(result.digest);
            await fetchNativeTokenBalances();
            // React Query will auto-refresh ownedWrapperTokens
            toast.success('Unwrap successful');
            setAmount('');
          },
          onError: (error) => {
            console.error('Unwrap transaction failed:', error);
            toast.error('Unwrap failed');
          }
        }
      );
    } catch (error) {
      console.error('Unwrap operation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    }
  }, [
    account?.address,
    amount,
    sourceToken,
    currentSourceTokens,
    dubheContract,
    merak,
    signAndExecuteTransaction,
    fetchNativeTokenBalances
  ]);

  // Show loading state while fetching initial data
  if (isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-[#F7F8FA] py-4">
        <Card className="w-[400px] border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Switch skeleton */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>

              {/* Source Token skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Amount skeleton */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Button skeleton */}
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>

        {/* Loading text */}
        <p className="mt-4 text-center text-gray-500 text-sm animate-pulse">
          Loading wrap interface...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 bg-[#F7F8FA] py-4">
      <Card className="w-[400px] border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="flex items-center justify-between">
              <Label htmlFor="wrap-switch">{isWrap ? 'Wrap' : 'Unwrap'}</Label>
              <Switch
                id="wrap-switch"
                checked={isWrap}
                onCheckedChange={(checked) => {
                  setIsWrap(checked);
                  setSourceToken('');
                  setAmount('');
                  setError(null);
                }}
              />
            </div>

            <TokenSelect
              label="Source Token"
              value={sourceToken}
              onChange={setSourceToken}
              options={currentSourceTokens}
              isWrap={isWrap}
            />

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="amount">Amount</Label>
                <span className="text-sm text-gray-500">
                  Balance:{' '}
                  {currentSourceTokens.find((t) => t.value === sourceToken)?.balance || '0'}
                </span>
              </div>
              <div className="relative">
                <Input
                  id="amount"
                  placeholder={`Enter ${isWrap ? 'wrap' : 'unwrap'} amount`}
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={error ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => {
                    const selectedSource = currentSourceTokens.find((t) => t.value === sourceToken);
                    setAmount(selectedSource?.balance || '0');
                  }}
                >
                  Max
                </Button>
              </div>
              {error && <div className="text-sm text-red-500">{error}</div>}
            </div>

            <Button
              type="button"
              onClick={() => setShowConfirmDialog(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading || !amount || !sourceToken}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isWrap ? 'Processing...' : 'Processing...'}
                </div>
              ) : isWrap ? (
                'Wrap'
              ) : (
                'Unwrap'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {isWrap ? 'Wrap' : 'Unwrap'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {isWrap ? 'wrap' : 'unwrap'} {amount}{' '}
              {currentSourceTokens.find((t) => t.value === sourceToken)?.symbol}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setShowConfirmDialog(false);
                setIsLoading(true);
                try {
                  await (isWrap ? handleWrap() : handleUnwrap());
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Token selector component
function TokenSelect({ label, value, onChange, options, isWrap }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      {/* Preload all images using hidden img tags - browser will cache them */}
      <div style={{ display: 'none' }} aria-hidden="true">
        {options.map((token) => (
          <img key={token.value} src={token.logoUrl} alt="" />
        ))}
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full focus:ring-[#C0E6FF] focus:border-[#C0E6FF]">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`}>
            {value &&
              (() => {
                const selectedToken = options.find((t) => t.value === value);
                return selectedToken ? (
                  <div className="flex items-center">
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        marginRight: '8px',
                        backgroundImage: `url(${selectedToken.logoUrl})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        flexShrink: 0
                      }}
                      role="img"
                      aria-label={selectedToken.symbol}
                    />
                    <span>{selectedToken.symbol}</span>
                  </div>
                ) : null;
              })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((token) => (
            <SelectItem
              key={token.value}
              value={token.value}
              className="focus:bg-[#C0E6FF] data-[state=checked]:bg-[#C0E6FF] hover:bg-[#C0E6FF]/80"
            >
              <div className="flex items-center">
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    marginRight: '8px',
                    backgroundImage: `url(${token.logoUrl})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    flexShrink: 0
                  }}
                  role="img"
                  aria-label={token.symbol}
                />
                <span>{isWrap ? token.symbol : `${token.symbol}`}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
