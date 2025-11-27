# SPARC Pseudocode: Element Interaction

## Overview
This document defines algorithmic designs for element interaction operations including location strategies, click actions, text input, form handling, and drag-and-drop operations in Playwright automation.

---

## 1. Element Location Strategies

### DECISION TREE: Element Location Strategy Selection

```
DECISION TREE: SelectLocationStrategy

Input: elementInfo, context, priority

                    ┌─────────────────────┐
                    │ Element Info Type?  │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
    ┌────────┐          ┌──────────┐          ┌──────────┐
    │Has ID? │          │Has Role? │          │Has Text? │
    └───┬────┘          └────┬─────┘          └────┬─────┘
        │                    │                      │
    Yes │ No                 │ Yes                  │ Yes
        ▼    ▼               ▼                      ▼
    Use ID  ┌────┐      Use getByRole         Use getByText
            │    │           │                      │
            ▼    │           │                      │
      ┌──────────┐           │                      │
      │Has Class?│           │                      │
      └────┬─────┘           │                      │
           │                 │                      │
       Yes │ No              │                      │
           ▼    ▼            │                      │
      Use Class │            │                      │
                ▼            │                      │
          ┌──────────┐       │                      │
          │Has Label?│       │                      │
          └────┬─────┘       │                      │
               │             │                      │
           Yes │ No          │                      │
               ▼    ▼        │                      │
         Use getByLabel      │                      │
                    ▼        │                      │
              ┌──────────┐   │                      │
              │Has Test  │   │                      │
              │ID Attr?  │   │                      │
              └────┬─────┘   │                      │
                   │         │                      │
               Yes │ No      │                      │
                   ▼    ▼    │                      │
           Use getByTestId   │                      │
                        ▼    │                      │
                  ┌─────────┐│                      │
                  │Use CSS/ ││                      │
                  │XPath    ││                      │
                  └─────────┘│                      │
                             │                      │
        └────────────────────┴──────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Validate & Rank │
                    │  by Priority    │
                    └─────────────────┘

Priority Ranking:
1. TestID (most stable)
2. Role + Accessible Name (semantic)
3. ID (unique but may change)
4. Label (form-specific)
5. Text Content (brittle but readable)
6. CSS Selector (flexible but fragile)
7. XPath (most powerful but complex)
8. AI Vision (fallback for complex UI)
```

### DATA STRUCTURE: LocatorStrategy

```
DATA STRUCTURE: LocatorStrategy

Type: Strategy Pattern Implementation

Structure:
    strategies: Map<strategyName, LocatorFunction>
    priorityOrder: Array<strategyName>

StrategyTypes:
    - testId: page.getByTestId(value)
    - role: page.getByRole(role, { name: name })
    - id: page.locator('#' + value)
    - label: page.getByLabel(value)
    - text: page.getByText(value)
    - placeholder: page.getByPlaceholder(value)
    - css: page.locator(selector)
    - xpath: page.locator('xpath=' + expression)
    - ai: page.getByAI(description) // Custom AI vision

Operations:
    - locate(page, identifier): O(1) for direct, O(n) for fallback chain
    - validateLocator(locator): O(1)
    - rankStrategies(context): O(n log n)
```

### ALGORITHM: LocateElement
**COMPLEXITY**:
- Time: O(n) where n = number of strategy attempts
- Space: O(1)

