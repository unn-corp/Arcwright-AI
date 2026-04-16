import { Terminal, Layers, Zap, Eye } from 'lucide-react';

const FEATURES = [
  { icon: Layers, label: 'Catppuccin Frappe theme', detail: 'Powerline status bar, Nerd Font optimised' },
  { icon: Zap,    label: 'Agent orchestration scripts', detail: 'dispatch.sh, float_term.sh, watch-sync.sh' },
  { icon: Eye,    label: 'Pane title sync', detail: "Auto-updates from Claude Code's OSC 2 title" },
  { icon: Terminal, label: 'Actions popup',  detail: 'Window, pane, clipboard, and launch shortcuts' },
];

export default function TmuxSection({ hideHeader }: { hideHeader?: boolean } = {}) {
  return (
    <section id="tmux" className="pt-8 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {!hideHeader && (
          <div className="mb-12 text-center">
            <h2 className="font-mono text-3xl sm:text-4xl font-bold text-foreground mb-4">
              tmux Setup
            </h2>
            <p className="font-sans text-muted max-w-xl mx-auto">
              Standalone tmux configuration optimised for AI agent workflows.
              Split panes, live agent output, coordinated signals.
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
              <span className="font-mono text-xs text-muted ml-2">arcwright — tmux</span>
            </div>
            <div className="p-5 font-mono text-xs leading-loose">
              <div className="text-muted">$ <span className="text-foreground">npx @arcwright-ai/tmux-setup</span></div>
              <div className="text-cta mt-2">✓ Catppuccin Frappe theme applied</div>
              <div className="text-cta">✓ Pane title sync enabled</div>
              <div className="text-cta">✓ Clipboard integration (WSL2 → Windows)</div>
              <div className="text-cta">✓ Actions popup installed</div>
              <div className="text-cta">✓ Agent orchestration scripts ready</div>
              <div className="mt-4 text-muted/60">
                ─── Arcwright · 2 panes ────────────────────
              </div>
              <div className="mt-2 flex gap-2">
                <div className="flex-1 border border-cta/40 p-2">
                  <div className="text-accent-blue">▸ architect-agent</div>
                  <div className="text-muted/60 mt-1">Designing system…</div>
                </div>
                <div className="flex-1 border border-surface-light p-2">
                  <div className="text-accent-green">▸ dev-agent</div>
                  <div className="text-muted/60 mt-1">Waiting for spec…</div>
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
              <div className="text-xs font-mono text-muted mb-2">Standalone install</div>
              <code className="font-mono text-sm text-foreground">
                npx @arcwright-ai/tmux-setup
              </code>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
