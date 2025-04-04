'use client';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@repo/ui/components/ui/select';
import { Input } from '@repo/ui/components/ui/input';
import React, { useEffect, useState } from 'react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Dubhe, Transaction, SubscriptionKind } from '@0xobelisk/sui-client';
import { toast } from 'sonner';
import { initDubheClient } from '../jotai/dubhe';
import { WALLETCHAIN } from '../constants';
import { initMerakClient } from '../jotai/merak';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { decodeAddress, isAddress } from '@polkadot/util-crypto';
import { ConnectButton, useCurrentWallet } from '@mysten/dapp-kit';
import { u8aToHex, hexToU8a } from '@polkadot/util';

export default function Page() {
  const { currentWallet, connectionStatus } = useCurrentWallet();
  const [customAddress, setCustomAddress] = useState('');
  const [input, setInput] = useState('');
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [digest, setDigest] = useState('');
  const [subscription, setSubscription] = useState<WebSocket | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>(
    'idle'
  );
  const [targetChainAddress, setTargetChainAddress] = useState('');
  const [polkadotApi, setPolkadotApi] = useState<any>(null);
  // Add state to track current direction
  const [isFromSuiToDubhe, setIsFromSuiToDubhe] = useState(true);

  const subscribeToEvents = async (dubhe: Dubhe) => {
    try {
      // Subscribe to multiple event types
      const sub = await dubhe.subscribe(
        [
          {
            kind: SubscriptionKind.Event,
            sender: currentWallet.accounts[0].address
          },
          {
            kind: SubscriptionKind.Schema,
            name: 'bridge_withdraw'
          }
        ],
        (data) => {
          console.log('Received real-time data:', data);
        }
      );
      setSubscription(sub);
    } catch (error) {
      console.error('Failed to subscribe to events:', error);
    }
  };

  // Modify event handling function to monitor specific address and amount
  const events_process = async (
    block_number: number,
    api: any,
    targetAddress: string,
    amount: number
  ) => {
    const block_height: string = block_number.toString();
    const blockHash = await api.rpc.chain.getBlockHash(block_number);
    const signedBlock = await api.rpc.chain.getBlock(blockHash);
    const block_hash: string = signedBlock.block.header.hash.toString();
    const events = await api.query.system.events.at(blockHash);

    for (const [_event_index, event] of events.entries()) {
      const eventData = event.toHuman();
      const eventInfo = JSON.stringify(eventData.event);
      console.log(eventInfo, 'eventInfo');

      const ApplyExtrinsic = eventData.phase.ApplyExtrinsic;

      // Check if event is related to target address

      console.log('Found event related to target address:', eventInfo);
      console.log(eventData.event, 'eventData.event');
      // Check if it's a cross-chain success event and verify amount
      if (eventData.event.method === 'Deposit' && eventData.event.section === 'bridge') {
        try {
          // Parse Transfer event data
          const transferData = eventData.event.data;
          console.log('Transfer event data:', transferData);

          const _from = transferData.from;
          const to = transferData.to;
          // Remove commas and convert to number
          const eventAmount = Number(transferData.amount.replace(/,/g, ''));

          console.log('Processed event amount:', eventAmount);
          console.log('Expected amount:', amount);

          // Decode address to get public key
          const publicKeyBytes = decodeAddress(to);
          const publicKeyHex = u8aToHex(publicKeyBytes);
          // Verify receiving address and amount
          if (publicKeyHex === targetAddress) {
            // Strict check for exact amount match
            const isAmountMatch = eventAmount === amount;

            if (isAmountMatch) {
              console.log('Cross-chain transaction successful with exact amount match!');
              setBridgeStatus('success');
              toast('Cross-chain transaction successful', {
                description: `Block height: ${block_height}, Amount: ${(
                  eventAmount /
                  10 ** 7
                ).toFixed(7)}DUBHE`,
                action: {
                  label: 'View Details',
                  onClick: () =>
                    window.open(
                      `https://polkadot.js.org/apps/?rpc=wss://dubheos-node-devnet-wss.obelisk.build/wss#/explorer/query/${block_hash}`,
                      '_blank'
                    )
                }
              });

              // Success after stopping listening
              return true;
            } else {
              console.log('Found event but amount does not match');
            }
          }
        } catch (error) {
          console.error('Error parsing Transfer event:', error);
        }
      } else if (
        eventData.event.method === 'AssetMoved' ||
        eventInfo.includes('asset_moved_event')
      ) {
      }
      // Optional event data saving
      try {
        console.log('Loading Event Success...');
      } catch (error) {
        console.error('Failed to save event:', error);
      }
    }

    return false; // No relevant event found
  };

  // Modify progress function, add amount parameter
  const start_progress = async (
    start_block: number,
    api: any,
    targetAddress: string,
    amount: number
  ) => {
    let currentBlock = start_block;
    let found = false;

    // Set status to pending
    setBridgeStatus('pending');

    // First check current block
    found = await events_process(currentBlock, api, targetAddress, amount);
    if (found) return;

    // Set subscription to monitor new blocks
    const unsubscribe = await api.rpc.chain.subscribeNewHeads(async (header: any) => {
      const blockNumber = header.number.toNumber();
      console.log(`New block detected: #${blockNumber}`);

      if (blockNumber > currentBlock) {
        // Process events in new block
        found = await events_process(blockNumber, api, targetAddress, amount);
        currentBlock = blockNumber;

        // If relevant event is found, unsubscribe
        if (found) {
          unsubscribe();
        }
      }
    });

    // Save unsubscribe function for component unmount
    return unsubscribe;
  };

  const latest_block_height_check = async (api: any) => {
    const signedBlock = await api.rpc.chain.getBlock();
    // const latest_block_height = (signedBlock.toHuman()as any).block.header.number;
    const latest_block_height = signedBlock.toJSON().block.header.number;
    return latest_block_height;
  };

  const subscribeToDubheOS = async (targetAddress: string, amount: number) => {
    try {
      if (!targetAddress) {
        console.error('Target address is required');
        return;
      }

      setTargetChainAddress(targetAddress);
      setBridgeStatus('pending');

      const wsProvider = new WsProvider('wss://dubheos-node-devnet-wss.obelisk.build/wss');
      const api = await ApiPromise.create({ provider: wsProvider });
      setPolkadotApi(api);

      const latest_block_height = await latest_block_height_check(api);
      console.log(
        `Start monitoring address ${targetAddress} for cross-chain transaction, amount ${amount}, from block #${latest_block_height}`
      );

      const unsubscribe = await start_progress(latest_block_height, api, targetAddress, amount);

      // Return unsubscribe function
      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to events:', error);
      setBridgeStatus('failed');
      toast.error('Failed to monitor cross-chain events, please try again');
    }
  };

  // Component cleanup on unmount
  useEffect(() => {
    const dubhe = initDubheClient();
    subscribeToEvents(dubhe);

    // Don't subscribe on initialization, wait for user submission
    // subscribeToDubheOS();

    return () => {
      // Clean up subscription
      if (subscription) {
        subscription.close();
      }

      // Clean up Polkadot API
      if (polkadotApi) {
        polkadotApi.disconnect();
      }
    };
  }, []);

  // Use in handleMoveToken function
  const handleMoveToken = async () => {
    try {
      // Validate input
      if (!input || Number(input) <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      // Get target address - use customAddress directly
      if (!customAddress) {
        toast.error('Please enter a valid receiving address');
        return;
      }

      // Use Polkadot utils to validate address format
      if (isFromSuiToDubhe && !isAddress(customAddress)) {
        toast.error('Please enter a valid Polkadot format address');
        return;
      }

      // Handle Dubhe Token's 7 decimal places
      const rawAmount = Number(input);
      // Convert user input amount to on-chain representation (multiply by 10^7)
      const amount = Math.floor(rawAmount * 10 ** 7);

      console.log('Original amount:', rawAmount, 'On-chain amount:', amount);
      console.log(customAddress, amount);

      const merak = initMerakClient();
      let tx = new Transaction();

      // Decode address to get public key
      const publicKeyBytes = decodeAddress(customAddress);
      const publicKeyHex = u8aToHex(publicKeyBytes);

      console.log('Recipient address:', customAddress);
      console.log('Recipient public key:', publicKeyHex);

      const withdraw_info = {
        asset_id: '1',
        to: publicKeyHex,
        to_chain: 'Dubhe OS',
        amount: amount // Use processed amount
      };

      console.log(withdraw_info, 'withdraw_info');

      // Start listening for cross-chain events and pass amount
      await subscribeToDubheOS(withdraw_info.to, withdraw_info.amount);

      // Execute cross-chain transaction
      await merak.withdraw(
        tx,
        withdraw_info.asset_id,
        withdraw_info.to,
        withdraw_info.to_chain,
        withdraw_info.amount,
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
            toast('Transaction submitted', {
              description: 'Waiting for cross-chain confirmation...',
              action: {
                label: 'View Transaction',
                onClick: () =>
                  window.open(`https://testnet.suivision.xyz/txblock/${result.digest}`, '_blank')
              }
            });
            setDigest(result.digest);
          },
          onError: (error) => {
            console.log('executed transaction error', error);
            setBridgeStatus('failed');
            toast.error('Transaction failed, please try again');
          }
        }
      );
      console.log('Transaction submitted, waiting for cross-chain confirmation');
    } catch (error) {
      console.error('Cross-chain transaction failed:', error);
      setBridgeStatus('failed');
      toast.error('Cross-chain transaction failed, please try again');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="container mx-auto px-4 py-8">
        {/* Add page title and description */}
        <div className="max-w-[520px] mx-auto mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Bridge</h1>
          <p className="mt-2 text-sm text-gray-600">
            Transfer tokens between Sui and Dubhe OS networks
          </p>
        </div>

        <main className="max-w-[520px] mx-auto space-y-4">
          {/* First Card - Transfer Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-900">Transfer Details</h2>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* From Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                <div className="flex justify-between items-center gap-4">
                  <Select defaultValue="dub">
                    <SelectTrigger className="w-[240px] border-gray-200 bg-white">
                      <SelectValue>
                        <div className="flex items-center">
                          <img
                            src="https://pbs.twimg.com/profile_images/1902743997308940288/1ubXjvHX_400x400.jpg"
                            alt="DUB logo"
                            className="w-5 h-5 mr-2"
                          />
                          WDubhe (WDUBHE)
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dub">
                        <div className="flex items-center">
                          <img
                            src="https://pbs.twimg.com/profile_images/1902743997308940288/1ubXjvHX_400x400.jpg"
                            alt="DUB logo"
                            className="w-5 h-5 mr-2"
                          />
                          Dubhe (DUBHE)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    placeholder="0.00"
                    className="w-[240px] border-gray-200 focus:border-blue-500"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                </div>
              </div>

              {/* To Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                <div className="flex justify-between items-center gap-4">
                  <Select defaultValue="ethereum">
                    <SelectTrigger className="w-[240px] border-gray-200 bg-white">
                      <SelectValue>
                        <div className="flex items-center">
                          <img
                            src="https://pbs.twimg.com/profile_images/1902743997308940288/1ubXjvHX_400x400.jpg"
                            alt="Dubhe logo"
                            className="w-5 h-5 mr-2"
                          />
                          Dubhe OS
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">
                        <div className="flex items-center">
                          <img
                            src="https://pbs.twimg.com/profile_images/1902743997308940288/1ubXjvHX_400x400.jpg"
                            alt="Dubhe logo"
                            className="w-5 h-5 mr-2"
                          />
                          Dubhe OS
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="text"
                    placeholder="Enter receiving address"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    className="w-[240px] border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Second Card - Transaction Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-900">Transaction Details</h2>
            </div>

            <div className="px-6 py-5">
              <div className="space-y-4">
                {/* Gas Fee */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Estimated Gas Fee</span>
                  <span className="text-gray-900 font-medium">0.005 Sui</span>
                </div>

                {/* Bridge Fee */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">Bridge Fee</span>
                  <div className="text-right">
                    <div className="text-blue-500 text-sm font-medium">Limited Time Free!</div>
                    <div className="text-gray-400 text-xs line-through">100 DUBHE</div>
                  </div>
                </div>

                {/* You will receive */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-900 font-medium">You will receive</span>
                  <span className="text-gray-900 font-medium text-lg">
                    {input ? Number(input).toFixed(7) : '0.0000000'}{' '}
                    {isFromSuiToDubhe ? 'DUB' : 'DUBHE'}
                  </span>
                </div>

                {/* Status Display */}
                {bridgeStatus !== 'idle' && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                      {bridgeStatus === 'pending' && (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                          <span className="text-gray-600">
                            Waiting for cross-chain confirmation...
                          </span>
                        </>
                      )}
                      {bridgeStatus === 'success' && (
                        <>
                          <svg
                            className="h-4 w-4 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-green-500">Cross-chain transaction confirmed!</span>
                        </>
                      )}
                      {bridgeStatus === 'failed' && (
                        <>
                          <X className="h-4 w-4 text-red-500" />
                          <span className="text-red-500">Transaction failed, please try again</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bridge Button */}
          <Button
            onClick={handleMoveToken}
            className={`w-full h-12 rounded-lg font-medium text-base transition-all duration-200 ${
              bridgeStatus === 'pending'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#3B82F6] hover:bg-blue-600 text-white'
            }`}
            disabled={bridgeStatus === 'pending'}
          >
            {bridgeStatus === 'pending' ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              'Bridge to Dubhe OS'
            )}
          </Button>
        </main>
      </div>
    </div>
  );
}
