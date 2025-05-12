import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@repo/ui/components/ui/dropdown-menu';
import { useDisconnectWallet, useSwitchAccount } from '@mysten/dapp-kit';
import { Copy, LogOut, ArrowLeftRight } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

// Storage keys - keep in sync with wrapper.tsx
const STORAGE_KEYS = {
  LOCAL: 'sui_wallet_info',
  SESSION: 'sui_wallet_session'
};

export function WalletMenu({ address }: { address: string }) {
  const { mutate: disconnect } = useDisconnectWallet();
  const { mutate: switchAccount } = useSwitchAccount();

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const handleSelectAccount = (e: React.MouseEvent) => {
    e.preventDefault();
    switchAccount({ account: undefined });
  };

  const handleDisconnect = (e: React.MouseEvent) => {
    e.preventDefault();

    // Clear wallet info from storage when disconnecting
    try {
      localStorage.removeItem(STORAGE_KEYS.LOCAL);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch (error) {
      console.error('Error clearing wallet storage:', error);
    }

    // Disconnect the wallet
    disconnect();
    toast.info('Wallet disconnected');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full cursor-pointer transition-colors border border-gray-200 dark:border-gray-700">
          <Image src="/sui-logo.svg" alt="SUI" width={20} height={20} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[300px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
        align="end"
      >
        <DropdownMenuLabel className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Connected with Sui Wallet
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-800" />
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg m-2 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Image src="/sui-logo.svg" alt="SUI" width={32} height={32} />
            <div className="flex space-x-2">
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        </div>
        <div className="p-1">
          {/* <DropdownMenuItem
            className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={handleSelectAccount}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Switch Account</span>
          </DropdownMenuItem> */}
          <DropdownMenuItem
            className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            onClick={handleDisconnect}
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
