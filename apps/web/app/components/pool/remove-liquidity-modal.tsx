'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { useMerak } from '@/app/jotai/merak';
import { Transaction } from '@0xobelisk/sui-client';
import { toast } from 'sonner';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
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

interface RemoveLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset1Id?: string;
  asset2Id?: string;
  lpTokenId?: string;
}

export default function RemoveLiquidityModal({
  isOpen,
  onClose,
  asset1Id,
  asset2Id,
  lpTokenId
}: RemoveLiquidityModalProps) {
  const account = useCurrentAccount();
  const merak = useMerak();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [tokenA, setTokenA] = useState<TokenData | null>(null);
  const [tokenB, setTokenB] = useState<TokenData | null>(null);
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [minAmountA, setMinAmountA] = useState('');
  const [minAmountB, setMinAmountB] = useState('');
  const [lpTokenBalance, setLpTokenBalance] = useState('0');
  const [lpTokenIdState, setLpTokenIdState] = useState<string | null>(null);

  const { data: userAssetsData } = useUserAssets();

  const allAssetsState = useMemo(
    () => ({
      assetInfos: userAssetsData?.data || []
    }),
    [userAssetsData]
  );

  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState('');

  const [estimatedAmountA, setEstimatedAmountA] = useState('');
  const [estimatedAmountB, setEstimatedAmountB] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Initialize tokens from props
  useEffect(() => {
    const loadTokensFromParams = async () => {
      if (
        !account?.address ||
        !allAssetsState?.assetInfos ||
        allAssetsState.assetInfos.length === 0
      ) {
        return;
      }

      if (!asset1Id || !asset2Id || !lpTokenId) {
        return;
      }

      try {
        const token1Info = allAssetsState.assetInfos.find((asset) => asset.assetId === asset1Id);
        const token2Info = allAssetsState.assetInfos.find((asset) => asset.assetId === asset2Id);

        if (!token1Info || !token2Info) {
          return;
        }

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

        setLpTokenIdState(lpTokenId);
      } catch (error) {
        console.error('Failed to load tokens from parameters:', error);
        toast.error('Failed to load token information');
      }
    };

    if (isOpen) {
      loadTokensFromParams();
    }
  }, [account?.address, allAssetsState.assetInfos, asset1Id, asset2Id, lpTokenId, isOpen]);

  // Query LP token balance
  useEffect(() => {
    async function fetchLpToken() {
      if (!tokenA || !tokenB || !account?.address || !merak || !lpTokenIdState) return;

      try {
        const lpBalance = await merak.balanceOf(lpTokenIdState, account.address);
        if (lpBalance) {
          const balance = Number(lpBalance.balance) / Math.pow(10, 9);
          setLpTokenBalance(balance.toFixed(9));
        } else {
          setLpTokenBalance('0');
        }
      } catch (error) {
        console.error('Failed to fetch LP token information:', error);
        toast.error('Failed to fetch LP token information');
      }
    }

    fetchLpToken();
  }, [tokenA, tokenB, account?.address, merak, lpTokenIdState]);

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

    let tx = new Transaction();

    const liquidity = BigInt(Math.floor(parseFloat(liquidityAmount) * Math.pow(10, 9)));
    const minAmountAValue = BigInt(
      Math.floor(parseFloat(minAmountA || '0') * Math.pow(10, tokenA.decimals))
    );
    const minAmountBValue = BigInt(
      Math.floor(parseFloat(minAmountB || '0') * Math.pow(10, tokenB.decimals))
    );

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
            toast('Liquidity Removed Successfully', {
              description: new Date().toUTCString(),
              action: {
                label: 'Check in Explorer',
                onClick: () =>
                  window.open(`https://testnet.suivision.xyz/txblock/${result.digest}`, '_blank')
              }
            });
            onClose();
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

  const handleMaxLiquidity = () => {
    setLiquidityAmount(lpTokenBalance);
  };

  const calculateEstimatedAmounts = useCallback(
    async (amount: string) => {
      if (
        !tokenA ||
        !tokenB ||
        !amount ||
        parseFloat(amount) <= 0 ||
        !lpTokenIdState ||
        !account?.address ||
        !merak
      ) {
        setEstimatedAmountA('');
        setEstimatedAmountB('');
        return;
      }

      try {
        const lpAmount = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, 9)));

        const supplyData = await merak.supplyOf(lpTokenIdState);
        if (!supplyData) {
          console.error('LP token supply not found');
          return;
        }

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
          poolAssetId: lpTokenIdState,
          poolSupply: Number(supplyData.supply),
          amount: lpAmount,
          metadataMap
        });

        if (estimates) {
          const formattedAmountA = estimates.amountA / Math.pow(10, tokenA.decimals);
          const formattedAmountB = estimates.amountB / Math.pow(10, tokenB.decimals);
          const amountA = formattedAmountA.toFixed(tokenA.decimals);
          const amountB = formattedAmountB.toFixed(tokenB.decimals);
          setEstimatedAmountA(amountA);
          setEstimatedAmountB(amountB);
        }
      } catch (error) {
        console.error('Failed to calculate estimated amounts:', error);
        toast.error('Failed to calculate output amounts');
      }
    },
    [tokenA, tokenB, lpTokenIdState, account?.address, merak]
  );

  useEffect(() => {
    calculateEstimatedAmounts(liquidityAmount);
  }, [liquidityAmount, calculateEstimatedAmounts]);

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

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-sui-blue-300 flex items-center justify-between bg-gradient-to-r from-sui-blue-100 to-sui-blue-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-sui-blue-900">Remove Liquidity</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 space-y-4 flex-shrink">
          {/* Token Pair Display */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">Token Pair</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-2.5">
                {tokenA && (
                  <div className="flex items-center space-x-2">
                    <img
                      src={tokenA.iconUrl}
                      alt={tokenA.symbol}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                      }}
                    />
                    <span className="font-semibold text-sm">{tokenA.symbol}</span>
                  </div>
                )}
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-2.5">
                {tokenB && (
                  <div className="flex items-center space-x-2">
                    <img
                      src={tokenB.iconUrl}
                      alt={tokenB.symbol}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                      }}
                    />
                    <span className="font-semibold text-sm">{tokenB.symbol}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LP Token Amount Input */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">Liquidity to Remove</Label>
            <div className="bg-gradient-to-br from-sui-blue-100/50 to-white border-2 border-sui-blue-300 rounded-lg p-3">
              <div className="flex justify-between items-center mb-1.5">
                <Label className="text-xs font-medium text-gray-700">LP Token Amount</Label>
                {tokenA && tokenB && (
                  <span className="text-xs text-gray-500">
                    Balance: <span className="font-medium">{lpTokenBalance}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={liquidityAmount}
                  onChange={(e) => setLiquidityAmount(e.target.value)}
                  placeholder="0.00"
                  className="text-lg font-semibold border-0 bg-transparent focus-visible:ring-0 p-0 h-auto"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMaxLiquidity}
                  className="bg-sui-blue-200 hover:bg-sui-blue-300 text-sui-blue-800 border-sui-blue-400 font-semibold text-xs h-7 px-2"
                >
                  MAX
                </Button>
              </div>
            </div>

            {/* Percentage Buttons */}
            {tokenA && tokenB && lpTokenBalance !== '0' && (
              <div className="flex gap-1.5">
                {[25, 50, 75, 100].map((percentage) => (
                  <Button
                    key={percentage}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const amount = (parseFloat(lpTokenBalance) * percentage) / 100;
                      setLiquidityAmount(amount.toFixed(9));
                    }}
                    className="flex-1 !bg-white hover:!bg-[#C0E6FF] hover:!border-[#4DA2FF] !border-gray-300 !text-gray-700 hover:!text-[#011829] h-7 text-xs transition-all duration-200"
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Expected Output Section */}
          {(estimatedAmountA || estimatedAmountB) && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">You Will Receive</Label>

              {estimatedAmountA && tokenA && (
                <div className="bg-gradient-to-br from-sui-blue-50/50 to-white border border-sui-blue-200 rounded-lg p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img
                        src={tokenA.iconUrl}
                        alt={tokenA.symbol}
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                        }}
                      />
                      <span className="text-xs font-medium text-gray-600">{tokenA.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{estimatedAmountA}</div>
                      <div className="text-xs text-gray-500">Min: {minAmountA}</div>
                    </div>
                  </div>
                </div>
              )}

              {estimatedAmountB && tokenB && (
                <div className="bg-gradient-to-br from-sui-blue-50/50 to-white border border-sui-blue-200 rounded-lg p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img
                        src={tokenB.iconUrl}
                        alt={tokenB.symbol}
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                        }}
                      />
                      <span className="text-xs font-medium text-gray-600">{tokenB.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{estimatedAmountB}</div>
                      <div className="text-xs text-gray-500">Min: {minAmountB}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Slippage Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">Slippage</Label>
            <div className="flex items-center space-x-1.5">
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
                      ? 'bg-gradient-to-r from-sui-blue-700 to-sui-blue-800 h-8 px-3 text-xs'
                      : 'h-8 px-3 text-xs'
                  }
                >
                  {val}%
                </Button>
              ))}
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
                className="h-8 text-xs w-16"
              />
              <span className="text-xs">%</span>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 border-t border-sui-blue-300 bg-sui-blue-100 flex-shrink-0">
          <Button
            onClick={handleRemoveLiquidity}
            className="w-full h-12 font-semibold bg-gradient-to-r from-sui-blue-700 to-sui-blue-800 hover:from-sui-blue-800 hover:to-sui-blue-900"
            disabled={!tokenA || !tokenB || !liquidityAmount || parseFloat(liquidityAmount) <= 0}
          >
            {!tokenA || !tokenB
              ? 'Loading Token Pair'
              : !liquidityAmount || parseFloat(liquidityAmount) <= 0
              ? 'Enter Amount'
              : 'Remove Liquidity'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
