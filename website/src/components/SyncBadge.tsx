interface SyncBadgeProps {
  timestamp: string | null;
  loading: boolean;
  error: string | null;
}

export default function SyncBadge({ timestamp, loading, error }: SyncBadgeProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-xs font-mono text-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-muted/60 pulse-dot" aria-hidden="true" />
        Fetching latest content from GitHub…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-xs font-mono text-accent-peach/80">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-peach/60" aria-hidden="true" />
        Using cached content — GitHub unavailable
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center gap-2 py-3 text-xs font-mono text-muted/70"
      role="status"
      aria-label={`Content synced from GitHub${timestamp ? ` at ${timestamp}` : ''}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-cta/60 pulse-dot" aria-hidden="true" />
      Content pulled from GitHub
      {timestamp && (
        <>
          <span className="text-muted/40">·</span>
          <time>{timestamp}</time>
        </>
      )}
    </div>
  );
}
