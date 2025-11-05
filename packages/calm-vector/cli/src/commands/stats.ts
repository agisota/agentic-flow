/**
 * Show database statistics
 */

import { VectorDB } from '../lib/agentdb.js';
import { getConfig } from '../lib/config.js';
import chalk from 'chalk';

export async function statsCommand(): Promise<void> {
  try {
    const config = getConfig();
    const db = new VectorDB(config.dbPath);

    const count = db.count();

    console.log(chalk.bold('\n📊 Database Statistics\n'));
    console.log(chalk.cyan(`Database: ${config.dbPath}`));
    console.log(chalk.cyan(`Documents: ${count}`));
    console.log(chalk.cyan(`Dimension: ${config.dim}`));
    console.log(chalk.cyan(`Hidden: ${config.hidden}`));

    db.close();
  } catch (error) {
    console.error(chalk.red('Failed to get statistics'));
    throw error;
  }
}
