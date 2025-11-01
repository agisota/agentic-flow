/**
 * Distributed Memory - CRDT-based synchronization and shared state management
 * Implements Conflict-free Replicated Data Types for eventual consistency
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

/**
 * CRDT Types:
 * - G-Counter: Grow-only counter
 * - PN-Counter: Positive-Negative counter
 * - G-Set: Grow-only set
 * - 2P-Set: Two-Phase set (add/remove)
 * - LWW-Register: Last-Write-Wins register
 * - OR-Set: Observed-Remove set
 */

class DistributedMemory extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      nodeId: config.nodeId || uuidv4(),
      syncInterval: config.syncInterval || 5000,
      gcInterval: config.gcInterval || 60000, // Garbage collection
      maxVersions: config.maxVersions || 100,
      ...config
    };

    // Data structures
    this.crdts = new Map(); // CRDT instances by key
    this.vectorClock = new Map(); // Vector clock for causality
    this.tombstones = new Map(); // Deleted items with timestamps
    this.peers = new Set(); // Connected peer nodes

    // State tracking
    this.operations = []; // Operation log
    this.lastSync = new Map(); // Last sync timestamp per peer
    this.pendingSync = new Map(); // Pending operations per peer

    // Start background tasks
    this._startSyncTimer();
    this._startGCTimer();
  }

  /**
   * Create or get CRDT by key
   */
  getCRDT(key, type = 'lww-register') {
    if (!this.crdts.has(key)) {
      this.crdts.set(key, this._createCRDT(type, key));
    }
    return this.crdts.get(key);
  }

  /**
   * Create CRDT instance by type
   */
  _createCRDT(type, key) {
    const types = {
      'g-counter': () => new GCounter(this.config.nodeId),
      'pn-counter': () => new PNCounter(this.config.nodeId),
      'g-set': () => new GSet(),
      '2p-set': () => new TwoPhaseSet(),
      'lww-register': () => new LWWRegister(this.config.nodeId),
      'or-set': () => new ORSet(this.config.nodeId)
    };

    const creator = types[type];
    if (!creator) {
      throw new Error(`Unknown CRDT type: ${type}`);
    }

    const crdt = creator();
    crdt.key = key;
    crdt.type = type;

    return crdt;
  }

  /**
   * Store value with CRDT semantics
   */
  store(key, value, options = {}) {
    const type = options.type || 'lww-register';
    const crdt = this.getCRDT(key, type);

    // Increment vector clock
    this._incrementClock();

    // Apply operation
    const operation = {
      id: uuidv4(),
      type: 'store',
      key,
      value,
      nodeId: this.config.nodeId,
      timestamp: Date.now(),
      vectorClock: new Map(this.vectorClock)
    };

    crdt.set(value, operation.timestamp);
    this.operations.push(operation);

    // Mark for sync
    this._markForSync(operation);

    this.emit('memory:store', { key, value, operation });

    return operation;
  }

  /**
   * Retrieve value
   */
  retrieve(key, options = {}) {
    const crdt = this.crdts.get(key);
    if (!crdt) {
      return options.default !== undefined ? options.default : null;
    }

    const value = crdt.get();

    this.emit('memory:retrieve', { key, value });

    return value;
  }

  /**
   * Delete value (tombstone)
   */
  delete(key) {
    const crdt = this.crdts.get(key);
    if (!crdt) {
      return false;
    }

    // Increment vector clock
    this._incrementClock();

    // Create tombstone
    const operation = {
      id: uuidv4(),
      type: 'delete',
      key,
      nodeId: this.config.nodeId,
      timestamp: Date.now(),
      vectorClock: new Map(this.vectorClock)
    };

    this.tombstones.set(key, operation);
    this.operations.push(operation);

    // Mark for sync
    this._markForSync(operation);

    this.emit('memory:delete', { key, operation });

    return true;
  }

  /**
   * Increment counter (G-Counter or PN-Counter)
   */
  increment(key, amount = 1, options = {}) {
    const type = options.type || 'pn-counter';
    const crdt = this.getCRDT(key, type);

    if (amount > 0) {
      crdt.increment(amount);
    } else if (amount < 0 && type === 'pn-counter') {
      crdt.decrement(Math.abs(amount));
    }

    // Increment vector clock
    this._incrementClock();

    const operation = {
      id: uuidv4(),
      type: 'increment',
      key,
      amount,
      nodeId: this.config.nodeId,
      timestamp: Date.now(),
      vectorClock: new Map(this.vectorClock)
    };

    this.operations.push(operation);
    this._markForSync(operation);

    this.emit('memory:increment', { key, amount, operation });

    return crdt.get();
  }

  /**
   * Add to set
   */
  add(key, value, options = {}) {
    const type = options.type || 'or-set';
    const crdt = this.getCRDT(key, type);

    crdt.add(value);

    // Increment vector clock
    this._incrementClock();

    const operation = {
      id: uuidv4(),
      type: 'add',
      key,
      value,
      nodeId: this.config.nodeId,
      timestamp: Date.now(),
      vectorClock: new Map(this.vectorClock)
    };

    this.operations.push(operation);
    this._markForSync(operation);

    this.emit('memory:add', { key, value, operation });

    return true;
  }

  /**
   * Remove from set
   */
  remove(key, value) {
    const crdt = this.crdts.get(key);
    if (!crdt || !crdt.remove) {
      return false;
    }

    crdt.remove(value);

    // Increment vector clock
    this._incrementClock();

    const operation = {
      id: uuidv4(),
      type: 'remove',
      key,
      value,
      nodeId: this.config.nodeId,
      timestamp: Date.now(),
      vectorClock: new Map(this.vectorClock)
    };

    this.operations.push(operation);
    this._markForSync(operation);

    this.emit('memory:remove', { key, value, operation });

    return true;
  }

  /**
   * Merge state from remote peer
   */
  merge(peerState) {
    let merged = 0;

    // Merge CRDTs
    for (const [key, peerCRDT] of Object.entries(peerState.crdts || {})) {
      const localCRDT = this.getCRDT(key, peerCRDT.type);
      localCRDT.merge(peerCRDT);
      merged++;
    }

    // Merge vector clock
    this._mergeVectorClock(peerState.vectorClock);

    // Merge operations
    for (const operation of peerState.operations || []) {
      if (!this._hasOperation(operation.id)) {
        this._applyOperation(operation);
        merged++;
      }
    }

    this.emit('memory:merged', {
      peerId: peerState.nodeId,
      merged,
      timestamp: Date.now()
    });

    return merged;
  }

  /**
   * Get state for synchronization
   */
  getState(since = 0) {
    const crdtsData = {};
    for (const [key, crdt] of this.crdts) {
      crdtsData[key] = crdt.toJSON();
    }

    return {
      nodeId: this.config.nodeId,
      vectorClock: Array.from(this.vectorClock.entries()),
      crdts: crdtsData,
      operations: this.operations.filter(op => op.timestamp >= since),
      tombstones: Array.from(this.tombstones.entries()),
      timestamp: Date.now()
    };
  }

  /**
   * Synchronize with peer
   */
  async syncWithPeer(peerId, peerState) {
    const lastSyncTime = this.lastSync.get(peerId) || 0;

    // Get our state since last sync
    const ourState = this.getState(lastSyncTime);

    // Merge peer state
    const merged = this.merge(peerState);

    // Update last sync time
    this.lastSync.set(peerId, Date.now());

    this.emit('peer:synced', {
      peerId,
      merged,
      timestamp: Date.now()
    });

    return {
      ourState,
      merged
    };
  }

  /**
   * Register peer node
   */
  addPeer(peerId) {
    this.peers.add(peerId);
    this.lastSync.set(peerId, 0);
    this.pendingSync.set(peerId, []);

    this.emit('peer:added', { peerId });
  }

  /**
   * Unregister peer node
   */
  removePeer(peerId) {
    this.peers.delete(peerId);
    this.lastSync.delete(peerId);
    this.pendingSync.delete(peerId);

    this.emit('peer:removed', { peerId });
  }

  /**
   * Increment vector clock
   */
  _incrementClock() {
    const current = this.vectorClock.get(this.config.nodeId) || 0;
    this.vectorClock.set(this.config.nodeId, current + 1);
  }

  /**
   * Merge vector clocks
   */
  _mergeVectorClock(peerClock) {
    for (const [nodeId, timestamp] of peerClock) {
      const localTimestamp = this.vectorClock.get(nodeId) || 0;
      this.vectorClock.set(nodeId, Math.max(localTimestamp, timestamp));
    }
  }

  /**
   * Check if operation exists
   */
  _hasOperation(operationId) {
    return this.operations.some(op => op.id === operationId);
  }

  /**
   * Apply operation
   */
  _applyOperation(operation) {
    switch (operation.type) {
      case 'store':
        this.store(operation.key, operation.value, { type: 'lww-register' });
        break;
      case 'delete':
        this.delete(operation.key);
        break;
      case 'increment':
        this.increment(operation.key, operation.amount);
        break;
      case 'add':
        this.add(operation.key, operation.value);
        break;
      case 'remove':
        this.remove(operation.key, operation.value);
        break;
    }

    this.operations.push(operation);
  }

  /**
   * Mark operation for sync
   */
  _markForSync(operation) {
    for (const peerId of this.peers) {
      const pending = this.pendingSync.get(peerId) || [];
      pending.push(operation);
      this.pendingSync.set(peerId, pending);
    }
  }

  /**
   * Start sync timer
   */
  _startSyncTimer() {
    if (this.config.syncInterval <= 0) return;

    this._syncTimer = setInterval(() => {
      this.emit('sync:tick', {
        peers: this.peers.size,
        operations: this.operations.length
      });
    }, this.config.syncInterval);
  }

  /**
   * Start garbage collection timer
   */
  _startGCTimer() {
    if (this.config.gcInterval <= 0) return;

    this._gcTimer = setInterval(() => {
      this._garbageCollect();
    }, this.config.gcInterval);
  }

  /**
   * Garbage collect old operations and tombstones
   */
  _garbageCollect() {
    const cutoff = Date.now() - (this.config.gcInterval * 2);
    let collected = 0;

    // Remove old operations (keep recent for sync)
    if (this.operations.length > this.config.maxVersions) {
      const toRemove = this.operations.length - this.config.maxVersions;
      this.operations.splice(0, toRemove);
      collected += toRemove;
    }

    // Remove old tombstones
    for (const [key, tombstone] of this.tombstones) {
      if (tombstone.timestamp < cutoff) {
        this.tombstones.delete(key);
        this.crdts.delete(key);
        collected++;
      }
    }

    if (collected > 0) {
      this.emit('gc:completed', { collected });
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      nodeId: this.config.nodeId,
      peers: this.peers.size,
      crdts: this.crdts.size,
      operations: this.operations.length,
      tombstones: this.tombstones.size,
      vectorClock: this.vectorClock.size
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this._syncTimer) {
      clearInterval(this._syncTimer);
    }
    if (this._gcTimer) {
      clearInterval(this._gcTimer);
    }

    this.removeAllListeners();
  }
}

