import { useState } from 'react';
import { workflows, type WorkflowTrack, type WorkflowStep, type StepType } from '../data/workflows';

// ─── Step styling ────────────────────────────────────────────────────────────

const STEP_STYLES: Record<StepType, { border: string; bg: string; labelColor: string }> = {
  normal: {
    border: 'border-surface-light',
    bg: 'bg-surface',
    labelColor: 'text-foreground',
  },
  'review-gate': {
    border: 'border-[#CA9EE6]/60',
    bg: 'bg-[#CA9EE6]/5',
    labelColor: 'text-[#CA9EE6]',
  },
  approval: {
    border: 'border-[#f87171]/60',
    bg: 'bg-[#f87171]/5',
    labelColor: 'text-[#f87171]',
  },
  merge: {
    border: 'border-cta/60',
    bg: 'bg-cta/5',
    labelColor: 'text-cta',
  },
  'scope-guard': {
    border: 'border-dashed border-[#fb923c]/60',
    bg: 'bg-[#fb923c]/5',
    labelColor: 'text-[#fb923c]',
  },
  loop: {
    border: 'border-[#fbbf24]/60',
    bg: 'bg-[#fbbf24]/5',
    labelColor: 'text-[#fbbf24]',
  },
};

const MODE_STYLES: Record<string, string> = {
  'split-pane': 'bg-[#CA9EE6]/15 text-[#CA9EE6] border border-[#CA9EE6]/30',
  'in-process': 'bg-surface-light/80 text-muted border border-surface-light',
};

// ─── Step card (always expanded) ─────────────────────────────────────────────

function StepCard({ step, index }: { step: WorkflowStep; index: number }) {
  const styles = STEP_STYLES[step.type];

  return (
    <div
      className={`border ${styles.border} ${styles.bg} ${
        step.optional ? 'opacity-75' : ''
      }`}
    >
      {/* Header row */}
      <div className="px-3 pt-2.5 pb-1.5">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-[10px] text-muted/50 flex-shrink-0 tabular-nums w-4 text-right">
              {index + 1}.
            </span>
            <span className={`font-mono text-xs font-semibold leading-tight break-words ${styles.labelColor}`}>
              {step.label}
            </span>
          </div>
          {step.mode && (
            <span className={`font-mono text-[9px] px-1.5 py-0.5 flex-shrink-0 ${MODE_STYLES[step.mode]}`}>
              {step.mode === 'split-pane' ? 'pane' : 'proc'}
            </span>
          )}
        </div>
      </div>

      {/* Always-visible details */}
      <div className="px-3 pb-2.5 space-y-1.5 border-t border-surface-light/40">
        {step.agent && (
          <div className="font-mono text-[9px] text-muted/70 mt-1.5">{step.agent}</div>
        )}
        {step.subAgents && step.subAgents.length > 0 && (
          <div>
            <span className="font-mono text-[9px] text-muted/40 uppercase tracking-wider">Sub-agents</span>
            <ul className="mt-0.5 space-y-0.5">
              {step.subAgents.map(sa => (
                <li key={sa} className="font-mono text-[9px] text-muted flex items-start gap-1">
                  <span className="text-muted/30 flex-shrink-0">•</span>{sa}
                </li>
              ))}
            </ul>
          </div>
        )}
        {step.inputs && step.inputs.length > 0 && (
          <div>
            <span className="font-mono text-[9px] text-muted/40 uppercase tracking-wider">In</span>
            <ul className="mt-0.5 space-y-0.5">
              {step.inputs.map(inp => (
                <li key={inp} className="font-mono text-[9px] text-accent-blue flex items-start gap-1">
                  <span className="text-muted/30 flex-shrink-0">→</span>{inp}
                </li>
              ))}
            </ul>
          </div>
        )}
        {step.outputs && step.outputs.length > 0 && (
          <div>
            <span className="font-mono text-[9px] text-muted/40 uppercase tracking-wider">Out</span>
            <ul className="mt-0.5 space-y-0.5">
              {step.outputs.map(out => (
                <li key={out} className="font-mono text-[9px] text-cta flex items-start gap-1">
                  <span className="text-muted/30 flex-shrink-0">←</span>{out}
                </li>
              ))}
            </ul>
          </div>
        )}
        {step.note && (
          <div className="font-sans text-[9px] text-muted/50 italic leading-tight">{step.note}</div>
        )}
        {step.loopTarget && (
          <div className="font-mono text-[9px] text-[#fbbf24]">loop → {step.loopTarget}</div>
        )}
      </div>
    </div>
  );
}

// ─── Track column ─────────────────────────────────────────────────────────────

