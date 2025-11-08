import { Dubhe, DubheParams, NetworkType } from '@0xobelisk/sui-client';
import { DubheGraphqlClient } from '@0xobelisk/graphql-client';

export type MerakParams = {
  dubhe: Dubhe;
  graphql: DubheGraphqlClient;
  schemaId: string;
  apiBaseUrl?: string;
};

export type MerakConfig = {
  metadata: any;
  packageId: string;
  schemaId: string;
  treasuryCap: string;
};

export type PageInfo = {
  hasNextPage: boolean;
  endCursor?: string;
};

export type AssetType = 'Lp' | 'Wrapped' | 'Private' | 'Package';

export type AssetMetadataType = {
  assetId: string;
  assetType: string;
  name: string;
  symbol: string;
  description: string;
  decimals: number;
  iconUrl: string;
  owner: string;
  status: string;
  isMintable: boolean;
  isBurnable: boolean;
  isFreezable: boolean;
  isDeleted: boolean;
  createdAtTimestampMs: string;
  updatedAtTimestampMs: string;
  lastUpdateDigest: string;
  nodeId: string;
};

export type AssetInfo = {
  assetId: string;
  metadata: AssetMetadataType;
  balance?: string;
  status?: string;
};

export type AssetInfoResponse = {
  data: AssetInfo[];
  pageInfo: PageInfo;
  totalCount: number;
};

export type AssetSupplyType = {
  assetId: string;
  supply: string;
  createdAtTimestampMs: string;
  updatedAtTimestampMs: string;
  isDeleted: boolean;
  lastUpdateDigest: string;
  __typename?: string;
};

export type AccountInfo = {
  balance: string;
  status: {
    [key: string]: {};
  };
};

export type AccountAssetsInfo = {
  accountInfo: AccountInfo[];
  assetsInfo: AssetInfo[];
};

export type PoolInfo = {
  name: string;
  asset1Id: string;
  asset2Id: string;
  apr: string;
  liquidity: string;
  volume: string;
  feeTier: string;
  token1Image: string;
  token2Image: string;
};
