/**
 * Search for similar documents
 */

import { VectorDB } from '../lib/agentdb.js';
import { getConfig } from '../lib/config.js';
import { Calm } from '@calm-vector/bindings';
import chalk from 'chalk';
import ora from 'ora';

export async function searchCommand(
  query: string,
  options: { k?: number }
): Promise<void> {
  const spinner = ora('Searching...').start();

  try {
    const config = getConfig();
    const db = new VectorDB(config.dbPath);
    const model = new Calm(config.dim, config.hidden);
    const k = options.k || 5;

    // Encode query
    const queryVec = model.encode(query);

    // Search
    const results = db.search(queryVec, k);

    db.close();
    spinner.succeed(chalk.green('Search complete!'));

    console.log(chalk.bold(`\n🔍 Top ${k} Results for: "${query}"\n`));
    console.log(chalk.gray('─'.repeat(60)));

    results.forEach((result, i) => {
      const preview = result.text.substring(0, 150).replace(/\n/g, ' ');
      console.log(
        chalk.yellow(`${i + 1}. `) +
        chalk.white(`${result.id}`) +
        chalk.gray(` (distance: ${result.distance.toFixed(4)})`)
      );
      console.log(chalk.gray(`   ${preview}...`));
      console.log();
    });
  } catch (error) {
    spinner.fail(chalk.red('Search failed'));
    throw error;
  }
}
