import Hero from '../components/Hero';
import SyncBadge from '../components/SyncBadge';
import TeamsGrid from '../components/TeamsGrid';
import AgentsGrid from '../components/AgentsGrid';
import TmuxSection from '../components/TmuxSection';
import MigrationBanner from '../components/MigrationBanner';
import { useGitHubReadme } from '../hooks/useGitHubReadme';

const SECTION_NAV = [
  { label: 'Teams', href: '#teams' },
  { label: 'Agents', href: '#agents' },
  { label: 'tmux', href: '#tmux' },
  { label: 'Migrate', href: '#migrate' },
];

export default function HomePage() {
  const readme = useGitHubReadme();

  return (
    <>
      <Hero />
      <SyncBadge timestamp={readme.timestamp} loading={readme.loading} error={readme.error} />

      {/* In-page section nav */}
      <nav
        className="sticky top-16 z-40 bg-bg/95 backdrop-blur border-b border-surface-light"
        aria-label="Page sections"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto h-10">
          {SECTION_NAV.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="flex-shrink-0 font-mono text-xs px-3 py-1.5 text-muted hover:text-foreground hover:bg-surface-light transition-all duration-150"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <TeamsGrid />
      <AgentsGrid />
      <TmuxSection />

      <div id="migrate">
        <MigrationBanner />
      </div>
    </>
  );
}
