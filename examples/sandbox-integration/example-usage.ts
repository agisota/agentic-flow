#!/usr/bin/env tsx
/**
 * Sandbox Integration - Complete Usage Examples
 *
 * Demonstrates:
 * 1. Basic agent execution in Docker sandbox
 * 2. E2B cloud sandbox execution
 * 3. Multi-agent swarm with isolated sandboxes
 * 4. Federation with sandboxed agents
 * 5. Resource monitoring and limits
 * 6. Custom tool interceptors
 *
 * @module example-usage
 */

import { SandboxManager } from './sandbox-manager.js';
import { SandboxedAgentExecutor } from './sandboxed-agent-executor.js';
import { logger } from '../../agentic-flow/src/utils/logger.js';

/**
 * Example 1: Basic Docker Sandbox Execution
 */
async function example1_basicDockerExecution() {
  console.log('\n=== Example 1: Basic Docker Sandbox Execution ===\n');

  const manager = new SandboxManager({
    provider: 'docker',
    limits: {
      memoryMB: 256,
      cpuCores: 0.5,
      timeoutSeconds: 60
    }
  });

  try {
    // Create and start sandbox
    const sandbox = await manager.createSandbox({
      image: 'node:20-alpine',
      networkMode: 'none'
    });

    await sandbox.start();
    console.log(`✅ Sandbox started: ${sandbox.id}`);

    // Write a simple Node.js script
    await sandbox.writeFile('/workspace/hello.js', `
      console.log('Hello from sandboxed Node.js!');
      console.log('Process ID:', process.pid);
      console.log('Memory:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
    `);
    console.log('✅ Script written to sandbox');

    // Execute the script
    const result = await sandbox.execute('node', ['/workspace/hello.js']);
    console.log('\nExecution result:');
    console.log('Exit code:', result.exitCode);
    console.log('Output:', result.stdout);
    console.log('Duration:', result.durationMs, 'ms');

    // Check resource usage
    const stats = await sandbox.getStats();
    console.log('\nResource usage:');
    console.log('Memory:', stats.memoryUsageMB, 'MB');
    console.log('CPU:', stats.cpuPercent, '%');

    // Cleanup
    await manager.destroySandbox(sandbox.id);
    console.log('\n✅ Sandbox destroyed');

  } catch (error: any) {
    console.error('❌ Example 1 failed:', error.message);
  }
}

/**
 * Example 2: E2B Cloud Sandbox Execution
 */
async function example2_e2bCloudExecution() {
  console.log('\n=== Example 2: E2B Cloud Sandbox Execution ===\n');

  // Check for E2B API key
  const e2bApiKey = process.env.E2B_API_KEY;
  if (!e2bApiKey) {
    console.log('⚠️  E2B_API_KEY not set, skipping E2B example');
    console.log('   Set E2B_API_KEY to run cloud sandbox examples');
    return;
  }

  const manager = new SandboxManager({
    provider: 'e2b',
    limits: {
      memoryMB: 512,
      cpuCores: 1,
      timeoutSeconds: 120
    }
  });

  try {
    // Create E2B sandbox with Python template
    const sandbox = await manager.createSandbox({
      e2b: {
        apiKey: e2bApiKey,
        templateId: 'python3',
        region: 'us-east-1'
      }
    });

    await sandbox.start();
    console.log(`✅ E2B sandbox started: ${sandbox.id}`);

    // Write and execute Python script
    await sandbox.writeFile('/workspace/analyze.py', `
import sys
import json

data = {"message": "Hello from E2B cloud sandbox!", "python_version": sys.version}
print(json.dumps(data, indent=2))
    `);

    const result = await sandbox.execute('python3', ['/workspace/analyze.py']);
    console.log('\nExecution result:');
    console.log(result.stdout);

    // Cleanup
    await manager.destroySandbox(sandbox.id);
    console.log('\n✅ E2B sandbox destroyed');

  } catch (error: any) {
    console.error('❌ Example 2 failed:', error.message);
  }
}

/**
 * Example 3: Sandboxed Agent Execution
 */
