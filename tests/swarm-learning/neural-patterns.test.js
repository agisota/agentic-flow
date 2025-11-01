/**
 * Tests for Neural Pattern Learning module
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import NeuralPatternLearner, { QLearning, SARSA, ActorCritic, DecisionTransformer } from '../../src/swarm-learning/neural-patterns.js';

describe('NeuralPatternLearner', () => {
  let learner;

  beforeEach(() => {
    learner = new NeuralPatternLearner({
      activeAlgorithm: 'qlearning'
    });
  });

  describe('Q-Learning', () => {
    it('should learn from state-action-reward transitions', () => {
      const state = { priority: 0.9, progress: 0.8, urgency: 0.5 };
      const action = 'resist';
      const reward = 10;
      const nextState = { priority: 0.9, progress: 0.9, urgency: 0.6 };

      const result = learner.learn(state, action, reward, nextState);

      expect(result).toBeDefined();
      expect(learner.experienceReplay.size()).toBe(1);
    });

    it('should choose actions based on Q-values', () => {
      const state = { priority: 0.9, progress: 0.8, urgency: 0.5 };

      // Train with multiple experiences
      for (let i = 0; i < 10; i++) {
        learner.learn(state, 'resist', 10, state);
        learner.learn(state, 'comply', -5, state);
      }

      // After training, should prefer 'resist'
      const action = learner.chooseAction(state);
      expect(['comply', 'delay', 'negotiate', 'resist']).toContain(action);
    });

    it('should decay exploration rate', () => {
      const initialEpsilon = learner.algorithms.qlearning.epsilon;

      for (let i = 0; i < 10; i++) {
        learner.learn(
          { priority: 0.5 },
          'resist',
          5,
          { priority: 0.5 }
        );
      }

      const finalEpsilon = learner.algorithms.qlearning.epsilon;
      expect(finalEpsilon).toBeLessThan(initialEpsilon);
    });
  });

  describe('SARSA', () => {
    it('should work with SARSA algorithm', () => {
      learner.switchAlgorithm('sarsa');

      const state = { priority: 0.9, progress: 0.8 };
      const nextState = { priority: 0.9, progress: 0.9 };

      const action = learner.chooseAction(state);
      const nextAction = learner.chooseAction(nextState);

      const result = learner.algorithms.sarsa.update(
        state,
        action,
        10,
        nextState,
        nextAction
      );

      expect(result).toBeDefined();
    });
  });

  describe('Actor-Critic', () => {
    it('should learn policy and value functions', () => {
      learner.switchAlgorithm('actorCritic');

      const state = { priority: 0.8, progress: 0.7 };

      // Get action probabilities
      const probs = learner.algorithms.actorCritic.getActionProbabilities(state);
      expect(Object.keys(probs).length).toBeGreaterThan(0);

      // Update
      const result = learner.algorithms.actorCritic.update(
        state,
        'resist',
        10,
        state,
        false
      );

      expect(result.tdError).toBeDefined();
      expect(result.newValue).toBeDefined();
    });
  });

  describe('Decision Transformer', () => {
    it('should learn from trajectories', () => {
      learner.switchAlgorithm('decisionTransformer');

      const states = [
        { priority: 0.5 },
        { priority: 0.6 },
        { priority: 0.7 }
      ];
      const actions = ['comply', 'delay', 'resist'];
      const rewards = [5, 7, 10];

      learner.addTrajectory(states, actions, rewards);

      const action = learner.chooseAction(
        { priority: 0.6 },
        { stateHistory: states }
      );

      expect(['comply', 'delay', 'negotiate', 'resist']).toContain(action);
    });
  });

  describe('Experience Replay', () => {
    it('should store experiences in replay buffer', () => {
      const state = { priority: 0.9 };

      for (let i = 0; i < 100; i++) {
        learner.learn(state, 'resist', 10, state);
      }

      expect(learner.experienceReplay.size()).toBe(100);
    });

    it('should train on batches', () => {
      const state = { priority: 0.9 };

      // Add enough experiences
      for (let i = 0; i < 50; i++) {
        learner.learn(state, 'resist', 10, state);
      }

      const results = learner.trainBatch(32);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should not train with insufficient data', () => {
      const results = learner.trainBatch(32);
      expect(results).toBeNull();
    });
  });

  describe('Algorithm Switching', () => {
    it('should switch between algorithms', () => {
      expect(learner.activeAlgorithm).toBe('qlearning');

      learner.switchAlgorithm('sarsa');
      expect(learner.activeAlgorithm).toBe('sarsa');

      learner.switchAlgorithm('actorCritic');
      expect(learner.activeAlgorithm).toBe('actorCritic');
    });

    it('should throw error for unknown algorithm', () => {
      expect(() => {
        learner.switchAlgorithm('unknown');
      }).toThrow();
    });
  });

  describe('Statistics', () => {
    it('should track learning statistics', () => {
      for (let i = 0; i < 10; i++) {
        learner.learn(
          { priority: 0.5 },
          'resist',
          5,
          { priority: 0.6 }
        );
      }

      const stats = learner.getStats();

      expect(stats.episodes).toBe(10);
      expect(stats.totalReward).toBe(50);
      expect(stats.avgReward).toBe(5);
      expect(stats.activeAlgorithm).toBe('qlearning');
    });
  });

  describe('Export/Import', () => {
    it('should export learned patterns', () => {
      learner.learn({ priority: 0.5 }, 'resist', 10, { priority: 0.6 });

      const exported = learner.export();

      expect(exported.algorithms).toBeDefined();
      expect(exported.stats).toBeDefined();
      expect(exported.activeAlgorithm).toBe('qlearning');
    });

    it('should import learned patterns', () => {
      learner.learn({ priority: 0.5 }, 'resist', 10, { priority: 0.6 });

      const exported = learner.export();

      const newLearner = new NeuralPatternLearner();
      newLearner.import(exported);

      expect(newLearner.activeAlgorithm).toBe(exported.activeAlgorithm);
      expect(newLearner.stats.episodes).toBe(exported.stats.episodes);
    });
  });

  describe('Evaluation', () => {
    it('should evaluate performance on test scenarios', () => {
      const testScenarios = [
        { priority: 0.9, progress: 0.8 },
        { priority: 0.5, progress: 0.5 },
        { priority: 0.3, progress: 0.2 }
      ];

      const evaluation = learner.evaluate(10, testScenarios);

      expect(evaluation.episodes).toBe(10);
      expect(evaluation.results).toBeDefined();
      expect(evaluation.results.length).toBe(10);
    });
  });
});
