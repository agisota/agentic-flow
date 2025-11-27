# Extensibility Design

**Version:** 1.0.0
**Date:** 2025-11-27

---

## 1. Plugin System Architecture

### 1.1 Overview

The plugin system enables extending the Playwright-MCP agent with custom actions, selectors, tools, and middleware without modifying core code.

### 1.2 Plugin Types

```
┌─────────────────────────────────────────────────────────┐
│                  Plugin System                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    Action    │  │   Selector   │  │     Tool     │ │
│  │   Plugins    │  │   Plugins    │  │   Plugins    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Middleware  │  │   Validator  │  │   Reporter   │ │
│  │   Plugins    │  │   Plugins    │  │   Plugins    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Plugin Interface

### 2.1 Base Plugin Interface

```typescript
interface Plugin {
  // Metadata
  name: string;
  version: string;
  description: string;
  author?: string;

  // Lifecycle Hooks
  init?(context: PluginContext): Promise<void>;
  destroy?(): Promise<void>;

  // Capabilities
  provides?: PluginCapability[];
  requires?: PluginDependency[];
}

interface PluginContext {
  logger: Logger;
  config: ServerConfig;
  eventBus: EventEmitter;
  services: ServiceRegistry;
}

interface PluginCapability {
  type: 'action' | 'selector' | 'tool' | 'middleware' | 'validator' | 'reporter';
  name: string;
}

interface PluginDependency {
  plugin: string;
  version?: string;
  optional?: boolean;
}
```

### 2.2 Plugin Manager

```typescript
class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private registry: PluginRegistry;
  private context: PluginContext;

  constructor(config: ServerConfig, eventBus: EventEmitter) {
    this.registry = new PluginRegistry();
    this.context = {
      logger: createLogger('plugins'),
      config,
      eventBus,
      services: new ServiceRegistry(),
    };
  }

  async loadPlugin(pluginPath: string): Promise<void> {
    // Import plugin module
    const pluginModule = await import(pluginPath);
    const plugin: Plugin = pluginModule.default;

    // Validate plugin
    this.validatePlugin(plugin);

    // Check dependencies
    await this.checkDependencies(plugin);

    // Initialize plugin
    if (plugin.init) {
      await plugin.init(this.context);
    }

    // Register capabilities
    if (plugin.provides) {
      for (const capability of plugin.provides) {
        this.registry.register(capability, plugin);
      }
    }

    this.plugins.set(plugin.name, plugin);
    this.context.eventBus.emit('plugin:loaded', plugin);
  }

  async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    // Check if other plugins depend on this
    const dependents = this.findDependents(name);
    if (dependents.length > 0) {
      throw new Error(
        `Cannot unload ${name}: required by ${dependents.join(', ')}`
      );
    }

    // Unregister capabilities
    if (plugin.provides) {
      for (const capability of plugin.provides) {
        this.registry.unregister(capability.name);
      }
    }

    // Destroy plugin
    if (plugin.destroy) {
      await plugin.destroy();
    }

    this.plugins.delete(name);
    this.context.eventBus.emit('plugin:unloaded', plugin);
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  listPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}
```

---

## 3. Action Plugins

### 3.1 Action Plugin Interface

```typescript
interface ActionPlugin extends Plugin {
  actions: CustomAction[];
}

interface CustomAction {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  execute: ActionExecutor;
}

type ActionExecutor = (
  params: Record<string, any>,
  context: ActionContext
) => Promise<ActionResult>;

interface ActionContext {
  page: Page;
  locator: ElementLocator;
  extractor: DataExtractor;
  logger: Logger;
}

