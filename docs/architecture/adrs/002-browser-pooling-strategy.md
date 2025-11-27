# ADR 002: Browser Instance Pooling Strategy

**Status:** Accepted
**Date:** 2025-11-27
**Deciders:** Architecture Team, Performance Team

---

## Context

Browser instances are expensive to create (1-3 seconds launch time, 50-100MB memory). For a multi-user, high-throughput automation system, we need an efficient strategy for managing browser instances.

### Requirements

1. **Performance**: Minimize wait time for browser acquisition
2. **Resource Efficiency**: Don't waste memory on idle browsers
3. **Concurrency**: Support multiple simultaneous sessions
4. **Reliability**: Handle browser crashes gracefully
5. **Scalability**: Scale from 1 to 50+ concurrent browsers

### Workload Characteristics

- Bursty traffic (multiple requests in short periods)
- Variable session duration (30 seconds to 30 minutes)
- Different browser types (Chromium, Firefox, WebKit)
- Occasional browser crashes or hangs

---

## Decision

**We will implement an object pool pattern with the following characteristics:**

1. **Dynamic Pool Size**: Configurable min/max browsers (default: 2-10)
2. **Lazy Creation**: Create browsers on-demand up to max limit
3. **Instance Recycling**: Reuse browsers for multiple sessions
4. **Idle Eviction**: Close browsers idle for > 5 minutes
5. **Health Monitoring**: Periodic health checks with auto-restart
6. **Graceful Degradation**: Queue requests when pool is exhausted

---

## Rationale

### 1. Why Pooling?

**Alternative 1: One browser per request**
- Pros: Simple, isolated
- Cons: 1-3s startup latency per request, excessive resource usage
- Verdict: ❌ Too slow for interactive use

**Alternative 2: Single shared browser**
- Pros: Minimal resources
- Cons: Context leakage, crash affects all users, no concurrency
- Verdict: ❌ Not suitable for multi-user system

**Alternative 3: Browser pooling** ✅
- Pros: Fast acquisition, controlled resource usage, concurrency support
- Cons: More complex implementation
- Verdict: ✅ Best balance of performance and resource efficiency

### 2. Dynamic vs Fixed Pool Size

**Fixed size**: Always maintain N browsers
- Pros: Predictable resource usage
- Cons: Wastes resources during low traffic

**Dynamic size** ✅: Scale between min and max
- Pros: Efficient resource usage, adapts to load
- Cons: Slightly more complex logic
- Verdict: ✅ Better resource utilization

### 3. Instance Recycling

**Create new browser for each session**:
- Pro: Clean state
- Con: Startup overhead

**Recycle browsers** ✅:
- Pro: Instant acquisition
- Con: Must clean state between sessions
- Verdict: ✅ Performance benefits outweigh cleanup complexity

We mitigate state leakage by:
- Creating new BrowserContext for each session
- Clearing cookies/storage between uses
- Recycling after N uses to prevent memory leaks

### 4. Eviction Strategy

**Never evict**:
- Pro: Always ready
- Con: Wastes resources during idle periods

**Time-based eviction** ✅:
- Pro: Frees resources when not needed
- Con: May need to recreate browsers on burst
- Verdict: ✅ Better for production environments

**LRU eviction**:
- Pro: Optimal cache hit rate
- Con: Complexity, unpredictable behavior
- Verdict: ❌ Overkill for this use case

---

## Pool Architecture

