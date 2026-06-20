# 24. Data Classification & Field-Level Encryption (Sensitive Data at Rest)
**Maps to:** `references/data-protection.md`, `references/cryptography.md` · OWASP A04:2025 Cryptographic Failures

**Principle:** whole-database at-rest encryption (topics 13/16) protects against stolen
disks/backups, but it's transparent — anyone with DB access reads plaintext. **Sensitive
fields need a second layer**: classify what you hold, encrypt the restricted subset at the
**column/field level**, tokenize what you shouldn't store at all, and manage the keys
properly. Splitting data into separate tables does **not** encrypt it — this topic is the
control that actually does.

**Detect:** models / ORM schemas / migrations and the columns they define; crypto usage;
PII-bearing fields.
```bash
# Sensitive columns in the data model
grep -rniE "ssn|social_?security|tax_?id|ein|passport|driver_?licen|dob|date_?of_?birth|bank|routing|account_?number|iban|sort_?code|card|cardnum|pan|cvv|cvc|salary|health|medical|diagnosis|biometric" --include=*.{sql,py,ts,js,go,rb,prisma} . | head -40
# Encryption usage + weak patterns
grep -rniE "pgcrypto|encrypt\(|createCipher\b|AES|GCM|ECB|Fernet|libsodium|nacl|sealedbox|KMS|envelope|crypto\.(create|subtle)" --include=*.{sql,py,ts,js,go,rb} . | head -30
```

## A. Data classification & minimization
**What good looks like:**
- Sensitive data is **identified and classified** (e.g. public / internal / confidential /
  restricted-PII), and the restricted set drives encryption, access, logging, and retention.
- **Minimization** — don't collect or store what isn't needed (no SSN "just in case"); derive
  or reference instead of duplicating sensitive values.
- **Retention & deletion** — PII has a defined lifetime and a deletion path (supports GDPR/CCPA
  right-to-erasure — defer detail to the dedicated compliance skills).

**Red flags:** sensitive PII collected with no apparent use (**Low/Medium**); no retention/
deletion path for PII (**Medium**, compliance exposure).

## B. Field-level encryption for restricted PII
**What good looks like:**
- Truly sensitive columns (SSN, bank/routing/account, tax id, government id, health) are
  **encrypted at the column level** — app-side (envelope encryption with a KMS data key) or
  `pgcrypto` — on top of at-rest encryption. Plaintext never lands in the column.
- **Authenticated encryption** (AES-GCM / libsodium/NaCl secretbox), not ECB, not a static IV.
  Randomized IV per value; deterministic encryption used **only** where a field must be
  searchable, and understood to leak equality.
- Decryption is scoped to the few code paths that need it; most reads use masked/tokenized values.

**Red flags:**
| Pattern | Severity |
|---------|----------|
| Restricted PII (SSN, bank, tax id) stored **plaintext** | **High** |
| **ECB mode**, static/hardcoded IV, or unauthenticated cipher for sensitive data | **High** |
| Deprecated `crypto.createCipher` (no IV) / `DES`/`RC4`/`MD5`-based crypto | **High** |
| Reversible encryption used where a one-way hash is correct (passwords → topic 2) | **High** |

## C. Tokenize what you shouldn't store
**What good looks like:**
- **Card PAN / CVV are never stored** in your own DB — use the processor's tokenization
  (Stripe tokens/PaymentMethods). Storing PANs pulls you into full PCI-DSS scope; CVV must
  never be persisted at all.
- Other high-risk values (full bank details for payouts) prefer a vault/processor token over
  raw storage where the provider supports it.

**Red flags:** card PAN or CVV persisted in the app database (**Critical** — PCI violation).

## D. Key management
**What good looks like:**
- Encryption keys live in **KMS / a secrets manager**, never in code or the same DB as the
  ciphertext (topic 7). **Envelope encryption**: a KMS master key wraps per-record/per-tenant
  data keys.
- Keys are rotatable without re-encrypting everything (key versioning/`key_id` column), distinct
  per environment, and access to decrypt is audited (topic 12).

**Red flags (Critical):** encryption key hardcoded in source or committed; key stored in the
same table/DB as the data it protects; one static key with no rotation path.

## E. Leakage of decrypted/derived data (cross-refs)
- Decrypted PII not written to **logs** (topic 12), **URLs/query strings** (topic 23), error
  messages (topic 8), analytics, or **LLM prompts / third-party APIs** (topic 22).
- Masked in UI and in exports/reports; backups inherit encryption.

**Tools (hybrid):**
```bash
command -v gitleaks >/dev/null && gitleaks detect --no-banner --redact 2>/dev/null | grep -iE "key|crypt" | head
grep -rniE "createCipher\b|ECB|iv\s*=\s*['\"]|MODE_ECB|DES\b|RC4|Blowfish" --include=*.{js,ts,py,go,java} .  # weak crypto
grep -rniE "card(num)?|pan\b|cvv|cvc" --include=*.{sql,py,ts,js,prisma} . | grep -viE "stripe|token|placeholder|wildcard|discard" | head
```

**Verdict guidance:**
- ✅ **Pass** — sensitive data classified & minimized, restricted PII column-encrypted with
  authenticated ciphers + KMS-managed keys, cards tokenized (not stored), no plaintext PII leakage.
- ⚠️ **Weak** — at-rest encryption on but some PII columns plaintext, or keys in a secrets
  manager but no rotation, or deterministic encryption used broadly.
- ❌ **Fail** — restricted PII (SSN/bank) plaintext, card PAN/CVV stored, hardcoded key, or
  ECB/static-IV crypto on sensitive data.

Report findings as `SCAN-NN` with `file:line`.
