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
    '0xa676f00193c93b812da927baf1e51bd408c2a32b14104df6c1af2b0e874f33ad';

  console.log(`查询对象 ${parentObjectId} 的动态字段...`);

  try {
    // 第一步：获取所有动态字段，找到asset_metadata
    const allFields = await client.getDynamicFieldObject({
      parentId: parentObjectId,
      name: {
        type: '0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::storage_double_map_internal::Entry<u256, address>',
        value: {
          key1: '0',
          key2: '0xcfa37ebf52f94de12a8a9f4b15975c8cec9e24b191bd8905b465737580974cc1',
        },
      },
    });
    console.log(JSON.stringify(allFields, null, 2));

    // console.log(`发现 ${allFields.data.length} 个动态字段`);
    // console.log(JSON.stringify(allFields, null, 2));
    // // 查找特定的asset_metadata字段
    // const metadataField = allFields.data.find(
    //   (field) => field.name.value === 'asset_metadata'
    // );

    // if (!metadataField) {
    //   console.log('未找到asset_metadata字段');
    //   return;
    // }

    // console.log('找到asset_metadata字段:');
    // console.log('字段类型:', metadataField.name.type);
    // console.log('字段值:', metadataField.name.value);

    // // 第二步：获取该字段的详细信息
    // const fieldDetails = await client.getDynamicFieldObject({
    //   parentId: parentObjectId,
    //   name: metadataField.name,
    // });

    // console.log('\n字段详细信息:');
    // console.log(JSON.stringify(fieldDetails, null, 2));

    // // 检查数据结构并安全地访问
    // if (fieldDetails.data?.content) {
    //   const content = fieldDetails.data.content;
    //   console.log('\n对象内容:');
    //   console.log(JSON.stringify(content, null, 2));

    //   // 如果content是MoveObject类型，可能会有fields属性
    //   if ('fields' in content) {
    //     console.log('\nMoveObject字段:');
    //     console.log(JSON.stringify(content.fields, null, 2));
    //   }
    // }
  } catch (error) {
    console.error('查询出错:', error);
  }
}

// 运行查询函数
queryAssetMetadata().catch(console.error);
