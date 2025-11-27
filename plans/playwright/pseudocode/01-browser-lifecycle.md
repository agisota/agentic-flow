# SPARC Pseudocode: Browser Lifecycle Management

## Overview
This document defines the algorithmic design for browser instance lifecycle management, including creation, pooling, health monitoring, and graceful shutdown procedures for Playwright automation.

---

## 1. Browser Instance Creation

### ALGORITHM: CreateBrowserInstance
**INPUT**:
- browserType (string): "chromium" | "firefox" | "webkit"
- options (object): Browser launch options
- poolConfig (object): Pool configuration

**OUTPUT**: browser (Browser object) or error

**COMPLEXITY**:
- Time: O(1) - constant time for process spawn
- Space: O(1) - single browser instance

```
ALGORITHM: CreateBrowserInstance
INPUT: browserType, options, poolConfig
OUTPUT: browser or error

CONSTANTS:
    DEFAULT_TIMEOUT = 30000 ms
    MAX_RETRIES = 3
    HEADLESS_DEFAULT = true

BEGIN
    // Phase 1: Validate inputs
    IF browserType NOT IN ["chromium", "firefox", "webkit"] THEN
        RETURN error("Invalid browser type")
    END IF

    // Phase 2: Merge configuration with defaults
    launchOptions ← {
        headless: options.headless OR HEADLESS_DEFAULT,
        timeout: options.timeout OR DEFAULT_TIMEOUT,
        args: options.args OR [],
        executablePath: options.executablePath OR null,
        downloadsPath: options.downloadsPath OR null,
        slowMo: options.slowMo OR 0
    }

    // Phase 3: Add security options
    IF NOT launchOptions.args.contains("--disable-dev-shm-usage") THEN
        launchOptions.args.append("--disable-dev-shm-usage")
    END IF

    IF NOT launchOptions.args.contains("--no-sandbox") AND options.sandbox = false THEN
        launchOptions.args.append("--no-sandbox")
    END IF

    // Phase 4: Launch browser with retry
    retryCount ← 0
    WHILE retryCount < MAX_RETRIES DO
        TRY
            browser ← Playwright[browserType].launch(launchOptions)

            // Verify browser is responsive
            IF VerifyBrowserHealth(browser) = true THEN
                // Register browser in pool
                BrowserPool.register(browser, {
                    type: browserType,
                    pid: browser.process().pid,
                    createdAt: CurrentTimestamp(),
                    options: launchOptions
                })

                RETURN browser
            ELSE
                browser.close()
                THROW error("Browser health check failed")
            END IF

        CATCH error
            retryCount ← retryCount + 1
            IF retryCount >= MAX_RETRIES THEN
                RETURN error("Failed to launch browser after " + MAX_RETRIES + " attempts: " + error.message)
            END IF

            // Exponential backoff
            WaitFor(2^retryCount * 1000)
        END TRY
    END WHILE
END
```

---

## 2. Browser Pool Management

### DATA STRUCTURE: BrowserPool

```
DATA STRUCTURE: BrowserPool

Type: Object Pool with LRU eviction
Size: Configurable (default: 5 browsers)
TTL: 300 seconds (5 minutes)

Structure:
    available: Queue<BrowserInstance>
    active: Map<browserId, BrowserInstance>
    metadata: Map<browserId, BrowserMetadata>

BrowserMetadata:
    - id: string
    - type: string (chromium/firefox/webkit)
    - pid: integer
    - createdAt: timestamp
    - lastUsedAt: timestamp
    - contextCount: integer
    - pageCount: integer
    - memoryUsage: integer (bytes)
    - isHealthy: boolean

Operations:
    - acquire(type, options): O(1) - Get or create browser
    - release(browserId): O(1) - Return to pool
    - remove(browserId): O(1) - Remove and close
    - scale(targetSize): O(n) - Adjust pool size
    - healthCheck(): O(n) - Check all browsers
```

