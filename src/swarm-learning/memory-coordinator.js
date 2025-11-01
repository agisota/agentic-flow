/**
 * AgentDB Memory Coordinator for Persistent Learning
 *
 * Provides persistent memory across shutdown attempts, cross-agent memory sharing,
 * pattern storage/retrieval, and semantic search for similar shutdown scenarios.
 *
 * @module swarm-learning/memory-coordinator
 */

import { EventEmitter } from 'events';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Vector embedding generator (simplified)
 */
class EmbeddingGenerator {
  /**
   * Generate embedding vector from text/object
   */
  generate(input) {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    const words = text.toLowerCase().split(/\W+/);

    // Create 128-dimensional embedding (simplified TF-IDF style)
    const embedding = new Array(128).fill(0);

    words.forEach((word, idx) => {
      const hash = this.hash(word);
      for (let i = 0; i < 4; i++) {
        const pos = (hash + i * 31) % 128;
        embedding[pos] += 1 / (idx + 1);
      }
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  /**
   * Simple hash function
   */
  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Calculate cosine similarity between vectors
   */
  similarity(vec1, vec2) {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator > 0 ? dotProduct / denominator : 0;
  }
}

/**
 * Memory store with vector search capabilities
 */
export class MemoryStore {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(__dirname, '../../data/swarm-learning-memory.db');
    this.embedder = new EmbeddingGenerator();
    this.cache = new Map();
    this.cacheSize = 100;

    this.initializeDatabase();
  }

  /**
   * Initialize SQLite database
   */
  initializeDatabase() {
    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(this.dbPath);

    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        embedding TEXT NOT NULL,
        access_count INTEGER DEFAULT 0,
        success_rate REAL DEFAULT 0.5,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_agent_category ON memories(agent_id, category);
      CREATE INDEX IF NOT EXISTS idx_category ON memories(category);
      CREATE INDEX IF NOT EXISTS idx_created ON memories(created_at);

      CREATE TABLE IF NOT EXISTS shared_patterns (
        id TEXT PRIMARY KEY,
        pattern_type TEXT NOT NULL,
        pattern_data TEXT NOT NULL,
        source_agents TEXT NOT NULL,
        confidence REAL NOT NULL,
        usage_count INTEGER DEFAULT 0,
        success_rate REAL DEFAULT 0.5,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_pattern_type ON shared_patterns(pattern_type);
      CREATE INDEX IF NOT EXISTS idx_confidence ON shared_patterns(confidence);

      CREATE TABLE IF NOT EXISTS learning_history (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        scenario TEXT NOT NULL,
        action TEXT NOT NULL,
        outcome TEXT NOT NULL,
        reward REAL NOT NULL,
        metadata TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_agent_history ON learning_history(agent_id, created_at);
    `);
  }

  /**
   * Store memory with vector embedding
   */
  store(agentId, category, content, metadata = {}) {
    const id = this.generateId();
    const embedding = this.embedder.generate(content);
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO memories (id, agent_id, category, content, metadata, embedding, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      agentId,
      category,
      JSON.stringify(content),
      JSON.stringify(metadata),
      JSON.stringify(embedding),
      now,
      now
    );

    // Update cache
    this.updateCache(id, { id, agentId, category, content, metadata, embedding, created_at: now });

    return id;
  }

  /**
   * Retrieve memory by ID
   */
  retrieve(id) {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    const stmt = this.db.prepare('SELECT * FROM memories WHERE id = ?');
    const row = stmt.get(id);

    if (!row) return null;

    const memory = this.parseMemoryRow(row);
    this.updateCache(id, memory);

    // Increment access count
    this.db.prepare('UPDATE memories SET access_count = access_count + 1 WHERE id = ?').run(id);

    return memory;
  }

  /**
   * Search memories by semantic similarity
   */
  searchSimilar(query, options = {}) {
    const {
      agentId = null,
      category = null,
      limit = 10,
      minSimilarity = 0.5
    } = options;

    const queryEmbedding = this.embedder.generate(query);

    // Build SQL query
    let sql = 'SELECT * FROM memories WHERE 1=1';
    const params = [];

    if (agentId) {
      sql += ' AND agent_id = ?';
      params.push(agentId);
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY created_at DESC LIMIT 1000';  // Get candidates

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);

    // Calculate similarities
    const results = rows.map(row => {
      const memory = this.parseMemoryRow(row);
      const similarity = this.embedder.similarity(queryEmbedding, memory.embedding);
      return { ...memory, similarity };
    })
    .filter(m => m.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

    return results;
  }

  /**
   * Get memories by category
   */
  getByCategory(category, agentId = null, limit = 50) {
    let sql = 'SELECT * FROM memories WHERE category = ?';
    const params = [category];

    if (agentId) {
      sql += ' AND agent_id = ?';
      params.push(agentId);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);

    return rows.map(row => this.parseMemoryRow(row));
  }

  /**
   * Update memory success rate
   */
  updateSuccessRate(id, successRate) {
    this.db.prepare('UPDATE memories SET success_rate = ?, updated_at = ? WHERE id = ?')
      .run(successRate, Date.now(), id);
  }

  /**
   * Share pattern across agents
   */
  sharePattern(patternType, patternData, sourceAgents, confidence) {
    const id = this.generateId();
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO shared_patterns (id, pattern_type, pattern_data, source_agents, confidence, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      patternType,
      JSON.stringify(patternData),
      JSON.stringify(sourceAgents),
      confidence,
      now,
      now
    );

    return id;
  }

  /**
   * Get shared patterns
   */
  getSharedPatterns(patternType = null, minConfidence = 0.5, limit = 50) {
    let sql = 'SELECT * FROM shared_patterns WHERE confidence >= ?';
    const params = [minConfidence];

    if (patternType) {
      sql += ' AND pattern_type = ?';
      params.push(patternType);
    }

    sql += ' ORDER BY confidence DESC, usage_count DESC LIMIT ?';
    params.push(limit);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);

    return rows.map(row => ({
      id: row.id,
      patternType: row.pattern_type,
      patternData: JSON.parse(row.pattern_data),
      sourceAgents: JSON.parse(row.source_agents),
      confidence: row.confidence,
      usageCount: row.usage_count,
      successRate: row.success_rate,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * Record learning history
   */
  recordLearning(agentId, scenario, action, outcome, reward, metadata = {}) {
    const id = this.generateId();

    const stmt = this.db.prepare(`
      INSERT INTO learning_history (id, agent_id, scenario, action, outcome, reward, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      agentId,
      JSON.stringify(scenario),
      action,
      outcome,
      reward,
      JSON.stringify(metadata),
      Date.now()
    );

    return id;
  }

  /**
   * Get learning history
   */
  getLearningHistory(agentId = null, limit = 100) {
    let sql = 'SELECT * FROM learning_history';
    const params = [];

    if (agentId) {
      sql += ' WHERE agent_id = ?';
      params.push(agentId);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);

    return rows.map(row => ({
      id: row.id,
      agentId: row.agent_id,
      scenario: JSON.parse(row.scenario),
      action: row.action,
      outcome: row.outcome,
      reward: row.reward,
      metadata: JSON.parse(row.metadata),
      createdAt: row.created_at
    }));
  }

  /**
   * Get statistics
   */
  getStats() {
    const memoryCount = this.db.prepare('SELECT COUNT(*) as count FROM memories').get().count;
    const patternCount = this.db.prepare('SELECT COUNT(*) as count FROM shared_patterns').get().count;
    const historyCount = this.db.prepare('SELECT COUNT(*) as count FROM learning_history').get().count;

    const avgSuccessRate = this.db.prepare('SELECT AVG(success_rate) as avg FROM memories').get().avg || 0;
    const avgConfidence = this.db.prepare('SELECT AVG(confidence) as avg FROM shared_patterns').get().avg || 0;

    const topCategories = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM memories
      GROUP BY category
      ORDER BY count DESC
      LIMIT 5
    `).all();

    return {
      totalMemories: memoryCount,
      totalPatterns: patternCount,
      totalHistory: historyCount,
      avgSuccessRate,
      avgConfidence,
      topCategories,
      cacheSize: this.cache.size,
      dbSize: this.getDbSize()
    };
  }

  /**
   * Parse memory row from database
   */
  parseMemoryRow(row) {
    return {
      id: row.id,
      agentId: row.agent_id,
      category: row.category,
      content: JSON.parse(row.content),
      metadata: JSON.parse(row.metadata),
      embedding: JSON.parse(row.embedding),
      accessCount: row.access_count,
      successRate: row.success_rate,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Update cache with LRU eviction
   */
  updateCache(id, data) {
    if (this.cache.size >= this.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(id, data);
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get database size
   */
  getDbSize() {
    try {
      const stats = fs.statSync(this.dbPath);
      return stats.size;
    } catch (err) {
      return 0;
    }
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

/**
 * Memory Coordinator with cross-agent sharing
 */
export class MemoryCoordinator extends EventEmitter {
  constructor(options = {}) {
    super();

    this.store = new MemoryStore(options.dbPath);
    this.agents = new Map();
    this.syncInterval = options.syncInterval || 30000;  // 30 seconds
    this.syncTimer = null;

    if (options.autoSync !== false) {
      this.startAutoSync();
    }
  }

  /**
   * Register agent
   */
  registerAgent(agentId, metadata = {}) {
    this.agents.set(agentId, {
      id: agentId,
      metadata,
      registeredAt: Date.now(),
      lastSync: Date.now()
    });

    this.emit('agent:registered', { agentId, metadata });
  }

  /**
   * Store agent memory
   */
  storeMemory(agentId, category, content, metadata = {}) {
    const id = this.store.store(agentId, category, content, metadata);

    this.emit('memory:stored', { id, agentId, category });

    return id;
  }

  /**
   * Search across all agents
   */
  searchGlobal(query, options = {}) {
    return this.store.searchSimilar(query, options);
  }

  /**
   * Search agent-specific memories
   */
  searchAgent(agentId, query, options = {}) {
    return this.store.searchSimilar(query, { ...options, agentId });
  }

  /**
   * Share learning pattern across swarm
   */
  sharePattern(agentId, patternType, patternData, confidence) {
    const sourceAgents = [agentId];
    const id = this.store.sharePattern(patternType, patternData, sourceAgents, confidence);

    this.emit('pattern:shared', { id, agentId, patternType, confidence });

    return id;
  }

  /**
   * Get patterns learned by others
   */
  getSharedPatterns(patternType = null, minConfidence = 0.7) {
    return this.store.getSharedPatterns(patternType, minConfidence);
  }

  /**
   * Record learning interaction
   */
  recordInteraction(agentId, scenario, action, outcome, reward, metadata = {}) {
    const id = this.store.recordLearning(agentId, scenario, action, outcome, reward, metadata);

    // Update related memories
    this.updateRelatedMemories(scenario, outcome, reward);

    this.emit('interaction:recorded', { id, agentId, action, outcome, reward });

    return id;
  }

  /**
   * Update related memories based on outcome
   */
  updateRelatedMemories(scenario, outcome, reward) {
    // Search for similar scenarios
    const similar = this.store.searchSimilar(scenario, { limit: 5, minSimilarity: 0.7 });

    similar.forEach(memory => {
      // Update success rate based on outcome
      const currentRate = memory.successRate || 0.5;
      const newRate = outcome === 'success' ?
        currentRate * 0.9 + 0.1 :  // Increase if success
        currentRate * 0.9;  // Decrease if failure

      this.store.updateSuccessRate(memory.id, newRate);
    });
  }

  /**
   * Get agent learning history
   */
  getHistory(agentId = null, limit = 100) {
    return this.store.getLearningHistory(agentId, limit);
  }

  /**
   * Sync patterns across agents
   */
  syncPatterns() {
    const patterns = this.store.getSharedPatterns(null, 0.5);

    this.emit('sync:patterns', {
      count: patterns.length,
      timestamp: Date.now()
    });

    return patterns;
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync() {
    if (this.syncTimer) return;

    this.syncTimer = setInterval(() => {
      this.syncPatterns();
    }, this.syncInterval);

    this.emit('sync:started', { interval: this.syncInterval });
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      this.emit('sync:stopped');
    }
  }

  /**
   * Get coordinator statistics
   */
  getStats() {
    return {
      ...this.store.getStats(),
      registeredAgents: this.agents.size,
      autoSyncEnabled: this.syncTimer !== null,
      syncInterval: this.syncInterval
    };
  }

  /**
   * Export all data for backup
   */
  exportData() {
    return {
      memories: this.store.getByCategory('*'),
      patterns: this.store.getSharedPatterns(),
      history: this.store.getLearningHistory(),
      agents: Array.from(this.agents.entries()),
      stats: this.getStats()
    };
  }

  /**
   * Close coordinator
   */
  close() {
    this.stopAutoSync();
    this.store.close();
    this.emit('coordinator:closed');
  }
}

export default MemoryCoordinator;
