import TeamsGrid from '../components/TeamsGrid';

export default function TeamsPage() {
  return (
    <div className="pt-16">
      {/* Page header */}
      <section className="px-4 sm:px-6 pt-12 pb-8 border-b border-surface-light bg-surface/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="font-mono text-cta text-sm">/team</span>
            <span className="font-mono text-muted/40 text-sm">→</span>
            <span className="font-mono text-muted text-sm">interactive selector</span>
          </div>
          <h1 className="font-mono text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Agent Teams
          </h1>
          <p className="font-sans text-muted text-lg max-w-2xl leading-relaxed">
            17 pre-built team compositions for every phase of development. Each team is a
            tmux split-pane layout — specialist agents that stay alive across tasks and
            communicate via session files.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { label: 'Development', count: 4, color: 'text-accent-blue border-accent-blue/30 bg-accent-blue/5' },
              { label: 'Review', count: 3, color: 'text-accent-peach border-accent-peach/30 bg-accent-peach/5' },
              { label: 'Planning', count: 3, color: 'text-accent-mauve border-accent-mauve/30 bg-accent-mauve/5' },
              { label: 'Specialist', count: 4, color: 'text-accent-green border-accent-green/30 bg-accent-green/5' },
              { label: 'Solo', count: 3, color: 'text-muted border-surface-light bg-surface/60' },
            ].map(cat => (
              <div key={cat.label} className={`font-mono text-xs px-3 py-1.5 border ${cat.color}`}>
                {cat.label} <span className="opacity-60">×{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TeamsGrid hideHeader />
    </div>
  );
}
