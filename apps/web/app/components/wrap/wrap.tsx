'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Card, CardContent } from '@repo/ui/components/ui/card';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
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

// Type definitions
interface TokenInfo {
  value: string; // coinType for wrap, assetId for unwrap
  symbol: string;
  balance: string;
  logo: JSX.Element;
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
  const [wrapperAssets, setWrapperAssets] = useState<WrapperAssetInfo[]>([]);
  const [nativeTokenBalances, setNativeTokenBalances] = useState<Map<string, string>>(new Map());
  const [ownedWrapperTokens, setOwnedWrapperTokens] = useState<TokenInfo[]>([]);

  // Get enriched assets from registry (whitelist with local logos)
  const { data: enrichedAssets, isLoading: isRegistryLoading } = useEnrichedAssets({
    status: 'live'
  });

  // Fetch all wrapper assets (supported tokens for wrapping)
  // Now enhanced with registry data for better logos and metadata
  const fetchWrapperAssets = useCallback(async () => {
    if (!merak) return;
    try {
      const result = await merak.storage.list.assetWrapper({
        first: 100
      });

      console.log('============== assetWrapper result ==============', result);
      console.log('============== enrichedAssets ==============', enrichedAssets);
      if (result?.edges) {
        const assets: WrapperAssetInfo[] = await Promise.all(
          result.edges.map(async (edge) => {
            const node = edge.node;
            console.log('============== node.assetId ==============', node.assetId);
            console.log('============== node.coinType ==============', node.coinType);

            // Find matching registry asset for better metadata and local logo
            const registryAsset = enrichedAssets.find(
              (asset) => asset.metadata.assetId === node.assetId
            );
            console.log(
              '============== registryAsset found ==============',
              !!registryAsset,
              registryAsset?.asset.symbol
            );

            let metadata = {
              decimals: registryAsset?.metadata.decimals || 9,
              symbol: registryAsset?.metadata.symbol || 'Unknown',
              iconUrl: registryAsset ? getLogoUrl(registryAsset) : '/registry/sui/images/sui.svg'
            };

            // If no registry data, fallback to on-chain metadata (but not iconUrl - avoid external URLs)
            if (!registryAsset) {
              try {
                // Use getMetadata() which utilizes API caching
                console.log('============== node.assetId 2 ==============', node.assetId);
                const assetMetadata = await merak.getMetadata(node.assetId);
                console.log('============== assetMetadata ==============', assetMetadata);
                if (assetMetadata) {
                  metadata = {
                    decimals: assetMetadata.decimals || 9,
                    symbol: assetMetadata.symbol || 'Unknown',
                    // Always use local fallback icon, avoid external URLs
                    iconUrl: '/registry/sui/images/sui.svg'
                  };
                }
              } catch (err) {
                console.error(`Failed to fetch metadata for asset ${node.assetId}:`, err);
              }
            }

            return {
              assetId: node.assetId,
              coinType: node.coinType,
              ...metadata
            };
          })
        );
        setWrapperAssets(assets);
      }
    } catch (error) {
      console.error('Error fetching wrapper assets:', error);
      toast.error('Failed to fetch wrapper assets');
    }
  }, [merak, enrichedAssets]);

