// Synthetic adapter inputs: no private organization procedures or network calls.
import { afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import base from '../lib/installer.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(packageRoot, '../..');
const publicSource = path.join(packageRoot, 'src');
if (!fs.existsSync(publicSource)) execFileSync(process.execPath, ['build/build.js'], { cwd: repositoryRoot, stdio: 'pipe' });
const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-org-fixture-'));
afterAll(() => fs.rmSync(sourceDir, { recursive: true, force: true }));
fs.cpSync(publicSource, sourceDir, { recursive: true });
for (const relative of ['.agents/skills/unnamed-dev-mcp', '.agents/skills/unnamed-pm-sync', '.agents/skills/ufl-extract', 'unnamed-pm']) {
  fs.rmSync(path.join(sourceDir, relative), { recursive: true, force: true });
}
const put = (relative, content) => {
  const file = path.join(sourceDir, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};
for (const name of ['unnamed-dev-mcp', 'unnamed-pm-sync']) {
  put(`.agents/skills/${name}/SKILL.md`, `---\nname: ${name}\ndescription: Synthetic organization adapter fixture\n---\n\nUse the authorized fixture procedure.\n`);
  put(`.claude/commands/${name}.md`, `---\ndescription: Synthetic organization fixture\n---\n\nRead the installed ${name} skill.\n`);
}
put('unnamed-pm/config.yaml', 'project_name: Fixture\nuser_name: Fixture\ncommunication_language: English\noutput_folder: "{project-root}/_arcwright-output"\n');
put('unnamed-pm/agents/unnamed-pm.md', '---\nname: unnamed-pm\ndescription: Synthetic organization profile\n---\n<agent id="unnamed-pm" name="Fixture" title="Fixture"><activation>Execute the fixture task.</activation></agent>\n');
for (const name of ['unnamed-pm', 'arcwright-unnamed-pm', 'unnamed-dev-mcp']) {
  put(`.kiro/agents/${name}.json`, JSON.stringify({ name, description: 'Synthetic fixture', prompt: 'Read the supplied fixture procedure.', tools: ['fs_read'], includeMcpJson: true }));
}
put('.claude/commands/unnamed-pm.md', '---\ndescription: Synthetic organization profile\n---\nRead the installed fixture profile.\n');
put('.agents/skills/unnamed-dev-mcp/hooks/context-hook.js', '// Synthetic private-pack adapter input.\nprocess.exitCode = 0;\n');
put('.agents/skills/unnamed-dev-mcp/hooks/opencode-plugin.js', 'export default async function OrganizationFixture() { return {}; }\n');
put('.agents/skills/unnamed-dev-mcp/hooks/kiro-hooks.json', JSON.stringify({
  version: 'v1',
  hooks: [{ name: 'unnamed-dev-mcp', description: 'Synthetic organization fixture', trigger: 'SessionStart', agentPrompt: 'Read the supplied fixture procedure.' }],
}));

const installer = base.createInstaller({ sourceDir });
installer.sourceDir = sourceDir;
export { base as publicInstaller };
export default installer;
