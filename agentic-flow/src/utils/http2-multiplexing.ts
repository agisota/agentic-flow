/**
 * HTTP/2 Multiplexing Optimization
 * Stream prioritization and flow control for concurrent request optimization
 * Phase 2 Optimization
 */

import * as http2 from 'http2';

export interface StreamPriority {
  weight: number; // 1-256
  exclusive: boolean;
  dependency?: number;
}

export interface MultiplexingConfig {
  enabled: boolean;
  maxConcurrentStreams?: number;
  defaultPriority?: number;
  enableFlowControl?: boolean;
  initialWindowSize?: number;
}

export interface StreamStats {
  streamId: number;
  priority: number;
  bytesReceived: number;
  bytesSent: number;
  duration: number;
  state: 'open' | 'half-closed' | 'closed';
}

/**
 * HTTP/2 Multiplexing Manager
 * Manages stream prioritization and concurrent request handling
 */
export class HTTP2MultiplexingManager {
  private config: Required<MultiplexingConfig>;
  private activeStreams: Map<number, StreamInfo> = new Map();
  private priorityQueues: Map<number, Set<number>> = new Map();
  private stats: MultiplexingStats;

  constructor(config: MultiplexingConfig) {
    this.config = {
      enabled: config.enabled,
      maxConcurrentStreams: config.maxConcurrentStreams || 100,
      defaultPriority: config.defaultPriority || 16,
      enableFlowControl: config.enableFlowControl !== false,
      initialWindowSize: config.initialWindowSize || 65535
    };

    this.stats = {
      totalStreams: 0,
      activeStreams: 0,
      completedStreams: 0,
      averageDuration: 0,
      priorityChanges: 0
    };

    this.initializePriorityQueues();
  }

  /**
   * Initialize priority queues (1-256)
   */
  private initializePriorityQueues(): void {
    for (let i = 1; i <= 256; i++) {
      this.priorityQueues.set(i, new Set());
    }
  }

  /**
   * Register a new stream
   */
  registerStream(
    stream: http2.ServerHttp2Stream,
    priority?: StreamPriority
  ): void {
    if (!this.config.enabled) return;

    const streamId = stream.id;
    const streamPriority = priority?.weight || this.config.defaultPriority;

    const info: StreamInfo = {
      stream,
      priority: streamPriority,
      bytesReceived: 0,
      bytesSent: 0,
      startTime: Date.now(),
      state: 'open'
    };

    this.activeStreams.set(streamId, info);
    this.priorityQueues.get(streamPriority)?.add(streamId);

    this.stats.totalStreams++;
    this.stats.activeStreams++;

    // Set stream priority
    if (priority) {
      this.setPriority(stream, priority);
    }

    // Setup event handlers
    this.setupStreamHandlers(stream, streamId);
  }

  /**
   * Set stream priority
   */
  setPriority(stream: http2.ServerHttp2Stream, priority: StreamPriority): void {
    try {
      stream.priority(priority);

      const info = this.activeStreams.get(stream.id);
      if (info) {
        // Move to new priority queue
        this.priorityQueues.get(info.priority)?.delete(stream.id);
        info.priority = priority.weight;
        this.priorityQueues.get(priority.weight)?.add(stream.id);
        this.stats.priorityChanges++;
      }
    } catch (error) {
      // Stream may be closed
    }
  }

  /**
   * Adjust stream priority based on load
   */
  adjustPriority(streamId: number, adjustment: number): void {
    const info = this.activeStreams.get(streamId);
    if (!info) return;

    const newPriority = Math.max(1, Math.min(256, info.priority + adjustment));
    this.setPriority(info.stream, {
      weight: newPriority,
      exclusive: false
    });
  }

  /**
   * Get next stream to process based on priority
   */
  getNextStream(): http2.ServerHttp2Stream | null {
    // Process highest priority streams first (256 is highest)
    for (let priority = 256; priority >= 1; priority--) {
      const queue = this.priorityQueues.get(priority);
      if (queue && queue.size > 0) {
        const streamId = queue.values().next().value;
        const info = this.activeStreams.get(streamId);
        if (info && info.state === 'open') {
          return info.stream;
        }
      }
    }

    return null;
  }

  /**
   * Setup stream event handlers
   */
  private setupStreamHandlers(stream: http2.ServerHttp2Stream, streamId: number): void {
    stream.on('data', (chunk: Buffer) => {
      const info = this.activeStreams.get(streamId);
      if (info) {
        info.bytesReceived += chunk.length;
      }
    });

    stream.on('end', () => {
      this.updateStreamState(streamId, 'half-closed');
    });

    stream.on('close', () => {
      this.handleStreamClose(streamId);
    });

    stream.on('error', () => {
      this.handleStreamClose(streamId);
    });
  }

  /**
   * Update stream state
   */
  private updateStreamState(streamId: number, state: 'open' | 'half-closed' | 'closed'): void {
    const info = this.activeStreams.get(streamId);
    if (info) {
      info.state = state;
    }
  }

