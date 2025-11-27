# Agentic Playwright

AI-powered browser automation with Playwright and MCP (Model Context Protocol).

## Features

- **Browser Automation**: Full Playwright browser control via MCP tools
- **AI-Powered**: Designed for Claude and other AI assistants
- **MCP Integration**: Expose browser capabilities through Model Context Protocol
- **TypeScript**: Fully typed with modern ES modules
- **CLI & NPX**: Run directly with `npx agentic-playwright`

## Installation

### As a Global Tool

```bash
npm install -g agentic-playwright
```

### With NPX (No Installation)

```bash
npx agentic-playwright --help
```

### Add to Claude Desktop

Add to your Claude Desktop MCP configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["agentic-playwright", "mcp", "start"]
    }
  }
}
```

## Quick Start

### Start MCP Server

```bash
# Start the MCP server for Claude integration
npx agentic-playwright mcp start
```

### CLI Usage

```bash
# Show help
npx agentic-playwright --help

# Navigate to a URL
npx agentic-playwright navigate --url https://example.com

# Take a screenshot
npx agentic-playwright screenshot --url https://example.com --output screenshot.png

# Extract page content
npx agentic-playwright extract --url https://example.com --selector "h1"
```

## MCP Tools

When running as an MCP server, the following tools are available to Claude:

### Browser Control

- `browser_launch` - Launch a new browser instance
- `browser_close` - Close the browser
- `page_navigate` - Navigate to a URL
- `page_screenshot` - Capture screenshot
- `page_pdf` - Generate PDF

### Page Interaction

- `page_click` - Click an element
- `page_type` - Type text into an input
- `page_select` - Select dropdown option
- `page_fill` - Fill form field

### Content Extraction

- `page_content` - Get page HTML
- `page_text` - Extract visible text
- `page_evaluate` - Run JavaScript
- `page_query` - Query with CSS selectors

### Navigation

- `page_goto` - Go to URL
- `page_back` - Navigate back
- `page_forward` - Navigate forward
- `page_reload` - Reload page

### Waiting & Timing

- `page_wait_for_selector` - Wait for element
- `page_wait_for_navigation` - Wait for navigation
- `page_wait_for_timeout` - Wait for time period

## Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode
```

### Linting

```bash
npm run lint
```

## Project Structure

```
agentic-playwright/
├── bin/
│   └── cli.js              # CLI entry point
├── config/
│   └── tsconfig.json       # TypeScript configuration
├── src/
│   ├── cli/                # CLI implementation
│   ├── mcp/                # MCP server implementation
│   ├── core/               # Core Playwright wrappers
│   ├── tools/              # MCP tool definitions
│   └── index.ts            # Main exports
├── dist/                   # Compiled JavaScript (generated)
└── package.json
```

## Configuration

### Browser Options

Configure browser launch options via environment variables:

```bash
PLAYWRIGHT_BROWSER=chromium    # chromium, firefox, webkit
PLAYWRIGHT_HEADLESS=true       # true or false
PLAYWRIGHT_SLOW_MO=100         # Slow down operations (ms)
```

### MCP Server Options

```bash
MCP_TRANSPORT=stdio            # stdio or sse
MCP_LOG_LEVEL=info            # error, warn, info, debug
```

## Examples

### Claude Desktop Integration

Once added to Claude Desktop, you can ask Claude to:

> "Navigate to example.com and take a screenshot"

> "Fill out the contact form on the website with my details"

> "Extract all the product prices from this page"

### Programmatic Usage

```typescript
import { AgenticPlaywright } from 'agentic-playwright';

const agent = new AgenticPlaywright();
await agent.launch({ headless: false });
await agent.navigate('https://example.com');
const screenshot = await agent.screenshot();
await agent.close();
```

## Requirements

- Node.js >= 18.0.0
- Playwright browsers (auto-installed)

## License

MIT

## Contributing

Contributions welcome! Please read our contributing guidelines and submit PRs to the [agentic-flow repository](https://github.com/ruvnet/agentic-flow).

## Support

- GitHub Issues: https://github.com/ruvnet/agentic-flow/issues
- Documentation: https://github.com/ruvnet/agentic-flow/tree/main/packages/agentic-playwright

## Related Projects

- [agentic-flow](https://github.com/ruvnet/agentic-flow) - Multi-agent orchestration framework
- [fastmcp](https://github.com/wong2/fastmcp) - Fast MCP SDK for Python
- [Playwright](https://playwright.dev/) - Cross-browser automation library
