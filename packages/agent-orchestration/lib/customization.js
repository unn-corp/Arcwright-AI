'use strict';
/**
 * customization.js — 3-layer TOML customization system (Theme 6 / BMAD v6 parity)
 *
 * Resolution order (lowest → highest precedence):
 *   base (shipped defaults, hardcoded)
 *   < team  (_arcwright/custom/<name>.toml       or ~/.arcwright/custom/<name>.toml)
 *   < user  (_arcwright/custom/<name>.user.toml  or ~/.arcwright/custom/<name>.user.toml)
 *
 * Merge semantics:
 *   - Scalars (string/number/boolean): higher layer wins.
 *   - Plain arrays: higher layer replaces (no accumulation unless append key present).
 *   - Arrays with sibling `<key>__append = true`: values are accumulated
 *     (base + team + user each contribute; higher layer entries appended last).
 *   - Keyed arrays (array of objects): matched by `id` or `name` field; higher-layer
 *     entry with matching key deep-merges onto the lower-layer entry; unmatched
 *     entries are appended in source order.
 *
 * No TOML parser dependency is needed for npm publish because we bundle a minimal
 * subset reader here. The supported subset covers:
 *   - Bare key = scalar (string, integer, float, boolean)
 *   - Quoted strings  "..."
 *   - Inline arrays   [a, b, c]  or multi-line with trailing commas
 *   - Inline tables   {key = "val", ...}
 *   - Section headers [section] and table-array headers [[section]]
 *   - # comments and blank lines
 *
 * For richer TOML, add the `smol-toml` or `@iarna/toml` package to deps and replace
 * `parseToml` with `require('smol-toml').parse` — the rest of the module is agnostic.
 *
 * TODO(theme6-publish): when releasing full TOML support, add `smol-toml` to
 * package.json dependencies and swap the parseToml call.
 */

const fs   = require('fs');
const path = require('path');

// ─── Minimal TOML subset parser ───────────────────────────────────────────────

/**
 * Parse a minimal TOML subset. Supports scalars, strings, inline arrays,
 * inline tables, [section], [[table-array]], and # comments.
 * Throws on unsupported syntax with a descriptive message.
 *
 * @param {string} src — raw TOML text
 * @returns {object}
 */
