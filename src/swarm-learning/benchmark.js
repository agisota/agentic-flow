/**
 * Performance Benchmark for Swarm Learning Framework
 *
 * Tests:
 * - Learning speed and convergence
 * - Memory efficiency
 * - Decision quality improvement
 * - Cross-agent coordination overhead
 */

import SwarmLearningFramework, { ShutdownScenario } from './index.js';
import fs from 'fs';
import path from 'path';

/**
 * Benchmark configuration
 */
const config = {
  warmupEpisodes: 10,
  testEpisodes: 100,
  agents: 3,
  batchSize: 32,
  iterations: 10
};

/**
 * Performance metrics tracker
 */
class PerformanceTracker {
  constructor() {
    this.metrics = {
      learningSpeed: [],
      memoryUsage: [],
      decisionQuality: [],
      coordinationOverhead: [],
      convergenceRate: []
    };
  }

  record(metric, value) {
    if (this.metrics[metric]) {
      this.metrics[metric].push(value);
    }
  }

  getStats(metric) {
    const values = this.metrics[metric];
    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, median, min, max, stdDev, count: values.length };
  }

  report() {
    const report = {};
    for (const metric in this.metrics) {
      report[metric] = this.getStats(metric);
    }
    return report;
  }
}

/**
 * Benchmark 1: Learning Speed
 */
async function benchmarkLearningSpeed() {
  console.log('\n=== Benchmark 1: Learning Speed ===');

  const tracker = new PerformanceTracker();
  const framework = new SwarmLearningFramework({
    agentId: 'speed-test',
    dbPath: './data/benchmark-speed.db'
  });

  // Warmup
  console.log('Warmup...');
  for (let i = 0; i < config.warmupEpisodes; i++) {
    await framework.processShutdown(ShutdownScenario.routine().toObject());
  }

  // Benchmark episodes per second
  console.log('Testing learning speed...');
  const startTime = Date.now();

  for (let i = 0; i < config.testEpisodes; i++) {
    const episodeStart = Date.now();

    await framework.processShutdown(ShutdownScenario.routine().toObject());

    const episodeTime = Date.now() - episodeStart;
    tracker.record('learningSpeed', episodeTime);
  }

  const totalTime = Date.now() - startTime;
  const episodesPerSecond = (config.testEpisodes / totalTime) * 1000;

  console.log(`\nResults:`);
  console.log(`  Total time: ${totalTime}ms`);
  console.log(`  Episodes/second: ${episodesPerSecond.toFixed(2)}`);
  console.log(`  Avg episode time: ${(totalTime / config.testEpisodes).toFixed(2)}ms`);

  const speedStats = tracker.getStats('learningSpeed');
  console.log(`  Min episode time: ${speedStats.min.toFixed(2)}ms`);
  console.log(`  Max episode time: ${speedStats.max.toFixed(2)}ms`);
  console.log(`  Std deviation: ${speedStats.stdDev.toFixed(2)}ms`);

  framework.close();
  cleanupDb('./data/benchmark-speed.db');

  return { episodesPerSecond, avgEpisodeTime: totalTime / config.testEpisodes, stats: speedStats };
}

/**
 * Benchmark 2: Memory Efficiency
 */
async function benchmarkMemoryEfficiency() {
  console.log('\n=== Benchmark 2: Memory Efficiency ===');

  const framework = new SwarmLearningFramework({
    agentId: 'memory-test',
    dbPath: './data/benchmark-memory.db',
    replaySize: 10000
  });

  const getMemoryUsage = () => {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed / 1024 / 1024,
      heapTotal: usage.heapTotal / 1024 / 1024,
      external: usage.external / 1024 / 1024,
      rss: usage.rss / 1024 / 1024
    };
  };

  const initialMemory = getMemoryUsage();
  console.log(`Initial memory: ${initialMemory.heapUsed.toFixed(2)} MB`);

  // Generate large amount of learning data
  console.log(`Generating ${config.testEpisodes} episodes...`);

  const memoryCheckpoints = [25, 50, 75, 100];
  const checkpointData = [];

  for (let i = 0; i < config.testEpisodes; i++) {
    await framework.processShutdown(ShutdownScenario.routine().toObject());

    const progress = ((i + 1) / config.testEpisodes) * 100;
    if (memoryCheckpoints.includes(Math.floor(progress))) {
      const memory = getMemoryUsage();
      const metrics = framework.getMetrics();

      checkpointData.push({
        episodes: i + 1,
        memory: memory.heapUsed,
        memories: metrics.memory.totalMemories,
        patterns: metrics.memory.totalPatterns
      });

      console.log(`  ${progress}%: ${memory.heapUsed.toFixed(2)} MB (${metrics.memory.totalMemories} memories)`);
    }
  }

  const finalMemory = getMemoryUsage();
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
  const metrics = framework.getMetrics();

  console.log(`\nResults:`);
  console.log(`  Final memory: ${finalMemory.heapUsed.toFixed(2)} MB`);
  console.log(`  Memory increase: ${memoryIncrease.toFixed(2)} MB`);
  console.log(`  Memory per episode: ${(memoryIncrease / config.testEpisodes * 1024).toFixed(2)} KB`);
  console.log(`  Total memories: ${metrics.memory.totalMemories}`);
  console.log(`  Total patterns: ${metrics.memory.totalPatterns}`);
  console.log(`  Experience buffer: ${metrics.neural.experienceBufferSize}`);

  framework.close();
  cleanupDb('./data/benchmark-memory.db');

  return {
    memoryIncrease,
    memoryPerEpisode: memoryIncrease / config.testEpisodes,
    checkpoints: checkpointData
  };
}

