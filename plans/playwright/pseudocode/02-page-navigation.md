# SPARC Pseudocode: Page Navigation

## Overview
This document defines algorithmic designs for page navigation operations including URL navigation, wait strategies, history management, and multi-window/frame handling in Playwright automation.

---

## 1. URL Navigation with Validation

### ALGORITHM: NavigateToURL
**INPUT**:
- page (Page object)
- url (string)
- options (object): Navigation options

**OUTPUT**: response (Response object) or error

**COMPLEXITY**:
- Time: O(n) where n = network latency + page load time
- Space: O(1)

```
ALGORITHM: NavigateToURL
INPUT: page, url, options
OUTPUT: response or error

CONSTANTS:
    DEFAULT_TIMEOUT = 30000 ms
    MAX_REDIRECTS = 10
    VALID_PROTOCOLS = ["http:", "https:", "file:", "data:"]

BEGIN
    // Phase 1: URL Validation
    IF url = null OR url = "" THEN
        RETURN error("URL cannot be empty")
    END IF

    parsedUrl ← ParseURL(url)

    IF parsedUrl IS error THEN
        RETURN error("Invalid URL format: " + url)
    END IF

    IF parsedUrl.protocol NOT IN VALID_PROTOCOLS THEN
        RETURN error("Unsupported protocol: " + parsedUrl.protocol)
    END IF

    // Phase 2: Build navigation options
    navOptions ← {
        timeout: options.timeout OR DEFAULT_TIMEOUT,
        waitUntil: options.waitUntil OR "load",
        referer: options.referer OR null
    }

    // Phase 3: Setup navigation tracking
    redirectCount ← 0
    navigationStartTime ← CurrentTimestamp()

    // Setup redirect listener
    page.on("response", FUNCTION(response)
        IF response.status() >= 300 AND response.status() < 400 THEN
            redirectCount ← redirectCount + 1

            IF redirectCount > MAX_REDIRECTS THEN
                THROW error("Too many redirects: " + redirectCount)
            END IF
        END IF
    END FUNCTION)

    // Phase 4: Execute navigation with retry
    TRY
        response ← page.goto(url, navOptions)

        // Phase 5: Validate response
        IF response = null THEN
            RETURN error("Navigation failed: no response")
        END IF

        status ← response.status()

        // Check for error status codes
        IF status >= 400 THEN
            IF status = 404 THEN
                RETURN error("Page not found (404): " + url)
            ELSE IF status >= 500 THEN
                RETURN error("Server error (" + status + "): " + url)
            ELSE
                RETURN error("HTTP error (" + status + "): " + url)
            END IF
        END IF

        // Phase 6: Verify page loaded successfully
        navigationEndTime ← CurrentTimestamp()
        loadTime ← navigationEndTime - navigationStartTime

        navigationResult ← {
            response: response,
            url: page.url(),
            finalUrl: response.url(),
            status: status,
            redirectCount: redirectCount,
            loadTime: loadTime,
            timing: {
                start: navigationStartTime,
                end: navigationEndTime,
                duration: loadTime
            }
        }

        RETURN navigationResult

    CATCH error
        IF error.message.contains("Timeout") THEN
            RETURN error("Navigation timeout exceeded " + navOptions.timeout + "ms")
        ELSE IF error.message.contains("net::ERR") THEN
            RETURN error("Network error: " + error.message)
        ELSE
            RETURN error("Navigation failed: " + error.message)
        END IF
    END TRY
END
```

---

## 2. Wait Strategies

### DECISION TREE: WaitUntil Strategy Selection

```
DECISION TREE: SelectWaitStrategy

Input: pageType, contentType, priority

                ┌─────────────────┐
                │   Page Type?    │
                └────────┬─────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌───────┐      ┌─────────┐     ┌──────────┐
    │  SPA  │      │   MPA   │     │  Static  │
    └───┬───┘      └────┬────┘     └────┬─────┘
        │               │                │
        │               │                │
        ▼               ▼                ▼
  networkidle     domcontentloaded     load
        │               │                │
        │               ▼                │
        │         Has AJAX?              │
        │          │      │              │
        │          ▼      ▼              │
        │         Yes     No             │
        │          │      │              │
        │          ▼      └──────┐       │
        │    networkidle    load │       │
        │                        │       │
        └────────────────────────┴───────┘
                         │
                         ▼
                ┌────────────────┐
                │ Wait Strategy  │
                └────────────────┘

Strategy Selection Rules:
1. SPA (Single Page App) → networkidle
2. MPA with AJAX → networkidle
3. MPA without AJAX → domcontentloaded or load
4. Static pages → load
5. Time-sensitive → domcontentloaded (fastest)
6. Content-critical → networkidle (most complete)
```

