# Playwright MCP - Code Quality Standards

## Overview

This document defines comprehensive code quality standards for the Playwright MCP implementation, including TypeScript configuration, linting rules, code review criteria, and documentation standards.

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    // Language & Environment
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",

    // Emit
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "removeComments": false,
    "noEmit": false,

    // Interop Constraints
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,

    // Type Checking - STRICT MODE
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // Additional Checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,

    // Advanced
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": false
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

### tsconfig.test.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["vitest/globals", "node"]
  },
  "include": [
    "tests/**/*",
    "src/**/*.test.ts",
    "src/**/*.spec.ts"
  ]
}
```

## ESLint Configuration

### .eslintrc.json

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": [
    "@typescript-eslint",
    "import",
    "promise",
    "unicorn"
  ],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:promise/recommended",
    "plugin:unicorn/recommended"
  ],
  "rules": {
    // TypeScript Specific
    "@typescript-eslint/explicit-function-return-type": ["error", {
      "allowExpressions": true,
      "allowTypedFunctionExpressions": true
    }],
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/strict-boolean-expressions": ["error", {
      "allowString": false,
      "allowNumber": false,
      "allowNullableObject": false
    }],
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "@typescript-eslint/consistent-type-imports": ["error", {
      "prefer": "type-imports"
    }],
    "@typescript-eslint/consistent-type-exports": "error",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "interface",
        "format": ["PascalCase"],
        "prefix": ["I"]
      },
      {
        "selector": "typeAlias",
        "format": ["PascalCase"]
      },
      {
        "selector": "enum",
        "format": ["PascalCase"]
      },
      {
        "selector": "class",
        "format": ["PascalCase"]
      },
      {
        "selector": "variable",
        "modifiers": ["const"],
        "format": ["camelCase", "UPPER_CASE", "PascalCase"]
      }
    ],

    // Import Rules
    "import/order": ["error", {
      "groups": [
        "builtin",
        "external",
        "internal",
        "parent",
        "sibling",
        "index"
      ],
      "newlines-between": "always",
      "alphabetize": {
        "order": "asc",
        "caseInsensitive": true
      }
    }],
    "import/no-unresolved": "error",
    "import/no-cycle": "error",
    "import/no-unused-modules": "error",
    "import/no-deprecated": "warn",

    // Promise Rules
    "promise/always-return": "error",
    "promise/catch-or-return": "error",
    "promise/no-nesting": "warn",

    // Unicorn Rules (Selective)
    "unicorn/prevent-abbreviations": ["error", {
      "allowList": {
        "args": true,
        "props": true,
        "ref": true,
        "params": true,
        "ctx": true,
        "req": true,
        "res": true
      }
    }],
    "unicorn/filename-case": ["error", {
      "case": "pascalCase",
      "ignore": [
        "^index\\.ts$",
        ".*\\.test\\.ts$",
        ".*\\.spec\\.ts$"
      ]
    }],

    // General Code Quality
    "no-console": ["warn", {
      "allow": ["warn", "error"]
    }],
    "no-debugger": "error",
    "no-alert": "error",
    "no-var": "error",
    "prefer-const": "error",
    "prefer-arrow-callback": "error",
    "prefer-template": "error",
    "object-shorthand": "error",
    "quote-props": ["error", "as-needed"],
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"],
    "brace-style": ["error", "1tbs"],
    "max-len": ["warn", {
      "code": 120,
      "ignoreUrls": true,
      "ignoreStrings": true,
      "ignoreTemplateLiterals": true
    }],
    "max-lines": ["warn", {
      "max": 500,
      "skipBlankLines": true,
      "skipComments": true
    }],
    "max-lines-per-function": ["warn", {
      "max": 100,
      "skipBlankLines": true,
      "skipComments": true
    }],
    "complexity": ["warn", 10],
    "max-depth": ["warn", 4],
    "max-params": ["warn", 4],
    "max-nested-callbacks": ["warn", 3]
  },
  "overrides": [
    {
      "files": ["*.test.ts", "*.spec.ts"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "max-lines-per-function": "off"
      }
    }
  ]
}
```

## Prettier Configuration