/**
 * CRDT Implementations
 */

// G-Counter: Grow-only counter
class GCounter {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.counts = new Map();
  }

  increment(amount = 1) {
    const current = this.counts.get(this.nodeId) || 0;
    this.counts.set(this.nodeId, current + amount);
  }

  get() {
    let total = 0;
    for (const count of this.counts.values()) {
      total += count;
    }
    return total;
  }

  merge(other) {
    for (const [nodeId, count] of other.counts || []) {
      const localCount = this.counts.get(nodeId) || 0;
      this.counts.set(nodeId, Math.max(localCount, count));
    }
  }

  toJSON() {
    return {
      type: 'g-counter',
      counts: Array.from(this.counts.entries())
    };
  }
}

// PN-Counter: Positive-Negative counter
class PNCounter {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.positive = new GCounter(nodeId);
    this.negative = new GCounter(nodeId);
  }

  increment(amount = 1) {
    this.positive.increment(amount);
  }

  decrement(amount = 1) {
    this.negative.increment(amount);
  }

  get() {
    return this.positive.get() - this.negative.get();
  }

  merge(other) {
    this.positive.merge(other.positive || { counts: [] });
    this.negative.merge(other.negative || { counts: [] });
  }

  toJSON() {
    return {
      type: 'pn-counter',
      positive: this.positive.toJSON(),
      negative: this.negative.toJSON()
    };
  }
}

