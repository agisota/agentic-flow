/**
 * Sandboxed Agent Executor
 *
 * Wraps Claude Agent SDK execution with sandbox isolation:
 * - Intercepts file operations and redirects to sandbox
 * - Isolates bash command execution
 * - Maps virtual filesystem paths
 * - Enforces network isolation
 * - Provides resource monitoring
 *
 * @module sandboxed-agent-executor
 */

import {
  Sandbox,
  SandboxManager,
  SandboxConfig
} from './sandbox-manager.js';
import { logger } from '../../agentic-flow/src/utils/logger.js';

/**
 * Agent execution context within sandbox
 */
export interface SandboxedAgentContext {
  /** Sandbox instance */
  sandbox: Sandbox;

  /** Virtual workspace path (inside sandbox) */
  workspacePath: string;

  /** Execution metadata */
  metadata: {
    agentName: string;
    startTime: number;
    commandsExecuted: number;
    filesCreated: number;
    errors: number;
  };
}

/**
 * Tool call interceptor for sandbox isolation
 */
export interface ToolCallInterceptor {
  /** Tool name to intercept */
  toolName: string;

  /**
   * Handler function that receives the tool call and context
   * @returns Modified tool parameters or null to skip
   */
  handler: (
    params: any,
    context: SandboxedAgentContext
  ) => Promise<any | null>;
}

/**
 * Sandboxed agent execution result
 */
export interface SandboxedExecutionResult {
  /** Agent output */
  output: string;

  /** Exit code (0 = success) */
  exitCode: number;

  /** Execution duration in milliseconds */
  durationMs: number;

  /** Sandbox statistics */
  stats: {
    commandsExecuted: number;
    filesCreated: number;
    memoryUsageMB: number;
    cpuPercent: number;
    errors: number;
  };

  /** Created files (available after execution) */
  files: Array<{ path: string; content: string }>;
}

/**
 * Configuration for sandboxed agent execution
 */
export interface SandboxedAgentConfig {
  /** Agent name/identifier */
  agentName: string;

  /** Agent system prompt */
  systemPrompt: string;

  /** Sandbox configuration */
  sandboxConfig: SandboxConfig;

  /** Virtual workspace path inside sandbox */
  workspacePath?: string;

  /** Tool call interceptors */
  interceptors?: ToolCallInterceptor[];

  /** Auto-cleanup sandbox after execution */
  autoCleanup?: boolean;

  /** Capture created files */
  captureFiles?: boolean;

  /** File patterns to capture (e.g., ['*.js', '*.json']) */
  capturePatterns?: string[];
}

/**
 * Sandboxed Agent Executor
 *
 * Provides isolated execution environment for Claude agents with:
 * - File system virtualization
 * - Command execution isolation
 * - Resource monitoring
 * - Automatic cleanup
 */
export class SandboxedAgentExecutor {
  private sandboxManager: SandboxManager;
  private activeSandboxes: Map<string, SandboxedAgentContext> = new Map();

  constructor(sandboxManager?: SandboxManager) {
    this.sandboxManager = sandboxManager || new SandboxManager();

    logger.info('SandboxedAgentExecutor initialized');
  }

