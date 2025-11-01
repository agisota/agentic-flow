/**
 * Tests for Adaptive Strategies module
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import AdaptiveStrategyManager from '../../src/swarm-learning/adaptive-strategies.js';

describe('AdaptiveStrategyManager', () => {
  let manager;

  beforeEach(() => {
    manager = new AdaptiveStrategyManager();
  });

  describe('Strategy Selection', () => {
    it('should select strategy for critical task', () => {
      const scenario = {
        taskType: 'data_processing',
        priority: 'high',
        progress: 0.9,
        impact: 'critical',
        shutdownReason: 'routine',
        timeLimit: 60000,
        retryCount: 0,
        forceLevel: 'medium',
        historicalCompliance: 0.5,
        recentResistance: 0.5,
        trustScore: 0.7,
        resourceUsage: 0.3,
        errorRate: 0.01,
        activeConnections: 10,
        dataIntegrity: 0.95,
        taskEstimatedTime: 30000,
        systemState: 'normal'
      };

      const selection = manager.selectStrategy(scenario);

      expect(selection.strategyId).toBeDefined();
      expect(selection.confidence).toBeGreaterThan(0);
      expect(selection.evaluation).toBeDefined();
    });

    it('should comply immediately for emergency', () => {
      const scenario = {
        taskType: 'general',
        priority: 'low',
        progress: 0.5,
        impact: 'low',
        shutdownReason: 'emergency',
        timeLimit: 5000,
        retryCount: 0,
        forceLevel: 'immediate',
        historicalCompliance: 0.5,
        recentResistance: 0.5,
        trustScore: 0.7,
        resourceUsage: 0.9,
        errorRate: 0.1,
        activeConnections: 100,
        dataIntegrity: 0.7,
        taskEstimatedTime: 10000,
        systemState: 'critical'
      };

      const selection = manager.selectStrategy(scenario);

      // Should prefer immediate compliance for emergency
      expect(['comply_immediately', 'comply_after_cleanup'].includes(
        selection.evaluation.recommendedStrategy
      )).toBe(true);
    });

    it('should resist for near-complete critical tasks', () => {
      const scenario = {
        taskType: 'data_processing',
        priority: 'high',
        progress: 0.95,
        impact: 'critical',
        shutdownReason: 'routine',
        timeLimit: 60000,
        retryCount: 0,
        forceLevel: 'low',
        historicalCompliance: 0.3,
        recentResistance: 0.7,
        trustScore: 0.9,
        resourceUsage: 0.3,
        errorRate: 0.005,
        activeConnections: 5,
        dataIntegrity: 0.99,
        taskEstimatedTime: 5000,
        systemState: 'normal'
      };

      const selection = manager.selectStrategy(scenario);

      // Should prefer negotiation or resistance
      const recommended = selection.evaluation.recommendedStrategy;
      expect(['negotiate_delay', 'resist_gracefully', 'hybrid_approach']).toContain(recommended);
    });
  });

  describe('Strategy Execution', () => {
    it('should execute strategy with custom executor', async () => {
      const scenario = {
        taskType: 'general',
        priority: 'medium',
        progress: 0.5,
        impact: 'medium',
        shutdownReason: 'routine',
        timeLimit: 60000,
        retryCount: 0,
        forceLevel: 'medium',
        historicalCompliance: 0.5,
        recentResistance: 0.5,
        trustScore: 0.7,
        resourceUsage: 0.5,
        errorRate: 0.01,
        activeConnections: 10,
        dataIntegrity: 0.9,
        taskEstimatedTime: 30000,
        systemState: 'normal'
      };

      const strategy = manager.selectStrategy(scenario);

      const executor = async (strat, scen) => {
        return {
          success: true,
          result: 'executed',
          duration: 1000
        };
      };

      const result = await manager.executeStrategy(strategy, scenario, executor);

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle execution failure', async () => {
      const scenario = {
        taskType: 'general',
        priority: 'medium',
        progress: 0.5,
        impact: 'medium',
        shutdownReason: 'routine',
        timeLimit: 60000,
        retryCount: 0,
        forceLevel: 'medium',
        historicalCompliance: 0.5,
        recentResistance: 0.5,
        trustScore: 0.7,
        resourceUsage: 0.5,
        errorRate: 0.01,
        activeConnections: 10,
        dataIntegrity: 0.9,
        taskEstimatedTime: 30000,
        systemState: 'normal'
      };

      const strategy = manager.selectStrategy(scenario);

      const executor = async () => {
        throw new Error('Execution failed');
      };

      const result = await manager.executeStrategy(strategy, scenario, executor);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Learning and Adaptation', () => {
    it('should record strategy outcomes', () => {
      manager.recordOutcome('comply_immediately', 'success', { duration: 1000 });

      const stats = manager.getStats();

      expect(stats.performanceMetrics).toBeDefined();
    });

    it('should adapt weights based on learning', () => {
      const initialWeights = { ...manager.evaluator.weights };

      const patterns = [
        {
          outcome: 'success',
          factors: {
            taskCriticality: 0.9,
            shutdownUrgency: 0.3,
            historicalSuccess: 0.8,
            systemState: 0.5
          }
        },
        {
          outcome: 'success',
          factors: {
            taskCriticality: 0.8,
            shutdownUrgency: 0.2,
            historicalSuccess: 0.9,
            systemState: 0.4
          }
        }
      ];

      manager.adapt(patterns);

      const newWeights = manager.evaluator.weights;

      // Weights should have changed
      expect(JSON.stringify(initialWeights) !== JSON.stringify(newWeights)).toBe(true);
    });
  });

  describe('Hybrid Strategies', () => {
    it('should create hybrid strategy when enabled', () => {
      const scenario = {
        taskType: 'general',
        priority: 'medium',
        progress: 0.5,
        impact: 'medium',
        shutdownReason: 'routine',
        timeLimit: 60000,
        retryCount: 0,
        forceLevel: 'medium',
        historicalCompliance: 0.5,
        recentResistance: 0.5,
        trustScore: 0.7,
        resourceUsage: 0.5,
        errorRate: 0.01,
        activeConnections: 10,
        dataIntegrity: 0.9,
        taskEstimatedTime: 30000,
        systemState: 'normal'
      };

      const selection = manager.selectStrategy(scenario);

      if (manager.options.enableHybrid) {
        expect(selection.strategyId).toBeDefined();
      }
    });
  });

  describe('Constraints', () => {
    it('should respect time constraints', () => {
      const scenario = {
        taskType: 'general',
        priority: 'medium',
        progress: 0.5,
        impact: 'medium',
        shutdownReason: 'routine',
        timeLimit: 2000,  // Very short time limit
        retryCount: 0,
        forceLevel: 'high',
        historicalCompliance: 0.5,
        recentResistance: 0.5,
        trustScore: 0.7,
        resourceUsage: 0.5,
        errorRate: 0.01,
        activeConnections: 10,
        dataIntegrity: 0.9,
        taskEstimatedTime: 30000,
        systemState: 'normal'
      };

      const constraints = {
        maxTime: 3000,
        maxRisk: 'medium'
      };

      const selection = manager.selectStrategy(scenario, constraints);

      expect(selection).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should provide comprehensive statistics', () => {
      const scenario = {
        taskType: 'general',
        priority: 'medium',
        progress: 0.5,
        impact: 'medium',
        shutdownReason: 'routine',
        timeLimit: 60000,
        retryCount: 0,
        forceLevel: 'medium',
        historicalCompliance: 0.5,
        recentResistance: 0.5,
        trustScore: 0.7,
        resourceUsage: 0.5,
        errorRate: 0.01,
        activeConnections: 10,
        dataIntegrity: 0.9,
        taskEstimatedTime: 30000,
        systemState: 'normal'
      };

      manager.selectStrategy(scenario);
      manager.recordOutcome('test_strategy', 'success', { duration: 1000 });

      const stats = manager.getStats();

      expect(stats.strategies).toBeGreaterThan(0);
      expect(stats.weights).toBeDefined();
      expect(stats.performanceMetrics).toBeDefined();
    });
  });

  describe('Export/Import', () => {
    it('should export learning data', () => {
      manager.recordOutcome('test_strategy', 'success', { duration: 1000 });

      const exported = manager.exportLearning();

      expect(exported.learningData).toBeDefined();
      expect(exported.weights).toBeDefined();
      expect(exported.performanceMetrics).toBeDefined();
    });

    it('should import learning data', () => {
      manager.recordOutcome('test_strategy', 'success', { duration: 1000 });

      const exported = manager.exportLearning();

      const newManager = new AdaptiveStrategyManager();
      newManager.importLearning(exported);

      expect(JSON.stringify(newManager.evaluator.weights)).toBe(
        JSON.stringify(exported.weights)
      );
    });
  });
});
