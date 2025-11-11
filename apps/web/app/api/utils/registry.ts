/**
 * Registry Loader Utilities
 *
 * Functions to load and validate asset configurations from the registry
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { RegistryAsset } from '@/app/types/registry';

// Get the path to the public/registry directory
function getRegistryPath(): string {
  // In production build, public folder is at the root
  // In dev, we need to go up from app/api/utils
  const publicPath = join(process.cwd(), 'apps', 'web', 'public', 'registry');
  if (existsSync(publicPath)) {
    return publicPath;
  }
  // Fallback to workspace-relative path
  return join(process.cwd(), 'public', 'registry');
}

/**
 * Load all registry assets from the public/registry directory
 * @param statusFilter - Optional filter by status (live, deprecated, testing)
 * @returns Array of registry assets
 */
export function loadRegistryAssets(
  statusFilter?: 'live' | 'deprecated' | 'testing'
): RegistryAsset[] {
  const registryPath = getRegistryPath();
  const assets: RegistryAsset[] = [];

  try {
    // Read all directories in registry
    const entries = readdirSync(registryPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip files, only process directories
      if (!entry.isDirectory()) continue;

      // Skip images and other non-asset directories
      if (entry.name === 'images') continue;

      const assetJsonPath = join(registryPath, entry.name, 'asset.json');

      // Check if asset.json exists
      if (existsSync(assetJsonPath)) {
        try {
          const assetData = readFileSync(assetJsonPath, 'utf-8');
          const asset = JSON.parse(assetData) as RegistryAsset;

          // Validate required fields
          if (validateRegistryAsset(asset)) {
            // Apply status filter if provided
            if (!statusFilter || asset.status === statusFilter) {
              assets.push(asset);
            }
          } else {
            console.warn(`Invalid asset configuration in ${entry.name}`);
          }
        } catch (error) {
          console.error(`Error loading asset from ${entry.name}:`, error);
        }
      }
    }

    return assets;
  } catch (error) {
    console.error('Error loading registry assets:', error);
    return [];
  }
}

/**
 * Load a single registry asset by name
 * @param name - Asset name (e.g., 'sui', 'dubhe')
 * @returns Registry asset or null if not found
 */
export function loadRegistryAsset(name: string): RegistryAsset | null {
  const registryPath = getRegistryPath();
  const assetJsonPath = join(registryPath, name, 'asset.json');

  try {
    if (!existsSync(assetJsonPath)) {
      return null;
    }

    const assetData = readFileSync(assetJsonPath, 'utf-8');
    const asset = JSON.parse(assetData) as RegistryAsset;

    if (validateRegistryAsset(asset)) {
      return asset;
    }

    return null;
  } catch (error) {
    console.error(`Error loading asset ${name}:`, error);
    return null;
  }
}

/**
 * Validate that a registry asset has all required fields
 * @param asset - Asset to validate
 * @returns true if valid, false otherwise
 */
export function validateRegistryAsset(asset: any): asset is RegistryAsset {
  if (!asset || typeof asset !== 'object') return false;

  // Check top-level required fields
  if (!asset.name || typeof asset.name !== 'string') return false;
  if (!asset.status || !['live', 'deprecated', 'testing'].includes(asset.status)) return false;
  if (!asset.asset || typeof asset.asset !== 'object') return false;
  if (!asset.metadata || typeof asset.metadata !== 'object') return false;

  // Check asset config required fields
  const assetConfig = asset.asset;
  if (!assetConfig.description || typeof assetConfig.description !== 'string') return false;
  if (!assetConfig.coinType || typeof assetConfig.coinType !== 'string') return false;
  if (!Array.isArray(assetConfig.denom_units) || assetConfig.denom_units.length === 0) return false;
  if (!assetConfig.base || typeof assetConfig.base !== 'string') return false;
  if (!assetConfig.name || typeof assetConfig.name !== 'string') return false;
  if (!assetConfig.display || typeof assetConfig.display !== 'string') return false;
  if (!assetConfig.symbol || typeof assetConfig.symbol !== 'string') return false;

  // Check metadata required fields
  const metadata = asset.metadata;
  if (!metadata.assetId || typeof metadata.assetId !== 'string') return false;
  if (!metadata.assetType || !['Wrapped', 'Native', 'Synthetic'].includes(metadata.assetType))
    return false;
  if (typeof metadata.decimals !== 'number') return false;
  if (typeof metadata.isBurnable !== 'boolean') return false;
  if (typeof metadata.isDeleted !== 'boolean') return false;
  if (typeof metadata.isFreezable !== 'boolean') return false;
  if (typeof metadata.isMintable !== 'boolean') return false;

  return true;
}

/**
 * Get the local path for an asset's logo
 * @param assetName - Name of the asset (e.g., 'sui', 'dubhe')
 * @param format - Image format (svg, png, jpg)
 * @returns Local path to the logo
 */
export function getLocalLogoPath(assetName: string, format: 'svg' | 'png' | 'jpg' = 'svg'): string {
  return `/registry/${assetName}/images/${assetName}.${format}`;
}

/**
 * Find asset by coinType
 * @param coinType - The coin type to search for
 * @returns Registry asset or null if not found
 */
export function findAssetByCoinType(coinType: string): RegistryAsset | null {
  const assets = loadRegistryAssets();
  return assets.find((asset) => asset.asset.coinType === coinType) || null;
}

/**
 * Find asset by assetId
 * @param assetId - The asset ID to search for
 * @returns Registry asset or null if not found
 */
export function findAssetByAssetId(assetId: string): RegistryAsset | null {
  const assets = loadRegistryAssets();
  return assets.find((asset) => asset.metadata.assetId === assetId) || null;
}

/**
 * Get all live assets (status = 'live')
 * @returns Array of live registry assets
 */
export function getLiveAssets(): RegistryAsset[] {
  return loadRegistryAssets('live');
}
