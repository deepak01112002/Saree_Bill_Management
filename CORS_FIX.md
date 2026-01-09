# CORS Error Fix

## Problem
The frontend (localhost:3000) was blocked from accessing the backend (localhost:5000) due to CORS policy.

## Solution Applied
Updated the CORS configuration in `server/src/index.ts` to:
1. Explicitly allow all necessary HTTP methods
2. Handle preflight (OPTIONS) requests
3. Allow Authorization header for JWT tokens

## What Changed
- Added explicit `methods` array: `['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']`
- Added `allowedHeaders`: `['Content-Type', 'Authorization']`
- Added explicit OPTIONS handler: `app.options('*', cors(corsOptions))`

## Next Steps

### 1. Restart the Server
The server needs to be restarted for changes to take effect:

```bash
# Stop the current server (Ctrl+C in the terminal running the server)
# Then restart:
cd server
npm run dev
```

### 2. Verify Server is Running
Check if server is accessible:
```bash
curl http://localhost:5000/health
```

Should return: `{"status":"OK","message":"Server is running"}`

### 3. Test from Frontend
Try registering a user again from the frontend.

## If Still Getting CORS Error

1. **Check if server is running:**
   ```bash
   lsof -i :5000
   ```

2. **Check .env file:**
   Make sure `CLIENT_URL=http://localhost:3000` is set in `server/.env`

3. **Clear browser cache:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

4. **Check browser console:**
   - Look for any other errors
   - Verify the request is going to the right URL

## Alternative: Allow All Origins (Development Only)

If you still have issues, you can temporarily allow all origins (ONLY for development):

```typescript
// In server/src/index.ts - TEMPORARY FIX FOR DEVELOPMENT
const corsOptions = {
  origin: true, // Allow all origins (NOT for production!)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

**⚠️ Never use this in production!**


