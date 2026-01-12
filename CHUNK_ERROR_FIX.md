# ChunkLoadError Fix Guide - Complete Solution

## Problem
After building Next.js application, you get errors like:
```
Failed to load resource: the server responded with a status of 404 (Not Found)
ChunkLoadError: Failed to load chunk /_next/static/chunks/551394954efcf6c6.js
turbopack-9789d9e430abfef3.js:1 Uncaught ChunkLoadError
```

## Root Cause
This error occurs when:
1. Next.js 16 uses Turbopack by default, which can cause chunk naming inconsistencies
2. Browser cache contains references to old chunks that no longer exist
3. Production server is serving old Turbopack build instead of new webpack build
4. Chunk IDs are not deterministic, causing different chunk names on each build

## Complete Solution Applied

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
      splitChunks: {
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
}
```

### 3. Force Webpack via Environment
Created `.npmrc` file to prevent Turbopack:
```
NEXT_PRIVATE_SKIP_TURBO=1
```

## Deployment Steps (CRITICAL)

### For Production Server (billing.casaexportsindia.com)

1. **SSH into your production server**

2. **Stop the running application**
   ```bash
   pm2 stop all  # or however you're running it
   # or
   systemctl stop your-app-service
   ```

3. **Navigate to your application directory**
   ```bash
   cd /path/to/your/app/client
   ```

4. **Pull latest code** (if using git)
   ```bash
   git pull origin main
   ```

5. **Clear all caches and old builds**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   rm -rf node_modules
   ```

6. **Reinstall dependencies**
   ```bash
   npm install
   ```

7. **Build with webpack** (VERY IMPORTANT)
   ```bash
   NODE_ENV=production npm run build
   ```
   
   **Verify it says "webpack" not "Turbopack":**
   ```
   ▲ Next.js 16.1.1 (webpack)  ← Should say webpack!
   ```

8. **Verify build output**
   ```bash
   ls -la .next/static/chunks/ | head -10
   # Should see webpack chunks, NOT turbopack files
   ```

9. **Restart application**
   ```bash
   npm run start
   # or
   pm2 start npm --name "app" -- start
   ```

10. **Clear CDN/Proxy Cache** (if using Cloudflare, Vercel, etc.)
    - Clear cache in your CDN dashboard
    - Or wait for cache to expire

## Local Testing Steps

### Clear All Caches
```bash
cd client
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules
npm install
npm run build
npm run start
```

### Clear Browser Cache
1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Or clear browser cache completely
3. Or use incognito/private browsing mode
4. **Clear Service Workers** (if any):
   - Open DevTools → Application → Service Workers → Unregister

### Verify Build Type
After building, check the console output:
```
▲ Next.js 16.1.1 (webpack)  ← Should say webpack!
```

If it says "Turbopack", the build is wrong!

## Troubleshooting

### If Error Persists After Deployment

1. **Check if old build is still running:**
   ```bash
   # On production server
   ps aux | grep next
   # Kill old processes
   pkill -f "next"
   ```

2. **Verify build was done correctly:**
   ```bash
   # Check build output
   cat .next/BUILD_ID
   ls -la .next/static/chunks/ | grep -i turbopack
   # Should return nothing (no turbopack files)
   ```

3. **Check server logs:**
   ```bash
   # Look for any errors during build or startup
   tail -f /var/log/your-app.log
   ```

4. **Verify all files uploaded:**
   ```bash
   # Make sure .next folder is complete
   du -sh .next
   # Should be several MB
   ```

5. **Check nginx/apache config** (if using):
   ```nginx
   # Make sure static files are served correctly
   location /_next/static {
     alias /path/to/app/.next/static;
     expires 1y;
     add_header Cache-Control "public, immutable";
   }
   ```

## Why This Works
- `--webpack` flag forces Next.js to use webpack instead of Turbopack
- `deterministic` IDs ensure chunks have the same names across builds
- `.npmrc` prevents Turbopack from being used
- Proper deployment ensures production uses webpack build

## Important Notes
- **ALWAYS** use `npm run build` (which includes `--webpack` flag)
- **NEVER** deploy a Turbopack build to production
- **ALWAYS** clear caches before rebuilding
- **VERIFY** build output says "webpack" not "Turbopack"
