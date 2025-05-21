import { SuiClient } from '@mysten/sui/client';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 查询动态字段中的AssetMetadata
 *
 * 使用这个脚本来查询指定对象中的asset_metadata动态字段
 * 该字段包含StorageMap类型数据
 */
async function queryAssetMetadata() {
  // 初始化Sui客户端 - 你可以根据需要更改为其他网络
  const client = new SuiClient({
    url: 'https://sui-testnet.blockvision.org/v1/2wxFvrtcSw2Zc0rIQuVL8i53IhU', // testnet
  });

  // 用户提供的父对象ID
  const parentObjectId =
    '0xfb2c58b849d6e4de90a2032dacf42ab9ae11130ebc2d1f0fecfffa9df5aeed0b';

  console.log(`查询对象 ${parentObjectId} 的动态字段...`);

  try {
    const allFields = await client.getDynamicFields({
      parentId: parentObjectId,
    });

    console.log(`发现 ${allFields.data.length} 个动态字段`);
    console.log(JSON.stringify(allFields, null, 2));

    // 如果找到了我们需要的字段，根据获得的name再查询具体的对象
    if (allFields.data.length > 0) {
      for (const field of allFields.data) {
        console.log(
          `发现字段: ${field.name.type} - ${JSON.stringify(field.name.value)}`
        );
        console.log('找到asset_metadata字段，获取详细信息');

        // 第一步：获取所有动态字段，找到asset_metadata
        const allFields = await client.getDynamicFieldObject({
          parentId: parentObjectId,
          name: field.name,
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

    console.log('查询完成');
    console.log(`一共 ${allFields.data.length} 个动态字段`);
  } catch (error) {
    console.error('查询出错:', error);
  }
}

// 运行查询函数
queryAssetMetadata().catch(console.error);
