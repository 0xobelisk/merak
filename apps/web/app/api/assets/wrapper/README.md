# Asset Wrappers API

## 概述

Asset Wrappers API 提供了查询资产包装信息的接口，设计模式参考 Asset Metadata API，分为列表查询和单个查询两个端点。

## API 端点

### 1. 查询所有 Wrappers

```bash
GET /api/assets/wrapper
```

**描述**: 获取所有资产包装信息列表

**使用 SDK**: `storage.list.assetWrapper()`

**响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "assetId": "0",
      "coinType": "0x2::sui::SUI",
      "createdAtTimestampMs": "1699000000000",
      "updatedAtTimestampMs": "1699000000000",
      "nodeId": "...",
      "lastUpdateDigest": "...",
      "isDeleted": false
    }
  ],
  "totalCount": 10,
  "timestamp": "2024-11-08T10:00:00.000Z"
}
```

### 2. 查询单个 Wrapper

```bash
GET /api/assets/wrapper/[id]?type={queryType}
```

**描述**: 根据 `coinType` 或 `assetId` 查询单个包装信息

**路径参数**:
- `id`: 查询值（coinType 或 assetId）

**查询参数**:
- `type`: 查询类型
  - `coinType` (默认): 按币种类型查询
  - `assetId`: 按资产 ID 查询

#### 按 coinType 查询 (默认)

```bash
GET /api/assets/wrapper/0x2::sui::SUI
# 或显式指定
GET /api/assets/wrapper/0x2::sui::SUI?type=coinType
```

**使用 SDK**: `storage.get.assetWrapper({ coinType })`

**响应**:
```json
{
  "success": true,
  "data": {
    "assetId": "0",
    "coinType": "0x2::sui::SUI",
    "createdAtTimestampMs": "1699000000000",
    "updatedAtTimestampMs": "1699000000000",
    "nodeId": "...",
    "lastUpdateDigest": "...",
    "isDeleted": false
  },
  "timestamp": "2024-11-08T10:00:00.000Z"
}
```

#### 按 assetId 查询

```bash
GET /api/assets/wrapper/0?type=assetId
```

**使用 SDK**: `storage.list.assetWrapper({ assetId, first: 1 })`

**响应**: 同上

### 错误响应

#### 404 Not Found
```json
{
  "success": false,
  "error": "Wrapper with coin type XXX not found",
  "timestamp": "2024-11-08T10:00:00.000Z"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid query type: xxx. Must be 'coinType' or 'assetId'",
  "timestamp": "2024-11-08T10:00:00.000Z"
}
```

## React Hooks

### useAssetWrapper

查询单个资产包装信息

```typescript
import { useAssetWrapper } from '@/app/hooks/useAssetMetadata';

// 按 coinType 查询 (推荐)
const { data, isLoading, error } = useAssetWrapper({ 
  coinType: '0x2::sui::SUI' 
});

// 按 assetId 查询
const { data, isLoading, error } = useAssetWrapper({ 
  assetId: '0' 
});
```

**参数**:
```typescript
interface SingleAssetWrapperParams {
  coinType?: string;  // 币种类型
  assetId?: string;   // 资产 ID
  enabled?: boolean;  // 是否启用查询，默认 true
}
```

**返回类型**: `UseQueryResult<SingleAssetWrapperResponse>`

### useAssetWrappers

查询所有资产包装信息

```typescript
import { useAssetWrappers } from '@/app/hooks/useAssetMetadata';

