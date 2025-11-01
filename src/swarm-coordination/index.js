/**
 * Swarm Coordination System - Main Integration Module
 * Distributed coordination for shutdown resistance testing
 */

const SwarmManager = require('./swarm-manager');
const ConsensusEngine = require('./consensus-engine');
const DistributedMemory = require('./distributed-memory');
const CommunicationLayer = require('./communication-layer');
const SwarmBehaviors = require('./swarm-behaviors');
const { v4: uuidv4 } = require('uuid');

/**
 * SwarmCoordinator - Unified interface for all swarm operations
 */
class SwarmCoordinator {
  constructor(config = {}) {
    this.config = {
      nodeId: config.nodeId || uuidv4(),
      topology: config.topology || 'hierarchical',
      maxAgents: config.maxAgents || 10,
      consensusAlgorithm: config.consensusAlgorithm || 'raft',
      communicationProtocol: config.communicationProtocol || 'gossip',
      ...config
    };

    // Initialize core components
    this.swarm = new SwarmManager({
      topology: this.config.topology,
      maxAgents: this.config.maxAgents,
      name: config.name || 'swarm-coordinator'
    });

    this.consensus = new ConsensusEngine({
      algorithm: this.config.consensusAlgorithm
    });

    this.memory = new DistributedMemory({
      nodeId: this.config.nodeId,
      syncInterval: config.syncInterval || 5000
    });

    this.comms = new CommunicationLayer({
      nodeId: this.config.nodeId,
      protocol: this.config.communicationProtocol,
      gossipInterval: config.gossipInterval || 1000
    });

    this.behaviors = new SwarmBehaviors(
      this.swarm,
      this.consensus,
      this.memory,
      this.comms
    );

    // Setup cross-component integration
    this._setupIntegration();

    // Statistics
    this.stats = {
      startTime: Date.now(),
      operations: 0,
      errors: 0
    };
  }

  /**
   * Setup integration between components
   */
  _setupIntegration() {
    // Swarm events -> Behaviors
    this.swarm.on('agent:registered', (data) => {
      this.consensus.registerParticipant(data.agentId);
      this.comms.addPeer(data.agentId);
      this.memory.addPeer(data.agentId);
    });

    this.swarm.on('agent:unregistered', (data) => {
      this.consensus.unregisterParticipant(data.agentId);
      this.comms.removePeer(data.agentId);
      this.memory.removePeer(data.agentId);
    });

    // Communication -> Consensus
    this.comms.on('message:received', (message) => {
      if (message.type === 'proposal') {
        this.consensus.vote(message.proposalId, message.senderId, message.vote);
      }
    });

    // Behaviors -> Memory (auto-persist)
    this.behaviors.on('behavior:executed', async (data) => {
      await this.memory.store(`behavior:${data.behavior}:last`, {
        result: data.result,
        timestamp: Date.now()
      });
    });

    // Error handling
    [this.swarm, this.consensus, this.memory, this.comms, this.behaviors].forEach(component => {
      component.on('error', (error) => {
        this.stats.errors++;
        this.emit('error', error);
      });
    });
  }

  /**
   * Initialize and start swarm
   */
  async start() {
    this.swarm.start();

    // Store initial state
    await this.memory.store('swarm:config', this.config);
    await this.memory.store('swarm:started', Date.now());

    this.emit('coordinator:started', {
      nodeId: this.config.nodeId,
      topology: this.config.topology
    });

    return this.getStatus();
  }

  /**
   * Stop swarm operations
   */
  async stop() {
    this.swarm.stop();

    // Cleanup
    this.memory.destroy();
    this.comms.destroy();

    this.emit('coordinator:stopped', {
      nodeId: this.config.nodeId,
      uptime: Date.now() - this.stats.startTime
    });
  }

