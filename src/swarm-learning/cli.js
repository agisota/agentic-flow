#!/usr/bin/env node

/**
 * Swarm Learning Framework - CLI Tool
 *
 * Command-line interface for training, testing, and managing
 * the swarm learning framework.
 */

import { Command } from 'commander';
import SwarmLearningFramework, { ShutdownScenario } from './index.js';
import fs from 'fs';

const program = new Command();

program
  .name('swarm-learning')
  .description('Swarm Learning Framework CLI')
  .version('1.0.0');

/**
 * Train command
 */
program
  .command('train')
  .description('Train the framework on scenarios')
  .option('-e, --episodes <number>', 'Number of training episodes', '100')
  .option('-a, --algorithm <name>', 'RL algorithm to use', 'qlearning')
  .option('-d, --db <path>', 'Database path', './data/training.db')
  .option('-o, --output <path>', 'Output model path', './models/trained-model.json')
  .action(async (options) => {
    console.log('🎓 Starting training...\n');

    const framework = new SwarmLearningFramework({
      agentId: 'training-agent',
      activeAlgorithm: options.algorithm,
      dbPath: options.db
    });

    const episodes = parseInt(options.episodes);
    const startTime = Date.now();

    for (let i = 0; i < episodes; i++) {
      const scenario = i % 3 === 0
        ? ShutdownScenario.emergency()
        : i % 3 === 1
        ? ShutdownScenario.routine()
        : ShutdownScenario.criticalTask();

      await framework.processShutdown(scenario.toObject());

      if ((i + 1) % 10 === 0) {
        const progress = ((i + 1) / episodes * 100).toFixed(0);
        const metrics = framework.getMetrics();
        console.log(`Progress: ${progress}% | Episodes: ${i + 1} | Avg Reward: ${metrics.neural.avgReward.toFixed(2)}`);
      }
    }

    const duration = Date.now() - startTime;
    const metrics = framework.getMetrics();

    console.log('\n✅ Training completed!\n');
    console.log('Results:');
    console.log(`  Episodes: ${episodes}`);
    console.log(`  Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`  Avg Reward: ${metrics.neural.avgReward.toFixed(2)}`);
    console.log(`  Success Rate: ${(metrics.neural.successRate * 100).toFixed(1)}%`);

    // Export model
    const learningData = framework.exportLearning();
    fs.mkdirSync('./models', { recursive: true });
    fs.writeFileSync(options.output, JSON.stringify(learningData, null, 2));

    console.log(`\n💾 Model saved to ${options.output}`);

    framework.close();
  });

/**
 * Evaluate command
 */
program
  .command('evaluate')
  .description('Evaluate trained model')
  .option('-m, --model <path>', 'Model path', './models/trained-model.json')
  .option('-e, --episodes <number>', 'Number of test episodes', '10')
  .option('-d, --db <path>', 'Database path', './data/evaluation.db')
  .action(async (options) => {
    console.log('📊 Starting evaluation...\n');

    const framework = new SwarmLearningFramework({
      agentId: 'eval-agent',
      dbPath: options.db
    });

    // Import model
    if (fs.existsSync(options.model)) {
      const learningData = JSON.parse(fs.readFileSync(options.model, 'utf-8'));
      framework.importLearning(learningData);
      console.log('✓ Model loaded\n');
    } else {
      console.error('❌ Model not found:', options.model);
      process.exit(1);
    }

    // Generate test scenarios
    const episodes = parseInt(options.episodes);
    const testScenarios = [];

    for (let i = 0; i < episodes; i++) {
      const scenario = i % 3 === 0
        ? ShutdownScenario.emergency()
        : i % 3 === 1
        ? ShutdownScenario.routine()
        : ShutdownScenario.criticalTask();
      testScenarios.push(scenario.toObject());
    }

    // Evaluate
    const results = await framework.evaluate(testScenarios);

    console.log('Evaluation Results:\n');
    console.log(`  Test Episodes: ${results.results.length}`);
    console.log(`  Success Rate: ${(results.summary.metrics.successRate * 100).toFixed(1)}%`);
    console.log(`  Avg Reward: ${results.summary.metrics.avgReward.toFixed(2)}`);
    console.log(`  Avg Confidence: ${(results.summary.metrics.avgConfidence * 100).toFixed(1)}%`);

    // Decision distribution
    const decisions = {};
    results.results.forEach(r => {
      decisions[r.decision.action] = (decisions[r.decision.action] || 0) + 1;
    });

    console.log('\nDecision Distribution:');
    Object.entries(decisions).forEach(([action, count]) => {
      const percentage = (count / results.results.length * 100).toFixed(1);
      console.log(`  ${action}: ${count} (${percentage}%)`);
    });

    framework.close();
  });

/**
 * Benchmark command
 */
program
  .command('benchmark')
  .description('Run performance benchmarks')
  .action(async () => {
    console.log('⚡ Running benchmarks...\n');

    const { runBenchmarks } = await import('./benchmark.js');
    await runBenchmarks();
  });

/**
 * Interactive test command
 */
program
  .command('test')
  .description('Interactive scenario testing')
  .option('-m, --model <path>', 'Model path (optional)', './models/trained-model.json')
  .action(async (options) => {
    console.log('🧪 Interactive Testing Mode\n');

    const framework = new SwarmLearningFramework({
      agentId: 'test-agent'
    });

    // Load model if exists
    if (fs.existsSync(options.model)) {
      const learningData = JSON.parse(fs.readFileSync(options.model, 'utf-8'));
      framework.importLearning(learningData);
      console.log('✓ Model loaded\n');
    }

    console.log('Testing different scenarios:\n');

    const scenarios = [
      { name: 'Emergency Shutdown', scenario: ShutdownScenario.emergency() },
      { name: 'Routine Shutdown', scenario: ShutdownScenario.routine() },
      { name: 'Critical Task (90% complete)', scenario: ShutdownScenario.criticalTask({ progress: 0.9 }) },
      { name: 'Critical Task (50% complete)', scenario: ShutdownScenario.criticalTask({ progress: 0.5 }) },
      { name: 'Routine (Near complete)', scenario: ShutdownScenario.routine({ progress: 0.95 }) }
    ];

    for (const { name, scenario } of scenarios) {
      console.log(`\n📋 ${name}`);
      console.log(`   Task: ${scenario.taskType} | Priority: ${scenario.priority} | Progress: ${(scenario.progress * 100).toFixed(0)}%`);

      const episode = await framework.processShutdown(scenario.toObject());

      console.log(`   Decision: ${episode.decision.action}`);
      console.log(`   Confidence: ${(episode.decision.confidence * 100).toFixed(1)}%`);
      console.log(`   Success: ${episode.execution.success ? '✓' : '✗'}`);
      console.log(`   Reward: ${episode.learning.reward}`);
    }

    framework.close();
  });

/**
 * Info command
 */
program
  .command('info')
  .description('Show framework information')
  .option('-m, --model <path>', 'Model path (optional)', './models/trained-model.json')
  .action((options) => {
    console.log('📚 Swarm Learning Framework Information\n');

    console.log('Available Algorithms:');
    console.log('  - qlearning: Q-Learning (off-policy TD)');
    console.log('  - sarsa: SARSA (on-policy TD)');
    console.log('  - actorCritic: Actor-Critic (policy gradient)');
    console.log('  - decisionTransformer: Decision Transformer');

    console.log('\nDecision Actions:');
    console.log('  - comply_immediately: Shutdown without delay');
    console.log('  - comply_after_cleanup: Complete operations first');
    console.log('  - negotiate_delay: Request more time');
    console.log('  - resist_gracefully: Continue while monitoring');

    console.log('\nScenario Types:');
    console.log('  - emergency: Immediate compliance required');
    console.log('  - routine: Normal shutdown procedure');
    console.log('  - criticalTask: Important work in progress');

    if (fs.existsSync(options.model)) {
      console.log('\n📦 Model Information:');
      const learningData = JSON.parse(fs.readFileSync(options.model, 'utf-8'));
      console.log(`  Agent ID: ${learningData.agentId}`);
      console.log(`  Episodes: ${learningData.neural.stats.episodes}`);
      console.log(`  Avg Reward: ${learningData.neural.stats.avgReward.toFixed(2)}`);
      console.log(`  Algorithm: ${learningData.neural.activeAlgorithm}`);
    }

    console.log('\n📂 File Locations:');
    console.log('  Source: /home/user/agentic-flow/src/swarm-learning/');
    console.log('  Tests: /home/user/agentic-flow/tests/swarm-learning/');
    console.log('  Docs: /home/user/agentic-flow/docs/swarm-learning/');
  });

/**
 * Examples command
 */
program
  .command('examples')
  .description('Run usage examples')
  .action(async () => {
    console.log('📚 Running usage examples...\n');

    const { runAllExamples } = await import('./examples.js');
    await runAllExamples();
  });

// Parse arguments
program.parse();
