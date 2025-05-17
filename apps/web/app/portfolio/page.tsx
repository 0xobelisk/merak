'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import {
  RefreshCw,
  PieChart,
  TrendingUp,
  Wallet,
  Minus,
  FileText,
  Droplets,
  UserPlus,
  ShieldAlert,
  FileCheck,
  Package,
  MoveHorizontal,
  HelpCircle,
  Lock,
  Loader2
} from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { toast } from 'sonner';
import { MoreHorizontal, Send, Coins, Flame, ArrowUpDown, Plus, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@repo/ui/components/ui/dropdown-menu';
import { WALLETCHAIN } from '@/app/constants';
import { Transaction } from '@0xobelisk/sui-client';

const DynamicPie = dynamic(() => import('react-chartjs-2').then((mod) => mod.Pie), { ssr: false });

const initChartJs = async () => {
  const { Chart, ArcElement, Tooltip, Legend } = await import('chart.js');
  Chart.register(ArcElement, Tooltip, Legend);
};

initChartJs();

import { initMerakClient } from '@/app/jotai/merak';
import {
  AssetsStateAtom,
  AssetsLoadingAtom,
  AssetActionDialogProps,
  AllAssetsStateAtom
} from '@/app/jotai/assets';

const generateRandomColors = (count: number) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * 200);
    const g = Math.floor(Math.random() * 200);
    const b = Math.floor(Math.random() * 200);
    colors.push(`rgba(${r}, ${g}, ${b}, 0.8)`);
  }
  return colors;
};

const generateChartColors = () => [
  'rgba(99, 102, 241, 0.8)',
  'rgba(168, 85, 247, 0.8)',
  'rgba(236, 72, 153, 0.8)',
  'rgba(34, 197, 94, 0.8)',
  'rgba(249, 115, 22, 0.8)',
  'rgba(14, 165, 233, 0.8)',
  'rgba(234, 179, 8, 0.8)',
  'rgba(239, 68, 68, 0.8)',
  'rgba(79, 70, 229, 0.8)',
  'rgba(20, 184, 166, 0.8)'
];

import { AssetOperationAtom, AssetOperationType } from '@/app/jotai/assets';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@repo/ui/components/ui/dialog';
import { Label } from '@repo/ui/components/ui/label';
import { Input } from '@repo/ui/components/ui/input';

