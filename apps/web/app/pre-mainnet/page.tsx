'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function PreMainnetPage() {
  const router = useRouter();

  const handleEnterApp = () => {
    router.push('/portfolio');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <Image
            src="/merak-logo.svg"
            alt="Merak Logo"
            width={120}
            height={120}
            className="drop-shadow-lg"
          />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
            Merak
          </h1> */}
          
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">
            Pre-Mainnet
          </h2>
          
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-full">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-yellow-800 font-medium">Coming Soon</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <p className="text-xl text-gray-600 leading-relaxed">
            Decentralized Mobility Protocol
          </p>
          <p className="text-lg text-gray-500 leading-relaxed">
            Next-generation DeFi protocol built on Dubhe Engine and deployed on Sui Network
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">High Performance</h3>
            <p className="text-gray-600 text-sm">High throughput and low latency powered by Sui Network</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Secure & Reliable</h3>
            <p className="text-gray-600 text-sm">Rigorously audited smart contracts</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Low Cost</h3>
            <p className="text-gray-600 text-sm">Ultra-low transaction fees and gas costs</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          {/* <button
            onClick={handleEnterApp}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            进入应用 (测试版)
          </button>
          
          <button className="px-8 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all duration-200">
            了解更多
          </button> */}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            © 2025 Merak Protocol. Built with ❤️ on Sui Network.
          </p>
        </div>
      </div>
    </div>
  );
}
