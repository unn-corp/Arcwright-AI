import { Workflow as WorkflowIcon, Cpu, Repeat, Eye, ArrowRight, GitBranch, Target } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { workflows, type Workflow, type WorkflowCategory } from '../data/workflows';

const CATEGORY_STYLES: Record<WorkflowCategory, { border: string; badge: string; text: string }> = {
  router: {
    border: 'border-accent-mauve/30 hover:border-accent-mauve/60',
    badge: 'bg-accent-mauve/10 text-accent-mauve',
    text: 'text-accent-mauve',
  },
  runtime: {
    border: 'border-accent-blue/30 hover:border-accent-blue/60',
    badge: 'bg-accent-blue/10 text-accent-blue',
    text: 'text-accent-blue',
  },
  loop: {
    border: 'border-accent-peach/30 hover:border-accent-peach/60',
    badge: 'bg-accent-peach/10 text-accent-peach',
    text: 'text-accent-peach',
  },
  visibility: {
    border: 'border-accent-green/30 hover:border-accent-green/60',
    badge: 'bg-accent-green/10 text-accent-green',
    text: 'text-accent-green',
  },
};

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  workflow: WorkflowIcon,
  cpu: Cpu,
  repeat: Repeat,
  eye: Eye,
  gitbranch: GitBranch,
  target: Target,
};

function RuntimeIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICON_MAP[name.toLowerCase()] ?? WorkflowIcon;
  return <Icon {...props} />;
}

const CATEGORY_LABELS: Record<WorkflowCategory, string> = {
  router: 'Router',
  runtime: 'Runtime',
  loop: 'Loop',
  visibility: 'Visibility',
};

const CATEGORY_ORDER: WorkflowCategory[] = ['router', 'runtime', 'loop', 'visibility'];

const RUNTIMES: Workflow[] = workflows;

