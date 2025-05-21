import { SuiClient } from '@mysten/sui/client';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 查询Dubhe Asset Metadata
 *
 * 这个脚本专门用于查询由用户提供的父对象中的asset_metadata动态字段，
 * 该字段是StorageMap<u256, AssetMetadata>类型。
 */
async function queryDubheAssetMetadata() {
  // 初始化Sui客户端
  const client = new SuiClient({
    url: 'https://sui-testnet.blockvision.org/v1/2wxFvrtcSw2Zc0rIQuVL8i53IhU', // testnet
  });

  // 用户提供的信息
  const parentObjectId =
    '0xcdaf20f659c1f8cd418ca231d074d3be12ff6d7188ea15c0d5241aec31e5c993';
  const fieldName = 'asset_metadata';
  const packageAddress =
    '0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b';

  console.log(`查询父对象 ${parentObjectId} 中的 ${fieldName} 动态字段...`);

  try {
    // 1. 首先查询动态字段对象
    console.log('步骤1: 获取动态字段对象...');

    const dynamicFieldObj = await client.getDynamicFieldObject({
      parentId: parentObjectId,
      name: {
        type: 'vector<u8>',
        value: fieldName,
      },
    });

    if (!dynamicFieldObj.data) {
      throw new Error('未找到动态字段对象');
    }

    console.log('找到动态字段对象:');
    console.log('- 对象ID:', dynamicFieldObj.data.objectId);
    console.log('- 类型:', dynamicFieldObj.data.type);

    // 获取StorageMap对象ID
    let storageMapObjectId = '';

    // 类型安全地访问嵌套属性
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
        console.log('- StorageMap对象ID:', storageMapObjectId);
      }
    }

    if (!storageMapObjectId) {
      // 尝试直接使用动态字段对象的ID
      console.log('无法找到StorageMap对象ID，尝试使用动态字段对象ID');
      storageMapObjectId = dynamicFieldObj.data.objectId;
    }

    // 2. 查询StorageMap中的所有键值对
    console.log('\n步骤2: 查询StorageMap中的所有键值对...');

    const entries = await client.getDynamicFields({
      parentId: storageMapObjectId,
    });

    console.log(`StorageMap包含 ${entries.data.length} 个键值对:`);

    // 3. 显示所有键并查询第一个键的详细信息
    if (entries.data.length > 0) {
      console.log('\n键列表:');
      entries.data.forEach((entry, index) => {
        console.log(
          `${index + 1}. 类型: ${entry.name.type}, 值: ${JSON.stringify(
            entry.name.value
          )}`
        );
      });

      // 4. 获取第一个AssetMetadata详细信息
      const firstKey = entries.data[0];
      console.log(
        `\n步骤3: 获取键 ${JSON.stringify(
          firstKey.name.value
        )} 的AssetMetadata详细信息...`
      );

      const valueObj = await client.getDynamicFieldObject({
        parentId: storageMapObjectId,
        name: firstKey.name,
      });

      if (valueObj.data) {
        console.log('AssetMetadata详细信息:');

        if (
          valueObj.data.content &&
          typeof valueObj.data.content === 'object' &&
          'fields' in valueObj.data.content
        ) {
          const metadata = valueObj.data.content.fields;
          console.log(JSON.stringify(metadata, null, 2));
        } else {
          console.log('无法解析AssetMetadata内容');
          console.log(JSON.stringify(valueObj.data, null, 2));
        }
      } else {
        console.log('无法获取AssetMetadata详细信息');
      }

      // 5. 如果需要，通过ID查询特定的键
      console.log('\n步骤4: 如何查询特定u256键的值');
      console.log('例如，要查询键为1的AssetMetadata:');
      console.log(`
client.getDynamicFieldObject({
  parentId: '${storageMapObjectId}',
  name: {
    type: 'u256',
    value: '1'  // 这里替换为您想查询的键值
  }
});
      `);
    } else {
      console.log('StorageMap为空，没有找到键值对');
    }
  } catch (error) {
    console.error('查询出错:', error);
  }
}

// 运行查询函数
queryDubheAssetMetadata().catch(console.error);
