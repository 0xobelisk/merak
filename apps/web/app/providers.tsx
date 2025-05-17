'use client';

import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { Provider } from 'jotai';
import { NETWORK } from '@/app/chain/config';
import { EnokiFlowProvider } from '@mysten/enoki/react';
import Header from '@/app/components/header';
import React from 'react';
import AppWrapper from '@/app/wrapper';
import useForceClientUpdate from './hooks/useForceClientUpdate';

const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl('localnet') },
  devnet: { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') }
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  useForceClientUpdate();
  return (
    <Provider>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork={NETWORK}>
          <WalletProvider
            autoConnect={true}
            preferredWallets={['Sui Wallet', 'Sui Wallet (Sui Wallet)']}
          >
            {/* <EnokiFlowProvider apiKey="enoki_public_7278cc47e76ec32331cf1f8fc83a4b1a"> */}
            <Toaster />
            <div>
              <Header />
              <AppWrapper>{children}</AppWrapper>
            </div>
            {/* </EnokiFlowProvider> */}
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </Provider>
  );
}
