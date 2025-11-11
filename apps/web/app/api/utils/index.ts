/**
 * API Utilities
 *
 * This module provides common utilities for API routes:
 * - Merak instance creation
 * - Pagination helpers
 * - Response formatters
 */

export { createServerMerak } from './merak';

export {
  extractNodesFromEdges,
  fetchAllPaginated,
  fetchAllAssetMetadata,
  fetchAllAssetWrappers,
  type PaginationOptions
} from './pagination';

export {
  createSuccessResponse,
  createListSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createBadRequestResponse,
  type ApiSuccessResponse,
  type ApiListSuccessResponse,
  type ApiErrorResponse
} from './responses';
