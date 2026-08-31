import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { execSync } from 'node:child_process';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = path.resolve(PKG_ROOT, '..', '..');
const SRC_SKILLS = path.join(PKG_ROOT, 'src', '.agents', 'skills');
const ROUTER = path.join(PKG_ROOT, 'lib', 'templates', 'hooks', 'domain-router.js');
const ROUTE_FILES = [
  ['dynamodb-best-practices', 'dynamodb-context.js'],
  ['amplify-best-practices', 'amplify-context.js'],
  ['cloudfront-best-practices', 'cloudfront-context.js'],
  ['s3-best-practices', 's3-context.js'],
  ['aurora-db-best-practices', 'aurora-context.js'],
  ['ses-sns-smtp-best-practices', 'ses-sns-smtp-context.js'],
  ['eventbridge-best-practices', 'eventbridge-context.js'],
  ['cognito-best-practices', 'cognito-context.js'],
  ['lambda-best-practices', 'lambda-context.js'],
  ['step-functions-best-practices', 'step-functions-context.js'],
  ['amplify-best-practices', 'amplify-review.js'],
  ['cloudfront-best-practices', 'cloudfront-review.js'],
  ['s3-best-practices', 's3-review.js'],
  ['aurora-db-best-practices', 'aurora-review.js'],
  ['ses-sns-smtp-best-practices', 'ses-sns-smtp-review.js'],
  ['eventbridge-best-practices', 'eventbridge-review.js'],
  ['cognito-best-practices', 'cognito-review.js'],
  ['lambda-best-practices', 'lambda-review.js'],
  ['step-functions-best-practices', 'step-functions-review.js'],
];

let hookDir;

beforeAll(() => {
  if (!fs.existsSync(SRC_SKILLS)) execSync('node build/build.js', { cwd: REPO_ROOT, stdio: 'pipe' });
});

beforeEach(() => {
  hookDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-domain-router-'));
  fs.copyFileSync(ROUTER, path.join(hookDir, 'domain-router.js'));
  for (const [skill, file] of ROUTE_FILES) {
    fs.copyFileSync(path.join(SRC_SKILLS, skill, 'hooks', file), path.join(hookDir, file));
  }
});

afterEach(() => {
  fs.rmSync(hookDir, { recursive: true, force: true });
});

function runHook(payload) {
  return spawnSync(process.execPath, [path.join(hookDir, 'domain-router.js')], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
  });
}

describe('domain-router hook', () => {
  it('combines matching prompt routes into one output', () => {
    const result = runHook({
      hook_event_name: 'UserPromptSubmit',
      cwd: process.cwd(),
      prompt: 'Please fix the DynamoDB integration',
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim().split('\n')).toHaveLength(1);
    expect(result.stdout).toContain('dynamodb-best-practices');
  });

  it('stays silent for a conversational prompt', () => {
    const result = runHook({
      hook_event_name: 'UserPromptSubmit',
      cwd: process.cwd(),
      prompt: 'Thanks, that makes sense.',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
  });

  it('combines post-edit findings into one output', () => {
    const result = runHook({
      hook_event_name: 'PostToolUse',
      cwd: process.cwd(),
      tool_input: {
        file_path: 'amplify/backend.ts',
        content: 'ampx pipeline-deploy\n',
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim().split('\n')).toHaveLength(1);
    expect(result.stdout).toContain('[amplify]');
  });
});
