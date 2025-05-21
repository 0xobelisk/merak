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
import { initDubheClient } from '@/app/jotai/dubhe';
import { initMerakClient } from '@/app/jotai/merak';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import type { CoinBalance, CoinMetadata } from '@0xobelisk/sui-client';
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

// Type definitions
interface TokenInfo {
  value: string;
  symbol: string;
  balance: string;
  logo: JSX.Element;
  rawBalance?: string;
  decimals?: number;
}

interface AssetInfo {
  id: number;
  metadata: any;
  balance: string;
  decimals: number;
  symbol: string;
  url: string;
  name: string;
}

const formatCoinType = (coinType: string): string => {
  if (coinType.startsWith('0x')) {
    coinType = coinType.substring(2);
  }

  if (coinType === '2::sui::SUI') {
    return '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
  }

  const parts = coinType.split('::');
  if (parts.length === 3) {
    const [module, pkg, type] = parts;
    if (module.length < 64) {
      return `${module.padStart(64, '0')}::${pkg}::${type}`;
    }
  }

  return coinType;
};

const getCoinMetadata = (coinType: string) => {
  const metadatas = {
    '0x2::sui::SUI': {
      decimals: 9,
      name: 'Sui',
      symbol: 'SUI',
      description: '',
      iconUrl: null,
      id: '0x587c29de216efd4219573e08a1f6964d4fa7cb714518c2c8a0f29abfa264327d'
    },
    '0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::dubhe::DUBHE': {
      decimals: 7,
      description: 'Dubhe engine token',
      iconUrl: null,
      id: '0x107334aa54e072a4c595f07b215a1a0370a1281962ba4a83876cc6611a6f6771',
      name: 'DUBHE Token',
      symbol: 'DUBHE'
    },
    '0xaaddbe04ba595ae9d6c33fba5b415bccb1f1dd93877fbb34701666f995a208ca::stars::STARS': {
      decimals: 7,
      name: 'STARS Token',
      symbol: 'STARS',
      description: 'Stars point',
      iconUrl: 'https://raw.githubusercontent.com/0xobelisk/dubhe/main/assets/stars.gif',
      id: '0xc2cc68354f96ff4c483e9085285ce5ea4ce9d28b944f469fe6d9463b3c5a2c52'
    }
  };
  return metadatas[coinType];
};
export default function TokenWrapper() {
  const account = useCurrentAccount();
  const [balances, setBalances] = useState<(CoinBalance & { metadata: CoinMetadata })[]>([]);
  const [assetMetadata, setAssetMetadata] = useState<AssetInfo[]>([]);
  const [wrapperAssetsMap, setWrapperAssetsMap] = useState<Map<string, any>>(new Map());
  // 创建资产ID到币种类型的缓存
  const [assetIdToCoinTypeMap, setAssetIdToCoinTypeMap] = useState<Map<string, string>>(new Map());

  const [isLoading, setIsLoading] = useState(false);
  const [isTokensLoading, setIsTokensLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [amount, setAmount] = useState('');
  const [sourceToken, setSourceToken] = useState('');
  const [isWrap, setIsWrap] = useState(true);

  // Fetch token data
  const fetchTokenData = useCallback(async () => {
    if (!account?.address) return;
    setIsTokensLoading(true);
    try {
      const dubhe = initDubheClient();
      const allBalances = await dubhe.suiInteractor.currentClient.getAllBalances({
        owner: account.address
      });
      const updatedBalances = await Promise.all(
        allBalances.map(async (coinBalance) => {
          const metadata = getCoinMetadata(coinBalance.coinType);
          return {
            ...coinBalance,
            metadata
          };
        })
      );
      setBalances(updatedBalances);
    } catch (error) {
      console.error('Error fetching coins data:', error);
      toast.error('Failed to fetch token data');
    } finally {
      setIsTokensLoading(false);
    }
  }, [account?.address]);

  // Fetch wrapped token data
  const fetchWrappedTokens = useCallback(async () => {
    if (!account?.address) return;

    try {
      const merak = initMerakClient();

      const ownedAssets = await merak.listOwnedWrapperAssets({
        address: account.address
      });

      if (ownedAssets && ownedAssets.data && Array.isArray(ownedAssets.data)) {
        const userWrappedAssets = await Promise.all(
          ownedAssets.data
            .filter((asset) => asset && asset.balance && BigInt(asset.balance) > 0)
            .map(async (asset) => {
              let metadata = asset.metadata || {};

              if (!metadata.symbol || !metadata.decimals || !metadata.iconUrl) {
                try {
                  const assetMetadata = await merak.storage.get.assetMetadata({
                    assetId: asset.assetId
                  });

                  if (assetMetadata && assetMetadata.data) {
                    metadata = {
                      ...metadata,
                      ...assetMetadata.data
                    };
                  }
                } catch (err) {
                  console.error(`Failed to fetch metadata for asset ${asset.assetId}:`, err);
                }
              }

              // 获取资产ID对应的币种类型并存入缓存
              try {
                const wrapperAssets = await merak.storage.get.wrapperAssets({
                  assetId: asset.assetId
                });
                if (wrapperAssets && wrapperAssets.data && wrapperAssets.data.key1) {
                  setAssetIdToCoinTypeMap((prevMap) => {
                    const newMap = new Map(prevMap);
                    newMap.set(asset.assetId.toString(), wrapperAssets.data.key1);
                    return newMap;
                  });
                }
              } catch (err) {
                console.error(`Failed to fetch coin type for asset ${asset.assetId}:`, err);
              }

              return {
                id: asset.assetId,
                metadata: metadata,
                balance: asset.balance || '0',
                decimals: metadata.decimals || 9,
                symbol: metadata.symbol || 'Unknown',
                url: metadata.iconUrl || '/sui-logo.svg',
                name: metadata.name || 'Wrapped Token'
              };
            })
        );

        setAssetMetadata(userWrappedAssets);
      } else {
        setAssetMetadata([]);
      }
    } catch (error) {
      console.error('Error fetching wrapped tokens:', error);
      toast.error('Failed to fetch wrapped tokens');
      setAssetMetadata([]);
    }
  }, [account?.address]);

  // Calculate target token list
  const targetTokens = useMemo(
    () =>
      assetMetadata
        .filter((asset) => asset && asset.id !== undefined)
        .map((asset) => {
          // Calculate balance using correct decimal places
          const decimals = asset.decimals || 9;
          const balance = asset.balance
            ? (Number(BigInt(asset.balance)) / Math.pow(10, decimals)).toFixed(4)
            : '0';

          return {
            value: asset.id.toString(),
            symbol: asset.symbol || 'Unknown',
            balance: balance,
            logo: (
              <img
                src={asset.url || '/sui-logo.svg'}
                alt={asset.name || 'Token'}
                width="20"
                height="20"
                style={{ marginRight: '8px' }}
                loading="lazy"
                onError={(e) => {
                  // Use default icon if image fails to load
                  e.currentTarget.src = '/sui-logo.svg';
                }}
              />
            ),
            decimals: decimals
          };
        }),
    [assetMetadata]
  );

  // Initialize data - 只在组件挂载时调用一次
  useEffect(() => {
    const initData = async () => {
      await fetchTokenData();
      if (account?.address) {
        await fetchWrappedTokens();
      }
    };

    initData();
  }, [fetchTokenData, fetchWrappedTokens, account?.address]);

  // 移除了 sourceToken 变化时重复调用 fetchWrappedTokens 的 useEffect

  // 优化 wrapperAssets 查询逻辑
  useEffect(() => {
    const merak = initMerakClient();
    const queryWrapperAssets = async () => {
      if (balances.length === 0) return;

      const newWrapperAssetsMap = new Map<string, any>();
      const promises = balances.map(async (coinBalance) => {
        try {
          const formattedCoinType = formatCoinType(coinBalance.coinType);
          const wrapperAssets = await merak.storage.get.wrapperAssets({
            coinType: formattedCoinType
          });

          if (wrapperAssets && wrapperAssets.data) {
            newWrapperAssetsMap.set(coinBalance.coinType, wrapperAssets.data);
          }
        } catch (err) {
          console.error('Failed to fetch wrapperAssets:', err);
        }
      });

      // 等待所有请求完成
      await Promise.all(promises);
      setWrapperAssetsMap(newWrapperAssetsMap);
    };

    queryWrapperAssets();
  }, [balances]);

  // Calculate token list
  const sourceTokens = useMemo(() => {
    const tokenMap = new Map<string, TokenInfo>();
    if (balances.length === 0) {
      return Array.from(tokenMap.values());
    }

    balances.forEach((coinBalance) => {
      // 只处理在 wrapperAssets 中的代币
      if (!wrapperAssetsMap.has(coinBalance.coinType)) {
        return;
      }

      const symbol =
        coinBalance.metadata.symbol || coinBalance.coinType.split('::').pop() || 'Unknown';
      const currentBalance = BigInt(coinBalance.totalBalance);
      const existingToken = tokenMap.get(symbol);

      if (!existingToken || currentBalance > BigInt(existingToken.rawBalance || '0')) {
        const decimals = coinBalance.metadata.decimals || 9;
        const balance = Number(currentBalance) / Math.pow(10, decimals);

        tokenMap.set(symbol, {
          value: coinBalance.coinType,
          symbol,
          balance: balance.toFixed(4),
          logo: (
            <img
              src={
                symbol === 'SUI'
                  ? '/sui-logo.svg'
                  : symbol === 'DUBHE'
                  ? '/dubhe-logo.png'
                  : coinBalance.metadata?.iconUrl || '/sui-logo.svg'
              }
              alt={symbol}
              width="20"
              height="20"
              style={{ marginRight: '8px' }}
              loading="lazy"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.src = '/sui-logo.svg';
              }}
            />
          ),
          rawBalance: coinBalance.totalBalance,
          decimals
        });
      }
    });

    return Array.from(tokenMap.values());
  }, [balances, wrapperAssetsMap]);

  // Source token list for wrap/unwrap
  const currentSourceTokens = useMemo<TokenInfo[]>(
    () => (isWrap ? sourceTokens : targetTokens),
    [isWrap, sourceTokens, targetTokens]
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
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const handleWrap = useCallback(async () => {
    if (!account?.address) return;

    try {
      const amountToWrap = parseFloat(amount);
      if (isNaN(amountToWrap) || amountToWrap <= 0) {
        throw new Error('Invalid amount');
      }

      const selectedSource = currentSourceTokens.find((token) => token.value === sourceToken);

      if (!selectedSource) {
        throw new Error('Please select a token');
      }

      if (parseFloat(selectedSource.balance) < amountToWrap) {
        throw new Error('Insufficient balance');
      }

      const dubhe = initDubheClient();
      const merak = initMerakClient();
      const metadata = await dubhe.suiInteractor.currentClient.getCoinMetadata({
        coinType: sourceToken
      });

      // Process sourceToken format
      let formattedToken = sourceToken;
      if (sourceToken.includes('0x2::sui::SUI')) {
        formattedToken =
          '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
      } else if (sourceToken.startsWith('0x')) {
        formattedToken = sourceToken.substring(2);
      }

      const tx = new Transaction();

      const amountInSmallestUnit = Math.floor(amountToWrap * 10 ** metadata.decimals);

      // Ensure sufficient tokens are selected
      const selectCoins = await dubhe.selectCoinsWithAmount(
        amountInSmallestUnit,
        selectedSource.value,
        account.address
      );

      if (!selectCoins || selectCoins.length === 0) {
        throw new Error('Unable to select sufficient tokens');
      }

      // Use tx.gas for SUI tokens, otherwise use selected tokens
      const [coin] = sourceToken.includes('0x2::sui::SUI')
        ? tx.splitCoins(tx.gas, [tx.pure.u64(amountInSmallestUnit)])
        : tx.splitCoins(tx.object(selectCoins[0]), [tx.pure.u64(amountInSmallestUnit)]);

      // Use processed token format
      await merak.wrap(tx, coin, account.address, sourceToken, true);

      await signAndExecuteTransaction(
        {
          transaction: tx.serialize(),
          chain: WALLETCHAIN
        },
        {
          onSuccess: async (result) => {
            // 添加短暂延迟确保链上数据更新
            await dubhe.waitForTransaction(result.digest);
            await Promise.all([fetchTokenData(), fetchWrappedTokens()]);
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
    signAndExecuteTransaction,
    fetchTokenData,
    fetchWrappedTokens
  ]);

  // Handle unwrap operation
  const handleUnwrap = useCallback(async () => {
    if (!account?.address) return;

    try {
      const amountToUnwrap = parseFloat(amount);
      if (isNaN(amountToUnwrap) || amountToUnwrap <= 0) {
        throw new Error('Invalid amount');
      }

      const selectedSource = currentSourceTokens.find((token) => token.value === sourceToken);
      if (!selectedSource || parseFloat(selectedSource.balance) < amountToUnwrap) {
        throw new Error('Insufficient balance');
      }

      const merak = initMerakClient();

      // Get selected asset details
      const selectedAsset = assetMetadata.find((asset) => asset.id.toString() === sourceToken);
      if (!selectedAsset) {
        throw new Error('Unable to get selected token information');
      }

      const tx = new Transaction();

      // Use selectedAsset decimals
      const decimals = selectedAsset.decimals || 9;

      // Ensure amount is an integer using Math.floor
      const amountInSmallestUnit = BigInt(Math.floor(amountToUnwrap * Math.pow(10, decimals)));

      // 优先从缓存中获取 coin_type
      let coin_type;
      if (assetIdToCoinTypeMap.has(sourceToken)) {
        coin_type = assetIdToCoinTypeMap.get(sourceToken);
      } else {
        const result = await merak.storage.get.wrapperAssets({ assetId: sourceToken });
        coin_type = result.data.key1;
        // 更新缓存
        setAssetIdToCoinTypeMap((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.set(sourceToken, coin_type);
          return newMap;
        });
      }

      // Process sourceToken format
      let formattedToken = coin_type;
      if (
        coin_type.includes(
          '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'
        )
      ) {
        formattedToken = '0x2::sui::SUI';
      } else {
        // Remove leading zeros and add 0x prefix
        formattedToken = '0x' + coin_type.replace(/^0+/, '');
      }

      // Use processed token format
      await merak.unwrap(tx, amountInSmallestUnit, account.address, formattedToken, true);
      const dubhe = initDubheClient();
      await signAndExecuteTransaction(
        {
          transaction: tx.serialize(),
          chain: WALLETCHAIN
        },
        {
          onSuccess: async (result) => {
            // 添加短暂延迟确保链上数据更新
            await dubhe.waitForTransaction(result.digest);
            await Promise.all([fetchTokenData(), fetchWrappedTokens()]);
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
    assetMetadata,
    assetIdToCoinTypeMap,
    signAndExecuteTransaction,
    fetchTokenData,
    fetchWrappedTokens
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
                  if (!checked) {
                    // When switching to unwrap mode, re-fetch wrapped token data:
                    fetchWrappedTokens();
                  }
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
