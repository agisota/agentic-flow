# Basic Navigation with Playwright MCP

This guide demonstrates fundamental Playwright operations including page navigation, screenshots, browser contexts, and multi-tab handling.

## Table of Contents
- [Simple Page Navigation](#simple-page-navigation)
- [Waiting for Page Load](#waiting-for-page-load)
- [Getting Page Information](#getting-page-information)
- [Taking Screenshots](#taking-screenshots)
- [Browser Context Management](#browser-context-management)
- [Multiple Tabs Handling](#multiple-tabs-handling)

---

## Simple Page Navigation

### MCP Tool Call (JSON Format)

```json
{
  "tool": "mcp__playwright__playwright_navigate",
  "parameters": {
    "url": "https://example.com"
  }
}
```

### Agent Task Description (Natural Language)

```
Task: Navigate to example.com homepage
Agent: browser-navigator
Instructions: Use Playwright to navigate to https://example.com and verify successful page load
```

### Expected Output

```json
{
  "success": true,
  "url": "https://example.com/",
  "status": 200,
  "title": "Example Domain"
}
```

---

## Waiting for Page Load

### Complete Workflow

```javascript
// 1. Navigate to page
{
  "tool": "mcp__playwright__playwright_navigate",
  "parameters": {
    "url": "https://example.com/products"
  }
}

// 2. Wait for specific element
{
  "tool": "mcp__playwright__playwright_click",
  "parameters": {
    "selector": "button.load-more",
    "options": {
      "waitForLoadState": "networkidle",
      "timeout": 5000
    }
  }
}

// 3. Wait for navigation to complete
{
  "tool": "mcp__playwright__playwright_evaluate",
  "parameters": {
    "script": "() => document.readyState === 'complete'"
  }
}
```

### Agent Task Description

```
Task: Load dynamic product page
Agent: web-loader
Instructions:
1. Navigate to products page
2. Wait for all product images to load
3. Verify page is fully rendered before proceeding
4. Use networkidle state for completion detection
```

### Expected Output

```json
{
  "navigationComplete": true,
  "readyState": "complete",
  "loadTime": 2.3,
  "elementsFound": 24
}
```

---

## Getting Page Information

### MCP Tool Calls Sequence

```json
// 1. Get page title
{
  "tool": "mcp__playwright__playwright_evaluate",
  "parameters": {
    "script": "() => document.title"
  }
}

// 2. Get current URL
{
  "tool": "mcp__playwright__playwright_evaluate",
  "parameters": {
    "script": "() => window.location.href"
  }
}

// 3. Get page metadata
{
  "tool": "mcp__playwright__playwright_evaluate",
  "parameters": {
    "script": `() => ({
      title: document.title,
      url: window.location.href,
      description: document.querySelector('meta[name="description"]')?.content,
      keywords: document.querySelector('meta[name="keywords"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href
    })`
  }
}
```

### Agent Task Description

```
Task: Extract page metadata
Agent: page-analyzer
Instructions:
1. Navigate to target URL
2. Extract title, URL, and meta tags
3. Store metadata in coordination memory
4. Report findings in structured format
Memory Key: swarm/page-analyzer/metadata
```

### Expected Output

```json
{
  "title": "Example Domain",
  "url": "https://example.com/",
  "description": "Example website for demonstrations",
  "keywords": "example, demo, test",
  "canonical": "https://example.com/"
}
```

---

## Taking Screenshots

### Full Page Screenshot

```json
{
  "tool": "mcp__playwright__playwright_screenshot",
  "parameters": {
    "path": "/home/user/agentic-flow/screenshots/example-full.png",
    "fullPage": true
  }
}
```

### Element Screenshot

```json
{
  "tool": "mcp__playwright__playwright_screenshot",
  "parameters": {
    "selector": "#main-content",
    "path": "/home/user/agentic-flow/screenshots/content-only.png"
  }
}
```

### Viewport Screenshot with Quality Settings

```json
{
  "tool": "mcp__playwright__playwright_screenshot",
  "parameters": {
    "path": "/home/user/agentic-flow/screenshots/viewport.png",
    "fullPage": false,
    "quality": 90,
    "type": "jpeg"
  }
}
```

### Agent Workflow with Screenshots

```
Task: Document page layout
Agent: screenshot-capture
Instructions:
1. Navigate to target page
2. Take full page screenshot (PNG format)
3. Take header screenshot (high quality JPEG)
4. Take footer screenshot
5. Save all screenshots to /home/user/agentic-flow/screenshots/
6. Store screenshot paths in memory for review
Memory Keys:
  - swarm/screenshots/full-page
  - swarm/screenshots/header
  - swarm/screenshots/footer
```

### Expected Output

```json
{
  "screenshots": [
    {
      "type": "full-page",
      "path": "/home/user/agentic-flow/screenshots/example-full.png",
      "size": "1920x4800",
      "format": "png"
    },
    {
      "type": "element",
      "selector": "header",
      "path": "/home/user/agentic-flow/screenshots/header.jpg",
      "size": "1920x120",
      "format": "jpeg",
      "quality": 90
    }
  ]
}
```

---

## Browser Context Management

### Creating Isolated Context

```json
{
  "tool": "mcp__playwright__playwright_context_create",
  "parameters": {
    "contextId": "user-session-1",
    "options": {
      "viewport": {
        "width": 1920,
        "height": 1080
      },
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "locale": "en-US",
      "timezoneId": "America/New_York",
      "permissions": ["geolocation"],
      "geolocation": {
        "latitude": 40.7128,
        "longitude": -74.0060
      }
    }
  }
}
```

### Mobile Context

```json
{
  "tool": "mcp__playwright__playwright_context_create",
  "parameters": {
    "contextId": "mobile-session",
    "options": {
      "viewport": {
        "width": 375,
        "height": 812
      },
      "deviceScaleFactor": 3,
      "isMobile": true,
      "hasTouch": true,
      "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15"
    }
  }
}
```

### Context with Authentication

```json
// 1. Create context
{
  "tool": "mcp__playwright__playwright_context_create",
  "parameters": {
    "contextId": "auth-session",
    "options": {
      "storageState": "/home/user/agentic-flow/auth/session.json"
    }
  }
}

// 2. Navigate with authenticated context
{
  "tool": "mcp__playwright__playwright_navigate",
  "parameters": {
    "url": "https://example.com/dashboard",
    "contextId": "auth-session"
  }
}

// 3. Save context state
{
  "tool": "mcp__playwright__playwright_context_save",
  "parameters": {
    "contextId": "auth-session",
    "path": "/home/user/agentic-flow/auth/session.json"
  }
}
```

### Agent Task with Context Management

```
Task: Test multi-user scenarios
Agent: context-manager
Instructions:
1. Create 3 isolated browser contexts (user1, user2, admin)
2. Navigate each context to different pages
3. Verify context isolation (no cookie sharing)
4. Save each context state for reuse
5. Report context performance metrics
Memory Keys:
  - swarm/contexts/user1/state
  - swarm/contexts/user2/state
  - swarm/contexts/admin/state
```

### Expected Output

```json
{
  "contexts": [
    {
      "id": "user1",
      "isolated": true,
      "cookies": 5,
      "storageStateSaved": true
    },
    {
      "id": "user2",
      "isolated": true,
      "cookies": 3,
      "storageStateSaved": true
    },
    {
      "id": "admin",
      "isolated": true,
      "cookies": 8,
      "storageStateSaved": true
    }
  ],
  "verification": "All contexts properly isolated"
}
```

---

## Multiple Tabs Handling

### Opening Multiple Tabs

```json
// 1. Open first tab (main page)
{
  "tool": "mcp__playwright__playwright_navigate",
  "parameters": {
    "url": "https://example.com"
  }
}

// 2. Open new tab
{
  "tool": "mcp__playwright__playwright_evaluate",
  "parameters": {
    "script": "() => window.open('https://example.com/about', '_blank')"
  }
}

// 3. Get all pages
{
  "tool": "mcp__playwright__playwright_evaluate",
  "parameters": {
    "script": "() => window.name || 'main'"
  }
}
```

### Switching Between Tabs

```javascript
// Complete tab management workflow
const workflow = {
  // 1. Open multiple tabs
  openTabs: [
    {
      "tool": "mcp__playwright__playwright_navigate",
      "parameters": {
        "url": "https://example.com/page1"
      }
    },
    {
      "tool": "mcp__playwright__playwright_new_page",
      "parameters": {
        "url": "https://example.com/page2"
      }
    },
    {
      "tool": "mcp__playwright__playwright_new_page",
      "parameters": {
        "url": "https://example.com/page3"
      }
    }
  ],

  // 2. Get page titles from all tabs
  getTitles: {
    "tool": "mcp__playwright__playwright_evaluate",
    "parameters": {
      "script": `() => {
        const pages = Array.from(document.querySelectorAll('title'));
        return pages.map(p => p.textContent);
      }`
    }
  },

  // 3. Switch to specific tab by index
  switchTab: {
    "tool": "mcp__playwright__playwright_bring_to_front",
    "parameters": {
      "pageIndex": 1
    }
  }
};
```

### Agent Task for Multi-Tab Data Collection

```
Task: Collect data from multiple pages simultaneously
Agent: multi-tab-collector
Instructions:
1. Open 5 tabs with different product categories
2. In each tab, extract product titles and prices
3. Take screenshot of each tab
4. Store results with tab identifiers
5. Close all tabs when complete
6. Aggregate results in coordination memory

Tabs to open:
  - Tab 1: /electronics
  - Tab 2: /clothing
  - Tab 3: /books
  - Tab 4: /sports
  - Tab 5: /home-garden

Memory Keys:
  - swarm/tabs/electronics/products
  - swarm/tabs/clothing/products
  - swarm/tabs/books/products
  - swarm/tabs/sports/products
  - swarm/tabs/home-garden/products
```

### Expected Output

```json
{
  "totalTabs": 5,
  "dataCollected": {
    "electronics": {
      "products": 24,
      "screenshot": "/home/user/agentic-flow/screenshots/tab-electronics.png"
    },
    "clothing": {
      "products": 18,
      "screenshot": "/home/user/agentic-flow/screenshots/tab-clothing.png"
    },
    "books": {
      "products": 32,
      "screenshot": "/home/user/agentic-flow/screenshots/tab-books.png"
    },
    "sports": {
      "products": 15,
      "screenshot": "/home/user/agentic-flow/screenshots/tab-sports.png"
    },
    "homeGarden": {
      "products": 21,
      "screenshot": "/home/user/agentic-flow/screenshots/tab-home-garden.png"
    }
  },
  "totalProducts": 110,
  "executionTime": "4.2s"
}
```

---

## Complete Example: Multi-Step Navigation Workflow

### Agent Coordination with Hooks

```bash
# Pre-task setup
npx claude-flow@alpha hooks pre-task --description "Multi-step navigation workflow"
npx claude-flow@alpha hooks session-restore --session-id "swarm-navigation"

# Task execution (via agent)
# Agent receives this workflow:
```

```json
{
  "workflow": "complete-navigation-test",
  "steps": [
    {
      "step": 1,
      "action": "navigate",
      "tool": "mcp__playwright__playwright_navigate",
      "parameters": {
        "url": "https://example.com"
      }
    },
    {
      "step": 2,
      "action": "screenshot",
      "tool": "mcp__playwright__playwright_screenshot",
      "parameters": {
        "path": "/home/user/agentic-flow/screenshots/step1-homepage.png",
        "fullPage": true
      }
    },
    {
      "step": 3,
      "action": "click",
      "tool": "mcp__playwright__playwright_click",
      "parameters": {
        "selector": "a[href='/about']"
      }
    },
    {
      "step": 4,
      "action": "screenshot",
      "tool": "mcp__playwright__playwright_screenshot",
      "parameters": {
        "path": "/home/user/agentic-flow/screenshots/step2-about.png",
        "fullPage": true
      }
    },
    {
      "step": 5,
      "action": "extract",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => ({
          title: document.title,
          headings: Array.from(document.querySelectorAll('h1, h2')).map(h => h.textContent),
          links: Array.from(document.querySelectorAll('a')).length
        })`
      }
    }
  ]
}
```

```bash
# Post-task cleanup
npx claude-flow@alpha hooks post-task --task-id "navigation-workflow"
npx claude-flow@alpha hooks session-end --export-metrics true
```

### Agent Natural Language Instructions

```
Task: Complete navigation workflow test
Agent: navigation-tester
Priority: High

Instructions:
1. Navigate to example.com homepage
2. Capture full-page screenshot
3. Click "About" link
4. Wait for page load (networkidle)
5. Capture about page screenshot
6. Extract page metadata (title, headings, link count)
7. Store all results in coordination memory
8. Generate summary report

Hooks Integration:
- Run pre-task hook before starting
- Use post-edit hook after each screenshot
- Store progress in session memory
- Run post-task hook with completion metrics

Memory Keys:
- swarm/navigation/homepage/screenshot
- swarm/navigation/about/screenshot
- swarm/navigation/about/metadata
- swarm/navigation/workflow/summary

Expected Deliverables:
- 2 screenshots saved to /home/user/agentic-flow/screenshots/
- Metadata JSON stored in memory
- Completion report with timing metrics
```

### Expected Final Output

```json
{
  "workflowId": "complete-navigation-test",
  "status": "completed",
  "executionTime": "3.8s",
  "results": {
    "homepage": {
      "url": "https://example.com/",
      "screenshot": "/home/user/agentic-flow/screenshots/step1-homepage.png",
      "timestamp": "2025-11-27T10:30:15Z"
    },
    "aboutPage": {
      "url": "https://example.com/about",
      "screenshot": "/home/user/agentic-flow/screenshots/step2-about.png",
      "metadata": {
        "title": "About Us - Example Domain",
        "headings": ["About Example", "Our Mission", "Contact Information"],
        "links": 15
      },
      "timestamp": "2025-11-27T10:30:18Z"
    }
  },
  "memoryUpdates": 4,
  "hooksExecuted": 3
}
```

---

## Error Handling Patterns

### Retry with Timeout

```json
{
  "tool": "mcp__playwright__playwright_navigate",
  "parameters": {
    "url": "https://slow-site.example.com",
    "timeout": 30000,
    "waitUntil": "networkidle"
  },
  "errorHandling": {
    "retries": 3,
    "retryDelay": 2000,
    "fallback": "Screenshot error page"
  }
}
```

### Graceful Degradation

```javascript
{
  "workflow": "robust-navigation",
  "errorStrategy": "continue",
  "steps": [
    {
      "try": {
        "tool": "mcp__playwright__playwright_navigate",
        "parameters": {"url": "https://example.com/page1"}
      },
      "catch": {
        "action": "log",
        "continue": true
      }
    },
    {
      "try": {
        "tool": "mcp__playwright__playwright_screenshot",
        "parameters": {"path": "/home/user/agentic-flow/screenshots/page1.png"}
      },
      "catch": {
        "action": "useDefaultScreenshot",
        "continue": true
      }
    }
  ]
}
```

---

## Performance Tips

1. **Use `waitUntil: 'domcontentloaded'`** for faster page loads when full resources aren't needed
2. **Batch screenshot operations** to reduce I/O overhead
3. **Reuse browser contexts** for related operations
4. **Close unused tabs** to free memory
5. **Use `networkidle` only when necessary** (it's slower)

## Next Steps

- Explore [Form Automation](./form-automation.md) for interactive elements
- Learn [Data Scraping](./data-scraping.md) for data extraction
- Master [Multi-Agent Swarm](./multi-agent-swarm.md) for parallel operations
