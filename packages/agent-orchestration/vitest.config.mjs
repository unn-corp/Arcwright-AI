import { defineConfig } from 'vitest/config';

// Vitest for @arcwright-ai/agent-orchestration.
// Coverage is scoped to the modules that currently have tests so the 80/80/70
// gate is meaningful and green. As tests are added for more of lib/, widen the
// `coverage.include` list (eventually drop it to cover all of lib/).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['lib/filter.js', 'lib/customization.js'],
      reporter: ['text', 'json-summary'],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
});
