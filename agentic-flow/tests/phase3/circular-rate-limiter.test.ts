/**
 * Tests for Circular Buffer Rate Limiter
 * Phase 3 Optimization Tests
 */

import {
  CircularRateLimiter,
  SlidingWindowRateLimiter,
  TokenBucketRateLimiter,
  calculateRateLimiterSavings
} from '../../src/utils/circular-rate-limiter';

describe('CircularRateLimiter', () => {
  let limiter: CircularRateLimiter;

  beforeEach(() => {
    limiter = new CircularRateLimiter({
      enabled: true,
      windowMs: 1000,
      maxRequests: 10,
      bufferSize: 20
    });
  });

  describe('Basic Rate Limiting', () => {
    test('should allow requests within limit', () => {
      for (let i = 0; i < 10; i++) {
        const result = limiter.checkLimit('client1');
        expect(result.allowed).toBe(true);
      }
    });

    test('should block requests over limit', () => {
      // Max out the limit
      for (let i = 0; i < 10; i++) {
        limiter.checkLimit('client1');
      }

      // Next request should be blocked
      const result = limiter.checkLimit('client1');
      expect(result.allowed).toBe(false);
    });

    test('should track remaining requests', () => {
      limiter.checkLimit('client1'); // 1 request
      const result = limiter.checkLimit('client1'); // 2 requests

      expect(result.remaining).toBe(8); // 10 - 2 = 8
    });

    test('should provide retry-after time when blocked', () => {
      // Max out the limit
      for (let i = 0; i < 10; i++) {
        limiter.checkLimit('client1');
      }

      const result = limiter.checkLimit('client1');
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('Multiple Clients', () => {
    test('should track clients independently', () => {
      // Client 1 maxes out
      for (let i = 0; i < 10; i++) {
        limiter.checkLimit('client1');
      }

      // Client 2 should still be allowed
      const result = limiter.checkLimit('client2');
      expect(result.allowed).toBe(true);
    });

    test('should track unique clients', () => {
      limiter.checkLimit('client1');
      limiter.checkLimit('client2');
      limiter.checkLimit('client3');

      const stats = limiter.getStats();
      expect(stats.uniqueClients).toBe(3);
    });
  });

  describe('Time Window', () => {
    test('should allow requests after window expires', async () => {
      const shortLimiter = new CircularRateLimiter({
        enabled: true,
        windowMs: 100,
        maxRequests: 5,
        bufferSize: 10
      });

      // Max out the limit
      for (let i = 0; i < 5; i++) {
        shortLimiter.checkLimit('client1');
      }

      // Should be blocked
      let result = shortLimiter.checkLimit('client1');
      expect(result.allowed).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be allowed again
      result = shortLimiter.checkLimit('client1');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Client Management', () => {
    test('should reset client limit', () => {
      // Max out the limit
      for (let i = 0; i < 10; i++) {
        limiter.checkLimit('client1');
      }

      limiter.reset('client1');

      const result = limiter.checkLimit('client1');
      expect(result.allowed).toBe(true);
    });

    test('should remove client', () => {
      limiter.checkLimit('client1');
      limiter.checkLimit('client2');

      const removed = limiter.removeClient('client1');
      expect(removed).toBe(true);

      const stats = limiter.getStats();
      expect(stats.uniqueClients).toBe(1);
    });

    test('should cleanup inactive clients', async () => {
      const shortLimiter = new CircularRateLimiter({
        enabled: true,
        windowMs: 100,
        maxRequests: 10,
        bufferSize: 20
      });

      shortLimiter.checkLimit('client1');
      shortLimiter.checkLimit('client2');

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      const cleaned = shortLimiter.cleanup();
      expect(cleaned).toBe(2); // Both clients cleaned
    });

    test('should get client info', () => {
      limiter.checkLimit('client1');
      limiter.checkLimit('client1');

      const info = limiter.getClientInfo('client1');
      expect(info).toBeDefined();
      expect(info?.count).toBe(2);
      expect(info?.utilization).toBeGreaterThan(0);
      expect(info?.oldest).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    test('should track total requests', () => {
      limiter.checkLimit('client1');
      limiter.checkLimit('client1');
      limiter.checkLimit('client2');

      const stats = limiter.getStats();
      expect(stats.totalRequests).toBe(3);
    });

    test('should track allowed and blocked requests', () => {
      // 10 allowed
      for (let i = 0; i < 10; i++) {
        limiter.checkLimit('client1');
      }

      // 5 blocked
      for (let i = 0; i < 5; i++) {
        limiter.checkLimit('client1');
      }

      const stats = limiter.getStats();
      expect(stats.allowedRequests).toBe(10);
      expect(stats.blockedRequests).toBe(5);
    });

    test('should calculate block rate', () => {
      for (let i = 0; i < 10; i++) {
        limiter.checkLimit('client1');
      }

      for (let i = 0; i < 5; i++) {
        limiter.checkLimit('client1');
      }

      const blockRate = limiter.getBlockRate();
      expect(blockRate).toBeCloseTo(33.33, 1); // 5/15 = 33.33%
    });

    test('should track average check time', () => {
      limiter.checkLimit('client1');
      limiter.checkLimit('client1');

      const stats = limiter.getStats();
      expect(stats.avgCheckTime).toBeGreaterThan(0);
    });

    test('should reset statistics', () => {
      limiter.checkLimit('client1');
      limiter.resetStats();

      const stats = limiter.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.allowedRequests).toBe(0);
      expect(stats.blockedRequests).toBe(0);
    });

    test('should clear all clients', () => {
      limiter.checkLimit('client1');
      limiter.checkLimit('client2');

      limiter.clear();

      const stats = limiter.getStats();
      expect(stats.uniqueClients).toBe(0);
    });
  });

  describe('Disabled Rate Limiting', () => {
    test('should always allow when disabled', () => {
      const disabled = new CircularRateLimiter({ enabled: false });

      for (let i = 0; i < 100; i++) {
        const result = disabled.checkLimit('client1');
        expect(result.allowed).toBe(true);
      }
    });
  });
});

describe('SlidingWindowRateLimiter', () => {
  let limiter: SlidingWindowRateLimiter;

  beforeEach(() => {
    limiter = new SlidingWindowRateLimiter({
      enabled: true,
      windowMs: 1000,
      maxRequests: 10,
      bufferSize: 20
    });
  });

  test('should use sliding window algorithm', () => {
    for (let i = 0; i < 5; i++) {
      limiter.checkLimitSliding('client1');
    }

    const result = limiter.checkLimitSliding('client1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeLessThanOrEqual(5);
  });

  test('should provide more accurate remaining count', () => {
    const result1 = limiter.checkLimitSliding('client1');
    const result2 = limiter.checkLimitSliding('client1');

    expect(result2.remaining).toBeLessThan(result1.remaining);
  });
});

describe('TokenBucketRateLimiter', () => {
  let limiter: TokenBucketRateLimiter;

  beforeEach(() => {
    limiter = new TokenBucketRateLimiter({
      capacity: 10,
      refillRate: 5,
      refillInterval: 1000
    });
  });

  test('should consume tokens', () => {
    const result1 = limiter.checkLimit('client1', 3);
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(7);

    const result2 = limiter.checkLimit('client1', 5);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(2);
  });

  test('should block when not enough tokens', () => {
    limiter.checkLimit('client1', 10); // Use all tokens

    const result = limiter.checkLimit('client1', 1);
    expect(result.allowed).toBe(false);
  });

  test('should refill tokens over time', async () => {
    limiter.checkLimit('client1', 10); // Use all tokens

    // Wait for refill
    await new Promise(resolve => setTimeout(resolve, 1100));

    const result = limiter.checkLimit('client1', 5);
    expect(result.allowed).toBe(true);
  });

  test('should track statistics', () => {
    limiter.checkLimit('client1', 5);
    limiter.checkLimit('client1', 5);

    const stats = limiter.getStats();
    expect(stats.totalRequests).toBe(2);
    expect(stats.allowedRequests).toBe(2);
  });
});

describe('calculateRateLimiterSavings', () => {
  test('should calculate CPU savings', () => {
    const savings = calculateRateLimiterSavings(0.5, 0.4, 1000);

    expect(savings.savingsPercentage).toBe(20); // (0.5 - 0.4) / 0.5 * 100
    expect(savings.totalTimeSaved).toBe(100); // 0.1 * 1000
    expect(savings.cpuReduction).toBe(20);
  });

  test('should handle zero savings', () => {
    const savings = calculateRateLimiterSavings(0.5, 0.5, 1000);

    expect(savings.savingsPercentage).toBe(0);
    expect(savings.totalTimeSaved).toBe(0);
    expect(savings.cpuReduction).toBe(0);
  });

  test('should calculate negative savings (performance regression)', () => {
    const savings = calculateRateLimiterSavings(0.4, 0.5, 1000);

    expect(savings.savingsPercentage).toBeLessThan(0);
    expect(savings.totalTimeSaved).toBeLessThan(0);
  });
});
