/**
 * Configuration management
 */

import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';
import { homedir } from 'os';

dotenvConfig();

export interface CalmConfig {
  dim: number;
  hidden: number;
  dbPath: string;
  dataDir: string;
}

export function getConfig(): CalmConfig {
  const dataDir = process.env.CALM_DATA_DIR || join(homedir(), '.calm-flow');

  return {
    dim: parseInt(process.env.CALM_DIM || '384', 10),
    hidden: parseInt(process.env.CALM_HIDDEN || '768', 10),
    dbPath: process.env.CALM_DB_PATH || join(dataDir, 'vectors.db'),
    dataDir,
  };
}
