# Merak API Documentation

## Overview

This directory contains Next.js API routes that provide server-side caching for blockchain data queries. All APIs use ISR (Incremental Static Regeneration) with a 60-second revalidation period.

## Asset Metadata APIs

### 1. GET `/api/assets/metadata`

Fetch **all** asset metadata (uses `storage.list` with automatic pagination handling).

**Query Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "assetId": "0",
      "name": "Asset 1",
      ...
    },
    {
      "assetId": "1",
      "name": "Asset 2",
      ...
    }
  ],
  "totalCount": 2,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Example:**
```bash
# Get all assets
curl http://localhost:3000/api/assets/metadata
```

**Use Cases:**
- Loading asset dropdown lists
- Displaying all available assets
- Asset search and filtering

### 2. GET `/api/assets/metadata/[id]`

Query **single** asset metadata by ID (uses `storage.get` for optimized retrieval).

**Path Parameters:**
- `id` (**required**): Asset ID in URL path

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "assetId": "0",
    "name": "Asset Name",
    "symbol": "SYMBOL",
    "description": "...",
    "iconUrl": "...",
    "decimals": 9,
    ...
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "error": "Asset with ID X not found",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Example:**
```bash
# Get specific asset by ID
curl http://localhost:3000/api/assets/metadata/0

# Get another asset
curl http://localhost:3000/api/assets/metadata/1
```

**Use Cases:**
- Asset detail pages
- Asset selection confirmation
- Dynamic asset queries

### 3. GET `/api/assets/wrappers`

Fetch **all** asset wrappers (uses `storage.list.assetWrapper()` with automatic pagination handling).

**Query Parameters:** None

**Response:**
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

**Example:**
```bash
# Get all wrappers
curl http://localhost:3000/api/assets/wrappers
```

**Use Cases:**
- Displaying wrapped assets
- Checking if an asset is wrapped
- Finding wrapper by coin type

## Caching Strategy

All APIs implement server-side caching with the following characteristics:

1. **Revalidation Period**: 60 seconds (`export const revalidate = 60`)
2. **ISR**: Uses Next.js Incremental Static Regeneration
3. **Stale-While-Revalidate**: Serves cached data while updating in the background

### How It Works

1. First request triggers data fetch and caching
2. Subsequent requests within 60 seconds serve cached data instantly
3. After 60 seconds, next request triggers background revalidation
4. User still gets cached data immediately, fresh data on next request

## Client-Side Usage

### Using React Hooks

```typescript
import { 
  useAssetMetadata, 
  useAllAssetMetadata,
  useAssetWrappers 
} from '@/app/hooks/useAssetMetadata';

function MyComponent() {
  // Query single asset by ID
  const { data: asset } = useAssetMetadata({ assetId: '0' });

  // Get all assets
  const { data: allAssets } = useAllAssetMetadata();

  // Get all wrappers
  const { data: wrappers } = useAssetWrappers();

  return (
    <div>
      {/* Display single asset */}
      {asset?.data && (
        <div>
          <h2>{asset.data.name}</h2>
          <p>{asset.data.symbol}</p>
        </div>
      )}
      
      {/* Display all assets */}
      {allAssets?.data.map((item) => (
        <div key={item.assetId}>{item.name}</div>
      ))}
      
      {/* Display all wrappers */}
      {wrappers?.data.map((wrapper) => (
        <div key={wrapper.assetId}>
          Asset {wrapper.assetId}: {wrapper.coinType}
        </div>
      ))}
    </div>
  );
}
```

### Direct Fetch

```typescript
// Client-side fetch
async function fetchAssets() {
  const response = await fetch('/api/assets/metadata?first=100');
  const data = await response.json();
  return data;
}
```

## Performance Benefits

1. **Reduced Load**: Server caches reduce blockchain query load
2. **Fast Response**: Cached responses return in milliseconds
3. **Auto-Update**: Data stays fresh with 60-second revalidation
4. **Better UX**: No loading spinners for cached data

## Error Handling

All APIs return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Future Enhancements

Potential additions:
- Pool information APIs
- Asset supply queries
- Asset holder information
- Wrapper asset queries
- Custom revalidation intervals per endpoint
- Redis/Database caching layer for even faster responses

