# /playwright — Playwright QA Session

Start a Playwright browser automation session for testing the project's web UI. Uses the playwright-cli skill to drive a real browser and report results.

## Instructions

1. Load `.agents/skills/playwright-cli/SKILL.md` for the full Playwright CLI protocol.
2. Parse `the user's command input` for test instructions. Examples:
   - `http://localhost:3000` — navigate to URL, explore, report
   - `run auth flow` — execute the described user journey
   - `check the login page` — audit specific page behaviour
3. If `the user's command input` is empty, ask the user: "What do you want to test? Provide a URL, a user journey description, or a test file path."
4. Follow the playwright-cli skill to:
   - Launch a browser (default: chromium headless)
   - Navigate to the target URL or execute the described flow
   - Capture and report pass/fail results for each step
   - Screenshot any failures
5. Report results clearly: step-by-step pass/fail, any errors with context, and a summary.

## Arguments

`the user's command input` — URL to test, user journey description, or path to a Playwright test file. If empty, prompts for input.
