import localFont from 'next/font/local';
import '../sentry.server.config';
import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { Analytics } from '@vercel/analytics/next';
import '@repo/ui/globals.css';
import '@mysten/dapp-kit/dist/index.css';

import React from 'react';

const inter = localFont({
  src: [
    {
      path: '../public/fonts/Inter/Inter-VariableFont_opsz,wght.ttf',
      style: 'normal'
    },
    {
      path: '../public/fonts/Inter/Inter-Italic-VariableFont_opsz,wght.ttf',
      style: 'italic'
    }
  ],
  variable: '--font-inter',
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'),
  title: 'Merak · decentralized mobility protocol',
  description:
    'Merak - Merak is a decentralized mobility protocol built on Dubhe Engine deployed in Sui',
  openGraph: {
    title: 'Merak · decentralized mobility protocol',
    description:
      'Merak - Merak is a decentralized mobility protocol built on Dubhe Engine deployed in Sui',
    url: new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'),
    siteName: 'Merak',
    images: [
      {
        url: '/manifest-icon-512.png',
        alt: 'Merak Logo'
      }
    ],
    type: 'website'
  }
};

export const viewport: Viewport = {
  themeColor: '#fff',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon-black.ico" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/favicon.ico" media="(prefers-color-scheme: dark)" />
      </head>
      <body className={`${inter.variable} bg-[#F7F8FA]`}>
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
