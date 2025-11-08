# SDK Metadata 查询优化

## 优化概述

将 SDK 方法中的自动 metadata 查询改为可选传入，允许前端使用已缓存的数据，避免重复查询。

## 修改的方法

### 1. `listPoolsInfo()`

**新增参数**: `metadataMap?: Map<string, AssetMetadataType>`

```typescript
// 之前：SDK 自动查询所有 metadata
const pools = await merak.listPoolsInfo({ pageSize: 3 });

// 现在：可以传入缓存的 metadata
const pools = await merak.listPoolsInfo({ 
  pageSize: 3,
  metadataMap: cachedMetadataMap 
});
```

**行为**:
- 如果提供 `metadataMap`，优先使用缓存的数据
- 只对缺失的 assetId 进行查询
- 如果不提供，保持原有行为（查询所有 metadata）

### 2. `listAccountLpAssets()`

**新增参数**: `metadataMap?: Map<string, AssetMetadataType>`

```typescript
// 之前
const lpAssets = await merak.listAccountLpAssets({ account: address });

// 现在
const lpAssets = await merak.listAccountLpAssets({ 
  account: address,
  metadataMap: cachedMetadataMap 
});
```

### 3. `listOwnedAssetsInfo()`

**新增参数**: `metadataMap?: Map<string, AssetMetadataType>`

```typescript
// 之前
const assets = await merak.listOwnedAssetsInfo({ account: address });

// 现在
const assets = await merak.listOwnedAssetsInfo({ 
  account: address,
  metadataMap: cachedMetadataMap 
});
```

### 4. `listOwnedWrapperAssets()`

**新增参数**: `metadataMap?: Map<string, AssetMetadataType>`

```typescript
// 之前
const wrapperAssets = await merak.listOwnedWrapperAssets({ account: address });

// 现在
const wrapperAssets = await merak.listOwnedWrapperAssets({ 
  account: address,
  metadataMap: cachedMetadataMap 
});
```

### 5. `calRemoveLpAmount()`

**新增参数**: `metadataMap?: Map<string, AssetMetadataType>`

```typescript
// 之前
const amounts = await merak.calRemoveLpAmount({
  address,
  poolAssetId,
  poolSupply,
  amount
});

// 现在
const amounts = await merak.calRemoveLpAmount({
  address,
  poolAssetId,
  poolSupply,
  amount,
  metadataMap: cachedMetadataMap
});
```

## 前端使用指南

### 1. 在 React Query Hooks 中使用

```typescript
// useUserAssets.ts
export function useUserAssets(options: UseUserAssetsOptions = {}) {
  const account = useCurrentAccount();
  const merak = useMerak();
  
  // 获取缓存的 metadata
  const { data: metadataMap } = useBatchAssetMetadata(assetIds);

  return useQuery<UserAssetsResponse>({
    queryKey: ['userAssets', account?.address, assetType],
    queryFn: async () => {
      const result = await merak.listOwnedAssetsInfo({
        account: account.address!,
        assetType,
        metadataMap // 传入缓存的 metadata
      });
      return result;
    },
    enabled: enabled && !!account?.address && !!merak
  });
}
```

### 2. 在 usePools Hook 中使用

```typescript
// usePools.ts
export function usePools(options: UsePoolsOptions = {}) {
  const merak = useMerak();
  
  // 先获取 pool 列表得到所有 assetId
  const { data: poolList } = useQuery(['poolList'], () => 
    merak.allPoolList({ pageSize })
  );
  
  // 批量获取 metadata
  const assetIds = poolList?.flatMap(p => [p.asset0, p.asset1]) || [];
  const { data: metadataMap } = useBatchAssetMetadata(assetIds);

  return useQuery<PoolInfo[]>({
    queryKey: ['pools', pageSize],
    queryFn: async () => {
      const poolList = await merak.listPoolsInfo({
        pageSize,
        metadataMap // 传入缓存的 metadata
      });
      return poolList;
    },
    enabled: enabled && !!merak && !!metadataMap
  });
}
```

## 优化效果

### 性能提升
1. **减少网络请求**: 使用缓存数据，避免重复查询相同的 metadata
2. **更快的响应速度**: 直接使用内存中的数据，无需等待网络请求
3. **更好的用户体验**: 页面切换时可以立即显示缓存数据

### 向后兼容
- 所有参数都是可选的
- 不传 `metadataMap` 时，保持原有行为
- 现有代码无需修改即可继续工作

## 注意事项

1. **Map 格式**: `metadataMap` 使用 `Map<string, AssetMetadataType>`
   - Key: assetId (字符串)
   - Value: AssetMetadataType 对象

2. **部分缓存**: 如果只有部分 metadata 在缓存中，SDK 会自动查询缺失的数据

3. **缓存更新**: 前端需要管理 metadata 缓存的更新策略（通过 React Query 的 staleTime/gcTime）

4. **类型安全**: TypeScript 会确保传入的 Map 类型正确

## 示例：完整的缓存流程

```typescript
// 1. 定义 batch metadata hook
export function useBatchAssetMetadata(assetIds: string[]) {
  return useQuery({
    queryKey: ['batchAssetMetadata', ...assetIds.sort()],
    queryFn: async () => {
      // 并发获取所有 metadata
      const results = await Promise.all(
        assetIds.map(id => fetchMetadataViaAPI(id))
      );
      
      // 转换为 Map
      const map = new Map<string, AssetMetadataType>();
      results.forEach((metadata, idx) => {
        if (metadata) {
          map.set(assetIds[idx], metadata);
        }
      });
      return map;
    },
    staleTime: 5 * 60 * 1000, // 缓存 5 分钟
    enabled: assetIds.length > 0
  });
}

// 2. 在组件中使用
function PoolsList() {
  const merak = useMerak();
  
  // 先获取基础数据得到 assetIds
  const { data: basicPools } = useQuery(['basicPools'], () =>
    merak.allPoolList({ pageSize: 10 })
  );
  
  const assetIds = useMemo(() => 
    basicPools?.flatMap(p => [p.asset0, p.asset1]) || [],
    [basicPools]
  );
  
  // 批量获取并缓存 metadata
  const { data: metadataMap } = useBatchAssetMetadata(assetIds);
  
  // 获取完整的 pool 信息（使用缓存的 metadata）
  const { data: pools } = useQuery({
    queryKey: ['pools', metadataMap],
    queryFn: () => merak.listPoolsInfo({ 
      pageSize: 10,
      metadataMap 
    }),
    enabled: !!metadataMap && assetIds.length > 0
  });
  
  return <PoolsListUI pools={pools} />;
}
```

## 总结

这次优化实现了：
- ✅ SDK 支持接收预缓存的 metadata
- ✅ 保持向后兼容性
- ✅ 智能处理部分缓存情况
- ✅ 为前端提供更灵活的缓存控制
- ✅ 显著减少重复的网络请求

前端可以通过 React Query 管理 metadata 缓存，SDK 会优先使用缓存数据，只在必要时才进行查询。

