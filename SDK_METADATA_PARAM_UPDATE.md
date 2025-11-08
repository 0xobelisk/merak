# SDK Metadata 参数传入优化 - 完成总结

## 优化目标

将 SDK 方法中的自动 metadata 查询改为**可选传入**，让前端能够传入已缓存的数据，避免重复查询，提升性能。

## 实现原理

### 核心思路
1. **SDK 层面**: 在方法签名中添加可选的 `metadataMap` 参数
2. **智能降级**: 如果提供了 metadataMap，优先使用；未提供的 assetId 自动查询
3. **向后兼容**: 不传 metadataMap 时，保持原有行为
4. **前端优化**: 使用 React Query 缓存的数据传入 SDK

## SDK 修改详情

### 1. `listPoolsInfo()` 
**文件**: `packages/sdk/src/merak.ts` (L776-882)

**新增参数**: `metadataMap?: Map<string, AssetMetadataType>`

**优化逻辑**:
```typescript
async listPoolsInfo({
  pageSize,
  metadataMap: providedMetadataMap
}: {
  pageSize?: number;
  metadataMap?: Map<string, AssetMetadataType>;
} = {}): Promise<PoolInfo[]>
```

**行为**:
- 如果提供了 `metadataMap`，先从中查找
- 只对缺失的 assetId 进行查询
- 未提供时查询所有 metadata（保持原行为）

### 2. `listAccountLpAssets()`
**文件**: `packages/sdk/src/merak.ts` (L699-758)

**新增参数**: `metadataMap?: Map<string, AssetMetadataType>`

**优化逻辑**:
```typescript
async listAccountLpAssets({
  account,
  assetType,
  first,
  after,
  orderBy,
  metadataMap: providedMetadataMap
}: {
  account: string;
  assetType?: AssetType;
  first?: number;
  after?: string;
  orderBy?: OrderBy[];
  metadataMap?: Map<string, AssetMetadataType>;
}): Promise<AssetInfoResponse>
```

### 3. `listOwnedAssetsInfo()`
**文件**: `packages/sdk/src/merak.ts` (L771-787)

**新增参数**: `metadataMap?: Map<string, AssetMetadataType>`

**传递**: 透传给 `listAccountLpAssets`

### 4. `listOwnedWrapperAssets()`
**文件**: `packages/sdk/src/merak.ts` (L916-930)

**新增参数**: `metadataMap?: Map<string, AssetMetadataType>`

**传递**: 透传给 `listOwnedAssetsInfo`

### 5. `calRemoveLpAmount()`
**文件**: `packages/sdk/src/merak.ts` (L932-1028)

**新增参数**: `metadataMap?: Map<string, AssetMetadataType>`

**优化逻辑**:
```typescript
async calRemoveLpAmount({
  address,
  poolAssetId,
  poolSupply,
  amount,
  metadataMap: providedMetadataMap
}: {
  address: string;
  poolAssetId: string;
  poolSupply: number;
  amount?: bigint | number | string;
  metadataMap?: Map<string, AssetMetadataType>;
})
```

## 前端更新详情

### 1. `usePools` Hook
**文件**: `apps/web/app/hooks/usePools.ts`

**优化策略**:
```typescript
// 三步优化流程
1. 获取基础 pool 列表 → 提取 assetIds
2. 批量获取 metadata → 使用 useBatchAssetMetadata (React Query 缓存)
3. 使用缓存的 metadata 获取完整 pool 信息
```

**效果**: 
- metadata 请求被 React Query 缓存（5分钟）
- 跨组件共享缓存，避免重复请求
- SDK 直接使用缓存数据，无需重复查询

### 2. `useUserAssets` Hook
**文件**: `apps/web/app/hooks/useUserAssets.ts`

**策略**: 
- 暂不传入 metadataMap（因为不知道用户拥有哪些资产）
- SDK 的 `getMetadata` 已使用 API 缓存（ISR 60s）
- 添加注释说明未来可进行二次优化

### 3. `remove-liquidity-pools.tsx`
**文件**: `apps/web/app/components/pool/remove-liquidity-pools.tsx`

**优化**: 
```typescript
// 从已加载的 tokenA 和 tokenB 数据创建 metadataMap
const metadataMap = new Map();
if (tokenA && tokenB) {
  metadataMap.set(tokenA.id, { ...tokenA metadata });
  metadataMap.set(tokenB.id, { ...tokenB metadata });
}

// 传入 SDK
await merak.calRemoveLpAmount({
  address,
  poolAssetId,
  poolSupply,
  amount,
  metadataMap
});
```

**效果**: 避免 SDK 重复查询已知的 token metadata

