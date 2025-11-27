#!/usr/bin/env node

/**
 * Agentic Playwright CLI
 *
 * Command-line interface for browser automation and MCP server management
 */

import { Command } from 'commander';
import { createPlaywrightMCPServer } from './mcp/server.js';
import { chromium, type Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const VERSION = '1.0.0';

/**
 * Create and configure the CLI program
 */
function createProgram(): Command {
  const program = new Command();

  program
    .name('agentic-playwright')
    .description('🎭 AI-powered browser automation with Playwright and MCP')
    .version(VERSION);

  // MCP Command Group
  const mcpCommand = program
    .command('mcp')
    .description('MCP server management');

  mcpCommand
    .command('start')
    .description('Start MCP server')
    .option('--http', 'Use HTTP transport instead of stdio')
    .option('--port <port>', 'HTTP server port', '3000')
    .option('--host <host>', 'HTTP server host', '0.0.0.0')
    .action(async (options) => {
      console.error('🚀 Starting Agentic Playwright MCP Server...');

      try {
        const server = createPlaywrightMCPServer();

        if (options.http) {
          const port = parseInt(options.port, 10);
          console.error(`🌐 Starting HTTP server on ${options.host}:${port}...`);

          await server.start({
            transportType: 'httpStream',
            httpStream: {
              endpoint: '/mcp',
              port
            }
          });

          console.error(`✅ MCP Server running on http://${options.host}:${port}`);
          console.error('📋 Available tools: navigate, screenshot, extract, interact, query');
          console.error('\nPress Ctrl+C to stop');
        } else {
          console.error('🔌 Starting stdio transport...');

          await server.start({ transportType: 'stdio' });

          console.error('✅ MCP Server running on stdio');
        }
      } catch (error: any) {
        console.error('❌ Failed to start MCP server:', error.message);
        process.exit(1);
      }
    });

  // Navigate Command
  program
    .command('navigate <url>')
    .description('Navigate to a URL and perform basic checks')
    .option('-s, --screenshot <path>', 'Take screenshot and save to path')
    .option('-w, --wait <selector>', 'Wait for selector before proceeding')
    .option('--timeout <ms>', 'Navigation timeout in milliseconds', '30000')
    .action(async (url: string, options) => {
      console.log(`🌐 Navigating to: ${url}`);

      let browser: Browser | null = null;

      try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        const timeout = parseInt(options.timeout, 10);
        await page.goto(url, { timeout });

        console.log(`✅ Successfully loaded: ${page.url()}`);
        console.log(`📄 Title: ${await page.title()}`);

        if (options.wait) {
          console.log(`⏳ Waiting for selector: ${options.wait}`);
          await page.waitForSelector(options.wait, { timeout });
          console.log(`✅ Selector found: ${options.wait}`);
        }

        if (options.screenshot) {
          const screenshotPath = path.resolve(options.screenshot);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`📸 Screenshot saved to: ${screenshotPath}`);
        }

      } catch (error: any) {
        console.error(`❌ Navigation failed: ${error.message}`);
        process.exit(1);
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    });

  // Screenshot Command
  program
    .command('screenshot <url> [output]')
    .description('Take a screenshot of a URL')
    .option('-f, --fullpage', 'Capture full page screenshot', true)
    .option('--width <width>', 'Viewport width', '1280')
    .option('--height <height>', 'Viewport height', '720')
    .option('--format <format>', 'Image format (png, jpeg)', 'png')
    .option('--quality <quality>', 'JPEG quality (0-100)', '80')
    .action(async (url: string, output: string | undefined, options) => {
      console.log(`📸 Taking screenshot of: ${url}`);

      const outputPath = output || `screenshot-${Date.now()}.${options.format}`;
      let browser: Browser | null = null;

      try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
          viewport: {
            width: parseInt(options.width, 10),
            height: parseInt(options.height, 10)
          }
        });
        const page = await context.newPage();

        await page.goto(url, { waitUntil: 'networkidle' });

        const screenshotOptions: any = {
          path: path.resolve(outputPath),
          fullPage: options.fullpage,
          type: options.format
        };

        if (options.format === 'jpeg') {
          screenshotOptions.quality = parseInt(options.quality, 10);
        }

        await page.screenshot(screenshotOptions);

        const stats = fs.statSync(outputPath);
        const sizeKB = (stats.size / 1024).toFixed(2);

        console.log(`✅ Screenshot saved!`);
        console.log(`📁 Path: ${path.resolve(outputPath)}`);
        console.log(`📦 Size: ${sizeKB} KB`);
        console.log(`🖼️  Format: ${options.format}`);
        console.log(`📏 Viewport: ${options.width}x${options.height}`);

      } catch (error: any) {
        console.error(`❌ Screenshot failed: ${error.message}`);
        process.exit(1);
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    });

  return program;
}

/**
 * Main CLI entry point
 */
export async function run() {
  const program = createProgram();

  try {
    await program.parseAsync(process.argv);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
