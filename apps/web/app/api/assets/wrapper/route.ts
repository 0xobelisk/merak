import {
  createServerMerak,
  fetchAllAssetWrappers,
  createListSuccessResponse,
  createErrorResponse
} from '@/app/api/utils';

// Enable ISR with revalidation every 60 seconds
export const revalidate = 60;

export async function GET() {
  try {
    // Create Merak instance
    const merak = createServerMerak();

    // Fetch all asset wrappers with pagination
    const allWrappers = await fetchAllAssetWrappers(merak);

    return createListSuccessResponse(allWrappers);
  } catch (error) {
    console.error('Error fetching all asset wrappers:', error);
    return createErrorResponse(error);
  }
}
