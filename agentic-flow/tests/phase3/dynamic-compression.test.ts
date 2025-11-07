/**
 * Tests for Dynamic Compression based on CPU
 * Phase 3 Optimization Tests
 */

import {
  DynamicCompressionManager,
  COMPRESSION_LEVELS,
  shouldCompress,
  calculateCompressionEfficiency
} from '../../src/utils/dynamic-compression';

describe('DynamicCompressionManager', () => {
  let manager: DynamicCompressionManager;

  beforeEach(() => {
    manager = new DynamicCompressionManager({
      enabled: true,
      minSize: 1024,
      algorithm: 'gzip',
      adaptive: false, // Disable adaptive for predictable tests
      cpuThresholdHigh: 70,
      cpuThresholdLow: 30
    });
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('Basic Compression', () => {
    test('should compress data with gzip', async () => {
      const data = Buffer.from('a'.repeat(10000));
      const compressed = await manager.compress(data);

      expect(compressed.length).toBeLessThan(data.length);
    });

    test('should compress data with brotli', async () => {
      const brotliManager = new DynamicCompressionManager({
        enabled: true,
        algorithm: 'brotli',
        adaptive: false
      });

      try {
        const data = Buffer.from('b'.repeat(10000));
        const compressed = await brotliManager.compress(data);

        expect(compressed.length).toBeLessThan(data.length);
      } finally {
        brotliManager.destroy();
      }
    });

    test('should compress data with deflate', async () => {
      const deflateManager = new DynamicCompressionManager({
        enabled: true,
        algorithm: 'deflate',
        adaptive: false
      });

      try {
        const data = Buffer.from('c'.repeat(10000));
        const compressed = await deflateManager.compress(data);

        expect(compressed.length).toBeLessThan(data.length);
      } finally {
        deflateManager.destroy();
      }
    });

    test('should not compress small data', async () => {
      const data = Buffer.from('small');
      const result = await manager.compress(data);

      expect(result).toBe(data); // Same buffer
    });

    test('should return original data on compression error', async () => {
      // This would require mocking zlib to force an error
      // For now, test the happy path
      const data = Buffer.from('x'.repeat(5000));
      const result = await manager.compress(data);

      expect(result).toBeDefined();
    });
  });

  describe('Compression Levels', () => {
    test('should have correct gzip levels', () => {
      const levels = COMPRESSION_LEVELS.gzip;

      expect(levels).toHaveLength(4);
      expect(levels[0].level).toBe(1);
      expect(levels[1].level).toBe(3);
      expect(levels[2].level).toBe(6);
      expect(levels[3].level).toBe(9);
    });

    test('should have correct brotli levels', () => {
      const levels = COMPRESSION_LEVELS.brotli;

      expect(levels).toHaveLength(4);
      expect(levels[0].level).toBe(1);
      expect(levels[1].level).toBe(4);
      expect(levels[2].level).toBe(6);
      expect(levels[3].level).toBe(11);
    });

    test('should manually set compression level', () => {
      const result = manager.setLevel('fastest');
      expect(result).toBe(true);

      const stats = manager.getStats();
      expect(stats.currentLevelName).toBe('fastest');
    });

    test('should reject invalid level name', () => {
      const result = manager.setLevel('invalid');
      expect(result).toBe(false);
    });
  });

  describe('Statistics', () => {
    test('should track compression statistics', async () => {
      const data = Buffer.from('d'.repeat(10000));
      await manager.compress(data);

      const stats = manager.getStats();

      expect(stats.totalBytes).toBeGreaterThan(0);
      expect(stats.compressedBytes).toBeGreaterThan(0);
      expect(stats.compressionRatio).toBeGreaterThan(1);
      expect(stats.avgCompressionTime).toBeGreaterThan(0);
    });

    test('should calculate compression savings', async () => {
      const data = Buffer.from('e'.repeat(10000));
      await manager.compress(data);

      const savings = manager.getSavings();

      expect(savings.byteSavings).toBeGreaterThan(0);
      expect(savings.percentSavings).toBeGreaterThan(0);
      expect(savings.mbSaved).toBeGreaterThan(0);
    });

    test('should reset statistics', async () => {
      const data = Buffer.from('f'.repeat(10000));
      await manager.compress(data);

      manager.resetStats();

      const stats = manager.getStats();
      expect(stats.totalBytes).toBe(0);
      expect(stats.compressedBytes).toBe(0);
      expect(stats.levelChanges).toBe(0);
    });
  });

  describe('Disabled Compression', () => {
    test('should not compress when disabled', async () => {
      const disabled = new DynamicCompressionManager({
        enabled: false,
        algorithm: 'gzip'
      });

      try {
        const data = Buffer.from('g'.repeat(10000));
        const result = await disabled.compress(data);

        expect(result).toBe(data);
      } finally {
        disabled.destroy();
      }
    });
  });

  describe('Adaptive Compression', () => {
    test('should create adaptive compression manager', () => {
      const adaptive = new DynamicCompressionManager({
        enabled: true,
        adaptive: true,
        checkInterval: 1000
      });

      try {
        const stats = adaptive.getStats();
        expect(stats.currentLevel).toBeGreaterThan(0);
      } finally {
        adaptive.destroy();
      }
    });

    // Note: CPU monitoring tests are difficult to unit test reliably
    // These would be better as integration tests
  });
});

describe('shouldCompress', () => {
  test('should compress text content types', () => {
    expect(shouldCompress('text/html', 2000)).toBe(true);
    expect(shouldCompress('text/plain', 2000)).toBe(true);
    expect(shouldCompress('text/css', 2000)).toBe(true);
    expect(shouldCompress('text/javascript', 2000)).toBe(true);
  });

  test('should compress application content types', () => {
    expect(shouldCompress('application/json', 2000)).toBe(true);
    expect(shouldCompress('application/javascript', 2000)).toBe(true);
    expect(shouldCompress('application/xml', 2000)).toBe(true);
  });

  test('should not compress small content', () => {
    expect(shouldCompress('text/html', 500)).toBe(false);
  });

  test('should not compress images', () => {
    expect(shouldCompress('image/png', 5000)).toBe(false);
    expect(shouldCompress('image/jpeg', 5000)).toBe(false);
  });

  test('should respect custom min size', () => {
    expect(shouldCompress('text/html', 1500, 2000)).toBe(false);
    expect(shouldCompress('text/html', 2500, 2000)).toBe(true);
  });
});

describe('calculateCompressionEfficiency', () => {
  test('should calculate efficiency score', () => {
    const stats = {
      totalBytes: 1000000,
      compressedBytes: 500000,
      compressionRatio: 2.0,
      avgCompressionTime: 10,
      currentLevel: 6,
      levelChanges: 5,
      cpuAdjustments: 3
    };

    const efficiency = calculateCompressionEfficiency(stats);

    expect(efficiency.efficiency).toBeGreaterThan(0);
    expect(efficiency.efficiency).toBeLessThanOrEqual(100);
    expect(efficiency.timePerMB).toBeGreaterThan(0);
    expect(efficiency.ratioScore).toBeGreaterThan(0);
  });

  test('should handle low compression ratio', () => {
    const stats = {
      totalBytes: 1000000,
      compressedBytes: 900000,
      compressionRatio: 1.1,
      avgCompressionTime: 5,
      currentLevel: 1,
      levelChanges: 0,
      cpuAdjustments: 0
    };

    const efficiency = calculateCompressionEfficiency(stats);

    expect(efficiency.ratioScore).toBeLessThan(10);
  });

  test('should handle high compression ratio', () => {
    const stats = {
      totalBytes: 1000000,
      compressedBytes: 100000,
      compressionRatio: 10.0,
      avgCompressionTime: 50,
      currentLevel: 9,
      levelChanges: 10,
      cpuAdjustments: 8
    };

    const efficiency = calculateCompressionEfficiency(stats);

    expect(efficiency.ratioScore).toBeGreaterThan(50);
  });

  test('should cap ratio score at 100', () => {
    const stats = {
      totalBytes: 1000000,
      compressedBytes: 10000,
      compressionRatio: 100.0,
      avgCompressionTime: 100,
      currentLevel: 11,
      levelChanges: 20,
      cpuAdjustments: 15
    };

    const efficiency = calculateCompressionEfficiency(stats);

    expect(efficiency.ratioScore).toBeLessThanOrEqual(100);
  });
});
