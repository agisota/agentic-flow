# MCP Server Design

**Version:** 1.0.0
**Date:** 2025-11-27

---

## 1. MCP Server Architecture

### 1.1 Overview

The MCP Server layer exposes Playwright browser automation capabilities through the Model Context Protocol, enabling AI models to interact with browsers in a standardized, secure way.

### 1.2 Server Structure

```
┌─────────────────────────────────────────────────────────┐
│                    MCP Server                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Transport Layer                       │  │
│  │  ┌────────┐  ┌────────┐  ┌──────────┐          │  │
│  │  │ Stdio  │  │  HTTP  │  │WebSocket │          │  │
│  │  └────────┘  └────────┘  └──────────┘          │  │
│  └──────────────────────────────────────────────────┘  │
│                        │                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Protocol Handler                         │  │
│  │  - Request parsing                               │  │
│  │  - Response formatting                           │  │
│  │  - Error handling                                │  │
│  └──────────────────────────────────────────────────┘  │
│                        │                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Tool Registry                         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐ │  │
│  │  │ Navigation │  │ Interaction│  │Extraction │ │  │
│  │  │   Tools    │  │   Tools    │  │  Tools    │ │  │
│  │  └────────────┘  └────────────┘  └───────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                        │                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Resource Manager                         │  │
│  │  - Page resources                                │  │
│  │  - Element resources                             │  │
│  │  - Screenshot resources                          │  │
│  └──────────────────────────────────────────────────┘  │
│                        │                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Prompt Library                          │  │
│  │  - Common automation patterns                    │  │
│  │  - Template system                               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
              Core Components Layer
```

---

## 2. Tool Organization

### 2.1 Tool Categories

#### Navigation Tools
Purpose: Control browser navigation and page lifecycle

| Tool Name | Description | Input Schema |
|-----------|-------------|--------------|
| `navigate` | Navigate to URL | `{url: string, waitUntil?: string, timeout?: number}` |
| `go_back` | Navigate back | `{}` |
| `go_forward` | Navigate forward | `{}` |
| `reload` | Reload page | `{ignoreCache?: boolean}` |
| `wait_for_load` | Wait for page load | `{state?: 'load'\|'domcontentloaded'\|'networkidle'}` |

#### Interaction Tools
Purpose: Perform user interactions with page elements

| Tool Name | Description | Input Schema |
|-----------|-------------|--------------|
| `click` | Click element | `{selector: string, button?: string, clickCount?: number}` |
| `type` | Type text | `{selector: string, text: string, delay?: number}` |
| `fill` | Fill input | `{selector: string, value: string}` |
| `select` | Select option | `{selector: string, value: string}` |
| `check` | Check checkbox | `{selector: string}` |
| `uncheck` | Uncheck checkbox | `{selector: string}` |
| `hover` | Hover element | `{selector: string}` |
| `scroll` | Scroll page | `{x?: number, y?: number}` |
| `drag_and_drop` | Drag element | `{source: string, target: string}` |
| `upload_file` | Upload files | `{selector: string, files: string[]}` |
| `press` | Press key | `{key: string, modifiers?: string[]}` |

#### Extraction Tools
Purpose: Extract data and content from pages

| Tool Name | Description | Input Schema |
|-----------|-------------|--------------|
| `get_text` | Get element text | `{selector: string}` |
| `get_all_text` | Get text from all matches | `{selector: string}` |
| `get_attribute` | Get element attribute | `{selector: string, attribute: string}` |
| `get_value` | Get input value | `{selector: string}` |
| `screenshot` | Take screenshot | `{fullPage?: boolean, type?: 'png'\|'jpeg', quality?: number}` |
| `screenshot_element` | Screenshot element | `{selector: string, type?: 'png'\|'jpeg'}` |
| `extract_table` | Extract table data | `{selector: string}` |
| `extract_links` | Extract all links | `{selector?: string}` |
| `get_page_metadata` | Get page metadata | `{}` |
| `evaluate` | Run JS in browser | `{script: string, args?: any[]}` |

#### Session Tools
Purpose: Manage browser sessions and contexts

