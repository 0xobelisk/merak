/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'export',
  distDir: 'dist'
  // async rewrites() {
  //   return [
  //     {
  //       source: '/sov-http',
  //       destination: 'http://localhost:12346/',
  //     },
  //     {
  //       source: '/sov-rpc',
  //       destination: 'http://localhost:12345/',
  //     },
  //   ]
  // },
};

module.exports = {
  transpilePackages: ['@repo/ui']
  // ...nextConfig
};
