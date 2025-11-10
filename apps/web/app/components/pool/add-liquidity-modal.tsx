'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import TokenSelectionModal from '@/app/components/swap/token-selection-modal';
import { useMerak } from '@/app/jotai/merak';
import { Transaction } from '@0xobelisk/sui-client';
import { toast } from 'sonner';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { WALLETCHAIN } from '@/app/constants';
import { useUserAssets } from '@/app/hooks/useUserAssets';
import { useAssetMetadata } from '@/app/hooks/useAssetMetadata';
import { useEnrichedAssets } from '@/app/hooks/useRegistryAssets';
import { getLogoUrl } from '@/app/types/registry';

interface TokenData {
  symbol: string;
  name: string;
  iconUrl: string;
  balance: string;
  id: string;
  decimals: number;
}

interface AddLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAsset1?: string;
  initialAsset2?: string;
}

export default function AddLiquidityModal({
  isOpen,
  onClose,
  initialAsset1,
  initialAsset2
}: AddLiquidityModalProps) {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const merak = useMerak();
  const [digest, setDigest] = useState('');
  const [tokenPay, setTokenPay] = useState<TokenData | null>(null);
  const [tokenReceive, setTokenReceive] = useState<TokenData | null>(null);
  const [amountPay, setAmountPay] = useState('');
  const [amountReceive, setAmountReceive] = useState('');
  const [minAmountPay, setMinAmountPay] = useState('');
  const [minAmountReceive, setMinAmountReceive] = useState('');
  const [expectedLPTokens, setExpectedLPTokens] = useState<string>('');

  const [isTokenPayModalOpen, setIsTokenPayModalOpen] = useState(false);
  const [isTokenReceiveModalOpen, setIsTokenReceiveModalOpen] = useState(false);

  const [availableTokenReceives, setAvailableTokenReceives] = useState<string[]>([]);
  const [reserves, setReserves] = useState<{ reservePay: string; reserveReceive: string } | null>(
    null
  );

  const { data: userAssetsData } = useUserAssets();

  const assetsState = useMemo(
    () => ({
      assetInfos: userAssetsData?.data || []
    }),
    [userAssetsData]
  );

  // Get enriched assets from registry for local logos
  const { data: enrichedAssets = [] } = useEnrichedAssets({ status: 'live' });

  const [slippage, setSlippage] = useState('0.50');
  const [customSlippage, setCustomSlippage] = useState('');

  const [lpAssetId, setLpAssetId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const { data: lpMetadataResponse } = useAssetMetadata({
    assetId: lpAssetId || '',
    enabled: !!lpAssetId
  });

  const lpMetadata = lpMetadataResponse?.data;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!amountPay || !amountReceive || !tokenPay || !tokenReceive) {
      setMinAmountPay('');
      setMinAmountReceive('');
      return;
    }
    const pay = parseFloat(amountPay);
    const receive = parseFloat(amountReceive);
    if (isNaN(pay) || pay <= 0 || isNaN(receive) || receive <= 0) {
      setMinAmountPay('');
      setMinAmountReceive('');
      return;
    }
    const slippageFactor = 1 - Number(slippage) / 100;
    setMinAmountPay((pay * slippageFactor).toFixed(tokenPay.decimals));
    setMinAmountReceive((receive * slippageFactor).toFixed(tokenReceive.decimals));
  }, [amountPay, amountReceive, tokenPay, tokenReceive, slippage]);

  const fetchReserves = useCallback(async () => {
    if (!tokenPay || !tokenReceive) {
      setReserves(null);
      return;
    }

    try {
      if (!merak) return;
      const poolInfo = await merak.getPoolListWithId({
        asset1Id: tokenPay.id,
        asset2Id: tokenReceive.id
      });

      if (!poolInfo) {
        setReserves(null);
        return;
      }

      const poolInfoValue = poolInfo;
      setReserves({
        reservePay: poolInfoValue.reserve0,
        reserveReceive: poolInfoValue.reserve1
      });
    } catch (error) {
      console.error('Failed to fetch reserves:', error);
      setReserves(null);
    }
  }, [tokenPay, tokenReceive, merak]);

  useEffect(() => {
    fetchReserves();
  }, [fetchReserves]);

  const handleAmountPayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountPay(value);

    if (reserves && reserves.reservePay !== '0' && value) {
      const amountPayNum = parseFloat(value);
      const reservePayNum = parseFloat(reserves.reservePay) / Math.pow(10, tokenPay!.decimals);
      const reserveReceiveNum =
        parseFloat(reserves.reserveReceive) / Math.pow(10, tokenReceive!.decimals);

      const calculatedAmountReceive = amountPayNum * (reserveReceiveNum / reservePayNum);
      setAmountReceive(calculatedAmountReceive.toFixed(tokenReceive!.decimals));
    }
  };

  const handleAmountReceiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountReceive(value);

    if (reserves && reserves.reserveReceive !== '0' && value) {
      const amountReceiveNum = parseFloat(value);
      const reservePay = parseFloat(reserves.reservePay) / Math.pow(10, tokenPay!.decimals);
      const reserveReceive =
        parseFloat(reserves.reserveReceive) / Math.pow(10, tokenReceive!.decimals);

      const calculatedAmountPay = amountReceiveNum * (reservePay / reserveReceive);
      setAmountPay(calculatedAmountPay.toFixed(tokenPay!.decimals));
    }
  };

  const handleSelectTokenPay = async (token: TokenData) => {
    setTokenPay(token);
    setIsTokenPayModalOpen(false);
    if (!merak) return;
    const connectedTokens = await merak.getConnectedTokens(token.id);
    setAvailableTokenReceives(connectedTokens);
    if (tokenReceive && !connectedTokens.includes(tokenReceive.id)) {
      setTokenReceive(null);
    }
  };

  const handleSelectTokenReceive = (token: TokenData) => {
    setTokenReceive(token);
    setIsTokenReceiveModalOpen(false);
  };

  const handleAddLiquidity = async () => {
    if (!tokenPay || !tokenReceive) {
      toast.error('Please select both tokens');
      return;
    }

    const payBalance = parseFloat(tokenPay.balance);
    const receiveBalance = parseFloat(tokenReceive.balance);
    const payAmount = parseFloat(amountPay);
    const receiveAmount = parseFloat(amountReceive);

    if (payAmount > payBalance) {
      toast.error(`Insufficient balance: Not enough ${payBalance} ${tokenPay.symbol} `);
      return;
    }

    if (receiveAmount > receiveBalance) {
      toast.error(`Insufficient balance: Not enough ${receiveBalance} ${tokenReceive.symbol} `);
      return;
    }

    if (!merak) return;
    let tx = new Transaction();

    const baseDesired = BigInt(Math.floor(parseFloat(amountPay) * Math.pow(10, tokenPay.decimals)));
    const quoteDesired = BigInt(
      Math.floor(parseFloat(amountReceive) * Math.pow(10, tokenReceive.decimals))
    );
    const baseMin = BigInt(
      Math.floor(parseFloat(minAmountPay || '0') * Math.pow(10, tokenPay.decimals))
    );
    const quoteMin = BigInt(
      Math.floor(parseFloat(minAmountReceive || '0') * Math.pow(10, tokenReceive.decimals))
    );

    await merak.addLiquidity(
      tx,
      tokenPay.id,
      tokenReceive.id,
      baseDesired,
      quoteDesired,
      baseMin,
      quoteMin,
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
          toast('Transaction Successful', {
            description: new Date().toUTCString(),
            action: {
              label: 'Check in Explorer',
              onClick: () =>
                window.open(`https://testnet.suivision.xyz/txblock/${result.digest}`, '_blank')
            }
          });
          setDigest(result.digest);
          onClose();
        },
        onError: (error) => {
          console.log('executed transaction', error);
          toast.error('Transaction failed');
        }
      }
    );
  };

  const calculateExpectedLPTokens = useCallback(async () => {
    if (!tokenPay || !tokenReceive || !amountPay || !amountReceive) {
      setExpectedLPTokens('');
      setLpAssetId(null);
      return;
    }

    try {
      if (!merak) return;
      const poolInfo = await merak.getPoolListWithId({
        asset1Id: tokenPay.id,
        asset2Id: tokenReceive.id
      });

      if (!poolInfo) {
        setExpectedLPTokens('');
        setLpAssetId(null);
        return;
      }

      const currentLpAssetId = String(poolInfo.lpAsset);
      setLpAssetId(currentLpAssetId);

      (window as any).__tempPoolInfo = {
        poolInfo,
        lpAssetId: currentLpAssetId
      };
    } catch (error) {
      console.error('Failed to calculate expected LP tokens:', error);
      setExpectedLPTokens('');
      setLpAssetId(null);
    }
  }, [tokenPay, tokenReceive, amountPay, amountReceive, merak]);

  useEffect(() => {
    const doCalculation = async () => {
      if (
        !lpMetadata ||
        !lpAssetId ||
        !tokenPay ||
        !tokenReceive ||
        !amountPay ||
        !amountReceive ||
        !merak
      ) {
        return;
      }

      const tempData = (window as any).__tempPoolInfo;
      if (!tempData || tempData.lpAssetId !== lpAssetId) {
        return;
      }

      const { poolInfo } = tempData;

      try {
        const lpSupply = await merak.supplyOf(lpAssetId);
        if (!lpSupply) {
          console.error('Failed to get LP token supply');
          setExpectedLPTokens('');
          return;
        }

        const reserveA = parseFloat(poolInfo.reserve0);
        const reserveB = parseFloat(poolInfo.reserve1);
        const totalSupply = parseFloat(lpSupply.supply);

        const amountA = parseFloat(amountPay) * Math.pow(10, tokenPay.decimals);
        const amountB = parseFloat(amountReceive) * Math.pow(10, tokenReceive.decimals);

        let lpTokens: number;
        if (reserveA === 0 && reserveB === 0) {
          lpTokens = Math.sqrt(amountA * amountB);
        } else {
          lpTokens = Math.min(
            (amountA * totalSupply) / reserveA,
            (amountB * totalSupply) / reserveB
          );
        }

        const formattedLPTokens = (lpTokens / Math.pow(10, lpMetadata.decimals)).toFixed(
          lpMetadata.decimals
        );
        setExpectedLPTokens(formattedLPTokens);

        if ((window as any).__tempPoolInfo) {
          delete (window as any).__tempPoolInfo;
        }
      } catch (error) {
        console.error('Failed to calculate LP tokens:', error);
        setExpectedLPTokens('');
      }
    };

    doCalculation();
  }, [lpMetadata, lpAssetId, tokenPay, tokenReceive, amountPay, amountReceive, merak]);

  useEffect(() => {
    calculateExpectedLPTokens();
  }, [calculateExpectedLPTokens]);

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

  useEffect(() => {
    const loadTokensFromParams = async () => {
      if (!account?.address || assetsState.assetInfos.length === 0) return;
      if (!initialAsset1 || !initialAsset2) return;

      try {
        const asset1Id = String(initialAsset1);
        const asset2Id = String(initialAsset2);

        const token1Info = assetsState.assetInfos.find((asset) => asset.assetId === asset1Id);
        const token2Info = assetsState.assetInfos.find((asset) => asset.assetId === asset2Id);

        if (!token1Info || !token2Info) {
          return;
        }

        // Find matching registry assets for local logos
        const registryAsset1 = enrichedAssets.find(
          (asset) => asset.metadata.assetId === token1Info.assetId
        );
        const registryAsset2 = enrichedAssets.find(
          (asset) => asset.metadata.assetId === token2Info.assetId
        );

        const token1: TokenData = {
          id: token1Info.assetId,
          name: token1Info.metadata.name || 'Unknown',
          symbol: token1Info.metadata.symbol || 'Unknown',
          decimals: token1Info.metadata.decimals || 9,
          iconUrl: registryAsset1 ? getLogoUrl(registryAsset1) : '/registry/sui/images/sui.svg',
          balance: (
            Number(token1Info.balance) / Math.pow(10, token1Info.metadata.decimals || 9)
          ).toFixed(4)
        };
        setTokenPay(token1);

        const token2: TokenData = {
          id: token2Info.assetId,
          name: token2Info.metadata.name || 'Unknown',
          symbol: token2Info.metadata.symbol || 'Unknown',
          decimals: token2Info.metadata.decimals || 9,
          iconUrl: registryAsset2 ? getLogoUrl(registryAsset2) : '/registry/sui/images/sui.svg',
          balance: (
            Number(token2Info.balance) / Math.pow(10, token2Info.metadata.decimals || 9)
          ).toFixed(4)
        };
        setTokenReceive(token2);

        if (!merak) return;
        const connectedTokens = await merak.getConnectedTokens(token1.id);
        setAvailableTokenReceives(connectedTokens);
      } catch (error) {
        console.error('Failed to load tokens from parameters:', error);
        toast.error('Failed to load token information');
      }
    };

    if (isOpen) {
      loadTokensFromParams();
    }
  }, [
    account?.address,
    assetsState.assetInfos,
    initialAsset1,
    initialAsset2,
    isOpen,
    merak,
    enrichedAssets
  ]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
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
          <div className="p-4 border-b border-sui-blue-200 flex items-center justify-between bg-gradient-to-r from-sui-blue-50 to-sui-blue-100 flex-shrink-0">
            <h2 className="text-xl font-bold text-sui-blue-800">Add Liquidity</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto p-4 space-y-4 flex-shrink">
            {/* Token Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">Select Token Pair</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setIsTokenPayModalOpen(true)}
                  className="h-auto py-2.5 px-3 justify-start bg-gradient-to-br from-gray-50 to-gray-100 hover:from-sui-blue-50 hover:to-sui-blue-100 border-2 border-gray-200 hover:border-sui-blue-400 transition-all duration-200"
                  variant="outline"
                  disabled={!!initialAsset1}
                >
                  <div className="flex items-center space-x-2 w-full">
                    {tokenPay ? (
                      <>
                        <img
                          src={tokenPay.iconUrl}
                          alt={tokenPay.symbol}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                          }}
                        />
                        <span className="font-semibold text-sm truncate">{tokenPay.symbol}</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">Select</span>
                    )}
                  </div>
                </Button>
                <Button
                  onClick={() => setIsTokenReceiveModalOpen(true)}
                  className="h-auto py-2.5 px-3 justify-start bg-gradient-to-br from-gray-50 to-gray-100 hover:from-sui-blue-50 hover:to-sui-blue-100 border-2 border-gray-200 hover:border-sui-blue-400 transition-all duration-200"
                  variant="outline"
                  disabled={!tokenPay || !!initialAsset2}
                >
                  <div className="flex items-center space-x-2 w-full">
                    {tokenReceive ? (
                      <>
                        <img
                          src={tokenReceive.iconUrl}
                          alt={tokenReceive.symbol}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                          }}
                        />
                        <span className="font-semibold text-sm truncate">
                          {tokenReceive.symbol}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">{tokenPay ? 'Select' : 'First'}</span>
                    )}
                  </div>
                </Button>
              </div>
            </div>

            {/* Amount Inputs */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">Deposit Amounts</Label>

              <div className="bg-gradient-to-br from-sui-blue-50/50 to-white border-2 border-sui-blue-200 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    {tokenPay ? tokenPay.symbol : 'Token A'}
                  </Label>
                  {tokenPay && (
                    <span className="text-xs text-gray-500">
                      Bal: <span className="font-medium">{tokenPay.balance}</span>
                    </span>
                  )}
                </div>
                <Input
                  type="text"
                  value={amountPay}
                  onChange={handleAmountPayChange}
                  placeholder="0.00"
                  className="text-lg font-semibold border-0 bg-transparent focus-visible:ring-0 p-0 h-auto"
                />
              </div>

              <div className="bg-gradient-to-br from-sui-blue-50/50 to-white border-2 border-sui-blue-200 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    {tokenReceive ? tokenReceive.symbol : 'Token B'}
                  </Label>
                  {tokenReceive && (
                    <span className="text-xs text-gray-500">
                      Bal: <span className="font-medium">{tokenReceive.balance}</span>
                    </span>
                  )}
                </div>
                <Input
                  type="text"
                  value={amountReceive}
                  onChange={handleAmountReceiveChange}
                  placeholder="0.00"
                  className="text-lg font-semibold border-0 bg-transparent focus-visible:ring-0 p-0 h-auto"
                />
              </div>
            </div>

            {/* Info Cards */}
            {expectedLPTokens && (
              <div className="bg-gradient-to-br from-sui-blue-50 to-sui-blue-100 border border-sui-blue-300 rounded-lg p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-sui-blue-900">
                    Expected LP Tokens
                  </span>
                  <span className="text-sm font-bold text-sui-blue-700">{expectedLPTokens}</span>
                </div>
              </div>
            )}

            {tokenPay && tokenReceive && reserves && (
              <div className="bg-gradient-to-br from-sui-blue-50 to-sui-blue-100 border border-sui-blue-200 rounded-lg p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-sui-blue-800">Pool Ratio</span>
                  <span className="text-xs text-sui-blue-700 font-medium">
                    {reserves.reservePay === '0' && reserves.reserveReceive === '0' ? (
                      'New Pool'
                    ) : (
                      <>
                        1 {tokenPay.symbol} ≈{' '}
                        {(
                          (parseFloat(reserves.reserveReceive) / parseFloat(reserves.reservePay)) *
                          Math.pow(10, tokenPay.decimals - tokenReceive.decimals)
                        ).toFixed(6)}{' '}
                        {tokenReceive.symbol}
                      </>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Slippage */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">Slippage</Label>
              <div className="flex items-center space-x-1.5">
                {['0.10', '0.50', '1.00'].map((val) => (
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
                        ? 'bg-gradient-to-r from-sui-blue-600 to-sui-blue-700 h-8 px-3 text-xs'
                        : 'h-8 px-3 text-xs'
                    }
                  >
                    {parseFloat(val)}%
                  </Button>
                ))}
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Custom"
                  value={customSlippage}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '' || /^\d*\.?\d*$/.test(v)) {
                      setCustomSlippage(v);
                      setSlippage(v);
                    }
                  }}
                  className="h-8 text-xs w-16"
                />
                <span className="text-xs">%</span>
              </div>
            </div>
          </div>

          {/* Footer Button */}
          <div className="p-4 border-t border-sui-blue-200 bg-sui-blue-50 flex-shrink-0">
            <Button
              onClick={handleAddLiquidity}
              className="w-full h-12 font-semibold bg-gradient-to-r from-sui-blue-600 to-sui-blue-700 hover:from-sui-blue-700 hover:to-sui-blue-800"
              disabled={!tokenPay || !tokenReceive || !amountPay || !amountReceive}
            >
              {!tokenPay || !tokenReceive
                ? 'Select Tokens'
                : !amountPay || !amountReceive
                ? 'Enter Amounts'
                : 'Add Liquidity'}
            </Button>
          </div>
        </div>
      </div>

      <TokenSelectionModal
        isOpen={isTokenPayModalOpen}
        onClose={() => setIsTokenPayModalOpen(false)}
        onSelectToken={handleSelectTokenPay}
        selectionType="from"
      />
      <TokenSelectionModal
        isOpen={isTokenReceiveModalOpen}
        onClose={() => setIsTokenReceiveModalOpen(false)}
        onSelectToken={handleSelectTokenReceive}
        selectionType="to"
        availableTokenIds={availableTokenReceives}
      />
    </>
  );

  return createPortal(modalContent, document.body);
}
