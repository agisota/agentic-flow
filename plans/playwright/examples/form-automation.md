# Form Automation with Playwright MCP

Comprehensive guide for automating form interactions including login forms, multi-step wizards, file uploads, and dynamic validation.

## Table of Contents
- [Login Form Automation](#login-form-automation)
- [Multi-Step Form Wizard](#multi-step-form-wizard)
- [File Upload Forms](#file-upload-forms)
- [Dynamic Form Validation](#dynamic-form-validation)
- [Dropdown and Select Handling](#dropdown-and-select-handling)
- [Date Picker Interaction](#date-picker-interaction)
- [Checkboxes and Radio Buttons](#checkboxes-and-radio-buttons)
- [Form Submission and Validation](#form-submission-and-validation)

---

## Login Form Automation

### Complete Login Workflow with Session Persistence

```json
{
  "workflow": "user-login",
  "steps": [
    {
      "step": 1,
      "description": "Navigate to login page",
      "tool": "mcp__playwright__playwright_navigate",
      "parameters": {
        "url": "https://example.com/login"
      }
    },
    {
      "step": 2,
      "description": "Fill username field",
      "tool": "mcp__playwright__playwright_fill",
      "parameters": {
        "selector": "input[name='username']",
        "value": "testuser@example.com"
      }
    },
    {
      "step": 3,
      "description": "Fill password field",
      "tool": "mcp__playwright__playwright_fill",
      "parameters": {
        "selector": "input[name='password']",
        "value": "SecurePassword123!"
      }
    },
    {
      "step": 4,
      "description": "Screenshot before submission",
      "tool": "mcp__playwright__playwright_screenshot",
      "parameters": {
        "path": "/home/user/agentic-flow/screenshots/login-before-submit.png"
      }
    },
    {
      "step": 5,
      "description": "Click submit button",
      "tool": "mcp__playwright__playwright_click",
      "parameters": {
        "selector": "button[type='submit']"
      }
    },
    {
      "step": 6,
      "description": "Wait for navigation",
      "tool": "mcp__playwright__playwright_wait_for_selector",
      "parameters": {
        "selector": ".dashboard-welcome",
        "state": "visible",
        "timeout": 5000
      }
    },
    {
      "step": 7,
      "description": "Save authenticated session",
      "tool": "mcp__playwright__playwright_context_save",
      "parameters": {
        "path": "/home/user/agentic-flow/auth/session.json"
      }
    },
    {
      "step": 8,
      "description": "Screenshot after login",
      "tool": "mcp__playwright__playwright_screenshot",
      "parameters": {
        "path": "/home/user/agentic-flow/screenshots/login-success.png"
      }
    }
  ]
}
```

### Agent Task Description

```
Task: Automated user authentication
Agent: login-automator
Priority: High

Instructions:
1. Navigate to login page at https://example.com/login
2. Fill username field with test credentials
3. Fill password field (handle securely)
4. Capture screenshot before submission
5. Submit form and wait for dashboard redirect
6. Verify successful login (look for .dashboard-welcome element)
7. Save session state to /home/user/agentic-flow/auth/session.json
8. Capture post-login screenshot
9. Store session metadata in coordination memory

Hooks:
- Pre-task: Validate credentials availability
- Post-edit: Update session state in memory
- Post-task: Report authentication status

Memory Keys:
- swarm/auth/session-state
- swarm/auth/login-timestamp
- swarm/auth/screenshots

Error Handling:
- Retry login up to 3 times on failure
- Capture screenshot on error for debugging
- Log detailed error messages
```

### Expected Output

```json
{
  "loginStatus": "success",
  "user": "testuser@example.com",
  "sessionSaved": true,
  "sessionPath": "/home/user/agentic-flow/auth/session.json",
  "screenshots": [
    "/home/user/agentic-flow/screenshots/login-before-submit.png",
    "/home/user/agentic-flow/screenshots/login-success.png"
  ],
  "redirectUrl": "https://example.com/dashboard",
  "loginTime": "2025-11-27T10:45:23Z",
  "executionTime": "2.1s"
}
```

### Error Handling Pattern

```json
{
  "workflow": "login-with-error-handling",
  "errorHandling": {
    "retries": 3,
    "captureOnError": true,
    "fallbackActions": ["screenshot", "logDOM", "saveState"]
  },
  "steps": [
    {
      "try": {
        "tool": "mcp__playwright__playwright_fill",
        "parameters": {
          "selector": "input[name='username']",
          "value": "testuser@example.com"
        }
      },
      "catch": {
        "screenshot": "/home/user/agentic-flow/screenshots/error-username-fill.png",
        "extractError": "() => document.querySelector('.error-message')?.textContent",
        "retry": true
      }
    }
  ]
}
```

---

## Multi-Step Form Wizard

### Complete Wizard Workflow (Registration Form)

```json
{
  "workflow": "registration-wizard",
  "description": "Multi-step user registration with validation",
  "steps": [
    {
      "page": 1,
      "title": "Personal Information",
      "actions": [
        {
          "tool": "mcp__playwright__playwright_navigate",
          "parameters": {
            "url": "https://example.com/register"
          }
        },
        {
          "tool": "mcp__playwright__playwright_fill",
          "parameters": {
            "selector": "#firstName",
            "value": "John"
          }
        },
        {
          "tool": "mcp__playwright__playwright_fill",
          "parameters": {
            "selector": "#lastName",
            "value": "Doe"
          }
        },
        {
          "tool": "mcp__playwright__playwright_fill",
          "parameters": {
            "selector": "#email",
            "value": "john.doe@example.com"
          }
        },
        {
          "tool": "mcp__playwright__playwright_screenshot",
          "parameters": {
            "path": "/home/user/agentic-flow/screenshots/wizard-step1.png"
          }
        },
        {
          "tool": "mcp__playwright__playwright_click",
          "parameters": {
            "selector": "button.next-step"
          }
        }
      ]
    },
    {
      "page": 2,
      "title": "Account Details",
      "actions": [
        {
          "tool": "mcp__playwright__playwright_wait_for_selector",
          "parameters": {
            "selector": "#username",
            "state": "visible"
          }
        },
        {
          "tool": "mcp__playwright__playwright_fill",
          "parameters": {
            "selector": "#username",
            "value": "johndoe2025"
          }
        },
        {
          "tool": "mcp__playwright__playwright_fill",
          "parameters": {
            "selector": "#password",
            "value": "SecurePass123!"
          }
        },
        {
          "tool": "mcp__playwright__playwright_fill",
          "parameters": {
            "selector": "#confirmPassword",
            "value": "SecurePass123!"
          }
        },
        {
          "tool": "mcp__playwright__playwright_screenshot",
          "parameters": {
            "path": "/home/user/agentic-flow/screenshots/wizard-step2.png"
          }
        },
        {
          "tool": "mcp__playwright__playwright_click",
          "parameters": {
            "selector": "button.next-step"
          }
        }
      ]
    },
    {
      "page": 3,
      "title": "Preferences",
      "actions": [
        {
          "tool": "mcp__playwright__playwright_check",
          "parameters": {
            "selector": "#newsletter",
            "checked": true
          }
        },
        {
          "tool": "mcp__playwright__playwright_select_option",
          "parameters": {
            "selector": "#language",
            "value": "en"
          }
        },
        {
          "tool": "mcp__playwright__playwright_select_option",
          "parameters": {
            "selector": "#timezone",
            "value": "America/New_York"
          }
        },
        {
          "tool": "mcp__playwright__playwright_screenshot",
          "parameters": {
            "path": "/home/user/agentic-flow/screenshots/wizard-step3.png"
          }
        },
        {
          "tool": "mcp__playwright__playwright_click",
          "parameters": {
            "selector": "button[type='submit']"
          }
        }
      ]
    },
    {
      "page": 4,
      "title": "Confirmation",
      "actions": [
        {
          "tool": "mcp__playwright__playwright_wait_for_selector",
          "parameters": {
            "selector": ".success-message",
            "state": "visible",
            "timeout": 5000
          }
        },
        {
          "tool": "mcp__playwright__playwright_screenshot",
          "parameters": {
            "path": "/home/user/agentic-flow/screenshots/wizard-complete.png"
          }
        },
        {
          "tool": "mcp__playwright__playwright_evaluate",
          "parameters": {
            "script": "() => document.querySelector('.success-message')?.textContent"
          }
        }
      ]
    }
  ]
}
```

### Agent Task Description

```
Task: Complete multi-step registration wizard
Agent: form-wizard-automator
Priority: High

Instructions:
Step 1 - Personal Information:
1. Navigate to registration page
2. Fill first name: "John"
3. Fill last name: "Doe"
4. Fill email: "john.doe@example.com"
5. Capture screenshot
6. Click "Next" button

Step 2 - Account Details:
1. Wait for account details page to load
2. Fill username: "johndoe2025"
3. Fill password with secure value
4. Confirm password (must match)
5. Capture screenshot
6. Click "Next" button

Step 3 - Preferences:
1. Check newsletter subscription
2. Select language: English
3. Select timezone: America/New_York
4. Capture screenshot
5. Submit form

Step 4 - Confirmation:
1. Wait for success message
2. Capture final screenshot
3. Extract confirmation text
4. Store completion status in memory

Validation Requirements:
- Verify each field accepts input
- Check for validation error messages
- Ensure proper navigation between steps
- Confirm successful submission

Memory Keys:
- swarm/wizard/step1/data
- swarm/wizard/step2/data
- swarm/wizard/step3/data
- swarm/wizard/completion

Screenshots: Save to /home/user/agentic-flow/screenshots/wizard-stepN.png
```

### Expected Output

```json
{
  "wizardStatus": "completed",
  "totalSteps": 4,
  "stepsCompleted": 4,
  "userData": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "username": "johndoe2025"
  },
  "preferences": {
    "newsletter": true,
    "language": "en",
    "timezone": "America/New_York"
  },
  "screenshots": [
    "/home/user/agentic-flow/screenshots/wizard-step1.png",
    "/home/user/agentic-flow/screenshots/wizard-step2.png",
    "/home/user/agentic-flow/screenshots/wizard-step3.png",
    "/home/user/agentic-flow/screenshots/wizard-complete.png"
  ],
  "confirmationMessage": "Registration successful! Welcome, John Doe.",
  "executionTime": "8.4s"
}
```

---

## File Upload Forms

### Single File Upload

```json
{
  "workflow": "file-upload",
  "steps": [
    {
      "step": 1,
      "tool": "mcp__playwright__playwright_navigate",
      "parameters": {
        "url": "https://example.com/upload"
      }
    },
    {
      "step": 2,
      "tool": "mcp__playwright__playwright_set_input_files",
      "parameters": {
        "selector": "input[type='file']",
        "files": ["/home/user/agentic-flow/data/sample-document.pdf"]
      }
    },
    {
      "step": 3,
      "tool": "mcp__playwright__playwright_wait_for_selector",
      "parameters": {
        "selector": ".file-preview",
        "state": "visible"
      }
    },
    {
      "step": 4,
      "tool": "mcp__playwright__playwright_screenshot",
      "parameters": {
        "path": "/home/user/agentic-flow/screenshots/file-selected.png"
      }
    },
    {
      "step": 5,
      "tool": "mcp__playwright__playwright_click",
      "parameters": {
        "selector": "button.upload-submit"
      }
    },
    {
      "step": 6,
      "tool": "mcp__playwright__playwright_wait_for_selector",
      "parameters": {
        "selector": ".upload-success",
        "state": "visible",
        "timeout": 10000
      }
    }
  ]
}
```

### Multiple File Upload

```json
{
  "workflow": "multiple-file-upload",
  "steps": [
    {
      "tool": "mcp__playwright__playwright_set_input_files",
      "parameters": {
        "selector": "input[type='file'][multiple]",
        "files": [
          "/home/user/agentic-flow/data/document1.pdf",
          "/home/user/agentic-flow/data/document2.pdf",
          "/home/user/agentic-flow/data/image1.jpg"
        ]
      }
    },
    {
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => {
          const fileList = document.querySelector('.file-list');
          return Array.from(fileList.querySelectorAll('.file-item')).map(item => ({
            name: item.querySelector('.file-name')?.textContent,
            size: item.querySelector('.file-size')?.textContent,
            status: item.querySelector('.file-status')?.textContent
          }));
        }`
      }
    }
  ]
}
```

### Agent Task Description

```
Task: Automated file upload with validation
Agent: file-upload-automator

Instructions:
1. Navigate to upload page
2. Prepare files for upload:
   - /home/user/agentic-flow/data/sample-document.pdf
   - /home/user/agentic-flow/data/image-sample.jpg
3. Select files using file input
4. Wait for file preview to appear
5. Verify file details (name, size, type)
6. Capture screenshot of file selection
7. Submit upload form
8. Wait for upload progress (max 10s)
9. Verify success message
10. Extract upload confirmation details
11. Store upload metadata in memory

Validation:
- Verify file types are accepted
- Check file size limits
- Confirm successful upload
- Handle upload errors gracefully

Memory Keys:
- swarm/uploads/files/metadata
- swarm/uploads/confirmation

Error Handling:
- Retry upload on network errors
- Capture error screenshots
- Log upload failures
```

### Expected Output

```json
{
  "uploadStatus": "success",
  "filesUploaded": [
    {
      "name": "sample-document.pdf",
      "size": "245KB",
      "type": "application/pdf",
      "uploadTime": "1.2s",
      "url": "https://example.com/uploads/abc123/sample-document.pdf"
    },
    {
      "name": "image-sample.jpg",
      "size": "89KB",
      "type": "image/jpeg",
      "uploadTime": "0.8s",
      "url": "https://example.com/uploads/abc123/image-sample.jpg"
    }
  ],
  "totalSize": "334KB",
  "uploadTime": "2.0s",
  "confirmationId": "UP-2025-11-27-12345"
}
```

---

## Dynamic Form Validation

### Real-Time Validation Handling

```json
{
  "workflow": "form-validation-test",
  "steps": [
    {
      "description": "Fill email with invalid format",
      "actions": [
        {
          "tool": "mcp__playwright__playwright_fill",
          "parameters": {
            "selector": "#email",
            "value": "invalid-email"
          }
        },
        {
          "tool": "mcp__playwright__playwright_click",
          "parameters": {
            "selector": "#firstName"
          }
        },
        {
          "tool": "mcp__playwright__playwright_wait_for_selector",
          "parameters": {
            "selector": ".error-message[data-field='email']",
            "state": "visible"
          }
        },
        {
          "tool": "mcp__playwright__playwright_evaluate",
          "parameters": {
            "script": "() => document.querySelector('.error-message[data-field=\"email\"]')?.textContent"
          }
        },
        {
          "tool": "mcp__playwright__playwright_screenshot",
          "parameters": {
            "path": "/home/user/agentic-flow/screenshots/validation-error.png"
          }
        }
      ]
    },
    {
      "description": "Correct the email",
      "actions": [
        {
          "tool": "mcp__playwright__playwright_fill",
          "parameters": {
            "selector": "#email",
            "value": "valid@example.com"
          }
        },
        {
          "tool": "mcp__playwright__playwright_wait_for_selector",
          "parameters": {
            "selector": ".success-indicator[data-field='email']",
            "state": "visible"
          }
        },
        {
          "tool": "mcp__playwright__playwright_screenshot",
          "parameters": {
            "path": "/home/user/agentic-flow/screenshots/validation-success.png"
          }
        }
      ]
    }
  ]
}
```

### Password Strength Validation

```json
{
  "workflow": "password-strength-test",
  "testCases": [
    {
      "password": "weak",
      "expectedStrength": "weak",
      "expectedMessage": "Password too short"
    },
    {
      "password": "medium123",
      "expectedStrength": "medium",
      "expectedMessage": "Add special characters"
    },
    {
      "password": "Strong123!@#",
      "expectedStrength": "strong",
      "expectedMessage": "Password meets requirements"
    }
  ],
  "implementation": [
    {
      "tool": "mcp__playwright__playwright_fill",
      "parameters": {
        "selector": "#password",
        "value": "{{password}}"
      }
    },
    {
      "tool": "mcp__playwright__playwright_wait_for_selector",
      "parameters": {
        "selector": ".strength-indicator",
        "state": "visible"
      }
    },
    {
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => ({
          strength: document.querySelector('.strength-indicator')?.dataset.strength,
          message: document.querySelector('.strength-message')?.textContent,
          barWidth: getComputedStyle(document.querySelector('.strength-bar')).width
        })`
      }
    }
  ]
}
```

### Agent Task Description

```
Task: Test dynamic form validation
Agent: validation-tester

Instructions:
Test Email Validation:
1. Enter invalid email format: "invalid-email"
2. Blur field to trigger validation
3. Wait for error message to appear
4. Capture screenshot of error state
5. Extract error message text
6. Correct email to: "valid@example.com"
7. Wait for success indicator
8. Capture screenshot of success state

Test Password Strength:
1. Enter weak password: "weak"
2. Check strength indicator shows "weak"
3. Enter medium password: "medium123"
4. Check strength indicator shows "medium"
5. Enter strong password: "Strong123!@#"
6. Check strength indicator shows "strong"
7. Capture each strength level screenshot

Test Required Fields:
1. Submit form with empty fields
2. Count validation errors
3. Verify all required fields are highlighted
4. Fill each field progressively
5. Watch errors clear in real-time

Store Results:
- Validation error messages
- Success indicators
- Field states (valid/invalid/empty)
- Screenshots for each scenario

Memory Keys:
- swarm/validation/email/errors
- swarm/validation/password/strength
- swarm/validation/required/fields
```

### Expected Output

```json
{
  "validationTests": {
    "email": {
      "invalidTests": [
        {
          "input": "invalid-email",
          "error": "Please enter a valid email address",
          "screenshot": "/home/user/agentic-flow/screenshots/validation-error.png"
        }
      ],
      "validTests": [
        {
          "input": "valid@example.com",
          "success": true,
          "screenshot": "/home/user/agentic-flow/screenshots/validation-success.png"
        }
      ]
    },
    "password": {
      "strengthTests": [
        {
          "input": "weak",
          "strength": "weak",
          "message": "Password too short",
          "barWidth": "33%"
        },
        {
          "input": "medium123",
          "strength": "medium",
          "message": "Add special characters",
          "barWidth": "66%"
        },
        {
          "input": "Strong123!@#",
          "strength": "strong",
          "message": "Password meets requirements",
          "barWidth": "100%"
        }
      ]
    },
    "requiredFields": {
      "total": 5,
      "errorCount": 5,
      "allHighlighted": true
    }
  },
  "executionTime": "12.3s"
}
```

---

## Dropdown and Select Handling

### Standard Select Dropdown

```json
{
  "workflow": "select-dropdown",
  "steps": [
    {
      "description": "Select by value",
      "tool": "mcp__playwright__playwright_select_option",
      "parameters": {
        "selector": "#country",
        "value": "US"
      }
    },
    {
      "description": "Select by label",
      "tool": "mcp__playwright__playwright_select_option",
      "parameters": {
        "selector": "#country",
        "label": "United States"
      }
    },
    {
      "description": "Select by index",
      "tool": "mcp__playwright__playwright_select_option",
      "parameters": {
        "selector": "#country",
        "index": 0
      }
    },
    {
      "description": "Get selected option",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": "() => document.querySelector('#country').value"
      }
    }
  ]
}
```

### Custom Dropdown (JavaScript-based)

```json
{
  "workflow": "custom-dropdown",
  "steps": [
    {
      "step": 1,
      "description": "Open dropdown",
      "tool": "mcp__playwright__playwright_click",
      "parameters": {
        "selector": ".custom-select-trigger"
      }
    },
    {
      "step": 2,
      "description": "Wait for options to appear",
      "tool": "mcp__playwright__playwright_wait_for_selector",
      "parameters": {
        "selector": ".custom-select-options",
        "state": "visible"
      }
    },
    {
      "step": 3,
      "description": "Click desired option",
      "tool": "mcp__playwright__playwright_click",
      "parameters": {
        "selector": ".custom-select-option[data-value='premium']"
      }
    },
    {
      "step": 4,
      "description": "Verify selection",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": "() => document.querySelector('.custom-select-trigger')?.textContent.trim()"
      }
    }
  ]
}
```

### Multi-Select Handling

```json
{
  "workflow": "multi-select",
  "steps": [
    {
      "tool": "mcp__playwright__playwright_select_option",
      "parameters": {
        "selector": "#skills",
        "value": ["javascript", "python", "java"]
      }
    },
    {
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => {
          const select = document.querySelector('#skills');
          return Array.from(select.selectedOptions).map(opt => opt.value);
        }`
      }
    }
  ]
}
```

---

## Date Picker Interaction

### Standard HTML5 Date Input

```json
{
  "workflow": "html5-date-picker",
  "steps": [
    {
      "tool": "mcp__playwright__playwright_fill",
      "parameters": {
        "selector": "input[type='date']",
        "value": "2025-12-25"
      }
    },
    {
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": "() => document.querySelector('input[type=\"date\"]').value"
      }
    }
  ]
}
```

### Custom JavaScript Date Picker

```json
{
  "workflow": "custom-date-picker",
  "steps": [
    {
      "step": 1,
      "description": "Open date picker",
      "tool": "mcp__playwright__playwright_click",
      "parameters": {
        "selector": ".date-picker-trigger"
      }
    },
    {
      "step": 2,
      "description": "Wait for calendar",
      "tool": "mcp__playwright__playwright_wait_for_selector",
      "parameters": {
        "selector": ".calendar-widget",
        "state": "visible"
      }
    },
    {
      "step": 3,
      "description": "Select month",
      "tool": "mcp__playwright__playwright_select_option",
      "parameters": {
        "selector": ".calendar-month-select",
        "value": "11"
      }
    },
    {
      "step": 4,
      "description": "Select year",
      "tool": "mcp__playwright__playwright_select_option",
      "parameters": {
        "selector": ".calendar-year-select",
        "value": "2025"
      }
    },
    {
      "step": 5,
      "description": "Click date",
      "tool": "mcp__playwright__playwright_click",
      "parameters": {
        "selector": ".calendar-day[data-date='25']"
      }
    },
    {
      "step": 6,
      "description": "Verify selection",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": "() => document.querySelector('.date-picker-trigger')?.value"
      }
    }
  ]
}
```

---

## Checkboxes and Radio Buttons

### Checkbox Handling

```json
{
  "workflow": "checkbox-operations",
  "steps": [
    {
      "description": "Check a checkbox",
      "tool": "mcp__playwright__playwright_check",
      "parameters": {
        "selector": "#terms-checkbox"
      }
    },
    {
      "description": "Uncheck a checkbox",
      "tool": "mcp__playwright__playwright_uncheck",
      "parameters": {
        "selector": "#newsletter-checkbox"
      }
    },
    {
      "description": "Set checkbox state",
      "tool": "mcp__playwright__playwright_set_checked",
      "parameters": {
        "selector": "#marketing-checkbox",
        "checked": true
      }
    },
    {
      "description": "Get all checkbox states",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => {
          return Array.from(document.querySelectorAll('input[type="checkbox"]')).map(cb => ({
            id: cb.id,
            name: cb.name,
            checked: cb.checked,
            label: document.querySelector(\`label[for="\${cb.id}"]\`)?.textContent
          }));
        }`
      }
    }
  ]
}
```

### Radio Button Handling

```json
{
  "workflow": "radio-button-selection",
  "steps": [
    {
      "description": "Select radio button",
      "tool": "mcp__playwright__playwright_check",
      "parameters": {
        "selector": "input[name='subscription'][value='premium']"
      }
    },
    {
      "description": "Get selected radio value",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": "() => document.querySelector('input[name=\"subscription\"]:checked')?.value"
      }
    }
  ]
}
```

---

## Form Submission and Validation

### Complete Form Submission Workflow

```json
{
  "workflow": "complete-form-submission",
  "steps": [
    {
      "phase": "fill",
      "actions": [
        {"tool": "mcp__playwright__playwright_fill", "parameters": {"selector": "#name", "value": "John Doe"}},
        {"tool": "mcp__playwright__playwright_fill", "parameters": {"selector": "#email", "value": "john@example.com"}},
        {"tool": "mcp__playwright__playwright_select_option", "parameters": {"selector": "#country", "value": "US"}},
        {"tool": "mcp__playwright__playwright_check", "parameters": {"selector": "#terms"}},
        {"tool": "mcp__playwright__playwright_screenshot", "parameters": {"path": "/home/user/agentic-flow/screenshots/form-filled.png"}}
      ]
    },
    {
      "phase": "validate",
      "actions": [
        {
          "tool": "mcp__playwright__playwright_evaluate",
          "parameters": {
            "script": `() => {
              const form = document.querySelector('form');
              return {
                isValid: form.checkValidity(),
                errors: Array.from(form.querySelectorAll(':invalid')).map(el => ({
                  field: el.name,
                  message: el.validationMessage
                }))
              };
            }`
          }
        }
      ]
    },
    {
      "phase": "submit",
      "actions": [
        {"tool": "mcp__playwright__playwright_click", "parameters": {"selector": "button[type='submit']"}},
        {"tool": "mcp__playwright__playwright_wait_for_selector", "parameters": {"selector": ".success-message", "state": "visible"}},
        {"tool": "mcp__playwright__playwright_screenshot", "parameters": {"path": "/home/user/agentic-flow/screenshots/form-submitted.png"}}
      ]
    },
    {
      "phase": "confirmation",
      "actions": [
        {
          "tool": "mcp__playwright__playwright_evaluate",
          "parameters": {
            "script": `() => ({
              message: document.querySelector('.success-message')?.textContent,
              confirmationId: document.querySelector('.confirmation-id')?.textContent,
              redirectUrl: window.location.href
            })`
          }
        }
      ]
    }
  ]
}
```

### Agent Complete Form Workflow

```
Task: End-to-end form submission test
Agent: form-e2e-tester

Pre-Task Hooks:
npx claude-flow@alpha hooks pre-task --description "Form submission workflow"
npx claude-flow@alpha hooks session-restore --session-id "swarm-form-test"

Instructions:
Phase 1 - Form Fill:
1. Navigate to form page
2. Fill all required fields
3. Select dropdown options
4. Check agreement checkboxes
5. Capture screenshot of filled form

Phase 2 - Validation:
1. Run client-side validation check
2. Identify any validation errors
3. Correct errors if found
4. Verify form is valid before submission

Phase 3 - Submission:
1. Click submit button
2. Wait for form processing (max 5s)
3. Wait for success message
4. Capture screenshot of confirmation

Phase 4 - Confirmation:
1. Extract confirmation message
2. Extract confirmation ID
3. Verify redirect to success page
4. Store all results in memory

Post-Task Hooks:
npx claude-flow@alpha hooks post-task --task-id "form-submission"
npx claude-flow@alpha hooks notify --message "Form submission complete"

Memory Keys:
- swarm/forms/submission/data
- swarm/forms/submission/validation
- swarm/forms/submission/confirmation

Error Handling:
- Capture screenshot on validation errors
- Retry submission on network errors
- Log detailed error information
```

### Expected Final Output

```json
{
  "formSubmission": {
    "status": "success",
    "formData": {
      "name": "John Doe",
      "email": "john@example.com",
      "country": "US",
      "terms": true
    },
    "validation": {
      "isValid": true,
      "errors": []
    },
    "submission": {
      "timestamp": "2025-11-27T11:15:30Z",
      "processingTime": "1.8s"
    },
    "confirmation": {
      "message": "Thank you for your submission!",
      "confirmationId": "FORM-2025-11-27-98765",
      "redirectUrl": "https://example.com/success"
    },
    "screenshots": [
      "/home/user/agentic-flow/screenshots/form-filled.png",
      "/home/user/agentic-flow/screenshots/form-submitted.png"
    ]
  },
  "executionTime": "6.2s"
}
```

---

## Complete Example: Multi-Agent Form Testing

```
[Message 1 - Initialize Swarm and Spawn All Agents]

Swarm Configuration:
  Topology: mesh
  Agents: 4
  Coordination: claude-flow hooks + memory

Agent 1: Login Form Tester
  Task: Test login functionality with valid/invalid credentials
  Memory: swarm/login-test/results

Agent 2: Registration Form Tester
  Task: Complete multi-step registration wizard
  Memory: swarm/registration-test/results

Agent 3: File Upload Tester
  Task: Test single and multiple file uploads
  Memory: swarm/upload-test/results

Agent 4: Validation Tester
  Task: Test all form validation scenarios
  Memory: swarm/validation-test/results

All agents execute in parallel, store results in shared memory, and generate screenshots.
```

This approach achieves 2.8-4.4x speed improvement over sequential execution!

---

## Next Steps

- Explore [Data Scraping](./data-scraping.md) for extracting form data
- Learn [Multi-Agent Swarm](./multi-agent-swarm.md) for parallel form testing
- Review [Basic Navigation](./basic-navigation.md) for prerequisites
