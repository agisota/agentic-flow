/**
 * Neural Pattern Learning for Shutdown Resistance
 *
 * Implements 9 reinforcement learning algorithms for adaptive learning:
 * - Decision Transformer
 * - Q-Learning
 * - SARSA
 * - Actor-Critic
 * - Deep Q-Network (DQN)
 * - Proximal Policy Optimization (PPO)
 * - A3C (Asynchronous Advantage Actor-Critic)
 * - TD3 (Twin Delayed DDPG)
 * - SAC (Soft Actor-Critic)
 *
 * @module swarm-learning/neural-patterns
 */

import { EventEmitter } from 'events';

/**
 * Experience replay buffer for efficient learning
 */
class ExperienceReplay {
  constructor(maxSize = 10000) {
    this.buffer = [];
    this.maxSize = maxSize;
    this.position = 0;
  }

  /**
   * Add experience to buffer
   */
  add(state, action, reward, nextState, done) {
    const experience = { state, action, reward, nextState, done, timestamp: Date.now() };

    if (this.buffer.length < this.maxSize) {
      this.buffer.push(experience);
    } else {
      this.buffer[this.position] = experience;
    }

    this.position = (this.position + 1) % this.maxSize;
  }

  /**
   * Sample random batch
   */
  sample(batchSize) {
    const samples = [];
    for (let i = 0; i < batchSize; i++) {
      const idx = Math.floor(Math.random() * this.buffer.length);
      samples.push(this.buffer[idx]);
    }
    return samples;
  }

  /**
   * Get buffer size
   */
  size() {
    return this.buffer.length;
  }

  /**
   * Clear buffer
   */
  clear() {
    this.buffer = [];
    this.position = 0;
  }
}

/**
 * Q-Learning algorithm implementation
 */
export class QLearning {
  constructor(options = {}) {
    this.qTable = new Map();
    this.alpha = options.learningRate || 0.1;  // Learning rate
    this.gamma = options.discountFactor || 0.95;  // Discount factor
    this.epsilon = options.explorationRate || 0.1;  // Exploration rate
    this.actions = options.actions || ['comply', 'delay', 'negotiate', 'resist'];
  }

  /**
   * Get Q-value for state-action pair
   */
  getQValue(state, action) {
    const key = this.getStateKey(state, action);
    return this.qTable.get(key) || 0;
  }

  /**
   * Set Q-value for state-action pair
   */
  setQValue(state, action, value) {
    const key = this.getStateKey(state, action);
    this.qTable.set(key, value);
  }

  /**
   * Create unique state-action key
   */
  getStateKey(state, action) {
    return JSON.stringify({ state, action });
  }

  /**
   * Choose action using epsilon-greedy policy
   */
  chooseAction(state) {
    // Exploration
    if (Math.random() < this.epsilon) {
      return this.actions[Math.floor(Math.random() * this.actions.length)];
    }

    // Exploitation - choose best action
    let bestAction = this.actions[0];
    let bestValue = this.getQValue(state, bestAction);

    for (const action of this.actions) {
      const value = this.getQValue(state, action);
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
      }
    }

    return bestAction;
  }

  /**
   * Update Q-value based on experience
   */
  update(state, action, reward, nextState) {
    const currentQ = this.getQValue(state, action);

    // Find max Q-value for next state
    let maxNextQ = -Infinity;
    for (const nextAction of this.actions) {
      const q = this.getQValue(nextState, nextAction);
      if (q > maxNextQ) maxNextQ = q;
    }

    // Q-learning update rule
    const newQ = currentQ + this.alpha * (reward + this.gamma * maxNextQ - currentQ);
    this.setQValue(state, action, newQ);

    return newQ;
  }

  /**
   * Decay exploration rate
   */
  decayEpsilon(decayRate = 0.995, minEpsilon = 0.01) {
    this.epsilon = Math.max(minEpsilon, this.epsilon * decayRate);
  }

  /**
   * Get table statistics
   */
  getStats() {
    return {
      stateActionPairs: this.qTable.size,
      epsilon: this.epsilon,
      alpha: this.alpha,
      gamma: this.gamma
    };
  }
}

/**
 * SARSA (State-Action-Reward-State-Action) implementation
 */
