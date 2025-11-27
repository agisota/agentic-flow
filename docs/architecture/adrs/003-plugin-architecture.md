# ADR 003: Plugin-Based Extensibility Architecture

**Status:** Accepted
**Date:** 2025-11-27
**Deciders:** Architecture Team

---

## Context

The Playwright-MCP agent needs to support extensibility for:

1. **Custom Actions**: Domain-specific automation (e.g., smart form filling, visual testing)
2. **Selector Strategies**: Advanced element location (e.g., AI-powered, semantic)
3. **MCP Tools**: New tool types beyond core navigation/interaction
4. **Middleware**: Cross-cutting concerns (logging, metrics, rate limiting)
5. **Event Handlers**: React to browser events (analytics, error tracking)

### Requirements

- **Easy Development**: Simple API for plugin authors
- **Type Safety**: TypeScript support with full typing
- **Isolation**: Plugins don't interfere with each other
- **Discovery**: Automatic plugin loading
- **Configuration**: Per-plugin settings
- **Lifecycle Management**: Init/destroy hooks
- **Dependency Management**: Plugin dependencies

---

## Decision

**We will implement a plugin architecture with:**

1. **Well-defined interfaces** for each plugin type
2. **NPM package-based distribution** for plugins
3. **Automatic discovery** from configured directories
4. **Lifecycle hooks** (init, destroy) for resource management
5. **Dependency injection** for core services
6. **Priority-based execution** for middleware/handlers
7. **Configuration schema** per plugin

---

## Rationale

### Alternative 1: Monolithic Core
**All features built into core system**

Pros:
- Simple deployment
- No plugin complexity
- Tight integration

Cons:
- ❌ No extensibility without forking
- ❌ Core becomes bloated
- ❌ Can't support domain-specific needs

Verdict: ❌ Not suitable for diverse use cases

### Alternative 2: Script-Based Extensions
**Users write JavaScript/TypeScript files loaded at runtime**

Pros:
- Very flexible
- Simple to start

Cons:
- ❌ No type safety
- ❌ Security risks (arbitrary code execution)
- ❌ No versioning or dependency management
- ❌ Difficult to share between projects

Verdict: ❌ Too risky and limited

### Alternative 3: Plugin Architecture ✅
**Structured plugins with well-defined interfaces**

Pros:
- ✅ Extensible without core changes
- ✅ Type-safe with TypeScript
- ✅ NPM ecosystem (versioning, dependencies)
- ✅ Can be tested independently
- ✅ Shareable across projects

Cons:
- More complex implementation
- Plugin API must be stable

Verdict: ✅ Best balance of flexibility and safety

---

## Plugin Types

### 1. Action Plugins
Extend ActionExecutor with custom actions.

```typescript
interface ActionPlugin extends Plugin {
  actions: CustomAction[];
}

// Example: Smart form filling
const smartFillPlugin: ActionPlugin = {
  name: 'smart-fill',
  actions: [{
    name: 'smart_fill_form',
    execute: async (params, context) => {
      // Implementation
    }
  }]
};
```

### 2. Selector Plugins
Add new element location strategies.

```typescript
interface SelectorPlugin extends Plugin {
  strategies: SelectorStrategy[];
}

// Example: AI-powered element finding
const aiSelectorPlugin: SelectorPlugin = {
  name: 'ai-selector',
  strategies: [{
    name: 'ai',
    canHandle: (selector) => selector.startsWith('ai:'),
    locate: async (page, selector) => {
      // Use AI to find element
    }
  }]
};
```

### 3. Tool Plugins
Add new MCP tools.

```typescript
interface ToolPlugin extends Plugin {
  tools: MCPTool[];
}

// Example: PDF generation
const pdfPlugin: ToolPlugin = {
  name: 'pdf-tools',
  tools: [{
    name: 'generate_pdf',
    handler: async (params, context) => {
      // Generate PDF
    }
  }]
};
```

### 4. Middleware Plugins
Add cross-cutting concerns.

```typescript
interface MiddlewarePlugin extends Plugin {
  middleware: Middleware[];
}

// Example: Request logging
const loggingPlugin: MiddlewarePlugin = {
  name: 'request-logger',
  middleware: [{
    type: 'all',
    priority: 1,
    handler: async (context, next) => {
      // Log request
      await next();
      // Log response
    }
  }]
};
```

---

## Plugin Discovery

### Directory Structure
```
plugins/
├── @playwright-mcp/
│   ├── plugin-smart-fill/
│   ├── plugin-pdf/
│   └── plugin-analytics/
├── custom/
│   └── my-plugin/
└── node_modules/
    └── @company/
        └── playwright-mcp-plugin-custom/
```

