'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { X, Search, Info } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';
import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { AssetsStateAtom } from '@/app/jotai/assets';
import { AssetInfo } from '@0xobelisk/merak-sdk';
import { useCurrentAccount } from '@mysten/dapp-kit';

// Set default icon to SUI icon
const DEFAULT_ICON = '/sui-logo.svg';

// Popular tokens to show in quick select area
const POPULAR_TOKENS = [
  { symbol: 'SUI', icon_url: '/sui-logo.svg' },
  {
    symbol: 'DUBHE',
    icon_url: 'https://pbs.twimg.com/profile_images/1904156933516668928/W9y4Vor__400x400.jpg'
  }
];

// Helper function to safely format token balances
const formatTokenBalance = (balance: string | undefined, decimals: number = 18): string => {
  if (!balance) return '0';

  try {
    const numBalance = Number(balance);
    if (isNaN(numBalance)) return '0';

    const formattedBalance = numBalance / Math.pow(10, decimals);
    if (isNaN(formattedBalance)) return '0';

    return formattedBalance.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    });
  } catch (e) {
    console.error('Error formatting balance:', e);
    return '0';
  }
};

function TokenSelectionModalOpen({
  onSelectToken,
  onClose,
  selectionType,
  availableFromTokens,
  availableToTokens,
  availableTokenIds,
  isLoading: externalLoading
}: {
  onSelectToken: (token: any) => void;
  onClose: () => void;
  selectionType: 'from' | 'to';
  availableFromTokens?: AssetInfo[];
  availableToTokens?: AssetInfo[];
  availableTokenIds?: number[];
  isLoading?: boolean;
}) {
  const account = useCurrentAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [assetsState] = useAtom(AssetsStateAtom);
  const [filteredAssets, setFilteredAssets] = useState<any[]>([]);

  // Get available token list
  const getAvailableAssets = useCallback(() => {
    if (selectionType === 'from') {
      return assetsState.assetInfos;
    }
    if (availableToTokens) {
      console.log('Available to tokens:', availableToTokens);
      return availableToTokens;
    }

    if (availableTokenIds) {
      console.log('Available token IDs:', availableTokenIds);
      return assetsState.assetInfos.filter((asset) =>
        availableTokenIds.includes(Number(asset.assetId))
      );
    }

    return assetsState.assetInfos;
  }, [assetsState.assetInfos, availableToTokens, availableTokenIds, selectionType]);

  useEffect(() => {
    const initialFiltered = getAvailableAssets();
    console.log('Initial filtered assets:', initialFiltered);
    setFilteredAssets(initialFiltered);
    setIsLoading(false);
  }, [getAvailableAssets]);

  const filterTokens = useCallback(
    (term: string) => {
      setIsLoading(true);
      const lowercasedTerm = term.toLowerCase();

      // Filter base token list
      const filtered = getAvailableAssets().filter(
        (asset) =>
          asset.metadata?.name?.toLowerCase().includes(lowercasedTerm) || // name
          asset.metadata?.symbol?.toLowerCase().includes(lowercasedTerm) // symbol
      );

      setFilteredAssets(filtered);
      setIsLoading(false);
    },
    [getAvailableAssets]
  );

  const debouncedFilterTokens = useMemo(() => debounce(filterTokens, 300), [filterTokens]);

  useEffect(() => {
    debouncedFilterTokens(searchTerm);
    return () => {
      debouncedFilterTokens.cancel();
    };
  }, [searchTerm, debouncedFilterTokens]);

  const handleSelectToken = (asset: any) => {
    console.log('Selected asset:', asset);

    // Use the safe format function to get balance
    const formattedBalance = formatTokenBalance(asset.balance, asset.metadata?.decimals);
    console.log('Formatted balance:', formattedBalance);
    onSelectToken({
      symbol: asset.metadata?.symbol || 'Unknown',
      name: asset.metadata?.name || 'Unknown Token',
      icon_url: asset.metadata?.icon_url || DEFAULT_ICON,
      balance: formattedBalance,
      id: asset.assetId,
      decimals: asset.metadata?.decimals || 18
    });
    onClose();
  };

  // Handle popular token selection
  const handlePopularTokenSelect = (token: any) => {
    // Find matching asset by symbol
    const matchedAsset = assetsState.assetInfos.find(
      (asset) => asset.metadata?.symbol === token.symbol
    );

    if (matchedAsset) {
      handleSelectToken(matchedAsset);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]">
      <div className="bg-white rounded-3xl w-full max-w-[480px] relative">
        <div className="p-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-gray-900">Select a token</h2>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-gray-600 mb-5 text-sm">
            Select a token from our default list or search for a token by symbol or address.
          </p>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by token or address"
              className="pl-10 pr-4 py-2 w-full bg-gray-50 rounded-lg border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Popular Tokens Grid */}
          <div className="flex flex-wrap gap-2 mb-6">
            {POPULAR_TOKENS.map((token) => (
              <Button
                key={token.symbol}
                variant="outline"
                className="rounded-full px-3 py-1 h-auto border-gray-200 flex items-center gap-1.5"
                onClick={() => handlePopularTokenSelect(token)}
              >
                <img
                  src={token.icon_url}
                  alt={token.symbol}
                  className="w-5 h-5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_ICON;
                  }}
                />
                <span>{token.symbol}</span>
              </Button>
            ))}
          </div>

          {/* Tokens List */}
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-900 mb-2">Trending Tokens</h3>
            <ScrollArea className="h-[360px] pr-4">
              {isLoading || externalLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="flex justify-center items-center h-32 text-gray-500">
                  No tokens available
                </div>
              ) : (
                filteredAssets.map((asset) => (
                  <div
                    key={asset.assetId}
                    className="flex items-center justify-between py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 rounded-lg px-2"
                    onClick={() => handleSelectToken(asset)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex-shrink-0">
                        <img
                          src={asset.metadata?.icon_url || DEFAULT_ICON}
                          alt={asset.metadata?.symbol}
                          className="w-full h-full rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_ICON;
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {asset.metadata?.symbol || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {asset.metadata?.name || 'Unknown Token'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900 font-medium">
                        {formatTokenBalance(asset.balance, asset.metadata?.decimals)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full opacity-60 hover:opacity-100 inline-flex"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TokenSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: any) => void;
  selectionType: 'from' | 'to';
  availableFromTokens?: AssetInfo[];
  availableToTokens?: AssetInfo[];
  availableTokenIds?: number[];
  isLoading?: boolean;
}

const TokenSelectionModal: React.FC<TokenSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectToken,
  selectionType,
  availableFromTokens,
  availableToTokens,
  availableTokenIds,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <TokenSelectionModalOpen
      onSelectToken={onSelectToken}
      onClose={onClose}
      selectionType={selectionType}
      availableFromTokens={availableFromTokens}
      availableToTokens={availableToTokens}
      availableTokenIds={availableTokenIds}
      isLoading={isLoading}
    />
  );
};

export default TokenSelectionModal;
