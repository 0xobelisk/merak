# Asset Wrappers API 文档

## 概述

Asset Wrappers API 提供对已包装资产（wrapped assets）的查询功能，支持服务端缓存，每 60 秒自动更新。

## API 端点

### GET `/api/assets/wrappers`

获取所有 asset wrappers 列表。

**方法**: `storage.list.assetWrapper()`  
**缓存**: 60秒 ISR revalidation  
**查询参数**: 无

#### 响应格式

**成功响应 (200)**:
```json
{
  "success": true,
  "data": [
    {
      "assetId": "0",
      "coinType": "0x2::sui::SUI",
      "createdAtTimestampMs": "1234567890",
      "isDeleted": false,
      "lastUpdateDigest": "ABC123...",
      "nodeId": "node_123",
      "updatedAtTimestampMs": "1234567890"
    }
  ],
  "totalCount": 1,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**错误响应 (500)**:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## TypeScript 类型定义

### AssetWrapper Interface

```typescript
interface AssetWrapper {
  assetId: string;              // Asset ID in the system
  coinType: string;             // Coin type (e.g., "0x2::sui::SUI")
  createdAtTimestampMs: string; // Creation timestamp in milliseconds
  isDeleted: boolean;           // Whether the wrapper is deleted
  lastUpdateDigest: string;     // Last update transaction digest
  nodeId: string;               // Node identifier
  updatedAtTimestampMs: string; // Last update timestamp in milliseconds
}
```

### API Response Type

```typescript
interface AssetWrapperListResponse {
  success: boolean;
  data: AssetWrapper[];
  totalCount: number;
  timestamp: string;
  error?: string;
}
```

## 使用方式

### 方法 1: React Hook (推荐)

```typescript
import { useAssetWrappers } from '@/app/hooks/useAssetMetadata';