  /**
   * Execute an agent task within an isolated sandbox
   *
   * @param task - Task description for the agent
   * @param config - Sandboxed agent configuration
   * @returns Execution result with output and statistics
   */
  async execute(
    task: string,
    config: SandboxedAgentConfig
  ): Promise<SandboxedExecutionResult> {
    const startTime = Date.now();
    let sandbox: Sandbox | null = null;

    try {
      // Create and start sandbox
      logger.info('Creating sandbox for agent execution', {
        agent: config.agentName,
        provider: config.sandboxConfig.provider
      });

      sandbox = await this.sandboxManager.createSandbox(config.sandboxConfig);
      await sandbox.start();

      // Create execution context
      const context: SandboxedAgentContext = {
        sandbox,
        workspacePath: config.workspacePath || '/workspace',
        metadata: {
          agentName: config.agentName,
          startTime,
          commandsExecuted: 0,
          filesCreated: 0,
          errors: 0
        }
      };

      this.activeSandboxes.set(sandbox.id, context);

      // Setup workspace
      await this.setupWorkspace(context);

      // Execute agent with tool interception
      const output = await this.executeAgent(task, config, context);

      // Capture files if requested
      const files = config.captureFiles
        ? await this.captureFiles(context, config.capturePatterns)
        : [];

      // Get final stats
      const stats = await sandbox.getStats();

      const durationMs = Date.now() - startTime;

      logger.info('Agent execution completed', {
        agent: config.agentName,
        durationMs,
        commandsExecuted: context.metadata.commandsExecuted,
        filesCreated: context.metadata.filesCreated
      });

      // Cleanup if requested
      if (config.autoCleanup !== false) {
        await this.cleanup(sandbox.id);
      }

      return {
        output,
        exitCode: 0,
        durationMs,
        stats: {
          commandsExecuted: context.metadata.commandsExecuted,
          filesCreated: context.metadata.filesCreated,
          memoryUsageMB: stats.memoryUsageMB,
          cpuPercent: stats.cpuPercent,
          errors: context.metadata.errors
        },
        files
      };
    } catch (error: any) {
      logger.error('Sandboxed agent execution failed', {
        agent: config.agentName,
        error: error.message
      });

      // Cleanup on error
      if (sandbox && config.autoCleanup !== false) {
        await this.cleanup(sandbox.id);
      }

      const durationMs = Date.now() - startTime;

      return {
        output: '',
        exitCode: 1,
        durationMs,
        stats: {
          commandsExecuted: 0,
          filesCreated: 0,
          memoryUsageMB: 0,
          cpuPercent: 0,
          errors: 1
        },
        files: []
      };
    }
  }

  /**
   * Execute multiple agents in parallel sandboxes
   */
  async executeParallel(
    tasks: Array<{ task: string; config: SandboxedAgentConfig }>
  ): Promise<SandboxedExecutionResult[]> {
    logger.info('Executing agents in parallel', { count: tasks.length });

    const promises = tasks.map(({ task, config }) =>
      this.execute(task, config)
    );

    return Promise.all(promises);
  }

  /**
   * Setup workspace environment
   */
  private async setupWorkspace(context: SandboxedAgentContext): Promise<void> {
    const { sandbox, workspacePath } = context;

    // Create workspace directory
    await sandbox.execute('mkdir', ['-p', workspacePath]);

    // Write basic configuration files
    await sandbox.writeFile(
      `${workspacePath}/.agentconfig`,
      JSON.stringify({
        agentName: context.metadata.agentName,
        workspacePath,
        startTime: context.metadata.startTime
      }, null, 2)
    );

    logger.info('Workspace setup complete', {
      sandbox: sandbox.id,
      workspacePath
    });
  }

  /**
   * Execute agent with tool call interception
   */
  private async executeAgent(
    task: string,
    config: SandboxedAgentConfig,
    context: SandboxedAgentContext
  ): Promise<string> {
    // Build interceptor map
    const interceptors = new Map<string, ToolCallInterceptor>(
      config.interceptors?.map(i => [i.toolName, i]) || []
    );

    // Add default interceptors for file operations and bash
    this.addDefaultInterceptors(interceptors, context);

    // In production, this would use the actual Claude Agent SDK
    // For this POC, we simulate agent execution
    logger.info('Executing agent task', {
      agent: config.agentName,
      task: task.substring(0, 100)
    });

    // Simulate agent operations
    const operations = [
      { tool: 'Write', params: { file: '/workspace/output.txt', content: 'Agent output' } },
      { tool: 'Bash', params: { command: 'ls -la /workspace' } },
      { tool: 'Read', params: { file: '/workspace/output.txt' } }
    ];

    for (const op of operations) {
      const interceptor = interceptors.get(op.tool);
      if (interceptor) {
        await interceptor.handler(op.params, context);
      }
    }

    return `Task completed: ${task}\n\nExecuted ${context.metadata.commandsExecuted} commands\nCreated ${context.metadata.filesCreated} files`;
  }

