/**
 * Docker Sandbox Implementation
 *
 * Provides Docker-based isolated execution environments with:
 * - Container lifecycle management
 * - Resource limits (CPU, memory, disk)
 * - Volume mounting for file access
 * - Network isolation
 * - Automatic cleanup
 *
 * @module docker-sandbox
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
import { spawn } from 'child_process';
import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);

/**
 * Docker-based sandbox implementation
 */
export class DockerSandbox implements Sandbox {
  readonly id: string;
  readonly provider = 'docker' as const;
  readonly limits: ResourceLimits;

  private _state: SandboxState = SandboxState.CREATED;
  private config: SandboxConfig;
  private containerId?: string;
  private volumeName?: string;
  private cleanupHandlers: Array<() => Promise<void>> = [];

  constructor(config: SandboxConfig) {
    this.id = `docker-${randomBytes(8).toString('hex')}`;
    this.config = config;
    this.limits = config.limits || {};

    logger.info('DockerSandbox created', {
      id: this.id,
      image: config.image,
      limits: this.limits
    });
  }

  get state(): SandboxState {
    return this._state;
  }

  /**
   * Start the Docker container
   */
  async start(): Promise<void> {
    if (this._state === SandboxState.RUNNING) {
      logger.warn('Sandbox already running', { id: this.id });
      return;
    }

    this._state = SandboxState.STARTING;

    try {
      // Create dedicated volume for sandbox
      this.volumeName = `sandbox-vol-${this.id}`;
      await this.execDockerCommand([
        'volume', 'create', this.volumeName
      ]);

      // Register cleanup
      this.cleanupHandlers.push(async () => {
        if (this.volumeName) {
          await this.execDockerCommand(['volume', 'rm', '-f', this.volumeName]).catch(() => {});
        }
      });

      // Build docker run command with resource limits
      const dockerArgs = [
        'run',
        '-d', // Detached mode
        '--name', this.id,

        // Resource limits
        ...(this.limits.memoryMB ? ['--memory', `${this.limits.memoryMB}m`] : []),
        ...(this.limits.cpuCores ? ['--cpus', `${this.limits.cpuCores}`] : []),

        // Network isolation
        ...(this.config.networkMode === 'none' ? ['--network', 'none'] : []),
        ...(this.config.networkMode === 'isolated' ? ['--network', 'none'] : []),

        // Volume mount
        '--mount', `type=volume,source=${this.volumeName},target=/workspace`,

        // Working directory
        '-w', this.config.workdir || '/workspace',

        // Environment variables
        ...Object.entries(this.config.env || {}).flatMap(([k, v]) => ['-e', `${k}=${v}`]),

        // Security options
        '--security-opt', 'no-new-privileges',
        '--cap-drop', 'ALL',
        '--read-only', // Read-only root filesystem
        '--tmpfs', '/tmp:rw,noexec,nosuid,size=100m',

        // Image
        this.config.image || 'node:20-alpine',

        // Keep container alive
        'sleep', 'infinity'
      ];

      const result = await this.execDockerCommand(dockerArgs);
      this.containerId = result.stdout.trim();

      // Register cleanup for container
      this.cleanupHandlers.push(async () => {
        if (this.containerId) {
          await this.execDockerCommand(['rm', '-f', this.containerId]).catch(() => {});
        }
      });

      this._state = SandboxState.RUNNING;

      logger.info('Docker sandbox started', {
        id: this.id,
        containerId: this.containerId
      });
    } catch (error: any) {
      this._state = SandboxState.ERROR;
      logger.error('Failed to start Docker sandbox', {
        id: this.id,
        error: error.message
      });
      await this.cleanup();
      throw new Error(`Docker sandbox start failed: ${error.message}`);
    }
  }

  /**
   * Execute a command in the container
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

    if (!this.containerId) {
      throw new Error('Container ID not set');
    }

    const startTime = Date.now();
    const timeout = options.timeout || this.limits.timeoutSeconds || 300;

    logger.info('Executing command in Docker sandbox', {
      id: this.id,
      command,
      args,
      timeout
    });

    try {
      // Build docker exec command
      const dockerArgs = [
        'exec',
        ...(options.workdir ? ['-w', options.workdir] : []),
        ...Object.entries(options.env || {}).flatMap(([k, v]) => ['-e', `${k}=${v}`]),
        this.containerId,
        command,
        ...args
      ];

      const result = await this.execDockerCommand(dockerArgs, timeout * 1000);
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
   * Write file to container volume
   */
  async writeFile(path: string, content: string): Promise<FileOperation> {
    if (this._state !== SandboxState.RUNNING || !this.containerId) {
      return { path, success: false, error: 'Sandbox not running' };
    }

    try {
      // Use docker exec to write file
      const writeCommand = `cat > ${path}`;
      const result = await this.execDockerCommandWithStdin(
        ['exec', '-i', this.containerId, 'sh', '-c', writeCommand],
        content
      );

      if (result.exitCode === 0) {
        logger.info('File written to Docker sandbox', { id: this.id, path });
        return { path, success: true };
      } else {
        return { path, success: false, error: result.stderr };
      }
    } catch (error: any) {
      logger.error('Failed to write file to Docker sandbox', {
        id: this.id,
        path,
        error: error.message
      });
      return { path, success: false, error: error.message };
    }
  }

  /**
   * Read file from container
   */
  async readFile(path: string): Promise<FileOperation> {
    if (this._state !== SandboxState.RUNNING || !this.containerId) {
      return { path, success: false, error: 'Sandbox not running' };
    }

    try {
      const result = await this.execDockerCommand([
        'exec', this.containerId, 'cat', path
      ]);

      if (result.exitCode === 0) {
        return { path, content: result.stdout, success: true };
      } else {
        return { path, success: false, error: result.stderr };
      }
    } catch (error: any) {
      return { path, success: false, error: error.message };
    }
  }