function WrappersComponent() {
  const { data, isLoading, error } = useAssetWrappers();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h2>Total Wrappers: {data?.totalCount}</h2>
      <ul>
        {data?.data.map((wrapper) => (
          <li key={wrapper.assetId}>
            Asset {wrapper.assetId}: {wrapper.coinType}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 方法 2: 直接 Fetch

```typescript
async function fetchWrappers() {
  const response = await fetch('/api/assets/wrappers');
  const data = await response.json();
  
  if (data.success) {
    console.log(`Found ${data.totalCount} wrappers`);
    return data.data;
  } else {
    throw new Error(data.error);
  }
}
```

### 方法 3: 服务端组件

```typescript
// app/wrappers/page.tsx
async function getWrappers() {
  const response = await fetch(
    'http://localhost:3000/api/assets/wrappers',
    { next: { revalidate: 60 } }
  );
  return response.json();
}

export default async function WrappersPage() {
  const data = await getWrappers();
  
  return (
    <div>
      <h1>Wrapped Assets ({data.totalCount})</h1>
      {/* 渲染列表 */}
    </div>
  );
}
```

## 使用场景

### 1. 显示所有包装资产

```typescript
function WrapperList() {
  const { data } = useAssetWrappers();
  
  return (
    <table>
      <thead>
        <tr>
          <th>Asset ID</th>
          <th>Coin Type</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody>
        {data?.data.map((wrapper) => (
          <tr key={wrapper.assetId}>
            <td>{wrapper.assetId}</td>
            <td>{wrapper.coinType}</td>
            <td>{new Date(Number(wrapper.createdAtTimestampMs)).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 2. 根据 Coin Type 过滤

```typescript
function FilteredWrappers({ coinType }: { coinType: string }) {
  const { data } = useAssetWrappers();
  
  const filtered = data?.data.filter(
    (wrapper) => wrapper.coinType.includes(coinType)
  );
  
  return (
    <div>
      <h2>Wrappers for {coinType}</h2>
      {filtered?.map((wrapper) => (
        <div key={wrapper.assetId}>
          Asset ID: {wrapper.assetId}
        </div>
      ))}
    </div>
  );
}
```

### 3. 查找特定 Asset 的 Wrapper

```typescript
function AssetWrapper({ assetId }: { assetId: string }) {
  const { data } = useAssetWrappers();
  
  const wrapper = data?.data.find(
    (w) => w.assetId === assetId
  );
  
  if (!wrapper) return <div>No wrapper found</div>;
  
  return (
    <div>
      <h3>Wrapper Info</h3>
      <p>Coin Type: {wrapper.coinType}</p>
      <p>Created: {new Date(Number(wrapper.createdAtTimestampMs)).toLocaleString()}</p>
      <p>Status: {wrapper.isDeleted ? 'Deleted' : 'Active'}</p>
    </div>
  );
}
```

### 4. 统计信息

```typescript
function WrapperStats() {
  const { data } = useAssetWrappers();
  
  const stats = {
    total: data?.totalCount || 0,
    active: data?.data.filter((w) => !w.isDeleted).length || 0,
    deleted: data?.data.filter((w) => w.isDeleted).length || 0,
    uniqueCoinTypes: new Set(data?.data.map((w) => w.coinType)).size || 0
  };
  
  return (
    <div>
      <h2>Wrapper Statistics</h2>
      <p>Total: {stats.total}</p>
      <p>Active: {stats.active}</p>
      <p>Deleted: {stats.deleted}</p>
      <p>Unique Coin Types: {stats.uniqueCoinTypes}</p>
    </div>
  );
}
```

## GraphQL 查询

底层使用的 GraphQL 查询：

```graphql
query AssetWrappers {
  assetWrappers {
    nodes {
      assetId
      coinType
      createdAtTimestampMs
      isDeleted
      lastUpdateDigest
      nodeId
      updatedAtTimestampMs
    }
  }
}
```

## 性能特性

- **缓存策略**: ISR with 60-second revalidation
- **响应时间**: < 10ms (cached)
- **自动分页**: 自动处理所有分页（100条/页）
- **安全限制**: 最多返回 10,000 条记录

## 错误处理

```typescript
function WrapperListWithError() {
  const { data, error, refetch } = useAssetWrappers();
  
  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }
  
  return <div>{/* 正常渲染 */}</div>;
}
```

## 与 Asset Metadata 配合使用

```typescript
function CombinedAssetInfo() {
  const { data: metadata } = useAllAssetMetadata();
  const { data: wrappers } = useAssetWrappers();
  
  // 合并数据
  const combined = metadata?.data.map((asset) => {
    const wrapper = wrappers?.data.find(
      (w) => w.assetId === asset.assetId
    );
    return {
      ...asset,
      wrapper: wrapper || null
    };
  });
  
  return (
    <div>
      {combined?.map((item) => (
        <div key={item.assetId}>
          <h3>{item.name}</h3>
          {item.wrapper && (
            <p>Wrapped: {item.wrapper.coinType}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

## 测试

### 测试 API

```bash
# 获取所有 wrappers
curl http://localhost:3000/api/assets/wrappers

# 测试缓存性能
time curl http://localhost:3000/api/assets/wrappers  # 第一次
time curl http://localhost:3000/api/assets/wrappers  # 第二次（更快）
```

### 测试 Hook

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useAssetWrappers } from '@/app/hooks/useAssetMetadata';

test('should fetch wrappers', async () => {
  const { result } = renderHook(() => useAssetWrappers());
  
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  
  expect(result.current.data?.success).toBe(true);
  expect(result.current.data?.data).toBeInstanceOf(Array);
});
```

## 总结

Asset Wrappers API 提供了：
- ✅ 完整的类型定义（无 `any`）
- ✅ 60秒自动缓存更新
- ✅ React Hook 封装
- ✅ 自动分页处理
- ✅ 错误处理支持
- ✅ 与其他 API 配合使用

开始使用：
```typescript
import { useAssetWrappers } from '@/app/hooks/useAssetMetadata';
const { data } = useAssetWrappers();
```

