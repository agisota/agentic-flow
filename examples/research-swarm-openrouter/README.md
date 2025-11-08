# Research Swarm with OpenRouter

This example demonstrates using research-swarm with OpenRouter for cost-effective multi-agent research.

## Configuration

- **Provider**: OpenRouter
- **Model**: anthropic/claude-3.5-sonnet (via OpenRouter)
- **Cost Savings**: ~99% compared to direct Anthropic API
- **Swarm Size**: 3-5 agents (adaptive)

## Setup

1. OpenRouter API key is configured in `config/.env`
2. Database will be created at `./data/research-jobs.db`
3. Output reports saved to `./output`

## Usage

### Basic Research Task
```bash
cd examples/research-swarm-openrouter
npx research-swarm research researcher "Analyze blockchain scalability solutions" --provider openrouter
```

### Goal-Oriented Research (GOAP)
```bash
npx research-swarm goal-research "Comprehensive analysis of AI safety" --provider openrouter
```

### Single Agent (Lower Cost)
```bash
npx research-swarm research researcher "Quick question about REST APIs" --single-agent --provider openrouter
```

## Features

- ✅ Multi-agent swarm coordination
- ✅ OpenRouter integration (200+ models)
- ✅ GOAP goal planning
- ✅ SQLite-based persistence
- ✅ Real-time progress tracking
- ✅ Comprehensive markdown reports
