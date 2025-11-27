# SPARC Pseudocode: Error Handling and Recovery

## Overview
This document defines algorithmic designs for comprehensive error handling, retry mechanisms, recovery strategies, and fault tolerance in Playwright automation operations.

---

## 1. Retry Mechanisms with Exponential Backoff

### DATA STRUCTURE: RetryPolicy

```
DATA STRUCTURE: RetryPolicy

Structure:
    maxRetries: integer (default: 3)
    baseDelay: integer (milliseconds, default: 1000)
    maxDelay: integer (milliseconds, default: 30000)
    backoffMultiplier: float (default: 2.0)
    jitterFactor: float (default: 0.1)
    retryableErrors: Array<ErrorType>

RetryableErrors:
    - TimeoutError
    - NetworkError
    - ElementNotFoundError
    - NavigationError
    - BrowserCrashedError

Operations:
    - shouldRetry(error): O(1)
    - getNextDelay(attemptNumber): O(1)
    - reset(): O(1)
```

### ALGORITHM: ExecuteWithRetry
**COMPLEXITY**:
- Time: O(n * m) where n = retry attempts, m = operation time
- Space: O(1)

```
ALGORITHM: ExecuteWithRetry
INPUT: operation, retryPolicy, options
OUTPUT: result or error

CONSTANTS:
    DEFAULT_MAX_RETRIES = 3
    DEFAULT_BASE_DELAY = 1000 ms
    DEFAULT_BACKOFF_MULTIPLIER = 2.0
    MAX_JITTER = 0.2

BEGIN
    // Phase 1: Initialize retry state
    maxRetries ← retryPolicy.maxRetries OR DEFAULT_MAX_RETRIES
    baseDelay ← retryPolicy.baseDelay OR DEFAULT_BASE_DELAY
    backoffMultiplier ← retryPolicy.backoffMultiplier OR DEFAULT_BACKOFF_MULTIPLIER

    attemptNumber ← 0
    lastError ← null
    startTime ← CurrentTimestamp()

    // Phase 2: Retry loop
    WHILE attemptNumber <= maxRetries DO
        TRY
            // Log attempt
            IF attemptNumber > 0 THEN
                Log("Retry attempt " + attemptNumber + " of " + maxRetries)
            END IF

            // Execute operation
            result ← operation()

            // Success - return result
            executionTime ← CurrentTimestamp() - startTime

            RETURN {
                success: true,
                result: result,
                attempts: attemptNumber + 1,
                executionTime: executionTime
            }

        CATCH error
            lastError ← error
            attemptNumber ← attemptNumber + 1

            // Phase 3: Check if should retry
            IF attemptNumber > maxRetries THEN
                // Max retries exceeded
                BREAK
            END IF

            IF NOT ShouldRetryError(error, retryPolicy) THEN
                // Non-retryable error
                BREAK
            END IF

            // Phase 4: Calculate delay with exponential backoff
            delay ← CalculateRetryDelay(attemptNumber, baseDelay, backoffMultiplier, retryPolicy)

            // Phase 5: Execute pre-retry hook
            IF options.beforeRetry NOT null THEN
                TRY
                    options.beforeRetry(attemptNumber, error, delay)
                CATCH hookError
                    Log("Pre-retry hook failed: " + hookError.message)
                END TRY
            END IF

            // Phase 6: Wait before retry
            Log("Waiting " + delay + "ms before retry...")
            Sleep(delay)

        END TRY
    END WHILE

    // Phase 7: All retries exhausted
    totalTime ← CurrentTimestamp() - startTime

    RETURN {
        success: false,
        error: lastError,
        attempts: attemptNumber,
        executionTime: totalTime,
        message: "Operation failed after " + attemptNumber + " attempts: " + lastError.message
    }
END
```

### ALGORITHM: CalculateRetryDelay
**COMPLEXITY**:
- Time: O(1)
- Space: O(1)

```
ALGORITHM: CalculateRetryDelay
INPUT: attemptNumber, baseDelay, backoffMultiplier, retryPolicy
OUTPUT: delay (milliseconds)

BEGIN
    // Phase 1: Calculate exponential backoff
    exponentialDelay ← baseDelay * (backoffMultiplier ^ (attemptNumber - 1))

    // Phase 2: Apply maximum delay cap
    maxDelay ← retryPolicy.maxDelay OR 30000
    cappedDelay ← MIN(exponentialDelay, maxDelay)

    // Phase 3: Add jitter to prevent thundering herd
    jitterFactor ← retryPolicy.jitterFactor OR 0.1
    jitterRange ← cappedDelay * jitterFactor
    jitter ← Random(-jitterRange, jitterRange)

    finalDelay ← cappedDelay + jitter

    // Phase 4: Ensure minimum delay
    minDelay ← retryPolicy.minDelay OR 100
    finalDelay ← MAX(finalDelay, minDelay)

    RETURN Math.floor(finalDelay)
END
```

