import { teams, type TeamCategory } from '../data/teams';

const CATEGORY_STYLES: Record<TeamCategory, { border: string; badge: string; text: string }> = {
  Development: {
    border: 'border-accent-blue/30 hover:border-accent-blue/60',
    badge: 'bg-accent-blue/10 text-accent-blue',
    text: 'text-accent-blue',
  },
  Review: {
    border: 'border-accent-peach/30 hover:border-accent-peach/60',
    badge: 'bg-accent-peach/10 text-accent-peach',
    text: 'text-accent-peach',
  },
  Planning: {
    border: 'border-accent-mauve/30 hover:border-accent-mauve/60',
    badge: 'bg-accent-mauve/10 text-accent-mauve',
    text: 'text-accent-mauve',
  },
  Specialist: {
    border: 'border-accent-green/30 hover:border-accent-green/60',
    badge: 'bg-accent-green/10 text-accent-green',
    text: 'text-accent-green',
  },
  Solo: {
    border: 'border-surface-light/60 hover:border-muted/40',
    badge: 'bg-surface-light/60 text-muted',
    text: 'text-muted',
  },
};

const CATEGORIES: TeamCategory[] = ['Development', 'Review', 'Planning', 'Specialist', 'Solo'];

export default function TeamsGrid({ hideHeader }: { hideHeader?: boolean } = {}) {
  return (
    <section id="teams" className="pt-6 pb-16 px-4 sm:px-6 bg-surface/20">
      <div className="max-w-7xl mx-auto">
        {!hideHeader && (
          <div className="mb-12 text-center">
            <h2 className="font-mono text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Agent Teams
            </h2>
            <p className="font-sans text-muted max-w-xl mx-auto">
              17 pre-built team compositions. Use{' '}
              <code className="font-mono text-xs bg-surface px-1.5 py-0.5 text-cta">/team</code>
              {' '}for the interactive selector.
            </p>
          </div>
        )}

        {CATEGORIES.map(category => {
          const categoryTeams = teams.filter(t => t.category === category);
          const styles = CATEGORY_STYLES[category];
          return (
            <div key={category} className="mb-10">
              <h3 className={`font-mono text-sm font-semibold uppercase tracking-widest mb-4 ${styles.text}`}>
                {category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryTeams.map(team => (
                  <div
                    key={team.code}
                    className={`bg-surface border ${styles.border} p-4 transition-all duration-200 hover:bg-surface/80 group`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="font-mono text-base font-semibold text-foreground leading-tight">
                        {team.name}
                      </span>
                      <code
                        className={`text-xs font-mono px-1.5 py-0.5 flex-shrink-0 ${styles.badge}`}
                      >
                        /{team.code}
                      </code>
                    </div>
                    <p className="font-sans text-xs text-muted leading-relaxed mb-3">
                      {team.description || team.whenToUse}
                    </p>
                    <div className="font-mono text-xs text-muted/60 pt-2 border-t border-surface-light">
                      {team.composition}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
