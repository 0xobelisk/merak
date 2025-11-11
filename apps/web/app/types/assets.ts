// Asset Metadata Types (from GraphQL)
export interface AssetMetadata {
  assetId: string;
  assetType: string;
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
  status: string;
  symbol: string;
  updatedAtTimestampMs: string;
}

// Asset Wrapper Types (from GraphQL)
export interface AssetWrapper {
  assetId: string;
  coinType: string;
  createdAtTimestampMs: string;
  isDeleted: boolean;
  lastUpdateDigest: string;
  nodeId: string;
  updatedAtTimestampMs: string;
}

// API Response Types
export interface SingleAssetMetadataResponse {
  success: boolean;
  data: AssetMetadata;
  timestamp: string;
  error?: string;
}

export interface AssetMetadataListResponse {
  success: boolean;
  data: AssetMetadata[];
  totalCount: number;
  timestamp: string;
  error?: string;
}

export interface AssetWrapperListResponse {
  success: boolean;
  data: AssetWrapper[];
  totalCount: number;
  timestamp: string;
  error?: string;
}

export interface SingleAssetWrapperResponse {
  success: boolean;
  data: AssetWrapper;
  timestamp: string;
  error?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  timestamp: string;
}
