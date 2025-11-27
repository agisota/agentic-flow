# SPARC Pseudocode: Data Extraction

## Overview
This document defines algorithmic designs for data extraction operations including text content, attributes, table data, screenshots, PDF generation, DOM serialization, and structured data parsing in Playwright automation.

---

## 1. Text Content Extraction

### ALGORITHM: ExtractTextContent
**INPUT**:
- element (Element or Locator)
- options (object): Extraction options

**OUTPUT**: text (string) or error

**COMPLEXITY**:
- Time: O(n) where n = DOM tree depth
- Space: O(n) where n = text content size

```
ALGORITHM: ExtractTextContent
INPUT: element, options
OUTPUT: text or error

CONSTANTS:
    DEFAULT_TIMEOUT = 10000 ms
    TEXT_MODES = ["innerText", "textContent", "innerHTML"]

BEGIN
    // Phase 1: Validate inputs
    mode ← options.mode OR "innerText"
    timeout ← options.timeout OR DEFAULT_TIMEOUT

    IF mode NOT IN TEXT_MODES THEN
        RETURN error("Invalid text extraction mode: " + mode)
    END IF

    // Phase 2: Wait for element
    TRY
        element.waitFor({
            state: "attached",
            timeout: timeout
        })

        // Phase 3: Extract text based on mode
        text ← null

        SWITCH mode
            CASE "innerText":
                // Returns visible text (respects CSS)
                text ← element.innerText()

            CASE "textContent":
                // Returns all text including hidden
                text ← element.textContent()

            CASE "innerHTML":
                // Returns HTML content
                text ← element.innerHTML()
        END SWITCH

        // Phase 4: Post-processing
        IF options.trim = true THEN
            text ← text.trim()
        END IF

        IF options.normalizeWhitespace = true THEN
            // Replace multiple whitespace with single space
            text ← text.replace(/\s+/g, " ")
        END IF

        IF options.removeEmpty = true THEN
            // Remove empty lines
            lines ← text.split("\n")
            nonEmptyLines ← []

            FOR EACH line IN lines DO
                IF line.trim() NOT "" THEN
                    nonEmptyLines.append(line)
                END IF
            END FOR

            text ← nonEmptyLines.join("\n")
        END IF

        // Phase 5: Validate extracted text
        IF text = null OR text = "" THEN
            IF options.allowEmpty = false THEN
                RETURN error("No text content found")
            END IF
        END IF

        RETURN text

    CATCH error
        RETURN error("Text extraction failed: " + error.message)
    END TRY
END
```

### ALGORITHM: ExtractMultipleTexts
**COMPLEXITY**:
- Time: O(n * m) where n = elements, m = avg depth
- Space: O(n * k) where k = avg text size

```
ALGORITHM: ExtractMultipleTexts
INPUT: page, selector, options
OUTPUT: texts (array) or error

BEGIN
    // Phase 1: Locate all matching elements
    TRY
        elements ← page.locator(selector)
        count ← elements.count()

        IF count = 0 THEN
            IF options.allowEmpty = false THEN
                RETURN error("No elements found for selector: " + selector)
            ELSE
                RETURN []
            END IF
        END IF

        // Phase 2: Extract text from each element
        texts ← []

        FOR i FROM 0 TO count - 1 DO
            element ← elements.nth(i)

            TRY
                text ← ExtractTextContent(element, options)

                // Filter based on criteria
                IF options.filter NOT null THEN
                    IF options.filter(text) = true THEN
                        texts.append(text)
                    END IF
                ELSE
                    texts.append(text)
                END IF

            CATCH error
                IF options.skipErrors = true THEN
                    Log("Failed to extract text from element " + i + ": " + error.message)
                    CONTINUE
                ELSE
                    THROW error
                END IF
            END TRY
        END FOR

        // Phase 3: Post-process collection
        IF options.unique = true THEN
            texts ← RemoveDuplicates(texts)
        END IF

        IF options.sort = true THEN
            texts ← Sort(texts)
        END IF

        RETURN texts

    CATCH error
        RETURN error("Multiple text extraction failed: " + error.message)
    END TRY
END
```

---

## 2. Attribute Extraction

### ALGORITHM: ExtractAttribute
**COMPLEXITY**:
- Time: O(1)
- Space: O(k) where k = attribute value size

