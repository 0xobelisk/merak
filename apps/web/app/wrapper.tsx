'use client';

import { ConnectButton, useCurrentWallet } from '@mysten/dapp-kit';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const { currentWallet, connectionStatus } = useCurrentWallet();

  if (!currentWallet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="p-8 bg-white/80 rounded-lg shadow-md backdrop-blur-sm">
          <h1 className="mb-4 text-2xl font-bold text-center">Welcome to Merak</h1>
          <p className="mb-6 text-center text-gray-600">
            {connectionStatus === 'connecting'
              ? 'Connecting to your wallet...'
              : 'Please connect your wallet to access all features.'}
          </p>
          <ConnectButton className="w-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
