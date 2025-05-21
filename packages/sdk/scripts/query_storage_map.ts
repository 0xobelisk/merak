import { SuiClient } from '@mysten/sui/client';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 查询StorageMap类型的动态字段，并根据u256键获取AssetMetadata
 *
 * 这个脚本演示如何:
 * 1. 查询StorageMap类型的动态字段
 * 2. 解析其结构
 * 3. 使用特定的键查询数据
 */
async function queryStorageMap() {
  // 初始化Sui客户端
  const client = new SuiClient({
    url: 'https://sui-testnet.blockvision.org/v1/2wxFvrtcSw2Zc0rIQuVL8i53IhU', // testnet
  });

  // 用户提供的参数
  const parentObjectId =
    '0xcdaf20f659c1f8cd418ca231d074d3be12ff6d7188ea15c0d5241aec31e5c993';
  const fieldName = 'asset_metadata';
  const storageMapType =
    '0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::storage_map_internal::StorageMap<u256, 0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::dubhe_asset_metadata::AssetMetadata>';

  console.log(`查询对象 ${parentObjectId} 中的 ${fieldName} 字段...`);

  try {
    // 步骤1: 直接尝试使用已知的类型和名称查询动态字段
    console.log('尝试直接查询动态字段...');

    try {
      const directQuery = await client.getDynamicFieldObject({
        parentId: parentObjectId,
        name: {
          type: 'vector<u8>',
          value: fieldName,
        },
      });

      console.log('直接查询结果:', JSON.stringify(directQuery, null, 2));

      // 检查是否获取到了数据
      if (directQuery.data) {
        parseStorageMapContent(directQuery.data);
      }
    } catch (directError) {
      console.error('直接查询失败:', directError);

      // 步骤2: 如果直接查询失败，尝试先获取所有动态字段列表
      console.log('\n尝试获取所有动态字段...');
      const allFields = await client.getDynamicFields({
        parentId: parentObjectId,
      });

      console.log(`发现 ${allFields.data.length} 个动态字段:`);
      allFields.data.forEach((field, index) => {
        console.log(
          `${index + 1}. ${field.name.type}: ${JSON.stringify(
            field.name.value
          )}`
        );
      });

      // 步骤3: 查找目标字段
      const targetField = allFields.data.find(
        (field) =>
          typeof field.name.value === 'string' && field.name.value === fieldName
      );

      if (targetField) {
        console.log('\n找到目标字段:', targetField);

        // 步骤4: 使用找到的字段元数据查询详细内容
        const fieldDetails = await client.getDynamicFieldObject({
          parentId: parentObjectId,
          name: targetField.name,
        });

        console.log('字段详细内容:', JSON.stringify(fieldDetails, null, 2));

        if (fieldDetails.data) {
          parseStorageMapContent(fieldDetails.data);
        }
      } else {
        console.log(`未找到名为 ${fieldName} 的字段`);
      }
    }

    // 步骤5: 尝试查询特定u256键的AssetMetadata
    // 注意：此步骤需要根据实际StorageMap的实现方式调整
    console.log('\n尝试查询特定键的AssetMetadata...');
    console.log('这需要了解StorageMap如何存储键值对，可能需要查询子动态字段');

    // 如果StorageMap是使用内部动态字段实现的，可能需要这样查询:
    try {
      // 假设StorageMap对象ID是我们之前查询到的
      const storageMapObjectId =
        '0xe83c2da3f26cedac7ced3652dbfae0df591aeb51818d45fb33e91364d551d0cd'; // 从上面的查询结果中获取

      // 查询StorageMap中的所有动态字段 (键值对)
      const mapEntries = await client.getDynamicFields({
        parentId: storageMapObjectId,
      });

      console.log(`StorageMap中有 ${mapEntries.data.length} 个条目:`);
      mapEntries.data.forEach((entry, index) => {
        console.log(
          `${index + 1}. 键类型: ${entry.name.type}, 键值: ${JSON.stringify(
            entry.name.value
          )}`
        );
      });

      // 如果要查询特定u256键 (例如 "1") 的值:
      if (mapEntries.data.length > 0) {
        const firstEntry = mapEntries.data[0];
        const entryDetails = await client.getDynamicFieldObject({
          parentId: storageMapObjectId,
          name: firstEntry.name,
        });

        console.log(
          `键 ${JSON.stringify(firstEntry.name.value)} 的值:`,
          JSON.stringify(entryDetails, null, 2)
        );
      }
    } catch (mapError) {
      console.error('查询StorageMap条目出错:', mapError);
    }
  } catch (error) {
    console.error('查询出错:', error);
  }
}

/**
 * 解析并显示StorageMap的内容
 */
function parseStorageMapContent(data: any) {
  console.log('\n解析StorageMap内容...');

  // 尝试获取StorageMap的对象ID
  if (data.objectId) {
    console.log('StorageMap对象ID:', data.objectId);
  }

  // 尝试获取类型信息
  if (data.type) {
    console.log('StorageMap类型:', data.type);
  }

  // 尝试获取字段内容
  if (data.content && 'fields' in data.content) {
    console.log('StorageMap字段:');
    console.log(JSON.stringify(data.content.fields, null, 2));

    // 如果fields中有size字段，显示StorageMap大小
    if ('size' in data.content.fields) {
      console.log(`StorageMap大小: ${data.content.fields.size}`);
    }

    // 如果fields中有id字段，记录StorageMap的UID (可用于查询其内部的动态字段)
    if ('id' in data.content.fields) {
      console.log(`StorageMap的UID: ${JSON.stringify(data.content.fields.id)}`);
    }
  }
}

// 运行查询函数
queryStorageMap().catch(console.error);