async function example3_sandboxedAgent() {
  console.log('\n=== Example 3: Sandboxed Agent Execution ===\n');

  const executor = new SandboxedAgentExecutor();

  try {
    // Execute agent in isolated sandbox
    const result = await executor.execute(
      'Create a simple Node.js application that calculates fibonacci numbers',
      {
        agentName: 'coder',
        systemPrompt: 'You are a helpful coding assistant.',
        sandboxConfig: {
          provider: 'docker',
          image: 'node:20-alpine',
          limits: {
            memoryMB: 256,
            cpuCores: 0.5,
            timeoutSeconds: 120
          },
          networkMode: 'none'
        },
        workspacePath: '/workspace',
        autoCleanup: true,
        captureFiles: true,
        capturePatterns: ['*.js', '*.json']
      }
    );

    console.log('Agent execution completed:');
    console.log('Output:', result.output);
    console.log('\nStatistics:');
    console.log('- Commands executed:', result.stats.commandsExecuted);
    console.log('- Files created:', result.stats.filesCreated);
    console.log('- Memory usage:', result.stats.memoryUsageMB, 'MB');
    console.log('- Duration:', result.durationMs, 'ms');

    console.log('\nCaptured files:');
    result.files.forEach(file => {
      console.log(`\n📄 ${file.path}:`);
      console.log(file.content.substring(0, 200) + '...');
    });

  } catch (error: any) {
    console.error('❌ Example 3 failed:', error.message);
  }
}

/**
 * Example 4: Multi-Agent Swarm in Sandboxes
 */
async function example4_multiAgentSwarm() {
  console.log('\n=== Example 4: Multi-Agent Swarm in Sandboxes ===\n');

  const executor = new SandboxedAgentExecutor();

  try {
    // Define multiple agent tasks
    const tasks = [
      {
        task: 'Create a REST API server with Express',
        config: {
          agentName: 'backend-dev',
          systemPrompt: 'You are a backend developer.',
          sandboxConfig: {
            provider: 'docker',
            image: 'node:20-alpine',
            limits: { memoryMB: 256, cpuCores: 0.5 }
          },
          autoCleanup: true,
          captureFiles: true,
          capturePatterns: ['*.js']
        }
      },
      {
        task: 'Write comprehensive unit tests',
        config: {
          agentName: 'tester',
          systemPrompt: 'You are a testing specialist.',
          sandboxConfig: {
            provider: 'docker',
            image: 'node:20-alpine',
            limits: { memoryMB: 256, cpuCores: 0.5 }
          },
          autoCleanup: true,
          captureFiles: true,
          capturePatterns: ['*.test.js']
        }
      },
      {
        task: 'Create API documentation',
        config: {
          agentName: 'documenter',
          systemPrompt: 'You are a technical writer.',
          sandboxConfig: {
            provider: 'docker',
            image: 'node:20-alpine',
            limits: { memoryMB: 128, cpuCores: 0.25 }
          },
          autoCleanup: true,
          captureFiles: true,
          capturePatterns: ['*.md']
        }
      }
    ];

    console.log('Executing 3 agents in parallel sandboxes...\n');

    const startTime = Date.now();
    const results = await executor.executeParallel(tasks);
    const totalDuration = Date.now() - startTime;

    console.log('All agents completed!\n');

    results.forEach((result, index) => {
      console.log(`Agent ${index + 1} (${tasks[index].config.agentName}):`);
      console.log('- Commands:', result.stats.commandsExecuted);
      console.log('- Files:', result.stats.filesCreated);
      console.log('- Duration:', result.durationMs, 'ms');
      console.log('- Memory:', result.stats.memoryUsageMB, 'MB\n');
    });

    console.log('Total parallel execution time:', totalDuration, 'ms');
    console.log('Speedup vs sequential:',
      `${(results.reduce((sum, r) => sum + r.durationMs, 0) / totalDuration).toFixed(2)}x`
    );

  } catch (error: any) {
    console.error('❌ Example 4 failed:', error.message);
  }
}

/**
 * Example 5: Custom Tool Interceptors
 */
async function example5_customInterceptors() {
  console.log('\n=== Example 5: Custom Tool Interceptors ===\n');

  const executor = new SandboxedAgentExecutor();

  try {
    // Custom interceptor that logs all file operations
    const fileLogger = {
      toolName: 'Write',
      handler: async (params: any, context: any) => {
        console.log(`📝 Writing file: ${params.file}`);
        console.log(`   Size: ${params.content.length} bytes`);

        // Call original handler
        const sandboxPath = `/workspace/${params.file}`;
        await context.sandbox.writeFile(sandboxPath, params.content);
        context.metadata.filesCreated++;

        return params;
      }
    };

    // Custom interceptor for command auditing
    const commandAuditor = {
      toolName: 'Bash',
      handler: async (params: any, context: any) => {
        console.log(`⚡ Executing command: ${params.command}`);

        // Block dangerous commands
        const dangerous = ['rm -rf', 'dd if=', 'fork()'];
        if (dangerous.some(cmd => params.command.includes(cmd))) {
          console.log('   ⛔ Command blocked for safety!');
          return null;
        }

        const result = await context.sandbox.execute('sh', ['-c', params.command]);
        context.metadata.commandsExecuted++;

        console.log(`   Exit code: ${result.exitCode}`);
        return result;
      }
    };

    const result = await executor.execute(
      'Create a configuration file and run a test command',
      {
        agentName: 'monitored-agent',
        systemPrompt: 'You are a system administrator.',
        sandboxConfig: {
          provider: 'docker',
          image: 'alpine:latest',
          limits: { memoryMB: 128 }
        },
        interceptors: [fileLogger, commandAuditor],
        autoCleanup: true
      }
    );

    console.log('\nExecution completed with custom interceptors');
    console.log('Commands executed:', result.stats.commandsExecuted);
    console.log('Files created:', result.stats.filesCreated);

  } catch (error: any) {
    console.error('❌ Example 5 failed:', error.message);
  }
}

