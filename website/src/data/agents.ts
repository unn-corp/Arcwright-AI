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
      'Conducts deep codebase exploration, competitive research, and technical domain analysis. Produces structured research reports that feed into specs, PRDs, and architecture decisions. Runs in-process, often in parallel with other analysts on Medium/Extended/Large tracks.',
    primarySkills: ['systematic-debugging', 'project-context', 'typescript-best-practices'],
    collaboratesWith: ['PM', 'Architect', 'Developer'],
  },
  {
    name: 'Architect',
    role: 'System Design',
    icon: 'Network',
    description:
      'Designs system architecture, writes architecture notes and readiness checks. Reviews code for structural integrity, DRY violations, and implementation feasibility. Key reviewer in every Review Gate\'s AR+DRY sub-task.',
    primarySkills: ['clean-code-standards', 'typescript-best-practices', 'systematic-debugging'],
    collaboratesWith: ['Developer', 'PM', 'QA'],
  },
  {
    name: 'Developer',
    role: 'Implementation',
    icon: 'Code2',
    description:
      'Full-stack implementation agent. Handles code changes from quick fixes (quick-flow-solo-dev) to full feature implementations (dev-agent). Reads specs, UX designs, and architecture notes before writing code.',
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
      'Writes Playwright .spec.ts test files, validates code changes, and runs the test loop. Uses playwright-cli for browser automation and screenshot comparison. Loops back to Developer on failures.',
    primarySkills: ['playwright-cli', 'systematic-debugging', 'typescript-best-practices'],
    collaboratesWith: ['Developer', 'UX Designer'],
  },
  {
    name: 'Scrum Master',
    role: 'Sprint Management',
    icon: 'GitPullRequest',
    description:
      'Decomposes PRDs into epics and user stories. Creates sprint plans, manages the per-story dev loop on Large tracks, and marks stories done after QA validates each.',
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
];
