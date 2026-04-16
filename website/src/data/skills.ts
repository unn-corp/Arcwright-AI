export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'devops'
  | 'workflow'
  | 'quality'
  | 'security'
  | 'design'
  | 'teams'
  | 'tracks';

export interface Skill {
  name: string;
  slug: string;
  description: string;
  category: SkillCategory;
}

export const skills: Skill[] = [
  // Frontend / Design
  {
    name: 'Frontend Responsive Design',
    slug: 'frontend-responsive-design-standards',
    description: 'Build responsive, mobile-first layouts with accessibility and performance in mind.',
    category: 'frontend',
  },
  {
    name: 'React Expert',
    slug: 'react-expert',
    description: 'Advanced React patterns, hooks, performance optimisation, and component design.',
    category: 'frontend',
  },
  {
    name: 'Next.js App Router',
    slug: 'nextjs-app-router-patterns',
    description: 'Next.js 14+ App Router conventions, server components, and streaming patterns.',
    category: 'frontend',
  },
  {
    name: 'Design',
    slug: 'design',
    description: 'Design intelligence for UI/UX decisions, component specs, and visual hierarchy.',
    category: 'design',
  },
  {
    name: 'UX Audit',
    slug: 'ux-audit',
    description: 'Systematic audit of UI/UX for accessibility, usability, and design consistency.',
    category: 'design',
  },
  {
    name: 'Excalidraw Dark Standard',
    slug: 'excalidraw-dark-standard',
    description: 'Master orchestrator for dark-theme Excalidraw diagram generation.',
    category: 'design',
  },
  {
    name: 'Excalidraw Diagram Generator',
    slug: 'excalidraw-diagram-generator',
    description: 'Generate structured Excalidraw diagrams for architecture, flows, and wireframes.',
    category: 'design',
  },
  // Backend
  {
    name: 'TypeScript Best Practices',
    slug: 'typescript-best-practices',
    description: 'Type-safe TypeScript patterns, strict mode, generics, and utility types.',
    category: 'backend',
  },
  {
    name: 'Python Backend',
    slug: 'python-backend',
    description: 'Production Python backend patterns with FastAPI, async, and dependency injection.',
    category: 'backend',
  },
  {
    name: 'Python Fundamentals',
    slug: 'python-fundamentals',
    description: 'Core Python syntax, data structures, and idiomatic patterns.',
    category: 'backend',
  },
  {
    name: 'Python Performance',
    slug: 'python-performance',
    description: 'Profiling, Cython, async concurrency, and memory optimisation for Python.',
    category: 'backend',
  },
  {
    name: 'Java Fundamentals',
    slug: 'java-fundamentals',
    description: 'Core Java programming patterns, OOP, collections, and standard library.',
    category: 'backend',
  },
  {
    name: 'Java Performance',
    slug: 'java-performance',
    description: 'JVM tuning, GC strategies, profiling, and high-throughput Java patterns.',
    category: 'backend',
  },
  {
    name: 'PostgreSQL Optimization',
    slug: 'postgresql-optimization',
    description: 'Query planning, indexing strategies, partitioning, and connection pooling.',
    category: 'backend',
  },
  {
    name: 'Redis Best Practices',
    slug: 'redis-best-practices',
    description: 'Data structures, caching patterns, pub/sub, and cluster configuration for Redis.',
    category: 'backend',
  },
  {
    name: 'WebSocket Engineer',
    slug: 'websocket-engineer',
    description: 'Real-time bidirectional communication patterns, reconnect logic, and scaling.',
    category: 'backend',
  },
  // DevOps / Tools
  {
    name: 'Docker Type-Check',
    slug: 'docker-type-check',
    description: 'Run TypeScript type-checks in isolated Docker containers for CI accuracy.',
    category: 'devops',
  },
  {
    name: 'tmux Protocol',
    slug: 'tmux-protocol',
    description: 'Agent orchestration via tmux: spawn, signal, verify, and coordinate panes.',
    category: 'devops',
  },
  {
    name: 'Playwright CLI',
    slug: 'playwright-cli',
    description: 'Browser automation, screenshot comparison, and E2E test execution via Playwright.',
    category: 'devops',
  },
  {
    name: 'gsudo',
    slug: 'gsudo',
    description: 'Windows privilege escalation for WSL2 — run commands with elevated permissions.',
    category: 'devops',
  },
  // Quality / Debug
  {
    name: 'Systematic Debugging',
    slug: 'systematic-debugging',
    description: 'Structured approach to diagnosing bugs, failures, and unexpected behavior.',
    category: 'quality',
  },
  {
    name: 'Clean Code Standards',
    slug: 'clean-code-standards',
    description: '23 DRY/SOLID rules applied across the codebase for maintainability.',
    category: 'quality',
  },
  {
    name: 'DRY',
    slug: 'dry',
    description: 'Single-pass DRY/SOLID review and auto-fix for duplication and coupling.',
    category: 'quality',
  },
  {
    name: 'Audit Website',
    slug: 'audit-website',
    description: 'Comprehensive website audit covering SEO, performance, accessibility, and UX.',
    category: 'quality',
  },
  {
    name: 'Security Best Practices',
    slug: 'security-best-practices',
    description: 'Proactive security patterns for auth, input validation, SQL, and file operations.',
    category: 'security',
  },
  {
    name: 'Security Review',
    slug: 'security-review',
    description: 'OWASP-based single-pass security code review with auto-remediation guidance.',
    category: 'security',
  },
  {
    name: 'Subagent-Driven Development',
    slug: 'subagent-driven-development',
    description: 'Execute implementation tasks by orchestrating focused sub-agent pipelines.',
    category: 'quality',
  },
  // Workflow
  {
    name: 'Project Context',
    slug: 'project-context',
    description: 'Scan the project for existing context before starting any workflow task.',
    category: 'workflow',
  },
  {
    name: 'Triage',
    slug: 'triage',
    description: 'Analyse a task description and route it to the appropriate track or team.',
    category: 'workflow',
  },
  {
    name: 'Writing Skills',
    slug: 'writing-skills',
    description: 'Create new structured documents: specs, PRDs, architecture notes, user stories.',
    category: 'workflow',
  },
  // Teams (17)
  {
    name: 'Team: arch-dev',
    slug: 'team-arch-dev',
    description: 'Architect designs approach, Dev implements. For non-trivial features needing upfront design.',
    category: 'teams',
  },
  {
    name: 'Team: audit',
    slug: 'team-audit',
    description: 'Full audit with Architect, UX, and Security running concurrently.',
    category: 'teams',
  },
  {
    name: 'Team: blueprint',
    slug: 'team-blueprint',
    description: 'Strategic planning before any build — PRDs, research, architecture.',
    category: 'teams',
  },
  {
    name: 'Team: dev-qa',
    slug: 'team-dev-qa',
    description: 'Iterative Dev + QA loop with playwright-cli validation.',
    category: 'teams',
  },
  {
    name: 'Team: docs',
    slug: 'team-docs',
    description: 'Tech Writer drafts, Architect reviews for technical accuracy.',
    category: 'teams',
  },
  {
    name: 'Team: full-dev',
    slug: 'team-full-dev',
    description: 'Main dev loop with QA validation; Architect available on-call.',
    category: 'teams',
  },
  {
    name: 'Team: hotfix',
    slug: 'team-hotfix',
    description: 'Emergency fix — max 4 files, isolated subsystem, Security reviews before merge.',
    category: 'teams',
  },
  {
    name: 'Team: research',
    slug: 'team-research',
    description: 'Analyst researches, PM synthesizes briefs, Tech Writer documents outputs.',
    category: 'teams',
  },
  {
    name: 'Team: review',
    slug: 'team-review',
    description: 'Architect and UX review concurrently, batched findings go to Dev until clean.',
    category: 'teams',
  },
  {
    name: 'Team: sec-qa',
    slug: 'team-sec-qa',
    description: 'Security finds vulnerabilities, Dev remediates, QA closes the exploit path.',
    category: 'teams',
  },
  {
    name: 'Team: solo-arch',
    slug: 'team-solo-arch',
    description: 'Architect working solo with tools. For design-only or readonly audit tasks.',
    category: 'teams',
  },
  {
    name: 'Team: solo-dev',
    slug: 'team-solo-dev',
    description: 'Developer working solo. For well-scoped tasks that do not need review.',
    category: 'teams',
  },
  {
    name: 'Team: solo-qa',
    slug: 'team-solo-qa',
    description: 'QA working solo. For writing test suites or validating a known-good implementation.',
    category: 'teams',
  },
  {
    name: 'Team: sprint',
    slug: 'team-sprint',
    description: 'SM manages sprint queue, Dev implements stories, QA validates each before SM marks done.',
    category: 'teams',
  },
  {
    name: 'Team: tdd',
    slug: 'team-tdd',
    description: 'QA writes failing tests first, Dev implements to green, QA verifies.',
    category: 'teams',
  },
  {
    name: 'Team: ux-arch',
    slug: 'team-ux-arch',
    description: 'Design artifacts only — UX and Architect with no implementation loop.',
    category: 'teams',
  },
  {
    name: 'Team: ux-qa',
    slug: 'team-ux-qa',
    description: 'UX Designer implements UI code, QA validates live with playwright-cli.',
    category: 'teams',
  },
  // Tracks (7)
  {
    name: 'Track: Nano',
    slug: 'track-nano',
    description: 'Nano track workflow — direct to dev, no spec, scope guard at 20 lines.',
    category: 'tracks',
  },
  {
    name: 'Track: Small',
    slug: 'track-small',
    description: 'Small track workflow — Spec → Dev → 3-sub Review Gate → QA.',
    category: 'tracks',
  },
  {
    name: 'Track: Compact',
    slug: 'track-compact',
    description: 'Compact track workflow — optional research before Dev, same 3-sub gate.',
    category: 'tracks',
  },
  {
    name: 'Track: Medium',
    slug: 'track-medium',
    description: 'Medium track workflow — full spec, research, UX, two review gates.',
    category: 'tracks',
  },
  {
    name: 'Track: Extended',
    slug: 'track-extended',
    description: 'Extended track workflow — PRD-driven, UX + arch notes, sprint plan, two gates.',
    category: 'tracks',
  },
  {
    name: 'Track: Large',
    slug: 'track-large',
    description: 'Large track workflow — full planning, epics/stories loop, parallel research.',
    category: 'tracks',
  },
  {
    name: 'Track: Review',
    slug: 'track-rv',
    description: 'Review track — audit-first, synthesizes findings, routes to appropriate fix path.',
    category: 'tracks',
  },
];

export const SKILL_CATEGORIES: SkillCategory[] = [
  'frontend',
  'backend',
  'devops',
  'workflow',
  'quality',
  'security',
  'design',
  'teams',
  'tracks',
];

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  devops: 'DevOps',
  workflow: 'Workflow',
  quality: 'Quality',
  security: 'Security',
  design: 'Design',
  teams: 'Teams',
  tracks: 'Tracks',
};

export const CATEGORY_COLORS: Record<SkillCategory, string> = {
  frontend: '#93c5fd',
  backend: '#5eead4',
  devops: '#fde68a',
  workflow: '#86efac',
  quality: '#a5b4fc',
  security: '#fca5a5',
  design: '#CA9EE6',
  teams: '#fdba74',
  tracks: '#6ee7b7',
};
