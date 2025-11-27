# Multi-Agent Coordination

**Version:** 1.0.0
**Date:** 2025-11-27

---

## 1. Multi-Agent Architecture Overview

### 1.1 Coordination Patterns

The Playwright-MCP agent supports multiple coordination patterns for distributed browser automation:

```
┌─────────────────────────────────────────────────────────┐
│         Multi-Agent Coordination Patterns               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Browser    │  │   Parallel   │  │ Distributed  │ │
│  │     Pool     │  │   Scraping   │  │     Task     │ │
│  │  Management  │  │              │  │  Execution   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    Result    │  │   Session    │  │    Load      │ │
│  │ Aggregation  │  │    Sharing   │  │  Balancing   │ │
│  │              │  │              │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Coordination Topologies

#### A. Centralized (Hub-and-Spoke)
```
              ┌──────────────┐
              │  Coordinator │
              │    Agent     │
              └───────┬──────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼───┐   ┌───▼────┐  ┌───▼────┐
    │Worker 1│   │Worker 2│  │Worker N│
    └────────┘   └────────┘  └────────┘
```

#### B. Decentralized (Peer-to-Peer)
```
    ┌────────┐         ┌────────┐
    │Agent 1 │◄───────►│Agent 2 │
    └───┬────┘         └────┬───┘
        │                   │
        │     ┌────────┐    │
        └────►│Agent 3 │◄───┘
              └────────┘
```

#### C. Hierarchical (Tree)
```
           ┌──────────────┐
           │   Primary    │
           │ Coordinator  │
           └───────┬──────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼────┐           ┌───▼────┐
   │Secondary│           │Secondary│
   │Coord 1  │           │Coord 2  │
   └────┬────┘           └────┬────┘
        │                     │
    ┌───┴───┐             ┌───┴───┐
    │       │             │       │
  ┌─▼─┐   ┌▼──┐       ┌─▼─┐   ┌▼──┐
  │W1 │   │W2 │       │W3 │   │W4 │
  └───┘   └───┘       └───┘   └───┘
```

---

## 2. Browser Pool Management

### 2.1 Pool Architecture

```typescript
interface BrowserPool {
  // Pool Operations
  acquire(options?: AcquireOptions): Promise<PooledBrowser>;
  release(browser: PooledBrowser): Promise<void>;
  drain(): Promise<void>;
  clear(): Promise<void>;

  // Pool State
  getStats(): PoolStats;
  getAvailable(): number;
  getActive(): number;

  // Pool Configuration
  setMinSize(size: number): void;
  setMaxSize(size: number): void;
  setIdleTimeout(ms: number): void;
}

interface PooledBrowser {
  id: string;
  browser: Browser;
  createdAt: number;
  lastUsed: number;
  useCount: number;
  release(): Promise<void>;
}

interface PoolStats {
  size: number;
  available: number;
  active: number;
  pending: number;
  created: number;
  destroyed: number;
  errors: number;
}

interface AcquireOptions {
  priority?: number;
  timeout?: number;
  browserType?: 'chromium' | 'firefox' | 'webkit';
  fresh?: boolean; // Request a new browser instance
}
```

### 2.2 Pool Implementation

```typescript
class BrowserPoolImpl implements BrowserPool {
  private instances: Map<string, PooledBrowser> = new Map();
  private available: PooledBrowser[] = [];
  private waitQueue: QueuedRequest[] = [];

  private config: {
    min: number;
    max: number;
    idleTimeout: number;
    maxUseCount: number;
    validationInterval: number;
  };

  constructor(config: BrowserPoolConfig) {
    this.config = {
      min: config.min || 2,
      max: config.max || 10,
      idleTimeout: config.idleTimeout || 5 * 60 * 1000, // 5 minutes
      maxUseCount: config.maxUseCount || 100,
      validationInterval: config.validationInterval || 30000,
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Pre-warm pool
    for (let i = 0; i < this.config.min; i++) {
      await this.createInstance();
    }

    // Start background tasks
    setInterval(() => this.validatePool(), this.config.validationInterval);
    setInterval(() => this.evictIdle(), this.config.idleTimeout);
  }

  async acquire(options: AcquireOptions = {}): Promise<PooledBrowser> {
    // Try to get available instance
    if (!options.fresh && this.available.length > 0) {
      const instance = this.available.shift()!;
      instance.lastUsed = Date.now();
      instance.useCount++;
      return instance;
    }

    // Create new if under max
    if (this.instances.size < this.config.max) {
      return await this.createInstance();
    }

    // Wait for available instance
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitQueue.findIndex(r => r.resolve === resolve);
        if (index !== -1) {
          this.waitQueue.splice(index, 1);
        }
        reject(new Error('Browser acquisition timeout'));
      }, options.timeout || 30000);

