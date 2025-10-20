#!/bin/bash
###############################################################################
# Google Gemini Test Script
# Demonstrates using agentic-flow with Google Gemini via environment variable
###############################################################################

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🤖 Google Gemini Integration Test                          ║"
echo "║  Using GOOGLE_GEMINI_API_KEY environment variable           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if GOOGLE_GEMINI_API_KEY is set
if [ -z "$GOOGLE_GEMINI_API_KEY" ]; then
    echo "❌ Error: GOOGLE_GEMINI_API_KEY environment variable not set"
    echo ""
    echo "Please set your Google Gemini API key:"
    echo "  export GOOGLE_GEMINI_API_KEY='your-api-key-here'"
    echo ""
    echo "Get your API key from: https://ai.google.dev"
    exit 1
fi

echo "✅ GOOGLE_GEMINI_API_KEY is set"
echo ""

# Display available Gemini models
echo "📋 Available Gemini Models:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1. gemini-2.0-flash-exp"
echo "     └─ Ultra-fast, multimodal, 1M token context"
echo ""
echo "  2. gemini-1.5-pro"
echo "     └─ Advanced reasoning, 2M token context"
echo ""
echo "  3. gemini-1.5-flash"
echo "     └─ Fast inference, optimized latency"
echo ""
echo "  4. gemini-1.0-pro"
echo "     └─ Stable, general purpose"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Simple query with Gemini Flash (fastest)
echo "🧪 Test 1: Simple Code Generation with gemini-1.5-flash"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx agentic-flow \
    --agent coder \
    --task "Write a simple JavaScript function to calculate factorial" \
    --provider gemini \
    --model "gemini-1.5-flash" \
    --stream

echo ""
echo "✅ Test 1 Complete"
echo ""

# Test 2: Research task with Gemini Pro (more capable)
echo "🧪 Test 2: Research Task with gemini-1.5-pro"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx agentic-flow \
    --agent researcher \
    --task "Explain the benefits of QUIC protocol over TCP" \
    --provider gemini \
    --model "gemini-1.5-pro"

echo ""
echo "✅ Test 2 Complete"
echo ""

# Test 3: Using Gemini 2.0 Flash (experimental, latest)
echo "🧪 Test 3: Latest Model - gemini-2.0-flash-exp"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx agentic-flow \
    --agent planner \
    --task "Create a deployment plan for a microservices architecture" \
    --provider gemini \
    --model "gemini-2.0-flash-exp"

echo ""
echo "✅ Test 3 Complete"
echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ All Gemini Tests Complete!                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  ✓ Gemini Flash tested (fastest inference)"
echo "  ✓ Gemini Pro tested (advanced reasoning)"
echo "  ✓ Gemini 2.0 Flash tested (latest experimental)"
echo ""
echo "💡 Usage Tips:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  # Use Gemini with any agent:"
echo "  npx agentic-flow --agent <agent> --provider gemini --task \"...\""
echo ""
echo "  # Auto-select model based on task:"
echo "  npx agentic-flow --agent coder --provider gemini --optimize"
echo ""
echo "  # Cost comparison:"
echo "  - Gemini Flash: ~50x cheaper than GPT-4"
echo "  - Gemini Pro: ~10x cheaper than Claude Opus"
echo "  - Gemini 2.0: Ultra-fast + 1M context window"
echo ""
echo "🔗 Resources:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  • Get API Key: https://ai.google.dev"
echo "  • Pricing: https://ai.google.dev/pricing"
echo "  • Documentation: https://github.com/ruvnet/agentic-flow"
echo ""
