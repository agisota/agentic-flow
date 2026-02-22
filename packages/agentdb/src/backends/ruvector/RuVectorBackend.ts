/**
 * RuVectorBackend - High-Performance Vector Storage
 *
 * Implements VectorBackend using @ruvector/core with optional GNN support.
 * Provides <100µs search latency with native SIMD optimizations.
 *
 * Features:
 * - Automatic fallback when @ruvector packages not installed
 * - Separate metadata storage for rich queries
 * - Distance-to-similarity conversion for all metrics
 * - Batch operations for optimal throughput
 * - Persistent storage with separate metadata files
 */

import type { VectorBackend, VectorConfig, SearchResult, SearchOptions, VectorStats } from '../VectorBackend.js';

export class RuVectorBackend implements VectorBackend {
  readonly name = 'ruvector' as const;
  private db: any; // VectorDB from @ruvector/core
  private config: VectorConfig;
  private metadata: Map<string, Record<string, any>> = new Map();
  private initialized = false;

  // String ID <-> Numeric Label mappings (N-API layer requires numeric IDs)
  private idToLabel: Map<string, number> = new Map();
  private labelToId: Map<number, string> = new Map();
  private nextLabel: number = 1; // RuVector uses 1-based labels

  constructor(config: VectorConfig) {
    // Handle both dimension and dimensions for backward compatibility
    const dimension = config.dimension ?? config.dimensions;
    if (!dimension) {
      throw new Error('Vector dimension is required (use dimension or dimensions)');
    }
    // Store both forms for compatibility with different backends
    this.config = { ...config, dimension, dimensions: dimension };
  }

  /**
   * Initialize RuVector database with optional dependency handling
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try main ruvector package first (includes core, gnn, graph)
      let VectorDB;
      try {
        const ruvector = await import('ruvector');
        VectorDB = ruvector.VectorDB || ruvector.default?.VectorDB;
      } catch {
        // Fallback to @ruvector/core for backward compatibility
        const core = await import('@ruvector/core');
        // ESM and CommonJS both export as VectorDB (capital 'DB')
        VectorDB = core.VectorDB || core.default?.VectorDB;
      }

      if (!VectorDB) {
        throw new Error('Could not find VectorDB export in @ruvector/core');
      }

      // Handle both 'dimension' and 'dimensions' for backward compatibility
      const dimensions = this.config.dimension ?? this.config.dimensions;
      if (!dimensions) {
        throw new Error('Vector dimension is required (use dimension or dimensions)');
      }

      // RuVector VectorDB constructor signature
      this.db = new VectorDB({
        dimensions: dimensions,  // Note: config object, not positional arg
        metric: this.config.metric,
        maxElements: this.config.maxElements || 100000,
        efConstruction: this.config.efConstruction || 200,
        m: this.config.M || 16  // Note: lowercase 'm'
      });

      this.initialized = true;
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Special handling for path validation errors (from ruvector package)
      // When using :memory:, ruvector may reject it as a path traversal attempt
      // This is expected and not critical - users should use file-based paths for ruvector persistence
      if (errorMessage.includes('Path traversal') || errorMessage.includes('Invalid path')) {
        throw new Error(
          `RuVector does not support :memory: database paths.\n` +
          `Use a file path instead, or RuVector will be skipped and fallback backend will be used.\n` +
          `Original error: ${errorMessage}`
        );
      }

      throw new Error(
        `RuVector initialization failed. Please install: npm install ruvector\n` +
        `Or legacy packages: npm install @ruvector/core\n` +
        `Error: ${errorMessage}`
      );
    }
  }

  /**
   * Insert single vector with optional metadata
   *
   * Maps string IDs to numeric labels before passing to the N-API layer,
   * which internally requires i64 IDs. Without this mapping, non-numeric
   * string IDs (e.g. UUIDs) would be silently dropped.
   */
  insert(id: string, embedding: Float32Array, metadata?: Record<string, any>): void {
    this.ensureInitialized();

    // Assign or reuse a numeric label for this string ID
    let label = this.idToLabel.get(id);
    if (label === undefined) {
      label = this.nextLabel++;
      this.idToLabel.set(id, label);
      this.labelToId.set(label, id);
    }

    // Pass numeric label (as string) to the N-API layer
    this.db.insert(String(label), Array.from(embedding));

    if (metadata) {
      this.metadata.set(id, metadata);
    }
  }

  /**
   * Batch insert for optimal performance
   */
  insertBatch(items: Array<{ id: string; embedding: Float32Array; metadata?: Record<string, any> }>): void {
    this.ensureInitialized();

    for (const item of items) {
      this.insert(item.id, item.embedding, item.metadata);
    }
  }

