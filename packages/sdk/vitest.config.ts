import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global test timeout
    testTimeout: 60000, // 60 seconds
    hookTimeout: 60000,

    // Include test files
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],

    // Exclude files
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/docs/**',
      '**/.{idea,git,cache,output,temp}/**'
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts', 'src/types/**'],
      all: true,
      clean: true
    },

    // Reporter configuration
    reporters: ['verbose'],

    // Global setup/teardown
    // globalSetup: './tests/setup/global-setup.ts',
    // globalTeardown: './tests/setup/global-teardown.ts',

    // Sequence configuration
    sequence: {
      // Tests can run in parallel by default
      concurrent: true,
      // But some tests may need to run serially
      shuffle: false
    },

    // Retry failed tests
    retry: 0,

    // Run tests in serial or parallel
    // Set to true for integration tests that interact with blockchain
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Force single thread execution
        maxThreads: 1, // Limit to 1 thread
        minThreads: 1
      }
    },

    // Run test files sequentially (one at a time)
    fileParallelism: false,
    maxConcurrency: 1
  },

  // SSR configuration to handle problematic dependencies
  ssr: {
    noExternal: ['@0xobelisk/graphql-client', '@apollo/client']
  },

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
