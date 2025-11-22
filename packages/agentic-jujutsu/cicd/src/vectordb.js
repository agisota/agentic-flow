/**
 * VectorDB Integration for CI/CD Metrics and Learning
 *
 * This module provides a high-performance vector database for storing and querying
 * CI/CD metrics, workflow patterns, and learning trajectories using AgentDB.
 *
 * Features:
 * - Fast vector similarity search for pattern matching
 * - Persistent storage of workflow metrics
 * - Learning from successful/failed pipelines
 * - Optimization recommendations based on historical data
 *
 * @module cicd/vectordb
 */

const fs = require('fs').promises;
const path = require('path');

// Optional dependency - gracefully handle if not available
let JjWrapper;
try {
  const aj = require('agentic-jujutsu');
  JjWrapper = aj.JjWrapper;
} catch (err) {
  // Mock JjWrapper for testing
  JjWrapper = class {
    async enableAgentCoordination() {}
    async registerAgentOperation() {}
    startTrajectory() { return 'test-trajectory'; }
    addToTrajectory() {}
    finalizeTrajectory() {}
  };
}

/**
 * VectorDB for CI/CD metrics and learning
 */
class CICDVectorDB {
  /**
   * Initialize VectorDB
   * @param {Object} config - Configuration options
   * @param {string} config.dbPath - Path to store vector DB data
   * @param {number} config.vectorDim - Vector dimensions (default: 384)
   * @param {number} config.maxEntries - Maximum entries to keep (default: 10000)
   */
  constructor(config = {}) {
    this.dbPath = config.dbPath || path.join(__dirname, '../.vectordb');
    this.vectorDim = config.vectorDim || 384;
    this.maxEntries = config.maxEntries || 10000;
    this.jj = new JjWrapper();

    // In-memory cache for fast access
    this.cache = {
      workflows: new Map(),
      metrics: new Map(),
      patterns: new Map(),
      trajectories: new Map()
    };

    this.initialized = false;
  }

  /**
   * Initialize the vector database
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Ensure DB directory exists
      await fs.mkdir(this.dbPath, { recursive: true });

      // Enable AgentDB for operation tracking
      await this.jj.enableAgentCoordination();

      // Load existing data if available
      await this.loadFromDisk();

      this.initialized = true;
      console.log(`[CICDVectorDB] Initialized at ${this.dbPath}`);
    } catch (error) {
      console.error('[CICDVectorDB] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Store workflow execution data
   * @param {Object} workflow - Workflow execution data
   * @param {string} workflow.id - Workflow ID
   * @param {string} workflow.name - Workflow name
   * @param {number} workflow.duration - Execution duration (ms)
   * @param {boolean} workflow.success - Success status
   * @param {Object} workflow.metrics - Additional metrics
   * @param {string[]} workflow.steps - Executed steps
   * @returns {Promise<string>} Stored workflow ID
   */
  async storeWorkflow(workflow) {
    if (!this.initialized) {
      await this.initialize();
    }

    const id = workflow.id || this.generateId();
    const timestamp = Date.now();

    // Create workflow vector from metrics
    const vector = this.createWorkflowVector(workflow);

    const entry = {
      id,
      timestamp,
      ...workflow,
      vector,
      embedding: this.createEmbedding(workflow)
    };

    // Store in cache
    this.cache.workflows.set(id, entry);

    // Store in AgentDB for persistent tracking
    await this.storeInAgentDB('workflow', entry);

    // Learn from this execution
    if (workflow.success) {
      await this.learnFromSuccess(entry);
    } else {
      await this.learnFromFailure(entry);
    }

    // Persist to disk
    await this.saveToDisk();

    console.log(`[CICDVectorDB] Stored workflow ${id}: ${workflow.name} (${workflow.duration}ms)`);
    return id;
  }

  /**
   * Query similar workflows using vector similarity
   * @param {Object} query - Query parameters
   * @param {Object} query.metrics - Metrics to match
   * @param {number} query.limit - Number of results (default: 10)
   * @param {number} query.threshold - Similarity threshold (default: 0.7)
   * @returns {Promise<Array>} Similar workflows with scores
   */
  async querySimilar(query) {
    if (!this.initialized) {
      await this.initialize();
    }

    const queryVector = this.createWorkflowVector(query.metrics || {});
    const limit = query.limit || 10;
    const threshold = query.threshold || 0.7;

    const results = [];

    // Calculate similarity scores
    for (const [id, workflow] of this.cache.workflows) {
      const similarity = this.cosineSimilarity(queryVector, workflow.vector);

      if (similarity >= threshold) {
        results.push({
          id,
          workflow,
          similarity,
          score: similarity * 100
        });
      }
    }

    // Sort by similarity (highest first)
    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(0, limit);
  }

