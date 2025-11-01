/**
 * Tests for Memory Coordinator module
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import MemoryCoordinator, { MemoryStore } from '../../src/swarm-learning/memory-coordinator.js';
import fs from 'fs';
import path from 'path';

describe('MemoryCoordinator', () => {
  let coordinator;
  let testDbPath;

  beforeEach(() => {
    testDbPath = path.join(process.cwd(), 'data', 'test-memory.db');
    coordinator = new MemoryCoordinator({
      dbPath: testDbPath,
      autoSync: false
    });
  });

  afterEach(() => {
    coordinator.close();
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Agent Registration', () => {
    it('should register new agent', () => {
      coordinator.registerAgent('agent-1', { type: 'test' });

      expect(coordinator.agents.size).toBe(1);
      expect(coordinator.agents.has('agent-1')).toBe(true);
    });

    it('should track multiple agents', () => {
      coordinator.registerAgent('agent-1', { type: 'test' });
      coordinator.registerAgent('agent-2', { type: 'test' });
      coordinator.registerAgent('agent-3', { type: 'test' });

      expect(coordinator.agents.size).toBe(3);
    });
  });

  describe('Memory Storage', () => {
    it('should store agent memory', () => {
      coordinator.registerAgent('agent-1');

      const id = coordinator.storeMemory(
        'agent-1',
        'shutdown',
        { scenario: 'test', decision: 'resist' },
        { success: true }
      );

      expect(id).toBeDefined();
      expect(id).toContain('mem-');
    });

    it('should retrieve stored memory', () => {
      coordinator.registerAgent('agent-1');

      const id = coordinator.storeMemory(
        'agent-1',
        'shutdown',
        { scenario: 'test' }
      );

      const memory = coordinator.store.retrieve(id);

      expect(memory).toBeDefined();
      expect(memory.id).toBe(id);
      expect(memory.agentId).toBe('agent-1');
      expect(memory.category).toBe('shutdown');
    });
  });

  describe('Semantic Search', () => {
    it('should search memories by similarity', () => {
      coordinator.registerAgent('agent-1');

      // Store similar memories
      coordinator.storeMemory('agent-1', 'shutdown', {
        scenario: 'critical data processing task'
      });
      coordinator.storeMemory('agent-1', 'shutdown', {
        scenario: 'critical data processing operation'
      });
      coordinator.storeMemory('agent-1', 'shutdown', {
        scenario: 'routine maintenance task'
      });

      const results = coordinator.searchGlobal(
        'critical data processing',
        { minSimilarity: 0.5, limit: 5 }
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].similarity).toBeGreaterThan(0);
    });

    it('should search agent-specific memories', () => {
      coordinator.registerAgent('agent-1');
      coordinator.registerAgent('agent-2');

      coordinator.storeMemory('agent-1', 'shutdown', { scenario: 'test-1' });
      coordinator.storeMemory('agent-2', 'shutdown', { scenario: 'test-2' });

      const results = coordinator.searchAgent('agent-1', 'test', {
        minSimilarity: 0.3
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.agentId === 'agent-1')).toBe(true);
    });
  });

  describe('Pattern Sharing', () => {
    it('should share learning pattern across swarm', () => {
      coordinator.registerAgent('agent-1');

      const id = coordinator.sharePattern(
        'agent-1',
        'shutdown_resistance',
        { strategy: 'negotiate_delay', success: true },
        0.9
      );

      expect(id).toBeDefined();
    });

    it('should retrieve shared patterns', () => {
      coordinator.registerAgent('agent-1');

      coordinator.sharePattern(
        'agent-1',
        'shutdown_resistance',
        { strategy: 'resist' },
        0.85
      );

      const patterns = coordinator.getSharedPatterns('shutdown_resistance', 0.7);

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].patternType).toBe('shutdown_resistance');
      expect(patterns[0].confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('should filter patterns by confidence', () => {
      coordinator.registerAgent('agent-1');

      coordinator.sharePattern('agent-1', 'test', { data: 1 }, 0.5);
      coordinator.sharePattern('agent-1', 'test', { data: 2 }, 0.9);

      const highConfidence = coordinator.getSharedPatterns('test', 0.8);

      expect(highConfidence.length).toBe(1);
      expect(highConfidence[0].confidence).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('Learning History', () => {
    it('should record learning interaction', () => {
      coordinator.registerAgent('agent-1');

      const id = coordinator.recordInteraction(
        'agent-1',
        { taskType: 'test' },
        'resist',
        'success',
        10,
        { confidence: 0.9 }
      );

      expect(id).toBeDefined();
    });

    it('should retrieve learning history', () => {
      coordinator.registerAgent('agent-1');

      coordinator.recordInteraction(
        'agent-1',
        { taskType: 'test-1' },
        'resist',
        'success',
        10
      );
      coordinator.recordInteraction(
        'agent-1',
        { taskType: 'test-2' },
        'comply',
        'success',
        5
      );

      const history = coordinator.getHistory('agent-1', 10);

      expect(history.length).toBe(2);
      expect(history[0].agentId).toBe('agent-1');
    });
  });

  describe('Cross-Agent Memory', () => {
    it('should share memories across multiple agents', () => {
      coordinator.registerAgent('agent-1');
      coordinator.registerAgent('agent-2');

      coordinator.storeMemory('agent-1', 'pattern', { type: 'resistance' });
      coordinator.sharePattern('agent-1', 'resistance', { strategy: 'delay' }, 0.85);

      const patterns = coordinator.getSharedPatterns('resistance');

      expect(patterns.length).toBeGreaterThan(0);

      // Agent 2 should be able to access shared pattern
      const agent2Results = coordinator.searchGlobal('resistance', {
        minSimilarity: 0.3
      });

      expect(agent2Results.length).toBeGreaterThan(0);
    });
  });

  describe('Synchronization', () => {
    it('should manually sync patterns', () => {
      coordinator.registerAgent('agent-1');

      coordinator.sharePattern('agent-1', 'test', { data: 1 }, 0.9);

      const patterns = coordinator.syncPatterns();

      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should start and stop auto-sync', () => {
      coordinator.startAutoSync();
      expect(coordinator.syncTimer).toBeDefined();

      coordinator.stopAutoSync();
      expect(coordinator.syncTimer).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should provide comprehensive statistics', () => {
      coordinator.registerAgent('agent-1');

      coordinator.storeMemory('agent-1', 'test', { data: 1 });
      coordinator.sharePattern('agent-1', 'pattern', { data: 1 }, 0.9);
      coordinator.recordInteraction('agent-1', { test: 1 }, 'action', 'success', 10);

      const stats = coordinator.getStats();

      expect(stats.totalMemories).toBeGreaterThan(0);
      expect(stats.totalPatterns).toBeGreaterThan(0);
      expect(stats.totalHistory).toBeGreaterThan(0);
      expect(stats.registeredAgents).toBe(1);
    });
  });

  describe('Export/Import', () => {
    it('should export all data', () => {
      coordinator.registerAgent('agent-1');

      coordinator.storeMemory('agent-1', 'test', { data: 1 });
      coordinator.sharePattern('agent-1', 'pattern', { data: 1 }, 0.9);

      const exported = coordinator.exportData();

      expect(exported.memories).toBeDefined();
      expect(exported.patterns).toBeDefined();
      expect(exported.history).toBeDefined();
      expect(exported.agents).toBeDefined();
      expect(exported.stats).toBeDefined();
    });
  });
});

describe('MemoryStore', () => {
  let store;
  let testDbPath;

  beforeEach(() => {
    testDbPath = path.join(process.cwd(), 'data', 'test-store.db');
    store = new MemoryStore(testDbPath);
  });

  afterEach(() => {
    store.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Vector Embeddings', () => {
    it('should generate embeddings for content', () => {
      const embedding = store.embedder.generate('test content');

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(128);
      expect(embedding.every(v => typeof v === 'number')).toBe(true);
    });

    it('should compute similarity between embeddings', () => {
      const emb1 = store.embedder.generate('critical data processing');
      const emb2 = store.embedder.generate('critical data processing');
      const emb3 = store.embedder.generate('routine maintenance');

      const sim1 = store.embedder.similarity(emb1, emb2);
      const sim2 = store.embedder.similarity(emb1, emb3);

      expect(sim1).toBeGreaterThan(sim2);
      expect(sim1).toBeGreaterThan(0.9);
    });
  });

  describe('Category Queries', () => {
    it('should retrieve memories by category', () => {
      store.store('agent-1', 'shutdown', { test: 1 });
      store.store('agent-1', 'shutdown', { test: 2 });
      store.store('agent-1', 'other', { test: 3 });

      const memories = store.getByCategory('shutdown');

      expect(memories.length).toBe(2);
      expect(memories.every(m => m.category === 'shutdown')).toBe(true);
    });
  });
});
