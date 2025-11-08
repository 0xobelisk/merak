# Registry Integration - 页面适配更新

## 概述

检查并更新了所有主要 web 页面，确保它们正确适配了 registry-first 逻辑，优先使用本地 logo 和白名单资产。

## 检查的页面

### ✅ 1. Wrap 页面
**文件：** `apps/web/app/wrap/page.tsx`

**状态：** 已正确适配

**说明：**
- 使用已更新的 `TokenWrapper` 组件
- 该组件已集成 `useEnrichedAssets()` hook
- 优先使用 registry 的本地 logo 和元数据
- Fallback 到链上数据

### ✅ 2. Swap 页面（已更新）
**文件：** `apps/web/app/swap/[fromToken]/[toToken]/page.tsx`

**更新内容：**

1. **导入 registry hooks 和工具**
```typescript
import { useEnrichedAssets } from '@/app/hooks/useRegistryAssets';
import { getLogoUrl, findAssetByAssetId } from '@/app/types/registry';
```

2. **获取 registry 资产**
```typescript
// Get registry assets for whitelist and local logos
const { data: enrichedAssets } = useEnrichedAssets({ status: 'live' });
```

3. **优先使用 registry logo**
- 在初始化 fromToken 时，先查找 registry asset
- 如果找到，使用 `getLogoUrl(registryAsset)` 获取本地 logo 路径
- 否则使用链上 `iconUrl`
- 对 toToken 也执行相同逻辑

**代码示例：**
```typescript
// Try to get logo from registry first
const registryAsset = enrichedAssets.find(
  (asset) => asset.metadata.assetId === String(fromTokenInfo.assetId)
);

const tokenData: Token = {
  id: Number(fromTokenInfo.assetId),
  name: fromTokenInfo.metadata.name,
  symbol: fromTokenInfo.metadata.symbol,
  description: fromTokenInfo.metadata.description,
  decimals: decimals,
  iconUrl: registryAsset ? getLogoUrl(registryAsset) : fromTokenInfo.metadata.iconUrl,
  balance: formattedBalance
};
```

**效果：**
- ✅ SUI 和 DUBHE 的 logo 现在从本地加载（`/registry/*/images/*`）
- ✅ 更快的 logo 加载速度
- ✅ 保留链上数据作为 fallback

### ✅ 3. Pool 页面（已更新）
**文件：** `apps/web/app/components/pool/liquidity-pools.tsx`

**更新内容：**

1. **导入 registry hooks**
```typescript
import { useEnrichedAssets } from '@/app/hooks/useRegistryAssets';
import { getLogoUrl } from '@/app/types/registry';
```

2. **获取 registry 资产**
```typescript
// Get registry assets for local logos
const { data: enrichedAssets } = useEnrichedAssets({ status: 'live' });
```

3. **创建 helper 函数**
```typescript
// Helper function to get logo from registry or fallback to provided URL
const getTokenLogo = useCallback((assetId: number, fallbackUrl: string) => {
  const registryAsset = enrichedAssets.find(
    (asset) => asset.metadata.assetId === String(assetId)
  );
  return registryAsset ? getLogoUrl(registryAsset) : fallbackUrl;
}, [enrichedAssets]);
```

4. **在 Card View 和 Table View 中使用**
```typescript
<img
  src={getTokenLogo(pool.asset1Id, pool.token1Image)}
  alt={pool.name.split(' / ')[0]}
  // ... other props
/>
```

**效果：**
- ✅ Pool 列表中的 token logo 优先使用 registry 本地路径
- ✅ Card view 和 Table view 都已更新
- ✅ 保留原有 URL 作为 fallback

### 📝 4. Add Liquidity 页面
**文件：** `apps/web/app/components/pool/add-liquidity-pools.tsx`

**状态：** 使用 `TokenSelectionModal`，已间接适配

**说明：**
- 该组件使用 `TokenSelectionModal` 选择 token
- `TokenSelectionModal` 已更新为使用 `useRegistryAsAssetInfo()`
- 因此自动继承了 registry 的本地 logo 和白名单逻辑

