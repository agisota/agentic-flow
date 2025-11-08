/**
 * Sandbox Manager - Core abstraction for isolated agent execution environments
 *
 * Provides a unified interface for Docker and E2B cloud sandboxes with:
 * - Lifecycle management (create, start, stop, destroy)
 * - Resource isolation and limits
 * - File system virtualization
 * - Network isolation
 * - Factory pattern for multi-provider support
 *
 * @module sandbox-manager
 */

import { logger } from '../../agentic-flow/src/utils/logger.js';

/**
 * Sandbox lifecycle states
 */
export enum SandboxState {
  CREATED = 'created',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  DESTROYED = 'destroyed',
  ERROR = 'error'
}

/**
 * Sandbox resource limits
 */
export interface ResourceLimits {
  /** Maximum memory in MB */
  memoryMB?: number;
  /** Maximum CPU cores (fractional allowed) */
  cpuCores?: number;
  /** Maximum disk space in MB */
  diskMB?: number;
  /** Maximum network bandwidth in Mbps */
  networkMbps?: number;
  /** Execution timeout in seconds */
  timeoutSeconds?: number;
}

/**
 * Sandbox execution result
 */
export interface ExecutionResult {
  /** Exit code (0 = success) */
  exitCode: number;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Execution duration in milliseconds */
  durationMs: number;
  /** Whether execution timed out */
  timedOut: boolean;
}

/**
 * File system operation result
 */
export interface FileOperation {
  /** File path within sandbox */
  path: string;
  /** File content (for read/write operations) */
  content?: string;
  /** Success status */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Core Sandbox interface - implemented by Docker and E2B providers
 */
export interface Sandbox {
  /** Unique sandbox identifier */
  readonly id: string;

  /** Sandbox provider type */
  readonly provider: 'docker' | 'e2b';

  /** Current sandbox state */
  readonly state: SandboxState;

  /** Resource limits configuration */
  readonly limits: ResourceLimits;

  /**
   * Start the sandbox environment
   * @throws {Error} If sandbox cannot be started
   */
  start(): Promise<void>;

  /**
   * Execute a command in the sandbox
   * @param command - Command to execute
   * @param args - Command arguments
   * @param options - Execution options (timeout, env vars, etc.)
   * @returns Execution result with stdout, stderr, exit code
   */
  execute(
    command: string,
    args?: string[],
    options?: {
      timeout?: number;
      env?: Record<string, string>;
      workdir?: string;
    }
  ): Promise<ExecutionResult>;

  /**
   * Write a file to the sandbox filesystem
   * @param path - File path within sandbox
   * @param content - File content
   * @returns Operation result
   */
  writeFile(path: string, content: string): Promise<FileOperation>;

  /**
   * Read a file from the sandbox filesystem
   * @param path - File path within sandbox
   * @returns File content and operation status
   */
  readFile(path: string): Promise<FileOperation>;

  /**
   * List files in a sandbox directory
   * @param path - Directory path within sandbox
   * @returns Array of file paths
   */
  listFiles(path: string): Promise<string[]>;

  /**
   * Delete a file from the sandbox
   * @param path - File path to delete
   * @returns Operation result
   */
  deleteFile(path: string): Promise<FileOperation>;

  /**
   * Stop the sandbox (pause execution)
   * @returns Promise that resolves when stopped
   */
  stop(): Promise<void>;

  /**
   * Destroy the sandbox and cleanup all resources
   * @returns Promise that resolves when destroyed
   */
  destroy(): Promise<void>;

  /**
   * Get current resource usage statistics
   * @returns Resource usage metrics
   */
  getStats(): Promise<{
    memoryUsageMB: number;
    cpuPercent: number;
    diskUsageMB: number;
    networkRxMB: number;
    networkTxMB: number;
  }>;

  /**
   * Check if sandbox is healthy and responsive
   * @returns Health check result
   */
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
}

/**
 * Sandbox configuration options
 */
export interface SandboxConfig {
  /** Sandbox provider type */
  provider: 'docker' | 'e2b';

  /** Base image or template to use */
  image?: string;

  /** Resource limits */
  limits?: ResourceLimits;

  /** Network isolation mode */
  networkMode?: 'none' | 'isolated' | 'bridge';

  /** Environment variables */
  env?: Record<string, string>;

  /** Working directory */
  workdir?: string;

  /** Enable GPU access */
  gpu?: boolean;

  /** Custom metadata */
  metadata?: Record<string, any>;

  /** E2B-specific configuration */
  e2b?: {
    apiKey: string;
    templateId?: string;
    region?: string;
  };