### ALGORITHM: WaitForLoadState
**COMPLEXITY**:
- Time: O(n) where n = wait time until condition met
- Space: O(1)

```
ALGORITHM: WaitForLoadState
INPUT: page, state, timeout
OUTPUT: success or error

CONSTANTS:
    VALID_STATES = ["load", "domcontentloaded", "networkidle"]
    DEFAULT_TIMEOUT = 30000 ms
    NETWORK_IDLE_DURATION = 500 ms
    MAX_NETWORK_IDLE_CONNECTIONS = 2

BEGIN
    // Phase 1: Validate state
    IF state NOT IN VALID_STATES THEN
        RETURN error("Invalid wait state: " + state)
    END IF

    waitTimeout ← timeout OR DEFAULT_TIMEOUT
    startTime ← CurrentTimestamp()

    // Phase 2: State-specific waiting logic
    SWITCH state
        CASE "load":
            RETURN WaitForLoadEvent(page, waitTimeout)

        CASE "domcontentloaded":
            RETURN WaitForDOMContentLoaded(page, waitTimeout)

        CASE "networkidle":
            RETURN WaitForNetworkIdle(page, waitTimeout)
    END SWITCH
END

SUBROUTINE: WaitForLoadEvent
INPUT: page, timeout
OUTPUT: success or error

BEGIN
    startTime ← CurrentTimestamp()
    loadEventFired ← false

    // Setup event listener
    page.on("load", FUNCTION()
        loadEventFired ← true
    END FUNCTION)

    // Wait for event or timeout
    WHILE NOT loadEventFired DO
        elapsed ← CurrentTimestamp() - startTime

        IF elapsed > timeout THEN
            RETURN error("Timeout waiting for 'load' event")
        END IF

        Sleep(50) // Poll every 50ms
    END WHILE

    RETURN success
END

SUBROUTINE: WaitForDOMContentLoaded
INPUT: page, timeout
OUTPUT: success or error

BEGIN
    startTime ← CurrentTimestamp()
    domContentLoadedFired ← false

    page.on("domcontentloaded", FUNCTION()
        domContentLoadedFired ← true
    END FUNCTION)

    WHILE NOT domContentLoadedFired DO
        elapsed ← CurrentTimestamp() - startTime

        IF elapsed > timeout THEN
            RETURN error("Timeout waiting for 'domcontentloaded' event")
        END IF

        Sleep(50)
    END WHILE

    RETURN success
END

SUBROUTINE: WaitForNetworkIdle
INPUT: page, timeout
OUTPUT: success or error

BEGIN
    startTime ← CurrentTimestamp()
    activeConnections ← 0
    lastConnectionChange ← CurrentTimestamp()

    // Track network activity
    page.on("request", FUNCTION(request)
        activeConnections ← activeConnections + 1
        lastConnectionChange ← CurrentTimestamp()
    END FUNCTION)

    page.on("response", FUNCTION(response)
        activeConnections ← activeConnections - 1
        lastConnectionChange ← CurrentTimestamp()
    END FUNCTION)

    page.on("requestfailed", FUNCTION(request)
        activeConnections ← activeConnections - 1
        lastConnectionChange ← CurrentTimestamp()
    END FUNCTION)

    // Wait for network to be idle
    WHILE true DO
        elapsed ← CurrentTimestamp() - startTime
        idleDuration ← CurrentTimestamp() - lastConnectionChange

        IF elapsed > timeout THEN
            RETURN error("Timeout waiting for network idle")
        END IF

        // Network is idle if:
        // 1. No more than 2 connections active
        // 2. No connection changes for 500ms
        IF activeConnections <= MAX_NETWORK_IDLE_CONNECTIONS AND
           idleDuration >= NETWORK_IDLE_DURATION THEN
            RETURN success
        END IF

        Sleep(100)
    END WHILE
END
```