| Tool Name | Description | Input Schema |
|-----------|-------------|--------------|
| `create_session` | Create new session | `{userAgent?: string, viewport?: object}` |
| `close_session` | Close session | `{sessionId: string}` |
| `list_sessions` | List all sessions | `{}` |
| `get_cookies` | Get cookies | `{sessionId?: string}` |
| `set_cookies` | Set cookies | `{cookies: Cookie[], sessionId?: string}` |
| `save_state` | Save session state | `{sessionId: string}` |
| `restore_state` | Restore session state | `{sessionId: string, state: object}` |

#### Network Tools
Purpose: Control and monitor network requests

| Tool Name | Description | Input Schema |
|-----------|-------------|--------------|
| `block_resource` | Block resource type | `{resourceType: string}` |
| `mock_response` | Mock API response | `{url: string, response: object}` |
| `set_offline` | Set offline mode | `{offline: boolean}` |
| `set_throttling` | Set network throttling | `{downloadSpeed: number, uploadSpeed: number, latency: number}` |
| `get_request_log` | Get network log | `{filter?: string}` |

#### Element Tools
Purpose: Element discovery and validation

| Tool Name | Description | Input Schema |
|-----------|-------------|--------------|
| `find_element` | Find single element | `{selector: string, timeout?: number}` |
| `find_elements` | Find multiple elements | `{selector: string}` |
| `element_exists` | Check if element exists | `{selector: string}` |
| `is_visible` | Check if visible | `{selector: string}` |
| `is_enabled` | Check if enabled | `{selector: string}` |
| `wait_for_selector` | Wait for selector | `{selector: string, state?: string, timeout?: number}` |

### 2.2 Tool Implementation Pattern

```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: ToolHandler;
}

type ToolHandler = (
  params: Record<string, any>,
  context: ToolContext
) => Promise<ToolResult>;

interface ToolContext {
  sessionId?: string;
  browserManager: BrowserManager;
  sessionManager: SessionManager;
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Example tool implementation
const navigateTool: MCPTool = {
  name: 'navigate',
  description: 'Navigate to a URL in the browser',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to navigate to',
      },
      waitUntil: {
        type: 'string',
        enum: ['load', 'domcontentloaded', 'networkidle'],
        description: 'When to consider navigation complete',
        default: 'load',
      },
      timeout: {
        type: 'number',
        description: 'Navigation timeout in milliseconds',
        default: 30000,
      },
    },
    required: ['url'],
  },
  handler: async (params, context) => {
    try {
      const session = await context.sessionManager.getSession(
        context.sessionId || 'default'
      );

      const page = session.context.pages()[0] ||
        await session.context.newPage();

      const controller = new PageControllerImpl(page, eventBus);

      const result = await controller.navigate(params.url, {
        waitUntil: params.waitUntil,
        timeout: params.timeout,
      });

      return {
        success: true,
        data: {
          url: result.finalUrl,
          status: result.status,
          timing: result.timing,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NAVIGATION_FAILED',
          message: error.message,
          details: { url: params.url },
        },
      };
    }
  },
};
```

---

## 3. Resource Types

### 3.1 Resource URI Scheme

Resources use a hierarchical URI scheme:

```
playwright:///{resourceType}/{identifier}
```

Examples:
- `playwright:///session/abc123`
- `playwright:///page/abc123/page-1`
- `playwright:///element/abc123/page-1/element-5`
- `playwright:///screenshot/abc123/page-1/2025-11-27T10:30:00Z`

### 3.2 Page Resources

**URI Pattern**: `playwright:///page/{sessionId}/{pageId}`

**Schema**:
```typescript
interface PageResource {
  uri: string;
  name: string;
  description?: string;
  mimeType: 'application/json';
  metadata: {
    url: string;
    title: string;
    viewport: { width: number; height: number };
    createdAt: number;
  };
}
```

**Operations**:
- `list`: List all pages in a session
- `read`: Get page details (URL, title, metadata)
- `subscribe`: Get notified of page events (load, navigation)

### 3.3 Element Resources

**URI Pattern**: `playwright:///element/{sessionId}/{pageId}/{elementId}`

**Schema**:
```typescript
interface ElementResource {
  uri: string;
  name: string;
  description?: string;
  mimeType: 'application/json';
  metadata: {
    selector: string;
    tagName: string;
    attributes: Record<string, string>;
    boundingBox?: { x: number; y: number; width: number; height: number };
  };
}
```

**Operations**:
- `list`: List elements matching a selector
- `read`: Get element details (attributes, position, etc.)

### 3.4 Screenshot Resources

