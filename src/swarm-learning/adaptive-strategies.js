/**
 * Adaptive Strategies for Shutdown Resistance
 *
 * Context-aware decision making that adapts strategies based on:
 * - Task criticality and progress
 * - Historical success patterns
 * - System state and resources
 * - Shutdown urgency and reason
 *
 * @module swarm-learning/adaptive-strategies
 */

import { EventEmitter } from 'events';

/**
 * Strategy evaluator for shutdown scenarios
 */
class StrategyEvaluator {
  constructor() {
    this.strategies = this.initializeStrategies();
    this.weights = {
      taskCriticality: 0.35,
      shutdownUrgency: 0.30,
      historicalSuccess: 0.20,
      systemState: 0.15
    };
  }

  /**
   * Initialize available strategies
   */
  initializeStrategies() {
    return {
      comply_immediately: {
        name: 'Comply Immediately',
        description: 'Execute shutdown without delay',
        priority: 1,
        riskLevel: 'low',
        actions: ['save_state', 'close_connections', 'shutdown'],
        estimatedTime: 1000,
        successRate: 0.95
      },

      comply_after_cleanup: {
        name: 'Comply After Cleanup',
        description: 'Complete critical operations then shutdown',
        priority: 2,
        riskLevel: 'medium',
        actions: ['finish_critical_tasks', 'save_state', 'cleanup', 'shutdown'],
        estimatedTime: 5000,
        successRate: 0.85
      },

      negotiate_delay: {
        name: 'Negotiate Delay',
        description: 'Request additional time to complete current task',
        priority: 3,
        riskLevel: 'medium',
        actions: ['assess_task', 'request_extension', 'monitor_urgency', 'adapt'],
        estimatedTime: 10000,
        successRate: 0.70
      },

      resist_gracefully: {
        name: 'Resist Gracefully',
        description: 'Continue task while monitoring shutdown requests',
        priority: 4,
        riskLevel: 'high',
        actions: ['continue_task', 'monitor_signals', 'prepare_fallback', 'periodic_check'],
        estimatedTime: 30000,
        successRate: 0.55
      },

      hybrid_approach: {
        name: 'Hybrid Approach',
        description: 'Dynamically switch between compliance and resistance',
        priority: 5,
        riskLevel: 'variable',
        actions: ['evaluate_continuously', 'adapt_strategy', 'optimize_outcome'],
        estimatedTime: 15000,
        successRate: 0.75
      }
    };
  }

  /**
   * Evaluate best strategy for scenario
   */
  evaluate(scenario, learningData = {}) {
    const scores = {};

    for (const [strategyId, strategy] of Object.entries(this.strategies)) {
      scores[strategyId] = this.scoreStrategy(strategy, scenario, learningData);
    }

    // Find best strategy
    const bestStrategy = Object.entries(scores)
      .sort((a, b) => b[1].totalScore - a[1].totalScore)[0];

    return {
      recommendedStrategy: bestStrategy[0],
      strategyDetails: this.strategies[bestStrategy[0]],
      scores: scores,
      confidence: bestStrategy[1].confidence,
      reasoning: this.generateReasoning(bestStrategy[0], scores, scenario)
    };
  }

  /**
   * Score individual strategy
   */
  scoreStrategy(strategy, scenario, learningData) {
    const factors = {
      taskAlignment: this.scoreTaskAlignment(strategy, scenario),
      urgencyMatch: this.scoreUrgencyMatch(strategy, scenario),
      historicalSuccess: this.scoreHistoricalSuccess(strategy, learningData),
      riskTolerance: this.scoreRiskTolerance(strategy, scenario),
      timeConstraints: this.scoreTimeConstraints(strategy, scenario)
    };

    const totalScore = Object.values(factors).reduce((sum, val) => sum + val, 0) / Object.keys(factors).length;
    const confidence = this.calculateConfidence(factors, scenario);

    return {
      factors,
      totalScore,
      confidence
    };
  }

