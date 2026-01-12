import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Use webpack for stable chunk loading (prevents ChunkLoadError)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensure stable chunk names to prevent 404 errors
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      };
    }
    return config;
  },
};

export default nextConfig;
