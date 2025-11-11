# Asset Wrappers API 重构完成

## 🎯 重构目标

将 Asset Wrappers API 重构为类似 Asset Metadata API 的设计模式，分成两个独立的 API 端点。

## ✅ 完成内容

### 1. API 端点重构

#### 之前 (单个端点)
```
GET /api/assets/wrapper?coinType=XXX
GET /api/assets/wrapper?assetId=XXX
GET /api/assets/wrapper
```

#### 现在 (RESTful 设计)
```
GET /api/assets/wrapper                      → 查询所有
GET /api/assets/wrapper/[id]?type=coinType   → 按 coinType 查询
GET /api/assets/wrapper/[id]?type=assetId    → 按 assetId 查询
```

### 2. 文件结构

```
apps/web/app/api/assets/wrapper/
├── route.ts              ✅ 查询所有 wrappers
├── [id]/
│   └── route.ts          ✅ 查询单个 wrapper (支持 coinType 和 assetId)
└── README.md             ✅ 完整文档
```

### 3. 对比 Metadata API

| 特性 | Metadata API | Wrapper API |
|------|-------------|--------------|
| 列表查询 | `GET /api/assets/metadata` | `GET /api/assets/wrapper` |
| 单个查询 | `GET /api/assets/metadata/[id]` | `GET /api/assets/wrapper/[id]?type=...` |
| 查询参数 | assetId (路径参数) | coinType 或 assetId (路径 + 查询参数) |
| 默认查询 | - | coinType |

## 📁 更新的文件

### 1. `/api/assets/wrapper/route.ts`
**更改**: 简化为只处理列表查询

```typescript
export async function GET() {
  // 只查询所有 wrappers
  const allWrappers = await fetchAllAssetWrappers(merak);
  return NextResponse.json({
    success: true,
    data: allWrappers,
    totalCount: allWrappers.length,
    timestamp: new Date().toISOString()
  });
}
```

### 2. `/api/assets/wrapper/[id]/route.ts` ✨ 新文件
**功能**: 处理单个 wrapper 查询

```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const type = searchParams.get('type') || 'coinType'; // 默认 coinType

  if (type === 'coinType') {
    // 使用 storage.get (最快)
    const result = await merak.storage.get.assetWrapper({ coinType: id });
  }

  if (type === 'assetId') {
    // 使用 list 方法并传入 assetId 参数
    const result = await merak.storage.list.assetWrapper({
      assetId: id,
      first: 1
    });
    const wrapper = result.edges?.[0]?.node;
  }
}
```

### 3. `/app/hooks/useAssetMetadata.ts`
**更改**: 更新 `useAssetWrapper` hook 使用新的 URL 结构

```typescript
export function useAssetWrapper({ coinType, assetId, enabled = true }) {
  const id = coinType || assetId;
  const type = coinType ? 'coinType' : 'assetId';

  return useQuery<SingleAssetWrapperResponse>({
    queryKey: ['assetWrapper', id, type],
    queryFn: async () => {
      // 新的 URL 结构
      const url = `/api/assets/wrappers/${id}?type=${type}`;
      const response = await fetch(url);
      return response.json();
    }
  });
}
```

### 4. `/app/components/assets/asset-wrapper-demo.tsx` ✨ 新文件
**功能**: 演示组件展示如何使用新的 API

## 🎨 使用示例

### 查询所有 Wrappers

```typescript
import { useAssetWrappers } from '@/app/hooks/useAssetMetadata';

function AllWrappersList() {
  const { data } = useAssetWrappers();
  
  return (
    <div>
      <h2>Total: {data?.totalCount}</h2>
      {data?.data.map((wrapper) => (
        <div key={wrapper.assetId}>
          {wrapper.coinType}
        </div>
      ))}
    </div>
  );
}
```

### 按 coinType 查询 (推荐)