function TrackColumn({
  track,
  selected,
  onSelect,
}: {
  track: WorkflowTrack;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`flex-1 min-w-[160px] flex flex-col border-2 transition-all duration-200 overflow-hidden ${
        selected ? 'shadow-lg' : 'border-surface-light'
      }`}
      style={{ borderColor: selected ? track.accentColor : undefined }}
    >
      {/* Header */}
      <button
        className="w-full text-left px-3 py-3 cursor-pointer transition-opacity duration-200 hover:opacity-90 flex-shrink-0"
        style={{ backgroundColor: track.headerBg }}
        onClick={onSelect}
        aria-pressed={selected}
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="font-mono text-base font-bold" style={{ color: track.accentColor }}>
            [{track.letter}]
          </span>
          <span
            className="font-mono text-[9px] px-1.5 py-0.5"
            style={{ color: track.accentColor, backgroundColor: `${track.accentColor}20` }}
          >
            {track.score}
          </span>
        </div>
        <div className="font-mono text-sm font-semibold text-foreground">{track.name}</div>
        <div className="font-sans text-[9px] text-muted/70 mt-0.5 leading-tight">{track.scope}</div>
      </button>

      {/* Steps — scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-bg/40">
        {track.steps.map((step, idx) => (
          <div key={idx}>
            <StepCard step={step} index={idx} />
            {idx < track.steps.length - 1 && (
              <div className="flex justify-center my-0.5" aria-hidden="true">
                <span className="text-muted/30 text-xs">↓</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile tab view ─────────────────────────────────────────────────────────

function MobileTrackView({ track }: { track: WorkflowTrack }) {
  return (
    <div className="space-y-2">
      {track.steps.map((step, idx) => (
        <div key={idx}>
          <StepCard step={step} index={idx} />
          {idx < track.steps.length - 1 && (
            <div className="flex justify-center my-1" aria-hidden="true">
              <span className="text-muted/30 text-sm">↓</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  const items = [
    { color: 'bg-surface-light border-surface-light', label: 'Normal step' },
    { color: 'border-[#CA9EE6]/60 bg-[#CA9EE6]/5', label: 'Review Gate' },
    { color: 'border-[#f87171]/60 bg-[#f87171]/5', label: 'User Approval / HALT' },
    { color: 'border-cta/60 bg-cta/5', label: '/prepare-to-merge' },
    { color: 'border-dashed border-[#fb923c]/60 bg-[#fb923c]/5', label: 'Scope guard / optional' },
    { color: 'border-[#fbbf24]/60 bg-[#fbbf24]/5', label: 'Loop step' },
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 border ${item.color} flex-shrink-0`} />
          <span className="font-sans text-[10px] text-muted">{item.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className={`font-mono text-[9px] px-1.5 py-0.5 ${MODE_STYLES['split-pane']}`}>pane</span>
        <span className="font-sans text-[10px] text-muted">split-pane agent</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`font-mono text-[9px] px-1.5 py-0.5 ${MODE_STYLES['in-process']}`}>proc</span>
        <span className="font-sans text-[10px] text-muted">in-process agent</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WorkflowCanvas() {
  const [selectedTrack, setSelectedTrack] = useState(0);
  const activeTrack = workflows[selectedTrack];

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Legend + tmux notice row */}
      <div className="flex flex-wrap items-center gap-4 flex-shrink-0">
        <div className="bg-surface border border-surface-light px-3 py-2 text-[10px] font-mono text-muted">
          <span className="text-cta font-semibold">tmux:</span>{' '}
          <span className="text-[#CA9EE6]">pane</span> = split-pane ·{' '}
          <span className="text-muted/60">proc</span> = in-process
        </div>
        <Legend />
      </div>

      {/* Desktop: full-width columns */}
      <div className="hidden md:flex gap-2 flex-1 min-h-0">
        {workflows.map((track, idx) => (
          <TrackColumn
            key={track.id}
            track={track}
            selected={selectedTrack === idx}
            onSelect={() => setSelectedTrack(idx)}
          />
        ))}
      </div>

      {/* Mobile: tab switcher */}
      <div className="md:hidden">
        {/* Tab bar */}
        <div className="flex overflow-x-auto gap-1 mb-4 pb-1">
          {workflows.map((track, idx) => (
            <button
              key={track.id}
              onClick={() => setSelectedTrack(idx)}
              className={`flex-shrink-0 font-mono text-xs px-3 py-2 border transition-all duration-200 cursor-pointer ${
                selectedTrack === idx
                  ? 'border-opacity-100 text-foreground'
                  : 'border-surface-light text-muted hover:text-foreground'
              }`}
              style={
                selectedTrack === idx
                  ? { borderColor: track.accentColor, backgroundColor: track.headerBg, color: track.accentColor }
                  : undefined
              }
              aria-pressed={selectedTrack === idx}
            >
              [{track.letter}] {track.name}
            </button>
          ))}
        </div>

        {/* Active track header */}
        <div
          className="px-4 py-3 mb-0"
          style={{ backgroundColor: activeTrack.headerBg }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg font-bold" style={{ color: activeTrack.accentColor }}>
              [{activeTrack.letter}] {activeTrack.name}
            </span>
            <span
              className="font-mono text-xs px-2 py-1"
              style={{ color: activeTrack.accentColor, backgroundColor: `${activeTrack.accentColor}20` }}
            >
              score {activeTrack.score}
            </span>
          </div>
          <div className="font-sans text-sm text-muted/70 mt-1">{activeTrack.scope}</div>
        </div>

        {/* Active track steps */}
        <div className="bg-bg/40 border border-surface-light p-3">
          <MobileTrackView track={activeTrack} />
        </div>
      </div>
    </div>
  );
}
