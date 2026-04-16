import { Fragment, useState, useRef, useEffect } from 'react';
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
            <span className="font-mono text-xs text-muted/70 flex-shrink-0 tabular-nums w-4 text-right">
              {index + 1}.
            </span>
            <span className={`font-mono text-sm font-semibold leading-tight break-words ${styles.labelColor}`}>
              {step.label}
            </span>
          </div>
          {step.mode && (
            <span className={`font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0 ${MODE_STYLES[step.mode]}`}>
              {step.mode === 'split-pane' ? 'pane' : 'proc'}
            </span>
          )}
        </div>
        {step.description && (
          <div className="font-sans text-xs italic text-muted/90 mt-1 leading-tight pl-5">
            {step.description}
          </div>
        )}
      </div>

      {/* Always-visible details */}
      <div className="px-3 pb-2.5 space-y-1.5 border-t border-surface-light/40">
        {step.agent && (
          <div className="font-mono text-xs text-muted/90 mt-1.5">{step.agent}</div>
        )}
        {step.subAgents && step.subAgents.length > 0 && (
          <div>
            <span className="font-mono text-[10px] text-muted/80 tracking-wider">Sub-agents</span>
            <ul className="mt-0.5 space-y-0.5">
              {step.subAgents.map(sa => (
                <li key={sa} className="font-mono text-[11px] text-foreground/90 flex items-start gap-1">
                  <span className="text-muted/70 flex-shrink-0">•</span>{sa}
                </li>
              ))}
            </ul>
          </div>
        )}
        {step.inputs && step.inputs.length > 0 && (
          <div>
            <span className="font-mono text-[10px] text-muted/80 tracking-wider">In</span>
            <ul className="mt-0.5 space-y-0.5">
              {step.inputs.map(inp => (
                <li key={inp} className="font-mono text-[11px] text-foreground/90 flex items-start gap-1">
                  <span className="text-[#8CAAEE]/80 flex-shrink-0">→</span>{inp}
                </li>
              ))}
            </ul>
          </div>
        )}
        {step.outputs && step.outputs.length > 0 && (
          <div>
            <span className="font-mono text-[10px] text-muted/80 tracking-wider">Out</span>
            <ul className="mt-0.5 space-y-0.5">
              {step.outputs.map(out => (
                <li key={out} className="font-mono text-[11px] text-foreground/90 flex items-start gap-1">
                  <span className="text-cta/80 flex-shrink-0">←</span>{out}
                </li>
              ))}
            </ul>
          </div>
        )}
        {step.note && (
          <div className="font-sans text-[11px] text-muted/80 italic leading-tight">{step.note}</div>
        )}
        {step.loopTarget && (
          <div className="font-mono text-[11px] text-[#fbbf24]">loop → {step.loopTarget}</div>
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
  const [hovered, setHovered] = useState(false);
  const lifted = selected || hovered;

  return (
    <div
      className={`flex-shrink-0 w-52 flex flex-col border-2 transition-colors duration-200 ${
        lifted ? 'border-surface-light/80' : 'border-surface-light'
      }`}
      style={{ backgroundColor: lifted ? 'rgba(36,36,36,0.3)' : undefined }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <button
        className="w-full text-left px-3 py-3 cursor-pointer transition-opacity duration-200 hover:opacity-90 flex-shrink-0"
        style={{ backgroundColor: track.headerBg }}
        onClick={onSelect}
        aria-pressed={selected}
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="font-mono text-xl font-bold" style={{ color: track.accentColor }}>
            [{track.letter}]
          </span>
          <span
            className="font-mono text-[10px] px-1.5 py-0.5"
            style={{ color: track.accentColor, backgroundColor: `${track.accentColor}20` }}
          >
            {track.score}
          </span>
        </div>
        <div className="font-mono text-base font-semibold text-foreground">{track.name}</div>
        <div className="font-sans text-xs text-muted/70 mt-0.5 leading-tight">{track.scope}</div>
      </button>

      {/* Steps — full height, no internal scroll */}
      <div className="p-2 space-y-1.5 bg-bg/40">
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

// ─── Lerp helper ─────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ─── Rows view ────────────────────────────────────────────────────────────────

function RowStepCard({ step, index }: { step: WorkflowStep; index: number }) {
  const styles = STEP_STYLES[step.type];
  return (
    <div className={`border ${styles.border} ${styles.bg} min-w-[300px] max-w-[360px] flex-shrink-0 flex flex-col ${step.optional ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <span className="font-mono text-sm text-muted/70 flex-shrink-0 tabular-nums mt-0.5">{index + 1}.</span>
            <span className={`font-mono text-base font-semibold leading-tight ${styles.labelColor}`}>
              {step.label}
            </span>
          </div>
          {step.mode && (
            <span className={`font-mono text-xs px-1.5 py-0.5 flex-shrink-0 mt-0.5 ${MODE_STYLES[step.mode]}`}>
              {step.mode === 'split-pane' ? 'pane' : 'proc'}
            </span>
          )}
        </div>
        {step.description && (
          <p className="font-sans text-sm italic text-muted/90 mt-1.5 leading-snug pl-5">
            {step.description}
          </p>
        )}
      </div>

      {/* Details */}
      <div className="px-4 pb-3 space-y-2 border-t border-surface-light/40">
        {step.agent && (
          <div className="font-mono text-sm text-muted/90 mt-2">{step.agent}</div>
        )}
        {step.subAgents && step.subAgents.length > 0 && (
          <div>
            <div className="font-mono text-xs text-muted/80 uppercase tracking-wider mb-1">Sub-agents</div>
            <ul className="space-y-0.5">
              {step.subAgents.map(sa => (
                <li key={sa} className="font-mono text-sm text-foreground/90 flex items-start gap-1.5">
                  <span className="text-muted/70 flex-shrink-0">•</span>{sa}
                </li>
              ))}
            </ul>
          </div>
        )}
        {step.inputs && step.inputs.length > 0 && (
          <div>
            <div className="font-mono text-xs text-muted/80 uppercase tracking-wider mb-1">In</div>
            <ul className="space-y-0.5">
              {step.inputs.map(inp => (
                <li key={inp} className="font-mono text-sm text-foreground/90 flex items-start gap-1.5">
                  <span className="text-[#8CAAEE]/80 flex-shrink-0">→</span>{inp}
                </li>
              ))}
            </ul>
          </div>
        )}
        {step.outputs && step.outputs.length > 0 && (
          <div>
            <div className="font-mono text-xs text-muted/80 uppercase tracking-wider mb-1">Out</div>
            <ul className="space-y-0.5">
              {step.outputs.map(out => (
                <li key={out} className="font-mono text-sm text-foreground/90 flex items-start gap-1.5">
                  <span className="text-cta/80 flex-shrink-0">←</span>{out}
                </li>
              ))}
            </ul>
          </div>
        )}
        {step.note && (
          <p className="font-sans text-sm text-muted/80 italic leading-snug">{step.note}</p>
        )}
        {step.loopTarget && (
          <div className="font-mono text-sm text-[#fbbf24]">loop → {step.loopTarget}</div>
        )}
      </div>
    </div>
  );
}

function RowsView() {
  return (
    <div className="space-y-0">
      {workflows.map((track) => (
        <div key={track.id} className="flex border-b border-surface-light last:border-b-0">
          {/* Track header — fixed left band */}
          <div
            className="flex-shrink-0 w-44 flex flex-col justify-start px-4 py-4 sticky left-0 z-10 border-r border-surface-light/60"
            style={{ backgroundColor: track.headerBg }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-2xl font-bold" style={{ color: track.accentColor }}>
                [{track.letter}]
              </span>
              <span
                className="font-mono text-xs px-1.5 py-0.5"
                style={{ color: track.accentColor, backgroundColor: `${track.accentColor}20` }}
              >
                {track.score}
              </span>
            </div>
            <div className="font-mono text-base font-semibold text-foreground">{track.name}</div>
            <div className="font-sans text-xs text-muted/70 mt-1 leading-tight">{track.scope}</div>
          </div>

          {/* Steps — horizontal scroll */}
          <div className="flex-1 overflow-x-auto rows-scroll">
            <div className="flex items-center gap-0 p-3 w-max">
              {track.steps.map((step, idx) => (
                <Fragment key={idx}>
                  <RowStepCard step={step} index={idx} />
                  {idx < track.steps.length - 1 && (
                    <div className="flex-shrink-0 px-1.5" aria-hidden="true">
                      <span className="text-muted/30 text-base">→</span>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

// 6 columns × 208px + 5 gaps × 8px (gap-2 = 8px between columns)
const CONTENT_WIDTH = 6 * 208 + 5 * 8; // = 1288px

export default function WorkflowCanvas({ viewMode = 'canvas' }: { viewMode?: 'canvas' | 'rows' }) {
  const [selectedTrack, setSelectedTrack] = useState(0);
  const activeTrack = workflows[selectedTrack];

  // Canvas animation refs — no useState to avoid re-renders per frame
  const targetRef = useRef({ x: 0, y: 0, scale: 1 });
  const currentRef = useRef({ x: 0, y: 0, scale: 1 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const isDragging = useRef(false);
  const dragCommitted = useRef(false); // true once movement exceeds threshold
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const userHasZoomed = useRef(false);

  // Scale readout state — throttled update
  const [scaleDisplay, setScaleDisplay] = useState(100);
  const lastDisplayedScale = useRef(1);

  // Fit to container on mount and resize
  useEffect(() => {
    function applyFit() {
      if (!canvasRef.current || !innerRef.current || userHasZoomed.current) return;
      const w = canvasRef.current.offsetWidth;
      if (w === 0) return; // not painted yet
      // Measure actual content width by temporarily reading scrollWidth at scale=1,
      // or fall back to the computed constant
      const contentW = innerRef.current.scrollWidth || CONTENT_WIDTH;
      // No upper clamp on auto-fit — must always fill the container width
      const s = Math.max(0.35, w / contentW);
      targetRef.current.x = 0;
      targetRef.current.y = 0;
      targetRef.current.scale = s;
      // Snap current immediately so there's no lerp from wrong initial value
      currentRef.current.x = 0;
      currentRef.current.y = 0;
      currentRef.current.scale = s;
      if (innerRef.current) {
        innerRef.current.style.transform = `translate(0px, 0px) scale(${s})`;
      }
      setScaleDisplay(Math.round(s * 100));
      lastDisplayedScale.current = s;
    }
    // Double-rAF: wait for layout to paint before measuring offsetWidth
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(applyFit);
    });
    const ro = new ResizeObserver(applyFit);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => { cancelAnimationFrame(id); ro.disconnect(); };
  }, []);

  // Animation loop
  useEffect(() => {
    function tick() {
      const t = 0.12;
      const cur = currentRef.current;
      const tgt = targetRef.current;
      cur.x = lerp(cur.x, tgt.x, t);
      cur.y = lerp(cur.y, tgt.y, t);
      cur.scale = lerp(cur.scale, tgt.scale, t);
      if (innerRef.current) {
        innerRef.current.style.transform = `translate(${cur.x}px, ${cur.y}px) scale(${cur.scale})`;
      }
      // Throttled scale readout update
      if (Math.abs(cur.scale - lastDisplayedScale.current) > 0.01) {
        lastDisplayedScale.current = cur.scale;
        setScaleDisplay(Math.round(cur.scale * 100));
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Wheel handler — zoom toward cursor
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      userHasZoomed.current = true;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const tgt = targetRef.current;
      const newScale = Math.min(1.6, Math.max(0.35, tgt.scale * zoomFactor));
      const scaleRatio = newScale / tgt.scale;
      tgt.x = mouseX - scaleRatio * (mouseX - tgt.x);
      tgt.y = mouseY - scaleRatio * (mouseY - tgt.y);
      tgt.scale = newScale;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Mouse drag handlers — threshold prevents accidental drag on clicks
  const DRAG_THRESHOLD = 6;

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    isDragging.current = true;
    dragCommitted.current = false;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      tx: targetRef.current.x,
      ty: targetRef.current.y,
    };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (!dragCommitted.current) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      dragCommitted.current = true;
      userHasZoomed.current = true;
      (e.currentTarget as HTMLElement).setAttribute('data-grabbing', '');
    }
    targetRef.current.x = dragStart.current.tx + dx;
    targetRef.current.y = dragStart.current.ty + dy;
  };

  const onMouseUp = (e: React.MouseEvent) => {
    isDragging.current = false;
    dragCommitted.current = false;
    (e.currentTarget as HTMLElement).removeAttribute('data-grabbing');
  };

  const onMouseLeave = (e: React.MouseEvent) => {
    if (isDragging.current) {
      isDragging.current = false;
      dragCommitted.current = false;
      (e.currentTarget as HTMLElement).removeAttribute('data-grabbing');
    }
  };

  // HUD zoom controls
  const zoomIn = () => {
    targetRef.current.scale = Math.min(1.6, targetRef.current.scale * 1.2);
  };
  const zoomOut = () => {
    targetRef.current.scale = Math.max(0.35, targetRef.current.scale / 1.2);
  };
  const resetView = () => {
    userHasZoomed.current = false;
    if (!canvasRef.current || !innerRef.current) return;
    const w = canvasRef.current.offsetWidth;
    const contentW = innerRef.current.scrollWidth || CONTENT_WIDTH;
    const s = Math.max(0.35, w / contentW); // no upper clamp on fit
    targetRef.current = { x: 0, y: 0, scale: s };
  };

  // ─── Rows layout ─────────────────────────────────────────────────────────────
  if (viewMode === 'rows') {
    return (
      <div className="border-t border-surface-light">
        <RowsView />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Legend + tmux notice row */}
      <div className="flex flex-wrap items-center gap-4 flex-shrink-0 px-6">
        <div className="bg-surface border border-surface-light px-3 py-2 text-[10px] font-mono text-muted">
          <span className="text-cta font-semibold">tmux:</span>{' '}
          <span className="text-[#CA9EE6]">pane</span> = split-pane ·{' '}
          <span className="text-muted/60">proc</span> = in-process
        </div>
        <Legend />
      </div>

      {/* Desktop: interactive zoom/pan canvas */}
      <div
        ref={canvasRef}
        className="hidden md:block relative overflow-hidden canvas-grab"
        style={{ height: 'min(82vh, 1200px)' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {/* Transformed inner canvas */}
        <div
          ref={innerRef}
          className="absolute top-0 left-0 flex gap-2 origin-top-left"
          style={{ transform: `translate(0px, 0px) scale(0.72)` }}
        >
          {workflows.map((track, idx) => (
            <TrackColumn
              key={track.id}
              track={track}
              selected={selectedTrack === idx}
              onSelect={() => setSelectedTrack(idx)}
            />
          ))}
        </div>

        {/* Zoom HUD — bottom-right, outside the canvas transform */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="w-7 h-7 bg-surface border border-surface-light text-foreground font-mono text-sm hover:border-cta hover:text-cta transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            onClick={resetView}
            className="h-7 px-2 bg-surface border border-surface-light text-muted font-mono text-[10px] hover:border-surface-light/80 hover:text-foreground transition-colors flex items-center justify-center cursor-pointer tabular-nums"
            aria-label="Reset zoom"
          >
            {scaleDisplay}%
          </button>
          <button
            onClick={zoomIn}
            className="w-7 h-7 bg-surface border border-surface-light text-foreground font-mono text-sm hover:border-cta hover:text-cta transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
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
                  ? { borderColor: activeTrack.accentColor, backgroundColor: activeTrack.headerBg, color: activeTrack.accentColor }
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
