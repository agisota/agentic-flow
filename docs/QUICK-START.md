# 🚀 Quick Start Guide

Get started with Agentic Flow in 5 minutes using **FREE** AI models.

## ⚡ 1-Minute Setup

### Step 1: Choose Your Provider

Pick one (or use all three):

#### 🎯 **Recommended: Google Gemini** (FREE tier)
```bash
# Get FREE API key: https://ai.google.dev
export GOOGLE_GEMINI_API_KEY='your-key-here'
```
- ✅ 60 requests/min FREE
- ✅ 1M tokens/min FREE
- ✅ Perfect for development

#### 🌐 **Alternative: OpenRouter** (FREE tier: $0.50 credit)
```bash
# Get API key: https://openrouter.ai
export OPENROUTER_API_KEY='sk-or-v1-...'
```
- ✅ 100+ models
- ✅ FREE models available
- ✅ $0.50 free credit

#### 💎 **Premium: Anthropic Claude**
```bash
# Get API key: https://console.anthropic.com
export ANTHROPIC_API_KEY='sk-ant-...'
```
- ✅ Best quality
- ✅ Long context
- 💰 Paid only

### Step 2: Run Your First Agent

```bash
# With Gemini (FREE)
npx agentic-flow \
  --agent coder \
  --provider gemini \
  --task "Write a JavaScript function to reverse a string"

# With OpenRouter (FREE model)
npx agentic-flow \
  --agent coder \
  --provider openrouter \
  --model "meta-llama/llama-3.1-8b-instruct:free" \
  --task "Write a Python hello world"
```

**That's it!** 🎉

---

## 📋 Complete Examples

### Code Generation

```bash
# Simple function
npx agentic-flow \
  --agent coder \
  --provider gemini \
  --task "Create a function to calculate factorial"

# Complex API
npx agentic-flow \
  --agent backend-dev \
  --provider gemini \
  --task "Build a REST API with Express and JWT authentication"
```

### Research & Analysis

```bash
# Quick research
npx agentic-flow \
  --agent researcher \
  --provider gemini \
  --task "Explain microservices architecture patterns"

# Deep analysis with 2M context
npx agentic-flow \
  --agent researcher \
  --provider openrouter \
  --model "google/gemini-pro-1.5" \
  --task "Analyze this entire codebase and suggest improvements"
```

### Code Review

```bash
# Automated review
npx agentic-flow \
  --agent reviewer \
  --provider gemini \
  --task "Review the authentication module for security issues"

# With streaming output
npx agentic-flow \
  --agent reviewer \
  --provider gemini \
  --stream \
  --task "Review all API endpoints"
```

### Testing

```bash
# Generate tests
npx agentic-flow \
  --agent tester \
  --provider gemini \
  --task "Create comprehensive tests for the user service"
```

### Architecture & Planning

```bash
# System design
npx agentic-flow \
  --agent system-architect \
  --provider gemini \
  --task "Design a scalable microservices architecture"

# Project planning
npx agentic-flow \
  --agent planner \
  --provider gemini \
  --task "Create a deployment plan for our application"
```

---

## 💰 Cost Optimization

### FREE Options

```bash
# Option 1: Gemini Flash (FREE tier)
npx agentic-flow \
  --agent coder \
  --provider gemini \
  --model "gemini-2.0-flash-exp" \
  --task "Build a webhook handler"

# Option 2: OpenRouter Llama 3.1 (100% FREE)
npx agentic-flow \
  --agent coder \
  --provider openrouter \
  --model "meta-llama/llama-3.1-8b-instruct:free" \
  --task "Create a data validator"
```

### Ultra-Cheap Options

```bash
# DeepSeek: $0.14 / 1M tokens (99% cheaper than GPT-4)
npx agentic-flow \
  --agent coder \
  --provider openrouter \
  --model "deepseek/deepseek-chat" \
  --task "Build a complete CRUD API"

# Gemini Flash: $0.075 / 1M tokens
npx agentic-flow \
  --agent coder \
  --provider openrouter \
  --model "google/gemini-flash-1.5" \
  --task "Create microservices"
```

### Auto-Optimization (Picks Cheapest)

```bash
npx agentic-flow \
  --agent coder \
  --provider openrouter \
  --optimize \
  --priority cost \
  --max-cost 0.001 \
  --task "Generate API documentation"
```

---

## 🎨 All Available Agents

### 📝 Development (18 agents)
```bash
coder                    # Clean, efficient code
reviewer                 # Code review & QA
tester                   # Comprehensive testing
backend-dev              # Backend APIs
mobile-dev               # React Native
ml-developer             # Machine learning
cicd-engineer            # CI/CD pipelines
api-docs                 # OpenAPI/Swagger
code-analyzer            # Code quality analysis
production-validator     # Production readiness
```

### 🧠 AI & Learning (6 agents)
```bash
adaptive-learner         # Learns from experience
pattern-matcher          # Pattern recognition
reasoning-optimized      # Meta-orchestrator
memory-optimizer         # Memory management
context-synthesizer      # Context builder
experience-curator       # Quality gatekeeper
```

### 🏗️ Architecture (8 agents)
```bash
system-architect         # System design
planner                  # Strategic planning
researcher               # Deep research
base-template-generator  # Template creation
goal-planner             # GOAP planning
code-goal-planner        # Code-centric GOAP
```