  // Fetch user's native token balances for wrapping
  const fetchNativeTokenBalances = useCallback(async () => {
    if (!account?.address || !dubheContract || wrapperAssets.length === 0) return;
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
    }
  }, [account?.address, dubheContract, wrapperAssets]);

  // Fetch user's owned wrapper tokens for unwrapping
  const fetchOwnedWrapperTokens = useCallback(async () => {
    if (!account?.address || !merak) return;
    try {
      const ownedAssets = await merak.listOwnedWrapperAssets({
        account: account.address,
        first: 50,
        orderBy: [{ field: 'CREATED_AT_TIMESTAMP_MS', direction: 'ASC' }]
      });

      console.log('============== ownedAssets ==============', ownedAssets);
      if (ownedAssets?.data && Array.isArray(ownedAssets.data)) {
        const tokens: TokenInfo[] = await Promise.all(
          ownedAssets.data
            .filter((asset) => asset && asset.balance && BigInt(asset.balance) > 0)
            .map(async (asset) => {
              // Find matching registry asset for better metadata and local logo
              const registryAsset = enrichedAssets.find(
                (regAsset) => regAsset.metadata.assetId === asset.assetId
              );

              let metadata = {
                decimals: registryAsset?.metadata.decimals || 9,
                symbol: registryAsset?.metadata.symbol || 'Unknown',
                iconUrl: registryAsset ? getLogoUrl(registryAsset) : '/registry/sui/images/sui.svg'
              };

              // If no registry data, fallback to on-chain metadata (but not iconUrl - avoid external URLs)
              if (!registryAsset) {
                try {
                  // Use getMetadata() which utilizes API caching
                  console.log('============== asset.assetId 1 ==============', asset.assetId);
                  const assetMetadata = await merak.getMetadata(asset.assetId);
                  if (assetMetadata) {
                    metadata = {
                      decimals: assetMetadata.decimals || 9,
                      symbol: assetMetadata.symbol || 'Unknown',
                      // Always use local fallback icon, avoid external URLs
                      iconUrl: '/registry/sui/images/sui.svg'
                    };
                  }
                } catch (err) {
                  console.error(`Failed to fetch metadata for asset ${asset.assetId}:`, err);
                }
              }

              // Find coinType from wrapperAssets
              const wrapperAsset = wrapperAssets.find((wa) => wa.assetId === asset.assetId);

              return {
                value: asset.assetId,
                symbol: metadata.symbol,
                balance: (Number(asset.balance) / Math.pow(10, metadata.decimals)).toFixed(4),
                rawBalance: asset.balance,
                decimals: metadata.decimals,
                coinType: wrapperAsset?.coinType,
                logo: (
                  <img
                    src={metadata.iconUrl}
                    alt={metadata.symbol}
                    width="20"
                    height="20"
                    style={{ marginRight: '8px' }}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/registry/sui/images/sui.svg';
                    }}
                  />
                )
              };
            })
        );
        setOwnedWrapperTokens(tokens);
      } else {
        setOwnedWrapperTokens([]);
      }
    } catch (error) {
      console.error('Error fetching owned wrapper tokens:', error);
      toast.error('Failed to fetch owned wrapper tokens');
      setOwnedWrapperTokens([]);
    }
  }, [account?.address, merak, wrapperAssets, enrichedAssets]);

  // Initialize data
  useEffect(() => {
    // Only fetch when enrichedAssets are loaded and merak is ready
    if (enrichedAssets.length > 0 && merak) {
      fetchWrapperAssets();
    }
  }, [enrichedAssets, merak, fetchWrapperAssets]);

  useEffect(() => {
    if (wrapperAssets.length > 0) {
      fetchNativeTokenBalances();
      fetchOwnedWrapperTokens();
    }
  }, [wrapperAssets, fetchNativeTokenBalances, fetchOwnedWrapperTokens]);

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
          logo: (
            <img
              src={asset.iconUrl}
              alt={asset.symbol}
              width="20"
              height="20"
              style={{ marginRight: '8px' }}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/registry/sui/images/sui.svg';
              }}
            />
          )
        };
      })
      .filter((token): token is TokenInfo => token !== null);
  }, [wrapperAssets, nativeTokenBalances]);

  // Current token list based on mode
  const currentSourceTokens = useMemo<TokenInfo[]>(
    () => (isWrap ? wrapTokenList : ownedWrapperTokens),
    [isWrap, wrapTokenList, ownedWrapperTokens]
  );

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
            await Promise.all([fetchNativeTokenBalances(), fetchOwnedWrapperTokens()]);
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
    fetchNativeTokenBalances,
    fetchOwnedWrapperTokens
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
            await Promise.all([fetchNativeTokenBalances(), fetchOwnedWrapperTokens()]);
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
    fetchNativeTokenBalances,
    fetchOwnedWrapperTokens
  ]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA] p-4">
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
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((token) => (
            <SelectItem key={token.value} value={token.value}>
              <div className="flex items-center">
                {token.logo}
                <span>{isWrap ? token.symbol : `${token.symbol}`}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
