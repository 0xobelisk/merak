'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMerak } from '@/app/jotai/merak';

/**
 * Global Data Provider Component
 * 
 * This component prefetches commonly used data when the user connects their wallet:
 * 1. Registry assets (whitelist)
 * 2. Asset wrappers (coinType mappings)
 * 3. User's owned assets
 * 4. Pool list
 * 
 * Benefits:
 * - Data is ready before components mount
 * - Reduces initial loading states
 * - Leverages React Query's caching
 */
export default function DataProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const account = useCurrentAccount();
  const merak = useMerak();

  useEffect(() => {
    // Only prefetch when wallet is connected and merak is initialized
    if (!account?.address || !merak) {
      return;
    }

    // Prefetch registry assets (whitelist)
    queryClient.prefetchQuery({
      queryKey: ['registryAssets', 'live'],
      queryFn: async () => {
        const response = await fetch('/api/registry?status=live');
        if (!response.ok) {
          throw new Error('Failed to fetch registry assets');
        }
        return response.json();
      },
      staleTime: 10 * 60 * 1000 // 10 minutes for registry data
    });

    // Prefetch asset wrappers
    queryClient.prefetchQuery({
      queryKey: ['assetWrappers'],
      queryFn: async () => {
        const response = await fetch('/api/assets/wrapper');
        if (!response.ok) {
          throw new Error('Failed to fetch asset wrappers');
        }
        return response.json();
      },
      staleTime: 5 * 60 * 1000
    });

    // Prefetch user's owned assets
    queryClient.prefetchQuery({
      queryKey: ['userAssets', account.address, undefined, undefined, undefined, undefined],
      queryFn: async () => {
        return merak.listOwnedAssetsInfo({
          account: account.address!
        });
      },
      staleTime: 5 * 60 * 1000
    });

    // Prefetch pools list
    queryClient.prefetchQuery({
      queryKey: ['pools', 3],
      queryFn: async () => {
        return merak.listPoolsInfo({
          pageSize: 3
        });
      },
      staleTime: 5 * 60 * 1000
    });

    console.log('[DataProvider] Prefetched common data for user:', account.address);
  }, [account?.address, merak, queryClient]);

  return <>{children}</>;
}