### ALGORITHM: ShouldRetryError
**COMPLEXITY**:
- Time: O(n) where n = retryable error types
- Space: O(1)

```
ALGORITHM: ShouldRetryError
INPUT: error, retryPolicy
OUTPUT: shouldRetry (boolean)

CONSTANTS:
    RETRYABLE_ERROR_TYPES = [
        "TimeoutError",
        "NetworkError",
        "ConnectionError",
        "ElementNotFoundError",
        "NavigationError",
        "BrowserDisconnectedError"
    ]

    NON_RETRYABLE_ERROR_TYPES = [
        "InvalidArgumentError",
        "ValidationError",
        "PermissionDeniedError",
        "AuthenticationError"
    ]

BEGIN
    errorType ← error.name OR error.constructor.name

    // Phase 1: Check explicitly non-retryable errors
    IF errorType IN NON_RETRYABLE_ERROR_TYPES THEN
        RETURN false
    END IF

    // Phase 2: Check custom retryable errors from policy
    IF retryPolicy.retryableErrors NOT null THEN
        IF errorType IN retryPolicy.retryableErrors THEN
            RETURN true
        END IF
    END IF

    // Phase 3: Check default retryable errors
    IF errorType IN RETRYABLE_ERROR_TYPES THEN
        RETURN true
    END IF

    // Phase 4: Check error message patterns
    errorMessage ← error.message.toLowerCase()

    retryablePatterns ← [
        "timeout",
        "network",
        "connection refused",
        "econnreset",
        "socket hang up",
        "503",
        "502",
        "504",
        "temporarily unavailable"
    ]

    FOR EACH pattern IN retryablePatterns DO
        IF errorMessage.contains(pattern) THEN
            RETURN true
        END IF
    END FOR

    // Phase 5: Default to non-retryable
    RETURN false
END
```

---

## 2. Timeout Handling

### STATE MACHINE: Timeout Management

```
STATE MACHINE: TimeoutOperation

States:
    - PENDING: Operation not started
    - RUNNING: Operation in progress
    - TIMEOUT_WARNING: Approaching timeout
    - TIMED_OUT: Timeout exceeded
    - COMPLETED: Operation finished
    - CANCELLED: Operation cancelled

Transitions:
    PENDING → RUNNING: Start operation
    RUNNING → TIMEOUT_WARNING: 80% of timeout elapsed
    RUNNING → COMPLETED: Operation finishes
    RUNNING → TIMED_OUT: Timeout exceeded
    RUNNING → CANCELLED: Manual cancellation
    TIMEOUT_WARNING → COMPLETED: Operation finishes
    TIMEOUT_WARNING → TIMED_OUT: Timeout exceeded
    TIMED_OUT → CANCELLED: Cleanup

ASCII Diagram:

    ┌─────────┐
    │ PENDING │
    └────┬────┘
         │ start
         ▼
    ┌─────────┐        80% elapsed      ┌──────────────────┐
    │ RUNNING │───────────────────────►│ TIMEOUT_WARNING  │
    └────┬────┘                         └────────┬─────────┘
         │                                       │
         │ complete                              │ complete
         ▼                                       ▼
    ┌───────────┐◄──────────────────────────────┘
    │ COMPLETED │
    └───────────┘

    ┌─────────┐        timeout         ┌────────────┐
    │ RUNNING │───────────────────────►│ TIMED_OUT  │
    └─────────┘                         └─────┬──────┘
         │                                    │
         │ cancel                             │ cleanup
         ▼                                    ▼
    ┌───────────┐                        ┌───────────┐
    │ CANCELLED │◄───────────────────────┤ CANCELLED │
    └───────────┘                        └───────────┘
```

### ALGORITHM: ExecuteWithTimeout
**COMPLEXITY**:
- Time: O(1) for setup, O(n) for operation
- Space: O(1)

