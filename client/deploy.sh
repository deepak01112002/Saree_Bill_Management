#!/bin/bash

# Deployment script for aPanel
# This script rebuilds the Next.js app with webpack to fix ChunkLoadError

set -e  # Exit on error

echo "=========================================="
echo "Next.js Webpack Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the client directory.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Stopping any running Next.js processes...${NC}"
pkill -f "next" || echo "No running processes found (this is OK)"

echo -e "${YELLOW}Step 2: Clearing old build and cache...${NC}"
rm -rf .next
rm -rf node_modules/.cache
echo -e "${GREEN}✓ Cleared${NC}"

echo -e "${YELLOW}Step 3: Verifying required files...${NC}"
if [ ! -f "next.config.ts" ]; then
    echo -e "${RED}✗ next.config.ts not found!${NC}"
    exit 1
fi
if [ ! -f ".npmrc" ]; then
    echo -e "${RED}✗ .npmrc not found! Creating it...${NC}"
    echo "NEXT_PRIVATE_SKIP_TURBO=1" > .npmrc
fi
echo -e "${GREEN}✓ Files verified${NC}"

echo -e "${YELLOW}Step 4: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo -e "${YELLOW}Step 5: Building with webpack...${NC}"
echo "This may take a few minutes..."
NODE_ENV=production npm run build 2>&1 | tee build.log

echo ""
echo -e "${YELLOW}Step 6: Verifying build type...${NC}"
if grep -q "webpack" build.log; then
    echo -e "${GREEN}✓ Build is using webpack (correct)${NC}"
else
    echo -e "${RED}✗ WARNING: Build might not be using webpack!${NC}"
    echo "Check build.log for details"
fi

echo -e "${YELLOW}Step 7: Checking for Turbopack files...${NC}"
if find .next/static/chunks -name "*turbopack*" 2>/dev/null | grep -q .; then
    echo -e "${RED}✗ ERROR: Found Turbopack files! Build failed!${NC}"
    exit 1
else
    echo -e "${GREEN}✓ No Turbopack files found (good)${NC}"
fi

echo -e "${YELLOW}Step 8: Verifying chunks were created...${NC}"
CHUNK_COUNT=$(ls -1 .next/static/chunks/*.js 2>/dev/null | wc -l)
if [ "$CHUNK_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $CHUNK_COUNT chunk files${NC}"
    echo "Sample chunks:"
    ls -1 .next/static/chunks/*.js 2>/dev/null | head -5
else
    echo -e "${RED}✗ ERROR: No chunk files found!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Build Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Restart your application in aPanel"
echo "2. Clear browser cache or test in incognito mode"
echo "3. Visit https://billing.casaexportsindia.com"
echo "4. Check browser console for any errors"
echo ""
echo "If you see 404 errors, wait 5-10 minutes for CDN cache to clear."
echo ""
