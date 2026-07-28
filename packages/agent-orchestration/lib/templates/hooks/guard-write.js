#!/usr/bin/env node
/**
 * Arcwright PreToolUse(Write|Edit) guard. Blocks writes that target obvious
 * secret/key files or whose content carries a high-confidence credential
 * (private key block, AWS access key id). Exits 2 to deny. Conservative —
 * avoids false positives on ordinary .env edits unless a real secret is present.
 */
'use strict';

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let filePath = '';
  let content = '';
  try {
    const p = JSON.parse(raw || '{}');
    const ti = p.tool_input || {};
    filePath = ti.file_path || ti.path || ti.notebook_path || '';
    // The settings.json matcher is the regex `Write|Edit`, which also selects
    // MultiEdit and NotebookEdit — and those carry the new text under different
    // keys. Reading only `content`/`new_string` meant a credential written via
    // MultiEdit reached disk with the content scan silently skipped.
    content = [
      ti.content,
      ti.new_string,
      ti.new_source,
      ...(Array.isArray(ti.edits) ? ti.edits.map((e) => e && e.new_string) : []),
    ]
      .filter((s) => typeof s === 'string')
      .join('\n');
  } catch {
    process.exit(0);
  }

  const pathBlocks = [
    // Both dotenv spellings: the dotfile form (`.env`, `.env.production`) and
    // the extension form (`prod.env`, `config/local.env`). Only the first was
    // covered before, so a `<name>.env` holding the same credentials was
    // written without challenge. `.environment` / `env.ts` still do not match.
    [/(^|\/)(\.env(\.[\w.-]+)?|[\w.-]+\.env)$/, '.env file'],
    [/\.(pem|key|p12|pfx)$/, 'key material'],
    [/(^|\/)id_(rsa|ed25519|ecdsa)$/, 'SSH private key'],
    [/(^|\/)\.npmrc$/, '.npmrc (may hold auth tokens)'],
  ];
  for (const [re, why] of pathBlocks) {
    if (re.test(filePath)) {
      deny(`writing to ${why}: ${filePath}`);
    }
  }

  const secretBlocks = [
    [/-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/, 'private key block'],
    [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key id'],
    [/\bgh[pousr]_[A-Za-z0-9]{30,}\b/, 'GitHub token'],
    [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/, 'Slack token'],
  ];
  for (const [re, why] of secretBlocks) {
    if (re.test(content)) {
      deny(`content contains a ${why} — do not commit secrets to files`);
    }
  }
  process.exit(0);

  function deny(reason) {
    process.stderr.write(
      `Arcwright hook blocked a write (${reason}).\n` +
        `If intentional, edit the file manually or disable the Arcwright write guard in .claude/settings.json.\n`
    );
    process.exit(2);
  }
});