```
ALGORITHM: ExecuteWithTimeout
INPUT: operation, timeout, options
OUTPUT: result or error

CONSTANTS:
    DEFAULT_TIMEOUT = 30000 ms
    WARNING_THRESHOLD = 0.8

BEGIN
    timeout ← timeout OR DEFAULT_TIMEOUT
    startTime ← CurrentTimestamp()
    warningTriggered ← false
    timedOut ← false
    result ← null
    error ← null

    // Phase 1: Setup timeout timer
    timeoutTimer ← SetTimeout(FUNCTION()
        timedOut ← true

        IF options.onTimeout NOT null THEN
            options.onTimeout()
        END IF

        // Attempt to cancel operation
        IF operation.cancel NOT null THEN
            operation.cancel()
        END IF
    END FUNCTION, timeout)

    // Phase 2: Setup warning timer (80% of timeout)
    warningTime ← timeout * WARNING_THRESHOLD
    warningTimer ← SetTimeout(FUNCTION()
        warningTriggered ← true

        IF options.onWarning NOT null THEN
            elapsed ← CurrentTimestamp() - startTime
            remaining ← timeout - elapsed
            options.onWarning(elapsed, remaining)
        END IF
    END FUNCTION, warningTime)

    // Phase 3: Execute operation
    TRY
        result ← operation()

        // Clear timers on success
        ClearTimeout(timeoutTimer)
        ClearTimeout(warningTimer)

        executionTime ← CurrentTimestamp() - startTime

        RETURN {
            success: true,
            result: result,
            executionTime: executionTime,
            timedOut: false
        }

    CATCH operationError
        error ← operationError

        // Clear timers
        ClearTimeout(timeoutTimer)
        ClearTimeout(warningTimer)

    END TRY

    // Phase 4: Handle timeout or error
    executionTime ← CurrentTimestamp() - startTime

    IF timedOut THEN
        RETURN {
            success: false,
            error: Error("Operation timed out after " + timeout + "ms"),
            executionTime: executionTime,
            timedOut: true
        }
    ELSE
        RETURN {
            success: false,
            error: error,
            executionTime: executionTime,
            timedOut: false
        }
    END IF
END
```

---

## 3. Element Not Found Recovery

### DECISION TREE: Element Recovery Strategy

```
DECISION TREE: ElementRecoveryStrategy

Input: error, context, attemptNumber

                    ┌──────────────────────┐
                    │  Element Not Found   │
                    └──────────┬───────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
    ┌─────────┐          ┌──────────┐          ┌──────────┐
    │Dynamic  │          │ Timing   │          │ Selector │
    │Content? │          │ Issue?   │          │ Changed? │
    └────┬────┘          └────┬─────┘          └────┬─────┘
         │                    │                      │
    Yes  │  No           Yes  │  No             Yes  │  No
         ▼                    ▼                      ▼
    ┌─────────┐          ┌──────────┐          ┌──────────┐
    │Wait for │          │Increase  │          │ Try Alt  │
    │Network  │          │Timeout   │          │Selectors │
    │Idle     │          │          │          │          │
    └────┬────┘          └────┬─────┘          └────┬─────┘
         │                    │                      │
         │                    │                      │
         └────────────────────┴──────────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ Still Failed?│
                        └──────┬───────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                Yes │                     │ No
                    ▼                     ▼
            ┌───────────────┐      ┌──────────┐
            │Try Fuzzy Match│      │ Success  │
            │or AI Location │      │          │
            └───────┬───────┘      └──────────┘
                    │
                    ▼
            ┌───────────────┐
            │ Final Attempt │
            └───────┬───────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    Yes │                       │ No
        ▼                       ▼
  ┌──────────┐          ┌────────────┐
  │ Success  │          │Return Error│
  └──────────┘          └────────────┘
```

### ALGORITHM: RecoverFromElementNotFound
**COMPLEXITY**:
- Time: O(n * m) where n = recovery strategies, m = strategy time
- Space: O(1)

```
ALGORITHM: RecoverFromElementNotFound
INPUT: page, selector, originalOptions, error
OUTPUT: element or error

BEGIN
    recoveryAttempt ← 0
    maxRecoveryAttempts ← 5
    recoveryStrategies ← []

    // Phase 1: Analyze error context
    errorContext ← AnalyzeElementNotFoundError(page, selector, error)

    // Phase 2: Build recovery strategy chain
    IF errorContext.likelyDynamicContent THEN
        recoveryStrategies.append({
            name: "WaitForNetworkIdle",
            action: FUNCTION()
                page.waitForLoadState("networkidle", { timeout: 10000 })
                RETURN page.locator(selector)
            END FUNCTION
        })
    END IF

    IF errorContext.likelyTimingIssue THEN
        recoveryStrategies.append({
            name: "IncreasedTimeout",
            action: FUNCTION()
                RETURN page.locator(selector).waitFor({
                    state: "visible",
                    timeout: originalOptions.timeout * 2
                })
            END FUNCTION
        })
    END IF

    IF errorContext.possibleSelectorChange THEN
        recoveryStrategies.append({
            name: "AlternativeSelectors",
            action: FUNCTION()
                altSelectors ← GenerateAlternativeSelectors(selector)
                RETURN TryAlternativeSelectors(page, altSelectors)
            END FUNCTION
        })
    END IF

    // Always add fallback strategies
    recoveryStrategies.append({
        name: "FuzzyMatch",
        action: FUNCTION()
            RETURN FindElementByFuzzyMatch(page, selector, errorContext)
        END FUNCTION
    })

    recoveryStrategies.append({
        name: "AIVisionLocation",
        action: FUNCTION()
            RETURN LocateElementByAI(page, errorContext.expectedDescription)
        END FUNCTION
    })

    // Phase 3: Execute recovery strategies
    FOR EACH strategy IN recoveryStrategies DO
        recoveryAttempt ← recoveryAttempt + 1

        IF recoveryAttempt > maxRecoveryAttempts THEN
            BREAK
        END IF

        TRY
            Log("Attempting recovery strategy: " + strategy.name)

            element ← strategy.action()

            IF element NOT null THEN
                Log("Recovery successful using: " + strategy.name)
                RETURN {
                    element: element,
                    recoveryStrategy: strategy.name,
                    attempts: recoveryAttempt
                }
            END IF

        CATCH strategyError
            Log("Recovery strategy failed: " + strategy.name + " - " + strategyError.message)
            CONTINUE
        END TRY
    END FOR

    // Phase 4: All recovery attempts failed
    RETURN error("Element recovery failed after " + recoveryAttempt + " attempts. Original selector: " + selector)
END
```

