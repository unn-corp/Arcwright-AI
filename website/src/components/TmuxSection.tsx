import { Terminal, Layers, Eye, Smartphone, ExternalLink } from 'lucide-react';

const FEATURES = [
  { icon: Layers, label: 'Sessions, workspaces, tabs, panes', detail: 'One more level than tmux, with stable short IDs (w1, w1:t1, w1:p1)' },
  { icon: Terminal, label: 'First-class agent spawning', detail: '`herdr agent start` splits a pane and launches an agent in one call, no wrapper script' },
  { icon: Eye, label: 'Blocking status waits', detail: '`herdr wait agent-status` replaces polling loops entirely' },
  { icon: Smartphone, label: 'Phone PWA (collie, opt-in)', detail: 'Reply to a blocked agent from your phone keyboard, over Tailscale' },
];

export default function TmuxSection({ hideHeader }: { hideHeader?: boolean } = {}) {
  return (
    <section id="herdr" className="pt-8 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {!hideHeader && (
          <div className="mb-12 text-center">
            <h2 className="font-mono text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Herdr
            </h2>
            <p className="font-sans text-muted max-w-xl mx-auto">
              A visibility layer for AI agent workflows. Herdr (herdr.dev) is a terminal
              workspace manager built for AI coding agents, an optional viewing surface
              for in-process agents.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Terminal mockup */}
          <div className="bg-bg border border-surface-light overflow-hidden shadow-xl">
            <div className="flex items-center gap-2 px-4 py-3 bg-surface border-b border-surface-light">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 bg-red-500/70" />
                <div className="w-3 h-3 bg-yellow-500/70" />
                <div className="w-3 h-3 bg-cta/70" />
              </div>
              <span className="font-mono text-xs text-muted ml-2">arcwright / herdr</span>
            </div>
            <div className="p-5 font-mono text-xs leading-loose">
              <div className="text-muted">$ <span className="text-foreground">herdr agent start architect --split right -- claude</span></div>
              <div className="text-cta mt-2">✓ Session attached</div>
              <div className="text-cta">✓ Pane split, agent spawned</div>
              <div className="text-cta">✓ Watching for blocked / done status</div>
              <div className="mt-4 text-muted">
                ─── Arcwright · 2 panes ────────────────────
              </div>
              <div className="mt-2 flex gap-2">
                <div className="flex-1 border border-cta/40 p-2">
                  <div className="text-accent-blue">▸ architect-agent</div>
                  <div className="text-muted mt-1">Designing system…</div>
                </div>
                <div className="flex-1 border border-surface-light p-2">
                  <div className="text-accent-green">▸ dev-agent</div>
                  <div className="text-muted mt-1">Waiting for spec…</div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, label, detail }) => (
              <div
                key={label}
                className="flex items-start gap-4 bg-surface border border-surface-light p-4 hover:border-cta/30 transition-colors duration-200"
              >
                <div className="w-9 h-9 bg-cta/10 border border-cta/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-cta" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-sans font-semibold text-sm text-foreground mb-1">{label}</div>
                  <div className="font-sans text-xs text-muted leading-relaxed">{detail}</div>
                </div>
              </div>
            ))}

            <div className="mt-2 bg-bg border border-surface-light p-4">
              <div className="text-xs font-mono text-muted mb-2">Note</div>
              <p className="font-sans text-xs text-muted leading-relaxed">
                Herdr is a <span className="text-foreground">visibility tool</span>, not a spawn
                mechanism. The in-process <code className="font-mono text-foreground">Agent</code> tool +{' '}
                <code className="font-mono text-foreground">SendMessage</code> flow is the canonical
                orchestration substrate. Herdr panes are an opt-in viewing surface. See the{' '}
                <code className="font-mono text-cta">herdr</code> skill.
              </p>
            </div>

            <div className="mt-2 bg-bg border border-surface-light p-4">
              <div className="text-xs font-mono text-muted mb-2">Get Herdr</div>
              <a
                href="https://herdr.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 font-mono text-sm text-foreground hover:text-cta transition-colors"
              >
                herdr.dev
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