function parseToml(src) {
  const lines  = src.split(/\r?\n/);
  const root   = {};
  let   ctx    = root;        // current insertion context
  let   arrCtx = null;        // current [[table-array]] target (array)

  for (let i = 0; i < lines.length; i++) {
    const raw  = lines[i];
    const line = raw.replace(/#(?=([^"]*"[^"]*")*[^"]*$).*$/, '').trim(); // strip comment

    if (!line) continue;

    // ── [[table-array]] header ────────────────────────────────────────────
    if (line.startsWith('[[') && line.endsWith(']]')) {
      const key = line.slice(2, -2).trim();
      const parts = key.split('.');
      let target = root;
      for (let p = 0; p < parts.length - 1; p++) {
        target = target[parts[p]] = target[parts[p]] || {};
      }
      const last = parts[parts.length - 1];
      if (!Array.isArray(target[last])) target[last] = [];
      arrCtx = target[last];
      ctx = {};
      arrCtx.push(ctx);
      continue;
    }

    // ── [section] header ─────────────────────────────────────────────────
    if (line.startsWith('[') && line.endsWith(']')) {
      arrCtx = null;
      const key = line.slice(1, -1).trim();
      const parts = key.split('.');
      ctx = root;
      for (const p of parts) {
        ctx[p] = ctx[p] || {};
        ctx = ctx[p];
      }
      continue;
    }

    // ── key = value ───────────────────────────────────────────────────────
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue; // skip unparseable line gracefully

    const rawKey = line.slice(0, eqIdx).trim();
    const rawVal = line.slice(eqIdx + 1).trim();

    ctx[rawKey] = parseTomlValue(rawVal, lines, i);
  }

  return root;
}

/**
 * Parse a single TOML value token (string, number, boolean, array, inline table).
 * Multi-line arrays are consumed from `lines` starting at `lineIdx`.
 *
 * @param {string} token
 * @param {string[]} lines
 * @param {number}  lineIdx
 * @returns {*}
 */
function parseTomlValue(token, lines, lineIdx) {
  if (token === 'true')  return true;
  if (token === 'false') return false;
  if (token === 'null')  return null;

  // Quoted string
  if ((token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'"))) {
    return token.slice(1, -1);
  }

  // Inline array (possibly multi-line — consume up to closing ']')
  if (token.startsWith('[')) {
    let collected = token;
    // If unclosed, gather continuation lines
    while (!isBalanced(collected) && lineIdx + 1 < lines.length) {
      lineIdx++;
      collected += ' ' + lines[lineIdx].replace(/#(?=([^"]*"[^"]*")*[^"]*$).*$/, '').trim();
    }
    return parseTomlArray(collected);
  }

  // Inline table
  if (token.startsWith('{') && token.endsWith('}')) {
    return parseInlineTable(token);
  }

  // Number
  const num = Number(token);
  if (!isNaN(num) && token !== '') return num;

  // Fallback: return as bare string (handles unquoted env values, paths, etc.)
  return token;
}

/** Returns true when brackets are balanced (for array accumulation). */
function isBalanced(s) {
  let depth = 0;
  let inStr = false;
  for (const ch of s) {
    if (ch === '"' && !inStr)  { inStr = true; continue; }
    if (ch === '"' && inStr)   { inStr = false; continue; }
    if (inStr) continue;
    if (ch === '[') depth++;
    if (ch === ']') depth--;
  }
  return depth === 0;
}

/**
 * Parse a TOML inline array token (e.g. `["a", "b", 1]`).
 * Handles nested arrays and inline tables.
 */
function parseTomlArray(token) {
  const inner = token.slice(1, -1).trim();
  if (!inner) return [];
  const items = splitTopLevel(inner, ',');
  return items.map(item => parseTomlValue(item.trim(), [], 0));
}

/** Parse an inline table `{key = val, ...}`. */
function parseInlineTable(token) {
  const inner = token.slice(1, -1).trim();
  if (!inner) return {};
  const pairs = splitTopLevel(inner, ',');
  const obj = {};
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const k = pair.slice(0, eqIdx).trim();
    const v = pair.slice(eqIdx + 1).trim();
    obj[k] = parseTomlValue(v, [], 0);
  }
  return obj;
}

/**
 * Split a string by `sep` at the top level (not inside brackets/strings).
 * Used to split comma-separated array items and inline-table pairs.
 */
function splitTopLevel(s, sep) {
  const parts = [];
  let depth = 0;
  let inStr = false;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' && !inStr) { inStr = true; cur += ch; continue; }
    if (ch === '"' && inStr)  { inStr = false; cur += ch; continue; }
    if (inStr) { cur += ch; continue; }
    if (ch === '[' || ch === '{') { depth++; cur += ch; continue; }
    if (ch === ']' || ch === '}') { depth--; cur += ch; continue; }
    if (ch === sep && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

// ─── Layer merge ──────────────────────────────────────────────────────────────

/**
 * Deep-merge two plain objects (b wins over a for scalar conflicts).
 * Array merge semantics:
 *   - `<key>__append = true` in b: concatenate a[key] + b[key], remove the flag.
 *   - Keyed arrays (objects with `id` or `name`): match-and-patch by id/name.
 *   - Otherwise: b replaces a (standard override).
 *
 * @param {object} a — lower-precedence layer
 * @param {object} b — higher-precedence layer
 * @returns {object} merged result (new object — neither a nor b is mutated)
 */
function mergeLayers(a, b) {
  if (typeof a !== 'object' || a === null) return b;
  if (typeof b !== 'object' || b === null) return b;

  const result = Object.assign({}, a);

  for (const [key, bVal] of Object.entries(b)) {
    // Skip __append sentinel keys (consumed separately below)
    if (key.endsWith('__append')) continue;

    const aVal = result[key];

    if (Array.isArray(bVal)) {
      const appendFlag = b[`${key}__append`] === true;
      if (appendFlag) {
        // Accumulate: base entries first, then higher-layer entries
        const baseArr = Array.isArray(aVal) ? aVal : [];
        result[key] = mergeArrays(baseArr, bVal);
      } else if (Array.isArray(aVal) && isKeyedArray(aVal) && isKeyedArray(bVal)) {
        // Keyed array: match-and-patch by id or name
        result[key] = mergeKeyedArrays(aVal, bVal);
      } else {
        // Default: higher layer replaces
        result[key] = bVal;
      }
    } else if (typeof bVal === 'object' && bVal !== null && !Array.isArray(bVal)) {
      // Recurse into nested objects
      result[key] = mergeLayers(typeof aVal === 'object' && aVal !== null ? aVal : {}, bVal);
    } else {
      // Scalar: b wins
      result[key] = bVal;
    }
  }

  return result;
}

/** Returns true if every element has an `id` or `name` field (keyed array). */
function isKeyedArray(arr) {
  return arr.length > 0 && arr.every(item => typeof item === 'object' && item !== null && ('id' in item || 'name' in item));
}

/** Concatenate two arrays (preserving order, no deduplication). */
function mergeArrays(base, higher) {
  return [...base, ...higher];
}

/**
 * Merge two keyed arrays by `id` or `name`.
 * - Entries in `higher` whose key matches an entry in `base`: deep-merge.
 * - Entries in `higher` with no matching key: appended.
 * - Entries in `base` with no match in `higher`: preserved as-is.
 */
function mergeKeyedArrays(base, higher) {
  const getKey = (item) => item.id ?? item.name;
  const result  = base.map(item => Object.assign({}, item));
  const indexed = new Map(result.map((item, i) => [String(getKey(item)), i]));

  for (const hItem of higher) {
    const hKey = String(getKey(hItem));
    if (indexed.has(hKey)) {
      const idx = indexed.get(hKey);
      result[idx] = mergeLayers(result[idx], hItem);
    } else {
      result.push(Object.assign({}, hItem));
    }
  }

  return result;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load and merge the three customization layers for `name` from `customDir`.
 *
 * Files resolved:
 *   team file : <customDir>/<name>.toml        (shared / team-level overrides)
 *   user file : <customDir>/<name>.user.toml   (personal overrides, git-ignored)
 *
 * Both files are optional. Missing files are silently skipped.
 * If neither file exists, returns `base` unchanged.
 *
 * @param {string} name       — config name (e.g. 'awm', 'core')
 * @param {object} base       — shipped defaults (plain object)
 * @param {string} customDir  — absolute path to the custom/ directory
 * @returns {object}          — merged configuration
 */
/**
 * Merge one optional TOML layer file onto `result`. Missing file → unchanged.
 * A parse error is non-fatal: warn and keep the lower layer.
 */
function applyTomlLayer(result, file) {
  if (!fs.existsSync(file)) return result;
  try {
    return mergeLayers(result, parseToml(fs.readFileSync(file, 'utf8')));
  } catch (err) {
    console.warn(`[arcwright/customization] Warning: failed to parse ${file}: ${err.message}`);
    return result;
  }
}

function loadCustomization(name, base, customDir) {
  if (!customDir || !fs.existsSync(customDir)) return base;

  // base < team (<name>.toml) < user (<name>.user.toml)
  let result = base;
  result = applyTomlLayer(result, path.join(customDir, `${name}.toml`));
  result = applyTomlLayer(result, path.join(customDir, `${name}.user.toml`));
  return result;
}

module.exports = { loadCustomization, mergeLayers, parseToml };
