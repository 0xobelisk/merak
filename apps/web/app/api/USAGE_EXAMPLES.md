# API Usage Examples

## 完整使用示例

### 1. 查询单个资产 - 使用 React Hook

```typescript
'use client';

import { useAssetMetadata } from '@/app/hooks/useAssetMetadata';

export function AssetDetail({ assetId }: { assetId: string }) {
  const { data, isLoading, error } = useAssetMetadata({ assetId });

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  const asset = data?.data;
  if (!asset) return <div>未找到资产</div>;

  return (
    <div>
      <h2>{asset.name}</h2>
      <p>Symbol: {asset.symbol}</p>
      <p>Decimals: {asset.decimals}</p>
      <p>Supply: {asset.supply}</p>
    </div>
  );
}
```

### 2. 查询所有资产

```typescript
'use client';

import { useAllAssetMetadata } from '@/app/hooks/useAssetMetadata';

export function AllAssets() {
  const { data, isLoading, isRefetching } = useAllAssetMetadata();

  return (
    <div>
      {isRefetching && <div>正在更新数据...</div>}
      <h2>所有资产 ({data?.totalCount})</h2>
      <div>
        最后更新: {data?.timestamp 
          ? new Date(data.timestamp).toLocaleString() 
          : '未知'}
      </div>
      {/* 渲染资产列表 */}
    </div>
  );
}
```

### 3. 动态查询资产

```typescript
'use client';

import { useState } from 'react';
import { useAssetMetadata } from '@/app/hooks/useAssetMetadata';

export function DynamicAssetQuery() {
  const [assetId, setAssetId] = useState<string>('0');
  
  const { data, isLoading } = useAssetMetadata({ assetId });

  return (
    <div>
      <input 
        type="text"
        value={assetId}
        onChange={(e) => setAssetId(e.target.value)}
        placeholder="输入资产 ID"
      />

      {isLoading ? (
        <div>加载中...</div>
      ) : data?.data ? (
        <div>
          <h3>{data.data.name}</h3>
          <p>Symbol: {data.data.symbol}</p>
        </div>
      ) : (
        <div>未找到资产</div>
      )}
    </div>
  );
}
```

### 4. 资产选择器（单个 + 列表）

```typescript
'use client';

import { useState } from 'react';
import { useAssetMetadata, useAllAssetMetadata } from '@/app/hooks/useAssetMetadata';

export function AssetSelector() {
  const [selectedId, setSelectedId] = useState<string>('0');
  
  // 查询所有资产用于下拉选择
  const { data: allAssets } = useAllAssetMetadata();
  
  // 查询选中的资产详情
  const { data: selectedAsset } = useAssetMetadata({ 
    assetId: selectedId 
  });

  return (
    <div>
      <select 
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        {allAssets?.data.map((asset: any) => (
          <option key={asset.assetId} value={asset.assetId}>
            {asset.name}
          </option>
        ))}
      </select>

      {selectedAsset?.data && (
        <div className="mt-4">
          <h3>{selectedAsset.data.name}</h3>
          <p>Symbol: {selectedAsset.data.symbol}</p>
          <p>Supply: {selectedAsset.data.supply}</p>
          <p className="text-xs text-gray-500">
            使用 storage.get 优化查询
          </p>
        </div>
      )}
    </div>
  );
}
```

### 5. 服务端组件直接调用 API

```typescript
// app/assets/[id]/page.tsx
import { AssetDetail } from './asset-detail-client';

async function getAssetMetadata(assetId: string) {
  // 在服务端直接调用 API（RESTful 风格）
  const response = await fetch(
    `http://localhost:3000/api/assets/metadata/${assetId}`,
    { next: { revalidate: 60 } } // Next.js 缓存配置
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  
  return response.json();
}

export default async function AssetPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const data = await getAssetMetadata(params.id);

  return (
    <div>
      <h1>{data.data.name} (服务端渲染)</h1>
      <AssetDetail asset={data.data} />
    </div>
  );
}
```

### 6. 手动刷新数据

```typescript
'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useAllAssetMetadata } from '@/app/hooks/useAssetMetadata';

