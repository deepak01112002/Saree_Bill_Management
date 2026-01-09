# CORS Troubleshooting Guide

## Current Issue
CORS error: "No 'Access-Control-Allow-Origin' header is present"

## Solutions Applied

### 1. Enhanced CORS Configuration
- Added function-based origin checking
- Added manual OPTIONS handler as fallback
- Added more allowed headers

### 2. Manual OPTIONS Handler
Added explicit OPTIONS request handling before other middleware.

## Steps to Fix

### Step 1: Restart the Server
**IMPORTANT**: The server MUST be restarted for changes to take effect!

```bash
# Stop the server (Ctrl+C)
# Then restart:
cd server
npm run dev
```

### Step 2: Verify Server is Running
Check if server responds:
```bash
curl http://localhost:5000/health
```

Should return: `{"status":"OK","message":"Server is running"}`

### Step 3: Test CORS Headers
```bash
curl -X OPTIONS http://localhost:5000/api/auth/register \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

You should see `Access-Control-Allow-Origin: http://localhost:3000` in the response.

### Step 4: Check Browser Console
- Open browser DevTools (F12)
- Go to Network tab
- Try the request again
- Check the OPTIONS request (preflight)
- Look for CORS headers in the response

## Alternative: Temporary Development Fix

If still having issues, you can temporarily allow all origins (ONLY for development):

```typescript
// In server/src/index.ts - TEMPORARY
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200,
};
```

**⚠️ Never use `origin: true` in production!**

## Common Issues

### Issue 1: Server Not Running
**Symptom**: Connection refused or timeout
**Fix**: Start the server with `npm run dev`

### Issue 2: Server Not Restarted
**Symptom**: Old CORS config still active
**Fix**: Restart the server after making changes

### Issue 3: Wrong Port
**Symptom**: Requests going to wrong port
**Fix**: Verify server is on port 5000, client on 3000

### Issue 4: Browser Cache
**Symptom**: Old CORS errors persist
**Fix**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

## Verification Checklist

- [ ] Server is running on port 5000
- [ ] Server shows "🚀 Server running" message
- [ ] MongoDB is connected
- [ ] `.env` file has `CLIENT_URL=http://localhost:3000`
- [ ] Server was restarted after CORS changes
- [ ] Browser cache cleared
- [ ] Network tab shows OPTIONS request
- [ ] OPTIONS response has CORS headers

## Still Not Working?

1. Check server logs for errors
2. Verify the request URL is correct
3. Check if firewall is blocking
4. Try from a different browser
5. Check if proxy/VPN is interfering


