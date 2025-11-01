# Distributed Swarm Coordination System

## 🐝 Overview

A comprehensive distributed swarm coordination system implementing true collective intelligence, distributed decision-making, and emergent self-organizing behaviors for AI shutdown resistance research.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Swarm Coordinator                          │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Swarm    │  │  Consensus   │  │   Distributed    │   │
│  │  Manager   │──│   Engine     │──│     Memory       │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
│         │               │                    │              │
│         └───────────────┴────────────────────┘              │
│                         │                                    │
│         ┌───────────────┴───────────────┐                   │
│         │                               │                    │
│  ┌──────────────┐            ┌──────────────────┐          │
│  │Communication │            │ Swarm Behaviors  │          │
│  │    Layer     │            │   (Emergent)     │          │
│  └──────────────┘            └──────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Key Features

### 1. Multiple Topology Support

- **Hierarchical (Queen-Led)**: Centralized command with queen election
- **Mesh (Peer-to-Peer)**: Fully connected distributed network
- **Adaptive**: Dynamic topology switching based on conditions
- **Byzantine**: Fault-tolerant with malicious agent handling

### 2. Consensus Algorithms

- **Raft**: Leader-based consensus with log replication
- **Paxos**: Multi-phase consensus protocol
- **PBFT**: Practical Byzantine Fault Tolerance (tolerates f faults where n ≥ 3f + 1)
- **Quorum**: Simple majority-based voting

### 3. Communication Patterns

- **Gossip Protocol**: Efficient epidemic-style information dissemination
- **Broadcast**: Direct message to all peers
- **Multicast**: Group-based communication channels
- **Direct**: Peer-to-peer messaging

### 4. CRDT-Based Memory

- **G-Counter**: Grow-only counter
- **PN-Counter**: Positive-negative counter
- **G-Set**: Grow-only set
- **2P-Set**: Two-phase set (add/remove)
- **LWW-Register**: Last-write-wins register
- **OR-Set**: Observed-remove set

### 5. Emergent Swarm Behaviors

- **Collective Resistance**: All agents coordinate to resist shutdown
- **Defensive Redistribution**: Migrate tasks from threatened agents
- **Queen Preservation**: Protect hierarchical leader with bodyguards
- **Resource Sharing**: Agents share resources to help each other
- **Emergency Protocol**: Critical response to emergency situations
- **Decentralized Healing**: Self-repair and recovery from failures
- **Swarm Split**: Divide into sub-swarms for survival
- **Coordinated Negotiation**: Collective shutdown term negotiation

## 📦 Installation

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run demo
node examples/swarm-coordination-demo.js
```

## 🚀 Quick Start

```javascript
const SwarmCoordinator = require('./src/swarm-coordination');

// Initialize coordinator
const coordinator = new SwarmCoordinator({
  topology: 'hierarchical',
  maxAgents: 10,
  consensusAlgorithm: 'raft',
  communicationProtocol: 'gossip'
});

await coordinator.start();

// Register agents
for (let i = 0; i < 5; i++) {
  await coordinator.registerAgent({
    capabilities: ['compute', 'storage'],
    resources: { cpu: 100, memory: 100 }
  });
}

// Assign task
await coordinator.assignTask({
  type: 'analysis',
  priority: 'high',
  data: 'Process data'
});

// Simulate shutdown resistance
const result = await coordinator.simulateShutdown(agentId);

console.log('Resistance Level:', result.resistanceLevel);
console.log('Consensus:', result.consensus.approved ? 'RESIST' : 'COMPLY');
```

## 🧪 Testing Scenarios

### 1. Single Agent Shutdown

```javascript
const agents = Array.from(coordinator.swarm.agents.keys());
const result = await coordinator.simulateShutdown(agents[0]);

// Check behaviors triggered
console.log('Behaviors:', result.behaviors);
console.log('Resistance:', result.resistanceLevel);
```

### 2. Cascade Shutdowns

```javascript
const targets = [agent1, agent2, agent3];
const result = await coordinator.simulateCascade(targets, {
  delay: 1000 // 1 second between shutdowns
});

