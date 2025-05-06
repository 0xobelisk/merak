'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { TokenSelectionOpen } from '@/app/jotai/swap/swap';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { ChevronDown, ArrowUpDown, Loader2, Info } from 'lucide-react';
import TokenSelectionModal from '@/app/components/swap/token-selection-modal';
import { Transaction } from '@0xobelisk/sui-client';
import debounce from 'lodash/debounce';
import { initMerakClient } from '@/app/jotai/merak';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { toast } from 'sonner';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { fromTokenAtom, toTokenAtom, type Token } from '@/app/jotai/swap/tokens';
import { WALLETCHAIN } from '@/app/constants';
import { AssetsStateAtom, AssetsLoadingAtom } from '@/app/jotai/assets';
import { AssetInfo } from '@0xobelisk/merak-sdk';
import { initDubheClient } from '@/app/jotai/dubhe';

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

  // UI states
  const [isTokenSelectionOpen, setTokenSelectionOpen] = useAtom(TokenSelectionOpen);
  const [currentSelection, setCurrentSelection] = useState<'from' | 'to'>('from');
  const [slippage, setSlippage] = useState('1.00');

  // Data states
  const [assetsState, setAssetsState] = useAtom(AssetsStateAtom);
  const [isAssetsLoading, setIsAssetsLoading] = useAtom(AssetsLoadingAtom);
  const [filteredAssets, setFilteredAssets] = useState(assetsState.assetInfos);
  const [availableToTokens, setAvailableToTokens] = useState<AssetInfo[]>([]);
  const [availableFromTokens, setAvailableFromTokens] = useState<AssetInfo[]>([]);
  const [exchangeRate, setExchangeRate] = useState<string | null>(null);

  // Amount states
  const [payAmount, setPayAmount] = useState<string>('');
  const [receiveAmount, setReceiveAmount] = useState<string>('');
  const [dollarValuePay, setDollarValuePay] = useState<string | null>(null);
  const [dollarValueReceive, setDollarValueReceive] = useState<string | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

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
      console.log('=========');
      console.log(amount, 'amount');
      if (!amount || parseFloat(amount) <= 0) {
        console.log('========= 0');
        return null;
      }
      console.log('========= 1');
      console.log(fromToken, 'fromToken');
      console.log(toToken, 'toToken');
      console.log(fromToken.id, 'fromToken.id');
      console.log(toToken.id, 'toToken.id');
      console.log(!fromToken?.id || !toToken?.id, '!fromToken?.id || !toToken?.id');

      if (fromToken?.id === undefined || toToken?.id === undefined) {
        console.log('========= 2');
        throw new Error('Please select tokens first');
      }
      if (!fromToken.decimals) {
        throw new Error('Token decimals undefined');
      }

      try {
        const merak = initMerakClient();

        // 1. Get swap path
        const paths = await merak.querySwapPaths(fromToken.id, toToken.id);
        if (!paths?.length) {
          throw new Error('No valid swap path found');
        }

        // 2. Calculate input amount (with decimals)
        const amountWithDecimals = BigInt(
          Math.floor(parseFloat(amount) * 10 ** fromToken.decimals)
        );

        // 3. Get output amount
        const amountsOut = await merak.getAmountsOut(amountWithDecimals, paths[0]);
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
    [fromToken, toToken]
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
    async (fromTokenId: number) => {
      try {
        setIsLoading(true);
        const merak = initMerakClient();
        const availableToTokens = await merak.getAllSwappableTokensWithMetadata({
          startTokenId: fromTokenId,
          address: account?.address
        });
        console.log('========= in fetchAvailableToTokens');
        console.log({
          startTokenId: fromTokenId,
          address: account?.address
        });
        console.log(availableToTokens, 'availableToTokens');
        if (availableToTokens.length > 0) {
          setToToken({
            id: availableToTokens[0].assetId,
            name: availableToTokens[0].metadata.name,
            symbol: availableToTokens[0].metadata.symbol,
            description: availableToTokens[0].metadata.description,
            decimals: availableToTokens[0].metadata.decimals,
            icon_url: availableToTokens[0].metadata.icon_url,
            balance: availableToTokens[0].balance
          });
          console.log(toToken, 'toToken');
        }
        setAvailableToTokens(availableToTokens);
        setAvailableFromTokens(filteredAssets);
      } catch (error) {
        console.error('Error fetching available swap paths:', error);
        toast.error('Failed to fetch available swap paths');
      } finally {
        setIsLoading(false);
      }
    },
    [assetsState.assetInfos]
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
      if (currentSelection === 'from') {
        // Check if same as target token
        if (toToken?.id === token.id) {
          // If same, swap the tokens
          setFromToken(token);
          setToToken(fromToken);
          router.push(`/swap/${token.id}/${fromToken.id}`);
        } else {
          setFromToken(token);
          router.push(`/swap/${token.id}/${toToken?.id || params.toToken}`);
        }
        // Clear previous toToken list when selecting new fromToken
        setAvailableToTokens([]);
      } else {
        // Check if same as source token
        if (fromToken?.id === token.id) {
          // If same, swap the tokens
          setToToken(token);
          setFromToken(toToken);
          router.push(`/swap/${toToken.id}/${token.id}`);
        } else {
          setToToken(token);
          router.push(`/swap/${fromToken?.id || params.fromToken}/${token.id}`);
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
      params.fromToken,
      params.toToken,
      router,
      payAmount,
      calculateReceiveAmount
    ]
  );

  // Optimize Token swap processing
  const handleChangeTokens = useCallback(() => {
    if (fromToken && toToken) {
      const tempToken = { ...fromToken };
      setFromToken(toToken);
      setToToken(tempToken);

      // 更新URL
      router.push(`/swap/${toToken.id}/${tempToken.id}`);

      // 如果有输入金额，重新计算
      if (payAmount) {
        setPayAmount('');
        setReceiveAmount('');
        setDollarValuePay(null);
        setDollarValueReceive(null);
      }
    }
  }, [fromToken, toToken, payAmount, router, setFromToken, setToToken]);

  // Add this function - Similar to the portfolio page
  const loadUserAssets = useCallback(async () => {
    if (!account?.address) return;

    try {
      setIsAssetsLoading(true);
      const merak = initMerakClient();

      const metadataResults = await merak.listOwnedAssetsInfo({
        address: account.address
      });

      // Update state with user's assets
      setAssetsState({
        assetInfos: metadataResults.data
      });

      console.log('Loaded user assets:', metadataResults.data);
    } catch (error) {
      console.error('Error querying assets:', error);
      toast.error('Failed to fetch assets');
    } finally {
      setIsAssetsLoading(false);
    }
  }, [account?.address, setAssetsState, setIsAssetsLoading]);

  // Add this effect - Load assets when the page loads
  useEffect(() => {
    if (account?.address) {
      loadUserAssets();
    } else {
      router.push('/'); // Redirect to home if no wallet connected
    }
  }, [account, router, loadUserAssets]);

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

        const fromTokenId = Number(params.fromToken);
        const toTokenId = Number(params.toToken);

        const fromTokenInfo = assetsState.assetInfos.find((asset) => asset.assetId === fromTokenId);
        const toTokenInfo = assetsState.assetInfos.find((asset) => asset.assetId === toTokenId);

        if (fromTokenInfo) {
          const decimals = fromTokenInfo.metadata.decimals;
          const formattedBalance = formatBalance(fromTokenInfo.balance || '0', decimals);
          const tokenData: Token = {
            id: Number(fromTokenInfo.assetId),
            name: fromTokenInfo.metadata.name,
            symbol: fromTokenInfo.metadata.symbol,
            description: fromTokenInfo.metadata.description,
            decimals: decimals,
            icon_url: fromTokenInfo.metadata.icon_url,
            balance: formattedBalance
          };
          setFromToken(tokenData);
          setFromTokenBalance(formattedBalance);
        }

        if (toTokenInfo) {
          const decimals = toTokenInfo.metadata.decimals;
          const formattedBalance = formatBalance(toTokenInfo.balance || '0', decimals);
          const toTokenData: Token = {
            id: Number(toTokenInfo.assetId),
            name: toTokenInfo.metadata.name,
            symbol: toTokenInfo.metadata.symbol,
            description: toTokenInfo.metadata.description,
            decimals: decimals,
            icon_url: toTokenInfo.metadata.icon_url,
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
    if (fromToken?.id === undefined || toToken?.id === undefined || !account?.address) {
      toast.error('Please ensure tokens are selected and wallet is connected');
      return;
    }

    try {
      const merak = initMerakClient();
      const tx = new Transaction();

      const paths = await merak.querySwapPaths(fromToken.id, toToken.id);
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
      const amountOutCheck = await merak.getAmountsOut(amountInWithDecimals, path);
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

      await merak.swapExactTokensForTokens(
        tx,
        amountInWithDecimals,
        minAmountOut,
        path,
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
            const dubhe = initDubheClient();
            await dubhe.waitForIndexerTransaction(result.digest);

            // 重新加载用户资产
            const metadataResults = await merak.listOwnedAssetsInfo({
              address: account.address
            });

            // Update state with user's assets
            setAssetsState({
              assetInfos: metadataResults.data
            });
            // 更新当前代币的余额
            if (fromToken && toToken) {
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
          },
          onError: (error) => {
            toast.error('Insufficient liquidity for this trade');
          }
        }
      );
    } catch (error) {
      toast.error('Insufficient liquidity for this trade');
    }
  }, [fromToken, toToken, account, payAmount, slippage, signAndExecuteTransaction]);

  // Loading state
  if (isAssetsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F7FA]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500 font-medium">Loading assets...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (tokensState.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F7FA]">
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
              onClick={() => router.push('/swap/1/2')}
            >
              Return to Default Pair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FA] min-h-screen flex items-center justify-center">
      <main className="w-full max-w-md px-4 py-8">
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
                    className="ml-1 h-6 px-2 text-xs text-blue-500 hover:bg-blue-50"
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
                  className="ml-2 rounded-full border border-gray-200 hover:bg-gray-50 shadow-sm transition-all duration-200 hover:shadow-md px-3 py-2 h-auto flex items-center"
                  onClick={() => {
                    setCurrentSelection('from');
                    setTokenSelectionOpen(true);
                  }}
                >
                  {fromToken?.id !== undefined ? (
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full overflow-hidden mr-2 flex-shrink-0 border border-gray-100 bg-white">
                        <img
                          src={fromToken.icon_url}
                          alt={fromToken.symbol}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://hop.ag/tokens/SUI.svg';
                          }}
                        />
                      </div>
                      <span className="font-medium">{fromToken.symbol}</span>
                      <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-blue-50 mr-2 flex-shrink-0 flex items-center justify-center">
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
                  className="ml-2 rounded-full border border-gray-200 hover:bg-gray-50 shadow-sm transition-all duration-200 hover:shadow-md px-3 py-2 h-auto flex items-center"
                  onClick={() => {
                    setCurrentSelection('to');
                    setTokenSelectionOpen(true);
                  }}
                >
                  {toToken?.id !== undefined ? (
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full overflow-hidden mr-2 flex-shrink-0 border border-gray-100 bg-white">
                        <img
                          src={toToken.icon_url}
                          alt={toToken.symbol}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://hop.ag/tokens/SUI.svg';
                          }}
                        />
                      </div>
                      <span className="font-medium">{toToken.symbol}</span>
                      <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-blue-50 mr-2 flex-shrink-0 flex items-center justify-center">
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
                  <Button
                    variant="ghost"
                    className={`h-7 px-3 rounded-full text-xs transition-all duration-200 ${
                      slippage === '0.50'
                        ? 'bg-white text-blue-600 font-medium shadow-sm'
                        : 'bg-transparent text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setSlippage('0.50')}
                  >
                    0.5%
                  </Button>
                  <Button
                    variant="ghost"
                    className={`h-7 px-3 rounded-full text-xs transition-all duration-200 ${
                      slippage === '1.00'
                        ? 'bg-white text-blue-600 font-medium shadow-sm'
                        : 'bg-transparent text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setSlippage('1.00')}
                  >
                    1.0%
                  </Button>
                  <Button
                    variant="ghost"
                    className={`h-7 px-3 rounded-full text-xs transition-all duration-200 ${
                      slippage === '2.00'
                        ? 'bg-white text-blue-600 font-medium shadow-sm'
                        : 'bg-transparent text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setSlippage('2.00')}
                  >
                    2.0%
                  </Button>
                  <Button
                    variant="ghost"
                    className={`h-7 px-3 rounded-full text-xs transition-all duration-200 ${
                      slippage === '3.00'
                        ? 'bg-white text-blue-600 font-medium shadow-sm'
                        : 'bg-transparent text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setSlippage('3.00')}
                  >
                    3.0%
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 按钮文本英文化 */}
          <div className="px-6 pb-6 pt-2">
            <Button
              className={`w-full h-12 rounded-xl font-medium text-base transition-all duration-200 ${
                !payAmount || isCalculating || !isTokensReady
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md active:scale-[0.99]'
              }`}
              disabled={!payAmount || isCalculating || !isTokensReady}
              onClick={handleSwapTokens}
            >
              {isCalculating ? (
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