```
ALGORITHM: LocateElement
INPUT: page, identifier, options
OUTPUT: element or error

CONSTANTS:
    DEFAULT_TIMEOUT = 10000 ms
    MAX_RETRIES = 3
    STRATEGY_TIMEOUT = 5000 ms

BEGIN
    // Phase 1: Determine strategy
    strategy ← DetermineStrategy(identifier)
    timeout ← options.timeout OR DEFAULT_TIMEOUT
    strict ← options.strict OR true

    // Phase 2: Build locator based on strategy
    locator ← null

    SWITCH strategy
        CASE "testId":
            locator ← page.getByTestId(identifier.value)

        CASE "role":
            locator ← page.getByRole(identifier.role, {
                name: identifier.name,
                exact: identifier.exact OR false
            })

        CASE "id":
            locator ← page.locator('#' + identifier.value)

        CASE "label":
            locator ← page.getByLabel(identifier.value, {
                exact: identifier.exact OR false
            })

        CASE "text":
            locator ← page.getByText(identifier.value, {
                exact: identifier.exact OR false
            })

        CASE "placeholder":
            locator ← page.getByPlaceholder(identifier.value)

        CASE "css":
            locator ← page.locator(identifier.selector)

        CASE "xpath":
            locator ← page.locator('xpath=' + identifier.expression)

        CASE "ai":
            locator ← LocateByAI(page, identifier.description)

        DEFAULT:
            RETURN error("Unknown strategy: " + strategy)
    END SWITCH

    // Phase 3: Validate locator
    TRY
        // Wait for element to be present
        element ← locator.first()
        element.waitFor({
            state: "attached",
            timeout: timeout
        })

        // Check strictness (single element)
        IF strict = true THEN
            count ← locator.count()

            IF count = 0 THEN
                RETURN error("Element not found: " + identifier)
            ELSE IF count > 1 THEN
                RETURN error("Multiple elements found (" + count + "), expected single element")
            END IF
        END IF

        // Phase 4: Return validated locator
        RETURN element

    CATCH error
        // Try fallback strategies
        IF options.fallback = true THEN
            RETURN LocateWithFallback(page, identifier, options)
        ELSE
            RETURN error("Failed to locate element: " + error.message)
        END IF
    END TRY
END
```

### ALGORITHM: LocateWithFallback
**COMPLEXITY**:
- Time: O(n * m) where n = strategies, m = timeout per strategy
- Space: O(1)

```
ALGORITHM: LocateWithFallback
INPUT: page, identifier, options
OUTPUT: element or error

BEGIN
    // Define fallback strategy chain
    strategies ← [
        "testId",
        "role",
        "label",
        "text",
        "css",
        "xpath"
    ]

    errors ← []

    // Try each strategy
    FOR EACH strategy IN strategies DO
        TRY
            // Adjust identifier for strategy
            adjustedId ← AdaptIdentifierForStrategy(identifier, strategy)

            // Attempt location with reduced timeout
            result ← LocateElement(page, adjustedId, {
                timeout: STRATEGY_TIMEOUT,
                strict: false,
                fallback: false
            })

            IF result IS NOT error THEN
                Log("Located element using fallback strategy: " + strategy)
                RETURN result
            END IF

        CATCH error
            errors.append({
                strategy: strategy,
                error: error.message
            })
        END TRY
    END FOR

    // All strategies failed
    RETURN error("All location strategies failed: " + JSON.stringify(errors))
END
```

---

## 2. Click Actions with Retry Logic

### STATE MACHINE: Click Operation

```
STATE MACHINE: ClickOperation

States:
    - IDLE: No operation
    - LOCATING: Finding element
    - SCROLLING: Scrolling element into view
    - WAITING_VISIBLE: Waiting for visibility
    - WAITING_ENABLED: Waiting for enabled state
    - CLICKING: Performing click
    - VERIFYING: Verifying click effect
    - SUCCESS: Click successful
    - RETRY: Retrying click
    - FAILED: Click failed

Transitions:
    IDLE → LOCATING: Start click operation
    LOCATING → SCROLLING: Element found
    SCROLLING → WAITING_VISIBLE: Scrolled into view
    WAITING_VISIBLE → WAITING_ENABLED: Element visible
    WAITING_ENABLED → CLICKING: Element enabled
    CLICKING → VERIFYING: Click performed
    VERIFYING → SUCCESS: Verification passed
    VERIFYING → RETRY: Verification failed, retries remain
    RETRY → LOCATING: Retry attempt
    RETRY → FAILED: Max retries exceeded

ASCII Diagram:

    ┌──────┐
    │ IDLE │
    └──┬───┘
       │ start
       ▼
    ┌──────────┐
    │ LOCATING │
    └────┬─────┘
         │ element found
         ▼
    ┌───────────┐
    │ SCROLLING │
    └─────┬─────┘
          │
          ▼
    ┌─────────────────┐
    │ WAITING_VISIBLE │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ WAITING_ENABLED │
    └────────┬────────┘
             │
             ▼
    ┌──────────┐
    │ CLICKING │
    └────┬─────┘
         │
         ▼
    ┌───────────┐
    │ VERIFYING │
    └─────┬─────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
 ┌─────────┐  ┌───────┐
 │ SUCCESS │  │ RETRY │──┐
 └─────────┘  └───┬───┘  │
                  │      │
                  ▼      │
              ┌────────┐ │
              │ FAILED │◄┘
              └────────┘
```

