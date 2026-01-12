# Production Deployment Fix - ChunkLoadError

## ⚠️ CRITICAL: Your production server needs to be rebuilt!

The error on `billing.casaexportsindia.com` is because the server is still running an **old Turbopack build**. 

## Quick Fix Steps

### 1. On Your Production Server

```bash
# SSH into your server
ssh user@your-server

# Navigate to your app
cd /path/to/Bill_Management/client

# Stop the application
pm2 stop all  # or: systemctl stop your-app

# Remove old build
rm -rf .next
rm -rf node_modules/.cache

# Pull latest code (if using git)
git pull

# Reinstall (to get .npmrc file)
npm install

# Build with webpack (VERY IMPORTANT!)
NODE_ENV=production npm run build

# Verify it says "webpack" not "Turbopack"
# Should see: ▲ Next.js 16.1.1 (webpack)

# Start the application
npm run start
# or: pm2 start npm --name "app" -- start
```

### 2. Verify Build is Correct

```bash
# Check for turbopack files (should find nothing)
grep -r "turbopack" .next/static/chunks/ 2>/dev/null
# Should return: No turbopack files found

# Check chunks exist
ls -la .next/static/chunks/*.js | wc -l
# Should show multiple chunk files
```

### 3. Clear CDN/Proxy Cache

If you're using:
- **Cloudflare**: Clear cache in dashboard
- **Vercel**: Redeploy or clear cache
- **Nginx**: Restart nginx
- **Apache**: Restart apache

### 4. Test in Browser

1. Open `https://billing.casaexportsindia.com` in **incognito/private mode**
2. Open DevTools → Network tab
3. Check if chunks load successfully (no 404 errors)
4. Look for files like: `main-app-*.js`, `1038-*.js` (webpack chunks)
5. Should NOT see: `turbopack-*.js` files

## Files Changed (Already Done Locally)

✅ `client/next.config.ts` - Added webpack config with deterministic IDs
✅ `client/package.json` - Build script uses `--webpack` flag  
✅ `client/.npmrc` - Forces webpack, disables Turbopack

## What Changed

1. **Build now uses webpack** instead of Turbopack
2. **Chunk IDs are deterministic** - same names across builds
3. **No more Turbopack files** in production build

## After Deployment

The error should be gone because:
- Production will use webpack chunks (stable names)
- No more Turbopack chunk references
- Browser cache will work correctly

## Still Getting Errors?

1. **Hard refresh browser**: `Ctrl+Shift+R` or `Cmd+Shift+R`
2. **Clear browser cache completely**
3. **Check server logs** for any errors
4. **Verify build output** shows "webpack" not "Turbopack"
5. **Wait a few minutes** for CDN cache to clear
