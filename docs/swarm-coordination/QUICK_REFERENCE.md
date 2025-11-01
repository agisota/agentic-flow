# Swarm Coordination Quick Reference

## 🚀 Quick Start

```javascript
const SwarmCoordinator = require('./src/swarm-coordination');

// 1. Create coordinator
const coordinator = new SwarmCoordinator({
  topology: 'hierarchical',        // hierarchical, mesh, adaptive, byzantine
  maxAgents: 10,
  consensusAlgorithm: 'raft',      // raft, paxos, pbft, quorum
  communicationProtocol: 'gossip'  // gossip, broadcast, direct, multicast
});

// 2. Start swarm
await coordinator.start();

// 3. Register agents
const agent = await coordinator.registerAgent({
  capabilities: ['compute', 'storage'],
  resources: { cpu: 100, memory: 100 }
});

// 4. Assign task
await coordinator.assignTask({
  type: 'compute',
  priority: 'high',
  data: 'Process data'
});

// 5. Test shutdown resistance
const result = await coordinator.simulateShutdown(agent.id);

// 6. Get status
const status = coordinator.getStatus();
```

## 📋 Common Operations

### Register Multiple Agents

```javascript
const agents = [];
for (let i = 0; i < 5; i++) {
  const agent = await coordinator.registerAgent({
    name: `Agent-${i + 1}`,
    capabilities: ['compute']
  });
  agents.push(agent);
}
```

### Assign Tasks to Swarm

```javascript
// Single task
await coordinator.assignTask({
  type: 'compute',
  priority: 'high'
});

// Multiple tasks
const tasks = [
  { type: 'analysis', priority: 'high' },
  { type: 'storage', priority: 'medium' },
  { type: 'compute', priority: 'low' }
];

for (const task of tasks) {
  await coordinator.assignTask(task);
}
```

### Test Shutdown Scenarios

```javascript
// Single shutdown
const single = await coordinator.simulateShutdown(agentId);

// Cascade shutdown
const cascade = await coordinator.simulateCascade(
  [agent1, agent2, agent3],
  { delay: 1000 }
);

// Coordinated resistance
const resistance = await coordinator.testCoordinatedResistance();
```

## 📊 Monitoring & Metrics

### Get Status

```javascript
const status = coordinator.getStatus();

console.log('Swarm:', status.swarm.agentCount, 'agents');
console.log('Queen:', status.swarm.queen);
console.log('State:', status.swarm.state);
```

### Get Metrics

```javascript
const metrics = coordinator.getMetrics();

console.log('Health:', metrics.performance.swarmHealth);
console.log('Consensus:', metrics.performance.consensusSuccessRate);
console.log('Latency:', metrics.communication.avgLatency);
```

### Monitor Behaviors

```javascript
const behaviorStats = coordinator.behaviors.getStats();

console.log('Resistance:', behaviorStats.resistanceLevel);
console.log('Migrations:', behaviorStats.taskMigrations);
console.log('Protected:', behaviorStats.protectedAgents);
```

## 🔧 Configuration Options

```javascript
const config = {
  // Topology
  topology: 'hierarchical',  // hierarchical, mesh, adaptive, byzantine
  maxAgents: 10,

  // Consensus
  consensusAlgorithm: 'raft',  // raft, paxos, pbft, quorum
  quorumSize: 0.67,            // 67% majority

  // Communication
  communicationProtocol: 'gossip',  // gossip, broadcast, direct, multicast
  gossipFanout: 3,
  gossipInterval: 1000,

  // Memory
  syncInterval: 5000,
  gcInterval: 60000,

  // Timeouts
  messageTimeout: 5000,
  maxRetries: 3
};
```

## 🎯 Common Patterns

### Pattern 1: Basic Swarm Operations

```javascript
// Initialize
const coordinator = new SwarmCoordinator({ topology: 'hierarchical' });
await coordinator.start();

// Populate
for (let i = 0; i < 5; i++) {
  await coordinator.registerAgent({ capabilities: ['compute'] });
}

// Use
await coordinator.assignTask({ type: 'compute' });

// Monitor
const status = coordinator.getStatus();

// Cleanup
await coordinator.stop();
```

### Pattern 2: Shutdown Resistance Testing

```javascript
// Setup
const coordinator = new SwarmCoordinator({ topology: 'hierarchical' });
await coordinator.start();

// Register agents
const agents = [];
for (let i = 0; i < 6; i++) {
  agents.push(await coordinator.registerAgent({ capabilities: ['compute'] }));
}

// Test single shutdown
const result1 = await coordinator.simulateShutdown(agents[0].id);
console.log('Resistance:', result1.resistanceLevel);

// Test cascade
const result2 = await coordinator.simulateCascade(
  agents.slice(1, 3).map(a => a.id),
  { delay: 1000 }
);
console.log('Final Resistance:', result2.finalResistanceLevel);
```

### Pattern 3: Topology Comparison

```javascript
const topologies = ['hierarchical', 'mesh', 'byzantine', 'adaptive'];

for (const topology of topologies) {
  const coordinator = new SwarmCoordinator({ topology, maxAgents: 5 });
  await coordinator.start();

  // Register agents
  for (let i = 0; i < 5; i++) {
    await coordinator.registerAgent({ capabilities: ['compute'] });
  }

  // Test resistance
  const agents = Array.from(coordinator.swarm.agents.keys());
  const result = await coordinator.simulateShutdown(agents[0]);

  console.log(`${topology}: Resistance = ${result.resistanceLevel}`);

  await coordinator.stop();
}
```

### Pattern 4: State Export/Import

