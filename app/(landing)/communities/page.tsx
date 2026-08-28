"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { Loader2, LayoutGrid, List, Search, Plus, Globe, Lock, Users, MessageSquare, CheckCircle2, LogOut, AlertTriangle, Trash2 } from "lucide-react";
import { Cancel01Icon, ArrowRight01Icon, UserCircleIcon } from "hugeicons-react";

interface Community {
  id: string; name: string; slug: string; description: string;
  icon: string | null; isPublic: boolean; memberCount: number;
  isMember: boolean;
  creator: { id: string; name: string; image: string | null };
  _count: { members: number; posts: number };
}

const PALETTE = [
  "from-blue-600 to-indigo-700", "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-600", "from-purple-600 to-violet-700",
  "from-rose-500 to-pink-700",   "from-cyan-500 to-blue-600",
  "from-green-500 to-emerald-700","from-[#1a3a6b] to-[#0a1628]",
];

type Tab = "joined" | "available";
type ViewMode = "grid" | "list";

/* ─── Create Modal ─── */
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Community) => void }) {
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState(""); const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const res = await fetch("/api/communities", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: desc, icon: icon || null, isPublic }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      onCreated(data); onClose();
    } catch { setError("Something went wrong."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-black text-[#0a1628] text-lg">Create Community</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
            <Cancel01Icon className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="e.g. IRS Audit Defense Network"
              className="w-full font-[inherit] text-sm px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Description *</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} required rows={3}
              placeholder="What is this community about?"
              className="w-full font-[inherit] text-sm px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all resize-none" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Icon (emoji or URL)</label>
            <input type="text" value={icon} onChange={e => setIcon(e.target.value)}
              placeholder="e.g. ⚖️"
              className="w-full font-[inherit] text-sm px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all" />
          </div>
          <div className="flex gap-3">
            {[{ val: true, Icon: Globe, label: "Public" }, { val: false, Icon: Lock, label: "Private" }].map(({ val, Icon, label }) => (
              <button key={label} type="button" onClick={() => setIsPublic(val)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${isPublic === val ? "border-[#0a1628] bg-[#0a1628]/5 text-[#0a1628]" : "border-slate-200 text-slate-500"}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          <button type="submit" disabled={saving || !name || !desc}
            className="w-full bg-[#0a1628] text-white font-black text-sm py-3.5 rounded-xl hover:bg-[#1a3a6b] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : "Create Community"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Grid Card ─── */
function GridCard({ c, idx, onJoin, joining, joined, onLeave, leaving }: {
  c: Community; idx: number;
  onJoin: (id: string) => void; joining: boolean; joined: boolean;
  onLeave: (id: string) => void; leaving: boolean;
}) {
  const gradient = PALETTE[idx % PALETTE.length];
  const isEmoji = c.icon && c.icon.length <= 4;
  return (
    <Link href={`/communities/${c.slug}`}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 flex flex-col">
      {/* Banner */}
      <div className={`bg-gradient-to-br ${gradient} h-20 relative shrink-0`}>
        <div className="w-12 h-12 rounded-xl border-4 border-white bg-white shadow-md flex items-center justify-center absolute -bottom-6 left-4 overflow-hidden">
          {isEmoji ? <span className="text-xl">{c.icon}</span>
            : c.icon ? <img src={c.icon} alt={c.name} className="w-full h-full object-cover" />
            : <span className="text-[#0a1628] font-black text-xl">{c.name[0]}</span>}
        </div>
        {!c.isPublic && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/30 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            <Lock className="w-2.5 h-2.5" /> Private
          </div>
        )}
      </div>
      {/* Body */}
      <div className="pt-8 px-4 pb-4 flex flex-col flex-1">
        <h3 className="font-black text-[#0a1628] text-base leading-snug group-hover:text-[#1a3a6b] transition-colors">{c.name}</h3>
        <p className="text-xs text-slate-400 mt-0.5 mb-2">by {c.creator.name}</p>
        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4 flex-1">{c.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.memberCount}</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{c._count.posts}</span>
          </div>
          {joined ? (
            <button onClick={e => { e.preventDefault(); onLeave(c.id); }} disabled={leaving}
              className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full transition-all disabled:opacity-50">
              {leaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
              {leaving ? "…" : "Leave"}
            </button>
          ) : (
            <button onClick={e => { e.preventDefault(); onJoin(c.id); }} disabled={joining}
              className="text-xs font-bold bg-[#0a1628] text-white px-3 py-1.5 rounded-full hover:bg-[#1a3a6b] transition-all disabled:opacity-50">
              {joining ? "…" : "Join"}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── List Row ─── */
function ListRow({ c, idx, onJoin, joining, joined, onLeave, leaving }: {
  c: Community; idx: number;
  onJoin: (id: string) => void; joining: boolean; joined: boolean;
  onLeave: (id: string) => void; leaving: boolean;
}) {
  const gradient = PALETTE[idx % PALETTE.length];
  const isEmoji = c.icon && c.icon.length <= 4;
  return (
    <Link href={`/communities/${c.slug}`}
      className="group bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 flex items-center gap-4 px-5 py-4">
      <div className={`bg-gradient-to-br ${gradient} w-12 h-12 rounded-xl shrink-0 flex items-center justify-center overflow-hidden`}>
        {isEmoji ? <span className="text-xl">{c.icon}</span>
          : c.icon ? <img src={c.icon} alt={c.name} className="w-full h-full object-cover" />
          : <span className="text-white font-black text-xl">{c.name[0]}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-black text-[#0a1628] text-base group-hover:text-[#1a3a6b] transition-colors truncate">{c.name}</h3>
          {!c.isPublic && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
        </div>
        <p className="text-sm text-slate-400 truncate">{c.description}</p>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-sm text-slate-400 shrink-0">
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.memberCount}</span>
        <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{c._count.posts}</span>
      </div>
      <div className="shrink-0 ml-2">
        {joined ? (
          <button onClick={e => { e.preventDefault(); onLeave(c.id); }} disabled={leaving}
            className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-all disabled:opacity-50">
            {leaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
            {leaving ? "…" : "Leave"}
          </button>
        ) : (
          <button onClick={e => { e.preventDefault(); onJoin(c.id); }} disabled={joining}
            className="text-xs font-bold bg-[#0a1628] text-white px-4 py-1.5 rounded-full hover:bg-[#1a3a6b] transition-all disabled:opacity-50">
            {joining ? "…" : "Join"}
          </button>
        )}
      </div>
      <ArrowRight01Icon className="w-4 h-4 text-slate-300 group-hover:text-[#0a1628] transition-colors shrink-0" />
    </Link>
  );
}

/* ─── Skeleton ─── */
function Skeleton({ view }: { view: ViewMode }) {
  if (view === "list") return (
    <div className="space-y-3">
      {[1,2,3,4].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 flex items-center gap-4 px-5 py-4 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2"><div className="h-4 bg-slate-200 rounded w-1/3" /><div className="h-3 bg-slate-200 rounded w-2/3" /></div>
          <div className="w-16 h-8 bg-slate-200 rounded-full" />
        </div>
      ))}
    </div>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
          <div className="h-20 bg-slate-200" />
          <div className="pt-8 px-4 pb-4 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-200 rounded w-1/4" />
            <div className="h-3 bg-slate-200 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ─── */
export default function CommunitiesPage() {
  const user    = useAppSelector(s => s.auth.user);
  const isAdmin = user?.role === "ADMIN";

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [query,       setQuery]       = useState("");
  const [joining,     setJoining]     = useState<Record<string, boolean>>({});
  const [leaving,     setLeaving]     = useState<Record<string, boolean>>({});
  const [joined,      setJoined]      = useState<Record<string, boolean>>({});
  const [showCreate,  setShowCreate]  = useState(false);
  const [tab,         setTab]         = useState<Tab>("joined");
  const [view,        setView]        = useState<ViewMode>("grid");
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearingCommunities, setClearingCommunities] = useState(false);
  const [toastMsg,    setToastMsg]    = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    const p = new URLSearchParams();
    if (query) p.set("search", query);
    setLoading(true);
    fetch(`/api/communities?${p}`)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : [];
        setCommunities(list);
        const sj: Record<string, boolean> = {};
        list.forEach((c: Community) => { if (c.isMember) sj[c.id] = true; });
        setJoined(prev => ({ ...sj, ...prev }));
      })
      .catch(() => setCommunities([]))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleClearAllCommunities = async () => {
    setClearingCommunities(true);
    try {
      const res = await fetch("/api/admin/communities", { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setCommunities([]);
        setJoined({});
        setShowClearModal(false);
        setToastMsg(`Successfully cleared ${data.count ?? "all"} communities!`);
        setTimeout(() => setToastMsg(""), 4000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to clear communities");
      }
    } catch {
      alert("Error clearing communities");
    } finally {
      setClearingCommunities(false);
    }
  };

  const handleJoin = async (id: string) => {
    if (!user) { window.location.href = "/login?redirect=/communities"; return; }
    setJoining(p => ({ ...p, [id]: true }));
    try {
      const res = await fetch("/api/communities/join", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId: id }),
      });
      if (res.ok || res.status === 409) {
        setJoined(p => ({ ...p, [id]: true }));
        if (res.ok) setCommunities(prev => prev.map(c => c.id === id ? { ...c, memberCount: c.memberCount + 1 } : c));
      }
    } catch { /* ignore */ } finally { setJoining(p => ({ ...p, [id]: false })); }
  };

  const handleLeave = async (id: string) => {
    if (!user) return;
    setLeaving(p => ({ ...p, [id]: true }));
    try {
      const res = await fetch("/api/communities/join", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId: id }),
      });
      if (res.ok) {
        setJoined(p => { const n = { ...p }; delete n[id]; return n; });
        setCommunities(prev => prev.map(c => c.id === id ? { ...c, memberCount: Math.max(0, c.memberCount - 1) } : c));
      }
    } catch { /* ignore */ } finally { setLeaving(p => ({ ...p, [id]: false })); }
  };

  const filtered = useMemo(() => {
    if (tab === "joined")    return communities.filter(c => joined[c.id]);
    return communities.filter(c => !joined[c.id]);
  }, [communities, joined, tab]);

  const joinedCount = Object.values(joined).filter(Boolean).length;

  const TABS: { key: Tab; label: string }[] = [
    { key: "joined",    label: `Joined (${joinedCount})` },
    { key: "available", label: `Available (${communities.length - joinedCount})` },
  ];

  const CardComp = view === "grid" ? GridCard : ListRow;

  return (
    <div className="min-h-screen bg-[#f4f6fb] pt-5 pb-14">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-xl animate-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── Clear All Confirmation Modal ── */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-[#0a1628]">Clear All Communities?</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                This will permanently delete <strong className="text-rose-600">ALL communities</strong>, discussions, posts, comments, and memberships across the platform. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={clearingCommunities}
                onClick={() => setShowClearModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearingCommunities}
                onClick={handleClearAllCommunities}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 disabled:opacity-50"
              >
                {clearingCommunities ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  "Yes, Clear All"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && isAdmin && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={c => setCommunities(prev => [{
            ...c as unknown as Community,
            creator:  { id: user?.id ?? "", name: user?.name ?? "Admin", image: user?.image ?? null },
            _count:   { members: 1, posts: 0 },
            isMember: true,
          }, ...prev])}
        />
      )}

      <div className="max-w-[1320px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

          {/* ── Sidebar ── */}
          <div className="hidden lg:block self-start sticky top-[90px] space-y-3">
            {user && (
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-100">
                {/* Banner */}
                <div className="h-24 relative">
                  {user.coverImage
                    ? <div className="absolute inset-0 overflow-hidden"><img src={user.coverImage} alt="" className="w-full h-full object-cover" /></div>
                    : <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a3a6b] to-[#0d2a50]">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                      </div>
                  }
                  <div className="absolute -bottom-9 left-4">
                    <div className="w-[72px] h-[72px] rounded-2xl border-[3px] border-white bg-[#0a1628] overflow-hidden flex items-center justify-center shadow-md">
                      {user.image
                        ? <img src={user.image} alt={user.name ?? ""} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        : <span className="text-white font-black text-2xl">{user.name?.[0]?.toUpperCase()}</span>}
                    </div>
                  </div>
                </div>
                <div className="px-4 pt-12 pb-4 relative z-10">
                  <div className="font-black text-[#0a1628] text-base">{user.name}</div>
                  <div className="text-sm text-slate-400 mt-0.5 mb-3">{user.headline ?? "No headline"}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ label: "Joined", val: joinedCount }, { label: "Total", val: communities.length }].map(s => (
                      <div key={s.label} className="bg-slate-50 rounded-xl py-2 text-center">
                        <div className="text-xs text-slate-400">{s.label}</div>
                        <div className="text-base font-black text-[#0a1628]">{s.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isAdmin ? ( 
              <div className="space-y-2">
                <button onClick={() => setShowCreate(true)}
                  className="flex items-center justify-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-5 py-3.5 rounded-xl hover:bg-[#1a3a6b] transition-all w-full shadow-sm">
                  <Plus className="w-4 h-4" /> Create Community
                </button>
                <div className="bg-rose-50 rounded-2xl p-3 border border-rose-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-700">Admin Action</span>
                    <span className="text-[9px] font-bold bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded">ADMIN</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowClearModal(true)}
                    className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All Communities
                  </button>
                </div>
              </div>
            ) : !user ? (
              <Link href="/login"
                className="flex items-center justify-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-5 py-4 rounded-xl hover:bg-[#1a3a6b] transition-all w-full">
                <UserCircleIcon className="w-4 h-4" /> Sign In to Join
              </Link>
            ) : null}

            <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Platform Stats</p>
              {[
                { label: "Communities", value: communities.length },
                { label: "Members",     value: communities.reduce((a, c) => a + (c.memberCount ?? 0), 0).toLocaleString() },
                { label: "Discussions", value: communities.reduce((a, c) => a + (c._count?.posts ?? 0), 0).toLocaleString() },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <span className="text-slate-400 text-sm">{s.label}</span>
                  <span className="font-black text-[#0a1628] text-base">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Main ── */}
          <div className="space-y-4 min-w-0">

            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-black text-[#0a1628]">Communities</h1>
                <p className="text-slate-400 text-base mt-0.5">
                  {loading ? "Loading…" : `${filtered.length} communit${filtered.length !== 1 ? "ies" : "y"}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button onClick={() => setShowCreate(true)}
                    className="lg:hidden flex items-center gap-1.5 bg-[#0a1628] text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#1a3a6b] transition-all">
                    <Plus className="w-3.5 h-3.5" /> Create
                  </button>
                )}
                {/* View toggle */}
                <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
                  {([{ v: "grid" as ViewMode, Icon: LayoutGrid }, { v: "list" as ViewMode, Icon: List }]).map(({ v, Icon }) => (
                    <button key={v} onClick={() => setView(v)}
                      className={`p-2.5 transition-all ${view === v ? "bg-[#0a1628] text-white" : "text-slate-400 hover:text-slate-600"}`}>
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input type="text" placeholder="Search communities…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent font-[inherit] text-base text-slate-700 outline-none placeholder-slate-400" />
              {search && (
                <button onClick={() => { setSearch(""); setQuery(""); }} className="text-slate-400 hover:text-slate-600 text-xs font-semibold">Clear</button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-all ${tab === t.key ? "bg-[#0a1628] text-white shadow-sm" : "text-slate-500 hover:text-[#0a1628]"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            {loading ? (
              <Skeleton view={view} />
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl py-20 text-center border border-slate-100">
                <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="font-bold text-slate-400 text-lg">No communities found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {query ? "Try a different search" : tab === "joined" ? "Join a community to see it here" : isAdmin ? "Create the first one!" : "Check back soon"}
                </p>
                {isAdmin && tab !== "joined" && (
                  <button onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-2 mt-5 bg-[#0a1628] text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#1a3a6b] transition-all">
                    <Plus className="w-4 h-4" /> Create First Community
                  </button>
                )}
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((c, i) => (
                  <GridCard key={c.id} c={c} idx={i}
                    onJoin={handleJoin} joining={!!joining[c.id]} joined={!!joined[c.id]}
                    onLeave={handleLeave} leaving={!!leaving[c.id]} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((c, i) => (
                  <ListRow key={c.id} c={c} idx={i}
                    onJoin={handleJoin} joining={!!joining[c.id]} joined={!!joined[c.id]}
                    onLeave={handleLeave} leaving={!!leaving[c.id]} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
