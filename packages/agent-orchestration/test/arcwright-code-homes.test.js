import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readArcwrightCodeHomes } from '../lib/arcwright-code-homes.js';

let homeDir;
let settingsPath;
beforeEach(() => {
  homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-code-homes-'));
  settingsPath = path.join(homeDir, '.t3', 'userdata', 'settings.json');
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
});
afterEach(() => fs.rmSync(homeDir, { recursive: true, force: true }));

describe('readArcwrightCodeHomes', () => {
  it('returns only normalized home fields, including blank defaults and direct homes', () => {
    fs.writeFileSync(settingsPath, JSON.stringify({
      unrelated: { privateValue: 'unrelated-settings-value' },
      providerInstances: {
        personal: { driver: 'codex', config: { homePath: '  ', privateValue: 'ignored' } },
        work: { driver: 'codex', config: { homePath: '~/.codex-work', shadowHomePath: '~/.codex-shadow' } },
        relative: { driver: 'codex', config: { homePath: 'profiles/../.codex-relative', shadowHomePath: '' } },
        claude: { driver: 'claudeAgent', config: { homePath: '' } },
        claudeWork: { driver: 'claude', config: { homePath: '~/.claude-work' } },
        unknown: { driver: 'unrecognized', config: { homePath: '~/.ignored' } },
      },
    }));
    expect(readArcwrightCodeHomes({ homeDir })).toEqual({
      status: 'ok',
      codex: [
        { instanceId: 'personal', sharedHome: path.join(homeDir, '.codex'), shadowHome: null },
        { instanceId: 'work', sharedHome: path.join(homeDir, '.codex-work'), shadowHome: path.join(homeDir, '.codex-shadow') },
        { instanceId: 'relative', sharedHome: path.join(homeDir, '.codex-relative'), shadowHome: null },
      ],
      claude: [
        { instanceId: 'claude', home: path.join(homeDir, '.claude') },
        { instanceId: 'claudeWork', home: path.join(homeDir, '.claude-work') },
      ],
    });
  });

  it('reports missing files and supports explicitly supplied settings paths', () => {
    expect(readArcwrightCodeHomes({ homeDir })).toEqual({ status: 'missing', codex: [], claude: [] });
    const alternate = path.join(homeDir, 'dev-settings.json');
    fs.writeFileSync(alternate, JSON.stringify({ providerInstances: { dev: { driver: 'codex' } } }));
    expect(readArcwrightCodeHomes({ homeDir, settingsPaths: [settingsPath, alternate] })).toEqual({
      status: 'ok', codex: [{ instanceId: 'dev', sharedHome: path.join(homeDir, '.codex'), shadowHome: null }], claude: [],
    });
  });

  it('discards partial ownership on malformed or unreadable settings', () => {
    const valid = path.join(homeDir, 'valid.json');
    fs.writeFileSync(valid, JSON.stringify({ providerInstances: { dev: { driver: 'codex' } } }));
    fs.writeFileSync(settingsPath, '{ invalid settings');
    expect(readArcwrightCodeHomes({ homeDir, settingsPaths: [valid, settingsPath] }))
      .toEqual({ status: 'unreadable', codex: [], claude: [] });
    expect(readArcwrightCodeHomes({ homeDir, settingsPaths: [homeDir] }))
      .toEqual({ status: 'unreadable', codex: [], claude: [] });
  });
});