### .prettierrc.json

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "quoteProps": "as-needed"
}
```

### .prettierignore

```
dist/
node_modules/
coverage/
*.min.js
*.lock
package-lock.json
```

## Code Review Checklist

### Functionality
- [ ] Code implements requirements correctly
- [ ] All edge cases handled
- [ ] Error handling comprehensive
- [ ] No hardcoded values (use constants/config)
- [ ] No TODO/FIXME comments without issues

### Testing
- [ ] Unit tests cover all functions
- [ ] Integration tests cover workflows
- [ ] Test coverage >90% (lines and branches)
- [ ] Tests are deterministic (no flaky tests)
- [ ] Mock dependencies appropriately
- [ ] Tests have clear descriptions

### Type Safety
- [ ] No `any` types (unless absolutely necessary)
- [ ] All function signatures typed
- [ ] Generic types used appropriately
- [ ] Type assertions justified
- [ ] No type casting without validation

### Performance
- [ ] No unnecessary loops or iterations
- [ ] Async/await used correctly
- [ ] No blocking operations in hot paths
- [ ] Memory leaks prevented
- [ ] Resources cleaned up properly
- [ ] Database queries optimized

### Security
- [ ] Input validation implemented
- [ ] No SQL/command injection vulnerabilities
- [ ] Credentials not hardcoded
- [ ] Sensitive data encrypted
- [ ] OWASP Top 10 considerations addressed

### Code Style
- [ ] Follows naming conventions
- [ ] Functions are small and focused
- [ ] No code duplication
- [ ] Comments explain "why", not "what"
- [ ] Complex logic documented
- [ ] ESLint warnings addressed
- [ ] Prettier formatting applied

### Documentation
- [ ] TSDoc comments on public APIs
- [ ] README updated if needed
- [ ] Examples provided for complex features
- [ ] CHANGELOG.md updated
- [ ] Architecture docs updated if design changed

### Dependencies
- [ ] New dependencies justified
- [ ] No vulnerable dependencies
- [ ] Dependencies pinned or ranged appropriately
- [ ] Peer dependencies specified

### Git
- [ ] Commits are atomic
- [ ] Commit messages follow conventional commits
- [ ] No sensitive data in commits
- [ ] Branch name descriptive

## Documentation Standards

### TSDoc Comments

```typescript
/**
 * Navigates the browser to a specified URL with customizable options.
 *
 * This method handles navigation, waits for load events, and provides
 * detailed results including status codes and timing information.
 *
 * @param url - The target URL to navigate to (must be valid HTTP/HTTPS)
 * @param options - Optional navigation configuration
 * @param options.waitUntil - Wait strategy: 'load' | 'domcontentloaded' | 'networkidle'
 * @param options.timeout - Maximum navigation time in milliseconds (default: 30000)
 * @param options.referer - Optional referer header value
 *
 * @returns Promise resolving to navigation result with status and timing
 *
 * @throws {NavigationError} If navigation fails or times out
 * @throws {ValidationError} If URL is invalid
 *
 * @example
 * ```typescript
 * // Basic navigation
 * const result = await pageController.navigate('https://example.com');
 * console.log(result.status); // 200
 *
 * // With options
 * const result = await pageController.navigate('https://example.com', {
 *   waitUntil: 'networkidle',
 *   timeout: 60000
 * });
 * ```
 *
 * @see {@link NavigateOptions} for detailed option descriptions
 * @see {@link NavigateResult} for result structure
 *
 * @since 1.0.0
 * @public
 */
async navigate(
  url: string,
  options?: INavigateOptions
): Promise<INavigateResult> {
  // Implementation
}
```

### Interface Documentation

```typescript
/**
 * Configuration options for browser navigation.
 *
 * @public
 */
export interface INavigateOptions {
  /**
   * Determines when navigation is considered complete.
   *
   * - `load`: Wait for window.onload event
   * - `domcontentloaded`: Wait for DOMContentLoaded event
   * - `networkidle`: Wait until no network connections for 500ms
   *
   * @defaultValue 'load'
   */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';

  /**
   * Maximum time to wait for navigation in milliseconds.
   *
   * @defaultValue 30000
   */
  timeout?: number;

  /**
   * Referer header value for the navigation request.
   *
   * @remarks
   * Some websites check the referer header for security.
   * Set this if navigating from another page context.
   */
  referer?: string;
}

/**
 * Result of a navigation operation.
 *
 * @public
 */
export interface INavigateResult {
  /** Whether navigation completed successfully */
  success: boolean;

  /** Final URL after redirects */
  url: string;

  /** HTTP status code (e.g., 200, 404) */
  status: number;

  /** Time taken for navigation in milliseconds */
  timing: number;

  /** Error details if navigation failed */
  error?: Error;
}
```

### Class Documentation

```typescript
/**
 * Manages Playwright browser instances and contexts.
 *
 * Provides lifecycle management for browsers, including launch,
 * context creation, and cleanup. Implements resource pooling
 * for efficient browser reuse.
 *
 * @remarks
 * This class follows the singleton pattern for browser instances.
 * Multiple contexts can be created from a single browser for isolation.
 *
 * @example
 * ```typescript
 * const manager = new BrowserManager({
 *   headless: true,
 *   browserType: 'chromium'
 * });
 *
 * const browser = await manager.launch();
 * const context = await manager.createContext({
 *   viewport: { width: 1920, height: 1080 }
 * });
 *
 * // Use context for automation
 *
 * await manager.closeAll();
 * ```
 *
 * @public
 */
