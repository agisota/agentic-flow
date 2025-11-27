# Navigation Tools for Agentic-Playwright

This directory contains all navigation-related MCP tools for the agentic-playwright browser automation system.

## Overview

The navigation tools provide comprehensive browser navigation capabilities including URL navigation, history management, tab operations, and page state tracking.

## Architecture

### Context Manager

**File:** `context.ts`

The `NavigationContextManager` is a centralized state manager that tracks:
- Current page and browser context for each session
- Active URL and page title
- Open tabs and their state
- Active tab tracking

All navigation tools use this context manager to maintain consistent state across operations.

## Tools

### 1. Navigate (`navigate.ts`)

Navigate to a URL and wait for page load.

**Input:**
- `url` (string, required): URL to navigate to
- `sessionId` (string, optional): Session identifier
- `waitUntil` (enum): 'load' | 'domcontentloaded' | 'networkidle' (default: 'load')
- `timeout` (number): Navigation timeout in ms (default: 30000)
- `referer` (string, optional): Referer header value

**Output:**
```typescript
{
  success: boolean;
  url: string;
  title: string;
  loadTime: number;
  finalUrl?: string;
  status?: number;
  error?: string;
}
```

### 2. Go Back (`back.ts`)

Navigate back in browser history.

**Input:**
- `sessionId` (string, required): Session identifier
- `waitUntil` (enum): Wait strategy (default: 'load')
- `timeout` (number): Timeout in ms (default: 30000)

**Output:**
```typescript
{
  success: boolean;
  url: string;
  title: string;
  previousUrl?: string;
  error?: string;
}
```

### 3. Go Forward (`forward.ts`)

Navigate forward in browser history.

**Input:**
- `sessionId` (string, required): Session identifier
- `waitUntil` (enum): Wait strategy (default: 'load')
- `timeout` (number): Timeout in ms (default: 30000)

**Output:**
```typescript
{
  success: boolean;
  url: string;
  title: string;
  previousUrl?: string;
  error?: string;
}
```

### 4. Reload Page (`reload.ts`)

Reload the current page.

**Input:**
- `sessionId` (string, required): Session identifier
- `waitUntil` (enum): Wait strategy (default: 'load')
- `ignoreCache` (boolean): Bypass cache (default: false)
- `timeout` (number): Timeout in ms (default: 30000)

**Output:**
```typescript
{
  success: boolean;
  url: string;
  title?: string;
  loadTime?: number;
  error?: string;
}
```

### 5. Get Current URL (`getUrl.ts`)

Get the current page URL.

**Input:**
- `sessionId` (string, required): Session identifier

**Output:**
```typescript
{
  success: boolean;
  url: string;
  error?: string;
}
```

### 6. Get Page Title (`getTitle.ts`)

Get the current page title.

**Input:**
- `sessionId` (string, required): Session identifier

**Output:**
```typescript
{
  success: boolean;
  title: string;
  error?: string;
}
```

### 7. New Tab (`newTab.ts`)

Open a new tab.

**Input:**
- `sessionId` (string, required): Session identifier
- `url` (string, optional): URL to navigate to in new tab
- `waitUntil` (enum): Wait strategy (default: 'load')
- `timeout` (number): Timeout in ms (default: 30000)

**Output:**
```typescript
{
  success: boolean;
  tabId: string;
  url: string;
  title?: string;
  error?: string;
}
```

### 8. Close Tab (`closeTab.ts`)

Close a specific tab.

**Input:**
- `sessionId` (string, required): Session identifier
- `tabId` (string, required): Tab identifier to close

**Output:**
```typescript
{
  success: boolean;
  closedTabId?: string;
  activeTabId?: string;
  error?: string;
}
```

### 9. Switch Tab (`switchTab.ts`)

Switch to a specific tab.

**Input:**
- `sessionId` (string, required): Session identifier
- `tabId` (string, required): Tab identifier to switch to

