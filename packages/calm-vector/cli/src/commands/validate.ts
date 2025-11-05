/**
 * Validate model performance
 */

import { VectorDB } from '../lib/agentdb.js';
import { getConfig } from '../lib/config.js';
import { Calm, mse, precisionAtK } from '@calm-vector/bindings';
import { readFileSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';

interface Pair {
  prev: string;
  next: string;
}

export async function validateCommand(
  pairsPath: string,
  options: { k?: number }
): Promise<void> {
  const spinner = ora('Validating model...').start();

  try {
    const config = getConfig();
    const db = new VectorDB(config.dbPath);
    const model = new Calm(config.dim, config.hidden);
    const k = options.k || 3;

    // Load validation pairs
    const data = readFileSync(pairsPath, 'utf-8');
    const pairs: Pair[] = data
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    spinner.text = `Validating ${pairs.length} pairs...`;

    let totalMse = 0;
    let totalPrecision = 0;
    let count = 0;

    for (const pair of pairs) {
      // Encode prev and next
      const prevVec = model.encode(pair.prev);
      const nextVec = model.encode(pair.next);

      // Predict next
      const predVec = model.step(prevVec);

      // Compute MSE
      const mseValue = mse(predVec, nextVec);
      totalMse += mseValue;

      // Retrieval precision@k
      const results = db.search(predVec, k);
      const retrieved = results.map(r => r.text);
      const relevant = [pair.next];
      const precision = precisionAtK(retrieved, relevant, k);
      totalPrecision += precision;

      count++;
    }

    const avgMse = totalMse / count;
    const avgPrecision = totalPrecision / count;

    db.close();
    spinner.succeed(chalk.green('Validation complete!'));

    console.log(chalk.bold('\n📊 Validation Results:\n'));
    console.log(chalk.cyan(`Pairs evaluated: ${count}`));
    console.log(chalk.cyan(`Average MSE: ${avgMse.toFixed(6)}`));
    console.log(chalk.cyan(`Precision@${k}: ${(avgPrecision * 100).toFixed(2)}%`));
  } catch (error) {
    spinner.fail(chalk.red('Validation failed'));
    throw error;
  }
}