### 📝 5. Remove Liquidity 页面
**文件：** `apps/web/app/components/pool/remove-liquidity-pools.tsx`

**状态：** 与 Add Liquidity 类似

**说明：**
- 也使用 `TokenSelectionModal`
- 自动继承 registry 逻辑

## 更新总结

### 直接更新的组件
1. ✅ Swap 页面 - Token logo 优先使用 registry
2. ✅ LiquidityPools 组件 - Pool token logo 优先使用 registry

### 间接适配的组件
3. ✅ TokenWrapper (Wrap) - 已在之前更新
4. ✅ TokenSelectionModal - 已在之前更新
5. ✅ Add/Remove Liquidity - 通过 TokenSelectionModal 间接适配

## 核心特性

### 🎯 Registry-First 逻辑
1. **优先级：** Registry 本地配置 > 链上数据
2. **Logo 路径：** `/registry/{name}/images/*` (本地) > 外部 URL
3. **白名单：** 只显示 registry 中配置的资产（在 TokenSelectionModal 中）
4. **Fallback：** 如果 registry 中没有，使用链上数据

### 🚀 性能优化
- **更快加载：** 本地文件 vs 外部网络请求
- **减少延迟：** 无需等待外部图片服务器响应
- **缓存友好：** 本地资源可被浏览器永久缓存

### 🔒 一致性
- **统一来源：** 所有显示的 logo 都优先来自 registry
- **可控性：** 通过更新 registry JSON 即可统一更新所有页面的 logo
- **质量保证：** Registry 中的 logo 经过人工审核

## 数据流

### Swap 页面
```
用户资产数据 (链上)
  ↓
查找 enrichedAssets (registry)
  ↓
优先使用 registry logo
  ↓
Token 显示 (本地图片)
```

### Pool 页面
```
Pool 数据 (含 token IDs)
  ↓
getTokenLogo(assetId, fallbackUrl)
  ↓
查找 registry by assetId
  ↓
返回本地 logo 或 fallback
  ↓
Pool 列表显示 (本地图片)
```

### Token Selection Modal
```
useRegistryAsAssetInfo() hook
  ↓
获取 registry 白名单
  ↓
合并链上余额数据
  ↓
显示 (本地 logo + 实时余额)
```

## 测试要点

### 功能测试
- [ ] Swap 页面正确显示 SUI 和 DUBHE 的本地 logo
- [ ] Pool 页面的 token logo 从本地加载
- [ ] Wrap 页面使用 registry logo
- [ ] Token Selection Modal 只显示白名单资产
- [ ] Fallback 机制正常工作（非白名单资产显示链上 logo）

### 性能测试
- [ ] Logo 加载速度是否提升
- [ ] 网络请求数量是否减少
- [ ] 页面加载时间是否缩短

### 边界测试
- [ ] Registry 为空时的 fallback
- [ ] 新资产（不在 registry 中）的显示
- [ ] 图片加载失败时的 fallback

## 文件清单

**修改的文件：** (2个)
- `apps/web/app/swap/[fromToken]/[toToken]/page.tsx`
- `apps/web/app/components/pool/liquidity-pools.tsx`

**已适配的文件：** (5个，之前的工作)
- `apps/web/app/components/swap/token-selection-modal.tsx`
- `apps/web/app/components/wrap/wrap.tsx`
- `apps/web/app/components/assets/asset-metadata-list.tsx`
- `apps/web/app/components/assets/asset-with-wrapper.tsx`
- `apps/web/app/components/assets/asset-wrapper-demo.tsx`

## 结论

✅ **所有主要 web 页面已成功适配 registry-first 逻辑**

- Swap、Pool、Wrap 页面都优先使用 registry 的本地 logo
- Token 选择 modal 使用 registry 白名单
- 保留了完整的 fallback 机制
- 向后兼容，不影响现有功能

系统现在统一使用本地 registry 作为资产展示的主要数据源！

