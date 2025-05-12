'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { useAtom } from 'jotai';
import { initMerakClient } from '@/app/jotai/merak';
import { Transaction, TransactionArgument } from '@0xobelisk/sui-client';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { toast } from 'sonner';
import { WALLETCHAIN } from '@/app/constants';

interface LiquidityPoolSetupProps {
  selectedTokens: { base: any; quote: any } | null;
  onClose: () => void;
}

export default function LiquidityPoolSetup({ selectedTokens, onClose }: LiquidityPoolSetupProps) {
  const [feeTier, setFeeTier] = useState('1%');
  const [initialPrice, setInitialPrice] = useState('1');
  const [liquidityRange, setLiquidityRange] = useState('Full');
  const [baseAmount, setBaseAmount] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [baseMinAmount, setBaseMinAmount] = useState('');
  const [quoteMinAmount, setQuoteMinAmount] = useState('');
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [digest, setDigest] = useState('');

  if (!selectedTokens) return null;

  const { base, quote } = selectedTokens;

  const create_pool = async () => {
    const merak = initMerakClient();
    let tx = new Transaction();
    await merak.createPool(tx, base.id, quote.id, true);
    await signAndExecuteTransaction(
      {
        transaction: tx.serialize(),
        chain: WALLETCHAIN
      },
      {
        onSuccess: (result) => {
          console.log('executed transaction', result);
          toast('Translation Successful', {
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
        }
      }
    );
  };

  // const add_liquidity = async () => {
  //   try {
  //     const merak = initMerakClient();
  //     let tx = new Transaction();

  //     const baseDesired = BigInt(
  //       Math.floor(parseFloat(baseAmount) * Math.pow(10, base.metadata[3]))
  //     );
  //     const quoteDesired = BigInt(
  //       Math.floor(parseFloat(quoteAmount) * Math.pow(10, quote.metadata[3]))
  //     );
  //     const baseMin = BigInt(
  //       Math.floor(parseFloat(baseMinAmount) * Math.pow(10, base.metadata[3]))
  //     );
  //     const quoteMin = BigInt(
  //       Math.floor(parseFloat(quoteMinAmount) * Math.pow(10, quote.metadata[3]))
  //     );

  //     await merak.addLiquidity(
  //       tx,
  //       base.id,
  //       quote.id,
  //       baseDesired,
  //       quoteDesired,
  //       baseMin,
  //       quoteMin,
  //       account.address,
  //       true
  //     );

  //     await signAndExecuteTransaction(
  //       {
  //         transaction: tx.serialize(),
  //         chain: WALLETCHAIN
  //       },
  //       {
  //         onSuccess: (result) => {
  //           console.log('executed transaction', result);
  //           toast('Translation Successful', {
  //             description: new Date().toUTCString(),
  //             action: {
  //               label: 'Check in Explorer',
  //               onClick: () =>
  //                 window.open(`https://testnet.suivision.xyz/txblock/${result.digest}`, '_blank')
  //             }
  //           });
  //         },
  //         onError: (error) => {
  //           console.log('executed transaction', error);
  //         }
  //       }
  //     );
  //     // Remove this line as it's causing an error
  //     // setDigest(result.digest);
  //   } catch (error) {
  //     console.error('添加流动性失败:', error);
  //     toast.error('添加流动性失败', {
  //       description: error.message
  //     });
  //   }
  // };

  const handleCreatePool = async () => {
    console.log('Create pool');
    // let _a = await create_pool()
    // let _b = await add_liquidity()
    console.log(selectedTokens);
  };

  return (
    <div className="bg-white p-6 max-w-md mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onClose} className="flex items-center text-primary">
          <ArrowLeft className="mr-2" />
          <span>Back to select tokens</span>
        </button>
        <h1 className="text-xl font-bold">Set initial deposit</h1>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="flex items-center mb-2">
            Fee tier <Info className="ml-2 w-4 h-4" />
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {['1%', '0.3%', '0.05%', '0.01%'].map((fee) => (
              <Button
                key={fee}
                variant={feeTier === fee ? 'secondary' : 'outline'}
                onClick={() => setFeeTier(fee)}
                className="w-full"
              >
                {fee}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="flex items-center mb-2">
            Initial price <Info className="ml-2 w-4 h-4" />
          </Label>
          <div className="flex items-center">
            <Input
              type="text"
              value={initialPrice}
              onChange={(e) => setInitialPrice(e.target.value)}
              className="flex-1"
            />
            <span className="ml-2 text-sm text-gray-600">USDC per SUI</span>
          </div>
        </div>

        <div>
          <Label className="flex items-center mb-2">
            Liquidity range <Info className="ml-2 w-4 h-4" />
          </Label>
          <div className="flex space-x-2">
            <Button
              variant={liquidityRange === 'Full' ? 'secondary' : 'outline'}
              onClick={() => setLiquidityRange('Full')}
              className="flex-1"
            >
              Full
            </Button>
            <Button
              variant={liquidityRange === 'Custom' ? 'secondary' : 'outline'}
              onClick={() => setLiquidityRange('Custom')}
              className="flex-1"
            >
              Custom
            </Button>
          </div>
        </div>

        <div>
          <Label className="mb-2">Amount to deposit</Label>
          <div className="text-right mb-2 text-sm text-gray-600">
            50% {base.metadata[0]} : 50% {quote.metadata[0]}
          </div>
          <div className="bg-gray-100 p-4 rounded-lg space-y-4">
            {[base, quote].map((token, index) => (
              <div key={index} className="flex items-center">
                <img
                  src={token.metadata[4] || '/sui-logo.svg'}
                  alt={`${token.metadata[0]} logo`}
                  className="w-8 h-8 rounded-full mr-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/sui-logo.svg';
                  }}
                />
                <div className="flex-1">
                  <div>{token.metadata[0]}</div>
                  <div className="text-sm text-gray-600">
                    Balance:{' '}
                    {(Number(token.balance[0]) / Math.pow(10, token.metadata[3])).toLocaleString()}
                  </div>
                </div>
                <Input
                  type="text"
                  value={index === 0 ? baseAmount : quoteAmount}
                  onChange={(e) =>
                    index === 0 ? setBaseAmount(e.target.value) : setQuoteAmount(e.target.value)
                  }
                  className="w-1/3"
                />
              </div>
            ))}
          </div>

          {/* New section for minimum deposit amounts */}
          <div className="mt-4">
            <Label className="mb-2">Minimum deposit amounts</Label>
            <div className="bg-gray-100 p-4 rounded-lg space-y-4">
              {[base, quote].map((token, index) => (
                <div key={index} className="flex items-center">
                  <img
                    src={token.metadata[4] || '/sui-logo.svg'}
                    alt={`${token.metadata[0]} logo`}
                    className="w-8 h-8 rounded-full mr-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/sui-logo.svg';
                    }}
                  />
                  <div className="flex-1">
                    <div>{token.metadata[0]} min</div>
                  </div>
                  <Input
                    type="text"
                    value={index === 0 ? baseMinAmount : quoteMinAmount}
                    onChange={(e) =>
                      index === 0
                        ? setBaseMinAmount(e.target.value)
                        : setQuoteMinAmount(e.target.value)
                    }
                    className="w-1/3"
                    placeholder="Min amount"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between mt-2 text-sm">
            <span>Total</span>
            <span>$0</span>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg my-6">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Important Notice:</span> A minimum liquidity deposit of
            $100 is required to create a new pool. This ensures that token pools are established by
            project builders and core community members with a genuine commitment to the project.
          </div>
        </div>
      </div>

      <Button
        onClick={handleCreatePool}
        className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white"
      >
        Create {base.metadata[0]}/{quote.metadata[0]} pool and deposit
      </Button>
    </div>
  );
}