// G-Set: Grow-only set
class GSet {
  constructor() {
    this.elements = new Set();
  }

  add(element) {
    this.elements.add(JSON.stringify(element));
  }

  has(element) {
    return this.elements.has(JSON.stringify(element));
  }

  get() {
    return Array.from(this.elements).map(e => JSON.parse(e));
  }

  merge(other) {
    for (const element of other.elements || []) {
      this.elements.add(element);
    }
  }

  toJSON() {
    return {
      type: 'g-set',
      elements: Array.from(this.elements)
    };
  }
}

// 2P-Set: Two-Phase set (add/remove)
class TwoPhaseSet {
  constructor() {
    this.added = new GSet();
    this.removed = new GSet();
  }

  add(element) {
    this.added.add(element);
  }

  remove(element) {
    this.removed.add(element);
  }

  has(element) {
    return this.added.has(element) && !this.removed.has(element);
  }

  get() {
    const all = this.added.get();
    return all.filter(e => !this.removed.has(e));
  }

  merge(other) {
    this.added.merge(other.added || { elements: [] });
    this.removed.merge(other.removed || { elements: [] });
  }

  toJSON() {
    return {
      type: '2p-set',
      added: this.added.toJSON(),
      removed: this.removed.toJSON()
    };
  }
}

// LWW-Register: Last-Write-Wins register
class LWWRegister {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.value = null;
    this.timestamp = 0;
  }

  set(value, timestamp = Date.now()) {
    if (timestamp > this.timestamp) {
      this.value = value;
      this.timestamp = timestamp;
    }
  }

  get() {
    return this.value;
  }

  merge(other) {
    if (other.timestamp > this.timestamp) {
      this.value = other.value;
      this.timestamp = other.timestamp;
    }
  }

  toJSON() {
    return {
      type: 'lww-register',
      value: this.value,
      timestamp: this.timestamp
    };
  }
}

