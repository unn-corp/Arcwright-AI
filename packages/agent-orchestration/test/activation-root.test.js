import { describe, expect, it } from 'vitest';
import activationRoot from '../lib/activation-root.js';

const { renderActivationRoot, renderActivationPath } = activationRoot;

describe('global activation roots', () => {
  const homes = {
    linux: '/home/alice',
    windows: '/mnt/c/Users/Alice',
    distro: 'Ubuntu 24.04',
  };

  it('keeps terminal tools on the Linux home', () => {
    expect(renderActivationRoot({ isGlobal: true, homes, platform: 'windows-wsl', tool: 'codex' }))
      .toBe('~/.arcwright');
  });

  it('renders Windows-readable WSL paths for GUI tools', () => {
    const options = { isGlobal: true, homes, platform: 'windows-wsl', tool: 'kiro' };
    expect(renderActivationRoot({ ...options, format: 'text' }))
      .toBe('//wsl.localhost/Ubuntu 24.04/home/alice/.arcwright');
    expect(renderActivationPath('awm/agents/dev.md', { ...options, format: 'file-uri' }))
      .toBe('file://wsl.localhost/Ubuntu%2024.04/home/alice/.arcwright/awm/agents/dev.md');
  });
});
