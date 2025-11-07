#!/bin/bash

# Gemini Schema Validation Test Runner
# Runs validation in Docker container with real credentials

set -e

echo "═══════════════════════════════════════════════════════════"
echo "🐳 Gemini API Schema Validation - Docker Test"
echo "   Issue #55 Verification"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if .env file exists
if [ ! -f "/workspaces/agentic-flow/.env" ]; then
  echo "❌ Error: .env file not found in /workspaces/agentic-flow/"
  exit 1
fi

# Load environment variables
export $(grep -v '^#' /workspaces/agentic-flow/.env | xargs)

if [ -z "$GOOGLE_GEMINI_API_KEY" ]; then
  echo "❌ Error: GOOGLE_GEMINI_API_KEY not found in .env file"
  exit 1
fi

echo "✓ Environment variables loaded"
echo "✓ API Key: ${GOOGLE_GEMINI_API_KEY:0:10}...${GOOGLE_GEMINI_API_KEY: -4}"
echo ""

# Build and run test
echo "📦 Building test container..."
cd /workspaces/agentic-flow

# Create temporary Dockerfile for testing
cat > Dockerfile.gemini-test <<EOF
FROM node:20-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache curl

# Copy package files
COPY package.json package-lock.json* ./
COPY agentic-flow/package.json ./agentic-flow/

# Install dependencies
RUN npm install --legacy-peer-deps || npm install --force

# Copy source files
COPY agentic-flow/src ./agentic-flow/src
COPY agentic-flow/tsconfig.json ./agentic-flow/
COPY tests ./tests

# Build TypeScript
RUN npx tsc --project agentic-flow/tsconfig.json || echo "Build warnings ignored"

# Set environment
ENV NODE_ENV=test

CMD ["node", "--loader", "ts-node/esm", "tests/gemini-schema-validation.test.ts"]
EOF

echo "🔨 Building Docker image..."
docker build -t gemini-schema-test -f Dockerfile.gemini-test . 2>&1 | tail -20

echo ""
echo "🚀 Running validation tests..."
echo ""

docker run --rm \
  -e GOOGLE_GEMINI_API_KEY="$GOOGLE_GEMINI_API_KEY" \
  gemini-schema-test

RESULT=$?

# Cleanup
rm -f Dockerfile.gemini-test

echo ""
if [ $RESULT -eq 0 ]; then
  echo "═══════════════════════════════════════════════════════════"
  echo "✅ DOCKER TEST PASSED"
  echo "   Issue #55 fix verified in isolated Docker environment"
  echo "═══════════════════════════════════════════════════════════"
else
  echo "═══════════════════════════════════════════════════════════"
  echo "❌ DOCKER TEST FAILED"
  echo "   Please review the output above for details"
  echo "═══════════════════════════════════════════════════════════"
fi

exit $RESULT
