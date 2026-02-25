/**
 * Generic orchestration client tests.
 */

import { describe, it, expect } from 'vitest';
import {
  createOrchestrationClient,
  type StartRunInput,
} from '../../src/orchestration/index.js';

describe('OrchestrationClient', () => {
  it('startRun returns runId and getStatus returns client shape', async () => {
    const client = createOrchestrationClient({ config: { backend: 'test' } });

    const input: StartRunInput = {
      taskDescription: 'Test task',
      cwd: '/tmp/repo',
      acceptanceCriteria: ['Tests pass'],
      allowedPaths: ['src/'],
      provenance: { runId: 'r1', cardId: 'c1' },
    };

    const { runId } = await client.startRun(input);
    expect(runId).toBeDefined();
    expect(typeof runId).toBe('string');

    const status = await client.getStatus(runId);
    expect(status.runId).toBe(runId);
    expect(status.status).toBe('completed');
    expect(typeof status.progress).toBe('number');
    expect(['queued', 'running', 'completed', 'failed', 'cancelled', 'unknown']).toContain(
      status.status
    );
  });

  it('cancel returns success', async () => {
    const client = createOrchestrationClient({ config: { backend: 'test' } });
    const { runId } = await client.startRun({ taskDescription: 'Task' });
    const result = await client.cancel(runId);
    expect(result.success).toBe(true);
  });
});