### ALGORITHM: ClickElement
**COMPLEXITY**:
- Time: O(n) where n = retry attempts
- Space: O(1)

```
ALGORITHM: ClickElement
INPUT: page, element, options
OUTPUT: success or error

CONSTANTS:
    DEFAULT_TIMEOUT = 10000 ms
    MAX_RETRIES = 3
    RETRY_DELAY = 1000 ms
    CLICK_TYPES = ["left", "right", "middle", "double"]

BEGIN
    // Phase 1: Validate inputs
    clickType ← options.button OR "left"
    timeout ← options.timeout OR DEFAULT_TIMEOUT
    force ← options.force OR false

    IF clickType NOT IN CLICK_TYPES THEN
        RETURN error("Invalid click type: " + clickType)
    END IF

    retryCount ← 0
    startTime ← CurrentTimestamp()

    WHILE retryCount <= MAX_RETRIES DO
        TRY
            // Phase 2: Ensure element is ready
            IF NOT force THEN
                // Scroll into view if needed
                IF options.scrollIntoView = true THEN
                    element.scrollIntoViewIfNeeded({ timeout: 5000 })
                END IF

                // Wait for element to be visible
                element.waitFor({
                    state: "visible",
                    timeout: timeout
                })

                // Wait for element to be enabled
                isEnabled ← element.isEnabled()
                IF NOT isEnabled THEN
                    RETURN error("Element is disabled")
                END IF

                // Check for overlapping elements
                IF options.checkOverlap = true THEN
                    isClickable ← VerifyElementClickable(element)
                    IF NOT isClickable THEN
                        RETURN error("Element is obscured by another element")
                    END IF
                END IF
            END IF

            // Phase 3: Perform click based on type
            clickOptions ← {
                button: clickType,
                timeout: timeout,
                force: force,
                delay: options.delay OR 0,
                modifiers: options.modifiers OR [],
                position: options.position OR null
            }

            IF clickType = "double" THEN
                element.dblclick(clickOptions)
            ELSE
                element.click(clickOptions)
            END IF

            // Phase 4: Verify click effect (if verification provided)
            IF options.verify NOT null THEN
                verifyResult ← options.verify()

                IF verifyResult = false THEN
                    THROW error("Click verification failed")
                END IF
            END IF

            // Phase 5: Wait for any navigation/state change
            IF options.waitForNavigation = true THEN
                page.waitForLoadState("networkidle", {
                    timeout: 5000
                })
            END IF

            RETURN success({
                element: element,
                clickType: clickType,
                retries: retryCount,
                duration: CurrentTimestamp() - startTime
            })

        CATCH error
            retryCount ← retryCount + 1

            IF retryCount > MAX_RETRIES THEN
                RETURN error("Click failed after " + MAX_RETRIES + " retries: " + error.message)
            END IF

            Log("Click attempt " + retryCount + " failed, retrying...")

            // Exponential backoff
            Sleep(RETRY_DELAY * (2 ^ (retryCount - 1)))
        END TRY
    END WHILE
END
```

### ALGORITHM: VerifyElementClickable
**COMPLEXITY**:
- Time: O(1)
- Space: O(1)

```
ALGORITHM: VerifyElementClickable
INPUT: element
OUTPUT: isClickable (boolean)

BEGIN
    // Get element bounding box
    box ← element.boundingBox()

    IF box = null THEN
        RETURN false
    END IF

    // Calculate center point
    centerX ← box.x + (box.width / 2)
    centerY ← box.y + (box.height / 2)

    // Get element at center point
    elementAtPoint ← element.page().evaluate("(x, y) => {
        return document.elementFromPoint(x, y);
    }", centerX, centerY)

    // Check if target element or descendant
    isTargetElement ← element.evaluate("(el, pointEl) => {
        return el === pointEl || el.contains(pointEl);
    }", elementAtPoint)

    RETURN isTargetElement
END
```

