# Swap URL 结构更新 - 使用 CoinType

## 🎯 更新目标

将 Swap 页面的 URL 从使用 `assetId` 改为使用 `coinType`，提高 URL 可读性和语义化。

## 🔄 URL 变化

### 之前
```
/swap/[assetId]/[assetId]
例如: /swap/1/2
```

### 之后
```
/swap/[coinType]/[coinType]
例如: /swap/0x2::sui::SUI/0x8c7013745af0eb1ab211cde05b40ee6e2130276664d7e3e3741a36f11fa9f20b::dubhe::DUBHE
```

## 📝 主要修改

### 1. 添加 Helper 函数

**getAssetIdFromCoinType**
```typescript
const getAssetIdFromCoinType = useCallback((coinType: string): string | null => {
  // Try registry first
  const registryAsset = enrichedAssets?.find(
    (asset) => asset.asset.coinType === coinType
  );
  if (registryAsset) {
    return registryAsset.metadata.assetId;
  }
  
  // Try from asset wrappers in state
  const asset = assetsState.assetInfos.find(
    (a) => a.metadata?.coinType === coinType
  );
  return asset ? String(asset.assetId) : null;
}, [enrichedAssets, assetsState.assetInfos]);
```

**getCoinTypeFromAssetId**
```typescript
const getCoinTypeFromAssetId = useCallback((assetId: number | string): string | null => {
  // Try registry first
  const registryAsset = enrichedAssets?.find(
    (asset) => asset.metadata.assetId === String(assetId)
  );
  if (registryAsset) {
    return registryAsset.asset.coinType;
  }
  
  // Try from assets in state
  const asset = assetsState.assetInfos.find(
    (a) => String(a.assetId) === String(assetId)
  );
  return asset?.metadata?.coinType || null;
}, [enrichedAssets, assetsState.assetInfos]);
```

### 2. 添加 CoinType Mapping

在 `loadUserAssets` 中构建映射：
```typescript
// Build coinType to assetId mapping
const mapping = new Map<string, string>();
metadataResults.data.forEach((asset) => {
  if (asset.metadata?.coinType) {
    mapping.set(asset.metadata.coinType, String(asset.assetId));
  }
});
setCoinTypeToAssetId(mapping);
```

### 3. 修改 Token 初始化

从 URL 参数解析 coinType：
```typescript
// Decode coinType from URL (it might be URL encoded)
const fromCoinType = decodeURIComponent(params.fromToken);
const toCoinType = decodeURIComponent(params.toToken);

console.log('Looking for tokens with coinType:', { fromCoinType, toCoinType });

// Find tokens by coinType
const fromTokenInfo = assetsState.assetInfos.find(
  (asset) => asset.metadata?.coinType === fromCoinType
);
const toTokenInfo = assetsState.assetInfos.find(
  (asset) => asset.metadata?.coinType === toCoinType
);
```

### 4. 更新所有 URL 跳转

**handleSelectToken**
```typescript
const handleSelectToken = useCallback((token: Token) => {
  // Get coinType for the selected token
  const selectedCoinType = getCoinTypeFromAssetId(token.id);
  if (!selectedCoinType) {
    toast.error('Could not find coinType for selected token');
    return;
  }
  
  const encodedSelectedCoinType = encodeURIComponent(selectedCoinType);
  
  // 使用 coinType 更新 URL
  router.push(`/swap/${encodedSelectedCoinType}/...`);
}, [...]);
```

**handleChangeTokens** (交换按钮)
```typescript
const handleChangeTokens = useCallback(() => {
  if (fromToken && toToken) {
    // 获取 coinType
    const fromCoinType = getCoinTypeFromAssetId(toToken.id);
    const toCoinType = getCoinTypeFromAssetId(tempToken.id);
    
    if (fromCoinType && toCoinType) {
      router.push(
        `/swap/${encodeURIComponent(fromCoinType)}/${encodeURIComponent(toCoinType)}`
      );
    }
  }
}, [...]);
```

### 5. 更新默认路由

