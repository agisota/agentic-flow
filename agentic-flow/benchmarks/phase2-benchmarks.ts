/**
 * Phase 2 Optimization Benchmarks
 * Measures performance improvements from HTTP/2 Server Push, Zero-Copy, and Multiplexing
 */

import { performance } from 'perf_hooks';
import { Buffer } from 'buffer';
import {
  ZeroCopyBufferPool,
  ZeroCopyStreamHandler,
  calculateMemorySavings
} from '../src/utils/zero-copy-buffer';
import {
  IntelligentPushPredictor
} from '../src/utils/server-push';
import {
  HTTP2MultiplexingManager,
  FlowControlManager,
  PriorityScheduler
} from '../src/utils/http2-multiplexing';

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  opsPerSecond: number;
  memorySaved?: number;
}

class BenchmarkSuite {
  private results: BenchmarkResult[] = [];

  /**
   * Run a benchmark
   */
  async benchmark(
    name: string,
    fn: () => void | Promise<void>,
    iterations: number = 10000
  ): Promise<BenchmarkResult> {
    // Warmup
    for (let i = 0; i < 100; i++) {
      await fn();
    }

    // Actual benchmark
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      await fn();
    }

    const end = performance.now();
    const totalTime = end - start;
    const avgTime = totalTime / iterations;
    const opsPerSecond = (iterations / totalTime) * 1000;

    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime,
      avgTime,
      opsPerSecond
    };

    this.results.push(result);
    return result;
  }

  /**
   * Print results
   */
  printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 2 OPTIMIZATION BENCHMARKS');
    console.log('='.repeat(80) + '\n');

    for (const result of this.results) {
      console.log(`Benchmark: ${result.name}`);
      console.log(`  Iterations:     ${result.iterations.toLocaleString()}`);
      console.log(`  Total Time:     ${result.totalTime.toFixed(2)}ms`);
      console.log(`  Avg Time:       ${result.avgTime.toFixed(4)}ms`);
      console.log(`  Ops/Second:     ${result.opsPerSecond.toFixed(0)}`);
      if (result.memorySaved) {
        console.log(`  Memory Saved:   ${(result.memorySaved / 1024 / 1024).toFixed(2)}MB`);
      }
      console.log('');
    }

    console.log('='.repeat(80) + '\n');
  }

  /**
   * Compare two results
   */
  compare(baseline: string, optimized: string): void {
    const baseResult = this.results.find(r => r.name === baseline);
    const optResult = this.results.find(r => r.name === optimized);

    if (!baseResult || !optResult) {
      console.log('Cannot compare: missing results');
      return;
    }

    const improvement = ((baseResult.avgTime - optResult.avgTime) / baseResult.avgTime) * 100;
    const throughputImprovement = ((optResult.opsPerSecond - baseResult.opsPerSecond) / baseResult.opsPerSecond) * 100;

    console.log(`\nComparison: ${baseline} vs ${optimized}`);
    console.log(`  Latency Improvement:     ${improvement.toFixed(2)}%`);
    console.log(`  Throughput Improvement:  ${throughputImprovement.toFixed(2)}%`);
    console.log('');
  }
}

/**
 * Zero-Copy Buffer Benchmarks
 */
async function benchmarkZeroCopy(suite: BenchmarkSuite): Promise<void> {
  console.log('Running Zero-Copy Buffer Benchmarks...');

  const poolEnabled = new ZeroCopyBufferPool({
    enabled: true,
    poolSize: 100,
    bufferSize: 64 * 1024,
    reuseBuffers: true
  });

  const poolDisabled = new ZeroCopyBufferPool({
    enabled: false,
    poolSize: 0,
    bufferSize: 64 * 1024,
    reuseBuffers: false
  });

  // Benchmark: Buffer allocation without pool
  await suite.benchmark('Buffer Allocation (baseline)', () => {
    const buffer = Buffer.allocUnsafe(64 * 1024);
    buffer.fill(0);
  }, 10000);

  // Benchmark: Buffer allocation with pool
  await suite.benchmark('Buffer Allocation (with pool)', () => {
    const buffer = poolEnabled.acquire();
    poolEnabled.release(buffer);
  }, 10000);

  // Benchmark: Buffer concatenation (standard)
  await suite.benchmark('Buffer Concat (baseline)', () => {
    const buffers = [
      Buffer.from('chunk1'),
      Buffer.from('chunk2'),
      Buffer.from('chunk3')
    ];
    Buffer.concat(buffers);
  }, 10000);

  // Benchmark: Zero-copy stream handling
  const handler = new ZeroCopyStreamHandler(poolEnabled);
  await suite.benchmark('Buffer Processing (zero-copy)', () => {
    const chunk = Buffer.from('test data for zero-copy processing');
    handler.processChunk(chunk);
  }, 10000);

  const stats = poolEnabled.getStats();
  console.log(`\nZero-Copy Stats:`);
  console.log(`  Buffers Allocated: ${stats.allocated}`);
  console.log(`  Buffers Reused:    ${stats.reused}`);
  console.log(`  Reuse Rate:        ${((stats.reused / stats.allocated) * 100).toFixed(2)}%\n`);
}

