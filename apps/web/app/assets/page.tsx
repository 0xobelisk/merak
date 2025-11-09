'use client';

import AssetMetadataList from '@/app/components/assets/asset-metadata-list';

export default function AssetsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Assets</h1>
        <p className="mt-2 text-gray-600">
          View all asset metadata with automatic server-side caching (updates every 60 seconds)
        </p>
      </div>
      <AssetMetadataList />
    </div>
  );
}

