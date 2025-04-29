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
          '0x7cb7bfd80494c23a9bc2c8aeb04aef45f1729a9424162f49c41acf0ed8d0699d',
        schemaId:
          '0xa565cbb3641fff8f7e8ef384b215808db5f1837aa72c1cca1803b5d973699aac',
        treasuryCap:
          '0x2::coin::TreasuryCap<0x7cb7bfd80494c23a9bc2c8aeb04aef45f1729a9424162f49c41acf0ed8d0699d::dubhe::DUBHE>',
      };
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
