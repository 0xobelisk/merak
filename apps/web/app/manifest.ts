import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Merak',
    short_name: 'Merak',
    description: 'Merak - decentralized mobility protocol',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F7F8FA',
    theme_color: '#fff',
    icons: [
      {
        src: '/manifest-icon-192.png',
        type: 'image/png',
        sizes: '192x192',
        purpose: 'any'
      },
      {
        src: '/manifest-icon-512.png',
        type: 'image/png',
        sizes: '512x512',
        purpose: 'any'
      }
    ],
    shortcuts: [
      {
        name: 'Home',
        short_name: 'Home',
        description: 'Merak App Homepage',
        url: '/',
        icons: [
          {
            src: '/manifest-icon-192.png',
            type: 'image/png',
            sizes: '192x192',
            purpose: 'any'
          },
          {
            src: '/manifest-icon-512.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'any'
          }
        ]
      }
    ]
  };
}