      this.waitQueue.push({
        resolve: (browser) => {
          clearTimeout(timeout);
          resolve(browser);
        },
        reject,
        priority: options.priority || 0,
        requestedAt: Date.now(),
      });

      // Sort by priority
      this.waitQueue.sort((a, b) => b.priority - a.priority);
    });
  }

  async release(browser: PooledBrowser): Promise<void> {
    // Check if browser should be recycled
    if (
      browser.useCount >= this.config.maxUseCount ||
      !browser.browser.isConnected()
    ) {
      await this.destroyInstance(browser);
      await this.createInstance(); // Maintain pool size
      return;
    }

    // Return to pool
    browser.lastUsed = Date.now();

    // Serve waiting request if any
    if (this.waitQueue.length > 0) {
      const request = this.waitQueue.shift()!;
      request.resolve(browser);
    } else {
      this.available.push(browser);
    }
  }

  private async createInstance(): Promise<PooledBrowser> {
    const browser = await playwright.chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });

    const instance: PooledBrowser = {
      id: generateId(),
      browser,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 0,
      release: () => this.release(instance),
    };

    this.instances.set(instance.id, instance);
    return instance;
  }

  private async validatePool(): Promise<void> {
    for (const instance of this.instances.values()) {
      try {
        // Check if browser is still responsive
        if (!instance.browser.isConnected()) {
          await this.destroyInstance(instance);
        }
      } catch (error) {
        logger.error('Pool validation error:', error);
        await this.destroyInstance(instance);
      }
    }

    // Ensure minimum pool size
    while (this.instances.size < this.config.min) {
      await this.createInstance();
    }
  }

  private async evictIdle(): Promise<void> {
    const now = Date.now();

    for (const instance of this.available) {
      const idleTime = now - instance.lastUsed;

      if (
        idleTime > this.config.idleTimeout &&
        this.instances.size > this.config.min
      ) {
        await this.destroyInstance(instance);
      }
    }
  }
}
```

---

## 3. Parallel Scraping Patterns

### 3.1 URL List Scraping

```typescript
interface ParallelScraper {
  scrapeUrls(
    urls: string[],
    options?: ScrapeOptions
  ): Promise<ScrapeResult[]>;
}

interface ScrapeOptions {
  concurrency?: number;
  retries?: number;
  timeout?: number;
  extractors?: Extractor[];
  onProgress?: (progress: Progress) => void;
}

interface ScrapeResult {
  url: string;
  success: boolean;
  data?: any;
  error?: Error;
  timing: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

class ParallelScraperImpl implements ParallelScraper {
  private pool: BrowserPool;

  constructor(pool: BrowserPool) {
    this.pool = pool;
  }

  async scrapeUrls(
    urls: string[],
    options: ScrapeOptions = {}
  ): Promise<ScrapeResult[]> {
    const concurrency = options.concurrency || 5;
    const results: ScrapeResult[] = [];
    let completed = 0;

    // Process URLs in batches
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);

      const batchResults = await Promise.all(
        batch.map(url => this.scrapeUrl(url, options))
      );

      results.push(...batchResults);
      completed += batch.length;

      // Report progress
      if (options.onProgress) {
        options.onProgress({
          completed,
          total: urls.length,
          percentage: (completed / urls.length) * 100,
        });
      }
    }

    return results;
  }

  private async scrapeUrl(
    url: string,
    options: ScrapeOptions
  ): Promise<ScrapeResult> {
    const startTime = Date.now();
    let browser: PooledBrowser | null = null;

    try {
      // Acquire browser from pool
      browser = await this.pool.acquire({
        timeout: options.timeout,
      });

      // Create page
      const page = await browser.browser.newPage();

      // Navigate
      await page.goto(url, {
        timeout: options.timeout || 30000,
        waitUntil: 'networkidle',
      });

      // Extract data
      const data = await this.extractData(page, options.extractors || []);

      await page.close();

      return {
        url,
        success: true,
        data,
        timing: {
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        url,
        success: false,
        error: error as Error,
        timing: {
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime,
        },
      };
    } finally {
      if (browser) {
        await browser.release();
      }
    }
  }

  private async extractData(
    page: Page,
    extractors: Extractor[]
  ): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    for (const extractor of extractors) {
      data[extractor.name] = await extractor.extract(page);
    }

    return data;
  }
}
```

### 3.2 Pagination Scraping

```typescript
interface PaginationScraper {
  scrapePages(
    startUrl: string,
    options?: PaginationOptions
  ): AsyncGenerator<PageResult>;
}

