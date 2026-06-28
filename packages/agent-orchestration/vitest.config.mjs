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
      include: ['lib/filter.js', 'lib/customization.js', 'lib/installer.js'],
      reporter: ['text', 'json-summary'],
      // Per-file thresholds: fully-covered pure modules hold the high bar; the
      // large installer.js has its many helpers covered but install()/uninstall()
      // and the IDE/Kiro writers still need integration fixtures — its floor
      // ratchets up as those land. Raise these as coverage grows; never lower.
      thresholds: {
        'lib/filter.js': { lines: 100, functions: 100, branches: 90, statements: 100 },
        'lib/customization.js': { lines: 95, functions: 100, branches: 90, statements: 95 },
        'lib/installer.js': { lines: 20, functions: 40, branches: 10, statements: 20 },
      },
    },
  },
});