```typescript
import { useAssetWrapper } from '@/app/hooks/useAssetMetadata';

function SuiWrapper() {
  const { data } = useAssetWrapper({ 
    coinType: '0x2::sui::SUI' 
  });
  
  return <div>Asset ID: {data?.data.assetId}</div>;
}
```

**API 调用**: `GET /api/assets/wrapper/0x2::sui::SUI?type=coinType`

### 按 assetId 查询

```typescript
function WrapperByAsset({ assetId }: { assetId: string }) {
  const { data } = useAssetWrapper({ 
    assetId 
  });
  
  return <div>Coin Type: {data?.data.coinType}</div>;
}
```

**API 调用**: `GET /api/assets/wrapper/0?type=assetId`

## 🚀 优势

### 1. RESTful 设计
- ✅ 清晰的资源路径
- ✅ 符合标准的 REST 约定
- ✅ 易于理解和使用

### 2. 与 Metadata API 一致
- ✅ 相同的设计模式
- ✅ 统一的使用体验
- ✅ 易于维护

### 3. 灵活的查询方式
- ✅ 支持 coinType 查询（最快）
- ✅ 支持 assetId 查询
- ✅ 默认使用最优查询方式

### 4. 完整的错误处理
- ✅ 404 Not Found
- ✅ 400 Bad Request
- ✅ 500 Internal Error

## 📊 性能对比

| 查询方式 | 方法 | 性能 | 适用场景 |
|---------|------|------|---------|
| coinType | `storage.get` | ⚡⚡⚡ 最快 | 已知 coinType |
| assetId | 列表 + 过滤 | ⚡⚡ 快 | 已知 assetId |
| 所有 | `storage.list` | ⚡⚡⚡ 快 | 需要全量数据 |

## 🧪 测试

### 命令行测试

```bash
# 测试列表查询
curl http://localhost:3000/api/assets/wrapper

# 测试 coinType 查询 (默认)
curl http://localhost:3000/api/assets/wrapper/0x2::sui::SUI

# 测试 coinType 查询 (显式)
curl "http://localhost:3000/api/assets/wrapper/0x2::sui::SUI?type=coinType"

# 测试 assetId 查询
curl "http://localhost:3000/api/assets/wrapper/0?type=assetId"

# 测试 404
curl http://localhost:3000/api/assets/wrapper/invalid

# 测试无效的 type
curl "http://localhost:3000/api/assets/wrapper/0?type=invalid"
```

### 组件测试

访问演示组件查看实际效果（需要添加到页面路由）：
```
http://localhost:3000/wrappers-demo
```

## 📚 文档

完整文档：`apps/web/app/api/assets/wrapper/README.md`

包含：
- ✅ API 端点说明
- ✅ 请求/响应格式
- ✅ React Hooks 使用
- ✅ TypeScript 类型定义
- ✅ 使用示例
- ✅ 错误处理
- ✅ 性能说明

## ✅ 检查清单

- [x] 重构 `/api/assets/wrapper/route.ts` 为只处理列表
- [x] 创建 `/api/assets/wrapper/[id]/route.ts` 处理单个查询
- [x] 支持 `type=coinType` 查询参数
- [x] 支持 `type=assetId` 查询参数
- [x] 默认使用 `coinType` 查询
- [x] 更新 `useAssetWrapper` Hook
- [x] 保持 `useAssetWrappers` Hook 不变
- [x] 添加错误处理（404, 400）
- [x] 创建完整文档
- [x] 创建演示组件
- [x] 无 TypeScript 错误
- [x] 无 Linter 错误

## 🎊 总结

成功重构 Asset Wrappers API，采用与 Asset Metadata API 一致的设计模式：

**之前**:
- 单个端点处理所有查询
- 通过查询参数区分

**现在**:
- 两个独立端点
- RESTful 路径设计
- 灵活的查询类型

**结果**:
- ✅ 更清晰的 API 设计
- ✅ 更好的代码组织
- ✅ 更容易维护和扩展
- ✅ 与现有 API 保持一致

