'use client';

import { useEffect, useState, useCallback } from 'react';
import { ConnectButton, useCurrentWallet, useWallets } from '@mysten/dapp-kit';

interface AppWrapperProps {
  children: React.ReactNode;
}

// Constants for storage keys
const STORAGE_KEYS = {
  LOCAL: 'sui_wallet_info',
  SESSION: 'sui_wallet_session',
  SESSION_TIMEOUT: 30 * 60 * 1000 // 30 minutes in milliseconds
};

export default function AppWrapper({ children }: AppWrapperProps) {
  const { currentWallet, connectionStatus } = useCurrentWallet();
  const wallets = useWallets();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 3;
  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false);

  // Store wallet info in both localStorage and sessionStorage
  const saveWalletInfo = useCallback(() => {
    if (connectionStatus === 'connected' && currentWallet) {
      try {
        // Save to localStorage for persistent storage
        localStorage.setItem(
          STORAGE_KEYS.LOCAL,
          JSON.stringify({
            name: currentWallet.name,
            accounts: currentWallet.accounts.map((account) => account.address),
            lastConnected: new Date().toISOString()
          })
        );

        // Save to sessionStorage for current session
        sessionStorage.setItem(
          STORAGE_KEYS.SESSION,
          JSON.stringify({
            name: currentWallet.name,
            timestamp: Date.now()
          })
        );

        console.log('Wallet info saved successfully:', currentWallet.name);
      } catch (error) {
        console.error('Failed to save wallet info:', error);
      }
    }
  }, [connectionStatus, currentWallet]);

  // Attempt to automatically reconnect to the last used wallet
  useEffect(() => {
    const attemptReconnect = async () => {
      if (connectionStatus === 'disconnected' && !isReconnecting && !hasAttemptedReconnect) {
        setHasAttemptedReconnect(true);
        const savedWalletInfo = localStorage.getItem(STORAGE_KEYS.LOCAL);

        if (!savedWalletInfo) return;

        try {
          setIsReconnecting(true);
          const parsedInfo = JSON.parse(savedWalletInfo);

          // Find matching wallet
          const savedWallet = wallets.find((wallet) => wallet.name === parsedInfo.name);

          if (!savedWallet) return;

          // Simplified connection logic - use direct method
          try {
            // @ts-ignore
            if (typeof savedWallet.select === 'function') {
              await new Promise((resolve) => setTimeout(resolve, 500)); // Add delay
              // @ts-ignore
              await savedWallet.select();
              console.log('Wallet selected successfully');
            }
          } catch (error) {
            console.error('Wallet connection failed:', error);
            localStorage.removeItem(STORAGE_KEYS.LOCAL);
          }
        } catch (error) {
          console.error('Error during reconnection:', error);
        } finally {
          setIsReconnecting(false);
        }
      }
    };

    // Execute reconnection attempt
    if (wallets.length > 0) {
      attemptReconnect();
    }

    // No retry timer needed
  }, [connectionStatus, wallets, isReconnecting, hasAttemptedReconnect]);

  // Save wallet info when connected
  useEffect(() => {
    if (connectionStatus === 'connected' && currentWallet) {
      saveWalletInfo();
    }
  }, [connectionStatus, currentWallet, saveWalletInfo]);

  // Monitor connection status changes
  useEffect(() => {
    if (connectionStatus === 'connected' && currentWallet) {
      console.log('Wallet connected:', currentWallet.name);
      // Reset reconnection attempt counter
      setReconnectAttempts(0);
    }
  }, [connectionStatus, currentWallet]);

  // Display connection prompt or application content
  if (!currentWallet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="p-8 bg-white/80 rounded-lg shadow-md backdrop-blur-sm">
          <h1 className="mb-4 text-2xl font-bold text-center">Welcome to Merak</h1>
          <p className="mb-6 text-center text-gray-600">
            {isReconnecting
              ? 'Attempting to reconnect your wallet...'
              : 'Please connect your wallet to access all features.'}
          </p>
          <ConnectButton className="w-full" />
        </div>
      </div>
    );
  }

  return <div className="min-h-screen">{children}</div>;
}
