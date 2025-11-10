'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { TokenSelectionOpen } from '@/app/jotai/swap/swap';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { ChevronDown, ArrowUpDown, Loader2, Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import TokenSelectionModal from '@/app/components/swap/token-selection-modal';
import { Transaction } from '@0xobelisk/sui-client';
import debounce from 'lodash/debounce';
import { useMerak } from '@/app/jotai/merak';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { toast } from 'sonner';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { fromTokenAtom, toTokenAtom, type Token } from '@/app/jotai/swap/tokens';
import { WALLETCHAIN } from '@/app/constants';
import { AssetInfo } from '@0xobelisk/merak-sdk';
import { useDubhe } from '@0xobelisk/react/sui';
import { useEnrichedAssets } from '@/app/hooks/useRegistryAssets';
import { useAssetWrappers } from '@/app/hooks/useAssetMetadata';
import { getLogoUrl, findAssetByAssetId } from '@/app/types/registry';
import { useUserAssets } from '@/app/hooks/useUserAssets';

// Function to format balance
const formatBalance = (balance: string, decimals: number): string => {
  const balanceNum = parseFloat(balance);
  if (isNaN(balanceNum)) return '0.0000';
  return (balanceNum / 10 ** decimals).toFixed(4);
};

export default function SwapPage({ params }: { params: { fromToken: string; toToken: string } }) {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const router = useRouter();

  // State management optimization: grouped by functionality
  // Token related states
  const [fromToken, setFromToken] = useAtom<Token>(fromTokenAtom);
  const [toToken, setToToken] = useAtom<Token>(toTokenAtom);
  const [fromTokenBalance, setFromTokenBalance] = useState<string>('0.00');
  const [toTokenBalance, setToTokenBalance] = useState<string>('0.00');
  const [isTokensReady, setIsTokensReady] = useState(false);

  // Store coinType to assetId mapping
  const [coinTypeToAssetId, setCoinTypeToAssetId] = useState<Map<string, string>>(new Map());

  // UI states
  const [isTokenSelectionOpen, setTokenSelectionOpen] = useAtom(TokenSelectionOpen);
  const [currentSelection, setCurrentSelection] = useState<'from' | 'to'>('from');
  const [slippage, setSlippage] = useState('0.50');
  const [customSlippage, setCustomSlippage] = useState('');

  // Use React Query hook for user assets with automatic caching
  const { data: userAssetsData, isLoading: isAssetsLoading } = useUserAssets();

  // Memoize assets state
  const assetsState = useMemo(
    () => ({
      assetInfos: userAssetsData?.data || []
    }),
    [userAssetsData]
  );

  const [filteredAssets, setFilteredAssets] = useState<AssetInfo[]>([]);
  const [availableToTokens, setAvailableToTokens] = useState<AssetInfo[]>([]);
  const [availableFromTokens, setAvailableFromTokens] = useState<AssetInfo[]>([]);

  // Get registry assets for whitelist and local logos
  const { data: enrichedAssets } = useEnrichedAssets({ status: 'live' });
  // Get asset wrappers for coinType mapping
  const { data: assetWrappersData } = useAssetWrappers();
  const [exchangeRate, setExchangeRate] = useState<string | null>(null);

  // Helper function to get assetId from coinType
  const getAssetIdFromCoinType = useCallback(
    (coinType: string): string | null => {
      // Try registry first
      const registryAsset = enrichedAssets?.find((asset) => asset.asset.coinType === coinType);
      if (registryAsset) {
        return registryAsset.metadata.assetId;
      }

      console.log('============== coinType ==============', coinType);
      console.log('============== assetWrappersData ==============', assetWrappersData?.data);
      // Try from asset wrappers
      const wrapper = assetWrappersData?.data?.find((w) => w.coinType === coinType);
      console.log('============== wrapper ==============', wrapper);
      return wrapper ? wrapper.assetId : null;
    },
    [enrichedAssets, assetWrappersData]
  );

  // Helper function to get coinType from assetId
  const getCoinTypeFromAssetId = useCallback(
    (assetId: number | string): string | null => {
      // Try registry first
      const registryAsset = enrichedAssets?.find(
        (asset) => asset.metadata.assetId === String(assetId)
      );
      if (registryAsset) {
        return registryAsset.asset.coinType;
      }

      // Try from asset wrappers
      const wrapper = assetWrappersData?.data?.find((w) => w.assetId === String(assetId));
      return wrapper?.coinType || null;
    },
    [enrichedAssets, assetWrappersData]
  );

  // Amount states
  const [payAmount, setPayAmount] = useState<string>('');
  const [receiveAmount, setReceiveAmount] = useState<string>('');
  const [dollarValuePay, setDollarValuePay] = useState<string | null>(null);
  const [dollarValueReceive, setDollarValueReceive] = useState<string | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const { contract: dubheContract } = useDubhe();
  const merakClient = useMerak();

  // Token initialization states
  const [tokensState, setTokensState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: true,
    error: null
  });

  // Optimize getAmountOut function
  const getAmountOut = useCallback(
    async (amount: string) => {
      if (!amount || parseFloat(amount) <= 0) {
        return null;
      }

      if (fromToken?.id === undefined || toToken?.id === undefined) {
        throw new Error('Please select tokens first');
      }
      if (!fromToken.decimals) {
        throw new Error('Token decimals undefined');
      }
      if (!merakClient) {
        throw new Error('Merak client not initialized');
      }

      try {
        // 1. Get swap path
        console.log('============== fromToken.id ==============', fromToken.id);
        console.log('============== toToken.id ==============', toToken.id);
        const paths = await merakClient.querySwapPaths(String(fromToken.id), String(toToken.id));
        console.log('============== paths ==============', paths);
        if (!paths?.length) {
          throw new Error('No valid swap path found');
        }

        // 2. Calculate input amount (with decimals)
        const amountWithDecimals = BigInt(
          Math.floor(parseFloat(amount) * 10 ** fromToken.decimals)
        );

        console.log('============== amountWithDecimals ==============', amountWithDecimals);
        console.log('============== paths ==============', paths);
        // 3. Get output amount
        const amountsOut = await merakClient.getAmountsOut(
          amountWithDecimals,
          paths[0].map(String)
        );
        if (!amountsOut?.[0]?.length) {
          throw new Error('Failed to get output amount');
        }

        // 4. Get final amount
        const finalAmount = amountsOut[0][amountsOut[0].length - 1];
        if (BigInt(finalAmount) <= BigInt(0)) {
          throw new Error('Insufficient liquidity');
        }

        return finalAmount;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Insufficient liquidity for this trade: ${errorMessage}`);
        throw error;
      }
    },
    [fromToken, toToken, merakClient]
  );

  // Optimize calculateReceiveAmount function
  const calculateReceiveAmount = useCallback(
    debounce(async (amount: string) => {
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        setReceiveAmount('');
        setDollarValuePay(null);
        setDollarValueReceive(null);
        setExchangeRate(null);
        setIsCalculating(false);
        return;
      }

      setIsCalculating(true);
      try {
        const amountOutResult = await getAmountOut(amount);
        if (!amountOutResult || !toToken?.decimals) {
          throw new Error('Invalid calculation result');
        }
        const amountOut = BigInt(amountOutResult);
        const calculatedReceiveAmount = (Number(amountOut) / 10 ** toToken.decimals).toFixed(9);

        // Calculate exchange rate
        const rate = (parseFloat(calculatedReceiveAmount) / parseFloat(amount)).toFixed(6);
        setExchangeRate(`1 ${fromToken.symbol} ≈ ${rate} ${toToken.symbol}`);

        setReceiveAmount(calculatedReceiveAmount);
        setDollarValuePay(`$${(parseFloat(amount) * 1).toFixed(2)}`);
        setDollarValueReceive(`$${(parseFloat(calculatedReceiveAmount) * 1).toFixed(2)}`);
      } catch (error) {
        setReceiveAmount('');
        setDollarValuePay(null);
        setDollarValueReceive(null);
        setExchangeRate(null);
      } finally {
        setIsCalculating(false);
      }
    }, 500),
    [fromToken, toToken, getAmountOut]
  );

  // Optimize input processing function
  const handleInputChangePay = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Only allow numbers and decimal point
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setPayAmount(value);
        calculateReceiveAmount(value);
      }
    },
    [calculateReceiveAmount]
  );

  // Get available toToken paths
  const fetchAvailableToTokens = useCallback(
    async (fromTokenId: string) => {
      if (!merakClient) return;
      try {
        setIsLoading(true);
        const swappableTokenIds = await merakClient.getAllSwappableTokens({
          startTokenId: fromTokenId
        });

        // Get metadata for swappable tokens from current assets
        const availableToTokens = assetsState.assetInfos.filter((asset) =>
          swappableTokenIds.includes(String(asset.assetId))
        );

        if (availableToTokens.length > 0) {
          const firstToken = availableToTokens[0];

          // Try to get logo from registry first
          const registryAsset = enrichedAssets?.find(
            (asset) => asset.metadata.assetId === String(firstToken.assetId)
          );

          setToToken({
            id: String(firstToken.assetId),
            name: firstToken.metadata.name,
            symbol: firstToken.metadata.symbol,
            description: firstToken.metadata.description,
            decimals: firstToken.metadata.decimals,
            iconUrl: registryAsset ? getLogoUrl(registryAsset) : firstToken.metadata.iconUrl,
            balance: firstToken.balance
          });
        }
        setAvailableToTokens(availableToTokens);
        setAvailableFromTokens(filteredAssets);
      } catch (error) {
        console.error('Error fetching available swap paths:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [merakClient, assetsState.assetInfos, setToToken, filteredAssets, enrichedAssets]
  );

  // Fetch available toTokens when fromToken changes
  useEffect(() => {
    if (fromToken?.id !== undefined) {
      fetchAvailableToTokens(fromToken.id);
    }
  }, [fromToken, fetchAvailableToTokens]);

  // Update handleSelectToken function
  const handleSelectToken = useCallback(
    (token: Token) => {
      // Get coinType for the selected token
      const selectedCoinType = getCoinTypeFromAssetId(token.id);
      if (!selectedCoinType) {
        toast.error('Could not find coinType for selected token');
        return;
      }

      if (currentSelection === 'from') {
        // Check if same as target token
        if (toToken?.id === token.id) {
          // If same, swap the tokens
          const fromCoinType = getCoinTypeFromAssetId(fromToken.id);
          if (!fromCoinType) {
            toast.error('Could not find coinType for current token');
            return;
          }
          setFromToken(token);
          setToToken(fromToken);
          router.push(`/swap/${selectedCoinType}/${fromCoinType}`);
        } else {
          console.log('============== toToken ==============', toToken);
          // Get current toToken's coinType before updating state
          const currentToCoinType = toToken?.id ? getCoinTypeFromAssetId(toToken.id) : null;
          console.log('============== currentToCoinType ==============', currentToCoinType);
          if (!currentToCoinType) {
            toast.error('Please select a destination token first');
            return;
          }
          setFromToken(token);
          router.push(`/swap/${selectedCoinType}/${currentToCoinType}`);
        }
        // Clear previous toToken list when selecting new fromToken
        setAvailableToTokens([]);
      } else {
        // Check if same as source token
        if (fromToken?.id === token.id) {
          // If same, swap the tokens
          const toCoinType = getCoinTypeFromAssetId(toToken.id);
          if (!toCoinType) {
            toast.error('Could not find coinType for current token');
            return;
          }
          setToToken(token);
          setFromToken(toToken);
          router.push(`/swap/${toCoinType}/${selectedCoinType}`);
        } else {
          // Get current fromToken's coinType before updating state
          const currentFromCoinType = fromToken?.id ? getCoinTypeFromAssetId(fromToken.id) : null;
          if (!currentFromCoinType) {
            toast.error('Please select a source token first');
            return;
          }
          setToToken(token);
          router.push(`/swap/${currentFromCoinType}/${selectedCoinType}`);
        }
      }

      // Recalculate if there's an input amount
      if (payAmount) {
        calculateReceiveAmount(payAmount);
      }

      setTokenSelectionOpen(false);
    },
    [
      currentSelection,
      toToken,
      fromToken,
      router,
      payAmount,
      calculateReceiveAmount,
      getCoinTypeFromAssetId,
      setTokenSelectionOpen
    ]
  );

  // Optimize Token swap processing
  const handleChangeTokens = useCallback(() => {
    if (fromToken && toToken) {
      const tempToken = { ...fromToken };
      setFromToken(toToken);
      setToToken(tempToken);

      // 更新URL - 使用 coinType
      const fromCoinType = getCoinTypeFromAssetId(toToken.id);
      const toCoinType = getCoinTypeFromAssetId(tempToken.id);

      if (fromCoinType && toCoinType) {
        router.push(`/swap/${fromCoinType}/${toCoinType}`);
      }

      // 如果有输入金额，重新计算
      if (payAmount) {
        setPayAmount('');
        setReceiveAmount('');
        setDollarValuePay(null);
        setDollarValueReceive(null);
      }
    }
  }, [fromToken, toToken, payAmount, router, setFromToken, setToToken, getCoinTypeFromAssetId]);

  // Redirect if wallet not connected
  useEffect(() => {
    if (!account?.address) {
      router.push('/'); // Redirect to home if no wallet connected
    }
  }, [account, router]);

  // Initialize Tokens
  useEffect(() => {
    const initializeTokens = async () => {
      setTokensState({ loading: true, error: null });
      try {
        // Make sure we have assets loaded before continuing
        if (assetsState.assetInfos.length === 0) {
          console.log('Waiting for assets to load...');
          return;
        }

        // Get coinType from URL params and decode them
        const fromCoinType = decodeURIComponent(params.fromToken);
        const toCoinType = decodeURIComponent(params.toToken);

        console.log('Looking for tokens with coinType:', { fromCoinType, toCoinType });

        // Get assetId from coinType
        const fromAssetId = getAssetIdFromCoinType(fromCoinType);
        const toAssetId = getAssetIdFromCoinType(toCoinType);

        console.log('Found assetIds:', { fromAssetId, toAssetId });

        // Find tokens by assetId
        const fromTokenInfo = fromAssetId
          ? assetsState.assetInfos.find((asset) => String(asset.assetId) === fromAssetId)
          : null;
        const toTokenInfo = toAssetId
          ? assetsState.assetInfos.find((asset) => String(asset.assetId) === toAssetId)
          : null;

        console.log('Found tokens:', { fromTokenInfo, toTokenInfo });

        if (fromTokenInfo) {
          const decimals = fromTokenInfo.metadata.decimals;
          const formattedBalance = formatBalance(fromTokenInfo.balance || '0', decimals);

          // Try to get logo from registry first
          const registryAsset = enrichedAssets?.find(
            (asset) => asset.metadata.assetId === String(fromTokenInfo.assetId)
          );

          const tokenData: Token = {
            id: String(fromTokenInfo.assetId),
            name: fromTokenInfo.metadata.name,
            symbol: fromTokenInfo.metadata.symbol,
            description: fromTokenInfo.metadata.description,
            decimals: decimals,
            iconUrl: registryAsset ? getLogoUrl(registryAsset) : fromTokenInfo.metadata.iconUrl,
            balance: formattedBalance
          };
          setFromToken(tokenData);
          setFromTokenBalance(formattedBalance);
        }

        if (toTokenInfo) {
          const decimals = toTokenInfo.metadata.decimals;
          const formattedBalance = formatBalance(toTokenInfo.balance || '0', decimals);

          // Try to get logo from registry first
          const registryAsset = enrichedAssets?.find(
            (asset) => asset.metadata.assetId === String(toTokenInfo.assetId)
          );

          const toTokenData: Token = {
            id: String(toTokenInfo.assetId),
            name: toTokenInfo.metadata.name,
            symbol: toTokenInfo.metadata.symbol,
            description: toTokenInfo.metadata.description,
            decimals: decimals,
            iconUrl: registryAsset ? getLogoUrl(registryAsset) : toTokenInfo.metadata.iconUrl,
            balance: formattedBalance
          };
          setToToken(toTokenData);
          setToTokenBalance(formattedBalance);
        }

        setTokensState({ loading: false, error: null });
        setIsTokensReady(!!fromTokenInfo && !!toTokenInfo);
      } catch (error) {
        console.error('Initializing token error:', error);
        setTokensState({
          loading: false,
          error: error instanceof Error ? error.message : 'Initializing token failed'
        });
      }
    };

    initializeTokens();
  }, [params.fromToken, params.toToken, assetsState.assetInfos, setFromToken, setToToken]);

  // Monitor token status
  useEffect(() => {
    if (fromToken?.id !== undefined && toToken?.id !== undefined) {
      setIsTokensReady(true);
    } else {
      setIsTokensReady(false);
    }
  }, [fromToken, toToken]);

  // Handle swap execution
  const handleSwapTokens = useCallback(async () => {
    if (
      fromToken?.id === undefined ||
      toToken?.id === undefined ||
      !account?.address ||
      !merakClient ||
      !dubheContract
    ) {
      toast.error('Please ensure tokens are selected and wallet is connected');
      return;
    }

    try {
      setIsSwapping(true);
      const tx = new Transaction();

      const paths = await merakClient.querySwapPaths(String(fromToken.id), String(toToken.id));
      if (!paths || paths.length === 0) {
        toast.error('No valid swap path found');
        return;
      }
      const path = paths[0];

      const amountIn = parseFloat(payAmount);
      if (isNaN(amountIn) || amountIn <= 0) {
        toast.error('Please enter a valid swap amount');
        return;
      }

      const amountInWithDecimals = BigInt(Math.floor(amountIn * 10 ** fromToken.decimals));

      // Check output amount before executing transaction
      const amountOutCheck = await merakClient.getAmountsOut(
        amountInWithDecimals,
        path.map(String)
      );
      if (!amountOutCheck?.[0]?.length) {
        throw new Error('Failed to get output amount');
      }

      const finalAmount = amountOutCheck[0][amountOutCheck[0].length - 1];
      if (BigInt(finalAmount) <= BigInt(0)) {
        toast.error('Insufficient liquidity');
        return;
      }

      // Add slippage calculation
      const slippagePercent = parseFloat(slippage) / 100;
      const minAmountOut = BigInt(Math.floor(Number(finalAmount) * (1 - slippagePercent)));

      await merakClient.swapExactTokensForTokens(
        tx,
        amountInWithDecimals,
        minAmountOut,
        path.map(String),
        account.address,
        true
      );

      await signAndExecuteTransaction(
        {
          transaction: tx.serialize(),
          chain: WALLETCHAIN
        },
        {
          onSuccess: async (result) => {
            // 等待链上数据更新
            await dubheContract.waitForTransaction(result.digest);

            // 重新加载用户资产 - React Query will auto-refetch
            // Note: This will be handled automatically by the useUserAssets hook
            // 更新当前代币的余额 (保持使用 registry logo)
            if (fromToken && toToken && assetsState.assetInfos) {
              const fromTokenInfo = assetsState.assetInfos.find(
                (asset) => asset.assetId === fromToken.id
              );
              const toTokenInfo = assetsState.assetInfos.find(
                (asset) => asset.assetId === toToken.id
              );

              if (fromTokenInfo) {
                const formattedBalance = formatBalance(
                  fromTokenInfo.balance || '0',
                  fromTokenInfo.metadata.decimals
                );
                setFromTokenBalance(formattedBalance);
                // Keep the registry logo from previous state
                setFromToken((prev) => ({
                  ...prev,
                  balance: formattedBalance
                }));
              }

              if (toTokenInfo) {
                const formattedBalance = formatBalance(
                  toTokenInfo.balance || '0',
                  toTokenInfo.metadata.decimals
                );
                setToTokenBalance(formattedBalance);
                // Keep the registry logo from previous state
                setToToken((prev) => ({
                  ...prev,
                  balance: formattedBalance
                }));
              }
            }

            toast.success('Swap Successful', {
              description: new Date().toUTCString(),
              action: {
                label: 'Check in Explorer',
                onClick: () =>
                  window.open(`https://testnet.suivision.xyz/txblock/${result.digest}`, '_blank')
              }
            });

            // Clear input after success
            setPayAmount('');
            setReceiveAmount('');
            setDollarValuePay(null);
            setDollarValueReceive(null);
            setIsSwapping(false);
          },
          onError: (error) => {
            toast.error('Insufficient liquidity for this trade');
            setIsSwapping(false);
          }
        }
      );
    } catch (error) {
      toast.error('Insufficient liquidity for this trade');
    }
  }, [
    fromToken,
    toToken,
    account,
    payAmount,
    slippage,
    merakClient,
    dubheContract,
    signAndExecuteTransaction,
    assetsState.assetInfos,
    setFromToken,
    setToToken,
    setFromTokenBalance,
    setToTokenBalance
  ]);

  // Loading state
  if (isAssetsLoading) {
    return (
      <div className="bg-[#F8F9FA] flex-1 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-md px-4 py-6 space-y-4">
          {/* Skeleton Swap Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header Skeleton */}
            <div className="px-6 py-5 border-b border-gray-50">
              <Skeleton className="h-8 w-24" />
            </div>

            {/* Content Skeleton */}
            <div className="p-6 space-y-4">
              {/* From Token Skeleton */}
              <div className="bg-[#F8F9FA] rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-28 rounded-xl" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>

              {/* Swap Arrow Skeleton */}
              <div className="flex justify-center relative">
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>

              {/* To Token Skeleton */}
              <div className="bg-[#F8F9FA] rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-28 rounded-xl" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>

              {/* Slippage Skeleton */}
              <div className="bg-[#F8F9FA] rounded-2xl border border-gray-100 p-4">
                <Skeleton className="h-7 w-full" />
              </div>
            </div>

            {/* Button Skeleton */}
            <div className="px-6 pb-6 pt-2">
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>

          {/* Loading Text */}
          <p className="text-center text-gray-500 text-sm animate-pulse">
            Loading swap interface...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (tokensState.error) {
    return (
      <div className="flex items-center justify-center flex-1 bg-[#F5F7FA]">
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <div className="bg-red-100 p-3 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600">{tokensState.error}</p>
            <Button
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() =>
                router.push(
                  '/swap/0000000000000000000000000000000000000000000000000000000000000002::sui::SUI/8c7013745af0eb1ab211cde05b40ee6e2130276664d7e3e3741a36f11fa9f20b::dubhe::DUBHE'
                )
              }
            >
              Return to Default Pair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FA] flex-1 flex items-center justify-center overflow-y-auto">
      <main className="w-full max-w-md px-4 py-6">
        {/* Preload token images using hidden img tags - browser will cache them */}
        <div style={{ display: 'none' }} aria-hidden="true">
          {fromToken?.iconUrl && <img src={fromToken.iconUrl} alt="" />}
          {toToken?.iconUrl && <img src={toToken.iconUrl} alt="" />}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50">
            <h1 className="text-xl font-semibold text-gray-800">Swap</h1>
            {exchangeRate && <div className="text-sm text-gray-500 mt-1">{exchangeRate}</div>}
          </div>

          <div className="p-6 space-y-4">
            {/* From Token */}
            <div className="bg-[#F8F9FA] rounded-2xl border border-gray-100 p-4 transition-all duration-200 hover:shadow-sm">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">You Pay</span>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">
                    Balance: <span className="font-medium">{fromTokenBalance}</span>{' '}
                    {fromToken?.symbol}
                  </span>
                  {/* 添加MAX按钮 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-6 px-2 text-xs text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => {
                      if (fromToken?.balance) {
                        setPayAmount(fromToken.balance);
                        calculateReceiveAmount(fromToken.balance);
                      }
                    }}
                  >
                    MAX
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Input
                  type="text"
                  value={payAmount}
                  placeholder="0.0"
                  className="text-3xl font-medium bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full no-focus-outline"
                  onChange={handleInputChangePay}
                />
                <Button
                  variant="outline"
                  className="ml-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:opacity-100 shadow-sm transition-all duration-200 hover:shadow-md px-3 py-2 h-auto flex items-center text-gray-900 hover:text-gray-900"
                  onClick={() => {
                    setCurrentSelection('from');
                    setTokenSelectionOpen(true);
                  }}
                >
                  {fromToken?.id !== undefined ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full overflow-hidden mr-2 flex-shrink-0 border border-gray-100 bg-white flex items-center justify-center">
                        <img
                          src={fromToken.iconUrl}
                          alt={fromToken.symbol}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                          }}
                        />
                      </div>
                      <span className="font-medium">{fromToken.symbol}</span>
                      <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-blue-50 mr-2 flex-shrink-0 flex items-center justify-center">
                        <span className="text-xs text-blue-500 font-medium">?</span>
                      </div>
                      <span className="text-gray-600">Select Token</span>
                      <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </Button>
              </div>
              <div className="text-sm text-gray-500 mt-1">{dollarValuePay || '$0.00'}</div>
            </div>

            {/* 交换按钮 - 调整z-index */}
            <div
              className="flex justify-center relative"
              style={{ zIndex: isTokenSelectionOpen ? 0 : 5 }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white border border-gray-200 shadow-sm hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 w-10 h-10 relative"
                onClick={handleChangeTokens}
              >
                <ArrowUpDown className="h-4 w-4 text-blue-500" />
              </Button>
            </div>

            {/* To Token */}
            <div className="bg-[#F8F9FA] rounded-2xl border border-gray-100 p-4 transition-all duration-200 hover:shadow-sm">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">You Receive</span>
                <span className="text-sm text-gray-500">
                  Balance: <span className="font-medium">{toTokenBalance}</span> {toToken?.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                {isCalculating ? (
                  <div className="flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-500" />
                    <span className="text-xl font-medium text-gray-400">Calculating...</span>
                  </div>
                ) : (
                  <Input
                    type="text"
                    value={receiveAmount}
                    placeholder="0.0"
                    className="text-3xl font-medium bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full no-focus-outline"
                    readOnly
                  />
                )}
                <Button
                  variant="outline"
                  className="ml-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:opacity-100 shadow-sm transition-all duration-200 hover:shadow-md px-3 py-2 h-auto flex items-center text-gray-900 hover:text-gray-900"
                  onClick={() => {
                    setCurrentSelection('to');
                    setTokenSelectionOpen(true);
                  }}
                >
                  {toToken?.id !== undefined ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full overflow-hidden mr-2 flex-shrink-0 border border-gray-100 bg-white flex items-center justify-center">
                        <img
                          src={toToken.iconUrl}
                          alt={toToken.symbol}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                          }}
                        />
                      </div>
                      <span className="font-medium">{toToken.symbol}</span>
                      <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-blue-50 mr-2 flex-shrink-0 flex items-center justify-center">
                        <span className="text-xs text-blue-500 font-medium">?</span>
                      </div>
                      <span className="text-gray-600">Select Token</span>
                      <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </Button>
              </div>
              <div className="text-sm text-gray-500 mt-1">{dollarValueReceive || '$0.00'}</div>
            </div>

            {/* 滑点设置 */}
            <div className="bg-[#F8F9FA] rounded-2xl border border-gray-100 p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600">Slippage Tolerance</span>
                  <div className="ml-1 group relative">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      Slippage tolerance is the maximum percentage of price movement allowed during
                      trade execution. Higher tolerance increases success rate but may result in
                      less favorable prices.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full">
                  {['0.10', '0.50', '1.00'].map((val) => (
                    <Button
                      key={val}
                      variant="ghost"
                      className={`h-7 px-3 rounded-full text-xs transition-all duration-200 ${
                        slippage === val
                          ? 'bg-white text-blue-600 font-medium shadow-sm hover:bg-white hover:text-blue-600'
                          : 'bg-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                      }`}
                      onClick={() => {
                        setSlippage(val);
                        setCustomSlippage('');
                      }}
                    >
                      {parseFloat(val)}%
                    </Button>
                  ))}
                  <Input
                    type="text"
                    inputMode="decimal"
                    pattern="^\\d*\\.?\\d*$"
                    min={0}
                    step={0.01}
                    placeholder="Custom"
                    value={customSlippage}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || /^\d*\.?\d*$/.test(v)) {
                        setCustomSlippage(v);
                        setSlippage(v);
                      }
                    }}
                    className="w-16 h-7 px-2 text-xs rounded-full border-none bg-white focus:ring-2 focus:ring-blue-200"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 按钮文本英文化 */}
          <div className="px-6 pb-6 pt-2">
            <Button
              className={`w-full h-12 rounded-xl font-medium text-base transition-all duration-200 ${
                !payAmount || isCalculating || !isTokensReady || isSwapping
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md active:scale-[0.99]'
              }`}
              disabled={!payAmount || isCalculating || !isTokensReady || isSwapping}
              onClick={handleSwapTokens}
            >
              {isSwapping ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Swapping...</span>
                </div>
              ) : isCalculating ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Calculating...</span>
                </div>
              ) : !isTokensReady ? (
                'Select Token'
              ) : !payAmount ? (
                'Enter Amount'
              ) : (
                'Swap'
              )}
            </Button>
          </div>
        </div>

        <TokenSelectionModal
          isOpen={isTokenSelectionOpen}
          onClose={() => setTokenSelectionOpen(false)}
          onSelectToken={handleSelectToken}
          selectionType={currentSelection}
          availableFromTokens={availableFromTokens}
          availableToTokens={availableToTokens}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
