# 🌐 Multi-Provider AI Integration Guide

Complete guide to using Agentic Flow with Google Gemini, OpenRouter, and 100+ AI models.

## 📑 Quick Navigation

- [Google Gemini](#google-gemini)
- [OpenRouter](#openrouter)
- [Cost Comparison](#cost-comparison)
- [Model Selection Guide](#model-selection-guide)
- [Usage Examples](#usage-examples)

---

## 🤖 Google Gemini

### Setup

```bash
export GOOGLE_GEMINI_API_KEY='your-api-key'

# Get free API key: https://ai.google.dev
```

### Available Models

| Model | Context | Best For | Cost (per 1M) |
|-------|---------|----------|---------------|
| `gemini-2.0-flash-exp` | 1M | Real-time, code gen | Ultra-low (free tier) |
| `gemini-1.5-pro` | 2M | Complex reasoning | $2.50 in, $7.50 out |
| `gemini-1.5-flash` | 1M | Speed optimization | $0.075 in, $0.30 out |
| `gemini-1.0-pro` | 32K | General purpose | Very low |

### Usage

```bash
# Basic usage
npx agentic-flow \
  --agent coder \
  --provider gemini \
  --model "gemini-2.0-flash-exp" \
  --task "Build a REST API"

# With streaming
npx agentic-flow \
  --agent researcher \
  --provider gemini \
  --stream \
  --task "Research QUIC protocol"

# Auto-optimization
npx agentic-flow \
  --agent coder \
  --provider gemini \
  --optimize \
  --task "Create microservices"
```

### Free Tier

- **60 requests per minute**
- **1M tokens per minute**
- Perfect for development & testing

---

## 🌐 OpenRouter

### Setup

```bash
export OPENROUTER_API_KEY='sk-or-v1-...'

# Get API key: https://openrouter.ai
# Free tier: $0.50 credit to start
```

### Top Models via OpenRouter

#### 💎 Premium Models

| Model | Provider | Cost (1M input) | Best For |
|-------|----------|-----------------|----------|
| `anthropic/claude-3.5-sonnet` | Anthropic | $3.00 | Complex coding |
| `openai/gpt-4-turbo` | OpenAI | $10.00 | General tasks |
| `google/gemini-pro-1.5` | Google | $2.50 | Huge context (2M) |

#### ⚡ Fast & Cheap Models

| Model | Cost (1M input) | Best For |
|-------|-----------------|----------|
| `meta-llama/llama-3.1-8b-instruct:free` | **FREE** | Testing, simple tasks |
| `anthropic/claude-3-haiku:beta` | $0.25 | Fast responses |
| `google/gemini-flash-1.5` | $0.075 | Speed + cost |
| `deepseek/deepseek-chat` | $0.14 | Code generation |

### Usage

```bash
# FREE model (Llama 3.1)
npx agentic-flow \
  --agent coder \
  --provider openrouter \
  --model "meta-llama/llama-3.1-8b-instruct:free" \
  --task "Write Python function"

# Claude via OpenRouter
npx agentic-flow \
  --agent researcher \
  --provider openrouter \
  --model "anthropic/claude-3.5-sonnet" \
  --task "Analyze architecture"

# Cost-optimized with DeepSeek
npx agentic-flow \
  --agent coder \
  --provider openrouter \
  --model "deepseek/deepseek-chat" \
  --task "Build API endpoints"

# Auto-optimization (picks best model)
npx agentic-flow \
  --agent coder \
  --provider openrouter \
  --optimize \
  --priority cost
```

---

## 💰 Cost Comparison

### Task: Generate 100 REST endpoints (100K tokens)

| Provider | Model | Input Cost | Output Cost | Total | Savings |
|----------|-------|------------|-------------|-------|---------|
| **Direct Anthropic** | Claude Opus | $15.00 | $75.00 | **$9.00** | - |
| **Direct OpenAI** | GPT-4 Turbo | $10.00 | $30.00 | **$4.00** | 56% |
| **Gemini Direct** | Gemini Pro 1.5 | $2.50 | $7.50 | **$1.00** | 89% |
| **OpenRouter** | DeepSeek Chat | $0.14 | $0.28 | **$0.042** | **99.5%** |
| **OpenRouter** | Gemini Flash | $0.075 | $0.30 | **$0.0375** | **99.6%** |
| **OpenRouter** | Llama 3.1 8B | $0.00 | $0.00 | **$0.00** | **100%** |

### Monthly Cost Estimate (1000 tasks/month)

| Solution | Monthly Cost |
|----------|-------------|
| Direct Anthropic (Claude) | **$9,000** |
| Direct OpenAI (GPT-4) | **$4,000** |
| Gemini Direct | **$1,000** |
| OpenRouter (DeepSeek) | **$42** (99.5% savings) |
| OpenRouter (Gemini Flash) | **$37.50** (99.6% savings) |
| OpenRouter (Free Llama) | **$0** (100% savings) |

---

## 🎯 Model Selection Guide

### By Task Type

#### Code Generation
- **Best Quality**: `anthropic/claude-3.5-sonnet` ($3/1M)
- **Best Value**: `deepseek/deepseek-chat` ($0.14/1M)
- **FREE**: `meta-llama/llama-3.1-8b-instruct:free`

#### Research & Analysis
- **Long Context**: `google/gemini-pro-1.5` (2M context, $2.50/1M)
- **Fast**: `google/gemini-flash-1.5` ($0.075/1M)
- **FREE**: `meta-llama/llama-3.1-8b-instruct:free`

#### Real-time Applications
- **Fastest**: `gemini-2.0-flash-exp` (Gemini direct)
- **Good Value**: `google/gemini-flash-1.5` (OpenRouter)
- **FREE**: `meta-llama/llama-3.1-8b-instruct:free`

#### Complex Reasoning
- **Best**: `anthropic/claude-3.5-sonnet`
- **Value**: `google/gemini-pro-1.5`
- **Budget**: `deepseek/deepseek-chat`

### By Agent Type

| Agent Type | Recommended Model | Provider | Why |
|------------|------------------|----------|-----|
| `coder` | `deepseek/deepseek-chat` | OpenRouter | Best code quality/cost ratio |
| `researcher` | `gemini-pro-1.5` | OpenRouter/Gemini | 2M context window |
| `reviewer` | `claude-3.5-sonnet` | OpenRouter/Anthropic | Superior code understanding |
| `planner` | `gemini-flash-1.5` | OpenRouter/Gemini | Fast, good reasoning |
| `tester` | `llama-3.1-8b:free` | OpenRouter | FREE, good enough |
| `system-architect` | `claude-3.5-sonnet` | OpenRouter/Anthropic | Best for complex design |

---

## 📋 Usage Examples

### 1. Development Workflow (Cost-Optimized)

```bash
# Step 1: Research (FREE)
export OPENROUTER_API_KEY='sk-or-v1-...'
npx agentic-flow \
  --agent researcher \
  --provider openrouter \
  --model "meta-llama/llama-3.1-8b-instruct:free" \
  --task "Research authentication patterns" > research.txt

# Step 2: Code (Cheap + Quality)
npx agentic-flow \
  --agent coder \
  --provider openrouter \
  --model "deepseek/deepseek-chat" \
  --task "Implement auth from research.txt"

# Step 3: Review (Best Quality)
npx agentic-flow \
  --agent reviewer \
  --provider openrouter \
  --model "anthropic/claude-3.5-sonnet" \
  --task "Review authentication implementation"

# Total cost: ~$0.05 (vs $15 with direct Anthropic)
```

### 2. Ultra-Fast Prototyping (Gemini)

```bash
export GOOGLE_GEMINI_API_KEY='your-key'

# Lightning-fast code generation
npx agentic-flow \
  --agent coder \
  --provider gemini \
  --model "gemini-2.0-flash-exp" \
  --stream \
  --task "Build a complete CRUD API"

# Cost: Near-zero with free tier
```

### 3. Enterprise Quality (OpenRouter Claude)

```bash
# Get Claude quality via OpenRouter
export OPENROUTER_API_KEY='sk-or-v1-...'

npx agentic-flow \
  --agent system-architect \
  --provider openrouter \
  --model "anthropic/claude-3.5-sonnet" \
  --task "Design microservices architecture"

# Benefit: Same quality, fallback to other models if needed
```

### 4. Auto-Optimization

```bash
# Let agentic-flow pick the best model
npx agentic-flow \
  --agent coder \
  --provider openrouter \
  --optimize \
  --priority cost \
  --max-cost 0.001 \
  --task "Create webhook handler"

# Router automatically selects cheapest suitable model
```

---

## 🚀 Quick Start

### 1. Get API Keys

**Google Gemini** (FREE tier available):
- Visit: https://ai.google.dev
- Get API key from Google AI Studio
- Free tier: 60 req/min, 1M tokens/min

**OpenRouter** (FREE tier: $0.50 credit):
- Visit: https://openrouter.ai
- Sign up with Google/GitHub
- Get API key from dashboard
- Access 100+ models with single key

### 2. Set Environment Variables

```bash
# Choose one or more:
export GOOGLE_GEMINI_API_KEY='your-gemini-key'
export OPENROUTER_API_KEY='sk-or-v1-...'
export ANTHROPIC_API_KEY='sk-ant-...'  # optional
```

### 3. Run Your First Agent

```bash
# With Gemini (free tier)
npx agentic-flow \
  --agent coder \
  --provider gemini \
  --task "Write a hello world function"

# With OpenRouter (free model)
npx agentic-flow \
  --agent coder \
  --provider openrouter \
  --model "meta-llama/llama-3.1-8b-instruct:free" \
  --task "Write a hello world function"
```

---

## 🔧 All Available Agents

All 66 agents work with any provider:

**Development**: coder, reviewer, tester, backend-dev, mobile-dev, ml-developer
**Architecture**: system-architect, planner, api-docs, production-validator
**Research**: researcher, pattern-matcher, code-analyzer
**Learning**: adaptive-learner, reasoning-optimized, memory-optimizer, context-synthesizer
**DevOps**: cicd-engineer, production-validator

List all: `npx agentic-flow --list`

---

## 📚 Resources

### Google Gemini
- API Key: https://ai.google.dev
- Pricing: https://ai.google.dev/pricing
- Models: https://ai.google.dev/models

### OpenRouter
- API Key: https://openrouter.ai/keys
- Pricing: https://openrouter.ai/models
- Docs: https://openrouter.ai/docs

### Agentic Flow
- GitHub: https://github.com/ruvnet/agentic-flow
- Examples: `/examples` directory
- Demo Scripts:
  - `examples/gemini-simple-test.js`
  - `examples/gemini-agents-demo.js`
  - `examples/openrouter-demo.js`
  - `examples/test-gemini.sh`

---

## 💡 Pro Tips

1. **Start with FREE models** for testing and development
2. **Use auto-optimization** to let the router pick the best model
3. **Mix providers** for different tasks (research vs code vs review)
4. **Monitor costs** with OpenRouter's dashboard
5. **Use Gemini's free tier** for high-volume testing
6. **Upgrade to paid models** only when quality matters
7. **Enable streaming** for better UX with real-time output

---

**🎯 Bottom Line**: You can now access 100+ AI models with 99% cost savings while maintaining quality!
