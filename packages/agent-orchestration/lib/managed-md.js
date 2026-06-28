'use strict';
/**
 * managed-md.js — shared helpers for managing marked blocks inside text files
 * (CLAUDE.md, AGENTS.md, etc.). Extracted from installer.js and tmuxInstaller.js,
 * which each carried their own copy. A "managed block" is delimited by a
 * start/end marker pair so it can be inserted, replaced in place, or removed
 * without disturbing the rest of the file.
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * Upsert a managed block in a file using start/end markers.
 * - File missing: create with the block ('created')
 * - Markers present: replace content between them, removing stale content
 *   ('updated', or 'noop' when the result is byte-identical)
 * - Markers absent: append the block ('appended')
 *
 * @param {string} filePath
 * @param {string} startMarker
 * @param {string} endMarker
 * @param {string} content
 * @returns {Promise<'created'|'updated'|'noop'|'appended'>}
 */
async function upsertManagedBlock(filePath, startMarker, endMarker, content) {
  await fs.ensureDir(path.dirname(filePath));
  const block = `${startMarker}\n${content}\n${endMarker}`;

  if (!await fs.pathExists(filePath)) {
    await fs.writeFile(filePath, block + '\n', 'utf8');
    return 'created';
  }

  const existing = await fs.readFile(filePath, 'utf8');
  const startIdx = existing.indexOf(startMarker);
  const endIdx   = existing.indexOf(endMarker);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const replacement = existing.slice(0, startIdx) + block + existing.slice(endIdx + endMarker.length);
    if (replacement === existing) return 'noop';
    await fs.writeFile(filePath, replacement, 'utf8');
    return 'updated';
  }

  await fs.writeFile(filePath, existing.trimEnd() + '\n\n' + block + '\n', 'utf8');
  return 'appended';
}

/**
 * Strip one or more managed blocks from a file, identified by start/end marker
 * pairs. Defensive against a missing end marker (strips to the next HTML comment
 * or end of file). Collapses the blank lines a removed block leaves behind.
 *
 * @param {string} filePath
 * @param {Array<{start: string, end: string}>} markerPairs
 * @returns {Promise<boolean>} true if the file was changed
 */
async function cleanupManagedBlocks(filePath, markerPairs) {
  if (!await fs.pathExists(filePath)) return false;
  if (!markerPairs || markerPairs.length === 0) return false;

  const original = await fs.readFile(filePath, 'utf8');
  let cleaned = original;

  for (const { start, end } of markerPairs) {
    let startIdx = cleaned.indexOf(start);
    if (startIdx === -1) continue;

    let endIdx = cleaned.indexOf(end, startIdx + start.length);

    if (endIdx === -1) {
      // Defensive: start marker present but end marker missing.
      // Strip from start to the next HTML comment open (or end of file).
      const rest = cleaned.slice(startIdx + start.length);
      const nextComment = rest.indexOf('<!-- ');
      endIdx = nextComment === -1 ? cleaned.length : startIdx + start.length + nextComment;
    } else {
      endIdx = endIdx + end.length; // include the end marker in the slice
    }

    cleaned = cleaned.slice(0, startIdx) + cleaned.slice(endIdx);
    // Collapse any blank lines that the removed block left behind.
    cleaned = cleaned.replace(/(\n[ \t]*){3,}/g, '\n\n');
  }

  // Strip leading blank lines the removed block exposed.
  cleaned = cleaned.replace(/^\s+/, '');

  if (cleaned === original) return false;
  await fs.writeFile(filePath, cleaned, 'utf8');
  return true;
}

module.exports = { upsertManagedBlock, cleanupManagedBlocks };
