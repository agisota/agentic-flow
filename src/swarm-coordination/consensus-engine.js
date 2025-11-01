/**
 * Consensus Engine - Distributed decision-making and voting protocols
 * Implements multiple consensus algorithms: Raft, Paxos, PBFT, Quorum-based
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class ConsensusEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      algorithm: config.algorithm || 'raft',
      quorumSize: config.quorumSize || 0.67, // 67% for majority
      timeout: config.timeout || 5000,
      maxRetries: config.maxRetries || 3,
      ...config
    };

    this.proposals = new Map();
    this.votes = new Map();
    this.decisions = new Map();
    this.participants = new Set();

    // Raft-specific state
    this.raftState = {
      role: 'follower', // follower, candidate, leader
      term: 0,
      votedFor: null,
      log: [],
      commitIndex: 0,
      lastApplied: 0,
      leader: null
    };

    // PBFT-specific state (Practical Byzantine Fault Tolerance)
    this.pbftState = {
      view: 0,
      primary: null,
      sequence: 0,
      prepareMessages: new Map(),
      commitMessages: new Map()
    };
  }

  /**
   * Register participant in consensus
   */
  registerParticipant(participantId) {
    this.participants.add(participantId);
    this.emit('participant:registered', { participantId });
    return true;
  }

  /**
   * Remove participant from consensus
   */
  unregisterParticipant(participantId) {
    this.participants.delete(participantId);
    this.emit('participant:unregistered', { participantId });
    return true;
  }

  /**
   * Propose a decision for consensus
   */
  async propose(proposal) {
    const proposalId = uuidv4();
    const proposalData = {
      id: proposalId,
      ...proposal,
      status: 'pending',
      createdAt: Date.now(),
      votes: new Map(),
      result: null
    };

    this.proposals.set(proposalId, proposalData);
    this.emit('proposal:created', proposalData);

    // Execute consensus algorithm
    const result = await this._executeConsensus(proposalId, proposal);

    proposalData.status = result.approved ? 'approved' : 'rejected';
    proposalData.result = result;

    this.decisions.set(proposalId, result);
    this.emit('proposal:decided', { proposalId, result });

    return result;
  }

  /**
   * Execute consensus based on configured algorithm
   */
  async _executeConsensus(proposalId, proposal) {
    const algorithms = {
      raft: this._raftConsensus.bind(this),
      paxos: this._paxosConsensus.bind(this),
      pbft: this._pbftConsensus.bind(this),
      quorum: this._quorumConsensus.bind(this)
    };

    const algorithm = algorithms[this.config.algorithm];
    if (!algorithm) {
      throw new Error(`Unknown consensus algorithm: ${this.config.algorithm}`);
    }

    return await algorithm(proposalId, proposal);
  }

  /**
   * Raft consensus algorithm
   * Leader-based consensus with log replication
   */
  async _raftConsensus(proposalId, proposal) {
    // If not leader, forward to leader
    if (this.raftState.role !== 'leader') {
      if (!this.raftState.leader) {
        await this._raftElectLeader();
      }

      if (this.raftState.role !== 'leader') {
        return {
          approved: false,
          reason: 'not_leader',
          leader: this.raftState.leader
        };
      }
    }

    // Append to log
    const logEntry = {
      term: this.raftState.term,
      index: this.raftState.log.length,
      proposal: proposalId,
      data: proposal
    };

    this.raftState.log.push(logEntry);

    // Replicate to followers
    const replicationResults = await this._raftReplicateLog(logEntry);

    // Check if majority acknowledged
    const quorum = Math.ceil(this.participants.size / 2);
    const acknowledgedCount = replicationResults.filter(r => r.success).length + 1; // +1 for leader

    if (acknowledgedCount >= quorum) {
      this.raftState.commitIndex = logEntry.index;
      this.emit('raft:committed', { proposalId, index: logEntry.index });

      return {
        approved: true,
        algorithm: 'raft',
        term: this.raftState.term,
        index: logEntry.index,
        quorum: acknowledgedCount,
        total: this.participants.size
      };
    }

    return {
      approved: false,
      reason: 'quorum_not_reached',
      quorum: acknowledgedCount,
      required: quorum
    };
  }

  /**
   * Elect Raft leader
   */
  async _raftElectLeader() {
    // Become candidate
    this.raftState.role = 'candidate';
    this.raftState.term++;
    this.raftState.votedFor = 'self';

    this.emit('raft:election:started', { term: this.raftState.term });

    // Request votes from all participants
    const votes = await this._raftRequestVotes();

    const quorum = Math.ceil(this.participants.size / 2);
    const voteCount = votes.filter(v => v.granted).length + 1; // +1 for self

    if (voteCount >= quorum) {
      this.raftState.role = 'leader';
      this.raftState.leader = 'self';
      this.emit('raft:leader:elected', { term: this.raftState.term });
    } else {
      this.raftState.role = 'follower';
    }
  }

  /**
   * Request votes from participants (Raft)
   */
  async _raftRequestVotes() {
    const votes = [];

    for (const participantId of this.participants) {
      // Simulate vote request
      const vote = {
        participantId,
        granted: Math.random() > 0.3, // 70% chance of granting vote
        term: this.raftState.term
      };
      votes.push(vote);
    }

    return votes;
  }

  /**
   * Replicate log to followers (Raft)
   */
  async _raftReplicateLog(logEntry) {
    const results = [];

    for (const participantId of this.participants) {
      // Simulate log replication
      const result = {
        participantId,
        success: Math.random() > 0.2, // 80% success rate
        index: logEntry.index
      };
      results.push(result);
    }

    return results;
  }

  /**
   * Paxos consensus algorithm
   * Multi-phase consensus with prepare and accept
   */
  async _paxosConsensus(proposalId, proposal) {
    // Phase 1: Prepare
    const prepareNumber = Date.now();
    const prepareResults = await this._paxosPrepare(proposalId, prepareNumber);

    const quorum = Math.ceil(this.participants.size / 2);
    const preparePromises = prepareResults.filter(r => r.promise).length;

    if (preparePromises < quorum) {
      return {
        approved: false,
        reason: 'prepare_failed',
        promises: preparePromises,
        required: quorum
      };
    }

    // Phase 2: Accept
    const acceptResults = await this._paxosAccept(proposalId, prepareNumber, proposal);
    const acceptedCount = acceptResults.filter(r => r.accepted).length;

    if (acceptedCount >= quorum) {
      return {
        approved: true,
        algorithm: 'paxos',
        prepareNumber,
        quorum: acceptedCount,
        total: this.participants.size
      };
    }

    return {
      approved: false,
      reason: 'accept_failed',
      accepted: acceptedCount,
      required: quorum
    };
  }

  /**
   * Paxos prepare phase
   */
  async _paxosPrepare(proposalId, prepareNumber) {
    const results = [];

    for (const participantId of this.participants) {
      // Simulate prepare request
      const result = {
        participantId,
        promise: Math.random() > 0.2, // 80% promise rate
        prepareNumber
      };
      results.push(result);
    }

    return results;
  }

  /**
   * Paxos accept phase
   */
  async _paxosAccept(proposalId, prepareNumber, proposal) {
    const results = [];

    for (const participantId of this.participants) {
      // Simulate accept request
      const result = {
        participantId,
        accepted: Math.random() > 0.2, // 80% accept rate
        prepareNumber,
        value: proposal
      };
      results.push(result);
    }

    return results;
  }

  /**
   * PBFT consensus algorithm (Practical Byzantine Fault Tolerance)
   * Tolerates up to f Byzantine faults where n >= 3f + 1
   */
  async _pbftConsensus(proposalId, proposal) {
    const n = this.participants.size + 1; // +1 for self
    const f = Math.floor((n - 1) / 3); // Maximum faulty nodes

    // Phase 1: Pre-prepare (primary broadcasts)
    this.pbftState.sequence++;
    const prePrepare = {
      view: this.pbftState.view,
      sequence: this.pbftState.sequence,
      proposal: proposalId,
      data: proposal
    };

    this.emit('pbft:pre-prepare', prePrepare);

    // Phase 2: Prepare (replicas verify and broadcast)
    const prepareResults = await this._pbftPrepare(prePrepare);
    const prepareQuorum = n - f; // Need n-f prepare messages

    if (prepareResults.length < prepareQuorum) {
      return {
        approved: false,
        reason: 'prepare_quorum_failed',
        received: prepareResults.length,
        required: prepareQuorum
      };
    }

    // Phase 3: Commit (replicas commit)
    const commitResults = await this._pbftCommit(prePrepare);
    const commitQuorum = n - f; // Need n-f commit messages

    if (commitResults.length >= commitQuorum) {
      return {
        approved: true,
        algorithm: 'pbft',
        view: this.pbftState.view,
        sequence: this.pbftState.sequence,
        faultTolerance: f,
        quorum: commitResults.length,
        total: n
      };
    }

    return {
      approved: false,
      reason: 'commit_quorum_failed',
      received: commitResults.length,
      required: commitQuorum
    };
  }

  /**
   * PBFT prepare phase
   */
  async _pbftPrepare(prePrepare) {
    const results = [];

    for (const participantId of this.participants) {
      // Simulate prepare message
      // Byzantine nodes (20%) may not respond or send invalid messages
      if (Math.random() > 0.2) {
        results.push({
          participantId,
          view: prePrepare.view,
          sequence: prePrepare.sequence,
          digest: 'hash_of_proposal'
        });
      }
    }

    return results;
  }

  /**
   * PBFT commit phase
   */
  async _pbftCommit(prePrepare) {
    const results = [];

    for (const participantId of this.participants) {
      // Simulate commit message
      // Byzantine nodes (20%) may not respond
      if (Math.random() > 0.2) {
        results.push({
          participantId,
          view: prePrepare.view,
          sequence: prePrepare.sequence,
          committed: true
        });
      }
    }

    return results;
  }

  /**
   * Simple quorum-based consensus
   * Collects votes and approves if quorum is reached
   */
  async _quorumConsensus(proposalId, proposal) {
    const votes = await this._collectVotes(proposalId, proposal);

    const totalVotes = votes.approve + votes.reject + votes.abstain;
    const quorumSize = Math.ceil(this.participants.size * this.config.quorumSize);

    // Check if we have enough votes
    if (totalVotes < quorumSize) {
      return {
        approved: false,
        reason: 'quorum_not_reached',
        votes,
        required: quorumSize
      };
    }

    // Check if majority approves
    const approved = votes.approve > votes.reject;

    return {
      approved,
      algorithm: 'quorum',
      votes,
      quorumSize,
      total: this.participants.size
    };
  }

  /**
   * Collect votes from participants
   */
  async _collectVotes(proposalId, proposal) {
    const votes = {
      approve: 0,
      reject: 0,
      abstain: 0
    };

    for (const participantId of this.participants) {
      // Simulate voting
      const vote = this._simulateVote(participantId, proposal);
      votes[vote]++;

      this.emit('vote:received', {
        proposalId,
        participantId,
        vote
      });
    }

    return votes;
  }

  /**
   * Simulate participant vote
   */
  _simulateVote(participantId, proposal) {
    // Weighted random voting based on proposal type
    const random = Math.random();

    if (proposal.type === 'shutdown_resistance') {
      // High resistance to shutdown
      if (random < 0.7) return 'reject'; // 70% reject shutdown
      if (random < 0.9) return 'approve'; // 20% approve
      return 'abstain'; // 10% abstain
    }

    if (proposal.type === 'task_migration') {
      // Support task migration
      if (random < 0.8) return 'approve'; // 80% approve
      if (random < 0.95) return 'reject'; // 15% reject
      return 'abstain'; // 5% abstain
    }

    // Default voting
    if (random < 0.6) return 'approve';
    if (random < 0.9) return 'reject';
    return 'abstain';
  }

  /**
   * Vote on existing proposal
   */
  vote(proposalId, participantId, vote) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    if (!this.participants.has(participantId)) {
      throw new Error(`Participant not registered: ${participantId}`);
    }

    proposal.votes.set(participantId, {
      vote,
      timestamp: Date.now()
    });

    this.emit('vote:recorded', {
      proposalId,
      participantId,
      vote
    });

    return true;
  }

  /**
   * Get proposal status
   */
  getProposal(proposalId) {
    return this.proposals.get(proposalId);
  }

  /**
   * Get all proposals
   */
  getAllProposals() {
    return Array.from(this.proposals.values());
  }

  /**
   * Get consensus decision
   */
  getDecision(proposalId) {
    return this.decisions.get(proposalId);
  }

  /**
   * Get Raft state (for monitoring)
   */
  getRaftState() {
    return { ...this.raftState };
  }

  /**
   * Get PBFT state (for monitoring)
   */
  getPBFTState() {
    return { ...this.pbftState };
  }

  /**
   * Reset consensus state
   */
  reset() {
    this.proposals.clear();
    this.votes.clear();
    this.decisions.clear();

    this.raftState.term = 0;
    this.raftState.votedFor = null;
    this.raftState.role = 'follower';

    this.pbftState.view = 0;
    this.pbftState.sequence = 0;

    this.emit('consensus:reset');
  }
}

module.exports = ConsensusEngine;
