import testnetMetadata from '../metadata/testnet/metadata.json';
import { MerakConfig } from '../types';

export function getMerakConfig(network: string): MerakConfig {
  let config: MerakConfig;

  switch (network) {
    case 'testnet':
      config = {
        metadata: testnetMetadata,
        packageId:
          '0xe14134da47f66aec99d9372bb72f352cbe1c0813bc777a475e1d5effa124f857',
        schemaId:
          '0x492e9c4c945d1b148d7e9958c0bc932219c02af3f994fd4073a4e7c3553e08d3',
        treasuryCap:
          '0x2::coin::TreasuryCap<0xe14134da47f66aec99d9372bb72f352cbe1c0813bc777a475e1d5effa124f857::dubhe::DUBHE>',
      };

      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }

  return config;
}
