'use strict';
/**
 * arcwright-package/lib/filter.js
 * Determines which files and directories to exclude from the generic Arcwright package.
 * Filters out Squidhub-specific content (unnportal, nautilus, squid-master, etc.)
 */

/**
 * Path segments that indicate a file/dir is Squidhub-specific.
 * Any file whose relative path contains one of these strings is excluded.
 */
const EXCLUDED_PATH_PATTERNS = [
  'squidhub',            // _arcwright/squidhub/ module
  'squid-master',        // squid-master agent and sidecar
  'tech-writer-sidecar', // project-specific sidecar
  'mcp-standards',       // _arcwright/awm/data/mcp-standards.md  (squidhub MCP docs)
  '.backup',             // stale backup files
  '.bak',                // stale backup files
];

/**
 * Content patterns that mark a file as Squidhub-specific.
 * If a text file's content matches any of these, it is excluded.
 */
const EXCLUDED_CONTENT_PATTERNS = [
  /squidhub 2\.1/i,
  /unnportal\.io/i,
  /nautilus/i,
  /squid-master/i,
  /UNN-\d+/,             // Linear issue references
  /mcp__squidhub__/i,    // Squidhub MCP tool calls
];

/**
 * Returns true if the given relative file path should be excluded.
 * @param {string} relPath - Path relative to the _arcwright/ root
 */
function isExcludedPath(relPath) {
  const normalized = relPath.replace(/\\/g, '/').toLowerCase();
  return EXCLUDED_PATH_PATTERNS.some(p => normalized.includes(p));
}

/**
 * Returns true if the file content contains Squidhub-specific markers.
 * Only called for text files.
 * @param {string} content - File content as string
 */
function isExcludedContent(content) {
  return EXCLUDED_CONTENT_PATTERNS.some(re => re.test(content));
}

/**
 * Text file extensions that should be scanned for content patterns.
 */
const TEXT_EXTENSIONS = new Set([
  '.md', '.yaml', '.yml', '.json', '.xml', '.csv', '.txt', '.js', '.sh',
]);

/**
 * Returns true if a file should be excluded from the generic package.
 * @param {string} relPath - Relative path from _arcwright/ root
 * @param {string|null} content - File content (null for binaries/unread)
 */
function shouldExclude(relPath, content = null) {
  if (isExcludedPath(relPath)) return true;
  if (content !== null) {
    const ext = relPath.substring(relPath.lastIndexOf('.')).toLowerCase();
    if (TEXT_EXTENSIONS.has(ext) && isExcludedContent(content)) return true;
  }
  return false;
}

module.exports = { shouldExclude, isExcludedPath, isExcludedContent, TEXT_EXTENSIONS };
