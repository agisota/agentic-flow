/**
 * E2B Cloud Sandbox Implementation
 *
 * Provides cloud-based isolated execution environments via E2B with:
 * - Cloud sandbox lifecycle management
 * - Pre-configured templates (Node.js, Python, etc.)
 * - Automatic scaling and resource management
 * - Global edge deployment
 * - WebSocket-based real-time communication
 *
 * @module e2b-sandbox
 */

import {
  Sandbox,
  SandboxConfig,
  SandboxState,
  ResourceLimits,
  ExecutionResult,
  FileOperation
} from './sandbox-manager.js';
import { logger } from '../../agentic-flow/src/utils/logger.js';
import { randomBytes } from 'crypto';

/**
 * E2B API response types
 */
interface E2BSession {
  sessionId: string;
  status: 'creating' | 'running' | 'stopping' | 'stopped';
  templateId: string;
  metadata?: Record<string, any>;
}

interface E2BExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  error?: string;
}

/**
 * E2B cloud sandbox implementation
 */
export class E2BSandbox implements Sandbox {
  readonly id: string;
  readonly provider = 'e2b' as const;
  readonly limits: ResourceLimits;

  private _state: SandboxState = SandboxState.CREATED;
  private config: SandboxConfig;
  private sessionId?: string;
  private apiKey: string;
  private baseUrl: string = 'https://api.e2b.dev';

  constructor(config: SandboxConfig) {
    this.id = `e2b-${randomBytes(8).toString('hex')}`;
    this.config = config;
    this.limits = config.limits || {};

    if (!config.e2b?.apiKey) {
      throw new Error('E2B API key is required (config.e2b.apiKey)');
    }

    this.apiKey = config.e2b.apiKey;

    logger.info('E2BSandbox created', {
      id: this.id,
      templateId: config.e2b.templateId,
      region: config.e2b.region
    });
  }

  get state(): SandboxState {
    return this._state;
  }

  /**
   * Start E2B cloud sandbox session
   */
  async start(): Promise<void> {
    if (this._state === SandboxState.RUNNING) {
      logger.warn('Sandbox already running', { id: this.id });
      return;
    }

    this._state = SandboxState.STARTING;

    try {
      // Create E2B session
      const session = await this.createSession();
      this.sessionId = session.sessionId;

      // Wait for session to be ready
      await this.waitForReady();

      this._state = SandboxState.RUNNING;

      logger.info('E2B sandbox started', {
        id: this.id,
        sessionId: this.sessionId
      });
    } catch (error: any) {
      this._state = SandboxState.ERROR;
      logger.error('Failed to start E2B sandbox', {
        id: this.id,
        error: error.message
      });
      throw new Error(`E2B sandbox start failed: ${error.message}`);
    }
  }

