# Running Playwright Tests

Use the project's installed runner/script and start with the relevant file or named case. Check `playwright test --help` for version-specific flags. `npx --no-install` avoids an implicit download. To avoid opening the interactive HTML report, set `PLAYWRIGHT_HTML_OPEN=never`.

```bash
# Focused regression first
PLAYWRIGHT_HTML_OPEN=never npx --no-install playwright test tests/checkout.spec.ts -g 'declines invalid payment'

# Rerun prior failures when supported
PLAYWRIGHT_HTML_OPEN=never npx --no-install playwright test --last-failed

# Optional changed-test selection when supported
PLAYWRIGHT_HTML_OPEN=never npx --no-install playwright test --only-changed

# Required broader gate after focused verification
PLAYWRIGHT_HTML_OPEN=never npm run special-test-command
```

`--only-changed` uses Git to select changed test files; it does not establish coverage of all changed application behavior. Include tests for affected contracts even if their files did not change. Preserve repository-required gates. Collect traces on failure/retry; repeated runs are for suspected flakiness rather than an unconditional completion ritual.

# Debugging Playwright Tests

To debug a failing Playwright test, run it with `--debug=cli` option. This command will pause the test at the start and print the debugging instructions.

**IMPORTANT**: run the command in the background and check the output until "Debugging Instructions" is printed. Make sure to stop the command after you have finished.

Once instructions containing a session name are printed, use `playwright-cli` to attach the session and explore the page.

```bash
# Run the test
PLAYWRIGHT_HTML_OPEN=never npx playwright test --debug=cli
# ...
# ... debugging instructions for "tw-abcdef" session ...
# ...

# Attach to the test
playwright-cli attach tw-abcdef
```

Keep the test running in the background while you explore and look for a fix.
The test is paused at the start, so you should step over or pause at a particular location
where the problem is most likely to be.

Every action you perform with `playwright-cli` generates corresponding Playwright TypeScript code.
This code appears in the output and can be copied directly into the test. Most of the time, a specific locator or an expectation should be updated, but it could also be a bug in the app. Use your judgement.

After fixing the test, stop the background test run. Rerun to check that test passes.