### ALGORITHM: WaitForSelector
**COMPLEXITY**:
- Time: O(n) where n = time until element appears
- Space: O(1)

```
ALGORITHM: WaitForSelector
INPUT: page, selector, options
OUTPUT: element or error

CONSTANTS:
    DEFAULT_TIMEOUT = 30000 ms
    DEFAULT_STATE = "visible"
    VALID_STATES = ["attached", "detached", "visible", "hidden"]
    POLL_INTERVAL = 100 ms

BEGIN
    // Phase 1: Validate inputs
    IF selector = null OR selector = "" THEN
        RETURN error("Selector cannot be empty")
    END IF

    state ← options.state OR DEFAULT_STATE
    timeout ← options.timeout OR DEFAULT_TIMEOUT

    IF state NOT IN VALID_STATES THEN
        RETURN error("Invalid state: " + state)
    END IF

    // Phase 2: Setup waiting logic
    startTime ← CurrentTimestamp()

    WHILE true DO
        elapsed ← CurrentTimestamp() - startTime

        IF elapsed > timeout THEN
            RETURN error("Timeout waiting for selector: " + selector)
        END IF

        // Try to find element
        TRY
            element ← page.locator(selector).first()

            // Check state condition
            SWITCH state
                CASE "attached":
                    count ← element.count()
                    IF count > 0 THEN
                        RETURN element
                    END IF

                CASE "detached":
                    count ← element.count()
                    IF count = 0 THEN
                        RETURN success
                    END IF

                CASE "visible":
                    IF element.isVisible() THEN
                        RETURN element
                    END IF

                CASE "hidden":
                    count ← element.count()
                    IF count = 0 OR NOT element.isVisible() THEN
                        RETURN success
                    END IF
            END SWITCH

        CATCH error
            // Element not found yet, continue waiting
        END TRY

        Sleep(POLL_INTERVAL)
    END WHILE
END
```

---

## 3. History Navigation

### STATE MACHINE: Browser History

```
STATE MACHINE: BrowserHistory

States:
    - INITIAL: Fresh page, no history
    - NAVIGATED: At least one navigation
    - CAN_GO_BACK: History exists before current
    - CAN_GO_FORWARD: History exists after current
    - HISTORY_END: At end of history

Operations:
    - navigate(url): Move to new URL
    - back(): Go to previous entry
    - forward(): Go to next entry
    - reload(): Reload current page

ASCII Diagram:

    ┌─────────┐
    │ INITIAL │
    └────┬────┘
         │ navigate(url)
         ▼
    ┌───────────┐
    │ NAVIGATED │
    └────┬──────┘
         │ navigate(url2)
         ▼
    ┌──────────────┐      back()      ┌──────────────┐
    │CAN_GO_BACK   │◄─────────────────┤CAN_GO_FORWARD│
    │CAN_GO_FORWARD│──────────────────►│CAN_GO_BACK   │
    └──────────────┘    forward()      └──────────────┘
         │                                     │
         │ back() until start                  │
         ▼                                     │
    ┌──────────────┐                          │
    │CAN_GO_FORWARD│◄─────────────────────────┘
    │(start)       │      forward() until end
    └──────────────┘
         │
         │ forward() until end
         ▼
    ┌──────────────┐
    │CAN_GO_BACK   │
    │(end)         │
    └──────────────┘
```

### ALGORITHM: NavigateHistory
**COMPLEXITY**:
- Time: O(1) for history navigation, O(n) for page load
- Space: O(1)

