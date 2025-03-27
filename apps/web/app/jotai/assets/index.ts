'use client';

import { atom } from 'jotai';
import { AssetMetadataType, AssetInfo } from '@0xobelisk/merak-sdk';

interface AssetsState {
  assetInfos: AssetInfo[];
}

// Transaction related types
interface TransactionResult {
  digest: string;
}

// Operation types
type AssetOperationType = 'transfer' | 'transferAll' | 'mint' | 'burn';

interface AssetOperation {
  type: AssetOperationType;
  assetId: number;
}

// Helper types
interface AssetWithMetadata {
  balance: string;
  status: boolean;
  metadata: AssetMetadataType | null;
}

// Component Props types
interface AssetsContentProps {
  assetsState: AssetsState;
  onActionClick: (action: AssetOperationType, assetId: number) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

interface AssetActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: AssetOperation | null;
  quantity: string;
  onQuantityChange: (value: string) => void;
  recipientAddress: string;
  onRecipientAddressChange: (value: string) => void;
  onConfirm: () => void;
}

// Initial state
const initialState: AssetsState = {
  assetInfos: []
};

// Create and export atoms
const AssetsStateAtom = atom<AssetsState>(initialState);
const AssetsLoadingAtom = atom<boolean>(false);
const TransactionDigestAtom = atom<string | null>('');
const AssetOperationAtom = atom<AssetOperation | null>({ type: 'transfer', assetId: 0 });
const SelectedAssetAtom = atom<AssetWithMetadata | null>(null);

// Create derived state
const CombinedAssetsAtom = atom((get) => {
  const state = get(AssetsStateAtom);
  return state.assetInfos.map((assetInfo, index) => ({
    assetInfo: assetInfo
  }));
});

// Export atoms
export {
  AssetsStateAtom,
  AssetsLoadingAtom,
  TransactionDigestAtom,
  AssetOperationAtom,
  SelectedAssetAtom,
  CombinedAssetsAtom
};

// Export types
export type {
  AssetsState,
  TransactionResult,
  AssetOperationType,
  AssetOperation,
  AssetWithMetadata,
  AssetsContentProps,
  AssetActionDialogProps
};