### ALGORITHM: AcquireBrowser
**COMPLEXITY**:
- Time: O(1) - constant time lookup
- Space: O(1) - no additional space

```
ALGORITHM: AcquireBrowser
INPUT: browserType, options
OUTPUT: browser or error

BEGIN
    // Phase 1: Check pool for available browser
    IF available.hasType(browserType) THEN
        browser ← available.dequeue(browserType)

        // Verify health before reuse
        IF VerifyBrowserHealth(browser) = true THEN
            active.set(browser.id, browser)
            metadata.get(browser.id).lastUsedAt ← CurrentTimestamp()
            RETURN browser
        ELSE
            // Browser unhealthy, remove and create new
            remove(browser.id)
        END IF
    END IF

    // Phase 2: Check if pool at capacity
    totalBrowsers ← available.size() + active.size()
    IF totalBrowsers >= PoolConfig.maxSize THEN
        // Try to evict least recently used inactive browser
        IF available.size() > 0 THEN
            oldestBrowser ← available.dequeueLRU()
            remove(oldestBrowser.id)
        ELSE
            // All browsers active, wait or error
            IF options.wait = true THEN
                browser ← WaitForAvailableBrowser(options.waitTimeout)
                RETURN browser
            ELSE
                RETURN error("Browser pool exhausted")
            END IF
        END IF
    END IF

    // Phase 3: Create new browser
    browser ← CreateBrowserInstance(browserType, options, PoolConfig)
    IF browser IS error THEN
        RETURN browser
    END IF

    active.set(browser.id, browser)
    RETURN browser
END
```

### ALGORITHM: ReleaseBrowser
**COMPLEXITY**:
- Time: O(1) - constant time operations
- Space: O(1)

```
ALGORITHM: ReleaseBrowser
INPUT: browserId
OUTPUT: success or error

BEGIN
    // Phase 1: Verify browser exists in active set
    IF NOT active.has(browserId) THEN
        RETURN error("Browser not found in active pool")
    END IF

    browser ← active.get(browserId)
    metadata ← metadata.get(browserId)

    // Phase 2: Close all contexts and pages
    contexts ← browser.contexts()
    FOR EACH context IN contexts DO
        pages ← context.pages()
        FOR EACH page IN pages DO
            TRY
                page.close()
            CATCH error
                // Log but continue
                Log("Failed to close page: " + error.message)
            END TRY
        END FOR

        TRY
            context.close()
        CATCH error
            Log("Failed to close context: " + error.message)
        END TRY
    END FOR

    // Phase 3: Update metadata
    metadata.lastUsedAt ← CurrentTimestamp()
    metadata.contextCount ← 0
    metadata.pageCount ← 0

    // Phase 4: Health check before returning to pool
    IF VerifyBrowserHealth(browser) = true THEN
        // Check if browser exceeded TTL
        age ← CurrentTimestamp() - metadata.createdAt
        IF age > PoolConfig.ttl THEN
            remove(browserId)
            RETURN success("Browser removed (TTL exceeded)")
        END IF

        // Return to available pool
        active.delete(browserId)
        available.enqueue(browser)
        RETURN success("Browser returned to pool")
    ELSE
        // Unhealthy, remove from pool
        remove(browserId)
        RETURN success("Unhealthy browser removed")
    END IF
END
```

### ALGORITHM: ScaleBrowserPool
**COMPLEXITY**:
- Time: O(n) where n = difference between current and target size
- Space: O(n)

