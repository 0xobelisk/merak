# Swap URL 更新完成 - 使用 CoinType

## ✅ 完成状态

已成功将 Swap 页面的 URL 从使用 `assetId` 更新为使用 `coinType`。

## 🔄 URL 变化

### 之前
```
/swap/1/2
```

### 之后
```
/swap/0x2::sui::SUI/0x8c7013745af0eb1ab211cde05b40ee6e2130276664d7e3e3741a36f11fa9f20b::dubhe::DUBHE
```

## 🎯 核心实现

### 1. Helper 函数

```typescript
// CoinType → AssetId
const getAssetIdFromCoinType = (coinType: string): string | null => {
  // 1. 优先从 registry 查找
  // 2. fallback 到 asset wrappers
}

// AssetId → CoinType
const getCoinTypeFromAssetId = (assetId: number | string): string | null => {
  // 1. 优先从 registry 查找
  // 2. fallback 到 asset wrappers
}
```

### 2. Token 初始化

```typescript
// 从 URL 解码 coinType
const fromCoinType = decodeURIComponent(params.fromToken);
const toCoinType = decodeURIComponent(params.toToken);

// 转换为 assetId
const fromAssetId = getAssetIdFromCoinType(fromCoinType);
const toAssetId = getAssetIdFromCoinType(toCoinType);

// 查找 token 信息
const fromTokenInfo = assetsState.assetInfos.find(
  (asset) => String(asset.assetId) === fromAssetId
);
```

### 3. URL 更新

所有 router.push 现在使用 coinType：

```typescript
// 选择 token 时
const coinType = getCoinTypeFromAssetId(token.id);
router.push(`/swap/${encodeURIComponent(coinType)}/...`);

// 交换 token 时
const fromCoinType = getCoinTypeFromAssetId(toToken.id);
const toCoinType = getCoinTypeFromAssetId(tempToken.id);
router.push(
  `/swap/${encodeURIComponent(fromCoinType)}/${encodeURIComponent(toCoinType)}`
);
```

## 🔍 数据源优先级

1. **Registry** (本地配置) - 快速、可靠
2. **Asset Wrappers** (链上 wrapper 映射) - fallback

## 📊 使用示例

### SUI ↔ DUBHE
```
/swap/0x2::sui::SUI/0x8c7013745af0eb1ab211cde05b40ee6e2130276664d7e3e3741a36f11fa9f20b::dubhe::DUBHE
```

### 访问流程
```
用户访问 URL
  ↓
解码 coinType
  ↓
查找对应的 assetId (registry → wrappers)
  ↓
加载 token 信息
  ↓
使用 registry logo (如果可用)
  ↓
显示 swap 界面
```

## ✨ 优势

### 1. 可读性
✅ URL 清楚显示交易的币种  
✅ 更容易分享和理解

### 2. SEO 友好
✅ 更具描述性的 URL

### 3. Registry 集成
✅ 优先使用本地 registry 配置  
✅ 自动 fallback 到链上数据

### 4. 类型安全
✅ 通过所有 TypeScript 检查  
✅ 完整的类型支持

## 🧪 测试场景

### 正常流程
- ✅ URL 参数正确解析
- ✅ Token 正确初始化
- ✅ 选择 token 后 URL 更新
- ✅ 交换按钮正确工作
- ✅ Registry logo 正确显示

### 错误处理
- ✅ 无效的 coinType → 显示错误
- ✅ 找不到对应的 token → 错误页面
- ✅ 提供返回默认交易对的选项

## 📝 关键修改

**修改的文件：** 1 个
- `apps/web/app/swap/[fromToken]/[toToken]/page.tsx`

**新增依赖：**
- `useAssetWrappers` hook (用于 coinType 映射)

**URL 编码：**
- 使用 `encodeURIComponent` 编码
- 使用 `decodeURIComponent` 解码

## 🎉 结果

✅ **0 个 Linting 错误**  
✅ **类型安全**  
✅ **Registry 优先**  
✅ **完整的 fallback 机制**  
✅ **更好的用户体验**

Swap 页面现在使用语义化的 coinType URL，提供更好的可读性和可分享性！

