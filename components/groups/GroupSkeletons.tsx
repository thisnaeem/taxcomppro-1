import type { CSSProperties } from "react";
import "./group-skeletons.css";

function Bone({ width, height, round = false }: { width?: string | number; height?: number; round?: boolean }) {
  return <div className={`gs-bone${round ? " gs-round" : ""}`} style={{ width, height } as CSSProperties} />;
}
function Lines() {
  return <div className="gs-lines"><Bone width="85%" /><Bone /><Bone width="62%" /></div>;
}
function Person() {
  return <div className="gs-person"><Bone width={42} height={42} round /><div className="gs-person-copy"><Bone width="58%" height={15} /><Bone width="38%" height={10} /></div></div>;
}

export function GroupsDirectorySkeleton({ view }: { view: "grid" | "list" }) {
  return <div role="status" aria-label="Loading groups" aria-busy="true">
    <span className="sr-only">Loading groups…</span>
    <div className={view === "grid" ? "gf-discovery-grid" : "gs-list"} aria-hidden="true">
      {[0, 1, 2, 3].map(i => <div key={i} className={`gf-discovery-card gs-directory-card${view === "list" ? " gs-card-list" : ""}`}>
        <div className="gs-directory-cover gs-bone" />
        <div className="gs-directory-body"><Bone width="78%" height={18} /><Bone width="60%" height={12} /><Bone width="40%" height={12} /><div className="gs-directory-description"><Bone /><Bone width="72%" /></div><Bone height={36} /></div>
      </div>)}
    </div>
  </div>;
}

export function GroupPostSkeleton() {
  return <div className="gd-panel gs-post" aria-hidden="true"><Person /><Lines /><div className="gs-card-footer"><Bone width={70} height={12} /><Bone width={90} height={12} /></div></div>;
}

export function GroupDetailSkeleton() {
  return <div className="gp-page gd-page gf-shell" role="status" aria-label="Loading group" aria-busy="true">
    <span className="sr-only">Loading group…</span>
    <aside className="gf-navigation gs-sidebar-panel" aria-hidden="true"><Bone width={100} height={28} /><Bone height={38} /><Person /><Person /><Person /><Bone height={36} /><Lines /><Person /><Person /></aside>
    <div className="gf-group-content" aria-hidden="true">
      <Bone width={100} height={16} />
      <div className="gd-hero"><div className="gd-cover gs-bone" /><div className="gd-identity"><div className="gd-group-icon gs-bone" /><div className="gd-identity-copy gs-lines"><Bone width="35%" height={10} /><Bone width="70%" height={36} /><Bone width="90%" height={14} /><div className="gs-meta"><Bone width={90} height={12} /><Bone width={100} height={12} /></div></div><div className="gd-actions"><Bone width={170} height={42} /><Bone width={80} height={12} /></div></div></div>
      <div className="gd-tabs gs-tabs">{[0,1,2].map(i => <Bone key={i} width={100} height={18} />)}</div>
      <div className="gd-layout"><div className="gd-main"><div className="gd-panel gs-composer"><Person /><Bone height={110} /><div className="gs-composer-footer"><Bone width={130} height={40} /></div></div><Bone width={150} height={18} /><GroupPostSkeleton /><GroupPostSkeleton /></div><aside className="gd-sidebar"><div className="gd-panel gs-sidebar-panel"><Bone width="50%" height={12} /><Bone width="80%" height={23} /><Lines /><Person /></div><div className="gd-panel gs-sidebar-panel"><Bone width="50%" height={20} /><Person /><Person /><Person /></div></aside></div>
    </div>
  </div>;
}