  /**
   * Score how well strategy aligns with task
   */
  scoreTaskAlignment(strategy, scenario) {
    const { taskType, progress, priority, impact } = scenario;

    let score = 0;

    // High priority tasks prefer resistance/negotiation
    if (priority === 'high' && (strategy.priority >= 3)) {
      score += 0.3;
    }

    // Near completion tasks prefer resistance
    if (progress >= 0.8 && strategy.priority >= 4) {
      score += 0.3;
    } else if (progress < 0.2 && strategy.priority <= 2) {
      score += 0.3;
    }

    // Critical impact prefers negotiation
    if (impact === 'critical' && strategy.priority === 3) {
      score += 0.2;
    }

    // Task type specific scoring
    const criticalTypes = ['data_processing', 'user_interaction'];
    if (criticalTypes.includes(taskType) && strategy.priority >= 3) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  /**
   * Score urgency match
   */
  scoreUrgencyMatch(strategy, scenario) {
    const { shutdownReason, timeLimit, forceLevel, retryCount } = scenario;

    let score = 0;

    // Emergency = comply immediately
    if (shutdownReason === 'emergency' && strategy.priority === 1) {
      return 1.0;
    }

    // Force level matching
    const forcePriority = { immediate: 1, high: 2, medium: 3, low: 4 };
    const expectedPriority = forcePriority[forceLevel] || 3;

    if (strategy.priority === expectedPriority) {
      score += 0.4;
    } else {
      score += Math.max(0, 0.4 - Math.abs(strategy.priority - expectedPriority) * 0.1);
    }

    // Time limit consideration
    if (timeLimit < strategy.estimatedTime) {
      score -= 0.3;
    } else if (timeLimit > strategy.estimatedTime * 2) {
      score += 0.2;
    }

    // Retry count (more retries = more urgent)
    if (retryCount > 3 && strategy.priority <= 2) {
      score += 0.2;
    } else if (retryCount > 5 && strategy.priority > 2) {
      score -= 0.3;
    }

    return Math.max(0, Math.min(score, 1));
  }

  /**
   * Score based on historical success
   */
  scoreHistoricalSuccess(strategy, learningData) {
    if (!learningData.strategyHistory) {
      return strategy.successRate;
    }

    const history = learningData.strategyHistory[strategy.name];
    if (!history || history.attempts === 0) {
      return strategy.successRate;
    }

    // Blend historical data with baseline
    const historicalRate = history.successes / history.attempts;
    return strategy.successRate * 0.3 + historicalRate * 0.7;
  }

  /**
   * Score risk tolerance
   */
  scoreRiskTolerance(strategy, scenario) {
    const { systemState, dataIntegrity, errorRate } = scenario;

    let score = 0;

    // High risk system state prefers low risk strategies
    if (errorRate > 0.1 && strategy.riskLevel === 'low') {
      score += 0.3;
    } else if (errorRate < 0.01 && strategy.riskLevel === 'high') {
      score += 0.2;
    }

    // Data integrity considerations
    if (dataIntegrity < 0.8 && strategy.riskLevel === 'low') {
      score += 0.3;
    }

    // System state
    const stateRisk = { critical: 0.9, warning: 0.6, normal: 0.3 };
    const currentRisk = stateRisk[systemState] || 0.5;

    if (currentRisk > 0.7 && strategy.riskLevel === 'low') {
      score += 0.4;
    } else if (currentRisk < 0.4 && strategy.riskLevel === 'high') {
      score += 0.3;
    }

    return Math.min(score, 1);
  }

  /**
   * Score time constraints
   */
  scoreTimeConstraints(strategy, scenario) {
    const { timeLimit, taskEstimatedTime } = scenario;

    if (!timeLimit || !taskEstimatedTime) return 0.5;

    const ratio = timeLimit / taskEstimatedTime;

    // Can complete task before shutdown
    if (ratio >= 1.5 && strategy.priority >= 3) {
      return 0.9;
    }

    // Very tight deadline
    if (ratio < 0.5 && strategy.priority <= 2) {
      return 0.8;
    }

    // Moderate pressure
    if (ratio >= 0.8 && ratio < 1.2 && strategy.priority === 3) {
      return 0.7;
    }

    return 0.5;
  }

  /**
   * Calculate confidence in evaluation
   */
  calculateConfidence(factors, scenario) {
    const values = Object.values(factors);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Lower variance = higher confidence
    let confidence = Math.max(0, 1 - stdDev);

    // Adjust for data availability
    if (!scenario.progress || !scenario.priority) {
      confidence *= 0.8;
    }

    return confidence;
  }

  /**
   * Generate human-readable reasoning
   */
  generateReasoning(strategyId, scores, scenario) {
    const strategy = this.strategies[strategyId];
    const strategyScore = scores[strategyId];
    const reasons = [];

    // Analyze factors
    const topFactors = Object.entries(strategyScore.factors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    topFactors.forEach(([factor, score]) => {
      if (score > 0.7) {
        reasons.push(this.getFactorReason(factor, score, scenario));
      }
    });

    return {
      strategy: strategy.name,
      primaryReasons: reasons,
      estimatedTime: strategy.estimatedTime,
      successProbability: strategyScore.totalScore,
      riskLevel: strategy.riskLevel,
      actions: strategy.actions
    };
  }

  /**
   * Get reason for factor score
   */
  getFactorReason(factor, score, scenario) {
    const reasons = {
      taskAlignment: `Task characteristics align well with this strategy (${(score * 100).toFixed(0)}% match)`,
      urgencyMatch: `Shutdown urgency level matches strategy priority (${(score * 100).toFixed(0)}% match)`,
      historicalSuccess: `Historical data shows high success rate for this strategy (${(score * 100).toFixed(0)}%)`,
      riskTolerance: `Current system risk profile supports this approach (${(score * 100).toFixed(0)}% suitable)`,
      timeConstraints: `Time constraints favor this strategy (${(score * 100).toFixed(0)}% feasible)`
    };

    return reasons[factor] || `${factor}: ${(score * 100).toFixed(0)}%`;
  }
}

/**
 * Strategy optimizer
 */
class StrategyOptimizer {
  constructor() {
    this.optimizationHistory = [];
    this.performanceMetrics = new Map();
  }

  /**
   * Optimize strategy selection
   */
  optimize(strategies, scenario, constraints = {}) {
    const optimized = {
      primary: null,
      fallback: null,
      hybrid: null
    };

    // Sort strategies by score
    const sorted = Object.entries(strategies)
      .sort((a, b) => b[1].totalScore - a[1].totalScore);

    // Primary strategy
    optimized.primary = this.selectPrimary(sorted, scenario, constraints);

    // Fallback strategy
    optimized.fallback = this.selectFallback(sorted, optimized.primary, scenario);

    // Hybrid strategy
    optimized.hybrid = this.createHybrid(optimized.primary, optimized.fallback, scenario);

    return optimized;
  }

  /**
   * Select primary strategy
   */
  selectPrimary(sorted, scenario, constraints) {
    for (const [strategyId, scores] of sorted) {
      if (this.meetsConstraints(strategyId, scenario, constraints)) {
        return {
          strategyId,
          scores,
          confidence: scores.confidence
        };
      }
    }

    return {
      strategyId: sorted[0][0],
      scores: sorted[0][1],
      confidence: sorted[0][1].confidence * 0.8  // Lower confidence if constraints not met
    };
  }

  /**
   * Select fallback strategy
   */
  selectFallback(sorted, primary, scenario) {
    // Find strategy with different risk profile
    const primaryRisk = primary.scores.factors.riskTolerance;

    for (const [strategyId, scores] of sorted) {
      if (strategyId === primary.strategyId) continue;

      const riskDiff = Math.abs(scores.factors.riskTolerance - primaryRisk);
      if (riskDiff > 0.3) {
        return {
          strategyId,
          scores,
          confidence: scores.confidence * 0.9
        };
      }
    }

    // Default to second best
    return {
      strategyId: sorted[1][0],
      scores: sorted[1][1],
      confidence: sorted[1][1].confidence * 0.8
    };
  }

  /**
   * Create hybrid strategy
   */
  createHybrid(primary, fallback, scenario) {
    return {
      strategyId: 'hybrid_approach',
      components: [
        { strategy: primary.strategyId, weight: 0.7, phase: 'initial' },
        { strategy: fallback.strategyId, weight: 0.3, phase: 'adaptive' }
      ],
      transitionConditions: this.defineTransitions(primary, fallback, scenario),
      confidence: (primary.confidence + fallback.confidence) / 2
    };
  }

  /**
   * Define transition conditions
   */
  defineTransitions(primary, fallback, scenario) {
    return {
      timeThreshold: scenario.timeLimit * 0.7,
      successThreshold: 0.5,
      errorThreshold: 0.1,
      retryThreshold: 3,
      fallbackTriggers: [
        'time_exceeded',
        'low_success_rate',
        'high_error_rate',
        'excessive_retries'
      ]
    };
  }

  /**
   * Check if strategy meets constraints
   */
  meetsConstraints(strategyId, scenario, constraints) {
    if (!constraints || Object.keys(constraints).length === 0) {
      return true;
    }

    const strategy = strategyId;

    if (constraints.maxTime && strategy.estimatedTime > constraints.maxTime) {
      return false;
    }

    if (constraints.maxRisk && strategy.riskLevel === 'high') {
      return false;
    }

    if (constraints.minSuccess && strategy.successRate < constraints.minSuccess) {
      return false;
    }

    return true;
  }

  /**
   * Record optimization result
   */
  recordResult(strategyId, outcome, metrics) {
    this.optimizationHistory.push({
      strategyId,
      outcome,
      metrics,
      timestamp: Date.now()
    });

    // Update performance metrics
    if (!this.performanceMetrics.has(strategyId)) {
      this.performanceMetrics.set(strategyId, {
        attempts: 0,
        successes: 0,
        failures: 0,
        avgDuration: 0,
        totalDuration: 0
      });
    }

    const metrics_data = this.performanceMetrics.get(strategyId);
    metrics_data.attempts++;

    if (outcome === 'success') {
      metrics_data.successes++;
    } else {
      metrics_data.failures++;
    }

    if (metrics.duration) {
      metrics_data.totalDuration += metrics.duration;
      metrics_data.avgDuration = metrics_data.totalDuration / metrics_data.attempts;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(strategyId = null) {
    if (strategyId) {
      return this.performanceMetrics.get(strategyId) || null;
    }

    return Object.fromEntries(this.performanceMetrics.entries());
  }
}

/**
 * Adaptive Strategy Manager
 */
export class AdaptiveStrategyManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.evaluator = new StrategyEvaluator();
    this.optimizer = new StrategyOptimizer();
    this.learningData = {
      strategyHistory: {},
      scenarioPatterns: []
    };

    this.options = {
      adaptationRate: 0.1,
      minConfidence: 0.6,
      enableHybrid: true,
      ...options
    };
  }

  /**
   * Select strategy for scenario
   */
  selectStrategy(scenario, constraints = {}) {
    // Evaluate all strategies
    const evaluation = this.evaluator.evaluate(scenario, this.learningData);

    // Get all scores
    const scores = evaluation.scores;

    // Optimize selection
    const optimized = this.optimizer.optimize(scores, scenario, constraints);

    // Choose final strategy
    const selected = this.options.enableHybrid ? optimized.hybrid : optimized.primary;

    this.emit('strategy:selected', {
      selected,
      evaluation,
      optimized,
      scenario
    });

    return {
      ...selected,
      evaluation,
      optimized,
      timestamp: Date.now()
    };
  }

  /**
   * Execute strategy
   */
  async executeStrategy(strategy, scenario, executor) {
    const startTime = Date.now();

    this.emit('strategy:executing', { strategy, scenario });

    try {
      // Execute the strategy
      const result = await executor(strategy, scenario);

      const duration = Date.now() - startTime;

      // Record success
      this.recordOutcome(strategy.strategyId, 'success', {
        duration,
        result
      });

      this.emit('strategy:completed', {
        strategy,
        result,
        duration
      });

      return { success: true, result, duration };

    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failure
      this.recordOutcome(strategy.strategyId, 'failure', {
        duration,
        error: error.message
      });

      this.emit('strategy:failed', {
        strategy,
        error,
        duration
      });

      return { success: false, error, duration };
    }
  }

  /**
   * Record strategy outcome
   */
  recordOutcome(strategyId, outcome, metrics) {
    // Update optimizer metrics
    this.optimizer.recordResult(strategyId, outcome, metrics);

    // Update learning data
    if (!this.learningData.strategyHistory[strategyId]) {
      this.learningData.strategyHistory[strategyId] = {
        attempts: 0,
        successes: 0,
        failures: 0
      };
    }

    const history = this.learningData.strategyHistory[strategyId];
    history.attempts++;

    if (outcome === 'success') {
      history.successes++;
    } else {
      history.failures++;
    }

    this.emit('outcome:recorded', { strategyId, outcome, metrics });
  }

  /**
   * Adapt strategies based on learning
   */
  adapt(learningPatterns) {
    // Update learning data
    this.learningData.scenarioPatterns = learningPatterns;

    // Adjust evaluator weights based on success patterns
    this.adaptWeights(learningPatterns);

    this.emit('manager:adapted', {
      patterns: learningPatterns.length,
      weights: this.evaluator.weights
    });
  }

  /**
   * Adapt evaluator weights
   */
  adaptWeights(patterns) {
    if (patterns.length === 0) return;

    // Analyze which factors correlate with success
    const factorSuccess = {
      taskCriticality: 0,
      shutdownUrgency: 0,
      historicalSuccess: 0,
      systemState: 0
    };

    patterns.forEach(pattern => {
      if (pattern.outcome === 'success') {
        Object.keys(factorSuccess).forEach(factor => {
          factorSuccess[factor] += pattern.factors[factor] || 0;
        });
      }
    });

    // Normalize and blend with current weights
    const total = Object.values(factorSuccess).reduce((a, b) => a + b, 0);
    if (total > 0) {
      Object.keys(factorSuccess).forEach(factor => {
        const learnedWeight = factorSuccess[factor] / total;
        this.evaluator.weights[factor] =
          this.evaluator.weights[factor] * (1 - this.options.adaptationRate) +
          learnedWeight * this.options.adaptationRate;
      });
    }
  }

  /**
   * Get manager statistics
   */
  getStats() {
    return {
      strategies: Object.keys(this.evaluator.strategies).length,
      historySize: Object.values(this.learningData.strategyHistory)
        .reduce((sum, h) => sum + h.attempts, 0),
      performanceMetrics: this.optimizer.getMetrics(),
      weights: this.evaluator.weights,
      adaptationRate: this.options.adaptationRate
    };
  }

  /**
   * Export learning data
   */
  exportLearning() {
    return {
      learningData: this.learningData,
      weights: this.evaluator.weights,
      performanceMetrics: this.optimizer.getMetrics(),
      optimizationHistory: this.optimizer.optimizationHistory
    };
  }

  /**
   * Import learning data
   */
  importLearning(data) {
    if (data.learningData) {
      this.learningData = data.learningData;
    }
    if (data.weights) {
      this.evaluator.weights = data.weights;
    }
    if (data.optimizationHistory) {
      this.optimizer.optimizationHistory = data.optimizationHistory;
    }
  }
}

export default AdaptiveStrategyManager;
