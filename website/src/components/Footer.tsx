import { Package, ExternalLink } from 'lucide-react';

function GithubIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
    </svg>
  );
}

const NPM_PACKAGES = [
  {
    name: '@arcwright-ai/agent-orchestration',
    description: 'Agents, skills, workflows, IDE configs',
    url: 'https://www.npmjs.com/package/@arcwright-ai/agent-orchestration',
  },
  {
    name: '@arcwright-ai/tmux-setup',
    description: 'tmux config + scripts for AI workflows',
    url: 'https://www.npmjs.com/package/@arcwright-ai/tmux-setup',
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-surface-light bg-bg py-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="font-mono font-bold text-xl text-cta mb-3">arcwright</div>
            <p className="font-sans text-sm text-muted leading-relaxed max-w-xs">
              AI-native agile workflow orchestration for Claude Code, Kiro, and 5 more IDEs.
            </p>
          </div>

          {/* npm packages */}
          <div>
            <h4 className="font-mono text-xs text-muted uppercase tracking-wider mb-4">Packages</h4>
            <div className="space-y-3">
              {NPM_PACKAGES.map(pkg => (
                <a
                  key={pkg.name}
                  href={pkg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 group cursor-pointer"
                >
                  <Package size={14} className="text-muted mt-0.5 flex-shrink-0 group-hover:text-cta transition-colors duration-200" aria-hidden="true" />
                  <div>
                    <div className="font-mono text-xs text-foreground group-hover:text-cta transition-colors duration-200 leading-snug">
                      {pkg.name}
                    </div>
                    <div className="font-sans text-xs text-muted mt-0.5">{pkg.description}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-mono text-xs text-muted uppercase tracking-wider mb-4">Links</h4>
            <div className="space-y-2">
              <a
                href="https://github.com/UNN-Devotek/Arcwright-AI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors duration-200 group cursor-pointer"
              >
                <GithubIcon size={14} />
                GitHub Repository
                <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" aria-hidden="true" />
              </a>
              <a
                href="https://github.com/UNN-Devotek/Arcwright-AI/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors duration-200 group cursor-pointer"
              >
                <ExternalLink size={14} aria-hidden="true" />
                Documentation
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-surface-light flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-xs text-muted">
            MIT License — open source, free forever
          </p>
          <p className="font-mono text-xs text-muted/50">
            arcwright.space
          </p>
        </div>
      </div>
    </footer>
  );
}
