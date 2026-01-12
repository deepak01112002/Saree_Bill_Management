import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Force webpack and disable Turbopack completely
  // This prevents ChunkLoadError in production
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Ensure stable chunk names to prevent 404 errors
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
        // Prevent chunk splitting issues
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
          },
        },
      };
    }
    return config;
  },
  // Disable any experimental features that might use Turbopack
  experimental: {},
};

export default nextConfig;
