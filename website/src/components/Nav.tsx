import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, ExternalLink } from 'lucide-react';

// Simple GitHub SVG icon (not in lucide-react)
function GithubIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
    </svg>
  );
}

const GITHUB_API = 'https://api.github.com/repos/UNN-Devotek/Arcwright-AI';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Tracks', to: '/tracks' },
  { label: 'Teams', to: '/teams' },
  { label: 'Agents', to: '/agents' },
  { label: 'Skills', to: '/skills' },
  { label: 'tmux', to: '/tmux' },
];

export default function Nav() {
  const [stars, setStars] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetch(GITHUB_API)
      .then(r => r.json())
      .then(d => setStars(d.stargazers_count ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  function isActive(to: string) {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-bg/95 backdrop-blur border-b border-surface-light shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-mono font-bold text-xl text-cta group-hover:glow-green transition-all duration-200">
              arcwright
            </span>
            <span className="text-muted text-sm font-mono hidden sm:block">/ai</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1 text-sm font-sans text-muted">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 transition-all duration-200 relative ${
                  isActive(link.to)
                    ? 'text-cta'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {link.label}
                {isActive(link.to) && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-0.5 bg-cta"
                    aria-hidden="true"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/UNN-Devotek/Arcwright-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors duration-200 cursor-pointer"
              aria-label="View on GitHub"
            >
              <GithubIcon size={16} />
              {stars !== null && (
                <span className="font-mono text-xs bg-surface px-1.5 py-0.5">
                  {stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars}
                </span>
              )}
            </a>
            <a
              href="https://www.npmjs.com/package/@arcwright-ai/agent-orchestration"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted hover:text-foreground bg-surface hover:bg-surface-light border border-surface-light px-2.5 py-1.5 transition-all duration-200 cursor-pointer"
              aria-label="View on npm"
            >
              <Package size={12} />
              npm
              <ExternalLink size={10} />
            </a>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto gap-1 pb-2 -mt-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex-shrink-0 font-mono text-xs px-2.5 py-1 transition-all duration-200 ${
                isActive(link.to)
                  ? 'text-cta border-b-2 border-cta'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