---

## 3. Type Action with Options

### ALGORITHM: TypeIntoElement
**COMPLEXITY**:
- Time: O(n) where n = length of text
- Space: O(1)

```
ALGORITHM: TypeIntoElement
INPUT: page, element, text, options
OUTPUT: success or error

CONSTANTS:
    DEFAULT_DELAY = 50 ms
    DEFAULT_TIMEOUT = 10000 ms

BEGIN
    // Phase 1: Validate inputs
    IF text = null THEN
        RETURN error("Text cannot be null")
    END IF

    timeout ← options.timeout OR DEFAULT_TIMEOUT
    delay ← options.delay OR DEFAULT_DELAY

    // Phase 2: Prepare element
    TRY
        // Wait for element to be visible and enabled
        element.waitFor({ state: "visible", timeout: timeout })

        isEditable ← element.isEditable()
        IF NOT isEditable THEN
            RETURN error("Element is not editable")
        END IF

        // Phase 3: Clear existing value if requested
        IF options.clear = true THEN
            currentValue ← element.inputValue()

            IF currentValue NOT "" THEN
                // Select all and delete
                element.click()
                element.press("Control+A")
                element.press("Backspace")

                // Verify cleared
                newValue ← element.inputValue()
                IF newValue NOT "" THEN
                    // Fallback: use fill with empty string
                    element.fill("")
                END IF
            END IF
        END IF

        // Phase 4: Type text
        IF options.typing = "human" THEN
            // Simulate human typing with random delays
            TypeLikeHuman(element, text, delay)
        ELSE IF options.typing = "instant" THEN
            // Fast typing, no delays
            element.fill(text)
        ELSE
            // Default: type with consistent delay
            element.type(text, { delay: delay })
        END IF

        // Phase 5: Verify input
        IF options.verify = true THEN
            finalValue ← element.inputValue()

            IF finalValue NOT text THEN
                RETURN error("Typed text verification failed. Expected: " + text + ", Got: " + finalValue)
            END IF
        END IF

        // Phase 6: Trigger events if needed
        IF options.triggerChange = true THEN
            element.dispatchEvent("change")
            element.dispatchEvent("input")
        END IF

        // Phase 7: Press additional key if specified
        IF options.pressKey NOT null THEN
            element.press(options.pressKey)
        END IF

        RETURN success({
            text: text,
            length: text.length,
            element: element
        })

    CATCH error
        RETURN error("Failed to type into element: " + error.message)
    END TRY
END
```

### ALGORITHM: TypeLikeHuman
**COMPLEXITY**:
- Time: O(n) where n = text length
- Space: O(1)

```
ALGORITHM: TypeLikeHuman
INPUT: element, text, baseDelay
OUTPUT: success

CONSTANTS:
    MIN_DELAY = 30 ms
    MAX_DELAY = 150 ms
    MISTAKE_PROBABILITY = 0.05
    THINK_PROBABILITY = 0.10

BEGIN
    textArray ← text.split("")
    i ← 0

    WHILE i < textArray.length DO
        char ← textArray[i]

        // Random typing delay (simulate thinking)
        IF Random() < THINK_PROBABILITY THEN
            thinkDelay ← Random(200, 500)
            Sleep(thinkDelay)
        END IF

        // Random typing mistakes
        IF Random() < MISTAKE_PROBABILITY THEN
            // Type wrong character
            wrongChar ← GetRandomCharacter()
            element.type(wrongChar, { delay: Random(MIN_DELAY, MAX_DELAY) })

            // Realize mistake and delete
            Sleep(Random(100, 300))
            element.press("Backspace", { delay: Random(MIN_DELAY, MAX_DELAY) })
            Sleep(Random(50, 150))
        END IF

        // Type correct character
        charDelay ← Random(MIN_DELAY, MAX_DELAY)
        element.type(char, { delay: charDelay })

        i ← i + 1
    END WHILE

    RETURN success
END
```

---

## 4. Select Dropdown Handling

### ALGORITHM: SelectDropdownOption
**COMPLEXITY**:
- Time: O(n) where n = number of options
- Space: O(1)

