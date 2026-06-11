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
    filePath = ti.file_path || ti.path || '';
    content = ti.content || ti.new_string || '';
  } catch {
    process.exit(0);
  }

  const pathBlocks = [
    [/(^|\/)\.env(\.[\w.-]+)?$/, '.env file'],
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