  /**
   * Handle stream closure
   */
  private handleStreamClose(streamId: number): void {
    const info = this.activeStreams.get(streamId);
    if (!info) return;

    // Remove from priority queue
    this.priorityQueues.get(info.priority)?.delete(streamId);

    // Update statistics
    const duration = Date.now() - info.startTime;
    this.updateStats(duration);

    // Remove from active streams
    this.activeStreams.delete(streamId);
    this.stats.activeStreams--;
    this.stats.completedStreams++;
  }

  /**
   * Update statistics
   */
  private updateStats(duration: number): void {
    const currentAvg = this.stats.averageDuration;
    const total = this.stats.completedStreams;

    this.stats.averageDuration = (currentAvg * (total - 1) + duration) / total;
  }

  /**
   * Get stream statistics
   */
  getStreamStats(streamId: number): StreamStats | null {
    const info = this.activeStreams.get(streamId);
    if (!info) return null;

    return {
      streamId,
      priority: info.priority,
      bytesReceived: info.bytesReceived,
      bytesSent: info.bytesSent,
      duration: Date.now() - info.startTime,
      state: info.state
    };
  }

  /**
   * Get all statistics
   */
  getStats(): MultiplexingStats & {
    priorityDistribution: Map<number, number>;
  } {
    const priorityDistribution = new Map<number, number>();

    for (const [priority, queue] of this.priorityQueues) {
      if (queue.size > 0) {
        priorityDistribution.set(priority, queue.size);
      }
    }

    return {
      ...this.stats,
      priorityDistribution
    };
  }

  /**
   * Check if can accept more streams
   */
  canAcceptStream(): boolean {
    return this.stats.activeStreams < this.config.maxConcurrentStreams;
  }

  /**
   * Get load percentage
   */
  getLoad(): number {
    return (this.stats.activeStreams / this.config.maxConcurrentStreams) * 100;
  }
}

interface StreamInfo {
  stream: http2.ServerHttp2Stream;
  priority: number;
  bytesReceived: number;
  bytesSent: number;
  startTime: number;
  state: 'open' | 'half-closed' | 'closed';
}

interface MultiplexingStats {
  totalStreams: number;
  activeStreams: number;
  completedStreams: number;
  averageDuration: number;
  priorityChanges: number;
}

/**
 * Flow Control Manager
 * Manages HTTP/2 flow control for optimal throughput
 */
export class FlowControlManager {
  private windowSizes: Map<number, number> = new Map();
  private config: {
    initialWindowSize: number;
    maxWindowSize: number;
    minWindowSize: number;
  };

  constructor(config?: Partial<typeof FlowControlManager.prototype.config>) {
    this.config = {
      initialWindowSize: config?.initialWindowSize || 65535,
      maxWindowSize: config?.maxWindowSize || 16777215, // 16MB
      minWindowSize: config?.minWindowSize || 16384  // 16KB
    };
  }

  /**
   * Initialize window size for a stream
   */
  initializeWindow(streamId: number): void {
    this.windowSizes.set(streamId, this.config.initialWindowSize);
  }

  /**
   * Update window size
   */
  updateWindow(streamId: number, delta: number): number {
    const current = this.windowSizes.get(streamId) || this.config.initialWindowSize;
    const newSize = Math.max(
      this.config.minWindowSize,
      Math.min(this.config.maxWindowSize, current + delta)
    );

    this.windowSizes.set(streamId, newSize);
    return newSize;
  }

  /**
   * Get current window size
   */
  getWindowSize(streamId: number): number {
    return this.windowSizes.get(streamId) || this.config.initialWindowSize;
  }

  /**
   * Calculate optimal window size based on throughput
   */
  calculateOptimalWindow(throughputBps: number, rttMs: number): number {
    // Bandwidth-Delay Product
    const bdp = (throughputBps / 8) * (rttMs / 1000);

    return Math.max(
      this.config.minWindowSize,
      Math.min(this.config.maxWindowSize, Math.ceil(bdp * 2))
    );
  }

  /**
   * Clean up closed stream
   */
  cleanup(streamId: number): void {
    this.windowSizes.delete(streamId);
  }
}

/**
 * Priority scheduler for optimal stream processing
 */
export class PriorityScheduler {
  private queues: Map<number, number[]> = new Map();

  /**
   * Add stream to priority queue
   */
  enqueue(streamId: number, priority: number): void {
    if (!this.queues.has(priority)) {
      this.queues.set(priority, []);
    }
    this.queues.get(priority)!.push(streamId);
  }

  /**
   * Get next stream to process
   */
  dequeue(): number | null {
    // Process highest priority first
    for (let priority = 256; priority >= 1; priority--) {
      const queue = this.queues.get(priority);
      if (queue && queue.length > 0) {
        return queue.shift()!;
      }
    }
    return null;
  }

  /**
   * Remove stream from all queues
   */
  remove(streamId: number): void {
    for (const queue of this.queues.values()) {
      const index = queue.indexOf(streamId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }
  }

  /**
   * Get queue sizes
   */
  getStats(): Map<number, number> {
    const stats = new Map<number, number>();
    for (const [priority, queue] of this.queues) {
      if (queue.length > 0) {
        stats.set(priority, queue.length);
      }
    }
    return stats;
  }
}