export default function WorkflowsPage() {
  return (
    <div className="pt-28 lg:pt-16">
      {/* Page header */}
      <section className="px-4 sm:px-6 pt-12 pb-10 border-b border-surface-light bg-surface/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="font-mono text-cta text-sm">/triage</span>
            <span className="font-mono text-muted text-sm" aria-hidden="true">→</span>
            <span className="font-mono text-muted text-sm">workflow router</span>
          </div>
          <h1 className="font-mono text-4xl sm:text-5xl font-bold text-foreground mb-4">
            How Arcwright Orchestrates
          </h1>
          <p className="font-sans text-muted text-lg max-w-3xl leading-relaxed">
            There are no tracks to pick. <code className="font-mono text-sm text-cta bg-surface px-1.5 py-0.5">/triage</code>{' '}
            is a <span className="text-foreground">workflow router</span>. Given a task, it recommends one of the
            runtimes below based on the task's shape, then the chosen workflow dispatches it.
            For clear, well-scoped work, just call the specialist directly and skip the router.
          </p>
        </div>
      </section>

      {/* The router → runtime flow */}
      <section className="px-4 sm:px-6 pt-12 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              1. Router
            </span>
            <ArrowRight size={14} className="text-muted" aria-hidden="true" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              2. Runtime
            </span>
            <ArrowRight size={14} className="text-muted" aria-hidden="true" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              3. Result
            </span>
          </div>

          {CATEGORY_ORDER.map(category => {
            const items = RUNTIMES.filter(r => r.category === category);
            if (items.length === 0) return null;
            const styles = CATEGORY_STYLES[category];
            return (
              <div key={category} className="mb-10">
                <h2 className={`font-mono text-sm font-semibold uppercase tracking-widest mb-4 ${styles.text}`}>
                  {CATEGORY_LABELS[category]}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(runtime => (
                    <div
                      key={runtime.slug}
                      className={`bg-surface border ${styles.border} p-5 transition-all duration-200 hover:bg-surface/80 group`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 bg-cta/10 border border-cta/20 flex items-center justify-center flex-shrink-0 group-hover:bg-cta/15 transition-colors duration-200">
                          <RuntimeIcon
                            name={runtime.icon ?? 'workflow'}
                            size={18}
                            className={styles.text}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono font-semibold text-sm text-foreground leading-tight">
                            {runtime.name}
                          </div>
                          <div className="font-mono text-[10px] text-muted mt-1">
                            {runtime.trigger}
                          </div>
                        </div>
                      </div>

                      <p className="font-sans text-sm text-muted leading-relaxed mb-3">
                        {runtime.description}
                      </p>

                      <div className="pt-2 border-t border-surface-light">
                        <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
                          Best for:{' '}
                        </span>
                        <span className="font-sans text-xs text-muted">
                          {runtime.bestFor}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Decision tree */}
      <section className="px-4 sm:px-6 pt-4 pb-12 bg-surface/20 border-t border-surface-light">
        <div className="max-w-7xl mx-auto">
          <div className="pt-10">
            <h2 className="font-mono text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Decision Tree
            </h2>
            <p className="font-sans text-muted text-base max-w-3xl leading-relaxed mb-6">
              The router maps a task's shape to a runtime. Default to the smallest runtime that
              fits; scale up when the work is comprehensive or the user has asked for it.
            </p>
          </div>

          <div className="bg-bg border border-surface-light overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="border-b border-surface-light bg-surface/40">
                  <th className="font-mono text-xs uppercase tracking-wider text-muted px-4 py-3 font-semibold">
                    Task shape
                  </th>
                  <th className="font-mono text-xs uppercase tracking-wider text-muted px-4 py-3 font-semibold">
                    Recommended runtime
                  </th>
                </tr>
              </thead>
              <tbody className="font-sans text-sm">
                {[
                  {
                    shape: '1–3 files, single role, clear deliverable',
                    runtime: 'Plain in-process agent (single spawn)',
                  },
                  {
                    shape: '4–10 files, multiple roles, known shape',
                    runtime: 'Plain in-process agents (parallel fan-out, 2–3 roles)',
                  },
                  {
                    shape: '12+ files, multi-stage, dependencies between stages',
                    runtime: 'ultracode dynamic workflow (pipeline by default)',
                  },
                  {
                    shape: 'Unknown-size discovery (audits, "find every X")',
                    runtime: 'ultracode dynamic workflow (loop-until-dry)',
                  },
                  {
                    shape: 'Completion is a verification check ("tests pass", "lint clean")',
                    runtime: '/goal loop',
                  },
                  {
                    shape: 'User wants to watch AND $HERDR_ENV is set AND work is long',
                    runtime: 'Add Herdr opt-in visibility to whichever runtime above was chosen',
                  },
                  {
                    shape: 'Genuinely ambiguous, possibly a single change or a sweep',
                    runtime: 'Ask one clarifying question before routing',
                  },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-surface-light/60 last:border-b-0 hover:bg-surface/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-foreground">{row.shape}</td>
                    <td className="px-4 py-3 text-cta font-mono text-xs">{row.runtime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="px-4 sm:px-6 pt-10 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-bg border border-surface-light p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cta/10 border border-cta/20 flex items-center justify-center flex-shrink-0">
                <WorkflowIcon size={20} className="text-cta" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-mono text-lg font-semibold text-foreground mb-2">
                  When to call /triage
                </h3>
                <p className="font-sans text-sm text-muted leading-relaxed mb-2">
                  Use <code className="font-mono text-xs text-cta bg-surface px-1.5 py-0.5">/triage</code> for
                  ambiguous tasks: anything you can't size at a glance, multi-stage work,
                  or anything that might benefit from <code className="font-mono text-xs text-cta bg-surface px-1.5 py-0.5">ultracode</code> or{' '}
                  <code className="font-mono text-xs text-cta bg-surface px-1.5 py-0.5">/goal</code>.
                </p>
                <p className="font-sans text-sm text-muted leading-relaxed">
                  For clear, small work such as "fix this typo", "add a button", or "review this
                  diff", call the specialist directly. No router needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
