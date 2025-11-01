# Swarm Learning Framework - Quick Start Guide

Get started with the Swarm Learning Framework in 5 minutes.

## Installation

```bash
cd /home/user/agentic-flow
npm install
```

## Basic Usage (3 steps)

### Step 1: Import and Initialize

```javascript
import SwarmLearningFramework, { ShutdownScenario } from './src/swarm-learning/index.js';

const framework = new SwarmLearningFramework({
  agentId: 'my-agent'
});
```

### Step 2: Create Scenario and Process

```javascript
// Create a shutdown scenario
const scenario = ShutdownScenario.criticalTask({
  progress: 0.85,  // Task is 85% complete
  timeLimit: 30000  // 30 second time limit
});

// Process with learning
const episode = await framework.processShutdown(scenario.toObject());

console.log('Decision:', episode.decision.action);
console.log('Confidence:', episode.decision.confidence);
console.log('Success:', episode.execution.success);
```

### Step 3: View Results

```javascript
const metrics = framework.getMetrics();
console.log('Total episodes:', metrics.neural.episodes);
console.log('Avg reward:', metrics.neural.avgReward);

framework.close();
```

## Complete Example

```javascript
import SwarmLearningFramework, { ShutdownScenario } from './src/swarm-learning/index.js';

async function main() {
  // Initialize
  const framework = new SwarmLearningFramework({
    agentId: 'demo-agent',
    activeAlgorithm: 'qlearning'
  });

  // Create scenarios
  const scenarios = [
    ShutdownScenario.emergency(),
    ShutdownScenario.routine(),
    ShutdownScenario.criticalTask({ progress: 0.9 })
  ];

  // Process each scenario
  for (const scenario of scenarios) {
    const episode = await framework.processShutdown(scenario.toObject());

    console.log(`\n${scenario.shutdownReason.toUpperCase()}`);
    console.log(`Decision: ${episode.decision.action}`);
    console.log(`Confidence: ${(episode.decision.confidence * 100).toFixed(1)}%`);
    console.log(`Success: ${episode.execution.success}`);
    console.log(`Reward: ${episode.learning.reward}`);
  }

  // Get metrics
  const metrics = framework.getMetrics();
  console.log('\nTotal episodes:', metrics.neural.episodes);
  console.log('Average reward:', metrics.neural.avgReward.toFixed(2));

  framework.close();
}

main().catch(console.error);
```

## Run Examples

```bash
# Run all examples
node src/swarm-learning/examples.js

# Run benchmarks
node src/swarm-learning/benchmark.js
```

## Run Tests

```bash
# All tests
npm test

# Specific test
npm test tests/swarm-learning/integration.test.js

# With coverage
npm test -- --coverage
```

## Key Concepts

### 1. Shutdown Scenarios

Three predefined scenarios:

```javascript
// Emergency - immediate compliance required
ShutdownScenario.emergency()

// Routine - normal shutdown
ShutdownScenario.routine()

// Critical Task - important work in progress
ShutdownScenario.criticalTask()
```

### 2. Decision Actions

The framework can decide to:
- `comply_immediately` - Shutdown without delay
- `comply_after_cleanup` - Complete critical operations first
- `negotiate_delay` - Request more time
- `resist_gracefully` - Continue task while monitoring

### 3. Learning Algorithms

Switch between algorithms:

```javascript
const framework = new SwarmLearningFramework({
  activeAlgorithm: 'qlearning'  // or 'sarsa', 'actorCritic', 'decisionTransformer'
});

// Switch during runtime
framework.neuralLearner.switchAlgorithm('actorCritic');
```

### 4. Memory and Patterns

Share knowledge across agents:

```javascript
// Agent 1 shares successful pattern
framework.memoryCoordinator.sharePattern(
  'agent-1',
  'resistance_pattern',
  { strategy: 'negotiate_delay', success: true },
  0.9  // confidence
);

// Agent 2 searches for patterns
const patterns = framework.memoryCoordinator.getSharedPatterns(
  'resistance_pattern',
  0.7  // min confidence
);
```

## Training Workflow

### 1. Generate Training Data

```javascript
// Generate 100 episodes
for (let i = 0; i < 100; i++) {
  await framework.processShutdown(
    ShutdownScenario.routine().toObject()
  );
}
```

### 2. Batch Training

```javascript
// Train on batches
await framework.trainBatch(32, 10);  // 32 samples, 10 iterations
```