```
ALGORITHM: ExtractAttribute
INPUT: element, attributeName, options
OUTPUT: attributeValue or error

BEGIN
    // Phase 1: Validate inputs
    IF attributeName = null OR attributeName = "" THEN
        RETURN error("Attribute name cannot be empty")
    END IF

    TRY
        // Phase 2: Wait for element
        element.waitFor({
            state: "attached",
            timeout: options.timeout OR 10000
        })

        // Phase 3: Get attribute value
        value ← element.getAttribute(attributeName)

        // Phase 4: Handle missing attribute
        IF value = null THEN
            IF options.default NOT null THEN
                RETURN options.default
            ELSE IF options.required = true THEN
                RETURN error("Required attribute not found: " + attributeName)
            ELSE
                RETURN null
            END IF
        END IF

        // Phase 5: Type conversion
        IF options.type NOT null THEN
            SWITCH options.type
                CASE "number":
                    value ← ParseFloat(value)
                    IF IsNaN(value) THEN
                        RETURN error("Attribute value is not a number")
                    END IF

                CASE "boolean":
                    value ← (value = "true" OR value = "1" OR value = attributeName)

                CASE "json":
                    value ← JSON.parse(value)
            END SWITCH
        END IF

        RETURN value

    CATCH error
        RETURN error("Attribute extraction failed: " + error.message)
    END TRY
END
```

### ALGORITHM: ExtractAllAttributes
**COMPLEXITY**:
- Time: O(n) where n = number of attributes
- Space: O(n * k) where k = avg attribute value size

```
ALGORITHM: ExtractAllAttributes
INPUT: element, options
OUTPUT: attributes (object) or error

BEGIN
    TRY
        // Phase 1: Get all attributes
        attributes ← element.evaluate("el => {
            const attrs = {};
            for (let i = 0; i < el.attributes.length; i++) {
                const attr = el.attributes[i];
                attrs[attr.name] = attr.value;
            }
            return attrs;
        }")

        // Phase 2: Filter attributes
        IF options.filter NOT null THEN
            filteredAttrs ← {}

            FOR EACH key IN attributes.keys() DO
                IF options.filter(key, attributes[key]) = true THEN
                    filteredAttrs[key] ← attributes[key]
                END IF
            END FOR

            attributes ← filteredAttrs
        END IF

        // Phase 3: Include computed properties
        IF options.includeComputed = true THEN
            computed ← element.evaluate("el => {
                const style = window.getComputedStyle(el);
                return {
                    display: style.display,
                    visibility: style.visibility,
                    opacity: style.opacity,
                    position: style.position
                };
            }")

            attributes.computed ← computed
        END IF

        RETURN attributes

    CATCH error
        RETURN error("All attributes extraction failed: " + error.message)
    END TRY
END
```

---

## 3. Table Data Extraction

### DATA STRUCTURE: TableData

```
DATA STRUCTURE: TableData

Structure:
    headers: Array<string>
    rows: Array<Array<string>>
    metadata: {
        rowCount: integer
        columnCount: integer
        hasHeader: boolean
        caption: string
    }

Operations:
    - toJSON(): O(n*m) where n = rows, m = columns
    - toCSV(): O(n*m)
    - getColumn(index): O(n)
    - getRow(index): O(1)
    - filter(predicate): O(n)
```

### ALGORITHM: ExtractTableData
**COMPLEXITY**:
- Time: O(n * m) where n = rows, m = columns
- Space: O(n * m)

