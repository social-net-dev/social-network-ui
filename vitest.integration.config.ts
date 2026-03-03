import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/integration/**/*.test.ts'],
    // Run tests sequentially — integration tests share backend state
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 15000,
    env: {
      VITE_API_BASE_URL: 'http://localhost:8000/api',
    },
  },
});