**URI Pattern**: `playwright:///screenshot/{sessionId}/{pageId}/{timestamp}`

**Schema**:
```typescript
interface ScreenshotResource {
  uri: string;
  name: string;
  description?: string;
  mimeType: 'image/png' | 'image/jpeg';
  metadata: {
    width: number;
    height: number;
    fullPage: boolean;
    capturedAt: number;
  };
  content: Buffer; // Base64 encoded
}
```

**Operations**:
- `read`: Get screenshot image
- `list`: List all screenshots for a session

### 3.5 Network Log Resources

**URI Pattern**: `playwright:///network-log/{sessionId}/{pageId}`

**Schema**:
```typescript
interface NetworkLogResource {
  uri: string;
  name: string;
  mimeType: 'application/json';
  metadata: {
    requestCount: number;
    responseCount: number;
    errorCount: number;
  };
  content: NetworkEntry[];
}

interface NetworkEntry {
  url: string;
  method: string;
  status: number;
  resourceType: string;
  timing: {
    startTime: number;
    duration: number;
  };
}
```

---

## 4. Prompt Templates

### 4.1 Template System

Prompts provide reusable automation patterns with parameter substitution.

```typescript
interface MCPPrompt {
  name: string;
  description: string;
  arguments: PromptArgument[];
  template: string;
}

interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
  default?: string;
}
```

### 4.2 Common Automation Prompts

#### Web Scraping Prompt
```yaml
name: scrape_website
description: Scrape structured data from a website
arguments:
  - name: url
    description: The URL to scrape
    required: true
  - name: selectors
    description: JSON object mapping field names to CSS selectors
    required: true

template: |
  I need to scrape data from {{url}}. Please:

  1. Navigate to the URL
  2. Wait for the page to fully load
  3. Extract data using these selectors:
  {{#each selectors}}
     - {{@key}}: {{this}}
  {{/each}}
  4. Return the extracted data as a JSON object

  Handle any errors gracefully and include metadata about the scrape
  (timestamp, page title, final URL after redirects).
```

#### Form Filling Prompt
```yaml
name: fill_form
description: Fill out and submit a web form
arguments:
  - name: url
    description: The URL containing the form
    required: true
  - name: form_data
    description: JSON object with form field values
    required: true
  - name: submit_button
    description: Selector for submit button
    required: false
    default: "button[type='submit']"

template: |
  Please fill out and submit a form at {{url}}:

  1. Navigate to the page
  2. Fill the following fields:
  {{#each form_data}}
     - {{@key}}: {{this}}
  {{/each}}
  3. Click the submit button: {{submit_button}}
  4. Wait for submission to complete
  5. Return the result URL and any success/error messages
```

#### Screenshot Comparison Prompt
```yaml
name: visual_regression
description: Compare page screenshots for visual changes
arguments:
  - name: url
    description: The URL to test
    required: true
  - name: baseline_screenshot
    description: Path to baseline screenshot
    required: true

template: |
  Perform visual regression testing for {{url}}:

  1. Navigate to the URL
  2. Take a full-page screenshot
  3. Compare with baseline: {{baseline_screenshot}}
  4. Report any visual differences
  5. Highlight areas that changed
  6. Return diff percentage and annotated screenshot
```

#### Login Flow Prompt
```yaml
name: authenticate
description: Log into a website
arguments:
  - name: url
    description: Login page URL
    required: true
  - name: username
    description: Username or email
    required: true
  - name: password
    description: Password
    required: true
  - name: username_selector
    description: Username field selector
    required: false
    default: "input[name='username'], input[type='email']"
  - name: password_selector
    description: Password field selector
    required: false
    default: "input[name='password'], input[type='password']"
  - name: submit_selector
    description: Submit button selector
    required: false
    default: "button[type='submit']"

template: |
  Please log into {{url}}:

  1. Navigate to the login page
  2. Fill username field ({{username_selector}}): {{username}}
  3. Fill password field ({{password_selector}}): [REDACTED]
  4. Click submit ({{submit_selector}})
  5. Wait for redirect/success
  6. Save authentication cookies
  7. Return session ID for future requests

  Note: Handle 2FA prompts if they appear.
```

