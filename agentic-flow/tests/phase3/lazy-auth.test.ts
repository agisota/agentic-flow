/**
 * Tests for Lazy Authentication with Session Caching
 * Phase 3 Optimization Tests
 */

import { LazyAuthManager, TokenAuth, calculateAuthSavings } from '../../src/utils/lazy-auth';

describe('LazyAuthManager', () => {
  let authManager: LazyAuthManager;
  let mockValidateFn: jest.Mock;

  beforeEach(() => {
    authManager = new LazyAuthManager({
      enabled: true,
      ttl: 3600000,
      maxSessions: 100,
      checkInterval: 60000
    });

    mockValidateFn = jest.fn(async (token: string) => {
      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, 10));
      return `user-${token}`;
    });
  });

  afterEach(() => {
    authManager.destroy();
  });

  describe('Session Caching', () => {
    test('should cache validated sessions', async () => {
      const token = 'test-token-1';

      const session1 = await authManager.authenticate(token, mockValidateFn);
      const session2 = await authManager.authenticate(token, mockValidateFn);

      expect(session1).toEqual(session2);
      expect(mockValidateFn).toHaveBeenCalledTimes(1); // Only validated once
    });

    test('should track cache hits and misses', async () => {
      const token1 = 'test-token-1';
      const token2 = 'test-token-2';

      await authManager.authenticate(token1, mockValidateFn); // Miss
      await authManager.authenticate(token1, mockValidateFn); // Hit
      await authManager.authenticate(token2, mockValidateFn); // Miss
      await authManager.authenticate(token2, mockValidateFn); // Hit

      const stats = authManager.getStats();
      expect(stats.cacheHits).toBe(2);
      expect(stats.cacheMisses).toBe(2);
    });

    test('should calculate cache hit rate', async () => {
      const token = 'test-token';

      await authManager.authenticate(token, mockValidateFn); // Miss
      await authManager.authenticate(token, mockValidateFn); // Hit
      await authManager.authenticate(token, mockValidateFn); // Hit
      await authManager.authenticate(token, mockValidateFn); // Hit

      const hitRate = authManager.getCacheHitRate();
      expect(hitRate).toBe(75); // 3 hits out of 4 total
    });
  });

  describe('Session Management', () => {
    test('should create valid sessions', async () => {
      const token = 'test-token';
      const session = await authManager.authenticate(token, mockValidateFn);

      expect(session).toBeDefined();
      expect(session?.token).toBe(token);
      expect(session?.userId).toBe(`user-${token}`);
      expect(session?.validated).toBe(true);
      expect(session?.createdAt).toBeLessThanOrEqual(Date.now());
      expect(session?.expiresAt).toBeGreaterThan(Date.now());
    });

    test('should return null for failed validation', async () => {
      const failValidation = jest.fn(async () => {
        throw new Error('Invalid token');
      });

      const session = await authManager.authenticate('bad-token', failValidation);
      expect(session).toBeNull();
    });

    test('should invalidate specific sessions', async () => {
      const token = 'test-token';

      await authManager.authenticate(token, mockValidateFn);
      const session1 = authManager.getSession(token);
      expect(session1).toBeDefined();

      const invalidated = authManager.invalidate(token);
      expect(invalidated).toBe(true);

      const session2 = authManager.getSession(token);
      expect(session2).toBeNull();
    });

    test('should invalidate all sessions for a user', async () => {
      const userId = 'user-test';

      // Create multiple sessions for same user
      mockValidateFn.mockImplementation(async () => userId);

      await authManager.authenticate('token1', mockValidateFn);
      await authManager.authenticate('token2', mockValidateFn);
      await authManager.authenticate('token3', mockValidateFn);

      const count = authManager.invalidateUser(userId);
      expect(count).toBe(3);

      const session = authManager.getSession('token1');
      expect(session).toBeNull();
    });
  });

  describe('LRU Eviction', () => {
    test('should evict oldest sessions when max reached', async () => {
      const smallManager = new LazyAuthManager({
        enabled: true,
        ttl: 3600000,
        maxSessions: 3,
        checkInterval: 60000
      });

      try {
        // Create 4 sessions, max is 3
        await smallManager.authenticate('token1', mockValidateFn);
        await smallManager.authenticate('token2', mockValidateFn);
        await smallManager.authenticate('token3', mockValidateFn);
        await smallManager.authenticate('token4', mockValidateFn);

        // token1 should be evicted
        const session1 = smallManager.getSession('token1');
        const session4 = smallManager.getSession('token4');

        expect(session1).toBeNull();
        expect(session4).toBeDefined();
      } finally {
        smallManager.destroy();
      }
    });

    test('should update last accessed time', async () => {
      const token = 'test-token';
      await authManager.authenticate(token, mockValidateFn);

      const session1 = authManager.getSession(token);
      const firstAccess = session1?.lastAccessedAt || 0;

      await new Promise(resolve => setTimeout(resolve, 10));

      const session2 = authManager.getSession(token);
      const secondAccess = session2?.lastAccessedAt || 0;

      expect(secondAccess).toBeGreaterThan(firstAccess);
    });
  });

  describe('Lazy Validation', () => {
    test('should avoid duplicate validations', async () => {
      const token = 'test-token';

      // Start multiple authentications simultaneously
      const promises = [
        authManager.authenticate(token, mockValidateFn),
        authManager.authenticate(token, mockValidateFn),
        authManager.authenticate(token, mockValidateFn)
      ];

      await Promise.all(promises);

      // Should only validate once, others wait
      expect(mockValidateFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Session Expiration', () => {
    test('should not return expired sessions', async () => {
      const shortManager = new LazyAuthManager({
        enabled: true,
        ttl: 100, // 100ms TTL
        maxSessions: 100,
        checkInterval: 60000
      });

      try {
        const token = 'test-token';
        await shortManager.authenticate(token, mockValidateFn);

        const session1 = shortManager.getSession(token);
        expect(session1).toBeDefined();

        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 150));

        const session2 = shortManager.getSession(token);
        expect(session2).toBeNull();
      } finally {
        shortManager.destroy();
      }
    });
  });

  describe('Statistics', () => {
    test('should track total validations', async () => {
      await authManager.authenticate('token1', mockValidateFn);
      await authManager.authenticate('token2', mockValidateFn);
      await authManager.authenticate('token3', mockValidateFn);

      const stats = authManager.getStats();
      expect(stats.totalValidations).toBe(3);
    });

    test('should track average validation time', async () => {
      await authManager.authenticate('token1', mockValidateFn);
      await authManager.authenticate('token2', mockValidateFn);

      const stats = authManager.getStats();
      expect(stats.avgValidationTime).toBeGreaterThan(0);
    });

    test('should reset statistics', async () => {
      await authManager.authenticate('token1', mockValidateFn);
      authManager.resetStats();

      const stats = authManager.getStats();
      expect(stats.totalValidations).toBe(0);
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(0);
    });
  });

  describe('Disabled Caching', () => {
    test('should always validate when disabled', async () => {
      const noCache = new LazyAuthManager({ enabled: false });

      try {
        const token = 'test-token';

        await noCache.authenticate(token, mockValidateFn);
        await noCache.authenticate(token, mockValidateFn);
        await noCache.authenticate(token, mockValidateFn);

        expect(mockValidateFn).toHaveBeenCalledTimes(3);
      } finally {
        noCache.destroy();
      }
    });
  });
});

