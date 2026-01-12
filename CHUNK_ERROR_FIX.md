# ChunkLoadError Fix Guide

## Problem
After building Next.js application, you get errors like:
```
Failed to load resource: the server responded with a status of 404 (Not Found)
ChunkLoadError: Failed to load chunk /_next/static/chunks/551394954efcf6c6.js
```

## Root Cause
This error occurs when:
1. Next.js 16 uses Turbopack by default, which can cause chunk naming inconsistencies
2. Browser cache contains references to old chunks that no longer exist
3. Chunk IDs are not deterministic, causing different chunk names on each build

## Solution Applied

### 1. Use Webpack Instead of Turbopack
Updated `package.json` to use webpack for builds:
```json
"build": "next build --webpack"
```

### 2. Configure Deterministic Chunk IDs
Updated `next.config.ts` to use deterministic chunk and module IDs:
```typescript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
    };
  }
  return config;
}
```

## Additional Steps to Fix

### Clear All Caches
```bash
# Delete build cache
rm -rf .next
rm -rf node_modules/.cache

# Rebuild
npm run build
```

### Clear Browser Cache
1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Or clear browser cache completely
3. Or use incognito/private browsing mode

### If Error Persists
1. Check if you're running the correct build:
   ```bash
   npm run build
   npm run start  # Use 'start' not 'dev' for production
   ```

2. Ensure no stale processes:
   ```bash
   # Kill any running Next.js processes
   pkill -f "next"
   ```

3. Verify build output:
   ```bash
   ls -la .next/static/chunks/
   ```

## Why This Works
- `--webpack` flag forces Next.js to use webpack instead of Turbopack
- `deterministic` IDs ensure chunks have the same names across builds
- This prevents browser from looking for chunks with old names
