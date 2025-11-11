'use client';

import { useState, useEffect } from 'react';
import { ConnectButton, useCurrentWallet } from '@mysten/dapp-kit';
import DataProvider from '@/app/components/data-provider';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { Wallet } from 'lucide-react';
import Image from 'next/image';

interface AppWrapperProps {
  children: React.ReactNode;
}

// Global flag to track if app has been initialized (survives route changes)
let appInitialized = false;

export default function AppWrapper({ children }: AppWrapperProps) {
  const { currentWallet, connectionStatus } = useCurrentWallet();
  const [isInitializing, setIsInitializing] = useState(!appInitialized);

  // Handle initialization state - only delay on first app load
  useEffect(() => {
    if (appInitialized) {
      // Already initialized, no delay needed
      setIsInitializing(false);
      return;
    }

    // First time initialization - give wallet provider time to restore connection
    const timer = setTimeout(() => {
      setIsInitializing(false);
      appInitialized = true;
    }, 500); // Reduced to 500ms for faster initial load

    return () => clearTimeout(timer);
  }, []);

  // Show loading state only during initial load or when actively connecting
  // This won't block navigation after first load
  if (isInitializing || connectionStatus === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="w-full max-w-lg p-10 space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/merak-logo.svg"
              alt="Merak Logo"
              width={160}
              height={40}
              priority
              className="animate-pulse"
            />
          </div>

          {/* Skeleton Loading Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 space-y-4">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6 mx-auto" />
            <Skeleton className="h-12 w-full mt-6" />
          </div>

          {/* Loading Text */}
          <p className="text-center text-gray-500 text-sm animate-pulse">
            {isInitializing ? 'Initializing application...' : 'Connecting to your wallet...'}
          </p>
        </div>
      </div>
    );
  }

  // Show connect wallet card if disconnected (after initialization)
  if (!currentWallet) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="w-full max-w-lg p-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image src="/merak-logo.svg" alt="Merak Logo" width={180} height={45} priority />
          </div>

          {/* Connect Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 p-10 space-y-6 transform transition-all hover:scale-[1.02]">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Wallet className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome to Merak
              </h1>
              <p className="text-gray-600 text-base leading-relaxed">
                Connect your wallet to access decentralized trading, liquidity pools, and asset
                management
              </p>
            </div>

            {/* Connect Button */}
            <div className="pt-4">
              <ConnectButton className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98]" />
            </div>

            {/* Footer Note */}
            <p className="text-center text-xs text-gray-500 pt-2">
              Secure and decentralized • No personal data required
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Wrap children with DataProvider for global data prefetching
  return <DataProvider>{children}</DataProvider>;
}
