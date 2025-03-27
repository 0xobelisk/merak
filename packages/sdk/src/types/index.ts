import { DubheParams } from '@0xobelisk/sui-client';

export type MerakParams = {
  schemaId?: string;
  treasuryCap?: string;
} & DubheParams;

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

export type AssetMetadataType = {
  name: string;
  symbol: string;
  description: string;
  decimals: number;
  icon_url: string;
  extra_info: string;
  owner: string;
  supply: string;
  accounts: string;
  status: string;
  is_mintable: boolean;
  is_burnable: boolean;
  is_freezable: boolean;
};

export type AssetInfo = {
  assetId: number;
  metadata: AssetMetadataType;
  balance?: string;
  status?: {
    [key: string]: {};
  };
};

export type AssetInfoResponse = {
  data: AssetInfo[];
  pageInfo: PageInfo;
  totalCount: number;
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

export type EventInfo = {
  name: string;
  sender: string;
  value: any;
  digest: string;
  createdAt: string;
  checkpoint: string;
};

export type EventInfoResponse = {
  data: EventInfo[];
  pageInfo: PageInfo;
  totalCount: number;
};
