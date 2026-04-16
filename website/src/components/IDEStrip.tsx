import { ides } from '../data/ides';
import { Terminal } from 'lucide-react';

export default function IDEStrip() {
  return (
    <section id="ides" className="pt-6 pb-16 px-4 sm:px-6 bg-surface/20">
      <div className="max-w-7xl mx-auto">
        <div className="reveal mb-12 text-center">
          <h2 className="font-mono text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Supported IDEs
          </h2>
          <p className="font-sans text-muted max-w-xl mx-auto">
            One install command. Works across every major AI coding environment.
          </p>
        </div>

        <div className="reveal flex flex-wrap justify-center gap-3 sm:gap-4">
          {ides.map(ide => (
            <div
              key={ide.id}
              className="flex items-center gap-2.5 bg-surface border border-surface-light px-5 py-3 hover:border-cta/40 hover:bg-surface/80 transition-all duration-200 group"
            >
              <Terminal
                size={16}
                className="text-muted group-hover:text-cta transition-colors duration-200"
                aria-hidden="true"
              />
              <span className="font-sans font-medium text-sm text-foreground">{ide.name}</span>
            </div>
          ))}
        </div>

        {/* Install flags */}
        <div className="reveal mt-12 bg-surface border border-surface-light p-6 max-w-2xl mx-auto">
          <div className="text-xs font-mono text-muted mb-3">Multi-IDE install</div>
          <div className="flex items-center gap-0 bg-bg border border-surface-light overflow-hidden">
            <div className="px-4 py-3 flex-1 overflow-x-auto">
              <code className="font-mono text-sm text-foreground whitespace-nowrap">
                npx @arcwright-ai/agent-orchestration{' '}
                <span className="text-accent-blue">--tools claude-code,kiro,cursor</span>
              </code>
            </div>
          </div>
          <p className="font-sans text-xs text-muted mt-3">
            Supports:{' '}
            {ides.map((ide, i) => (
              <span key={ide.id}>
                <code className="font-mono text-xs text-cta/80">{ide.flag}</code>
                {i < ides.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
