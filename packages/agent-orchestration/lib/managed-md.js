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
/**
 * Index just past a managed block's end, given its start index. Includes the end
 * marker. If the end marker is missing (truncated file / partial migration),
 * strips to the next HTML comment or end of file as a defensive fallback.
 */
function blockEndIndex(text, startIdx, start, end) {
  const found = text.indexOf(end, startIdx + start.length);
  if (found !== -1) return found + end.length;
  const rest = text.slice(startIdx + start.length);
  const nextComment = rest.indexOf('<!-- ');
  return nextComment === -1 ? text.length : startIdx + start.length + nextComment;
}

/**
 * Ranges [start, endExclusive) of every current `<!-- name-start --> …
 * <!-- name-end -->` marker block in the text. Markerless legacy strips must
 * never begin inside (or run into) one of these — the legacy heading text can
 * legitimately appear inside a current managed block's content.
 */
function markerBlockRanges(text) {
  const ranges = [];
  const startRe = /<!--\s*([\w-]+)-start\s*-->/g;
  let m;
  while ((m = startRe.exec(text)) !== null) {
    const endMarker = `<!-- ${m[1]}-end -->`;
    const endIdx = text.indexOf(endMarker, m.index);
    ranges.push([m.index, endIdx === -1 ? text.length : endIdx + endMarker.length]);
  }
  return ranges;
}

async function cleanupManagedBlocks(filePath, markerPairs) {
  if (!await fs.pathExists(filePath)) return false;
  if (!markerPairs || markerPairs.length === 0) return false;

  const original = await fs.readFile(filePath, 'utf8');
  let cleaned = original;

  for (const { start, end } of markerPairs) {
    const markerless = !start.trimStart().startsWith('<!--');
    let startIdx = cleaned.indexOf(start);
    let endIdx;

    if (markerless) {
      // Legacy heading pairs: only strip occurrences OUTSIDE current marker
      // blocks, and never strip past the start of the next marker block.
      const ranges = markerBlockRanges(cleaned);
      const inBlock = idx => ranges.some(([s, e]) => idx >= s && idx < e);
      while (startIdx !== -1 && inBlock(startIdx)) {
        startIdx = cleaned.indexOf(start, startIdx + start.length);
      }
      if (startIdx === -1) continue;
      // Legacy `end` is the next section's heading — strip up to it, keep it.
      const endHeading = cleaned.indexOf(end, startIdx + start.length);
      endIdx = endHeading !== -1 ? endHeading : blockEndIndex(cleaned, startIdx, start, end);
      const laterStarts = ranges.map(([s]) => s).filter(s => s > startIdx);
      const nextBlockStart = laterStarts.length ? Math.min(...laterStarts) : undefined;
      if (nextBlockStart !== undefined && endIdx > nextBlockStart) {
        endIdx = nextBlockStart;
      }
    } else {
      if (startIdx === -1) continue;
      endIdx = blockEndIndex(cleaned, startIdx, start, end);
    }

    // Remove the block, then collapse the blank lines it left behind.
    cleaned = (cleaned.slice(0, startIdx) + cleaned.slice(endIdx)).replace(/(\n[ \t]*){3,}/g, '\n\n');
  }

  cleaned = cleaned.replace(/^\s+/, ''); // strip leading blank lines exposed

  if (cleaned === original) return false;
  await fs.writeFile(filePath, cleaned, 'utf8');
  return true;
}

module.exports = { upsertManagedBlock, cleanupManagedBlocks };
