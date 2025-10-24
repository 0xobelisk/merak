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
  const parentObjectId = '0xa676f00193c93b812da927baf1e51bd408c2a32b14104df6c1af2b0e874f33ad';

  console.log(`Querying dynamic fields of object ${parentObjectId}...`);

  try {
    // Step 1: Get all dynamic fields, find asset_metadata
    const allFields = await client.getDynamicFieldObject({
      parentId: parentObjectId,
      name: {
        type: '0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::storage_double_map_internal::Entry<u256, address>',
        value: {
          key1: '0',
          key2: '0xcfa37ebf52f94de12a8a9f4b15975c8cec9e24b191bd8905b465737580974cc1'
        }
      }
    });
    console.log(JSON.stringify(allFields, null, 2));

    // console.log(`Found ${allFields.data.length} dynamic fields`);
    // console.log(JSON.stringify(allFields, null, 2));
    // // Find specific asset_metadata field
    // const metadataField = allFields.data.find(
    //   (field) => field.name.value === 'asset_metadata'
    // );

    // if (!metadataField) {
    //   console.log('asset_metadata field not found');
    //   return;
    // }

    // console.log('Found asset_metadata field:');
    // console.log('Field type:', metadataField.name.type);
    // console.log('Field value:', metadataField.name.value);

    // // Step 2: Get detailed information of this field
    // const fieldDetails = await client.getDynamicFieldObject({
    //   parentId: parentObjectId,
    //   name: metadataField.name,
    // });

    // console.log('\nField detailed information:');
    // console.log(JSON.stringify(fieldDetails, null, 2));

    // // Check data structure and access safely
    // if (fieldDetails.data?.content) {
    //   const content = fieldDetails.data.content;
    //   console.log('\nObject content:');
    //   console.log(JSON.stringify(content, null, 2));

    //   // If content is MoveObject type, it may have fields property
    //   if ('fields' in content) {
    //     console.log('\nMoveObject fields:');
    //     console.log(JSON.stringify(content.fields, null, 2));
    //   }
    // }
  } catch (error) {
    console.error('Query error:', error);
  }
}

// Run query function
queryAssetMetadata().catch(console.error);