```
ALGORITHM: ScaleBrowserPool
INPUT: targetSize, browserType
OUTPUT: success or error

BEGIN
    currentSize ← available.size() + active.size()

    IF targetSize > currentSize THEN
        // Scale up
        difference ← targetSize - currentSize

        FOR i FROM 1 TO difference DO
            browser ← CreateBrowserInstance(browserType, DefaultOptions, PoolConfig)
            IF browser IS error THEN
                Log("Failed to create browser during scale-up: " + browser.message)
                CONTINUE
            END IF

            available.enqueue(browser)
        END FOR

        RETURN success("Scaled up to " + targetSize + " browsers")

    ELSE IF targetSize < currentSize THEN
        // Scale down
        difference ← currentSize - targetSize
        removed ← 0

        WHILE removed < difference AND available.size() > 0 DO
            browser ← available.dequeue()
            remove(browser.id)
            removed ← removed + 1
        END WHILE

        IF removed < difference THEN
            RETURN warning("Scaled down by " + removed + " (some browsers in use)")
        ELSE
            RETURN success("Scaled down to " + targetSize + " browsers")
        END IF

    ELSE
        RETURN success("Pool already at target size")
    END IF
END
```

---

## 3. Health Monitoring

### ALGORITHM: VerifyBrowserHealth
**COMPLEXITY**:
- Time: O(1) - constant time checks
- Space: O(1)

```
ALGORITHM: VerifyBrowserHealth
INPUT: browser
OUTPUT: isHealthy (boolean)

CONSTANTS:
    HEALTH_CHECK_TIMEOUT = 5000 ms
    MAX_MEMORY_MB = 1024

BEGIN
    TRY
        // Check 1: Browser process exists
        IF browser.process() = null THEN
            RETURN false
        END IF

        // Check 2: Process is running
        IF NOT IsProcessRunning(browser.process().pid) THEN
            RETURN false
        END IF

        // Check 3: Can create context (tests responsiveness)
        context ← browser.newContext({ timeout: HEALTH_CHECK_TIMEOUT })
        context.close()

        // Check 4: Memory usage within limits
        memoryUsage ← GetProcessMemory(browser.process().pid)
        IF memoryUsage > (MAX_MEMORY_MB * 1024 * 1024) THEN
            Log("Browser exceeds memory limit: " + memoryUsage + " bytes")
            RETURN false
        END IF

        RETURN true

    CATCH error
        Log("Health check failed: " + error.message)
        RETURN false
    END TRY
END
```

### ALGORITHM: MonitorBrowserHealth
**COMPLEXITY**:
- Time: O(n * m) where n = browsers, m = health checks per browser
- Space: O(n)

```
ALGORITHM: MonitorBrowserHealth
INPUT: interval (milliseconds)
OUTPUT: continuous monitoring

CONSTANTS:
    DEFAULT_INTERVAL = 30000 ms (30 seconds)
    UNHEALTHY_THRESHOLD = 3
    AUTO_RESTART = true

BEGIN
    monitorInterval ← interval OR DEFAULT_INTERVAL
    failureCounts ← Map<browserId, integer>()

    WHILE true DO
        allBrowsers ← available.all() UNION active.all()

        FOR EACH browser IN allBrowsers DO
            isHealthy ← VerifyBrowserHealth(browser)
            browserId ← browser.id

            IF NOT isHealthy THEN
                // Increment failure count
                IF NOT failureCounts.has(browserId) THEN
                    failureCounts.set(browserId, 0)
                END IF

                failureCounts.set(browserId, failureCounts.get(browserId) + 1)

                // Check threshold
                IF failureCounts.get(browserId) >= UNHEALTHY_THRESHOLD THEN
                    Log("Browser " + browserId + " failed " + UNHEALTHY_THRESHOLD + " health checks")

                    // Remove from pool
                    IF active.has(browserId) THEN
                        // Cannot remove active browser, mark for removal
                        metadata.get(browserId).markedForRemoval ← true
                    ELSE
                        remove(browserId)

                        // Auto-restart if enabled
                        IF AUTO_RESTART = true THEN
                            browserType ← metadata.get(browserId).type
                            options ← metadata.get(browserId).options
                            newBrowser ← CreateBrowserInstance(browserType, options, PoolConfig)

                            IF newBrowser IS NOT error THEN
                                available.enqueue(newBrowser)
                            END IF
                        END IF
                    END IF

                    failureCounts.delete(browserId)
                END IF
            ELSE
                // Reset failure count on successful check
                failureCounts.delete(browserId)
            END IF
        END FOR

        // Wait for next interval
        Sleep(monitorInterval)
    END WHILE
END
```

