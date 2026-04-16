export interface IDE {
  id: string;
  name: string;
  flag: string;
}

export const ides: IDE[] = [
  { id: 'claude-code', name: 'Claude Code', flag: 'claude-code' },
  { id: 'kiro', name: 'Kiro', flag: 'kiro' },
];
