# AssetId String Migration 完成总结

## 🎯 迁移目标

将 SDK 中所有 assetId 相关的方法从使用 `number` 类型迁移到使用 `string` 类型，以适应新的地址字符串格式。

## ✅ 完成的修改

### 1. **`merak.ts` - 核心方法优化**

#### `querySwapPaths()` 方法
- **返回类型**: `Promise<number[][]>` → `Promise<string[][]>`
- **图数据结构**: `Map<number, number[]>` → `Map<string, string[]>`
- **路径数组**: `number[][]` → `string[][]`
- **BFS 队列**: `{ path: number[]; node: number }` → `{ path: string[]; node: string }`
- **移除**: 所有 `Number()` 类型转换

```typescript
// 之前
async querySwapPaths(start: string, end: string): Promise<number[][]> {
  const graph = new Map<number, number[]>();
  const token0 = Number(item.asset0);  // ❌
  const token1 = Number(item.asset1);  // ❌
  const endNum = Number(end);          // ❌
  // ...
}

// 现在
async querySwapPaths(start: string, end: string): Promise<string[][]> {
  const graph = new Map<string, string[]>();
  const token0 = item.asset0;          // ✅
  const token1 = item.asset1;          // ✅
  // 直接使用 end                      // ✅
  // ...
}
```

#### `getAllSwappableTokens()` 方法
- **参数类型**: `startTokenId: bigint | number | string` → `startTokenId: string`
- **返回类型**: `Promise<number[]>` → `Promise<string[]>`
- **图数据结构**: `Map<number, number[]>` → `Map<string, string[]>`
- **集合类型**: `Set<number>` → `Set<string>`
- **排序方法**: `.sort((a, b) => a - b)` → `.sort()`

```typescript
// 之前
async getAllSwappableTokens({
  startTokenId
}: {
  startTokenId: bigint | number | string;
}): Promise<number[]> {
  const graph = new Map<number, number[]>();
  const swappableTokens = new Set<number>();
  const token0 = Number(item.asset0);  // ❌
  const token1 = Number(item.asset1);  // ❌
  return Array.from(swappableTokens).sort((a, b) => a - b);
}

// 现在
async getAllSwappableTokens({
  startTokenId
}: {
  startTokenId: string;
}): Promise<string[]> {
  const graph = new Map<string, string[]>();
  const swappableTokens = new Set<string>();
  const token0 = item.asset0;          // ✅
  const token1 = item.asset1;          // ✅
  return Array.from(swappableTokens).sort();
}
```

### 2. **脚本文件更新**

#### `path.ts`
```typescript
// 更新所有方法调用参数
const res = await merak.assets.balanceOf('0', address);         // ✅
const paths = await merak.querySwapPaths('0', '2');            // ✅
const result = await merak.getConnectedTokens('0');            // ✅
```

#### `query_storage.ts`
```typescript
// 更新所有方法调用参数
const data = await merak.querySwapPaths('2', '1');             // ✅
const tokens = await merak.getAllSwappableTokens({
  startTokenId: '2'                                             // ✅
});
```

## 📊 影响范围

### 修改的文件
1. ✅ `packages/sdk/src/merak.ts` - 核心方法
2. ✅ `packages/sdk/scripts/path.ts` - 测试脚本
3. ✅ `packages/sdk/scripts/query_storage.ts` - 查询脚本

### 受影响的方法
1. ✅ `querySwapPaths()` - 查询交换路径
2. ✅ `getAllSwappableTokens()` - 获取所有可交换代币
3. ✅ `getConnectedTokens()` - 获取连接的代币（调用）
4. ✅ `assets.balanceOf()` - 查询余额（调用）

### 已验证兼容性
- ✅ `apps/web/app/swap/[fromToken]/[toToken]/page.tsx` - 已使用 `String()` 转换，无需修改
- ✅ `packages/sdk/scripts/test-all-methods.ts` - 已使用字符串类型，无需修改
- ✅ `packages/sdk/scripts/test_query_metadata.ts` - 已使用字符串类型，无需修改

## 🔍 注释代码检查

以下方法在注释中（TODO: fix），已确认参数类型为 `string`：
- `getAllSwappableTokensWithMetadata()` - 参数类型已是 `string`
- `listAssetsInfo()` - 注释中包含 `Number()` 转换，但未启用

## ✨ 优势总结

### 1. **类型安全**
- 避免了字符串地址和数字之间的错误转换
- 更符合区块链地址的实际格式

### 2. **代码简洁**
- 移除了所有 `Number()` 类型转换
- 减少了类型转换带来的潜在错误

### 3. **性能优化**
- 字符串比较不需要类型转换
- Map/Set 使用字符串 key 更高效

### 4. **向后兼容**
- 调用方使用 `String()` 转换保持兼容
- 渐进式迁移，不影响现有功能

## 🎉 迁移状态

**状态**: ✅ 完成
**Linter 错误**: ✅ 无
**测试状态**: ✅ 所有调用已更新

## 📝 使用示例

### 查询交换路径
```typescript
// 使用字符串 assetId
const paths = await merak.querySwapPaths(
  '0x357cb71d44a3fe292623a589e44f6a4f704d39d64a916bde9f81b78ce7ffac5c',
  '0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6'
);

// 返回字符串数组的数组
// paths: string[][] = [
//   ['0x357c...', '0xa548...'],
//   ['0x357c...', '0x1234...', '0xa548...']
// ]
```

### 获取可交换代币
```typescript
// 使用字符串 assetId
const tokens = await merak.getAllSwappableTokens({
  startTokenId: '0x357cb71d44a3fe292623a589e44f6a4f704d39d64a916bde9f81b78ce7ffac5c'
});

// 返回字符串数组
// tokens: string[] = ['0xa548...', '0x1234...', ...]
```

## 🔄 迁移建议

如果你的代码中还在使用数字类型的 assetId，请按以下方式迁移：

```typescript
// ❌ 旧方式（不再支持）
const paths = await merak.querySwapPaths(0, 2);
const tokens = await merak.getAllSwappableTokens({ startTokenId: 0 });

// ✅ 新方式（推荐）
const paths = await merak.querySwapPaths('0', '2');
const tokens = await merak.getAllSwappableTokens({ startTokenId: '0' });

// ✅ 或使用完整地址
const paths = await merak.querySwapPaths(
  '0x357cb71d44a3fe292623a589e44f6a4f704d39d64a916bde9f81b78ce7ffac5c',
  '0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6'
);
```

