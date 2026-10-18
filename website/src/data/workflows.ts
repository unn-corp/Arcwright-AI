// Workflow data for the website. Replaces the retired "track" system (nano /
// small / compact / medium / extended / large / rv) with four native
// orchestration runtimes plus an opt-in Herdr visibility layer. See
// `.agents/skills/triage/SKILL.md` and `.agents/skills/subagent-protocol/SKILL.md`.

export type WorkflowCategory = 'router' | 'runtime' | 'loop' | 'visibility';

export interface Workflow {
  slug: string;
  name: string;
  category: WorkflowCategory;
  trigger: string;          // command or trigger phrase
  description: string;      // 1-2 sentence summary
  bestFor: string;          // heuristic for when to reach for it
  icon?: string;            // lucide icon hint
}

export const workflows: Workflow[] = [
  {
    slug: 'triage',
    name: '/triage: Workflow Router',
    category: 'router',
    trigger: '/triage "<task>"',
    description:
      'Given a task, recommends the best runtime: plain in-process agent(s), an ultracode dynamic workflow, or a /goal loop. The entry point for ambiguous tasks.',
    bestFor:
      'Tasks where the right approach (single agent / multi-stage / loop) is unclear. Use this first.',
    icon: 'compass',
  },
  {
    slug: 'in-process',
    name: 'Plain In-Process Agent',
    category: 'runtime',
    trigger: 'Native subagent or Arcwright Code delegated task',
    description:
      'Delegate authorized specialist work through the shared subagent protocol. Reuse supported native agents; Arcwright Code review rounds use fresh delegated tasks with prior findings and evidence. Keep each task within its assigned scope.',
    bestFor:
      '1-10 files, single role or 2-3 disjoint roles, clear deliverable, no unknown-size discovery.',
    icon: 'cpu',
  },
  {
    slug: 'ultracode',
    name: 'ultracode Dynamic Workflow',
    category: 'runtime',
    trigger: 'ultracode <pipeline>',
    description:
      'Multi-stage and parallel work with explicit dependencies between stages. Stages fan out concurrently; dependent stages wait. For "I have a big problem and a clear shape."',
    bestFor:
      '12+ files, multi-stage, dependencies between stages; or unknown-size discovery (audits, sweeps) with loop-until-dry.',
    icon: 'workflow',
  },
  {
    slug: 'goal',
    name: '/goal Loop',
    category: 'loop',
    trigger: '/goal <condition>',
    description:
      'Keep working until a verification condition is true. Use when the completion condition is a check (tests pass, no type errors, lint clean), not a single deliverable.',
    bestFor:
      'Fix-all-N issues, make-X-pass loops, code-quality convergence.',
    icon: 'target',
  },
  {
    slug: 'herdr-opt-in',
    name: 'Herdr Opt-In Visibility',
    category: 'visibility',
    trigger: 'herdr agent start (when $HERDR_ENV is set)',
    description:
      'Watch agents work in split panes via Herdr (herdr.dev). Delegation follows the shared subagent protocol and the active host. Add visibility to an authorized workflow; it does not start extra reviews or expand the task.',
    bestFor:
      'When you want to see what agents are doing, or want a long-running task visible while you do other work.',
    icon: 'eye',
  },
];