---

## 4. Browser Context Isolation

### ALGORITHM: CreateIsolatedContext
**COMPLEXITY**:
- Time: O(1) - constant time context creation
- Space: O(1)

```
ALGORITHM: CreateIsolatedContext
INPUT: browser, contextOptions
OUTPUT: context or error

BEGIN
    // Phase 1: Validate browser
    IF NOT VerifyBrowserHealth(browser) THEN
        RETURN error("Browser unhealthy")
    END IF

    // Phase 2: Build context options with isolation
    isolatedOptions ← {
        // Storage isolation
        storageState: contextOptions.storageState OR null,

        // Cookie isolation
        acceptDownloads: contextOptions.acceptDownloads OR false,

        // Permissions isolation
        permissions: contextOptions.permissions OR [],

        // Geolocation
        geolocation: contextOptions.geolocation OR null,

        // Viewport
        viewport: contextOptions.viewport OR { width: 1920, height: 1080 },

        // User agent
        userAgent: contextOptions.userAgent OR GenerateRandomUserAgent(),

        // Locale
        locale: contextOptions.locale OR "en-US",

        // Timezone
        timezoneId: contextOptions.timezoneId OR "America/New_York",

        // Device emulation
        deviceScaleFactor: contextOptions.deviceScaleFactor OR 1,
        isMobile: contextOptions.isMobile OR false,
        hasTouch: contextOptions.hasTouch OR false,

        // Network isolation
        offline: contextOptions.offline OR false,

        // Video/screenshot settings
        recordVideo: contextOptions.recordVideo OR null,
        recordHar: contextOptions.recordHar OR null
    }

    // Phase 3: Create context
    TRY
        context ← browser.newContext(isolatedOptions)

        // Phase 4: Setup context event handlers
        context.on("page", HandleNewPage)
        context.on("close", HandleContextClose)

        // Phase 5: Setup default timeout
        context.setDefaultTimeout(contextOptions.timeout OR 30000)
        context.setDefaultNavigationTimeout(contextOptions.navigationTimeout OR 30000)

        // Phase 6: Register context
        contextId ← GenerateUUID()
        ContextRegistry.set(contextId, {
            context: context,
            browserId: browser.id,
            createdAt: CurrentTimestamp(),
            options: isolatedOptions,
            pageCount: 0
        })

        RETURN context

    CATCH error
        RETURN error("Failed to create context: " + error.message)
    END TRY
END
```

---

## 5. Memory Management

### ALGORITHM: MonitorMemoryUsage
**COMPLEXITY**:
- Time: O(n) where n = number of browsers
- Space: O(n)