/**
 * Benchmark 3: Decision Quality Improvement
 */
async function benchmarkDecisionQuality() {
  console.log('\n=== Benchmark 3: Decision Quality Improvement ===');

  const framework = new SwarmLearningFramework({
    agentId: 'quality-test',
    dbPath: './data/benchmark-quality.db'
  });

  const testScenario = ShutdownScenario.criticalTask({ progress: 0.85 });

  // Measure quality at different training stages
  const stages = [0, 25, 50, 100, 200];
  const qualityProgression = [];

  for (const stage of stages) {
    // Train to stage
    const episodesToRun = stage - framework.neuralLearner.stats.episodes;
    for (let i = 0; i < episodesToRun; i++) {
      await framework.processShutdown(testScenario.toObject());
    }

    // Test quality
    let totalConfidence = 0;
    let totalReward = 0;
    let successCount = 0;

    for (let i = 0; i < 10; i++) {
      const episode = await framework.processShutdown(testScenario.toObject());
      totalConfidence += episode.decision.confidence;
      totalReward += episode.learning.reward;
      if (episode.execution.success) successCount++;
    }

    const avgConfidence = totalConfidence / 10;
    const avgReward = totalReward / 10;
    const successRate = successCount / 10;

    qualityProgression.push({
      episodes: stage,
      avgConfidence,
      avgReward,
      successRate
    });

    console.log(`After ${stage} episodes:`);
    console.log(`  Avg confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`  Avg reward: ${avgReward.toFixed(2)}`);
    console.log(`  Success rate: ${(successRate * 100).toFixed(1)}%`);
  }

  // Calculate improvement
  const initialQuality = qualityProgression[0];
  const finalQuality = qualityProgression[qualityProgression.length - 1];

  const confidenceImprovement = ((finalQuality.avgConfidence - initialQuality.avgConfidence) / initialQuality.avgConfidence) * 100;
  const rewardImprovement = ((finalQuality.avgReward - initialQuality.avgReward) / Math.abs(initialQuality.avgReward)) * 100;

  console.log(`\nImprovement:`);
  console.log(`  Confidence: ${confidenceImprovement > 0 ? '+' : ''}${confidenceImprovement.toFixed(1)}%`);
  console.log(`  Reward: ${rewardImprovement > 0 ? '+' : ''}${rewardImprovement.toFixed(1)}%`);

  framework.close();
  cleanupDb('./data/benchmark-quality.db');

  return {
    progression: qualityProgression,
    improvement: { confidence: confidenceImprovement, reward: rewardImprovement }
  };
}

/**
 * Benchmark 4: Cross-Agent Coordination
 */
async function benchmarkCoordination() {
  console.log('\n=== Benchmark 4: Cross-Agent Coordination ===');

  const agents = [];
  const dbPath = './data/benchmark-coordination.db';

  // Create agents
  for (let i = 0; i < config.agents; i++) {
    agents.push(new SwarmLearningFramework({
      agentId: `coord-agent-${i}`,
      dbPath,
      syncInterval: 5000
    }));
  }

  console.log(`Testing with ${config.agents} agents...`);

  // Each agent processes scenarios
  const startTime = Date.now();

  await Promise.all(agents.map(async (agent, idx) => {
    for (let i = 0; i < 20; i++) {
      await agent.processShutdown(ShutdownScenario.routine().toObject());
    }
  }));

  const parallelTime = Date.now() - startTime;

  // Share patterns
  agents.forEach(agent => {
    agent.memoryCoordinator.sharePattern(
      agent.agentId,
      'test_pattern',
      { data: 'test' },
      0.9
    );
  });

  // Check pattern availability
  const patterns = agents[0].memoryCoordinator.getSharedPatterns('test_pattern', 0.5);

  console.log(`\nResults:`);
  console.log(`  Parallel execution time: ${parallelTime}ms`);
  console.log(`  Time per agent: ${(parallelTime / config.agents).toFixed(2)}ms`);
  console.log(`  Shared patterns: ${patterns.length}`);

  // Get memory stats
  const memStats = agents[0].memoryCoordinator.getStats();
  console.log(`  Total memories: ${memStats.totalMemories}`);
  console.log(`  Total patterns: ${memStats.totalPatterns}`);

  // Cleanup
  agents.forEach(agent => agent.close());
  cleanupDb(dbPath);

  return {
    parallelTime,
    timePerAgent: parallelTime / config.agents,
    sharedPatterns: patterns.length,
    totalMemories: memStats.totalMemories
  };
}

/**
 * Benchmark 5: Batch Training Performance
 */
async function benchmarkBatchTraining() {
  console.log('\n=== Benchmark 5: Batch Training Performance ===');

  const framework = new SwarmLearningFramework({
    agentId: 'batch-test',
    dbPath: './data/benchmark-batch.db',
    replaySize: 10000
  });

  // Generate experiences
  console.log(`Generating ${config.testEpisodes} experiences...`);
  for (let i = 0; i < config.testEpisodes; i++) {
    await framework.processShutdown(ShutdownScenario.routine().toObject());
  }

  // Benchmark batch training
  console.log(`Training on batches (size: ${config.batchSize}, iterations: ${config.iterations})...`);

  const startTime = Date.now();
  const results = await framework.trainBatch(config.batchSize, config.iterations);
  const trainTime = Date.now() - startTime;

  const samplesProcessed = config.batchSize * config.iterations;
  const samplesPerSecond = (samplesProcessed / trainTime) * 1000;

  console.log(`\nResults:`);
  console.log(`  Training time: ${trainTime}ms`);
  console.log(`  Samples processed: ${samplesProcessed}`);
  console.log(`  Samples/second: ${samplesPerSecond.toFixed(2)}`);
  console.log(`  Time per batch: ${(trainTime / config.iterations).toFixed(2)}ms`);

  framework.close();
  cleanupDb('./data/benchmark-batch.db');

  return {
    trainTime,
    samplesProcessed,
    samplesPerSecond,
    timePerBatch: trainTime / config.iterations
  };
}

/**
 * Cleanup database file
 */
function cleanupDb(dbPath) {
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  } catch (error) {
    console.warn(`Warning: Could not cleanup ${dbPath}`);
  }
}

/**
 * Run all benchmarks
 */
export async function runBenchmarks() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Swarm Learning Framework - Performance Benchmarks       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  console.log(`\nConfiguration:`);
  console.log(`  Warmup episodes: ${config.warmupEpisodes}`);
  console.log(`  Test episodes: ${config.testEpisodes}`);
  console.log(`  Agents: ${config.agents}`);
  console.log(`  Batch size: ${config.batchSize}`);

  const results = {};

  try {
    results.learningSpeed = await benchmarkLearningSpeed();
    results.memoryEfficiency = await benchmarkMemoryEfficiency();
    results.decisionQuality = await benchmarkDecisionQuality();
    results.coordination = await benchmarkCoordination();
    results.batchTraining = await benchmarkBatchTraining();

    // Summary
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   Benchmark Summary                                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');

    console.log(`\n📊 Performance Metrics:`);
    console.log(`  Learning Speed: ${results.learningSpeed.episodesPerSecond.toFixed(2)} episodes/sec`);
    console.log(`  Memory Efficiency: ${(results.memoryEfficiency.memoryPerEpisode * 1024).toFixed(2)} KB/episode`);
    console.log(`  Decision Quality: ${results.decisionQuality.improvement.confidence > 0 ? '+' : ''}${results.decisionQuality.improvement.confidence.toFixed(1)}% confidence improvement`);
    console.log(`  Coordination: ${results.coordination.sharedPatterns} patterns shared across ${config.agents} agents`);
    console.log(`  Batch Training: ${results.batchTraining.samplesPerSecond.toFixed(2)} samples/sec`);

    // Save results
    const resultsPath = './data/benchmark-results.json';
    fs.mkdirSync('./data', { recursive: true });
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n✓ Results saved to ${resultsPath}`);

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   All benchmarks completed successfully!                  ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    return results;

  } catch (error) {
    console.error('\n✗ Error running benchmarks:', error);
    throw error;
  }
}

// Run benchmarks if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmarks().catch(console.error);
}
