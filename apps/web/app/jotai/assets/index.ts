'use client';

import { atom } from 'jotai';
import { AssetInfo } from '@0xobelisk/merak-sdk';
import type { RegistryAsset, EnrichedAsset } from '@/app/types/registry';

interface AssetsState {
  assetInfos: AssetInfo[];
}

interface RegistryAssetsState {
  registryAssets: RegistryAsset[];
  enrichedAssets: EnrichedAsset[];
}

// Initial state
const initialState: AssetsState = {
  assetInfos: []
};

const initialRegistryState: RegistryAssetsState = {
  registryAssets: [],
  enrichedAssets: []
};

// Create and export atoms
// NOTE: With the new React Query based hooks (useUserAssets, usePools, etc.),
// these atoms are now primarily used as fallback/legacy state management.
// New components should prefer using React Query hooks for better caching.
const AssetsStateAtom = atom<AssetsState>(initialState);
const AssetsLoadingAtom = atom<boolean>(false);

// Registry-related atoms
const RegistryAssetsStateAtom = atom<RegistryAssetsState>(initialRegistryState);
const RegistryAssetsLoadingAtom = atom<boolean>(false);

// Export atoms
export {
  AssetsStateAtom,
  AssetsLoadingAtom,
  RegistryAssetsStateAtom,
  RegistryAssetsLoadingAtom
};

// Export types
export type { AssetsState, RegistryAssetsState };
