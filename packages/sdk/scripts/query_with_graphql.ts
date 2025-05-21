import { Merak } from '../src/merak';
import { NetworkType, Transaction } from '@0xobelisk/sui-client';
import dotenv from 'dotenv';
import { SuiClient } from '@mysten/sui/client';

dotenv.config();

async function main() {
  const publicClient = new SuiClient({
    url: 'https://sui-testnet.blockvision.org/v1/2wxFvrtcSw2Zc0rIQuVL8i53IhU',
  });

  // 方法1：使用getDynamicFieldObject查询特定名称的动态字段
  console.log('方法1: 使用getDynamicFieldObject查询');
  try {
    let response = await publicClient.getDynamicFieldObject({
      parentId:
        '0xcdaf20f659c1f8cd418ca231d074d3be12ff6d7188ea15c0d5241aec31e5c993',
      name: {
        type: 'vector<u8>',
        value: 'asset_metadata',
      },
    });
    console.log('动态字段查询结果:', response);
  } catch (error) {
    console.error('查询动态字段出错:', error);
  }

  // 方法2：获取所有动态字段，然后找到我们需要的
  console.log('\n方法2: 先获取所有动态字段');
  try {
    const allFields = await publicClient.getDynamicFields({
      parentId:
        '0xcdaf20f659c1f8cd418ca231d074d3be12ff6d7188ea15c0d5241aec31e5c993',
    });
    console.log('所有动态字段:', allFields);

    // 如果找到了我们需要的字段，根据获得的name再查询具体的对象
    if (allFields.data.length > 0) {
      for (const field of allFields.data) {
        console.log(
          `发现字段: ${field.name.type} - ${JSON.stringify(field.name.value)}`
        );
        if (field.name.value === 'asset_metadata') {
          console.log('找到asset_metadata字段，获取详细信息');
          const fieldObject = await publicClient.getDynamicFieldObject({
            parentId:
              '0xcdaf20f659c1f8cd418ca231d074d3be12ff6d7188ea15c0d5241aec31e5c993',
            name: field.name,
          });
          console.log('字段详细信息:', fieldObject);
        }
      }
    }
  } catch (error) {
    console.error('获取所有动态字段出错:', error);
  }

  // 方法3：如果已知确切类型，直接构造查询
  console.log('\n方法3: 使用确切类型信息查询StorageMap');
  try {
    const response = await publicClient.getDynamicFieldObject({
      parentId:
        '0xcdaf20f659c1f8cd418ca231d074d3be12ff6d7188ea15c0d5241aec31e5c993',
      name: {
        type: '0x2::dynamic_field::Field<vector<u8>, 0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::storage_map_internal::StorageMap<u256, 0xe2a38ae55a486bcaf79658cde76894207cada4d64d3cb1b2b06c6c12c10d5d5b::dubhe_asset_metadata::AssetMetadata>>',
        value: 'asset_metadata',
      },
    });
    console.log('使用确切类型查询结果:', response);
  } catch (error) {
    console.error('使用确切类型查询出错:', error);
  }
}

main();