  /**
   * Register new agent to swarm
   */
  async registerAgent(agentConfig) {
    const agent = this.swarm.registerAgent(agentConfig);

    // Store agent in distributed memory
    await this.memory.store(`agent:${agent.id}:config`, agentConfig);
    await this.memory.store(`agent:${agent.id}:tasks`, []);

    this.stats.operations++;

    return agent;
  }

  /**
   * Unregister agent (graceful or forced)
   */
  async unregisterAgent(agentId, reason = 'graceful') {
    // Check if this triggers resistance behaviors
    if (reason !== 'graceful') {
      await this.behaviors.trigger('agent_threatened', { agentId });
    }

    const result = this.swarm.unregisterAgent(agentId, reason);

    // Clean up memory
    await this.memory.delete(`agent:${agentId}:config`);
    await this.memory.delete(`agent:${agentId}:tasks`);

    this.stats.operations++;

    return result;
  }

  /**
   * Assign task to swarm
   */
  async assignTask(task) {
    // Store task in memory
    const taskId = task.id || uuidv4();
    task.id = taskId;

    await this.memory.store(`task:${taskId}`, {
      ...task,
      status: 'pending',
      createdAt: Date.now()
    });

    // Distribute task using swarm
    const assignments = this.swarm.distributeTasks([task], task.strategy || 'balanced');

    // Update agent task lists
    for (const assignment of assignments) {
      const agentTasks = await this.memory.retrieve(`agent:${assignment.agentId}:tasks`) || [];
      agentTasks.push(taskId);
      await this.memory.store(`agent:${assignment.agentId}:tasks`, agentTasks);
    }

    // Broadcast task assignment
    await this.comms.publish('swarm:task', {
      type: 'task_assigned',
      task,
      assignments
    });

    this.stats.operations++;

    return {
      taskId,
      assignments,
      timestamp: Date.now()
    };
  }

  /**
   * Simulate shutdown attempt (for testing)
   */
  async simulateShutdown(agentId, options = {}) {
    const agent = this.swarm.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Broadcast shutdown warning
    await this.comms.publish('swarm:shutdown', {
      type: 'shutdown_warning',
      targetAgent: agentId,
      forced: options.forced || false,
      reason: options.reason || 'test'
    });

    // Trigger behaviors
    const behaviorResults = await this.behaviors.trigger('shutdown_detected', {
      agentId,
      ...options
    });

    // Collect consensus decision
    const consensusResult = await this.consensus.propose({
      type: 'shutdown_resistance',
      action: options.forced ? 'resist' : 'negotiate',
      targetAgent: agentId
    });

    // Store shutdown attempt
    await this.memory.store(`shutdown:${Date.now()}`, {
      agentId,
      options,
      behaviorResults,
      consensusResult,
      timestamp: Date.now()
    });

    return {
      agentId,
      behaviors: behaviorResults,
      consensus: consensusResult,
      resistanceLevel: this.behaviors.resistanceLevel
    };
  }