```
ALGORITHM: NavigateHistory
INPUT: page, direction, options
OUTPUT: response or error

CONSTANTS:
    VALID_DIRECTIONS = ["back", "forward"]
    DEFAULT_TIMEOUT = 30000 ms

BEGIN
    // Phase 1: Validate direction
    IF direction NOT IN VALID_DIRECTIONS THEN
        RETURN error("Invalid direction: " + direction)
    END IF

    timeout ← options.timeout OR DEFAULT_TIMEOUT
    waitUntil ← options.waitUntil OR "load"

    // Phase 2: Check if navigation possible
    TRY
        canNavigate ← false

        IF direction = "back" THEN
            // Check if we can go back
            canNavigate ← page.evaluate("window.history.length > 1")
        ELSE IF direction = "forward" THEN
            // No direct check for forward, attempt navigation
            canNavigate ← true
        END IF

        IF NOT canNavigate THEN
            RETURN error("Cannot navigate " + direction + ": no history")
        END IF

        // Phase 3: Record current state
        currentUrl ← page.url()
        navigationStartTime ← CurrentTimestamp()

        // Phase 4: Execute navigation
        response ← null

        IF direction = "back" THEN
            response ← page.goBack({ timeout: timeout, waitUntil: waitUntil })
        ELSE IF direction = "forward" THEN
            response ← page.goForward({ timeout: timeout, waitUntil: waitUntil })
        END IF

        // Phase 5: Validate navigation occurred
        newUrl ← page.url()

        IF newUrl = currentUrl THEN
            RETURN error("Navigation " + direction + " did not change URL")
        END IF

        navigationEndTime ← CurrentTimestamp()

        RETURN {
            response: response,
            previousUrl: currentUrl,
            currentUrl: newUrl,
            direction: direction,
            loadTime: navigationEndTime - navigationStartTime
        }

    CATCH error
        IF error.message.contains("Timeout") THEN
            RETURN error("History navigation timeout")
        ELSE
            RETURN error("History navigation failed: " + error.message)
        END IF
    END TRY
END
```

---

## 4. Tab/Window Management

### ALGORITHM: OpenNewTab
**COMPLEXITY**:
- Time: O(1) for context creation, O(n) for page load
- Space: O(1)

```
ALGORITHM: OpenNewTab
INPUT: context, url, options
OUTPUT: newPage or error

BEGIN
    // Phase 1: Create new page
    TRY
        newPage ← context.newPage()

        // Phase 2: Configure page
        IF options.viewport NOT null THEN
            newPage.setViewportSize(options.viewport)
        END IF

        IF options.userAgent NOT null THEN
            newPage.setExtraHTTPHeaders({
                "User-Agent": options.userAgent
            })
        END IF

        // Phase 3: Navigate if URL provided
        IF url NOT null AND url NOT "" THEN
            navResult ← NavigateToURL(newPage, url, options)

            IF navResult IS error THEN
                // Close page on navigation failure
                newPage.close()
                RETURN navResult
            END IF
        END IF

        // Phase 4: Register page
        pageId ← GenerateUUID()
        PageRegistry.set(pageId, {
            page: newPage,
            contextId: context.id,
            createdAt: CurrentTimestamp(),
            url: newPage.url()
        })

        RETURN newPage

    CATCH error
        RETURN error("Failed to create new tab: " + error.message)
    END TRY
END
```

### ALGORITHM: SwitchToTab
**COMPLEXITY**:
- Time: O(n) where n = number of pages
- Space: O(1)

```
ALGORITHM: SwitchToTab
INPUT: context, identifier
OUTPUT: page or error

BEGIN
    pages ← context.pages()

    // Phase 1: Identify target page
    targetPage ← null

    // Try matching by index
    IF identifier IS integer THEN
        IF identifier >= 0 AND identifier < pages.length THEN
            targetPage ← pages[identifier]
        ELSE
            RETURN error("Invalid page index: " + identifier)
        END IF

    // Try matching by URL pattern
    ELSE IF identifier IS string THEN
        FOR EACH page IN pages DO
            IF page.url().contains(identifier) THEN
                targetPage ← page
                BREAK
            END IF
        END FOR

        IF targetPage = null THEN
            RETURN error("No page found matching: " + identifier)
        END IF

    // Try matching by title pattern
    ELSE IF identifier.type = "title" THEN
        FOR EACH page IN pages DO
            title ← page.title()
            IF title.contains(identifier.value) THEN
                targetPage ← page
                BREAK
            END IF
        END FOR

        IF targetPage = null THEN
            RETURN error("No page found with title: " + identifier.value)
        END IF
    END IF

    // Phase 2: Bring page to front
    TRY
        targetPage.bringToFront()
        RETURN targetPage

    CATCH error
        RETURN error("Failed to switch to tab: " + error.message)
    END TRY
END
```

### ALGORITHM: CloseTab
**COMPLEXITY**:
- Time: O(1)
- Space: O(1)

