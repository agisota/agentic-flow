/**
 * Generate vector trajectories with retrieval
 */

import { VectorDB } from '../lib/agentdb.js';
import { getConfig } from '../lib/config.js';
import { Calm } from '@calm-vector/bindings';
import chalk from 'chalk';
import ora from 'ora';

export async function generateCommand(
  prompt: string,
  options: { steps?: number; k?: number }
): Promise<void> {
  const spinner = ora('Generating...').start();

  try {
    const config = getConfig();
    const db = new VectorDB(config.dbPath);
    const model = new Calm(config.dim, config.hidden);

    const steps = options.steps || 4;
    const k = options.k || 5;

    spinner.text = 'Encoding prompt...';
    let z = model.encode(prompt);

    console.log(chalk.bold('\n📊 Vector-Only Generation with Retrieval\n'));
    console.log(chalk.cyan(`Prompt: ${prompt}`));
    console.log(chalk.cyan(`Steps: ${steps}, Top-K: ${k}\n`));

    for (let t = 0; t < steps; t++) {
      spinner.text = `Step ${t + 1}/${steps}...`;

      // Predict next vector
      z = model.step(z);

      // Retrieve similar documents
      const results = db.search(z, k);

      console.log(chalk.bold(`\n🔍 Step ${t + 1} - Top ${k} Similar Documents:`));
      console.log(chalk.gray('─'.repeat(60)));

      results.forEach((result, i) => {
        const preview = result.text.substring(0, 100).replace(/\n/g, ' ');
        console.log(
          chalk.yellow(`${i + 1}. `) +
          chalk.white(`${result.id}`) +
          chalk.gray(` (dist: ${result.distance.toFixed(4)})`)
        );
        console.log(chalk.gray(`   ${preview}...`));
      });
    }

    db.close();
    spinner.succeed(chalk.green('\n✅ Generation complete!'));
  } catch (error) {
    spinner.fail(chalk.red('Generation failed'));
    throw error;
  }
}