```
ALGORITHM: ExtractTableData
INPUT: tableElement, options
OUTPUT: tableData or error

BEGIN
    // Phase 1: Validate table element
    tagName ← tableElement.evaluate("el => el.tagName")

    IF tagName NOT "TABLE" THEN
        RETURN error("Element is not a table")
    END IF

    TRY
        tableData ← {
            headers: [],
            rows: [],
            metadata: {}
        }

        // Phase 2: Extract caption
        caption ← tableElement.locator("caption").textContent()
        tableData.metadata.caption ← caption OR null

        // Phase 3: Extract headers
        headerRows ← tableElement.locator("thead tr")
        headerRowCount ← headerRows.count()

        IF headerRowCount > 0 THEN
            headerRow ← headerRows.first()
            headerCells ← headerRow.locator("th, td")
            headerCount ← headerCells.count()

            FOR i FROM 0 TO headerCount - 1 DO
                cell ← headerCells.nth(i)
                headerText ← cell.innerText()

                // Handle colspan
                colspan ← cell.getAttribute("colspan")
                colspanValue ← colspan ? ParseInt(colspan) : 1

                FOR j FROM 0 TO colspanValue - 1 DO
                    tableData.headers.append(headerText)
                END FOR
            END FOR

            tableData.metadata.hasHeader ← true
        ELSE
            // No headers, use column indices
            tableData.metadata.hasHeader ← false
        END IF

        // Phase 4: Extract body rows
        bodyRows ← tableElement.locator("tbody tr, tr")
        bodyRowCount ← bodyRows.count()

        // Skip header rows if they're not in thead
        startIndex ← headerRowCount > 0 ? headerRowCount : 0

        FOR i FROM startIndex TO bodyRowCount - 1 DO
            row ← bodyRows.nth(i)
            cells ← row.locator("td, th")
            cellCount ← cells.count()

            rowData ← []

            FOR j FROM 0 TO cellCount - 1 DO
                cell ← cells.nth(j)

                // Extract cell data based on options
                IF options.mode = "html" THEN
                    cellData ← cell.innerHTML()
                ELSE
                    cellData ← cell.innerText()
                END IF

                // Handle rowspan and colspan
                colspan ← cell.getAttribute("colspan")
                colspanValue ← colspan ? ParseInt(colspan) : 1

                FOR k FROM 0 TO colspanValue - 1 DO
                    rowData.append(cellData)
                END FOR
            END FOR

            tableData.rows.append(rowData)
        END FOR

        // Phase 5: Add metadata
        tableData.metadata.rowCount ← tableData.rows.length
        tableData.metadata.columnCount ← tableData.headers.length OR
            (tableData.rows.length > 0 ? tableData.rows[0].length : 0)

        // Phase 6: Convert to requested format
        IF options.format = "array" THEN
            RETURN tableData.rows

        ELSE IF options.format = "objects" THEN
            RETURN ConvertTableToObjects(tableData)

        ELSE IF options.format = "csv" THEN
            RETURN ConvertTableToCSV(tableData)

        ELSE
            RETURN tableData
        END IF

    CATCH error
        RETURN error("Table extraction failed: " + error.message)
    END TRY
END
```

### ALGORITHM: ConvertTableToObjects
**COMPLEXITY**:
- Time: O(n * m) where n = rows, m = columns
- Space: O(n * m)

```
ALGORITHM: ConvertTableToObjects
INPUT: tableData
OUTPUT: objects (array)

BEGIN
    objects ← []
    headers ← tableData.headers

    // Use column indices if no headers
    IF headers.length = 0 THEN
        columnCount ← tableData.metadata.columnCount
        FOR i FROM 0 TO columnCount - 1 DO
            headers.append("column_" + i)
        END FOR
    END IF

    // Convert each row to object
    FOR EACH row IN tableData.rows DO
        obj ← {}

        FOR i FROM 0 TO headers.length - 1 DO
            headerName ← headers[i]
            value ← row[i] OR null

            // Handle duplicate header names
            IF obj.has(headerName) THEN
                // Append index to make unique
                headerName ← headerName + "_" + i
            END IF

            obj[headerName] ← value
        END FOR

        objects.append(obj)
    END FOR

    RETURN objects
END
```

---

## 4. Screenshot Capture

### ALGORITHM: CaptureScreenshot
**COMPLEXITY**:
- Time: O(n) where n = viewport size
- Space: O(n) where n = image size