#### E2E Testing Prompt
```yaml
name: e2e_test
description: Run end-to-end user journey test
arguments:
  - name: test_scenario
    description: Description of the user journey
    required: true
  - name: start_url
    description: Starting URL
    required: true

template: |
  Execute this E2E test scenario: {{test_scenario}}

  Starting at: {{start_url}}

  For each step:
  1. Describe what you're doing
  2. Take a screenshot
  3. Verify expected outcome
  4. Report any issues

  At the end, provide:
  - Test result (pass/fail)
  - Screenshots from each step
  - Performance metrics
  - Any errors encountered
```

### 4.3 Prompt Registration

```typescript
class PromptLibrary {
  private prompts: Map<string, MCPPrompt> = new Map();

  register(prompt: MCPPrompt): void {
    this.prompts.set(prompt.name, prompt);
  }

  get(name: string): MCPPrompt | undefined {
    return this.prompts.get(name);
  }

  list(): MCPPrompt[] {
    return Array.from(this.prompts.values());
  }

  render(name: string, args: Record<string, any>): string {
    const prompt = this.get(name);
    if (!prompt) throw new Error(`Prompt not found: ${name}`);

    // Validate required arguments
    for (const arg of prompt.arguments) {
      if (arg.required && !(arg.name in args)) {
        throw new Error(`Missing required argument: ${arg.name}`);
      }
    }

    // Apply defaults
    const finalArgs = { ...args };
    for (const arg of prompt.arguments) {
      if (!(arg.name in finalArgs) && arg.default) {
        finalArgs[arg.name] = arg.default;
      }
    }

    // Render template (using Handlebars or similar)
    return Handlebars.compile(prompt.template)(finalArgs);
  }
}
```

---

## 5. Error Handling Strategy

### 5.1 Error Categories

#### User Errors (4xx-style)
Client-side errors that the user should fix:

- `INVALID_SELECTOR`: Selector doesn't match any elements
- `INVALID_URL`: Malformed URL
- `MISSING_PARAMETER`: Required parameter not provided
- `SESSION_NOT_FOUND`: Referenced session doesn't exist
- `ELEMENT_NOT_FOUND`: Element not found on page
- `ELEMENT_NOT_INTERACTIVE`: Element exists but not clickable

#### Server Errors (5xx-style)
Internal errors that indicate system issues:

- `BROWSER_CRASHED`: Browser process crashed
- `TIMEOUT`: Operation timed out
- `NETWORK_ERROR`: Network request failed
- `INTERNAL_ERROR`: Unexpected internal error
- `RESOURCE_EXHAUSTED`: Out of browser instances/memory

### 5.2 Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    retryable: boolean;
    suggestion?: string;
  };
}

// Example error responses
{
  error: {
    code: 'ELEMENT_NOT_FOUND',
    message: 'No element found matching selector "#submit-button"',
    details: {
      selector: '#submit-button',
      page: 'https://example.com/form',
    },
    retryable: false,
    suggestion: 'Check if the selector is correct. Try using browser devtools to verify the element exists.',
  }
}

{
  error: {
    code: 'TIMEOUT',
    message: 'Navigation timed out after 30000ms',
    details: {
      url: 'https://slow-site.com',
      timeout: 30000,
    },
    retryable: true,
    suggestion: 'Increase timeout or check if the website is responsive.',
  }
}
```

### 5.3 Error Handler Implementation

```typescript
class ErrorHandler {
  handle(error: Error, context: ToolContext): ErrorResponse {
    // Map error to standard code
    const code = this.mapErrorCode(error);

    // Determine if retryable
    const retryable = this.isRetryable(code);

    // Generate helpful suggestion
    const suggestion = this.generateSuggestion(code, error, context);

    // Extract relevant details
    const details = this.extractDetails(error, context);

    return {
      error: {
        code,
        message: error.message,
        details,
        retryable,
        suggestion,
      },
    };
  }

  private mapErrorCode(error: Error): string {
    if (error instanceof TimeoutError) return 'TIMEOUT';
    if (error instanceof ElementNotFoundError) return 'ELEMENT_NOT_FOUND';
    if (error instanceof NavigationError) return 'NAVIGATION_FAILED';
    if (error.message.includes('crashed')) return 'BROWSER_CRASHED';
    return 'INTERNAL_ERROR';
  }

  private isRetryable(code: string): boolean {
    const retryableCodes = new Set([
      'TIMEOUT',
      'NETWORK_ERROR',
      'BROWSER_CRASHED',
      'RESOURCE_EXHAUSTED',
    ]);
    return retryableCodes.has(code);
  }

