# API Utilities

Common utilities for API routes in the Merak application.

## 📁 Structure

```
app/api/utils/
├── index.ts          # Main exports
├── merak.ts          # Merak instance creation
├── pagination.ts     # Pagination helpers
├── responses.ts      # Response formatters
└── README.md         # This file
```

## 🔧 Utilities

### 1. Merak Instance (`merak.ts`)

#### `createServerMerak()`

Create a server-side Merak instance for read-only operations.

```typescript
import { createServerMerak } from '@/app/api/utils';

const merak = createServerMerak();
```

**Features:**
- No private key required (read-only)
- Pre-configured with Dubhe and GraphQL clients
- Uses deployment configuration

### 2. Pagination (`pagination.ts`)

#### `fetchAllPaginated<T>()`

Generic function to fetch all paginated data from GraphQL.

```typescript
import { fetchAllPaginated } from '@/app/api/utils';

const allData = await fetchAllPaginated(
  (params) => merak.storage.list.assetMetadata(params),
  {
    pageSize: 100,
    maxItems: 10000,
    filter: { /* optional filters */ },
    orderBy: [ /* optional ordering */ ]
  }
);
```

**Parameters:**
- `fetchFn`: Function that fetches a page of data
- `options`: Pagination options
  - `pageSize` (default: 100): Items per page
  - `maxItems` (default: 10000): Safety limit
  - `filter`: Additional filter parameters
  - `orderBy`: Order by parameters

#### `fetchAllAssetMetadata()`

Fetch all asset metadata with pagination.

```typescript
import { fetchAllAssetMetadata } from '@/app/api/utils';

const metadata = await fetchAllAssetMetadata(merak);
```

#### `fetchAllAssetWrappers()`

Fetch all asset wrappers with pagination.

```typescript
import { fetchAllAssetWrappers } from '@/app/api/utils';

const wrappers = await fetchAllAssetWrappers(merak);
```

#### `extractNodesFromEdges<T>()`

Extract nodes from GraphQL Connection edges.

```typescript
import { extractNodesFromEdges } from '@/app/api/utils';

const result = await merak.storage.list.assetMetadata({ first: 10 });
const nodes = extractNodesFromEdges(result);
```

### 3. Responses (`responses.ts`)

#### `createSuccessResponse<T>()`

Create a success response for a single item.

```typescript
import { createSuccessResponse } from '@/app/api/utils';

return createSuccessResponse(assetMetadata);
```

**Response structure:**
```json
{
  "success": true,
  "data": { /* your data */ },
  "timestamp": "2024-11-08T10:00:00.000Z"
}
```

#### `createListSuccessResponse<T>()`

Create a success response for a list of items.

```typescript
import { createListSuccessResponse } from '@/app/api/utils';

return createListSuccessResponse(allMetadata);
```

**Response structure:**
```json
{
  "success": true,
  "data": [ /* your data */ ],
  "totalCount": 10,
  "timestamp": "2024-11-08T10:00:00.000Z"
}
```

#### `createErrorResponse()`

Create an error response.

```typescript
import { createErrorResponse } from '@/app/api/utils';

return createErrorResponse('Something went wrong', 500);
// or
return createErrorResponse(error, 500);
```

**Response structure:**
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-11-08T10:00:00.000Z"
}
```

#### `createNotFoundResponse()`

Create a 404 Not Found response.

```typescript
import { createNotFoundResponse } from '@/app/api/utils';

return createNotFoundResponse('Asset', assetId);
```

**Response:**
```json
{
  "success": false,
  "error": "Asset with ID 0 not found",
  "timestamp": "2024-11-08T10:00:00.000Z"
}
```

#### `createBadRequestResponse()`

Create a 400 Bad Request response.

```typescript
import { createBadRequestResponse } from '@/app/api/utils';

return createBadRequestResponse('Invalid query parameter');
```

## 📖 Usage Examples

### Complete API Route Example

```typescript
import { NextResponse } from 'next/server';
import {
  createServerMerak,
  fetchAllAssetMetadata,
  createListSuccessResponse,
  createErrorResponse
} from '@/app/api/utils';

export const revalidate = 60;

export async function GET() {
  try {
    const merak = createServerMerak();
    const allMetadata = await fetchAllAssetMetadata(merak);
    return createListSuccessResponse(allMetadata);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(error);
  }
}
```

### Single Item Query Example

```typescript
import {
  createServerMerak,
  createSuccessResponse,
  createNotFoundResponse,
  createErrorResponse
} from '@/app/api/utils';
import type { AssetMetadata } from '@/app/types/assets';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const merak = createServerMerak();
    const result = await merak.storage.get.assetMetadata({
      assetId: params.id
    });

    if (!result) {
      return createNotFoundResponse('Asset', params.id);
    }

    const data = result as AssetMetadata;
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(error);
  }
}
```

### Custom Pagination Example

```typescript
import { createServerMerak, fetchAllPaginated } from '@/app/api/utils';

const merak = createServerMerak();

// Fetch with custom options
const data = await fetchAllPaginated(
  (params) => merak.storage.list.assetMetadata(params),
  {
    pageSize: 50,
    maxItems: 5000,
    filter: {
      isMintable: true
    }
  }
);
```

## 🎯 Benefits

### 1. Code Reusability
- Eliminate duplicate code across API routes
- Consistent implementation across endpoints
- Easier to maintain and update

### 2. Type Safety
- Full TypeScript support
- Generic types for flexibility
- Type-safe response structures

### 3. Error Handling
- Consistent error response format
- Standard HTTP status codes
- Automatic timestamp inclusion

### 4. Performance
- Optimized pagination logic
- Safety limits to prevent infinite loops
- Efficient data extraction from GraphQL

### 5. Developer Experience
- Simple, intuitive API
- Clear function names
- Comprehensive documentation
- Easy to test

## 🔍 Type Definitions

```typescript
// Response types
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

interface ApiListSuccessResponse<T> {
  success: true;
  data: T[];
  totalCount: number;
  timestamp: string;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  timestamp: string;
}

// Pagination types
interface PaginationOptions {
  pageSize?: number;
  maxItems?: number;
  filter?: Record<string, any>;
  orderBy?: any[];
}

interface GraphQLConnection<T> {
  edges?: Array<{
    node: T;
    cursor: string;
  }>;
  pageInfo?: {
    hasNextPage: boolean;
    endCursor?: string;
  };
}
```

## 📝 Best Practices

1. **Always use `createServerMerak()`** for server-side Merak instances
2. **Use typed responses** - Import and use the response type interfaces
3. **Handle errors properly** - Always wrap in try-catch and use error response helpers
4. **Set appropriate status codes** - Use 404, 400, 500 correctly
5. **Include ISR revalidation** - Set `export const revalidate = 60;` in API routes
6. **Log errors** - Use `console.error()` before returning error responses

## 🧪 Testing

```typescript
// Example test
import { createSuccessResponse } from '@/app/api/utils';

test('createSuccessResponse returns correct structure', () => {
  const data = { id: '1', name: 'Test' };
  const response = createSuccessResponse(data);
  const json = await response.json();
  
  expect(json.success).toBe(true);
  expect(json.data).toEqual(data);
  expect(json.timestamp).toBeDefined();
});
```

## 📚 Related Documentation

- [Asset Metadata API](../assets/metadata/README.md)
- [Asset Wrapper API](../assets/wrapper/README.md)
- [TypeScript Types](../../types/assets.ts)

