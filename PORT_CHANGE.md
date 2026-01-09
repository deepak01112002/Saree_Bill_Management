# ⚠️ IMPORTANT: Port Changed from 5000 to 5001

## The Problem
Port 5000 is being used by **Apple AirPlay** (AirTunes) on macOS, which is why you're getting 403 Forbidden errors. The requests aren't even reaching your Express server!

## The Solution
Changed the server port from **5000** to **5001**.

## What Changed

1. **Server port**: `5000` → `5001`
2. **Client API URL**: Updated to `http://localhost:5001/api`
3. **.env file**: Updated `PORT=5001`

## Next Steps

### 1. Restart the Server
**IMPORTANT**: You MUST restart the server for the port change to take effect!

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd server
npm run dev
```

You should now see:
```
🚀 Server running on http://localhost:5001
✅ MongoDB Connected
```

### 2. Update Client Environment (if needed)
If you have a `.env.local` file in the client folder, update it:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### 3. Test the Server
```bash
# Test health endpoint
curl http://localhost:5001/health

# Test registration
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'
```

### 4. Update Frontend
The frontend code has been updated automatically. Just restart your Next.js dev server if it's running:

```bash
cd client
npm run dev
```

## Why Port 5000?
On macOS, port 5000 is commonly used by:
- Apple AirPlay Receiver
- AirTunes
- Other Apple services

Using port 5001 (or any other port) avoids this conflict.

## Verify It's Working

After restarting:
1. Server should show: `🚀 Server running on http://localhost:5001`
2. Health check: `curl http://localhost:5001/health` should return `{"status":"OK"}`
3. Registration should work from frontend

---

**Restart the server now and try again!**