  /**
   * Search for k-nearest neighbors with optional filtering
   */
  search(query: Float32Array, k: number, options?: SearchOptions): SearchResult[] {
    this.ensureInitialized();

    // Apply efSearch parameter if provided
    if (options?.efSearch) {
      this.db.setEfSearch(options.efSearch);
    }

    // Perform vector search
    const results = this.db.search(Array.from(query), k);

    // Convert results: map numeric labels back to original string IDs
    return results
      .map((r: { id: string; distance: number }) => {
        const numericLabel = Number(r.id);
        const originalId = this.labelToId.get(numericLabel) ?? r.id;
        return {
          id: originalId,
          distance: r.distance,
          similarity: this.distanceToSimilarity(r.distance),
          metadata: this.metadata.get(originalId)
        };
      })
      .filter((r: SearchResult) => {
        // Apply similarity threshold
        if (options?.threshold && r.similarity < options.threshold) {
          return false;
        }

        // Apply metadata filters
        if (options?.filter && r.metadata) {
          return Object.entries(options.filter).every(
            ([key, value]) => r.metadata![key] === value
          );
        }

        return true;
      });
  }

  /**
   * Remove vector by ID
   */
  remove(id: string): boolean {
    this.ensureInitialized();

    const label = this.idToLabel.get(id);
    if (label === undefined) {
      return false;
    }

    this.metadata.delete(id);
    this.idToLabel.delete(id);
    this.labelToId.delete(label);

    try {
      return this.db.remove(String(label));
    } catch {
      return false;
    }
  }

  /**
   * Get database statistics
   */
  getStats(): VectorStats {
    this.ensureInitialized();

    return {
      count: this.db.count(),
      dimension: this.config.dimension || 384,
      metric: this.config.metric,
      backend: 'ruvector',
      memoryUsage: this.db.memoryUsage?.() || 0
    };
  }

  /**
   * Save index, metadata, and ID mappings to disk
   */
  async save(path: string): Promise<void> {
    this.ensureInitialized();

    // Save vector index
    this.db.save(path);

    // Save metadata and ID mappings as a single sidecar JSON file
    const metadataPath = path + '.meta.json';
    const fs = await import('fs/promises');
    const savedData = {
      metadata: Object.fromEntries(this.metadata),
      idToLabel: Object.fromEntries(this.idToLabel),
      labelToId: Object.fromEntries(
        Array.from(this.labelToId.entries()).map(([k, v]) => [String(k), v])
      ),
      nextLabel: this.nextLabel,
    };
    await fs.writeFile(metadataPath, JSON.stringify(savedData, null, 2));
  }

  /**
   * Load index, metadata, and ID mappings from disk
   */
  async load(path: string): Promise<void> {
    this.ensureInitialized();

    // Load vector index
    this.db.load(path);

    // Load metadata and ID mappings
    const metadataPath = path + '.meta.json';
    try {
      const fs = await import('fs/promises');
      const raw = await fs.readFile(metadataPath, 'utf-8');
      const data = JSON.parse(raw);

      // Support both new format (with mappings) and legacy format (metadata-only)
      if (data.idToLabel) {
        // New format: includes ID mappings
        this.metadata = new Map(Object.entries(data.metadata || {}));
        this.idToLabel = new Map(Object.entries(data.idToLabel).map(
          ([k, v]) => [k, v as number]
        ));
        this.labelToId = new Map(Object.entries(data.labelToId).map(
          ([k, v]) => [Number(k), v as string]
        ));
        this.nextLabel = data.nextLabel || 1;
      } else {
        // Legacy format: only metadata, no mappings
        this.metadata = new Map(Object.entries(data));
        console.debug('[RuVectorBackend] Loaded legacy metadata format (no ID mappings)');
      }
    } catch {
      // No metadata file - this is okay for backward compatibility
      console.debug(`[RuVectorBackend] No metadata file found at ${metadataPath}`);
    }
  }

  /**
   * Close and cleanup resources
   */
  close(): void {
    this.metadata.clear();
    this.idToLabel.clear();
    this.labelToId.clear();
    this.nextLabel = 1;
  }

  /**
   * Convert distance to similarity score based on metric
   *
   * Cosine: distance is already in [0, 2], where 0 = identical
   * L2: exponential decay for unbounded distances
   * IP: negative inner product, so negate for similarity
   */
  private distanceToSimilarity(distance: number): number {
    switch (this.config.metric) {
      case 'cosine':
        return 1 - distance; // cosine distance is 1 - similarity
      case 'l2':
        return Math.exp(-distance); // exponential decay
      case 'ip':
        return -distance; // inner product: higher is better
      default:
        return 1 - distance;
    }
  }

  /**
   * Ensure database is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('RuVectorBackend not initialized. Call initialize() first.');
    }
  }
}