```
ALGORITHM: CaptureScreenshot
INPUT: page, options
OUTPUT: screenshot (buffer/path) or error

CONSTANTS:
    DEFAULT_TYPE = "png"
    DEFAULT_QUALITY = 80
    VALID_TYPES = ["png", "jpeg"]

BEGIN
    // Phase 1: Validate options
    type ← options.type OR DEFAULT_TYPE

    IF type NOT IN VALID_TYPES THEN
        RETURN error("Invalid screenshot type: " + type)
    END IF

    // Phase 2: Build screenshot options
    screenshotOptions ← {
        type: type,
        quality: options.quality OR DEFAULT_QUALITY,
        fullPage: options.fullPage OR false,
        clip: options.clip OR null,
        omitBackground: options.omitBackground OR false,
        timeout: options.timeout OR 30000
    }

    // Add path if saving to file
    IF options.path NOT null THEN
        screenshotOptions.path ← options.path
    END IF

    // Phase 3: Handle different screenshot modes
    TRY
        screenshot ← null

        IF options.element NOT null THEN
            // Element screenshot
            element ← options.element

            // Wait for element to be visible
            element.waitFor({ state: "visible", timeout: screenshotOptions.timeout })

            // Scroll into view if needed
            IF options.scrollIntoView = true THEN
                element.scrollIntoViewIfNeeded()
            END IF

            screenshot ← element.screenshot(screenshotOptions)

        ELSE IF options.fullPage = true THEN
            // Full page screenshot
            // Temporarily remove fixed elements if requested
            IF options.removeFixed = true THEN
                HideFixedElements(page)
            END IF

            screenshot ← page.screenshot(screenshotOptions)

            IF options.removeFixed = true THEN
                RestoreFixedElements(page)
            END IF

        ELSE IF options.clip NOT null THEN
            // Clipped screenshot
            screenshot ← page.screenshot(screenshotOptions)

        ELSE
            // Viewport screenshot
            screenshot ← page.screenshot(screenshotOptions)
        END IF

        // Phase 4: Post-processing
        IF options.annotate NOT null THEN
            screenshot ← AnnotateScreenshot(screenshot, options.annotate)
        END IF

        // Phase 5: Return based on output preference
        IF options.path NOT null THEN
            RETURN {
                path: options.path,
                size: GetFileSize(options.path),
                dimensions: GetImageDimensions(screenshot)
            }
        ELSE
            RETURN screenshot
        END IF

    CATCH error
        RETURN error("Screenshot capture failed: " + error.message)
    END TRY
END
```

### ALGORITHM: CaptureElementScreenshot
**COMPLEXITY**:
- Time: O(n) where n = element size
- Space: O(n)

```
ALGORITHM: CaptureElementScreenshot
INPUT: element, options
OUTPUT: screenshot or error

BEGIN
    TRY
        // Phase 1: Ensure element is ready
        element.waitFor({ state: "visible", timeout: options.timeout OR 10000 })

        // Phase 2: Scroll into view
        IF options.scrollIntoView NOT false THEN
            element.scrollIntoViewIfNeeded()
        END IF

        // Phase 3: Wait for stability
        IF options.waitForStable = true THEN
            // Wait for element position to stabilize
            previousBox ← element.boundingBox()
            Sleep(100)
            currentBox ← element.boundingBox()

            attempts ← 0
            WHILE previousBox NOT EQUAL currentBox AND attempts < 10 DO
                previousBox ← currentBox
                Sleep(100)
                currentBox ← element.boundingBox()
                attempts ← attempts + 1
            END WHILE
        END IF

        // Phase 4: Add padding if requested
        IF options.padding NOT null THEN
            box ← element.boundingBox()

            screenshotOptions ← {
                clip: {
                    x: box.x - options.padding,
                    y: box.y - options.padding,
                    width: box.width + (options.padding * 2),
                    height: box.height + (options.padding * 2)
                }
            }

            screenshot ← element.page().screenshot(screenshotOptions)
        ELSE
            screenshot ← element.screenshot(options)
        END IF

        RETURN screenshot

    CATCH error
        RETURN error("Element screenshot failed: " + error.message)
    END TRY
END
```

---

## 5. PDF Generation

### ALGORITHM: GeneratePDF
**COMPLEXITY**:
- Time: O(n) where n = page complexity
- Space: O(n) where n = PDF size

