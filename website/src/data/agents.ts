export interface Agent {
  name: string;
  role: string;
  icon: string;
  description: string;
  primarySkills: string[];
  collaboratesWith: string[];
}

export const agents: Agent[] = [
  {
    name: 'Analyst',
    role: 'Requirements & Research',
    icon: 'Search',
    description:
      'Conducts deep codebase exploration, competitive research, and technical domain analysis. Produces structured research reports that feed into specs, PRDs, and architecture decisions. Runs in-process, often in parallel with other analysts during research and planning.',
    primarySkills: ['systematic-debugging', 'project-context', 'typescript-best-practices'],
    collaboratesWith: ['PM', 'Architect', 'Developer'],
  },
  {
    name: 'Architect',
    role: 'System Design',
    icon: 'Network',
    description:
      'Designs system architecture, writes architecture notes and readiness checks. Reviews structural integrity and implementation feasibility when the selected workflow calls for architecture review.',
    primarySkills: ['clean-code-standards', 'typescript-best-practices', 'systematic-debugging'],
    collaboratesWith: ['Developer', 'PM', 'QA'],
  },
  {
    name: 'Developer',
    role: 'Implementation',
    icon: 'Code2',
    description:
      'Implements the assigned story or coding task using relevant project context and existing patterns. Reviews concrete risks, verifies changed behavior, and returns the result without implicitly starting another story.',
    primarySkills: ['typescript-best-practices', 'react-expert', 'systematic-debugging', 'security-review'],
    collaboratesWith: ['QA', 'Architect', 'UX Designer'],
  },
  {
    name: 'PM',
    role: 'Product Management',
    icon: 'ClipboardList',
    description:
      'Writes Product Briefs, PRDs, and synthesizes research into actionable requirements. Routes tasks through triage and decides which workflow track to use. Manages the master orchestrator session.',
    primarySkills: ['project-context', 'triage'],
    collaboratesWith: ['Analyst', 'Scrum Master', 'Architect'],
  },
  {
    name: 'QA',
    role: 'Testing & Validation',
    icon: 'TestTube2',
    description:
      'Verifies changed public behavior with suitable existing tests and fixtures. Adds focused regression cases only where needed, runs required checks, and inspects UI behavior with the available browser tools.',
    primarySkills: ['test-quality', 'playwright-cli', 'systematic-debugging'],
    collaboratesWith: ['Developer', 'UX Designer'],
  },
  {
    name: 'Scrum Master',
    role: 'Sprint Management',
    icon: 'GitPullRequest',
    description:
      'Prepares scoped epics, stories, and sprint plans with traceable requirements and relevant context. Story preparation returns an implementation-ready plan; implementation and batch execution follow the user\'s requested scope.',
    primarySkills: ['project-context', 'triage'],
    collaboratesWith: ['PM', 'Developer', 'Architect'],
  },
  {
    name: 'Tech Writer',
    role: 'Documentation',
    icon: 'BookOpen',
    description:
      'Drafts technical documentation, README content, and inline code comments. Runs on /docs team alongside Architect for technical accuracy review.',
    primarySkills: ['writing-skills', 'project-context'],
    collaboratesWith: ['Architect', 'PM'],
  },
  {
    name: 'UX Designer',
    role: 'Interface Design',
    icon: 'Layers',
    description:
      'Creates UX design documents, component specs, and visual hierarchy notes. Also acts as a reviewer (UV = UX Validation) in Review Gates. On the ux-qa team, implements UI code and validates with playwright-cli.',
    primarySkills: ['frontend-responsive-design-standards', 'react-expert', 'ui-ux-pro-custom', 'ux-audit'],
    collaboratesWith: ['Developer', 'Architect', 'QA'],
  },
  {
    name: 'Quick Flow Solo Dev',
    role: 'Lean Implementation',
    icon: 'Zap',
    description:
      'Single-agent fast path for small, well-understood changes. Takes a spec or work item and ships code straight to the parent tree, skipping the full plan-review-verify cycle. Used by the solo-dev track when a change is too small to justify a multi-agent team.',
    primarySkills: ['typescript-best-practices', 'karpathy-discipline', 'systematic-debugging'],
    collaboratesWith: ['PM', 'QA'],
  },
  {
    name: 'Review Orchestrator',
    role: 'Review Coordination',
    icon: 'GitMerge',
    description:
      'Runs the Review Gate. Spawns and reuses reviewer sub-agents (Architect, UX Designer, Developer), collects their verdicts, and returns a single consolidated result. Never reviews code itself. It only coordinates, which keeps reviewer context isolated from each other.',
    primarySkills: ['pr-review-panel', 'clean-code-standards', 'ux-audit'],
    collaboratesWith: ['Architect', 'UX Designer', 'Developer'],
  },
  {
    name: 'Verifier',
    role: 'Goal-Backward Verification',
    icon: 'ShieldCheck',
    description:
      'Proves a completed implementation meets its stated goals via 4-level verification: artifact exists → substantive code → wired into the system → real data flows through it. Distinct from QA, it runs as a pre-sign-off gate in review cycles and routes failures back to Developer or to course-correction.',
    primarySkills: ['goal-backward-verify', 'systematic-debugging', 'project-context'],
    collaboratesWith: ['Developer', 'QA', 'Architect'],
  },
];
