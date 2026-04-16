export interface Track {
  command: string;
  name: string;
  scope: string;
  pipeline: string;
  description: string;
}

export const tracks: Track[] = [
  {
    command: '/arcwright-track-nano',
    name: 'Nano',
    scope: '1–2 files, ≤20 lines',
    pipeline: 'Direct to Dev, no spec overhead',
    description: 'Direct to Dev — no spec overhead. Scope guard halts if changes exceed 20 lines.',
  },
  {
    command: '/arcwright-track-small',
    name: 'Small',
    scope: '2–4 files',
    pipeline: 'Spec → Dev → Review → QA',
    description: 'Spec → Dev → Review → QA. Three-sub review gate with AR+DRY, UV, and Security.',
  },
  {
    command: '/arcwright-track-compact',
    name: 'Compact',
    scope: '4–8 files',
    pipeline: 'Optional Research → Dev → Review → QA',
    description: 'Optional research step before Dev. Same 3-sub gate as Small.',
  },
  {
    command: '/arcwright-track-medium',
    name: 'Medium',
    scope: '6–12 files',
    pipeline: 'Spec → Research → UX → Review Gate → Dev → Final Gate → QA',
    description: 'Full Spec + Research + UX Design phase before Dev. Two review gates.',
  },
  {
    command: '/arcwright-track-extended',
    name: 'Extended',
    scope: '10–16 files',
    pipeline: 'PRD + arch notes, 2 review gates',
    description: 'PRD-driven. UX + Architecture notes + Sprint Plan before Dev. Two review gates.',
  },
  {
    command: '/arcwright-track-large',
    name: 'Large',
    scope: '12+ files',
    pipeline: 'Full planning, epic loop, parallel research, final gates',
    description: 'Full planning with epics/stories loop. Parallel research and parallel UX+Arch phases.',
  },
  {
    command: '/arcwright-track-rv',
    name: 'Review',
    scope: 'Any',
    pipeline: 'Audit → synthesize findings → route to fix path',
    description: 'Audit-first track. Synthesizes findings from codebase review and routes to the appropriate fix path.',
  },
];
