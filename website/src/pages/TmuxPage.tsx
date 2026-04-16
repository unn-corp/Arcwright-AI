import TmuxSection from '../components/TmuxSection';

export default function TmuxPage() {
  return (
    <div className="pt-16">
      {/* Page header */}
      <section className="px-4 sm:px-6 pt-12 pb-8 border-b border-surface-light bg-surface/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="font-mono text-cta text-sm">@arcwright-ai/tmux-setup</span>
            <span className="font-mono text-muted/40 text-sm">→</span>
            <span className="font-mono text-muted text-sm">standalone package</span>
          </div>
          <h1 className="font-mono text-4xl sm:text-5xl font-bold text-foreground mb-4">
            tmux Setup
          </h1>
          <p className="font-sans text-muted text-lg max-w-2xl leading-relaxed">
            Standalone tmux configuration optimised for AI agent workflows.
            Split panes, live agent output, coordinated signals.
          </p>
        </div>
      </section>
      <TmuxSection hideHeader />
    </div>
  );
}
