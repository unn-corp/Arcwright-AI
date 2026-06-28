'use strict';
const fs = require('fs');

/**
 * Detects the current platform.
 * @returns {'windows-wsl' | 'linux-native' | 'macos'}
 */
function detectPlatform() {
  // Allow override for testing. Accept both spellings used in the codebase
  // (Arcwright_PLATFORM and ARCWRIGHT_PLATFORM) so neither path regresses.
  if (process.env.Arcwright_PLATFORM) return process.env.Arcwright_PLATFORM;
  if (process.env.ARCWRIGHT_PLATFORM) return process.env.ARCWRIGHT_PLATFORM;
  if (process.platform === 'win32') return 'windows-wsl';
  if (process.platform === 'darwin') return 'macos';
  // On Linux: check /proc/version to distinguish WSL from native Linux
  try {
    const v = fs.readFileSync('/proc/version', 'utf8');
    if (v.toLowerCase().includes('microsoft')) return 'windows-wsl';
  } catch (_) {}
  return 'linux-native';
}

module.exports = { detectPlatform };