interface ActionResult {
  success: boolean;
  data?: any;
  error?: Error;
}
```

### 3.2 Example: Smart Fill Action Plugin

```typescript
const smartFillPlugin: ActionPlugin = {
  name: 'smart-fill',
  version: '1.0.0',
  description: 'Intelligently fill forms with AI-powered field detection',

  provides: [
    { type: 'action', name: 'smart_fill_form' },
  ],

  actions: [
    {
      name: 'smart_fill_form',
      description: 'Fill a form by analyzing field labels and types',
      inputSchema: {
        type: 'object',
        properties: {
          formSelector: {
            type: 'string',
            description: 'Selector for the form element',
          },
          data: {
            type: 'object',
            description: 'Key-value pairs of data to fill',
          },
          submitAfter: {
            type: 'boolean',
            default: false,
          },
        },
        required: ['formSelector', 'data'],
      },

      execute: async (params, context) => {
        const { formSelector, data, submitAfter } = params;

        try {
          // Find form
          const form = await context.locator.findElement(formSelector);

          // Analyze form fields
          const fields = await context.page.evaluate((sel) => {
            const form = document.querySelector(sel);
            const inputs = form.querySelectorAll('input, select, textarea');

            return Array.from(inputs).map(input => ({
              name: input.getAttribute('name') || '',
              id: input.getAttribute('id') || '',
              type: input.getAttribute('type') || input.tagName.toLowerCase(),
              label: findLabel(input),
              placeholder: input.getAttribute('placeholder') || '',
            }));

            function findLabel(input) {
              // Check for associated label
              const id = input.getAttribute('id');
              if (id) {
                const label = document.querySelector(`label[for="${id}"]`);
                if (label) return label.textContent.trim();
              }

              // Check for wrapping label
              const parent = input.closest('label');
              if (parent) return parent.textContent.trim();

              return '';
            }
          }, formSelector);

          // Match data to fields
          const filled = [];
          for (const field of fields) {
            const value = matchFieldToData(field, data);
            if (value !== undefined) {
              const selector = field.id
                ? `#${field.id}`
                : `[name="${field.name}"]`;

              await context.page.fill(selector, String(value));
              filled.push({ field: field.name || field.id, value });
            }
          }

          // Submit if requested
          if (submitAfter) {
            const submitButton = await context.locator.findElement(
              `${formSelector} button[type="submit"], ${formSelector} input[type="submit"]`
            );
            await submitButton.click();
          }

          return {
            success: true,
            data: {
              filled,
              totalFields: fields.length,
            },
          };
        } catch (error) {
          return {
            success: false,
            error,
          };
        }
      },
    },
  ],
};

function matchFieldToData(
  field: any,
  data: Record<string, any>
): any | undefined {
  // Direct name match
  if (field.name in data) return data[field.name];

  // Direct ID match
  if (field.id in data) return data[field.id];

  // Fuzzy label matching
  const label = field.label.toLowerCase();
  for (const [key, value] of Object.entries(data)) {
    if (label.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Type-based matching
  if (field.type === 'email' && data.email) return data.email;
  if (field.type === 'tel' && data.phone) return data.phone;

  return undefined;
}
```

---

## 4. Selector Strategy Plugins

### 4.1 Selector Plugin Interface

```typescript
interface SelectorPlugin extends Plugin {
  strategies: SelectorStrategy[];
}

interface SelectorStrategy {
  name: string;
  priority: number;
  canHandle: (selector: string) => boolean;
  locate: (page: Page, selector: string) => Promise<ElementHandle | null>;
  locateAll: (page: Page, selector: string) => Promise<ElementHandle[]>;
}
```

### 4.2 Example: AI-Powered Selector Plugin

```typescript
const aiSelectorPlugin: SelectorPlugin = {
  name: 'ai-selector',
  version: '1.0.0',
  description: 'Use AI to find elements by natural language description',

  provides: [
    { type: 'selector', name: 'ai' },
  ],

  strategies: [
    {
      name: 'ai',
      priority: 100,

      canHandle: (selector: string) => {
        return selector.startsWith('ai:');
      },

      locate: async (page, selector) => {
        const description = selector.replace('ai:', '').trim();

        // Extract all visible elements with context
        const candidates = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          return Array.from(elements)
            .filter(el => {
              const rect = el.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0;
            })
            .map((el, index) => ({
              index,
              tagName: el.tagName,
              text: el.textContent?.trim().slice(0, 100),
              ariaLabel: el.getAttribute('aria-label'),
              role: el.getAttribute('role'),
              type: el.getAttribute('type'),
              id: el.id,
              classes: Array.from(el.classList),
            }));
        });

        // Use AI to match description to element
        const match = await matchElementWithAI(description, candidates);

        if (!match) return null;

        // Get the actual element
        const elements = await page.$$('*');
        return elements[match.index];
      },

      locateAll: async (page, selector) => {
        // For AI selectors, return single best match
        const element = await this.locate(page, selector);
        return element ? [element] : [];
      },
    },
  ],
};

