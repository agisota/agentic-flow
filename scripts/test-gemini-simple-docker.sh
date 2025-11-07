#!/bin/bash

# Simple Docker test for Gemini schema validation

set -e

echo "═══════════════════════════════════════════════════════════"
echo "🐳 Gemini API Schema Validation - Docker Test"
echo "   Issue #55 Verification (Simplified)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Get API key from .env
if [ ! -f "/workspaces/agentic-flow/.env" ]; then
  echo "❌ Error: .env file not found"
  exit 1
fi

GEMINI_KEY=$(grep GOOGLE_GEMINI_API_KEY /workspaces/agentic-flow/.env | cut -d '=' -f2)

if [ -z "$GEMINI_KEY" ]; then
  echo "❌ Error: GOOGLE_GEMINI_API_KEY not found in .env"
  exit 1
fi

echo "✓ API Key loaded: ${GEMINI_KEY:0:10}...${GEMINI_KEY: -4}"
echo ""

# Create Dockerfile
cat > /tmp/Dockerfile.gemini-test <<'EOF'
FROM node:20-alpine

WORKDIR /app

# Copy test script
COPY quick-gemini-test.js .

CMD ["node", "quick-gemini-test.js"]
EOF

echo "📦 Building Docker image..."
cd /workspaces/agentic-flow
docker build -t gemini-test -f /tmp/Dockerfile.gemini-test scripts/ 2>&1 | tail -5

echo ""
echo "🚀 Running validation tests in Docker..."
echo ""

docker run --rm \
  -e GOOGLE_GEMINI_API_KEY="$GEMINI_KEY" \
  gemini-test

RESULT=$?

# Cleanup
rm -f /tmp/Dockerfile.gemini-test

echo ""
if [ $RESULT -eq 0 ]; then
  echo "═══════════════════════════════════════════════════════════"
  echo "✅ DOCKER TEST PASSED"
  echo "   Issue #55 fix verified in isolated Docker environment"
  echo "═══════════════════════════════════════════════════════════"
else
  echo "═══════════════════════════════════════════════════════════"
  echo "❌ DOCKER TEST FAILED"
  echo "═══════════════════════════════════════════════════════════"
fi

exit $RESULT
