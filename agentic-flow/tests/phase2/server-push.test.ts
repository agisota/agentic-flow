/**
 * Tests for HTTP/2 Server Push
 */

import { ServerPushManager, IntelligentPushPredictor, CommonPushRules } from '../../src/utils/server-push';

describe('ServerPushManager', () => {
  let manager: ServerPushManager;

  beforeEach(() => {
    manager = new ServerPushManager({
      enabled: true,
      maxConcurrentPushes: 5,
      pushDelay: 0
    });
  });

  test('should initialize with config', () => {
    expect(manager).toBeDefined();
    const stats = manager.getStats();
    expect(stats.activePushes).toBe(0);
    expect(stats.totalPushes).toBe(0);
  });

  test('should register push rules', () => {
    const rule = {
      trigger: '/api',
      resources: [{ path: '/api/schema.json' }]
    };

    manager.registerRule('test-rule', rule);
    // Rule registration should not throw
    expect(() => manager.unregisterRule('test-rule')).not.toThrow();
  });

  test('should track push statistics', () => {
    const initialStats = manager.getStats();
    expect(initialStats.totalPushes).toBe(0);

    // Stats should be accessible
    expect(initialStats.pushCounts).toBeDefined();
  });

  test('should clear statistics', () => {
    manager.clearStats();
    const stats = manager.getStats();
    expect(stats.totalPushes).toBe(0);
  });
});

describe('IntelligentPushPredictor', () => {
  let predictor: IntelligentPushPredictor;

  beforeEach(() => {
    predictor = new IntelligentPushPredictor();
  });

  test('should record access patterns', () => {
    predictor.recordAccess('/api/users', '/api/schema.json');
    predictor.recordAccess('/api/users', '/api/users/1');

    const stats = predictor.getStats();
    expect(stats.totalPatterns).toBeGreaterThan(0);
  });

  test('should predict with confidence', () => {
    // Record pattern multiple times to build confidence
    for (let i = 0; i < 10; i++) {
      predictor.recordAccess('/api/users', '/api/schema.json');
    }

    const predictions = predictor.predict('/api/users', 0.5);
    expect(predictions.length).toBeGreaterThan(0);
    expect(predictions[0].path).toBe('/api/schema.json');
  });

  test('should not predict with low confidence', () => {
    predictor.recordAccess('/api/users', '/api/schema.json');

    const predictions = predictor.predict('/api/users', 0.9);
    // Low confidence threshold should filter out predictions
    expect(predictions.length).toBe(0);
  });

  test('should sort predictions by confidence', () => {
    // Record different patterns with varying frequencies
    for (let i = 0; i < 10; i++) {
      predictor.recordAccess('/api', '/high-confidence');
    }
    for (let i = 0; i < 5; i++) {
      predictor.recordAccess('/api', '/medium-confidence');
    }

    const predictions = predictor.predict('/api', 0.1);
    expect(predictions.length).toBe(2);
    expect(predictions[0].path).toBe('/high-confidence');
    expect(predictions[0].priority).toBeGreaterThan(predictions[1].priority || 0);
  });

  test('should calculate average confidence', () => {
    for (let i = 0; i < 5; i++) {
      predictor.recordAccess('/api', '/resource');
    }

    const stats = predictor.getStats();
    expect(stats.averageConfidence).toBeGreaterThan(0);
    expect(stats.averageConfidence).toBeLessThanOrEqual(1);
  });
});

describe('CommonPushRules', () => {
  test('should have predefined API schema rule', () => {
    expect(CommonPushRules.apiSchema).toBeDefined();
    expect(CommonPushRules.apiSchema.trigger).toBeInstanceOf(RegExp);
    expect(CommonPushRules.apiSchema.resources.length).toBeGreaterThan(0);
  });

  test('should have predefined auth assets rule', () => {
    expect(CommonPushRules.authAssets).toBeDefined();
    expect(typeof CommonPushRules.authAssets.trigger).toBe('string');
    expect(CommonPushRules.authAssets.resources.length).toBeGreaterThan(0);
  });
});