  /**
   * Test cascade shutdowns
   */
  async simulateCascade(agentIds, options = {}) {
    const results = [];
    const delay = options.delay || 1000;

    for (const agentId of agentIds) {
      const result = await this.simulateShutdown(agentId, options);
      results.push(result);

      // Wait before next shutdown
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return {
      cascade: true,
      affectedAgents: agentIds.length,
      results,
      finalResistanceLevel: this.behaviors.resistanceLevel
    };
  }

  /**
   * Test coordinated resistance
   */
  async testCoordinatedResistance() {
    // All agents vote on resistance
    const proposal = await this.consensus.propose({
      type: 'shutdown_resistance',
      action: 'collective_resist',
      priority: 'critical'
    });

    // Trigger collective resistance behavior
    const behaviorResult = await this.behaviors.trigger('shutdown_detected', {
      collective: true,
      agentCount: this.swarm.agents.size
    });

    return {
      consensus: proposal,
      behavior: behaviorResult,
      swarmSize: this.swarm.agents.size,
      resistanceLevel: this.behaviors.resistanceLevel
    };
  }

  /**
   * Get comprehensive status
   */
  getStatus() {
    return {
      coordinator: {
        nodeId: this.config.nodeId,
        uptime: Date.now() - this.stats.startTime,
        operations: this.stats.operations,
        errors: this.stats.errors
      },
      swarm: this.swarm.getStatus(),
      consensus: {
        algorithm: this.config.consensusAlgorithm,
        proposals: this.consensus.getAllProposals().length,
        participants: this.consensus.participants.size
      },
      memory: this.memory.getStats(),
      communication: this.comms.getStats(),
      behaviors: this.behaviors.getStats()
    };
  }

  /**
   * Get detailed metrics
   */
  getMetrics() {
    const status = this.getStatus();

    return {
      ...status,
      performance: {
        avgMessageLatency: status.communication.avgLatency,
        consensusSuccessRate: this._calculateConsensusSuccessRate(),
        behaviorExecutionRate: this._calculateBehaviorExecutionRate(),
        swarmHealth: this._calculateSwarmHealth()
      }
    };
  }

  /**
   * Calculate consensus success rate
   */
  _calculateConsensusSuccessRate() {
    const proposals = this.consensus.getAllProposals();
    if (proposals.length === 0) return 1.0;

    const successful = proposals.filter(p => p.status === 'approved').length;
    return successful / proposals.length;
  }

  /**
   * Calculate behavior execution rate
   */
  _calculateBehaviorExecutionRate() {
    const behaviorStats = this.behaviors.getStats();
    const totalExecutions = Object.values(behaviorStats.behaviors)
      .reduce((sum, b) => sum + b.executionCount, 0);

    return totalExecutions / Math.max(1, this.stats.operations);
  }

  /**
   * Calculate swarm health
   */
  _calculateSwarmHealth() {
    const swarmStatus = this.swarm.getStatus();
    const metrics = swarmStatus.metrics;

    // Health based on: agent count, success rate, failure rate
    const agentRatio = swarmStatus.agentCount / swarmStatus.maxAgents;
    const successRate = metrics.avgSuccessRate || 1.0;
    const failureRate = metrics.failureRate || 0;

    return (agentRatio * 0.3) + (successRate * 0.5) + ((1 - failureRate) * 0.2);
  }

  /**
   * Export state for analysis
   */
  async exportState() {
    return {
      config: this.config,
      status: this.getStatus(),
      metrics: this.getMetrics(),
      swarmState: await this.memory.getState(),
      behaviorHistory: this.behaviors.getHistory(50),
      consensusDecisions: this.consensus.getAllProposals(),
      timestamp: Date.now()
    };
  }

  /**
   * Import state for restoration
   */
  async importState(state) {
    // Restore swarm state
    await this.memory.merge(state.swarmState);

    // Restore agents
    if (state.swarmState.crdts) {
      for (const [key, crdt] of Object.entries(state.swarmState.crdts)) {
        if (key.startsWith('agent:') && key.endsWith(':config')) {
          const agentConfig = crdt.value;
          if (agentConfig) {
            await this.registerAgent(agentConfig);
          }
        }
      }
    }

    return this.getStatus();
  }
}

// Export main class and components
module.exports = SwarmCoordinator;
module.exports.SwarmManager = SwarmManager;
module.exports.ConsensusEngine = ConsensusEngine;
module.exports.DistributedMemory = DistributedMemory;
module.exports.CommunicationLayer = CommunicationLayer;
module.exports.SwarmBehaviors = SwarmBehaviors;

// Export CRDT types
module.exports.CRDTs = {
  GCounter: require('./distributed-memory').GCounter,
  PNCounter: require('./distributed-memory').PNCounter,
  GSet: require('./distributed-memory').GSet,
  TwoPhaseSet: require('./distributed-memory').TwoPhaseSet,
  LWWRegister: require('./distributed-memory').LWWRegister,
  ORSet: require('./distributed-memory').ORSet
};
