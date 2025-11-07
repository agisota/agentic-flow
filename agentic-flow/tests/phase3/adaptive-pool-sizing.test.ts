/**
 * Tests for Adaptive Pool Sizing
 * Phase 3 Optimization Tests
 */

import {
  AdaptivePoolSizingManager,
  AdaptiveConnectionPool,
  AdaptiveBufferPool,
  calculatePoolSizingSavings
} from '../../src/utils/adaptive-pool-sizing';

describe('AdaptivePoolSizingManager', () => {
  let manager: AdaptivePoolSizingManager;

  beforeEach(() => {
    manager = new AdaptivePoolSizingManager({
      enabled: true,
      minSize: 10,
      maxSize: 100,
      initialSize: 50,
      adjustInterval: 1000,
      targetUtilization: 70,
      scaleUpThreshold: 80,
      scaleDownThreshold: 40,
      scaleStep: 10
    });
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('Basic Sizing', () => {
    test('should start at initial size', () => {
      expect(manager.getCurrentSize()).toBe(50);
    });

    test('should record usage', () => {
      manager.recordUsage(35, 50); // 70% utilization

      const stats = manager.getStats();
      expect(stats.activeItems).toBe(35);
      expect(stats.currentSize).toBe(50);
      expect(stats.utilizationPercent).toBe(70);
    });

    test('should track average utilization', () => {
      manager.recordUsage(40, 50); // 80%
      manager.recordUsage(30, 50); // 60%
      manager.recordUsage(35, 50); // 70%

      const stats = manager.getStats();
      expect(stats.avgUtilization).toBe(70);
    });

    test('should track peak utilization', () => {
      manager.recordUsage(30, 50); // 60%
      manager.recordUsage(45, 50); // 90%
      manager.recordUsage(35, 50); // 70%

      const stats = manager.getStats();
      expect(stats.peakUtilization).toBe(90);
    });
  });

  describe('Adaptive Scaling', () => {
    test('should recommend scale up on high utilization', () => {
      // Simulate high utilization
      for (let i = 0; i < 10; i++) {
        manager.recordUsage(45, 50); // 90% utilization
      }

      const recommended = manager.getRecommendedSize();
      expect(recommended).toBeGreaterThan(50);
    });

    test('should recommend scale down on low utilization', () => {
      // Simulate low utilization
      for (let i = 0; i < 10; i++) {
        manager.recordUsage(15, 50); // 30% utilization
      }

      const recommended = manager.getRecommendedSize();
      expect(recommended).toBeLessThan(50);
    });

    test('should respect min size', () => {
      // Simulate very low utilization
      for (let i = 0; i < 10; i++) {
        manager.recordUsage(1, 50);
      }

      const recommended = manager.getRecommendedSize();
      expect(recommended).toBeGreaterThanOrEqual(10);
    });

    test('should respect max size', () => {
      // Simulate very high utilization
      for (let i = 0; i < 10; i++) {
        manager.recordUsage(50, 50); // 100% utilization
      }

      // Manually set to near max
      manager.setSize(95);

      const recommended = manager.getRecommendedSize();
      expect(recommended).toBeLessThanOrEqual(100);
    });

    test('should apply adjustments', () => {
      for (let i = 0; i < 10; i++) {
        manager.recordUsage(45, 50); // 90% utilization
      }

      const newSize = manager.applyAdjustment();
      expect(newSize).toBeGreaterThan(50);

      const stats = manager.getStats();
      expect(stats.totalAdjustments).toBe(1);
      expect(stats.scaleUps).toBe(1);
    });
  });

  describe('Traffic Analysis', () => {
    test('should record traffic patterns', () => {
      manager.recordTraffic({
        timestamp: Date.now(),
        requestRate: 100,
        avgResponseTime: 50,
        activeConnections: 20,
        queueDepth: 5
      });

      const analysis = manager.getTrafficAnalysis();
      expect(analysis.currentRate).toBe(100);
    });

    test('should calculate average request rate', () => {
      manager.recordTraffic({
        timestamp: Date.now(),
        requestRate: 100,
        avgResponseTime: 50,
        activeConnections: 20,
        queueDepth: 5
      });

      manager.recordTraffic({
        timestamp: Date.now(),
        requestRate: 200,
        avgResponseTime: 60,
        activeConnections: 40,
        queueDepth: 10
      });

      const analysis = manager.getTrafficAnalysis();
      expect(analysis.avgRate).toBe(150);
    });

    test('should track peak request rate', () => {
      manager.recordTraffic({
        timestamp: Date.now(),
        requestRate: 100,
        avgResponseTime: 50,
        activeConnections: 20,
        queueDepth: 5
      });

      manager.recordTraffic({
        timestamp: Date.now(),
        requestRate: 300,
        avgResponseTime: 70,
        activeConnections: 60,
        queueDepth: 15
      });

      const analysis = manager.getTrafficAnalysis();
      expect(analysis.peakRate).toBe(300);
    });

    test('should detect increasing trend', () => {
      // Simulate increasing traffic
      for (let i = 0; i < 20; i++) {
        manager.recordTraffic({
          timestamp: Date.now(),
          requestRate: 50 + i * 10,
          avgResponseTime: 50,
          activeConnections: 20,
          queueDepth: 5
        });
      }

      const analysis = manager.getTrafficAnalysis();
      expect(analysis.trend).toBe('increasing');
    });

    test('should detect decreasing trend', () => {
      // Simulate decreasing traffic
      for (let i = 0; i < 20; i++) {
        manager.recordTraffic({
          timestamp: Date.now(),
          requestRate: 200 - i * 10,
          avgResponseTime: 50,
          activeConnections: 20,
          queueDepth: 5
        });
      }

      const analysis = manager.getTrafficAnalysis();
      expect(analysis.trend).toBe('decreasing');
    });
  });

  describe('Efficiency Scoring', () => {
    test('should calculate efficiency score', () => {
      manager.recordUsage(35, 50); // 70% utilization (target)

      const score = manager.getEfficiencyScore();
      expect(score).toBe(100); // Perfect at target
    });

    test('should penalize deviation from target', () => {
      manager.recordUsage(45, 50); // 90% utilization

      const score = manager.getEfficiencyScore();
      expect(score).toBeLessThan(100);
    });
  });

  describe('Manual Control', () => {
    test('should manually set size', () => {
      const result = manager.setSize(75);
      expect(result).toBe(true);
      expect(manager.getCurrentSize()).toBe(75);
    });

    test('should reject size below min', () => {
      const result = manager.setSize(5);
      expect(result).toBe(false);
    });

    test('should reject size above max', () => {
      const result = manager.setSize(150);
      expect(result).toBe(false);
    });
  });

  describe('Statistics', () => {
    test('should reset statistics', () => {
      manager.recordUsage(35, 50);
      manager.applyAdjustment();

      manager.resetStats();

      const stats = manager.getStats();
      expect(stats.totalAdjustments).toBe(0);
      expect(stats.scaleUps).toBe(0);
      expect(stats.scaleDowns).toBe(0);
      expect(stats.avgUtilization).toBe(0);
      expect(stats.peakUtilization).toBe(0);
    });
  });

  describe('Disabled Adaptation', () => {
    test('should not adapt when disabled', () => {
      const disabled = new AdaptivePoolSizingManager({
        enabled: false,
        minSize: 10,
        maxSize: 100,
        initialSize: 50
      });

      try {
        disabled.recordUsage(45, 50); // High utilization

        const recommended = disabled.getRecommendedSize();
        expect(recommended).toBe(50); // No change
      } finally {
        disabled.destroy();
      }
    });
  });
});

describe('AdaptiveConnectionPool', () => {
  let createCount = 0;
  let destroyCount = 0;

  const createFn = () => {
    createCount++;
    return { id: createCount };
  };

  const destroyFn = () => {
    destroyCount++;
  };

  beforeEach(() => {
    createCount = 0;
    destroyCount = 0;
  });

  test('should create adaptive connection pool', () => {
    const pool = new AdaptiveConnectionPool(
      {
        enabled: true,
        minSize: 5,
        maxSize: 20,
        initialSize: 10
      },
      createFn,
      destroyFn
    );

    try {
      expect(createCount).toBeGreaterThan(0); // Initial pool created
    } finally {
      pool.destroy();
    }
  });

  test('should acquire and release connections', () => {
    const pool = new AdaptiveConnectionPool(
      {
        enabled: true,
        minSize: 5,
        maxSize: 20,
        initialSize: 10
      },
      createFn,
      destroyFn
    );

    try {
      const conn = pool.acquire();
      expect(conn).toBeDefined();

      pool.release(conn);

      const stats = pool.getStats();
      expect(stats.inUseCount).toBe(0);
    } finally {
      pool.destroy();
    }
  });

  test('should create new connection when pool empty', () => {
    const pool = new AdaptiveConnectionPool(
      {
        enabled: true,
        minSize: 1,
        maxSize: 10,
        initialSize: 1
      },
      createFn,
      destroyFn
    );

    try {
      const conn1 = pool.acquire();
      const conn2 = pool.acquire();

      expect(conn1).not.toBe(conn2);
    } finally {
      pool.destroy();
    }
  });

  test('should destroy pool', () => {
    const pool = new AdaptiveConnectionPool(
      {
        enabled: true,
        minSize: 5,
        maxSize: 20,
        initialSize: 10
      },
      createFn,
      destroyFn
    );

    pool.destroy();

    expect(destroyCount).toBeGreaterThan(0);
  });
});

describe('AdaptiveBufferPool', () => {
  test('should create adaptive buffer pool', () => {
    const pool = new AdaptiveBufferPool(
      {
        enabled: true,
        minSize: 5,
        maxSize: 20,
        initialSize: 10
      },
      64 * 1024
    );

    try {
      const buffer = pool.acquire();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBe(64 * 1024);

      pool.release(buffer);
    } finally {
      pool.destroy();
    }
  });

  test('should track buffer statistics', () => {
    const pool = new AdaptiveBufferPool(
      {
        enabled: true,
        minSize: 5,
        maxSize: 20,
        initialSize: 10
      },
      32 * 1024
    );

    try {
      const buffer = pool.acquire();
      const stats = pool.getStats();

      expect(stats.inUseCount).toBe(1);
    } finally {
      pool.destroy();
    }
  });
});

describe('calculatePoolSizingSavings', () => {
  test('should calculate resource savings', () => {
    const savings = calculatePoolSizingSavings(80, 50, 100);

    expect(savings.resourceSavings).toBe(30);
    expect(savings.savingsPercent).toBe(37.5); // 30/80 * 100
    expect(savings.efficiencyGain).toBe(50); // (1 - 50/100) * 100
  });

  test('should handle no savings', () => {
    const savings = calculatePoolSizingSavings(50, 50, 100);

    expect(savings.resourceSavings).toBe(0);
    expect(savings.savingsPercent).toBe(0);
    expect(savings.efficiencyGain).toBe(50);
  });

  test('should handle increased usage', () => {
    const savings = calculatePoolSizingSavings(50, 60, 100);

    expect(savings.resourceSavings).toBe(-10);
    expect(savings.savingsPercent).toBeLessThan(0);
  });
});