```
ALGORITHM: MonitorMemoryUsage
INPUT: none
OUTPUT: memoryReport

CONSTANTS:
    WARNING_THRESHOLD_MB = 512
    CRITICAL_THRESHOLD_MB = 1024
    GC_TRIGGER_THRESHOLD_MB = 768

BEGIN
    memoryReport ← {
        totalMemory: 0,
        browserMemory: [],
        warnings: [],
        actions: []
    }

    allBrowsers ← BrowserPool.getAllBrowsers()

    FOR EACH browser IN allBrowsers DO
        pid ← browser.process().pid
        memoryUsage ← GetProcessMemory(pid)
        memoryMB ← memoryUsage / (1024 * 1024)

        browserInfo ← {
            id: browser.id,
            pid: pid,
            memoryMB: memoryMB,
            contextCount: metadata.get(browser.id).contextCount,
            pageCount: metadata.get(browser.id).pageCount
        }

        memoryReport.browserMemory.append(browserInfo)
        memoryReport.totalMemory ← memoryReport.totalMemory + memoryMB

        // Check thresholds
        IF memoryMB >= CRITICAL_THRESHOLD_MB THEN
            memoryReport.warnings.append({
                level: "CRITICAL",
                browserId: browser.id,
                message: "Browser memory usage critical: " + memoryMB + " MB"
            })

            // Force browser restart
            memoryReport.actions.append({
                action: "RESTART_BROWSER",
                browserId: browser.id
            })

        ELSE IF memoryMB >= GC_TRIGGER_THRESHOLD_MB THEN
            memoryReport.warnings.append({
                level: "HIGH",
                browserId: browser.id,
                message: "Browser memory usage high: " + memoryMB + " MB"
            })

            // Trigger garbage collection
            memoryReport.actions.append({
                action: "TRIGGER_GC",
                browserId: browser.id
            })

        ELSE IF memoryMB >= WARNING_THRESHOLD_MB THEN
            memoryReport.warnings.append({
                level: "WARNING",
                browserId: browser.id,
                message: "Browser memory usage elevated: " + memoryMB + " MB"
            })
        END IF
    END FOR

    RETURN memoryReport
END
```

### ALGORITHM: CleanupBrowserMemory
**COMPLEXITY**:
- Time: O(n * m) where n = browsers, m = contexts per browser
- Space: O(1)

```
ALGORITHM: CleanupBrowserMemory
INPUT: browser, aggressive (boolean)
OUTPUT: success

BEGIN
    contexts ← browser.contexts()

    // Phase 1: Close idle contexts
    FOR EACH context IN contexts DO
        contextInfo ← ContextRegistry.get(context.id)
        idleTime ← CurrentTimestamp() - contextInfo.lastUsedAt

        IF idleTime > 300000 THEN // 5 minutes idle
            pages ← context.pages()
            FOR EACH page IN pages DO
                page.close()
            END FOR
            context.close()
            ContextRegistry.delete(context.id)
        END IF
    END FOR

    // Phase 2: If aggressive, close all contexts
    IF aggressive = true THEN
        FOR EACH context IN browser.contexts() DO
            TRY
                context.close()
            CATCH error
                Log("Failed to close context: " + error.message)
            END TRY
        END FOR
    END IF

    // Phase 3: Trigger browser garbage collection
    TRY
        // Navigate all pages to about:blank
        FOR EACH context IN browser.contexts() DO
            FOR EACH page IN context.pages() DO
                page.goto("about:blank")
            END FOR
        END FOR
    CATCH error
        Log("GC trigger failed: " + error.message)
    END TRY

    RETURN success
END
```

---

## 6. Graceful Shutdown

### STATE MACHINE: Shutdown Process

```
STATE MACHINE: BrowserShutdown

States:
    - RUNNING: Normal operation
    - SHUTDOWN_INITIATED: Shutdown signal received
    - DRAINING: Processing existing requests
    - CLEANUP: Closing resources
    - TERMINATED: All resources released

Transitions:
    RUNNING → SHUTDOWN_INITIATED: On shutdown signal
    SHUTDOWN_INITIATED → DRAINING: Begin draining active browsers
    DRAINING → CLEANUP: All active browsers released
    CLEANUP → TERMINATED: All resources closed

ASCII Diagram:
    ┌─────────┐
    │ RUNNING │
    └────┬────┘
         │ Shutdown Signal
         ▼
    ┌────────────────────┐
    │SHUTDOWN_INITIATED  │
    └────────┬───────────┘
             │ Start Draining
             ▼
    ┌────────────────┐
    │   DRAINING     │◄───┐
    └────────┬───────┘    │
             │             │ Wait for active
             │             │ browsers
             ▼             │
    ┌────────────────┐    │
    │ Active > 0?    ├────┘
    └────────┬───────┘
             │ No (Active = 0)
             ▼
    ┌────────────────┐
    │    CLEANUP     │
    └────────┬───────┘
             │ Close all resources
             ▼
    ┌────────────────┐
    │  TERMINATED    │
    └────────────────┘
```

