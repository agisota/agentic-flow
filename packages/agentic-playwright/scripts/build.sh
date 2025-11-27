#!/bin/bash

#
# Build Script for Agentic Playwright
#
# This script:
# 1. Cleans the dist directory
# 2. Compiles TypeScript to JavaScript
# 3. Sets executable permissions on CLI
# 4. Validates the build output
#

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}🔨 Building Agentic Playwright${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Change to project root
cd "$PROJECT_ROOT"

# Step 1: Clean dist directory
echo -e "${YELLOW}📦 Cleaning dist directory...${NC}"
if [ -d "dist" ]; then
  rm -rf dist
  echo -e "${GREEN}✓ Cleaned dist directory${NC}"
else
  echo -e "${GREEN}✓ No dist directory to clean${NC}"
fi

# Step 2: Run TypeScript compiler
echo -e "${YELLOW}🔧 Compiling TypeScript...${NC}"
if [ -f "config/tsconfig.json" ]; then
  npx tsc -p config/tsconfig.json
  echo -e "${GREEN}✓ TypeScript compilation complete${NC}"
elif [ -f "tsconfig.json" ]; then
  npx tsc
  echo -e "${GREEN}✓ TypeScript compilation complete${NC}"
else
  echo -e "${RED}✗ No tsconfig.json found${NC}"
  exit 1
fi

# Step 3: Set executable permissions on CLI
echo -e "${YELLOW}🔐 Setting executable permissions...${NC}"
if [ -f "bin/cli.js" ]; then
  chmod +x bin/cli.js
  echo -e "${GREEN}✓ Set executable permissions on bin/cli.js${NC}"
else
  echo -e "${YELLOW}⚠ Warning: bin/cli.js not found, skipping chmod${NC}"
fi

if [ -f "dist/cli.js" ]; then
  chmod +x dist/cli.js
  echo -e "${GREEN}✓ Set executable permissions on dist/cli.js${NC}"
fi

# Step 4: Validate build output
echo -e "${YELLOW}🔍 Validating build output...${NC}"

validate_file() {
  local file=$1
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓ $file${NC}"
    return 0
  else
    echo -e "${RED}✗ Missing: $file${NC}"
    return 1
  fi
}

# Required files
VALIDATION_ERRORS=0

# Check for key output files
validate_file "dist/index.js" || ((VALIDATION_ERRORS++))
validate_file "dist/index.d.ts" || ((VALIDATION_ERRORS++))
validate_file "dist/mcp/server.js" || ((VALIDATION_ERRORS++))
validate_file "dist/mcp/server.d.ts" || ((VALIDATION_ERRORS++))
validate_file "dist/cli.js" || ((VALIDATION_ERRORS++))

# Check for components
if [ -d "dist/components" ]; then
  echo -e "${GREEN}✓ dist/components/${NC}"
else
  echo -e "${RED}✗ Missing: dist/components/${NC}"
  ((VALIDATION_ERRORS++))
fi

# Check for tools
if [ -d "dist/tools" ]; then
  echo -e "${GREEN}✓ dist/tools/${NC}"
else
  echo -e "${RED}✗ Missing: dist/tools/${NC}"
  ((VALIDATION_ERRORS++))
fi

# Check for utils
if [ -d "dist/utils" ]; then
  echo -e "${GREEN}✓ dist/utils/${NC}"
else
  echo -e "${RED}✗ Missing: dist/utils/${NC}"
  ((VALIDATION_ERRORS++))
fi

# Final status
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $VALIDATION_ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Build completed successfully!${NC}"
  echo -e "${GREEN}📦 Output: dist/${NC}"
  echo -e "${GREEN}🚀 Ready to publish${NC}"
  exit 0
else
  echo -e "${RED}❌ Build completed with $VALIDATION_ERRORS validation errors${NC}"
  echo -e "${RED}Please fix the errors and try again${NC}"
  exit 1
fi