```
ALGORITHM: GeneratePDF
INPUT: page, options
OUTPUT: pdf (buffer/path) or error

CONSTANTS:
    DEFAULT_FORMAT = "A4"
    DEFAULT_MARGIN = { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" }

BEGIN
    // Phase 1: Build PDF options
    pdfOptions ← {
        path: options.path OR null,
        format: options.format OR DEFAULT_FORMAT,
        landscape: options.landscape OR false,
        printBackground: options.printBackground OR true,
        margin: options.margin OR DEFAULT_MARGIN,
        displayHeaderFooter: options.displayHeaderFooter OR false,
        headerTemplate: options.headerTemplate OR "",
        footerTemplate: options.footerTemplate OR "",
        preferCSSPageSize: options.preferCSSPageSize OR false,
        timeout: options.timeout OR 30000
    }

    // Add page ranges if specified
    IF options.pageRanges NOT null THEN
        pdfOptions.pageRanges ← options.pageRanges
    END IF

    // Phase 2: Prepare page for PDF
    TRY
        // Wait for page to be fully loaded
        page.waitForLoadState("networkidle", {
            timeout: pdfOptions.timeout
        })

        // Execute pre-PDF JavaScript if provided
        IF options.beforePDF NOT null THEN
            page.evaluate(options.beforePDF)
        END IF

        // Inject custom styles for print if provided
        IF options.printStyles NOT null THEN
            page.addStyleTag({ content: options.printStyles })
        END IF

        // Phase 3: Generate PDF
        pdf ← page.pdf(pdfOptions)

        // Phase 4: Return result
        IF options.path NOT null THEN
            RETURN {
                path: options.path,
                size: GetFileSize(options.path),
                pageCount: CountPDFPages(pdf)
            }
        ELSE
            RETURN pdf
        END IF

    CATCH error
        RETURN error("PDF generation failed: " + error.message)
    END TRY
END
```

---

## 6. DOM Serialization

### ALGORITHM: SerializeDOM
**COMPLEXITY**:
- Time: O(n) where n = DOM nodes
- Space: O(n)

```
ALGORITHM: SerializeDOM
INPUT: page, options
OUTPUT: domData or error

BEGIN
    TRY
        // Phase 1: Extract DOM based on mode
        domData ← null

        IF options.mode = "html" THEN
            // Full HTML serialization
            domData ← page.content()

        ELSE IF options.mode = "snapshot" THEN
            // Structural snapshot
            domData ← page.evaluate("() => {
                function serializeNode(node) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        return { type: 'text', content: node.textContent };
                    }

                    if (node.nodeType !== Node.ELEMENT_NODE) {
                        return null;
                    }

                    const result = {
                        type: 'element',
                        tag: node.tagName.toLowerCase(),
                        attributes: {},
                        children: []
                    };

                    // Collect attributes
                    for (let attr of node.attributes) {
                        result.attributes[attr.name] = attr.value;
                    }

                    // Serialize children
                    for (let child of node.childNodes) {
                        const serialized = serializeNode(child);
                        if (serialized) {
                            result.children.push(serialized);
                        }
                    }

                    return result;
                }

                return serializeNode(document.documentElement);
            }")

        ELSE IF options.mode = "accessibility" THEN
            // Accessibility tree
            domData ← page.accessibility.snapshot()

        END IF

        // Phase 2: Filter if requested
        IF options.filter NOT null THEN
            domData ← FilterDOM(domData, options.filter)
        END IF

        // Phase 3: Format output
        IF options.format = "json" THEN
            domData ← JSON.stringify(domData, null, 2)
        END IF

        RETURN domData

    CATCH error
        RETURN error("DOM serialization failed: " + error.message)
    END TRY
END
```

---

## 7. Structured Data Parsing

### ALGORITHM: ExtractStructuredData
**COMPLEXITY**:
- Time: O(n) where n = data elements
- Space: O(n)

