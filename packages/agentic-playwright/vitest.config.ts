/**
 * Vitest Configuration for Agentic Playwright
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Test environment
    globals: true,
    environment: 'node',

    // Include test files
    include: ['tests/**/*.test.ts'],

    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      '.claude/**'
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        '**/*.test.ts',
        '**/*.config.ts',
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/cli.ts',
        'src/mcp/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },

    // Timeouts
    testTimeout: 30000,
    hookTimeout: 30000,

    // Reporters
    reporters: ['verbose'],

    // Mock reset
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,

    // Skip browser tests by default in CI
    env: {
      SKIP_BROWSER_TESTS: process.env.CI === 'true' ? 'true' : 'false'
    }
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