const { data, isLoading, error } = useAssetWrappers();
```

**参数**:
- `enabled` (可选): 是否启用查询，默认 `true`

**返回类型**: `UseQueryResult<AssetWrapperListResponse>`

## 使用示例

### 1. 查询 SUI 的包装信息

```typescript
function SuiWrapperInfo() {
  const { data, isLoading } = useAssetWrapper({ 
    coinType: '0x2::sui::SUI' 
  });

  if (isLoading) return <div>Loading...</div>;
  
  if (!data?.success) return <div>Not found</div>;

  return (
    <div>
      <h3>SUI Wrapper</h3>
      <p>Asset ID: {data.data.assetId}</p>
      <p>Coin Type: {data.data.coinType}</p>
    </div>
  );
}
```

### 2. 根据 Asset ID 查找 Coin Type

```typescript
function AssetCoinType({ assetId }: { assetId: string }) {
  const { data } = useAssetWrapper({ 
    assetId,
  });

  if (!data?.success) return null;

  return (
    <div>
      <p>Coin Type: {data.data.coinType}</p>
    </div>
  );
}
```

### 3. 查询所有包装信息

```typescript
function AllWrappersList() {
  const { data, isLoading } = useAssetWrappers();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Total Wrappers: {data?.totalCount}</h2>
      <ul>
        {data?.data.map((wrapper) => (
          <li key={wrapper.assetId}>
            {wrapper.coinType} → Asset {wrapper.assetId}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 4. 组合查询 - 显示资产及其包装信息

```typescript
function AssetWithWrapper({ assetId }: { assetId: string }) {
  const { data: metadata } = useAssetMetadata({ assetId });
  const { data: wrapper } = useAssetWrapper({ assetId });

  return (
    <div>
      <h3>{metadata?.data.name}</h3>
      <p>Symbol: {metadata?.data.symbol}</p>
      {wrapper?.success && (
        <p>Wrapped as: {wrapper.data.coinType}</p>
      )}
    </div>
  );
}
```

### 5. 动态查询

```typescript
function DynamicWrapperQuery() {
  const [queryType, setQueryType] = useState<'coinType' | 'assetId'>('coinType');
  const [queryValue, setQueryValue] = useState('');

  const { data } = useAssetWrapper({
    coinType: queryType === 'coinType' ? queryValue : undefined,
    assetId: queryType === 'assetId' ? queryValue : undefined
  });

  return (
    <div>
      <select 
        value={queryType}
        onChange={(e) => setQueryType(e.target.value as any)}
      >
        <option value="coinType">By Coin Type</option>
        <option value="assetId">By Asset ID</option>
      </select>
      
      <input 
        value={queryValue}
        onChange={(e) => setQueryValue(e.target.value)}
        placeholder={
          queryType === 'coinType' 
            ? 'Enter coin type (e.g., 0x2::sui::SUI)' 
            : 'Enter asset ID (e.g., 0)'
        }
      />
      
      {data?.success && (
        <div>
          <p>Asset ID: {data.data.assetId}</p>
          <p>Coin Type: {data.data.coinType}</p>
        </div>
      )}
    </div>
  );
}
```

## TypeScript 类型

### AssetWrapper

```typescript
interface AssetWrapper {
  assetId: string;
  coinType: string;
  createdAtTimestampMs: string;
  updatedAtTimestampMs: string;
  nodeId: string;
  lastUpdateDigest: string;
  isDeleted: boolean;
}
```

### API 响应类型

```typescript
// 单个 wrapper 响应
interface SingleAssetWrapperResponse {
  success: boolean;
  data: AssetWrapper;
  timestamp: string;
  error?: string;
}

// 列表响应
interface AssetWrapperListResponse {
  success: boolean;
  data: AssetWrapper[];
  totalCount: number;
  timestamp: string;
  error?: string;
}
```

## API 对比表

| 功能 | URL | SDK 方法 | 返回类型 | 性能 |
|------|-----|---------|---------|------|
| 所有 | `/api/assets/wrapper` | `storage.list` | `AssetWrapper[]` | ⚡⚡⚡ |
| 按 coinType | `/api/assets/wrapper/[id]` | `storage.get` | `AssetWrapper` | ⚡⚡⚡ 最快 |
| 按 assetId | `/api/assets/wrapper/[id]?type=assetId` | `storage.list` (过滤) | `AssetWrapper` | ⚡⚡⚡ |

## 性能说明

### 按 coinType 查询（推荐）
- ✅ 使用 `storage.get` - **最快**
- ✅ 直接查询，无需遍历
- ✅ 推荐用于已知 coinType 的场景

### 按 assetId 查询
- ✅ 使用 `storage.list` 配合 `assetId` 参数 - **快速**
- ✅ GraphQL 层面已进行过滤
- ℹ️ 结果会被缓存（60秒），后续查询很快
- ℹ️ 适用于已知 assetId 需要查找 coinType 的场景

### 查询所有
- ✅ 自动处理分页
- ✅ 完整缓存
- ✅ 最多支持 10000 条记录

## 缓存机制

- **服务端缓存**: ISR with 60秒 revalidation
- **客户端缓存**: React Query with 60秒 staleTime
- **缓存键**:
  - 所有: `['assetWrappers']`
  - 单个: `['assetWrapper', id, type]`

## 测试命令

```bash
# 测试查询所有
curl http://localhost:3000/api/assets/wrapper

# 测试按 coinType 查询（默认）
curl http://localhost:3000/api/assets/wrapper/0x2::sui::SUI

# 测试按 coinType 查询（显式）
curl "http://localhost:3000/api/assets/wrapper/0x2::sui::SUI?type=coinType"

# 测试按 assetId 查询
curl "http://localhost:3000/api/assets/wrapper/0?type=assetId"

# 测试 404
curl http://localhost:3000/api/assets/wrapper/invalid_coin_type

# 测试无效的 type 参数
curl "http://localhost:3000/api/assets/wrapper/0?type=invalid"
```

## 与 Metadata API 的对比

| 特性 | Metadata API | Wrapper API |
|------|-------------|--------------|
| 列表查询 | `GET /api/assets/metadata` | `GET /api/assets/wrapper` |
| 单个查询 | `GET /api/assets/metadata/[id]` | `GET /api/assets/wrapper/[id]?type=...` |
| 查询参数 | 仅支持 assetId | 支持 coinType 和 assetId |
| 默认查询类型 | assetId | coinType |
| SDK 方法 (单个) | `storage.get` | `storage.get` (coinType) 或过滤 (assetId) |

## 最佳实践

1. **优先使用 coinType 查询**: 如果知道 coinType，使用它查询性能最好
2. **合理使用缓存**: 利用 60秒缓存减少服务器负载
3. **错误处理**: 始终检查 `data?.success` 和处理 404
4. **类型安全**: 使用 TypeScript 类型确保代码正确性
5. **条件查询**: 使用 `enabled` 参数控制查询时机

## 相关文档

- [Asset Metadata API](../metadata/README.md)
- [React Hooks 文档](../../../../hooks/useAssetMetadata.ts)
- [TypeScript 类型定义](../../../../types/assets.ts)

