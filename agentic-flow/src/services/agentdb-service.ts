/**
 * AgentDB Integration Service
 *
 * Singleton service providing a unified interface to AgentDB controllers.
 * Detects backends (RuVector -> HNSWLib -> sql.js) with in-memory fallback.
 */
import * as path from 'path';
import * as fs from 'fs';

// -- Public interfaces ------------------------------------------------------

export interface EpisodeData {
  sessionId: string;
  task: string;
  input?: string;
  output?: string;
  critique?: string;
  reward: number;
  success: boolean;
  latencyMs?: number;
  tokensUsed?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface Episode extends EpisodeData {
  id: number;
  ts: number;
  similarity?: number;
}

export interface SkillData {
  name: string;
  description?: string;
  code?: string;
  successRate: number;
  metadata?: Record<string, unknown>;
}

export interface Skill extends SkillData {
  id: number;
  uses: number;
  avgReward: number;
  similarity?: number;
}

export interface PatternData {
  taskType: string;
  approach: string;
  successRate: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface Pattern extends PatternData {
  id: number;
  uses: number;
  similarity?: number;
}

export interface CausalPath {
  from: string;
  to: string;
  edges: Array<{ fromId: string; toId: string; similarity: number; uplift?: number; confidence: number }>;
}

export interface TrajectoryStep {
  state: string;
  action: string;
  reward: number;
  nextState?: string;
}

export interface PredictedAction {
  action: string;
  confidence: number;
  alternatives: Array<{ action: string; confidence: number }>;
}

export interface RouteResult {
  tier: 1 | 2 | 3;
  handler: string;
  confidence: number;
  reasoning: string;
}

export interface Explanation {
  decisionId: string;
  chunks: string[];
  minimalWhy: string[];
  completenessScore: number;
}

export interface ServiceMetrics {
  backend: string;
  episodes: number;
  skills: number;
  patterns: number;
  uptime: number;
}

// -- In-memory fallback store -----------------------------------------------

class InMemoryStore<T extends { id: number }> {
  private items = new Map<number, T>();
  private nextId = 1;

  add(item: Omit<T, 'id'>): number {
    const id = this.nextId++;
    this.items.set(id, { ...item, id } as unknown as T);
    return id;
  }

  search(predicate: (item: T) => boolean, limit: number): T[] {
    const out: T[] = [];
    for (const item of this.items.values()) {
      if (predicate(item)) out.push(item);
      if (out.length >= limit) break;
    }
    return out;
  }

  get size(): number { return this.items.size; }
}

// -- Service ----------------------------------------------------------------

export class AgentDBService {
  private static instance: AgentDBService | null = null;

  private db: any = null;
  private reflexionMemory: any = null;
  private skillLibrary: any = null;
  private reasoningBank: any = null;
  private causalGraph: any = null;
  private causalRecall: any = null;
  private learningSystem: any = null;
  private embeddingService: any = null;

  private episodeStore = new InMemoryStore<Episode>();
  private skillStore = new InMemoryStore<Skill>();
  private patternStore = new InMemoryStore<Pattern>();
  private causalEdges: Array<{ from: string; to: string; metadata: unknown }> = [];
  private trajectories: Array<{ steps: TrajectoryStep[]; reward: number }> = [];

  private backendName = 'in-memory';
  private startTime = Date.now();
  private initialized = false;

  private constructor() {}

  static async getInstance(): Promise<AgentDBService> {
    if (!AgentDBService.instance) {
      AgentDBService.instance = new AgentDBService();
      await AgentDBService.instance.initialize();
    }
    return AgentDBService.instance;
  }

  static resetInstance(): void { AgentDBService.instance = null; }

  // -- Init -----------------------------------------------------------------

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    const dbDir = path.join(process.cwd(), '.claude-flow', 'agentdb');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    const dbPath = path.join(dbDir, 'agentdb.sqlite');

