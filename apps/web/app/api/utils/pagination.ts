import { Merak } from '@0xobelisk/merak-sdk';

/**
 * GraphQL Connection type structure
 */
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

/**
 * Options for pagination
 */
export interface PaginationOptions {
  /** Page size for each request */
  pageSize?: number;
  /** Maximum number of items to fetch (safety limit) */
  maxItems?: number;
  /** Additional filter parameters */
  filter?: Record<string, any>;
  /** Order by parameters */
  orderBy?: any[];
}

/**
 * Extract nodes from GraphQL Connection edges
 *
 * @param result - GraphQL Connection result
 * @returns Array of nodes
 */
export function extractNodesFromEdges<T>(result: GraphQLConnection<T>): T[] {
  return result.edges ? result.edges.map((edge) => edge.node) : [];
}

/**
 * Generic function to fetch all paginated data from GraphQL
 *
 * Handles pagination automatically and accumulates all results.
 * Includes safety limit to prevent infinite loops.
 *
 * @param fetchFn - Function that fetches a page of data
 * @param options - Pagination options
 * @returns Promise resolving to array of all items
 *
 * @example
 * ```typescript
 * const allMetadata = await fetchAllPaginated(
 *   (params) => merak.storage.list.assetMetadata(params),
 *   { pageSize: 100, maxItems: 10000 }
 * );
 * ```
 */
export async function fetchAllPaginated<T>(
  fetchFn: (params: {
    first: number;
    after?: string;
    [key: string]: any;
  }) => Promise<GraphQLConnection<T>>,
  options: PaginationOptions = {}
): Promise<T[]> {
  const { pageSize = 100, maxItems = 10000, filter = {}, orderBy } = options;

  const allData: T[] = [];
  let hasNextPage = true;
  let after: string | undefined = undefined;

  while (hasNextPage) {
    const params: any = {
      first: pageSize,
      after,
      ...filter
    };

    if (orderBy) {
      params.orderBy = orderBy;
    }

    const result = await fetchFn(params);

    // Extract data from GraphQL Connection type
    const pageData = extractNodesFromEdges(result);

    if (pageData.length > 0) {
      allData.push(...pageData);
    }

    hasNextPage = result.pageInfo?.hasNextPage || false;
    after = result.pageInfo?.endCursor;

    // Safety limit to prevent infinite loops
    if (allData.length >= maxItems) {
      console.warn(`Reached maximum items limit of ${maxItems}`);
      break;
    }
  }

  return allData;
}

/**
 * Fetch all asset metadata with pagination
 *
 * @param merak - Merak instance
 * @param options - Pagination options
 * @returns Promise resolving to array of all asset metadata
 */
export async function fetchAllAssetMetadata(merak: Merak, options?: PaginationOptions) {
  return fetchAllPaginated((params) => merak.storage.list.assetMetadata(params), options);
}

/**
 * Fetch all asset wrappers with pagination
 *
 * @param merak - Merak instance
 * @param options - Pagination options
 * @returns Promise resolving to array of all asset wrappers
 */
export async function fetchAllAssetWrappers(merak: Merak, options?: PaginationOptions) {
  return fetchAllPaginated((params) => merak.storage.list.assetWrapper(params), options);
}