interface PaginationOptions {
  maxPages?: number;
  nextSelector?: string;
  nextUrlExtractor?: (page: Page) => Promise<string | null>;
  extractors?: Extractor[];
}

class PaginationScraperImpl implements PaginationScraper {
  private pool: BrowserPool;

  async *scrapePages(
    startUrl: string,
    options: PaginationOptions = {}
  ): AsyncGenerator<PageResult> {
    let currentUrl: string | null = startUrl;
    let pageNumber = 1;
    const maxPages = options.maxPages || Infinity;

    const browser = await this.pool.acquire();
    const page = await browser.browser.newPage();

    try {
      while (currentUrl && pageNumber <= maxPages) {
        // Navigate to page
        await page.goto(currentUrl, {
          waitUntil: 'networkidle',
        });

        // Extract data
        const data = await this.extractData(page, options.extractors || []);

        yield {
          pageNumber,
          url: currentUrl,
          data,
        };

        // Find next page
        if (options.nextUrlExtractor) {
          currentUrl = await options.nextUrlExtractor(page);
        } else if (options.nextSelector) {
          currentUrl = await this.findNextUrl(page, options.nextSelector);
        } else {
          break;
        }

        pageNumber++;
      }
    } finally {
      await page.close();
      await browser.release();
    }
  }

  private async findNextUrl(page: Page, selector: string): Promise<string | null> {
    try {
      const nextLink = await page.$(selector);
      if (!nextLink) return null;

      const href = await nextLink.getAttribute('href');
      if (!href) return null;

      // Convert relative URL to absolute
      const currentUrl = page.url();
      return new URL(href, currentUrl).toString();
    } catch {
      return null;
    }
  }
}
```

---

## 4. Distributed Task Execution

### 4.1 Task Distribution System

```typescript
interface TaskDistributor {
  // Task Management
  submitTask(task: Task): Promise<string>;
  getTaskStatus(taskId: string): Promise<TaskStatus>;
  cancelTask(taskId: string): Promise<void>;

  // Worker Management
  registerWorker(worker: Worker): void;
  unregisterWorker(workerId: string): void;
  getWorkerStats(): WorkerStats[];
}

interface Task {
  id: string;
  type: string;
  params: Record<string, any>;
  priority: number;
  timeout?: number;
  retries?: number;
}

interface TaskStatus {
  id: string;
  state: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  result?: any;
  error?: Error;
  worker?: string;
  startedAt?: number;
  completedAt?: number;
}

interface Worker {
  id: string;
  capacity: number;
  capabilities: string[];
  endpoint: string;
}
```

### 4.2 Coordinator Implementation

```typescript
class TaskCoordinator implements TaskDistributor {
  private tasks: Map<string, TaskStatus> = new Map();
  private workers: Map<string, Worker> = new Map();
  private pendingQueue: Task[] = [];
  private runningTasks: Map<string, Task> = new Map();

  async submitTask(task: Task): Promise<string> {
    const taskId = task.id || generateId();

    // Initialize task status
    this.tasks.set(taskId, {
      id: taskId,
      state: 'pending',
    });

    // Add to queue
    this.pendingQueue.push({ ...task, id: taskId });
    this.pendingQueue.sort((a, b) => b.priority - a.priority);

    // Try to assign immediately
    this.assignTasks();

    return taskId;
  }

  private async assignTasks(): Promise<void> {
    for (const task of this.pendingQueue) {
      // Find suitable worker
      const worker = this.findWorkerForTask(task);
      if (!worker) continue;

      // Remove from pending queue
      const index = this.pendingQueue.indexOf(task);
      this.pendingQueue.splice(index, 1);

      // Assign to worker
      await this.executeOnWorker(task, worker);
    }
  }

  private findWorkerForTask(task: Task): Worker | null {
    for (const worker of this.workers.values()) {
      // Check if worker has capacity
      const runningOnWorker = Array.from(this.runningTasks.values())
        .filter(t => this.tasks.get(t.id)?.worker === worker.id)
        .length;

      if (runningOnWorker >= worker.capacity) {
        continue;
      }

      // Check if worker has required capabilities
      if (worker.capabilities.includes(task.type)) {
        return worker;
      }
    }

    return null;
  }