export function RefreshableAssets() {
  const queryClient = useQueryClient();
  const { data, isRefetching } = useAllAssetMetadata();

  const handleRefresh = () => {
    // 手动触发重新获取
    queryClient.invalidateQueries({ 
      queryKey: ['allAssetMetadata'] 
    });
  };

  return (
    <div>
      <button onClick={handleRefresh} disabled={isRefetching}>
        {isRefetching ? '刷新中...' : '刷新数据'}
      </button>
      {/* 资产列表 */}
    </div>
  );
}
```

### 7. 与其他状态管理集成 (Jotai)

```typescript
'use client';

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { AssetsStateAtom } from '@/app/jotai/assets';
import { useAllAssetMetadata } from '@/app/hooks/useAssetMetadata';

export function AssetsWithJotai() {
  const [assetsState, setAssetsState] = useAtom(AssetsStateAtom);
  const { data } = useAllAssetMetadata();

  useEffect(() => {
    if (data?.success && data.data) {
      // 将 API 数据同步到 Jotai store
      setAssetsState({
        assetInfos: data.data.map(asset => ({
          assetId: parseInt(asset.asset_id),
          metadata: asset,
          balance: '0'
        }))
      });
    }
  }, [data, setAssetsState]);

  return (
    <div>
      <h2>资产数量: {assetsState.assetInfos.length}</h2>
      {/* 使用 Jotai state */}
    </div>
  );
}
```

### 8. 使用 SWR (替代方案)

```typescript
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function AssetsWithSWR() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/assets/metadata?first=100',
    fetcher,
    {
      refreshInterval: 60000, // 每60秒自动刷新
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  );

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>加载失败</div>;

  return (
    <div>
      <button onClick={() => mutate()}>刷新</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

## 性能优化建议

### 1. 合理使用缓存

```typescript
// 使用较长的 staleTime 减少不必要的请求
const { data } = useAssetMetadata({
  first: 100,
  staleTime: 5 * 60 * 1000 // 5分钟
});
```

### 2. 条件查询

```typescript
// 只在需要时查询
const { data } = useAssetMetadata({
  first: 50,
  enabled: isVisible // 只在组件可见时查询
});
```

### 3. 预加载数据

```typescript
'use client';

import { useQueryClient } from '@tanstack/react-query';

export function AssetPreloader() {
  const queryClient = useQueryClient();

  const prefetchAssets = () => {
    queryClient.prefetchQuery({
      queryKey: ['allAssetMetadata'],
      queryFn: () => 
        fetch('/api/assets/all').then(res => res.json())
    });
  };

  return (
    <button onMouseEnter={prefetchAssets}>
      查看资产 (悬停预加载)
    </button>
  );
}
```

## 错误处理最佳实践

```typescript
'use client';

import { useAssetMetadata } from '@/app/hooks/useAssetMetadata';
import { toast } from 'sonner';

export function AssetListWithErrorHandling() {
  const { data, isLoading, error, refetch } = useAssetMetadata({
    first: 100,
    onError: (err) => {
      toast.error('加载资产失败', {
        description: err.message
      });
    }
  });

  if (error) {
    return (
      <div>
        <p>加载失败: {error.message}</p>
        <button onClick={() => refetch()}>
          重试
        </button>
      </div>
    );
  }

  // ... 正常渲染
}
```

## 监控与调试

```typescript
'use client';

import { useEffect } from 'react';
import { useAssetMetadata } from '@/app/hooks/useAssetMetadata';

export function AssetMonitor() {
  const query = useAssetMetadata({ first: 100 });

  useEffect(() => {
    console.log('Query State:', {
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isRefetching: query.isRefetching,
      isError: query.isError,
      dataUpdatedAt: query.dataUpdatedAt,
      errorUpdatedAt: query.errorUpdatedAt
    });
  }, [query]);

  return <div>{/* 组件内容 */}</div>;
}
```