/**
 * Server Push Predictor Benchmarks
 */
async function benchmarkServerPush(suite: BenchmarkSuite): Promise<void> {
  console.log('Running Server Push Predictor Benchmarks...');

  const predictor = new IntelligentPushPredictor();

  // Train predictor
  for (let i = 0; i < 1000; i++) {
    predictor.recordAccess('/api/users', '/api/schema.json');
    predictor.recordAccess('/api/users', '/api/users/1');
  }

  // Benchmark: Access pattern recording
  await suite.benchmark('Push Predictor: Record Access', () => {
    predictor.recordAccess('/api/test', '/api/resource');
  }, 10000);

  // Benchmark: Prediction
  await suite.benchmark('Push Predictor: Generate Predictions', () => {
    predictor.predict('/api/users', 0.7);
  }, 10000);

  const stats = predictor.getStats();
  console.log(`\nPush Predictor Stats:`);
  console.log(`  Total Patterns:     ${stats.totalPatterns}`);
  console.log(`  Avg Confidence:     ${(stats.averageConfidence * 100).toFixed(2)}%\n`);
}

/**
 * HTTP/2 Multiplexing Benchmarks
 */
async function benchmarkMultiplexing(suite: BenchmarkSuite): Promise<void> {
  console.log('Running HTTP/2 Multiplexing Benchmarks...');

  const manager = new HTTP2MultiplexingManager({
    enabled: true,
    maxConcurrentStreams: 100,
    defaultPriority: 16
  });

  const flowControl = new FlowControlManager();
  const scheduler = new PriorityScheduler();

  // Benchmark: Flow control window calculation
  await suite.benchmark('Flow Control: Window Calculation', () => {
    flowControl.calculateOptimalWindow(10000000, 100);
  }, 10000);

  // Benchmark: Priority scheduling
  await suite.benchmark('Priority Scheduler: Enqueue/Dequeue', () => {
    scheduler.enqueue(Math.random() * 1000, Math.floor(Math.random() * 256));
    scheduler.dequeue();
  }, 10000);

  // Benchmark: Manager stats retrieval
  await suite.benchmark('Multiplexing Manager: Get Stats', () => {
    manager.getStats();
  }, 10000);

  console.log('');
}

/**
 * Memory Usage Comparison
 */
function benchmarkMemoryUsage(): void {
  console.log('Running Memory Usage Comparison...\n');

  // Baseline: Standard buffer allocation
  const standardBuffers: Buffer[] = [];
  const standardStart = process.memoryUsage().heapUsed;

  for (let i = 0; i < 1000; i++) {
    standardBuffers.push(Buffer.allocUnsafe(64 * 1024));
  }

  const standardEnd = process.memoryUsage().heapUsed;
  const standardMemory = standardEnd - standardStart;

  // Clear
  standardBuffers.length = 0;
  global.gc && global.gc();

  // Zero-copy: Buffer pool
  const pool = new ZeroCopyBufferPool({
    enabled: true,
    poolSize: 100,
    bufferSize: 64 * 1024,
    reuseBuffers: true
  });

  const pooledStart = process.memoryUsage().heapUsed;

  for (let i = 0; i < 1000; i++) {
    const buffer = pool.acquire();
    pool.release(buffer);
  }

  const pooledEnd = process.memoryUsage().heapUsed;
  const pooledMemory = pooledEnd - pooledStart;

  const savings = ((standardMemory - pooledMemory) / standardMemory) * 100;

  console.log('Memory Usage Comparison:');
  console.log(`  Standard Allocation: ${(standardMemory / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  With Buffer Pool:    ${(pooledMemory / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Memory Savings:      ${savings.toFixed(2)}%\n`);
}

/**
 * Main benchmark execution
 */
async function main(): Promise<void> {
  const suite = new BenchmarkSuite();

  console.log('Starting Phase 2 Optimization Benchmarks...\n');

  // Run all benchmarks
  await benchmarkZeroCopy(suite);
  await benchmarkServerPush(suite);
  await benchmarkMultiplexing(suite);

  // Print results
  suite.printResults();

  // Comparisons
  suite.compare('Buffer Allocation (baseline)', 'Buffer Allocation (with pool)');

  // Memory benchmarks
  if (global.gc) {
    benchmarkMemoryUsage();
  } else {
    console.log('⚠️  Run with --expose-gc for memory benchmarks\n');
  }

  console.log('✅ All benchmarks complete!\n');
}

// Run benchmarks
if (require.main === module) {
  main().catch(console.error);
}

export { BenchmarkSuite, main as runBenchmarks };
