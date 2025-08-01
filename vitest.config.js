import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.js",
    // Memory optimization settings
    pool: "forks", // Use forks instead of threads for better isolation
    poolOptions: {
      forks: {
        singleFork: true, // Run tests in single fork to reduce memory usage
      },
    },
    // Set lower concurrency
    maxConcurrency: 1,
    // Clear mocks between tests to prevent memory leaks
    clearMocks: true,
    restoreMocks: true,
    // Disable coverage to save memory
    coverage: {
      enabled: false,
    },
  },
});