async function matchElementWithAI(
  description: string,
  candidates: any[]
): Promise<any | null> {
  // Call AI service to match description to elements
  // This could use Claude, GPT, or a specialized element matching model

  const prompt = `
Given this description: "${description}"

Find the best matching element from these candidates:
${JSON.stringify(candidates, null, 2)}

Return the index of the best match, or null if no good match exists.
  `;

  // AI call implementation...
  // For example: const response = await claude.complete(prompt);

  return candidates[0]; // Placeholder
}
```

---

## 5. Tool Plugins

### 5.1 Tool Plugin Interface

```typescript
interface ToolPlugin extends Plugin {
  tools: MCPTool[];
}
```

### 5.2 Example: PDF Generation Tool Plugin

```typescript
const pdfPlugin: ToolPlugin = {
  name: 'pdf-tools',
  version: '1.0.0',
  description: 'Generate and manipulate PDFs from web pages',

  provides: [
    { type: 'tool', name: 'generate_pdf' },
    { type: 'tool', name: 'pdf_with_annotations' },
  ],

  tools: [
    {
      name: 'generate_pdf',
      description: 'Generate a PDF from the current page',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Output path for PDF',
          },
          format: {
            type: 'string',
            enum: ['A4', 'Letter', 'Legal'],
            default: 'A4',
          },
          landscape: {
            type: 'boolean',
            default: false,
          },
          printBackground: {
            type: 'boolean',
            default: true,
          },
          margin: {
            type: 'object',
            properties: {
              top: { type: 'string' },
              right: { type: 'string' },
              bottom: { type: 'string' },
              left: { type: 'string' },
            },
          },
        },
        required: ['path'],
      },

      handler: async (params, context) => {
        try {
          const session = await context.sessionManager.getSession(
            context.sessionId || 'default'
          );
          const page = session.context.pages()[0];

          await page.pdf({
            path: params.path,
            format: params.format,
            landscape: params.landscape,
            printBackground: params.printBackground,
            margin: params.margin,
          });

          return {
            success: true,
            data: {
              path: params.path,
              size: await getFileSize(params.path),
            },
          };
        } catch (error) {
          return {
            success: false,
            error: {
              code: 'PDF_GENERATION_FAILED',
              message: error.message,
            },
          };
        }
      },
    },

    {
      name: 'pdf_with_annotations',
      description: 'Generate PDF with highlighted elements',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          highlights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                selector: { type: 'string' },
                color: { type: 'string', default: 'yellow' },
                label: { type: 'string' },
              },
            },
          },
        },
        required: ['path', 'highlights'],
      },

      handler: async (params, context) => {
        const session = await context.sessionManager.getSession(
          context.sessionId || 'default'
        );
        const page = session.context.pages()[0];

        // Inject annotation overlay
        await page.evaluate((highlights) => {
          for (const highlight of highlights) {
            const element = document.querySelector(highlight.selector);
            if (!element) continue;

            const rect = element.getBoundingClientRect();
            const overlay = document.createElement('div');
            overlay.style.cssText = `
              position: absolute;
              top: ${rect.top + window.scrollY}px;
              left: ${rect.left + window.scrollX}px;
              width: ${rect.width}px;
              height: ${rect.height}px;
              background-color: ${highlight.color};
              opacity: 0.3;
              pointer-events: none;
              z-index: 9999;
            `;

            if (highlight.label) {
              overlay.innerHTML = `
                <div style="background: red; color: white; padding: 2px 5px; font-size: 12px;">
                  ${highlight.label}
                </div>
              `;
            }

            document.body.appendChild(overlay);
          }
        }, params.highlights);

        // Generate PDF
        await page.pdf({
          path: params.path,
          printBackground: true,
        });

        return {
          success: true,
          data: { path: params.path },
        };
      },
    },
  ],
};
```

---

## 6. Middleware Plugins

### 6.1 Middleware Interface

```typescript
interface MiddlewarePlugin extends Plugin {
  middleware: Middleware[];
}

interface Middleware {
  name: string;
  type: 'request' | 'response' | 'action' | 'all';
  priority: number;
  handler: MiddlewareHandler;
}

type MiddlewareHandler = (
  context: MiddlewareContext,
  next: () => Promise<void>
) => Promise<void>;

