import testnetMetadata from '../metadata/testnet/metadata.json';
import localnetMetadata from '../metadata/localnet/metadata.json';
import { MerakConfig } from '../types';

export function getMerakConfig(network: string): MerakConfig {
  let config: MerakConfig;

  switch (network) {
    case 'testnet':
      config = {
        metadata: testnetMetadata,
        packageId:
          '0x9f07d65327befdc814938d322c0ce504e0af0d978a0a40ed7a56b31c46b92723',
        schemaId:
          '0x8ece4cb6de126eb5c7a375f90c221bdc16c81ad8f6f894af08e0b6c25fb50a45',
        treasuryCap:
          '0x2::coin::TreasuryCap<0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::dubhe::DUBHE>',
      };
      break;
    case 'localnet':
      config = {
        metadata: localnetMetadata,
        packageId:
          '0xd7b6bbd0262a4fb79f246b219e43f0f090963ac95c7685b6a31f13ecccd41608',
        schemaId:
          '0xf25a8d3fd4aeea336a127fbd264451d35e9b89cc36c1501c18e0d5c0d6f0d272',
        treasuryCap:
          '0x2::coin::TreasuryCap<0xd7b6bbd0262a4fb79f246b219e43f0f090963ac95c7685b6a31f13ecccd41608::dubhe::DUBHE>',
      };
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }

  return config;
}
