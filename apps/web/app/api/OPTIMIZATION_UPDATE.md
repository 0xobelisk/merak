# API 优化更新说明

## 更新日期
2024

## 优化内容

### 单资产查询优化

**问题**: 之前所有查询都使用 `storage.list.assetMetadata()`，即使是查询单个资产也需要处理分页逻辑。

**解决方案**: 现在 API 会智能判断查询类型：
- ✅ 当提供 `assetId` 参数时：使用 `storage.get.assetMetadata()` 进行**优化的单资产查询**
- ✅ 当不提供 `assetId` 时：使用 `storage.list.assetMetadata()` 进行列表查询和分页

## 技术细节

### 修改的文件
- ✅ `/apps/web/app/api/assets/metadata/route.ts`
- ✅ `/apps/web/app/api/README.md`
- ✅ `/apps/web/app/api/QUICKSTART.md`
- ✅ `/apps/web/app/api/USAGE_EXAMPLES.md`

### 代码实现

```typescript
// 优化后的查询逻辑
if (assetId) {
  // 使用 storage.get 进行单资产查询
  const result = await merak.storage.get.assetMetadata({ assetId });
  return { data: result ? [result] : [] };
} else {
  // 使用 storage.list 进行列表查询
  const result = await merak.storage.list.assetMetadata({ first, after });
  return { data: result.edges.map(edge => edge.node) };
}
```

## 性能提升

### 单资产查询
- **之前**: 使用 list 查询 + 过滤，需要处理 GraphQL Connection 类型
- **现在**: 直接使用 get 查询，返回单个对象
- **提升**: 更快的查询速度，更少的数据传输

### 适用场景

#### ✅ 使用 storage.get（优化）
```bash
# 查询特定资产
curl http://localhost:3000/api/assets/metadata?assetId=0

# React Hook
const { data } = useAssetMetadata({ assetId: '0' });
```

#### ✅ 使用 storage.list（分页）
```bash
# 查询列表
curl http://localhost:3000/api/assets/metadata?first=50

# 分页查询
curl http://localhost:3000/api/assets/metadata?first=50&after=cursor123

# React Hook
const { data } = useAssetMetadata({ first: 50 });
```

## API 行为变化

### 响应格式保持一致
无论使用哪种查询方式，API 响应格式完全一致：

```json
{
  "success": true,
  "data": [...],  // 始终是数组
  "pageInfo": { "hasNextPage": false },
  "totalCount": number,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 向后兼容
- ✅ 完全向后兼容
- ✅ 现有代码无需修改
- ✅ 自动享受性能提升

## 使用示例

### 示例 1: 资产详情页

```typescript
'use client';

import { useAssetMetadata } from '@/app/hooks/useAssetMetadata';

export function AssetDetail({ assetId }: { assetId: string }) {
  // 自动使用 storage.get 优化查询
  const { data, isLoading } = useAssetMetadata({ assetId });
  
  if (isLoading) return <div>加载中...</div>;
  
  const asset = data?.data[0];
  
  return (
    <div>
      <h1>{asset?.name}</h1>
      <p>{asset?.symbol}</p>
    </div>
  );
}
```

### 示例 2: 资产选择器

```typescript
'use client';

import { useState } from 'react';
import { useAssetMetadata } from '@/app/hooks/useAssetMetadata';

export function AssetSelector() {
  const [selectedId, setSelectedId] = useState<string>();
  
  // 查询选中的资产详情（使用 storage.get）
  const { data: selectedAsset } = useAssetMetadata({
    assetId: selectedId,
    enabled: !!selectedId
  });
  
  // 查询所有资产列表（使用 storage.list）
  const { data: allAssets } = useAssetMetadata({ first: 100 });
  
  return (
    <div>
      <select onChange={(e) => setSelectedId(e.target.value)}>
        {allAssets?.data.map(asset => (
          <option key={asset.asset_id} value={asset.asset_id}>
            {asset.name}
          </option>
        ))}
      </select>
      
      {selectedAsset?.data[0] && (
        <div>
          <h3>选中的资产详情：</h3>
          <pre>{JSON.stringify(selectedAsset.data[0], null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

## 优势总结

### 🚀 性能优势
- 单资产查询更快
- 减少不必要的数据传输
- 更高效的 GraphQL 查询

### 🎯 智能路由
- 自动选择最优查询方式
- 对开发者透明
- 无需手动选择

### 🔄 向后兼容
- 现有代码无需修改
- API 响应格式不变
- 自动享受优化

### 📝 代码清晰
- 逻辑分离明确
- 易于维护和扩展
- 符合最佳实践

## 测试建议

### 测试单资产查询
```bash
# 测试 storage.get
curl http://localhost:3000/api/assets/metadata?assetId=0

# 应该返回单个资产（在数组中）
# 响应时间应该很快
```

### 测试列表查询
```bash
# 测试 storage.list
curl http://localhost:3000/api/assets/metadata?first=10

# 应该返回 10 个资产
# 包含分页信息
```

### 测试缓存
```bash
# 两次相同查询，第二次应该更快
time curl http://localhost:3000/api/assets/metadata?assetId=0
time curl http://localhost:3000/api/assets/metadata?assetId=0
```

## 未来优化方向

### 可能的增强
- [ ] 批量查询多个资产（使用多个 storage.get）
- [ ] 预加载常用资产
- [ ] 添加 Redis 缓存层
- [ ] WebSocket 实时更新

## 总结

这次优化通过智能路由，让 API 自动选择最优的查询方式：
- 单资产查询使用 `storage.get` ⚡
- 列表查询使用 `storage.list` 📋
- 保持完全向后兼容 ✅
- 自动享受性能提升 🚀

开发者无需任何代码修改，即可获得更好的性能！

