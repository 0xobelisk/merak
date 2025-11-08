'use client';

import { useEnrichedAssets } from '@/app/hooks/useRegistryAssets';
import { getLogoUrl } from '@/app/types/registry';

export default function AssetMetadataList() {
  const { data: enrichedAssets, isLoading } = useEnrichedAssets({ status: 'live' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading registry assets...</div>
      </div>
    );
  }

  if (!enrichedAssets || enrichedAssets.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">No registry assets available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Registry Assets</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">Total: {enrichedAssets.length} assets</div>
          <div className="text-xs text-gray-400">From local registry</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {enrichedAssets.map((asset) => (
          <div
            key={asset.metadata.assetId}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <img
                src={getLogoUrl(asset)}
                alt={asset.asset.name}
                className="h-12 w-12 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/registry/sui/images/sui.svg';
                }}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{asset.asset.name}</h3>
                <p className="text-sm text-gray-600">{asset.asset.symbol}</p>
                {asset.status !== 'live' && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800">
                    {asset.status}
                  </span>
                )}
              </div>
            </div>

            {asset.asset.description && (
              <p className="mt-2 text-sm text-gray-700 line-clamp-2">{asset.asset.description}</p>
            )}

            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Decimals:</span>
                <span className="font-medium">{asset.metadata.decimals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Balance:</span>
                <span className="font-medium">{asset.formattedBalance || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Asset ID:</span>
                <span className="font-mono text-xs">
                  {asset.metadata.assetId.slice(0, 6)}...{asset.metadata.assetId.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {enrichedAssets.length === 0 && (
        <div className="flex items-center justify-center p-8 text-gray-500">No assets found</div>
      )}
    </div>
  );
}
