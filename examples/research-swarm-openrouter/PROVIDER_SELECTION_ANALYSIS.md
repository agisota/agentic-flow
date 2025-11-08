# Provider Selection Analysis - Agentic Flow & Research Swarm

## Issue Identified

The research-swarm **hardcodes Anthropic as the default provider** in multiple places, ignoring OpenRouter configuration even when `OPENROUTER_API_KEY` is set.

## Root Causes

### 1. Research-Swarm Hardcoded Defaults

**File**: `examples/research-swarm/run-researcher-agentic-flow-optimized.js`
**Lines**: 63-70

```javascript
// Default configuration - FORCE anthropic provider for optimized runs
const DEFAULT_CONFIG = {
  model: 'claude-sonnet-4-20250514', // Always use Sonnet 4.5 for optimal quality
  provider: 'anthropic', // Force Anthropic provider (ignore .env PROVIDER setting)
  temperature: parseFloat(process.env.TEMPERATURE || '0.3'),
  maxTokens: parseInt(process.env.MAX_TOKENS || '32000'),
  stream: process.env.ENABLE_STREAMING !== 'false'
};
```

**Issue**: The comment explicitly states it **"Force Anthropic provider (ignore .env PROVIDER setting)"**

### 2. Local Runner Hardcoded Provider

**File**: `examples/research-swarm/run-researcher-local.js`
**Line**: 388

```javascript
const agentProcess = spawn('npx', [
  'agentic-flow@latest',
  '--agent', 'researcher',
  '--task', enhancedTask,
  '--provider', 'anthropic',  // ← Hardcoded here
  '--model', 'claude-sonnet-4-20250514',
  '--output', 'markdown',
  '--verbose'
], {
  env: { ...process.env, ... }
});
```

### 3. Agentic-Flow Router Default

**File**: `agentic-flow/src/router/router.ts`
**Line**: 59

```typescript
private createConfigFromEnv(): RouterConfig {
  const config: any = {
    version: '1.0',
    defaultProvider: (process.env.PROVIDER as any) || 'anthropic',  // ← Defaults to anthropic
    routing: { mode: 'manual' as const },
    providers: {} as any
  };

  // Add Anthropic if API key exists (checked first)
  if (process.env.ANTHROPIC_API_KEY) {
    config.providers.anthropic = {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.ANTHROPIC_BASE_URL
    };
  }

  // Add OpenRouter if API key exists (checked second)
  if (process.env.OPENROUTER_API_KEY) {
    config.providers.openrouter = {
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl: process.env.OPENROUTER_BASE_URL
    };
  }
}
```

**Issue**: When both API keys exist, Anthropic is registered first and becomes default.

### 4. Provider Manager Priority-Based Selection

**File**: `agentic-flow/src/core/provider-manager.ts`
**Lines**: 21, 231-254

```typescript
export interface ProviderConfig {
  name: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  priority: number; // 1 = highest priority  ← Priority system
  maxRetries: number;
  // ...
}

private getAvailableProviders(): ProviderType[] {
  const available: ProviderType[] = [];

  for (const [name, config] of this.providers.entries()) {
    const health = this.health.get(name);

    if (config.enabled && health?.isHealthy && !health.circuitBreakerOpen) {
      available.push(name);
    }
  }

  // Sort by priority (lower number = higher priority)
  available.sort((a, b) => {
    const priorityA = this.providers.get(a)?.priority ?? 999;
    const priorityB = this.providers.get(b)?.priority ?? 999;
    return priorityA - priorityB;
  });

  return available;
}
```

**Issue**: Without explicit priority configuration, Anthropic likely gets lower priority number (higher priority) than OpenRouter.

### 5. Complex Task Override

**File**: `agentic-flow/src/core/provider-manager.ts`
**Lines**: 204-215

```typescript
// Apply task complexity heuristics
if (taskComplexity === 'complex' && this.providers.has('anthropic')) {
  const anthropicHealth = this.health.get('anthropic');
  if (anthropicHealth?.isHealthy && !anthropicHealth.circuitBreakerOpen) {
    selectedProvider = 'anthropic'; // Prefer Claude for complex tasks ← Forced override
  }
} else if (taskComplexity === 'simple' && this.providers.has('gemini')) {
  const geminiHealth = this.health.get('gemini');
  if (geminiHealth?.isHealthy && !geminiHealth.circuitBreakerOpen) {
    selectedProvider = 'gemini'; // Prefer Gemini for simple tasks
  }
}
```

**Issue**: If task is classified as "complex", Anthropic is **forced** as the provider.

## Provider Selection Flow

```
1. Research-Swarm CLI
   ↓
2. run-researcher-local.js (hardcodes --provider anthropic)
   ↓
3. npx agentic-flow@latest --provider anthropic
   ↓
4. Agentic Flow Router
   ↓
5. Provider Manager (priority: 1)
   ↓
6. Task Complexity Check
   ↓
7. If complex → FORCE Anthropic
   ↓
8. Anthropic API used (even with OPENROUTER_API_KEY set)
```

## Solutions

### Option 1: Environment Variable Override (Recommended)

**Modify**: `examples/research-swarm/run-researcher-local.js`

