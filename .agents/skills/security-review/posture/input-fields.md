# 23. User Input & Form Field Security
**Maps to:** `references/xss.md`, `references/injection.md`, `references/misconfiguration.md`

**Principle:** every text field is an attack vector. The *injection mechanics* (SQLi, XSS,
command, template) are covered in **topics 3 & 4** — this topic covers the **input-field layer**
that those miss: where validation actually lives, the dangerous field types, character-set
attacks, the validator-as-attack-surface, and sensitive-field hygiene. Spans client **and**
server (so it's its own topic, not just the frontend section).

**Detect:** forms and `<input>`/`<textarea>`, controlled components, form libs (react-hook-form,
Formik, zod/yup resolvers), rich-text editors, markdown renderers, validation regexes.

## A. Client validation is UX — the server is the security boundary
**What good looks like:**
- Browser constraints (`required`, `maxlength`, `pattern`, type=email) and JS validation are for
  **user experience only**. *Every* field is **re-validated server-side** against an allowlist
  schema (topic 3) — an attacker skips the browser entirely (curl/Burp).
- Format fields (email/phone/URL/postcode) and numeric/enum fields are constrained server-side to
  their allowed shape and range, not just visually.

**Red flags:** field validated only in the browser, no server schema (**High**); server trusts a
hidden/disabled/readonly field's value (**Medium/High**).

## B. Output encoding per context (cross-ref topic 4)
The same field value must be encoded for the sink it lands in — HTML body, HTML attribute, JS
string, URL, CSS. Rely on framework auto-escaping; flag raw sinks
(`dangerouslySetInnerHTML`/`v-html`/`|safe`/`innerHTML`) fed by field input. *(Detail in topic 4.)*

## C. Rich-text / HTML input — the dangerous field type
**Detect:** `quill`, `tiptap`, `draft-js`, `ckeditor`, `tinymce`, `slate`, `contenteditable`,
`marked`, `markdown-it`, `remark`, `sanitize-html`, `DOMPurify`, `bleach`.

**What good looks like:**
- Fields that accept HTML/markdown are sanitized with an **allowlist sanitizer** (DOMPurify,
  sanitize-html, bleach) — never a hand-rolled regex. Sanitize **on render**, ideally also on store.
- Markdown rendered with raw-HTML passthrough **off** and `javascript:`/`data:` links blocked;
  `target=_blank` links get `rel="noopener noreferrer"`.

**Red flags:** WYSIWYG/markdown/contenteditable field rendered without an allowlist sanitizer →
**stored XSS** (**High**); regex used to "strip tags" (**Medium**, bypassable).

## D. Unicode, normalization & invisible-character attacks
**What good looks like:**
- Input is **Unicode-normalized** (NFC, or NFKC for identity fields) *before* validation, storage,
  and comparison — otherwise normalization-bypass and homoglyph attacks slip filters.
- Dangerous categories stripped/rejected where they matter: **zero-width** chars, **bidi/RTL
  override** (U+202A–U+202E, U+2066–U+2069 — used to spoof filenames/usernames and hide content),
  **null bytes** (`\x00` — truncation/path tricks).
- **Confusable/homoglyph** detection on identity fields (username, display name, email domain) to
  block impersonation (`раypal` with Cyrillic а, `admin` look-alikes).

**Red flags:** no normalization on username/email → spoofing & filter bypass (**Medium**); bidi/
zero-width/null bytes accepted in identity or filename fields (**Medium**).

## E. ReDoS — the validator is an attack surface
**What good looks like:** validation/sanitization regexes have no catastrophic backtracking
(nested quantifiers like `(a+)+`, `(.*)*`, overlapping alternations). A crafted field value must
not be able to hang the request thread. Use linear-time engines (RE2), `safe-regex` checks, input
length caps before regex, or library validators.

**Red flags:** user-reachable regex with nested/ambiguous quantifiers (**Medium** — ReDoS DoS).

## F. Sensitive-field hygiene (frontend)
**What good looks like:**
- Sensitive inputs (password, OTP, card, SSN): correct `autocomplete` (`new-password`/`one-time-code`,
  or `off` where appropriate); **never put secrets/PII in URL query strings** (they land in server
  logs, browser history, and `Referer`); consider `spellcheck="false"` on sensitive fields (text
  can be sent to cloud spellcheckers); mask on display.
- **Server-side length caps** on every text field (DoS / storage-abuse / log-flooding guard),
  independent of the client `maxlength`.

**Red flags:** secret/PII passed as a GET query param (**Medium/High**); no server-side length cap
on free-text fields (**Low/Medium**); password/secret field with autocomplete/caching that leaks.

**Tools / grep:**
```bash
grep -rniE "<input|<textarea|maxlength|pattern=|react-hook-form|formik|zod|yup|valibot|class-validator" --include=*.{html,jsx,tsx,vue,svelte,js,ts} . | head -40
grep -rniE "quill|tiptap|draft-js|ckeditor|tinymce|slate|contenteditable|marked|markdown-it|remark|sanitize-html|DOMPurify|bleach" --include=*.{js,ts,jsx,tsx,py} .
grep -rniE "normaliz|NFC|NFKC|unicodedata|\\\\u20[0-6][0-9A-Fa-f]|zero.?width|homoglyph|confusable|\\\\x00|\\\\0\b" --include=*.{js,ts,py,go} .
# ReDoS candidate patterns
grep -rniE "new RegExp\(|re\.compile|\(\.\*\)\+|\(\.\+\)\+|\(\[\^?.*\]\+\)\+|\(\w\+\)\+" --include=*.{js,ts,py} .
# Secrets/PII in URL query
# Filenames only: query strings can contain credential values
rg -l -i '[?&](password|passwd|pwd|token|otp|ssn|card|cvv|secret|api_?key)=' --glob '*.{js,ts,py,go,html}' .
command -v semgrep >/dev/null && semgrep --config p/xss --config p/react 2>/dev/null | tail -25
```

**Verdict guidance:**
- ✅ **Pass** — server-side schema validation on every field, rich-text allowlist-sanitized,
  input normalized + dangerous chars handled, no ReDoS-prone validators, sensitive-field hygiene.
- ⚠️ **Weak** — server validation present but no normalization/confusable handling, or sensitive
  data occasionally in query params, or rich-text sanitized only on render.
- ❌ **Fail** — validation only client-side, or a rich-text/markdown field rendered unsanitized
  (stored XSS), or secrets in URL query strings.

Report findings as `SCAN-NN` with `file:line`.