  /** Docker-specific configuration */
  docker?: {
    socketPath?: string;
    registryAuth?: {
      username: string;
      password: string;
    };
  };
}

/**
 * Sandbox Manager - Factory and orchestration for sandbox instances
 */
export class SandboxManager {
  private sandboxes: Map<string, Sandbox> = new Map();
  private defaultConfig: Partial<SandboxConfig>;

  constructor(defaultConfig: Partial<SandboxConfig> = {}) {
    this.defaultConfig = {
      provider: 'docker',
      networkMode: 'isolated',
      limits: {
        memoryMB: 512,
        cpuCores: 1,
        diskMB: 1024,
        timeoutSeconds: 300
      },
      ...defaultConfig
    };

    logger.info('SandboxManager initialized', {
      defaultProvider: this.defaultConfig.provider,
      defaultLimits: this.defaultConfig.limits
    });
  }

  /**
   * Create a new sandbox instance
   * @param config - Sandbox configuration (merged with defaults)
   * @returns Created sandbox instance
   */
  async createSandbox(config: Partial<SandboxConfig> = {}): Promise<Sandbox> {
    const mergedConfig: SandboxConfig = {
      ...this.defaultConfig,
      ...config,
      limits: {
        ...this.defaultConfig.limits,
        ...config.limits
      }
    } as SandboxConfig;

    logger.info('Creating sandbox', {
      provider: mergedConfig.provider,
      limits: mergedConfig.limits
    });

    let sandbox: Sandbox;

    try {
      // Factory pattern - create appropriate sandbox type
      if (mergedConfig.provider === 'docker') {
        const { DockerSandbox } = await import('./docker-sandbox.js');
        sandbox = new DockerSandbox(mergedConfig);
      } else if (mergedConfig.provider === 'e2b') {
        const { E2BSandbox } = await import('./e2b-sandbox.js');
        sandbox = new E2BSandbox(mergedConfig);
      } else {
        throw new Error(`Unsupported sandbox provider: ${mergedConfig.provider}`);
      }

      // Register sandbox
      this.sandboxes.set(sandbox.id, sandbox);

      logger.info('Sandbox created', {
        id: sandbox.id,
        provider: sandbox.provider
      });

      return sandbox;
    } catch (error: any) {
      logger.error('Failed to create sandbox', {
        provider: mergedConfig.provider,
        error: error.message
      });
      throw new Error(`Sandbox creation failed: ${error.message}`);
    }
  }

  /**
   * Get a sandbox by ID
   * @param id - Sandbox identifier
   * @returns Sandbox instance or undefined
   */
  getSandbox(id: string): Sandbox | undefined {
    return this.sandboxes.get(id);
  }

  /**
   * List all active sandboxes
   * @returns Array of sandbox instances
   */
  listSandboxes(): Sandbox[] {
    return Array.from(this.sandboxes.values());
  }

  /**
   * Destroy a sandbox by ID
   * @param id - Sandbox identifier
   */
  async destroySandbox(id: string): Promise<void> {
    const sandbox = this.sandboxes.get(id);
    if (!sandbox) {
      logger.warn('Sandbox not found for destruction', { id });
      return;
    }

    try {
      await sandbox.destroy();
      this.sandboxes.delete(id);

      logger.info('Sandbox destroyed', { id });
    } catch (error: any) {
      logger.error('Failed to destroy sandbox', {
        id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Destroy all sandboxes
   */
  async destroyAll(): Promise<void> {
    logger.info('Destroying all sandboxes', {
      count: this.sandboxes.size
    });

    const destroyPromises = Array.from(this.sandboxes.keys()).map(id =>
      this.destroySandbox(id).catch(error => {
        logger.error('Failed to destroy sandbox during cleanup', {
          id,
          error: error.message
        });
      })
    );

    await Promise.all(destroyPromises);

    logger.info('All sandboxes destroyed');
  }

  /**
   * Get statistics for all sandboxes
   */
  async getAllStats(): Promise<Array<{
    id: string;
    provider: string;
    stats: Awaited<ReturnType<Sandbox['getStats']>>;
  }>> {
    const statsPromises = Array.from(this.sandboxes.values()).map(async sandbox => ({
      id: sandbox.id,
      provider: sandbox.provider,
      stats: await sandbox.getStats()
    }));

    return Promise.all(statsPromises);
  }

  /**
   * Health check all sandboxes
   */
  async healthCheckAll(): Promise<Array<{
    id: string;
    provider: string;
    health: Awaited<ReturnType<Sandbox['healthCheck']>>;
  }>> {
    const healthPromises = Array.from(this.sandboxes.values()).map(async sandbox => ({
      id: sandbox.id,
      provider: sandbox.provider,
      health: await sandbox.healthCheck()
    }));

    return Promise.all(healthPromises);
  }
}

/**
 * Global singleton instance for convenience
 */
export const sandboxManager = new SandboxManager();
