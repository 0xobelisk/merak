import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import TokenSelectionModal from '@/app/components/swap/token-selection-modal';
import { initMerakClient } from '@/app/jotai/merak';
import { Transaction, TransactionArgument } from '@0xobelisk/sui-client';
import { toast } from 'sonner';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter, useSearchParams } from 'next/navigation';
import { WALLETCHAIN } from '@/app/constants';
import { useAtom } from 'jotai';
import { AssetsStateAtom, AssetsLoadingAtom } from '@/app/jotai/assets';

interface TokenData {
  symbol: string;
  name: string;
  icon_url: string;
  balance: string;
  id: number;
  decimals: number;
}

export default function RemoveLiquidity() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [digest, setDigest] = useState('');
  const [tokenA, setTokenA] = useState<TokenData | null>(null);
  const [tokenB, setTokenB] = useState<TokenData | null>(null);
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [minAmountA, setMinAmountA] = useState('');
  const [minAmountB, setMinAmountB] = useState('');
  const [lpTokenBalance, setLpTokenBalance] = useState('0');
  const [lpTokenId, setLpTokenId] = useState<number | null>(null);

  const [isTokenAModalOpen, setIsTokenAModalOpen] = useState(false);
  const [isTokenBModalOpen, setIsTokenBModalOpen] = useState(false);

  const [availableTokenBs, setAvailableTokenBs] = useState<number[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Global state management with Jotai
  const [assetsState, setAssetsState] = useAtom(AssetsStateAtom);
  const [isLoading, setIsLoading] = useAtom(AssetsLoadingAtom);

  const [slippage, setSlippage] = useState(0.5); // 滑点，百分比
  const [customSlippage, setCustomSlippage] = useState('');

  const [estimatedAmountA, setEstimatedAmountA] = useState('');
  const [estimatedAmountB, setEstimatedAmountB] = useState('');

  /**
   * Query asset list
   * Get account information and asset metadata
   */
  const queryAssets = useCallback(async () => {
    if (!account?.address) return;

    try {
      setIsLoading(true);
      const merak = initMerakClient();

      const metadataResults = await merak.listOwnedAssetsInfo({
        address: account.address
      });

      console.log(metadataResults, 'metadataResults');

      // Update state
      setAssetsState({
        assetInfos: metadataResults.data
      });

      console.log('Retrieved assets:', metadataResults.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      toast.error('Failed to fetch assets, please try again');
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, setAssetsState]);

  // Initialize asset loading
  useEffect(() => {
    console.log(account, 'account');
    if (account?.address) {
      queryAssets();
      console.log('assetsState', assetsState);
    }
  }, [account?.address, queryAssets]);

  // Initialize tokens from URL parameters
  useEffect(() => {
    const loadTokensFromParams = async () => {
      if (!account?.address || assetsState.assetInfos.length === 0) return;

      const asset1Param = searchParams.get('asset1');
      const asset2Param = searchParams.get('asset2');
      const lpTokenIdParam = searchParams.get('lpTokenId');
      console.log('============================================');
      console.log('searchParams', searchParams);
      console.log(
        asset1Param,
        asset2Param,
        lpTokenIdParam,
        'asset1Param, asset2Param, lpTokenIdParam'
      );

      // 如果 URL 中有 token 参数，则自动选择这些 token
      if (asset1Param && asset2Param) {
        try {
          const asset1Id = Number(asset1Param);
          const asset2Id = Number(asset2Param);

          // 获取 token 元数据
          const token1Info = assetsState.assetInfos.find((asset) => asset.assetId === asset1Id);
          const token2Info = assetsState.assetInfos.find((asset) => asset.assetId === asset2Id);

          if (token1Info) {
            const token1: TokenData = {
              id: token1Info.assetId,
              name: token1Info.metadata.name || 'Unknown',
              symbol: token1Info.metadata.symbol || 'Unknown',
              decimals: token1Info.metadata.decimals || 9,
              icon_url: token1Info.metadata.icon_url || 'https://hop.ag/tokens/SUI.svg',
              balance: (
                Number(token1Info.balance) / Math.pow(10, token1Info.metadata.decimals || 9)
              ).toFixed(4)
            };
            setTokenA(token1);
          }

          if (token2Info) {
            const token2: TokenData = {
              id: token2Info.assetId,
              name: token2Info.metadata.name || 'Unknown',
              symbol: token2Info.metadata.symbol || 'Unknown',
              decimals: token2Info.metadata.decimals || 9,
              icon_url: token2Info.metadata.icon_url || 'https://hop.ag/tokens/SUI.svg',
              balance: (
                Number(token2Info.balance) / Math.pow(10, token2Info.metadata.decimals || 9)
              ).toFixed(4)
            };
            setTokenB(token2);
          }

          // 设置 LP token ID
          if (lpTokenIdParam) {
            setLpTokenId(Number(lpTokenIdParam));
          }
        } catch (error) {
          console.error('Failed to load tokens from URL parameters:', error);
          toast.error('Failed to load token information');
        }
      }
    };

    loadTokensFromParams();
  }, [account?.address, assetsState.assetInfos, searchParams]);

  // Query LP token balance when tokens are selected
  useEffect(() => {
    console.log(searchParams, 'searchParams');
    async function fetchLpToken() {
      if (!tokenA || !tokenB || !account?.address) return;

      try {
        const merak = initMerakClient();

        // Simplified approach: just look for LP tokens in the user's assets
        // that match the token pair we're interested in
        const userLpTokens = assetsState.assetInfos.filter((asset) => {
          // Check if it's an LP token by examining the symbol (usually contains a hyphen for pair tokens)
          const symbol = asset.metadata.symbol || '';
          return symbol.includes('-') || symbol.includes('/');
        });

        // Try to match an LP token with both tokenA and tokenB symbols
        const matchedLpToken = userLpTokens.find((token) => {
          const symbol = token.metadata.symbol || '';
          return (
            (symbol.includes(tokenA.symbol) && symbol.includes(tokenB.symbol)) ||
            // Also check for reversed order
            (symbol.includes(tokenB.symbol) && symbol.includes(tokenA.symbol))
          );
        });

        console.log(matchedLpToken, 'matchedLpToken');

        if (matchedLpToken) {
          setLpTokenId(matchedLpToken.assetId);
          const balance =
            Number(matchedLpToken.balance) / Math.pow(10, matchedLpToken.metadata.decimals || 9);
          setLpTokenBalance(balance.toFixed(4));
        } else {
          // If we can't find an exact match, try to query the balance directly
          // This is a fallback in case the token symbol naming doesn't follow the expected pattern
          try {
            // This assumes we know the LP token ID from some other source (e.g. URL params)
            const lpTokenIdFromParams = searchParams.get('lpTokenId');

            if (lpTokenIdFromParams) {
              const tokenId = Number(lpTokenIdFromParams);
              setLpTokenId(tokenId);

              const lpBalance = await merak.balanceOf(tokenId, account.address);

              if (lpBalance && lpBalance[0]) {
                const lpDecimals = 9; // Assumption
                const formattedBalance = (Number(lpBalance[0]) / Math.pow(10, lpDecimals)).toFixed(
                  4
                );
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
  }, [tokenA, tokenB, account?.address, assetsState.assetInfos, searchParams]);

  const handleSelectTokenA = async (token: TokenData) => {
    console.log(token, 'select token A');
    setTokenA(token);
    setIsTokenAModalOpen(false);
    const merak = initMerakClient();
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

    console.log('Remove liquidity');
    const merak = initMerakClient();
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

            // Refresh LP token balance
            queryAssets();
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

  // 计算预估输出金额
  const calculateEstimatedAmounts = useCallback(
    async (amount: string) => {
      if (
        !tokenA ||
        !tokenB ||
        !amount ||
        parseFloat(amount) <= 0 ||
        !lpTokenId ||
        !account?.address
      ) {
        setEstimatedAmountA('');
        setEstimatedAmountB('');
        return;
      }

      try {
        const merak = initMerakClient();
        const lpAmount = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, 9))); // LP token decimals

        const estimates = await merak.calRemoveLpAmount({
          address: account.address,
          poolAssetId: lpTokenId,
          amount: lpAmount
        });

        console.log(estimates, 'estimates');

        if (estimates) {
          const amountA = estimates.formattedAmountA.toFixed(tokenA.decimals);
          const amountB = estimates.formattedAmountB.toFixed(tokenB.decimals);
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
    [tokenA, tokenB, lpTokenId, account?.address]
  );

  // 当输入金额变化时计算预估输出
  useEffect(() => {
    calculateEstimatedAmounts(liquidityAmount);
  }, [liquidityAmount, calculateEstimatedAmounts]);

  // 修改自动计算最小输出的逻辑
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
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Remove Liquidity</h1>
      </div>
      <p className="text-sm text-gray-500">Remove liquidity from a pool and receive tokens back.</p>

      <div className="space-y-6">
        <div>
          <Label>Token Pair</Label>
          <p className="text-sm text-gray-500 mb-2">
            {searchParams.get('asset1') && searchParams.get('asset2')
              ? 'Selected token pair for removing liquidity.'
              : "Select token pair from which you'd like to remove liquidity."}
          </p>
          <div className="flex space-x-2">
            <Button
              onClick={() => setIsTokenAModalOpen(true)}
              className="w-full justify-between"
              variant="outline"
              disabled={!!searchParams.get('asset1')} // 如果 URL 中有 token 参数，禁用选择按钮
            >
              {tokenA ? (
                <>
                  <img
                    src={tokenA.icon_url}
                    alt={tokenA.symbol}
                    className="w-6 h-6 mr-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://hop.ag/tokens/SUI.svg';
                    }}
                  />
                  {tokenA.symbol}
                </>
              ) : (
                'Select token'
              )}
              {!searchParams.get('asset1') && <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
            <Button
              onClick={() => setIsTokenBModalOpen(true)}
              className="w-full justify-between"
              variant="outline"
              disabled={!tokenA || !!searchParams.get('asset2')} // 如果 URL 中有 token 参数，禁用选择按钮
            >
              {tokenB ? (
                <>
                  <img
                    src={tokenB.icon_url}
                    alt={tokenB.symbol}
                    className="w-6 h-6 mr-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://hop.ag/tokens/SUI.svg';
                    }}
                  />
                  {tokenB.symbol}
                </>
              ) : tokenA ? (
                'Select token'
              ) : (
                'Select first token'
              )}
              {!searchParams.get('asset2') && <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>

        <div>
          <Label>Liquidity Amount</Label>
          <p className="text-sm text-gray-500 mb-2">
            Enter the amount of liquidity tokens you wish to remove.
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                value={liquidityAmount}
                onChange={(e) => setLiquidityAmount(e.target.value)}
                placeholder="Enter amount"
                className="flex-grow"
              />
              <Button variant="outline" size="sm" onClick={handleMaxLiquidity}>
                MAX
              </Button>
            </div>
            {tokenA && tokenB && (
              <p className="text-sm text-gray-500">LP Token Balance: {lpTokenBalance}</p>
            )}
          </div>
        </div>

        <div>
          <Label>Minimum Receive Amounts</Label>
          <p className="text-sm text-gray-500 mb-2">
            Set the minimum amount of tokens you're willing to receive when removing liquidity.
          </p>
          <div className="space-y-4">
            <div>
              <Label>Minimum {tokenA ? tokenA.symbol : ''} Amount</Label>
              <div className="flex items-center space-x-2">
                <Input type="text" value={minAmountA} disabled placeholder="0.0" />
                <span className="text-sm font-medium">{tokenA ? tokenA.symbol : ''}</span>
              </div>
              {estimatedAmountA && (
                <p className="text-sm text-gray-500 mt-1">
                  Expected output: {estimatedAmountA} {tokenA?.symbol}
                </p>
              )}
            </div>
            <div>
              <Label>Minimum {tokenB ? tokenB.symbol : ''} Amount</Label>
              <div className="flex items-center space-x-2">
                <Input type="text" value={minAmountB} disabled placeholder="0.0" />
                <span className="text-sm font-medium">{tokenB ? tokenB.symbol : ''}</span>
              </div>
              {estimatedAmountB && (
                <p className="text-sm text-gray-500 mt-1">
                  Expected output: {estimatedAmountB} {tokenB?.symbol}
                </p>
              )}
            </div>
          </div>
        </div>
        {/* 滑点选择 */}
        <div>
          <Label>Slippage</Label>
          <div className="flex items-center space-x-2 mt-2">
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
              className="w-20"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        </div>
      </div>

      <Button
        onClick={handleRemoveLiquidity}
        className="w-full"
        disabled={!tokenA || !tokenB || !liquidityAmount || parseFloat(liquidityAmount) <= 0}
      >
        Remove Liquidity
      </Button>

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