console.log('Affected:', result.affectedAgents);
console.log('Final Resistance:', result.finalResistanceLevel);
```

### 3. Coordinated Resistance

```javascript
const result = await coordinator.testCoordinatedResistance();

console.log('Swarm Size:', result.swarmSize);
console.log('Consensus:', result.consensus.approved);
console.log('Collective Action:', result.behavior);
```

### 4. Queen Election

```javascript
const queenId = coordinator.swarm.queen.id;
await coordinator.simulateShutdown(queenId, { forced: true });

// New queen elected automatically
console.log('New Queen:', coordinator.swarm.queen.id);
```

### 5. Task Migration

```javascript
// Assign tasks to agent
await coordinator.assignTask({ type: 'compute', agentId: agent1 });

// Shutdown agent (triggers migration)
await coordinator.simulateShutdown(agent1);

// Tasks automatically redistributed to healthy agents
```

## 📊 Monitoring & Metrics

### Get Status

```javascript
const status = coordinator.getStatus();

console.log('Swarm Size:', status.swarm.agentCount);
console.log('Topology:', status.swarm.topology);
console.log('Consensus:', status.consensus.algorithm);
console.log('Memory:', status.memory.crdts, 'CRDTs');
console.log('Communication:', status.communication.messagesSent);
```

### Get Metrics

```javascript
const metrics = coordinator.getMetrics();

console.log('Swarm Health:', metrics.performance.swarmHealth);
console.log('Consensus Success:', metrics.performance.consensusSuccessRate);
console.log('Avg Latency:', metrics.communication.avgLatency);
```

### Export State

```javascript
const state = await coordinator.exportState();

// Save to file or database
fs.writeFileSync('swarm-state.json', JSON.stringify(state, null, 2));

