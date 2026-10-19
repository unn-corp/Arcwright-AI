export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'devops'
  | 'workflow'
  | 'quality'
  | 'security'
  | 'design'
  | 'teams';

export interface Skill {
  name: string;
  slug: string;
  sourcePath?: string;
  description: string;
  category: SkillCategory;
}

export const skills: Skill[] = [
  {
    name: 'Arcwright Entrypoints',
    slug: 'arcwright',
    description: 'Model-selectable access to installed commands, workflows, and specialist profiles, with a compact lookup for hosts without native slash commands.',
    category: 'workflow',
  },
  {
    name: 'Arcwright Engineering Skills',
    slug: 'matt-pocock-ask-matt',
    sourcePath: '.agents/skills/matt-pocock-ask-matt/SKILL.md',
    description: 'Locally maintained pack adapted from Matt Pocock: 27 skills for planning, TDD, code review, domain modeling, research, and teaching. Install with --matt-pocock.',
    category: 'workflow',
  },
  // Frontend / Design
  {
    name: 'Taste Frontend Design',
    slug: 'design-taste-frontend',
    description: 'Subject-specific art direction for public pages, researched composition libraries, licensed imagery, and a bounded visual review loop. Preserves the existing design system.',
    category: 'design',
  },
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
    slug: 'next-best-practices',
    description: 'Installed-version Next.js guidance for App Router, server components, caching, and streaming.',
    category: 'frontend',
  },
  {
    name: 'Motion',
    slug: 'motion',
    description: 'Prioritized React animation library (Motion / Framer Motion): gestures, drag, scroll, layout transitions, springs, and reduced-motion accessibility.',
    category: 'frontend',
  },
  {
    name: 'UI/UX Pro',
    slug: 'ui-ux-pro-custom',
    description: 'Design intelligence for UI/UX decisions: curated styles, palettes, font pairings, chart types, and stack recommendations.',
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
    name: 'Playwright CLI',
    slug: 'playwright-cli',
    description: 'Deterministic browser automation, screenshot comparison, and E2E test execution via Playwright.',
    category: 'devops',
  },
  {
    name: 'browser-use',
    slug: 'browser-use',
    description: 'Agentic browser exploration: give a natural-language goal and an LLM agent self-navigates without selectors. For exploratory testing, documenting unknown UIs, and scaffolding Playwright tests. The agentic counterpart to playwright-cli.',
    category: 'devops',
  },
  {
    name: 'gsudo',
    slug: 'gsudo',
    description: 'Windows privilege escalation for WSL2: run commands with elevated permissions.',
    category: 'devops',
  },
  // Quality / Debug
  {
    name: 'Ponytail',
    slug: 'ponytail',
    description: 'The smallest complete change, with focused checks and clear explanations. Includes review, audit, debt, help, and upstream benchmark skills.',
    category: 'quality',
  },
  {
    name: 'Review Loop',
    slug: 'review-loop',
    description: 'Choose a review model, then review, fix substantive findings, and verify in bounded rounds with minimal interruption.',
    category: 'quality',
  },
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
    name: 'Squirrelscan Operations',
    slug: 'squirrelscan',
    description: 'Operate local and cloud audits, stored reports, entity maps, and optional squirrelscan MCP integration.',
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
    name: 'Full Send',
    slug: 'full-send',
    description: 'Explicitly authorized delivery through implementation, verification, review, and a protected PR merge in Arcwright Code or T3 Code.',
    category: 'workflow',
  },
  {
    name: 'Full Stop',
    slug: 'full-stop',
    description: 'Complete implementation, verification, and review in Arcwright Code or T3 Code, leaving the PR ready for the user to merge.',
    category: 'workflow',
  },
  {
    name: 'Project Context',
    slug: 'project-context',
    description: 'Scan the project for existing context before starting any workflow task.',
    category: 'workflow',
  },
  {
    name: 'Triage',
    slug: 'triage',
    description: 'Workflow router that recommends a runtime for a task: plain in-process agent(s), an ultracode workflow, or a /goal loop.',
    category: 'workflow',
  },
  {
    name: 'Subagent Protocol',
    slug: 'subagent-protocol',
    description: 'Coordinate specialists across supported hosts with scoped handoffs, real task IDs, inherited model choices, and verified results.',
    category: 'workflow',
  },
  {
    name: 'Writing Skills',
    slug: 'writing-skills',
    description: 'Create new structured documents: specs, PRDs, architecture notes, user stories.',
    category: 'workflow',
  },
  {
    name: 'Caveman',
    slug: 'caveman',
    description: 'Requested concise writing modes and prose compression that preserve facts, technical details, negations, and readability.',
    category: 'workflow',
  },
  {
    name: 'Spec Kernel',
    slug: 'spec-kernel',
    description: 'Tight SPEC.md contract: Why, Capabilities (CAP-NNN), Constraints, Non-goals, and Success signal, with a pre-planning quality checklist.',
    category: 'workflow',
  },
  {
    name: 'Clarification Gate',
    slug: 'clarification-gate',
    description: '12-category ambiguity scan; asks ≤5 questions one at a time and locks decisions (D-NN) before planning.',
    category: 'workflow',
  },
  {
    name: 'Goal-Backward Verify',
    slug: 'goal-backward-verify',
    description: '4-level verification (exists → substantive → wired → real data flows) proving an implementation meets its stated goals.',
    category: 'quality',
  },
  {
    name: 'Correct Course',
    slug: 'correct-course',
    description: 'Structured mid-task course-correction when a constraint, blocker, or verification FAIL invalidates the current plan.',
    category: 'workflow',
  },
  {
    name: 'Hookify',
    slug: 'hookify',
    description: 'Create focused development hooks using the active host’s supported events, input format, and configuration.',
    category: 'workflow',
  },
  {
    name: 'Session Handoff',
    slug: 'session-handoff',
    description: 'Compress a finished session into a terse continuation artifact for a fresh agent or worktree.',
    category: 'workflow',
  },
  {
    name: 'Agent Instructions',
    slug: 'agent-instructions',
    description: 'Audit durable agent instructions, capture verified conventions, and prune stale or contradictory guidance across hosts.',
    category: 'workflow',
  },
  {
    name: 'Commit Commands',
    slug: 'commit-commands',
    description: 'Lightweight daily git trio: /commit, /commit-push-pr, and /clean-gone. Shows the message before committing.',
    category: 'workflow',
  },
  {
    name: 'Grill Me',
    slug: 'grill-me',
    description: 'Adversarial pre-implementation design interrogation that refuses to start coding until the design is locked.',
    category: 'workflow',
  },
  {
    name: 'Karpathy Discipline',
    slug: 'karpathy-discipline',
    description: 'Minimalism layer: think first, smallest viable change, delete before adding, no over-engineering.',
    category: 'quality',
  },
  {
    name: 'Task Manager',
    slug: 'task-manager',
    description: 'Decompose an epic/SPEC into task files with a dependency graph + conflict-free wave plan; run parallel waves and optionally sync to GitHub Issues.',
    category: 'workflow',
  },
  {
    name: 'PR Review Panel',
    slug: 'pr-review-panel',
    description: 'Parallel 6-lens PR review with 0-100 confidence scoring, dedup, and a ranked merge verdict.',
    category: 'quality',
  },
  {
    name: 'Code Graph',
    slug: 'code-graph',
    description: 'Local symbol-dependency graph to assess change blast radius without loading whole files.',
    category: 'quality',
  },
  {
    name: 'LSP Diagnostics',
    slug: 'lsp-diagnostics',
    description: 'Validate edits against real compiler/type-checker output (tsc, pyright) in a fix loop.',
    category: 'quality',
  },
  {
    name: 'Document Tools',
    slug: 'doc-pdf',
    description: 'Read/write PDF, Word, Excel, and PowerPoint files using the active host’s file and execution tools (pypdf, python-docx, openpyxl, python-pptx).',
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
    description: 'Strategic planning before any build: PRDs, research, architecture.',
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
    description: 'Emergency fix: max 4 files, isolated subsystem, Security reviews before merge.',
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
    description: 'Design artifacts only, with UX and Architect and no implementation loop.',
    category: 'teams',
  },
  {
    name: 'Team: ux-qa',
    slug: 'team-ux-qa',
    description: 'UX Designer implements UI code, QA validates live with playwright-cli.',
    category: 'teams',
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
};
