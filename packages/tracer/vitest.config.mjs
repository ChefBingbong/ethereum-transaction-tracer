import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 100_000,
    environment: 'node',
    include: ['**/*.test.ts', '**/*test.ts', './test/mytest.ts', './src/'],
  },
})
