/**
 * Ingest documents into vector database
 */

import { VectorDB } from '../lib/agentdb.js';
import { getConfig } from '../lib/config.js';
import { Calm } from '@calm-vector/bindings';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function ingestCommand(path: string): Promise<void> {
  const spinner = ora('Ingesting documents...').start();

  try {
    const config = getConfig();
    const db = new VectorDB(config.dbPath);
    const model = new Calm(config.dim, config.hidden);

    const files = getFiles(path);
    spinner.text = `Found ${files.length} files to ingest...`;

    let count = 0;
    const docs = [];

    for (const file of files) {
      const text = readFileSync(file, 'utf-8');
      const embedding = model.encode(text);
      const id = basename(file);

      docs.push({
        id,
        text,
        embedding,
        metadata: { path: file, size: text.length },
        timestamp: Date.now(),
      });

      count++;
      spinner.text = `Ingested ${count}/${files.length} files...`;
    }

    db.insertBatch(docs);
    db.close();

    spinner.succeed(chalk.green(`Successfully ingested ${count} documents!`));
    console.log(chalk.cyan(`Total vectors: ${db.count()}`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to ingest documents'));
    throw error;
  }
}

function getFiles(path: string): string[] {
  const files: string[] = [];
  const stat = statSync(path);

  if (stat.isDirectory()) {
    const entries = readdirSync(path);
    for (const entry of entries) {
      files.push(...getFiles(join(path, entry)));
    }
  } else if (stat.isFile()) {
    const ext = extname(path);
    if (['.txt', '.md', '.json'].includes(ext)) {
      files.push(path);
    }
  }

  return files;
}
