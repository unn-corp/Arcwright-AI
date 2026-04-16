export type TeamCategory = 'Development' | 'Review' | 'Planning' | 'Specialist' | 'Solo';

export interface Team {
  code: string;
  name: string;
  displayName: string;
  composition: string;
  whenToUse: string;
  description: string;
  category: TeamCategory;
}

export const teams: Team[] = [
  // Development
  {
    code: 'arch-dev',
    name: 'The Foundry',
    displayName: 'arch-dev',
    composition: 'Architect + Dev',
    whenToUse: 'Architect designs approach, Dev implements, Architect spot-checks — for non-trivial features needing upfront design',
    description: 'Architect designs approach, Dev implements. Architect spot-checks for complex decisions.',
    category: 'Development',
  },
  {
    code: 'full-dev',
    name: 'The Engine Room',
    displayName: 'full-dev',
    composition: 'Dev + QA + on-call Architect',
    whenToUse: 'Main dev loop with QA validation; Architect available for complex decisions',
    description: 'Main dev loop with QA validation. Architect available on-call for complex decisions.',
    category: 'Development',
  },
  {
    code: 'dev-qa',
    name: 'Dev + QA Loop',
    displayName: 'dev-qa',
    composition: 'Dev + QA',
    whenToUse: 'Iterative: Dev implements, QA validates with playwright-cli, failures loop back to Dev',
    description: 'Iterative: Dev implements, QA validates with playwright-cli. Failures loop back to Dev.',
    category: 'Development',
  },
  {
    code: 'tdd',
    name: 'The Forge',
    displayName: 'tdd',
    composition: 'QA + Dev',
    whenToUse: 'TDD: QA writes failing tests first, Dev implements to green, QA verifies',
    description: 'QA writes failing tests first, Dev implements to green, QA verifies.',
    category: 'Development',
  },
  {
    code: 'solo-dev',
    name: 'Ghost',
    displayName: 'solo-dev',
    composition: 'Single quick-flow-solo-dev',
    whenToUse: 'Sequential task queue; dev signals completion each time',
    description: 'Developer working solo. For well-scoped tasks that do not need review.',
    category: 'Solo',
  },
  // Review
  {
    code: 'review',
    name: 'Review + Fix Loop',
    displayName: 'review',
    composition: 'Architect + UX + Dev',
    whenToUse: 'Architect and UX review concurrently, batched findings go to Dev, loop until clean',
    description: 'Architect and UX review concurrently, batched findings go to Dev, loop until clean.',
    category: 'Review',
  },
  {
    code: 'audit',
    name: 'The Crucible',
    displayName: 'audit',
    composition: 'Architect + UX + Security',
    whenToUse: 'Full audit with three specialists running concurrently; Security has final sign-off',
    description: 'Full audit with three specialists running concurrently. Security has final sign-off.',
    category: 'Review',
  },
  {
    code: 'sec-qa',
    name: 'The Vault',
    displayName: 'sec-qa',
    composition: 'Security + Dev + QA',
    whenToUse: 'Security finds vulnerabilities, Dev remediates, QA closes the exploit path, Security signs off',
    description: 'Security finds vulnerabilities, Dev remediates, QA closes the exploit path.',
    category: 'Review',
  },
  // Planning
  {
    code: 'blueprint',
    name: 'War Room',
    displayName: 'blueprint',
    composition: 'PM + Analyst + Architect',
    whenToUse: 'Strategic planning before any build — PRDs, research, architecture',
    description: 'Strategic planning before any build — PRDs, research, architecture.',
    category: 'Planning',
  },
  {
    code: 'research',
    name: 'Recon Pod',
    displayName: 'research',
    composition: 'Analyst + PM + Tech Writer',
    whenToUse: 'Analyst researches, PM synthesizes briefs, Tech Writer documents outputs',
    description: 'Analyst researches, PM synthesizes briefs, Tech Writer documents outputs.',
    category: 'Planning',
  },
  {
    code: 'ux-arch',
    name: 'The Blueprint Room',
    displayName: 'ux-arch',
    composition: 'UX + Architect',
    whenToUse: 'Design artifacts only — no implementation, no iterative loop',
    description: 'Design artifacts only — no implementation, no iterative loop.',
    category: 'Planning',
  },
  // Specialist
  {
    code: 'sprint',
    name: 'The Strike Team',
    displayName: 'sprint',
    composition: 'SM + Dev + QA',
    whenToUse: 'SM manages sprint queue, Dev implements stories in sequence, QA validates each before SM marks done',
    description: 'SM manages sprint queue, Dev implements stories in sequence, QA validates each before SM marks done.',
    category: 'Specialist',
  },
  {
    code: 'docs',
    name: 'The Library',
    displayName: 'docs',
    composition: 'Tech Writer + Architect',
    whenToUse: 'Tech Writer drafts, Architect reviews for technical accuracy',
    description: 'Tech Writer drafts, Architect reviews for technical accuracy.',
    category: 'Specialist',
  },
  {
    code: 'ux-qa',
    name: 'The Atelier',
    displayName: 'ux-qa',
    composition: 'UX Designer + QA',
    whenToUse: 'UX Designer implements (writes code), QA validates live UI with playwright-cli, loop until clean',
    description: 'UX Designer implements (writes code), QA validates live UI with playwright-cli, loop until clean.',
    category: 'Specialist',
  },
  {
    code: 'hotfix',
    name: 'Rapid Response',
    displayName: 'hotfix',
    composition: 'Dev + Security',
    whenToUse: 'Emergency fix — max 4 files, isolated subsystem, Security reviews before merge',
    description: 'Emergency fix: max 4 files, isolated subsystem, Security reviews before merge.',
    category: 'Specialist',
  },
  // Solo
  {
    code: 'solo-arch',
    name: 'The Oracle',
    displayName: 'solo-arch',
    composition: 'Single Architect',
    whenToUse: 'Architecture analysis, design proposals, prototyping — with full dev skill access',
    description: 'Architect working solo with tools. For design-only or readonly audit tasks.',
    category: 'Solo',
  },
  {
    code: 'solo-qa',
    name: 'The Inquisitor',
    displayName: 'solo-qa',
    composition: 'Single QA',
    whenToUse: 'Regression runs, playwright-cli sessions, pass/fail reports',
    description: 'QA working solo. For writing test suites or validating a known-good implementation.',
    category: 'Solo',
  },
];
