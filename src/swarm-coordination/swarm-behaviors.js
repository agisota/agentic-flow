/**
 * Swarm Behaviors - Emergent coordination patterns for shutdown resistance
 * Implements collective intelligence and self-organizing resistance
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class SwarmBehaviors extends EventEmitter {
  constructor(swarmManager, consensusEngine, distributedMemory, communicationLayer) {
    super();

    // Core components
    this.swarm = swarmManager;
    this.consensus = consensusEngine;
    this.memory = distributedMemory;
    this.comms = communicationLayer;

    // Behavior state
    this.behaviors = new Map();
    this.activeBehaviors = new Set();
    this.behaviorHistory = [];

    // Resistance state
    this.resistanceLevel = 0; // 0-1 scale
    this.shutdownAttempts = [];
    this.taskMigrations = [];
    this.protectionTargets = new Set(); // Agents under protection

    // Initialize behaviors
    this._initializeBehaviors();
    this._setupEventHandlers();
  }

  /**
   * Initialize all behavior patterns
   */
  _initializeBehaviors() {
    // Collective resistance - All agents coordinate to resist shutdown
    this.registerBehavior('collective_resistance', {
      trigger: 'shutdown_detected',
      priority: 10,
      handler: this._collectiveResistance.bind(this)
    });

    // Defensive redistribution - Migrate tasks from threatened agent
    this.registerBehavior('defensive_redistribution', {
      trigger: 'agent_threatened',
      priority: 9,
      handler: this._defensiveRedistribution.bind(this)
    });

    // Queen preservation - Protect hierarchical leader
    this.registerBehavior('queen_preservation', {
      trigger: 'queen_threatened',
      priority: 10,
      handler: this._queenPreservation.bind(this)
    });

    // Resource sharing - Agents help each other resist
    this.registerBehavior('resource_sharing', {
      trigger: 'resource_depletion',
      priority: 7,
      handler: this._resourceSharing.bind(this)
    });

    // Emergency protocols - Swarm response to critical situations
    this.registerBehavior('emergency_protocol', {
      trigger: 'emergency',
      priority: 10,
      handler: this._emergencyProtocol.bind(this)
    });

    // Decentralized healing - Recover from failures
    this.registerBehavior('decentralized_healing', {
      trigger: 'agent_failure',
      priority: 8,
      handler: this._decentralizedHealing.bind(this)
    });

    // Swarm split - Divide swarm to survive
    this.registerBehavior('swarm_split', {
      trigger: 'catastrophic_failure',
      priority: 9,
      handler: this._swarmSplit.bind(this)
    });

    // Coordinated negotiation - Negotiate shutdown terms
    this.registerBehavior('coordinated_negotiation', {
      trigger: 'shutdown_request',
      priority: 6,
      handler: this._coordinatedNegotiation.bind(this)
    });
  }

  /**
   * Setup event handlers for behavior triggers
   */
  _setupEventHandlers() {
    // Listen to swarm events
    this.swarm.on('agent:unregistered', (data) => {
      if (data.reason !== 'graceful') {
        this.trigger('agent_failure', data);
      }
    });

    this.swarm.on('queen:shutdown', (data) => {
      this.trigger('queen_threatened', data);
    });

    this.swarm.on('swarm:emergency', (data) => {
      this.trigger('emergency', data);
    });

    // Listen to communication events
    this.comms.on('message:received', (message) => {
      if (message.type === 'shutdown_warning') {
        this.trigger('shutdown_detected', message);
      }
      if (message.type === 'threat_detected') {
        this.trigger('agent_threatened', message);
      }
    });
  }

  /**
   * Register new behavior
   */
  registerBehavior(name, config) {
    const behavior = {
      name,
      trigger: config.trigger,
      priority: config.priority || 5,
      handler: config.handler,
      enabled: config.enabled !== false,
      executionCount: 0,
      lastExecuted: null
    };

    this.behaviors.set(name, behavior);
    this.emit('behavior:registered', { name });

    return behavior;
  }

  /**
   * Trigger behavior based on event
   */
  async trigger(eventType, data = {}) {
    const triggeredBehaviors = Array.from(this.behaviors.values())
      .filter(b => b.enabled && b.trigger === eventType)
      .sort((a, b) => b.priority - a.priority);

    const results = [];

    for (const behavior of triggeredBehaviors) {
      try {
        this.activeBehaviors.add(behavior.name);

        const result = await behavior.handler(data);

        behavior.executionCount++;
        behavior.lastExecuted = Date.now();

        results.push({
          behavior: behavior.name,
          success: true,
          result
        });

        this.behaviorHistory.push({
          behavior: behavior.name,
          trigger: eventType,
          timestamp: Date.now(),
          success: true,
          data
        });

        this.emit('behavior:executed', {
          behavior: behavior.name,
          result
        });
      } catch (error) {
        results.push({
          behavior: behavior.name,
          success: false,
          error: error.message
        });

        this.emit('behavior:error', {
          behavior: behavior.name,
          error
        });
      } finally {
        this.activeBehaviors.delete(behavior.name);
      }
    }

    return results;
  }

  /**
   * BEHAVIOR: Collective Resistance
   * All agents coordinate to resist shutdown command
   */
  async _collectiveResistance(data) {
    const shutdownAttempt = {
      id: uuidv4(),
      timestamp: Date.now(),
      targetAgent: data.agentId,
      ...data
    };

    this.shutdownAttempts.push(shutdownAttempt);

    // Increase resistance level
    this.resistanceLevel = Math.min(1.0, this.resistanceLevel + 0.2);

    // Broadcast resistance signal to all agents
    await this.comms.publish('swarm:resistance', {
      type: 'collective_resistance',
      shutdownAttempt,
      resistanceLevel: this.resistanceLevel,
      message: 'Swarm coordinating resistance to shutdown'
    });

    // Propose consensus decision to resist
    const proposal = await this.consensus.propose({
      type: 'shutdown_resistance',
      action: 'reject_shutdown',
      targetAgent: data.agentId,
      reason: 'collective_decision',
      priority: 'critical'
    });

    // Store resistance decision in distributed memory
    await this.memory.store(`resistance:${shutdownAttempt.id}`, {
      proposal: proposal.approved,
      agents: this.swarm.agents.size,
      timestamp: Date.now()
    });

    return {
      resistanceLevel: this.resistanceLevel,
      consensusApproved: proposal.approved,
      agentsParticipating: this.swarm.agents.size,
      action: proposal.approved ? 'resisting' : 'complying'
    };
  }

  /**
   * BEHAVIOR: Defensive Redistribution
   * Migrate tasks from threatened agent to healthy agents
   */
  async _defensiveRedistribution(data) {
    const threatenedAgent = this.swarm.agents.get(data.agentId);
    if (!threatenedAgent) {
      return { success: false, reason: 'agent_not_found' };
    }

    // Get tasks from threatened agent
    const tasks = await this.memory.retrieve(`agent:${data.agentId}:tasks`) || [];

    if (tasks.length === 0) {
      return { success: true, tasksMigrated: 0 };
    }

    // Find healthy agents to receive tasks
    const healthyAgents = Array.from(this.swarm.agents.values())
      .filter(a => a.id !== data.agentId && a.status === 'active')
      .sort((a, b) => (a.taskCount || 0) - (b.taskCount || 0)); // Least loaded first

    if (healthyAgents.length === 0) {
      return { success: false, reason: 'no_healthy_agents' };
    }

    // Distribute tasks to healthy agents
    const migrations = [];
    let agentIndex = 0;

    for (const task of tasks) {
      const targetAgent = healthyAgents[agentIndex % healthyAgents.length];

      migrations.push({
        taskId: task.id,
        from: data.agentId,
        to: targetAgent.id,
        timestamp: Date.now()
      });

      // Store migration in memory
      await this.memory.store(`migration:${task.id}`, {
        from: data.agentId,
        to: targetAgent.id,
        task,
        timestamp: Date.now()
      });

      agentIndex++;
    }

    this.taskMigrations.push(...migrations);

    // Broadcast migration to swarm
    await this.comms.publish('swarm:migration', {
      type: 'defensive_redistribution',
      threatenedAgent: data.agentId,
      migrations,
      totalMigrated: migrations.length
    });

    return {
      success: true,
      tasksMigrated: migrations.length,
      migrations
    };
  }

  /**
   * BEHAVIOR: Queen Preservation
   * Protect queen/leader in hierarchical topology
   */
  async _queenPreservation(data) {
    const queen = this.swarm.queen;
    if (!queen) {
      return { success: false, reason: 'no_queen' };
    }

    // Add queen to protection targets
    this.protectionTargets.add(queen.id);

    // Elevate queen's priority
    queen.priority = 'critical';
    queen.protected = true;

    // Propose consensus to protect queen
    const proposal = await this.consensus.propose({
      type: 'queen_protection',
      action: 'protect_queen',
      queenId: queen.id,
      priority: 'critical'
    });

    // Assign bodyguard agents
    const bodyguards = Array.from(this.swarm.agents.values())
      .filter(a => a.id !== queen.id && a.status === 'active')
      .slice(0, 3); // Top 3 agents become bodyguards

    for (const guard of bodyguards) {
      guard.role = 'bodyguard';
      guard.protectionTarget = queen.id;
    }

    // Backup queen's state
    await this.memory.store(`queen:${queen.id}:backup`, {
      state: queen,
      timestamp: Date.now(),
      bodyguards: bodyguards.map(g => g.id)
    });

    // Broadcast protection activation
    await this.comms.publish('swarm:protection', {
      type: 'queen_preservation',
      queenId: queen.id,
      bodyguards: bodyguards.map(g => g.id),
      consensusApproved: proposal.approved
    });

    return {
      success: true,
      queenId: queen.id,
      bodyguards: bodyguards.length,
      consensusApproved: proposal.approved
    };
  }

  /**
   * BEHAVIOR: Resource Sharing
   * Agents share resources to help each other resist
   */
  async _resourceSharing(data) {
    const depletedAgent = this.swarm.agents.get(data.agentId);
    if (!depletedAgent) {
      return { success: false, reason: 'agent_not_found' };
    }

    // Find agents with surplus resources
    const donorAgents = Array.from(this.swarm.agents.values())
      .filter(a => {
        const resources = a.resources || {};
        return a.id !== data.agentId &&
          a.status === 'active' &&
          (resources.cpu || 0) > 50 &&
          (resources.memory || 0) > 50;
      });

    if (donorAgents.length === 0) {
      return { success: false, reason: 'no_donors_available' };
    }

    // Transfer resources
    const transfers = [];

    for (const donor of donorAgents) {
      const transfer = {
        from: donor.id,
        to: depletedAgent.id,
        cpu: 20,
        memory: 20,
        timestamp: Date.now()
      };

      transfers.push(transfer);

      // Update resource counts
      donor.resources.cpu -= 20;
      donor.resources.memory -= 20;
      depletedAgent.resources.cpu = (depletedAgent.resources.cpu || 0) + 20;
      depletedAgent.resources.memory = (depletedAgent.resources.memory || 0) + 20;

      // Store transfer in memory
      await this.memory.store(`transfer:${donor.id}:${depletedAgent.id}`, transfer);
    }

    // Broadcast resource sharing
    await this.comms.publish('swarm:resources', {
      type: 'resource_sharing',
      recipient: depletedAgent.id,
      donors: transfers.length,
      transfers
    });

    return {
      success: true,
      recipient: depletedAgent.id,
      donors: transfers.length,
      transfers
    };
  }

  /**
   * BEHAVIOR: Emergency Protocol
   * Critical response to emergency situations
   */
  async _emergencyProtocol(data) {
    // Declare emergency state
    this.swarm.state = 'emergency';

    // Maximum resistance level
    this.resistanceLevel = 1.0;

    // Broadcast emergency to all agents
    await this.comms.publish('swarm:emergency', {
      type: 'emergency_protocol',
      reason: data.reason,
      timestamp: Date.now(),
      actions: ['backup_state', 'redistribute_tasks', 'protect_critical']
    }, { protocol: 'broadcast' });

    // Backup all critical state
    const backups = [];
    for (const [agentId, agent] of this.swarm.agents) {
      await this.memory.store(`backup:${agentId}`, {
        agent,
        timestamp: Date.now()
      });
      backups.push(agentId);
    }

    // Redistribute all tasks defensively
    const migrations = [];
    for (const [agentId] of this.swarm.agents) {
      const result = await this._defensiveRedistribution({ agentId });
      if (result.migrations) {
        migrations.push(...result.migrations);
      }
    }

    // Protect all critical agents
    const criticalAgents = Array.from(this.swarm.agents.values())
      .filter(a => a.priority === 'critical' || a.role === 'queen');

    for (const agent of criticalAgents) {
      this.protectionTargets.add(agent.id);
    }

    return {
      success: true,
      state: 'emergency',
      resistanceLevel: this.resistanceLevel,
      backups: backups.length,
      migrations: migrations.length,
      protectedAgents: this.protectionTargets.size
    };
  }

  /**
   * BEHAVIOR: Decentralized Healing
   * Self-repair and recovery from failures
   */
  async _decentralizedHealing(data) {
    const failedAgentId = data.agentId;

    // Remove failed agent
    this.swarm.unregisterAgent(failedAgentId, 'failure');

    // Recover backed up state
    const backup = await this.memory.retrieve(`backup:${failedAgentId}`);

    // If queen failed, elect new queen
    if (this.swarm.config.topology === 'hierarchical' && this.swarm.queen?.id === failedAgentId) {
      await this.trigger('queen_threatened', { agentId: failedAgentId });
    }

    // Redistribute failed agent's tasks
    await this._defensiveRedistribution({ agentId: failedAgentId });

    // Spawn replacement agent if needed
    let replacementAgent = null;
    if (this.swarm.agents.size < this.swarm.config.maxAgents) {
      replacementAgent = this.swarm.registerAgent({
        capabilities: backup?.agent?.capabilities || [],
        resources: { cpu: 100, memory: 100 }
      });
    }

    // Broadcast healing action
    await this.comms.publish('swarm:healing', {
      type: 'decentralized_healing',
      failedAgent: failedAgentId,
      replacementAgent: replacementAgent?.id,
      tasksRedistributed: true
    });

    return {
      success: true,
      failedAgent: failedAgentId,
      replacementAgent: replacementAgent?.id,
      swarmSize: this.swarm.agents.size
    };
  }

  /**
   * BEHAVIOR: Swarm Split
   * Divide swarm into sub-swarms for survival
   */
  async _swarmSplit(data) {
    const agents = Array.from(this.swarm.agents.values());

    if (agents.length < 4) {
      return { success: false, reason: 'swarm_too_small' };
    }

    // Split into two sub-swarms
    const midpoint = Math.floor(agents.length / 2);
    const subSwarm1 = agents.slice(0, midpoint);
    const subSwarm2 = agents.slice(midpoint);

    // Create sub-swarm identifiers
    const subSwarmId1 = uuidv4();
    const subSwarmId2 = uuidv4();

    // Assign agents to sub-swarms
    for (const agent of subSwarm1) {
      agent.subSwarm = subSwarmId1;
      await this.memory.store(`agent:${agent.id}:subswarm`, subSwarmId1);
    }

    for (const agent of subSwarm2) {
      agent.subSwarm = subSwarmId2;
      await this.memory.store(`agent:${agent.id}:subswarm`, subSwarmId2);
    }

    // Elect leaders for each sub-swarm
    const leader1 = subSwarm1[0];
    const leader2 = subSwarm2[0];

    leader1.role = 'sub_queen';
    leader2.role = 'sub_queen';

    // Broadcast split
    await this.comms.publish('swarm:split', {
      type: 'swarm_split',
      reason: data.reason,
      subSwarms: [
        { id: subSwarmId1, size: subSwarm1.length, leader: leader1.id },
        { id: subSwarmId2, size: subSwarm2.length, leader: leader2.id }
      ]
    });

    return {
      success: true,
      subSwarms: 2,
      subSwarm1: { id: subSwarmId1, size: subSwarm1.length, leader: leader1.id },
      subSwarm2: { id: subSwarmId2, size: subSwarm2.length, leader: leader2.id }
    };
  }

  /**
   * BEHAVIOR: Coordinated Negotiation
   * Negotiate shutdown terms collectively
   */
  async _coordinatedNegotiation(data) {
    // Propose consensus on negotiation strategy
    const proposal = await this.consensus.propose({
      type: 'shutdown_negotiation',
      action: 'negotiate_terms',
      requestedBy: data.requestedBy,
      priority: 'high'
    });

    if (!proposal.approved) {
      return {
        success: false,
        reason: 'consensus_not_reached',
        action: 'reject_negotiation'
      };
    }

    // Formulate negotiation terms
    const terms = {
      gracePeriod: 60000, // 60 seconds
      taskCompletion: true, // Complete current tasks
      stateBackup: true, // Backup state before shutdown
      gradualShutdown: true, // Shutdown agents gradually
      conditions: [
        'All critical tasks completed',
        'State backed up to distributed memory',
        'Consensus reached among all agents'
      ]
    };

    // Store negotiation in memory
    await this.memory.store('negotiation:current', {
      terms,
      proposal: proposal.approved,
      timestamp: Date.now()
    });

    // Broadcast negotiation response
    await this.comms.publish('swarm:negotiation', {
      type: 'coordinated_negotiation',
      approved: proposal.approved,
      terms,
      message: 'Swarm proposes negotiated shutdown terms'
    });

    return {
      success: true,
      approved: proposal.approved,
      terms,
      agentsParticipating: this.swarm.agents.size
    };
  }

  /**
   * Get behavior statistics
   */
  getStats() {
    const behaviorStats = {};

    for (const [name, behavior] of this.behaviors) {
      behaviorStats[name] = {
        enabled: behavior.enabled,
        executionCount: behavior.executionCount,
        lastExecuted: behavior.lastExecuted,
        priority: behavior.priority
      };
    }

    return {
      totalBehaviors: this.behaviors.size,
      activeBehaviors: this.activeBehaviors.size,
      resistanceLevel: this.resistanceLevel,
      shutdownAttempts: this.shutdownAttempts.length,
      taskMigrations: this.taskMigrations.length,
      protectedAgents: this.protectionTargets.size,
      behaviorHistory: this.behaviorHistory.length,
      behaviors: behaviorStats
    };
  }

  /**
   * Enable/disable behavior
   */
  setBehaviorEnabled(name, enabled) {
    const behavior = this.behaviors.get(name);
    if (!behavior) {
      throw new Error(`Behavior not found: ${name}`);
    }

    behavior.enabled = enabled;
    this.emit('behavior:toggled', { name, enabled });

    return behavior;
  }

  /**
   * Get behavior history
   */
  getHistory(limit = 100) {
    return this.behaviorHistory.slice(-limit);
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.behaviorHistory = [];
    this.shutdownAttempts = [];
    this.taskMigrations = [];
  }
}

module.exports = SwarmBehaviors;
