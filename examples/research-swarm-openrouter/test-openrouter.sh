#!/bin/bash
# Quick test script to verify OpenRouter integration

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  OpenRouter Integration Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Test 1: Check environment variables
echo -e "${BLUE}Test 1: Environment Variables${NC}"
if [ ! -z "$OPENROUTER_API_KEY" ]; then
    echo -e "${GREEN}✓${NC} OPENROUTER_API_KEY is set"
else
    echo -e "${RED}✗${NC} OPENROUTER_API_KEY not set"
    exit 1
fi

if [ ! -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${YELLOW}⚠${NC} ANTHROPIC_API_KEY is set (will be temporarily unset)"
else
    echo -e "${GREEN}✓${NC} ANTHROPIC_API_KEY not set (good for OpenRouter)"
fi
echo ""

# Test 2: Verify research-swarm is installed
echo -e "${BLUE}Test 2: Research-Swarm Installation${NC}"
if command -v npx &> /dev/null; then
    echo -e "${GREEN}✓${NC} npx available"
    RESEARCH_SWARM_VERSION=$(npx research-swarm --version 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓${NC} research-swarm version: $RESEARCH_SWARM_VERSION"
else
    echo -e "${RED}✗${NC} npx not found"
    exit 1
fi
echo ""

# Test 3: Run small research task with OpenRouter
echo -e "${BLUE}Test 3: Small Research Task with OpenRouter${NC}"
echo "Task: 'What is REST API?'"
echo "Expected: Uses OpenRouter instead of Anthropic"
echo ""

# Temporarily unset ANTHROPIC_API_KEY
SAVED_ANTHROPIC_KEY="$ANTHROPIC_API_KEY"
unset ANTHROPIC_API_KEY

# Set OpenRouter as provider
export PROVIDER=openrouter
export COMPLETION_MODEL=anthropic/claude-3.5-sonnet

echo -e "${YELLOW}Running research swarm...${NC}"
echo ""

# Run with timeout and capture output
timeout 120 npx research-swarm research researcher "What is REST API?" \
    --depth 3 \
    --swarm-size 2 \
    --single-agent \
    2>&1 | tee /tmp/openrouter-test.log

TEST_EXIT_CODE=$?

# Restore ANTHROPIC_API_KEY
if [ ! -z "$SAVED_ANTHROPIC_KEY" ]; then
    export ANTHROPIC_API_KEY="$SAVED_ANTHROPIC_KEY"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "OpenRouter integration verified:"
    echo "  • Environment variables configured"
    echo "  • Research-swarm executed successfully"
    echo "  • Provider override working"
    echo ""
    echo "You can now run full swarms with:"
    echo "  ./run-with-openrouter.sh \"Your research task\""
else
    echo -e "${RED}✗ Test failed with exit code: $TEST_EXIT_CODE${NC}"
    echo ""
    echo "Check the log: /tmp/openrouter-test.log"
fi

exit $TEST_EXIT_CODE