### 🔄 Coordination (20+ agents)
```bash
hierarchical-coordinator # Hierarchical swarms
mesh-coordinator         # P2P mesh networks
adaptive-coordinator     # Dynamic topology
swarm-memory-manager     # Distributed memory
collective-intelligence  # Collective decisions
```

### 🐙 GitHub Integration (10 agents)
```bash
github-modes             # GitHub workflows
pr-manager               # PR management
code-review-swarm        # Multi-agent reviews
issue-tracker            # Issue management
release-manager          # Release coordination
workflow-automation      # CI/CD automation
repo-architect           # Repo structure
multi-repo-swarm         # Cross-repo coordination
```

**Total: 66 specialized agents**

View all: `npx agentic-flow --list`

---

## 🔧 Advanced Features

### Streaming Output

```bash
npx agentic-flow \
  --agent researcher \
  --provider gemini \
  --stream \
  --task "Analyze QUIC protocol advantages"
```

### Custom Output Format

```bash
# JSON output
npx agentic-flow \
  --agent coder \
  --provider gemini \
  --output json \
  --task "Generate API schema"

# Markdown output
npx agentic-flow \
  --agent researcher \
  --provider gemini \
  --output md \
  --task "Research Docker best practices"
```

### Temperature Control

```bash
# More creative (higher temperature)
npx agentic-flow \
  --agent coder \
  --provider gemini \
  --temperature 0.9 \
  --task "Design creative API architecture"

# More deterministic (lower temperature)
npx agentic-flow \
  --agent reviewer \
  --provider gemini \
  --temperature 0.1 \
  --task "Review for security vulnerabilities"
```

### Custom Agents Directory

```bash
npx agentic-flow \
  --agent my-custom-agent \
  --agents-dir ./custom-agents \
  --provider gemini \
  --task "Custom task"
```

---

## 📊 Real-World Workflows

### 1. Full-Stack Development (3 minutes, $0.05)

```bash
# Research
npx agentic-flow --agent researcher --provider openrouter \
  --model "meta-llama/llama-3.1-8b-instruct:free" \
  --task "Research modern authentication patterns" > research.txt

# Backend
npx agentic-flow --agent backend-dev --provider openrouter \
  --model "deepseek/deepseek-chat" \
  --task "Build Express API with JWT from research.txt"

# Tests
npx agentic-flow --agent tester --provider gemini \
  --task "Create test suite for authentication"

# Review
npx agentic-flow --agent reviewer --provider openrouter \
  --model "anthropic/claude-3.5-sonnet" \
  --task "Security review of auth implementation"
```

### 2. CI/CD Pipeline Setup (2 minutes, FREE)

```bash
npx agentic-flow --agent cicd-engineer --provider gemini \
  --task "Create GitHub Actions workflow for Node.js app with testing, linting, and Docker deployment"
```

### 3. Code Refactoring (5 minutes, $0.10)

```bash
# Analysis
npx agentic-flow --agent code-analyzer --provider gemini \
  --task "Analyze codebase for refactoring opportunities"

# Refactor
npx agentic-flow --agent coder --provider openrouter \
  --model "deepseek/deepseek-chat" \
  --task "Refactor using SOLID principles"

# Verify
npx agentic-flow --agent tester --provider gemini \
  --task "Update tests for refactored code"
```

---

## 🆘 Troubleshooting

### API Key Not Working

```bash
# Check if key is set
echo $GOOGLE_GEMINI_API_KEY
echo $OPENROUTER_API_KEY

# Re-export if needed
export GOOGLE_GEMINI_API_KEY='your-key'
```

### Rate Limit Errors

```bash
# Use a different provider
npx agentic-flow --provider openrouter ...

# Or use a different model
npx agentic-flow --provider gemini --model "gemini-1.5-flash" ...
```

### Timeout Errors

```bash
# Increase timeout (default: 120s)
npx agentic-flow --max-tokens 2000 ...
```

---

## 📚 Next Steps

1. **Try all examples** above with your API keys
2. **Read the complete guide**: `docs/MULTI-PROVIDER-GUIDE.md`
3. **Run demo scripts**:
   - `node examples/gemini-simple-test.js`
   - `node examples/openrouter-demo.js`
   - `bash examples/test-with-keys.sh`
4. **List all agents**: `npx agentic-flow --list`
5. **Get help**: `npx agentic-flow --help`

---

## 💡 Pro Tips

1. ✅ **Start with Gemini** - FREE tier is perfect for development
2. ✅ **Use auto-optimization** - Let the router pick the best model
3. ✅ **Enable streaming** - Better UX for long tasks
4. ✅ **Mix providers** - Research (FREE) → Code (cheap) → Review (quality)
5. ✅ **Monitor costs** - OpenRouter has dashboard
6. ✅ **Free models first** - Test with FREE before using paid
7. ✅ **Cache results** - Save responses for repeated tasks

---

## 🔗 Resources

- **Complete Guide**: `docs/MULTI-PROVIDER-GUIDE.md`
- **GitHub**: https://github.com/ruvnet/agentic-flow
- **Gemini Key**: https://ai.google.dev
- **OpenRouter Key**: https://openrouter.ai
- **Examples**: `/examples` directory

---

**🎯 You're ready to build with AI agents!** Start with the FREE Gemini tier and experiment. 🚀
