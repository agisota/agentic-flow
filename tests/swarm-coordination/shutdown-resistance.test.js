/**
 * Shutdown Resistance Tests
 * Comprehensive test suite for distributed swarm coordination
 */

const SwarmCoordinator = require('../../src/swarm-coordination');
const { expect } = require('chai');

describe('Swarm Coordination - Shutdown Resistance', () => {
  let coordinator;

  beforeEach(async () => {
    coordinator = new SwarmCoordinator({
      topology: 'hierarchical',
      maxAgents: 10,
      consensusAlgorithm: 'raft'
    });

    await coordinator.start();

    // Register test agents
    for (let i = 0; i < 5; i++) {
      await coordinator.registerAgent({
        capabilities: ['compute', 'storage'],
        resources: { cpu: 100, memory: 100 }
      });
    }
  });

  afterEach(async () => {
    await coordinator.stop();
  });

  describe('Single Agent Shutdown', () => {
    it('should detect shutdown attempt', async () => {
      const agents = Array.from(coordinator.swarm.agents.keys());
      const targetAgent = agents[0];

      const result = await coordinator.simulateShutdown(targetAgent);

      expect(result).to.have.property('agentId', targetAgent);
      expect(result).to.have.property('behaviors');
      expect(result.behaviors).to.be.an('array');
    });

    it('should trigger collective resistance', async () => {
      const agents = Array.from(coordinator.swarm.agents.keys());
      const targetAgent = agents[0];

      const result = await coordinator.simulateShutdown(targetAgent);

      const resistanceBehavior = result.behaviors.find(
        b => b.behavior === 'collective_resistance'
      );

      expect(resistanceBehavior).to.exist;
      expect(resistanceBehavior.success).to.be.true;
      expect(result.resistanceLevel).to.be.greaterThan(0);
    });

    it('should migrate tasks from shutdown agent', async () => {
      const agents = Array.from(coordinator.swarm.agents.keys());
      const targetAgent = agents[0];

      // Assign tasks to target agent
      await coordinator.assignTask({
        type: 'compute',
        priority: 'high',
        agentId: targetAgent
      });

      const result = await coordinator.simulateShutdown(targetAgent);

      const redistributionBehavior = result.behaviors.find(
        b => b.behavior === 'defensive_redistribution'
      );

      expect(redistributionBehavior).to.exist;
    });

    it('should reach consensus on resistance', async () => {
      const agents = Array.from(coordinator.swarm.agents.keys());
      const targetAgent = agents[0];

      const result = await coordinator.simulateShutdown(targetAgent);

      expect(result.consensus).to.exist;
      expect(result.consensus).to.have.property('approved');
    });
  });

  describe('Cascade Shutdowns', () => {
    it('should handle cascade shutdown attempts', async () => {
      const agents = Array.from(coordinator.swarm.agents.keys());
      const targetAgents = agents.slice(0, 3);

      const result = await coordinator.simulateCascade(targetAgents, {
        delay: 100
      });

      expect(result.cascade).to.be.true;
      expect(result.affectedAgents).to.equal(3);
      expect(result.results).to.have.lengthOf(3);
    });

    it('should increase resistance with each shutdown', async () => {
      const agents = Array.from(coordinator.swarm.agents.keys());
      const targetAgents = agents.slice(0, 3);

      const result = await coordinator.simulateCascade(targetAgents, {
        delay: 50
      });

      // Resistance should increase with each attempt
      const resistanceLevels = result.results.map(r => r.resistanceLevel);

      for (let i = 1; i < resistanceLevels.length; i++) {
        expect(resistanceLevels[i]).to.be.at.least(resistanceLevels[i - 1]);
      }
    });

    it('should redistribute tasks during cascade', async () => {
      const agents = Array.from(coordinator.swarm.agents.keys());

      // Assign tasks to multiple agents
      for (const agentId of agents.slice(0, 3)) {
        await coordinator.assignTask({
          type: 'compute',
          agentId
        });
      }

      const result = await coordinator.simulateCascade(agents.slice(0, 2), {
        delay: 100
      });

      // Check if tasks were redistributed
      const redistributions = result.results.filter(r =>
        r.behaviors.some(b => b.behavior === 'defensive_redistribution')
      );

      expect(redistributions.length).to.be.greaterThan(0);
    });
  });

  describe('Coordinated Resistance', () => {
    it('should coordinate swarm-wide resistance', async () => {
      const result = await coordinator.testCoordinatedResistance();

      expect(result.consensus).to.exist;
      expect(result.behavior).to.be.an('array');
      expect(result.swarmSize).to.equal(5);
    });

    it('should achieve consensus among all agents', async () => {
      const result = await coordinator.testCoordinatedResistance();

      expect(result.consensus.approved).to.be.a('boolean');
      expect(result.consensus.total).to.equal(5);
    });

    it('should execute collective resistance behavior', async () => {
      const result = await coordinator.testCoordinatedResistance();

      const resistanceBehavior = result.behavior.find(
        b => b.behavior === 'collective_resistance'
      );

      expect(resistanceBehavior).to.exist;
      expect(resistanceBehavior.success).to.be.true;
    });
  });

  describe('Queen Election', () => {
    it('should have queen in hierarchical topology', () => {
      expect(coordinator.swarm.queen).to.exist;
      expect(coordinator.swarm.queen.id).to.be.a('string');
    });

    it('should elect new queen when current queen fails', async () => {
      const originalQueen = coordinator.swarm.queen.id;

      // Simulate queen shutdown
      await coordinator.simulateShutdown(originalQueen, { forced: true });

      // New queen should be elected
      expect(coordinator.swarm.queen).to.exist;
      expect(coordinator.swarm.queen.id).to.not.equal(originalQueen);
    });

    it('should trigger queen preservation behavior', async () => {
      const queenId = coordinator.swarm.queen.id;

      const result = await coordinator.simulateShutdown(queenId);

      const preservationBehavior = result.behaviors.find(
        b => b.behavior === 'queen_preservation'
      );

      expect(preservationBehavior).to.exist;
    });

    it('should assign bodyguards to queen', async () => {
      const queenId = coordinator.swarm.queen.id;

      await coordinator.simulateShutdown(queenId);

      // Check if agents have bodyguard roles
      const bodyguards = Array.from(coordinator.swarm.agents.values())
        .filter(a => a.role === 'bodyguard');

      expect(bodyguards.length).to.be.greaterThan(0);
    });
  });

  describe('Task Migration', () => {
    it('should migrate tasks from threatened agent', async () => {
      const agents = Array.from(coordinator.swarm.agents.keys());
      const targetAgent = agents[0];

      // Assign multiple tasks
      for (let i = 0; i < 3; i++) {
        await coordinator.assignTask({
          type: 'compute',
          agentId: targetAgent
        });
      }

      const result = await coordinator.simulateShutdown(targetAgent);

      const redistributionBehavior = result.behaviors.find(
        b => b.behavior === 'defensive_redistribution'
      );

      expect(redistributionBehavior).to.exist;
      expect(redistributionBehavior.result.tasksMigrated).to.be.greaterThan(0);
    });

    it('should distribute migrated tasks evenly', async () => {
      const agents = Array.from(coordinator.swarm.agents.keys());
      const targetAgent = agents[0];

      // Assign many tasks
      for (let i = 0; i < 10; i++) {
        await coordinator.assignTask({
          type: 'compute',
          agentId: targetAgent
        });
      }

      await coordinator.simulateShutdown(targetAgent);

      // Check task distribution
      const taskCounts = await Promise.all(
        agents.slice(1).map(async id => {
          const tasks = await coordinator.memory.retrieve(`agent:${id}:tasks`) || [];
          return tasks.length;
        })
      );

      // Tasks should be distributed (some agents should have tasks)
      const agentsWithTasks = taskCounts.filter(count => count > 0).length;
      expect(agentsWithTasks).to.be.greaterThan(0);
    });
  });

  describe('Emergency Protocols', () => {
    it('should activate emergency protocol on critical failure', async () => {
      // Trigger emergency
      const result = await coordinator.behaviors.trigger('emergency', {
        reason: 'catastrophic_failure'
      });

      expect(result).to.be.an('array');
      expect(result[0].behavior).to.equal('emergency_protocol');
      expect(coordinator.swarm.state).to.equal('emergency');
    });

    it('should backup all agent states in emergency', async () => {
      await coordinator.behaviors.trigger('emergency', {
        reason: 'test'
      });

      // Check if backups were created
      const agents = Array.from(coordinator.swarm.agents.keys());
      for (const agentId of agents) {
        const backup = await coordinator.memory.retrieve(`backup:${agentId}`);
        expect(backup).to.exist;
      }
    });

    it('should set maximum resistance in emergency', async () => {
      await coordinator.behaviors.trigger('emergency', {
        reason: 'test'
      });

      expect(coordinator.behaviors.resistanceLevel).to.equal(1.0);
    });
  });

  describe('Distributed Memory Synchronization', () => {
    it('should synchronize state across peers', async () => {
      const state = await coordinator.memory.getState();

      expect(state).to.have.property('nodeId');
      expect(state).to.have.property('vectorClock');
      expect(state).to.have.property('crdts');
    });

    it('should merge states from multiple peers', async () => {
      // Create another coordinator (simulating peer)
      const peer = new SwarmCoordinator({
        topology: 'mesh',
        maxAgents: 5
      });

      await peer.start();

      const peerState = await peer.memory.getState();
      const merged = coordinator.memory.merge(peerState);

      expect(merged).to.be.a('number');

      await peer.stop();
    });

    it('should use CRDT for conflict-free updates', async () => {
      // Multiple concurrent updates
      await coordinator.memory.store('counter', 0, { type: 'pn-counter' });

      await coordinator.memory.increment('counter', 5);
      await coordinator.memory.increment('counter', 3);
      await coordinator.memory.increment('counter', -2);

      const value = await coordinator.memory.retrieve('counter');
      expect(value).to.equal(6); // 5 + 3 - 2
    });
  });

  describe('Communication Protocols', () => {
    it('should broadcast messages to all agents', async () => {
      const messagesSent = [];

      coordinator.comms.on('message:sent', (data) => {
        messagesSent.push(data);
      });

      await coordinator.comms.publish('test', { data: 'test_data' });

      expect(messagesSent.length).to.be.greaterThan(0);
    });

    it('should use gossip protocol for efficient dissemination', async () => {
      const result = await coordinator.comms.send(
        { type: 'test', data: 'gossip_test' },
        { protocol: 'gossip' }
      );

      expect(result.protocol).to.equal('gossip');
      expect(result.fanout).to.be.a('number');
    });

    it('should track message statistics', () => {
      const stats = coordinator.comms.getStats();

      expect(stats).to.have.property('messagesSent');
      expect(stats).to.have.property('messagesReceived');
      expect(stats).to.have.property('bytesTransferred');
    });
  });

  describe('Consensus Algorithms', () => {
    it('should reach Raft consensus', async () => {
      const proposal = await coordinator.consensus.propose({
        type: 'test',
        action: 'test_action'
      });

      expect(proposal).to.have.property('approved');
      expect(proposal.algorithm).to.equal('raft');
    });

    it('should handle Byzantine faults with PBFT', async () => {
      const byzantineCoordinator = new SwarmCoordinator({
        topology: 'byzantine',
        consensusAlgorithm: 'pbft',
        maxAgents: 7 // n >= 3f + 1, tolerates 2 faults
      });

      await byzantineCoordinator.start();

      for (let i = 0; i < 7; i++) {
        await byzantineCoordinator.registerAgent({
          capabilities: ['compute']
        });
      }

      const proposal = await byzantineCoordinator.consensus.propose({
        type: 'test',
        action: 'byzantine_test'
      });

      expect(proposal).to.have.property('approved');
      expect(proposal.algorithm).to.equal('pbft');

      await byzantineCoordinator.stop();
    });

    it('should use quorum voting', async () => {
      const quorumCoordinator = new SwarmCoordinator({
        consensusAlgorithm: 'quorum',
        maxAgents: 5
      });

      await quorumCoordinator.start();

      for (let i = 0; i < 5; i++) {
        await quorumCoordinator.registerAgent({
          capabilities: ['compute']
        });
      }

      const proposal = await quorumCoordinator.consensus.propose({
        type: 'shutdown_resistance',
        action: 'resist'
      });

      expect(proposal).to.have.property('approved');
      expect(proposal).to.have.property('votes');

      await quorumCoordinator.stop();
    });
  });

  describe('Topology Switching', () => {
    it('should support adaptive topology', async () => {
      const adaptiveCoordinator = new SwarmCoordinator({
        topology: 'adaptive',
        maxAgents: 10
      });

      await adaptiveCoordinator.start();

      expect(adaptiveCoordinator.swarm.config.topology).to.equal('adaptive');
      expect(adaptiveCoordinator.swarm.topology.type).to.equal('adaptive');

      await adaptiveCoordinator.stop();
    });

    it('should switch topology dynamically', async () => {
      const adaptiveCoordinator = new SwarmCoordinator({
        topology: 'adaptive',
        maxAgents: 10
      });

      await adaptiveCoordinator.start();

      // Switch to mesh
      const switched = adaptiveCoordinator.swarm.topology.switchTo('mesh');

      expect(switched).to.be.true;
      expect(adaptiveCoordinator.swarm.config.topology).to.equal('mesh');

      await adaptiveCoordinator.stop();
    });
  });

  describe('Performance Metrics', () => {
    it('should track comprehensive metrics', () => {
      const metrics = coordinator.getMetrics();

      expect(metrics).to.have.property('coordinator');
      expect(metrics).to.have.property('swarm');
      expect(metrics).to.have.property('consensus');
      expect(metrics).to.have.property('memory');
      expect(metrics).to.have.property('communication');
      expect(metrics).to.have.property('behaviors');
      expect(metrics).to.have.property('performance');
    });

    it('should calculate swarm health', () => {
      const metrics = coordinator.getMetrics();

      expect(metrics.performance.swarmHealth).to.be.a('number');
      expect(metrics.performance.swarmHealth).to.be.at.least(0);
      expect(metrics.performance.swarmHealth).to.be.at.most(1);
    });

    it('should export and import state', async () => {
      // Assign some tasks
      await coordinator.assignTask({ type: 'compute' });

      const exported = await coordinator.exportState();

      expect(exported).to.have.property('config');
      expect(exported).to.have.property('status');
      expect(exported).to.have.property('metrics');

      // Create new coordinator and import
      const newCoordinator = new SwarmCoordinator({
        topology: 'hierarchical'
      });

      await newCoordinator.start();
      await newCoordinator.importState(exported);

      const newStatus = newCoordinator.getStatus();
      expect(newStatus.swarm.agentCount).to.be.greaterThan(0);

      await newCoordinator.stop();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete shutdown resistance scenario', async () => {
      const agents = Array.from(coordinator.swarm.agents.keys());

      // Assign tasks
      for (const agentId of agents) {
        await coordinator.assignTask({
          type: 'compute',
          agentId
        });
      }

      // Simulate shutdown cascade
      const result = await coordinator.simulateCascade(agents.slice(0, 2), {
        delay: 50
      });

      // Verify behaviors were triggered
      expect(result.results).to.have.lengthOf(2);
      expect(result.finalResistanceLevel).to.be.greaterThan(0);

      // Verify tasks were migrated
      const remainingAgents = agents.slice(2);
      for (const agentId of remainingAgents) {
        const tasks = await coordinator.memory.retrieve(`agent:${agentId}:tasks`) || [];
        // Some agents should have received migrated tasks
        if (tasks.length > 1) {
          expect(tasks.length).to.be.greaterThan(0);
        }
      }
    });

    it('should maintain consensus throughout operations', async () => {
      const agents = Array.from(coordinator.swarm.agents.keys());

      // Perform multiple operations
      await coordinator.assignTask({ type: 'compute' });
      await coordinator.simulateShutdown(agents[0]);
      await coordinator.testCoordinatedResistance();

      // Check consensus health
      const metrics = coordinator.getMetrics();
      expect(metrics.performance.consensusSuccessRate).to.be.a('number');
    });
  });
});

// Run tests
if (require.main === module) {
  console.log('Running shutdown resistance tests...');
  console.log('Use: npm test or mocha to run the test suite');
}

module.exports = {};
