import {
  createServerMerak,
  extractNodesFromEdges,
  createSuccessResponse,
  createNotFoundResponse,
  createBadRequestResponse,
  createErrorResponse
} from '@/app/api/utils';
import type { AssetWrapper } from '@/app/types/assets';

// Enable ISR with revalidation every 60 seconds
export const revalidate = 60;

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'coinType'; // default to coinType

    // Create Merak instance
    const merak = createServerMerak();

    // Query by coinType (default behavior)
    if (type === 'coinType') {
      const result = await merak.storage.get.assetWrapper({
        coinType: id
      });

      if (!result) {
        return createNotFoundResponse('Wrapper with coin type', id);
      }

      const data: AssetWrapper = result as AssetWrapper;

      return createSuccessResponse(data);
    }

    // Query by assetId
    if (type === 'assetId') {
      const result = await merak.storage.list.assetWrapper({
        assetId: id,
        first: 1
      });

      const pageData = extractNodesFromEdges<AssetWrapper>(result as any);
      const wrapper = pageData[0];

      if (!wrapper) {
        return createNotFoundResponse('Wrapper with asset ID', id);
      }

      return createSuccessResponse(wrapper);
    }

    // Invalid type parameter
    return createBadRequestResponse(`Invalid query type: ${type}. Must be 'coinType' or 'assetId'`);
  } catch (error) {
    console.error('Error fetching asset wrapper:', error);
    return createErrorResponse(error);
  }
}