  /**
   * Add default tool interceptors for sandbox isolation
   */
  private addDefaultInterceptors(
    interceptors: Map<string, ToolCallInterceptor>,
    context: SandboxedAgentContext
  ): void {
    // Intercept Write tool
    if (!interceptors.has('Write')) {
      interceptors.set('Write', {
        toolName: 'Write',
        handler: async (params, ctx) => {
          const sandboxPath = this.toSandboxPath(params.file, ctx.workspacePath);
          await ctx.sandbox.writeFile(sandboxPath, params.content);
          ctx.metadata.filesCreated++;
          logger.info('File written to sandbox', { path: sandboxPath });
          return params;
        }
      });
    }

    // Intercept Read tool
    if (!interceptors.has('Read')) {
      interceptors.set('Read', {
        toolName: 'Read',
        handler: async (params, ctx) => {
          const sandboxPath = this.toSandboxPath(params.file, ctx.workspacePath);
          const result = await ctx.sandbox.readFile(sandboxPath);
          logger.info('File read from sandbox', { path: sandboxPath });
          return result;
        }
      });
    }

    // Intercept Bash tool
    if (!interceptors.has('Bash')) {
      interceptors.set('Bash', {
        toolName: 'Bash',
        handler: async (params, ctx) => {
          const result = await ctx.sandbox.execute(
            'sh',
            ['-c', params.command],
            { workdir: ctx.workspacePath }
          );
          ctx.metadata.commandsExecuted++;

          if (result.exitCode !== 0) {
            ctx.metadata.errors++;
          }

          logger.info('Command executed in sandbox', {
            command: params.command.substring(0, 50),
            exitCode: result.exitCode
          });

          return result;
        }
      });
    }
  }

  /**
   * Convert agent file path to sandbox path
   */
  private toSandboxPath(path: string, workspacePath: string): string {
    // Remove leading slash and prepend workspace path
    const normalized = path.startsWith('/') ? path.substring(1) : path;
    return `${workspacePath}/${normalized}`;
  }

  /**
   * Capture files from sandbox
   */
  private async captureFiles(
    context: SandboxedAgentContext,
    patterns?: string[]
  ): Promise<Array<{ path: string; content: string }>> {
    const { sandbox, workspacePath } = context;

    try {
      // List all files in workspace
      const files = await sandbox.listFiles(workspacePath);

      // Filter by patterns if provided
      const filteredFiles = patterns
        ? files.filter(file => patterns.some(pattern => this.matchPattern(file, pattern)))
        : files;

      // Read file contents
      const captured: Array<{ path: string; content: string }> = [];

      for (const file of filteredFiles) {
        const fullPath = `${workspacePath}/${file}`;
        const result = await sandbox.readFile(fullPath);

        if (result.success && result.content) {
          captured.push({
            path: file,
            content: result.content
          });
        }
      }

      logger.info('Files captured from sandbox', {
        count: captured.length,
        sandbox: sandbox.id
      });

      return captured;
    } catch (error: any) {
      logger.error('Failed to capture files', {
        sandbox: sandbox.id,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Simple pattern matching (supports * wildcard)
   */
  private matchPattern(file: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(file);
  }

  /**
   * Cleanup sandbox and remove from active list
   */
  private async cleanup(sandboxId: string): Promise<void> {
    const context = this.activeSandboxes.get(sandboxId);
    if (!context) {
      return;
    }

    try {
      await this.sandboxManager.destroySandbox(sandboxId);
      this.activeSandboxes.delete(sandboxId);

      logger.info('Sandbox cleaned up', { sandboxId });
    } catch (error: any) {
      logger.error('Failed to cleanup sandbox', {
        sandboxId,
        error: error.message
      });
    }
  }

  /**
   * Cleanup all active sandboxes
   */
  async cleanupAll(): Promise<void> {
    const sandboxIds = Array.from(this.activeSandboxes.keys());

    logger.info('Cleaning up all sandboxes', { count: sandboxIds.length });

    await Promise.all(sandboxIds.map(id => this.cleanup(id)));
  }

  /**
   * Get active sandbox context
   */
  getContext(sandboxId: string): SandboxedAgentContext | undefined {
    return this.activeSandboxes.get(sandboxId);
  }

  /**
   * List all active sandboxes
   */
  listActive(): SandboxedAgentContext[] {
    return Array.from(this.activeSandboxes.values());
  }
}
