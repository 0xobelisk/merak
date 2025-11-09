import {
  createServerMerak,
  createSuccessResponse,
  createNotFoundResponse,
  createErrorResponse
} from '@/app/api/utils';
import type { AssetMetadata } from '@/app/types/assets';

// Enable ISR with revalidation every 60 seconds
export const revalidate = 60;

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const assetId = params.id;

    // Create Merak instance
    const merak = createServerMerak();

    // Use storage.get for single asset query
    const result = await merak.storage.get.assetMetadata({
      assetId
    });

    if (!result) {
      return createNotFoundResponse('Asset', assetId);
    }

    const data: AssetMetadata = result as AssetMetadata;

    return createSuccessResponse(data);
  } catch (error) {
    console.error('Error fetching asset metadata:', error);
    return createErrorResponse(error);
  }
}
