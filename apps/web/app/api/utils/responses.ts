import { NextResponse } from 'next/server';

/**
 * Success response structure for single item
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Success response structure for list of items
 */
export interface ApiListSuccessResponse<T> {
  success: true;
  data: T[];
  totalCount: number;
  timestamp: string;
}

/**
 * Error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  timestamp: string;
}

/**
 * Create a success response for a single item
 *
 * @param data - The data to return
 * @returns NextResponse with success structure
 *
 * @example
 * ```typescript
 * return createSuccessResponse(assetMetadata);
 * ```
 */
export function createSuccessResponse<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Create a success response for a list of items
 *
 * @param data - The array of data to return
 * @returns NextResponse with success structure including totalCount
 *
 * @example
 * ```typescript
 * return createListSuccessResponse(allMetadata);
 * ```
 */
export function createListSuccessResponse<T>(data: T[]): NextResponse<ApiListSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    totalCount: data.length,
    timestamp: new Date().toISOString()
  });
}

/**
 * Create an error response
 *
 * @param error - Error object or message
 * @param status - HTTP status code (default: 500)
 * @returns NextResponse with error structure
 *
 * @example
 * ```typescript
 * return createErrorResponse('Asset not found', 404);
 * ```
 */
export function createErrorResponse(
  error: Error | string,
  status: number = 500
): NextResponse<ApiErrorResponse> {
  const errorMessage = error instanceof Error ? error.message : error;

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

/**
 * Create a 404 Not Found response
 *
 * @param resourceType - Type of resource (e.g., 'Asset', 'Wrapper')
 * @param id - ID of the resource
 * @returns NextResponse with 404 error
 *
 * @example
 * ```typescript
 * return createNotFoundResponse('Asset', assetId);
 * ```
 */
export function createNotFoundResponse(
  resourceType: string,
  id: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(`${resourceType} with ID ${id} not found`, 404);
}

/**
 * Create a 400 Bad Request response
 *
 * @param message - Error message
 * @returns NextResponse with 400 error
 *
 * @example
 * ```typescript
 * return createBadRequestResponse('Invalid query parameter');
 * ```
 */
export function createBadRequestResponse(message: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 400);
}
