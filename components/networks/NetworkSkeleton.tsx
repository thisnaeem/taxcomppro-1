export function NetworkPostSkeleton() {
  return <div className="np-card np-skeleton-post" aria-hidden="true"><div className="np-skeleton-row"><span className="np-shimmer np-skeleton-avatar" /><span className="np-shimmer np-skeleton-line" /></div><span className="np-shimmer np-skeleton-line" /><span className="np-shimmer np-skeleton-line" /><div className="np-shimmer np-skeleton-media" /></div>;
}

export default function NetworkSkeleton() {
  return <div className="pn-page pn-hub" role="status" aria-label="Loading network" aria-busy="true"><span className="sr-only">Loading your network…</span><div className="pn-hub-layout" aria-hidden="true"><aside className="pn-hub-sidebar"><div className="np-skeleton-sidebar">{Array.from({length:9}, (_, i) => <span key={i} className="np-shimmer np-skeleton-line" />)}</div></aside><main className="pn-hub-main"><div className="np-shimmer np-skeleton-line" /><div className="np-shimmer np-skeleton-cover" /><div className="np-workspace"><div className="np-feed"><NetworkPostSkeleton /><NetworkPostSkeleton /></div><aside className="np-details"><NetworkPostSkeleton /></aside></div></main></div></div>;
}
