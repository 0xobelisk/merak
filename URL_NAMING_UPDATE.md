# API URL 命名更新：wrappers → wrapper

## 更新内容

将 Asset Wrappers API 的 URL 从复数形式改为单数形式，遵循 RESTful API 命名约定。

## 变更对比

### 之前
```
GET /api/assets/wrappers
GET /api/assets/wrappers/[id]?type=coinType
GET /api/assets/wrappers/[id]?type=assetId
```

### 现在
```
GET /api/assets/wrapper
GET /api/assets/wrapper/[id]?type=coinType
GET /api/assets/wrapper/[id]?type=assetId
```

## 文件变更

### 1. 文件夹重命名
```
apps/web/app/api/assets/wrappers/  →  apps/web/app/api/assets/wrapper/
```

### 2. 更新的文件

| 文件 | 变更内容 |
|------|---------|
| `app/hooks/useAssetMetadata.ts` | 更新所有 API URL 引用 |
| `app/api/assets/wrapper/README.md` | 更新所有文档中的 URL |
| `app/components/assets/asset-wrapper-demo.tsx` | 更新演示组件中的 URL 显示 |
| `WRAPPERS_API_REFACTOR.md` | 更新重构文档中的所有 URL |

## 代码变更示例

### Hooks 更新

```typescript
// useAssetWrapper
const url = `/api/assets/wrapper/${id}?type=${type}`;  // ✅ 改为 wrapper

// useAssetWrappers  
const response = await fetch('/api/assets/wrapper');  // ✅ 改为 wrapper
```

### 文档更新

所有文档中的 URL 引用都已更新：
- API 端点说明
- 测试命令
- 使用示例
- API 对比表

## 与其他 API 保持一致

```
GET /api/assets/metadata    (单数)
GET /api/assets/wrapper     (单数) ✅
```

## 测试命令更新

```bash
# 查询所有
curl http://localhost:3000/api/assets/wrapper

# 按 coinType 查询
curl http://localhost:3000/api/assets/wrapper/0x2::sui::SUI

# 按 assetId 查询
curl "http://localhost:3000/api/assets/wrapper/0?type=assetId"
```

## React Hooks 使用

使用方式保持不变，只是后端 URL 改变：

```typescript
// 单个查询
const { data } = useAssetWrapper({ coinType: '0x2::sui::SUI' });

// 列表查询
const { data } = useAssetWrappers();
```

## 注意事项

1. **Breaking Change**: 这是一个破坏性变更，现有代码需要更新
2. **缓存键未变**: React Query 的缓存键保持不变
3. **类型定义未变**: TypeScript 类型定义保持不变
4. **Hook 名称未变**: Hook 函数名称保持不变

## 完成清单

- [x] 重命名文件夹 `wrappers` → `wrapper`
- [x] 更新 `useAssetWrapper` 中的 URL
- [x] 更新 `useAssetWrappers` 中的 URL
- [x] 更新 README.md 中的所有 URL
- [x] 更新演示组件中的 URL
- [x] 更新重构文档中的 URL
- [x] 删除旧的 `wrappers` 文件夹（如果存在）
- [x] 验证无 linting 错误

## 影响范围

### 前端
- ✅ React Hooks 已更新
- ✅ 演示组件已更新

### 后端
- ✅ API 路由文件已移动
- ✅ URL 路径已更新

### 文档
- ✅ API 文档已更新
- ✅ 测试命令已更新
- ✅ 示例代码已更新

## 总结

成功将 Asset Wrappers API 的 URL 从复数 `wrappers` 改为单数 `wrapper`，与 `metadata` API 保持一致的命名风格。所有相关代码、文档和测试命令都已更新。

