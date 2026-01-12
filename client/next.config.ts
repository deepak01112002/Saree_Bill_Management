import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optimize production builds
  productionBrowserSourceMaps: false,
  
  // Headers for static assets to prevent caching issues
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
