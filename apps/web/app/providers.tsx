'use client';

import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { Provider } from 'jotai';

import contractMetadata from 'dubhe-framework/metadata.json';
import dubheMetadata from 'dubhe-framework/dubhe.config.json';
import { DUBHE_SCHEMA_ID, PACKAGE_ID, NETWORK } from 'dubhe-framework/deployment';

import Header from '@/app/components/header';
import React from 'react';
import AppWrapper from '@/app/wrapper';

import { SuiMoveNormalizedModules } from '@0xobelisk/sui-client';
import { DubheProvider, DubheConfig } from '@0xobelisk/react/sui';

const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl('localnet') },
  devnet: { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Metadata caching: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on window focus by default (hooks can override)
      refetchOnWindowFocus: false,
      // Refetch on mount if data is stale
      refetchOnMount: true,
      // Don't refetch on reconnect by default
      refetchOnReconnect: false
    }
  }
});

const DUBHE_CONFIG: DubheConfig = {
  network: NETWORK,
  packageId: PACKAGE_ID,
  dubheSchemaId: DUBHE_SCHEMA_ID,
  metadata: contractMetadata as SuiMoveNormalizedModules,
  dubheMetadata,
  endpoints: {
    graphql: 'https://dubhe-framework-testnet-api.obelisk.build/graphql',
    websocket: 'wss://dubhe-framework-testnet-api.obelisk.build/graphql'
  },
  options: {
    enableBatchOptimization: true,
    cacheTimeout: 3000,
    debounceMs: 100,
    reconnectOnError: true
  }
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork={NETWORK}>
          <WalletProvider
            autoConnect={true}
            preferredWallets={['Sui Wallet', 'Sui Wallet (Sui Wallet)']}
          >
            <DubheProvider config={DUBHE_CONFIG}>
              {/* <EnokiFlowProvider apiKey="enoki_public_7278cc47e76ec32331cf1f8fc83a4b1a"> */}
              <Toaster />
              <div>
                <Header />
                <AppWrapper>{children}</AppWrapper>
              </div>
              {/* </EnokiFlowProvider> */}
            </DubheProvider>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </Provider>
  );
}