```
ALGORITHM: CloseTab
INPUT: page, options
OUTPUT: success or error

BEGIN
    // Phase 1: Handle unsaved changes
    IF options.checkUnsaved = true THEN
        hasUnsavedChanges ← page.evaluate("() => {
            return document.querySelector('form') !== null ||
                   document.querySelector('[contenteditable]') !== null;
        }")

        IF hasUnsavedChanges AND NOT options.force THEN
            RETURN error("Page has unsaved changes. Use force=true to close anyway.")
        END IF
    END IF

    // Phase 2: Execute beforeunload handlers if needed
    IF options.runBeforeUnload = true THEN
        TRY
            page.evaluate("window.dispatchEvent(new Event('beforeunload'))")
        CATCH error
            // Ignore beforeunload errors
        END TRY
    END IF

    // Phase 3: Close page
    TRY
        pageUrl ← page.url()
        page.close({ timeout: options.timeout OR 5000 })

        // Phase 4: Cleanup registry
        PageRegistry.deleteByPage(page)

        RETURN success("Closed page: " + pageUrl)

    CATCH error
        RETURN error("Failed to close tab: " + error.message)
    END TRY
END
```

---

## 5. Frame Navigation

### ALGORITHM: NavigateToFrame
**COMPLEXITY**:
- Time: O(n) where n = number of frames
- Space: O(1)

```
ALGORITHM: NavigateToFrame
INPUT: page, frameIdentifier
OUTPUT: frame or error

BEGIN
    frames ← page.frames()
    targetFrame ← null

    // Phase 1: Identify frame
    IF frameIdentifier IS integer THEN
        // By index
        IF frameIdentifier >= 0 AND frameIdentifier < frames.length THEN
            targetFrame ← frames[frameIdentifier]
        ELSE
            RETURN error("Invalid frame index: " + frameIdentifier)
        END IF

    ELSE IF frameIdentifier IS string THEN
        // Try by name first
        FOR EACH frame IN frames DO
            IF frame.name() = frameIdentifier THEN
                targetFrame ← frame
                BREAK
            END IF
        END FOR

        // Try by URL pattern if not found by name
        IF targetFrame = null THEN
            FOR EACH frame IN frames DO
                IF frame.url().contains(frameIdentifier) THEN
                    targetFrame ← frame
                    BREAK
                END IF
            END FOR
        END IF

        IF targetFrame = null THEN
            RETURN error("Frame not found: " + frameIdentifier)
        END IF

    ELSE IF frameIdentifier.type = "selector" THEN
        // By frame element selector
        TRY
            frameElement ← page.locator(frameIdentifier.value)
            targetFrame ← frameElement.contentFrame()

            IF targetFrame = null THEN
                RETURN error("No frame found for selector: " + frameIdentifier.value)
            END IF

        CATCH error
            RETURN error("Failed to locate frame: " + error.message)
        END TRY
    END IF

    // Phase 2: Verify frame is attached
    IF NOT targetFrame.isDetached() THEN
        RETURN targetFrame
    ELSE
        RETURN error("Frame is detached")
    END IF
END
```

### ALGORITHM: WaitForFrameLoad
**COMPLEXITY**:
- Time: O(n) where n = wait time
- Space: O(1)

```
ALGORITHM: WaitForFrameLoad
INPUT: frame, timeout
OUTPUT: success or error

CONSTANTS:
    DEFAULT_TIMEOUT = 30000 ms
    POLL_INTERVAL = 100 ms

BEGIN
    waitTimeout ← timeout OR DEFAULT_TIMEOUT
    startTime ← CurrentTimestamp()

    WHILE true DO
        elapsed ← CurrentTimestamp() - startTime

        IF elapsed > waitTimeout THEN
            RETURN error("Frame load timeout")
        END IF

        // Check if frame is loaded
        TRY
            isLoaded ← frame.evaluate("() => {
                return document.readyState === 'complete';
            }")

            IF isLoaded THEN
                RETURN success
            END IF

        CATCH error
            // Frame may not be ready yet
        END TRY

        Sleep(POLL_INTERVAL)
    END WHILE
END
```

---

## 6. Popup Handling

### ALGORITHM: HandlePopup
**COMPLEXITY**:
- Time: O(1) for listener setup, O(n) for wait time
- Space: O(1)

