'use client';

import { useState } from 'react';
import { useAssetWrapper, useAssetWrappers } from '@/app/hooks/useAssetMetadata';

/**
 * Demo component showing how to use the Asset Wrappers API
 */
export default function AssetWrapperDemo() {
  const [queryType, setQueryType] = useState<'coinType' | 'assetId'>('coinType');
  const [queryValue, setQueryValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Query all wrappers
  const { data: allWrappers, isLoading: loadingAll } = useAssetWrappers();

  // Query single wrapper
  const { data: singleWrapper, isLoading: loadingSingle, error } = useAssetWrapper({
    coinType: isSearching && queryType === 'coinType' ? queryValue : undefined,
    assetId: isSearching && queryType === 'assetId' ? queryValue : undefined
  });

  const handleSearch = () => {
    if (queryValue.trim()) {
      setIsSearching(true);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Asset Wrappers API Demo</h1>
        <p className="mt-2 text-gray-600">
          Demonstrating the new Asset Wrappers API with separate list and get endpoints
        </p>
      </div>

      {/* Single Wrapper Query Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Query Single Wrapper</h2>
        
        <div className="space-y-4">
          {/* Query Type Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Query Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="coinType"
                  checked={queryType === 'coinType'}
                  onChange={(e) => {
                    setQueryType(e.target.value as 'coinType');
                    setIsSearching(false);
                  }}
                  className="mr-2"
                />
                By Coin Type (Recommended)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="assetId"
                  checked={queryType === 'assetId'}
                  onChange={(e) => {
                    setQueryType(e.target.value as 'assetId');
                    setIsSearching(false);
                  }}
                  className="mr-2"
                />
                By Asset ID
              </label>
            </div>
          </div>

          {/* Input Field */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {queryType === 'coinType' ? 'Coin Type' : 'Asset ID'}
            </label>
            <input
              type="text"
              value={queryValue}
              onChange={(e) => {
                setQueryValue(e.target.value);
                setIsSearching(false);
              }}
              placeholder={
                queryType === 'coinType'
                  ? 'e.g., 0x2::sui::SUI'
                  : 'e.g., 0'
              }
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={!queryValue.trim()}
            className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            Search
          </button>

          {/* API Endpoint Display */}
          {isSearching && queryValue && (
            <div className="rounded bg-gray-100 p-3">
              <p className="text-sm font-mono text-gray-700">
                <strong>API Call:</strong> GET /api/assets/wrapper/{queryValue}?type={queryType}
              </p>
            </div>
          )}

          {/* Results */}
          {isSearching && (
            <div className="mt-4">
              {loadingSingle ? (
                <div className="text-gray-500">Loading...</div>
              ) : error ? (
                <div className="rounded-md bg-red-50 p-4 text-red-700">
                  Error: {error instanceof Error ? error.message : 'Unknown error'}
                </div>
              ) : singleWrapper?.success ? (
                <div className="rounded-md bg-green-50 p-4">
                  <h3 className="mb-2 font-semibold text-green-900">Wrapper Found ✓</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Asset ID:</span>{' '}
                      <span className="font-mono">{singleWrapper.data.assetId}</span>
                    </div>
                    <div>
                      <span className="font-medium">Coin Type:</span>{' '}
                      <span className="font-mono text-xs">{singleWrapper.data.coinType}</span>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {new Date(Number(singleWrapper.data.createdAtTimestampMs)).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span>{' '}
                      {new Date(Number(singleWrapper.data.updatedAtTimestampMs)).toLocaleString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-md bg-yellow-50 p-4 text-yellow-700">
                  No wrapper found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* All Wrappers Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Wrappers</h2>
          <div className="text-sm text-gray-500">
            API: GET /api/assets/wrapper
          </div>
        </div>

        {loadingAll ? (
          <div className="text-gray-500">Loading all wrappers...</div>
        ) : !allWrappers?.success ? (
          <div className="text-red-500">Failed to load wrappers</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-semibold">Total Count: {allWrappers.totalCount}</span>
              <span className="text-gray-500">
                Last updated: {new Date(allWrappers.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">Asset ID</th>
                    <th className="px-4 py-2">Coin Type</th>
                    <th className="px-4 py-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allWrappers.data.map((wrapper) => (
                    <tr key={wrapper.assetId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono">{wrapper.assetId}</td>
                      <td className="px-4 py-2 font-mono text-xs">{wrapper.coinType}</td>
                      <td className="px-4 py-2">
                        {new Date(Number(wrapper.createdAtTimestampMs)).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {allWrappers.data.length === 0 && (
              <div className="py-8 text-center text-gray-500">No wrappers found</div>
            )}
          </div>
        )}
      </div>

      {/* API Design Documentation */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-blue-900">API Design (RESTful)</h2>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-mono font-semibold">GET /api/assets/wrapper</span>
            <p className="ml-4 mt-1 text-gray-700">List all wrappers (with pagination)</p>
          </div>
          <div>
            <span className="font-mono font-semibold">
              GET /api/assets/wrapper/[id]?type=coinType
            </span>
            <p className="ml-4 mt-1 text-gray-700">
              Get single wrapper by coin type (default, uses storage.get - fastest)
            </p>
          </div>
          <div>
            <span className="font-mono font-semibold">
              GET /api/assets/wrapper/[id]?type=assetId
            </span>
            <p className="ml-4 mt-1 text-gray-700">
              Get single wrapper by asset ID (uses list with assetId filter)
            </p>
          </div>
        </div>
        <div className="mt-4 rounded bg-white p-3">
          <p className="text-sm">
            <strong>✨ Design Pattern:</strong> Mirrors the Asset Metadata API structure with
            separate endpoints for list and get operations, supporting flexible query types.
          </p>
        </div>
      </div>
    </div>
  );
}