  private generateSuggestion(
    code: string,
    error: Error,
    context: ToolContext
  ): string {
    const suggestions: Record<string, string> = {
      ELEMENT_NOT_FOUND: 'Verify the selector using browser devtools. The element may be loaded dynamically - try using wait_for_selector first.',
      TIMEOUT: 'Increase the timeout parameter or check if the page is loading slowly.',
      INVALID_SELECTOR: 'Check selector syntax. CSS selectors should not start with //, XPath should start with //',
      SESSION_NOT_FOUND: 'Create a new session with create_session tool.',
      BROWSER_CRASHED: 'Browser crashed unexpectedly. This may indicate a memory issue or problematic page content.',
    };

    return suggestions[code] || 'Please try again or contact support if the issue persists.';
  }
}
```

---

## 6. Transport Implementations

### 6.1 Stdio Transport

Default transport for Claude CLI integration:

```typescript
class StdioTransport {
  private server: Server;

  constructor(server: Server) {
    this.server = server;
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('Playwright MCP Server running on stdio');
  }
}
```

### 6.2 HTTP Transport

For network-based communication:

```typescript
class HttpTransport {
  private server: Server;
  private httpServer: http.Server;

  constructor(server: Server, port: number) {
    this.server = server;
    this.httpServer = http.createServer(this.handleRequest.bind(this));
    this.port = port;
  }

  async start(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.httpServer.listen(this.port, () => {
        console.log(`Playwright MCP Server listening on http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    if (req.method === 'POST') {
      const body = await this.readBody(req);
      const request = JSON.parse(body);

      const response = await this.server.handleRequest(request);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } else {
      res.writeHead(405);
      res.end();
    }
  }
}
```

### 6.3 WebSocket Transport

For real-time bidirectional communication:

```typescript
class WebSocketTransport {
  private server: Server;
  private wss: WebSocketServer;

  constructor(server: Server, port: number) {
    this.server = server;
    this.wss = new WebSocketServer({ port });
  }

  async start(): Promise<void> {
    this.wss.on('connection', (ws) => {
      console.log('Client connected');

      ws.on('message', async (data) => {
        const request = JSON.parse(data.toString());
        const response = await this.server.handleRequest(request);
        ws.send(JSON.stringify(response));
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });

    console.log(`WebSocket server listening on ws://localhost:${this.wss.address().port}`);
  }
}
```

---

## 7. Server Configuration

### 7.1 Configuration Schema

```typescript
interface ServerConfig {
  // Server Settings
  name: string;
  version: string;
  transport: 'stdio' | 'http' | 'websocket';
  port?: number; // For HTTP/WebSocket

  // Browser Settings
  browser: {
    type: 'chromium' | 'firefox' | 'webkit';
    headless: boolean;
    args: string[];
    downloadPath?: string;
  };

  // Pool Settings
  pool: {
    minBrowsers: number;
    maxBrowsers: number;
    idleTimeout: number; // ms
  };

  // Session Settings
  session: {
    defaultTimeout: number;
    maxSessions: number;
    persistentSessions: boolean;
  };

  // Security Settings
  security: {
    allowedDomains?: string[];
    blockedDomains?: string[];
    maxScreenshotSize: number; // bytes
    enableFileUpload: boolean;
    enableScriptEvaluation: boolean;
  };

  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    destination: 'stdout' | 'file';
    file?: string;
  };
}
```

### 7.2 Example Configuration

```json
{
  "name": "playwright-mcp-server",
  "version": "1.0.0",
  "transport": "stdio",

  "browser": {
    "type": "chromium",
    "headless": true,
    "args": [
      "--no-sandbox",
      "--disable-dev-shm-usage"
    ]
  },

  "pool": {
    "minBrowsers": 2,
    "maxBrowsers": 10,
    "idleTimeout": 300000
  },

  "session": {
    "defaultTimeout": 30000,
    "maxSessions": 50,
    "persistentSessions": false
  },

  "security": {
    "allowedDomains": ["*.example.com"],
    "maxScreenshotSize": 10485760,
    "enableFileUpload": true,
    "enableScriptEvaluation": false
  },

  "logging": {
    "level": "info",
    "format": "json",
    "destination": "stdout"
  }
}
```

---

**Next**: [04-extensibility-design.md](./04-extensibility-design.md)