  /**
   * List files in directory
   */
  async listFiles(path: string): Promise<string[]> {
    if (this._state !== SandboxState.RUNNING || !this.containerId) {
      return [];
    }

    try {
      const result = await this.execDockerCommand([
        'exec', this.containerId, 'ls', '-1', path
      ]);

      if (result.exitCode === 0) {
        return result.stdout.split('\n').filter(line => line.trim());
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Delete file from container
   */
  async deleteFile(path: string): Promise<FileOperation> {
    if (this._state !== SandboxState.RUNNING || !this.containerId) {
      return { path, success: false, error: 'Sandbox not running' };
    }

    try {
      const result = await this.execDockerCommand([
        'exec', this.containerId, 'rm', '-f', path
      ]);

      if (result.exitCode === 0) {
        return { path, success: true };
      } else {
        return { path, success: false, error: result.stderr };
      }
    } catch (error: any) {
      return { path, success: false, error: error.message };
    }
  }

  /**
   * Stop the container
   */
  async stop(): Promise<void> {
    if (this._state !== SandboxState.RUNNING || !this.containerId) {
      return;
    }

    this._state = SandboxState.STOPPING;

    try {
      await this.execDockerCommand(['stop', this.containerId]);
      this._state = SandboxState.STOPPED;

      logger.info('Docker sandbox stopped', { id: this.id });
    } catch (error: any) {
      logger.error('Failed to stop Docker sandbox', {
        id: this.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Destroy container and cleanup resources
   */
  async destroy(): Promise<void> {
    this._state = SandboxState.DESTROYED;
    await this.cleanup();

    logger.info('Docker sandbox destroyed', { id: this.id });
  }

  /**
   * Get container resource statistics
   */
  async getStats(): Promise<{
    memoryUsageMB: number;
    cpuPercent: number;
    diskUsageMB: number;
    networkRxMB: number;
    networkTxMB: number;
  }> {
    if (!this.containerId || this._state !== SandboxState.RUNNING) {
      return {
        memoryUsageMB: 0,
        cpuPercent: 0,
        diskUsageMB: 0,
        networkRxMB: 0,
        networkTxMB: 0
      };
    }

    try {
      const result = await this.execDockerCommand([
        'stats', this.containerId, '--no-stream', '--format',
        '{{.MemUsage}}|{{.CPUPerc}}|{{.NetIO}}'
      ]);

      const parts = result.stdout.split('|');
      const memoryMB = this.parseMemoryUsage(parts[0]);
      const cpuPercent = parseFloat(parts[1]) || 0;
      const [networkRxMB, networkTxMB] = this.parseNetworkIO(parts[2]);

      return {
        memoryUsageMB: memoryMB,
        cpuPercent,
        diskUsageMB: 0, // Docker stats doesn't provide disk usage easily
        networkRxMB,
        networkTxMB
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
   * Health check - verify container is responsive
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    if (!this.containerId || this._state !== SandboxState.RUNNING) {
      return { healthy: false, message: 'Container not running' };
    }

    try {
      const result = await this.execDockerCommand([
        'exec', this.containerId, 'echo', 'health-check'
      ], 5000); // 5 second timeout

      if (result.exitCode === 0 && result.stdout.includes('health-check')) {
        return { healthy: true };
      }
      return { healthy: false, message: 'Health check command failed' };
    } catch (error: any) {
      return { healthy: false, message: error.message };
    }
  }

  /**
   * Execute docker command
   */
  private async execDockerCommand(
    args: string[],
    timeout: number = 30000
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const command = `docker ${args.join(' ')}`;

    try {
      const { stdout, stderr } = await exec(command, {
        timeout,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      return { stdout, stderr, exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1
      };
    }
  }

  /**
   * Execute docker command with stdin
   */
  private async execDockerCommandWithStdin(
    args: string[],
    stdin: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const proc = spawn('docker', args);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code || 0 });
      });

      // Write stdin and close
      proc.stdin.write(stdin);
      proc.stdin.end();
    });
  }

  /**
   * Parse memory usage from Docker stats format (e.g., "123.4MiB / 512MiB")
   */
  private parseMemoryUsage(memStr: string): number {
    const match = memStr.match(/([0-9.]+)([A-Za-z]+)/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    if (unit.includes('gib') || unit.includes('gb')) {
      return value * 1024;
    } else if (unit.includes('mib') || unit.includes('mb')) {
      return value;
    } else if (unit.includes('kib') || unit.includes('kb')) {
      return value / 1024;
    }
    return value;
  }

  /**
   * Parse network I/O from Docker stats format (e.g., "1.23MB / 456kB")
   */
  private parseNetworkIO(netStr: string): [number, number] {
    const parts = netStr.split('/').map(s => s.trim());
    if (parts.length !== 2) return [0, 0];

    const parseValue = (str: string): number => {
      const match = str.match(/([0-9.]+)([A-Za-z]+)/);
      if (!match) return 0;

      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();

      if (unit.includes('gb')) return value * 1024;
      if (unit.includes('mb')) return value;
      if (unit.includes('kb')) return value / 1024;
      return value;
    };

    return [parseValue(parts[0]), parseValue(parts[1])];
  }

  /**
   * Cleanup all resources
   */
  private async cleanup(): Promise<void> {
    logger.info('Cleaning up Docker sandbox', { id: this.id });

    for (const handler of this.cleanupHandlers) {
      try {
        await handler();
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    this.cleanupHandlers = [];
  }
}
