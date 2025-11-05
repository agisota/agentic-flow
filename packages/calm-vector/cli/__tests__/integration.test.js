import { test } from 'node:test';
import assert from 'node:assert';
import { VectorDB } from '../dist/lib/agentdb.js';
import { Calm } from '@calm-vector/bindings';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

test('VectorDB integration', async (t) => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'calm-test-'));
  const dbPath = join(tmpDir, 'test.db');

  await t.test('should create and initialize database', () => {
    const db = new VectorDB(dbPath);
    assert.strictEqual(db.count(), 0);
    db.close();
  });

  await t.test('should insert and retrieve documents', () => {
    const db = new VectorDB(dbPath);
    const model = new Calm(128, 256);

    const doc = {
      id: 'test1',
      text: 'Hello world',
      embedding: model.encode('Hello world'),
      timestamp: Date.now(),
    };

    db.insert(doc);
    assert.strictEqual(db.count(), 1);

    const retrieved = db.getById('test1');
    assert.strictEqual(retrieved.id, 'test1');
    assert.strictEqual(retrieved.text, 'Hello world');

    db.close();
  });

  await t.test('should search for similar documents', () => {
    const db = new VectorDB(dbPath);
    const model = new Calm(128, 256);

    const docs = [
      {
        id: 'doc1',
        text: 'machine learning algorithms',
        embedding: model.encode('machine learning algorithms'),
        timestamp: Date.now(),
      },
      {
        id: 'doc2',
        text: 'deep neural networks',
        embedding: model.encode('deep neural networks'),
        timestamp: Date.now(),
      },
      {
        id: 'doc3',
        text: 'cooking recipes',
        embedding: model.encode('cooking recipes'),
        timestamp: Date.now(),
      },
    ];

    db.insertBatch(docs);

    const queryVec = model.encode('artificial intelligence');
    const results = db.search(queryVec, 2);

    assert.strictEqual(results.length, 2);
    assert.ok(results[0].distance < 1.0);

    db.close();
  });

  // Cleanup
  rmSync(tmpDir, { recursive: true, force: true });
});

test('Calm model integration', async (t) => {
  await t.test('should encode text deterministically', () => {
    const model = new Calm(128, 256);
    const v1 = model.encode('test text');
    const v2 = model.encode('test text');

    assert.strictEqual(v1.length, 128);
    assert.deepStrictEqual(v1, v2);
  });

  await t.test('should predict next vector', () => {
    const model = new Calm(128, 256);
    const z = model.encode('hello world');
    const next = model.step(z);

    assert.strictEqual(next.length, 128);
    assert.ok(next.some(v => v !== 0));
  });

  await t.test('should perform multi-step prediction', () => {
    const model = new Calm(64, 128);
    const z = model.encode('test');
    const trajectory = model.steps(z, 5);

    assert.strictEqual(trajectory.length, 5);
    trajectory.forEach(step => {
      assert.strictEqual(step.length, 64);
    });
  });
});
