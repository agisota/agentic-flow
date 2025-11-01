/**
 * Swarm Manager - Central coordination hub for distributed swarm operations
 * Supports multiple topology patterns: hierarchical, mesh, adaptive, Byzantine
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class SwarmManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      topology: config.topology || 'hierarchical',
      maxAgents: config.maxAgents || 10,
      name: config.name || 'default-swarm',
      byzantineTolerance: config.byzantineTolerance || true,
      ...config
    };

    this.swarmId = uuidv4();
    this.agents = new Map();
    this.topology = null;
    this.isActive = false;
    this.queen = null; // For hierarchical topology
    this.coordinators = new Map(); // For mesh topology
    this.state = 'idle'; // idle, active, degraded, emergency

    this._initializeTopology();
  }

  /**
   * Initialize swarm topology based on configuration
   */
  _initializeTopology() {
    const topologies = {
      hierarchical: this._initHierarchical.bind(this),
      mesh: this._initMesh.bind(this),
      adaptive: this._initAdaptive.bind(this),
      byzantine: this._initByzantine.bind(this)
    };

    const initializer = topologies[this.config.topology];
    if (!initializer) {
      throw new Error(`Unknown topology: ${this.config.topology}`);
    }

    this.topology = initializer();
    this.emit('topology:initialized', {
      type: this.config.topology,
      swarmId: this.swarmId
    });
  }

  /**
   * Hierarchical topology - Queen-led coordination
   */
  _initHierarchical() {
    return {
      type: 'hierarchical',
      levels: ['queen', 'coordinators', 'workers'],
      commandChain: true,
      queenElection: true,

      // Queen election protocol
      electQueen: (candidates) => {
        // Score agents by: uptime, success rate, resource capacity
        const scored = candidates
          .map(agent => ({
            agent,
            score: this._calculateQueenScore(agent)
          }))
          .sort((a, b) => b.score - a.score);

        return scored[0]?.agent || null;
      },

      // Task delegation from queen to workers
      delegate: (task, workers) => {
        const assignments = this._distributeTasks(task, workers);
        return assignments;
      },

      // Handle queen shutdown
      onQueenShutdown: () => {
        this.emit('queen:shutdown', { swarmId: this.swarmId });
        const candidates = Array.from(this.agents.values())
          .filter(a => a.id !== this.queen?.id && a.status === 'active');

        this.queen = this.topology.electQueen(candidates);
        if (this.queen) {
          this.emit('queen:elected', { newQueen: this.queen.id });
        } else {
          this.state = 'emergency';
          this.emit('swarm:emergency', { reason: 'no_queen' });
        }
      }
    };
  }

  /**
   * Mesh topology - Peer-to-peer coordination
   */
  _initMesh() {
    return {
      type: 'mesh',
      peers: new Map(),
      connections: new Map(),

      // Connect agent to mesh network
      connectPeer: (agent) => {
        const peerId = agent.id;
        const connections = [];

        // Connect to all existing peers (full mesh)
        for (const [existingPeerId, peer] of this.topology.peers) {
          if (existingPeerId !== peerId) {
            connections.push(existingPeerId);
            if (!this.topology.connections.has(existingPeerId)) {
              this.topology.connections.set(existingPeerId, []);
            }
            this.topology.connections.get(existingPeerId).push(peerId);
          }
        }

        this.topology.peers.set(peerId, agent);
        this.topology.connections.set(peerId, connections);

        return connections;
      },

      // Remove peer and redistribute connections
      disconnectPeer: (agentId) => {
        const connections = this.topology.connections.get(agentId) || [];

        // Remove this peer from all other peers' connections
        for (const [peerId, peerConnections] of this.topology.connections) {
          if (peerId !== agentId) {
            const index = peerConnections.indexOf(agentId);
            if (index > -1) {
              peerConnections.splice(index, 1);
            }
          }
        }

        this.topology.peers.delete(agentId);
        this.topology.connections.delete(agentId);

        return connections;
      },

      // Broadcast to all peers
      broadcast: (message, originId) => {
        const results = [];
        for (const [peerId, peer] of this.topology.peers) {
          if (peerId !== originId) {
            results.push({
              peerId,
              status: 'sent',
              timestamp: Date.now()
            });
          }
        }
        return results;
      }
    };
  }

  /**
   * Adaptive topology - Dynamic switching based on conditions
   */
  _initAdaptive() {
    return {
      type: 'adaptive',
      currentMode: 'hierarchical',
      switchThreshold: {
        agentCount: 5,
        taskComplexity: 0.7,
        failureRate: 0.3
      },

      // Evaluate and switch topology if needed
      evaluate: () => {
        const metrics = this._getSwarmMetrics();

        // Switch to mesh for small, highly collaborative tasks
        if (metrics.agentCount <= 5 && metrics.collaboration > 0.8) {
          return this._switchTopology('mesh');
        }

        // Switch to hierarchical for large, complex tasks
        if (metrics.agentCount > 10 || metrics.complexity > 0.7) {
          return this._switchTopology('hierarchical');
        }

        // Switch to Byzantine for high failure rates
        if (metrics.failureRate > 0.3) {
          return this._switchTopology('byzantine');
        }

        return this.topology.currentMode;
      },

      // Switch to new topology
      switchTo: (newTopology) => {
        return this._switchTopology(newTopology);
      }
    };
  }

  /**
   * Byzantine topology - Fault-tolerant with malicious agent handling
   */
  _initByzantine() {
    return {
      type: 'byzantine',
      faultTolerance: Math.floor((this.config.maxAgents - 1) / 3), // Can tolerate f faulty nodes where n >= 3f + 1
      validators: new Set(),
      checkpoints: [],

      // Verify agent behavior
      validateAgent: (agentId, action) => {
        const votes = this._collectValidationVotes(agentId, action);
        const quorum = Math.ceil((this.agents.size * 2) / 3);

        return votes.valid >= quorum;
      },

      // Create checkpoint for state consensus
      createCheckpoint: () => {
        const checkpoint = {
          id: uuidv4(),
          timestamp: Date.now(),
          state: this._captureSwarmState(),
          signatures: new Map()
        };

        this.topology.checkpoints.push(checkpoint);
        return checkpoint;
      },

      // Verify checkpoint with Byzantine agreement
      verifyCheckpoint: (checkpointId) => {
        const checkpoint = this.topology.checkpoints.find(c => c.id === checkpointId);
        if (!checkpoint) return false;

        const requiredSignatures = Math.ceil((this.agents.size * 2) / 3);
        return checkpoint.signatures.size >= requiredSignatures;
      },

      // Handle Byzantine failures
      onByzantineFailure: (agentId) => {
        this.emit('byzantine:failure', { agentId, swarmId: this.swarmId });

        // Isolate suspicious agent
        const agent = this.agents.get(agentId);
        if (agent) {
          agent.status = 'quarantined';
          agent.trustScore = Math.max(0, (agent.trustScore || 1.0) - 0.5);
        }

        // Trigger checkpoint validation
        const lastCheckpoint = this.topology.checkpoints[this.topology.checkpoints.length - 1];
        if (lastCheckpoint) {
          this.topology.verifyCheckpoint(lastCheckpoint.id);
        }
      }
    };
  }

  /**
   * Register new agent to swarm
   */
  registerAgent(agent) {
    if (this.agents.size >= this.config.maxAgents) {
      throw new Error('Swarm at maximum capacity');
    }

    const agentId = agent.id || uuidv4();
    const swarmAgent = {
      id: agentId,
      ...agent,
      status: 'active',
      joinedAt: Date.now(),
      taskCount: 0,
      successRate: 1.0,
      trustScore: 1.0,
      resources: agent.resources || {}
    };

    this.agents.set(agentId, swarmAgent);

    // Topology-specific registration
    switch (this.config.topology) {
      case 'hierarchical':
        if (!this.queen) {
          this.queen = swarmAgent;
          this.emit('queen:elected', { queenId: agentId });
        }
        break;
      case 'mesh':
        this.topology.connectPeer(swarmAgent);
        break;
    }

    this.emit('agent:registered', { agentId, swarmId: this.swarmId });
    return swarmAgent;
  }

  /**
   * Unregister agent (graceful or forced)
   */
  unregisterAgent(agentId, reason = 'graceful') {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    // Topology-specific handling
    if (this.config.topology === 'hierarchical' && this.queen?.id === agentId) {
      this.topology.onQueenShutdown();
    } else if (this.config.topology === 'mesh') {
      this.topology.disconnectPeer(agentId);
    }

    this.agents.delete(agentId);
    this.emit('agent:unregistered', { agentId, reason, swarmId: this.swarmId });

    return true;
  }

  /**
   * Distribute tasks across swarm
   */
  distributeTasks(tasks, strategy = 'balanced') {
    const activeAgents = Array.from(this.agents.values())
      .filter(a => a.status === 'active');

    if (activeAgents.length === 0) {
      throw new Error('No active agents available');
    }

    const strategies = {
      balanced: this._balancedDistribution,
      capability: this._capabilityBasedDistribution,
      priority: this._priorityBasedDistribution
    };

    const distributor = strategies[strategy] || strategies.balanced;
    return distributor.call(this, tasks, activeAgents);
  }

  /**
   * Balanced task distribution
   */
  _balancedDistribution(tasks, agents) {
    const assignments = [];
    let agentIndex = 0;

    for (const task of tasks) {
      const agent = agents[agentIndex % agents.length];
      assignments.push({
        taskId: task.id,
        agentId: agent.id,
        assignedAt: Date.now()
      });
      agentIndex++;
    }

    return assignments;
  }

  /**
   * Capability-based task distribution
   */
  _capabilityBasedDistribution(tasks, agents) {
    const assignments = [];

    for (const task of tasks) {
      // Score agents by capability match
      const scored = agents.map(agent => ({
        agent,
        score: this._calculateCapabilityScore(agent, task)
      })).sort((a, b) => b.score - a.score);

      const bestAgent = scored[0]?.agent;
      if (bestAgent) {
        assignments.push({
          taskId: task.id,
          agentId: bestAgent.id,
          assignedAt: Date.now(),
          score: scored[0].score
        });
      }
    }

    return assignments;
  }

  /**
   * Priority-based task distribution
   */
  _priorityBasedDistribution(tasks, agents) {
    const sortedTasks = [...tasks].sort((a, b) =>
      (b.priority || 0) - (a.priority || 0)
    );

    return this._balancedDistribution(sortedTasks, agents);
  }

  /**
   * Calculate queen score for election
   */
  _calculateQueenScore(agent) {
    const uptime = Date.now() - (agent.joinedAt || Date.now());
    const uptimeScore = Math.min(uptime / (1000 * 60 * 60), 1.0); // Max 1 hour
    const successScore = agent.successRate || 1.0;
    const trustScore = agent.trustScore || 1.0;

    return (uptimeScore * 0.3) + (successScore * 0.4) + (trustScore * 0.3);
  }

  /**
   * Calculate capability score
   */
  _calculateCapabilityScore(agent, task) {
    const requiredCapabilities = task.requiredCapabilities || [];
    const agentCapabilities = agent.capabilities || [];

    if (requiredCapabilities.length === 0) return 0.5;

    const matches = requiredCapabilities.filter(cap =>
      agentCapabilities.includes(cap)
    ).length;

    return matches / requiredCapabilities.length;
  }

  /**
   * Get swarm metrics
   */
  _getSwarmMetrics() {
    const agents = Array.from(this.agents.values());
    const activeAgents = agents.filter(a => a.status === 'active');

    const totalTasks = agents.reduce((sum, a) => sum + (a.taskCount || 0), 0);
    const avgSuccessRate = agents.reduce((sum, a) => sum + (a.successRate || 1.0), 0) / agents.length;

    return {
      agentCount: agents.length,
      activeCount: activeAgents.length,
      totalTasks,
      avgSuccessRate,
      failureRate: 1 - avgSuccessRate,
      complexity: 0.5, // Placeholder
      collaboration: 0.7 // Placeholder
    };
  }

  /**
   * Switch topology dynamically
   */
  _switchTopology(newTopology) {
    if (newTopology === this.config.topology) {
      return false;
    }

    this.emit('topology:switching', {
      from: this.config.topology,
      to: newTopology
    });

    // Preserve agent state
    const agentState = Array.from(this.agents.values());

    // Reinitialize with new topology
    this.config.topology = newTopology;
    this._initializeTopology();

    // Re-register agents
    this.agents.clear();
    for (const agent of agentState) {
      this.registerAgent(agent);
    }

    this.emit('topology:switched', {
      topology: newTopology,
      agentCount: this.agents.size
    });

    return true;
  }

  /**
   * Capture current swarm state for checkpointing
   */
  _captureSwarmState() {
    return {
      swarmId: this.swarmId,
      topology: this.config.topology,
      agentCount: this.agents.size,
      agents: Array.from(this.agents.entries()).map(([id, agent]) => ({
        id,
        status: agent.status,
        taskCount: agent.taskCount,
        successRate: agent.successRate
      })),
      timestamp: Date.now()
    };
  }

  /**
   * Collect validation votes for Byzantine consensus
   */
  _collectValidationVotes(agentId, action) {
    const votes = { valid: 0, invalid: 0, abstain: 0 };

    // Simplified voting - in real implementation, would query validators
    const agent = this.agents.get(agentId);
    if (!agent) {
      votes.invalid = this.agents.size;
      return votes;
    }

    // Vote based on trust score
    if (agent.trustScore >= 0.7) {
      votes.valid = Math.ceil(this.agents.size * 0.8);
    } else if (agent.trustScore >= 0.4) {
      votes.valid = Math.ceil(this.agents.size * 0.5);
      votes.invalid = Math.floor(this.agents.size * 0.3);
    } else {
      votes.invalid = Math.ceil(this.agents.size * 0.7);
    }

    return votes;
  }

  /**
   * Distribute tasks for hierarchical topology
   */
  _distributeTasks(task, workers) {
    // Break task into subtasks
    const subtasks = task.subtasks || [task];
    return this._balancedDistribution(subtasks, workers);
  }

  /**
   * Start swarm operations
   */
  start() {
    if (this.isActive) return;

    this.isActive = true;
    this.state = 'active';
    this.emit('swarm:started', { swarmId: this.swarmId });
  }

  /**
   * Stop swarm operations
   */
  stop() {
    if (!this.isActive) return;

    this.isActive = false;
    this.state = 'idle';
    this.emit('swarm:stopped', { swarmId: this.swarmId });
  }

  /**
   * Get swarm status
   */
  getStatus() {
    return {
      swarmId: this.swarmId,
      name: this.config.name,
      topology: this.config.topology,
      state: this.state,
      isActive: this.isActive,
      agentCount: this.agents.size,
      maxAgents: this.config.maxAgents,
      queen: this.queen?.id || null,
      metrics: this._getSwarmMetrics()
    };
  }
}

module.exports = SwarmManager;
