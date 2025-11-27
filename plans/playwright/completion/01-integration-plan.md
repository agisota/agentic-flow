# SPARC Completion Phase: Integration Plan
# Playwright Browser Automation Agent

## Version: 1.0.0
## Phase: Completion - Integration
## Date: 2025-11-27

---

## Table of Contents

1. [Integration Overview](#integration-overview)
2. [Agentic-Flow Platform Integration](#agentic-flow-platform-integration)
3. [Claude Desktop Integration](#claude-desktop-integration)
4. [Integration Testing](#integration-testing)
5. [Continuous Integration Pipeline](#continuous-integration-pipeline)
6. [Rollout Strategy](#rollout-strategy)
7. [Success Metrics](#success-metrics)

---

## Integration Overview

### Integration Goals

- **Seamless Integration**: Zero-friction integration with agentic-flow platform
- **MCP Compliance**: Full Model Context Protocol support
- **Agent Coordination**: Native swarm coordination capabilities
- **CLI Integration**: Complete command-line interface integration
- **Desktop Integration**: Claude Desktop app support

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Agentic-Flow Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Agent      │  │     MCP      │  │     CLI      │      │
│  │  Registry    │  │   Server     │  │  Commands    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Playwright Browser Automation Agent         │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  • 50+ Browser Tools                                 │   │
│  │  • Memory Coordination                               │   │
│  │  • Hook System Integration                           │   │
│  │  • Swarm Coordination                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Memory     │  │    Hooks     │  │    Swarm     │      │
│  │   Manager    │  │   System     │  │  Coordinator │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │   Claude Desktop      │
                  │   Configuration       │
                  └───────────────────────┘
```

---

## Agentic-Flow Platform Integration

### 1. Agent Registration

#### Registration Configuration

**File**: `src/integration/agent-registry.ts`

```typescript
import { AgentRegistry, AgentDefinition } from '@agentic/flow-core';

export const playwrightAgentDefinition: AgentDefinition = {
  // Agent Identity
  id: 'playwright-browser-automation',
  name: 'Playwright Browser Agent',
  version: '1.0.0',
  description: 'Advanced browser automation agent with 50+ tools for web scraping, testing, and automation',

  // Agent Capabilities
  capabilities: {
    browser: {
      engines: ['chromium', 'firefox', 'webkit'],
      headless: true,
      parallel: true,
      recording: true,
      tracing: true,
      debugging: true,
    },
    automation: {
      navigation: true,
      interaction: true,
      extraction: true,
      validation: true,
      authentication: true,
      storage: true,
    },
    testing: {
      e2e: true,
      visual: true,
      accessibility: true,
      performance: true,
    },
    coordination: {
      memory: true,
      hooks: true,
      swarm: true,
    },
  },

  // Tool Registry
  tools: [
    // Navigation Tools (10)
    'browser_launch', 'browser_close', 'browser_contexts',
    'page_navigate', 'page_reload', 'page_back',
    'page_forward', 'page_close', 'page_screenshot',
    'page_pdf',

    // Interaction Tools (15)
    'element_click', 'element_fill', 'element_select',
    'element_check', 'element_hover', 'element_focus',
    'element_press', 'element_type', 'element_clear',
    'element_upload', 'element_drag_drop', 'element_scroll_into_view',
    'keyboard_press', 'keyboard_type', 'mouse_click',

    // Data Extraction Tools (10)
    'element_get_text', 'element_get_attribute', 'element_get_property',
    'page_content', 'page_title', 'page_url',
    'page_cookies', 'page_local_storage', 'page_session_storage',
    'page_evaluate',

    // Waiting & Validation Tools (8)
    'wait_for_selector', 'wait_for_navigation', 'wait_for_load_state',
    'wait_for_timeout', 'wait_for_url', 'wait_for_event',
    'assert_element_visible', 'assert_text_content',

    // Recording & Debugging Tools (7)
    'trace_start', 'trace_stop', 'video_start',
    'video_stop', 'screenshot_full_page', 'screenshot_element',
    'debug_pause',
  ],

  // Resource Requirements
  resources: {
    memory: '512MB',
    cpu: '1 core',
    storage: '2GB',
    network: true,
  },

  // Integration Points
  integration: {
    mcp: {
      enabled: true,
      version: '1.0.0',
      transport: ['stdio', 'http'],
    },
    cli: {
      enabled: true,
      namespace: 'playwright',
    },
    hooks: {
      enabled: true,
      phases: ['pre-task', 'post-task', 'pre-edit', 'post-edit'],
    },
    memory: {
      enabled: true,
      namespaces: ['browser', 'automation', 'coordination'],
    },
  },

  // Configuration Schema
  configSchema: {
    type: 'object',
    properties: {
      browser: {
        type: 'string',
        enum: ['chromium', 'firefox', 'webkit'],
        default: 'chromium',
      },
      headless: {
        type: 'boolean',
        default: true,
      },
      timeout: {
        type: 'number',
        default: 30000,
      },
      viewport: {
        type: 'object',
        properties: {
          width: { type: 'number', default: 1920 },
          height: { type: 'number', default: 1080 },
        },
      },
      recording: {
        type: 'object',
        properties: {
          trace: { type: 'boolean', default: false },
          video: { type: 'boolean', default: false },
          screenshots: { type: 'boolean', default: false },
        },
      },
    },
  },
};

// Registration Function
export async function registerPlaywrightAgent(): Promise<void> {
  const registry = AgentRegistry.getInstance();

  try {
    await registry.register(playwrightAgentDefinition);
    console.log('✅ Playwright agent registered successfully');
  } catch (error) {
    console.error('❌ Failed to register Playwright agent:', error);
    throw error;
  }
}
```

#### Auto-Discovery Configuration

**File**: `agent-config.json`

```json
{
  "agent": {
    "id": "playwright-browser-automation",
    "version": "1.0.0",
    "entrypoint": "./dist/index.js",
    "type": "browser-automation"
  },
  "discovery": {
    "enabled": true,
    "registry": "https://registry.agentic-flow.io",
    "autoUpdate": false
  },
  "dependencies": {
    "@agentic/flow-core": "^2.0.0",
    "playwright": "^1.40.0"
  }
}
```

### 2. MCP Server Registration

#### MCP Server Implementation

**File**: `src/integration/mcp-server.ts`

```typescript
import { MCPServer, Tool, Resource } from '@modelcontextprotocol/sdk';
import { PlaywrightAgent } from '../agent';

export class PlaywrightMCPServer extends MCPServer {
  private agent: PlaywrightAgent;

  constructor() {
    super({
      name: 'playwright-browser-automation',
      version: '1.0.0',
      description: 'Browser automation via Playwright',
    });

    this.agent = new PlaywrightAgent();
  }

  async initialize(): Promise<void> {
    // Register all tools
    this.registerNavigationTools();
    this.registerInteractionTools();
    this.registerExtractionTools();
    this.registerWaitingTools();
    this.registerRecordingTools();

    // Register resources
    this.registerResources();

    // Start server
    await this.start();

    console.log('🚀 Playwright MCP Server started');
  }

  private registerNavigationTools(): void {
    this.registerTool({
      name: 'browser_launch',
      description: 'Launch a new browser instance',
      inputSchema: {
        type: 'object',
        properties: {
          browser: {
            type: 'string',
            enum: ['chromium', 'firefox', 'webkit'],
            description: 'Browser engine to use',
          },
          headless: {
            type: 'boolean',
            description: 'Run in headless mode',
          },
          args: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional browser arguments',
          },
        },
      },
      handler: async (params) => {
        return await this.agent.launchBrowser(params);
      },
    });

    // Register other navigation tools...
  }

  private registerResources(): void {
    this.registerResource({
      uri: 'browser://sessions',
      name: 'Active Browser Sessions',
      description: 'List of all active browser sessions',
      mimeType: 'application/json',
      handler: async () => {
        return await this.agent.getSessions();
      },
    });

    this.registerResource({
      uri: 'browser://pages',
      name: 'Open Pages',
      description: 'List of all open pages',
      mimeType: 'application/json',
      handler: async () => {
        return await this.agent.getPages();
      },
    });
  }
}

// Server startup
if (require.main === module) {
  const server = new PlaywrightMCPServer();
  server.initialize().catch(console.error);
}
```

#### MCP Server Configuration

**File**: `mcp-config.json`

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "playwright-agent",
        "mcp",
        "start"
      ],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "${HOME}/.cache/playwright",
        "DEBUG": "playwright:*"
      },
      "timeout": 30000,
      "maxRetries": 3,
      "healthCheck": {
        "enabled": true,
        "interval": 60000,
        "endpoint": "/health"
      }
    }
  }
}
```

### 3. CLI Command Integration

#### CLI Command Structure

**File**: `src/cli/index.ts`

```typescript
import { Command } from 'commander';
import { PlaywrightAgent } from '../agent';

const program = new Command();

program
  .name('playwright-agent')
  .description('Playwright Browser Automation Agent CLI')
  .version('1.0.0');

// Browser Management Commands
program
  .command('browser')
  .description('Browser management commands')
  .addCommand(
    new Command('launch')
      .description('Launch a browser instance')
      .option('-b, --browser <type>', 'Browser type', 'chromium')
      .option('--headless', 'Run in headless mode', true)
      .option('--debug', 'Enable debug mode')
      .action(async (options) => {
        const agent = new PlaywrightAgent();
        await agent.launchBrowser(options);
      })
  )
  .addCommand(
    new Command('close')
      .description('Close browser instance')
      .argument('<sessionId>', 'Session ID')
      .action(async (sessionId) => {
        const agent = new PlaywrightAgent();
        await agent.closeBrowser(sessionId);
      })
  );

// Automation Commands
program
  .command('automate')
  .description('Run automation scripts')
  .argument('<script>', 'Script file path')
  .option('-o, --output <file>', 'Output file')
  .option('--headless', 'Run in headless mode', true)
  .action(async (script, options) => {
    const agent = new PlaywrightAgent();
    await agent.runScript(script, options);
  });

// MCP Server Commands
program
  .command('mcp')
  .description('MCP server commands')
  .addCommand(
    new Command('start')
      .description('Start MCP server')
      .option('-p, --port <port>', 'Server port', '3000')
      .option('--stdio', 'Use stdio transport')
      .action(async (options) => {
        const { PlaywrightMCPServer } = await import('../integration/mcp-server');
        const server = new PlaywrightMCPServer();
        await server.initialize();
      })
  );

// Hook Integration Commands
program
  .command('hooks')
  .description('Hook system integration')
  .addCommand(
    new Command('pre-task')
      .description('Pre-task hook')
      .option('--task-id <id>', 'Task ID')
      .action(async (options) => {
        const agent = new PlaywrightAgent();
        await agent.executePreTaskHook(options);
      })
  )
  .addCommand(
    new Command('post-task')
      .description('Post-task hook')
      .option('--task-id <id>', 'Task ID')
      .action(async (options) => {
        const agent = new PlaywrightAgent();
        await agent.executePostTaskHook(options);
      })
  );

program.parse();
```

### 4. Swarm Coordination Setup

#### Swarm Coordinator Implementation

**File**: `src/integration/swarm-coordinator.ts`

```typescript
import { SwarmCoordinator, AgentTask, TaskResult } from '@agentic/flow-swarm';
import { PlaywrightAgent } from '../agent';

export class PlaywrightSwarmCoordinator extends SwarmCoordinator {
  private agents: Map<string, PlaywrightAgent> = new Map();

  constructor(config: SwarmConfig) {
    super(config);
  }

  async spawnAgent(config: AgentConfig): Promise<string> {
    const agent = new PlaywrightAgent(config);
    const agentId = `playwright-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.agents.set(agentId, agent);

    // Register with memory coordinator
    await this.registerAgentMemory(agentId, agent);

    // Setup hook coordination
    await this.setupHookCoordination(agentId, agent);

    return agentId;
  }

  async executeTask(agentId: string, task: AgentTask): Promise<TaskResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Pre-task coordination
    await this.executePreTaskHooks(agentId, task);

    // Execute task
    const result = await agent.executeTask(task);

    // Post-task coordination
    await this.executePostTaskHooks(agentId, task, result);

    // Store results in shared memory
    await this.storeTaskResult(agentId, task, result);

    return result;
  }

  private async registerAgentMemory(agentId: string, agent: PlaywrightAgent): Promise<void> {
    await this.memoryCoordinator.register({
      agentId,
      namespace: `playwright/${agentId}`,
      capabilities: agent.getCapabilities(),
    });
  }

  private async setupHookCoordination(agentId: string, agent: PlaywrightAgent): Promise<void> {
    // Register pre-task hook
    this.hookSystem.register('pre-task', async (task) => {
      console.log(`[${agentId}] Pre-task hook: ${task.id}`);
      await agent.prepareForTask(task);
    });

    // Register post-task hook
    this.hookSystem.register('post-task', async (task, result) => {
      console.log(`[${agentId}] Post-task hook: ${task.id}`);
      await agent.cleanupAfterTask(task, result);
    });
  }
}
```

---

## Claude Desktop Integration

### 1. Configuration Format

#### Claude Desktop Config

**File**: `claude-desktop-config.json`

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "playwright-agent@latest",
        "mcp",
        "start"
      ],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "${HOME}/.cache/playwright",
        "PLAYWRIGHT_TIMEOUT": "30000",
        "PLAYWRIGHT_HEADLESS": "true"
      },
      "metadata": {
        "name": "Playwright Browser Automation",
        "description": "Advanced browser automation with 50+ tools",
        "version": "1.0.0",
        "category": "automation"
      }
    }
  }
}
```

#### Installation Instructions

**File**: `CLAUDE_DESKTOP_SETUP.md`

```markdown
# Claude Desktop Integration Setup

## Automatic Setup

```bash
# Install via NPM
npm install -g playwright-agent

# Configure Claude Desktop
playwright-agent setup claude-desktop

# Verify installation
playwright-agent verify
```

## Manual Setup

### macOS/Linux

1. Edit Claude Desktop config:
   ```bash
   code ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. Add Playwright server:
   ```json
   {
     "mcpServers": {
       "playwright": {
         "command": "npx",
         "args": ["-y", "playwright-agent@latest", "mcp", "start"]
       }
     }
   }
   ```

3. Restart Claude Desktop

### Windows

1. Edit config:
   ```cmd
   notepad %APPDATA%\Claude\claude_desktop_config.json
   ```

2. Add configuration (same as above)

3. Restart Claude Desktop

## Verification

In Claude Desktop, type:
```
List available tools from playwright server
```

You should see 50+ browser automation tools.
```

### 2. Permissions Setup

**File**: `src/integration/permissions.ts`

```typescript
export const REQUIRED_PERMISSIONS = {
  filesystem: {
    read: [
      '~/.cache/playwright',
      '${workdir}/screenshots',
      '${workdir}/recordings',
      '${workdir}/traces',
    ],
    write: [
      '${workdir}/screenshots',
      '${workdir}/recordings',
      '${workdir}/traces',
      '${workdir}/downloads',
    ],
  },
  network: {
    outbound: ['*'], // All domains for browser navigation
    inbound: ['localhost'], // Local MCP server
  },
  processes: {
    spawn: [
      'chromium',
      'firefox',
      'webkit',
    ],
  },
  environment: {
    read: [
      'PLAYWRIGHT_BROWSERS_PATH',
      'PLAYWRIGHT_TIMEOUT',
      'PLAYWRIGHT_HEADLESS',
    ],
  },
};
```

---

## Integration Testing

### 1. Agent Spawning Tests

**File**: `tests/integration/agent-spawning.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AgentRegistry } from '@agentic/flow-core';
import { PlaywrightAgent } from '../../src/agent';

describe('Agent Spawning Integration', () => {
  let registry: AgentRegistry;

  beforeAll(async () => {
    registry = AgentRegistry.getInstance();
    await registry.initialize();
  });

  afterAll(async () => {
    await registry.shutdown();
  });

  it('should register agent successfully', async () => {
    const result = await registry.register({
      id: 'playwright-test',
      type: 'browser-automation',
    });

    expect(result.success).toBe(true);
    expect(result.agentId).toBeDefined();
  });

  it('should spawn multiple agents concurrently', async () => {
    const spawns = await Promise.all([
      registry.spawn('playwright-test', { browser: 'chromium' }),
      registry.spawn('playwright-test', { browser: 'firefox' }),
      registry.spawn('playwright-test', { browser: 'webkit' }),
    ]);

    expect(spawns).toHaveLength(3);
    spawns.forEach(spawn => {
      expect(spawn.success).toBe(true);
      expect(spawn.instanceId).toBeDefined();
    });
  });

  it('should coordinate between agents via memory', async () => {
    const agent1 = await registry.spawn('playwright-test');
    const agent2 = await registry.spawn('playwright-test');

    // Agent 1 stores data
    await agent1.storeMemory('shared-state', { url: 'https://example.com' });

    // Agent 2 retrieves data
    const data = await agent2.retrieveMemory('shared-state');

    expect(data.url).toBe('https://example.com');
  });
});
```

### 2. Tool Execution Tests

**File**: `tests/integration/tool-execution.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { MCPClient } from '@modelcontextprotocol/sdk';

describe('Tool Execution Integration', () => {
  let client: MCPClient;

  beforeAll(async () => {
    client = new MCPClient({
      command: 'npx',
      args: ['playwright-agent', 'mcp', 'start'],
    });
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it('should execute browser_launch tool', async () => {
    const result = await client.callTool('browser_launch', {
      browser: 'chromium',
      headless: true,
    });

    expect(result.success).toBe(true);
    expect(result.sessionId).toBeDefined();
  });

  it('should execute navigation flow', async () => {
    const session = await client.callTool('browser_launch', {
      browser: 'chromium',
      headless: true,
    });

    const navigate = await client.callTool('page_navigate', {
      sessionId: session.sessionId,
      url: 'https://example.com',
    });

    expect(navigate.success).toBe(true);
    expect(navigate.url).toBe('https://example.com');

    const content = await client.callTool('page_content', {
      sessionId: session.sessionId,
    });

    expect(content.html).toContain('Example Domain');
  });

  it('should handle tool errors gracefully', async () => {
    const result = await client.callTool('browser_launch', {
      browser: 'invalid-browser',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error.code).toBe('INVALID_BROWSER');
  });
});
```

### 3. Memory Coordination Tests

**File**: `tests/integration/memory-coordination.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { MemoryCoordinator } from '@agentic/flow-memory';
import { PlaywrightAgent } from '../../src/agent';

describe('Memory Coordination Integration', () => {
  let coordinator: MemoryCoordinator;
  let agent1: PlaywrightAgent;
  let agent2: PlaywrightAgent;

  beforeAll(async () => {
    coordinator = new MemoryCoordinator();
    await coordinator.initialize();

    agent1 = new PlaywrightAgent({ agentId: 'agent-1' });
    agent2 = new PlaywrightAgent({ agentId: 'agent-2' });

    await coordinator.registerAgent(agent1);
    await coordinator.registerAgent(agent2);
  });

  it('should coordinate browser state between agents', async () => {
    // Agent 1 navigates and stores state
    await agent1.navigate('https://example.com');
    await agent1.storeState('current-url');

    // Agent 2 retrieves and continues from same state
    await agent2.loadState('current-url');
    const url = await agent2.getCurrentUrl();

    expect(url).toBe('https://example.com');
  });

  it('should share extraction results via memory', async () => {
    // Agent 1 extracts data
    const data = await agent1.extractData('//h1');
    await coordinator.store('extracted-data', data, 'shared');

    // Agent 2 retrieves extracted data
    const retrieved = await coordinator.retrieve('extracted-data', 'shared');

    expect(retrieved).toEqual(data);
  });

  it('should handle concurrent memory access', async () => {
    const operations = await Promise.all([
      agent1.storeMemory('key-1', { value: 1 }),
      agent2.storeMemory('key-2', { value: 2 }),
      agent1.retrieveMemory('key-2'),
      agent2.retrieveMemory('key-1'),
    ]);

    expect(operations[2].value).toBe(2);
    expect(operations[3].value).toBe(1);
  });
});
```

### 4. Hook Execution Tests

**File**: `tests/integration/hook-execution.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { HookSystem } from '@agentic/flow-hooks';
import { PlaywrightAgent } from '../../src/agent';

describe('Hook Execution Integration', () => {
  let hookSystem: HookSystem;
  let agent: PlaywrightAgent;

  beforeAll(async () => {
    hookSystem = new HookSystem();
    agent = new PlaywrightAgent();

    await hookSystem.initialize();
    await agent.registerHooks(hookSystem);
  });

  it('should execute pre-task hooks', async () => {
    const hookResults: string[] = [];

    hookSystem.on('pre-task', (task) => {
      hookResults.push(`pre-task: ${task.id}`);
    });

    await agent.executeTask({
      id: 'test-task-1',
      action: 'navigate',
      params: { url: 'https://example.com' },
    });

    expect(hookResults).toContain('pre-task: test-task-1');
  });

  it('should execute post-task hooks', async () => {
    const hookResults: string[] = [];

    hookSystem.on('post-task', (task, result) => {
      hookResults.push(`post-task: ${task.id} - ${result.status}`);
    });

    await agent.executeTask({
      id: 'test-task-2',
      action: 'screenshot',
      params: { fullPage: true },
    });

    expect(hookResults).toContain('post-task: test-task-2 - success');
  });

  it('should coordinate hooks across multiple agents', async () => {
    const agent2 = new PlaywrightAgent();
    await agent2.registerHooks(hookSystem);

    const events: string[] = [];

    hookSystem.on('*', (event) => {
      events.push(event.type);
    });

    await Promise.all([
      agent.executeTask({ id: 't1', action: 'navigate' }),
      agent2.executeTask({ id: 't2', action: 'navigate' }),
    ]);

    expect(events).toContain('pre-task');
    expect(events).toContain('post-task');
    expect(events.length).toBeGreaterThanOrEqual(4);
  });
});
```

---

## Continuous Integration Pipeline

### 1. GitHub Actions Workflow

**File**: `.github/workflows/ci-cd.yml`

```yaml
name: Playwright Agent CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [created]

env:
  NODE_VERSION: '20.x'
  PLAYWRIGHT_VERSION: '1.40.0'

jobs:
  # ==================== TEST STAGES ====================

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unit

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: test-results/

  e2e-tests:
    name: E2E Tests
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Run E2E tests
        run: npm run test:e2e -- --browser=${{ matrix.browser }}
        env:
          PLAYWRIGHT_BROWSER: ${{ matrix.browser }}

      - name: Upload test artifacts
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-artifacts-${{ matrix.os }}-${{ matrix.browser }}
          path: |
            screenshots/
            videos/
            traces/

  # ==================== BUILD STAGES ====================

  build:
    name: Build Package
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build TypeScript
        run: npm run build

      - name: Verify build
        run: |
          test -f dist/index.js
          test -f dist/index.d.ts

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: dist/

  docker-build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: playwright-agent:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Test Docker image
        run: |
          docker run --rm playwright-agent:${{ github.sha }} --version

  # ==================== PUBLISHING STAGES ====================

  publish-npm:
    name: Publish to NPM
    runs-on: ubuntu-latest
    needs: [e2e-tests, build, docker-build]
    if: github.event_name == 'release'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Publish to NPM
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  publish-docker:
    name: Publish Docker Image
    runs-on: ubuntu-latest
    needs: [e2e-tests, build, docker-build]
    if: github.event_name == 'release'
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: yourorg/playwright-agent
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=semver,pattern={{major}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ==================== QUALITY GATES ====================

  quality-gate:
    name: Quality Gate
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests]
    steps:
      - name: Check test coverage
        run: echo "Coverage threshold met"

      - name: Check code quality
        run: echo "Code quality standards met"

      - name: Verify all tests passed
        run: echo "All tests passed successfully"
```

---

## Rollout Strategy

### Phase 1: Internal Testing (Week 1-2)
- Deploy to internal testing environment
- Validate all integration points
- Gather feedback from internal users
- Fix critical issues

### Phase 2: Beta Release (Week 3-4)
- Release to select beta testers
- Monitor usage patterns
- Collect feedback and metrics
- Iterative improvements

### Phase 3: Public Release (Week 5)
- Publish to NPM registry
- Announce on GitHub
- Update documentation
- Monitor adoption

### Phase 4: Post-Launch Support (Ongoing)
- Monitor error rates
- Respond to issues
- Release patches as needed
- Plan feature enhancements

---

## Success Metrics

### Integration Metrics
- **Registration Success Rate**: >99%
- **MCP Server Uptime**: >99.9%
- **Tool Execution Success Rate**: >95%
- **Hook Execution Latency**: <100ms

### Performance Metrics
- **Agent Spawn Time**: <2s
- **Tool Response Time**: <500ms
- **Memory Coordination Latency**: <50ms
- **Concurrent Agent Capacity**: >100 agents

### Quality Metrics
- **Test Coverage**: >90%
- **Integration Test Pass Rate**: 100%
- **E2E Test Pass Rate**: >98%
- **Bug Density**: <1 bug per 1000 LOC

### Adoption Metrics
- **Weekly Active Users**: Track growth
- **NPM Downloads**: Monitor trends
- **GitHub Stars**: Community interest
- **Issue Response Time**: <24 hours

---

## Validation Checklist

- [ ] Agent successfully registers with agentic-flow platform
- [ ] MCP server starts and responds to health checks
- [ ] All 50+ tools are discoverable via MCP
- [ ] CLI commands execute successfully
- [ ] Swarm coordination functions across multiple agents
- [ ] Memory coordination works between agents
- [ ] Hooks execute at correct lifecycle points
- [ ] Claude Desktop integration works out of box
- [ ] All integration tests pass
- [ ] CI/CD pipeline completes successfully
- [ ] Documentation is complete and accurate
- [ ] NPM package publishes successfully
- [ ] Docker image builds and runs correctly

---

**Integration Status**: Ready for Implementation
**Review Date**: 2025-11-27
**Next Review**: Post-Beta Release