interface MiddlewareContext {
  type: 'tool_call' | 'resource_read' | 'prompt_render';
  request: any;
  response?: any;
  metadata: Record<string, any>;
}
```

### 6.2 Example: Rate Limiting Middleware

```typescript
const rateLimitPlugin: MiddlewarePlugin = {
  name: 'rate-limit',
  version: '1.0.0',
  description: 'Rate limiting for tool calls',

  provides: [
    { type: 'middleware', name: 'rate_limit' },
  ],

  middleware: [
    {
      name: 'rate_limit',
      type: 'request',
      priority: 10,

      handler: async (context, next) => {
        const key = `rate:${context.request.sessionId || 'default'}`;
        const limit = 100; // requests per minute
        const window = 60 * 1000; // 1 minute

        const count = await incrementCounter(key, window);

        if (count > limit) {
          throw new Error(`Rate limit exceeded: ${count}/${limit} requests per minute`);
        }

        context.metadata.rateLimitRemaining = limit - count;
        await next();
      },
    },
  ],
};
```

### 6.3 Example: Request Logging Middleware

```typescript
const loggingPlugin: MiddlewarePlugin = {
  name: 'request-logger',
  version: '1.0.0',
  description: 'Log all tool calls and responses',

  provides: [
    { type: 'middleware', name: 'request_logger' },
  ],

  middleware: [
    {
      name: 'request_logger',
      type: 'all',
      priority: 1,

      handler: async (context, next) => {
        const startTime = Date.now();
        const requestId = generateId();

        logger.info('Request started', {
          requestId,
          type: context.type,
          tool: context.request.method,
          params: context.request.params,
        });

        try {
          await next();

          const duration = Date.now() - startTime;
          logger.info('Request completed', {
            requestId,
            duration,
            success: true,
          });
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error('Request failed', {
            requestId,
            duration,
            error: error.message,
          });
          throw error;
        }
      },
    },
  ],
};
```

---

## 7. Event Hook System

### 7.1 Event Types

```typescript
type EventType =
  // Lifecycle Events
  | 'server:start'
  | 'server:stop'
  | 'plugin:loaded'
  | 'plugin:unloaded'

  // Session Events
  | 'session:created'
  | 'session:closed'
  | 'session:state_saved'
  | 'session:state_restored'

  // Browser Events
  | 'browser:launched'
  | 'browser:closed'
  | 'browser:crashed'

  // Page Events
  | 'page:created'
  | 'page:closed'
  | 'page:load'
  | 'page:navigation'
  | 'page:error'

  // Action Events
  | 'action:start'
  | 'action:complete'
  | 'action:error'

  // Network Events
  | 'network:request'
  | 'network:response'
  | 'network:error';
```

### 7.2 Event Subscription

```typescript
interface EventHookPlugin extends Plugin {
  hooks: EventHook[];
}

interface EventHook {
  event: EventType;
  handler: EventHandler;
}

type EventHandler = (event: Event) => Promise<void> | void;

interface Event {
  type: EventType;
  timestamp: number;
  data: any;
  metadata?: Record<string, any>;
}
```

### 7.3 Example: Analytics Event Hook

```typescript
const analyticsPlugin: EventHookPlugin = {
  name: 'analytics',
  version: '1.0.0',
  description: 'Track usage analytics',

  provides: [
    { type: 'reporter', name: 'analytics' },
  ],

  hooks: [
    {
      event: 'action:complete',
      handler: async (event) => {
        await sendAnalytics({
          event: 'action_completed',
          action: event.data.type,
          selector: event.data.selector,
          duration: event.data.duration,
          success: event.data.success,
        });
      },
    },

    {
      event: 'page:navigation',
      handler: async (event) => {
        await sendAnalytics({
          event: 'page_navigation',
          url: event.data.url,
          duration: event.data.timing.duration,
        });
      },
    },

    {
      event: 'action:error',
      handler: async (event) => {
        await sendAnalytics({
          event: 'action_error',
          action: event.data.type,
          error: event.data.error.code,
        });
      },
    },
  ],
};
```

---

## 8. Plugin Discovery and Loading

### 8.1 Plugin Directory Structure

```
plugins/
├── package.json (plugin metadata)
├── index.ts (plugin entry point)
├── actions/
│   ├── custom-action-1.ts
│   └── custom-action-2.ts
├── selectors/
│   └── ai-selector.ts
├── middleware/
│   └── rate-limit.ts
└── README.md
```

### 8.2 Plugin Package Format

```json
{
  "name": "@playwright-mcp/plugin-smart-fill",
  "version": "1.0.0",
  "description": "Smart form filling plugin",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",

  "keywords": ["playwright", "mcp", "plugin", "forms"],

  "playwrightMcp": {
    "pluginType": "action",
    "capabilities": ["smart_fill_form"],
    "dependencies": {
      "playwright": "^1.40.0"
    }
  },

  "peerDependencies": {
    "@playwright-mcp/server": "^1.0.0"
  }
}
```

### 8.3 Automatic Plugin Loading

```typescript
class PluginLoader {
  private pluginManager: PluginManager;
  private pluginDirs: string[];

