/**
 * CALM Flow - Programmatic API
 */

export { VectorDB } from './lib/agentdb.js';
export { getConfig } from './lib/config.js';
export type { VectorDoc } from './lib/agentdb.js';
export type { CalmConfig } from './lib/config.js';

// Re-export bindings
export {
  Calm,
  cosineSimilarity,
  mse,
  precisionAtK,
  recallAtK,
  hashEmbed,
} from '@calm-vector/bindings';
