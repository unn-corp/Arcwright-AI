export type StepType =
  | 'normal'
  | 'review-gate'
  | 'approval'
  | 'merge'
  | 'scope-guard'
  | 'loop';

export type StepMode = 'split-pane' | 'in-process';

export interface WorkflowStep {
  label: string;
  type: StepType;
  agent?: string;
  mode?: StepMode;
  inputs?: string[];
  outputs?: string[];
  subAgents?: string[];
  optional?: boolean;
  loopTarget?: string;
  note?: string;
}

export interface WorkflowTrack {
  id: string;
  letter: string;
  name: string;
  score: string;
  scope: string;
  headerBg: string;
  headerText: string;
  accentColor: string;
  steps: WorkflowStep[];
}

export const workflows: WorkflowTrack[] = [
  {
    id: 'nano',
    letter: 'N',
    name: 'Nano',
    score: '0–1',
    scope: '≤20 lines, 1–2 files',
    headerBg: '#1a3d24',
    headerText: '#86efac',
    accentColor: '#86efac',
    steps: [
      {
        label: 'Quick Dev',
        type: 'normal',
        agent: 'quick-flow-solo-dev',
        mode: 'split-pane',
        inputs: ['task', 'branch', 'session'],
        outputs: ['code on branch'],
      },
      {
        label: 'Scope Guard',
        type: 'scope-guard',
        note: 'If >20 lines → HALT, upgrade to Small',
        optional: false,
      },
      {
        label: 'DRY + UV Gate',
        type: 'review-gate',
        agent: 'review agent',
        mode: 'in-process',
        subAgents: ['architect (DRY)', 'ux-designer (UV)'],
        note: 'Findings → quick-dev loop',
        loopTarget: 'Quick Dev',
      },
      {
        label: 'USER APPROVAL',
        type: 'approval',
      },
      {
        label: '/prepare-to-merge',
        type: 'merge',
        mode: 'in-process',
      },
    ],
  },
  {
    id: 'small',
    letter: 'S',
    name: 'Small',
    score: '2',
    scope: '2–4 files',
    headerBg: '#162d4a',
    headerText: '#93c5fd',
    accentColor: '#93c5fd',
    steps: [
      {
        label: 'Quick Spec',
        type: 'normal',
        agent: 'quick-flow-solo-dev',
        mode: 'in-process',
        outputs: ['quick-spec.md'],
      },
      {
        label: 'Quick Dev',
        type: 'normal',
        agent: 'quick-flow-solo-dev',
        mode: 'split-pane',
        inputs: ['quick-spec.md'],
        outputs: ['code on branch'],
      },
      {
        label: 'Review Gate',
        type: 'review-gate',
        agent: 'review agent',
        mode: 'in-process',
        subAgents: ['architect (AR+DRY)', 'ux-designer (UV)', 'security (SR)'],
        loopTarget: 'Quick Dev',
      },
      {
        label: 'QA Tests',
        type: 'normal',
        agent: 'qa-agent',
        mode: 'split-pane',
        outputs: ['.spec.ts'],
      },
      {
        label: 'USER APPROVAL',
        type: 'approval',
      },
      {
        label: '/prepare-to-merge',
        type: 'merge',
        mode: 'in-process',
      },
    ],
  },
  {
    id: 'compact',
    letter: 'C',
    name: 'Compact',
    score: '3',
    scope: '4–8 files',
    headerBg: '#112a2a',
    headerText: '#5eead4',
    accentColor: '#5eead4',
    steps: [
      {
        label: 'Quick Spec',
        type: 'normal',
        agent: 'quick-flow-solo-dev',
        mode: 'in-process',
        outputs: ['quick-spec.md'],
      },
      {
        label: 'Quick Research',
        type: 'normal',
        agent: 'analyst-agent',
        mode: 'in-process',
        outputs: ['research-report.md'],
        optional: true,
        note: 'Optional',
      },
      {
        label: 'Quick Dev',
        type: 'normal',
        agent: 'quick-flow-solo-dev',
        mode: 'split-pane',
        outputs: ['code on branch'],
      },
      {
        label: 'Review Gate',
        type: 'review-gate',
        agent: 'review agent',
        mode: 'in-process',
        subAgents: ['architect (AR+DRY)', 'ux-designer (UV)', 'security (SR)'],
        loopTarget: 'Quick Dev',
      },
      {
        label: 'QA Tests',
        type: 'normal',
        agent: 'qa-agent',
        mode: 'split-pane',
        outputs: ['.spec.ts'],
      },
      {
        label: 'USER APPROVAL',
        type: 'approval',
      },
      {
        label: '/prepare-to-merge',
        type: 'merge',
        mode: 'in-process',
      },
    ],
  },
  {
    id: 'medium',
    letter: 'M',
    name: 'Medium',
    score: '4–5',
    scope: '6–12 files',
    headerBg: '#332800',
    headerText: '#fde68a',
    accentColor: '#fde68a',
    steps: [
      {
        label: 'Quick Spec',
        type: 'normal',
        agent: 'quick-flow-solo-dev',
        mode: 'in-process',
        outputs: ['quick-spec.md'],
      },
      {
        label: 'Research',
        type: 'normal',
        agent: 'analyst-agent ×1–2',
        mode: 'in-process',
        outputs: ['research-report.md'],
      },
      {
        label: 'UX Design',
        type: 'normal',
        agent: 'ux-designer-agent',
        mode: 'split-pane',
        outputs: ['ux-design.md'],
      },
      {
        label: 'Review Gate 1',
        type: 'review-gate',
        agent: 'review agent',
        mode: 'in-process',
        subAgents: ['architect (AR+DRY)', 'ux-designer (UV)', 'security (SR)'],
        note: 'Spec + UX review',
        loopTarget: 'Quick Spec',
      },
      {
        label: 'Quick Dev',
        type: 'normal',
        agent: 'quick-flow-solo-dev',
        mode: 'split-pane',
        outputs: ['code on branch'],
      },
      {
        label: 'Final Review Gate',
        type: 'review-gate',
        agent: 'review agent',
        mode: 'in-process',
        subAgents: ['architect (AR+DRY)', 'ux-designer (UV)', 'security (SR)'],
        loopTarget: 'Quick Dev',
      },
      {
        label: 'QA Tests',
        type: 'normal',
        agent: 'qa-agent',
        mode: 'split-pane',
        outputs: ['.spec.ts'],
      },
      {
        label: 'USER APPROVAL',
        type: 'approval',
      },
      {
        label: '/prepare-to-merge',
        type: 'merge',
        mode: 'in-process',
      },
    ],
  },
  {
    id: 'extended',
    letter: 'E',
    name: 'Extended',
    score: '6–7',
    scope: '10–16 files',
    headerBg: '#331f00',
    headerText: '#fdba74',
    accentColor: '#fdba74',
    steps: [
      {
        label: 'Quick Spec',
        type: 'normal',
        agent: 'quick-flow-solo-dev',
        mode: 'in-process',
        outputs: ['quick-spec.md'],
      },
      {
        label: 'Research ×2',
        type: 'normal',
        agent: 'analyst-agent ×2',
        mode: 'in-process',
        note: 'Codebase + domain',
        outputs: ['research-codebase.md', 'research-domain.md'],
      },
      {
        label: 'Create PRD',
        type: 'normal',
        agent: 'pm-agent',
        mode: 'split-pane',
        outputs: ['prd.md'],
      },
      {
        label: 'UX + Arch + Sprint',
        type: 'normal',
        agent: 'ux-designer → architect',
        mode: 'split-pane',
        note: 'Sequential',
        outputs: ['ux-design.md', 'arch-notes.md', 'sprint-plan.md'],
      },
      {
        label: 'Review Gate 1',
        type: 'review-gate',
        agent: 'review agent',
        mode: 'in-process',
        subAgents: ['architect (AR+DRY)', 'ux-designer (UV)', 'security (SR)'],
        note: 'Plans review',
        loopTarget: 'UX + Arch + Sprint',
      },
      {
        label: 'Dev',
        type: 'normal',
        agent: 'dev-agent',
        mode: 'split-pane',
        inputs: ['prd.md', 'ux-design.md', 'arch-notes.md', 'sprint-plan.md'],
        outputs: ['code on branch'],
      },
      {
        label: 'Review Gate 2',
        type: 'review-gate',
        agent: 'review agent',
        mode: 'in-process',
        subAgents: ['architect (AR+DRY)', 'ux-designer (UV)', 'security (SR)'],
        note: 'Code review',
        loopTarget: 'Dev',
      },
      {
        label: 'QA Tests',
        type: 'normal',
        agent: 'qa-agent',
        mode: 'split-pane',
        outputs: ['.spec.ts'],
      },
      {
        label: 'USER APPROVAL',
        type: 'approval',
      },
      {
        label: '/prepare-to-merge',
        type: 'merge',
        mode: 'in-process',
      },
    ],
  },
  {
    id: 'large',
    letter: 'L',
    name: 'Large',
    score: '8+',
    scope: '12+ files',
    headerBg: '#331010',
    headerText: '#fca5a5',
    accentColor: '#fca5a5',
    steps: [
      {
        label: 'Product Brief',
        type: 'normal',
        agent: 'pm-agent',
        mode: 'split-pane',
        outputs: ['product-brief.md'],
      },
      {
        label: 'Research ×3 (parallel)',
        type: 'normal',
        agent: 'analyst-agent ×3',
        mode: 'split-pane',
        note: 'MR + DR + TR in parallel',
        outputs: ['research-mr.md', 'research-dr.md', 'research-tr.md'],
      },
      {
        label: 'Create PRD',
        type: 'normal',
        agent: 'pm-agent',
        mode: 'split-pane',
        inputs: ['product-brief.md', 'research ×3'],
        outputs: ['prd.md'],
      },
      {
        label: 'Planning Gate',
        type: 'review-gate',
        agent: 'review agent',
        mode: 'in-process',
        subAgents: ['architect (DRY)', 'ux-designer (UV)'],
        note: '2-sub spec review',
      },
      {
        label: 'UX + Architecture (parallel)',
        type: 'normal',
        agent: 'ux-designer + architect',
        mode: 'split-pane',
        note: 'Parallel',
        outputs: ['ux-design.md', 'arch-notes.md'],
      },
      {
        label: 'Design Gate',
        type: 'review-gate',
        agent: 'review agent',
        mode: 'in-process',
        subAgents: ['architect (DRY)', 'ux-designer (UV)'],
        note: '2-sub design review',
      },
      {
        label: 'Epics & Stories',
        type: 'normal',
        agent: 'sm-agent',
        mode: 'split-pane',
        outputs: ['stories/epic-n/story-n.md'],
      },
      {
        label: 'Readiness Check',
        type: 'normal',
        agent: 'architect-agent',
        mode: 'in-process',
        note: 'Impl. readiness verdict',
      },
      {
        label: 'Sprint Plan',
        type: 'normal',
        agent: 'sm-agent',
        mode: 'split-pane',
        outputs: ['sprint-plan.md'],
      },
      {
        label: 'USER APPROVAL',
        type: 'approval',
        note: 'Before epic loop',
      },
      {
        label: 'Per-Story Loop',
        type: 'loop',
        agent: 'dev-agent + qa-agent',
        mode: 'split-pane',
        note: 'Loop until all stories done',
      },
      {
        label: 'Final Review Gate',
        type: 'review-gate',
        agent: 'review agent',
        mode: 'in-process',
        subAgents: ['architect (AR+DRY)', 'ux-designer (UV)', 'security (SR)'],
      },
      {
        label: 'Full QA Suite',
        type: 'normal',
        agent: 'qa-agent',
        mode: 'split-pane',
        outputs: ['.spec.ts suite'],
      },
      {
        label: 'USER APPROVAL',
        type: 'approval',
        note: 'Final',
      },
      {
        label: '/prepare-to-merge',
        type: 'merge',
        mode: 'in-process',
      },
    ],
  },
];