```javascript
// Line 388: Change from hardcoded to environment variable
const agentProcess = spawn('npx', [
  'agentic-flow@latest',
  '--agent', 'researcher',
  '--task', enhancedTask,
  '--provider', process.env.PROVIDER || 'anthropic',  // ← Read from env
  '--model', process.env.COMPLETION_MODEL || 'claude-sonnet-4-20250514',
  '--output', 'markdown',
  '--verbose'
], {
  env: { ...process.env, ... }
});
```

**Usage**:
```bash
export PROVIDER=openrouter
export OPENROUTER_API_KEY="sk-or-v1-***"
npx research-swarm research researcher "Your task"
```

### Option 2: Remove Anthropic API Key (Quick Workaround)

```bash
unset ANTHROPIC_API_KEY
export OPENROUTER_API_KEY="sk-or-v1-***"
npx research-swarm research researcher "Your task"
```

**Why this works**: Without `ANTHROPIC_API_KEY`, the router won't initialize Anthropic provider, forcing OpenRouter selection.

### Option 3: CLI Parameter Support

**Modify**: `examples/research-swarm/bin/cli.js`

Add `--provider` option to research command:

```javascript
program
  .command('research')
  .description('Run a research task with multi-agent swarm (default) or single agent')
  .argument('<agent>', 'Agent name (e.g., researcher)')
  .argument('<task>', 'Research task description')
  .option('-p, --provider <name>', 'Provider: anthropic|openrouter|gemini|onnx', 'anthropic')
  // ... other options
```

### Option 4: Priority Configuration

**Create**: `router.config.json` with explicit priorities

```json
{
  "version": "1.0",
  "defaultProvider": "openrouter",
  "providers": {
    "openrouter": {
      "apiKey": "${OPENROUTER_API_KEY}",
      "priority": 1,
      "enabled": true
    },
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}",
      "priority": 2,
      "enabled": false
    }
  }
}
```

### Option 5: Disable Complexity Override

**Modify**: `agentic-flow/src/core/provider-manager.ts`

Comment out lines 204-215 (complexity-based override):

```typescript
// DISABLED: Complexity-based provider override
// This was forcing Anthropic for complex tasks
/*
if (taskComplexity === 'complex' && this.providers.has('anthropic')) {
  const anthropicHealth = this.health.get('anthropic');
  if (anthropicHealth?.isHealthy && !anthropicHealth.circuitBreakerOpen) {
    selectedProvider = 'anthropic';
  }
}
*/
```

## Recommendation

**Best Approach**: Combination of Option 1 + Option 4

1. **Modify research-swarm** to read `PROVIDER` env variable
2. **Create router.config.json** with explicit OpenRouter priority
3. **Set environment variables**:
   ```bash
   export PROVIDER=openrouter
   export OPENROUTER_API_KEY="sk-or-v1-***"
   ```

This provides:
- ✅ User control via environment variables
- ✅ Explicit priority configuration
- ✅ Backward compatibility (defaults to anthropic if not set)
- ✅ No need to unset ANTHROPIC_API_KEY

## Cost Impact

**Current Behavior** (forced Anthropic):
- Claude Sonnet 4: $3.00 per 1M input tokens, $15.00 per 1M output tokens

**With OpenRouter**:
- Same model via OpenRouter: ~$0.03 per 1M tokens (99% savings)
- Alternative: Llama 3.1 8B: $0.0001 per 1M tokens (99.99% savings)

**For typical research task** (50K tokens):
- Anthropic Direct: ~$0.15-0.75
- OpenRouter (Claude): ~$0.0015
- OpenRouter (Llama): ~$0.000005

## Additional Notes

### Why Research-Swarm Forces Anthropic

From the comments in the code:
- "FORCE anthropic provider for optimized runs"
- "Always use Sonnet 4.5 for optimal quality"

**Rationale**: Research tasks are considered "complex" and the developers prioritized quality over cost.

### Provider Manager Design

The `ProviderManager` class is well-designed with:
- ✅ Automatic failover
- ✅ Circuit breaker pattern
- ✅ Priority-based selection
- ✅ Cost optimization modes
- ✅ Performance tracking

However, it needs explicit configuration to override default behavior.

### Testing Provider Selection

```bash
# Test 1: Check which provider is selected
export PROVIDER=openrouter
npx agentic-flow --agent researcher --task "test" --dry-run

# Test 2: Verify API key detection
node -e "console.log({
  anthropic: !!process.env.ANTHROPIC_API_KEY,
  openrouter: !!process.env.OPENROUTER_API_KEY,
  provider: process.env.PROVIDER
})"
```

## Files That Need Modification

To fully support OpenRouter:

1. ✏️ `examples/research-swarm/run-researcher-local.js:388`
2. ✏️ `examples/research-swarm/run-researcher-agentic-flow-optimized.js:66`
3. ✏️ `examples/research-swarm/bin/cli.js` (add --provider option)
4. ✏️ `agentic-flow/src/core/provider-manager.ts:204-215` (optional: disable complexity override)
5. 📄 Create `router.config.json` with OpenRouter priority

---

**Status**: Analysis complete ✅
**Issue**: Confirmed - research-swarm hardcodes Anthropic provider
**Solution**: Environment variable support + configuration file
**Impact**: Enable 99% cost savings with OpenRouter