```
ALGORITHM: SelectDropdownOption
INPUT: element, value, options
OUTPUT: success or error

BEGIN
    // Phase 1: Validate element is select
    tagName ← element.evaluate("el => el.tagName")

    IF tagName NOT "SELECT" THEN
        RETURN error("Element is not a select dropdown")
    END IF

    // Phase 2: Determine selection strategy
    strategy ← options.by OR "value"

    TRY
        selectedOptions ← null

        SWITCH strategy
            CASE "value":
                selectedOptions ← element.selectOption({ value: value })

            CASE "label":
                selectedOptions ← element.selectOption({ label: value })

            CASE "index":
                selectedOptions ← element.selectOption({ index: value })

            DEFAULT:
                RETURN error("Invalid selection strategy: " + strategy)
        END SWITCH

        // Phase 3: Verify selection
        IF options.verify = true THEN
            currentValue ← element.inputValue()

            IF strategy = "value" AND currentValue NOT value THEN
                RETURN error("Selection verification failed")
            END IF
        END IF

        // Phase 4: Trigger change event
        IF options.triggerChange = true THEN
            element.dispatchEvent("change")
        END IF

        RETURN success({
            selected: selectedOptions,
            strategy: strategy
        })

    CATCH error
        RETURN error("Failed to select option: " + error.message)
    END TRY
END
```

---

## 5. Checkbox and Radio Button Handling

### ALGORITHM: ToggleCheckbox
**COMPLEXITY**:
- Time: O(1)
- Space: O(1)

```
ALGORITHM: ToggleCheckbox
INPUT: element, targetState, options
OUTPUT: success or error

BEGIN
    // Phase 1: Verify element type
    inputType ← element.getAttribute("type")

    IF inputType NOT "checkbox" THEN
        RETURN error("Element is not a checkbox")
    END IF

    // Phase 2: Get current state
    currentState ← element.isChecked()

    // Phase 3: Toggle if needed
    IF targetState = null THEN
        // Toggle current state
        element.click()
        newState ← NOT currentState
    ELSE
        // Set to specific state
        IF currentState NOT targetState THEN
            element.click()
            newState ← targetState
        ELSE
            newState ← currentState
        END IF
    END IF

    // Phase 4: Verify state
    IF options.verify = true THEN
        finalState ← element.isChecked()

        IF finalState NOT newState THEN
            RETURN error("Checkbox state verification failed")
        END IF
    END IF

    RETURN success({
        previousState: currentState,
        newState: newState
    })
END
```

### ALGORITHM: SelectRadioButton
**COMPLEXITY**:
- Time: O(n) where n = radio buttons in group
- Space: O(1)

```
ALGORITHM: SelectRadioButton
INPUT: page, groupName, value, options
OUTPUT: success or error

BEGIN
    // Phase 1: Find all radio buttons in group
    radioButtons ← page.locator(`input[type="radio"][name="${groupName}"]`)
    count ← radioButtons.count()

    IF count = 0 THEN
        RETURN error("No radio buttons found for group: " + groupName)
    END IF

    // Phase 2: Find target radio button
    targetRadio ← null

    FOR i FROM 0 TO count - 1 DO
        radio ← radioButtons.nth(i)
        radioValue ← radio.getAttribute("value")

        IF radioValue = value THEN
            targetRadio ← radio
            BREAK
        END IF
    END FOR

    IF targetRadio = null THEN
        RETURN error("Radio button not found with value: " + value)
    END IF

    // Phase 3: Click if not already selected
    isChecked ← targetRadio.isChecked()

    IF NOT isChecked THEN
        targetRadio.click()
    END IF

    // Phase 4: Verify selection
    IF options.verify = true THEN
        finalState ← targetRadio.isChecked()

        IF NOT finalState THEN
            RETURN error("Radio button selection failed")
        END IF

        // Verify others in group are not selected
        FOR i FROM 0 TO count - 1 DO
            radio ← radioButtons.nth(i)
            radioValue ← radio.getAttribute("value")

            IF radioValue NOT value THEN
                isOtherChecked ← radio.isChecked()
                IF isOtherChecked THEN
                    RETURN error("Multiple radio buttons selected in group")
                END IF
            END IF
        END FOR
    END IF

    RETURN success({
        groupName: groupName,
        value: value,
        wasAlreadySelected: isChecked
    })
END
```