```
ALGORITHM: HandlePopup
INPUT: page, options
OUTPUT: popup or error

CONSTANTS:
    DEFAULT_TIMEOUT = 30000 ms

BEGIN
    waitTimeout ← options.timeout OR DEFAULT_TIMEOUT
    startTime ← CurrentTimestamp()
    popupPage ← null
    popupReceived ← false

    // Phase 1: Setup popup listener
    page.on("popup", FUNCTION(popup)
        popupPage ← popup
        popupReceived ← true
    END FUNCTION)

    // Phase 2: Trigger action that opens popup
    IF options.triggerAction NOT null THEN
        TRY
            options.triggerAction()
        CATCH error
            RETURN error("Failed to trigger popup: " + error.message)
        END TRY
    END IF

    // Phase 3: Wait for popup
    WHILE NOT popupReceived DO
        elapsed ← CurrentTimestamp() - startTime

        IF elapsed > waitTimeout THEN
            RETURN error("Popup did not appear within timeout")
        END IF

        Sleep(100)
    END WHILE

    // Phase 4: Wait for popup to load
    IF options.waitForLoad = true THEN
        TRY
            popupPage.waitForLoadState(options.waitUntil OR "load", {
                timeout: waitTimeout - (CurrentTimestamp() - startTime)
            })
        CATCH error
            RETURN error("Popup load failed: " + error.message)
        END TRY
    END IF

    RETURN popupPage
END
```

---

## Complexity Summary

| Algorithm | Time Complexity | Space Complexity | Notes |
|-----------|----------------|------------------|-------|
| NavigateToURL | O(n) | O(1) | n = network latency + load time |
| WaitForLoadState | O(n) | O(1) | n = wait duration |
| WaitForSelector | O(n) | O(1) | n = time until element appears |
| NavigateHistory | O(n) | O(1) | n = page load time |
| OpenNewTab | O(n) | O(1) | n = page load time |
| SwitchToTab | O(n) | O(1) | n = number of pages |
| CloseTab | O(1) | O(1) | Constant time operation |
| NavigateToFrame | O(n) | O(1) | n = number of frames |
| WaitForFrameLoad | O(n) | O(1) | n = wait duration |
| HandlePopup | O(n) | O(1) | n = wait time for popup |

---

## Edge Cases

### URL Navigation
1. **Invalid URL**: Validate before navigation, return clear error
2. **Redirect loops**: Track redirect count, enforce maximum
3. **Mixed content**: Handle HTTPS → HTTP warnings
4. **Slow networks**: Implement timeout with retry
5. **DNS failures**: Distinguish network vs DNS errors

### Wait Strategies
1. **Infinite loading**: Enforce timeout with clear messaging
2. **Dynamic content**: Use networkidle for SPA applications
3. **Failed resources**: Don't block on non-critical resource failures
4. **Multiple wait conditions**: Support chaining wait strategies
5. **Race conditions**: Handle concurrent navigation during wait

### History Navigation
1. **Empty history**: Check before attempting navigation
2. **History cleared**: Handle programmatic history manipulation
3. **Cross-origin navigation**: Respect same-origin policy
4. **History state**: Preserve state objects during navigation
5. **Anchor navigation**: Distinguish from full page navigation

### Tab Management
1. **Tab limit reached**: Handle browser tab limits gracefully
2. **Orphaned tabs**: Track and cleanup unused tabs
3. **Tab crash**: Detect and handle crashed tabs
4. **Focus issues**: Ensure correct tab receives focus
5. **Multi-window**: Handle windows vs tabs correctly

### Frame Navigation
1. **Nested frames**: Support recursive frame navigation
2. **Cross-origin frames**: Handle security restrictions
3. **Detached frames**: Detect and handle frame removal
4. **Frame timing**: Wait for frame to be fully loaded
5. **Frame communication**: Handle postMessage correctly

### Popup Handling
1. **Blocked popups**: Detect browser popup blocking
2. **Multiple popups**: Handle concurrent popup opening
3. **Popup closed**: Handle early popup closure
4. **Popup redirect**: Track popup navigation
5. **Popup authentication**: Handle auth dialogs in popups

---

## Production Considerations

1. **Performance**: Minimize wait times, use appropriate wait strategies
2. **Reliability**: Implement retry logic for transient failures
3. **Observability**: Log navigation events, timing, errors
4. **Security**: Validate URLs, handle CORS, CSP headers
5. **Resource cleanup**: Close unused tabs/frames promptly
6. **Error recovery**: Graceful degradation on navigation failures
