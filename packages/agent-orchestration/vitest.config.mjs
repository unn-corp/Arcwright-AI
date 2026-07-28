import { defineConfig } from 'vitest/config';

// Vitest for @arcwright-ai/agent-orchestration.
// Coverage is scoped to the modules that currently have tests so the 80/80/70
// gate is meaningful and green. As tests are added for more of lib/, widen the
// `coverage.include` list (eventually drop it to cover all of lib/).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    // Run test files serially. The integration + platform suites share one
    // mutable resource (the built src/ tree): install.integration.test.js runs
    // `node build/build.js` which wipes and rebuilds src/, while the platform
    // writers read/write it. Parallel files race on that (ENOTEMPTY on the wipe,
    // or missing-file assertions on a concurrent read). Serial execution removes
    // the race; the suite is small so the wall-clock cost is negligible.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['lib/customization.js', 'lib/installer.js', 'lib/managed-md.js', 'lib/migrate.js'],
      reporter: ['text', 'json-summary'],
      // Per-file thresholds: fully-covered pure modules hold the high bar; the
      // large installer.js has its many helpers covered but install()/uninstall()
      // and the IDE/Kiro writers still need integration fixtures — its floor
      // ratchets up as those land. Raise these as coverage grows; never lower.
      thresholds: {
        'lib/customization.js': { lines: 95, functions: 100, branches: 90, statements: 95 },
        // Raised after install() integration tests (test/install.integration.test.js)
        // exercise the full project/global/update/bmad/hooks flows end to end.
        'lib/installer.js': { lines: 55, functions: 80, branches: 44, statements: 52 },
        'lib/managed-md.js': { lines: 90, functions: 100, branches: 85, statements: 90 },
        // migrate.js had no tests at all until the dry-run duplicate-reporting
        // bug surfaced. Floor set just under current coverage; raise it as the
        // remaining branches (cleanupConfig, the CLI reporting paths) get tests.
        'lib/migrate.js': { lines: 55, functions: 66, branches: 47, statements: 54 },
      },
    },
  },
});
