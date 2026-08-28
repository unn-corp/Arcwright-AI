'use strict';

const path = require('node:path');
const { pathToFileURL } = require('node:url');

const PROJECT_TEXT_ROOT = '{project-root}/_arcwright';
const PROJECT_RULES_ROOT = '_arcwright';
const PROJECT_FILE_ROOT = 'file://_arcwright';
const GLOBAL_TEXT_ROOT = '~/.arcwright';

function globalActivationPath(homes) {
  if (!homes || typeof homes.linux !== 'string' || homes.linux.length === 0) {
    throw new TypeError('A Linux home is required to render a global Arcwright activation path');
  }
  return path.join(homes.linux, '.arcwright');
}

function renderActivationRoot({ isGlobal = false, homes, format = 'text' } = {}) {
  if (format === 'rules') return isGlobal ? GLOBAL_TEXT_ROOT : PROJECT_RULES_ROOT;
  if (format === 'text') return isGlobal ? GLOBAL_TEXT_ROOT : PROJECT_TEXT_ROOT;
  if (format === 'file-uri') {
    return isGlobal
      ? pathToFileURL(globalActivationPath(homes)).href.replace(/\/$/, '')
      : PROJECT_FILE_ROOT;
  }
  throw new RangeError(`Unknown Arcwright activation-root format: ${format}`);
}

function renderActivationPath(relativePath, options = {}) {
  if (typeof relativePath !== 'string' || relativePath.length === 0) {
    throw new TypeError('An Arcwright activation path must include a relative asset path');
  }
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.split('/').some((part) => part === '..' || part === '')) {
    throw new TypeError(`Invalid Arcwright activation path: ${relativePath}`);
  }

  if (options.isGlobal && options.format === 'file-uri') {
    return pathToFileURL(path.join(globalActivationPath(options.homes), ...normalized.split('/'))).href;
  }
  return `${renderActivationRoot(options)}/${normalized}`;
}

/**
 * Resolve project-shaped generated references when an asset is installed
 * globally. Project references remain unchanged so local installs preserve
 * their existing paths.
 */
function rewriteActivationReferences(content, options = {}) {
  if (!options.isGlobal || typeof content !== 'string') return content;
  const format = options.format || 'text';
  const projectRoot = renderActivationRoot({ format });
  const globalRoot = renderActivationRoot({ ...options, format });
  // Include the path separator so `_arcwright-output/` is not accidentally
  // rewritten along with activation paths.
  return content.replaceAll(`${projectRoot}/`, `${globalRoot}/`);
}

module.exports = {
  renderActivationRoot,
  renderActivationPath,
  rewriteActivationReferences,
};
