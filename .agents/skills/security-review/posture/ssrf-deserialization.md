# 20. SSRF & Insecure Deserialization
**Maps to:** `references/ssrf.md`, `references/deserialization.md`

Two classic, high-impact injection-adjacent classes. SSRF left OWASP's 2025 top-level list but
remains a real RCE/metadata-theft path; insecure deserialization is a reliable RCE primitive.

## A. Server-Side Request Forgery (SSRF)
**Detect:** outbound HTTP/fetch from the server, webhook/callback handlers, URL-preview /
image-proxy / PDF-render / import-from-URL features, anything fetching a user-supplied URL.

**Run:**
```bash
grep -rniE "requests\.(get|post)|httpx|urllib|fetch\(|axios|http\.(Get|NewRequest)|urlopen|HttpClient|got\(|node-fetch" --include=*.{js,ts,py,go,java} . | head -40
# Does the fetched URL trace back to user input? (inspect each hit)
grep -rniE "(url|uri|endpoint|callback|webhook|target|src|image|host)\s*=\s*(req|request|ctx|params|query|body|input)" --include=*.{js,ts,py,go} . | head -30
```

**What good looks like:**
- URLs for outbound calls come from **server config/constants**, not request input (see
  SKILL.md's attacker- vs server-controlled table — `settings.API_URL` is safe; `req.query.url` is not).
- When a user URL is genuinely required (webhooks, import): **allowlist** scheme (`https` only)
  and host/domain; **resolve DNS and block private/link-local ranges** (127/8, 10/8, 172.16/12,
  192.168/16, 169.254.169.254, `::1`, metadata IPs); disable redirects or re-validate each hop.
- Cloud metadata endpoint (169.254.169.254) is unreachable from the app (IMDSv2 required — topic 13).

**Red flags:**
| Pattern | Severity |
|---------|----------|
| `fetch`/`requests.get` on a user-supplied URL with no allowlist | **High** (Critical if it can reach cloud metadata) |
| User-controlled host in an internal service call | **High** |
| Open redirect feeding an outbound fetch; redirects followed without re-validation | **Medium/High** |

## B. Insecure Deserialization
**Detect:** deserialization of untrusted bytes — cookies, request bodies, cache entries, queues,
uploaded files.

**Run:**
```bash
grep -rniE "pickle\.loads|cPickle|yaml\.load\(|yaml\.unsafe_load|marshal\.loads|jsonpickle|dill\.load" --include=*.py .
grep -rniE "ObjectInputStream|readObject|XMLDecoder|readUnshared|SnakeYAML|Kryo" --include=*.java .
grep -rniE "unserialize\(|__wakeup|__destruct" --include=*.php .
grep -rniE "node-serialize|funcster|serialize-javascript|vm\.runInNewContext|eval\(" --include=*.{js,ts} .
```

**What good looks like:**
- Untrusted input is parsed with **safe, data-only formats** — `JSON.parse`, `yaml.safe_load`,
  schema-validated (topic 3). No native-object deserialization of attacker-controlled bytes.
- If a binary/object format is unavoidable: signed+verified payloads (HMAC) before deserializing,
  and type allowlists; never `pickle`/`ObjectInputStream`/`unserialize` on external data.
- Session/cookie data is signed (server-side or signed JWT — topic 5), not a raw serialized object.

**Red flags (Critical):**
| Pattern | Severity |
|---------|----------|
| `pickle.loads` / `yaml.load` (unsafe) / `marshal.loads` on request/cookie/file data | **Critical** |
| Java `ObjectInputStream.readObject` on untrusted bytes; `XMLDecoder` on user XML | **Critical** |
| PHP `unserialize()` on user input; JS `node-serialize`/`eval` of external data | **Critical** |

**Verdict guidance:**
- ✅ **Pass** — outbound URLs are server-controlled or allowlisted+private-range-blocked;
  untrusted data parsed only with safe data formats.
- ⚠️ **Weak** — user URL fetch with partial validation (scheme but no private-range block), or a
  binary deserializer used only on internally-trusted (but not signed) data.
- ❌ **Fail** — unrestricted SSRF (esp. reachable metadata), or native deserialization of
  attacker-controlled bytes.

Report findings as `SCAN-NN` with `file:line`.