### 4. `wrap.tsx`
**文件**: `apps/web/app/components/wrap/wrap.tsx`

**优化**:
```typescript
// 从 registry enrichedAssets 创建 metadataMap
const metadataMap = new Map();
if (enrichedAssets && enrichedAssets.length > 0) {
  enrichedAssets.forEach((asset) => {
    metadataMap.set(asset.metadata.assetId, { ...metadata });
  });
}

// 传入 SDK
await merak.listOwnedWrapperAssets({
  account,
  first: 50,
  orderBy,
  metadataMap: metadataMap.size > 0 ? metadataMap : undefined
});
```

**效果**: 使用 registry 缓存数据，避免 SDK 重复查询

## 性能提升

### 1. 减少网络请求
- **之前**: 每次调用 SDK 方法都会查询 metadata，即使数据已在前端缓存
- **现在**: 优先使用缓存数据，只查询缺失的 metadata

### 2. 更快的响应速度
- **之前**: SDK 查询 → 等待网络 → 返回结果
- **现在**: 直接使用内存中的缓存数据（React Query）

### 3. 更好的用户体验
- **之前**: 页面切换时需要重新加载数据
- **现在**: 立即显示缓存数据，后台静默更新

### 4. 数据一致性
- **React Query 缓存策略**: metadata 5分钟，registry 10分钟
- **API ISR 缓存**: 60秒
- **多层缓存**: 前端 React Query → API Route Cache → SDK 查询

## 示例对比

### 之前（重复查询）
```typescript
// Component A
const pools = await merak.listPoolsInfo({ pageSize: 3 });
// SDK 内部查询 6 个 metadata（3个pool * 2个token）

// Component B (相同页面)
const pools = await merak.listPoolsInfo({ pageSize: 3 });
// SDK 再次查询相同的 6 个 metadata ❌ 重复请求
```

### 现在（使用缓存）
```typescript
// Component A
const { data: metadataMap } = useBatchAssetMetadata(assetIds); // 查询一次
const pools = await merak.listPoolsInfo({ pageSize: 3, metadataMap });

// Component B (相同页面)
const { data: metadataMap } = useBatchAssetMetadata(assetIds); // React Query 缓存 ✅
const pools = await merak.listPoolsInfo({ pageSize: 3, metadataMap });
// 无网络请求！
```

## 向后兼容性

✅ **完全向后兼容**
- 所有 `metadataMap` 参数都是可选的
- 不传时保持原有行为
- 现有代码无需修改即可继续工作
- 渐进式优化：可以逐步在各个组件中添加缓存

## 类型安全

✅ **TypeScript 类型完整**
- `metadataMap?: Map<string, AssetMetadataType>`
- SDK 重新编译后，前端自动获得类型提示
- 编译时检查，避免运行时错误

## 测试检查清单

- [x] SDK 方法签名更新
- [x] SDK 编译成功（`pnpm run build`）
- [x] 前端 TypeScript 无错误
- [x] Lint 检查通过
- [x] usePools hook 更新
- [x] useUserAssets hook 注释说明
- [x] remove-liquidity-pools 组件更新
- [x] wrap 组件更新
- [x] 向后兼容性验证

## 下一步优化建议

### 1. useUserAssets 优化
可以实现两步查询：
```typescript
// Step 1: 获取用户资产列表（只包含 assetId 和 balance）
const assetList = await merak.listUserAssetIds({ account });

// Step 2: 批量获取 metadata
const metadataMap = await useBatchAssetMetadata(assetList.map(a => a.assetId));

// Step 3: 使用缓存的 metadata 获取完整信息
const fullAssets = await merak.listOwnedAssetsInfo({ 
  account, 
  metadataMap 
});
```

### 2. 全局 Metadata 缓存
考虑在 DataProvider 中预加载常用资产的 metadata：
```typescript
// 预加载 top 20 资产的 metadata
const topAssetIds = ['0', '1', '2', ...];
useBatchAssetMetadata(topAssetIds);
```

### 3. Metadata 更新策略
- 短期缓存（5分钟）适合频繁变化的数据
- 长期缓存（30分钟）适合稳定的 metadata
- 考虑添加手动刷新按钮

## 总结

此次优化实现了：
- ✅ SDK 支持接收预缓存的 metadata
- ✅ 保持向后兼容性
- ✅ 智能处理部分缓存情况
- ✅ 为前端提供更灵活的缓存控制
- ✅ 显著减少重复的网络请求
- ✅ 提升页面响应速度
- ✅ 改善用户体验

**关键收益**: 前端可以通过 React Query 管理 metadata 缓存，SDK 会优先使用缓存数据，只在必要时才进行查询，从根本上解决了重复查询的问题。

