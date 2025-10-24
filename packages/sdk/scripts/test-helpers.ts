/**
 * 测试脚本辅助函数
 * 帮助创建 Merak 实例和其他常用功能
 */

import { Merak, getMerakConfig } from '../src';
import { Dubhe, NetworkType, SuiMoveNormalizedModules } from '@0xobelisk/sui-client';
import { DubheGraphqlClient } from '@0xobelisk/graphql-client';
import dubheMetadata from '../../contracts/dubhe.config.json';
import contractMetadata from '../../contracts/metadata.json';
import { NETWORK, PACKAGE_ID, DUBHE_SCHEMA_ID } from '../../contracts/deployment';

/**
 * 获取默认的 Indexer URL
 */
export function getDefaultIndexerUrl(network: NetworkType): string {
  switch (network) {
    case 'testnet':
      return 'https://dubhe-framework-testnet-api.obelisk.build/graphql';
    case 'mainnet':
      return 'https://dubhe-framework-mainnet-api.obelisk.build/graphql';
    case 'localnet':
      return 'http://localhost:4000/graphql';
    case 'devnet':
      return 'http://localhost:4000/graphql';
    default:
      return 'https://dubhe-framework-testnet-api.obelisk.build/graphql';
  }
}

/**
 * 创建 Merak 实例的辅助函数
 */
export function createMerak(params: {
  networkType: NetworkType;
  secretKey?: string;
  fullnodeUrl?: string;
  indexerUrl?: string;
}): Merak {
  const { networkType, secretKey, fullnodeUrl, indexerUrl } = params;

  // 创建 Dubhe 实例
  const dubhe = new Dubhe({
    networkType,
    secretKey,
    fullnodeUrls: fullnodeUrl ? [fullnodeUrl] : undefined,
    packageId: PACKAGE_ID,
    metadata: contractMetadata as SuiMoveNormalizedModules
  });

  // 创建 GraphQL 客户端
  const graphql = new DubheGraphqlClient({
    endpoint: 'https://dubhe-framework-testnet-api.obelisk.build/graphql',
    subscriptionEndpoint: 'wss://dubhe-framework-testnet-api.obelisk.build/graphql',
    dubheMetadata
  });

  // 创建 Merak 实例
  return new Merak({
    network: networkType,
    dubhe,
    graphql,
    schemaId: DUBHE_SCHEMA_ID
  });
}
