import { ArrowRight, RefreshCw } from 'lucide-react';

export default function MigrationBanner() {
  return (
    <section className="py-16 px-4 sm:px-6 bg-surface/20">
      <div className="max-w-3xl mx-auto">
        <div className="bg-surface border border-accent-peach/30  p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-12 h-12  bg-accent-peach/10 border border-accent-peach/20 flex items-center justify-center flex-shrink-0">
            <RefreshCw size={22} className="text-accent-peach" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="font-mono font-semibold text-base text-foreground mb-1">
              Migrating from bmad?
            </h3>
            <p className="font-sans text-sm text-muted mb-4 leading-relaxed">
              One command renames all bmad directories, modules, and commands to the arcwright
              namespace — with a 7-step verification pass included.
            </p>
            <div className="flex items-center gap-2 bg-bg border border-surface-light px-4 py-2.5 w-fit">
              <code className="font-mono text-sm text-cta">/arcwright-migrate</code>
              <ArrowRight size={14} className="text-muted" aria-hidden="true" />
              <code className="font-mono text-xs text-muted">--dry-run first</code>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
