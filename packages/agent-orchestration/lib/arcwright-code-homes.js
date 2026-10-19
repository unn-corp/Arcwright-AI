'use strict';
// Placeholder: replaced by the Codex home health branch at integration.
const fs = require('fs-extra');
const path = require('path');
async function readArcwrightCodeHomes({ homeDir, settingsPaths = [path.join(homeDir, '.t3', 'userdata', 'settings.json')] }) {
  // Fail closed while the real reader is not integrated: existing settings imply unknown ownership.
  for (const file of settingsPaths) if (await fs.pathExists(file)) return { status: 'unreadable', codex: [], claude: [] };
  return { status: 'missing', codex: [], claude: [] };
}
module.exports = { readArcwrightCodeHomes };
