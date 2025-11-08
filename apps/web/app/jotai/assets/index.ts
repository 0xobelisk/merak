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
const AssetsStateAtom = atom<AssetsState>(initialState);
const AllAssetsStateAtom = atom<AssetsState>(initialState);
const AssetsLoadingAtom = atom<boolean>(false);

// Registry-related atoms
const RegistryAssetsStateAtom = atom<RegistryAssetsState>(initialRegistryState);
const RegistryAssetsLoadingAtom = atom<boolean>(false);

// Export atoms
export {
  AssetsStateAtom,
  AllAssetsStateAtom,
  AssetsLoadingAtom,
  RegistryAssetsStateAtom,
  RegistryAssetsLoadingAtom
};

// Export types
export type { AssetsState, RegistryAssetsState };
