'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { X, Search, Info, Loader2 } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { AssetsStateAtom } from '@/app/jotai/assets';
import { AssetInfo } from '@0xobelisk/merak-sdk';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { initDubheClient } from '@/app/jotai/dubhe';
import { initMerakClient } from '@/app/jotai/merak';

// Set default icon to SUI icon
const DEFAULT_ICON = 'https://hop.ag/tokens/SUI.svg';

// Popular tokens to show in quick select area
const POPULAR_TOKENS = [
  { symbol: 'SUI', icon: 'https://hop.ag/tokens/SUI.svg' },
  {
    symbol: 'DUBHE',
    icon: 'https://pbs.twimg.com/profile_images/1904156933516668928/W9y4Vor__400x400.jpg'
  }
];

// 支持的 Native Token 列表 - 更新为完整的代币类型
const SUPPORTED_NATIVE_COINS = [
  {
    symbol: 'SUI',
    type: '0x2::sui::SUI'
  },
  {
    symbol: 'DUBHE',
    type: '0x2300e4f190870ae8cee2f648f745e96c06fa4ce9c3bd5439d3ee4287df0d9887::dubhe::DUBHE'
  }
];

// Trending tokens examples - 保留示例用于显示，实际数据会动态加载
const TRENDING_TOKENS = {
  native: [], // 空数组，将动态填充
  merak: [] // 空数组，将在组件内动态填充
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
  const [activeTab, setActiveTab] = useState<'native' | 'merak'>('native');
  const [merakTokens, setMerakTokens] = useState<any[]>([]);
  const [nativeTokens, setNativeTokens] = useState<any[]>([]);
  const [isNativeLoading, setIsNativeLoading] = useState(true);

  // 获取可用的代币列表
  const getAvailableAssets = useCallback(() => {
    console.log('⭐ getAvailableAssets called with selectionType:', selectionType);
    
    if (selectionType === 'from') {
      console.log('📋 FROM selection - returning all assets:', assetsState.assetInfos.length);
      return assetsState.assetInfos;
    }
    
    if (availableToTokens) {
      console.log('📋 TO selection with availableToTokens:', availableToTokens);
      return availableToTokens;
    }

    if (availableTokenIds) {
      console.log('📋 TO selection with availableTokenIds:', availableTokenIds);
      const filtered = assetsState.assetInfos.filter((asset) =>
        availableTokenIds.includes(Number(asset.assetId))
      );
      console.log('➡️ Filtered by IDs result:', filtered.length, 'tokens');
      return filtered;
    }

    console.log('📋 Default case - returning all assets:', assetsState.assetInfos.length);
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
          asset.metadata?.name.toLowerCase().includes(lowercasedTerm) || // name
          asset.metadata?.symbol.toLowerCase().includes(lowercasedTerm) // symbol
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
    console.log('🎯 Token selected:', asset);
    console.log('- Type:', asset.coinType ? 'Native' : 'Merak');
    console.log('- Details:', asset.coinType || asset.assetId, asset.symbol || asset.metadata?.symbol);

    // 处理 Native 代币的选择
    if (asset.coinType) {
      onSelectToken({
        symbol: asset.symbol,
        name: asset.name,
        icon: asset.icon,
        balance: asset.balanceFormatted,
        coinType: asset.coinType,
        decimals: asset.decimals
      });
      onClose();
      return;
    }

    // 处理 Merak 代币的选择
    const decimals = asset.metadata?.decimals || 18;
    const balanceValue = Number(asset.balance) / Math.pow(10, decimals);
    const formattedBalance = !isNaN(balanceValue)
      ? balanceValue.toLocaleString(undefined, { maximumFractionDigits: 4 })
      : '0';

    onSelectToken({
      symbol: asset.metadata?.symbol || asset.symbol,
      name: asset.metadata?.name || asset.name,
      icon: asset.metadata?.icon_url || asset.icon || DEFAULT_ICON,
      balance: formattedBalance,
      id: asset.assetId || '',
      decimals: decimals
    });
    onClose();
  };

  // Handle popular token selection
  const handlePopularTokenSelect = (token: any) => {
    // 查找匹配的 Native Token
    const matchedNative = nativeTokens.find((nativeToken) => nativeToken.symbol === token.symbol);

    if (matchedNative) {
      handleSelectToken(matchedNative);
      return;
    }

    // 如果在 Native 中未找到，检查 Merak 资产
    const matchedAsset = assetsState.assetInfos.find(
      (asset) => asset.metadata?.symbol === token.symbol
    );

    if (matchedAsset) {
      handleSelectToken(matchedAsset);
    } else {
      // 如果都未找到，使用默认值
      handleSelectToken({
        symbol: token.symbol,
        name: token.symbol,
        icon: token.icon,
        balance: '0',
        id: '',
        decimals: 18
      });
    }
  };

  // 修改获取 Merak 代币的逻辑，确保考虑可用的代币过滤条件
  const fetchMerakTokens = useCallback(async () => {
    if (!account?.address) return;

    try {
      setIsLoading(true);
      console.log('🌟 fetchMerakTokens called with:');
      console.log('- selectionType:', selectionType);
      console.log('- availableTokenIds:', availableTokenIds);
      console.log('- availableToTokens:', availableToTokens);
      
      const merak = initMerakClient();

      // 获取用户拥有的资产信息
      const ownedAssetsResults = await merak.listOwnedAssetsInfo({
        address: account.address
      });

      console.log('🔍 Owned Merak assets (total):', ownedAssetsResults.data.length);
      console.log('- First few assets:', ownedAssetsResults.data.slice(0, 2));
      console.log('- All asset IDs:', ownedAssetsResults.data.map(asset => Number(asset.assetId)));

      // 如果是to token，需要检查是否有availableTokenIds或availableToTokens限制
      let filteredOwnedAssets = ownedAssetsResults.data;
      
      if (selectionType === 'to' && availableTokenIds) {
        console.log('⚙️ Filtering Merak tokens by availableTokenIds');
        const beforeCount = filteredOwnedAssets.length;
        
        // 重要修复：确保类型匹配 - 将两边都转换为Number进行比较
        filteredOwnedAssets = ownedAssetsResults.data.filter(asset => {
          const assetIdNum = Number(asset.assetId);
          const isIncluded = availableTokenIds.includes(assetIdNum);
          console.log(`Asset ID ${assetIdNum} included: ${isIncluded}`);
          return isIncluded;
        });
        
        console.log(`- Filtered from ${beforeCount} to ${filteredOwnedAssets.length} tokens`);
        console.log('- Available IDs:', availableTokenIds);
        console.log('- Asset IDs after filtering:', filteredOwnedAssets.map(a => Number(a.assetId)));
      } else if (selectionType === 'to' && availableToTokens) {
        console.log('⚙️ Filtering Merak tokens by availableToTokens');
        const beforeCount = filteredOwnedAssets.length;
        
        // 获取可用的ID列表
        const availableIds = availableToTokens.map(t => t.assetId);
        console.log('- Available IDs from tokens:', availableIds);
        
        // 重要修复：确保比较时两边的类型一致，都使用字符串
        filteredOwnedAssets = ownedAssetsResults.data.filter(asset => {
          const isIncluded = availableIds.includes(asset.assetId);
          console.log(`Asset ID ${asset.assetId} included: ${isIncluded}, symbol: ${asset.metadata?.symbol}`);
          return isIncluded;
        });
        
        console.log(`- Filtered from ${beforeCount} to ${filteredOwnedAssets.length} tokens`);
        console.log('- Asset IDs after filtering:', filteredOwnedAssets.map(a => a.assetId));
        console.log('- Token symbols after filtering:', filteredOwnedAssets.map(a => a.metadata?.symbol));
      } else {
        console.log('⚙️ No filtering applied to Merak tokens (from selection or no criteria)');
      }

      // 如果过滤后为空，检查是否有错误
      if (filteredOwnedAssets.length === 0 && (availableTokenIds?.length || availableToTokens?.length)) {
        console.warn('⚠️ WARNING: Filtered token list is empty but available tokens were provided!');
        console.warn('- This might indicate a type mismatch in ID comparison');
        // 调试详细信息
        if (availableTokenIds) {
          console.log('Available IDs types:', availableTokenIds.map(id => typeof id));
        }
        if (availableToTokens) {
          console.log('Available Token IDs types:', availableToTokens.map(t => typeof t.assetId));
        }
        console.log('Asset IDs types:', ownedAssetsResults.data.map(a => typeof a.assetId));
      }

      // 直接处理返回的数据，余额信息已经包含在里面
      const formattedTokens = filteredOwnedAssets.map((asset) => {
        // 计算格式化的余额，考虑精度
        const decimals = asset.metadata?.decimals || 18;
        const rawBalance = asset.balance || '0';
        const balanceValue = Number(rawBalance) / Math.pow(10, decimals);

        // 格式化余额，保留 4 位小数
        const formattedBalance = !isNaN(balanceValue)
          ? balanceValue.toLocaleString(undefined, { maximumFractionDigits: 4 })
          : '0';

        return {
          symbol: asset.metadata?.symbol || '',
          name: asset.metadata?.name || '',
          icon: asset.metadata?.icon_url || DEFAULT_ICON,
          assetId: asset.assetId,
          balance: asset.balance || '0',
          balanceFormatted: formattedBalance,
          metadata: asset.metadata,
          originalAsset: asset // 保存原始资产数据
        };
      });

      // 按余额降序排列
      const sortedTokens = formattedTokens.sort((a, b) => {
        const balanceA = Number(a.balance) / Math.pow(10, a.metadata?.decimals || 18);
        const balanceB = Number(b.balance) / Math.pow(10, b.metadata?.decimals || 18);
        return balanceB - balanceA;
      });

      setMerakTokens(sortedTokens);
      console.log('✅ Final Merak tokens count:', sortedTokens.length);
      console.log('- Tokens to display:', sortedTokens.map(t => `${t.symbol} (ID: ${t.assetId})`));
    } catch (error) {
      console.error('❌ Error fetching Merak tokens:', error);
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, selectionType, availableTokenIds, availableToTokens]);

  // 获取 Native Tokens with debugging
  const fetchNativeTokens = useCallback(async () => {
    if (!account?.address) return;
    setIsNativeLoading(true);

    try {
      console.log('🌟 fetchNativeTokens called with:');
      console.log('- selectionType:', selectionType);
      console.log('- availableTokenIds:', availableTokenIds);
      console.log('- availableToTokens:', availableToTokens);
      
      const dubhe = initDubheClient();
      const allBalances = await dubhe.suiInteractor.currentClient.getAllBalances({
        owner: account.address
      });

      // 使用类似 Portfolio 页面的方式获取代币元数据
      const updatedBalances = await Promise.all(
        allBalances.map(async (coinBalance) => {
          try {
            const metadata = await dubhe.suiInteractor.currentClient.getCoinMetadata({
              coinType: coinBalance.coinType
            });

            // 按照 Portfolio 页面类似的方式计算余额
            const decimals = metadata?.decimals || 9;
            const balanceValue = Number(coinBalance.totalBalance) / Math.pow(10, decimals);

            return {
              ...coinBalance,
              metadata,
              balanceFormatted: !isNaN(balanceValue)
                ? balanceValue.toLocaleString(undefined, {
                    maximumFractionDigits: 4
                  })
                : '0'
            };
          } catch (error) {
            console.error(`Error fetching metadata for ${coinBalance.coinType}:`, error);
            return {
              ...coinBalance,
              metadata: null,
              balanceFormatted: '0'
            };
          }
        })
      );

      // 过滤出仅支持的币种
      const supportedBalances = updatedBalances.filter((balance) =>
        SUPPORTED_NATIVE_COINS.some(
          (supportedCoin) =>
            supportedCoin.type === balance.coinType ||
            balance.coinType.includes(supportedCoin.type) ||
            supportedCoin.type.includes(balance.coinType)
        )
      );

      // 转换为必要的格式
      const formattedTokens = supportedBalances.map((balance) => {
        const decimals = balance.metadata?.decimals || 9;
        const balanceValue = Number(balance.totalBalance) / Math.pow(10, decimals);

        // 查找对应的支持币种以确保图标正确
        const supportedCoin = SUPPORTED_NATIVE_COINS.find(
          (coin) =>
            coin.type === balance.coinType ||
            balance.coinType.includes(coin.type) ||
            coin.type.includes(balance.coinType)
        );

        return {
          coinType: balance.coinType,
          symbol: balance.metadata?.symbol || supportedCoin?.symbol || 'Unknown',
          name:
            balance.metadata?.name ||
            balance.metadata?.symbol ||
            supportedCoin?.symbol ||
            'Unknown',
          icon:
            balance.metadata?.iconUrl ||
            (supportedCoin?.symbol === 'SUI'
              ? 'https://hop.ag/tokens/SUI.svg'
              : supportedCoin?.symbol === 'DUBHE'
                ? 'https://pbs.twimg.com/profile_images/1904156933516668928/W9y4Vor__400x400.jpg'
                : DEFAULT_ICON),
          balance: balance.totalBalance,
          balanceFormatted: !isNaN(balanceValue)
            ? balanceValue.toLocaleString(undefined, {
                maximumFractionDigits: 4
              })
            : '0',
          decimals: decimals,
          metadata: balance.metadata
        };
      });
      
      // Native tokens don't have the same IDs as Merak tokens
      console.log('⚙️ Native tokens before any filtering:', formattedTokens.length);
      console.log('- Symbols:', formattedTokens.map(t => t.symbol));
      
      // Apply filtering only for "to" selection if needed
      let filteredTokens = formattedTokens;
      
      // For now, we don't filter native tokens based on IDs
      console.log('✅ Final Native tokens count:', filteredTokens.length);
      console.log('- Symbols after potential filtering:', filteredTokens.map(t => t.symbol));
      
      setNativeTokens(filteredTokens);
    } catch (error) {
      console.error('❌ Error fetching native tokens:', error);
    } finally {
      setIsNativeLoading(false);
    }
  }, [account?.address, selectionType]);

  // Keep only ONE combined effect that handles all data fetching
  useEffect(() => {
    if (account?.address) {
      console.log('🔄 TOKEN SELECTION MODAL REFRESH 🔄');
      console.log('- selectionType:', selectionType);
      console.log('- availableTokenIds:', availableTokenIds);
      console.log('- availableToTokens:', availableToTokens ? 'provided (length: ' + availableToTokens.length + ')' : 'not provided');
      
      fetchNativeTokens();
      fetchMerakTokens();
    }
  }, [
    fetchNativeTokens, 
    fetchMerakTokens, 
    account?.address, 
    selectionType, 
    availableTokenIds, 
    availableToTokens
  ]);

  // Add debug console for when tokens render
  useEffect(() => {
    console.log('💰 TOKENS READY FOR DISPLAY:');
    console.log('- Native tokens:', nativeTokens.length, nativeTokens.map(t => t.symbol));
    console.log('- Merak tokens:', merakTokens.length, merakTokens.map(t => t.symbol));
  }, [nativeTokens, merakTokens]);

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
                  src={token.icon}
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

          {/* Trending Tokens Section */}
          <div className="mb-4">
            <Tabs
              defaultValue="native"
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as 'native' | 'merak')}
            >
              <div className="mb-2">
                <h3 className="text-md font-medium text-gray-900">Trending Tokens</h3>
                <TabsList className="mt-1 bg-gray-100 p-0.5 rounded-lg">
                  <TabsTrigger
                    value="native"
                    className={`rounded-md px-4 py-1 text-sm ${activeTab === 'native' ? 'bg-white shadow-sm' : ''}`}
                  >
                    Native
                  </TabsTrigger>
                  <TabsTrigger
                    value="merak"
                    className={`rounded-md px-4 py-1 text-sm ${activeTab === 'merak' ? 'bg-white shadow-sm' : ''}`}
                  >
                    Merak
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="native" className="mt-0">
                <ScrollArea className="h-[360px] pr-4">
                  {isNativeLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    </div>
                  ) : nativeTokens.length === 0 ? (
                    <div className="flex justify-center items-center h-32 text-gray-500">
                      No native tokens available
                    </div>
                  ) : (
                    nativeTokens.map((token) => (
                      <div
                        key={token.coinType}
                        className="flex items-center justify-between py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 rounded-lg px-2"
                        onClick={() => handleSelectToken(token)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex-shrink-0">
                            <img
                              src={token.icon}
                              alt={token.symbol}
                              className="w-full h-full rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_ICON;
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{token.symbol}</div>
                            <div className="text-sm text-gray-500">{token.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-900 font-medium">
                            {token.balanceFormatted !== 'NaN' ? token.balanceFormatted : '0'}
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
              </TabsContent>

              <TabsContent value="merak" className="mt-0">
                <ScrollArea className="h-[360px] pr-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    </div>
                  ) : merakTokens.length === 0 ? (
                    <div className="flex justify-center items-center h-32 text-gray-500">
                      No Merak tokens available
                    </div>
                  ) : (
                    merakTokens.map((token) => (
                      <div
                        key={token.assetId}
                        className="flex items-center justify-between py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 rounded-lg px-2"
                        onClick={() => handleSelectToken(token.originalAsset)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex-shrink-0">
                            <img
                              src={token.icon}
                              alt={token.symbol}
                              className="w-full h-full rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_ICON;
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{token.symbol}</div>
                            <div className="text-sm text-gray-500">{token.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-900 font-medium">
                            {token.balanceFormatted}
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
              </TabsContent>
            </Tabs>
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