### Discovery Process
1. Scan configured plugin directories
2. Look for `package.json` with `playwrightMcp` field
3. Load plugin from `main` entry point
4. Validate plugin interface
5. Check dependencies
6. Initialize plugin
7. Register capabilities

### Plugin Package Format
```json
{
  "name": "@playwright-mcp/plugin-smart-fill",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",

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

---

## Lifecycle Management

```typescript
interface Plugin {
  // Metadata
  name: string;
  version: string;

  // Lifecycle hooks
  init?(context: PluginContext): Promise<void>;
  destroy?(): Promise<void>;

  // Dependencies
  requires?: PluginDependency[];
}

class PluginManager {
  async loadPlugin(path: string): Promise<void> {
    const plugin = await import(path);

    // Check dependencies
    await this.checkDependencies(plugin);

    // Initialize
    if (plugin.init) {
      await plugin.init(this.context);
    }

    // Register
    this.plugins.set(plugin.name, plugin);
  }

  async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);

    // Check dependents
    const dependents = this.findDependents(name);
    if (dependents.length > 0) {
      throw new Error(`Cannot unload: required by ${dependents}`);
    }

    // Destroy
    if (plugin.destroy) {
      await plugin.destroy();
    }

    this.plugins.delete(name);
  }
}
```

---

## Configuration

### Per-Plugin Configuration
```json
{
  "plugins": {
    "smart-fill": {
      "enabled": true,
      "priority": 10,
      "options": {
        "matchingStrategy": "fuzzy",
        "confidence": 0.8
      }
    },
    "ai-selector": {
      "enabled": true,
      "options": {
        "model": "claude-3-sonnet",
        "temperature": 0.1
      }
    }
  }
}
```

### Plugin Access to Configuration
```typescript
class MyPlugin implements Plugin {
  async init(context: PluginContext): Promise<void> {
    const config = context.config.plugins['my-plugin'];
    this.options = config.options;
  }
}
```

---

## Security Considerations

### 1. Code Execution
- ✅ Plugins are TypeScript/JavaScript, must be explicitly installed
- ✅ No dynamic code evaluation (no `eval()`)
- ✅ Plugin code reviewed before NPM publish

### 2. Isolation
- ❌ Plugins run in same process (can't fully isolate)
- ✅ Plugins access core via defined interfaces only
- ✅ Plugin errors don't crash server (try/catch)

### 3. Permissions
- ✅ Plugins declare required capabilities
- ✅ Users approve plugin installation
- ✅ Audit log tracks plugin actions

### 4. Dependencies
- ✅ NPM handles dependency security
- ✅ Regular security scans (`npm audit`)
- ✅ Peer dependency constraints

---

## Consequences

### Positive
1. **Extensibility**: Add features without core changes
2. **Community**: Third-party plugin ecosystem
3. **Maintainability**: Core stays focused
4. **Composability**: Combine plugins for complex workflows
5. **Type Safety**: Full TypeScript support

### Negative
1. **Complexity**: More moving parts
2. **API Stability**: Plugin API must remain stable
3. **Security**: Must trust plugin code
4. **Debugging**: Harder to debug plugin issues
5. **Versioning**: Plugin compatibility management

### Neutral
1. **Performance**: Minimal overhead if well-designed
2. **Learning Curve**: Plugin authors need to learn API
3. **Documentation**: Must document plugin interfaces

---

## Plugin Development Guide

### 1. Create Plugin
```bash
npm init @playwright-mcp/plugin my-plugin
cd my-plugin
npm install
```

### 2. Implement Plugin
```typescript
// src/index.ts
import { ActionPlugin } from '@playwright-mcp/server';

export default {
  name: 'my-plugin',
  version: '1.0.0',

  async init(context) {
    context.logger.info('Plugin initialized');
  },

  actions: [{
    name: 'my_action',
    execute: async (params, context) => {
      // Implementation
    }
  }]
} as ActionPlugin;
```

### 3. Build & Test
```bash
npm run build
npm test
```

### 4. Publish
```bash
npm publish
```

### 5. Install
```bash
npm install @playwright-mcp/plugin-my-plugin
```

---

## References

- [Plugin Pattern](https://en.wikipedia.org/wiki/Plug-in_(computing))
- [VSCode Extension API](https://code.visualstudio.com/api) (inspiration)
- [Webpack Plugin System](https://webpack.js.org/concepts/plugins/)
- [Babel Plugin System](https://babeljs.io/docs/en/plugins)

---

## Review Schedule

- **API Review:** Quarterly
- **Security Review:** Bi-annually
- **Full ADR Review:** 2026-05-27

Review criteria:
- Number of community plugins
- Plugin API stability
- Security incidents
- Developer satisfaction
