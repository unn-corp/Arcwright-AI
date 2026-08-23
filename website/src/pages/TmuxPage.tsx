import TmuxSection from '../components/TmuxSection';

export default function TmuxPage() {
  return (
    <div className="pt-28 lg:pt-16">
      {/* Page header */}
      <section className="px-4 sm:px-6 pt-12 pb-8 border-b border-surface-light bg-surface/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="font-mono text-cta text-sm">herdr.dev</span>
            <span className="font-mono text-muted text-sm" aria-hidden="true">→</span>
            <span className="font-mono text-muted text-sm">terminal workspace manager</span>
          </div>
          <h1 className="font-mono text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Herdr
          </h1>
          <p className="font-sans text-muted text-lg max-w-2xl leading-relaxed">
            A terminal workspace manager built for AI coding agents: a visibility tool,
            not a spawn mechanism. Sessions, workspaces, tabs, and panes, with first-class
            agent spawning and blocking status waits. The Agent tool + SendMessage flow
            is the canonical orchestration substrate; Herdr panes are an opt-in add-on.
          </p>
        </div>
      </section>
      <TmuxSection hideHeader />
    </div>
  );
}
