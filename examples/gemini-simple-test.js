#!/usr/bin/env node
/**
 * Simple Google Gemini Test
 * Quick demonstration of Gemini integration
 */

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🤖 Google Gemini Integration Demo                          ║
║  Using GOOGLE_GEMINI_API_KEY Environment Variable           ║
╚══════════════════════════════════════════════════════════════╝
`);

// Check environment variable
const hasGeminiKey = !!process.env.GOOGLE_GEMINI_API_KEY;

console.log(`
🔑 Environment Check:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  GOOGLE_GEMINI_API_KEY: ${hasGeminiKey ? '✓ Set' : '✗ Not set'}

${!hasGeminiKey ? `
❌ To use Google Gemini, set your API key:

  export GOOGLE_GEMINI_API_KEY='your-api-key-here'

Get your free API key at: https://ai.google.dev

` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log(`
📋 Supported Gemini Models:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Gemini 2.0 Flash (Experimental)
   Model: gemini-2.0-flash-exp
   • Ultra-fast multimodal model
   • 1M token context window
   • Best for: Real-time applications, code generation
   • Cost: Ultra-low (free tier available)

⚡ Gemini 1.5 Flash
   Model: gemini-1.5-flash
   • Optimized for speed
   • Fast inference, low latency
   • Best for: Quick tasks, simple queries
   • Cost: Very low

🧠 Gemini 1.5 Pro
   Model: gemini-1.5-pro
   • Advanced reasoning capabilities
   • 2M token context window
   • Best for: Complex analysis, long documents
   • Cost: Low

📚 Gemini 1.0 Pro
   Model: gemini-1.0-pro
   • Stable, general purpose
   • Production-ready
   • Best for: Standard tasks
   • Cost: Very low

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log(`
💡 Usage Examples:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Use with Agentic Flow CLI:

    npx agentic-flow \\
      --agent coder \\
      --provider gemini \\
      --model "gemini-1.5-flash" \\
      --task "Write a REST API endpoint"

2️⃣  Auto-optimization (router selects best Gemini model):

    export GOOGLE_GEMINI_API_KEY='your-key'
    npx agentic-flow \\
      --agent researcher \\
      --provider gemini \\
      --optimize

3️⃣  With streaming for real-time output:

    npx agentic-flow \\
      --agent coder \\
      --provider gemini \\
      --model "gemini-2.0-flash-exp" \\
      --stream \\
      --task "Build a web scraper"

4️⃣  Environment variable only (auto-detect):

    # Set API key
    export GOOGLE_GEMINI_API_KEY='your-key'

    # agentic-flow will auto-detect and use Gemini
    npx agentic-flow --agent coder --task "..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log(`
🎯 Quick Test Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Test Gemini Flash (fastest):
npx agentic-flow --agent coder --provider gemini \\
  --model "gemini-1.5-flash" \\
  --task "Write a function to reverse a string"

# Test Gemini Pro (smartest):
npx agentic-flow --agent researcher --provider gemini \\
  --model "gemini-1.5-pro" \\
  --task "Explain microservices architecture"

# Test Gemini 2.0 (latest):
npx agentic-flow --agent planner --provider gemini \\
  --model "gemini-2.0-flash-exp" \\
  --task "Create a CI/CD pipeline plan"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log(`
📊 Performance Benefits:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Cost Savings:
   • Gemini Flash: ~50x cheaper than GPT-4
   • Gemini Pro: ~10x cheaper than Claude Opus
   • Free tier: 60 requests/minute

✨ Speed:
   • Gemini 2.0 Flash: Ultra-fast inference
   • Gemini Flash: < 1 second latency
   • 1M-2M token context windows

✨ Capabilities:
   • Native multimodal support
   • Code generation & analysis
   • Long-context understanding
   • Function calling support

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log(`
🔗 Resources:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  📚 Google AI Studio:     https://ai.google.dev
  🔑 Get API Key:          https://ai.google.dev/tutorials/setup
  💰 Pricing:              https://ai.google.dev/pricing
  📖 Documentation:        https://github.com/ruvnet/agentic-flow
  🎯 Model Reference:      https://ai.google.dev/models

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

if (hasGeminiKey) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ✅ Ready to use Google Gemini!                             ║
║                                                              ║
║  Run: bash examples/test-gemini.sh                          ║
║  Or: npx agentic-flow --provider gemini --help              ║
╚══════════════════════════════════════════════════════════════╝
`);
} else {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ⚠️  Set GOOGLE_GEMINI_API_KEY to continue                  ║
║                                                              ║
║  export GOOGLE_GEMINI_API_KEY='your-key-here'               ║
║  node examples/gemini-simple-test.js                        ║
╚══════════════════════════════════════════════════════════════╝
`);
}