export class BrowserManager extends EventEmitter {
  // Implementation
}
```

### File Header Template

```typescript
/**
 * @fileoverview Browser lifecycle management and context creation.
 *
 * This module provides the core browser management functionality,
 * including launching browsers, creating isolated contexts, and
 * managing browser resources efficiently.
 *
 * @module browser/BrowserManager
 * @author Playwright MCP Team
 * @since 1.0.0
 */
```

## Naming Conventions

### General Rules

```typescript
// ✅ GOOD: PascalCase for classes, interfaces, types, enums
class BrowserManager {}
interface INavigateOptions {}
type BrowserType = 'chromium' | 'firefox' | 'webkit';
enum NavigationState {}

// ✅ GOOD: camelCase for variables, functions, methods
const browserInstance = await launch();
function createContext() {}
async extractContent(): Promise<string> {}

// ✅ GOOD: UPPER_CASE for constants
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;

// ✅ GOOD: Prefix interfaces with 'I'
interface IToolDefinition {}
interface ISessionData {}

// ✅ GOOD: Descriptive names
const userCredentials = { username: '', password: '' };
const isNavigationComplete = await checkNavigation();

// ❌ BAD: Abbreviations
const usr = {}; // Use 'user'
const nav = {}; // Use 'navigation'
const ctx = {}; // Use 'context' (unless in very local scope)

// ❌ BAD: Single letter (except in loops/callbacks)
const x = getValue(); // Use descriptive name

// ✅ GOOD: Single letter in specific contexts
array.map((item, i) => {}); // 'i' for index is fine
for (let i = 0; i < 10; i++) {} // Loop counter is fine
```

### File Naming

```typescript
// ✅ GOOD: PascalCase for class files
BrowserManager.ts
PageController.ts
ElementLocator.ts

// ✅ GOOD: camelCase for utility files
logger.ts
validators.ts
helpers.ts

// ✅ GOOD: index.ts for barrel exports
index.ts

// ✅ GOOD: Test files match source files
BrowserManager.test.ts
PageController.test.ts

// ❌ BAD: Inconsistent casing
browserManager.ts
page_controller.ts
element-locator.ts
```

### Method Naming

```typescript
class BrowserManager {
  // ✅ GOOD: Verb-based for actions
  async launch(): Promise<Browser> {}
  async createContext(): Promise<BrowserContext> {}
  async closeAll(): Promise<void> {}

  // ✅ GOOD: Get prefix for accessors
  getActiveContexts(): BrowserContext[] {}
  getBrowser(): Browser | null {}

  // ✅ GOOD: Is/Has prefix for boolean
  isRunning(): boolean {}
  hasActiveContexts(): boolean {}

  // ✅ GOOD: Validate/Check prefix for validation
  validateConfig(config: Config): ValidationResult {}
  checkHealth(): Promise<boolean> {}

  // ❌ BAD: Noun-based
  browser(): Promise<Browser> {} // Use launch() or getBrowser()
  contexts(): BrowserContext[] {} // Use getActiveContexts()
}
```

## File Organization

### Project Structure

```
src/
├── index.ts                    # Main entry point, exports
├── cli.ts                      # CLI entry point
├── mcp/
│   ├── index.ts               # Barrel export
│   ├── MCPServer.ts           # Main MCP server
│   ├── ToolRegistry.ts        # Tool management
│   └── ToolHandler.ts         # Tool execution
├── browser/
│   ├── index.ts
│   ├── BrowserManager.ts      # Browser lifecycle
│   ├── BrowserPool.ts         # Connection pooling
│   └── SessionManager.ts      # Session management
├── page/
│   ├── index.ts
│   ├── PageController.ts      # Page operations
│   ├── NavigationHandler.ts   # Navigation logic
│   ├── TabManager.ts          # Multi-tab support
│   └── FrameManager.ts        # Frame handling
├── elements/
│   ├── index.ts
│   ├── ElementLocator.ts      # Finding elements
│   ├── ElementWaiter.ts       # Waiting strategies
│   └── SelectorBuilder.ts     # Selector utilities
├── actions/
│   ├── index.ts
│   ├── ActionExecutor.ts      # Main action handler
│   ├── ClickHandler.ts        # Click operations
│   ├── TypeHandler.ts         # Text input
│   └── UploadHandler.ts       # File uploads
├── extraction/
│   ├── index.ts
│   ├── ContentExtractor.ts    # Content extraction
│   ├── ScreenshotCapture.ts   # Screenshots
│   └── PDFGenerator.ts        # PDF generation
├── network/
│   ├── index.ts
│   ├── NetworkInterceptor.ts  # Request/response interception
│   └── TrafficMonitor.ts      # Network monitoring
├── session/
│   ├── index.ts
│   ├── CookieManager.ts       # Cookie handling
│   └── StorageManager.ts      # Local/session storage
├── coordination/
│   ├── index.ts
│   ├── MemoryHooks.ts         # Claude Flow integration
│   └── SwarmInterface.ts      # Multi-agent coordination
├── utils/
│   ├── index.ts
│   ├── Logger.ts              # Logging utility
│   ├── Validators.ts          # Input validation
│   └── Retry.ts               # Retry logic
├── errors/
│   ├── index.ts
│   ├── ErrorHierarchy.ts      # Custom errors
│   └── ErrorHandler.ts        # Global error handling
└── types/
    ├── index.ts               # Type barrel
    ├── browser.ts             # Browser types
    ├── tools.ts               # Tool types
    └── common.ts              # Shared types