### ALGORITHM: AnalyzeElementNotFoundError
**COMPLEXITY**:
- Time: O(1)
- Space: O(1)

```
ALGORITHM: AnalyzeElementNotFoundError
INPUT: page, selector, error
OUTPUT: errorContext (object)

BEGIN
    errorContext ← {
        likelyDynamicContent: false,
        likelyTimingIssue: false,
        possibleSelectorChange: false,
        expectedDescription: null,
        pageState: {}
    }

    // Phase 1: Check page state
    TRY
        errorContext.pageState ← {
            readyState: page.evaluate("document.readyState"),
            activeRequests: page.evaluate("performance.getEntriesByType('resource').length"),
            mutations: page.evaluate("typeof MutationObserver !== 'undefined'")
        }

        // Phase 2: Detect dynamic content
        IF errorContext.pageState.readyState NOT "complete" THEN
            errorContext.likelyDynamicContent ← true
        END IF

        IF errorContext.pageState.activeRequests > 0 THEN
            errorContext.likelyDynamicContent ← true
        END IF

        // Phase 3: Detect timing issues
        pageAge ← page.evaluate("Date.now() - performance.timing.loadEventEnd")

        IF pageAge < 1000 THEN
            errorContext.likelyTimingIssue ← true
        END IF

        // Phase 4: Check for selector changes
        // Try to find similar elements
        baseSelectorPattern ← ExtractBaseSelectorPattern(selector)
        similarElements ← page.locator(baseSelectorPattern).count()

        IF similarElements > 0 THEN
            errorContext.possibleSelectorChange ← true
        END IF

        // Phase 5: Generate expected description
        errorContext.expectedDescription ← GenerateElementDescription(selector)

    CATCH analysisError
        Log("Error analysis failed: " + analysisError.message)
    END TRY

    RETURN errorContext
END
```

---

## 4. Navigation Failure Handling

### ALGORITHM: RecoverFromNavigationFailure
**COMPLEXITY**:
- Time: O(n * m) where n = retry attempts, m = navigation time
- Space: O(1)

```
ALGORITHM: RecoverFromNavigationFailure
INPUT: page, url, navigationError, options
OUTPUT: success or error

CONSTANTS:
    MAX_NAVIGATION_RETRIES = 3
    NAVIGATION_RETRY_DELAY = 2000 ms

BEGIN
    errorType ← ClassifyNavigationError(navigationError)
    retryCount ← 0

    WHILE retryCount < MAX_NAVIGATION_RETRIES DO
        TRY
            Log("Navigation recovery attempt " + (retryCount + 1))

            // Phase 1: Apply error-specific recovery
            SWITCH errorType
                CASE "TIMEOUT":
                    // Increase timeout and try again
                    RecoverFromNavigationTimeout(page, url, options)

                CASE "NETWORK_ERROR":
                    // Wait and retry with connection check
                    RecoverFromNetworkError(page, url, options)

                CASE "DNS_ERROR":
                    // Try alternative DNS or wait
                    RecoverFromDNSError(page, url, options)

                CASE "SSL_ERROR":
                    // Handle certificate issues
                    RecoverFromSSLError(page, url, options)

                CASE "HTTP_ERROR":
                    // Handle HTTP status errors
                    RecoverFromHTTPError(page, url, navigationError, options)

                DEFAULT:
                    // Generic recovery
                    RecoverFromGenericNavigationError(page, url, options)
            END SWITCH

            // Phase 2: Verify recovery
            currentUrl ← page.url()

            IF currentUrl.contains(ExtractDomain(url)) THEN
                Log("Navigation recovery successful")
                RETURN success
            END IF

        CATCH recoveryError
            Log("Recovery attempt failed: " + recoveryError.message)
            retryCount ← retryCount + 1

            IF retryCount < MAX_NAVIGATION_RETRIES THEN
                Sleep(NAVIGATION_RETRY_DELAY * retryCount)
            END IF
        END TRY
    END WHILE

    // All recovery attempts failed
    RETURN error("Navigation recovery failed after " + MAX_NAVIGATION_RETRIES + " attempts")
END
```

