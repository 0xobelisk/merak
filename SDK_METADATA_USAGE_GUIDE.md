# SDK Metadata 参数传入 - 使用指南

## 快速开始

现在 SDK 的数据查询方法支持传入缓存的 metadata，避免重复查询。

## 如何使用

### 方式一：使用 React Query Hooks（推荐）

大多数场景下，直接使用我们提供的 hooks，它们会自动处理缓存：

```typescript
import { usePools } from '@/app/hooks/usePools';
import { useUserAssets } from '@/app/hooks/useUserAssets';

// 自动使用缓存，无需手动处理
const { data: pools } = usePools({ pageSize: 10 });
const { data: userAssets } = useUserAssets();
```

### 方式二：手动传入 Metadata（高级用法）

当你已经有 metadata 数据时，可以手动传入避免重复查询：

```typescript
import { useBatchAssetMetadata } from '@/app/hooks/useAssetMetadata';

// 1. 批量获取 metadata（会被缓存）
const assetIds = ['0', '1', '2', '3'];
const { data: metadataMap } = useBatchAssetMetadata(assetIds);

// 2. 传入 SDK 方法
const pools = await merak.listPoolsInfo({ 
  pageSize: 10,
  metadataMap  // SDK 会优先使用这些数据
});
```

## 支持的方法

以下 SDK 方法现在都支持 `metadataMap` 参数：

### 1. `listPoolsInfo`
```typescript
merak.listPoolsInfo({
  pageSize: 10,
  metadataMap?: Map<string, AssetMetadataType>
})
```

### 2. `listOwnedAssetsInfo`
```typescript
merak.listOwnedAssetsInfo({
  account: address,
  assetType: 'Lp',
  metadataMap?: Map<string, AssetMetadataType>
})
```

### 3. `listOwnedWrapperAssets`
```typescript
merak.listOwnedWrapperAssets({
  account: address,
  metadataMap?: Map<string, AssetMetadataType>
})
```

### 4. `calRemoveLpAmount`
```typescript
merak.calRemoveLpAmount({
  address,
  poolAssetId,
  poolSupply,
  amount,
  metadataMap?: Map<string, AssetMetadataType>
})
```

## 实际案例

### 案例 1: Pool 列表优化

```typescript
// ✅ 好的做法 - usePools 已经处理了缓存
function PoolsList() {
  const { data: pools, isLoading } = usePools({ pageSize: 10 });
  
  return (
    <div>
      {pools?.map(pool => <PoolCard key={pool.lpAssetId} pool={pool} />)}
    </div>
  );
}
```

### 案例 2: 移除流动性优化

```typescript
// ✅ 好的做法 - 使用已有的 token 数据
function RemoveLiquidity({ tokenA, tokenB }) {
  const merak = useMerak();
  
  const handleEstimate = async () => {
    // 创建 metadata map
    const metadataMap = new Map();
    metadataMap.set(tokenA.id, {
      assetId: tokenA.id,
      symbol: tokenA.symbol,
      decimals: tokenA.decimals,
      // ... 其他字段
    });
    metadataMap.set(tokenB.id, { /* ... */ });
    
    // 传入 SDK，避免重复查询
    const result = await merak.calRemoveLpAmount({
      address: account.address,
      poolAssetId: lpTokenId,
      poolSupply,
      amount,
      metadataMap  // SDK 不会再查询这两个 token 的 metadata
    });
  };
}
```

### 案例 3: Wrap/Unwrap 优化

```typescript
// ✅ 好的做法 - 使用 registry 数据
function WrapComponent({ enrichedAssets }) {
  const merak = useMerak();
  
  const fetchOwnedTokens = async () => {
    // 从 registry 数据创建 metadata map
    const metadataMap = new Map();
    enrichedAssets.forEach(asset => {
      metadataMap.set(asset.metadata.assetId, asset.metadata);
    });
    
    // 传入 SDK
    const owned = await merak.listOwnedWrapperAssets({
      account: account.address,
      metadataMap
    });
  };
}
```

## 什么时候应该传入 metadataMap？

### ✅ 应该传入的场景

1. **你已经有这些 metadata 数据**
   - 从其他 API 获取了
   - 从 registry 获取了
   - 在组件 state 中已经有了

2. **需要对同一组 assets 进行多次操作**
   ```typescript
   // 第一次查询
   const metadataMap = useBatchAssetMetadata(assetIds);
   
   // 后续都可以复用
   await merak.listPoolsInfo({ pageSize: 10, metadataMap });
   await merak.listOwnedAssetsInfo({ account, metadataMap });
   ```

3. **性能敏感的场景**
   - 频繁调用的接口
   - 用户交互响应
   - 实时计算/估算

### ❌ 不需要传入的场景

1. **使用我们提供的 React Query hooks**
   ```typescript
   // 这些 hooks 已经自动处理了缓存
   usePools()
   useUserAssets()
   useAssetMetadata()
   ```

2. **首次加载数据时**
   ```typescript
   // 首次加载，还没有缓存数据
   const pools = await merak.listPoolsInfo({ pageSize: 10 });
   // SDK 会查询并存入缓存
   ```

3. **不确定如何创建 metadataMap 时**
   - SDK 会自动查询
   - 不传也不会有问题，只是可能有重复查询

## 性能提升说明

### 之前
```
用户操作 → SDK 查询 → 网络请求 → 等待 300ms → 返回结果
```

### 现在
```
用户操作 → SDK 使用缓存 → 立即返回 (< 1ms)
```

### 数据流
```
1. 首次请求: API → SDK 查询 → React Query 缓存
2. 后续请求: React Query 缓存 → SDK → 立即返回
```

## 注意事项

### 1. Map 的数据格式
```typescript
Map<string, AssetMetadataType>

// Key: assetId (字符串)
// Value: AssetMetadataType 对象（完整的 metadata 信息）
```

### 2. 部分缓存
如果 metadataMap 中只有部分数据，SDK 会自动查询缺失的：
```typescript
const metadataMap = new Map();
metadataMap.set('0', metadata0);
// 没有 assetId '1' 的数据

await merak.listPoolsInfo({ pageSize: 3, metadataMap });
// SDK 会使用 '0' 的缓存，然后查询其他缺失的 assetIds
```

### 3. 向后兼容
不传 `metadataMap` 完全 OK，会保持原有行为：
```typescript
// 这样也完全正常
await merak.listPoolsInfo({ pageSize: 3 });
```

## 最佳实践

1. **优先使用提供的 hooks** - 它们已经优化好了
2. **有数据就传入** - 能传就传，SDK 会智能处理
3. **不确定就不传** - SDK 会自动查询，不会出错
4. **利用 React Query 缓存** - `useBatchAssetMetadata` 是你的好朋友

## 总结

这次优化让你能够：
- ✅ 避免重复的网络请求
- ✅ 加快页面响应速度  
- ✅ 更灵活地控制数据缓存
- ✅ 保持代码简洁和可维护性

**最重要的**: 这是一个**可选优化**，不影响现有代码，你可以按需逐步采用。

