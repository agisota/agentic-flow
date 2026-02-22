/**
 * RuVectorBackend ID Mapping Tests
 *
 * Validates fix for: https://github.com/ruvnet/agentic-flow/issues/114
 * RvfBackend silently drops vectors with non-numeric string IDs.
 *
 * The underlying @ruvector/core N-API layer converts IDs via Number(),
 * which returns NaN for non-numeric strings (UUIDs, hex hashes, etc.).
 * The fix adds idToLabel/labelToId mappings in the AgentDB layer.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RuVectorBackend } from '../../src/backends/ruvector/RuVectorBackend.js';

// Mock VectorDB to simulate the N-API layer behavior
class MockVectorDB {
  private vectors = new Map<number, number[]>();
  private efSearch = 100;

  insert(id: string, embedding: number[]): void {
    const numericId = Number(id);
    // Simulate N-API behavior: NaN IDs are silently dropped
    if (isNaN(numericId)) {
      return; // Silent drop — this is the bug we're fixing
    }
    this.vectors.set(numericId, embedding);
  }

  search(query: number[], k: number): Array<{ id: string; distance: number }> {
    // Simple brute-force search for testing
    const results: Array<{ id: number; distance: number }> = [];
    for (const [id, vec] of this.vectors.entries()) {
      const distance = this.cosineDistance(query, vec);
      results.push({ id, distance });
    }
    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, k).map(r => ({ id: String(r.id), distance: r.distance }));
  }

  remove(id: string): boolean {
    const numericId = Number(id);
    if (isNaN(numericId)) return false;
    return this.vectors.delete(numericId);
  }

  count(): number {
    return this.vectors.size;
  }

  setEfSearch(ef: number): void {
    this.efSearch = ef;
  }

  save(_path: string): void {}
  load(_path: string): void {}
  memoryUsage(): number { return 0; }

  private cosineDistance(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    if (denom === 0) return 1;
    return 1 - dot / denom;
  }
}

function createBackendWithMock(): RuVectorBackend {
  const backend = new RuVectorBackend({
    dimension: 4,
    metric: 'cosine',
    maxElements: 1000,
  });

  // Inject mock DB and mark as initialized
  (backend as any).db = new MockVectorDB();
  (backend as any).initialized = true;

  return backend;
}

function randomVector(dim: number): Float32Array {
  const vec = new Float32Array(dim);
  for (let i = 0; i < dim; i++) vec[i] = Math.random() * 2 - 1;
  return vec;
}

describe('RuVectorBackend ID Mapping (Issue #114)', () => {
  let backend: RuVectorBackend;

  beforeEach(() => {
    backend = createBackendWithMock();
  });

  afterEach(() => {
    backend.close();
  });

  describe('Non-numeric string ID support', () => {
    it('should insert and retrieve vectors with UUID-style IDs', () => {
      const ids = [
        'da003664-2b0f-6ff3-747e-abcdef123456',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      ];

      for (const id of ids) {
        backend.insert(id, randomVector(4), { source: id });
      }

      const stats = backend.getStats();
      expect(stats.count).toBe(3);
    });

    it('should insert and retrieve vectors with prefix-style IDs', () => {
      const ids = ['chunk_0', 'chunk_1', 'chunk_2', 'doc_abc', 'node_xyz'];

      for (const id of ids) {
        backend.insert(id, randomVector(4));
      }

      expect(backend.getStats().count).toBe(5);
    });

    it('should insert and retrieve vectors with hex hash IDs', () => {
      const ids = ['da003664_2b0f6ff3747e', 'abc123def456', '0xdeadbeef'];

      for (const id of ids) {
        backend.insert(id, randomVector(4));
      }

      expect(backend.getStats().count).toBe(3);
    });

    it('should still work with numeric string IDs', () => {
      for (let i = 1; i <= 10; i++) {
        backend.insert(String(i), randomVector(4));
      }

      expect(backend.getStats().count).toBe(10);
    });

    it('should handle mixed numeric and non-numeric IDs', () => {
      const ids = ['1', 'chunk_a', '42', 'uuid-xyz', '100'];

      for (const id of ids) {
        backend.insert(id, randomVector(4));
      }

      expect(backend.getStats().count).toBe(5);
    });
  });

  describe('Search returns original string IDs', () => {
    it('should return original non-numeric IDs in search results', () => {
      const targetVec = new Float32Array([1, 0, 0, 0]);

      backend.insert('my-document-uuid', targetVec, { title: 'target' });
      backend.insert('other-doc-1', new Float32Array([0, 1, 0, 0]));
      backend.insert('other-doc-2', new Float32Array([0, 0, 1, 0]));

      const results = backend.search(targetVec, 3);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('my-document-uuid');
      expect(results[0].metadata).toEqual({ title: 'target' });
    });

    it('should return correct metadata for string IDs in search', () => {
      backend.insert('doc_alpha', randomVector(4), { category: 'alpha' });
      backend.insert('doc_beta', randomVector(4), { category: 'beta' });
      backend.insert('doc_gamma', randomVector(4), { category: 'gamma' });

      const results = backend.search(randomVector(4), 3);

      for (const result of results) {
        expect(result.id).toMatch(/^doc_/);
        expect(result.metadata).toBeDefined();
        expect(result.metadata!.category).toBeDefined();
      }
    });
  });

  describe('Remove with string IDs', () => {
    it('should remove vectors by non-numeric string ID', () => {
      backend.insert('keep-me', randomVector(4));
      backend.insert('remove-me', randomVector(4));
      backend.insert('also-keep', randomVector(4));

      expect(backend.getStats().count).toBe(3);

      const removed = backend.remove('remove-me');
      expect(removed).toBe(true);
      expect(backend.getStats().count).toBe(2);
    });

    it('should return false for removing non-existent ID', () => {
      backend.insert('exists', randomVector(4));

      const removed = backend.remove('does-not-exist');
      expect(removed).toBe(false);
    });
  });

  describe('Batch insert with string IDs', () => {
    it('should batch insert vectors with non-numeric IDs', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        id: `batch-item-${i}`,
        embedding: randomVector(4),
        metadata: { index: i },
      }));

      backend.insertBatch(items);

      expect(backend.getStats().count).toBe(20);
    });
  });

  describe('ID mapping persistence', () => {
    it('should persist and restore ID mappings via save/load', async () => {
      const fs = await import('fs/promises');
      const os = await import('os');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ruvector-test-'));
      const savePath = path.join(tmpDir, 'test.rvf');

      // Insert with non-numeric IDs
      backend.insert('uuid-aaa', new Float32Array([1, 0, 0, 0]), { name: 'aaa' });
      backend.insert('uuid-bbb', new Float32Array([0, 1, 0, 0]), { name: 'bbb' });
      backend.insert('uuid-ccc', new Float32Array([0, 0, 1, 0]), { name: 'ccc' });

      // Save
      await backend.save(savePath);

      // Verify sidecar file contains mappings
      const metaContent = JSON.parse(await fs.readFile(savePath + '.meta.json', 'utf-8'));
      expect(metaContent.idToLabel).toBeDefined();
      expect(metaContent.labelToId).toBeDefined();
      expect(metaContent.nextLabel).toBe(4); // 3 items + next=4
      expect(metaContent.idToLabel['uuid-aaa']).toBeDefined();
      expect(metaContent.idToLabel['uuid-bbb']).toBeDefined();
      expect(metaContent.idToLabel['uuid-ccc']).toBeDefined();
      expect(metaContent.metadata['uuid-aaa']).toEqual({ name: 'aaa' });

      // Create fresh backend and load
      const backend2 = createBackendWithMock();
      await backend2.load(savePath);

      // Verify mappings are restored
      expect((backend2 as any).idToLabel.get('uuid-aaa')).toBeDefined();
      expect((backend2 as any).idToLabel.get('uuid-bbb')).toBeDefined();
      expect((backend2 as any).idToLabel.get('uuid-ccc')).toBeDefined();
      expect((backend2 as any).nextLabel).toBe(4);

      // Cleanup
      backend2.close();
      await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it('should load legacy metadata format without mappings', async () => {
      const fs = await import('fs/promises');
      const os = await import('os');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ruvector-legacy-'));
      const savePath = path.join(tmpDir, 'test.rvf');

      // Write legacy format (metadata-only, no idToLabel)
      const legacyMeta = {
        'some-id': { name: 'legacy' },
      };
      await fs.writeFile(savePath + '.meta.json', JSON.stringify(legacyMeta));

      // Mock the save file too (load calls db.load)
      await fs.writeFile(savePath, '');

      const backend2 = createBackendWithMock();
      await backend2.load(savePath);

      // Should load metadata without crashing
      expect((backend2 as any).metadata.get('some-id')).toEqual({ name: 'legacy' });

      backend2.close();
      await fs.rm(tmpDir, { recursive: true, force: true });
    });
  });

  describe('Re-insert same ID', () => {
    it('should reuse existing label for duplicate ID', () => {
      const vec1 = new Float32Array([1, 0, 0, 0]);
      const vec2 = new Float32Array([0, 1, 0, 0]);

      backend.insert('my-id', vec1, { version: 1 });
      const labelAfterFirst = (backend as any).idToLabel.get('my-id');

      backend.insert('my-id', vec2, { version: 2 });
      const labelAfterSecond = (backend as any).idToLabel.get('my-id');

      // Should reuse the same numeric label
      expect(labelAfterSecond).toBe(labelAfterFirst);
      // Metadata should be updated
      expect((backend as any).metadata.get('my-id')).toEqual({ version: 2 });
    });
  });

  describe('Close resets state', () => {
    it('should clear all mappings on close', () => {
      backend.insert('id-1', randomVector(4));
      backend.insert('id-2', randomVector(4));

      expect((backend as any).idToLabel.size).toBe(2);
      expect((backend as any).labelToId.size).toBe(2);

      backend.close();

      expect((backend as any).idToLabel.size).toBe(0);
      expect((backend as any).labelToId.size).toBe(0);
      expect((backend as any).metadata.size).toBe(0);
      expect((backend as any).nextLabel).toBe(1);
    });
  });
});