### ALGORITHM: RecoverFromNavigationTimeout
**COMPLEXITY**:
- Time: O(n) where n = navigation time
- Space: O(1)

```
ALGORITHM: RecoverFromNavigationTimeout
INPUT: page, url, options
OUTPUT: success or error

BEGIN
    // Phase 1: Try with increased timeout
    increasedTimeout ← (options.timeout OR 30000) * 2

    TRY
        response ← page.goto(url, {
            timeout: increasedTimeout,
            waitUntil: "domcontentloaded" // Less strict wait condition
        })

        // Phase 2: Manually wait for critical content
        IF options.criticalSelector NOT null THEN
            page.waitForSelector(options.criticalSelector, {
                timeout: 10000
            })
        END IF

        RETURN success

    CATCH error
        // Phase 3: Try loading with networkidle disabled
        TRY
            page.goto(url, {
                timeout: increasedTimeout,
                waitUntil: "commit" // Most lenient
            })

            // Wait a bit for basic content
            Sleep(2000)

            RETURN success

        CATCH finalError
            RETURN error("Navigation timeout recovery failed: " + finalError.message)
        END TRY
    END TRY
END
```

---

## 5. Network Error Recovery

### ALGORITHM: RecoverFromNetworkError
**COMPLEXITY**:
- Time: O(n * m) where n = retry attempts, m = delay
- Space: O(1)

```
ALGORITHM: RecoverFromNetworkError
INPUT: page, url, options
OUTPUT: success or error

CONSTANTS:
    NETWORK_CHECK_TIMEOUT = 5000 ms
    CONNECTION_RETRY_DELAY = 3000 ms

BEGIN
    // Phase 1: Verify network connectivity
    hasConnection ← CheckNetworkConnection()

    IF NOT hasConnection THEN
        Log("No network connection detected, waiting...")

        // Wait for connection to be restored
        connectionRestored ← WaitForNetworkConnection(30000)

        IF NOT connectionRestored THEN
            RETURN error("Network connection unavailable")
        END IF
    END IF

    // Phase 2: Clear any network cache
    TRY
        page.context().clearCookies()
        page.evaluate("sessionStorage.clear(); localStorage.clear();")
    CATCH clearError
        Log("Cache clear failed: " + clearError.message)
    END TRY

    // Phase 3: Retry navigation with exponential backoff
    retryPolicy ← {
        maxRetries: 3,
        baseDelay: CONNECTION_RETRY_DELAY,
        backoffMultiplier: 2.0
    }

    result ← ExecuteWithRetry(
        FUNCTION() page.goto(url, options) END FUNCTION,
        retryPolicy,
        { beforeRetry: FUNCTION(attempt, error, delay)
            Log("Network retry " + attempt + " after " + delay + "ms")
        END FUNCTION }
    )

    IF result.success THEN
        RETURN success
    ELSE
        RETURN error(result.error)
    END IF
END
```

### ALGORITHM: CheckNetworkConnection
**COMPLEXITY**:
- Time: O(1)
- Space: O(1)

```
ALGORITHM: CheckNetworkConnection
INPUT: none
OUTPUT: hasConnection (boolean)

BEGIN
    TRY
        // Try to reach common DNS servers
        dnsServers ← ["8.8.8.8", "1.1.1.1"]

        FOR EACH dnsServer IN dnsServers DO
            TRY
                // Ping DNS server
                result ← ExecuteSystemCommand("ping -c 1 -W 2 " + dnsServer)

                IF result.exitCode = 0 THEN
                    RETURN true
                END IF
            CATCH pingError
                CONTINUE
            END TRY
        END FOR

        // Try HTTP request to reliable endpoint
        TRY
            response ← HttpGet("https://www.google.com/generate_204", {
                timeout: 5000
            })

            IF response.status = 204 THEN
                RETURN true
            END IF
        CATCH httpError
            // Continue to return false
        END TRY

        RETURN false

    CATCH error
        Log("Network check failed: " + error.message)
        RETURN false
    END TRY
END
```

---

## 6. Browser Crash Recovery

### STATE MACHINE: Browser Crash Recovery