  /**
   * Execute command in E2B sandbox
   */
  async execute(
    command: string,
    args: string[] = [],
    options: {
      timeout?: number;
      env?: Record<string, string>;
      workdir?: string;
    } = {}
  ): Promise<ExecutionResult> {
    if (this._state !== SandboxState.RUNNING) {
      throw new Error(`Sandbox not running (state: ${this._state})`);
    }

    if (!this.sessionId) {
      throw new Error('Session ID not set');
    }

    const startTime = Date.now();
    const timeout = options.timeout || this.limits.timeoutSeconds || 300;

    logger.info('Executing command in E2B sandbox', {
      id: this.id,
      command,
      args,
      timeout
    });

    try {
      // Build full command with args
      const fullCommand = args.length > 0
        ? `${command} ${args.map(arg => JSON.stringify(arg)).join(' ')}`
        : command;

      const result = await this.apiRequest<E2BExecResult>('/sessions/{sessionId}/exec', {
        method: 'POST',
        body: {
          command: fullCommand,
          env: options.env,
          cwd: options.workdir,
          timeout: timeout * 1000
        }
      });

      const durationMs = Date.now() - startTime;

      logger.info('Command execution completed', {
        id: this.id,
        command,
        exitCode: result.exitCode,
        durationMs
      });

      return {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs,
        timedOut: false
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const timedOut = error.message.includes('timeout');

      logger.error('Command execution failed', {
        id: this.id,
        command,
        error: error.message,
        timedOut
      });

      return {
        exitCode: timedOut ? 124 : 1,
        stdout: '',
        stderr: error.message,
        durationMs,
        timedOut
      };
    }
  }

  /**
   * Write file to E2B sandbox
   */
  async writeFile(path: string, content: string): Promise<FileOperation> {
    if (this._state !== SandboxState.RUNNING || !this.sessionId) {
      return { path, success: false, error: 'Sandbox not running' };
    }

    try {
      await this.apiRequest('/sessions/{sessionId}/filesystem/write', {
        method: 'POST',
        body: {
          path,
          content,
          mode: 0o644
        }
      });

      logger.info('File written to E2B sandbox', { id: this.id, path });
      return { path, success: true };
    } catch (error: any) {
      logger.error('Failed to write file to E2B sandbox', {
        id: this.id,
        path,
        error: error.message
      });
      return { path, success: false, error: error.message };
    }
  }

  /**
   * Read file from E2B sandbox
   */
  async readFile(path: string): Promise<FileOperation> {
    if (this._state !== SandboxState.RUNNING || !this.sessionId) {
      return { path, success: false, error: 'Sandbox not running' };
    }

    try {
      const result = await this.apiRequest<{ content: string }>(
        '/sessions/{sessionId}/filesystem/read',
        {
          method: 'POST',
          body: { path }
        }
      );

      return { path, content: result.content, success: true };
    } catch (error: any) {
      return { path, success: false, error: error.message };
    }
  }

  /**
   * List files in directory
   */
  async listFiles(path: string): Promise<string[]> {
    if (this._state !== SandboxState.RUNNING || !this.sessionId) {
      return [];
    }

    try {
      const result = await this.apiRequest<{ files: string[] }>(
        '/sessions/{sessionId}/filesystem/list',
        {
          method: 'POST',
          body: { path }
        }
      );

      return result.files || [];
    } catch {
      return [];
    }
  }

  /**
   * Delete file from E2B sandbox
   */
  async deleteFile(path: string): Promise<FileOperation> {
    if (this._state !== SandboxState.RUNNING || !this.sessionId) {
      return { path, success: false, error: 'Sandbox not running' };
    }

    try {
      await this.apiRequest('/sessions/{sessionId}/filesystem/delete', {
        method: 'POST',
        body: { path }
      });

      return { path, success: true };
    } catch (error: any) {
      return { path, success: false, error: error.message };
    }
  }

  /**
   * Stop E2B sandbox session
   */
  async stop(): Promise<void> {
    if (this._state !== SandboxState.RUNNING || !this.sessionId) {
      return;
    }

    this._state = SandboxState.STOPPING;

    try {
      await this.apiRequest('/sessions/{sessionId}/stop', {
        method: 'POST'
      });

      this._state = SandboxState.STOPPED;

      logger.info('E2B sandbox stopped', { id: this.id });
    } catch (error: any) {
      logger.error('Failed to stop E2B sandbox', {
        id: this.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Destroy E2B sandbox session
   */
  async destroy(): Promise<void> {
    if (!this.sessionId) {
      this._state = SandboxState.DESTROYED;
      return;
    }

    try {
      await this.apiRequest('/sessions/{sessionId}', {
        method: 'DELETE'
      });

      this._state = SandboxState.DESTROYED;

      logger.info('E2B sandbox destroyed', { id: this.id });
    } catch (error: any) {
      logger.error('Failed to destroy E2B sandbox', {
        id: this.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get E2B sandbox resource statistics
   */
  async getStats(): Promise<{
    memoryUsageMB: number;
    cpuPercent: number;
    diskUsageMB: number;
    networkRxMB: number;
    networkTxMB: number;
  }> {
    if (!this.sessionId || this._state !== SandboxState.RUNNING) {
      return {
        memoryUsageMB: 0,
        cpuPercent: 0,
        diskUsageMB: 0,
        networkRxMB: 0,
        networkTxMB: 0
      };
    }

    try {
      const result = await this.apiRequest<{
        memory: number;
        cpu: number;
        disk: number;
      }>('/sessions/{sessionId}/stats', {
        method: 'GET'
      });

      return {
        memoryUsageMB: result.memory || 0,
        cpuPercent: result.cpu || 0,
        diskUsageMB: result.disk || 0,
        networkRxMB: 0, // E2B doesn't expose network stats
        networkTxMB: 0
      };
    } catch {
      return {
        memoryUsageMB: 0,
        cpuPercent: 0,
        diskUsageMB: 0,
        networkRxMB: 0,
        networkTxMB: 0
      };
    }
  }

  /**
   * Health check E2B sandbox
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    if (!this.sessionId || this._state !== SandboxState.RUNNING) {
      return { healthy: false, message: 'Session not running' };
    }

    try {
      const result = await this.execute('echo', ['health-check'], { timeout: 5 });

      if (result.exitCode === 0 && result.stdout.includes('health-check')) {
        return { healthy: true };
      }
      return { healthy: false, message: 'Health check command failed' };
    } catch (error: any) {
      return { healthy: false, message: error.message };
    }
  }

  /**
   * Create E2B session
   */
  private async createSession(): Promise<E2BSession> {
    const templateId = this.config.e2b?.templateId || 'base';

    const session = await this.apiRequest<E2BSession>('/sessions', {
      method: 'POST',
      body: {
        templateId,
        metadata: {
          sandboxId: this.id,
          ...this.config.metadata
        },
        timeout: (this.limits.timeoutSeconds || 300) * 1000
      }
    });

    return session;
  }

  /**
   * Wait for E2B session to be ready
   */
  private async waitForReady(maxWaitMs: number = 30000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const session = await this.apiRequest<E2BSession>(
          '/sessions/{sessionId}',
          { method: 'GET' }
        );

        if (session.status === 'running') {
          return;
        }

        if (session.status === 'stopped') {
          throw new Error('Session stopped unexpectedly');
        }

        // Wait 500ms before next check
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        logger.error('Error checking session status', {
          id: this.id,
          error: error.message
        });
        throw error;
      }
    }

    throw new Error('Session creation timed out');
  }

  /**
   * Make E2B API request
   */
  private async apiRequest<T>(
    endpoint: string,
    options: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
    }
  ): Promise<T> {
    // Replace {sessionId} placeholder
    const url = `${this.baseUrl}${endpoint.replace('{sessionId}', this.sessionId || '')}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    const fetchOptions: RequestInit = {
      method: options.method,
      headers
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`E2B API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error: any) {
      logger.error('E2B API request failed', {
        endpoint,
        method: options.method,
        error: error.message
      });
      throw error;
    }
  }
}
