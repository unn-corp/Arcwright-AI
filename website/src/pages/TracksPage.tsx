import { useState } from 'react';
import { Columns3, Rows3 } from 'lucide-react';
import TracksTable from '../components/TracksTable';
import WorkflowCanvas from '../components/WorkflowCanvas';

export type ViewMode = 'canvas' | 'rows';

export default function TracksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('rows');

  return (
    <div className="pt-16">
      {/* Canvas */}
      <section className="flex flex-col bg-surface/10 border-b border-surface-light">
        <div className="flex-shrink-0 px-6 pt-6 pb-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-mono text-2xl font-bold text-foreground">
              Interactive Workflow Canvas
            </h2>
            <p className="font-sans text-muted text-sm mt-1">
              {viewMode === 'canvas'
                ? 'Scroll-zoom · drag to pan · click a track header to select.'
                : 'All 6 tracks expanded. Scroll horizontally within each row.'}
            </p>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setViewMode('canvas')}
              title="Column canvas view"
              className={`p-2 border transition-colors duration-150 cursor-pointer ${
                viewMode === 'canvas'
                  ? 'bg-cta/10 border-cta/40 text-cta'
                  : 'bg-surface border-surface-light text-muted hover:text-foreground hover:border-muted/40'
              }`}
            >
              <Columns3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('rows')}
              title="Horizontal rows view"
              className={`p-2 border transition-colors duration-150 cursor-pointer ${
                viewMode === 'rows'
                  ? 'bg-cta/10 border-cta/40 text-cta'
                  : 'bg-surface border-surface-light text-muted hover:text-foreground hover:border-muted/40'
              }`}
            >
              <Rows3 size={16} />
            </button>
          </div>
        </div>
        <div className="pb-4">
          <WorkflowCanvas viewMode={viewMode} />
        </div>
      </section>

      {/* Tracks table — below the fold */}
      <TracksTable />
    </div>
  );
}
