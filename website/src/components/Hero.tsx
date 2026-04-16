import { useState } from 'react';
import { Copy, Check, ArrowRight } from 'lucide-react';

function GithubIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
    </svg>
  );
}

const INSTALL_CMD = 'npx @arcwright-ai/agent-orchestration';

export default function Hero() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = INSTALL_CMD;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center pt-16 gradient-hero grid-dot-bg overflow-hidden"
    >
      {/* Background glow orb */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(217,119,87,0.22) 0%, transparent 65%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full min-w-0 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-surface border border-surface-light rounded-full px-3 py-1.5 text-xs font-mono text-muted min-w-0 max-w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cta pulse-dot flex-shrink-0" aria-hidden="true" />
            <span className="truncate">Claude Code · Kiro</span>
          </div>
        </div>

        {/* H1 */}
        <h1 className="font-mono text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
          <span className="text-foreground">AI-native agile</span>
          <br />
          <span className="text-cta hero-glow">workflow orchestration</span>
        </h1>

        {/* Subheading */}
        <p className="font-sans text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-4 leading-relaxed">
          Structured specialist agents, workflow tracks, and an extensive skill library.
          Pick a track, the orchestrator does the rest.
        </p>

        {/* Install command */}
        <div className="flex items-stretch bg-surface border border-surface-light overflow-hidden mb-10 w-full sm:w-auto shadow-lg transition-shadow duration-300 group">
          <div className="flex items-center gap-2 px-4 py-3 min-w-0 overflow-x-auto flex-1">
            <span className="text-muted font-mono text-sm select-none flex-shrink-0">$</span>
            <code className="font-mono text-sm text-foreground whitespace-nowrap">{INSTALL_CMD}</code>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-mono border-l border-surface-light transition-all duration-200 cursor-pointer flex-shrink-0 ${
              copied
                ? 'bg-cta/10 text-cta copy-pulse'
                : 'text-muted hover:text-foreground hover:bg-surface-light'
            }`}
            aria-label={copied ? 'Copied!' : 'Copy install command'}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span className="hidden sm:block">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://github.com/UNN-Devotek/Arcwright-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-cta text-bg font-sans font-semibold text-sm px-5 py-2.5 hover:bg-cta/90 transition-colors duration-200 cursor-pointer"
          >
            <GithubIcon size={16} />
            View on GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/@arcwright-ai/agent-orchestration"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-surface border border-surface-light text-foreground font-sans font-medium text-sm px-5 py-2.5 hover:bg-surface-light transition-colors duration-200 cursor-pointer"
          >
            npm package
            <ArrowRight size={14} />
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted/40" aria-hidden="true">
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-muted/40" />
        <span className="text-xs font-mono">scroll</span>
      </div>
    </section>
  );
}
