import { NextResponse } from 'next/server';
import { loadRegistryAsset } from '@/app/api/utils/registry';
import type { SingleRegistryAssetResponse } from '@/app/types/registry';

// Enable ISR with revalidation every 60 seconds
export const revalidate = 60;

/**
 * GET /api/registry/[name]
 * Returns a single registry asset by name
 * 
 * @param name - Asset name (e.g., 'sui', 'dubhe')
 * 
 * @example
 * GET /api/registry/sui
 * GET /api/registry/dubhe
 */
export async function GET(request: Request, { params }: { params: { name: string } }) {
  try {
    const { name } = params;

    if (!name || typeof name !== 'string') {
      const errorResponse: SingleRegistryAssetResponse = {
        success: false,
        data: null as any,
        timestamp: new Date().toISOString(),
        error: 'Asset name is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Load registry asset
    const asset = loadRegistryAsset(name);

    if (!asset) {
      const errorResponse: SingleRegistryAssetResponse = {
        success: false,
        data: null as any,
        timestamp: new Date().toISOString(),
        error: `Asset '${name}' not found in registry`
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const response: SingleRegistryAssetResponse = {
      success: true,
      data: asset,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching registry asset:', error);

    const errorResponse: SingleRegistryAssetResponse = {
      success: false,
      data: null as any,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