  constructor(pluginManager: PluginManager, config: ServerConfig) {
    this.pluginManager = pluginManager;
    this.pluginDirs = config.pluginDirectories || [
      './plugins',
      '~/.playwright-mcp/plugins',
    ];
  }

  async loadAllPlugins(): Promise<void> {
    for (const dir of this.pluginDirs) {
      if (!await exists(dir)) continue;

      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(dir, entry.name);
          await this.loadPluginFromDirectory(pluginPath);
        }
      }
    }
  }

  private async loadPluginFromDirectory(dir: string): Promise<void> {
    const packagePath = path.join(dir, 'package.json');
    if (!await exists(packagePath)) return;

    const packageJson = JSON.parse(
      await fs.readFile(packagePath, 'utf-8')
    );

    // Check if it's a valid plugin
    if (!packageJson.playwrightMcp) return;

    // Load the plugin
    const entryPoint = path.join(dir, packageJson.main || 'index.js');
    await this.pluginManager.loadPlugin(entryPoint);
  }
}
```

---

## 9. Plugin Configuration

### 9.1 Plugin-Specific Configuration

```typescript
interface PluginConfig {
  enabled: boolean;
  priority?: number;
  options?: Record<string, any>;
}

// Server configuration
interface ServerConfig {
  plugins: Record<string, PluginConfig>;
}

// Example configuration
{
  "plugins": {
    "smart-fill": {
      "enabled": true,
      "priority": 10,
      "options": {
        "matchingStrategy": "fuzzy",
        "autoSubmit": false
      }
    },
    "ai-selector": {
      "enabled": true,
      "options": {
        "model": "claude-3-sonnet",
        "temperature": 0.1
      }
    },
    "rate-limit": {
      "enabled": true,
      "options": {
        "requestsPerMinute": 100,
        "burstLimit": 20
      }
    }
  }
}
```

### 9.2 Runtime Configuration Access

```typescript
class PluginConfigManager {
  private configs: Map<string, PluginConfig> = new Map();

  setConfig(pluginName: string, config: PluginConfig): void {
    this.configs.set(pluginName, config);
  }

  getConfig(pluginName: string): PluginConfig | undefined {
    return this.configs.get(pluginName);
  }

  isEnabled(pluginName: string): boolean {
    const config = this.configs.get(pluginName);
    return config?.enabled ?? true;
  }

  getOptions(pluginName: string): Record<string, any> {
    const config = this.configs.get(pluginName);
    return config?.options || {};
  }
}
```

---

## 10. Plugin Development Guide

### 10.1 Creating a New Plugin

```typescript
// my-plugin/index.ts
import { ActionPlugin, Plugin } from '@playwright-mcp/server';

export default {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',

  async init(context) {
    context.logger.info('Plugin initialized');
  },

  async destroy() {
    // Cleanup
  },

  provides: [
    { type: 'action', name: 'my_custom_action' },
  ],

  actions: [
    {
      name: 'my_custom_action',
      description: 'Do something custom',
      inputSchema: {
        type: 'object',
        properties: {
          param1: { type: 'string' },
        },
        required: ['param1'],
      },

      execute: async (params, context) => {
        // Implementation
        return {
          success: true,
          data: { result: 'done' },
        };
      },
    },
  ],
} as ActionPlugin;
```

### 10.2 Testing Plugins

```typescript
// my-plugin/test/plugin.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import plugin from '../index';

describe('MyPlugin', () => {
  let context: PluginContext;

  beforeAll(async () => {
    context = createMockContext();
    await plugin.init(context);
  });

  it('should execute custom action', async () => {
    const action = plugin.actions[0];
    const result = await action.execute(
      { param1: 'test' },
      createMockActionContext()
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

### 10.3 Publishing Plugins

```bash
# Build plugin
npm run build

# Test plugin
npm test

# Publish to npm
npm publish

# Install in MCP server
npm install @playwright-mcp/plugin-my-plugin

# Or use locally
playwright-mcp --plugin ./path/to/plugin
```

---

**Next**: [05-multi-agent-coordination.md](./05-multi-agent-coordination.md)
