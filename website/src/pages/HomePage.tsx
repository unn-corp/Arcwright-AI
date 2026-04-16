import Hero from '../components/Hero';
import SyncBadge from '../components/SyncBadge';
import MigrationBanner from '../components/MigrationBanner';
import { useGitHubReadme } from '../hooks/useGitHubReadme';

export default function HomePage() {
  const readme = useGitHubReadme();

  return (
    <>
      <Hero />
      <SyncBadge timestamp={readme.timestamp} loading={readme.loading} error={readme.error} />
      <MigrationBanner />
    </>
  );
}
