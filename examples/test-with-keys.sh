#!/bin/bash
###############################################################################
# Agentic Flow API Key Test Script
# Demonstrates using agentic-flow with different providers
###############################################################################

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🔑 Agentic Flow API Key Test Suite                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check which API keys are set
echo "🔍 Checking API Keys..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

HAS_ANTHROPIC=false
HAS_OPENROUTER=false
HAS_GEMINI=false

if [ ! -z "$ANTHROPIC_API_KEY" ]; then
    echo "✅ ANTHROPIC_API_KEY is set"
    HAS_ANTHROPIC=true
else
    echo "❌ ANTHROPIC_API_KEY not set"
fi

if [ ! -z "$OPENROUTER_API_KEY" ]; then
    echo "✅ OPENROUTER_API_KEY is set"
    HAS_OPENROUTER=true
else
    echo "❌ OPENROUTER_API_KEY not set"
fi

if [ ! -z "$GOOGLE_GEMINI_API_KEY" ]; then
    echo "✅ GOOGLE_GEMINI_API_KEY is set"
    HAS_GEMINI=true
else
    echo "❌ GOOGLE_GEMINI_API_KEY not set"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Count available providers
PROVIDER_COUNT=0
if [ "$HAS_ANTHROPIC" = true ]; then ((PROVIDER_COUNT++)); fi
if [ "$HAS_OPENROUTER" = true ]; then ((PROVIDER_COUNT++)); fi
if [ "$HAS_GEMINI" = true ]; then ((PROVIDER_COUNT++)); fi

if [ $PROVIDER_COUNT -eq 0 ]; then
    echo "⚠️  No API keys found!"
    echo ""
    echo "To use agentic-flow, set at least one API key:"
    echo ""
    echo "Option 1: Google Gemini (FREE tier)"
    echo "  Visit: https://ai.google.dev"
    echo "  export GOOGLE_GEMINI_API_KEY='your-key'"
    echo ""
    echo "Option 2: OpenRouter (100+ models, \$0.50 free)"
    echo "  Visit: https://openrouter.ai"
    echo "  export OPENROUTER_API_KEY='sk-or-v1-...'"
    echo ""
    echo "Option 3: Anthropic Claude"
    echo "  Visit: https://console.anthropic.com"
    echo "  export ANTHROPIC_API_KEY='sk-ant-...'"
    echo ""
    exit 1
fi

echo "✅ Found $PROVIDER_COUNT provider(s) configured"
echo ""

# Run tests based on available providers
echo "🧪 Running Tests..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TEST_TASK="Write a simple JavaScript function to add two numbers"

# Test 1: Google Gemini
if [ "$HAS_GEMINI" = true ]; then
    echo "Test 1: Google Gemini (gemini-2.0-flash-exp)"
    echo "─────────────────────────────────────────────────────────────"
    echo "Task: $TEST_TASK"
    echo ""

    npx agentic-flow \
        --agent coder \
        --provider gemini \
        --model "gemini-2.0-flash-exp" \
        --task "$TEST_TASK" \
        --output text

    echo ""
    echo "✅ Gemini test complete"
    echo ""
fi

# Test 2: OpenRouter with FREE model
if [ "$HAS_OPENROUTER" = true ]; then
    echo "Test 2: OpenRouter (Llama 3.1 8B - FREE)"
    echo "─────────────────────────────────────────────────────────────"
    echo "Task: $TEST_TASK"
    echo ""

    npx agentic-flow \
        --agent coder \
        --provider openrouter \
        --model "meta-llama/llama-3.1-8b-instruct:free" \
        --task "$TEST_TASK" \
        --output text

    echo ""
    echo "✅ OpenRouter FREE model test complete"
    echo ""

    # Test 3: OpenRouter with DeepSeek (ultra-cheap)
    echo "Test 3: OpenRouter (DeepSeek - Ultra-cheap)"
    echo "─────────────────────────────────────────────────────────────"
    echo "Task: $TEST_TASK"
    echo ""

    npx agentic-flow \
        --agent coder \
        --provider openrouter \
        --model "deepseek/deepseek-chat" \
        --task "$TEST_TASK" \
        --output text

    echo ""
    echo "✅ OpenRouter DeepSeek test complete"
    echo ""
fi

# Test 4: Anthropic Claude
if [ "$HAS_ANTHROPIC" = true ]; then
    echo "Test 4: Anthropic Claude (Sonnet 3.5)"
    echo "─────────────────────────────────────────────────────────────"
    echo "Task: $TEST_TASK"
    echo ""

    npx agentic-flow \
        --agent coder \
        --provider anthropic \
        --model "claude-3-5-sonnet-20241022" \
        --task "$TEST_TASK" \
        --output text

    echo ""
    echo "✅ Anthropic test complete"
    echo ""
fi

# Test 5: Auto-optimization (if OpenRouter available)
if [ "$HAS_OPENROUTER" = true ]; then
    echo "Test 5: Auto-Optimization (Router picks best model)"
    echo "─────────────────────────────────────────────────────────────"
    echo "Task: $TEST_TASK"
    echo ""

    npx agentic-flow \
        --agent coder \
        --provider openrouter \
        --optimize \
        --priority cost \
        --max-cost 0.001 \
        --task "$TEST_TASK" \
        --output text

    echo ""
    echo "✅ Auto-optimization test complete"
    echo ""
fi

# Summary
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ All Tests Complete!                                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$HAS_GEMINI" = true ]; then
    echo "  ✓ Gemini tested (gemini-2.0-flash-exp)"
fi

if [ "$HAS_OPENROUTER" = true ]; then
    echo "  ✓ OpenRouter FREE model tested (Llama 3.1 8B)"
    echo "  ✓ OpenRouter DeepSeek tested (ultra-cheap)"
    echo "  ✓ Auto-optimization tested"
fi

if [ "$HAS_ANTHROPIC" = true ]; then
    echo "  ✓ Anthropic Claude tested (Sonnet 3.5)"
fi

echo ""
echo "💡 Usage Tips:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  # Basic usage with any provider:"
echo "  npx agentic-flow --agent <agent> --provider <provider> --task \"...\""
echo ""
echo "  # With specific model:"
echo "  npx agentic-flow --agent coder --provider gemini \\"
echo "    --model \"gemini-2.0-flash-exp\" --task \"...\""
echo ""
echo "  # With auto-optimization:"
echo "  npx agentic-flow --agent coder --provider openrouter \\"
echo "    --optimize --priority cost --task \"...\""
echo ""
echo "  # With streaming output:"
echo "  npx agentic-flow --agent researcher --provider gemini \\"
echo "    --stream --task \"...\""
echo ""
echo "🔗 Resources:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  • Complete Guide: docs/MULTI-PROVIDER-GUIDE.md"
echo "  • Gemini Demo: node examples/gemini-simple-test.js"
echo "  • OpenRouter Demo: node examples/openrouter-demo.js"
echo "  • All Agents: npx agentic-flow --list"
echo ""