```
STATE MACHINE: BrowserCrashRecovery

States:
    - RUNNING: Browser operating normally
    - CRASH_DETECTED: Crash detected
    - SAVING_STATE: Persisting current state
    - RESTARTING: Restarting browser
    - RESTORING_STATE: Restoring saved state
    - RECOVERED: Successfully recovered
    - FAILED: Recovery failed

Transitions:
    RUNNING → CRASH_DETECTED: Browser crash event
    CRASH_DETECTED → SAVING_STATE: Begin recovery
    SAVING_STATE → RESTARTING: State saved
    RESTARTING → RESTORING_STATE: Browser restarted
    RESTORING_STATE → RECOVERED: State restored
    RESTORING_STATE → FAILED: Restoration failed
    RESTARTING → FAILED: Restart failed

ASCII Diagram:

    ┌─────────┐
    │ RUNNING │
    └────┬────┘
         │ crash detected
         ▼
    ┌──────────────┐
    │CRASH_DETECTED│
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ SAVING_STATE │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ RESTARTING   │
    └──────┬───────┘
           │
           ├───────────────┐
           │               │
           ▼               ▼
    ┌──────────────┐  ┌────────┐
    │RESTORING_    │  │ FAILED │
    │STATE         │  └────────┘
    └──────┬───────┘
           │
           ├───────────┐
           │           │
           ▼           ▼
    ┌──────────┐  ┌────────┐
    │RECOVERED │  │ FAILED │
    └──────────┘  └────────┘
```

### ALGORITHM: RecoverFromBrowserCrash
**COMPLEXITY**:
- Time: O(n) where n = browser startup time
- Space: O(k) where k = saved state size

```
ALGORITHM: RecoverFromBrowserCrash
INPUT: browser, crashError, stateManager
OUTPUT: newBrowser or error

CONSTANTS:
    MAX_CRASH_RECOVERY_ATTEMPTS = 3
    CRASH_RECOVERY_DELAY = 5000 ms

BEGIN
    recoveryAttempt ← 0

    WHILE recoveryAttempt < MAX_CRASH_RECOVERY_ATTEMPTS DO
        TRY
            recoveryAttempt ← recoveryAttempt + 1
            Log("Browser crash recovery attempt " + recoveryAttempt)

            // Phase 1: Save current state (if browser still accessible)
            savedState ← null

            TRY
                IF browser.isConnected() THEN
                    savedState ← SaveBrowserState(browser, stateManager)
                ELSE
                    // Try to load last saved state
                    savedState ← stateManager.loadLastState()
                END IF
            CATCH stateError
                Log("Could not save state: " + stateError.message)
                savedState ← stateManager.loadLastState()
            END TRY

            // Phase 2: Close crashed browser
            TRY
                browser.close({ timeout: 5000 })
            CATCH closeError
                Log("Could not close crashed browser: " + closeError.message)
                // Force kill browser process
                KillBrowserProcess(browser)
            END TRY

            // Wait before restart
            Sleep(CRASH_RECOVERY_DELAY)

            // Phase 3: Create new browser instance
            browserType ← savedState.browserType OR "chromium"
            browserOptions ← savedState.options OR {}

            newBrowser ← CreateBrowserInstance(browserType, browserOptions, {})

            IF newBrowser IS error THEN
                THROW error("Failed to create new browser instance")
            END IF

            // Phase 4: Restore state
            IF savedState NOT null THEN
                TRY
                    RestoreBrowserState(newBrowser, savedState)

                    Log("Browser crash recovery successful")

                    RETURN {
                        browser: newBrowser,
                        stateRestored: true,
                        attempts: recoveryAttempt
                    }

                CATCH restoreError
                    Log("State restoration failed: " + restoreError.message)

                    // Continue with new browser without state
                    RETURN {
                        browser: newBrowser,
                        stateRestored: false,
                        attempts: recoveryAttempt
                    }
                END TRY
            ELSE
                RETURN {
                    browser: newBrowser,
                    stateRestored: false,
                    attempts: recoveryAttempt
                }
            END IF

        CATCH recoveryError
            Log("Recovery attempt " + recoveryAttempt + " failed: " + recoveryError.message)

            IF recoveryAttempt >= MAX_CRASH_RECOVERY_ATTEMPTS THEN
                RETURN error("Browser crash recovery failed after " + recoveryAttempt + " attempts")
            END IF

            Sleep(CRASH_RECOVERY_DELAY * recoveryAttempt)
        END TRY
    END WHILE

    RETURN error("Browser crash recovery failed")
END
```

### ALGORITHM: SaveBrowserState
**COMPLEXITY**:
- Time: O(n * m) where n = contexts, m = pages per context
- Space: O(n * m * k) where k = avg page state size

