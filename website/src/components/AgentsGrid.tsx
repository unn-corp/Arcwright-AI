import { agents } from '../data/agents';
import {
  Search, Network, Code2, ClipboardList,
  TestTube2, GitPullRequest, BookOpen, Layers, Bot,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Search, Network, Code2, ClipboardList,
  TestTube2, GitPullRequest, BookOpen, Layers,
};

function AgentIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICON_MAP[name] ?? Bot;
  return <Icon {...props} />;
}

export default function AgentsGrid({ hideHeader }: { hideHeader?: boolean } = {}) {
  return (
    <section id="agents" className="pt-6 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {!hideHeader && (
          <div className="mb-12 text-center">
            <h2 className="font-mono text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Specialist Agents
            </h2>
            <p className="font-sans text-muted max-w-xl mx-auto">
              8 named specialists coordinate across tracks and teams.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map(agent => (
            <div
              key={agent.name}
              className="bg-surface border border-surface-light p-5 flex flex-col gap-3 hover:border-cta/40 hover:bg-surface/80 transition-all duration-200 group"
            >
              {/* Icon + name row */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-cta/10 border border-cta/20 flex items-center justify-center flex-shrink-0 group-hover:bg-cta/15 transition-colors duration-200">
                  <AgentIcon name={agent.icon} size={18} className="text-cta" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-mono font-semibold text-sm text-foreground leading-tight">
                    {agent.name}
                  </div>
                  <div className="font-sans text-xs text-muted mt-0.5">{agent.role}</div>
                </div>
              </div>

              {/* Description */}
              <p className="font-sans text-xs text-muted leading-relaxed">
                {agent.description}
              </p>

              {/* Primary skills */}
              {agent.primarySkills.length > 0 && (
                <div>
                  <div className="font-mono text-[10px] text-muted/60 uppercase tracking-wider mb-1.5">
                    Key skills
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agent.primarySkills.map(skill => (
                      <span
                        key={skill}
                        className="font-mono text-[10px] px-1.5 py-0.5 bg-cta/10 text-cta/80 border border-cta/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Collaborates with */}
              {agent.collaboratesWith.length > 0 && (
                <div className="pt-2 border-t border-surface-light">
                  <span className="font-mono text-[10px] text-muted/60 uppercase tracking-wider">
                    Pairs with:{' '}
                  </span>
                  <span className="font-sans text-xs text-muted/80">
                    {agent.collaboratesWith.join(', ')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
