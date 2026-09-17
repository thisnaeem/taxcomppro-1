"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAppSelector } from "@/store/hooks";
import { UserGroupIcon, GlobeIcon, LockIcon } from "hugeicons-react";
import { GroupsSidebar, type GroupSummary, type GroupView } from "@/components/groups/GroupsSidebar";
import { GroupsDirectorySkeleton } from "@/components/groups/GroupSkeletons";
import { GroupEmptyState } from "@/components/groups/GroupEmptyState";
import { GroupsFeed } from "@/components/groups/GroupsFeed";
import "@/components/groups/groups.css";
import "@/components/groups/groups-social.css";

export default function GroupsPage() { return <Suspense fallback={<div className="gp-page gf-shell"><div className="gf-navigation" /><section className="gf-directory" aria-label="Groups directory"><GroupsDirectorySkeleton view="grid" /></section></div>}><GroupsDirectory /></Suspense>; }
function GroupsDirectory() {
  const params = useSearchParams();
  const router = useRouter();
  const requestedView = params.get("view");
  const view: GroupView = ["feed", "joined", "managed"].includes(requestedView || "") ? requestedView as GroupView : "discover";
  const user = useAppSelector(s => s.auth.user);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/communities", { signal: controller.signal }).then(r => { if (!r.ok) throw new Error("Couldn’t load groups. Please try again."); return r.json(); }).then(setGroups).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  function selectView(value: GroupView) { router.replace(`/groups?view=${value}`, { scroll: false }); }
  async function join(group: GroupSummary) {
    if (pending[group.id]) return;
    setPending(p => ({ ...p, [group.id]: true })); setError("");
    try {
      const response = await fetch("/api/communities/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ communityId: group.id }) });
      if (!response.ok && response.status !== 409) throw new Error("Couldn’t join this group. Please try again.");
      setGroups(list => list.map(g => g.id === group.id ? { ...g, isMember: true, memberCount: g.memberCount + (response.ok ? 1 : 0) } : g));
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t join this group."); } finally { setPending(p => ({ ...p, [group.id]: false })); }
  }
  const filtered = groups.filter(g => (view === "joined" ? g.isMember : view === "managed" ? g.creator.id === user?.id : true) && `${g.name} ${g.description}`.toLowerCase().includes(search.toLowerCase())).sort((a,b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "newest" ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : b.memberCount-a.memberCount);
  const titles = { discover: "Discover groups", joined: "Your groups", managed: "Groups you manage", feed: "Your groups feed" };
  return <div className="gp-page gf-shell"><GroupsSidebar groups={groups} userId={user?.id} canCreate={user?.role === "ADMIN"} active={view} onSelect={selectView} search={search} onSearch={setSearch} />
    <section className="gf-directory" aria-label="Groups directory"><header className="gf-directory-heading"><div><h1>{titles[view]}</h1><p>{view === "feed" ? "The latest conversations from the groups you’ve joined." : "Connect with people who share your interests and expertise."}</p></div>{view !== "feed" && <label className="gf-sort">Sort by<select value={sort} onChange={e => setSort(e.target.value)}><option value="popular">Most members</option><option value="newest">Recently created</option><option value="name">Name A–Z</option></select></label>}</header>
      {error && <div className="gp-form-error" role="alert">{error}<button onClick={() => { setError(""); setLoading(true); setRetry(v => v + 1); }}>Try again</button></div>}
      {view === "feed" ? <GroupsFeed search={search} onClearSearch={() => setSearch("")} /> : loading ? <GroupsDirectorySkeleton view="grid" /> : filtered.length ? <><p className="gf-result-count">{filtered.length} groups {search && `matching “${search}”`}</p><div className="gf-discovery-grid">{filtered.map(g => <article className="gf-discovery-card" key={g.id}>
        <Link className="gf-card-cover" href={`/groups/${g.slug}`} aria-label={`Open ${g.name}`}>{g.coverImage ? <Image src={g.coverImage} alt="" fill unoptimized sizes="(max-width:600px) 100vw, 320px" /> : <span><UserGroupIcon size={44} /><strong>{g.name}</strong></span>}</Link>
        <div className="gf-card-copy"><h2><Link href={`/groups/${g.slug}`}>{g.name}</Link></h2><p>{g.memberCount.toLocaleString()} members · {g._count.posts} discussions</p><span className="gf-card-visibility">{g.isPublic ? <GlobeIcon size={13} /> : <LockIcon size={13} />}{g.isPublic ? "Public group" : "Private group"}</span><p className="gf-card-description">{g.description}</p>{g.isMember ? <Link className="gf-card-action" href={`/groups/${g.slug}`}>Visit group</Link> : <button className="gf-card-action" disabled={pending[g.id]} onClick={() => join(g)}>{pending[g.id] ? "Joining…" : "Join group"}</button>}</div>
      </article>)}</div></> : <GroupEmptyState kind={search ? "search" : view === "managed" ? "managed" : "groups"} title={search ? "No matching groups" : view === "joined" ? "You haven’t joined any groups yet" : view === "managed" ? "Your groups start here" : "Be part of something new"} description={search ? "Try a different name or topic, or clear your search to see all groups in this tab." : view === "joined" ? "Find people who share your interests. Groups you join will appear here." : view === "managed" ? "Groups you create and manage will appear here." : "There are no groups to discover yet. Check back soon for new conversations."}>
        {search ? <button className="gp-join" onClick={() => setSearch("")}>Clear search</button> : view === "joined" ? <button className="gp-join" onClick={() => selectView("discover")}>Discover groups</button> : user?.role === "ADMIN" ? <Link className="gp-join" href="/groups/create">Create a group</Link> : view === "managed" ? <button className="gp-join" onClick={() => selectView("discover")}>Discover groups</button> : null}
      </GroupEmptyState>}
    </section></div>;
}
