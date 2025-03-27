import testnetMetadata from '../metadata/testnet/metadata.json';
import { MerakConfig } from '../types';

export function getMerakConfig(network: string): MerakConfig {
  let config: MerakConfig;

  switch (network) {
    case 'testnet':
      config = {
        metadata: testnetMetadata,
        packageId:
          '0x28c16d08172efed632d7e146bbb837c0868dbed3c998cc57b237a3d1bd721787',
        schemaId:
          '0x644b2830d76026e8313e31b63a79b72b4621bbbc764a1201fd4fbc66c7c67bc5',
        treasuryCap: '',
      };

      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }

  return config;
}
