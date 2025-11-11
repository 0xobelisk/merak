# API 简化更新说明

## 更新日期
2024

## 🎯 更新目标

简化 `/api/assets/metadata` 端点，使其**专注于单个资产查询**，移除列表查询功能。

## 📋 变更内容

### API 路由变更

#### `/api/assets/metadata` - 简化为单资产查询

**之前**: 
- 支持查询单个资产（提供 assetId）
- 支持查询列表（不提供 assetId，支持分页）
- 逻辑复杂，需要判断参数

**现在**:
- ✅ **只支持单个资产查询**
- ✅ **assetId 参数必填**
- ✅ 使用 `storage.get.assetMetadata()` 优化查询
- ✅ 简化的响应格式
- ✅ 明确的错误信息

### 代码变更

#### 1. API 路由 (`route.ts`)

```typescript
// 之前：复杂的条件逻辑
if (assetId) {
  // 使用 storage.get
} else {
  // 使用 storage.list
}

// 现在：简单直接
if (!assetId) {
  return error('assetId parameter is required');
}
const result = await merak.storage.get.assetMetadata({ assetId });
```

#### 2. React Hook (`useAssetMetadata.ts`)

```typescript
// 之前：可选参数
interface AssetMetadataParams {
  assetId?: string;  // 可选
  first?: number;
  after?: string;
  enabled?: boolean;
}

// 现在：必填参数
interface SingleAssetMetadataParams {
  assetId: string;  // 必填
  enabled?: boolean;
}
```

#### 3. 响应格式变更

**之前（数组格式）**:
```json
{
  "success": true,
  "data": [...],  // 数组
  "pageInfo": {...},
  "totalCount": number
}
```

**现在（单对象格式）**:
```json
{
  "success": true,
  "data": {...},  // 单个对象
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🚀 API 职责划分

### `/api/assets/metadata` - 单资产查询
- **用途**: 查询特定资产的详细信息
- **方法**: `storage.get.assetMetadata()`
- **参数**: `assetId` (必填)
- **返回**: 单个资产对象
- **场景**: 资产详情页、资产选择器、动态查询

### `/api/assets/all` - 列表查询  
- **用途**: 获取所有资产列表
- **方法**: `storage.list.assetMetadata()`
- **参数**: 无
- **返回**: 资产数组
- **场景**: 资产列表页、下拉菜单、搜索过滤

## 📝 使用示例对比

### 查询单个资产

**之前**:
```typescript
const { data } = useAssetMetadata({ assetId: '0' });
const asset = data?.data[0];  // 需要从数组中取出
```

**现在**:
```typescript
const { data } = useAssetMetadata({ assetId: '0' });
const asset = data?.data;  // 直接获取对象
```

### 查询所有资产

**之前**:
```typescript
const { data } = useAssetMetadata({ first: 100 });  // 混乱
```

**现在**:
```typescript
const { data } = useAllAssetMetadata();  // 清晰明确
```

## ✅ 优势

### 1. 更清晰的职责划分
- `/api/assets/metadata` - 单个资产
- `/api/assets/all` - 所有资产
- 不再混用，职责明确

### 2. 更简单的代码
- 移除条件判断逻辑
- 简化响应格式
- 更易维护

### 3. 更好的类型安全
```typescript
// assetId 现在是必填参数
useAssetMetadata({ assetId: '0' });  // ✅ 正确
useAssetMetadata({});  // ❌ TypeScript 错误
```

### 4. 更明确的错误处理
```typescript
// 缺少 assetId
400 Bad Request: "assetId parameter is required"

// 资产不存在
404 Not Found: "Asset with ID X not found"
```

### 5. 更优的性能
- 专用 `storage.get` 查询
- 无需处理分页逻辑
- 更快的响应时间

## 🔄 迁移指南

### 如果你之前这样使用：

#### 场景 1: 查询单个资产
```typescript
// 之前
const { data } = useAssetMetadata({ assetId: '0' });
const asset = data?.data[0];

// 现在（更简单）
const { data } = useAssetMetadata({ assetId: '0' });
const asset = data?.data;
```

#### 场景 2: 查询列表
```typescript
// 之前
const { data } = useAssetMetadata({ first: 100 });

// 现在（使用专门的 hook）
const { data } = useAllAssetMetadata();
```

#### 场景 3: 分页查询
```typescript
// 之前
const { data } = useAssetMetadata({ first: 50, after: cursor });

// 现在（使用 /api/assets/all）
const { data } = useAllAssetMetadata();
// Note: all 端点自动处理所有分页
```

## 📊 错误响应

### 400 Bad Request - 缺少参数
```json
{
  "success": false,
  "error": "assetId parameter is required",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 404 Not Found - 资产不存在
```json
{
  "success": false,
  "error": "Asset with ID 123 not found",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 500 Internal Server Error - 服务器错误
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🧪 测试

### 测试单资产查询
```bash
# 成功查询
curl http://localhost:3000/api/assets/metadata?assetId=0

# 缺少参数（应返回 400）
curl http://localhost:3000/api/assets/metadata

# 资产不存在（应返回 404）
curl http://localhost:3000/api/assets/metadata?assetId=999999
```

### 测试列表查询
```bash
# 获取所有资产
curl http://localhost:3000/api/assets/all
```

## 📚 更新的文档

已更新以下文档以反映变更：
- ✅ `README.md` - API 完整文档
- ✅ `QUICKSTART.md` - 快速开始指南
- ✅ `USAGE_EXAMPLES.md` - 使用示例
- ✅ `useAssetMetadata.ts` - Hook 类型和实现

## 🎉 总结

这次简化使 API 更加：
- ✅ **清晰**: 单一职责，易于理解
- ✅ **简单**: 减少代码复杂度
- ✅ **安全**: 类型检查更严格
- ✅ **快速**: 专用优化查询
- ✅ **易用**: 明确的使用方式

### API 对比表

| 功能 | 端点 | 方法 | 参数 | 返回 |
|------|------|------|------|------|
| 查询单个资产 | `/api/assets/metadata` | `storage.get` | `assetId` (必填) | 单个对象 |
| 查询所有资产 | `/api/assets/all` | `storage.list` | 无 | 数组 |

简洁明了，各司其职！✨

