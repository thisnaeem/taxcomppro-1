"use client";
import Link from "next/link";
import Image from "next/image";
import { UserGroupIcon, Search01Icon, Add01Icon, Message01Icon, DashboardSquare01Icon, GlobeIcon } from "hugeicons-react";
export type GroupSummary = { id: string; slug: string; name: string; description: string; coverImage: string | null; isPublic: boolean; memberCount: number; isMember: boolean; creator: { id: string; name: string }; _count: { posts: number }; createdAt: string };
export type GroupView = "discover" | "feed" | "joined" | "managed";
export function GroupsSidebar({ groups, userId, canCreate, active = "discover", onSelect, search, onSearch, children }: { groups: GroupSummary[]; userId?: string; canCreate: boolean; active?: GroupView; onSelect?: (view: GroupView) => void; search?: string; onSearch?: (value: string) => void; children?: React.ReactNode }) {
  const sections = [{ title: "Groups you manage", items: groups.filter(g => g.creator.id === userId) }, { title: "Groups you’ve joined", items: groups.filter(g => g.isMember && g.creator.id !== userId) }];
  return <aside className="gf-navigation"><Link href="/groups" className="gf-nav-title">Groups</Link>
    {onSearch && <label className="gf-search"><Search01Icon size={18} /><input aria-label="Search groups" placeholder="Search groups" value={search} onChange={e => onSearch(e.target.value)} /></label>}
    {!children && <nav aria-label="Groups navigation">{([{ id: "feed", label: "Your feed", Icon: Message01Icon }, { id: "discover", label: "Discover", Icon: GlobeIcon }, { id: "joined", label: "Your groups", Icon: UserGroupIcon }, { id: "managed", label: "Groups you manage", Icon: DashboardSquare01Icon }] as const).map(({ id, label, Icon }) => onSelect ? <button key={id} aria-current={active === id ? "page" : undefined} onClick={() => onSelect(id)}><Icon size={21} />{label}</button> : <Link key={id} href={`/groups?view=${id}`}><Icon size={21} />{label}</Link>)}</nav>}
    {canCreate && <Link className="gf-create" href="/groups/create"><Add01Icon size={18} />Create new group</Link>}
    {children}
    {sections.map(section => <details key={section.title} open className="gf-shortcuts"><summary>{section.title} <span>{section.items.length}</span></summary>{section.items.length ? section.items.map(g => <Link key={g.id} href={`/groups/${g.slug}`}><span className="gf-shortcut-image">{g.coverImage ? <Image src={g.coverImage} alt="" fill unoptimized /> : <UserGroupIcon size={22} />}</span><span><strong>{g.name}</strong><small>{g.memberCount} members</small></span></Link>) : <p>No groups here yet.</p>}</details>)}
  </aside>;
}
