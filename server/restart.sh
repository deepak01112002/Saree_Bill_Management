#!/bin/bash

echo "🛑 Stopping server on port 5000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null
sleep 2

echo "🚀 Starting server..."
npm run dev