/**
 * Example 6: Resource Limit Enforcement
 */
async function example6_resourceLimits() {
  console.log('\n=== Example 6: Resource Limit Enforcement ===\n');

  const manager = new SandboxManager();

  try {
    // Create sandbox with strict limits
    const sandbox = await manager.createSandbox({
      provider: 'docker',
      image: 'node:20-alpine',
      limits: {
        memoryMB: 64,  // Very low memory
        cpuCores: 0.1,  // Very low CPU
        timeoutSeconds: 10  // Short timeout
      }
    });

    await sandbox.start();
    console.log('✅ Sandbox started with strict limits');

    // Try to allocate too much memory (should fail or be limited)
    console.log('\nAttempting memory-intensive operation...');
    const memResult = await sandbox.execute('node', ['-e', `
      const arr = [];
      try {
        for (let i = 0; i < 1000000; i++) {
          arr.push(new Array(1000).fill('x'));
        }
        console.log('Memory allocated:', arr.length);
      } catch (e) {
        console.log('Memory limit reached:', e.message);
      }
    `]);
    console.log('Result:', memResult.stdout || memResult.stderr);

    // Try to run with timeout (should timeout)
    console.log('\nAttempting long-running operation...');
    const timeoutResult = await sandbox.execute('sleep', ['30']);
    console.log('Timed out:', timeoutResult.timedOut);
    console.log('Duration:', timeoutResult.durationMs, 'ms');

    // Check stats
    const stats = await sandbox.getStats();
    console.log('\nResource usage:');
    console.log('Memory:', stats.memoryUsageMB, '/ 64 MB');
    console.log('CPU:', stats.cpuPercent, '%');

    await manager.destroySandbox(sandbox.id);
    console.log('\n✅ Resource limit test completed');

  } catch (error: any) {
    console.error('❌ Example 6 failed:', error.message);
  }
}

/**
 * Example 7: Federation with Sandboxed Agents
 */
async function example7_federationIntegration() {
  console.log('\n=== Example 7: Federation with Sandboxed Agents ===\n');

  console.log('This example demonstrates how sandboxed agents integrate with federation:');
  console.log('');
  console.log('1. Create ephemeral agents in isolated sandboxes');
  console.log('2. Each agent has its own Docker/E2B environment');
  console.log('3. Agents communicate via federated memory (QUIC)');
  console.log('4. Sandbox isolation prevents cross-contamination');
  console.log('5. Automatic cleanup after agent lifetime expires');
  console.log('');
  console.log('Code pattern:');
  console.log('');
  console.log('  const sandboxManager = new SandboxManager();');
  console.log('  const executor = new SandboxedAgentExecutor(sandboxManager);');
  console.log('  ');
  console.log('  // Spawn federated agents in sandboxes');
  console.log('  const agents = await Promise.all([');
  console.log('    spawnFederatedAgent("researcher", sandbox1),');
  console.log('    spawnFederatedAgent("coder", sandbox2),');
  console.log('    spawnFederatedAgent("tester", sandbox3)');
  console.log('  ]);');
  console.log('  ');
  console.log('  // Agents share context via federation hub');
  console.log('  // but execute in isolated sandboxes');
  console.log('');
  console.log('✅ See EphemeralAgent and FederationHub for full implementation');
}

/**
 * Main function - run all examples
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   Sandbox Integration - Complete Usage Examples   ║');
  console.log('╚════════════════════════════════════════════════════╝');

  // Setup logger
  logger.setContext({ service: 'sandbox-examples', version: '1.0.0' });

  try {
    // Run examples sequentially
    await example1_basicDockerExecution();
    await example2_e2bCloudExecution();
    await example3_sandboxedAgent();
    await example4_multiAgentSwarm();
    await example5_customInterceptors();
    await example6_resourceLimits();
    await example7_federationIntegration();

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║        All examples completed successfully!        ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

  } catch (error: any) {
    console.error('\n❌ Example suite failed:', error.message);
    process.exit(1);
  }
}

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for use as module
export {
  example1_basicDockerExecution,
  example2_e2bCloudExecution,
  example3_sandboxedAgent,
  example4_multiAgentSwarm,
  example5_customInterceptors,
  example6_resourceLimits,
  example7_federationIntegration
};
