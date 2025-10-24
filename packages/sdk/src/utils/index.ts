import testnetMetadata from '../metadata/testnet/metadata.json';
import localnetMetadata from '../metadata/localnet/metadata.json';
import { MerakConfig } from '../types';

export function getMerakConfig(network: string): MerakConfig {
  let config: MerakConfig;

  switch (network) {
    case 'testnet':
      config = {
        metadata: testnetMetadata,
        packageId: '0xa6477a6bf50e2389383b34a76d59ccfbec766ff2decefe38e1d8436ef8a9b245',
        schemaId: '0xb65df6ea777f1ed0fb9a0d9173eec6b43f2ae1da4346af1b48f678d8af796379',
        treasuryCap:
          '0x2::coin::TreasuryCap<0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::dubhe::DUBHE>'
      };
      break;
    case 'localnet':
      config = {
        metadata: localnetMetadata,
        packageId: '0xd7b6bbd0262a4fb79f246b219e43f0f090963ac95c7685b6a31f13ecccd41608',
        schemaId: '0xf25a8d3fd4aeea336a127fbd264451d35e9b89cc36c1501c18e0d5c0d6f0d272',
        treasuryCap:
          '0x2::coin::TreasuryCap<0xd7b6bbd0262a4fb79f246b219e43f0f090963ac95c7685b6a31f13ecccd41608::dubhe::DUBHE>'
      };
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }

  return config;
}