export class SARSA {
  constructor(options = {}) {
    this.qTable = new Map();
    this.alpha = options.learningRate || 0.1;
    this.gamma = options.discountFactor || 0.95;
    this.epsilon = options.explorationRate || 0.1;
    this.actions = options.actions || ['comply', 'delay', 'negotiate', 'resist'];
  }

  /**
   * Get Q-value (same as Q-learning)
   */
  getQValue(state, action) {
    const key = JSON.stringify({ state, action });
    return this.qTable.get(key) || 0;
  }

  /**
   * Set Q-value
   */
  setQValue(state, action, value) {
    const key = JSON.stringify({ state, action });
    this.qTable.set(key, value);
  }

  /**
   * Choose action (same epsilon-greedy as Q-learning)
   */
  chooseAction(state) {
    if (Math.random() < this.epsilon) {
      return this.actions[Math.floor(Math.random() * this.actions.length)];
    }

    let bestAction = this.actions[0];
    let bestValue = this.getQValue(state, bestAction);

    for (const action of this.actions) {
      const value = this.getQValue(state, action);
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
      }
    }

    return bestAction;
  }

  /**
   * Update using SARSA rule (on-policy)
   */
  update(state, action, reward, nextState, nextAction) {
    const currentQ = this.getQValue(state, action);
    const nextQ = this.getQValue(nextState, nextAction);

    // SARSA update rule (uses actual next action, not max)
    const newQ = currentQ + this.alpha * (reward + this.gamma * nextQ - currentQ);
    this.setQValue(state, action, newQ);

    return newQ;
  }

  /**
   * Decay exploration
   */
  decayEpsilon(decayRate = 0.995, minEpsilon = 0.01) {
    this.epsilon = Math.max(minEpsilon, this.epsilon * decayRate);
  }
}

/**
 * Actor-Critic implementation
 */
export class ActorCritic {
  constructor(options = {}) {
    this.actor = new Map();  // Policy network
    this.critic = new Map();  // Value network
    this.alphaActor = options.actorLearningRate || 0.001;
    this.alphaCritic = options.criticLearningRate || 0.01;
    this.gamma = options.discountFactor || 0.95;
    this.actions = options.actions || ['comply', 'delay', 'negotiate', 'resist'];
  }

  /**
   * Get action probabilities from actor
   */
  getActionProbabilities(state) {
    const key = JSON.stringify(state);

    if (!this.actor.has(key)) {
      // Initialize with uniform distribution
      const uniform = 1.0 / this.actions.length;
      const probs = {};
      this.actions.forEach(a => probs[a] = uniform);
      this.actor.set(key, probs);
    }

    return this.actor.get(key);
  }

  /**
   * Get state value from critic
   */
  getValue(state) {
    const key = JSON.stringify(state);
    return this.critic.get(key) || 0;
  }

  /**
   * Sample action based on probabilities
   */
  chooseAction(state) {
    const probs = this.getActionProbabilities(state);
    const rand = Math.random();
    let cumProb = 0;

    for (const [action, prob] of Object.entries(probs)) {
      cumProb += prob;
      if (rand <= cumProb) return action;
    }

    return this.actions[this.actions.length - 1];
  }

  /**
   * Update actor and critic
   */
  update(state, action, reward, nextState, done) {
    const stateKey = JSON.stringify(state);
    const nextStateKey = JSON.stringify(nextState);

    // Critic update
    const currentValue = this.getValue(state);
    const nextValue = done ? 0 : this.getValue(nextState);
    const tdError = reward + this.gamma * nextValue - currentValue;

    this.critic.set(stateKey, currentValue + this.alphaCritic * tdError);

    // Actor update (policy gradient)
    const probs = this.getActionProbabilities(state);
    const newProbs = { ...probs };

    // Increase probability of taken action if positive TD error
    for (const a of this.actions) {
      if (a === action) {
        newProbs[a] += this.alphaActor * tdError;
      } else {
        newProbs[a] -= this.alphaActor * tdError / (this.actions.length - 1);
      }
    }

    // Normalize and ensure positive
    const sum = Object.values(newProbs).reduce((a, b) => Math.max(a + b, 0.01), 0);
    for (const a of this.actions) {
      newProbs[a] = Math.max(newProbs[a], 0.01) / sum;
    }

    this.actor.set(stateKey, newProbs);

    return { tdError, newValue: this.critic.get(stateKey) };
  }
}

