import { SuiClient } from '@mysten/sui/client';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Query AssetMetadata from dynamic fields
 *
 * Use this script to query asset_metadata dynamic field from specified object
 * This field contains StorageMap type data
 */
async function queryAssetMetadata() {
  // Initialize Sui client - you can change to other networks as needed
  const client = new SuiClient({
    url: 'https://sui-testnet.blockvision.org/v1/2wxFvrtcSw2Zc0rIQuVL8i53IhU' // testnet
  });

  // User-provided parent object ID
  const parentObjectId = '0xfb2c58b849d6e4de90a2032dacf42ab9ae11130ebc2d1f0fecfffa9df5aeed0b';

  console.log(`Querying dynamic fields of object ${parentObjectId}...`);

  try {
    const allFields = await client.getDynamicFields({
      parentId: parentObjectId
    });

    console.log(`Found ${allFields.data.length} dynamic fields`);
    console.log(JSON.stringify(allFields, null, 2));

    // If we found the needed field, query the specific object based on the obtained name
    if (allFields.data.length > 0) {
      for (const field of allFields.data) {
        console.log(`Found field: ${field.name.type} - ${JSON.stringify(field.name.value)}`);
        console.log('Found asset_metadata field, getting details');

        // Step 1: Get all dynamic fields, find asset_metadata
        const allFields = await client.getDynamicFieldObject({
          parentId: parentObjectId,
          name: field.name
          // name: {
          //   type: field.name.type,
          //   // type: '0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::storage_double_map_internal::Entry<u256, u256>',
          //   value: {
          //     key1: field.name.value,
          //     key2: field.name.value,
          //   },
          // },
        });
        console.log(JSON.stringify(allFields, null, 2));
      }
    }

    console.log('Query completed');
    console.log(`Total ${allFields.data.length} dynamic fields`);
  } catch (error) {
    console.error('Query error:', error);
  }
}

// Run query function
queryAssetMetadata().catch(console.error);
