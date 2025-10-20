#!/usr/bin/env node
/**
 * OpenRouter Integration Demo
 * Access 100+ AI models through agentic-flow
 */

const { execSync } = require('child_process');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🌐 OpenRouter Integration Demo                             ║
║  Access 100+ AI Models via OPENROUTER_API_KEY               ║
╚══════════════════════════════════════════════════════════════╝
`);

// Check for API key
const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
const hasGemini = !!process.env.GOOGLE_GEMINI_API_KEY;

console.log(`
🔑 API Key Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  OPENROUTER_API_KEY:      ${hasOpenRouter ? '✅ Set' : '❌ Not set'}
  ANTHROPIC_API_KEY:        ${hasAnthropic ? '✅ Set' : '❌ Not set'}
  GOOGLE_GEMINI_API_KEY:    ${hasGemini ? '✅ Set' : '❌ Not set'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

if (!hasOpenRouter) {
    console.log(`
⚠️  OpenRouter API Key Not Set

Get your free OpenRouter API key:
  1. Visit: https://openrouter.ai
  2. Sign up with Google/GitHub
  3. Get your API key from dashboard
  4. Free tier: $0.50 credit to start

Then set it:
  export OPENROUTER_API_KEY='sk-or-v1-...'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

console.log(`
🎯 Top AI Models via OpenRouter:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💎 Premium Models:

  anthropic/claude-3.5-sonnet
    └─ Best for: Complex coding, long context
    └─ Cost: $3.00 / 1M input, $15.00 / 1M output
    └─ Context: 200K tokens

  openai/gpt-4-turbo
    └─ Best for: General tasks, reliable
    └─ Cost: $10.00 / 1M input, $30.00 / 1M output
    └─ Context: 128K tokens

  google/gemini-pro-1.5
    └─ Best for: Multimodal, huge context
    └─ Cost: $2.50 / 1M input, $7.50 / 1M output
    └─ Context: 2M tokens

⚡ Fast & Cheap Models:

  meta-llama/llama-3.1-8b-instruct:free
    └─ Best for: Simple tasks, testing
    └─ Cost: FREE (rate limited)
    └─ Context: 128K tokens

  anthropic/claude-3-haiku:beta
    └─ Best for: Fast responses, simple code
    └─ Cost: $0.25 / 1M input, $1.25 / 1M output
    └─ Context: 200K tokens

  google/gemini-flash-1.5
    └─ Best for: Speed, cost optimization
    └─ Cost: $0.075 / 1M input, $0.30 / 1M output
    └─ Context: 1M tokens

🚀 Cutting Edge:

  deepseek/deepseek-chat
    └─ Best for: Code generation, reasoning
    └─ Cost: $0.14 / 1M input, $0.28 / 1M output
    └─ Context: 64K tokens

  qwen/qwen-2.5-72b-instruct
    └─ Best for: Multilingual, code
    └─ Cost: $0.35 / 1M input, $0.40 / 1M output
    └─ Context: 128K tokens

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log(`
💡 Usage Examples with OpenRouter:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Free Model (Llama 3.1 8B):

    export OPENROUTER_API_KEY='sk-or-v1-...'
    npx agentic-flow \\
      --agent coder \\
      --provider openrouter \\
      --model "meta-llama/llama-3.1-8b-instruct:free" \\
      --task "Write a Python hello world"

2️⃣  Claude via OpenRouter (Same model, lower cost):

    npx agentic-flow \\
      --agent researcher \\
      --provider openrouter \\
      --model "anthropic/claude-3.5-sonnet" \\
      --task "Explain microservices patterns"

3️⃣  Gemini via OpenRouter:

    npx agentic-flow \\
      --agent coder \\
      --provider openrouter \\
      --model "google/gemini-pro-1.5" \\
      --task "Build a REST API"

4️⃣  Auto-optimization (picks cheapest suitable model):

    npx agentic-flow \\
      --agent coder \\
      --provider openrouter \\
      --optimize \\
      --priority cost \\
      --task "Create a function"

5️⃣  With streaming:

    npx agentic-flow \\
      --agent coder \\
      --provider openrouter \\
      --stream \\
      --task "Build a web scraper"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log(`
🎨 Recommended Agent + Model Combinations:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quick Testing (FREE):
  Agent: coder, tester
  Model: meta-llama/llama-3.1-8b-instruct:free
  Cost: $0.00
  Why: Perfect for development & testing

Complex Coding:
  Agent: coder, reviewer, system-architect
  Model: anthropic/claude-3.5-sonnet
  Cost: $3-15 / 1M tokens
  Why: Best code understanding & generation

Research & Analysis:
  Agent: researcher, pattern-matcher
  Model: google/gemini-pro-1.5
  Cost: $2.50-7.50 / 1M tokens
  Why: 2M context window for deep analysis

Cost-Optimized Code:
  Agent: coder, backend-dev
  Model: deepseek/deepseek-chat
  Cost: $0.14-0.28 / 1M tokens
  Why: Great code quality at low cost

Fast Prototyping:
  Agent: planner, mobile-dev
  Model: google/gemini-flash-1.5
  Cost: $0.075-0.30 / 1M tokens
  Why: Ultra-fast, cheap, good quality

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log(`
💰 Cost Comparison (100K token task):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Direct Anthropic:
  Claude Sonnet: $1.80
  └─ Requires Anthropic API key

OpenRouter - Same Model:
  Claude Sonnet: $1.80
  └─ Access via OpenRouter
  └─ Can fallback to other models
  └─ Single API for 100+ models

OpenRouter - Cheaper Alternatives:
  DeepSeek Chat: $0.021 (99% savings!)
  Gemini Flash: $0.0375 (98% savings!)
  Llama 3.1 8B: $0.00 (FREE!)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log(`
🚀 Quick Start Guide:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Get API Key
  Visit: https://openrouter.ai
  Sign up & get key: sk-or-v1-...

Step 2: Set Environment Variable
  export OPENROUTER_API_KEY='sk-or-v1-...'

Step 3: Run Your First Agent
  npx agentic-flow \\
    --agent coder \\
    --provider openrouter \\
    --model "meta-llama/llama-3.1-8b-instruct:free" \\
    --task "Write a hello world"

Step 4: Try Auto-Optimization
  npx agentic-flow \\
    --agent coder \\
    --provider openrouter \\
    --optimize \\
    --task "Build something cool"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log(`
🔧 Available Agents (all work with OpenRouter):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Development:     coder, reviewer, tester, backend-dev, mobile-dev
Architecture:    system-architect, planner, api-docs
Research:        researcher, pattern-matcher, code-analyzer
Learning:        adaptive-learner, reasoning-optimized, memory-optimizer
DevOps:          cicd-engineer, production-validator
ML:              ml-developer

Total: 66 specialized agents

List all: npx agentic-flow --list

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// If API key is set, run demos
if (hasOpenRouter) {
    console.log(`
🚀 Running Live OpenRouter Demos...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

    try {
        console.log('\n📝 Test 1: FREE Model (Llama 3.1 8B)\n');
        execSync(
            'npx agentic-flow --agent coder --provider openrouter --model "meta-llama/llama-3.1-8b-instruct:free" --task "Write a function to check if a number is prime"',
            { stdio: 'inherit', timeout: 60000 }
        );

        console.log('\n\n🧠 Test 2: DeepSeek (Ultra-cheap, great for code)\n');
        execSync(
            'npx agentic-flow --agent researcher --provider openrouter --model "deepseek/deepseek-chat" --task "Explain the SOLID principles"',
            { stdio: 'inherit', timeout: 60000 }
        );

        console.log('\n\n⚡ Test 3: Gemini Flash via OpenRouter\n');
        execSync(
            'npx agentic-flow --agent coder --provider openrouter --model "google/gemini-flash-1.5" --task "Create a simple Express.js server"',
            { stdio: 'inherit', timeout: 60000 }
        );

        console.log('\n\n✅ All Demos Complete!\n');
    } catch (error) {
        if (error.signal === 'SIGTERM') {
            console.log('\n\n⏱️  Demo timed out (normal for longer tasks)\n');
        } else {
            console.error('Demo error:', error.message);
        }
    }
}

console.log(`
🔗 Resources:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🌐 OpenRouter:       https://openrouter.ai
  🔑 Get API Key:      https://openrouter.ai/keys
  💰 Pricing:          https://openrouter.ai/models
  📖 Documentation:    https://github.com/ruvnet/agentic-flow
  📊 Model List:       https://openrouter.ai/docs#models

  💡 Free tier: $0.50 credit to start
  💡 100+ models available
  💡 Single API for all providers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

╔══════════════════════════════════════════════════════════════╗
║  ${hasOpenRouter ? '✅ Ready to use OpenRouter with all agents!          ' : '⚠️  Set OPENROUTER_API_KEY to get started          '}  ║
╚══════════════════════════════════════════════════════════════╝
`);
