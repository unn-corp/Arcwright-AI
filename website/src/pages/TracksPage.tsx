import TracksTable from '../components/TracksTable';
import WorkflowCanvas from '../components/WorkflowCanvas';

export default function TracksPage() {
  return (
    <div className="pt-16">
      {/* Canvas — full viewport height */}
      <section className="h-[calc(100vh-4rem)] flex flex-col bg-surface/10 border-b border-surface-light">
        <div className="flex-shrink-0 px-6 pt-6 pb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-mono text-2xl font-bold text-foreground">
              Interactive Workflow Canvas
            </h2>
            <p className="font-sans text-muted text-sm mt-1">
              All 6 tracks side by side. Click a track header to select it, click any step to expand details.
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-auto px-6 pb-6">
          <WorkflowCanvas />
        </div>
      </section>

      {/* Tracks table — below the fold */}
      <TracksTable />
    </div>
  );
}