describe('TokenAuth', () => {
  let authManager: LazyAuthManager;
  let tokenAuth: TokenAuth;
  let mockValidateFn: jest.Mock;

  beforeEach(() => {
    authManager = new LazyAuthManager({
      enabled: true,
      ttl: 3600000,
      maxSessions: 100
    });

    mockValidateFn = jest.fn(async (token: string) => `user-${token}`);
    tokenAuth = new TokenAuth(authManager, mockValidateFn);
  });

  afterEach(() => {
    authManager.destroy();
  });

  test('should extract token from Bearer header', async () => {
    const session = await tokenAuth.authenticate('Bearer test-token');

    expect(session).toBeDefined();
    expect(session?.userId).toBe('user-test-token');
  });

  test('should handle raw token', async () => {
    const session = await tokenAuth.authenticate('raw-token');

    expect(session).toBeDefined();
    expect(session?.userId).toBe('user-raw-token');
  });

  test('should return null for empty header', async () => {
    const session = await tokenAuth.authenticate('');
    expect(session).toBeNull();
  });

  test('should invalidate tokens', () => {
    const result = tokenAuth.invalidate('test-token');
    expect(typeof result).toBe('boolean');
  });

  test('should get statistics', async () => {
    await tokenAuth.authenticate('Bearer test-token');
    const stats = tokenAuth.getStats();

    expect(stats.totalValidations).toBeGreaterThan(0);
  });
});

describe('calculateAuthSavings', () => {
  test('should calculate savings correctly', () => {
    const stats = {
      totalValidations: 100,
      cacheHits: 80,
      cacheMisses: 20,
      sessionsActive: 50,
      sessionsCleaned: 10,
      avgValidationTime: 10
    };

    const savings = calculateAuthSavings(stats);

    expect(savings.savingsPercentage).toBe(80); // 80% hit rate
    expect(savings.avgSavedTime).toBe(8); // 10ms * 0.8
    expect(savings.totalSavedTime).toBe(800); // 10ms * 80 hits
  });

  test('should handle zero cache hits', () => {
    const stats = {
      totalValidations: 10,
      cacheHits: 0,
      cacheMisses: 10,
      sessionsActive: 10,
      sessionsCleaned: 0,
      avgValidationTime: 10
    };

    const savings = calculateAuthSavings(stats);

    expect(savings.savingsPercentage).toBe(0);
    expect(savings.avgSavedTime).toBe(0);
    expect(savings.totalSavedTime).toBe(0);
  });
});
