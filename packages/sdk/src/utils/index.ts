import testnetMetadata from '../metadata/testnet/metadata.json';
import { MerakConfig } from '../types';

export function getMerakConfig(network: string): MerakConfig {
  let config: MerakConfig;

  switch (network) {
    case 'testnet':
      config = {
        metadata: testnetMetadata,
        packageId:
          '0x2300e4f190870ae8cee2f648f745e96c06fa4ce9c3bd5439d3ee4287df0d9887',
        schemaId:
          '0x3b1e5a16420748a3024fb6ca6eecb851a4222c91b446152770798dfff68fb671',
        treasuryCap:
          '0x6c3c1cdea87b45e205e5ba875cf5f13b752ace7e1cff18aaae2ecfc1f4def69a',
      };
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }

  return config;
}