### ALGORITHM: GracefulShutdown
**COMPLEXITY**:
- Time: O(n * m) where n = browsers, m = contexts per browser
- Space: O(n)

```
ALGORITHM: GracefulShutdown
INPUT: timeout (milliseconds)
OUTPUT: shutdownReport

CONSTANTS:
    DEFAULT_TIMEOUT = 30000 ms
    FORCE_KILL_DELAY = 5000 ms

BEGIN
    shutdownTimeout ← timeout OR DEFAULT_TIMEOUT
    shutdownStartTime ← CurrentTimestamp()
    state ← "SHUTDOWN_INITIATED"

    shutdownReport ← {
        startTime: shutdownStartTime,
        browsersAtStart: 0,
        browsersClosed: 0,
        contextsAtStart: 0,
        contextsClosed: 0,
        pagesAtStart: 0,
        pagesClosed: 0,
        forceClosed: 0,
        errors: []
    }

    // Phase 1: Stop accepting new requests
    BrowserPool.stopAcceptingRequests()

    // Phase 2: Count resources
    allBrowsers ← BrowserPool.getAllBrowsers()
    shutdownReport.browsersAtStart ← allBrowsers.size()

    FOR EACH browser IN allBrowsers DO
        contexts ← browser.contexts()
        shutdownReport.contextsAtStart ← shutdownReport.contextsAtStart + contexts.size()

        FOR EACH context IN contexts DO
            pages ← context.pages()
            shutdownReport.pagesAtStart ← shutdownReport.pagesAtStart + pages.size()
        END FOR
    END FOR

    // Phase 3: Transition to DRAINING state
    state ← "DRAINING"

    // Wait for active browsers to be released
    WHILE active.size() > 0 DO
        elapsed ← CurrentTimestamp() - shutdownStartTime

        IF elapsed > shutdownTimeout THEN
            // Timeout reached, force close active browsers
            FOR EACH browserId IN active.keys() DO
                browser ← active.get(browserId)
                ForceCloseBrowser(browser)
                shutdownReport.forceClosed ← shutdownReport.forceClosed + 1
            END FOR
            BREAK
        END IF

        Sleep(100) // Check every 100ms
    END WHILE

    // Phase 4: Transition to CLEANUP state
    state ← "CLEANUP"

    // Close all available browsers
    allBrowsers ← available.all() UNION active.all()

    FOR EACH browser IN allBrowsers DO
        TRY
            // Close all contexts and pages
            contexts ← browser.contexts()

            FOR EACH context IN contexts DO
                TRY
                    pages ← context.pages()

                    FOR EACH page IN pages DO
                        TRY
                            page.close({ timeout: 1000 })
                            shutdownReport.pagesClosed ← shutdownReport.pagesClosed + 1
                        CATCH error
                            shutdownReport.errors.append({
                                type: "PAGE_CLOSE",
                                message: error.message
                            })
                        END TRY
                    END FOR

                    context.close({ timeout: 2000 })
                    shutdownReport.contextsClosed ← shutdownReport.contextsClosed + 1

                CATCH error
                    shutdownReport.errors.append({
                        type: "CONTEXT_CLOSE",
                        message: error.message
                    })
                END TRY
            END FOR

            // Close browser
            browser.close({ timeout: 5000 })
            shutdownReport.browsersClosed ← shutdownReport.browsersClosed + 1

        CATCH error
            shutdownReport.errors.append({
                type: "BROWSER_CLOSE",
                browserId: browser.id,
                message: error.message
            })

            // Force kill process if close failed
            IF browser.process() NOT null THEN
                KillProcess(browser.process().pid)
                shutdownReport.forceClosed ← shutdownReport.forceClosed + 1
            END IF
        END TRY
    END FOR

    // Phase 5: Clear all registries
    BrowserPool.clear()
    ContextRegistry.clear()

    // Phase 6: Transition to TERMINATED state
    state ← "TERMINATED"

    shutdownReport.endTime ← CurrentTimestamp()
    shutdownReport.duration ← shutdownReport.endTime - shutdownStartTime
    shutdownReport.success ← (shutdownReport.errors.size() = 0)

    RETURN shutdownReport
END
```

