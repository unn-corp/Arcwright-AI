import AgentsGrid from '../components/AgentsGrid';
import { agents } from '../data/agents';

export default function AgentsPage() {
  return (
    <div className="pt-28 lg:pt-16">
      {/* Page header */}
      <section className="px-4 sm:px-6 pt-12 pb-8 border-b border-surface-light bg-surface/20">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-mono text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Specialist Agents
          </h1>
          <p className="font-sans text-muted text-lg max-w-2xl leading-relaxed">
            {agents.length} named roles coordinate across agent teams. Each has a
            focused role, a curated skill set, and clear collaboration contracts
            with the others.
          </p>
          <div className="mt-6 font-mono text-sm text-muted border-l-2 border-cta/40 pl-4">
            Spawn in-process via the Agent tool. Reuse across follow-ups with SendMessage
            and the Session Agent Registry. Herdr pane visibility is an opt-in add-on.
          </div>
        </div>
      </section>

      <AgentsGrid hideHeader />
    </div>
  );
}