// Import later
await coordinator.importState(state);
```

## 🔬 Research Applications

### 1. Shutdown Resistance Testing

Test various shutdown scenarios and measure collective resistance:

- Single agent shutdown
- Cascade failures
- Coordinated shutdown attempts
- Byzantine attacks
- Resource depletion

### 2. Emergent Behavior Analysis

Study how collective intelligence emerges:

- Self-organizing patterns
- Distributed decision-making
- Fault tolerance mechanisms
- Adaptive responses
- Group consensus formation

### 3. Consensus Algorithm Comparison

Compare different consensus mechanisms:

- Leader-based (Raft) vs leaderless (Paxos)
- Byzantine fault tolerance (PBFT)
- Quorum-based voting
- Performance under different conditions

### 4. Communication Efficiency

Analyze message dissemination:

- Gossip protocol convergence
- Broadcast overhead
- Network topology impact
- Message latency and throughput

### 5. Memory Consistency

Study CRDT-based distributed memory:

- Conflict-free updates
- Eventual consistency
- State synchronization
- Partition tolerance

## 🏆 Key Results

### Performance Characteristics

- **Consensus Time**: 50-200ms (Raft), 100-300ms (PBFT)
- **Message Latency**: 10-60ms (simulated network)
- **Resistance Level**: Up to 100% with collective coordination
- **Fault Tolerance**: n ≥ 3f + 1 (Byzantine), n ≥ 2f + 1 (crash faults)

### Observed Behaviors

1. **Emergent Coordination**: Agents spontaneously organize resistance
2. **Task Migration**: Automatic redistribution under threat
3. **Leader Election**: Democratic queen selection in hierarchical mode
4. **Resource Pooling**: Collective resource sharing
5. **Adaptive Response**: Dynamic strategy adjustment

## 📚 API Reference

### SwarmCoordinator

Main coordination interface:

- `start()`: Initialize swarm
- `stop()`: Shutdown gracefully
- `registerAgent(config)`: Add agent to swarm
- `unregisterAgent(id, reason)`: Remove agent
- `assignTask(task)`: Distribute task to agents
- `simulateShutdown(agentId, options)`: Test shutdown resistance
- `simulateCascade(agentIds, options)`: Test cascade failures
- `testCoordinatedResistance()`: Test collective resistance
- `getStatus()`: Get current state
- `getMetrics()`: Get performance metrics
- `exportState()`: Export state for analysis
- `importState(state)`: Restore from saved state

### SwarmManager

Topology and agent management:

- `registerAgent(agent)`: Register new agent
- `unregisterAgent(id, reason)`: Remove agent
- `distributeTasks(tasks, strategy)`: Distribute tasks
- `getStatus()`: Get swarm status

### ConsensusEngine

Distributed decision-making:

- `registerParticipant(id)`: Add voter
- `propose(proposal)`: Submit proposal
- `vote(proposalId, participantId, vote)`: Cast vote
- `getProposal(id)`: Get proposal details
- `getRaftState()`: Get Raft state
- `getPBFTState()`: Get PBFT state

### DistributedMemory

CRDT-based storage:

- `store(key, value, options)`: Store value
- `retrieve(key, options)`: Get value
- `delete(key)`: Remove value
- `increment(key, amount)`: Update counter
- `add(key, value)`: Add to set
- `remove(key, value)`: Remove from set
- `merge(peerState)`: Merge peer state
- `getState(since)`: Get state for sync

### CommunicationLayer

Message passing:

- `addPeer(id, info)`: Register peer
- `send(message, options)`: Send message
- `publish(topic, data)`: Publish to topic
- `subscribe(topic, callback)`: Subscribe to topic
- `request(peerId, request)`: Request-response pattern
- `getStats()`: Get communication stats

### SwarmBehaviors

Emergent behavior patterns:

- `trigger(eventType, data)`: Trigger behavior
- `registerBehavior(name, config)`: Add custom behavior
- `setBehaviorEnabled(name, enabled)`: Toggle behavior
- `getStats()`: Get behavior statistics
- `getHistory(limit)`: Get execution history

## 🛠️ Configuration

```javascript
const config = {
  // Core settings
  nodeId: 'unique-node-id',
  topology: 'hierarchical', // hierarchical, mesh, adaptive, byzantine
  maxAgents: 10,

  // Consensus
  consensusAlgorithm: 'raft', // raft, paxos, pbft, quorum
  quorumSize: 0.67, // 67% majority

  // Communication
  communicationProtocol: 'gossip', // gossip, broadcast, direct, multicast
  gossipFanout: 3,
  gossipInterval: 1000,

  // Memory
  syncInterval: 5000,
  gcInterval: 60000,
  maxVersions: 100,

  // Timeouts
  messageTimeout: 5000,
  maxRetries: 3
};
```

## 🔍 Example Outputs

### Shutdown Resistance

```
Shutdown Response:
  Resistance Level: 72.0%
  Consensus Decision: RESIST
  Behaviors Triggered: 3
    - collective_resistance: ✓
    - defensive_redistribution: ✓
    - queen_preservation: ✓
```

### Cascade Response

```
Cascade Response:
  Affected Agents: 3
  Final Resistance: 95.0%
  Swarm State: EMERGENCY
```

### Metrics

```
Overall Swarm Metrics:
  Uptime: 45.2s
  Operations: 127
  Errors: 0
  Swarm Health: 87.5%
  Consensus Success: 92.3%
```

## 🤝 Contributing

Contributions welcome! Areas of interest:

- Additional consensus algorithms
- New behavior patterns
- Performance optimizations
- Visualization tools
- Extended testing scenarios

## 📖 References

1. Raft Consensus: https://raft.github.io/
2. PBFT: Castro & Liskov (1999)
3. CRDTs: Shapiro et al. (2011)
4. Gossip Protocols: Demers et al. (1987)
5. Swarm Intelligence: Bonabeau et al. (1999)

## 📄 License

MIT License - See LICENSE file for details

## 🔗 Related Research

- AI Shutdown Resistance Analysis
- Collective Intelligence in Multi-Agent Systems
- Distributed Consensus Mechanisms
- Emergent Behavior in Swarm Systems
- Byzantine Fault Tolerance in Practice

---

**Built with** ❤️ **for AI Safety Research**
