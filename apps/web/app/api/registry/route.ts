import { NextResponse } from 'next/server';
import { loadRegistryAssets } from '@/app/api/utils/registry';
import type { RegistryAssetsResponse } from '@/app/types/registry';

// Enable ISR with revalidation every 60 seconds
export const revalidate = 60;

/**
 * GET /api/registry
 * Returns all registry assets or filtered by status
 * 
 * Query parameters:
 * - status: 'live' | 'deprecated' | 'testing' (optional)
 * 
 * @example
 * GET /api/registry
 * GET /api/registry?status=live
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'live' | 'deprecated' | 'testing' | null;

    // Validate status parameter if provided
    if (status && !['live', 'deprecated', 'testing'].includes(status)) {
      const errorResponse: RegistryAssetsResponse = {
        success: false,
        data: [],
        totalCount: 0,
        timestamp: new Date().toISOString(),
        error: 'Invalid status parameter. Must be one of: live, deprecated, testing'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Load registry assets
    const assets = loadRegistryAssets(status || undefined);

    const response: RegistryAssetsResponse = {
      success: true,
      data: assets,
      totalCount: assets.length,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching registry assets:', error);

    const errorResponse: RegistryAssetsResponse = {
      success: false,
      data: [],
      totalCount: 0,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

