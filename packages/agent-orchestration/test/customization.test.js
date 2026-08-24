import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadCustomization, mergeLayers, parseToml } from '../lib/customization.js';

describe('parseToml — scalars', () => {
  it('parses strings, ints, floats, booleans and null', () => {
    const out = parseToml(
      [
        'name = "arcwright"',
        "single = 'quoted'",
        'count = 7',
        'ratio = 1.5',
        'enabled = true',
        'disabled = false',
        'nothing = null',
      ].join('\n')
    );
    expect(out).toEqual({
      name: 'arcwright',
      single: 'quoted',
      count: 7,
      ratio: 1.5,
      enabled: true,
      disabled: false,
      nothing: null,
    });
  });

  it('falls back to a bare string for unquoted non-numeric values', () => {
    expect(parseToml('path = /usr/local/bin')).toEqual({ path: '/usr/local/bin' });
  });

  it('strips full-line and trailing comments', () => {
    const out = parseToml(['# a comment', 'key = "val"  # trailing', ''].join('\n'));
    expect(out).toEqual({ key: 'val' });
  });

  it('keeps a # inside a quoted string', () => {
    expect(parseToml('color = "#ff0000"')).toEqual({ color: '#ff0000' });
  });

  it('keeps comments inside double-quoted strings with escaped quotes', () => {
    expect(parseToml(String.raw`label = "say \"#still-text\"" # trailing`)).toEqual({
      label: String.raw`say \"#still-text\"`,
    });
  });

  it('skips blank and unparseable (no =) lines gracefully', () => {
    expect(parseToml(['', 'garbage line', 'k = 1'].join('\n'))).toEqual({ k: 1 });
  });
});

describe('parseToml — arrays and tables', () => {
  it('parses an inline array', () => {
    expect(parseToml('items = ["a", "b", 3]')).toEqual({ items: ['a', 'b', 3] });
  });

  it('parses an empty array', () => {
    expect(parseToml('items = []')).toEqual({ items: [] });
  });

  it('parses a multi-line array with trailing commas', () => {
    const out = parseToml(['items = [', '  "a",', '  "b",', ']'].join('\n'));
    expect(out).toEqual({ items: ['a', 'b'] });
  });

  it('consumes every line of a multi-line array of inline tables', () => {
    const out = parseToml([
      'agents = [',
      '  { id = "dev", model = "sonnet" },',
      '  { id = "qa", model = "haiku" },',
      ']',
    ].join('\n'));
    expect(out).toEqual({
      agents: [
        { id: 'dev', model: 'sonnet' },
        { id: 'qa', model: 'haiku' },
      ],
    });
  });

  it('preserves commas, brackets, and hashes inside single-quoted strings', () => {
    const out = parseToml([
      "items = ['a]', 'b,c'] # trailing comment",
      "point = { label = 'a,b#c', count = 2 }",
    ].join('\n'));
    expect(out).toEqual({
      items: ['a]', 'b,c'],
      point: { label: 'a,b#c', count: 2 },
    });
  });

  it('preserves escaped quotes and commas inside double-quoted array values', () => {
    expect(parseToml(String.raw`items = ["say \"hello, world\""]`)).toEqual({
      items: [String.raw`say \"hello, world\"`],
    });
  });

  it('rejects an unterminated array', () => {
    expect(() => parseToml('items = [\n  "a",')).toThrow('Unterminated array');
  });

  it('parses an inline table', () => {
    expect(parseToml('point = { x = 1, y = 2 }')).toEqual({ point: { x: 1, y: 2 } });
  });

  it('parses an empty inline table', () => {
    expect(parseToml('empty = {}')).toEqual({ empty: {} });
  });

  it('parses an array of inline tables (keyed entries)', () => {
    const out = parseToml('agents = [{ id = "dev", model = "sonnet" }, { id = "qa" }]');
    expect(out).toEqual({ agents: [{ id: 'dev', model: 'sonnet' }, { id: 'qa' }] });
  });
});

describe('parseToml — sections', () => {
  it('parses a [section] header', () => {
    const out = parseToml(['[server]', 'port = 8080', 'host = "local"'].join('\n'));
    expect(out).toEqual({ server: { port: 8080, host: 'local' } });
  });

  it('parses dotted section headers into nested objects', () => {
    const out = parseToml(['[a.b.c]', 'k = 1'].join('\n'));
    expect(out).toEqual({ a: { b: { c: { k: 1 } } } });
  });

  it('parses a [[table-array]] header', () => {
    const out = parseToml(
      ['[[items]]', 'name = "one"', '', '[[items]]', 'name = "two"'].join('\n')
    );
    expect(out).toEqual({ items: [{ name: 'one' }, { name: 'two' }] });
  });

  it('parses a nested [[table-array]] header', () => {
    const out = parseToml(['[[teams.members]]', 'name = "one"'].join('\n'));
    expect(out).toEqual({ teams: { members: [{ name: 'one' }] } });
  });
});