    try {
      const agentdb = await import(
        /* webpackIgnore: true */ '../../../packages/agentdb/src/index.js'
      );
      const AgentDB = agentdb.AgentDB ?? agentdb.default;
      this.db = new AgentDB({ dbPath });
      await this.db.initialize();

      const EmbeddingSvc = agentdb.EmbeddingService;
      this.embeddingService = new EmbeddingSvc({
        model: 'Xenova/all-MiniLM-L6-v2', dimension: 384, provider: 'transformers',
      });
      await this.embeddingService.initialize();

      const database = this.db.database;
      this.reflexionMemory = new agentdb.ReflexionMemory(database, this.embeddingService);
      this.skillLibrary = new agentdb.SkillLibrary(database, this.embeddingService);
      this.reasoningBank = new agentdb.ReasoningBank(database, this.embeddingService);
      this.causalGraph = new agentdb.CausalMemoryGraph(database);
      this.causalRecall = new agentdb.CausalRecall(database, this.embeddingService);
      this.learningSystem = new agentdb.LearningSystem(database, this.embeddingService);
      this.backendName = 'agentdb';
      console.log('[AgentDBService] Initialized with real AgentDB backend');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AgentDBService] AgentDB unavailable (${msg}), using in-memory fallback`);
      this.backendName = 'in-memory';
    }
    this.initialized = true;
  }

  // -- Episodes -------------------------------------------------------------

  async storeEpisode(episode: EpisodeData): Promise<string> {
    if (this.reflexionMemory) {
      try {
        return String(await this.reflexionMemory.storeEpisode(episode));
      } catch { this.reflexionMemory = null; }
    }
    return String(this.episodeStore.add({ ...episode, ts: Date.now(), id: 0 } as Episode));
  }

  async recallEpisodes(query: string, limit = 5): Promise<Episode[]> {
    if (this.reflexionMemory) {
      try {
        const results = await this.reflexionMemory.retrieveRelevant({ task: query, k: limit });
        return (results ?? []).map((r: any) => ({
          id: r.id ?? 0, ts: r.ts ?? 0, sessionId: r.sessionId ?? '',
          task: r.task ?? '', input: r.input, output: r.output, critique: r.critique,
          reward: r.reward ?? 0, success: r.success ?? false, similarity: r.similarity,
        }));
      } catch { this.reflexionMemory = null; }
    }
    const q = query.toLowerCase();
    return this.episodeStore.search((ep) => ep.task.toLowerCase().includes(q), limit);
  }

  // -- Skills ---------------------------------------------------------------

  async publishSkill(skill: SkillData): Promise<string> {
    if (this.skillLibrary) {
      try {
        return String(await this.skillLibrary.createSkill({
          name: skill.name, description: skill.description,
          code: skill.code, successRate: skill.successRate, metadata: skill.metadata,
        }));
      } catch { this.skillLibrary = null; }
    }
    return String(this.skillStore.add({ ...skill, id: 0, uses: 0, avgReward: 0 } as Skill));
  }

  async findSkills(description: string, limit = 5): Promise<Skill[]> {
    if (this.skillLibrary) {
      try {
        const results = await this.skillLibrary.retrieveSkills({ task: description, k: limit });
        return (results ?? []).map((r: any) => ({
          id: r.id ?? 0, name: r.name ?? '', description: r.description, code: r.code,
          successRate: r.successRate ?? 0, uses: r.uses ?? 0, avgReward: r.avgReward ?? 0,
          similarity: r.similarity,
        }));
      } catch { this.skillLibrary = null; }
    }
    const q = description.toLowerCase();
    return this.skillStore.search(
      (s) => s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q),
      limit,
    );
  }

  // -- Patterns -------------------------------------------------------------

  async storePattern(pattern: PatternData): Promise<string> {
    if (this.reasoningBank) {
      try {
        return String(await this.reasoningBank.storePattern({
          taskType: pattern.taskType, approach: pattern.approach,
          successRate: pattern.successRate, tags: pattern.tags, metadata: pattern.metadata,
        }));
      } catch { this.reasoningBank = null; }
    }
    return String(this.patternStore.add({ ...pattern, id: 0, uses: 0 } as Pattern));
  }

  async searchPatterns(query: string, limit = 5): Promise<Pattern[]> {
    if (this.reasoningBank) {
      try {
        const results = await this.reasoningBank.searchPatterns({ task: query, k: limit });
        return (results ?? []).map((r: any) => ({
          id: r.id ?? 0, taskType: r.taskType ?? '', approach: r.approach ?? '',
          successRate: r.successRate ?? 0, uses: r.uses ?? 0,
          tags: r.tags, metadata: r.metadata, similarity: r.similarity,
        }));
      } catch { this.reasoningBank = null; }
    }
    const q = query.toLowerCase();
    return this.patternStore.search(
      (p) => p.taskType.toLowerCase().includes(q) || p.approach.toLowerCase().includes(q),
      limit,
    );
  }

  // -- Causal ---------------------------------------------------------------

  async recordCausalEdge(from: string, to: string, metadata: unknown): Promise<void> {
    if (this.causalGraph) {
      try {
        await this.causalGraph.addCausalEdge({
          fromMemoryId: Number(from) || 0, fromMemoryType: 'episode',
          toMemoryId: Number(to) || 0, toMemoryType: 'episode',
          similarity: 1.0, confidence: 1.0, metadata,
        });
      } catch {
        this.causalGraph = null;
        this.causalEdges.push({ from, to, metadata });
      }
      return;
    }
    this.causalEdges.push({ from, to, metadata });
  }

  async queryCausalPath(from: string, to: string): Promise<CausalPath[]> {
    if (this.causalGraph) {
      try {
        const edges = this.causalGraph.queryCausalEffects({
          interventionMemoryId: Number(from), interventionMemoryType: 'episode',
          outcomeMemoryId: Number(to),
        });
        if (edges && edges.length > 0) {
          return [{
            from, to,
            edges: edges.map((e: any) => ({
              fromId: String(e.fromMemoryId ?? from), toId: String(e.toMemoryId ?? to),
              similarity: e.similarity ?? 0, uplift: e.uplift, confidence: e.confidence ?? 0,
            })),
          }];
        }
      } catch {
        // Fall through to in-memory lookup
      }
    }
    const direct = this.causalEdges.filter((e) => e.from === from && e.to === to);
    if (direct.length === 0) return [];
    return [{
      from, to,
      edges: direct.map((e) => ({ fromId: e.from, toId: e.to, similarity: 1.0, confidence: 1.0 })),
    }];
  }

  // -- Learning -------------------------------------------------------------

  async recordTrajectory(steps: TrajectoryStep[], reward: number): Promise<void> {
    if (this.learningSystem) {
      try {
        const sessionId = await this.learningSystem.startSession(
          'default', 'q-learning', { learningRate: 0.01, discountFactor: 0.99 },
        );
        for (const step of steps) {
          await this.learningSystem.submitFeedback({
            sessionId, action: step.action, state: step.state, reward: step.reward,
            nextState: step.nextState, success: step.reward > 0, timestamp: Date.now(),
          });
        }
      } catch {
        this.learningSystem = null;
        this.trajectories.push({ steps, reward });
      }
      return;
    }
    this.trajectories.push({ steps, reward });
  }

  async predictAction(state: any): Promise<PredictedAction> {
    if (this.learningSystem) {
      try {
        const p = await this.learningSystem.predictAction?.(String(state));
        if (p) return { action: p.action ?? 'noop', confidence: p.confidence ?? 0, alternatives: p.alternatives ?? [] };
      } catch { this.learningSystem = null; }
    }
    return { action: 'noop', confidence: 0, alternatives: [] };
  }

  // -- Graph ----------------------------------------------------------------

  async storeGraphState(nodes: any[], edges: any[]): Promise<void> {
    if (this.causalGraph) {
      try {
        for (const edge of edges) {
          await this.causalGraph.addCausalEdge({
            fromMemoryId: edge.from ?? 0, fromMemoryType: edge.fromType ?? 'episode',
            toMemoryId: edge.to ?? 0, toMemoryType: edge.toType ?? 'episode',
            similarity: edge.similarity ?? 1.0, confidence: edge.confidence ?? 1.0,
            metadata: { nodes, edgeData: edge },
          });
        }
        return;
      } catch {
        this.causalGraph = null;
      }
    }
    for (const edge of edges) {
      this.causalEdges.push({ from: String(edge.from), to: String(edge.to), metadata: { nodes, edgeData: edge } });
    }
  }

  async queryGraph(query: string): Promise<any[]> {
    if (this.causalRecall) {
      try {
        const result = await this.causalRecall.recall?.({ task: query, k: 10 });
        return result?.candidates ?? [];
      } catch { /* fall through */ }
    }
    return [];
  }

  // -- Routing --------------------------------------------------------------

  async routeSemantic(taskDescription: string): Promise<RouteResult> {
    const lower = taskDescription.toLowerCase();
    const complex = ['architecture', 'security', 'refactor', 'design', 'complex', 'optimize', 'performance', 'migration'];
    const simple = ['rename', 'format', 'lint', 'const', 'type', 'typo', 'fix import'];
    if (simple.some((kw) => lower.includes(kw)))
      return { tier: 1, handler: 'agent-booster', confidence: 0.85, reasoning: 'Simple transform detected' };
    if (complex.some((kw) => lower.includes(kw)))
      return { tier: 3, handler: 'sonnet', confidence: 0.8, reasoning: 'Complex reasoning required' };
    return { tier: 2, handler: 'haiku', confidence: 0.7, reasoning: 'Standard task complexity' };
  }

  // -- Explain --------------------------------------------------------------

  async explainDecision(decisionId: string): Promise<Explanation> {
    if (this.causalRecall?.explain) {
      const r = await this.causalRecall.explain(decisionId);
      return { decisionId, chunks: r?.chunkIds ?? [], minimalWhy: r?.minimalWhy ?? [], completenessScore: r?.completenessScore ?? 0 };
    }
    return { decisionId, chunks: [], minimalWhy: ['No explanation backend available'], completenessScore: 0 };
  }

  // -- Metrics --------------------------------------------------------------

  async getMetrics(): Promise<ServiceMetrics> {
    let episodes = this.episodeStore.size;
    let skills = this.skillStore.size;
    let patterns = this.patternStore.size;
    try {
      if (this.reflexionMemory) episodes = (await this.reflexionMemory.getEpisodeCount?.()) ?? episodes;
    } catch { /* use in-memory count */ }
    try {
      if (this.skillLibrary) skills = (await this.skillLibrary.getSkillCount?.()) ?? skills;
    } catch { /* use in-memory count */ }
    try {
      if (this.reasoningBank) patterns = (await this.reasoningBank.getPatternCount?.()) ?? patterns;
    } catch { /* use in-memory count */ }
    return { backend: this.backendName, episodes, skills, patterns, uptime: Date.now() - this.startTime };
  }

  // -- Cleanup --------------------------------------------------------------

  async shutdown(): Promise<void> {
    if (this.db && typeof this.db.close === 'function') await this.db.close();
    this.initialized = false;
    AgentDBService.instance = null;
  }
}
