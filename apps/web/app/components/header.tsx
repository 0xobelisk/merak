import Link from 'next/link';
import React, { useEffect } from 'react';
import { ConnectButton, useCurrentWallet } from '@mysten/dapp-kit';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent } from '@repo/ui/components/ui/sheet';
import { IndexerSettings } from './settings/indexer-settings';
import { WalletMenu } from './wallet/wallet-menu';

export default function Header() {
  const { currentWallet, connectionStatus } = useCurrentWallet();

  return (
    <header className="bg-transparent border-b border-gray-200">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          <Image src="/merak-logo.svg" alt="Merak Logo" width={120} height={30} priority />
        </div>
        <span className="text-xs bg-blue-100 text-blue-500 px-2 py-1 rounded-full">Testnet</span>
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/wrap" className="text-sm font-medium text-gray-600 hover:text-blue-500">
            Wrap
          </Link>
        <Link href="/swap/0/1" className="text-sm font-medium text-gray-600 hover:text-blue-500">
          Swap
        </Link>
        <Link href="/pool" className="text-sm font-medium text-gray-600 hover:text-blue-500">
          Pool
        </Link>
        <Link href="/positions" className="text-sm font-medium text-gray-600 hover:text-blue-500">
          Positions
        </Link>
        <Link href="/assets" className="text-sm font-medium text-gray-600 hover:text-blue-500">
          Assets
        </Link>
        <Link href="/portfolio" className="text-sm font-medium text-gray-600 hover:text-blue-500">
          Portfolio
        </Link>
        <Link href="/bridge" className="text-sm font-medium text-gray-600 hover:text-blue-500">
          Bridge
        </Link>
        <Link
          href="https://merak-docs.obelisk.build/"
          className="text-sm font-medium text-gray-600 hover:text-blue-500"
        >
          Docs
        </Link>
        {/* <Link href="/create" className="text-sm font-medium text-gray-600 hover:text-blue-500">
          Create Token
        </Link> */}
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <button className="md:hidden p-2 rounded-md border border-gray-200">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open Menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="left">
          <div className="p-4 space-y-4">
            <Link
              href="/wrap"
              className="block text-sm font-medium text-gray-600 hover:text-blue-500"
            >
              Wrap
            </Link>
            <Link
              href="/swap/0/1"
              className="block text-sm font-medium text-gray-600 hover:text-blue-500"
            >
              Swap
            </Link>
            <Link
              href="/pool"
              className="block text-sm font-medium text-gray-600 hover:text-blue-500"
            >
              Pool
            </Link>
            <Link
              href="/positions"
              className="block text-sm font-medium text-gray-600 hover:text-blue-500"
            >
              Positions
            </Link>
            <Link
              href="/assets"
              className="block text-sm font-medium text-gray-600 hover:text-blue-500"
            >
              Assets
            </Link>
            <Link
              href="/portfolio"
              className="block text-sm font-medium text-gray-600 hover:text-blue-500"
            >
              Portfolio
            </Link>
            <Link
              href="/bridge"
              className="block text-sm font-medium text-gray-600 hover:text-blue-500"
            >
              Bridge
            </Link>
            <Link
              href="https://merak-docs.obelisk.build/"
              className="block text-sm font-medium text-gray-600 hover:text-blue-500"
            >
              Docs
            </Link>
            {currentWallet ? (
              <div className="flex flex-col space-y-2">
                <WalletMenu address={currentWallet.accounts[0].address} />
                <IndexerSettings />
              </div>
            ) : (
              <ConnectButton className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-full" />
            )}
          </div>
        </SheetContent>
      </Sheet>
      <div className="hidden md:flex items-center space-x-4">
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
