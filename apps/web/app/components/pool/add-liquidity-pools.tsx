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

export default function AddLiquidity() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [digest, setDigest] = useState('');
  const [tokenPay, setTokenPay] = useState<TokenData | null>(null);
  const [tokenReceive, setTokenReceive] = useState<TokenData | null>(null);
  const [amountPay, setAmountPay] = useState('');
  const [amountReceive, setAmountReceive] = useState('');
  const [minAmountPay, setMinAmountPay] = useState('');
  const [minAmountReceive, setMinAmountReceive] = useState('');

  const [isTokenPayModalOpen, setIsTokenPayModalOpen] = useState(false);
  const [isTokenReceiveModalOpen, setIsTokenReceiveModalOpen] = useState(false);

  const [availableTokenReceives, setAvailableTokenReceives] = useState<number[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Global state management with Jotai
  const [assetsState, setAssetsState] = useAtom(AssetsStateAtom);
  const [isLoading, setIsLoading] = useAtom(AssetsLoadingAtom);

  const [slippage, setSlippage] = useState('0.50'); // 默认0.5%
  const [customSlippage, setCustomSlippage] = useState('');

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

  // 自动计算最小存入
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
    const slippageFactor = 1 - (Number(slippage) / 100);
    setMinAmountPay((pay * slippageFactor).toFixed(tokenPay.decimals));
    setMinAmountReceive((receive * slippageFactor).toFixed(tokenReceive.decimals));
  }, [amountPay, amountReceive, tokenPay, tokenReceive, slippage]);

  const handleSelectTokenPay = async (token: TokenData) => {
    console.log(token, 'select token');
    setTokenPay(token);
    setIsTokenPayModalOpen(false);
    const merak = initMerakClient();
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

    console.log('Add liquidity');
    const merak = initMerakClient();
    let tx = new Transaction();

    console.log(tokenPay, tokenReceive);

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
            >
              {tokenPay ? (
                <>
                  <img
                    src={tokenPay.icon_url}
                    alt={tokenPay.symbol}
                    className="w-6 h-6 mr-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://hop.ag/tokens/SUI.svg';
                    }}
                  />
                  {tokenPay.symbol}
                </>
              ) : (
                'Select token'
              )}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
            <Button
              onClick={() => setIsTokenReceiveModalOpen(true)}
              className="w-full justify-between"
              variant="outline"
              disabled={!tokenPay}
            >
              {tokenReceive ? (
                <>
                  <img
                    src={tokenReceive.icon_url}
                    alt={tokenReceive.symbol}
                    className="w-6 h-6 mr-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://hop.ag/tokens/SUI.svg';
                    }}
                  />
                  {tokenReceive.symbol}
                </>
              ) : tokenPay ? (
                'Select token'
              ) : (
                'Select token pay first'
              )}
              <ChevronDown className="h-4 w-4 ml-2" />
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
                  onChange={(e) => setAmountPay(e.target.value)}
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
                  onChange={(e) => setAmountReceive(e.target.value)}
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
          </div>
        </div>

        <div>
          <Label>Minimum Deposit Amounts</Label>
          <p className="text-sm text-gray-500 mb-2">
            Enter the minimum amount of tokens you're willing to deposit.
          </p>
          <div className="space-y-4">
            <div>
              <Label>Minimum {tokenPay ? tokenPay.symbol : ''} Amount</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={minAmountPay}
                  disabled
                  placeholder="0.0"
                />
                <span className="text-sm font-medium">{tokenPay ? tokenPay.symbol : ''}</span>
              </div>
            </div>
            <div>
              <Label>Minimum {tokenReceive ? tokenReceive.symbol : ''} Amount</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={minAmountReceive}
                  disabled
                  placeholder="0.0"
                />
                <span className="text-sm font-medium">
                  {tokenReceive ? tokenReceive.symbol : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label>Slippage</Label>
          <div className="flex items-center space-x-2 mt-2">
            {["0.10", "0.50", "1.00"].map((val) => (
              <Button
                key={val}
                type="button"
                variant={slippage === val ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setSlippage(val); setCustomSlippage(''); }}
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
              onChange={e => {
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
