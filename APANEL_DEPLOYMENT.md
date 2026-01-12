# aPanel Deployment Fix - ChunkLoadError

## Problem
Production server at `billing.casaexportsindia.com` is still serving old Turbopack chunks:
- `551394954efcf6c6.js` - 404 Not Found
- `54a3f86ddb48746e.js` - 404 Not Found

These are old Turbopack chunk names that don't exist in the new webpack build.

## Solution: Rebuild Through aPanel

### Method 1: Using aPanel Terminal/SSH

1. **Login to aPanel**
   - Go to your aPanel dashboard
   - Navigate to **Terminal** or **SSH** section

2. **Navigate to your application**
   ```bash
   cd /path/to/your/website/client
   # Usually something like: /www/wwwroot/billing.casaexportsindia.com/client
   # or: /home/youruser/public_html/client
   ```

3. **Stop the application** (if running as a service)
   ```bash
   # Check if Next.js is running
   ps aux | grep next
   
   # If running, stop it
   pkill -f "next"
   ```

4. **Clear old build and cache**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   ```

5. **Pull latest code** (if using git)
   ```bash
   git pull origin main
   # or
   git pull origin master
   ```

6. **Ensure you have the updated files**
   ```bash
   # Verify these files exist and are updated:
   cat next.config.ts | grep webpack
   cat package.json | grep --webpack
   cat .npmrc
   ```

7. **Reinstall dependencies** (to get .npmrc)
   ```bash
   npm install
   ```

8. **Build with webpack**
   ```bash
   NODE_ENV=production npm run build
   ```

9. **VERIFY BUILD TYPE** (CRITICAL!)
   ```bash
   # Check build output - should see "webpack" not "Turbopack"
   # Look for: ▲ Next.js 16.1.1 (webpack)
   ```

10. **Verify no Turbopack files**
    ```bash
    # Should return nothing
    find .next/static/chunks -name "*turbopack*" 2>/dev/null
    ```

11. **Check chunks exist**
    ```bash
    ls -la .next/static/chunks/*.js | head -5
    # Should see webpack chunks like: main-app-*.js, 1038-*.js
    ```

12. **Restart your application**
    - If using aPanel's Node.js manager, restart it there
    - Or start manually:
    ```bash
    npm run start
    ```

### Method 2: Using aPanel File Manager + Terminal

1. **Upload updated files via aPanel File Manager**
   - Upload `next.config.ts` (updated)
   - Upload `package.json` (updated)
   - Upload `.npmrc` (new file)

2. **Use aPanel Terminal to rebuild**
   - Follow steps 3-12 from Method 1

### Method 3: Create a Deployment Script

Create a file `deploy.sh` in your client directory:

```bash
#!/bin/bash
echo "Starting deployment..."

# Stop any running processes
pkill -f "next" || true

# Clear old build
echo "Clearing old build..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "Installing dependencies..."
npm install

# Build with webpack
echo "Building with webpack..."
NODE_ENV=production npm run build

# Verify build
echo "Verifying build..."
if grep -q "webpack" <<< "$(npm run build 2>&1 | head -5)"; then
    echo "✓ Build uses webpack - Good!"
else
    echo "✗ Build might be using Turbopack - Check manually!"
fi

# Check for turbopack files
if find .next/static/chunks -name "*turbopack*" 2>/dev/null | grep -q .; then
    echo "✗ Found Turbopack files - Build failed!"
    exit 1
else
    echo "✓ No Turbopack files found - Build successful!"
fi

echo "Deployment complete! Restart your application."
```

Then run it:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Restart Application in aPanel

### If using aPanel's Node.js Manager:
1. Go to **Node.js** section in aPanel
2. Find your application
3. Click **Restart** or **Stop** then **Start**

### If using PM2 (via aPanel):
1. Go to **PM2** section
2. Find your app
3. Click **Restart**

### If using systemd service:
```bash
sudo systemctl restart your-app-name
```

### If running manually:
```bash
cd /path/to/client
npm run start
# Keep terminal open or run in background with nohup
nohup npm run start > app.log 2>&1 &
```

## Verify Deployment

1. **Check build output** - Should see webpack chunks:
   ```bash
   ls -la .next/static/chunks/ | head -10
   ```

2. **Test in browser** (incognito mode):
   - Go to `https://billing.casaexportsindia.com`
   - Open DevTools → Network tab
   - Refresh page
   - Check for 404 errors on chunk files
   - Should see chunks like: `main-app-*.js`, `1038-*.js`
   - Should NOT see: `turbopack-*.js` or old chunk names

3. **Check server logs**:
   ```bash
   # If using nohup
   tail -f app.log
   
   # Or check aPanel logs
   # Usually in: /www/wwwroot/your-site/logs/
   ```

## Files That Must Be Updated

Make sure these 3 files are on production:

1. **`client/next.config.ts`** - Contains webpack config
2. **`client/package.json`** - Build script has `--webpack` flag
3. **`client/.npmrc`** - Forces webpack usage

## Common Issues

### Issue: "npm: command not found"
**Fix**: Install Node.js through aPanel or use full path:
```bash
/usr/bin/npm run build
# or
/usr/local/bin/npm run build
```

### Issue: "Permission denied"
**Fix**: 
```bash
chmod -R 755 .next
chown -R youruser:youruser .next
```

### Issue: Build still uses Turbopack
**Fix**: 
1. Check `.npmrc` exists: `cat .npmrc`
2. Check `package.json` build script: `cat package.json | grep build`
3. Manually run: `next build --webpack`

### Issue: Chunks still 404 after rebuild
**Fix**:
1. Clear browser cache completely
2. Clear CDN cache (if using Cloudflare)
3. Wait 5-10 minutes for DNS/CDN propagation
4. Check `.next/static/chunks/` folder exists and has files

## Quick Checklist

- [ ] Stopped old application
- [ ] Deleted `.next` folder
- [ ] Updated `next.config.ts`, `package.json`, `.npmrc`
- [ ] Ran `npm install`
- [ ] Ran `npm run build` (verified it says "webpack")
- [ ] Verified no turbopack files in `.next/static/chunks/`
- [ ] Restarted application
- [ ] Tested in incognito browser
- [ ] No 404 errors on chunk files

## Still Not Working?

1. **Check file paths** - Make sure you're in the correct directory
2. **Check Node.js version** - Should be 18+:
   ```bash
   node -v
   ```
3. **Check build output** - Look for any errors during build
4. **Check file permissions** - `.next` folder should be readable
5. **Contact support** - Share build logs and error messages
