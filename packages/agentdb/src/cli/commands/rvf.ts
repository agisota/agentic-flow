/**
 * RVF CLI Command - Manage RVF vector stores
 *
 * Provides subcommands for:
 * - status: Show RVF store status and statistics
 * - compact: Reclaim dead space in an RVF store
 * - derive: Create a COW branch from an existing store
 * - segments: List store segments and their metadata
 * - detect: Detect RVF SDK and backend availability
 * - convert: Convert between RVF and other formats
 */

import { Command } from 'commander';
import * as fs from 'fs';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(msg: string): void {
  console.log(msg);
}

/**
 * Load RVF backend lazily
 */
async function loadRvfBackend(storePath: string, options: { backend?: string } = {}) {
  const { RvfBackend } = await import('../../backends/rvf/RvfBackend.js');
  const backend = new RvfBackend({
    dimension: 384, // Will be overridden on load
    metric: 'cosine',
    storagePath: storePath,
    rvfBackend: (options.backend as 'auto' | 'node' | 'wasm') ?? 'auto',
  });
  // RvfBackend has initialize() but it's not in the VectorBackend interface
  await (backend as unknown as { initialize(): Promise<void> }).initialize();
  return backend;
}

/**
 * Main rvf command
 */
export const rvfCommand = new Command('rvf')
  .description('RVF vector store management')
  .addCommand(
    new Command('status')
      .description('Show RVF store status and statistics')
      .argument('<store>', 'Path to .rvf store file')
      .option('--json', 'Output as JSON')
      .action(async (store: string, opts: { json?: boolean }) => {
        try {
          const backend = await loadRvfBackend(store);
          const status = await backend.status();
          const fileId = await backend.fileId();
          const parentId = await backend.parentId();
          const lineageDepth = await backend.lineageDepth();
          const perf = backend.getPerformanceStats();

          if (opts.json) {
            console.log(JSON.stringify({
              file: store,
              fileId,
              parentId,
              lineageDepth,
              totalVectors: status.totalVectors,
              totalSegments: status.totalSegments,
              performance: perf,
            }, null, 2));
          } else {
            log(`\n${colors.bright}${colors.cyan}RVF Store Status${colors.reset}\n`);
            log(`  File:        ${colors.blue}${store}${colors.reset}`);
            log(`  File ID:     ${colors.blue}${fileId}${colors.reset}`);
            log(`  Parent ID:   ${colors.blue}${parentId}${colors.reset}`);
            log(`  Lineage:     ${colors.blue}${lineageDepth}${colors.reset}`);
            log(`  Vectors:     ${colors.green}${status.totalVectors}${colors.reset}`);
            log(`  Segments:    ${colors.green}${status.totalSegments}${colors.reset}`);

            if (fs.existsSync(store)) {
              const stat = fs.statSync(store);
              const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
              log(`  File Size:   ${colors.blue}${sizeMB} MB${colors.reset}`);
            }
            log('');
          }

          backend.close();
        } catch (error) {
          console.error(`${colors.red}Error: ${(error as Error).message}${colors.reset}`);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('compact')
      .description('Compact an RVF store to reclaim dead space')
      .argument('<store>', 'Path to .rvf store file')
      .option('--dry-run', 'Show what would be compacted without making changes')
      .action(async (store: string, opts: { dryRun?: boolean }) => {
        try {
          const backend = await loadRvfBackend(store);

          if (opts.dryRun) {
            const segments = await backend.segments();
            const status = await backend.status();
            log(`\n${colors.bright}${colors.cyan}RVF Compaction Analysis (dry run)${colors.reset}\n`);
            log(`  Vectors:  ${status.totalVectors}`);
            log(`  Segments: ${segments.length}`);
            log(`  Estimated reclaimable space: (run without --dry-run to see)`);
            log('');
          } else {
            log(`\nCompacting ${store}...`);
            const result = await backend.compact();
            log(`${colors.green}Compaction complete${colors.reset}`);
            log(`  Segments compacted: ${result.segmentsCompacted}`);
            log(`  Bytes reclaimed:    ${result.bytesReclaimed}`);
            log('');
          }

          backend.close();
        } catch (error) {
          console.error(`${colors.red}Error: ${(error as Error).message}${colors.reset}`);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('derive')
      .description('Create a COW branch from an existing RVF store')
      .argument('<parent>', 'Path to parent .rvf store')
      .argument('<child>', 'Path for new child .rvf store')
      .action(async (parent: string, child: string) => {
        try {
          if (fs.existsSync(child)) {
            console.error(`${colors.red}Error: Child path already exists: ${child}${colors.reset}`);
            process.exit(1);
          }

          const backend = await loadRvfBackend(parent);
          log(`\nDeriving branch from ${parent}...`);
          const childBackend = await backend.derive(child);
          const childId = await childBackend.fileId();
          const parentId = await childBackend.parentId();

          log(`${colors.green}Branch created successfully${colors.reset}`);
          log(`  Parent:      ${parent}`);
          log(`  Child:       ${child}`);
          log(`  Child ID:    ${childId}`);
          log(`  Parent ID:   ${parentId}`);
          log(`  Lineage:     ${await childBackend.lineageDepth()}`);
          log('');

          childBackend.close();
          backend.close();
        } catch (error) {
          console.error(`${colors.red}Error: ${(error as Error).message}${colors.reset}`);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('segments')
      .description('List segments in an RVF store')
      .argument('<store>', 'Path to .rvf store file')
      .option('--json', 'Output as JSON')
      .action(async (store: string, opts: { json?: boolean }) => {
        try {
          const backend = await loadRvfBackend(store);
          const segments = await backend.segments();

          if (opts.json) {
            console.log(JSON.stringify(segments, null, 2));
          } else {
            log(`\n${colors.bright}${colors.cyan}RVF Store Segments${colors.reset}\n`);
            if (segments.length === 0) {
              log('  No segments found.');
            } else {
              log(`  ${'ID'.padEnd(6)} ${'Type'.padEnd(16)} ${'Size (bytes)'.padStart(14)}`);
              log(`  ${'─'.repeat(6)} ${'─'.repeat(16)} ${'─'.repeat(14)}`);
              for (const seg of segments) {
                log(`  ${String(seg.id).padEnd(6)} ${seg.segType.padEnd(16)} ${String(seg.payloadLength).padStart(14)}`);
              }
            }
            log(`\n  Total: ${segments.length} segments\n`);
          }

          backend.close();
        } catch (error) {
          console.error(`${colors.red}Error: ${(error as Error).message}${colors.reset}`);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('detect')
      .description('Detect RVF SDK and backend availability')
      .option('--json', 'Output as JSON')
      .action(async (opts: { json?: boolean }) => {
        const result: Record<string, unknown> = {
          sdk: false,
          node: false,
          wasm: false,
          sdkVersion: null,
        };

        try {
          const rvf = await import('@ruvector/rvf');
          result.sdk = true;
          result.sdkVersion = (rvf as Record<string, unknown>).version ?? 'unknown';
        } catch {
          // SDK not available
        }

        try {
          await import('@ruvector/rvf-node');
          result.node = true;
        } catch {
          // N-API not available
        }

        try {
          await import('@ruvector/rvf-wasm');
          result.wasm = true;
        } catch {
          // WASM not available
        }

        result.platform = `${process.platform}-${process.arch}`;

        if (opts.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          log(`\n${colors.bright}${colors.cyan}RVF Backend Detection${colors.reset}\n`);
          log(`  SDK:       ${result.sdk ? `${colors.green}Yes${colors.reset} (${result.sdkVersion})` : `${colors.red}No${colors.reset}`}`);
          log(`  N-API:     ${result.node ? `${colors.green}Yes${colors.reset}` : `${colors.yellow}No${colors.reset}`}`);
          log(`  WASM:      ${result.wasm ? `${colors.green}Yes${colors.reset}` : `${colors.yellow}No${colors.reset}`}`);
          log(`  Platform:  ${colors.blue}${result.platform}${colors.reset}`);

          if (!result.sdk) {
            log(`\n  Install: ${colors.cyan}npm install @ruvector/rvf${colors.reset}`);
          }
          if (!result.node && !result.wasm) {
            log(`  Native:  ${colors.cyan}npm install @ruvector/rvf-node${colors.reset}`);
            log(`  WASM:    ${colors.cyan}npm install @ruvector/rvf-wasm${colors.reset}`);
          }
          log('');
        }
      })
  );