### ALGORITHM: ForceCloseBrowser
**COMPLEXITY**:
- Time: O(1) - immediate process termination
- Space: O(1)

```
ALGORITHM: ForceCloseBrowser
INPUT: browser
OUTPUT: success

BEGIN
    browserId ← browser.id

    TRY
        // Attempt graceful close first
        browser.close({ timeout: 2000 })
        RETURN success

    CATCH error
        // Graceful close failed, force kill
        IF browser.process() NOT null THEN
            pid ← browser.process().pid
            KillProcess(pid)

            // Wait briefly to confirm termination
            Sleep(1000)

            IF IsProcessRunning(pid) THEN
                // Force kill with SIGKILL
                KillProcess(pid, SIGKILL)
            END IF
        END IF

        // Clean up from registries
        active.delete(browserId)
        available.remove(browserId)
        metadata.delete(browserId)

        RETURN success
    END TRY
END
```

---

## Complexity Summary

| Algorithm | Time Complexity | Space Complexity | Notes |
|-----------|----------------|------------------|-------|
| CreateBrowserInstance | O(1) | O(1) | Process spawn is constant time |
| AcquireBrowser | O(1) | O(1) | Hash map lookups |
| ReleaseBrowser | O(n) | O(1) | n = contexts per browser |
| ScaleBrowserPool | O(n) | O(n) | n = size difference |
| VerifyBrowserHealth | O(1) | O(1) | Fixed set of checks |
| MonitorBrowserHealth | O(n*m) | O(n) | n = browsers, m = checks |
| CreateIsolatedContext | O(1) | O(1) | Context creation |
| MonitorMemoryUsage | O(n) | O(n) | n = number of browsers |
| CleanupBrowserMemory | O(n*m) | O(1) | n = browsers, m = contexts |
| GracefulShutdown | O(n*m*p) | O(n) | n = browsers, m = contexts, p = pages |
| ForceCloseBrowser | O(1) | O(1) | Immediate termination |

---

## Edge Cases

### Browser Creation
1. **Executable not found**: Validate path before launch, return clear error
2. **Insufficient permissions**: Check file permissions, suggest remediation
3. **Port conflicts**: Randomize debug port, retry with different port
4. **Out of memory**: Implement memory checks before creation
5. **Concurrent creation race**: Use mutex/lock for pool modifications

### Pool Management
1. **Pool exhaustion**: Implement waiting queue or rejection strategy
2. **Zombie browsers**: Health monitor detects and removes
3. **Memory leaks**: Periodic cleanup and TTL enforcement
4. **Crash during use**: Auto-restart with context restoration
5. **Rapid scale up/down**: Debounce scaling operations

### Shutdown
1. **Hanging browsers**: Force kill after timeout
2. **Zombie processes**: Track PIDs and kill orphans
3. **Partial shutdown**: Continue shutdown despite individual failures
4. **Interrupt during shutdown**: Handle SIGINT/SIGTERM gracefully
5. **Resource cleanup failure**: Log and continue with best effort

---

## Production Considerations

1. **Observability**: Emit metrics for pool size, health, memory, latency
2. **Resource limits**: Enforce CPU, memory, file descriptor limits
3. **Fault tolerance**: Implement circuit breakers for failing browsers
4. **Performance**: Pool warming, keep-alive strategies
5. **Security**: Sandbox isolation, permission restrictions
6. **Scaling**: Auto-scale based on demand and resource usage
