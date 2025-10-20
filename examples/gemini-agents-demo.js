#!/usr/bin/env node
/**
 * Agentic Flow + Google Gemini Integration Demo
 * Demonstrates using all agent types with Gemini models
 */

const { execSync } = require('child_process');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🤖 Agentic Flow Agents + Google Gemini Demo                ║
║  Using GOOGLE_GEMINI_API_KEY Environment Variable           ║
╚══════════════════════════════════════════════════════════════╝
`);

// Check for API key
const hasGeminiKey = !!process.env.GOOGLE_GEMINI_API_KEY;
const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

console.log(`
🔑 API Key Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  GOOGLE_GEMINI_API_KEY:  ${hasGeminiKey ? '✅ Set' : '❌ Not set'}
  ANTHROPIC_API_KEY:       ${hasAnthropicKey ? '✅ Set' : '❌ Not set'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

if (!hasGeminiKey) {
    console.log(`
⚠️  To run this demo, you need a Google Gemini API key.

Get your free API key:
  1. Visit: https://ai.google.dev
  2. Click "Get API key in Google AI Studio"
  3. Create a new API key

Then set it:
  export GOOGLE_GEMINI_API_KEY='your-api-key-here'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

console.log(`
🎯 Available Agents with Gemini:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Core Development Agents:
   • coder           - Write clean, efficient code
   • reviewer        - Code review and quality assurance
   • tester          - Comprehensive testing specialist
   • researcher      - Deep research and information gathering
   • planner         - Strategic planning and task orchestration

🧠 Reasoning & Learning Agents:
   • adaptive-learner      - Learns from experience
   • pattern-matcher       - Recognizes cross-domain patterns
   • reasoning-optimized   - Meta-orchestrator for reasoning
   • memory-optimizer      - Memory consolidation specialist
   • context-synthesizer   - Multi-source context builder

🏗️ Architecture & Design:
   • system-architect      - System design and patterns
   • backend-dev          - Backend API development
   • mobile-dev           - React Native development
   • ml-developer         - Machine learning specialist

🔧 DevOps & Infrastructure:
   • cicd-engineer        - CI/CD pipeline specialist
   • production-validator - Production readiness checker

📚 Documentation & Analysis:
   • api-docs             - OpenAPI/Swagger documentation
   • code-analyzer        - Advanced code quality analysis

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log(`
💡 Gemini Model Selection Guide:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 gemini-2.0-flash-exp (Recommended for most tasks)
   └─ Ultra-fast, 1M context, multimodal
   └─ Best for: code generation, real-time agents
   └─ Cost: Ultra-low (free tier: 60 req/min)

⚡ gemini-1.5-flash (Speed-optimized)
   └─ Optimized latency, fast inference
   └─ Best for: quick tasks, simple queries
   └─ Cost: Very low

🧠 gemini-1.5-pro (Advanced reasoning)
   └─ 2M context window, superior reasoning
   └─ Best for: complex analysis, research
   └─ Cost: Low (still 10x cheaper than Claude Opus)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log(`
📋 Usage Examples:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Code Generation with Gemini Flash:

    export GOOGLE_GEMINI_API_KEY='your-key'
    npx agentic-flow \\
      --agent coder \\
      --provider gemini \\
      --model "gemini-2.0-flash-exp" \\
      --task "Build a REST API with Express and JWT auth"

2️⃣  Research with Gemini Pro (2M context):

    npx agentic-flow \\
      --agent researcher \\
      --provider gemini \\
      --model "gemini-1.5-pro" \\
      --task "Analyze QUIC protocol advantages over TCP"

3️⃣  Auto-optimization (router picks best model):

    npx agentic-flow \\
      --agent coder \\
      --provider gemini \\
      --optimize \\
      --task "Create a microservices deployment"

4️⃣  Streaming real-time output:

    npx agentic-flow \\
      --agent adaptive-learner \\
      --provider gemini \\
      --stream \\
      --task "Optimize database query performance"

5️⃣  Multiple agents in sequence:

    # Research
    npx agentic-flow --agent researcher --provider gemini \\
      --task "Research GraphQL best practices" > research.txt

    # Code based on research
    npx agentic-flow --agent coder --provider gemini \\
      --task "Implement GraphQL schema from research.txt"

    # Review the code
    npx agentic-flow --agent reviewer --provider gemini \\
      --task "Review GraphQL implementation"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log(`
🎨 Agent + Gemini Combinations (Recommended):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fast Code Tasks:
  Agent: coder, tester, reviewer
  Model: gemini-2.0-flash-exp
  Why: Ultra-fast inference, perfect for code

Research & Analysis:
  Agent: researcher, pattern-matcher, code-analyzer
  Model: gemini-1.5-pro
  Why: 2M context window for deep analysis

Architecture & Planning:
  Agent: system-architect, planner, backend-dev
  Model: gemini-1.5-pro
  Why: Complex reasoning capabilities

Learning & Adaptation:
  Agent: adaptive-learner, reasoning-optimized
  Model: gemini-2.0-flash-exp
  Why: Fast iteration for learning loops

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log(`
💰 Cost Comparison:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task: Generate 100 REST endpoints (100K tokens)

Claude Opus (Anthropic):
  └─ Cost: ~$15.00
  └─ Speed: ~60 seconds

Gemini 1.5 Pro (Google):
  └─ Cost: ~$1.50 (90% savings)
  └─ Speed: ~30 seconds (2x faster)

Gemini 2.0 Flash (Google):
  └─ Cost: ~$0.30 (98% savings)
  └─ Speed: ~10 seconds (6x faster)

FREE TIER: 60 requests/min, 1M tokens/min
  └─ Perfect for development & testing!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// If API key is set, run a quick demo
if (hasGeminiKey) {
    console.log(`
🚀 Running Live Demo with Gemini...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

    try {
        console.log('\n📝 Test 1: Coder Agent + Gemini Flash\n');
        execSync(
            'npx agentic-flow --agent coder --provider gemini --model "gemini-2.0-flash-exp" --task "Write a function to calculate Fibonacci numbers"',
            { stdio: 'inherit' }
        );

        console.log('\n\n🧠 Test 2: Researcher Agent + Gemini Pro\n');
        execSync(
            'npx agentic-flow --agent researcher --provider gemini --model "gemini-1.5-pro" --task "Explain the benefits of vector databases"',
            { stdio: 'inherit' }
        );

        console.log('\n\n✅ Demo Complete!\n');
    } catch (error) {
        console.error('Demo error:', error.message);
    }
}

console.log(`
🔗 Quick Reference:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Environment Variable:
  export GOOGLE_GEMINI_API_KEY='your-api-key'

Basic Command:
  npx agentic-flow --agent <agent> --provider gemini --task "..."

With Specific Model:
  npx agentic-flow --agent <agent> --provider gemini \\
    --model "gemini-2.0-flash-exp" --task "..."

List All Agents:
  npx agentic-flow --list

Get Help:
  npx agentic-flow --help
  npx agentic-flow --provider gemini --help

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log(`
📚 Resources:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🔑 Get API Key:     https://ai.google.dev
  💰 Pricing:         https://ai.google.dev/pricing
  📖 Documentation:   https://github.com/ruvnet/agentic-flow
  🎯 Model Docs:      https://ai.google.dev/models
  📊 Benchmarks:      60 req/min free, 1M tokens/min

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

╔══════════════════════════════════════════════════════════════╗
║  ${hasGeminiKey ? '✅ Ready to use Agentic Flow with Gemini!           ' : '⚠️  Set GOOGLE_GEMINI_API_KEY to get started         '}  ║
╚══════════════════════════════════════════════════════════════╝
`);