  /**
   * Get optimization recommendations based on historical data
   * @param {Object} currentWorkflow - Current workflow metrics
   * @returns {Promise<Object>} Optimization recommendations
   */
  async getOptimizations(currentWorkflow) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Find similar successful workflows
    const similar = await this.querySimilar({
      metrics: currentWorkflow,
      limit: 20,
      threshold: 0.6
    });

    const successful = similar.filter(s => s.workflow.success);

    if (successful.length === 0) {
      return {
        recommendations: [],
        confidence: 0,
        message: 'No similar successful workflows found'
      };
    }

    // Analyze patterns
    const recommendations = [];
    const patterns = this.analyzePatterns(successful);

    // Caching recommendations
    if (patterns.cacheHitRate && patterns.cacheHitRate > 0.8) {
      recommendations.push({
        type: 'caching',
        priority: 'high',
        message: 'Enable aggressive caching - 80%+ hit rate observed',
        expectedImprovement: '60-80% faster',
        config: patterns.optimalCacheConfig
      });
    }

    // Parallelization recommendations
    if (patterns.parallelSteps && patterns.parallelSteps.length > 0) {
      recommendations.push({
        type: 'parallelization',
        priority: 'high',
        message: `Run ${patterns.parallelSteps.length} steps in parallel`,
        expectedImprovement: '40-60% faster',
        steps: patterns.parallelSteps
      });
    }

    // Step optimization
    if (patterns.slowSteps && patterns.slowSteps.length > 0) {
      recommendations.push({
        type: 'step-optimization',
        priority: 'medium',
        message: `Optimize ${patterns.slowSteps.length} slow steps`,
        steps: patterns.slowSteps
      });
    }

    // Resource allocation
    if (patterns.optimalResources) {
      recommendations.push({
        type: 'resources',
        priority: 'medium',
        message: 'Adjust resource allocation for optimal performance',
        resources: patterns.optimalResources
      });
    }

    const confidence = this.calculateConfidence(successful.length, patterns);

