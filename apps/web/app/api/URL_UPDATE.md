# URL 结构更新说明

## 🎯 更新目标

重新组织 URL 结构，使其更符合 RESTful 语义和 metadata 的 get/list 操作。

## 📋 URL 变更

### 之前的结构 ❌

```
/api/assets/metadata?assetId=0    → 单个资产 (get)
/api/assets/all                    → 所有资产 (list)
```

**问题**:
- 命名不一致
- `/all` 不够语义化
- 不符合 RESTful 风格

### 新的结构 ✅

```
/api/assets/metadata/[id]          → 单个资产 (get)
/api/assets/metadata               → 所有资产 (list)
```

**优势**:
- ✅ 符合 RESTful 风格
- ✅ 层次结构清晰
- ✅ 语义明确：metadata 是资源，[id] 是特定实例
- ✅ 更易理解和维护

## 🔄 API 对比

| 操作 | 之前 | 现在 | 方法 |
|------|------|------|------|
| 获取单个资产 | `/api/assets/metadata?assetId=0` | `/api/assets/metadata/0` | `storage.get` |
| 获取所有资产 | `/api/assets/all` | `/api/assets/metadata` | `storage.list` |

## 📂 文件结构

### 之前
```
api/
└── assets/
    ├── metadata/
    │   └── route.ts         (单个资产)
    └── all/
        └── route.ts         (所有资产)
```

### 现在
```
api/
└── assets/
    └── metadata/
        ├── route.ts         (所有资产 - list)
        └── [id]/
            └── route.ts     (单个资产 - get)
```

## 🚀 使用示例

### cURL

#### 之前
```bash
# 单个资产
curl http://localhost:3000/api/assets/metadata?assetId=0

# 所有资产
curl http://localhost:3000/api/assets/all
```

#### 现在
```bash
# 单个资产 (更简洁)
curl http://localhost:3000/api/assets/metadata/0

# 所有资产
curl http://localhost:3000/api/assets/metadata
```

### React Hooks

#### 之前
```typescript
// 单个资产
fetch(`/api/assets/metadata?assetId=${id}`)

// 所有资产
fetch('/api/assets/all')
```

#### 现在
```typescript
// 单个资产 (更 RESTful)
fetch(`/api/assets/metadata/${id}`)

// 所有资产
fetch('/api/assets/metadata')
```

## 🎨 代码示例

### 查询单个资产

```typescript
import { useAssetMetadata } from '@/app/hooks/useAssetMetadata';

function AssetDetail({ assetId }: { assetId: string }) {
  // 自动使用: GET /api/assets/metadata/[id]
  const { data } = useAssetMetadata({ assetId });
  
  return <div>{data?.data.name}</div>;
}
```

### 查询所有资产

```typescript
import { useAllAssetMetadata } from '@/app/hooks/useAssetMetadata';

function AssetList() {
  // 自动使用: GET /api/assets/metadata
  const { data } = useAllAssetMetadata();
  
  return (
    <ul>
      {data?.data.map(asset => (
        <li key={asset.assetId}>{asset.name}</li>
      ))}
    </ul>
  );
}
```

## 📊 RESTful 最佳实践

### 遵循的原则

1. **资源命名**: `/api/assets/metadata` 表示资源集合
2. **实例访问**: `/api/assets/metadata/[id]` 表示特定资源
3. **语义清晰**: URL 本身就能表达意图
4. **层次结构**: 遵循资源的自然层次

### 标准 REST 模式

```
GET    /api/assets/metadata          → 获取所有 (list)
GET    /api/assets/metadata/[id]     → 获取单个 (get)
POST   /api/assets/metadata          → 创建 (未实现)
PUT    /api/assets/metadata/[id]     → 更新 (未实现)
DELETE /api/assets/metadata/[id]     → 删除 (未实现)
```

## 🔧 技术实现

### 动态路由

Next.js App Router 使用 `[id]` 文件夹来处理动态路由：

```typescript
// app/api/assets/metadata/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const assetId = params.id;  // 从 URL 路径获取
  // ... 处理逻辑
}
```

### 优势

1. **类型安全**: `params.id` 是 TypeScript 类型
2. **URL 清晰**: `/metadata/0` 比 `?assetId=0` 更直观
3. **SEO 友好**: 路径式 URL 更易索引
4. **缓存优化**: 每个 ID 有独立的缓存键

## 📈 性能对比

### 缓存行为

**之前**:
```
/api/assets/metadata?assetId=0  → 独立缓存
/api/assets/metadata?assetId=1  → 独立缓存
```

**现在**:
```
/api/assets/metadata/0          → 独立缓存 (路径级别)
/api/assets/metadata/1          → 独立缓存 (路径级别)
```

两者性能相同，但新结构更符合标准。

## ✅ 迁移清单

- [x] 创建 `/api/assets/metadata/[id]/route.ts`
- [x] 更新 `/api/assets/metadata/route.ts` (改为 list)
- [x] 删除 `/api/assets/all/route.ts`
- [x] 更新 `useAssetMetadata` hook
- [x] 更新 `useAllAssetMetadata` hook
- [x] 测试新 URL
- [x] 更新文档

## 🧪 测试

### 测试单个资产
```bash
# 成功
curl http://localhost:3000/api/assets/metadata/0

# 404 - 资产不存在
curl http://localhost:3000/api/assets/metadata/999999
```

### 测试所有资产
```bash
# 成功
curl http://localhost:3000/api/assets/metadata
```

## 🎉 总结

### 优势对比

| 特性 | 之前 | 现在 |
|------|------|------|
| RESTful 风格 | ❌ | ✅ |
| URL 语义 | 不够清晰 | 非常清晰 |
| 层次结构 | 混乱 | 一致 |
| 可扩展性 | 一般 | 优秀 |
| 开发体验 | 普通 | 优秀 |

### 最终 API 设计

```
GET /api/assets/metadata       → List all assets
GET /api/assets/metadata/[id]  → Get single asset
```

**完美符合 RESTful 设计原则！** ✨

