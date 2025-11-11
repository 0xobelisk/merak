// Registry Asset Types (from asset.schema.json)

export interface DenomUnit {
  denom: string;
  exponent: number;
}

export interface LogoURIs {
  svg?: string;
  png?: string;
  jpg?: string;
}

export interface ImageFormat {
  svg?: string;
  png?: string;
  jpg?: string;
}

export interface AssetConfig {
  description: string;
  coinType: string;
  denom_units: DenomUnit[];
  base: string;
  name: string;
  display: string;
  symbol: string;
  logo_URIs?: LogoURIs;
  images?: ImageFormat[];
}

export interface RegistryMetadata {
  assetId: string;
  assetType: 'Wrapped' | 'Native' | 'Synthetic';
  createdAtTimestampMs: string;
  decimals: number;
  description: string;
  iconUrl: string;
  isBurnable: boolean;
  isDeleted: boolean;
  isFreezable: boolean;
  isMintable: boolean;
  lastUpdateDigest: string;
  name: string;
  nodeId: string;
  owner: string;
  status: 'Liquid' | 'Frozen' | 'Locked';
  symbol: string;
  updatedAtTimestampMs: string;
}

export interface RegistryAsset {
  name: string;
  status: 'live' | 'deprecated' | 'testing';
  asset: AssetConfig;
  metadata: RegistryMetadata;
}

// Enriched asset combining registry config and on-chain data
export interface EnrichedAsset extends RegistryAsset {
  balance?: string;
  formattedBalance?: string;
  // On-chain dynamic data can override registry static data
  onChainMetadata?: Partial<RegistryMetadata>;
}

// API Response Types
export interface RegistryAssetsResponse {
  success: boolean;
  data: RegistryAsset[];
  totalCount: number;
  timestamp: string;
  error?: string;
}

export interface SingleRegistryAssetResponse {
  success: boolean;
  data: RegistryAsset;
  timestamp: string;
  error?: string;
}

// Helper function to get logo URL from registry asset
export function getLogoUrl(asset: RegistryAsset): string {
  // Priority: svg > png > jpg
  return (
    asset.asset.logo_URIs?.svg ||
    asset.asset.logo_URIs?.png ||
    asset.asset.logo_URIs?.jpg ||
    asset.asset.images?.[0]?.svg ||
    asset.asset.images?.[0]?.png ||
    asset.asset.images?.[0]?.jpg ||
    '/registry/sui/images/sui.svg' // fallback
  );
}

// Helper function to get asset by coinType
export function findAssetByCoinType(
  assets: RegistryAsset[],
  coinType: string
): RegistryAsset | undefined {
  return assets.find((asset) => asset.asset.coinType === coinType);
}

// Helper function to get asset by assetId
export function findAssetByAssetId(
  assets: RegistryAsset[],
  assetId: string
): RegistryAsset | undefined {
  return assets.find((asset) => asset.metadata.assetId === assetId);
}

// Helper function to filter by status
export function filterByStatus(
  assets: RegistryAsset[],
  status: 'live' | 'deprecated' | 'testing'
): RegistryAsset[] {
  return assets.filter((asset) => asset.status === status);
}
