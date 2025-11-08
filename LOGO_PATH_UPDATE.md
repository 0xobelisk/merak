# Logo 路径统一更新 - 使用 Registry 路径

## ✅ 更新完成

已将所有使用 `/sui-logo.svg` 的地方替换为 `/registry/sui/images/sui.svg`

## 📊 更新统计

### 修改的文件数量: 10 个

1. **apps/web/app/swap/[fromToken]/[toToken]/page.tsx** - 2 处
2. **apps/web/app/components/pool/liquidity-pools.tsx** - 4 处
3. **apps/web/app/components/wrap/wrap.tsx** - 6 处
4. **apps/web/app/components/assets/asset-metadata-list.tsx** - 1 处
5. **apps/web/app/components/assets/asset-with-wrapper.tsx** - 1 处
6. **apps/web/app/types/registry.ts** - 1 处
7. **apps/web/app/components/swap/token-selection-modal.tsx** - 1 处
8. **apps/web/app/hooks/useRegistryAssets.ts** - 1 处
9. **apps/web/app/components/pool/remove-liquidity-pools.tsx** - 4 处
10. **apps/web/app/components/pool/add-liquidity-pools.tsx** - 4 处
11. **apps/web/app/components/wallet/wallet-menu.tsx** - 2 处

**总计:** 27 处更新

## 🔄 更新内容

### 之前
```typescript
// Fallback 图标
'/sui-logo.svg'

// 错误处理
onError={(e) => {
  (e.target as HTMLImageElement).src = '/sui-logo.svg';
}}

// 默认图标
const DEFAULT_ICON = '/sui-logo.svg';
```

### 之后
```typescript
// Fallback 图标
'/registry/sui/images/sui.svg'

// 错误处理
onError={(e) => {
  (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
}}

// 默认图标
const DEFAULT_ICON = '/registry/sui/images/sui.svg';
```

## 📂 更新位置

### 1. Swap 页面
- `page.tsx` - 图片 onError 处理

### 2. Pool 组件
- `liquidity-pools.tsx` - 图片 onError 处理
- `add-liquidity-pools.tsx` - 默认 iconUrl + onError 处理
- `remove-liquidity-pools.tsx` - 默认 iconUrl + onError 处理

### 3. Wrap 组件
- `wrap.tsx` - 默认 iconUrl + onError 处理

### 4. Assets 组件
- `asset-metadata-list.tsx` - 图片 onError 处理
- `asset-with-wrapper.tsx` - 图片 onError 处理

### 5. Token Selection
- `token-selection-modal.tsx` - DEFAULT_ICON 常量

### 6. Wallet 组件
- `wallet-menu.tsx` - SUI logo 显示

### 7. Utility & Types
- `registry.ts` - getLogoUrl fallback
- `useRegistryAssets.ts` - iconUrl fallback

## 🎯 统一标准

### Logo 优先级
```
1. Registry logo (asset.asset.logo_URIs)
   ↓
2. On-chain iconUrl (metadata.iconUrl)
   ↓
3. Fallback to registry SUI logo (/registry/sui/images/sui.svg)
```

### Registry 路径规范
```
/registry/[asset_name]/images/[image_file]

例如:
- /registry/sui/images/sui.svg
- /registry/dubhe/images/dubhe.jpg
```

## ✨ 优势

### 1. 一致性
✅ 所有 fallback 图标都使用 registry 路径  
✅ 统一的资源管理

### 2. 可维护性
✅ 所有 logo 资源在 registry 目录统一管理  
✅ 更容易更新和维护

### 3. 本地优先
✅ 不依赖外部资源  
✅ 加载速度更快

### 4. 类型安全
✅ 清晰的文件路径  
✅ 易于追踪和调试

## 🔍 验证

### 检查方法
```bash
# 搜索所有 /sui-logo.svg 引用
grep -r "/sui-logo.svg" apps/web/app

# 应该返回 0 个结果
```

### 测试场景
- ✅ 图片加载失败时显示 fallback
- ✅ Token 没有 iconUrl 时显示默认图标
- ✅ Registry 资产正确显示本地 logo
- ✅ Wallet 菜单显示 SUI logo

## 📝 注意事项

### Public 目录
原有的 `/sui-logo.svg` 文件仍然保留在 `public/` 目录中作为备份，但代码中不再引用。

### Registry 结构
```
public/
  ├── registry/
  │   ├── sui/
  │   │   ├── images/
  │   │   │   ├── sui.svg   ← 新的标准路径
  │   │   │   └── sui.png
  │   │   └── asset.json
  │   └── dubhe/
  │       ├── images/
  │       │   └── dubhe.jpg
  │       └── asset.json
  └── sui-logo.svg   ← 旧路径，保留但不再使用
```

## 🎉 结果

✅ **27 处更新完成**  
✅ **统一使用 Registry 路径**  
✅ **更好的资源管理**  
✅ **一致的 Fallback 机制**

所有 logo 路径已统一更新为 registry 模式！