  private async executeOnWorker(task: Task, worker: Worker): Promise<void> {
    // Update task status
    const status = this.tasks.get(task.id)!;
    status.state = 'running';
    status.worker = worker.id;
    status.startedAt = Date.now();

    this.runningTasks.set(task.id, task);

    try {
      // Send task to worker (could be HTTP, gRPC, message queue, etc.)
      const result = await this.sendToWorker(worker, task);

      // Update status
      status.state = 'completed';
      status.result = result;
      status.completedAt = Date.now();
    } catch (error) {
      // Handle failure
      status.state = 'failed';
      status.error = error as Error;
      status.completedAt = Date.now();

      // Retry if configured
      if (task.retries && task.retries > 0) {
        task.retries--;
        this.pendingQueue.push(task);
      }
    } finally {
      this.runningTasks.delete(task.id);

      // Try to assign more tasks
      this.assignTasks();
    }
  }

  private async sendToWorker(worker: Worker, task: Task): Promise<any> {
    // HTTP-based worker communication
    const response = await fetch(`${worker.endpoint}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      throw new Error(`Worker request failed: ${response.statusText}`);
    }

    return response.json();
  }

  registerWorker(worker: Worker): void {
    this.workers.set(worker.id, worker);
    this.assignTasks(); // Try to assign pending tasks
  }

  unregisterWorker(workerId: string): void {
    // Reassign running tasks from this worker
    for (const [taskId, status] of this.tasks.entries()) {
      if (status.worker === workerId && status.state === 'running') {
        const task = this.runningTasks.get(taskId);
        if (task) {
          this.pendingQueue.push(task);
        }
      }
    }

    this.workers.delete(workerId);
  }
}
```

### 4.3 Worker Implementation

```typescript
class BrowserWorker {
  private id: string;
  private pool: BrowserPool;
  private coordinator: string; // Coordinator endpoint
  private heartbeatInterval: NodeJS.Timeout;

  constructor(config: WorkerConfig) {
    this.id = config.id || generateId();
    this.pool = new BrowserPoolImpl(config.pool);
    this.coordinator = config.coordinator;

    this.startHeartbeat();
    this.registerWithCoordinator();
  }

  private async registerWithCoordinator(): Promise<void> {
    await fetch(`${this.coordinator}/workers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: this.id,
        capacity: this.pool.getStats().size,
        capabilities: ['scrape', 'screenshot', 'navigate'],
        endpoint: `http://localhost:${process.env.PORT || 3000}`,
      }),
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await fetch(`${this.coordinator}/workers/${this.id}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stats: this.pool.getStats(),
          }),
        });
      } catch (error) {
        logger.error('Heartbeat failed:', error);
      }
    }, 30000); // Every 30 seconds
  }

  async executeTask(task: Task): Promise<any> {
    const browser = await this.pool.acquire();

    try {
      switch (task.type) {
        case 'scrape':
          return await this.scrape(browser, task.params);
        case 'screenshot':
          return await this.screenshot(browser, task.params);
        case 'navigate':
          return await this.navigate(browser, task.params);
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } finally {
      await browser.release();
    }
  }

  private async scrape(
    browser: PooledBrowser,
    params: any
  ): Promise<any> {
    const page = await browser.browser.newPage();
    await page.goto(params.url);

    const data = await page.evaluate((selectors) => {
      const result: Record<string, any> = {};
      for (const [key, selector] of Object.entries(selectors)) {
        const element = document.querySelector(selector as string);
        result[key] = element?.textContent?.trim();
      }
      return result;
    }, params.selectors);

    await page.close();
    return data;
  }
}
```

---

## 5. Result Aggregation

### 5.1 Aggregation Strategies

```typescript
interface ResultAggregator<T, R> {
  aggregate(results: T[]): R;
}

// Merge all results into single object
class MergeAggregator implements ResultAggregator<any, any> {
  aggregate(results: any[]): any {
    return results.reduce((acc, result) => {
      return { ...acc, ...result };
    }, {});
  }
}

// Collect results into array
class CollectAggregator<T> implements ResultAggregator<T, T[]> {
  aggregate(results: T[]): T[] {
    return results;
  }
}

// Group by key
class GroupByAggregator implements ResultAggregator<any, Record<string, any[]>> {
  constructor(private keyFn: (item: any) => string) {}

  aggregate(results: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    for (const result of results) {
      const key = this.keyFn(result);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(result);
    }

    return groups;
  }
}

// Statistical aggregation
class StatsAggregator implements ResultAggregator<ScrapeResult, ScraperStats> {
  aggregate(results: ScrapeResult[]): ScraperStats {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    const durations = results.map(r => r.timing.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    return {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: successful.length / results.length,
      avgDuration,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      errors: failed.map(r => ({
        url: r.url,
        error: r.error?.message,
      })),
    };
  }
}
```

### 5.2 Streaming Aggregation

```typescript
interface StreamingAggregator<T, R> {
  add(item: T): void;
  getResult(): R;
  reset(): void;
}

class StreamingStatsAggregator implements StreamingAggregator<ScrapeResult, ScraperStats> {
  private count = 0;
  private successCount = 0;
  private totalDuration = 0;
  private minDuration = Infinity;
  private maxDuration = -Infinity;
  private errors: Array<{ url: string; error?: string }> = [];

  add(result: ScrapeResult): void {
    this.count++;

    if (result.success) {
      this.successCount++;
    } else {
      this.errors.push({
        url: result.url,
        error: result.error?.message,
      });
    }

    this.totalDuration += result.timing.duration;
    this.minDuration = Math.min(this.minDuration, result.timing.duration);
    this.maxDuration = Math.max(this.maxDuration, result.timing.duration);
  }

  getResult(): ScraperStats {
    return {
      total: this.count,
      successful: this.successCount,
      failed: this.count - this.successCount,
      successRate: this.successCount / this.count,
      avgDuration: this.totalDuration / this.count,
      minDuration: this.minDuration,
      maxDuration: this.maxDuration,
      errors: this.errors,
    };
  }

  reset(): void {
    this.count = 0;
    this.successCount = 0;
    this.totalDuration = 0;
    this.minDuration = Infinity;
    this.maxDuration = -Infinity;
    this.errors = [];
  }
}
```

---

## 6. Load Balancing

### 6.1 Load Balancing Strategies

```typescript
interface LoadBalancer {
  selectWorker(task: Task, workers: Worker[]): Worker | null;
}

// Round-robin
class RoundRobinBalancer implements LoadBalancer {
  private currentIndex = 0;

  selectWorker(task: Task, workers: Worker[]): Worker | null {
    if (workers.length === 0) return null;

    const worker = workers[this.currentIndex % workers.length];
    this.currentIndex++;
    return worker;
  }
}

// Least connections
class LeastConnectionsBalancer implements LoadBalancer {
  private connections: Map<string, number> = new Map();

  selectWorker(task: Task, workers: Worker[]): Worker | null {
    if (workers.length === 0) return null;

    let minConnections = Infinity;
    let selectedWorker: Worker | null = null;

    for (const worker of workers) {
      const connections = this.connections.get(worker.id) || 0;
      if (connections < minConnections) {
        minConnections = connections;
        selectedWorker = worker;
      }
    }

    if (selectedWorker) {
      this.connections.set(
        selectedWorker.id,
        (this.connections.get(selectedWorker.id) || 0) + 1
      );
    }

    return selectedWorker;
  }

  releaseWorker(workerId: string): void {
    const current = this.connections.get(workerId) || 0;
    this.connections.set(workerId, Math.max(0, current - 1));
  }
}

// Weighted round-robin (based on worker capacity)
class WeightedRoundRobinBalancer implements LoadBalancer {
  private weights: Map<string, number> = new Map();
  private currentWeights: Map<string, number> = new Map();

  selectWorker(task: Task, workers: Worker[]): Worker | null {
    if (workers.length === 0) return null;

    // Initialize weights
    for (const worker of workers) {
      if (!this.weights.has(worker.id)) {
        this.weights.set(worker.id, worker.capacity);
        this.currentWeights.set(worker.id, 0);
      }
    }

    // Select worker with highest current weight
    let maxWeight = -Infinity;
    let selectedWorker: Worker | null = null;

    for (const worker of workers) {
      const current = this.currentWeights.get(worker.id)! + this.weights.get(worker.id)!;
      this.currentWeights.set(worker.id, current);

      if (current > maxWeight) {
        maxWeight = current;
        selectedWorker = worker;
      }
    }

    if (selectedWorker) {
      const totalWeight = Array.from(this.weights.values()).reduce((a, b) => a + b, 0);
      this.currentWeights.set(
        selectedWorker.id,
        this.currentWeights.get(selectedWorker.id)! - totalWeight
      );
    }

    return selectedWorker;
  }
}
```

---

**Next**: [06-configuration-system.md](./06-configuration-system.md)
