import { SuiClient } from '@mysten/sui/client';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Query StorageMap type dynamic field, and get AssetMetadata by u256 key
 *
 * This script demonstrates how to:
 * 1. Query StorageMap type dynamic field
 * 2. Parse its structure
 * 3. Query data using specific key
 */
async function queryStorageMap() {
  // Initialize Sui client
  const client = new SuiClient({
    url: 'https://sui-testnet.blockvision.org/v1/2wxFvrtcSw2Zc0rIQuVL8i53IhU' // testnet
  });

  // User-provided parameters
  const parentObjectId = '0xcdaf20f659c1f8cd418ca231d074d3be12ff6d7188ea15c0d5241aec31e5c993';
  const fieldName = 'asset_metadata';
  const storageMapType =
    '0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::storage_map_internal::StorageMap<u256, 0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::dubhe_asset_metadata::AssetMetadata>';

  console.log(`Querying ${fieldName} field in object ${parentObjectId}...`);

  try {
    // Step 1: Directly try to query dynamic field using known type and name
    console.log('Trying direct dynamic field query...');

    try {
      const directQuery = await client.getDynamicFieldObject({
        parentId: parentObjectId,
        name: {
          type: 'vector<u8>',
          value: fieldName
        }
      });

      console.log('Direct query result:', JSON.stringify(directQuery, null, 2));

      // Check if data was obtained
      if (directQuery.data) {
        parseStorageMapContent(directQuery.data);
      }
    } catch (directError) {
      console.error('Direct query failed:', directError);

      // Step 2: If direct query fails, try to get all dynamic fields list first
      console.log('\nTrying to get all dynamic fields...');
      const allFields = await client.getDynamicFields({
        parentId: parentObjectId
      });

      console.log(`Found ${allFields.data.length} dynamic fields:`);
      allFields.data.forEach((field, index) => {
        console.log(`${index + 1}. ${field.name.type}: ${JSON.stringify(field.name.value)}`);
      });

      // Step 3: Find target field
      const targetField = allFields.data.find(
        (field) => typeof field.name.value === 'string' && field.name.value === fieldName
      );

      if (targetField) {
        console.log('\nFound target field:', targetField);

        // Step 4: Query detailed content using found field metadata
        const fieldDetails = await client.getDynamicFieldObject({
          parentId: parentObjectId,
          name: targetField.name
        });

        console.log('Field detailed content:', JSON.stringify(fieldDetails, null, 2));

        if (fieldDetails.data) {
          parseStorageMapContent(fieldDetails.data);
        }
      } else {
        console.log(`Field named ${fieldName} not found`);
      }
    }

    // Step 5: Try to query AssetMetadata for specific u256 key
    // Note: This step needs to be adjusted based on actual StorageMap implementation
    console.log('\nTrying to query AssetMetadata for specific key...');
    console.log(
      'This requires understanding how StorageMap stores key-value pairs, may need to query sub-dynamic fields'
    );

    // If StorageMap is implemented using internal dynamic fields, it may need to query like this:
    try {
      // Assume StorageMap object ID is what we queried before
      const storageMapObjectId =
        '0xe83c2da3f26cedac7ced3652dbfae0df591aeb51818d45fb33e91364d551d0cd'; // Get from previous query result

      // Query all dynamic fields (key-value pairs) in StorageMap
      const mapEntries = await client.getDynamicFields({
        parentId: storageMapObjectId
      });

      console.log(`StorageMap has ${mapEntries.data.length} entries:`);
      mapEntries.data.forEach((entry, index) => {
        console.log(
          `${index + 1}. Key type: ${entry.name.type}, Key value: ${JSON.stringify(
            entry.name.value
          )}`
        );
      });

      // If you want to query value for specific u256 key (e.g. "1"):
      if (mapEntries.data.length > 0) {
        const firstEntry = mapEntries.data[0];
        const entryDetails = await client.getDynamicFieldObject({
          parentId: storageMapObjectId,
          name: firstEntry.name
        });

        console.log(
          `Value for key ${JSON.stringify(firstEntry.name.value)}:`,
          JSON.stringify(entryDetails, null, 2)
        );
      }
    } catch (mapError) {
      console.error('Error querying StorageMap entries:', mapError);
    }
  } catch (error) {
    console.error('Query error:', error);
  }
}

/**
 * Parse and display StorageMap content
 */
function parseStorageMapContent(data: any) {
  console.log('\nParsing StorageMap content...');

  // Try to get StorageMap object ID
  if (data.objectId) {
    console.log('StorageMap object ID:', data.objectId);
  }

  // Try to get type information
  if (data.type) {
    console.log('StorageMap type:', data.type);
  }

  // Try to get field content
  if (data.content && 'fields' in data.content) {
    console.log('StorageMap fields:');
    console.log(JSON.stringify(data.content.fields, null, 2));

    // If fields has size field, display StorageMap size
    if ('size' in data.content.fields) {
      console.log(`StorageMap size: ${data.content.fields.size}`);
    }

    // If fields has id field, record StorageMap's UID (can be used to query its internal dynamic fields)
    if ('id' in data.content.fields) {
      console.log(`StorageMap's UID: ${JSON.stringify(data.content.fields.id)}`);
    }
  }
}

// Run query function
queryStorageMap().catch(console.error);
