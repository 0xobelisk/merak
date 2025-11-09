import Link from 'next/link';
import React, { useEffect } from 'react';
import { ConnectButton, useCurrentWallet } from '@mysten/dapp-kit';
import Image from 'next/image';
import { IndexerSettings } from './settings/indexer-settings';
import { WalletMenu } from './wallet/wallet-menu';

export default function Header() {
  const { currentWallet, connectionStatus } = useCurrentWallet();

  return (
    <header className="flex items-center justify-between px-4 h-14 bg-transparent border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Image src="/merak-logo.svg" alt="Merak Logo" width={120} height={30} priority />
        </div>
        <span className="text-xs bg-blue-100 text-blue-500 px-2 py-1 rounded-full">Testnet</span>
      </div>
      <nav className="hidden md:flex items-center space-x-6">
        <Link href="/wrap" className="text-sm font-medium text-gray-600 hover:text-blue-500">
          Wrap
        </Link>
        <Link
          href="/swap/0000000000000000000000000000000000000000000000000000000000000002::sui::SUI/8c7013745af0eb1ab211cde05b40ee6e2130276664d7e3e3741a36f11fa9f20b::dubhe::DUBHE"
          className="text-sm font-medium text-gray-600 hover:text-blue-500"
        >
          Swap
        </Link>
        <Link href="/pool" className="text-sm font-medium text-gray-600 hover:text-blue-500">
          Pool
        </Link>
        <Link href="/positions" className="text-sm font-medium text-gray-600 hover:text-blue-500">
          Positions
        </Link>
        <Link
          href="https://merak-docs.obelisk.build/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-gray-600 hover:text-blue-500"
        >
          Docs
        </Link>
      </nav>
      <div className="flex items-center space-x-4">
        {currentWallet ? (
          <>
            <WalletMenu address={currentWallet.accounts[0].address} />
            <IndexerSettings />
          </>
        ) : (
          <ConnectButton className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-full" />
        )}
      </div>
    </header>
  );
}