```typescript
class BrowserPool {
  private config = {
    min: 2,           // Pre-warm 2 browsers
    max: 10,          // Maximum 10 browsers
    idleTimeout: 5 * 60 * 1000,  // 5 minutes
    maxUseCount: 100, // Recycle after 100 uses
    acquireTimeout: 30000,  // 30 second acquisition timeout
  };

  private instances: Map<string, PooledBrowser>;
  private available: PooledBrowser[];
  private waitQueue: QueuedRequest[];

  async acquire(): Promise<PooledBrowser> {
    // 1. Try to get idle browser
    if (this.available.length > 0) {
      return this.available.shift()!;
    }

    // 2. Create new if under max
    if (this.instances.size < this.config.max) {
      return await this.createBrowser();
    }

    // 3. Wait for available browser
    return this.waitForBrowser();
  }

  async release(browser: PooledBrowser): Promise<void> {
    // Recycle if used too many times or unhealthy
    if (browser.useCount >= this.config.maxUseCount || !this.isHealthy(browser)) {
      await this.destroyBrowser(browser);
      return;
    }

    // Return to pool
    this.available.push(browser);
  }
}
```

---

## Consequences

### Positive

1. **Fast Response**: ~10ms acquisition for idle browser (vs 1-3s cold start)
2. **Resource Efficiency**: Only use memory for active sessions + min pool
3. **High Throughput**: Support 10+ concurrent sessions on single machine
4. **Crash Resilient**: Failed browsers don't affect pool
5. **Predictable**: Min pool ensures baseline performance

### Negative

1. **Memory Baseline**: Always uses memory for min pool (2 browsers ≈ 100-200MB)
2. **Complexity**: More complex than naive create-per-request
3. **State Management**: Must ensure clean state between uses
4. **Monitoring**: Need health checks and eviction logic

### Neutral

1. **Tuning Required**: Optimal min/max depends on workload
2. **Browser Type**: May need separate pools per browser type
3. **Scaling**: For > 50 browsers, consider distributed pool

---

## Configuration

```typescript
// Default configuration
{
  "pool": {
    "minBrowsers": 2,
    "maxBrowsers": 10,
    "idleTimeout": 300000,      // 5 minutes
    "maxUseCount": 100,
    "validationInterval": 30000, // 30 seconds
    "acquireTimeout": 30000      // 30 seconds
  }
}

// High-throughput configuration
{
  "pool": {
    "minBrowsers": 5,
    "maxBrowsers": 50,
    "idleTimeout": 600000,      // 10 minutes
    "maxUseCount": 50
  }
}

// Resource-constrained configuration
{
  "pool": {
    "minBrowsers": 0,           // No pre-warming
    "maxBrowsers": 3,
    "idleTimeout": 60000,       // 1 minute
    "maxUseCount": 200
  }
}
```

---

## Monitoring Metrics

Track these metrics to tune pool configuration:

1. **Acquisition latency**: Time to acquire browser
2. **Pool utilization**: active / max browsers
3. **Queue depth**: Requests waiting for browser
4. **Creation rate**: New browsers created per minute
5. **Eviction rate**: Browsers evicted per minute
6. **Health check failures**: Unhealthy browser count

Alerts:
- Queue depth > 5 for > 1 minute → Increase max browsers
- Pool utilization < 20% for > 10 minutes → Decrease min browsers
- Health check failures > 10% → Investigate stability issues

---

## Future Enhancements

1. **Distributed Pool**: Share pool across multiple machines
2. **Browser Type Pools**: Separate pools for Chromium/Firefox/WebKit
3. **Priority Queue**: Prioritize interactive requests over batch
4. **Predictive Scaling**: ML-based pool size prediction
5. **Warm Browser Cache**: Pre-navigate to common domains

---

## References

- [Generic Pool Pattern](https://en.wikipedia.org/wiki/Object_pool_pattern)
- [Playwright Browser Management](https://playwright.dev/docs/api/class-browser)
- [Apache Commons Pool](https://commons.apache.org/proper/commons-pool/) (inspiration)

---

## Review Schedule

- **Performance Review:** Monthly
- **Configuration Review:** Quarterly
- **Full ADR Review:** 2026-02-27

Review criteria:
- Average acquisition latency < 100ms
- Pool utilization 30-70%
- Health check failure rate < 1%
- Memory usage within acceptable bounds
