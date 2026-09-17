import type { ReactNode } from "react";
import { UserGroupIcon, Search01Icon, Message01Icon, DashboardSquare01Icon } from "hugeicons-react";
import "./group-empty-state.css";

export function GroupEmptyState({ kind = "groups", title, description, children, compact = false }: { kind?: "groups" | "search" | "feed" | "managed"; title: string; description: string; children?: ReactNode; compact?: boolean }) {
  const Icon = { groups: UserGroupIcon, search: Search01Icon, feed: Message01Icon, managed: DashboardSquare01Icon }[kind];
  return <div className={`ge-empty${compact ? " ge-empty-compact" : ""}`}>
    <div className="ge-empty-icon" aria-hidden="true"><Icon size={32} /></div>
    <h2>{title}</h2><p>{description}</p>
    {children && <div className="ge-empty-actions">{children}</div>}
  </div>;
}
