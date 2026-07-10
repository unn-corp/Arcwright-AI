export interface IDE {
  id: string;
  name: string;
  flag: string;
}

export const ides: IDE[] = [
  { id: 'claude-code', name: 'Claude Code', flag: 'claude-code' },
  { id: 'kiro', name: 'Kiro', flag: 'kiro' },
  { id: 'codex', name: 'Codex', flag: 'codex' },
  { id: 'hermes', name: 'Hermes', flag: 'hermes' },
  { id: 'opencode', name: 'OpenCode', flag: 'opencode' },
  { id: 'grok', name: 'Grok', flag: 'grok' },
];
