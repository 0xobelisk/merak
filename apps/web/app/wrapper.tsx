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
  SESSION_TIMEOUT: 60 * 60 * 1000 // 30 minutes in milliseconds
};

export default function AppWrapper({ children }: AppWrapperProps) {
  const { currentWallet, connectionStatus } = useCurrentWallet();
  const wallets = useWallets();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false);

  // Store wallet info in localStorage when connected
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

        // Save to sessionStorage for current session with timestamp
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
      // Only attempt reconnect if disconnected, not already reconnecting, and haven't tried yet
      if (connectionStatus === 'disconnected' && !isReconnecting && !hasAttemptedReconnect && wallets.length > 0) {
        setHasAttemptedReconnect(true);
        
        try {
          // Check both session and local storage
          const sessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION);
          const localData = localStorage.getItem(STORAGE_KEYS.LOCAL);
          
          // Prefer session data if it exists and is not expired
          let walletToConnect = null;
          let walletName = null;
          
          if (sessionData) {
            const parsedSession = JSON.parse(sessionData);
            const sessionAge = Date.now() - parsedSession.timestamp;
            
            // Use session data if not expired
            if (sessionAge < STORAGE_KEYS.SESSION_TIMEOUT) {
              walletName = parsedSession.name;
            }
          }
          
          // Fall back to local storage if session is expired or doesn't exist
          if (!walletName && localData) {
            const parsedLocal = JSON.parse(localData);
            walletName = parsedLocal.name;
          }
          
          // If we found a wallet name, try to connect
          if (walletName) {
            setIsReconnecting(true);
            
            // Find the wallet in available wallets
            walletToConnect = wallets.find(wallet => wallet.name === walletName);
            
            if (walletToConnect) {
              try {
                // Add delay to ensure wallet adapter is ready
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // @ts-ignore - Using internal API
                if (typeof walletToConnect.select === 'function') {
                  // @ts-ignore
                  await walletToConnect.select();
                  console.log('Wallet reconnected successfully:', walletName);
                }
              } catch (error) {
                console.error('Wallet reconnection failed:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error during reconnection process:', error);
        } finally {
          setIsReconnecting(false);
        }
      }
    };

    // Attempt reconnection when component mounts
    attemptReconnect();
  }, [connectionStatus, wallets, isReconnecting, hasAttemptedReconnect]);

  // Save wallet info whenever connection status changes to connected
  useEffect(() => {
    if (connectionStatus === 'connected' && currentWallet) {
      saveWalletInfo();
    }
  }, [connectionStatus, currentWallet, saveWalletInfo]);

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

  // Return children directly if wallet is connected
  return <>{children}</>;
}