---

## 6. Drag and Drop Operations

### ALGORITHM: DragAndDrop
**COMPLEXITY**:
- Time: O(1) for operation, O(n) for animation wait
- Space: O(1)

```
ALGORITHM: DragAndDrop
INPUT: page, sourceElement, targetElement, options
OUTPUT: success or error

BEGIN
    // Phase 1: Validate elements are draggable/droppable
    sourceDraggable ← sourceElement.getAttribute("draggable")

    IF sourceDraggable = "false" THEN
        IF NOT options.force THEN
            RETURN error("Source element is not draggable")
        END IF
    END IF

    // Phase 2: Get element positions
    sourceBbox ← sourceElement.boundingBox()
    targetBbox ← targetElement.boundingBox()

    IF sourceBbox = null OR targetBbox = null THEN
        RETURN error("Could not get element positions")
    END IF

    // Calculate center points
    sourceX ← sourceBbox.x + (sourceBbox.width / 2)
    sourceY ← sourceBbox.y + (sourceBbox.height / 2)
    targetX ← targetBbox.x + (targetBbox.width / 2)
    targetY ← targetBbox.y + (targetBbox.height / 2)

    // Phase 3: Perform drag and drop
    TRY
        IF options.method = "dataTransfer" THEN
            // Use HTML5 drag and drop API
            sourceElement.dispatchEvent("dragstart")
            targetElement.dispatchEvent("drop")
            sourceElement.dispatchEvent("dragend")

        ELSE IF options.method = "mouse" THEN
            // Use mouse events
            page.mouse.move(sourceX, sourceY)
            page.mouse.down()

            // Smooth movement if requested
            IF options.smooth = true THEN
                steps ← options.steps OR 10

                FOR i FROM 1 TO steps DO
                    progress ← i / steps
                    currentX ← sourceX + ((targetX - sourceX) * progress)
                    currentY ← sourceY + ((targetY - sourceY) * progress)

                    page.mouse.move(currentX, currentY)
                    Sleep(options.stepDelay OR 50)
                END FOR
            ELSE
                page.mouse.move(targetX, targetY)
            END IF

            page.mouse.up()

        ELSE
            // Use Playwright's built-in drag and drop
            sourceElement.dragTo(targetElement, {
                force: options.force OR false,
                timeout: options.timeout OR 10000
            })
        END IF

        // Phase 4: Wait for animation/transition
        IF options.waitForAnimation = true THEN
            Sleep(options.animationDuration OR 500)
        END IF

        // Phase 5: Verify drop
        IF options.verify NOT null THEN
            verifyResult ← options.verify()

            IF NOT verifyResult THEN
                RETURN error("Drag and drop verification failed")
            END IF
        END IF

        RETURN success({
            source: sourceElement,
            target: targetElement,
            method: options.method OR "default"
        })

    CATCH error
        RETURN error("Drag and drop failed: " + error.message)
    END TRY
END
```

---

## 7. Hover and Focus Actions

### ALGORITHM: HoverElement
**COMPLEXITY**:
- Time: O(1)
- Space: O(1)

```
ALGORITHM: HoverElement
INPUT: element, options
OUTPUT: success or error

BEGIN
    TRY
        // Phase 1: Scroll into view if needed
        IF options.scrollIntoView = true THEN
            element.scrollIntoViewIfNeeded()
        END IF

        // Phase 2: Wait for element to be visible
        element.waitFor({ state: "visible", timeout: options.timeout OR 10000 })

        // Phase 3: Perform hover
        element.hover({
            force: options.force OR false,
            timeout: options.timeout OR 10000,
            position: options.position OR null,
            modifiers: options.modifiers OR []
        })

        // Phase 4: Wait for hover effects
        IF options.waitForEffects = true THEN
            Sleep(options.effectDuration OR 300)
        END IF

        // Phase 5: Verify hover state
        IF options.verify NOT null THEN
            verifyResult ← options.verify()

            IF NOT verifyResult THEN
                RETURN error("Hover verification failed")
            END IF
        END IF

        RETURN success

    CATCH error
        RETURN error("Hover failed: " + error.message)
    END TRY
END
```

