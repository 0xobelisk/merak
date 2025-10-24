import { Merak } from '../src/merak';
import { NetworkType, Transaction } from '@0xobelisk/sui-client';
import dotenv from 'dotenv';
import { SuiClient } from '@mysten/sui/client';

dotenv.config();

async function main() {
  const publicClient = new SuiClient({
    url: 'https://sui-testnet.blockvision.org/v1/2wxFvrtcSw2Zc0rIQuVL8i53IhU'
  });

  // Method 1: Query using getDynamicFieldObject for specific named dynamic field
  console.log('Method 1: Query using getDynamicFieldObject');
  try {
    let response = await publicClient.getDynamicFieldObject({
      parentId: '0xcdaf20f659c1f8cd418ca231d074d3be12ff6d7188ea15c0d5241aec31e5c993',
      name: {
        type: 'vector<u8>',
        value: 'asset_metadata'
      }
    });
    console.log('Dynamic field query result:', response);
  } catch (error) {
    console.error('Dynamic field query error:', error);
  }

  // Method 2: Get all dynamic fields first, then find what we need
  console.log('\nMethod 2: First get all dynamic fields');
  try {
    const allFields = await publicClient.getDynamicFields({
      parentId: '0xcdaf20f659c1f8cd418ca231d074d3be12ff6d7188ea15c0d5241aec31e5c993'
    });
    console.log('All dynamic fields:', allFields);

    // If we found the needed field, query the specific object based on the obtained name
    if (allFields.data.length > 0) {
      for (const field of allFields.data) {
        console.log(`Found field: ${field.name.type} - ${JSON.stringify(field.name.value)}`);
        if (field.name.value === 'asset_metadata') {
          console.log('Found asset_metadata field, getting details');
          const fieldObject = await publicClient.getDynamicFieldObject({
            parentId: '0xcdaf20f659c1f8cd418ca231d074d3be12ff6d7188ea15c0d5241aec31e5c993',
            name: field.name
          });
          console.log('Field detailed information:', fieldObject);
        }
      }
    }
  } catch (error) {
    console.error('Getting all dynamic fields error:', error);
  }

  // Method 3: If you know exact type, construct query directly
  console.log('\nMethod 3: Query using exact type information for StorageMap');
  try {
    const response = await publicClient.getDynamicFieldObject({
      parentId: '0xcdaf20f659c1f8cd418ca231d074d3be12ff6d7188ea15c0d5241aec31e5c993',
      name: {
        type: '0x2::dynamic_field::Field<vector<u8>, 0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::storage_map_internal::StorageMap<u256, 0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::dubhe_asset_metadata::AssetMetadata>>',
        value: 'asset_metadata'
      }
    });
    console.log('Query result using exact type:', response);
  } catch (error) {
    console.error('Query error using exact type:', error);
  }
}

main();