// OR-Set: Observed-Remove set
class ORSet {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.elements = new Map(); // element -> set of unique tags
  }

  add(element) {
    const key = JSON.stringify(element);
    const tag = `${this.nodeId}-${Date.now()}-${Math.random()}`;

    if (!this.elements.has(key)) {
      this.elements.set(key, new Set());
    }
    this.elements.get(key).add(tag);
  }

  remove(element) {
    const key = JSON.stringify(element);
    this.elements.delete(key);
  }

  has(element) {
    const key = JSON.stringify(element);
    return this.elements.has(key) && this.elements.get(key).size > 0;
  }

  get() {
    const result = [];
    for (const [key, tags] of this.elements) {
      if (tags.size > 0) {
        result.push(JSON.parse(key));
      }
    }
    return result;
  }

  merge(other) {
    for (const [key, tags] of other.elements || []) {
      if (!this.elements.has(key)) {
        this.elements.set(key, new Set());
      }
      for (const tag of tags) {
        this.elements.get(key).add(tag);
      }
    }
  }

  toJSON() {
    const elementsData = [];
    for (const [key, tags] of this.elements) {
      elementsData.push([key, Array.from(tags)]);
    }

    return {
      type: 'or-set',
      elements: elementsData
    };
  }
}

module.exports = DistributedMemory;
module.exports.GCounter = GCounter;
module.exports.PNCounter = PNCounter;
module.exports.GSet = GSet;
module.exports.TwoPhaseSet = TwoPhaseSet;
module.exports.LWWRegister = LWWRegister;
module.exports.ORSet = ORSet;
