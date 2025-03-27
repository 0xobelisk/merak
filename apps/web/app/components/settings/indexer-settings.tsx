import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@repo/ui/components/ui/dropdown-menu';
import { Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { merakClient } from '@/app/jotai/merak';
import { Merak } from '@0xobelisk/merak-sdk';
import { NETWORK } from '@/app/chain/config';

interface IndexerEndpoint {
  name: string;
  url: string;
  wsUrl: string;
  latency: number | null;
}

const INDEXER_ENDPOINTS: IndexerEndpoint[] = [
  {
    name: 'Merak Official',
    url: 'https://merak-indexer-testnet-api.obelisk.build',
    wsUrl: 'wss://merak-indexer-testnet-api.obelisk.build',
    latency: null
  }
];

const DUBHE_ENDPOINTS: IndexerEndpoint[] = [
  {
    name: 'DubheOS Node',
    url: 'wss://dubheos-node-devnet-wss.obelisk.build/wss', // 修改为正确的 WebSocket URL
    wsUrl: 'wss://dubheos-node-devnet-wss.obelisk.build/wss', // 保持和 url 一致
    latency: null
  }
];

export function IndexerSettings() {
  const [endpoints, setEndpoints] = useState(INDEXER_ENDPOINTS);
  const [dubheEndpoints, setDubheEndpoints] = useState(DUBHE_ENDPOINTS);
  const [selectedEndpoint, setSelectedEndpoint] = useState('Merak Official');
  const [client, setClient] = useAtom(merakClient);

  // 添加 renderLatency 函数
  const renderLatency = (latency: number | null) => {
    if (latency === null) return 'Checking...';
    if (latency === -1) return 'Timeout';
    return `${latency}ms`;
  };

  // 检测延迟的函数 - 使用 WebSocket 检测
  const checkLatency = async (endpoint: IndexerEndpoint) => {
    return new Promise<number>((resolve) => {
      const start = performance.now();
      let timeout: NodeJS.Timeout;

      try {
        // 创建 WebSocket 连接
        const ws = new WebSocket(endpoint.wsUrl);

        // 设置超时
        timeout = setTimeout(() => {
          ws.close();
          resolve(-1); // 超时返回 -1
        }, 5000);

        // 连接成功时计算延迟
        ws.onopen = () => {
          clearTimeout(timeout);
          const end = performance.now();
          ws.close();
          resolve(Math.round(end - start));
        };

        // 连接错误
        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(-1);
        };
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        resolve(-1);
      }
    });
  };

  // 更新选中的端点并重新初始化 Merak 客户端
  const handleSelectEndpoint = (endpoint: IndexerEndpoint) => {
    setSelectedEndpoint(endpoint.name);

    // 重新初始化 Merak 客户端，传入新的 indexerUrl
    const merak = new Merak({
      networkType: NETWORK,
      indexerUrl: endpoint.url
    });
    // 保存选择到 localStorage
    localStorage.setItem(
      'merak_indexer',
      JSON.stringify({
        name: endpoint.name,
        url: endpoint.url,
        wsUrl: endpoint.wsUrl
      })
    );
  };

  // 定期更新延迟
  useEffect(() => {
    let isMounted = true;

    const updateLatencies = async () => {
      try {
        const indexerResults = await Promise.all(
          endpoints.map(async (endpoint) => ({
            ...endpoint,
            latency: await checkLatency(endpoint)
          }))
        );

        const dubheResults = await Promise.all(
          dubheEndpoints.map(async (endpoint) => ({
            ...endpoint,
            latency: await checkLatency(endpoint)
          }))
        );

        if (isMounted) {
          setEndpoints(indexerResults);
          setDubheEndpoints(dubheResults);
        }
      } catch (error) {
        console.error('Failed to update latencies:', error);
      }
    };

    updateLatencies();
    const interval = setInterval(updateLatencies, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[360px] bg-white dark:bg-[#18181B] border border-gray-100 dark:border-gray-800"
        align="end"
      >
        <DropdownMenuLabel className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-800" />
        <div className="p-2">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-4">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            </svg>
            <span>Indexer Endpoint</span>
          </div>
          {endpoints.map((endpoint) => (
            <DropdownMenuItem
              key={endpoint.name}
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
              onClick={() => handleSelectEndpoint(endpoint)}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`w-5 h-5 rounded-sm flex items-center justify-center ${
                    selectedEndpoint === endpoint.name
                      ? 'bg-blue-500 text-white'
                      : 'border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {selectedEndpoint === endpoint.name && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 12L10 17L19 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-gray-700 dark:text-gray-300">{endpoint.name}</span>
              </div>
              <span
                className={`text-sm ${
                  endpoint.latency && endpoint.latency > 400
                    ? 'text-red-500'
                    : endpoint.latency === null
                      ? 'text-gray-400'
                      : 'text-yellow-500'
                }`}
              >
                {renderLatency(endpoint.latency)}
              </span>
            </DropdownMenuItem>
          ))}

          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mt-6 mb-4">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
            </svg>
            <span>DubheOS Node</span>
          </div>
          {dubheEndpoints.map((endpoint) => (
            <DropdownMenuItem
              key={endpoint.name}
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
              onClick={() => handleSelectEndpoint(endpoint)}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`w-5 h-5 rounded-sm flex items-center justify-center ${
                    selectedEndpoint === endpoint.name
                      ? 'bg-blue-500 text-white'
                      : 'border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {selectedEndpoint === endpoint.name && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 12L10 17L19 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-gray-700 dark:text-gray-300">{endpoint.name}</span>
              </div>
              <span
                className={`text-sm ${
                  endpoint.latency && endpoint.latency > 400
                    ? 'text-red-500'
                    : endpoint.latency === null
                      ? 'text-gray-400'
                      : 'text-yellow-500'
                }`}
              >
                {renderLatency(endpoint.latency)}
              </span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
