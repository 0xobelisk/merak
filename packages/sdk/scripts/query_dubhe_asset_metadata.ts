import { SuiClient } from '@mysten/sui/client';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Query Dubhe Asset Metadata
 *
 * This script is specifically for querying asset_metadata dynamic field from user-provided parent object,
 * which is of type StorageMap<u256, AssetMetadata>.
 */
async function queryDubheAssetMetadata() {
  // Initialize Sui client
  const client = new SuiClient({
    url: 'https://sui-testnet.blockvision.org/v1/2wxFvrtcSw2Zc0rIQuVL8i53IhU' // testnet
  });

  // User-provided information
  const parentObjectId = '0xcdaf20f659c1f8cd418ca231d074d3be12ff6d7188ea15c0d5241aec31e5c993';
  const fieldName = 'asset_metadata';
  const packageAddress = '0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b';

  console.log(`Querying ${fieldName} dynamic field in parent object ${parentObjectId}...`);

  try {
    // 1. First query the dynamic field object
    console.log('Step 1: Getting dynamic field object...');

    const dynamicFieldObj = await client.getDynamicFieldObject({
      parentId: parentObjectId,
      name: {
        type: 'vector<u8>',
        value: fieldName
      }
    });

    if (!dynamicFieldObj.data) {
      throw new Error('Dynamic field object not found');
    }

    console.log('Found dynamic field object:');
    console.log('- Object ID:', dynamicFieldObj.data.objectId);
    console.log('- Type:', dynamicFieldObj.data.type);

    // Get StorageMap object ID
    let storageMapObjectId = '';

    // Type-safe access to nested properties
    if (
      dynamicFieldObj.data.content &&
      typeof dynamicFieldObj.data.content === 'object' &&
      'fields' in dynamicFieldObj.data.content &&
      dynamicFieldObj.data.content.fields
    ) {
      const fields = dynamicFieldObj.data.content.fields;

      if (
        typeof fields === 'object' &&
        'value' in fields &&
        fields.value &&
        typeof fields.value === 'object' &&
        'id' in fields.value &&
        fields.value.id &&
        typeof fields.value.id === 'object' &&
        'id' in fields.value.id
      ) {
        storageMapObjectId = fields.value.id.id as string;
        console.log('- StorageMap object ID:', storageMapObjectId);
      }
    }

    if (!storageMapObjectId) {
      // Try to use dynamic field object ID directly
      console.log('Cannot find StorageMap object ID, trying to use dynamic field object ID');
      storageMapObjectId = dynamicFieldObj.data.objectId;
    }

    // 2. Query all key-value pairs in StorageMap
    console.log('\nStep 2: Querying all key-value pairs in StorageMap...');

    const entries = await client.getDynamicFields({
      parentId: storageMapObjectId
    });

    console.log(`StorageMap contains ${entries.data.length} key-value pairs:`);

    // 3. Display all keys and query details of first key
    if (entries.data.length > 0) {
      console.log('\nKey list:');
      entries.data.forEach((entry, index) => {
        console.log(
          `${index + 1}. Type: ${entry.name.type}, Value: ${JSON.stringify(entry.name.value)}`
        );
      });

      // 4. Get detailed information of first AssetMetadata
      const firstKey = entries.data[0];
      console.log(
        `\nStep 3: Getting AssetMetadata details for key ${JSON.stringify(firstKey.name.value)}...`
      );

      const valueObj = await client.getDynamicFieldObject({
        parentId: storageMapObjectId,
        name: firstKey.name
      });

      if (valueObj.data) {
        console.log('AssetMetadata detailed information:');

        if (
          valueObj.data.content &&
          typeof valueObj.data.content === 'object' &&
          'fields' in valueObj.data.content
        ) {
          const metadata = valueObj.data.content.fields;
          console.log(JSON.stringify(metadata, null, 2));
        } else {
          console.log('Cannot parse AssetMetadata content');
          console.log(JSON.stringify(valueObj.data, null, 2));
        }
      } else {
        console.log('Cannot get AssetMetadata detailed information');
      }

      // 5. If needed, query specific key by ID
      console.log('\nStep 4: How to query value for specific u256 key');
      console.log('For example, to query AssetMetadata with key 1:');
      console.log(`
client.getDynamicFieldObject({
  parentId: '${storageMapObjectId}',
  name: {
    type: 'u256',
    value: '1'  // Replace with your desired key value
  }
});
      `);
    } else {
      console.log('StorageMap is empty, no key-value pairs found');
    }
  } catch (error) {
    console.error('Query error:', error);
  }
}

// Run query function
queryDubheAssetMetadata().catch(console.error);