describe('mergeLayers — scalars and nested objects', () => {
  it('lets the higher layer win for scalar conflicts', () => {
    expect(mergeLayers({ a: 1, b: 2 }, { b: 3, c: 4 })).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('recurses into nested objects', () => {
    const merged = mergeLayers({ s: { x: 1, y: 2 } }, { s: { y: 9, z: 3 } });
    expect(merged).toEqual({ s: { x: 1, y: 9, z: 3 } });
  });

  it('replaces when the lower value is a non-object and higher is an object', () => {
    expect(mergeLayers({ s: 5 }, { s: { x: 1 } })).toEqual({ s: { x: 1 } });
  });

  it('returns b when either side is not a mergeable object', () => {
    expect(mergeLayers(null, { a: 1 })).toEqual({ a: 1 });
    expect(mergeLayers({ a: 1 }, null)).toBe(null);
    expect(mergeLayers(5, 6)).toBe(6);
  });

  it('does not mutate either input', () => {
    const a = { arr: [1], obj: { x: 1 } };
    const b = { obj: { y: 2 } };
    const snapA = JSON.stringify(a);
    const snapB = JSON.stringify(b);
    mergeLayers(a, b);
    expect(JSON.stringify(a)).toBe(snapA);
    expect(JSON.stringify(b)).toBe(snapB);
  });
});

describe('mergeLayers — arrays', () => {
  it('replaces a plain array by default', () => {
    expect(mergeLayers({ tags: ['a', 'b'] }, { tags: ['c'] })).toEqual({ tags: ['c'] });
  });

  it('accumulates when a <key>__append = true sibling is present', () => {
    const merged = mergeLayers(
      { tags: ['a', 'b'] },
      { tags: ['c', 'd'], tags__append: true }
    );
    expect(merged).toEqual({ tags: ['a', 'b', 'c', 'd'] });
  });

  it('appends onto an empty base when the base lacks the key', () => {
    const merged = mergeLayers({}, { tags: ['c'], tags__append: true });
    expect(merged).toEqual({ tags: ['c'] });
  });

  it('does not leak the __append sentinel into the result', () => {
    const merged = mergeLayers({ tags: [] }, { tags: ['x'], tags__append: true });
    expect(merged).not.toHaveProperty('tags__append');
  });

  it('match-and-patches keyed arrays by id', () => {
    const base = { agents: [{ id: 'dev', model: 'haiku' }, { id: 'qa', model: 'haiku' }] };
    const higher = { agents: [{ id: 'dev', model: 'sonnet' }] };
    expect(mergeLayers(base, higher)).toEqual({
      agents: [{ id: 'dev', model: 'sonnet' }, { id: 'qa', model: 'haiku' }],
    });
  });

  it('match-and-patches keyed arrays by name and appends unmatched entries', () => {
    const base = { teams: [{ name: 'review', size: 2 }] };
    const higher = { teams: [{ name: 'review', size: 5 }, { name: 'tdd', size: 3 }] };
    expect(mergeLayers(base, higher)).toEqual({
      teams: [{ name: 'review', size: 5 }, { name: 'tdd', size: 3 }],
    });
  });

  it('replaces (not patches) when arrays are not both keyed', () => {
    const base = { xs: [{ id: 'a' }] };
    const higher = { xs: [1, 2, 3] }; // higher is not a keyed array
    expect(mergeLayers(base, higher)).toEqual({ xs: [1, 2, 3] });
  });
});

describe('loadCustomization', () => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-custom-'));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const base = { model: 'haiku', features: ['a'], agents: [{ id: 'dev', model: 'haiku' }] };

  it('returns base unchanged when customDir is falsy', () => {
    expect(loadCustomization('awm', base, null)).toBe(base);
  });

  it('returns base unchanged when customDir does not exist', () => {
    expect(loadCustomization('awm', base, path.join(dir, 'nope'))).toBe(base);
  });

  it('returns base unchanged when no matching files are present', () => {
    expect(loadCustomization('awm', base, dir)).toBe(base);
  });

  it('applies team-level overrides from <name>.toml', () => {
    fs.writeFileSync(path.join(dir, 'awm.toml'), 'model = "sonnet"\n');
    expect(loadCustomization('awm', base, dir)).toMatchObject({ model: 'sonnet' });
  });

  it('layers user overrides on top of team (user wins)', () => {
    fs.writeFileSync(path.join(dir, 'awm.toml'), 'model = "sonnet"\n');
    fs.writeFileSync(path.join(dir, 'awm.user.toml'), 'model = "opus"\n');
    expect(loadCustomization('awm', base, dir)).toMatchObject({ model: 'opus' });
  });

  it('respects __append from a team file across base + team', () => {
    fs.writeFileSync(path.join(dir, 'awm.toml'), 'features = ["b"]\nfeatures__append = true\n');
    expect(loadCustomization('awm', base, dir).features).toEqual(['a', 'b']);
  });

  it('is non-fatal on malformed TOML and continues with the lower layer', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fs.writeFileSync(path.join(dir, 'awm.toml'), 'arr = [\n');
    const out = loadCustomization('awm', base, dir);
    expect(out).toMatchObject({ model: 'haiku' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Unterminated array'));
    warn.mockRestore();
  });
});