export default function Portfolio() {
  const account = useCurrentAccount();
  const router = useRouter();
  const [assetsState, setAssetsState] = useAtom(AssetsStateAtom);
  const [allAssetsState, setAllAssetsState] = useAtom(AllAssetsStateAtom);
  const [isLoading, setIsLoading] = useAtom(AssetsLoadingAtom);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [assetDistribution, setAssetDistribution] = useState<{ [key: string]: number }>({});
  const [chartData, setChartData] = useState<any>(null);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [operation, setOperation] = useAtom(AssetOperationAtom);

  // Add transaction history state
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // Define asset query function
  const queryAssets = useCallback(async () => {
    if (!account?.address) return;

    try {
      setIsLoading(true);
      const merak = initMerakClient();

      const metadataResults = await merak.listOwnedAssetsInfo({
        address: account.address
      });

      // Update both states
      setAssetsState({
        assetInfos: metadataResults.data
      });
      setAllAssetsState({
        assetInfos: metadataResults.data
      });

      // Calculate total value and asset distribution
      let total = 0;
      const distribution: { [key: string]: number } = {};

      metadataResults.data.forEach((asset) => {
        const value = Number(asset.balance) / Math.pow(10, asset.metadata.decimals || 0);
        total += value;

        const symbol = asset.metadata.symbol || 'Unknown';
        distribution[symbol] = (distribution[symbol] || 0) + value;
      });

      setTotalValue(total);
      setAssetDistribution(distribution);

      // Prepare chart data
      const labels = Object.keys(distribution);
      const values = Object.values(distribution);

      const colors = generateChartColors();
      setChartData({
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderColor: colors.map((color) => color.replace('0.8', '1')),
            borderWidth: 1
          }
        ]
      });
    } catch (error) {
      console.error('Error querying assets:', error);
      toast.error('Failed to fetch assets');
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, setAssetsState, setAllAssetsState, setIsLoading]);

  // Fetch transaction history
  const fetchTransactionHistory = useCallback(async () => {
    if (!account?.address) return;

    try {
      setIsHistoryLoading(true);
      const merak = initMerakClient();

      // Call transaction history API
      const response = await merak
        .listTransactionHistory({
          sender: account?.address
        })
        .catch(() => ({ data: [] }));

      // Process returned data
      const formattedHistory = (response.data || []).map((tx: any) => {
        const timestamp = new Date(parseInt(tx.createdAt)).toISOString();
        const digest = tx.event.digest;
        const eventType = tx.event.name; // Compatible with different API return formats
        const eventBody = tx.event.value; // Compatible with different API return formats
        const checkpoint = tx.event.checkpoint;

        // Generate different display content based on event type
        switch (eventType) {
          // Asset transfer
          case 'asset_transferred_event': {
            const { asset_id, from, to, amount } = eventBody;
            return {
              id: digest,
              type: 'Transfer',
              assetId: asset_id,
              amount,
              sender: from,
              recipient: to,
              timestamp,
              status: 'Completed',
              checkpoint,
              eventType,
              details: {
                from: shortenAddress(from),
                to: shortenAddress(to)
              }
            };
          }

          // Swap executed
          case 'swap_event': {
            const { sender, asset0, asset1, amount0_in, amount1_in, amount0_out, amount1_out, to } =
              eventBody;
            return {
              id: digest,
              type: 'Swap',
              sender: sender,
              recipient: to,
              asset0,
              asset1,
              amount0In: amount0_in,
              amount1In: amount1_in,
              amount0Out: amount0_out,
              amount1Out: amount1_out,
              amountIn: amount0_in + amount0_out,
              amountOut: amount1_in + amount1_out,
              timestamp,
              status: 'Completed',
              checkpoint,
              eventType,
              details: {
                from: shortenAddress(sender),
                to: shortenAddress(to),
                path: `${formatSymbol(asset0)} → ${formatSymbol(asset1)}`
              }
            };
          }

          // Liquidity added
          case 'liquidity_added_event': {
            const {
              who,
              asset1_id,
              asset2_id,
              asset1_amount,
              asset2_amount,
              lp_asset_id,
              lp_asset_minted
            } = eventBody;
            return {
              id: digest,
              type: 'AddLiquidity',
              sender: who,
              asset1Id: asset1_id,
              asset2Id: asset2_id,
              asset1Amount: asset1_amount,
              asset2Amount: asset2_amount,
              lpAssetId: lp_asset_id,
              lpAmount: lp_asset_minted,
              timestamp,
              status: 'Completed',
              checkpoint,
              eventType,
              details: {
                who: shortenAddress(who),
                pair: `${formatSymbol(asset1_id)}/${formatSymbol(asset2_id)}`,
                lpToken: lp_asset_id
              }
            };
          }

          // Liquidity removed
          case 'liquidity_removed_event': {
            const {
              who,
              asset1_id,
              asset2_id,
              asset1_amount,
              asset2_amount,
              lp_asset_id,
              lp_asset_burned
            } = eventBody;
            return {
              id: digest,
              type: 'RemoveLiquidity',
              sender: who,
              asset1Id: asset1_id,
              asset2Id: asset2_id,
              asset1Amount: asset1_amount,
              asset2Amount: asset2_amount,
              lpAssetId: lp_asset_id,
              lpAmount: lp_asset_burned,
              timestamp,
              status: 'Completed',
              checkpoint,
              eventType,
              details: {
                who: shortenAddress(who),
                pair: `${formatSymbol(asset1_id)}/${formatSymbol(asset2_id)}`,
                lpToken: lp_asset_id
              }
            };
          }

          // // LP Minted
          // case 'lp_minted_event': {
          //   const { sender, asset0, asset1, amount0, amount1, to } = eventBody;
          //   return {
          //     id: digest,
          //     type: 'LPMinted',
          //     sender: sender,
          //     recipient: to,
          //     asset0,
          //     asset1,
          //     amount0,
          //     amount1,
          //     timestamp,
          //     status: 'Completed',
          //     checkpoint: event.checkpoint,
          //     eventType,
          //     details: {
          //       from: shortenAddress(sender),
          //       to: shortenAddress(to),
          //       pair: `${formatSymbol(asset0)}/${formatSymbol(asset1)}`
          //     }
          //   };
          // }

          // // LP Burned
          // case 'lp_burned_event': {
          //   const { sender, asset0, asset1, amount0, amount1, to } = eventBody;
          //   return {
          //     id: digest,
          //     type: 'LPBurned',
          //     sender: sender,
          //     recipient: to,
          //     asset0,
          //     asset1,
          //     amount0,
          //     amount1,
          //     timestamp,
          //     status: 'Completed',
          //     checkpoint: event.checkpoint,
          //     eventType,
          //     details: {
          //       from: shortenAddress(sender),
          //       to: shortenAddress(to),
          //       pair: `${formatSymbol(asset0)}/${formatSymbol(asset1)}`
          //     }
          //   };
          // }

          // Asset created
          case 'asset_created_event': {
            const { asset_id, name, symbol, owner, is_mintable, is_burnable, is_freezable } =
              eventBody;
            return {
              id: digest,
              type: 'AssetCreated',
              assetId: asset_id,
              name,
              symbol,
              creator: owner,
              timestamp,
              status: 'Completed',
              checkpoint,
              eventType,
              details: {
                name,
                symbol,
                owner: shortenAddress(owner),
                features: [
                  is_mintable ? 'Mintable' : null,
                  is_burnable ? 'Burnable' : null,
                  is_freezable ? 'Freezable' : null
                ]
                  .filter(Boolean)
                  .join(', ')
              }
            };
          }

          // Pool created
          case 'pool_created_event': {
            const { creator, asset1_id, asset2_id, pool_address, lp_asset_id, lp_asset_symbol } =
              eventBody;
            return {
              id: digest,
              type: 'PoolCreated',
              creator,
              asset1Id: asset1_id,
              asset2Id: asset2_id,
              poolAddress: pool_address,
              lpAssetId: lp_asset_id,
              lpSymbol: lp_asset_symbol,
              timestamp,
              status: 'Completed',
              checkpoint,
              eventType,
              details: {
                creator: shortenAddress(creator),
                pair: `${formatSymbol(asset1_id)}/${formatSymbol(asset2_id)}`,
                poolAddress: shortenAddress(pool_address),
                lpSymbol: lp_asset_symbol
              }
            };
          }

          // Ownership transferred
          case 'ownership_transferred_event': {
            const { asset_id, from, to } = eventBody;
            return {
              id: digest,
              type: 'OwnershipTransferred',
              assetId: asset_id,
              sender: from,
              recipient: to,
              timestamp,
              status: 'Completed',
              checkpoint,
              eventType,
              details: {
                from: shortenAddress(from),
                to: shortenAddress(to)
              }
            };
          }

          // Asset wrapped
          case 'asset_wrapped_event': {
            const { from, asset_id, amount, beneficiary } = eventBody;
            return {
              id: digest,
              type: 'AssetWrapped',
              assetId: asset_id,
              amount,
              sender: from,
              recipient: beneficiary,
              timestamp,
              status: 'Completed',
              checkpoint,
              eventType,
              details: {
                from: shortenAddress(from),
                to: shortenAddress(beneficiary)
              }
            };
          }

          // Asset unwrapped
          case 'asset_unwrapped_event': {
            const { from, asset_id, amount, beneficiary } = eventBody;
            return {
              id: digest,
              type: 'AssetUnwrapped',
              assetId: asset_id,
              amount,
              sender: from,
              recipient: beneficiary,
              timestamp,
              status: 'Completed',
              checkpoint,
              eventType,
              details: {
                from: shortenAddress(from),
                to: shortenAddress(beneficiary)
              }
            };
          }

          // Bridge withdraw
          case 'bridge_withdraw_event': {
            const { asset_id, from, to, to_chain, amount, fee } = eventBody;
            return {
              id: digest,
              type: 'BridgeWithdraw',
              assetId: asset_id,
              amount,
              fee,
              sender: from,
              recipient: to,
              toChain: to_chain,
              timestamp,
              status: 'Completed',
              checkpoint,
              eventType,
              details: {
                from: shortenAddress(from),
                to: shortenAddress(to),
                toChain: to_chain,
                fee: formatAmount(fee, asset_id)
              }
            };
          }

          // Bridge deposit
          case 'bridge_deposit_event': {
            const { asset_id, from, to, from_chain, amount } = eventBody;
            return {
              id: digest,
              type: 'BridgeDeposit',
              assetId: asset_id,
              amount,
              sender: from,
              recipient: to,
              fromChain: from_chain,
              timestamp,
              status: 'Completed',
              checkpoint,
              eventType,
              details: {
                from: shortenAddress(from),
                to: shortenAddress(to),
                fromChain: from_chain
              }
            };
          }

          // Default case
          default:
            return {
              id: digest,
              type: 'Unknown',
              eventName: eventType,
              timestamp,
              status: 'Completed',
              checkpoint,
              eventType,
              details: eventBody
            };
        }
      });

      setTransactionHistory(formattedHistory);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      toast.error('Failed to fetch transaction history');
    } finally {
      setIsHistoryLoading(false);
    }
  }, [account?.address]);

  // Add helper function to shorten address display
  const shortenAddress = (address: string) => {
    if (!address) return '';
    if (address === account?.address) return 'You';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Helper function: Format amount display
  const formatAmount = (amount: string, assetId: string) => {
    try {
      // 从 allAssetsState 中获取资产的 metadata
      const assetInfo = allAssetsState.assetInfos.find(
        (asset) => asset.assetId === parseInt(assetId)
      );
      const decimals = assetInfo?.metadata?.decimals || 9; // 如果找不到就使用默认值 9
      const value = Number(amount) / Math.pow(10, decimals);
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6
      });
    } catch (e) {
      return amount;
    }
  };

  const formatSymbol = (assetId: string) => {
    try {
      // 从 allAssetsState 中获取资产的 metadata
      const assetInfo = allAssetsState.assetInfos.find(
        (asset) => asset.assetId === parseInt(assetId)
      );
      return assetInfo?.metadata?.symbol || '';
    } catch (e) {
      return '';
    }
  };

  // Implement Transfer callback function
  const handleTransfer = useCallback(
    async (assetId: string, amount: string, recipient: string) => {
      try {
        const merak = initMerakClient();
        const tx = new Transaction();

        // 从 allAssetsState 获取 metadata
        const assetInfo = allAssetsState.assetInfos.find(
          (asset) => asset.assetId === parseInt(assetId)
        );
        const decimals = assetInfo?.metadata?.decimals || 9;
        const amountInSmallestUnit = BigInt(
          Math.floor(parseFloat(amount) * Math.pow(10, decimals))
        );

        console.log('Transfer params:', {
          assetId,
          recipient,
          amount: amountInSmallestUnit.toString()
        });

        await merak.transfer(tx, parseInt(assetId), recipient, amountInSmallestUnit, true);

        await signAndExecuteTransaction(
          {
            transaction: tx.serialize(),
            chain: WALLETCHAIN
          },
          {
            onSuccess: (result) => {
              console.log('Transfer success:', result);

              // Add to transaction history
              const newTransaction = {
                id: result.digest,
                type: 'Transfer',
                assetId: assetId,
                amount: amount,
                recipient: recipient,
                timestamp: new Date().toISOString(),
                status: 'Completed'
              };

              setTransactionHistory((prev) => [newTransaction, ...prev]);
              toast.success('Transfer successful');
              queryAssets();
            },
            onError: (error) => {
              console.error('Transfer failed:', error);

              // Record failed transaction
              const failedTransaction = {
                id: `failed-${Date.now()}`,
                type: 'Transfer',
                assetId: assetId,
                amount: amount,
                recipient: recipient,
                timestamp: new Date().toISOString(),
                status: 'Failed',
                error: error.message
              };

              setTransactionHistory((prev) => [failedTransaction, ...prev]);
              toast.error('Transfer failed');
            }
          }
        );
      } catch (error) {
        console.error('Transfer error:', error);
        toast.error('Transfer failed');
      }
    },
    [signAndExecuteTransaction, queryAssets, allAssetsState]
  );

  // Implement similar logic for TransferAll
  const handleTransferAll = useCallback(
    async (assetId: string, recipient: string) => {
      try {
        const merak = initMerakClient();
        const tx = new Transaction();

        console.log('TransferAll params:', { assetId, recipient });

        await merak.transferAll(tx, parseInt(assetId), recipient, true);

        await signAndExecuteTransaction(
          {
            transaction: tx.serialize(),
            chain: WALLETCHAIN
          },
          {
            onSuccess: (result) => {
              console.log('TransferAll success:', result);

              // Add to transaction history
              const newTransaction = {
                id: result.digest,
                type: 'TransferAll',
                assetId: assetId,
                recipient: recipient,
                timestamp: new Date().toISOString(),
                status: 'Completed'
              };

              setTransactionHistory((prev) => [newTransaction, ...prev]);
              toast.success('TransferAll successful');
              queryAssets();
            },
            onError: (error) => {
              console.error('TransferAll failed:', error);

              // Record failed transaction
              const failedTransaction = {
                id: `failed-${Date.now()}`,
                type: 'TransferAll',
                assetId: assetId,
                recipient: recipient,
                timestamp: new Date().toISOString(),
                status: 'Failed',
                error: error.message
              };

              setTransactionHistory((prev) => [failedTransaction, ...prev]);
              toast.error('TransferAll failed');
            }
          }
        );
      } catch (error) {
        console.error('TransferAll error:', error);
        toast.error('TransferAll failed');
      }
    },
    [signAndExecuteTransaction, queryAssets]
  );

  // Implement Mint function
  const handleMint = useCallback(
    async (assetId: string, amount: string) => {
      try {
        const merak = initMerakClient();
        const tx = new Transaction();

        // 从 allAssetsState 获取 metadata
        const assetInfo = allAssetsState.assetInfos.find(
          (asset) => asset.assetId === parseInt(assetId)
        );
        const decimals = assetInfo?.metadata?.decimals || 9;
        const amountInSmallestUnit = BigInt(
          Math.floor(parseFloat(amount) * Math.pow(10, decimals))
        );

        // Use current account address as recipient
        const recipient = account?.address || '';

        console.log('Mint params:', {
          assetId,
          recipient,
          amount: amountInSmallestUnit.toString()
        });

        await merak.mint(tx, parseInt(assetId), recipient, amountInSmallestUnit, true);

        await signAndExecuteTransaction(
          {
            transaction: tx.serialize(),
            chain: WALLETCHAIN
          },
          {
            onSuccess: (result) => {
              console.log('Mint success:', result);

              // Add to transaction history
              const newTransaction = {
                id: result.digest,
                type: 'Mint',
                assetId: assetId,
                amount: amount,
                recipient: recipient,
                timestamp: new Date().toISOString(),
                status: 'Completed'
              };

              setTransactionHistory((prev) => [newTransaction, ...prev]);
              toast.success('Mint successful');
              queryAssets();
            },
            onError: (error) => {
              console.error('Mint failed:', error);
              toast.error('Mint failed');
            }
          }
        );
      } catch (error) {
        console.error('Mint error:', error);
        toast.error('Mint failed');
      }
    },
    [signAndExecuteTransaction, account?.address, queryAssets, allAssetsState]
  );

  // Implement Burn function
  const handleBurn = useCallback(
    async (assetId: string, amount: string) => {
      try {
        const merak = initMerakClient();
        const tx = new Transaction();

        // 从 allAssetsState 获取 metadata
        const assetInfo = allAssetsState.assetInfos.find(
          (asset) => asset.assetId === parseInt(assetId)
        );
        const decimals = assetInfo?.metadata?.decimals || 9;
        const amountInSmallestUnit = BigInt(
          Math.floor(parseFloat(amount) * Math.pow(10, decimals))
        );

        // Use current account address
        const who = account?.address || '';

        console.log('Burn params:', { assetId, who, amount: amountInSmallestUnit.toString() });

        await merak.burn(tx, parseInt(assetId), who, amountInSmallestUnit, true);

        await signAndExecuteTransaction(
          {
            transaction: tx.serialize(),
            chain: WALLETCHAIN
          },
          {
            onSuccess: (result) => {
              console.log('Burn success:', result);

              // Add to transaction history
              const newTransaction = {
                id: result.digest,
                type: 'Burn',
                assetId: assetId,
                amount: amount,
                timestamp: new Date().toISOString(),
                status: 'Completed'
              };

              setTransactionHistory((prev) => [newTransaction, ...prev]);
              toast.success('Burn successful');
              queryAssets();
            },
            onError: (error) => {
              console.error('Burn failed:', error);
              toast.error('Burn failed');
            }
          }
        );
      } catch (error) {
        console.error('Burn error:', error);
        toast.error('Burn failed');
      }
    },
    [signAndExecuteTransaction, account?.address, queryAssets, allAssetsState]
  );

  // Initialize transaction history on load
  useEffect(() => {
    if (account?.address) {
      fetchTransactionHistory();
    }
  }, [account?.address, fetchTransactionHistory]);

  // Handle operation confirmation
  const handleActionConfirm = useCallback(async () => {
    if (!operation) return;

    try {
      switch (operation.type) {
        case 'transfer':
          await handleTransfer(operation.assetId.toString(), quantity, recipientAddress);
          break;
        case 'transferAll':
          await handleTransferAll(operation.assetId.toString(), recipientAddress);
          break;
        case 'mint':
          await handleMint(operation.assetId.toString(), quantity);
          break;
        case 'burn':
          await handleBurn(operation.assetId.toString(), quantity);
          break;
      }
      setActionDialogOpen(false);
      setQuantity('');
      setRecipientAddress('');
    } catch (error) {
      console.error('Action error:', error);
      toast.error('Action failed');
    }
  }, [
    operation,
    quantity,
    recipientAddress,
    handleTransfer,
    handleTransferAll,
    handleMint,
    handleBurn
  ]);

  // Refresh asset data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryAssets();
    setIsRefreshing(false);
  };

  // Initialization effect
  useEffect(() => {
    if (account?.address) {
      queryAssets();
    } else {
      router.push('/');
    }
  }, [account, router, queryAssets]);

  // Add initialization effect for AllAssetsState
  useEffect(() => {
    const initAllAssetsState = async () => {
      if (allAssetsState.assetInfos.length === 0) {
        try {
          const merak = initMerakClient();
          const metadataResults = await merak.listAssetsInfo();

          setAllAssetsState({
            assetInfos: metadataResults.data
          });
        } catch (error) {
          console.error('Error initializing AllAssetsState:', error);
          toast.error('Failed to fetch all assets information');
        }
      }
    };

    initAllAssetsState();
  }, [allAssetsState.assetInfos.length, setAllAssetsState]);

  // Add handleActionClick function to Portfolio component
  const handleActionClick = useCallback(
    (action: AssetOperationType, assetId: number) => {
      setOperation({ type: action, assetId });
      setActionDialogOpen(true);
    },
    [setOperation]
  );

  // Loading state
  if (isHistoryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500 font-medium">Loading transaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!account ? null : (
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Portfolio</h1>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
              <Skeleton className="h-[400px] md:col-span-3" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Asset Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{totalValue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Total value of all tokens
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Token Count
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{assetsState.assetInfos?.length || 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Number of different tokens held
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Main Asset
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {assetsState.assetInfos?.length > 0
                        ? assetsState.assetInfos[0]?.metadata?.symbol || 'N/A'
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Highest value token</div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="assets" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="assets">
                    <Wallet className="h-4 w-4 mr-2" />
                    Assets List
                  </TabsTrigger>
                  <TabsTrigger value="distribution">
                    <PieChart className="h-4 w-4 mr-2" />
                    Asset Distribution
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Transaction History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="assets" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Assets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="py-3 px-4 text-left">Asset ID</th>
                              <th className="py-3 px-4 text-left">Token</th>
                              <th className="py-3 px-4 text-right">Balance</th>
                              <th className="py-3 px-4 text-right">Value</th>
                              <th className="py-3 px-4 text-right">Percentage</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assetsState.assetInfos?.map((asset, index) => {
                              const balance =
                                Number(asset.balance) / Math.pow(10, asset.metadata?.decimals || 0);
                              const percentage = totalValue > 0 ? (balance / totalValue) * 100 : 0;

                              return (
                                <tr key={index} className="border-b">
                                  <td className="py-3 px-4">{asset.assetId}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center">
                                      <img
                                        src={asset.metadata?.icon_url || '/sui-logo.svg'}
                                        alt={asset.metadata?.name || `Token ${index}`}
                                        className="w-6 h-6 mr-2 rounded-full"
                                        loading="lazy"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '/sui-logo.svg';
                                        }}
                                      />
                                      <div>
                                        <div className="font-medium">{asset.metadata?.symbol}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {asset.metadata?.name}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {balance.toLocaleString(undefined, {
                                      minimumFractionDigits: 4,
                                      maximumFractionDigits: 4
                                    })}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {balance.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </td>
                                  <td className="py-3 px-4 text-right">{percentage.toFixed(2)}%</td>
                                  <td className="py-3 px-4 text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                          <span className="sr-only">Open menu</span>
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleActionClick('transfer', asset.assetId)
                                          }
                                        >
                                          <Send className="mr-2 h-4 w-4" />
                                          <span>Transfer</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleActionClick('transferAll', asset.assetId)
                                          }
                                        >
                                          <Send className="mr-2 h-4 w-4" />
                                          <span>Transfer All</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {/* <DropdownMenuItem
                                          onClick={() => handleActionClick('mint', asset.assetId)}
                                        >
                                          <Coins className="mr-2 h-4 w-4" />
                                          <span>Mint</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleActionClick('burn', asset.assetId)}
                                        >
                                          <Flame className="mr-2 h-4 w-4" />
                                          <span>Burn</span>
                                        </DropdownMenuItem> */}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="distribution">
                  <Card>
                    <CardHeader>
                      <CardTitle>Asset Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="w-full md:w-2/3 h-[400px] relative">
                          {chartData && Object.keys(assetDistribution).length > 0 ? (
                            <DynamicPie
                              data={chartData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'right' as const,
                                    align: 'center' as const,
                                    labels: {
                                      boxWidth: 15,
                                      padding: 15,
                                      font: {
                                        size: 12
                                      }
                                    }
                                  },
                                  tooltip: {
                                    callbacks: {
                                      label: function (context) {
                                        const label = context.label || '';
                                        const value = context.raw as number;
                                        const percentage = ((value / totalValue) * 100).toFixed(2);
                                        return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              No asset distribution data available
                            </div>
                          )}
                        </div>
                        <div className="w-full md:w-1/3">
                          <div className="space-y-2">
                            {Object.entries(assetDistribution).map(([symbol, value], index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50"
                              >
                                <span className="font-medium">{symbol}</span>
                                <span className="text-muted-foreground">
                                  {((value / totalValue) * 100).toFixed(2)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between px-6">
                      <CardTitle>Transaction History</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchTransactionHistory}
                        disabled={isHistoryLoading}
                      >
                        <RefreshCw
                          className={`h-4 w-4 mr-2 ${isHistoryLoading ? 'animate-spin' : ''}`}
                        />
                        Refresh
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {isHistoryLoading ? (
                        <div className="py-8">
                          <Skeleton className="h-10 w-full mb-4" />
                          <Skeleton className="h-10 w-full mb-4" />
                          <Skeleton className="h-10 w-full mb-4" />
                        </div>
                      ) : transactionHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No transaction history available
                        </div>
                      ) : (
                        <div className="rounded-md border overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="py-3 px-4 text-left">Transaction Type</th>
                                <th className="py-3 px-4 text-left">Details</th>
                                <th className="py-3 px-4 text-right">Time</th>
                                <th className="py-3 px-4 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transactionHistory.map((tx, index) => (
                                <tr key={index} className="border-b hover:bg-muted/20">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center">
                                      {/* Mint event */}
                                      {tx.type === 'Mint' && (
                                        <div className="bg-green-100 p-2 rounded-full mr-3">
                                          <Coins className="h-4 w-4 text-green-600" />
                                        </div>
                                      )}

                                      {/* Burn event */}
                                      {tx.type === 'Burn' && (
                                        <div className="bg-red-100 p-2 rounded-full mr-3">
                                          <Flame className="h-4 w-4 text-red-600" />
                                        </div>
                                      )}

                                      {/* Transfer event */}
                                      {tx.type === 'Transfer' && (
                                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                                          <Send className="h-4 w-4 text-blue-600" />
                                        </div>
                                      )}

                                      {/* Swap event */}
                                      {tx.type === 'Swap' && (
                                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                                          <ArrowUpDown className="h-4 w-4 text-blue-600" />
                                        </div>
                                      )}

                                      {/* Add liquidity event */}
                                      {tx.type === 'AddLiquidity' && (
                                        <div className="bg-purple-100 p-2 rounded-full mr-3">
                                          <Plus className="h-4 w-4 text-purple-600" />
                                        </div>
                                      )}

                                      {/* Remove liquidity event */}
                                      {tx.type === 'RemoveLiquidity' && (
                                        <div className="bg-purple-100 p-2 rounded-full mr-3">
                                          <Minus className="h-4 w-4 text-purple-600" />
                                        </div>
                                      )}

                                      {/* Asset creation event */}
                                      {tx.type === 'AssetCreated' && (
                                        <div className="bg-yellow-100 p-2 rounded-full mr-3">
                                          <FileText className="h-4 w-4 text-yellow-600" />
                                        </div>
                                      )}

                                      {/* Pool creation event */}
                                      {tx.type === 'PoolCreated' && (
                                        <div className="bg-indigo-100 p-2 rounded-full mr-3">
                                          <Droplets className="h-4 w-4 text-indigo-600" />
                                        </div>
                                      )}

                                      {/* Ownership transfer event */}
                                      {tx.type === 'OwnershipTransferred' && (
                                        <div className="bg-amber-100 p-2 rounded-full mr-3">
                                          <UserPlus className="h-4 w-4 text-amber-600" />
                                        </div>
                                      )}

                                      {/* Address freezing/thawing/blocking event */}
                                      {(tx.type === 'AddressFrozen' ||
                                        tx.type === 'AddressThawed' ||
                                        tx.type === 'AddressBlocked') && (
                                        <div className="bg-sky-100 p-2 rounded-full mr-3">
                                          <ShieldAlert className="h-4 w-4 text-sky-600" />
                                        </div>
                                      )}

                                      {/* Asset freezing/thawing event */}
                                      {(tx.type === 'AssetFrozen' || tx.type === 'AssetThawed') && (
                                        <div className="bg-cyan-100 p-2 rounded-full mr-3">
                                          <Lock className="h-4 w-4 text-cyan-600" />
                                        </div>
                                      )}

                                      {/* Asset registration event */}
                                      {tx.type === 'AssetRegistered' && (
                                        <div className="bg-emerald-100 p-2 rounded-full mr-3">
                                          <FileCheck className="h-4 w-4 text-emerald-600" />
                                        </div>
                                      )}

                                      {/* Asset wrapping/unwrapping event */}
                                      {(tx.type === 'AssetWrapped' ||
                                        tx.type === 'AssetUnwrapped') && (
                                        <div className="bg-orange-100 p-2 rounded-full mr-3">
                                          <Package className="h-4 w-4 text-orange-600" />
                                        </div>
                                      )}

                                      {/* Asset migration event */}
                                      {tx.type === 'AssetMoved' && (
                                        <div className="bg-rose-100 p-2 rounded-full mr-3">
                                          <MoveHorizontal className="h-4 w-4 text-rose-600" />
                                        </div>
                                      )}

                                      {/* Bridge withdraw event */}
                                      {tx.type === 'BridgeWithdraw' && (
                                        <div className="bg-indigo-100 p-2 rounded-full mr-3">
                                          <MoveHorizontal className="h-4 w-4 text-indigo-600" />
                                        </div>
                                      )}

                                      {/* Bridge deposit event */}
                                      {tx.type === 'BridgeDeposit' && (
                                        <div className="bg-green-100 p-2 rounded-full mr-3">
                                          <MoveHorizontal className="h-4 w-4 text-green-600" />
                                        </div>
                                      )}

                                      {/* Unknown event */}
                                      {tx.type === 'Unknown' && (
                                        <div className="bg-gray-100 p-2 rounded-full mr-3">
                                          <HelpCircle className="h-4 w-4 text-gray-600" />
                                        </div>
                                      )}

                                      <div>
                                        <div className="font-medium">
                                          {tx.type === 'Transfer' && 'Token Transfer'}
                                          {tx.type === 'Swap' && 'Token Swap'}
                                          {tx.type === 'AddLiquidity' && 'Liquidity Addition'}
                                          {tx.type === 'RemoveLiquidity' && 'Liquidity Removal'}
                                          {tx.type === 'AssetCreated' && 'Asset Creation'}
                                          {tx.type === 'PoolCreated' && 'Pool Creation'}
                                          {tx.type === 'OwnershipTransferred' &&
                                            'Ownership Transfer'}
                                          {tx.type === 'AssetWrapped' && 'Token Wrap'}
                                          {tx.type === 'AssetUnwrapped' && 'Token Unwrap'}
                                          {tx.type === 'BridgeWithdraw' && 'Bridge Withdraw'}
                                          {tx.type === 'BridgeDeposit' && 'Bridge Deposit'}
                                          {tx.type === 'LPMinted' && 'LP Token Mint'}
                                          {tx.type === 'LPBurned' && 'LP Token Burn'}
                                          {tx.type === 'Unknown' &&
                                            `Unknown Operation (${tx.eventName || 'Unknown Type'})`}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {tx.assetId && `Token: ${formatSymbol(tx.assetId)}`}
                                          {tx.asset0 &&
                                            tx.asset1 &&
                                            `Pair: ${formatSymbol(tx.asset0)}/${formatSymbol(
                                              tx.asset1
                                            )}`}
                                          {tx.asset1Id &&
                                            tx.asset2Id &&
                                            `Pair: ${formatSymbol(tx.asset1Id)}/${formatSymbol(
                                              tx.asset2Id
                                            )}`}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    {/* Transfer details */}
                                    {tx.type === 'Transfer' && (
                                      <div>
                                        <div className="text-sm">
                                          From:{' '}
                                          <span className="font-mono">
                                            {tx.details?.from ||
                                              shortenAddress(tx.sender) ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="text-sm">
                                          To:{' '}
                                          <span className="font-mono">
                                            {tx.details?.to ||
                                              shortenAddress(tx.recipient) ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="text-sm">
                                          <span className="text-red-600">
                                            -{formatAmount(tx.amount, tx.assetId)}
                                          </span>{' '}
                                          {formatSymbol(tx.assetId)}
                                        </div>
                                      </div>
                                    )}

                                    {/* Swap details */}
                                    {tx.type === 'Swap' && (
                                      <div>
                                        <div className="text-sm">
                                          Path: <span className="font-mono">{tx.details.path}</span>
                                        </div>
                                        <div className="text-sm">
                                          <span className="text-red-600">
                                            -{formatAmount(tx.amountIn, tx.asset0)}
                                          </span>
                                          {' → '}
                                          <span className="text-green-600">
                                            +{formatAmount(tx.amountOut, tx.asset1)}
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Add liquidity details */}
                                    {tx.type === 'AddLiquidity' && (
                                      <div>
                                        <div className="text-sm">
                                          Trade Pair:{' '}
                                          <span className="font-mono">
                                            {tx.details?.pair ||
                                              `${formatSymbol(tx.asset1Id)}/${formatSymbol(
                                                tx.asset2Id
                                              )}` ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="flex flex-row gap-2 text-sm">
                                          <span className="text-red-600">
                                            -{formatAmount(tx.asset1Amount, tx.asset1Id)}
                                          </span>
                                          <span className="text-red-600">
                                            -{formatAmount(tx.asset2Amount, tx.asset2Id)}
                                          </span>
                                          <span>→</span>
                                          <span className="text-green-600">
                                            +{formatAmount(tx.lpAmount, tx.lpAssetId)} LP
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Remove liquidity details */}
                                    {tx.type === 'RemoveLiquidity' && (
                                      <div>
                                        <div className="text-sm">
                                          Trade Pair:{' '}
                                          <span className="font-mono">
                                            {tx.details?.pair ||
                                              `${formatSymbol(tx.asset1Id)}/${formatSymbol(
                                                tx.asset2Id
                                              )}` ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="flex flex-row gap-2 text-sm">
                                          <span className="text-red-600">
                                            -{formatAmount(tx.lpAmount, tx.lpAssetId)} LP
                                          </span>
                                          <span>→</span>
                                          <span className="text-green-600">
                                            +{formatAmount(tx.asset1Amount, tx.asset1Id)}
                                          </span>
                                          <span className="text-green-600">
                                            +{formatAmount(tx.asset2Amount, tx.asset2Id)}
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* LP Minted details */}
                                    {tx.type === 'LPMinted' && (
                                      <div>
                                        <div className="text-sm">
                                          Trade Pair:{' '}
                                          <span className="font-mono">
                                            {tx.details?.pair ||
                                              `${formatSymbol(tx.asset0)}/${formatSymbol(
                                                tx.asset1
                                              )}` ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="flex flex-row gap-2 text-sm">
                                          <span className="text-red-600">
                                            -{formatAmount(tx.amount0, tx.asset0)}
                                          </span>
                                          <span className="text-red-600">
                                            -{formatAmount(tx.amount1, tx.asset1)}
                                          </span>
                                          {/* <span>→</span>
                                          <span className="text-green-600">
                                            +{formatAmount(tx.amount0, tx.asset0)} LP
                                          </span> */}
                                        </div>
                                      </div>
                                    )}

                                    {/* LP Burned details */}
                                    {tx.type === 'LPBurned' && (
                                      <div>
                                        <div className="text-sm">
                                          Trade Pair:{' '}
                                          <span className="font-mono">
                                            {tx.details?.pair ||
                                              `${formatSymbol(tx.asset0)}/${formatSymbol(
                                                tx.asset1
                                              )}` ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="flex flex-row gap-2 text-sm">
                                          <span className="text-red-600">
                                            -{formatAmount(tx.amount0, tx.asset0)} LP
                                          </span>
                                          <span>→</span>
                                          <span className="text-green-600">
                                            +{formatAmount(tx.amount0, tx.asset0)}
                                          </span>
                                          <span className="text-green-600">
                                            +{formatAmount(tx.amount1, tx.asset1)}
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Asset creation details */}
                                    {tx.type === 'AssetCreated' && (
                                      <div>
                                        <div className="text-sm">Name: {tx.name || 'Unknown'}</div>
                                        <div className="text-sm">
                                          Symbol: {tx.symbol || 'Unknown'}
                                        </div>
                                        <div className="text-sm">
                                          Creator:{' '}
                                          <span className="font-mono">
                                            {tx.details?.owner ||
                                              shortenAddress(tx.creator) ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        {tx.details?.features && (
                                          <div className="text-sm">
                                            Features: {tx.details.features}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Pool creation details */}
                                    {tx.type === 'PoolCreated' && (
                                      <div>
                                        <div className="text-sm">
                                          Creator:{' '}
                                          <span className="font-mono">
                                            {tx.details?.creator ||
                                              shortenAddress(tx.creator) ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="text-sm">
                                          Trade Pair:{' '}
                                          <span className="font-mono">
                                            {tx.details?.pair ||
                                              `${formatSymbol(tx.asset1Id)}/${formatSymbol(
                                                tx.asset2Id
                                              )}` ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="text-sm">
                                          LP Token:{' '}
                                          {tx.lpSymbol ||
                                            `LP ${formatSymbol(tx.lpAssetId)}` ||
                                            'Unknown'}
                                        </div>
                                      </div>
                                    )}

                                    {/* Ownership transfer details */}
                                    {tx.type === 'OwnershipTransferred' && (
                                      <div>
                                        <div className="text-sm">
                                          From:{' '}
                                          <span className="font-mono">
                                            {tx.details?.from ||
                                              shortenAddress(tx.sender) ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="text-sm">
                                          To:{' '}
                                          <span className="font-mono">
                                            {tx.details?.to ||
                                              shortenAddress(tx.recipient) ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Asset wrapped details */}
                                    {tx.type === 'AssetWrapped' && (
                                      <div>
                                        <div className="text-sm">
                                          From:{' '}
                                          <span className="font-mono">
                                            {tx.details?.from ||
                                              shortenAddress(tx.sender) ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="text-sm">
                                          To:{' '}
                                          <span className="font-mono">
                                            {tx.details?.to ||
                                              shortenAddress(tx.recipient) ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="text-sm">
                                          <span className="text-green-600">
                                            +{formatAmount(tx.amount, tx.assetId)}
                                          </span>{' '}
                                          {formatSymbol(tx.assetId)}
                                        </div>
                                      </div>
                                    )}

                                    {/* Asset unwrapped details */}
                                    {tx.type === 'AssetUnwrapped' && (
                                      <div>
                                        <div className="text-sm">
                                          From:{' '}
                                          <span className="font-mono">
                                            {tx.details?.from ||
                                              shortenAddress(tx.sender) ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="text-sm">
                                          To:{' '}
                                          <span className="font-mono">
                                            {tx.details?.to ||
                                              shortenAddress(tx.recipient) ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="text-sm">
                                          <span className="text-green-600">
                                            +{formatAmount(tx.amount, tx.assetId)}
                                          </span>{' '}
                                          {formatSymbol(tx.assetId)}
                                        </div>
                                      </div>
                                    )}

                                    {/* Bridge withdraw details */}
                                    {tx.type === 'BridgeWithdraw' && (
                                      <div>
                                        <div className="text-sm">
                                          From:{' '}
                                          <span className="font-mono">
                                            {tx.details?.from ||
                                              shortenAddress(tx.sender) ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="text-sm">
                                          To:{' '}
                                          <span className="font-mono">
                                            {tx.details?.to ||
                                              shortenAddress(tx.recipient) ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="text-sm">
                                          To Chain: {tx.toChain || tx.details?.toChain || 'Unknown'}
                                        </div>
                                        <div className="text-sm text-red-600">
                                          Amount: -{formatAmount(tx.amount, tx.assetId)}{' '}
                                          {formatSymbol(tx.assetId)}
                                        </div>
                                        <div className="text-sm text-orange-600">
                                          Fee: {formatAmount(tx.fee, tx.assetId)}
                                        </div>
                                      </div>
                                    )}

                                    {/* Bridge deposit details */}
                                    {tx.type === 'BridgeDeposit' && (
                                      <div>
                                        <div className="text-sm">
                                          From:{' '}
                                          <span className="font-mono">
                                            {tx.details?.from ||
                                              shortenAddress(tx.sender) ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="text-sm">
                                          To:{' '}
                                          <span className="font-mono">
                                            {tx.details?.to ||
                                              shortenAddress(tx.recipient) ||
                                              'Unknown'}
                                          </span>
                                        </div>
                                        <div className="text-sm">
                                          From Chain:{' '}
                                          {tx.fromChain || tx.details?.fromChain || 'Unknown'}
                                        </div>
                                        <div className="text-sm text-green-600">
                                          Amount: +{formatAmount(tx.amount, tx.assetId)}
                                          {formatSymbol(tx.assetId)}
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right whitespace-nowrap">
                                    <div>{new Date(tx.timestamp).toLocaleDateString()}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(tx.timestamp).toLocaleTimeString()}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        window.open(
                                          `https://testnet.suivision.xyz/txblock/${tx.id}`,
                                          '_blank'
                                        )
                                      }
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}

          <AssetActionDialog
            open={actionDialogOpen}
            onOpenChange={setActionDialogOpen}
            operation={operation}
            quantity={quantity}
            onQuantityChange={setQuantity}
            recipientAddress={recipientAddress}
            onRecipientAddressChange={setRecipientAddress}
            onConfirm={handleActionConfirm}
          />
        </div>
      )}
    </>
  );
}

function AssetActionDialog({
  open,
  onOpenChange,
  operation,
  quantity,
  onQuantityChange,
  recipientAddress,
  onRecipientAddressChange,
  onConfirm
}: AssetActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            {operation?.type === 'transferAll'
              ? 'Please enter the recipient address for the transfer all action.'
              : 'Please enter the quantity and recipient address for the selected action.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {operation?.type !== 'transferAll' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                value={quantity}
                onChange={(e) => onQuantityChange(e.target.value)}
                className="col-span-3"
              />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="recipientAddress" className="text-right">
              Recipient Address
            </Label>
            <Input
              id="recipientAddress"
              value={recipientAddress}
              onChange={(e) => onRecipientAddressChange(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={onConfirm}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
