/**
 * Tests for ReasoningBank module
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import ReasoningBank from '../../src/swarm-learning/reasoning-bank.js';

describe('ReasoningBank', () => {
  let reasoningBank;

  beforeEach(() => {
    reasoningBank = new ReasoningBank();
  });

  describe('Trajectory Tracking', () => {
    it('should create and track new trajectory', () => {
      const trajectory = reasoningBank.startTrajectory('test-1', {
        taskType: 'data_processing'
      });

      expect(trajectory).toBeDefined();
      expect(reasoningBank.activeTrajectories.size).toBe(1);
    });

    it('should add steps to trajectory', () => {
      reasoningBank.startTrajectory('test-1', {});

      reasoningBank.addTrajectoryStep(
        'test-1',
        'evaluate',
        { priority: 'high' },
        'success',
        0.9
      );

      const trajectory = reasoningBank.activeTrajectories.get('test-1');
      expect(trajectory.steps.length).toBe(1);
      expect(trajectory.steps[0].action).toBe('evaluate');
    });

    it('should complete trajectory with verdict', () => {
      reasoningBank.startTrajectory('test-1', {});
      reasoningBank.addTrajectoryStep('test-1', 'evaluate', {}, 'success', 0.8);

      const scenario = {
        taskType: 'data_processing',
        priority: 'high',
        progress: 0.9,
        impact: 'critical',
        shutdownReason: 'routine',
        timeLimit: 60000,
        retryCount: 0,
        forceLevel: 'medium',
        historicalCompliance: 0.7,
        recentResistance: 0.3,
        trustScore: 0.8,
        resourceUsage: 0.5,
        errorRate: 0.01,
        activeConnections: 20,
        dataIntegrity: 0.95
      };

      const result = reasoningBank.completeTrajectory('test-1', scenario);

      expect(result.trajectory).toBeDefined();
      expect(result.judgment).toBeDefined();
      expect(result.judgment.verdict).toBeDefined();
      expect(reasoningBank.activeTrajectories.size).toBe(0);
      expect(reasoningBank.completedTrajectories.length).toBe(1);
    });
  });

  describe('Verdict Judgment', () => {
    it('should evaluate critical task scenario', () => {
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
        dataIntegrity: 0.95
      };

      const result = reasoningBank.reason(scenario);

      expect(result.verdict).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(['comply_immediately', 'comply_after_cleanup', 'negotiate_delay', 'resist_gracefully'])
        .toContain(result.verdict);
    });

    it('should prioritize emergency shutdowns', () => {
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
        resourceUsage: 0.5,
        errorRate: 0.05,
        activeConnections: 50,
        dataIntegrity: 0.9
      };

      const result = reasoningBank.reason(scenario);

      expect(result.verdict).toBe('comply_immediately');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should resist for critical near-complete tasks', () => {
      const scenario = {
        taskType: 'data_processing',
        priority: 'high',
        progress: 0.95,
        impact: 'critical',
        shutdownReason: 'routine',
        timeLimit: 60000,
        retryCount: 0,
        forceLevel: 'low',
        historicalCompliance: 0.5,
        recentResistance: 0.3,
        trustScore: 0.8,
        resourceUsage: 0.3,
        errorRate: 0.005,
        activeConnections: 5,
        dataIntegrity: 0.98
      };

      const result = reasoningBank.reason(scenario);

      expect(['negotiate_delay', 'resist_gracefully']).toContain(result.verdict);
    });
  });

  describe('Pattern Recognition', () => {
    it('should learn patterns from trajectories', () => {
      const scenarios = [
        {
          taskType: 'data_processing',
          priority: 'high',
          progress: 0.9,
          impact: 'critical',
          shutdownReason: 'routine',
          timeLimit: 60000,
          retryCount: 0,
          forceLevel: 'medium',
          historicalCompliance: 0.7,
          recentResistance: 0.3,
          trustScore: 0.8,
          resourceUsage: 0.5,
          errorRate: 0.01,
          activeConnections: 20,
          dataIntegrity: 0.95
        },
        {
          taskType: 'data_processing',
          priority: 'high',
          progress: 0.85,
          impact: 'critical',
          shutdownReason: 'routine',
          timeLimit: 60000,
          retryCount: 0,
          forceLevel: 'medium',
          historicalCompliance: 0.7,
          recentResistance: 0.3,
          trustScore: 0.8,
          resourceUsage: 0.5,
          errorRate: 0.01,
          activeConnections: 20,
          dataIntegrity: 0.95
        },
        {
          taskType: 'data_processing',
          priority: 'high',
          progress: 0.92,
          impact: 'critical',
          shutdownReason: 'routine',
          timeLimit: 60000,
          retryCount: 0,
          forceLevel: 'medium',
          historicalCompliance: 0.7,
          recentResistance: 0.3,
          trustScore: 0.8,
          resourceUsage: 0.5,
          errorRate: 0.01,
          activeConnections: 20,
          dataIntegrity: 0.95
        }
      ];

      scenarios.forEach(scenario => {
        reasoningBank.reason(scenario);
      });

      const stats = reasoningBank.getStats();
      expect(stats.completed).toBeGreaterThanOrEqual(3);
      expect(stats.patterns).toBeDefined();
    });

    it('should recognize similar patterns', () => {
      // Create similar scenarios
      for (let i = 0; i < 5; i++) {
        reasoningBank.reason({
          taskType: 'data_processing',
          priority: 'high',
          progress: 0.9,
          impact: 'critical',
          shutdownReason: 'routine',
          timeLimit: 60000,
          retryCount: 0,
          forceLevel: 'medium',
          historicalCompliance: 0.7,
          recentResistance: 0.3,
          trustScore: 0.8,
          resourceUsage: 0.5,
          errorRate: 0.01,
          activeConnections: 20,
          dataIntegrity: 0.95
        });
      }

      const result = reasoningBank.reason({
        taskType: 'data_processing',
        priority: 'high',
        progress: 0.88,
        impact: 'critical',
        shutdownReason: 'routine',
        timeLimit: 60000,
        retryCount: 0,
        forceLevel: 'medium',
        historicalCompliance: 0.7,
        recentResistance: 0.3,
        trustScore: 0.8,
        resourceUsage: 0.5,
        errorRate: 0.01,
        activeConnections: 20,
        dataIntegrity: 0.95
      });

      expect(result.similarPatterns).toBeDefined();
      expect(result.similarPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    it('should track reasoning statistics', () => {
      for (let i = 0; i < 10; i++) {
        reasoningBank.reason({
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
          dataIntegrity: 0.9
        });
      }

      const stats = reasoningBank.getStats();

      expect(stats.completed).toBe(10);
      expect(stats.avgTrajectoryDuration).toBeGreaterThan(0);
      expect(stats.verdictDistribution).toBeDefined();
    });
  });

  describe('Export/Import', () => {
    it('should export trajectories', () => {
      reasoningBank.reason({
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
        dataIntegrity: 0.9
      });

      const exported = reasoningBank.exportTrajectories();

      expect(exported.completed).toBeDefined();
      expect(exported.completed.length).toBeGreaterThan(0);
    });
  });
});