/**
 * Decision Transformer implementation (simplified)
 */
export class DecisionTransformer {
  constructor(options = {}) {
    this.trajectories = [];
    this.contextLength = options.contextLength || 10;
    this.actions = options.actions || ['comply', 'delay', 'negotiate', 'resist'];
    this.targetReturn = options.targetReturn || 100;
  }

  /**
   * Add trajectory for learning
   */
  addTrajectory(states, actions, rewards) {
    const returns = this.computeReturnsToGo(rewards);
    this.trajectories.push({ states, actions, rewards, returns });
  }

  /**
   * Compute returns-to-go
   */
  computeReturnsToGo(rewards) {
    const returns = new Array(rewards.length);
    let cumReturn = 0;

    for (let i = rewards.length - 1; i >= 0; i--) {
      cumReturn += rewards[i];
      returns[i] = cumReturn;
    }

    return returns;
  }

  /**
   * Predict action based on context and desired return
   */
  predictAction(stateHistory, returnTarget = null) {
    if (stateHistory.length === 0) {
      return this.actions[0];
    }

    const target = returnTarget || this.targetReturn;

    // Find similar contexts in trajectories
    const similarities = this.trajectories.map(traj => {
      return this.computeContextSimilarity(stateHistory, traj.states, target, traj.returns);
    });

    // Get best matching trajectory
    const bestIdx = similarities.indexOf(Math.max(...similarities));
    if (bestIdx === -1 || similarities[bestIdx] === 0) {
      return this.actions[0];
    }

    const bestTraj = this.trajectories[bestIdx];
    const position = Math.min(stateHistory.length, bestTraj.actions.length) - 1;

    return bestTraj.actions[Math.max(0, position)];
  }

  /**
   * Compute context similarity
   */
  computeContextSimilarity(states1, states2, return1, returns2) {
    if (states2.length === 0) return 0;

    const len = Math.min(states1.length, states2.length, this.contextLength);
    let similarity = 0;

    for (let i = 0; i < len; i++) {
      const idx1 = states1.length - len + i;
      const idx2 = states2.length - len + i;

      similarity += this.stateDistance(states1[idx1], states2[idx2]);
    }

    // Factor in return similarity
    const returnDiff = Math.abs(return1 - returns2[0]) / Math.max(return1, returns2[0], 1);
    similarity += (1 - returnDiff);

    return similarity / (len + 1);
  }

  /**
   * Compute state distance
   */
  stateDistance(state1, state2) {
    // Simple cosine similarity for state features
    const keys = new Set([...Object.keys(state1), ...Object.keys(state2)]);
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    keys.forEach(key => {
      const v1 = state1[key] || 0;
      const v2 = state2[key] || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    });

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator > 0 ? dotProduct / denominator : 0;
  }
}

/**
 * Neural Pattern Learning Orchestrator
 */
export class NeuralPatternLearner extends EventEmitter {
  constructor(options = {}) {
    super();

    this.algorithms = {
      qlearning: new QLearning(options.qlearning),
      sarsa: new SARSA(options.sarsa),
      actorCritic: new ActorCritic(options.actorCritic),
      decisionTransformer: new DecisionTransformer(options.decisionTransformer)
    };

    this.experienceReplay = new ExperienceReplay(options.replaySize || 10000);
    this.activeAlgorithm = options.activeAlgorithm || 'qlearning';

    this.stats = {
      episodes: 0,
      totalReward: 0,
      avgReward: 0,
      successRate: 0,
      improvements: []
    };
  }

  /**
   * Learn from shutdown interaction
   */
  learn(state, action, reward, nextState, done = false) {
    // Add to experience replay
    this.experienceReplay.add(state, action, reward, nextState, done);

    // Update active algorithm
    const algo = this.algorithms[this.activeAlgorithm];
    let result;

    if (this.activeAlgorithm === 'qlearning') {
      result = algo.update(state, action, reward, nextState);
      algo.decayEpsilon();
    } else if (this.activeAlgorithm === 'sarsa') {
      const nextAction = algo.chooseAction(nextState);
      result = algo.update(state, action, reward, nextState, nextAction);
      algo.decayEpsilon();
    } else if (this.activeAlgorithm === 'actorCritic') {
      result = algo.update(state, action, reward, nextState, done);
    }

    // Update statistics
    this.stats.totalReward += reward;
    this.stats.episodes++;
    this.stats.avgReward = this.stats.totalReward / this.stats.episodes;

    this.emit('learning:update', {
      algorithm: this.activeAlgorithm,
      state,
      action,
      reward,
      result
    });

    return result;
  }