```
ALGORITHM: SaveBrowserState
INPUT: browser, stateManager
OUTPUT: savedState (object)

BEGIN
    savedState ← {
        timestamp: CurrentTimestamp(),
        browserType: browser.browserType().name(),
        options: browser.launchOptions,
        contexts: []
    }

    // Phase 1: Save all contexts
    contexts ← browser.contexts()

    FOR EACH context IN contexts DO
        contextState ← {
            options: context.options(),
            cookies: context.cookies(),
            storageState: context.storageState(),
            pages: []
        }

        // Phase 2: Save all pages in context
        pages ← context.pages()

        FOR EACH page IN pages DO
            TRY
                pageState ← {
                    url: page.url(),
                    title: page.title(),
                    viewport: page.viewportSize(),
                    scrollPosition: page.evaluate("() => ({ x: window.scrollX, y: window.scrollY })"),
                    localStorage: page.evaluate("() => Object.assign({}, localStorage)"),
                    sessionStorage: page.evaluate("() => Object.assign({}, sessionStorage)")
                }

                contextState.pages.append(pageState)

            CATCH pageError
                Log("Could not save page state: " + pageError.message)
            END TRY
        END FOR

        savedState.contexts.append(contextState)
    END FOR

    // Phase 3: Persist state
    stateId ← GenerateUUID()
    stateManager.save(stateId, savedState)

    RETURN savedState
END
```

### ALGORITHM: RestoreBrowserState
**COMPLEXITY**:
- Time: O(n * m) where n = contexts, m = pages per context
- Space: O(1)

```
ALGORITHM: RestoreBrowserState
INPUT: browser, savedState
OUTPUT: success or error

BEGIN
    // Phase 1: Restore contexts
    FOR EACH contextState IN savedState.contexts DO
        TRY
            // Create context with saved options
            context ← browser.newContext(contextState.options)

            // Restore storage state
            IF contextState.storageState NOT null THEN
                context.addCookies(contextState.cookies)
            END IF

            // Phase 2: Restore pages
            FOR EACH pageState IN contextState.pages DO
                TRY
                    page ← context.newPage()

                    // Navigate to saved URL
                    page.goto(pageState.url, {
                        waitUntil: "domcontentloaded",
                        timeout: 30000
                    })

                    // Restore viewport
                    IF pageState.viewport NOT null THEN
                        page.setViewportSize(pageState.viewport)
                    END IF

                    // Restore scroll position
                    IF pageState.scrollPosition NOT null THEN
                        page.evaluate("(pos) => window.scrollTo(pos.x, pos.y)",
                            pageState.scrollPosition)
                    END IF

                    // Restore storage
                    IF pageState.localStorage NOT null THEN
                        page.evaluate("(storage) => {
                            for (let key in storage) {
                                localStorage.setItem(key, storage[key]);
                            }
                        }", pageState.localStorage)
                    END IF

                    IF pageState.sessionStorage NOT null THEN
                        page.evaluate("(storage) => {
                            for (let key in storage) {
                                sessionStorage.setItem(key, storage[key]);
                            }
                        }", pageState.sessionStorage)
                    END IF

                CATCH pageRestoreError
                    Log("Could not restore page: " + pageRestoreError.message)
                END TRY
            END FOR

        CATCH contextRestoreError
            Log("Could not restore context: " + contextRestoreError.message)
        END TRY
    END FOR

    RETURN success
END
```

---

## 7. State Restoration After Errors

### ALGORITHM: CreateCheckpoint
**COMPLEXITY**:
- Time: O(1)
- Space: O(k) where k = state size

```
ALGORITHM: CreateCheckpoint
INPUT: page, checkpointName, options
OUTPUT: checkpoint (object)

BEGIN
    checkpoint ← {
        name: checkpointName,
        timestamp: CurrentTimestamp(),
        url: page.url(),
        state: {}
    }

    TRY
        // Phase 1: Capture page state
        checkpoint.state ← {
            title: page.title(),
            viewport: page.viewportSize(),
            scrollPosition: page.evaluate("() => ({ x: window.scrollX, y: window.scrollY })"),
            activeElement: page.evaluate("() => {
                const active = document.activeElement;
                return active ? active.outerHTML : null;
            }")
        }

        // Phase 2: Capture form data if requested
        IF options.captureFormData = true THEN
            checkpoint.state.formData ← page.evaluate("() => {
                const forms = Array.from(document.querySelectorAll('form'));
                return forms.map(form => {
                    const formData = new FormData(form);
                    const data = {};
                    for (let [key, value] of formData.entries()) {
                        data[key] = value;
                    }
                    return {
                        action: form.action,
                        method: form.method,
                        data: data
                    };
                });
            }")
        END IF

        // Phase 3: Capture custom state if provided
        IF options.customState NOT null THEN
            checkpoint.state.custom ← options.customState()
        END IF

        // Phase 4: Store checkpoint
        IF options.persist = true THEN
            CheckpointManager.save(checkpointName, checkpoint)
        END IF

        RETURN checkpoint

    CATCH error
        RETURN error("Checkpoint creation failed: " + error.message)
    END TRY
END
```

### ALGORITHM: RestoreToCheckpoint
**COMPLEXITY**:
- Time: O(n) where n = navigation time
- Space: O(1)