**Output:**
```typescript
{
  success: boolean;
  tabId?: string;
  url?: string;
  title?: string;
  error?: string;
}
```

### 10. Wait for Navigation (`waitForNavigation.ts`)

Wait for navigation to complete.

**Input:**
- `sessionId` (string, required): Session identifier
- `waitUntil` (enum): Wait strategy (default: 'load')
- `timeout` (number): Timeout in ms (default: 30000)
- `url` (string, optional): URL pattern to wait for

**Output:**
```typescript
{
  success: boolean;
  url: string;
  title?: string;
  loadTime?: number;
  error?: string;
}
```

## Usage

### Importing Tools

```typescript
import { navigationTools, NAVIGATION_TOOL_NAMES } from './tools/navigation/index.js';

// Register all tools with MCP server
for (const tool of navigationTools) {
  server.addTool(tool);
}
```

### Using Individual Tools

```typescript
import { navigate, NavigateInput } from './tools/navigation/navigate.js';

const input: NavigateInput = {
  url: 'https://example.com',
  sessionId: 'session-123',
  waitUntil: 'networkidle',
  timeout: 30000,
};

const result = await navigate(input);
console.log(result); // { success: true, url: '...', title: '...', loadTime: 1234 }
```

### Using Context Manager

```typescript
import { NavigationContextManager } from './tools/navigation/context.js';

// Get or create context
const ctx = NavigationContextManager.getOrCreate('session-123', context, page);

// Get current page
const page = NavigationContextManager.getCurrentPage('session-123');

// Track tabs
const tabs = NavigationContextManager.getTabs('session-123');
const activeTabId = NavigationContextManager.getActiveTabId('session-123');
```

## Error Handling

All tools follow a consistent error handling pattern:
- Input validation using Zod schemas
- Try-catch blocks for runtime errors
- Structured error responses with descriptive messages
- Success boolean flag in all responses

## Best Practices

1. **Session Management**: Always provide a valid sessionId to maintain state
2. **Wait Strategies**: Choose appropriate waitUntil strategy based on page type:
   - `load`: Standard pages (fastest)
   - `domcontentloaded`: Pages with minimal resources
   - `networkidle`: Single Page Applications (most reliable)
3. **Timeouts**: Adjust timeouts based on network conditions and page complexity
4. **Tab Management**: Keep track of tabId values when working with multiple tabs
5. **Error Handling**: Always check the `success` field before using response data

## Integration with BrowserManager

These tools are designed to work with a BrowserManager component that:
- Provides browser contexts and pages
- Manages browser lifecycle
- Handles session isolation
- Pools browser instances

## File Structure

```
navigation/
├── context.ts              # Shared context manager
├── navigate.ts             # URL navigation
├── back.ts                 # History back
├── forward.ts              # History forward
├── reload.ts               # Page reload
├── getUrl.ts              # Get current URL
├── getTitle.ts            # Get page title
├── newTab.ts              # Open new tab
├── closeTab.ts            # Close tab
├── switchTab.ts           # Switch active tab
├── waitForNavigation.ts   # Wait for navigation
├── index.ts               # Tool exports
└── README.md              # This file
```

## Statistics

- **Total Files**: 12
- **Total Lines of Code**: ~1,127
- **Tools Implemented**: 10
- **Test Coverage**: TODO (pending test implementation)

## Next Steps

1. Implement BrowserManager component
2. Create SessionManager for context lifecycle
3. Add comprehensive test suite
4. Integrate with MCP server
5. Add TypeScript type definitions export
6. Create usage examples and documentation

## Dependencies

- `playwright`: Browser automation library
- `zod`: Schema validation library

## Related Components

- **Session Tools**: Session lifecycle management
- **Interaction Tools**: Element interaction (click, type, etc.)
- **Extraction Tools**: Data extraction from pages
- **Network Tools**: Network interception and mocking