```

### Import Ordering

```typescript
// 1. Node.js built-ins
import { EventEmitter } from 'events';
import { readFile } from 'fs/promises';

// 2. External dependencies
import { chromium, firefox, webkit } from 'playwright';
import type { Browser, BrowserContext } from 'playwright';

// 3. Internal modules (absolute paths)
import { Logger } from '../utils/Logger';
import { BrowserError } from '../errors/BrowserError';

// 4. Type imports (separate)
import type { IBrowserManagerConfig } from '../types/browser';
import type { ISession } from '../types/session';

// 5. Relative imports (same directory)
import { BrowserPool } from './BrowserPool';
import { SessionManager } from './SessionManager';
```

## Error Handling Patterns

### Custom Error Classes

```typescript
/**
 * Base error class for all Playwright MCP errors.
 *
 * @public
 */
export class PlaywrightMCPError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * Thrown when browser operations fail.
 *
 * @public
 */
export class BrowserError extends PlaywrightMCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'BROWSER_ERROR', details);
  }
}

/**
 * Thrown when navigation fails or times out.
 *
 * @public
 */
export class NavigationError extends PlaywrightMCPError {
  constructor(
    message: string,
    public readonly url: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'NAVIGATION_ERROR', { ...details, url });
  }
}
```

### Error Handling Best Practices

```typescript
// ✅ GOOD: Specific error types
async function navigate(url: string): Promise<void> {
  if (!isValidURL(url)) {
    throw new ValidationError(`Invalid URL: ${url}`, { url });
  }

  try {
    await page.goto(url, { timeout: 30000 });
  } catch (error) {
    if (error instanceof TimeoutError) {
      throw new NavigationError(
        `Navigation timeout for ${url}`,
        url,
        { timeout: 30000 }
      );
    }
    throw new BrowserError('Navigation failed', { url, cause: error });
  }
}

// ✅ GOOD: Error context
try {
  await someOperation();
} catch (error) {
  this.logger.error('Operation failed', {
    error,
    context: { operation: 'someOperation', timestamp: new Date() }
  });
  throw error;
}

// ❌ BAD: Silent failures
try {
  await riskyOperation();
} catch (error) {
  // Nothing - error silently swallowed
}

// ❌ BAD: Generic errors
throw new Error('Something went wrong'); // Too vague

// ❌ BAD: String throwing
throw 'Error message'; // Always throw Error objects
```

## Logging Standards

```typescript
/**
 * Structured logger with multiple levels.
 *
 * @public
 */
export class Logger {
  constructor(private readonly context: string) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  private log(
    level: string,
    message: string,
    meta?: Record<string, unknown>
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...meta,
    };

    console.log(JSON.stringify(logEntry));
  }
}

// Usage
const logger = new Logger('BrowserManager');

logger.info('Browser launched', {
  browserType: 'chromium',
  headless: true,
});

logger.error('Navigation failed', {
  url: 'https://example.com',
  error: error.message,
  stack: error.stack,
});
```

## Quality Gates

### Pre-commit
```bash
npm run lint
npm run typecheck
npm run test:unit
```

### Pre-push
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### CI/CD
```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run test:integration
npm run test:e2e
```

## Metrics & Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Test Coverage (Lines) | >90% | >80% |
| Test Coverage (Branches) | >85% | >75% |
| Cyclomatic Complexity | <10 | <15 |
| Max Function Length | <100 lines | <150 lines |
| Max File Length | <500 lines | <750 lines |
| Type Coverage | 100% | >95% |
| ESLint Warnings | 0 | <5 |
| Security Vulnerabilities | 0 | 0 |

## Tools Integration

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "build": "tsup",
    "quality": "npm run lint && npm run typecheck && npm run test:coverage"
  }
}
```

## Summary

Following these code quality standards ensures:
- ✅ Consistent, maintainable code
- ✅ Early bug detection
- ✅ Type safety throughout
- ✅ Comprehensive documentation
- ✅ Production-ready quality