```
ALGORITHM: ExtractStructuredData
INPUT: page, schema, options
OUTPUT: structuredData or error

BEGIN
    TRY
        // Phase 1: Extract based on schema type
        structuredData ← {}

        FOR EACH field IN schema.fields DO
            fieldName ← field.name
            fieldType ← field.type
            selector ← field.selector

            // Locate elements
            elements ← page.locator(selector)
            count ← elements.count()

            IF count = 0 AND field.required = true THEN
                RETURN error("Required field not found: " + fieldName)
            END IF

            // Extract data based on type
            IF field.multiple = true THEN
                values ← []

                FOR i FROM 0 TO count - 1 DO
                    element ← elements.nth(i)
                    value ← ExtractFieldValue(element, field)

                    IF value NOT null THEN
                        values.append(value)
                    END IF
                END FOR

                structuredData[fieldName] ← values
            ELSE
                IF count > 0 THEN
                    element ← elements.first()
                    structuredData[fieldName] ← ExtractFieldValue(element, field)
                ELSE
                    structuredData[fieldName] ← field.default OR null
                END IF
            END IF
        END FOR

        // Phase 2: Validate extracted data
        IF options.validate = true THEN
            validationResult ← ValidateData(structuredData, schema)

            IF NOT validationResult.valid THEN
                RETURN error("Data validation failed: " + validationResult.errors)
            END IF
        END IF

        RETURN structuredData

    CATCH error
        RETURN error("Structured data extraction failed: " + error.message)
    END TRY
END

SUBROUTINE: ExtractFieldValue
INPUT: element, field
OUTPUT: value

BEGIN
    SWITCH field.type
        CASE "text":
            RETURN element.innerText()

        CASE "attribute":
            RETURN element.getAttribute(field.attribute)

        CASE "number":
            text ← element.innerText()
            RETURN ParseFloat(text.replace(/[^0-9.-]/g, ""))

        CASE "date":
            text ← element.innerText()
            RETURN ParseDate(text)

        CASE "boolean":
            IF field.attribute NOT null THEN
                RETURN element.getAttribute(field.attribute) NOT null
            ELSE
                RETURN element.isVisible()
            END IF

        CASE "url":
            RETURN element.getAttribute("href") OR element.getAttribute("src")

        DEFAULT:
            RETURN element.innerText()
    END SWITCH
END
```

---

## Complexity Summary

| Algorithm | Time Complexity | Space Complexity | Notes |
|-----------|----------------|------------------|-------|
| ExtractTextContent | O(n) | O(n) | n = DOM depth |
| ExtractMultipleTexts | O(n*m) | O(n*k) | n = elements, m = depth, k = text size |
| ExtractAttribute | O(1) | O(k) | k = attribute value size |
| ExtractAllAttributes | O(n) | O(n*k) | n = attributes, k = avg value size |
| ExtractTableData | O(n*m) | O(n*m) | n = rows, m = columns |
| ConvertTableToObjects | O(n*m) | O(n*m) | n = rows, m = columns |
| CaptureScreenshot | O(n) | O(n) | n = viewport/image size |
| CaptureElementScreenshot | O(n) | O(n) | n = element size |
| GeneratePDF | O(n) | O(n) | n = page complexity |
| SerializeDOM | O(n) | O(n) | n = DOM nodes |
| ExtractStructuredData | O(n) | O(n) | n = data elements |

---

## Edge Cases

### Text Extraction
1. **Hidden text**: Choose appropriate mode (innerText vs textContent)
2. **Special characters**: Handle encoding/decoding
3. **Empty elements**: Handle gracefully with allowEmpty option
4. **Dynamic content**: Wait for content to load
5. **Truncated text**: Handle "show more" buttons

### Attribute Extraction
1. **Missing attributes**: Provide defaults or mark as optional
2. **Boolean attributes**: Handle presence-based attributes
3. **Data attributes**: Support data-* attribute extraction
4. **Computed styles**: Access via getComputedStyle
5. **Custom attributes**: Support non-standard attributes

### Table Extraction
1. **Merged cells**: Handle colspan/rowspan correctly
2. **Nested tables**: Extract recursively if needed
3. **Missing headers**: Generate column indices
4. **Empty cells**: Represent as null or empty string
5. **Complex formatting**: Support HTML mode for rich content

### Screenshot Capture
1. **Large pages**: Handle memory constraints for full-page
2. **Lazy loading**: Scroll to load all content first
3. **Fixed elements**: Optionally hide during capture
4. **Animations**: Wait for stability before capture
5. **Responsive design**: Set viewport before capture

### Structured Data
1. **Missing fields**: Use defaults for optional fields
2. **Type conversion**: Handle conversion failures gracefully
3. **Validation**: Implement comprehensive validation
4. **Nested data**: Support recursive extraction
5. **Dynamic schemas**: Allow runtime schema modification

---

## Production Considerations

1. **Performance**: Minimize DOM queries, batch operations
2. **Memory**: Be cautious with full-page screenshots/DOM dumps
3. **Accuracy**: Validate extracted data against schemas
4. **Maintainability**: Use clear, descriptive field names
5. **Reliability**: Handle missing/changed selectors gracefully
6. **Format flexibility**: Support multiple output formats (JSON, CSV, etc.)
