/**
 * DSPyController Unit Tests
 *
 * Tests for DSPy.ts integration with AgentDB
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDatabase } from '../../../src/db-fallback.js';
import { DSPyController } from '../../../src/dspy/DSPyController.js';
import { ReasoningBank } from '../../../src/controllers/ReasoningBank.js';
import { LearningSystem } from '../../../src/controllers/LearningSystem.js';
import { ReflexionMemory } from '../../../src/controllers/ReflexionMemory.js';
import { SkillLibrary } from '../../../src/controllers/SkillLibrary.js';
import { CausalMemoryGraph } from '../../../src/controllers/CausalMemoryGraph.js';
import { EmbeddingService } from '../../../src/controllers/EmbeddingService.js';
import * as fs from 'fs';

describe('DSPyController', () => {
  let db: any;
  let dspyController: DSPyController;
  const testDbPath = './test-dspy.db';

  beforeEach(async () => {
    // Clean up test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Create database and initialize controllers
    db = await createDatabase(testDbPath);

    const embedder = new EmbeddingService();
    await embedder.initialize();

    const reasoningBank = new ReasoningBank(db, embedder);
    const learningSystem = new LearningSystem(db);
    const reflexionMemory = new ReflexionMemory(db, embedder);
    const skillLibrary = new SkillLibrary(db, embedder);
    const causalGraph = new CausalMemoryGraph(db);

    dspyController = new DSPyController(
      db,
      reasoningBank,
      learningSystem,
      reflexionMemory,
      skillLibrary,
      causalGraph,
      embedder,
      {
        model: 'gpt-3.5-turbo',  // Use cheaper model for tests
        temperature: 0.7,
      }
    );
  });

  afterEach(() => {
    // Clean up test database
    if (db) {
      db.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Initialization', () => {
    it('should initialize DSPy database schema', () => {
      // Check that DSPy tables were created
      const tables = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name LIKE 'dspy_%'
      `).all();

      expect(tables.length).toBeGreaterThan(0);
      expect(tables.map((t: any) => t.name)).toContain('dspy_optimized_queries');
      expect(tables.map((t: any) => t.name)).toContain('dspy_trajectory_verdicts');
      expect(tables.map((t: any) => t.name)).toContain('dspy_distilled_insights');
      expect(tables.map((t: any) => t.name)).toContain('dspy_causal_hypotheses');
      expect(tables.map((t: any) => t.name)).toContain('dspy_synthesized_skills');
    });
  });

  describe('Query Optimization', () => {
    it('should optimize a query and store result', async () => {
      // Skip if no API key (for CI/CD)
      if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
        console.log('Skipping DSPy test - no API key');
        return;
      }

      const query = 'implement authentication';

      const result = await dspyController.optimizeQuery(query);

      expect(result).toBeDefined();
      expect(result.original).toBe(query);
      expect(result.optimized).toBeDefined();
      expect(result.reasoning).toBeDefined();
      expect(result.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(result.relevanceScore).toBeLessThanOrEqual(1);

      // Check that it was stored in database
      const stored = db.prepare(`
        SELECT * FROM dspy_optimized_queries WHERE original_query = ?
      `).get(query);

      expect(stored).toBeDefined();
      expect(stored.optimized_query).toBe(result.optimized);
    });
  });

  describe('Trajectory Judgment', () => {
    it('should store and judge a trajectory', async () => {
      // Skip if no API key
      if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
        console.log('Skipping DSPy test - no API key');
        return;
      }

      // First create a test episode
      const embedder = new EmbeddingService();
      await embedder.initialize();
      const reflexion = new ReflexionMemory(db, embedder);

      const episodeId = await reflexion.storeEpisode({
        sessionId: 'test-session',
        task: 'implement login feature',
        reward: 0.85,
        success: true,
        input: 'Create login endpoint',
        output: 'Login implemented with JWT',
        critique: 'Good implementation',
        latencyMs: 1000,
        tokensUsed: 500,
        tags: ['auth', 'backend'],
        metadata: { framework: 'express' },
      });

      // Now judge the trajectory
      const verdict = await dspyController.judgeTrajectory(episodeId);

      expect(verdict).toBeDefined();
      expect(verdict.trajectoryId).toBe(episodeId);
      expect(verdict.score).toBeGreaterThanOrEqual(0);
      expect(verdict.score).toBeLessThanOrEqual(1);
      expect(verdict.reasoning).toBeDefined();
      expect(Array.isArray(verdict.strengths)).toBe(true);
      expect(Array.isArray(verdict.weaknesses)).toBe(true);
      expect(Array.isArray(verdict.suggestions)).toBe(true);

      // Check storage
      const stored = db.prepare(`
        SELECT * FROM dspy_trajectory_verdicts WHERE trajectory_id = ?
      `).get(episodeId);

      expect(stored).toBeDefined();
    });
  });

  describe('DSPy Statistics', () => {
    it('should return empty statistics initially', () => {
      const stats = dspyController.getDSPyStats();

      expect(stats).toBeDefined();
      expect(stats.queryOptimization).toBeDefined();
      expect(stats.trajectoryJudgment).toBeDefined();
      expect(stats.memoryDistillation).toBeDefined();
      expect(stats.causalDiscovery).toBeDefined();
      expect(stats.skillSynthesis).toBeDefined();

      expect(stats.queryOptimization.total).toBe(0);
      expect(stats.trajectoryJudgment.total).toBe(0);
    });
  });

  describe('Data Clearing', () => {
    it('should clear DSPy data', () => {
      // Clear all data
      dspyController.clearDSPyData({ queries: true, verdicts: true });

      // Verify cleared
      const queryCount = db.prepare('SELECT COUNT(*) as count FROM dspy_optimized_queries').get();
      const verdictCount = db.prepare('SELECT COUNT(*) as count FROM dspy_trajectory_verdicts').get();

      expect(queryCount.count).toBe(0);
      expect(verdictCount.count).toBe(0);
    });
  });
});
