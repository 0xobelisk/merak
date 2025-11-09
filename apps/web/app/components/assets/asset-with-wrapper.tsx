'use client';

import { useEnrichedAssets } from '@/app/hooks/useRegistryAssets';
import { useAssetWrappers } from '@/app/hooks/useAssetMetadata';
import { getLogoUrl } from '@/app/types/registry';
import type { AssetWrapper } from '@/app/types/assets';
import type { EnrichedAsset as RegistryEnrichedAsset } from '@/app/types/registry';

interface EnrichedAssetWithWrapper extends RegistryEnrichedAsset {
  wrapper?: AssetWrapper;
}

export default function AssetWithWrapper() {
  const { data: enrichedAssets, isLoading: registryLoading } = useEnrichedAssets({
    status: 'live'
  });
  const { data: wrappersResponse, isLoading: wrappersLoading } = useAssetWrappers();

  const isLoading = registryLoading || wrappersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading registry assets and wrappers...</div>
      </div>
    );
  }

  // Combine registry assets with wrapper info
  const assetsWithWrapper: EnrichedAssetWithWrapper[] =
    enrichedAssets.map((asset) => ({
      ...asset,
      wrapper: wrappersResponse?.data.find((w) => w.assetId === asset.metadata.assetId)
    })) || [];

  const wrappedCount = assetsWithWrapper.filter((a) => a.wrapper).length;
  const unwrappedCount = assetsWithWrapper.length - wrappedCount;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Registry Assets with Wrapper Info</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Total: {assetsWithWrapper.length} | Wrapped: {wrappedCount} | Unwrapped:{' '}
            {unwrappedCount}
          </div>
          <div className="text-xs text-gray-400">From local registry</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assetsWithWrapper.map((asset) => (
          <div
            key={asset.metadata.assetId}
            className={`rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md ${
              asset.wrapper ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
            }`}
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
              </div>
              {asset.wrapper && (
                <span className="rounded-full bg-blue-500 px-2 py-1 text-xs text-white">
                  Wrapped
                </span>
              )}
            </div>

            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Asset ID:</span>
                <span className="font-mono text-xs">
                  {asset.metadata.assetId.slice(0, 6)}...{asset.metadata.assetId.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Decimals:</span>
                <span className="font-medium">{asset.metadata.decimals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Balance:</span>
                <span className="font-medium">{asset.formattedBalance || '0'}</span>
              </div>
              {asset.wrapper && (
                <>
                  <div className="mt-2 border-t pt-2">
                    <p className="text-xs font-semibold text-blue-600">Wrapper Info</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Coin Type:</span>
                    <span className="font-mono text-xs">
                      {asset.wrapper.coinType.split('::').pop()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={asset.wrapper.isDeleted ? 'text-red-500' : 'text-green-500'}>
                      {asset.wrapper.isDeleted ? 'Deleted' : 'Active'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {assetsWithWrapper.length === 0 && (
        <div className="flex items-center justify-center p-8 text-gray-500">No assets found</div>
      )}
    </div>
  );
}
