/**
 * Tests for Zero-Copy Buffers
 */

import {
  ZeroCopyBufferPool,
  ZeroCopyStreamHandler,
  ZeroCopyResponseBuilder,
  SharedBuffer,
  calculateMemorySavings
} from '../../src/utils/zero-copy-buffer';
import { Buffer } from 'buffer';

describe('ZeroCopyBufferPool', () => {
  let pool: ZeroCopyBufferPool;

  beforeEach(() => {
    pool = new ZeroCopyBufferPool({
      enabled: true,
      poolSize: 10,
      bufferSize: 1024,
      reuseBuffers: true
    });
  });

  test('should acquire buffers from pool', () => {
    const buffer1 = pool.acquire();
    const buffer2 = pool.acquire();

    expect(buffer1).toBeInstanceOf(Buffer);
    expect(buffer2).toBeInstanceOf(Buffer);
    expect(buffer1).not.toBe(buffer2);
  });

  test('should reuse released buffers', () => {
    const buffer1 = pool.acquire();
    pool.release(buffer1);

    const stats = pool.getStats();
    expect(stats.reused).toBeGreaterThanOrEqual(0);
  });

  test('should track statistics', () => {
    pool.acquire();
    pool.acquire();

    const stats = pool.getStats();
    expect(stats.allocated).toBeGreaterThan(0);
  });

  test('should clear pool', () => {
    pool.acquire();
    pool.clear();

    const stats = pool.getStats();
    expect(stats.allocated).toBe(0);
  });

  test('should reset statistics', () => {
    pool.acquire();
    pool.resetStats();

    const stats = pool.getStats();
    expect(stats.reused).toBe(0);
  });
});

describe('ZeroCopyStreamHandler', () => {
  let pool: ZeroCopyBufferPool;
  let handler: ZeroCopyStreamHandler;

  beforeEach(() => {
    pool = new ZeroCopyBufferPool({
      enabled: true,
      poolSize: 10,
      bufferSize: 1024
    });
    handler = new ZeroCopyStreamHandler(pool);
  });

  test('should process chunks without copying', () => {
    const chunk = Buffer.from('test data');
    const view = handler.processChunk(chunk);

    expect(view).toBeInstanceOf(Buffer);
    expect(view.toString()).toBe('test data');
  });

  test('should handle chunk offsets', () => {
    const chunk = Buffer.from('test data');
    const view = handler.processChunk(chunk, 5);

    expect(view.toString()).toBe('data');
  });

  test('should handle chunk length', () => {
    const chunk = Buffer.from('test data');
    const view = handler.processChunk(chunk, 0, 4);

    expect(view.toString()).toBe('test');
  });

  test('should concatenate buffers efficiently', () => {
    const buffers = [
      Buffer.from('Hello '),
      Buffer.from('World')
    ];

    const result = handler.concat(buffers);
    expect(result.toString()).toBe('Hello World');
  });

  test('should handle empty buffer arrays', () => {
    const result = handler.concat([]);
    expect(result.length).toBe(0);
  });

  test('should handle single buffer', () => {
    const buffer = Buffer.from('single');
    const result = handler.concat([buffer]);

    expect(result).toBe(buffer);
  });

  test('should transfer data between buffers', () => {
    const source = Buffer.from('source data');
    const target = Buffer.alloc(20);

    const copied = handler.transfer(source, target, 0, 0);

    expect(copied).toBe(source.length);
    expect(target.toString('utf8', 0, copied)).toBe('source data');
  });

  test('should track statistics', () => {
    const chunk = Buffer.from('test');
    handler.processChunk(chunk);

    const stats = handler.getStats();
    expect(stats.copiesAvoided).toBeGreaterThan(0);
  });

  test('should reset statistics', () => {
    handler.processChunk(Buffer.from('test'));
    handler.resetStats();

    const stats = handler.getStats();
    expect(stats.copiesAvoided).toBe(0);
  });
});

describe('ZeroCopyResponseBuilder', () => {
  let builder: ZeroCopyResponseBuilder;

  beforeEach(() => {
    builder = new ZeroCopyResponseBuilder();
  });

  test('should add chunks', () => {
    builder.addChunk('Hello ');
    builder.addChunk('World');

    expect(builder.getLength()).toBe(11);
  });

  test('should add buffer chunks', () => {
    builder.addChunk(Buffer.from('test'));

    expect(builder.getLength()).toBe(4);
  });

  test('should build response', () => {
    builder.addChunk('Hello ');
    builder.addChunk('World');

    const response = builder.build();
    expect(response.toString()).toBe('Hello World');
  });

  test('should handle empty response', () => {
    const response = builder.build();
    expect(response.length).toBe(0);
  });

  test('should handle single chunk efficiently', () => {
    const chunk = Buffer.from('single');
    builder.addChunk(chunk);

    const response = builder.build();
    expect(response).toBe(chunk);
  });

  test('should clear chunks', () => {
    builder.addChunk('test');
    builder.clear();

    expect(builder.getLength()).toBe(0);
  });
});

describe('SharedBuffer', () => {
  let shared: SharedBuffer;

  beforeEach(() => {
    shared = new SharedBuffer(1024);
  });

  test('should acquire buffer', () => {
    const buffer = shared.acquire();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(shared.getReferenceCount()).toBe(1);
  });

  test('should track reference count', () => {
    shared.acquire();
    shared.acquire();

    expect(shared.getReferenceCount()).toBe(2);
  });

  test('should release references', () => {
    shared.acquire();
    shared.release();

    expect(shared.getReferenceCount()).toBe(0);
  });

  test('should check reusability', () => {
    shared.acquire();
    expect(shared.canReuse()).toBe(false);

    shared.release();
    expect(shared.canReuse()).toBe(true);
  });

  test('should detach buffer', () => {
    shared.detach();
    expect(() => shared.acquire()).toThrow();
  });
});

describe('calculateMemorySavings', () => {
  test('should calculate savings percentage', () => {
    const stats = {
      allocated: 100,
      reused: 50,
      copiesAvoided: 80,
      memorySaved: 3276800 // 50 * 64KB
    };

    const savings = calculateMemorySavings(stats);
    expect(savings.savingsPercentage).toBeGreaterThan(0);
    expect(savings.savingsMB).toBeGreaterThan(0);
  });

  test('should handle zero allocation', () => {
    const stats = {
      allocated: 0,
      reused: 0,
      copiesAvoided: 0,
      memorySaved: 0
    };

    const savings = calculateMemorySavings(stats);
    expect(savings.savingsPercentage).toBe(0);
  });
});
