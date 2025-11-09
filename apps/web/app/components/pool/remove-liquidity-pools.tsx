import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import dynamic from 'next/dynamic';
import TokenSelectionModal from '@/app/components/swap/token-selection-modal';
import { useMerak } from '@/app/jotai/merak';
import { Transaction, TransactionArgument } from '@0xobelisk/sui-client';
import { toast } from 'sonner';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter, useSearchParams } from 'next/navigation';
import { WALLETCHAIN } from '@/app/constants';
import { useUserAssets } from '@/app/hooks/useUserAssets';

interface TokenData {
  symbol: string;
  name: string;
  iconUrl: string;
  balance: string;
  id: string;
  decimals: number;
}

export default function RemoveLiquidity() {
  const account = useCurrentAccount();
  const merak = useMerak();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [digest, setDigest] = useState('');
  const [tokenA, setTokenA] = useState<TokenData | null>(null);
  const [tokenB, setTokenB] = useState<TokenData | null>(null);
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [minAmountA, setMinAmountA] = useState('');
  const [minAmountB, setMinAmountB] = useState('');
  const [lpTokenBalance, setLpTokenBalance] = useState('0');
  const [lpTokenId, setLpTokenId] = useState<string | null>(null);

  const [isTokenAModalOpen, setIsTokenAModalOpen] = useState(false);
  const [isTokenBModalOpen, setIsTokenBModalOpen] = useState(false);

  const [availableTokenBs, setAvailableTokenBs] = useState<string[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Use React Query hooks for data fetching with automatic caching
  const { data: userAssetsData, isLoading } = useUserAssets();

  // Memoize assets list for performance
  const allAssetsState = useMemo(
    () => ({
      assetInfos: userAssetsData?.data || []
    }),
    [userAssetsData]
  );

  const [slippage, setSlippage] = useState(0.5); // Slippage, percentage
  const [customSlippage, setCustomSlippage] = useState('');

  const [estimatedAmountA, setEstimatedAmountA] = useState('');
  const [estimatedAmountB, setEstimatedAmountB] = useState('');

  // Initialize tokens from URL parameters
  useEffect(() => {
    const loadTokensFromParams = async () => {
      if (
        !account?.address ||
        !allAssetsState?.assetInfos ||
        allAssetsState.assetInfos.length === 0
      ) {
        console.log('Waiting for assets to load...');
        return;
      }

      const asset1Param = searchParams.get('asset1');
      const asset2Param = searchParams.get('asset2');
      const lpTokenIdParam = searchParams.get('lpTokenId');

      // If required parameters are missing, redirect to positions page
      if (!asset1Param || !asset2Param || !lpTokenIdParam) {
        toast.error('Missing required parameters');
        router.push('/positions');
        return;
      }

      try {
        const asset1Id = asset1Param;
        const asset2Id = asset2Param;
        const lpTokenId = lpTokenIdParam;
        // Get token metadata
        const token1Info = allAssetsState.assetInfos.find((asset) => asset.assetId === asset1Id);
        const token2Info = allAssetsState.assetInfos.find((asset) => asset.assetId === asset2Id);
        console.log(asset1Id, asset2Id, 'asset1Id, asset2Id');
        console.log(token1Info, token2Info, 'token1Info, token2Info');
        console.log(!token1Info || !token2Info, '!token1Info || !token2Info');
        if (!token1Info || !token2Info) {
          return;
        }
        // Set first token
        const token1: TokenData = {
          id: token1Info.assetId,
          name: token1Info.metadata.name || 'Unknown',
          symbol: token1Info.metadata.symbol || 'Unknown',
          decimals: token1Info.metadata.decimals || 9,
          iconUrl: token1Info.metadata.iconUrl || '/registry/sui/images/sui.svg',
          balance: (
            Number(token1Info.balance) / Math.pow(10, token1Info.metadata.decimals || 9)
          ).toFixed(4)
        };
        setTokenA(token1);

        // Set second token
        const token2: TokenData = {
          id: token2Info.assetId,
          name: token2Info.metadata.name || 'Unknown',
          symbol: token2Info.metadata.symbol || 'Unknown',
          decimals: token2Info.metadata.decimals || 9,
          iconUrl: token2Info.metadata.iconUrl || '/registry/sui/images/sui.svg',
          balance: (
            Number(token2Info.balance) / Math.pow(10, token2Info.metadata.decimals || 9)
          ).toFixed(4)
        };
        setTokenB(token2);

        // Set LP token ID
        setLpTokenId(lpTokenId);

        // Get available token list
        if (!merak) return;
        const connectedTokens = await merak.getConnectedTokens(token1.id);
        setAvailableTokenBs(connectedTokens);
      } catch (error) {
        console.error('Failed to load tokens from URL parameters:', error);
        toast.error('Failed to load token information');
        router.push('/positions');
      }
    };

    loadTokensFromParams();
  }, [account?.address, allAssetsState.assetInfos, searchParams, router, merak]);

  // Query LP token balance when tokens are selected
  useEffect(() => {
    async function fetchLpToken() {
      console.log(tokenA, tokenB, 'tokenA, tokenB');

      console.log(!tokenA || !tokenB || !account?.address);

      if (!tokenA || !tokenB || !account?.address || !merak) return;

      try {
        console.log(allAssetsState.assetInfos, 'allAssetsState.assetInfos');
        console.log(lpTokenId, 'lpTokenId');
        const lpBalance = await merak.balanceOf(lpTokenId, account.address);
        console.log(lpBalance, 'lpBalance');
        if (lpBalance) {
          setLpTokenId(lpTokenId);
          const balance = Number(lpBalance.balance) / Math.pow(10, 9);
          setLpTokenBalance(balance.toFixed(9));
        } else {
          // If we can't find an exact match, try to query the balance directly
          // This is a fallback in case the token symbol naming doesn't follow the expected pattern
          try {
            // This assumes we know the LP token ID from some other source (e.g. URL params)
            const lpTokenIdFromParams = searchParams.get('lpTokenId');

            if (lpTokenIdFromParams) {
              const tokenId = lpTokenIdFromParams;
              setLpTokenId(tokenId);

              const lpBalance = await merak.balanceOf(tokenId, account.address);

              if (lpBalance) {
                const lpDecimals = 9; // Assumption
                const formattedBalance = (
                  Number(lpBalance.balance) / Math.pow(10, lpDecimals)
                ).toFixed(4);
                setLpTokenBalance(formattedBalance);
              } else {
                setLpTokenBalance('0');
              }
            }
          } catch (error) {
            console.error('Failed to get LP token by ID:', error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch LP token information:', error);
        toast.error('Failed to fetch LP token information');
      }
    }

    fetchLpToken();
  }, [tokenA, tokenB, account?.address, allAssetsState.assetInfos, searchParams, merak, lpTokenId]);

  const handleSelectTokenA = async (token: TokenData) => {
    console.log(token, 'select token A');
    setTokenA(token);
    setIsTokenAModalOpen(false);
    if (!merak) return;
    const connectedTokens = await merak.getConnectedTokens(token.id);
    console.log(connectedTokens, 'connectedTokens');
    setAvailableTokenBs(connectedTokens);
    if (tokenB && !connectedTokens.includes(tokenB.id)) {
      setTokenB(null);
    }
  };

  const handleSelectTokenB = (token: TokenData) => {
    console.log(token, 'select token B');
    setTokenB(token);
    setIsTokenBModalOpen(false);
  };

  const handleRemoveLiquidity = async () => {
    if (!tokenA || !tokenB) {
      toast.error('Please select both tokens');
      return;
    }

    if (!liquidityAmount || parseFloat(liquidityAmount) <= 0) {
      toast.error('Please enter a valid liquidity amount');
      return;
    }

    if (!merak || !account?.address) {
      toast.error('Wallet not connected');
      return;
    }

    console.log('Remove liquidity');
    let tx = new Transaction();

    console.log(tokenA, tokenB);

    // Convert amounts to blockchain format (accounting for decimals)
    const liquidity = BigInt(Math.floor(parseFloat(liquidityAmount) * Math.pow(10, 9))); // LP token decimals
    const minAmountAValue = BigInt(
      Math.floor(parseFloat(minAmountA || '0') * Math.pow(10, tokenA.decimals))
    );
    const minAmountBValue = BigInt(
      Math.floor(parseFloat(minAmountB || '0') * Math.pow(10, tokenB.decimals))
    );
    console.log('============');
    console.log({
      tokenA: tokenA.id,
      tokenB: tokenB.id,
      liquidity,
      minAmountAValue,
      minAmountBValue,
      accountAddress: account.address
    });

    try {
      await merak.removeLiquidity(
        tx,
        tokenA.id,
        tokenB.id,
        liquidity,
        minAmountAValue,
        minAmountBValue,
        account.address,
        true
      );

      await signAndExecuteTransaction(
        {
          transaction: tx.serialize(),
          chain: WALLETCHAIN
        },
        {
          onSuccess: (result) => {
            console.log('executed transaction', result);
            toast('Liquidity Removed Successfully', {
              description: new Date().toUTCString(),
              action: {
                label: 'Check in Explorer',
                onClick: () =>
                  window.open(`https://testnet.suivision.xyz/txblock/${result.digest}`, '_blank')
              }
            });
            setDigest(result.digest);

            // Note: React Query will auto-refetch user assets
            router.push('/positions');
          },
          onError: (error) => {
            console.log('transaction error', error);
            toast.error('Transaction failed');
          }
        }
      );
    } catch (error) {
      console.error('Failed to remove liquidity:', error);
      toast.error('Failed to remove liquidity');
    }
  };

  const handleBack = () => {
    router.push('/positions');
  };

  // Set max liquidity
  const handleMaxLiquidity = () => {
    setLiquidityAmount(lpTokenBalance);
  };

  // Calculate estimated output amounts
  const calculateEstimatedAmounts = useCallback(
    async (amount: string) => {
      if (
        !tokenA ||
        !tokenB ||
        !amount ||
        parseFloat(amount) <= 0 ||
        !lpTokenId ||
        !account?.address ||
        !merak
      ) {
        setEstimatedAmountA('');
        setEstimatedAmountB('');
        return;
      }

      try {
        const lpAmount = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, 9))); // LP token decimals

        // Get the total supply of LP token
        const supplyData = await merak.supplyOf(lpTokenId);
        if (!supplyData) {
          console.error('LP token supply not found');
          return;
        }

        // Create metadata map from already loaded token data to avoid redundant queries
        const metadataMap = new Map();
        if (tokenA && tokenB) {
          metadataMap.set(tokenA.id, {
            assetId: tokenA.id,
            assetType: '',
            name: tokenA.name,
            symbol: tokenA.symbol,
            description: '',
            decimals: tokenA.decimals,
            iconUrl: tokenA.iconUrl,
            owner: '',
            status: '',
            isMintable: false,
            isBurnable: false,
            isFreezable: false,
            isDeleted: false,
            createdAtTimestampMs: '',
            updatedAtTimestampMs: '',
            lastUpdateDigest: '',
            nodeId: ''
          });
          metadataMap.set(tokenB.id, {
            assetId: tokenB.id,
            assetType: '',
            name: tokenB.name,
            symbol: tokenB.symbol,
            description: '',
            decimals: tokenB.decimals,
            iconUrl: tokenB.iconUrl,
            owner: '',
            status: '',
            isMintable: false,
            isBurnable: false,
            isFreezable: false,
            isDeleted: false,
            createdAtTimestampMs: '',
            updatedAtTimestampMs: '',
            lastUpdateDigest: '',
            nodeId: ''
          });
        }

        const estimates = await merak.calRemoveLpAmount({
          address: account.address,
          poolAssetId: lpTokenId,
          poolSupply: Number(supplyData.supply),
          amount: lpAmount,
          metadataMap // Pass cached metadata to avoid redundant queries
        });

        console.log(estimates, 'estimates');

        if (estimates) {
          // Format the amounts by dividing by decimals
          const formattedAmountA = estimates.amountA / Math.pow(10, tokenA.decimals);
          const formattedAmountB = estimates.amountB / Math.pow(10, tokenB.decimals);
          const amountA = formattedAmountA.toFixed(tokenA.decimals);
          const amountB = formattedAmountB.toFixed(tokenB.decimals);
          console.log(amountA, amountB, 'amountA, amountB');
          console.log(estimates, 'estimates');
          setEstimatedAmountA(amountA);
          setEstimatedAmountB(amountB);
        }
      } catch (error) {
        console.error('Failed to calculate estimated amounts:', error);
        toast.error('Failed to calculate output amounts');
      }
    },
    [tokenA, tokenB, lpTokenId, account?.address, merak]
  );

  // Calculate estimated output when input amount changes
  useEffect(() => {
    calculateEstimatedAmounts(liquidityAmount);
  }, [liquidityAmount, calculateEstimatedAmounts]);

  // Modify automatic logic to calculate minimum output
  useEffect(() => {
    if (!estimatedAmountA || !estimatedAmountB || !tokenA || !tokenB) {
      setMinAmountA('');
      setMinAmountB('');
      return;
    }

    const slippageFactor = 1 - Number(slippage) / 100;
    const minA = (parseFloat(estimatedAmountA) * slippageFactor).toFixed(tokenA.decimals);
    const minB = (parseFloat(estimatedAmountB) * slippageFactor).toFixed(tokenB.decimals);

    setMinAmountA(minA);
    setMinAmountB(minB);
  }, [estimatedAmountA, estimatedAmountB, tokenA, tokenB, slippage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sui-blue-50 via-white to-sui-blue-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-white/80 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-sui-blue-800">Remove Liquidity</h1>
            <p className="text-sm text-gray-500 mt-1">
              Withdraw your liquidity and receive tokens back
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Token Pair Display */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-900">Token Pair</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setIsTokenAModalOpen(true)}
                  className="h-auto py-4 px-4 justify-start bg-gradient-to-br from-gray-50 to-gray-100 hover:from-sui-blue-100 hover:to-sui-blue-200 border-2 border-gray-200 hover:border-sui-blue-400 transition-all duration-200"
                  variant="outline"
                  disabled={!!searchParams.get('asset1')}
                >
                  <div className="flex items-center space-x-3 w-full">
                    {tokenA ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border-2 border-gray-200">
                          <img
                            src={tokenA.iconUrl}
                            alt={tokenA.symbol}
                            className="w-7 h-7 rounded-full"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                            }}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-gray-900">{tokenA.symbol}</div>
                          <div className="text-xs text-gray-500">{tokenA.name}</div>
                        </div>
                        {!searchParams.get('asset1') && (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-lg">?</span>
                        </div>
                        <span className="text-gray-500 flex-1 text-left">Select token</span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </>
                    )}
                  </div>
                </Button>
                <Button
                  onClick={() => setIsTokenBModalOpen(true)}
                  className="h-auto py-4 px-4 justify-start bg-gradient-to-br from-gray-50 to-gray-100 hover:from-sui-blue-100 hover:to-sui-blue-200 border-2 border-gray-200 hover:border-sui-blue-400 transition-all duration-200"
                  variant="outline"
                  disabled={!tokenA || !!searchParams.get('asset2')}
                >
                  <div className="flex items-center space-x-3 w-full">
                    {tokenB ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border-2 border-gray-200">
                          <img
                            src={tokenB.iconUrl}
                            alt={tokenB.symbol}
                            className="w-7 h-7 rounded-full"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                            }}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-gray-900">{tokenB.symbol}</div>
                          <div className="text-xs text-gray-500">{tokenB.name}</div>
                        </div>
                        {!searchParams.get('asset2') && (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-lg">?</span>
                        </div>
                        <span className="text-gray-500 flex-1 text-left">
                          {tokenA ? 'Select token' : 'Select first token'}
                        </span>
                        {tokenA && <ChevronDown className="h-4 w-4 text-gray-400" />}
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </div>

            {/* LP Token Amount Input */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-900">Liquidity to Remove</Label>
              <div className="bg-gradient-to-br from-sui-blue-100/50 to-white border-2 border-sui-blue-300 rounded-xl p-4 transition-all duration-200 hover:shadow-md">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium text-gray-700">LP Token Amount</Label>
                  {tokenA && tokenB && (
                    <span className="text-xs text-gray-500">
                      Balance: <span className="font-medium text-gray-700">{lpTokenBalance}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={liquidityAmount}
                    onChange={(e) => setLiquidityAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-2xl font-semibold border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMaxLiquidity}
                    className="bg-red-100 hover:bg-red-200 text-red-700 border-red-300 font-semibold"
                  >
                    MAX
                  </Button>
                </div>
              </div>

              {/* Percentage Buttons */}
              {tokenA && tokenB && lpTokenBalance !== '0' && (
                <div className="flex gap-2">
                  {[25, 50, 75, 100].map((percentage) => (
                    <Button
                      key={percentage}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const amount = (parseFloat(lpTokenBalance) * percentage) / 100;
                        setLiquidityAmount(amount.toFixed(9));
                      }}
                      className="flex-1 !bg-white hover:!bg-[#C0E6FF] hover:!border-[#4DA2FF] !border-gray-300 !text-gray-700 hover:!text-[#011829] transition-all duration-200"
                    >
                      {percentage}%
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Expected Output Section */}
            {(estimatedAmountA || estimatedAmountB) && (
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-900">You Will Receive</Label>

                {/* Token A Output */}
                {estimatedAmountA && tokenA && (
                  <div className="bg-gradient-to-br from-sui-blue-50/50 to-white border-2 border-sui-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border-2 border-gray-200">
                          <img
                            src={tokenA.iconUrl}
                            alt={tokenA.symbol}
                            className="w-7 h-7 rounded-full"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                            }}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600">{tokenA.symbol}</div>
                          <div className="text-xs text-gray-500">Expected</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">{estimatedAmountA}</div>
                        <div className="text-xs text-gray-500">Min: {minAmountA}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Token B Output */}
                {estimatedAmountB && tokenB && (
                  <div className="bg-gradient-to-br from-sui-blue-50/50 to-white border-2 border-sui-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border-2 border-gray-200">
                          <img
                            src={tokenB.iconUrl}
                            alt={tokenB.symbol}
                            className="w-7 h-7 rounded-full"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                            }}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600">{tokenB.symbol}</div>
                          <div className="text-xs text-gray-500">Expected</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">{estimatedAmountB}</div>
                        <div className="text-xs text-gray-500">Min: {minAmountB}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Slippage Section */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-900">Slippage Tolerance</Label>
              <div className="flex items-center space-x-2">
                {[0.1, 0.5, 1].map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant={slippage === val ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSlippage(val);
                      setCustomSlippage('');
                    }}
                    className={
                      slippage === val
                        ? 'bg-gradient-to-r from-sui-blue-700 to-sui-blue-800 hover:from-sui-blue-800 hover:to-sui-blue-900 shadow-md'
                        : 'hover:bg-gray-100 border-2'
                    }
                  >
                    {val}%
                  </Button>
                ))}
                <div className="flex items-center space-x-1 flex-1">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Custom"
                    value={customSlippage}
                    onChange={(e) => {
                      setCustomSlippage(e.target.value);
                      setSlippage(Number(e.target.value) || 0);
                    }}
                    className="h-9 text-sm border-2 focus-visible:ring-2 focus-visible:ring-red-500"
                  />
                  <span className="text-sm text-gray-500 font-medium">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-6 pt-0">
            <Button
              onClick={handleRemoveLiquidity}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-sui-blue-700 to-sui-blue-800 hover:from-sui-blue-800 hover:to-sui-blue-900 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!tokenA || !tokenB || !liquidityAmount || parseFloat(liquidityAmount) <= 0}
            >
              {!tokenA || !tokenB
                ? 'Select Token Pair'
                : !liquidityAmount || parseFloat(liquidityAmount) <= 0
                ? 'Enter Amount'
                : 'Remove Liquidity'}
            </Button>
          </div>
        </div>
      </div>

      <TokenSelectionModal
        isOpen={isTokenAModalOpen}
        onClose={() => setIsTokenAModalOpen(false)}
        onSelectToken={handleSelectTokenA}
        selectionType="from"
      />
      <TokenSelectionModal
        isOpen={isTokenBModalOpen}
        onClose={() => setIsTokenBModalOpen(false)}
        onSelectToken={handleSelectTokenB}
        selectionType="to"
        availableTokenIds={availableTokenBs}
      />
    </div>
  );
}
