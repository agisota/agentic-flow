/**
 * Phase 3 Performance Benchmarks
 * Benchmarking lazy auth, circular rate limiting, dynamic compression, and adaptive pools
 */

import { performance } from 'perf_hooks';
import {
  LazyAuthManager,
  calculateAuthSavings
} from '../src/utils/lazy-auth';
import {
  CircularRateLimiter,
  SlidingWindowRateLimiter,
  TokenBucketRateLimiter,
  calculateRateLimiterSavings
} from '../src/utils/circular-rate-limiter';
import {
  DynamicCompressionManager,
  calculateCompressionEfficiency
} from '../src/utils/dynamic-compression';
import {
  AdaptivePoolSizingManager,
  AdaptiveBufferPool,
  calculatePoolSizingSavings
} from '../src/utils/adaptive-pool-sizing';

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  opsPerSecond: number;
}

/**
 * Benchmark Suite
 */
class BenchmarkSuite {
  private results: BenchmarkResult[] = [];

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

  printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 3 PERFORMANCE BENCHMARKS');
    console.log('='.repeat(80) + '\n');

    for (const result of this.results) {
      console.log(`${result.name}:`);
      console.log(`  Iterations:    ${result.iterations.toLocaleString()}`);
      console.log(`  Total Time:    ${result.totalTime.toFixed(2)}ms`);
      console.log(`  Avg Time:      ${result.avgTime.toFixed(4)}ms`);
      console.log(`  Ops/Second:    ${result.opsPerSecond.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
      console.log('');
    }
  }

  getResults(): BenchmarkResult[] {
    return this.results;
  }
}

/**
 * Benchmark Lazy Authentication
 */
async function benchmarkLazyAuth(suite: BenchmarkSuite): Promise<void> {
  console.log('Benchmarking Lazy Authentication...\n');

  // Baseline: No caching
  const noCache = new LazyAuthManager({ enabled: false });
  let validateCount = 0;

  const mockValidate = async (token: string) => {
    validateCount++;
    await new Promise(resolve => setTimeout(resolve, 1)); // Simulate 1ms validation
    return `user-${token}`;
  };

  await suite.benchmark('Auth: No Caching (baseline)', async () => {
    await noCache.authenticate('token-1', mockValidate);
  }, 1000);

  noCache.destroy();

  // With caching
  const withCache = new LazyAuthManager({
    enabled: true,
    ttl: 3600000,
    maxSessions: 10000
  });

  await suite.benchmark('Auth: With Caching', async () => {
    await withCache.authenticate('token-1', mockValidate);
  }, 1000);

  // Cache hit rate
  const stats = withCache.getStats();
  const savings = calculateAuthSavings(stats);

  console.log(`Cache Hit Rate: ${withCache.getCacheHitRate().toFixed(2)}%`);
  console.log(`Auth Savings: ${savings.savingsPercentage.toFixed(2)}%`);
  console.log(`Total Time Saved: ${savings.totalSavedTime.toFixed(2)}ms\n`);

  withCache.destroy();
}

/**
 * Benchmark Rate Limiting
 */
async function benchmarkRateLimiting(suite: BenchmarkSuite): Promise<void> {
  console.log('Benchmarking Rate Limiting...\n');

  // Baseline: Array-based (simulated)
  let arrayBasedTime = 0;
  await suite.benchmark('Rate Limit: Array-based (baseline)', () => {
    const timestamps: number[] = [];
    const now = Date.now();
    const windowStart = now - 60000;

    // Add timestamp
    timestamps.push(now);

    // Remove old timestamps (expensive array operations)
    let removed = 0;
    while (timestamps.length > 0 && timestamps[0] < windowStart) {
      timestamps.shift(); // Expensive O(n) operation
      removed++;
    }

    arrayBasedTime = performance.now();
  }, 10000);

  // Circular buffer based
  const circularLimiter = new CircularRateLimiter({
    enabled: true,
    windowMs: 60000,
    maxRequests: 100,
    bufferSize: 200
  });

  let circularTime = 0;
  await suite.benchmark('Rate Limit: Circular Buffer', () => {
    circularLimiter.checkLimit('client-1');
    circularTime = performance.now();
  }, 10000);

  const stats = circularLimiter.getStats();
  console.log(`Block Rate: ${circularLimiter.getBlockRate().toFixed(2)}%`);
  console.log(`Avg Check Time: ${stats.avgCheckTime.toFixed(4)}ms\n`);

  // Sliding window
  const slidingLimiter = new SlidingWindowRateLimiter({
    enabled: true,
    windowMs: 60000,
    maxRequests: 100,
    bufferSize: 200
  });

  await suite.benchmark('Rate Limit: Sliding Window', () => {
    slidingLimiter.checkLimitSliding('client-1');
  }, 10000);

  // Token bucket
  const tokenLimiter = new TokenBucketRateLimiter({
    capacity: 100,
    refillRate: 10,
    refillInterval: 1000
  });

  await suite.benchmark('Rate Limit: Token Bucket', () => {
    tokenLimiter.checkLimit('client-1', 1);
  }, 10000);
}

/**
 * Benchmark Compression
 */
async function benchmarkCompression(suite: BenchmarkSuite): Promise<void> {
  console.log('Benchmarking Dynamic Compression...\n');

  const testData = Buffer.from('a'.repeat(64 * 1024)); // 64KB

  // Gzip levels
  for (const level of ['fastest', 'fast', 'default', 'best']) {
    const manager = new DynamicCompressionManager({
      enabled: true,
      algorithm: 'gzip',
      adaptive: false
    });

    manager.setLevel(level);

    await suite.benchmark(`Compression: gzip ${level}`, async () => {
      await manager.compress(testData);
    }, 100);

    const stats = manager.getStats();
    const efficiency = calculateCompressionEfficiency(stats);

    console.log(`  Compression Ratio: ${stats.compressionRatio.toFixed(2)}x`);
    console.log(`  Efficiency Score: ${efficiency.efficiency.toFixed(2)}`);
    console.log(`  Time per MB: ${efficiency.timePerMB.toFixed(2)}ms\n`);

    manager.destroy();
  }

  // Brotli levels
  for (const level of ['fastest', 'fast', 'default', 'best']) {
    const manager = new DynamicCompressionManager({
      enabled: true,
      algorithm: 'brotli',
      adaptive: false
    });

    manager.setLevel(level);

    await suite.benchmark(`Compression: brotli ${level}`, async () => {
      await manager.compress(testData);
    }, 100);

    const stats = manager.getStats();
    const efficiency = calculateCompressionEfficiency(stats);

    console.log(`  Compression Ratio: ${stats.compressionRatio.toFixed(2)}x`);
    console.log(`  Efficiency Score: ${efficiency.efficiency.toFixed(2)}`);
    console.log(`  Time per MB: ${efficiency.timePerMB.toFixed(2)}ms\n`);

    manager.destroy();
  }
}

/**
 * Benchmark Adaptive Pool Sizing
 */
async function benchmarkAdaptivePooling(suite: BenchmarkSuite): Promise<void> {
  console.log('Benchmarking Adaptive Pool Sizing...\n');

  // Baseline: Fixed pool
  const fixedBuffers: Buffer[] = [];
  for (let i = 0; i < 100; i++) {
    fixedBuffers.push(Buffer.allocUnsafe(64 * 1024));
  }

  await suite.benchmark('Pool: Fixed Size (baseline)', () => {
    const index = Math.floor(Math.random() * fixedBuffers.length);
    const buffer = fixedBuffers[index];
    // Simulate usage
  }, 10000);

  // Adaptive pool
  const adaptivePool = new AdaptiveBufferPool(
    {
      enabled: true,
      minSize: 10,
      maxSize: 100,
      initialSize: 50,
      targetUtilization: 70
    },
    64 * 1024
  );

  await suite.benchmark('Pool: Adaptive Sizing', () => {
    const buffer = adaptivePool.acquire();
    adaptivePool.release(buffer);
  }, 10000);

  const stats = adaptivePool.getStats();
  console.log(`Pool Size: ${stats.currentSize}`);
  console.log(`Utilization: ${stats.utilizationPercent.toFixed(2)}%`);
  console.log(`Avg Utilization: ${stats.avgUtilization.toFixed(2)}%`);
  console.log(`Peak Utilization: ${stats.peakUtilization.toFixed(2)}%\n`);

  adaptivePool.destroy();

  // Pool size adjustment
  const sizingManager = new AdaptivePoolSizingManager({
    enabled: true,
    minSize: 10,
    maxSize: 1000,
    initialSize: 50,
    adjustInterval: 30000
  });

  await suite.benchmark('Pool: Size Calculation', () => {
    sizingManager.recordUsage(35, 50); // 70% utilization
    const recommended = sizingManager.getRecommendedSize();
  }, 10000);

  // Traffic analysis
  await suite.benchmark('Pool: Traffic Analysis', () => {
    sizingManager.recordTraffic({
      timestamp: Date.now(),
      requestRate: 100,
      avgResponseTime: 50,
      activeConnections: 20,
      queueDepth: 5
    });
    const analysis = sizingManager.getTrafficAnalysis();
  }, 10000);

  sizingManager.destroy();
}

/**
 * Run all benchmarks
 */
async function runBenchmarks(): Promise<void> {
  const suite = new BenchmarkSuite();

  try {
    await benchmarkLazyAuth(suite);
    await benchmarkRateLimiting(suite);
    await benchmarkCompression(suite);
    await benchmarkAdaptivePooling(suite);

    suite.printResults();

    // Summary
    console.log('='.repeat(80));
    console.log('PHASE 3 OPTIMIZATION SUMMARY');
    console.log('='.repeat(80) + '\n');

    console.log('Expected Improvements:');
    console.log('  • Auth Overhead:      5-10% reduction');
    console.log('  • Rate Limiting CPU:  2-5% reduction');
    console.log('  • Compression:        Adaptive based on CPU');
    console.log('  • Resource Util:      5-10% improvement');
    console.log('');

    console.log('Key Benefits:');
    console.log('  • Session caching reduces auth calls');
    console.log('  • Circular buffers eliminate array shifts');
    console.log('  • Dynamic compression adapts to CPU load');
    console.log('  • Adaptive pools optimize resource usage');
    console.log('');

  } catch (error) {
    console.error('Benchmark error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runBenchmarks().catch(console.error);
}

export { runBenchmarks, BenchmarkSuite };
