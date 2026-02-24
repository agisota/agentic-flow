/**
 * SonaTrajectoryService - Wraps @ruvector/sona for trajectory learning
 *
 * Provides trajectory recording and action prediction for agent learning.
 * Uses @ruvector/sona for reinforcement learning when available,
 * otherwise falls back to in-memory trajectory storage with simple
 * frequency-based prediction.
 *
 * Usage:
 *   const sona = new SonaTrajectoryService();
 *   await sona.initialize();
 *
 *   // Record agent trajectories
 *   await sona.recordTrajectory('coder', [
 *     { state: { task: 'implement' }, action: 'write_code', reward: 0.8 },
 *     { state: { task: 'test' }, action: 'run_tests', reward: 0.9 }
 *   ]);
 *
 *   // Predict next action
 *   const prediction = await sona.predict({ task: 'implement' });
 */

export interface TrajectoryStep {
  state: any;
  action: string;
  reward: number;
}

export interface StoredTrajectory {
  steps: TrajectoryStep[];
  reward: number;
}

export interface PredictionResult {
  action: string;
  confidence: number;
}

export interface SonaStats {
  available: boolean;
  trajectoryCount: number;
  agentTypes: string[];
}

export class SonaTrajectoryService {
  private sona: any = null;
  private available: boolean = false;
  private trajectories: Map<string, StoredTrajectory[]> = new Map();

  /**
   * Initialize the trajectory service
   *
   * Attempts to load @ruvector/sona for RL-based trajectory learning.
   * If unavailable, falls back to in-memory trajectory storage.
   *
   * @returns true if @ruvector/sona was loaded, false if using fallback
   */
  async initialize(): Promise<boolean> {
    try {
      const mod = await import('@ruvector/sona');
      const SONA = (mod as any).SONA || (mod as any).Sona ||
                   (mod as any).default?.SONA || (mod as any).default?.Sona ||
                   (mod as any).default;

      if (SONA && typeof SONA === 'function') {
        this.sona = new SONA();
        this.available = true;
        return true;
      } else if (SONA && typeof SONA === 'object') {
        // Already an instance
        this.sona = SONA;
        this.available = true;
        return true;
      }

      this.available = false;
      return false;
    } catch {
      this.available = false;
      return false;
    }
  }

  /**
   * Record a trajectory for an agent type
   *
   * When @ruvector/sona is available, steps are forwarded to the RL engine.
   * Otherwise, trajectories are stored in memory for pattern analysis.
   *
   * @param agentType - Type of agent (e.g., 'coder', 'reviewer')
   * @param steps - Sequence of state-action-reward tuples
   */
  async recordTrajectory(agentType: string, steps: TrajectoryStep[]): Promise<void> {
    if (steps.length === 0) return;

    const totalReward = steps.reduce((sum, s) => sum + s.reward, 0) / steps.length;

    // Try @ruvector/sona first
    if (this.sona) {
      try {
        for (const step of steps) {
          if (typeof this.sona.recordStep === 'function') {
            await this.sona.recordStep(step);
          } else if (typeof this.sona.record === 'function') {
            await this.sona.record(step);
          } else if (typeof this.sona.addStep === 'function') {
            await this.sona.addStep(step.state, step.action, step.reward);
          }
        }
        // Also store in-memory for local pattern access
      } catch {
        // Fall through to in-memory storage
      }
    }

    // In-memory storage (always maintained for local analysis)
    if (!this.trajectories.has(agentType)) {
      this.trajectories.set(agentType, []);
    }
    this.trajectories.get(agentType)!.push({ steps, reward: totalReward });
  }

  /**
   * Predict the next action given a state
   *
   * When @ruvector/sona is available, uses the RL model for prediction.
   * Otherwise, uses frequency-based prediction from stored trajectories.
   *
   * @param state - Current state to predict action for
   * @returns Predicted action and confidence score
   */
  async predict(state: any): Promise<PredictionResult> {
    // Try @ruvector/sona first
    if (this.sona) {
      try {
        let result: any;
        if (typeof this.sona.predict === 'function') {
          result = await this.sona.predict(state);
        } else if (typeof this.sona.selectAction === 'function') {
          result = await this.sona.selectAction(state);
        }

        if (result) {
          return {
            action: result.action || result.name || String(result),
            confidence: result.confidence || result.probability || 0.8
          };
        }
      } catch {
        // Fall through to frequency-based prediction
      }
    }

    // Frequency-based fallback: find the most common action across trajectories
    return this.frequencyPredict();
  }

  /**
   * Get trajectory patterns, optionally filtered by agent type
   *
   * When @ruvector/sona is available, queries the RL engine for patterns.
   * Otherwise, returns stored trajectories.
   *
   * @param agentType - Optional agent type filter
   * @returns Array of trajectory patterns
   */
  async getPatterns(agentType?: string): Promise<StoredTrajectory[]> {
    // Try @ruvector/sona first
    if (this.sona) {
      try {
        if (typeof this.sona.findPatterns === 'function') {
          const patterns = await this.sona.findPatterns();
          if (patterns && Array.isArray(patterns) && patterns.length > 0) {
            return patterns;
          }
        } else if (typeof this.sona.getPatterns === 'function') {
          const patterns = await this.sona.getPatterns();
          if (patterns && Array.isArray(patterns) && patterns.length > 0) {
            return patterns;
          }
        }
      } catch {
        // Fall through to in-memory trajectories
      }
    }

    if (agentType) {
      return this.trajectories.get(agentType) || [];
    }
    return Array.from(this.trajectories.values()).flat();
  }

  /**
   * Check if @ruvector/sona is available
   */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Get service statistics
   */
  getStats(): SonaStats {
    return {
      available: this.available,
      trajectoryCount: Array.from(this.trajectories.values())
        .reduce((sum, arr) => sum + arr.length, 0),
      agentTypes: Array.from(this.trajectories.keys())
    };
  }

  /**
   * Clear all stored trajectories for an agent type, or all if not specified
   */
  clear(agentType?: string): void {
    if (agentType) {
      this.trajectories.delete(agentType);
    } else {
      this.trajectories.clear();
    }
  }

  /**
   * Frequency-based action prediction from stored trajectories
   */
  private frequencyPredict(): PredictionResult {
    const actionCounts = new Map<string, { count: number; totalReward: number }>();

    for (const trajectories of this.trajectories.values()) {
      for (const traj of trajectories) {
        for (const step of traj.steps) {
          const entry = actionCounts.get(step.action) || { count: 0, totalReward: 0 };
          entry.count++;
          entry.totalReward += step.reward;
          actionCounts.set(step.action, entry);
        }
      }
    }

    if (actionCounts.size === 0) {
      return { action: 'default', confidence: 0.5 };
    }

    // Find action with highest average reward
    let bestAction = 'default';
    let bestAvgReward = -Infinity;
    let totalActions = 0;

    for (const [action, entry] of actionCounts) {
      totalActions += entry.count;
      const avgReward = entry.totalReward / entry.count;
      if (avgReward > bestAvgReward) {
        bestAvgReward = avgReward;
        bestAction = action;
      }
    }

    // Confidence based on the proportion of observations
    const bestCount = actionCounts.get(bestAction)?.count || 0;
    const confidence = Math.min(0.95, bestCount / Math.max(totalActions, 1));

    return { action: bestAction, confidence };
  }
}
