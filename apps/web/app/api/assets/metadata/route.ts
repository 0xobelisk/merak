import {
  createServerMerak,
  fetchAllAssetMetadata,
  createListSuccessResponse,
  createErrorResponse
} from '@/app/api/utils';

// Enable ISR with revalidation every 60 seconds
export const revalidate = 60;

export async function GET() {
  try {
    // Create Merak instance
    const merak = createServerMerak();

    // Fetch all asset metadata with pagination
    const allMetadata = await fetchAllAssetMetadata(merak);

    return createListSuccessResponse(allMetadata);
  } catch (error) {
    console.error('Error fetching all asset metadata:', error);
    return createErrorResponse(error);
  }
}