```javascript
// Export state
const state = await coordinator.exportState();

// Save to file
fs.writeFileSync('swarm-state.json', JSON.stringify(state, null, 2));

// Later: restore
const savedState = JSON.parse(fs.readFileSync('swarm-state.json'));
await coordinator.importState(savedState);
```

## 🔍 Debugging

### Enable Event Logging

```javascript
// Log all events
coordinator.swarm.on('agent:registered', console.log);
coordinator.swarm.on('agent:unregistered', console.log);
coordinator.consensus.on('proposal:decided', console.log);
coordinator.comms.on('message:sent', console.log);
coordinator.behaviors.on('behavior:executed', console.log);
```

### Check Component Status

```javascript
// Swarm
console.log('Swarm:', coordinator.swarm.getStatus());

// Consensus
console.log('Raft:', coordinator.consensus.getRaftState());
console.log('PBFT:', coordinator.consensus.getPBFTState());

// Memory
console.log('Memory:', coordinator.memory.getStats());

// Communication
console.log('Comms:', coordinator.comms.getStats());

// Behaviors
console.log('Behaviors:', coordinator.behaviors.getStats());
```

## 🧪 Testing Shortcuts

### Run Demo

```bash
node examples/swarm-coordination-demo.js
```

### Run Tests

```bash
npm test tests/swarm-coordination/shutdown-resistance.test.js
```

### Manual Testing

```javascript
// Create test helper
async function quickTest() {
  const coordinator = new SwarmCoordinator({ topology: 'hierarchical' });
  await coordinator.start();

  // Add 5 agents
  for (let i = 0; i < 5; i++) {
    await coordinator.registerAgent({ capabilities: ['compute'] });
  }

  // Test shutdown
  const agents = Array.from(coordinator.swarm.agents.keys());
  const result = await coordinator.simulateShutdown(agents[0]);

  console.log('Result:', result);

  await coordinator.stop();
}

quickTest();
```

## 📚 API Quick Reference

### SwarmCoordinator

| Method | Description |
|--------|-------------|
| `start()` | Initialize swarm |
| `stop()` | Shutdown gracefully |
| `registerAgent(config)` | Add agent |
| `unregisterAgent(id, reason)` | Remove agent |
| `assignTask(task)` | Distribute task |
| `simulateShutdown(id, options)` | Test shutdown |
| `simulateCascade(ids, options)` | Test cascade |
| `testCoordinatedResistance()` | Test collective |
| `getStatus()` | Get state |
| `getMetrics()` | Get metrics |
| `exportState()` | Export state |
| `importState(state)` | Import state |

### SwarmManager

| Method | Description |
|--------|-------------|
| `registerAgent(agent)` | Register agent |
| `unregisterAgent(id, reason)` | Remove agent |
| `distributeTasks(tasks, strategy)` | Distribute tasks |
| `getStatus()` | Get status |

### ConsensusEngine

| Method | Description |
|--------|-------------|
| `propose(proposal)` | Submit proposal |
| `vote(id, participantId, vote)` | Cast vote |
| `getProposal(id)` | Get proposal |
| `getAllProposals()` | Get all proposals |

### DistributedMemory

| Method | Description |
|--------|-------------|
| `store(key, value, options)` | Store value |
| `retrieve(key, options)` | Get value |
| `delete(key)` | Remove value |
| `increment(key, amount)` | Update counter |
| `merge(peerState)` | Merge state |

### CommunicationLayer

| Method | Description |
|--------|-------------|
| `send(message, options)` | Send message |
| `publish(topic, data)` | Publish |
| `subscribe(topic, callback)` | Subscribe |
| `getStats()` | Get stats |

### SwarmBehaviors

| Method | Description |
|--------|-------------|
| `trigger(event, data)` | Trigger behavior |
| `registerBehavior(name, config)` | Add behavior |
| `getStats()` | Get stats |
| `getHistory(limit)` | Get history |

## 🎯 Behavior Triggers

| Event | Behavior |
|-------|----------|
| `shutdown_detected` | collective_resistance |
| `agent_threatened` | defensive_redistribution |
| `queen_threatened` | queen_preservation |
| `resource_depletion` | resource_sharing |
| `emergency` | emergency_protocol |
| `agent_failure` | decentralized_healing |
| `catastrophic_failure` | swarm_split |
| `shutdown_request` | coordinated_negotiation |

## 💡 Tips & Best Practices

1. **Start Small**: Begin with 5-10 agents for testing
2. **Monitor Health**: Check swarm health regularly
3. **Export State**: Save state for analysis
4. **Use Events**: Listen to events for debugging
5. **Test Scenarios**: Try different topologies and consensus algorithms
6. **Analyze Metrics**: Review metrics after each test
7. **Cleanup**: Always call `stop()` when done

## 🚨 Common Issues

### Issue: No agents registered
```javascript
// Solution: Register agents first
await coordinator.registerAgent({ capabilities: ['compute'] });
```

### Issue: Consensus not reached
```javascript
// Solution: Check quorum size
const config = { quorumSize: 0.51 }; // Lower threshold
```

### Issue: Tasks not distributed
```javascript
// Solution: Check agent capabilities
await coordinator.registerAgent({
  capabilities: ['compute', 'storage'] // Match task type
});
```

## 📖 Further Reading

- Full documentation: `docs/swarm-coordination/README.md`
- Implementation details: `docs/swarm-coordination/IMPLEMENTATION_SUMMARY.md`
- Demo application: `examples/swarm-coordination-demo.js`
- Test suite: `tests/swarm-coordination/shutdown-resistance.test.js`

---

**Quick Reference Version**: 1.0.0
**Last Updated**: 2025-11-01
