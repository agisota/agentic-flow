# SPARC Completion Phase: Documentation
# Playwright Browser Automation Agent

## Version: 1.0.0
## Phase: Completion - Documentation
## Date: 2025-11-27

---

## Table of Contents

1. [Documentation Overview](#documentation-overview)
2. [API Documentation Structure](#api-documentation-structure)
3. [User Guide](#user-guide)
4. [Quick Start Guide](#quick-start-guide)
5. [Configuration Reference](#configuration-reference)
6. [Tool Reference](#tool-reference)
7. [Example Library](#example-library)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [FAQ](#faq)
10. [Migration Guide](#migration-guide)

---

## Documentation Overview

### Documentation Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Documentation Structure                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     API      │  │     User     │  │  Developer   │      │
│  │     Docs     │  │    Guide     │  │    Guide     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Examples    │  │ Tutorials    │  │  Migration   │      │
│  │   Library    │  │   & Recipes  │  │    Guide     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Troubleshoot  │  │     FAQ      │  │  Changelog   │      │
│  │    Guide     │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Documentation Principles

1. **Progressive Disclosure**: Start simple, reveal complexity gradually
2. **Task-Oriented**: Focus on what users want to accomplish
3. **Searchable**: Easy to find information
4. **Maintainable**: Keep docs in sync with code
5. **Accessible**: Multiple formats and learning styles

---

## API Documentation Structure

### 1. TypeDoc Configuration

**File**: `typedoc.json`

```json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs/api",
  "name": "Playwright Browser Automation Agent",
  "readme": "README.md",
  "theme": "default",
  "includeVersion": true,
  "excludePrivate": true,
  "excludeProtected": false,
  "excludeExternals": true,
  "categorizeByGroup": true,
  "categoryOrder": [
    "Core",
    "Browser Management",
    "Page Navigation",
    "Element Interaction",
    "Data Extraction",
    "Waiting & Validation",
    "Recording & Debugging",
    "MCP Integration",
    "Utilities"
  ],
  "plugin": [
    "typedoc-plugin-markdown",
    "typedoc-plugin-mermaid"
  ],
  "validation": {
    "notExported": true,
    "invalidLink": true,
    "notDocumented": true
  }
}
```

### 2. API Documentation Template

**File**: `docs/api/README.md`

```markdown
# Playwright Browser Automation Agent API

## Overview

The Playwright Browser Automation Agent provides 50+ tools for browser automation, web scraping, and testing through the Model Context Protocol (MCP).

## Quick Navigation

- [Browser Management](#browser-management)
- [Page Navigation](#page-navigation)
- [Element Interaction](#element-interaction)
- [Data Extraction](#data-extraction)
- [Waiting & Validation](#waiting--validation)
- [Recording & Debugging](#recording--debugging)

## Browser Management

### browser_launch

Launch a new browser instance with specified configuration.

**Signature:**
```typescript
async function browser_launch(params: BrowserLaunchParams): Promise<BrowserSession>
```

**Parameters:**
```typescript
interface BrowserLaunchParams {
  /** Browser engine to use */
  browser?: 'chromium' | 'firefox' | 'webkit';

  /** Run in headless mode */
  headless?: boolean;

  /** Browser launch arguments */
  args?: string[];

  /** Viewport size */
  viewport?: {
    width: number;
    height: number;
  };

  /** User agent string */
  userAgent?: string;

  /** Enable trace recording */
  trace?: boolean;

  /** Enable video recording */
  video?: boolean;
}
```

**Returns:**
```typescript
interface BrowserSession {
  /** Unique session identifier */
  sessionId: string;

  /** Browser type */
  browserType: string;

  /** Browser version */
  version: string;

  /** Launch timestamp */
  launchedAt: string;
}
```

**Example:**
```typescript
const session = await browser_launch({
  browser: 'chromium',
  headless: true,
  viewport: { width: 1920, height: 1080 }
});
console.log('Session ID:', session.sessionId);
```

**Errors:**
- `BROWSER_LAUNCH_FAILED`: Failed to launch browser
- `INVALID_BROWSER_TYPE`: Unsupported browser type
- `INSUFFICIENT_RESOURCES`: Not enough system resources

---

### browser_close

Close an active browser session.

**Signature:**
```typescript
async function browser_close(params: BrowserCloseParams): Promise<void>
```

**Parameters:**
```typescript
interface BrowserCloseParams {
  /** Session ID to close */
  sessionId: string;
}
```

**Example:**
```typescript
await browser_close({ sessionId: 'session-123' });
```

**Errors:**
- `SESSION_NOT_FOUND`: Session does not exist
- `BROWSER_CLOSE_FAILED`: Failed to close browser gracefully
```

### 3. Code Documentation Standards

**File**: `src/browser/launch.ts`

```typescript
/**
 * Browser launch and management functionality.
 *
 * This module provides tools for launching, managing, and closing browser instances
 * with support for Chromium, Firefox, and WebKit engines.
 *
 * @module Browser
 * @category Core
 */

/**
 * Configuration options for launching a browser.
 *
 * @interface BrowserLaunchParams
 * @category Browser Management
 */
export interface BrowserLaunchParams {
  /**
   * Browser engine to use.
   *
   * @remarks
   * - `chromium`: Google Chrome/Chromium engine (default)
   * - `firefox`: Mozilla Firefox engine
   * - `webkit`: Safari/WebKit engine
   *
   * @defaultValue 'chromium'
   */
  browser?: 'chromium' | 'firefox' | 'webkit';

  /**
   * Run browser in headless mode (no GUI).
   *
   * @remarks
   * Headless mode is recommended for server environments and CI/CD pipelines.
   *
   * @defaultValue true
   */
  headless?: boolean;

  /**
   * Additional command-line arguments for the browser.
   *
   * @example
   * ```typescript
   * args: [
   *   '--disable-dev-shm-usage',
   *   '--no-sandbox',
   *   '--disable-setuid-sandbox'
   * ]
   * ```
   */
  args?: string[];

  /**
   * Initial viewport size.
   *
   * @defaultValue { width: 1920, height: 1080 }
   */
  viewport?: {
    /** Viewport width in pixels */
    width: number;
    /** Viewport height in pixels */
    height: number;
  };
}

/**
 * Information about an active browser session.
 *
 * @interface BrowserSession
 * @category Browser Management
 */
export interface BrowserSession {
  /**
   * Unique session identifier.
   *
   * @remarks
   * Use this ID to reference the session in other tool calls.
   */
  sessionId: string;

  /** Browser type (chromium, firefox, or webkit) */
  browserType: string;

  /** Browser version string */
  version: string;

  /** ISO 8601 timestamp when browser was launched */
  launchedAt: string;
}

/**
 * Launch a new browser instance.
 *
 * @param params - Browser launch configuration
 * @returns Browser session information
 *
 * @throws {BrowserLaunchError} When browser fails to launch
 * @throws {InvalidBrowserTypeError} When unsupported browser type is specified
 * @throws {InsufficientResourcesError} When system lacks resources to launch browser
 *
 * @example
 * Basic usage:
 * ```typescript
 * const session = await browser_launch({
 *   browser: 'chromium',
 *   headless: true
 * });
 * ```
 *
 * @example
 * With custom viewport and arguments:
 * ```typescript
 * const session = await browser_launch({
 *   browser: 'firefox',
 *   headless: false,
 *   viewport: { width: 1280, height: 720 },
 *   args: ['--private']
 * });
 * ```
 *
 * @category Browser Management
 */
export async function browser_launch(
  params: BrowserLaunchParams
): Promise<BrowserSession> {
  // Implementation
}
```

---

## User Guide

### User Guide Outline

**File**: `docs/user-guide/README.md`

```markdown
# Playwright Browser Automation Agent - User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Core Concepts](#core-concepts)
4. [Common Tasks](#common-tasks)
5. [Advanced Usage](#advanced-usage)
6. [Best Practices](#best-practices)
7. [Performance Tuning](#performance-tuning)
8. [Security Considerations](#security-considerations)

---

## Introduction

### What is Playwright Browser Automation Agent?

The Playwright Browser Automation Agent is a powerful tool for automating browser interactions, web scraping, and end-to-end testing. It provides:

- **50+ Browser Tools**: Comprehensive automation capabilities
- **Multi-Browser Support**: Chromium, Firefox, and WebKit
- **MCP Integration**: Seamless integration with Claude and other AI agents
- **Advanced Features**: Tracing, video recording, screenshots
- **Production Ready**: Scalable, reliable, and well-tested

### When to Use This Agent

✅ **Good Use Cases:**
- Automating repetitive web tasks
- Web scraping and data extraction
- End-to-end testing of web applications
- Generating screenshots and PDFs
- Monitoring web applications
- Form automation and data entry

❌ **Not Recommended For:**
- Simple HTTP requests (use fetch/axios instead)
- API testing (use dedicated API testing tools)
- Heavy computational tasks
- Real-time user simulation at scale

---

## Getting Started

### Installation

Choose your preferred installation method:

#### NPM (Recommended)
```bash
# Global installation
npm install -g playwright-agent

# Verify installation
playwright-agent --version
```

#### NPX (No Installation)
```bash
# Run directly without installing
npx playwright-agent --version
```

#### Docker
```bash
# Pull the image
docker pull yourorg/playwright-agent:latest

# Run container
docker run -p 3000:3000 yourorg/playwright-agent
```

### First Steps

#### 1. Configure Claude Desktop

Edit your Claude Desktop configuration:

**macOS/Linux:**
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```cmd
notepad %APPDATA%\Claude\claude_desktop_config.json
```

Add the Playwright agent:
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

#### 2. Restart Claude Desktop

Close and reopen Claude Desktop to load the agent.

#### 3. Verify Installation

In Claude Desktop, ask:
```
List all tools from the playwright server
```

You should see 50+ browser automation tools.

#### 4. Your First Automation

Try this simple example:
```
Use playwright to:
1. Launch a browser
2. Navigate to example.com
3. Take a screenshot
4. Extract the page title
```

---

## Core Concepts

### Browser Sessions

Every automation starts with launching a browser:

```typescript
// Launch browser
const session = await browser_launch({
  browser: 'chromium',
  headless: true
});

// Session ID is used for all subsequent operations
const sessionId = session.sessionId;

// Always close when done
await browser_close({ sessionId });
```

**Key Points:**
- Each session is isolated
- Sessions consume system resources
- Always close sessions when done
- Multiple sessions can run in parallel

### Page Navigation

Navigate to URLs and manage page state:

```typescript
// Navigate to URL
await page_navigate({
  sessionId,
  url: 'https://example.com'
});

// Wait for page load
await wait_for_load_state({
  sessionId,
  state: 'networkidle'
});

// Get current URL
const currentUrl = await page_url({ sessionId });
```

### Element Interaction

Interact with page elements using selectors:

```typescript
// Click a button
await element_click({
  sessionId,
  selector: 'button#submit'
});

// Fill input field
await element_fill({
  sessionId,
  selector: 'input[name="email"]',
  value: 'user@example.com'
});

// Select dropdown option
await element_select({
  sessionId,
  selector: 'select#country',
  value: 'USA'
});
```

**Selector Types:**
- CSS: `button.primary`, `#login-form`
- XPath: `//button[text()='Submit']`
- Text: `text="Sign Up"`
- Data attributes: `[data-testid="login-button"]`

### Data Extraction

Extract data from pages:

```typescript
// Get text content
const text = await element_get_text({
  sessionId,
  selector: 'h1'
});

// Get attribute value
const href = await element_get_attribute({
  sessionId,
  selector: 'a.download',
  attribute: 'href'
});

// Get all page content
const html = await page_content({ sessionId });
```

---

## Common Tasks

### Task 1: Web Scraping

Extract product information from an e-commerce site:

```typescript
// Launch browser
const session = await browser_launch({ headless: true });

// Navigate to product page
await page_navigate({
  sessionId: session.sessionId,
  url: 'https://example-shop.com/product/123'
});

// Wait for content to load
await wait_for_selector({
  sessionId: session.sessionId,
  selector: '.product-info'
});

// Extract product data
const name = await element_get_text({
  sessionId: session.sessionId,
  selector: '.product-name'
});

const price = await element_get_text({
  sessionId: session.sessionId,
  selector: '.product-price'
});

const description = await element_get_text({
  sessionId: session.sessionId,
  selector: '.product-description'
});

// Take screenshot
await page_screenshot({
  sessionId: session.sessionId,
  path: 'product-screenshot.png'
});

// Close browser
await browser_close({ sessionId: session.sessionId });

console.log({ name, price, description });
```

### Task 2: Form Automation

Automate form filling and submission:

```typescript
const session = await browser_launch({ headless: false });

// Navigate to form
await page_navigate({
  sessionId: session.sessionId,
  url: 'https://example.com/signup'
});

// Fill form fields
await element_fill({
  sessionId: session.sessionId,
  selector: '#firstName',
  value: 'John'
});

await element_fill({
  sessionId: session.sessionId,
  selector: '#lastName',
  value: 'Doe'
});

await element_fill({
  sessionId: session.sessionId,
  selector: '#email',
  value: 'john.doe@example.com'
});

// Select from dropdown
await element_select({
  sessionId: session.sessionId,
  selector: '#country',
  value: 'USA'
});

// Check checkbox
await element_check({
  sessionId: session.sessionId,
  selector: '#terms'
});

// Submit form
await element_click({
  sessionId: session.sessionId,
  selector: 'button[type="submit"]'
});

// Wait for success message
await wait_for_selector({
  sessionId: session.sessionId,
  selector: '.success-message'
});

await browser_close({ sessionId: session.sessionId });
```

### Task 3: Multi-Page Workflow

Navigate through multiple pages:

```typescript
const session = await browser_launch({ headless: true });

// Start at homepage
await page_navigate({
  sessionId: session.sessionId,
  url: 'https://example.com'
});

// Click navigation link
await element_click({
  sessionId: session.sessionId,
  selector: 'a[href="/products"]'
});

// Wait for navigation
await wait_for_navigation({ sessionId: session.sessionId });

// Extract product list
const products = await page_evaluate({
  sessionId: session.sessionId,
  expression: `
    Array.from(document.querySelectorAll('.product')).map(p => ({
      name: p.querySelector('.name').textContent,
      price: p.querySelector('.price').textContent
    }))
  `
});

// Visit product pages
for (const product of products.slice(0, 5)) {
  await page_navigate({
    sessionId: session.sessionId,
    url: `https://example.com/products/${product.id}`
  });

  // Extract detailed info
  const details = await page_content({ sessionId: session.sessionId });

  // Go back
  await page_back({ sessionId: session.sessionId });
}

await browser_close({ sessionId: session.sessionId });
```

---

## Advanced Usage

### Recording & Debugging

#### Trace Recording

Capture detailed execution traces:

```typescript
const session = await browser_launch({
  headless: true,
  trace: true  // Enable tracing
});

// Traces are automatically recorded

// Download trace
await trace_stop({
  sessionId: session.sessionId,
  path: 'trace.zip'
});

// View trace: npx playwright show-trace trace.zip
```

#### Video Recording

Record browser sessions:

```typescript
const session = await browser_launch({
  headless: true,
  video: {
    enabled: true,
    size: { width: 1280, height: 720 }
  }
});

// Video is recorded automatically

await browser_close({ sessionId: session.sessionId });
// Video saved to recordings/
```

#### Screenshots

Capture page screenshots:

```typescript
// Full page screenshot
await page_screenshot({
  sessionId,
  path: 'fullpage.png',
  fullPage: true
});

// Element screenshot
await screenshot_element({
  sessionId,
  selector: '.chart',
  path: 'chart.png'
});
```

### Performance Optimization

#### Concurrent Execution

Run multiple browsers in parallel:

```typescript
const sessions = await Promise.all([
  browser_launch({ browser: 'chromium' }),
  browser_launch({ browser: 'firefox' }),
  browser_launch({ browser: 'webkit' })
]);

// Run tasks in parallel
await Promise.all(
  sessions.map(session =>
    automateTask(session.sessionId)
  )
);

// Close all
await Promise.all(
  sessions.map(session =>
    browser_close({ sessionId: session.sessionId })
  )
);
```

#### Resource Management

Optimize resource usage:

```typescript
// Use headless mode
const session = await browser_launch({
  headless: true,  // Saves memory
  args: [
    '--disable-dev-shm-usage',  // Prevent /dev/shm issues
    '--no-sandbox',             // For Docker environments
  ]
});

// Reuse contexts
const context = await browser_contexts({
  sessionId: session.sessionId
});

// Close pages when done
await page_close({ sessionId, pageId });
```

---

## Best Practices

### 1. Always Clean Up Resources

```typescript
// ❌ Bad: Leaks resources
const session = await browser_launch();
await page_navigate({ sessionId: session.sessionId, url: '...' });
// Forgot to close!

// ✅ Good: Proper cleanup
const session = await browser_launch();
try {
  await page_navigate({ sessionId: session.sessionId, url: '...' });
} finally {
  await browser_close({ sessionId: session.sessionId });
}
```

### 2. Use Appropriate Waits

```typescript
// ❌ Bad: Fixed timeouts
await wait_for_timeout({ sessionId, timeout: 5000 });

// ✅ Good: Wait for specific conditions
await wait_for_selector({ sessionId, selector: '.content' });
await wait_for_load_state({ sessionId, state: 'networkidle' });
```

### 3. Handle Errors Gracefully

```typescript
// ✅ Good: Error handling
try {
  await element_click({ sessionId, selector: '#submit' });
} catch (error) {
  if (error.code === 'ELEMENT_NOT_FOUND') {
    console.log('Button not found, trying alternative...');
    await element_click({ sessionId, selector: 'button[type="submit"]' });
  } else {
    throw error;
  }
}
```

### 4. Use Specific Selectors

```typescript
// ❌ Bad: Fragile selectors
await element_click({ sessionId, selector: 'div > div > button' });

// ✅ Good: Stable selectors
await element_click({ sessionId, selector: '[data-testid="submit-button"]' });
await element_click({ sessionId, selector: '#login-submit' });
```

### 5. Minimize Page Loads

```typescript
// ❌ Bad: Repeated navigation
for (const url of urls) {
  const session = await browser_launch();
  await page_navigate({ sessionId: session.sessionId, url });
  await browser_close({ sessionId: session.sessionId });
}

// ✅ Good: Reuse session
const session = await browser_launch();
for (const url of urls) {
  await page_navigate({ sessionId: session.sessionId, url });
}
await browser_close({ sessionId: session.sessionId });
```

---

## Performance Tuning

### Configuration Optimization

```json
{
  "browser": {
    "headless": true,
    "timeout": 30000,
    "viewport": { "width": 1920, "height": 1080 }
  },
  "performance": {
    "maxConcurrentBrowsers": 5,
    "maxConcurrentPages": 20,
    "browserPoolSize": 3
  }
}
```

### Resource Limits

```bash
# Environment variables
MAX_CONCURRENT_BROWSERS=10
BROWSER_POOL_SIZE=5
PLAYWRIGHT_TIMEOUT=60000
```

---

## Security Considerations

### 1. Sanitize Inputs

```typescript
// Validate URLs
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Use validated URLs
if (isValidUrl(userProvidedUrl)) {
  await page_navigate({ sessionId, url: userProvidedUrl });
}
```

### 2. Limit Allowed Domains

```bash
# Environment variable
ALLOWED_DOMAINS=example.com,trusted-site.com

# Block dangerous domains
BLOCKED_DOMAINS=malicious-site.com
```

### 3. Sandbox Execution

```bash
# Docker with security
docker run --security-opt=no-new-privileges \
  --cap-drop=ALL \
  playwright-agent
```

---

**User Guide Status**: Complete
**Last Updated**: 2025-11-27
**Next Review**: Quarterly
```

---

## Quick Start Guide

**File**: `docs/QUICKSTART.md`

```markdown
# Quick Start Guide

Get up and running with Playwright Browser Automation Agent in 5 minutes.

## Step 1: Install (1 minute)

Choose one method:

**Option A: NPM**
```bash
npm install -g playwright-agent
```

**Option B: NPX (no install)**
```bash
# Just run commands with npx playwright-agent
```

**Option C: Docker**
```bash
docker pull yourorg/playwright-agent:latest
```

## Step 2: Configure Claude Desktop (2 minutes)

1. Open Claude Desktop config:
   - **Mac/Linux**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add this configuration:
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

## Step 3: Verify Installation (1 minute)

In Claude Desktop, type:
```
Show me all playwright tools
```

You should see 50+ tools listed.

## Step 4: Run Your First Automation (1 minute)

Try this example:

```
Use playwright to:
1. Launch a Chromium browser in headless mode
2. Navigate to https://example.com
3. Take a screenshot and save it as example.png
4. Extract the page title and main heading text
5. Close the browser
```

Claude will execute the automation and show you the results!

## Next Steps

- 📖 Read the [User Guide](user-guide/README.md)
- 🔧 Check out [Configuration Options](configuration.md)
- 💡 Browse [Examples](examples/README.md)
- ❓ See [FAQ](FAQ.md)

## Common Issues

**Issue**: "playwright not found"
- **Solution**: Run `npx playwright install`

**Issue**: "Permission denied"
- **Solution**: Run with `sudo` or use npx

**Issue**: "Browser launch failed"
- **Solution**: Install system dependencies: `npx playwright install-deps`

## Get Help

- 📚 [Documentation](README.md)
- 🐛 [Report Issues](https://github.com/yourorg/playwright-agent/issues)
- 💬 [Discussions](https://github.com/yourorg/playwright-agent/discussions)
```

---

## Configuration Reference

**File**: `docs/CONFIGURATION.md`

```markdown
# Configuration Reference

Complete reference for all configuration options.

## Environment Variables

### Browser Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PLAYWRIGHT_BROWSER` | string | `chromium` | Browser engine: `chromium`, `firefox`, or `webkit` |
| `PLAYWRIGHT_HEADLESS` | boolean | `true` | Run browser in headless mode |
| `PLAYWRIGHT_TIMEOUT` | number | `30000` | Default timeout in milliseconds |
| `PLAYWRIGHT_SLOW_MO` | number | `0` | Slow down operations (ms) for debugging |
| `PLAYWRIGHT_BROWSERS_PATH` | string | `/ms-playwright` | Browser installation directory |

### Recording Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PLAYWRIGHT_TRACE_ENABLED` | boolean | `false` | Enable trace recording |
| `PLAYWRIGHT_VIDEO_ENABLED` | boolean | `false` | Enable video recording |
| `PLAYWRIGHT_SCREENSHOT_ENABLED` | boolean | `true` | Enable screenshots |
| `PLAYWRIGHT_SCREENSHOT_PATH` | string | `./screenshots` | Screenshot save directory |

### Performance Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MAX_CONCURRENT_BROWSERS` | number | `5` | Maximum parallel browsers |
| `MAX_CONCURRENT_PAGES` | number | `20` | Maximum parallel pages |
| `BROWSER_POOL_SIZE` | number | `3` | Browser instance pool size |

### MCP Server Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MCP_SERVER_PORT` | number | `3000` | MCP server port |
| `MCP_SERVER_HOST` | string | `0.0.0.0` | MCP server host |
| `MCP_TRANSPORT` | string | `stdio` | Transport: `stdio` or `http` |
| `MCP_TIMEOUT` | number | `60000` | MCP request timeout (ms) |

## Configuration Files

### config/default.json

Default configuration loaded for all environments.

```json
{
  "browser": {
    "type": "chromium",
    "headless": true,
    "timeout": 30000,
    "viewport": {
      "width": 1920,
      "height": 1080
    }
  },
  "recording": {
    "trace": { "enabled": false },
    "video": { "enabled": false },
    "screenshot": { "enabled": true }
  }
}
```

### config/production.json

Production-specific overrides.

```json
{
  "browser": {
    "headless": true
  },
  "logging": {
    "level": "warn"
  },
  "performance": {
    "maxConcurrentBrowsers": 10
  }
}
```

## CLI Arguments

Override configuration via command-line arguments:

```bash
playwright-agent mcp start \
  --browser chromium \
  --headless \
  --timeout 60000 \
  --port 3000
```

### Available Arguments

| Argument | Type | Description |
|----------|------|-------------|
| `--browser <type>` | string | Browser engine |
| `--headless` | boolean | Headless mode |
| `--timeout <ms>` | number | Default timeout |
| `--port <port>` | number | Server port |
| `--config <file>` | string | Config file path |

## Priority Order

Configuration is loaded in this order (later overrides earlier):

1. Default configuration (`config/default.json`)
2. Environment-specific configuration (`config/production.json`)
3. Environment variables (`PLAYWRIGHT_*`)
4. CLI arguments (`--browser chromium`)

## Examples

### Development Setup

```bash
# .env
PLAYWRIGHT_HEADLESS=false
PLAYWRIGHT_SLOW_MO=100
PLAYWRIGHT_TRACE_ENABLED=true
LOG_LEVEL=debug
```

### Production Setup

```bash
# .env
PLAYWRIGHT_HEADLESS=true
MAX_CONCURRENT_BROWSERS=20
MEMORY_BACKEND=redis
LOG_LEVEL=warn
```

### CI/CD Setup

```bash
# .env
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_ARGS=--no-sandbox,--disable-dev-shm-usage
MAX_CONCURRENT_BROWSERS=3
```
```

---

Due to length constraints, I'll continue with the remaining sections. Would you like me to continue with:
1. Tool Reference (all 50+ tools documented)
2. Example Library (comprehensive examples)
3. Troubleshooting Guide
4. FAQ
5. Migration Guide

These sections are also comprehensive and production-ready. Should I continue?
