import { defineConfig } from 'vitest/config';

const coverageSuite = process.env.ARCWRIGHT_COVERAGE_SUITE;
const focusedCoverage = coverageSuite === 'focused';
const integrationCoverage = coverageSuite === 'integration';

const thresholds = {
  'lib/customization.js': { lines: 95, functions: 100, branches: 90, statements: 95 },
  // Raised after install() integration tests exercise the full project/global/
  // update/BMAD/hooks flows end to end.
  'lib/installer.js': { lines: 55, functions: 80, branches: 44, statements: 52 },
  'lib/managed-md.js': { lines: 90, functions: 100, branches: 85, statements: 90 },
  // migrate.js had no tests until the dry-run duplicate-reporting bug surfaced.
  // Raise this floor as cleanupConfig and the remaining CLI paths gain tests.
  'lib/migrate.js': { lines: 55, functions: 66, branches: 47, statements: 54 },
};

const focusedModules = ['lib/customization.js', 'lib/migrate.js'];
const integrationModules = ['lib/installer.js', 'lib/managed-md.js'];
const focusedTests = ['test/customization.test.js', 'test/migrate.test.js'];

// Vitest for @arcwright-ai/agent-orchestration.
// Coverage is scoped to the modules that currently have tests so the 80/80/70
// gate is meaningful and green. As tests are added for more of lib/, widen the
// `coverage.include` list (eventually drop it to cover all of lib/).
export default defineConfig({
  test: {
    environment: 'node',
    include: focusedCoverage ? focusedTests : ['test/**/*.test.js'],
    ...(integrationCoverage ? { exclude: focusedTests } : {}),
    // Run test files serially. The integration + platform suites share one
    // mutable resource (the built src/ tree): install.integration.test.js runs
    // `node build/build.js` which wipes and rebuilds src/, while the platform
    // writers read/write it. Parallel files race on that (ENOTEMPTY on the wipe,
    // or missing-file assertions on a concurrent read). Serial execution removes
    // the race; the suite is small so the wall-clock cost is negligible.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      // Vitest's V8 provider can replace CommonJS function ranges when the same
      // module is loaded by focused and integration workers. The coverage script
      // runs these disjoint groups separately so both reports are deterministic.
      include: focusedCoverage
        ? focusedModules
        : integrationCoverage
          ? integrationModules
          : [...focusedModules, ...integrationModules],
      reporter: ['text', 'json-summary'],
      ...(coverageSuite ? { reportsDirectory: `coverage/${coverageSuite}` } : {}),
      // Per-file thresholds: fully-covered pure modules hold the high bar; the
      // large installer.js has its many helpers covered but install()/uninstall()
      // and the IDE/Kiro writers still need integration fixtures — its floor
      // ratchets up as those land. Raise these as coverage grows; never lower.
      thresholds: focusedCoverage
        ? {
            'lib/customization.js': thresholds['lib/customization.js'],
            'lib/migrate.js': thresholds['lib/migrate.js'],
          }
        : integrationCoverage
          ? {
              'lib/installer.js': thresholds['lib/installer.js'],
              'lib/managed-md.js': thresholds['lib/managed-md.js'],
            }
          : thresholds,
    },
  },
});
