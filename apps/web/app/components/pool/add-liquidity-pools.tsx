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
import { useAssetMetadata } from '@/app/hooks/useAssetMetadata';

interface TokenData {
  symbol: string;
  name: string;
  iconUrl: string;
  balance: string;
  id: string;
  decimals: number;
}

export default function AddLiquidity() {
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

  const router = useRouter();
  const searchParams = useSearchParams();

  // Use React Query hooks for data fetching with automatic caching
  const { data: userAssetsData, isLoading } = useUserAssets();

  // Memoize assets list for performance
  const assetsState = useMemo(
    () => ({
      assetInfos: userAssetsData?.data || []
    }),
    [userAssetsData]
  );

  const [slippage, setSlippage] = useState('0.50'); // Default 0.5%
  const [customSlippage, setCustomSlippage] = useState('');

  // Get LP asset ID from pool info
  const [lpAssetId, setLpAssetId] = useState<string | null>(null);

  // Use hook to fetch LP metadata (will be cached by React Query)
  const { data: lpMetadataResponse } = useAssetMetadata({
    assetId: lpAssetId || '',
    enabled: !!lpAssetId
  });

  const lpMetadata = lpMetadataResponse?.data;

  // Automatically calculate minimum deposit
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

  // Get pool reserve information
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
  }, [tokenPay, tokenReceive]);

  // Get reserve information when selecting tokens
  useEffect(() => {
    fetchReserves();
  }, [fetchReserves]);

  // Handle input amount changes
  const handleAmountPayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountPay(value);

    // If the pool has reserves, calculate the amount of the other token
    if (reserves && reserves.reservePay !== '0' && value) {
      const amountPayNum = parseFloat(value);
      const reservePayNum = parseFloat(reserves.reservePay) / Math.pow(10, tokenPay!.decimals);
      const reserveReceiveNum =
        parseFloat(reserves.reserveReceive) / Math.pow(10, tokenReceive!.decimals);

      // amountReceive = amountPay * (reserveReceive / reservePay)
      const calculatedAmountReceive = amountPayNum * (reserveReceiveNum / reservePayNum);
      setAmountReceive(calculatedAmountReceive.toFixed(tokenReceive!.decimals));
    }
  };

  const handleAmountReceiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountReceive(value);

    // If the pool has reserves, calculate the amount of the other token
    if (reserves && reserves.reserveReceive !== '0' && value) {
      const amountReceiveNum = parseFloat(value);
      const reservePay = parseFloat(reserves.reservePay) / Math.pow(10, tokenPay!.decimals);
      const reserveReceive =
        parseFloat(reserves.reserveReceive) / Math.pow(10, tokenReceive!.decimals);

      // amountPay = amountReceive * (reservePay / reserveReceive)
      const calculatedAmountPay = amountReceiveNum * (reservePay / reserveReceive);
      setAmountPay(calculatedAmountPay.toFixed(tokenPay!.decimals));
    }
  };

  const handleSelectTokenPay = async (token: TokenData) => {
    console.log(token, 'select token');
    setTokenPay(token);
    setIsTokenPayModalOpen(false);
    if (!merak) return;
    const connectedTokens = await merak.getConnectedTokens(token.id);
    console.log(connectedTokens, 'connectedTokens');
    setAvailableTokenReceives(connectedTokens);
    if (tokenReceive && !connectedTokens.includes(tokenReceive.id)) {
      setTokenReceive(null);
    }
  };

  const handleSelectTokenReceive = (token: TokenData) => {
    console.log(token, 'select receive token');
    setTokenReceive(token);
    setIsTokenReceiveModalOpen(false);
  };

  const handleAddLiquidity = async () => {
    if (!tokenPay || !tokenReceive) {
      toast.error('Please select both tokens');
      return;
    }

    // Check if user has sufficient balance
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

    console.log({
      tokenPayId: tokenPay.id,
      tokenReceiveId: tokenReceive.id,
      baseDesired,
      quoteDesired,
      baseMin,
      quoteMin,
      accountAddress: account.address
    });
    // const baseMin = BigInt(0);
    // const quoteMin = BigInt(0);
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
          console.log('executed transaction', result);
          toast('Transaction Successful', {
            description: new Date().toUTCString(),
            action: {
              label: 'Check in Explorer',
              onClick: () =>
                window.open(`https://testnet.suivision.xyz/txblock/${result.digest}`, '_blank')
            }
          });
          setDigest(result.digest);
          router.push('/pool');
        },
        onError: (error) => {
          console.log('executed transaction', error);
          toast.error('Transaction failed');
        }
      }
    );
  };

  const handleBack = () => {
    router.push('/pool');
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

      // Set LP asset ID to trigger metadata fetching via hook
      const currentLpAssetId = String(poolInfo.lpAsset);
      setLpAssetId(currentLpAssetId);

      // Wait for lpMetadata to be available (will be set by useAssetMetadata hook)
      // The actual calculation will be done in a useEffect that watches lpMetadata

      // Store pool info temporarily for calculation
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

  // Calculate LP tokens when metadata is available
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
        // Get supply from merak.supplyOf
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

        console.log(lpTokens, 'lpTokens');
        const formattedLPTokens = (lpTokens / Math.pow(10, lpMetadata.decimals)).toFixed(
          lpMetadata.decimals
        );
        console.log(formattedLPTokens, 'formattedLPTokens');
        setExpectedLPTokens(formattedLPTokens);

        // Clean up temp data
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

  // Recalculate LP token amount when input amounts change
  useEffect(() => {
    calculateExpectedLPTokens();
  }, [calculateExpectedLPTokens]);

  // Add logic to initialize tokens from URL parameters
  useEffect(() => {
    const loadTokensFromParams = async () => {
      if (!account?.address || assetsState.assetInfos.length === 0) return;

      const asset1Param = searchParams.get('asset1');
      const asset2Param = searchParams.get('asset2');

      // If necessary parameters are missing, redirect to pool page
      if (!asset1Param || !asset2Param) {
        router.push('/pool');
        return;
      }

      try {
        const asset1Id = String(asset1Param);
        const asset2Id = String(asset2Param);

        // Get token metadata
        const token1Info = assetsState.assetInfos.find((asset) => asset.assetId === asset1Id);
        const token2Info = assetsState.assetInfos.find((asset) => asset.assetId === asset2Id);

        if (!token1Info || !token2Info) {
          return;
        }

        // Set first token
        const token1: TokenData = {
          id: token1Info.assetId,
          name: token1Info.metadata.name || searchParams.get('token1Name') || 'Unknown',
          symbol: token1Info.metadata.symbol || 'Unknown',
          decimals: token1Info.metadata.decimals || 9,
          iconUrl:
            searchParams.get('token1Image') ||
            token1Info.metadata.iconUrl ||
            '/registry/sui/images/sui.svg',
          balance: (
            Number(token1Info.balance) / Math.pow(10, token1Info.metadata.decimals || 9)
          ).toFixed(4)
        };
        setTokenPay(token1);

        // Set second token
        const token2: TokenData = {
          id: token2Info.assetId,
          name: token2Info.metadata.name || searchParams.get('token2Name') || 'Unknown',
          symbol: token2Info.metadata.symbol || 'Unknown',
          decimals: token2Info.metadata.decimals || 9,
          iconUrl:
            searchParams.get('token2Image') ||
            token2Info.metadata.iconUrl ||
            '/registry/sui/images/sui.svg',
          balance: (
            Number(token2Info.balance) / Math.pow(10, token2Info.metadata.decimals || 9)
          ).toFixed(4)
        };
        setTokenReceive(token2);

        // Get available token list
        if (!merak) return;
        const connectedTokens = await merak.getConnectedTokens(token1.id);
        setAvailableTokenReceives(connectedTokens);
      } catch (error) {
        console.error('Failed to load tokens from URL parameters:', error);
        toast.error('Failed to load token information');
        router.push('/pool');
      }
    };

    loadTokensFromParams();
  }, [account?.address, assetsState.assetInfos, searchParams, router]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Add Liquidity</h1>
      </div>
      <p className="text-sm text-gray-500">
        Create a new pool or create a liquidity position on an existing pool.
      </p>

      <div className="space-y-6">
        <div>
          <Label>Tokens</Label>
          <p className="text-sm text-gray-500 mb-2">
            Select token pair which you like to add liquidity to.
          </p>
          <div className="flex space-x-2">
            <Button
              onClick={() => setIsTokenPayModalOpen(true)}
              className="w-full justify-between"
              variant="outline"
              disabled={!!searchParams.get('asset1')}
            >
              {tokenPay ? (
                <>
                  <img
                    src={tokenPay.iconUrl}
                    alt={tokenPay.symbol}
                    className="w-6 h-6 mr-2"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                    }}
                  />
                  {tokenPay.symbol}
                </>
              ) : (
                'Select token'
              )}
              {!searchParams.get('asset1') && <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
            <Button
              onClick={() => setIsTokenReceiveModalOpen(true)}
              className="w-full justify-between"
              variant="outline"
              disabled={!tokenPay || !!searchParams.get('asset2')}
            >
              {tokenReceive ? (
                <>
                  <img
                    src={tokenReceive.iconUrl}
                    alt={tokenReceive.symbol}
                    className="w-6 h-6 mr-2"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                    }}
                  />
                  {tokenReceive.symbol}
                </>
              ) : tokenPay ? (
                'Select token'
              ) : (
                'Select first token'
              )}
              {!searchParams.get('asset2') && <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>

        <div>
          <Label>Liquidity</Label>
          <p className="text-sm text-gray-500 mb-2">
            Enter the amount of tokens you wish to deposit for this position.
          </p>
          <div className="space-y-4">
            <div>
              <Label>{tokenPay ? tokenPay.symbol : ''} Amount</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={amountPay}
                  onChange={handleAmountPayChange}
                  placeholder="Enter amount"
                />
                <span className="text-sm font-medium">{tokenPay ? tokenPay.symbol : ''}</span>
              </div>
              {tokenPay && (
                <p className="text-sm text-gray-500 mt-1">
                  Balance: {tokenPay.balance} {tokenPay.symbol}
                </p>
              )}
            </div>
            <div>
              <Label>{tokenReceive ? tokenReceive.symbol : ''} Amount</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={amountReceive}
                  onChange={handleAmountReceiveChange}
                  placeholder="Enter amount"
                />
                <span className="text-sm font-medium">
                  {tokenReceive ? tokenReceive.symbol : ''}
                </span>
              </div>
              {tokenReceive && (
                <p className="text-sm text-gray-500 mt-1">
                  Balance: {tokenReceive.balance} {tokenReceive.symbol}
                </p>
              )}
            </div>
            {expectedLPTokens && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">
                  Expected LP tokens to receive: {expectedLPTokens}
                </p>
              </div>
            )}
            {tokenPay && tokenReceive && reserves && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {reserves.reservePay === '0' && reserves.reserveReceive === '0' ? (
                    'This is a new pool, you can set the initial price'
                  ) : (
                    <>
                      Current pool ratio: 1 {tokenPay.symbol} ={' '}
                      {(
                        (parseFloat(reserves.reserveReceive) / parseFloat(reserves.reservePay)) *
                        Math.pow(10, tokenPay.decimals - tokenReceive.decimals)
                      ).toFixed(6)}{' '}
                      {tokenReceive.symbol}
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <Label>Slippage</Label>
          <div className="flex items-center space-x-2 mt-2">
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

      <Button onClick={handleAddLiquidity} className="w-full">
        Add Liquidity
      </Button>

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
    </div>
  );
}