```
ALGORITHM: RestoreToCheckpoint
INPUT: page, checkpoint, options
OUTPUT: success or error

BEGIN
    TRY
        // Phase 1: Navigate to checkpoint URL
        IF page.url() NOT checkpoint.url THEN
            page.goto(checkpoint.url, {
                waitUntil: options.waitUntil OR "domcontentloaded",
                timeout: options.timeout OR 30000
            })
        END IF

        // Phase 2: Restore viewport
        IF checkpoint.state.viewport NOT null THEN
            page.setViewportSize(checkpoint.state.viewport)
        END IF

        // Phase 3: Restore scroll position
        IF checkpoint.state.scrollPosition NOT null THEN
            page.evaluate("(pos) => window.scrollTo(pos.x, pos.y)",
                checkpoint.state.scrollPosition)
        END IF

        // Phase 4: Restore form data
        IF checkpoint.state.formData NOT null THEN
            page.evaluate("(formsData) => {
                formsData.forEach((formData, index) => {
                    const form = document.querySelectorAll('form')[index];
                    if (form) {
                        for (let key in formData.data) {
                            const input = form.querySelector(`[name='${key}']`);
                            if (input) {
                                input.value = formData.data[key];
                            }
                        }
                    }
                });
            }", checkpoint.state.formData)
        END IF

        // Phase 5: Restore custom state
        IF checkpoint.state.custom NOT null AND options.restoreCustom NOT null THEN
            options.restoreCustom(checkpoint.state.custom)
        END IF

        Log("Restored to checkpoint: " + checkpoint.name)
        RETURN success

    CATCH error
        RETURN error("Checkpoint restoration failed: " + error.message)
    END TRY
END
```

---

## Complexity Summary

| Algorithm | Time Complexity | Space Complexity | Notes |
|-----------|----------------|------------------|-------|
| ExecuteWithRetry | O(n*m) | O(1) | n = retries, m = operation time |
| CalculateRetryDelay | O(1) | O(1) | Constant time calculation |
| ShouldRetryError | O(n) | O(1) | n = error type checks |
| ExecuteWithTimeout | O(n) | O(1) | n = operation time |
| RecoverFromElementNotFound | O(n*m) | O(1) | n = strategies, m = strategy time |
| RecoverFromNavigationFailure | O(n*m) | O(1) | n = retries, m = navigation time |
| RecoverFromNetworkError | O(n*m) | O(1) | n = retries, m = delay |
| RecoverFromBrowserCrash | O(n) | O(k) | n = startup time, k = state size |
| SaveBrowserState | O(n*m) | O(n*m*k) | n = contexts, m = pages, k = state size |
| RestoreBrowserState | O(n*m) | O(1) | n = contexts, m = pages |
| CreateCheckpoint | O(1) | O(k) | k = state size |
| RestoreToCheckpoint | O(n) | O(1) | n = navigation time |

---

## Edge Cases

### Retry Logic
1. **Non-retryable errors**: Fail fast for auth/validation errors
2. **Infinite loops**: Enforce maximum retry limits
3. **Thundering herd**: Add jitter to prevent synchronized retries
4. **Resource exhaustion**: Check resource availability before retry
5. **State corruption**: Validate state before retry

### Timeout Handling
1. **Very short timeouts**: Enforce minimum timeout values
2. **Timeout during cleanup**: Handle timeout in error handlers
3. **Multiple concurrent timeouts**: Properly manage timer cleanup
4. **Clock drift**: Use monotonic time for timeout calculation
5. **Timeout warnings**: Notify before timeout occurs

### Element Recovery
1. **Permanently removed elements**: Detect and fail appropriately
2. **Shadow DOM changes**: Handle shadow root navigation
3. **Dynamic IDs**: Use alternative stable selectors
4. **Multiple similar elements**: Use additional context for disambiguation
5. **Stale element references**: Re-locate after recovery

### Browser Crashes
1. **Corrupted state**: Validate state before restoration
2. **Missing state**: Handle gracefully with fresh start
3. **Rapid repeated crashes**: Implement circuit breaker
4. **Memory leaks**: Monitor and limit state size
5. **Process zombies**: Clean up orphaned processes

### State Restoration
1. **URL changes**: Detect and handle redirects
2. **Session expiration**: Re-authenticate before restore
3. **Modified forms**: Validate form structure before restore
4. **Missing elements**: Skip non-critical element restoration
5. **State conflicts**: Resolve conflicts with merge strategies

---

## Production Considerations

1. **Observability**: Log all errors, retries, and recoveries with context
2. **Metrics**: Track error rates, recovery success rates, retry counts
3. **Alerting**: Set up alerts for high error rates or failed recoveries
4. **Circuit breakers**: Implement to prevent cascade failures
5. **Graceful degradation**: Continue with reduced functionality when possible
6. **Error budgets**: Monitor and enforce acceptable error rates
7. **Post-mortems**: Analyze patterns in failures to improve recovery