```typescript
// Error 页面的返回按钮
<Button onClick={() => 
  router.push('/swap/0x2::sui::SUI/0x8c7013745af0eb1ab211cde05b40ee6e2130276664d7e3e3741a36f11fa9f20b::dubhe::DUBHE')
}>
  Return to Default Pair
</Button>
```

## 🔍 查找流程

### URL → Token 信息
```
1. 从 URL 获取 coinType (URL encoded)
   ↓
2. decodeURIComponent(coinType)
   ↓
3. 在 assetsState.assetInfos 中查找匹配的 asset
   ↓
4. 获取 assetId 和其他元数据
   ↓
5. 初始化 token 并使用 registry logo
```

### Token 选择 → URL 更新
```
1. 用户选择 token (有 assetId)
   ↓
2. getCoinTypeFromAssetId(assetId)
   ↓
3. 优先从 registry 查找
   ↓
4. fallback 到 assetsState
   ↓
5. encodeURIComponent(coinType)
   ↓
6. 更新 URL
```

## 🎨 优势

### 1. 可读性
```
❌ /swap/1/2
✅ /swap/0x2::sui::SUI/0x8c...::dubhe::DUBHE
```
清楚地知道在交易哪些币种

### 2. 可分享性
URL 本身包含完整的 coinType 信息，更容易分享和理解

### 3. SEO 友好
更具描述性的 URL 对搜索引擎更友好

### 4. 与 Registry 集成
利用 registry 的 coinType 映射，优先使用本地配置

## 🔐 安全性

### URL 编码
```typescript
// 编码 coinType (包含特殊字符 ::)
const encoded = encodeURIComponent(coinType);

// 解码
const decoded = decodeURIComponent(urlParam);
```

### 验证
- 检查 coinType 是否存在于用户资产中
- 如果找不到对应的 token，显示错误页面
- 提供返回默认交易对的选项

## 📊 数据流

### 完整流程
```
用户访问 /swap/[coinType1]/[coinType2]
  ↓
URL 参数解码
  ↓
查找 coinType → assetId 映射
  ↓
优先从 registry 查找
  ↓
fallback 到链上数据
  ↓
获取完整的 token 信息
  ↓
使用 registry logo (如果可用)
  ↓
初始化 swap 界面
```

## 🧪 测试场景

### 正常流程
- [ ] 访问 `/swap/0x2::sui::SUI/...` 正确加载
- [ ] 选择其他 token 后 URL 正确更新
- [ ] 交换按钮正确更新 URL
- [ ] 刷新页面后状态保持

### 边界情况
- [ ] URL 中的 coinType 不存在 → 显示错误
- [ ] coinType 格式错误 → 显示错误
- [ ] Registry 中找不到 → fallback 到链上数据
- [ ] 未连接钱包 → 重定向到首页

### URL 编码
- [ ] coinType 包含特殊字符正确编码
- [ ] 中文或其他特殊字符处理
- [ ] 解码后正确匹配

## 🚀 兼容性

### 向后兼容
需要考虑旧的 assetId URL：
```typescript
// 可选：添加重定向逻辑
if (/^\d+$/.test(params.fromToken)) {
  // 是 assetId，转换为 coinType
  const coinType = getCoinTypeFromAssetId(params.fromToken);
  if (coinType) {
    router.replace(`/swap/${encodeURIComponent(coinType)}/...`);
  }
}
```

### Registry 依赖
- ✅ 优先使用 registry 的 coinType 映射
- ✅ Fallback 到链上数据
- ✅ 双向查找（coinType ↔ assetId）

## 📌 注意事项

1. **URL 长度**: CoinType URL 比 assetId 长，但仍在合理范围内
2. **编码处理**: 确保所有 `::` 等特殊字符正确编码
3. **性能**: 映射查找是 O(n)，但数据量小，影响可忽略
4. **缓存**: 考虑缓存 coinType ↔ assetId 映射

## ✅ 完成状态

- ✅ Helper 函数实现
- ✅ URL 参数解析
- ✅ Token 初始化逻辑
- ✅ 所有 router.push 更新
- ✅ 默认路由更新
- ✅ Registry 集成
- ✅ 错误处理

Swap 页面现在使用语义化的 coinType URL！🎉

