#!/bin/bash
# Research Swarm with OpenRouter - Fixed Provider Selection
# This script ensures OpenRouter is used instead of Anthropic

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Research Swarm with OpenRouter (Fixed)           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if OpenRouter API key is set
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo -e "${RED}❌ Error: OPENROUTER_API_KEY not set${NC}"
    echo ""
    echo "Please set your OpenRouter API key:"
    echo "  export OPENROUTER_API_KEY='sk-or-v1-...'"
    echo ""
    exit 1
fi

# Configuration
TASK="${1:-Analyze the benefits and challenges of multi-agent AI systems}"
DEPTH="${2:-5}"
SWARM_SIZE="${3:-4}"

echo -e "${GREEN}✓${NC} OpenRouter API key detected"
echo ""
echo -e "${BLUE}Configuration:${NC}"
echo "  Task: $TASK"
echo "  Depth: $DEPTH"
echo "  Swarm Size: $SWARM_SIZE"
echo "  Provider: OpenRouter (forced)"
echo ""

# CRITICAL FIX: Temporarily unset ANTHROPIC_API_KEY
# This forces agentic-flow to use OpenRouter since Anthropic won't be available
if [ ! -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Temporarily unsetting ANTHROPIC_API_KEY to force OpenRouter${NC}"
    SAVED_ANTHROPIC_KEY="$ANTHROPIC_API_KEY"
    unset ANTHROPIC_API_KEY
fi

# Set provider explicitly
export PROVIDER=openrouter
export COMPLETION_MODEL=anthropic/claude-3.5-sonnet

echo -e "${GREEN}🚀 Starting research swarm with OpenRouter...${NC}"
echo ""

# Run research-swarm with proper configuration
npx research-swarm research researcher "$TASK" \
    --depth "$DEPTH" \
    --swarm-size "$SWARM_SIZE" \
    --verbose

EXIT_CODE=$?

# Restore ANTHROPIC_API_KEY if it was set
if [ ! -z "$SAVED_ANTHROPIC_KEY" ]; then
    export ANTHROPIC_API_KEY="$SAVED_ANTHROPIC_KEY"
fi

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  Research completed successfully with OpenRouter!  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
else
    echo ""
    echo -e "${RED}❌ Research failed with exit code: $EXIT_CODE${NC}"
fi

exit $EXIT_CODE
