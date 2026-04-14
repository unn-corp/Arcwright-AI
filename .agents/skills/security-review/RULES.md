# Security Review — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Report ONLY findings where input is confirmed attacker-controlled AND the vulnerable pattern is verified — do not pattern-match without tracing data flow
- Trace every suspect value to its origin before flagging: user request vs. server config/env var vs. hardcoded constant
- Values from `settings.*`, `os.environ`, config files, and hardcoded constants are server-controlled — do not flag as SSRF/injection/redirect vulnerabilities
- Framework auto-escaping (Django templates, React JSX, Vue `{{ }}`, ORM parameterized queries) negates XSS and SQLi — only flag when explicitly bypassed (`mark_safe`, `dangerouslySetInnerHTML`, `.raw()`, etc.)
- Do not flag test files, dead code, commented code, or code paths requiring prior authentication
- Always load the matching language guide and relevant reference files before reviewing
- Severity: Critical = no-auth RCE/SQLi/auth bypass; High = stored XSS/SSRF/IDOR; Medium = reflected XSS/CSRF/path traversal; Low = defense-in-depth only
- `eval(user_input)`, `pickle.loads(user_data)`, `yaml.load(user_data)`, `shell=True + user_input` are always Critical
- Hardcoded secrets (`password = "..."`, `api_key = "sk-..."`) are always Critical
- If unsure about exploitability, list under "Needs Verification" with a specific question — do not report as a finding

## Red Flags (stop and apply skill)
- Reviewing code for security without first reading what reaches that code
- Flagging `requests.get(settings.API_URL)` as SSRF
- Flagging Django `{{ var }}` as XSS without checking for `|safe` or `mark_safe`
- About to report a theoretical/best-practice issue as a vulnerability
