# Supply 数据分离完成总结

## 🎯 问题描述

在之前的实现中，`supply` 字段被错误地包含在 `AssetMetadataType` 中，但实际上 supply 是动态变化的数据，应该单独查询而不是作为静态 metadata 的一部分。

## ✅ 完成的修改

### 1. **SDK 类型定义** (`packages/sdk/src/types/index.ts`)

#### 添加了 `AssetSupplyType` 类型
```typescript
export type AssetSupplyType = {
  assetId: string;
  supply: string;
  createdAtTimestampMs: string;
  updatedAtTimestampMs: string;
  isDeleted: boolean;
  lastUpdateDigest: string;
  __typename?: string;
};
```

#### 验证 `AssetMetadataType` 不包含 supply
```typescript
export type AssetMetadataType = {
  assetId: string;
  assetType: string;
  name: string;
  symbol: string;
  description: string;
  decimals: number;
  iconUrl: string;
  owner: string;
  status: string;
  isMintable: boolean;
  isBurnable: boolean;
  isFreezable: boolean;
  isDeleted: boolean;
  createdAtTimestampMs: string;
  updatedAtTimestampMs: string;
  lastUpdateDigest: string;
  nodeId: string;
  // ❌ 没有 supply 字段
};
```

### 2. **SDK 方法** (`packages/sdk/src/merak.ts`)

#### 添加了 `supplyOf()` 方法
```typescript
async supplyOf(assetId: string): Promise<AssetSupplyType | null> {
  const supply = await this.storage.get.assetSupply({
    assetId
  });
  return supply as AssetSupplyType | null;
}
```

**返回数据结构：**
```typescript
{
  assetId: '0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6',
  supply: '15788103129',  // ✅ supply 字段
  createdAtTimestampMs: '1759899981595',
  updatedAtTimestampMs: '1762627572974',
  isDeleted: false,
  lastUpdateDigest: 'E1GcFVgYxoQ7ufCKeY7bsJNtDUCquZ6QU8Y7H2MsF9f7',
  __typename: 'StoreAssetSupply'
}
```

### 3. **Web 应用更新** (`apps/web/app/components/pool/add-liquidity-pools.tsx`)

#### 修复前（❌ 错误）
```typescript
const lpMetadata = await getAssetMetadata(String(lpAssetId));
const totalSupply = parseFloat(lpMetadata.supply); // ❌ metadata 中没有 supply
```

#### 修复后（✅ 正确）
```typescript
const lpMetadata = await getAssetMetadata(String(lpAssetId));

// Get supply from merak.supplyOf instead of metadata
const lpSupply = await merak.supplyOf(String(lpAssetId));
console.log(lpSupply, 'lpSupply');
if (!lpSupply) {
  console.error('Failed to get LP token supply');
  setExpectedLPTokens('');
  return;
}

const totalSupply = parseFloat(lpSupply.supply); // ✅ 从 supplyOf 获取
```

## 📊 影响范围

### 修改的文件
1. ✅ `packages/sdk/src/types/index.ts` - 添加 `AssetSupplyType` 类型
2. ✅ `packages/sdk/src/merak.ts` - 添加 `supplyOf()` 方法并导入类型
3. ✅ `apps/web/app/components/pool/add-liquidity-pools.tsx` - 使用 `supplyOf()` 获取 supply

### 验证结果
- ✅ 无 linter 错误
- ✅ 类型定义正确
- ✅ API 返回数据结构匹配

## 🔍 关键修复点

### 问题 1: 错误使用 `lpSupply.balance`
```typescript
// ❌ 错误
const totalSupply = parseFloat(lpSupply.balance);

// ✅ 正确
const totalSupply = parseFloat(lpSupply.supply);
```

**原因**: `AssetSupplyType` 中的字段名是 `supply` 而不是 `balance`

### 问题 2: Supply 应该动态查询
```typescript
// ❌ 错误 - supply 作为静态 metadata
type AssetMetadataType = {
  // ...
  supply: string; // 这个不应该存在
}

// ✅ 正确 - supply 单独查询
const supply = await merak.supplyOf(assetId);
```

**原因**: Supply 是动态变化的数据（mint/burn 都会改变），不应该缓存在 metadata 中

## 📝 使用指南

### 获取 Asset Metadata（静态信息）
```typescript
const metadata = await getAssetMetadata(assetId);
// metadata 包含: name, symbol, decimals, iconUrl 等静态信息
// ❌ metadata 不包含 supply
```

### 获取 Asset Supply（动态数据）
```typescript
const supplyData = await merak.supplyOf(assetId);
if (supplyData) {
  const totalSupply = parseFloat(supplyData.supply);
  console.log('Total supply:', totalSupply);
}
```

### 计算 LP Token 数量（完整示例）
```typescript
// 1. 获取 pool 信息
const poolInfo = await merak.getPoolListWithId({
  asset1Id: token1.id,
  asset2Id: token2.id
});

// 2. 获取 LP token metadata（静态信息）
const lpMetadata = await getAssetMetadata(poolInfo.lpAsset);

// 3. 获取 LP token supply（动态数据）
const lpSupply = await merak.supplyOf(poolInfo.lpAsset);
const totalSupply = parseFloat(lpSupply.supply);

// 4. 计算新的 LP token 数量
const reserveA = parseFloat(poolInfo.reserve0);
const reserveB = parseFloat(poolInfo.reserve1);
const amountA = parseFloat(amount1) * Math.pow(10, token1.decimals);
const amountB = parseFloat(amount2) * Math.pow(10, token2.decimals);

let lpTokens: number;
if (reserveA === 0 && reserveB === 0) {
  // 第一次添加流动性
  lpTokens = Math.sqrt(amountA * amountB);
} else {
  // 已有流动性，按比例计算
  lpTokens = Math.min(
    (amountA * totalSupply) / reserveA,
    (amountB * totalSupply) / reserveB
  );
}

// 5. 格式化输出
const lpDecimals = lpMetadata.decimals;
const readableLPTokens = (lpTokens / Math.pow(10, lpDecimals)).toFixed(lpDecimals);
```

## 🎉 优势总结

### 1. **数据一致性**
- Metadata 只包含静态信息
- Supply 动态查询，确保数据最新

### 2. **架构清晰**
- 静态数据（metadata）和动态数据（supply）分离
- 各司其职，职责明确

### 3. **性能优化**
- Metadata 可以安全缓存（不常变化）
- Supply 需要时才查询（动态变化）

### 4. **类型安全**
- 添加了 `AssetSupplyType` 类型定义
- TypeScript 类型检查确保正确使用

## 🔄 迁移建议

如果你的代码中还在从 metadata 获取 supply，请按以下方式迁移：

```typescript
// ❌ 旧方式（不再支持）
const metadata = await getAssetMetadata(assetId);
const supply = metadata.supply; // TypeScript 错误：supply 不存在

// ✅ 新方式（推荐）
const metadata = await getAssetMetadata(assetId);
const supplyData = await merak.supplyOf(assetId);
const supply = supplyData?.supply || '0';
```

## ✨ 完成状态

**状态**: ✅ 完成  
**Linter 错误**: ✅ 无  
**测试状态**: ✅ 类型检查通过  
**文档状态**: ✅ 已更新

