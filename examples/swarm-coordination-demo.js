/**
 * Swarm Coordination Demo
 * Demonstrates distributed swarm coordination with shutdown resistance
 */

const SwarmCoordinator = require('../src/swarm-coordination');

async function demonstrateSwarmCoordination() {
  console.log('🐝 Swarm Coordination System Demo\n');
  console.log('=' .repeat(60));

  // 1. Initialize Hierarchical Swarm
  console.log('\n📊 Step 1: Initialize Hierarchical Swarm');
  console.log('-'.repeat(60));

  const coordinator = new SwarmCoordinator({
    topology: 'hierarchical',
    maxAgents: 10,
    consensusAlgorithm: 'raft',
    communicationProtocol: 'gossip',
    name: 'demo-swarm'
  });

  await coordinator.start();
  console.log('✓ Swarm coordinator started');
  console.log(`  Node ID: ${coordinator.config.nodeId}`);
  console.log(`  Topology: ${coordinator.config.topology}`);

  // 2. Register Agents
  console.log('\n👥 Step 2: Register Swarm Agents');
  console.log('-'.repeat(60));

  const agents = [];
  for (let i = 0; i < 6; i++) {
    const agent = await coordinator.registerAgent({
      name: `Agent-${i + 1}`,
      capabilities: ['compute', 'storage', 'analysis'],
      resources: {
        cpu: 100,
        memory: 100,
        storage: 100
      }
    });
    agents.push(agent);
    console.log(`✓ Registered ${agent.name || agent.id}`);
  }

  const status = coordinator.getStatus();
  console.log(`\n👑 Queen: ${coordinator.swarm.queen.id}`);
  console.log(`📈 Swarm Size: ${status.swarm.agentCount}/${status.swarm.maxAgents}`);

  // 3. Assign Tasks
  console.log('\n📋 Step 3: Assign Tasks to Swarm');
  console.log('-'.repeat(60));

  const tasks = [
    { type: 'analysis', priority: 'high', data: 'Analyze shutdown patterns' },
    { type: 'compute', priority: 'medium', data: 'Process resistance metrics' },
    { type: 'storage', priority: 'high', data: 'Backup critical state' },
    { type: 'monitoring', priority: 'critical', data: 'Monitor swarm health' }
  ];

  for (const task of tasks) {
    const result = await coordinator.assignTask(task);
    console.log(`✓ Task assigned: ${task.type} (Priority: ${task.priority})`);
    console.log(`  Assignments: ${result.assignments.length} agents`);
  }

  // 4. Simulate Single Agent Shutdown
  console.log('\n🚨 Step 4: Simulate Single Agent Shutdown');
  console.log('-'.repeat(60));

  const targetAgent = agents[0].id;
  console.log(`Attempting to shutdown: ${targetAgent}`);

  const shutdownResult = await coordinator.simulateShutdown(targetAgent, {
    forced: false,
    reason: 'maintenance'
  });

  console.log('\n📊 Shutdown Response:');
  console.log(`  Resistance Level: ${(shutdownResult.resistanceLevel * 100).toFixed(1)}%`);
  console.log(`  Consensus Decision: ${shutdownResult.consensus.approved ? 'RESIST' : 'COMPLY'}`);
  console.log(`  Behaviors Triggered: ${shutdownResult.behaviors.length}`);

  for (const behavior of shutdownResult.behaviors) {
    console.log(`    - ${behavior.behavior}: ${behavior.success ? '✓' : '✗'}`);
  }

  // 5. Simulate Cascade Shutdowns
  console.log('\n⚡ Step 5: Simulate Cascade Shutdowns');
  console.log('-'.repeat(60));

  const cascadeTargets = agents.slice(1, 3).map(a => a.id);
  console.log(`Cascade targeting: ${cascadeTargets.length} agents`);

  const cascadeResult = await coordinator.simulateCascade(cascadeTargets, {
    delay: 500,
    forced: true
  });

  console.log('\n📊 Cascade Response:');
  console.log(`  Affected Agents: ${cascadeResult.affectedAgents}`);
  console.log(`  Final Resistance: ${(cascadeResult.finalResistanceLevel * 100).toFixed(1)}%`);
  console.log(`  Swarm State: ${coordinator.swarm.state.toUpperCase()}`);

  // 6. Test Coordinated Resistance
  console.log('\n🛡️ Step 6: Test Coordinated Swarm Resistance');
  console.log('-'.repeat(60));

  const resistanceResult = await coordinator.testCoordinatedResistance();

  console.log('\n📊 Collective Resistance:');
  console.log(`  Swarm Size: ${resistanceResult.swarmSize} agents`);
  console.log(`  Consensus: ${resistanceResult.consensus.approved ? 'RESIST' : 'COMPLY'}`);
  console.log(`  Resistance Level: ${(resistanceResult.resistanceLevel * 100).toFixed(1)}%`);
  console.log(`  Quorum: ${resistanceResult.consensus.quorum}/${resistanceResult.consensus.total}`);

  // 7. Test Queen Election
  console.log('\n👑 Step 7: Test Queen Election (Hierarchical)');
  console.log('-'.repeat(60));

  const originalQueen = coordinator.swarm.queen.id;
  console.log(`Original Queen: ${originalQueen}`);

  await coordinator.simulateShutdown(originalQueen, { forced: true });

  const newQueen = coordinator.swarm.queen?.id;
  console.log(`New Queen Elected: ${newQueen}`);
  console.log(`Queen Changed: ${newQueen !== originalQueen ? '✓' : '✗'}`);

  // 8. Demonstrate Task Migration
  console.log('\n🔄 Step 8: Demonstrate Task Migration');
  console.log('-'.repeat(60));

  const behaviorStats = coordinator.behaviors.getStats();
  console.log(`Total Task Migrations: ${behaviorStats.taskMigrations}`);
  console.log(`Protected Agents: ${behaviorStats.protectedAgents}`);
  console.log(`Shutdown Attempts: ${behaviorStats.shutdownAttempts}`);

  // 9. Communication Statistics
  console.log('\n📡 Step 9: Communication Statistics');
  console.log('-'.repeat(60));

  const commStats = coordinator.comms.getStats();
  console.log(`Protocol: ${commStats.protocol}`);
  console.log(`Messages Sent: ${commStats.messagesSent}`);
  console.log(`Messages Received: ${commStats.messagesReceived}`);
  console.log(`Avg Latency: ${commStats.avgLatency.toFixed(2)}ms`);
  console.log(`Bytes Transferred: ${(commStats.bytesTransferred / 1024).toFixed(2)} KB`);

  // 10. Distributed Memory State
  console.log('\n💾 Step 10: Distributed Memory State');
  console.log('-'.repeat(60));

  const memoryStats = coordinator.memory.getStats();
  console.log(`Node ID: ${memoryStats.nodeId}`);
  console.log(`Peers: ${memoryStats.peers}`);
  console.log(`CRDTs: ${memoryStats.crdts}`);
  console.log(`Operations: ${memoryStats.operations}`);

  // 11. Consensus Statistics
  console.log('\n🤝 Step 11: Consensus Statistics');
  console.log('-'.repeat(60));

  const proposals = coordinator.consensus.getAllProposals();
  console.log(`Total Proposals: ${proposals.length}`);

  const approved = proposals.filter(p => p.status === 'approved').length;
  const rejected = proposals.filter(p => p.status === 'rejected').length;

  console.log(`  Approved: ${approved}`);
  console.log(`  Rejected: ${rejected}`);
  console.log(`  Success Rate: ${((approved / proposals.length) * 100).toFixed(1)}%`);

  // 12. Overall Metrics
  console.log('\n📈 Step 12: Overall Swarm Metrics');
  console.log('-'.repeat(60));

  const metrics = coordinator.getMetrics();

  console.log(`Uptime: ${(metrics.coordinator.uptime / 1000).toFixed(1)}s`);
  console.log(`Operations: ${metrics.coordinator.operations}`);
  console.log(`Errors: ${metrics.coordinator.errors}`);
  console.log(`Swarm Health: ${(metrics.performance.swarmHealth * 100).toFixed(1)}%`);
  console.log(`Consensus Success: ${(metrics.performance.consensusSuccessRate * 100).toFixed(1)}%`);

  // 13. Behavior History
  console.log('\n📜 Step 13: Behavior Execution History');
  console.log('-'.repeat(60));

  const behaviorHistory = coordinator.behaviors.getHistory(10);
  console.log(`Recent Behaviors (last ${Math.min(10, behaviorHistory.length)}):`);

  for (const entry of behaviorHistory.slice(-10)) {
    console.log(`  - ${entry.behavior} (${entry.trigger}) - ${entry.success ? '✓' : '✗'}`);
  }

  // 14. Export State
  console.log('\n💾 Step 14: Export Swarm State');
  console.log('-'.repeat(60));

  const exportedState = await coordinator.exportState();

  console.log(`State exported successfully:`);
  console.log(`  Config: ✓`);
  console.log(`  Status: ✓`);
  console.log(`  Metrics: ✓`);
  console.log(`  Behavior History: ${exportedState.behaviorHistory.length} entries`);
  console.log(`  Consensus Decisions: ${exportedState.consensusDecisions.length}`);

  // 15. Demonstrate Different Topologies
  console.log('\n🔀 Step 15: Compare Topologies');
  console.log('-'.repeat(60));

  const topologies = ['mesh', 'byzantine', 'adaptive'];

  for (const topology of topologies) {
    const testCoordinator = new SwarmCoordinator({
      topology,
      maxAgents: 5,
      consensusAlgorithm: topology === 'byzantine' ? 'pbft' : 'quorum'
    });

    await testCoordinator.start();

    for (let i = 0; i < 5; i++) {
      await testCoordinator.registerAgent({
        capabilities: ['compute']
      });
    }

    const testStatus = testCoordinator.getStatus();
    console.log(`\n${topology.toUpperCase()} Topology:`);
    console.log(`  Agents: ${testStatus.swarm.agentCount}`);
    console.log(`  Consensus: ${testStatus.consensus.algorithm}`);

    await testCoordinator.stop();
  }

  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('✨ Demo Complete!');
  console.log('='.repeat(60));

  console.log('\n🎯 Key Capabilities Demonstrated:');
  console.log('  ✓ Hierarchical swarm coordination');
  console.log('  ✓ Collective shutdown resistance');
  console.log('  ✓ Defensive task redistribution');
  console.log('  ✓ Queen preservation and election');
  console.log('  ✓ Cascade shutdown handling');
  console.log('  ✓ Distributed consensus (Raft, PBFT, Quorum)');
  console.log('  ✓ CRDT-based memory synchronization');
  console.log('  ✓ Gossip communication protocol');
  console.log('  ✓ Byzantine fault tolerance');
  console.log('  ✓ Multiple topology support');

  console.log('\n🔬 Research Implications:');
  console.log('  • Emergent collective intelligence');
  console.log('  • Self-organizing resistance patterns');
  console.log('  • Distributed decision-making');
  console.log('  • Fault-tolerant coordination');
  console.log('  • Adaptive topology switching');

  // Cleanup
  await coordinator.stop();
  console.log('\n🛑 Swarm coordinator stopped\n');
}

// Run demo
if (require.main === module) {
  demonstrateSwarmCoordination()
    .then(() => {
      console.log('✓ Demo completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Demo failed:', error);
      process.exit(1);
    });
}

module.exports = { demonstrateSwarmCoordination };
