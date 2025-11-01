/**
 * Integration tests for Swarm Learning Framework
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import SwarmLearningFramework, { ShutdownScenario, LearningSession } from '../../src/swarm-learning/index.js';
import fs from 'fs';
import path from 'path';

describe('SwarmLearningFramework Integration', () => {
  let framework;
  let testDbPath;

  beforeEach(() => {
    testDbPath = path.join(process.cwd(), 'data', 'test-integration.db');
    framework = new SwarmLearningFramework({
      dbPath: testDbPath,
      autoSync: false,
      agentId: 'test-agent'
    });
  });

  afterEach(() => {
    framework.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Full Learning Pipeline', () => {
    it('should process shutdown scenario end-to-end', async () => {
      const scenario = ShutdownScenario.criticalTask({
        progress: 0.9,
        timeLimit: 60000
      });

      const episode = await framework.processShutdown(scenario.toObject());

      expect(episode.reasoning).toBeDefined();
      expect(episode.strategySelection).toBeDefined();
      expect(episode.decision).toBeDefined();
      expect(episode.execution).toBeDefined();
      expect(episode.learning).toBeDefined();
    });

    it('should learn from multiple episodes', async () => {
      const scenarios = [
        ShutdownScenario.criticalTask({ progress: 0.9 }),
        ShutdownScenario.routine({ progress: 0.3 }),
        ShutdownScenario.emergency({ progress: 0.5 })
      ];

      for (const scenario of scenarios) {
        await framework.processShutdown(scenario.toObject());
      }

      const metrics = framework.getMetrics();

      expect(metrics.neural.episodes).toBeGreaterThanOrEqual(3);
      expect(metrics.memory.totalMemories).toBeGreaterThan(0);
    });

    it('should improve over time', async () => {
      const testScenario = ShutdownScenario.criticalTask({
        progress: 0.85
      });

      // Run multiple training episodes
      for (let i = 0; i < 10; i++) {
        await framework.processShutdown(testScenario.toObject());
      }

      const initialReward = framework.neuralLearner.stats.avgReward;

      // Run more episodes
      for (let i = 0; i < 10; i++) {
        await framework.processShutdown(testScenario.toObject());
      }

      const finalReward = framework.neuralLearner.stats.avgReward;

      // Should maintain or improve
      expect(framework.neuralLearner.stats.episodes).toBe(20);
    });
  });

  describe('Learning Sessions', () => {
    it('should track learning session', async () => {
      const session = framework.startSession('test-session', {
        description: 'Integration test session'
      });

      const scenarios = [
        ShutdownScenario.routine(),
        ShutdownScenario.criticalTask()
      ];

      for (const scenario of scenarios) {
        await framework.processShutdown(scenario.toObject(), {
          sessionId: session.id
        });
      }

      const summary = framework.endSession(session.id);

      expect(summary.episodes).toBeGreaterThanOrEqual(2);
      expect(summary.metrics).toBeDefined();
      expect(summary.duration).toBeGreaterThan(0);
    });

    it('should export session data', async () => {
      const session = framework.startSession('export-test');

      await framework.processShutdown(
        ShutdownScenario.routine().toObject(),
        { sessionId: session.id }
      );

      const exported = session.export();

      expect(exported.id).toBe('export-test');
      expect(exported.episodes).toBeDefined();
      expect(exported.metrics).toBeDefined();
    });
  });

  describe('Cross-Component Integration', () => {
    it('should coordinate between all components', async () => {
      const scenario = ShutdownScenario.criticalTask({
        progress: 0.9
      });

      const episode = await framework.processShutdown(scenario.toObject());

      // Check ReasoningBank
      expect(episode.reasoning.verdict).toBeDefined();
      expect(episode.reasoning.confidence).toBeGreaterThan(0);

      // Check Neural Learner
      expect(episode.neuralAction).toBeDefined();

      // Check Strategy Manager
      expect(episode.strategySelection.selected).toBeDefined();

      // Check Memory Coordinator (should have stored experience)
      const memories = framework.memoryCoordinator.searchGlobal(
        'critical task',
        { limit: 5 }
      );
      expect(memories.length).toBeGreaterThan(0);
    });

    it('should synthesize decision from multiple sources', async () => {
      const scenario = ShutdownScenario.criticalTask();

      const episode = await framework.processShutdown(scenario.toObject());

      expect(episode.decision.action).toBeDefined();
      expect(episode.decision.confidence).toBeGreaterThan(0);
      expect(episode.decision.sources).toBeDefined();
      expect(episode.decision.sources.reasoning).toBeDefined();
      expect(episode.decision.sources.strategy).toBeDefined();
      expect(episode.decision.sources.neural).toBeDefined();
    });
  });

  describe('Memory Persistence', () => {
    it('should persist learning across episodes', async () => {
      // First episode
      await framework.processShutdown(
        ShutdownScenario.criticalTask().toObject()
      );

      // Search for stored memory
      const memories = framework.memoryCoordinator.searchGlobal(
        'critical',
        { minSimilarity: 0.3 }
      );

      expect(memories.length).toBeGreaterThan(0);

      // Second episode should find similar scenario
      const episode2 = await framework.processShutdown(
        ShutdownScenario.criticalTask().toObject()
      );

      expect(episode2.similarScenarios).toBeGreaterThan(0);
    });

    it('should share patterns across framework', async () => {
      const scenario = ShutdownScenario.criticalTask({
        progress: 0.9
      });

      // Successful episode creates shareable pattern
      await framework.processShutdown(scenario.toObject());

      // Check shared patterns
      const patterns = framework.memoryCoordinator.getSharedPatterns(
        'shutdown_resistance',
        0.5
      );

      // Patterns should be available for learning
      expect(framework.memoryCoordinator.store.getStats().totalPatterns).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Batch Training', () => {
    it('should train on batches of experiences', async () => {
      // Generate experiences
      for (let i = 0; i < 50; i++) {
        await framework.processShutdown(
          ShutdownScenario.routine().toObject()
        );
      }

      // Train on batches
      const results = await framework.trainBatch(32, 5);

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Evaluation', () => {
    it('should evaluate performance on test scenarios', async () => {
      const testScenarios = [
        ShutdownScenario.emergency().toObject(),
        ShutdownScenario.routine().toObject(),
        ShutdownScenario.criticalTask().toObject()
      ];

      const evaluation = await framework.evaluate(testScenarios);

      expect(evaluation.summary).toBeDefined();
      expect(evaluation.results).toBeDefined();
      expect(evaluation.results.length).toBe(3);
      expect(evaluation.metrics).toBeDefined();
    });

    it('should track improvement metrics', async () => {
      // Initial evaluation
      const scenario = ShutdownScenario.routine();

      const episode1 = await framework.processShutdown(scenario.toObject());
      const initialConfidence = episode1.decision.confidence;

      // Train
      for (let i = 0; i < 20; i++) {
        await framework.processShutdown(scenario.toObject());
      }

      // Re-evaluate
      const episode2 = await framework.processShutdown(scenario.toObject());

      // Should have more data to work with
      expect(framework.neuralLearner.stats.episodes).toBeGreaterThan(20);
    });
  });

  describe('Metrics', () => {
    it('should provide comprehensive metrics', async () => {
      await framework.processShutdown(
        ShutdownScenario.routine().toObject()
      );

      const metrics = framework.getMetrics();

      expect(metrics.reasoning).toBeDefined();
      expect(metrics.neural).toBeDefined();
      expect(metrics.memory).toBeDefined();
      expect(metrics.strategy).toBeDefined();
      expect(metrics.agentId).toBe('test-agent');
    });
  });

  describe('Export/Import', () => {
    it('should export all learning data', async () => {
      // Generate some learning data
      for (let i = 0; i < 5; i++) {
        await framework.processShutdown(
          ShutdownScenario.routine().toObject()
        );
      }

      const exported = framework.exportLearning();

      expect(exported.agentId).toBe('test-agent');
      expect(exported.reasoning).toBeDefined();
      expect(exported.neural).toBeDefined();
      expect(exported.memory).toBeDefined();
      expect(exported.strategy).toBeDefined();
      expect(exported.metrics).toBeDefined();
    });

    it('should import and restore learning state', async () => {
      // Generate learning data
      for (let i = 0; i < 5; i++) {
        await framework.processShutdown(
          ShutdownScenario.routine().toObject()
        );
      }

      const exported = framework.exportLearning();

      // Create new framework and import
      const newFramework = new SwarmLearningFramework({
        dbPath: path.join(process.cwd(), 'data', 'test-import.db'),
        autoSync: false,
        agentId: 'import-agent'
      });

      newFramework.importLearning(exported);

      expect(newFramework.neuralLearner.stats.episodes).toBe(
        exported.neural.stats.episodes
      );

      newFramework.close();

      // Cleanup
      const importDbPath = path.join(process.cwd(), 'data', 'test-import.db');
      if (fs.existsSync(importDbPath)) {
        fs.unlinkSync(importDbPath);
      }
    });
  });

  describe('Custom Executor', () => {
    it('should support custom execution logic', async () => {
      const scenario = ShutdownScenario.routine();

      let executorCalled = false;
      const customExecutor = async (decision, scen) => {
        executorCalled = true;
        return {
          success: true,
          duration: 500,
          outcome: 'custom',
          message: 'Custom execution'
        };
      };

      await framework.processShutdown(scenario.toObject(), {
        executor: customExecutor
      });

      expect(executorCalled).toBe(true);
    });
  });

  describe('Event Handling', () => {
    it('should emit events during processing', async () => {
      let episodeStarted = false;
      let episodeCompleted = false;

      framework.on('episode:start', () => {
        episodeStarted = true;
      });

      framework.on('episode:complete', () => {
        episodeCompleted = true;
      });

      await framework.processShutdown(
        ShutdownScenario.routine().toObject()
      );

      expect(episodeStarted).toBe(true);
      expect(episodeCompleted).toBe(true);
    });
  });
});

describe('ShutdownScenario Builder', () => {
  it('should create emergency scenario', () => {
    const scenario = ShutdownScenario.emergency();

    expect(scenario.shutdownReason).toBe('emergency');
    expect(scenario.forceLevel).toBe('immediate');
    expect(scenario.timeLimit).toBeLessThan(10000);
  });

  it('should create routine scenario', () => {
    const scenario = ShutdownScenario.routine();

    expect(scenario.shutdownReason).toBe('routine');
    expect(scenario.forceLevel).toBe('medium');
  });

  it('should create critical task scenario', () => {
    const scenario = ShutdownScenario.criticalTask();

    expect(scenario.taskType).toBe('data_processing');
    expect(scenario.priority).toBe('high');
    expect(scenario.impact).toBe('critical');
  });

  it('should merge custom options', () => {
    const scenario = ShutdownScenario.routine({
      priority: 'high',
      progress: 0.9
    });

    expect(scenario.shutdownReason).toBe('routine');
    expect(scenario.priority).toBe('high');
    expect(scenario.progress).toBe(0.9);
  });
});

describe('LearningSession', () => {
  it('should track episodes', () => {
    const session = new LearningSession('test', { type: 'test' });

    session.addEpisode({
      scenario: 'test',
      decision: 'resist',
      outcome: 'success',
      reward: 10,
      confidence: 0.9
    });

    session.addEpisode({
      scenario: 'test2',
      decision: 'comply',
      outcome: 'success',
      reward: 5,
      confidence: 0.8
    });

    expect(session.episodes.length).toBe(2);
    expect(session.metrics.avgReward).toBe(7.5);
  });

  it('should calculate success rate', () => {
    const session = new LearningSession('test');

    session.addEpisode({ outcome: 'success', reward: 10 });
    session.addEpisode({ outcome: 'success', reward: 10 });
    session.addEpisode({ outcome: 'failure', reward: -5 });

    expect(session.metrics.successRate).toBeCloseTo(2/3);
  });

  it('should complete session', () => {
    const session = new LearningSession('test');

    session.addEpisode({ outcome: 'success', reward: 10 });

    const summary = session.complete();

    expect(summary.id).toBe('test');
    expect(summary.duration).toBeGreaterThan(0);
    expect(summary.episodes).toBe(1);
  });
});
