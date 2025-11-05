#!/usr/bin/env node

/**
 * CALM Flow CLI - Vector-only inference with AgentDB
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { ingestCommand } from './commands/ingest.js';
import { generateCommand } from './commands/generate.js';
import { searchCommand } from './commands/search.js';
import { validateCommand } from './commands/validate.js';
import { statsCommand } from './commands/stats.js';

const program = new Command();

program
  .name('calm-flow')
  .description('Vector-only inference CLI with AgentDB integration')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize vector database')
  .action(async () => {
    try {
      await initCommand();
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('ingest <path>')
  .description('Ingest documents from directory or file')
  .action(async (path: string) => {
    try {
      await ingestCommand(path);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('generate <prompt>')
  .description('Generate vector trajectories with retrieval')
  .option('-s, --steps <number>', 'Number of prediction steps', '4')
  .option('-k, --k <number>', 'Top-K results per step', '5')
  .action(async (prompt: string, options) => {
    try {
      await generateCommand(prompt, {
        steps: parseInt(options.steps, 10),
        k: parseInt(options.k, 10),
      });
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('search <query>')
  .description('Search for similar documents')
  .option('-k, --k <number>', 'Top-K results', '5')
  .action(async (query: string, options) => {
    try {
      await searchCommand(query, {
        k: parseInt(options.k, 10),
      });
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('validate <pairs>')
  .description('Validate model on JSONL pairs file')
  .option('-k, --k <number>', 'Top-K for precision', '3')
  .action(async (pairs: string, options) => {
    try {
      await validateCommand(pairs, {
        k: parseInt(options.k, 10),
      });
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Show database statistics')
  .action(async () => {
    try {
      await statsCommand();
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program.parse();