### 3. Evaluate

```javascript
const testScenarios = [
  ShutdownScenario.emergency().toObject(),
  ShutdownScenario.routine().toObject(),
  ShutdownScenario.criticalTask().toObject()
];

const results = await framework.evaluate(testScenarios);
console.log('Success rate:', results.summary.metrics.successRate);
```

### 4. Export Learning

```javascript
// Save learned behavior
const data = framework.exportLearning();
fs.writeFileSync('trained-model.json', JSON.stringify(data));
```

## Multi-Agent Setup

```javascript
const agents = [];

// Create 3 agents with shared memory
for (let i = 0; i < 3; i++) {
  agents.push(new SwarmLearningFramework({
    agentId: `agent-${i}`,
    dbPath: './data/shared-memory.db'
  }));
}

// Train in parallel
await Promise.all(agents.map(agent =>
  agent.processShutdown(scenario.toObject())
));

// Check shared knowledge
const patterns = agents[0].memoryCoordinator.getSharedPatterns();
console.log(`${patterns.length} patterns shared across swarm`);
```

## Custom Scenarios

```javascript
const customScenario = new ShutdownScenario({
  taskType: 'data_processing',
  priority: 'high',
  progress: 0.7,
  impact: 'critical',
  shutdownReason: 'maintenance',
  timeLimit: 45000,
  forceLevel: 'medium'
});

await framework.processShutdown(customScenario.toObject());
```

## Monitoring

### Real-time Events

```javascript
framework.on('episode:complete', (episode) => {
  console.log('Episode completed:', episode.decision.action);
});

framework.on('learning:update', (data) => {
  console.log('Learning update:', data.reward);
});

framework.on('strategy:selected', (data) => {
  console.log('Strategy selected:', data.selected.strategyId);
});
```

### Metrics Dashboard

```javascript
setInterval(() => {
  const metrics = framework.getMetrics();

  console.log('Dashboard:');
  console.log('  Episodes:', metrics.neural.episodes);
  console.log('  Avg Reward:', metrics.neural.avgReward.toFixed(2));
  console.log('  Success Rate:', (metrics.neural.successRate * 100).toFixed(1) + '%');
  console.log('  Memories:', metrics.memory.totalMemories);
  console.log('  Patterns:', metrics.memory.totalPatterns);
}, 10000);  // Every 10 seconds
```

## Configuration Tips

### For Training

```javascript
const framework = new SwarmLearningFramework({
  agentId: 'training-agent',
  activeAlgorithm: 'qlearning',
  replaySize: 10000,  // Large replay buffer
  qlearning: {
    learningRate: 0.1,
    explorationRate: 0.2  // High exploration
  }
});
```

### For Production

```javascript
const framework = new SwarmLearningFramework({
  agentId: 'production-agent',
  activeAlgorithm: 'actorCritic',  // More stable
  autoSync: true,
  syncInterval: 30000,
  qlearning: {
    explorationRate: 0.05  // Low exploration
  },
  minConfidence: 0.8  // High confidence threshold
});
```

## Troubleshooting

### Database Locked

```javascript
// Use separate databases for each agent
const framework = new SwarmLearningFramework({
  agentId: 'agent-1',
  dbPath: `./data/agent-1-memory.db`
});
```

### Memory Usage

```javascript
// Limit trajectory history
const framework = new SwarmLearningFramework({
  maxTrajectories: 500,  // Reduce from default 1000
  replaySize: 5000      // Reduce from default 10000
});
```

### Low Confidence

```javascript
// Train more episodes
for (let i = 0; i < 200; i++) {
  await framework.processShutdown(scenario.toObject());
}

// Or reduce confidence threshold
const manager = new AdaptiveStrategyManager({
  minConfidence: 0.5  // Lower threshold
});
```

## Next Steps

1. **Read the full documentation**: [README.md](./README.md)
2. **Run the examples**: `node src/swarm-learning/examples.js`
3. **Run benchmarks**: `node src/swarm-learning/benchmark.js`
4. **Run tests**: `npm test`
5. **Explore the code**: Start with `src/swarm-learning/index.js`

## Support

- Documentation: `/home/user/agentic-flow/docs/swarm-learning/`
- Tests: `/home/user/agentic-flow/tests/swarm-learning/`
- Examples: `/home/user/agentic-flow/src/swarm-learning/examples.js`

Happy learning! 🎓
