import { tracks } from '../data/tracks';

export default function TracksTable() {
  return (
    <section id="tracks" className="pt-6 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="reveal">
        <div className="mb-12 text-center">
          <h2 className="font-mono text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Workflow Tracks
          </h2>
          <p className="font-sans text-muted max-w-xl mx-auto">
            Pick the track sized to your task. The orchestrator handles the rest.
          </p>
        </div>

        <div className="overflow-x-auto border border-surface-light">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-surface-light bg-surface/50">
                <th className="px-4 py-3 text-left font-mono text-xs text-muted uppercase tracking-wider" scope="col">Command</th>
                <th className="px-4 py-3 text-left font-mono text-xs text-muted uppercase tracking-wider" scope="col">Scope</th>
                <th className="px-4 py-3 text-left font-mono text-xs text-muted uppercase tracking-wider hidden sm:table-cell" scope="col">Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-light">
              {tracks.map((track) => (
                <tr
                  key={track.command}
                  className="group hover:bg-surface/60 transition-colors duration-150"
                >
                  <td className="px-4 py-4">
                    <code className="font-mono text-xs sm:text-sm text-cta bg-surface/80 px-2 py-1 group-hover:bg-cta/10 transition-colors duration-150">
                      {track.command}
                    </code>

                  </td>
                  <td className="px-4 py-4 font-sans text-muted text-xs sm:text-sm whitespace-nowrap">
                    {track.scope}
                  </td>
                  <td className="px-4 py-4 font-sans text-muted text-xs sm:text-sm hidden sm:table-cell leading-relaxed">
                    {track.pipeline}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
