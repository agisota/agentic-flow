#!/bin/bash

#
# Publish Script for Agentic Playwright
#
# This script:
# 1. Runs tests to ensure quality
# 2. Builds the package
# 3. Publishes to npm (with optional dry-run)
# 4. Validates the published package
#

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Parse command line arguments
DRY_RUN=false
SKIP_TESTS=false
TAG="latest"

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --tag)
      TAG="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 [--dry-run] [--skip-tests] [--tag <tag>]"
      exit 1
      ;;
  esac
done

echo -e "${MAGENTA}🚀 Publishing Agentic Playwright${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Change to project root
cd "$PROJECT_ROOT"

# Get package info
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")

echo -e "${BLUE}📦 Package: $PACKAGE_NAME@$PACKAGE_VERSION${NC}"
echo -e "${BLUE}🏷️  Tag: $TAG${NC}"

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}⚠️  DRY RUN MODE - No actual publishing will occur${NC}"
fi

# Step 1: Run tests
if [ "$SKIP_TESTS" = false ]; then
  echo -e "${YELLOW}🧪 Running tests...${NC}"

  # Set environment variable to skip browser tests in CI
  export SKIP_BROWSER_TESTS=true

  if npm run test; then
    echo -e "${GREEN}✓ All tests passed${NC}"
  else
    echo -e "${RED}✗ Tests failed${NC}"
    echo -e "${RED}Cannot publish with failing tests${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  Skipping tests (--skip-tests flag)${NC}"
fi

# Step 2: Run linting (if available)
if npm run lint --if-present 2>/dev/null; then
  echo -e "${GREEN}✓ Linting passed${NC}"
fi

# Step 3: Build the package
echo -e "${YELLOW}🔨 Building package...${NC}"
if bash "$PROJECT_ROOT/scripts/build.sh"; then
  echo -e "${GREEN}✓ Build successful${NC}"
else
  echo -e "${RED}✗ Build failed${NC}"
  exit 1
fi

# Step 4: Verify package contents
echo -e "${YELLOW}🔍 Verifying package contents...${NC}"

# Check package.json exists
if [ ! -f "package.json" ]; then
  echo -e "${RED}✗ package.json not found${NC}"
  exit 1
fi

# Check required files exist
REQUIRED_FILES=(
  "dist/index.js"
  "dist/index.d.ts"
  "dist/mcp/server.js"
  "bin/cli.js"
  "README.md"
  "LICENSE"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓ $file${NC}"
  else
    echo -e "${RED}✗ Missing: $file${NC}"
    ((MISSING_FILES++))
  fi
done

if [ $MISSING_FILES -gt 0 ]; then
  echo -e "${RED}✗ $MISSING_FILES required files missing${NC}"
  exit 1
fi

# Step 5: Show what will be published
echo -e "${YELLOW}📋 Package contents:${NC}"
npm pack --dry-run 2>&1 | grep -E "^\s+(npm notice|package size)" || true

# Step 6: Publish to npm
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}📦 Running npm publish --dry-run...${NC}"
  npm publish --dry-run --tag "$TAG"
  echo -e "${GREEN}✓ Dry run completed successfully${NC}"
  echo -e "${BLUE}ℹ️  To publish for real, run without --dry-run${NC}"
else
  echo -e "${YELLOW}📦 Publishing to npm...${NC}"

  # Check if user is logged in
  if ! npm whoami &>/dev/null; then
    echo -e "${RED}✗ Not logged in to npm${NC}"
    echo -e "${YELLOW}Please run 'npm login' first${NC}"
    exit 1
  fi

  echo -e "${YELLOW}Publishing $PACKAGE_NAME@$PACKAGE_VERSION with tag '$TAG'${NC}"
  read -p "Continue? (y/N) " -n 1 -r
  echo

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if npm publish --tag "$TAG"; then
      echo -e "${GREEN}✅ Published successfully!${NC}"
      echo -e "${GREEN}📦 Package: $PACKAGE_NAME@$PACKAGE_VERSION${NC}"
      echo -e "${GREEN}🔗 https://www.npmjs.com/package/$PACKAGE_NAME${NC}"

      # Step 7: Verify the published package
      echo -e "${YELLOW}🔍 Verifying published package...${NC}"
      sleep 5  # Wait for npm registry to update

      if npm view "$PACKAGE_NAME@$PACKAGE_VERSION" version &>/dev/null; then
        echo -e "${GREEN}✓ Package verified on npm registry${NC}"
      else
        echo -e "${YELLOW}⚠️  Package not yet visible on registry (may take a few moments)${NC}"
      fi

      # Show install command
      echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      echo -e "${GREEN}To install:${NC}"
      echo -e "${GREEN}npm install $PACKAGE_NAME${NC}"
      echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    else
      echo -e "${RED}✗ Publish failed${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}Publish cancelled${NC}"
    exit 0
  fi
fi

echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All done!${NC}"