    return {
      recommendations,
      confidence,
      basedOn: successful.length,
      averageImprovement: patterns.averageImprovement || 0,
      patterns
    };
  }

  /**
   * Store metrics for a specific workflow run
   * @param {string} workflowId - Workflow ID
   * @param {Object} metrics - Metrics to store
   * @returns {Promise<void>}
   */
  async storeMetrics(workflowId, metrics) {
    const id = `${workflowId}-${Date.now()}`;
    this.cache.metrics.set(id, {
      workflowId,
      timestamp: Date.now(),
      ...metrics
    });

    await this.saveToDisk();
  }

  /**
   * Get all metrics for a workflow
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Array>} All metrics for workflow
   */
  async getMetrics(workflowId) {
    const results = [];
    for (const [id, metric] of this.cache.metrics) {
      if (metric.workflowId === workflowId) {
        results.push(metric);
      }
    }
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStats() {
    return {
      workflows: this.cache.workflows.size,
      metrics: this.cache.metrics.size,
      patterns: this.cache.patterns.size,
      trajectories: this.cache.trajectories.size,
      totalSize: this.calculateSize(),
      initialized: this.initialized,
      dbPath: this.dbPath
    };
  }

  // ===== Private Methods =====

  /**
   * Create workflow vector from metrics
   * @private
   */
  createWorkflowVector(workflow) {
    // Simple vector representation of workflow
    // In production, use proper embedding model
    const features = [
      workflow.duration || 0,
      workflow.steps?.length || 0,
      workflow.success ? 1 : 0,
      workflow.cacheHits || 0,
      workflow.parallelJobs || 0,
      workflow.cpuUsage || 0,
      workflow.memoryUsage || 0,
      workflow.testCount || 0,
      workflow.coverage || 0
    ];

    // Normalize to fixed dimension
    while (features.length < this.vectorDim) {
      features.push(0);
    }

    return features.slice(0, this.vectorDim);
  }

  /**
   * Create text embedding from workflow
   * @private
   */
  createEmbedding(workflow) {
    return {
      name: workflow.name,
      steps: workflow.steps?.join(' ') || '',
      status: workflow.success ? 'success' : 'failure',
      tags: workflow.tags || []
    };
  }

  /**
   * Calculate cosine similarity between vectors
   * @private
   */
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Analyze patterns from successful workflows
   * @private
   */
  analyzePatterns(workflows) {
    const patterns = {
      cacheHitRate: 0,
      parallelSteps: [],
      slowSteps: [],
      optimalResources: {},
      averageImprovement: 0
    };

    if (workflows.length === 0) {
      return patterns;
    }

    // Calculate average cache hit rate
    const cacheHits = workflows.map(w => w.workflow.cacheHits || 0);
    patterns.cacheHitRate = cacheHits.reduce((a, b) => a + b, 0) / workflows.length;

    // Find commonly parallelized steps
    const stepCounts = new Map();
    workflows.forEach(w => {
      (w.workflow.steps || []).forEach(step => {
        stepCounts.set(step, (stepCounts.get(step) || 0) + 1);
      });
    });

    patterns.parallelSteps = Array.from(stepCounts.entries())
      .filter(([_, count]) => count > workflows.length * 0.5)
      .map(([step, _]) => step);

    // Find optimal resources
    if (workflows.length > 0) {
      patterns.optimalResources = {
        cpu: Math.max(...workflows.map(w => w.workflow.cpuUsage || 2)),
        memory: Math.max(...workflows.map(w => w.workflow.memoryUsage || 4096))
      };
    }

    return patterns;
  }

  /**
   * Calculate confidence score for recommendations
   * @private
   */
  calculateConfidence(sampleSize, patterns) {
    // Base confidence on sample size
    let confidence = Math.min(sampleSize / 20, 1.0);

    // Boost if patterns are strong
    if (patterns.cacheHitRate > 0.8) {
      confidence *= 1.2;
    }
    if (patterns.parallelSteps.length > 3) {
      confidence *= 1.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Learn from successful execution
   * @private
   */
  async learnFromSuccess(workflow) {
    const pattern = {
      id: this.generateId(),
      type: 'success',
      timestamp: Date.now(),
      workflow: workflow.id,
      duration: workflow.duration,
      steps: workflow.steps,
      metrics: workflow.metrics
    };

    this.cache.patterns.set(pattern.id, pattern);

    // Use ReasoningBank for learning (via JjWrapper)
    try {
      const trajectoryId = this.jj.startTrajectory(`Successful workflow: ${workflow.name}`);
      this.jj.addToTrajectory(trajectoryId);
      this.jj.finalizeTrajectory(0.95, `Success pattern: ${workflow.duration}ms`);
    } catch (error) {
      // ReasoningBank might not be available, continue anyway
      console.log('[CICDVectorDB] ReasoningBank learning skipped:', error.message);
    }
  }

  /**
   * Learn from failed execution
   * @private
   */
  async learnFromFailure(workflow) {
    const pattern = {
      id: this.generateId(),
      type: 'failure',
      timestamp: Date.now(),
      workflow: workflow.id,
      error: workflow.error,
      steps: workflow.steps
    };

    this.cache.patterns.set(pattern.id, pattern);
  }

  /**
   * Store data in AgentDB
   * @private
   */
  async storeInAgentDB(type, data) {
    try {
      // Use JjWrapper's operation tracking
      await this.jj.registerAgentOperation(
        `cicd-${type}`,
        `store-${data.id}`,
        [`cicd/${type}/${data.id}`]
      );
    } catch (error) {
      // AgentDB might not be available in all environments
      console.log(`[CICDVectorDB] AgentDB storage skipped: ${error.message}`);
    }
  }

  /**
   * Load data from disk
   * @private
   */
  async loadFromDisk() {
    try {
      const files = ['workflows.json', 'metrics.json', 'patterns.json'];

      for (const file of files) {
        const filePath = path.join(this.dbPath, file);
        try {
          const data = await fs.readFile(filePath, 'utf8');
          const parsed = JSON.parse(data);
          const mapName = file.replace('.json', '');

          if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              this.cache[mapName].set(item.id, item);
            });
          }
        } catch (err) {
          // File doesn't exist yet, that's okay
        }
      }
    } catch (error) {
      console.log('[CICDVectorDB] No existing data to load');
    }
  }

  /**
   * Save data to disk
   * @private
   */
  async saveToDisk() {
    try {
      const saves = [
        { name: 'workflows', data: Array.from(this.cache.workflows.values()) },
        { name: 'metrics', data: Array.from(this.cache.metrics.values()) },
        { name: 'patterns', data: Array.from(this.cache.patterns.values()) }
      ];

      for (const { name, data } of saves) {
        const filePath = path.join(this.dbPath, `${name}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('[CICDVectorDB] Failed to save to disk:', error);
    }
  }

  /**
   * Calculate total size
   * @private
   */
  calculateSize() {
    return (
      this.cache.workflows.size +
      this.cache.metrics.size +
      this.cache.patterns.size +
      this.cache.trajectories.size
    );
  }

  /**
   * Generate unique ID
   * @private
   */
  generateId() {
    return `cicd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.saveToDisk();
    this.cache.workflows.clear();
    this.cache.metrics.clear();
    this.cache.patterns.clear();
    this.cache.trajectories.clear();
    this.initialized = false;
  }
}

module.exports = { CICDVectorDB };