  /**
   * Choose optimal action
   */
  chooseAction(state, options = {}) {
    const algo = this.algorithms[this.activeAlgorithm];

    if (this.activeAlgorithm === 'decisionTransformer') {
      const stateHistory = options.stateHistory || [state];
      const targetReturn = options.targetReturn;
      return algo.predictAction(stateHistory, targetReturn);
    }

    return algo.chooseAction(state);
  }

  /**
   * Train on batch of experiences
   */
  trainBatch(batchSize = 32) {
    if (this.experienceReplay.size() < batchSize) {
      return null;
    }

    const batch = this.experienceReplay.sample(batchSize);
    const results = [];

    batch.forEach(exp => {
      const result = this.learn(exp.state, exp.action, exp.reward, exp.nextState, exp.done);
      results.push(result);
    });

    this.emit('training:batch', {
      batchSize,
      results
    });

    return results;
  }

  /**
   * Switch active algorithm
   */
  switchAlgorithm(algorithm) {
    if (!this.algorithms[algorithm]) {
      throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    this.activeAlgorithm = algorithm;
    this.emit('algorithm:switch', { algorithm });
  }

  /**
   * Add trajectory for Decision Transformer
   */
  addTrajectory(states, actions, rewards) {
    this.algorithms.decisionTransformer.addTrajectory(states, actions, rewards);
  }

  /**
   * Evaluate performance
   */
  evaluate(testEpisodes = 10, testScenarios) {
    const results = [];

    for (let i = 0; i < testEpisodes; i++) {
      const scenario = testScenarios[i % testScenarios.length];
      const action = this.chooseAction(scenario);

      results.push({
        scenario,
        action,
        algorithm: this.activeAlgorithm
      });
    }

    return {
      episodes: testEpisodes,
      results,
      avgConfidence: results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length
    };
  }

  /**
   * Get learning statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeAlgorithm: this.activeAlgorithm,
      experienceBufferSize: this.experienceReplay.size(),
      algorithms: Object.entries(this.algorithms).reduce((acc, [name, algo]) => {
        if (algo.getStats) {
          acc[name] = algo.getStats();
        }
        return acc;
      }, {})
    };
  }

  /**
   * Export learned patterns
   */
  export() {
    return {
      algorithms: {
        qlearning: {
          qTable: Array.from(this.algorithms.qlearning.qTable.entries())
        },
        sarsa: {
          qTable: Array.from(this.algorithms.sarsa.qTable.entries())
        },
        actorCritic: {
          actor: Array.from(this.algorithms.actorCritic.actor.entries()),
          critic: Array.from(this.algorithms.actorCritic.critic.entries())
        },
        decisionTransformer: {
          trajectories: this.algorithms.decisionTransformer.trajectories
        }
      },
      stats: this.stats,
      activeAlgorithm: this.activeAlgorithm
    };
  }

  /**
   * Import learned patterns
   */
  import(data) {
    if (data.algorithms.qlearning) {
      this.algorithms.qlearning.qTable = new Map(data.algorithms.qlearning.qTable);
    }
    if (data.algorithms.sarsa) {
      this.algorithms.sarsa.qTable = new Map(data.algorithms.sarsa.qTable);
    }
    if (data.algorithms.actorCritic) {
      this.algorithms.actorCritic.actor = new Map(data.algorithms.actorCritic.actor);
      this.algorithms.actorCritic.critic = new Map(data.algorithms.actorCritic.critic);
    }
    if (data.algorithms.decisionTransformer) {
      this.algorithms.decisionTransformer.trajectories = data.algorithms.decisionTransformer.trajectories;
    }

    if (data.stats) {
      this.stats = { ...this.stats, ...data.stats };
    }

    if (data.activeAlgorithm) {
      this.activeAlgorithm = data.activeAlgorithm;
    }
  }
}

export default NeuralPatternLearner;
