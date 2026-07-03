"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { Loader2 } from "lucide-react";
import {
  Search01Icon, UserAdd01Icon, UserCheck01Icon, UserGroupIcon,
  Clock01Icon, Tick02Icon, Cancel01Icon, Message01Icon,
  UserRemove02Icon, ArrowRight01Icon,
} from "hugeicons-react";
import UpgradeGate from "@/components/ui/UpgradeGate";

interface Person { id: string; name: string; image: string | null; headline: string | null; role: string; }
interface Connection { id: string; status: string; requester: Person; receiver: Person; }
interface PendingIn { id: string; requester: Person; }
interface PendingSent { id: string; receiver: Person; }

type Tab = "discover" | "requests" | "connected";

function Avatar({ user, size = "md" }: { user: { name: string; image: string | null }; size?: "sm"|"md"|"lg" }) {
  const sz = size === "lg" ? "w-[72px] h-[72px] text-2xl" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-full bg-[#0a1628] overflow-hidden flex items-center justify-center shrink-0`}>
      {user.image
        ? <img src={user.image} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        : <span className="text-white font-bold">{user.name?.[0]?.toUpperCase()}</span>}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cls = role === "ADMIN" ? "bg-amber-100 text-amber-700"
    : role === "PROFESSIONAL" ? "bg-blue-100 text-blue-700"
    : "bg-slate-100 text-slate-500";
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${cls}`}>{role}</span>;
}

/* ─── Skeleton person card ──────────────────────────────────── */
function SkeletonPerson() {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-3 bg-slate-200 rounded w-3/4" />
      </div>
      <div className="h-8 w-20 bg-slate-200 rounded-full shrink-0" />
    </div>
  );
}

export default function ConnectionsPage() {
  const user = useAppSelector(s => s.auth.user);
  const [tab,         setTab]         = useState<Tab>("discover");
  const [search,      setSearch]      = useState("");
  const [query,       setQuery]       = useState("");
  const [people,      setPeople]      = useState<Person[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [received,    setReceived]    = useState<PendingIn[]>([]);
  const [sent,        setSent]        = useState<PendingSent[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [acting,      setActing]      = useState<Record<string, boolean>>({});
  const [sentIds,     setSentIds]     = useState<Set<string>>(new Set());

  const loadConnections = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      setConnections(data.connections ?? []);
      setReceived(data.received ?? []);
      setSent(data.sent ?? []);
      setSentIds(new Set((data.sent ?? []).map((s: PendingSent) => s.receiver.id)));
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!user) return;
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    setLoading(true);
    fetch(`/api/connections/people?${params}`)
      .then(r => r.json()).then(d => setPeople(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setLoading(false));
  }, [query, user]);

  useEffect(() => { loadConnections(); }, [loadConnections]);
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const sendRequest = async (receiverId: string) => {
    setActing(p => ({ ...p, [receiverId]: true }));
    try {
      const res = await fetch("/api/connections", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });
      if (res.ok || res.status === 409) setSentIds(p => new Set([...p, receiverId]));
    } catch { /* ignore */ } finally { setActing(p => ({ ...p, [receiverId]: false })); }
  };

  const respond = async (id: string, action: "accept" | "decline") => {
    setActing(p => ({ ...p, [id]: true }));
    try {
      await fetch(`/api/connections/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await loadConnections();
    } catch { /* ignore */ } finally { setActing(p => ({ ...p, [id]: false })); }
  };

  const remove = async (id: string) => {
    setActing(p => ({ ...p, [id]: true }));
    try {
      await fetch(`/api/connections/${id}`, { method: "DELETE" });
      await loadConnections();
    } catch { /* ignore */ } finally { setActing(p => ({ ...p, [id]: false })); }
  };

  if (!user) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center text-center px-4">
      <div className="bg-white rounded-2xl p-12 max-w-md">
        <UserGroupIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h1 className="text-xl font-black text-[#0a1628] mb-2">Sign in to connect</h1>
        <Link href="/login" className="inline-flex items-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-6 py-3 rounded-xl mt-3 hover:bg-[#1a3a6b] transition-all">Sign In</Link>
      </div>
    </div>
  );

  if (user.tier === "FREE" && user.role !== "ADMIN") return (
    <UpgradeGate
      feature="Connections & Networking"
      description="Connect and build your professional network with other tax professionals. Available exclusively for VIP members."
    />
  );

  const navItems = [
    { id: "discover"  as Tab, label: "Discover People", icon: UserAdd01Icon,   count: people.length },
    { id: "requests"  as Tab, label: "Requests",        icon: Clock01Icon,     count: received.length },
    { id: "connected" as Tab, label: "My Network",      icon: UserCheck01Icon, count: connections.length },
  ];

  return (
    <div className="min-h-screen bg-slate-100 pt-4 pb-12">
      <div className="max-w-[1100px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 items-start">

          {/* ── Fixed sidebar ── */}
          <div className="hidden lg:block self-start sticky top-[100px] h-fit max-h-[calc(100vh-100px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-2.5">

            {/* Profile mini-card */}
            <div className="bg-white rounded-2xl overflow-hidden">
              <div className="h-20 bg-gradient-to-br from-[#0a1628] via-[#1a3a6b] to-[#0d2a50] relative">
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                <div className="absolute -bottom-9 left-4">
                  <Avatar user={user as { name: string; image: string | null }} size="lg" />
                </div>
              </div>
              <div className="px-4 pt-12 pb-4">
                <div className="font-black text-[#0a1628] text-sm">{user.name}</div>
                {user.headline
                  ? <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{user.headline}</div>
                  : <div className="text-xs text-slate-400 italic mt-0.5">No headline</div>}
                <div className="flex gap-2 mt-3">
                  <div className="flex-1 bg-slate-50 rounded-xl py-2 text-center">
                    <div className="text-[10px] text-slate-400">Network</div>
                    <div className="text-sm font-black text-[#0a1628]">{connections.length}</div>
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-xl py-2 text-center">
                    <div className="text-[10px] text-slate-400">Pending</div>
                    <div className="text-sm font-black text-[#0a1628]">{received.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <div className="bg-white rounded-2xl p-3 space-y-0.5">
              {navItems.map(item => (
                <button key={item.id} onClick={() => setTab(item.id)}
                  className={`flex items-center justify-between w-full text-left text-sm font-semibold px-3 py-2.5 rounded-xl transition-all ${tab === item.id ? "bg-[#0a1628] text-white" : "text-slate-600 hover:bg-slate-50 hover:text-[#0a1628]"}`}>
                  <span className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4" />{item.label}
                  </span>
                  {item.count > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tab === item.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Messages CTA */}
            <Link href="/messages"
              className="flex items-center justify-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-4 py-3 rounded-xl hover:bg-[#1a3a6b] transition-all w-full">
              <Message01Icon className="w-4 h-4" /> Open Messages
            </Link>
          </div>

          {/* ── Main content ── */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-black text-[#0a1628]">
                {tab === "discover" ? "Discover People" : tab === "requests" ? "Connection Requests" : "My Network"}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {tab === "discover"
                  ? `${people.length} professional${people.length !== 1 ? "s" : ""} to connect with`
                  : tab === "requests"
                    ? `${received.length} pending request${received.length !== 1 ? "s" : ""}`
                    : `${connections.length} connection${connections.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Search — discover only */}
            {tab === "discover" && (
              <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-3">
                <Search01Icon className="w-4 h-4 text-slate-400 shrink-0" />
                <input type="text" placeholder="Search by name or headline…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent font-[inherit] text-sm text-slate-700 outline-none placeholder-slate-400" />
                {search && <button onClick={() => { setSearch(""); setQuery(""); }} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Clear</button>}
              </div>
            )}

            {/* ── Discover ── */}
            {tab === "discover" && (
              loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => <SkeletonPerson key={i} />)}
                </div>
              ) : people.length === 0 ? (
                <div className="bg-white rounded-2xl py-20 text-center">
                  <UserAdd01Icon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="font-bold text-slate-400">No new people to connect with</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {people.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl p-4 flex items-start gap-3 hover:-translate-y-0.5 transition-all">
                      <Link href={`/member/${p.id}`}><Avatar user={p} /></Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/member/${p.id}`} className="font-bold text-[#0a1628] text-sm truncate hover:text-[#1a3a6b] transition-colors block">{p.name}</Link>
                        {p.headline && <div className="text-xs text-slate-400 truncate mt-0.5">{p.headline}</div>}
                        <RoleBadge role={p.role} />
                      </div>
                      {sentIds.has(p.id) ? (
                        <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1 mt-1">
                          <Clock01Icon className="w-3 h-3" /> Sent
                        </span>
                      ) : (
                        <button onClick={() => sendRequest(p.id)} disabled={!!acting[p.id]}
                          className="shrink-0 flex items-center gap-1.5 bg-[#0a1628] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#1a3a6b] transition-all disabled:opacity-50 mt-1">
                          {acting[p.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserAdd01Icon className="w-3 h-3" />}
                          Connect
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── Requests ── */}
            {tab === "requests" && (
              received.length === 0 && sent.length === 0 ? (
                <div className="bg-white rounded-2xl py-20 text-center">
                  <Clock01Icon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="font-bold text-slate-400">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {received.length > 0 && (
                    <>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Received</p>
                      {received.map(r => (
                        <div key={r.id} className="bg-white rounded-2xl p-4 flex items-center gap-3">
                          <Link href={`/member/${r.requester.id}`}><Avatar user={r.requester} /></Link>
                          <div className="flex-1 min-w-0">
                            <Link href={`/member/${r.requester.id}`} className="font-bold text-[#0a1628] text-sm hover:text-[#1a3a6b] transition-colors">{r.requester.name}</Link>
                            {r.requester.headline && <div className="text-xs text-slate-400 truncate">{r.requester.headline}</div>}
                            <RoleBadge role={r.requester.role} />
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => respond(r.id, "accept")} disabled={!!acting[r.id]}
                              className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-50">
                              {acting[r.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Tick02Icon className="w-3 h-3" />} Accept
                            </button>
                            <button onClick={() => respond(r.id, "decline")} disabled={!!acting[r.id]}
                              className="flex items-center gap-1 bg-slate-100 text-slate-500 hover:bg-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-50">
                              <Cancel01Icon className="w-3 h-3" /> Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {sent.length > 0 && (
                    <>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-4">Sent</p>
                      {sent.map(s => (
                        <div key={s.id} className="bg-white rounded-2xl p-4 flex items-center gap-3">
                          <Avatar user={s.receiver} size="sm" />
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-[#0a1628]">{s.receiver.name}</div>
                          </div>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock01Icon className="w-3 h-3" /> Pending
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )
            )}

            {/* ── My Network ── */}
            {tab === "connected" && (
              connections.length === 0 ? (
                <div className="bg-white rounded-2xl py-20 text-center">
                  <UserGroupIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="font-bold text-slate-400 mb-4">No connections yet</p>
                  <button onClick={() => setTab("discover")}
                    className="inline-flex items-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#1a3a6b] transition-all">
                    Discover People <ArrowRight01Icon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {connections.map(c => {
                    const partner = c.requester.id === user.id ? c.receiver : c.requester;
                    return (
                      <div key={c.id} className="bg-white rounded-2xl p-4 flex items-start gap-3 hover:-translate-y-0.5 transition-all">
                        <Link href={`/member/${partner.id}`}><Avatar user={partner} /></Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/member/${partner.id}`} className="font-bold text-[#0a1628] text-sm hover:text-[#1a3a6b] transition-colors block">{partner.name}</Link>
                          {partner.headline && <div className="text-xs text-slate-400 truncate mt-0.5">{partner.headline}</div>}
                          <RoleBadge role={partner.role} />
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0 mt-1">
                          <Link href={`/messages?user=${partner.id}`}
                            className="flex items-center gap-1 bg-[#0a1628] text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#1a3a6b] transition-all">
                            <Message01Icon className="w-3 h-3" /> Message
                          </Link>
                          <button onClick={() => remove(c.id)} disabled={!!acting[c.id]}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors justify-center">
                            <UserRemove02Icon className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
