# ⚠️ IMPORTANT: Restart Server After CORS Changes

## The Problem
CORS errors persist because **the server needs to be restarted** for changes to take effect.

## How to Restart

### Option 1: If using nodemon (auto-restart)
Nodemon should auto-restart, but if it doesn't:
1. Save the file (if not auto-saved)
2. Wait a few seconds
3. Check terminal for restart message

### Option 2: Manual Restart
1. **Find the terminal running the server**
2. **Press `Ctrl+C`** to stop it
3. **Run again:**
   ```bash
   cd server
   npm run dev
   ```

### Option 3: Kill and Restart
If server is stuck:
```bash
# Kill the process
lsof -ti:5000 | xargs kill -9

# Restart
cd server
npm run dev
```

## Verify Server is Running
After restart, you should see:
```
🚀 Server running on http://localhost:5000
✅ MongoDB Connected
```

## Test CORS
```bash
curl -X OPTIONS http://localhost:5000/api/auth/register \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

You should see `Access-Control-Allow-Origin: http://localhost:3000` in headers.

## Still Not Working?
1. Check server logs for errors
2. Verify port 5000 is not blocked
3. Try clearing browser cache
4. Check if another process is using port 5000