---

## 8. File Upload Handling

### ALGORITHM: UploadFile
**COMPLEXITY**:
- Time: O(1) for setting, O(n) for file size during upload
- Space: O(n) where n = file size

```
ALGORITHM: UploadFile
INPUT: element, filePath, options
OUTPUT: success or error

BEGIN
    // Phase 1: Validate file exists
    IF NOT FileExists(filePath) THEN
        RETURN error("File not found: " + filePath)
    END IF

    // Phase 2: Validate element is file input
    inputType ← element.getAttribute("type")

    IF inputType NOT "file" THEN
        RETURN error("Element is not a file input")
    END IF

    // Phase 3: Check multiple files support
    multiple ← element.getAttribute("multiple")
    isArray ← filePath IS Array

    IF isArray AND NOT multiple THEN
        RETURN error("Element does not support multiple files")
    END IF

    // Phase 4: Set files
    TRY
        element.setInputFiles(filePath, {
            timeout: options.timeout OR 10000
        })

        // Phase 5: Verify upload
        IF options.verify = true THEN
            files ← element.evaluate("el => {
                return el.files ? Array.from(el.files).map(f => f.name) : [];
            }")

            expectedFiles ← isArray ? filePath : [filePath]

            FOR EACH expected IN expectedFiles DO
                fileName ← GetFileName(expected)
                IF NOT files.contains(fileName) THEN
                    RETURN error("File upload verification failed for: " + fileName)
                END IF
            END FOR
        END IF

        // Phase 6: Trigger change event
        IF options.triggerChange = true THEN
            element.dispatchEvent("change")
        END IF

        RETURN success({
            files: filePath,
            count: isArray ? filePath.length : 1
        })

    CATCH error
        RETURN error("File upload failed: " + error.message)
    END TRY
END
```

---

## Complexity Summary

| Algorithm | Time Complexity | Space Complexity | Notes |
|-----------|----------------|------------------|-------|
| LocateElement | O(n) | O(1) | n = strategy attempts |
| LocateWithFallback | O(n*m) | O(1) | n = strategies, m = timeout |
| ClickElement | O(n) | O(1) | n = retry attempts |
| VerifyElementClickable | O(1) | O(1) | Constant checks |
| TypeIntoElement | O(n) | O(1) | n = text length |
| TypeLikeHuman | O(n) | O(1) | n = text length |
| SelectDropdownOption | O(n) | O(1) | n = options count |
| ToggleCheckbox | O(1) | O(1) | Single operation |
| SelectRadioButton | O(n) | O(1) | n = radio buttons in group |
| DragAndDrop | O(n) | O(1) | n = animation steps |
| HoverElement | O(1) | O(1) | Single operation |
| UploadFile | O(n) | O(n) | n = file size |

---

## Edge Cases

### Element Location
1. **Multiple matches**: Use strict mode or index specification
2. **Dynamic elements**: Wait with appropriate timeout
3. **Shadow DOM**: Use piercing selectors
4. **iframes**: Navigate to frame first
5. **Hidden elements**: Handle visibility requirements

### Click Operations
1. **Obscured elements**: Detect overlapping elements
2. **Moving targets**: Wait for stable position
3. **Disabled state**: Check and handle appropriately
4. **Event bubbling**: Account for event propagation
5. **Double-click detection**: Use explicit dblclick()

### Text Input
1. **Maxlength restriction**: Respect input limits
2. **Input masks**: Handle formatted inputs
3. **Auto-complete**: Deal with suggestion popups
4. **IME input**: Support international keyboards
5. **Paste restrictions**: Try both type and fill methods

### File Upload
1. **Size limits**: Validate file size before upload
2. **Type restrictions**: Check accept attribute
3. **Multiple files**: Handle array of paths
4. **Network delays**: Account for upload time
5. **Failed uploads**: Implement retry logic

---

## Production Considerations

1. **Accessibility**: Prefer semantic locators (role, label)
2. **Stability**: Use test IDs for critical elements
3. **Performance**: Minimize unnecessary waits
4. **Reliability**: Implement comprehensive retry logic
5. **Maintainability**: Document locator strategies
6. **Cross-browser**: Test interactions across browsers
