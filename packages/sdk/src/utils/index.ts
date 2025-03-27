import testnetMetadata from '../metadata/testnet/metadata.json';
import { MerakConfig } from '../types';

export function getMerakConfig(network: string): MerakConfig {
  let config: MerakConfig;

  switch (network) {
    case 'testnet':
      config = {
        metadata: testnetMetadata,
        packageId:
          '0x2aa4eb95a5c1f67f2149c7f0265796bbcf3726094da7f27c7015a83857773aac',
        schemaId:
          '0x8ec2c1e28f17dc5d6fe1795cbd9a1a9d6ca6092a53f9d316caed59de8c166bde',
        treasuryCap:
          '0x6855b3fdaff0d2b20e7283f2e7b7054b225b55930c76627e590b034857457381',
      };

      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }

  return config;
}
