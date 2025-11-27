#!/usr/bin/env node

/**
 * Agentic Playwright CLI Entry Point
 *
 * This is the main entry point for the agentic-playwright command.
 * It imports and executes the CLI implementation from the compiled TypeScript.
 *
 * Usage:
 *   npx agentic-playwright --help
 *   npx agentic-playwright mcp start
 *   npx agentic-playwright navigate --url https://example.com
 */

// Import the CLI implementation
import('../dist/cli.js').then((module) => {
  module.run();
}).catch((error) => {
  console.error('Failed to start agentic-playwright:', error.message);
  process.exit(1);
});
