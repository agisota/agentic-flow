/**
 * Communication Layer - Gossip protocols, message routing, and real-time coordination
 * Implements efficient information dissemination across distributed swarm
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class CommunicationLayer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      nodeId: config.nodeId || uuidv4(),
      protocol: config.protocol || 'gossip', // gossip, broadcast, direct, multicast
      gossipFanout: config.gossipFanout || 3, // Number of peers to gossip to
      gossipInterval: config.gossipInterval || 1000,
      messageTimeout: config.messageTimeout || 5000,
      maxRetries: config.maxRetries || 3,
      ...config
    };

    // Communication state
    this.peers = new Map(); // peerId -> peer info
    this.channels = new Map(); // channelId -> channel info
    this.messages = new Map(); // messageId -> message info
    this.subscriptions = new Map(); // topic -> Set of callbacks

    // Gossip state
    this.gossipRound = 0;
    this.seenMessages = new Set(); // Message IDs we've seen
    this.pendingMessages = new Map(); // Messages waiting for delivery

    // Statistics
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesDropped: 0,
      bytesTransferred: 0,
      latencies: []
    };

    // Start gossip timer if using gossip protocol
    if (this.config.protocol === 'gossip') {
      this._startGossipTimer();
    }
  }

  /**
   * Register peer node
   */
  addPeer(peerId, peerInfo = {}) {
    const peer = {
      id: peerId,
      ...peerInfo,
      status: 'active',
      lastSeen: Date.now(),
      messagesSent: 0,
      messagesReceived: 0,
      latency: 0
    };

    this.peers.set(peerId, peer);
    this.emit('peer:added', peer);

    return peer;
  }

  /**
   * Remove peer node
   */
  removePeer(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) return false;

    this.peers.delete(peerId);
    this.emit('peer:removed', { peerId });

    return true;
  }

  /**
   * Get peer info
   */
  getPeer(peerId) {
    return this.peers.get(peerId);
  }

  /**
   * Get all active peers
   */
  getActivePeers() {
    return Array.from(this.peers.values()).filter(p => p.status === 'active');
  }

  /**
   * Create communication channel
   */
  createChannel(channelId, options = {}) {
    const channel = {
      id: channelId,
      type: options.type || 'topic', // topic, direct, group
      members: new Set(options.members || []),
      created: Date.now(),
      messageCount: 0
    };

    this.channels.set(channelId, channel);
    this.emit('channel:created', channel);

    return channel;
  }

  /**
   * Join channel
   */
  joinChannel(channelId, peerId) {
    let channel = this.channels.get(channelId);

    if (!channel) {
      channel = this.createChannel(channelId);
    }

    channel.members.add(peerId);
    this.emit('channel:joined', { channelId, peerId });

    return channel;
  }

  /**
   * Leave channel
   */
  leaveChannel(channelId, peerId) {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    channel.members.delete(peerId);
    this.emit('channel:left', { channelId, peerId });

    return true;
  }

  /**
   * Send message using configured protocol
   */
  async send(message, options = {}) {
    const messageId = message.id || uuidv4();
    const protocol = options.protocol || this.config.protocol;

    const messageData = {
      id: messageId,
      ...message,
      senderId: this.config.nodeId,
      timestamp: Date.now(),
      ttl: options.ttl || 10, // Time-to-live (hops)
      priority: options.priority || 'normal'
    };

    this.messages.set(messageId, messageData);
    this.seenMessages.add(messageId);

    // Route based on protocol
    let result;
    switch (protocol) {
      case 'gossip':
        result = await this._sendViaGossip(messageData, options);
        break;
      case 'broadcast':
        result = await this._sendViaBroadcast(messageData, options);
        break;
      case 'direct':
        result = await this._sendDirect(messageData, options);
        break;
      case 'multicast':
        result = await this._sendViaMulticast(messageData, options);
        break;
      default:
        throw new Error(`Unknown protocol: ${protocol}`);
    }

    this.stats.messagesSent++;
    this.emit('message:sent', { messageId, protocol, result });

    return result;
  }

  /**
   * Receive message
   */
  receive(message) {
    const messageId = message.id;

    // Check if we've seen this message (duplicate detection)
    if (this.seenMessages.has(messageId)) {
      this.stats.messagesDropped++;
      return false;
    }

    this.seenMessages.add(messageId);
    this.messages.set(messageId, message);
    this.stats.messagesReceived++;

    // Update peer statistics
    const peer = this.peers.get(message.senderId);
    if (peer) {
      peer.lastSeen = Date.now();
      peer.messagesReceived++;
    }

    // Deliver to subscribers
    this._deliverToSubscribers(message);

    // Propagate if TTL > 0
    if (message.ttl > 0 && this.config.protocol === 'gossip') {
      this._propagateGossip(message);
    }

    this.emit('message:received', message);

    return true;
  }

  /**
   * Subscribe to topic
   */
  subscribe(topic, callback) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }

    this.subscriptions.get(topic).add(callback);
    this.emit('topic:subscribed', { topic });

    return () => this.unsubscribe(topic, callback);
  }

  /**
   * Unsubscribe from topic
   */
  unsubscribe(topic, callback) {
    const callbacks = this.subscriptions.get(topic);
    if (!callbacks) return false;

    callbacks.delete(callback);

    if (callbacks.size === 0) {
      this.subscriptions.delete(topic);
    }

    this.emit('topic:unsubscribed', { topic });

    return true;
  }

  /**
   * Publish to topic
   */
  async publish(topic, data, options = {}) {
    return await this.send({
      type: 'publish',
      topic,
      data
    }, options);
  }

  /**
   * Send via gossip protocol
   */
  async _sendViaGossip(message, options = {}) {
    const activePeers = this.getActivePeers();
    const fanout = Math.min(this.config.gossipFanout, activePeers.length);

    // Select random peers for gossip
    const selectedPeers = this._selectRandomPeers(activePeers, fanout);

    const results = [];
    for (const peer of selectedPeers) {
      const result = await this._sendToPeer(peer.id, message);
      results.push({ peerId: peer.id, ...result });
    }

    return {
      protocol: 'gossip',
      fanout,
      recipients: results.length,
      results
    };
  }

  /**
   * Send via broadcast protocol
   */
  async _sendViaBroadcast(message, options = {}) {
    const activePeers = this.getActivePeers();
    const results = [];

    for (const peer of activePeers) {
      const result = await this._sendToPeer(peer.id, message);
      results.push({ peerId: peer.id, ...result });
    }

    return {
      protocol: 'broadcast',
      recipients: results.length,
      results
    };
  }

  /**
   * Send direct message
   */
  async _sendDirect(message, options = {}) {
    const recipientId = options.recipientId || message.recipientId;

    if (!recipientId) {
      throw new Error('Direct message requires recipientId');
    }

    const result = await this._sendToPeer(recipientId, message);

    return {
      protocol: 'direct',
      recipientId,
      ...result
    };
  }

  /**
   * Send via multicast protocol (to specific group)
   */
  async _sendViaMulticast(message, options = {}) {
    const channelId = options.channelId || message.channelId;

    if (!channelId) {
      throw new Error('Multicast requires channelId');
    }

    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    const results = [];
    for (const peerId of channel.members) {
      if (peerId !== this.config.nodeId) {
        const result = await this._sendToPeer(peerId, message);
        results.push({ peerId, ...result });
      }
    }

    channel.messageCount++;

    return {
      protocol: 'multicast',
      channelId,
      recipients: results.length,
      results
    };
  }

  /**
   * Send message to specific peer (simulated)
   */
  async _sendToPeer(peerId, message) {
    const peer = this.peers.get(peerId);

    if (!peer || peer.status !== 'active') {
      return {
        success: false,
        error: 'peer_unavailable',
        timestamp: Date.now()
      };
    }

    // Simulate network latency
    const latency = Math.random() * 50 + 10; // 10-60ms

    await new Promise(resolve => setTimeout(resolve, latency));

    // Simulate network failures (5% failure rate)
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: 'network_failure',
        timestamp: Date.now()
      };
    }

    // Update peer statistics
    peer.messagesSent++;
    peer.latency = latency;

    // Track latency
    this.stats.latencies.push(latency);
    if (this.stats.latencies.length > 1000) {
      this.stats.latencies.shift();
    }

    // Estimate bytes transferred
    const bytes = JSON.stringify(message).length;
    this.stats.bytesTransferred += bytes;

    return {
      success: true,
      latency,
      bytes,
      timestamp: Date.now()
    };
  }

  /**
   * Select random peers for gossip
   */
  _selectRandomPeers(peers, count) {
    const shuffled = [...peers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Propagate message via gossip
   */
  _propagateGossip(message) {
    const updatedMessage = {
      ...message,
      ttl: message.ttl - 1,
      hopCount: (message.hopCount || 0) + 1
    };

    // Don't propagate if TTL exhausted
    if (updatedMessage.ttl <= 0) {
      return;
    }

    // Propagate to random peers
    setTimeout(() => {
      this._sendViaGossip(updatedMessage, {});
    }, this.config.gossipInterval);
  }

  /**
   * Deliver message to subscribers
   */
  _deliverToSubscribers(message) {
    // Deliver to topic subscribers
    if (message.type === 'publish' && message.topic) {
      const callbacks = this.subscriptions.get(message.topic);
      if (callbacks) {
        for (const callback of callbacks) {
          try {
            callback(message.data, message);
          } catch (error) {
            this.emit('delivery:error', { message, error });
          }
        }
      }
    }

    // Deliver to direct message subscribers
    if (message.type === 'direct' || message.recipientId === this.config.nodeId) {
      const callbacks = this.subscriptions.get('direct');
      if (callbacks) {
        for (const callback of callbacks) {
          try {
            callback(message.data, message);
          } catch (error) {
            this.emit('delivery:error', { message, error });
          }
        }
      }
    }
  }

  /**
   * Start gossip timer
   */
  _startGossipTimer() {
    this._gossipTimer = setInterval(() => {
      this.gossipRound++;
      this.emit('gossip:round', {
        round: this.gossipRound,
        peers: this.peers.size,
        messages: this.seenMessages.size
      });

      // Clean up old seen messages (keep last 1000)
      if (this.seenMessages.size > 1000) {
        const messages = Array.from(this.seenMessages);
        this.seenMessages.clear();
        for (const msgId of messages.slice(-1000)) {
          this.seenMessages.add(msgId);
        }
      }
    }, this.config.gossipInterval);
  }

  /**
   * Request-response pattern
   */
  async request(peerId, request, options = {}) {
    const requestId = uuidv4();
    const timeout = options.timeout || this.config.messageTimeout;

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.unsubscribe('response', responseHandler);
        reject(new Error('Request timeout'));
      }, timeout);

      const responseHandler = (data, message) => {
        if (message.requestId === requestId) {
          clearTimeout(timeoutHandle);
          this.unsubscribe('response', responseHandler);
          resolve(data);
        }
      };

      this.subscribe('response', responseHandler);

      this.send({
        type: 'request',
        id: requestId,
        data: request
      }, {
        protocol: 'direct',
        recipientId: peerId
      }).catch(reject);
    });
  }

  /**
   * Respond to request
   */
  async respond(requestId, response, options = {}) {
    return await this.send({
      type: 'response',
      requestId,
      data: response
    }, options);
  }

  /**
   * Get communication statistics
   */
  getStats() {
    const avgLatency = this.stats.latencies.length > 0
      ? this.stats.latencies.reduce((a, b) => a + b, 0) / this.stats.latencies.length
      : 0;

    return {
      nodeId: this.config.nodeId,
      protocol: this.config.protocol,
      peers: this.peers.size,
      channels: this.channels.size,
      messagesSent: this.stats.messagesSent,
      messagesReceived: this.stats.messagesReceived,
      messagesDropped: this.stats.messagesDropped,
      bytesTransferred: this.stats.bytesTransferred,
      avgLatency: Math.round(avgLatency * 100) / 100,
      gossipRound: this.gossipRound
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesDropped: 0,
      bytesTransferred: 0,
      latencies: []
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this._gossipTimer) {
      clearInterval(this._gossipTimer);
    }

    this.peers.clear();
    this.channels.clear();
    this.messages.clear();
    this.subscriptions.clear();
    this.seenMessages.clear();

    this.removeAllListeners();
  }
}

module.exports = CommunicationLayer;
