/**
 * Initialize CALM Flow database
 */

import { VectorDB } from '../lib/agentdb.js';
import { getConfig } from '../lib/config.js';
import chalk from 'chalk';
import ora from 'ora';

export async function initCommand(): Promise<void> {
  const spinner = ora('Initializing CALM Flow database...').start();

  try {
    const config = getConfig();
    const db = new VectorDB(config.dbPath);

    spinner.succeed(chalk.green('Database initialized successfully!'));
    console.log(chalk.cyan(`Location: ${config.dbPath}`));
    console.log(chalk.cyan(`Dimension: ${config.dim}`));
    console.log(chalk.cyan(`Hidden: ${config.hidden}`));

    db.close();
  } catch (error) {
    spinner.fail(chalk.red('Failed to initialize database'));
    throw error;
  }
}
