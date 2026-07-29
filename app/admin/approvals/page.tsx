"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Search, Loader2, BadgeCheck, Users, Megaphone, MonitorPlay, Star, Trash2, Plus } from "lucide-react";

type Status = "PENDING" | "APPROVED" | "REJECTED";

/* ─── Listings ─────────────────────── */
interface Listing {
  id: string; title: string; description: string;
  category: string; price: number | null; status: Status;
  createdAt: string; user: { id: string; name: string; email: string };
}

/* ─── Pro Applications ──────────────── */
interface ProApp {
  id: string; status: Status; specialty: string; credentials: string;
  reason: string; note: string | null; createdAt: string;
  user: { id: string; name: string; email: string; image: string | null; headline: string | null };
}

const statusCfg: Record<Status, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING:  { label: "Pending",  cls: "bg-amber-100 text-amber-700",    icon: Clock },
  APPROVED: { label: "Approved", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-600",         icon: XCircle },
};
const catLabels: Record<string, string> = { SERVICE:"Service", PRODUCT:"Product", NETWORK:"Network", TRAINING:"Training" };

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function AdminApprovalsPage() {
  const [activeTab, setActiveTab] = useState<"listings" | "pros" | "blasts" | "proads" | "featured">("pros");

  /* pro ads state */
  interface ProAdItem { id: string; title: string; description: string | null; imageUrl: string; linkUrl: string; placement: string; durationMonths: number; priceUsd: number; status: string; createdAt: string; rejectionReason: string | null; user: { id: string; name: string; email: string; image: string | null }; }
  const [proAds,        setProAds]       = useState<ProAdItem[]>([]);
  const [proAdsLoad,    setProAdsLoad]   = useState(true);
  const [adActing,      setAdActing]     = useState<Record<string, boolean>>({});
  const [adRejectReasons, setAdRejectReasons] = useState<Record<string, string>>({});

  /* featured listings state */
  interface FeaturedItem { id: string; durationMonths: number; priceUsd: number; status: string; createdAt: string; rejectionReason: string | null; user: { id: string; name: string; email: string; image: string | null }; listing: { id: string; title: string; category: string; images: string[]; description: string }; }
  const [featItems,     setFeatItems]    = useState<FeaturedItem[]>([]);
  const [featLoad,      setFeatLoad]     = useState(true);
  const [featActing,    setFeatActing]   = useState<Record<string, boolean>>({});
  const [featReasons,   setFeatReasons]  = useState<Record<string, string>>({});

  /* blasts state */
  interface Blast { id: string; subject: string; content: string; recipientCount: number; priceUsd: number; status: string; createdAt: string; rejectionReason: string | null; sender: { id: string; name: string; email: string; image: string | null }; }
  const [blasts,      setBlasts]    = useState<Blast[]>([]);
  const [blastLoad,   setBlastLoad] = useState(true);
  const [blastActing, setBlastActing] = useState<Record<string, boolean>>({});
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  /* listings state */
  const [listings,  setListings]  = useState<Listing[]>([]);
  const [listLoad,  setListLoad]  = useState(true);
  const [lFilter,   setLFilter]   = useState<Status | "ALL">("ALL");
  const [lSearch,   setLSearch]   = useState("");
  const [lActing,   setLActing]   = useState<Record<string, boolean>>({});

  /* pro apps state */
  const [proApps,   setProApps]   = useState<ProApp[]>([]);
  const [proLoad,   setProLoad]   = useState(true);
  const [pFilter,   setPFilter]   = useState<Status | "ALL">("PENDING");
  const [pSearch,   setPSearch]   = useState("");
  const [pActing,   setPActing]   = useState<Record<string, boolean>>({});
  const [noteMap,   setNoteMap]   = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/listings").then(r => r.json())
      .then(d => setListings(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setListLoad(false));
    fetch("/api/admin/professional-applications").then(r => r.json())
      .then(d => setProApps(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setProLoad(false));
    fetch("/api/admin/message-blasts?status=PENDING_APPROVAL").then(r => r.json())
      .then(d => setBlasts(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setBlastLoad(false));
    fetch("/api/admin/pro-ads?status=PENDING_APPROVAL").then(r => r.json())
      .then(d => setProAds(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setProAdsLoad(false));
    fetch("/api/admin/featured-listings?status=PENDING_APPROVAL").then(r => r.json())
      .then(d => setFeatItems(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setFeatLoad(false));
  }, []);

  const approveProAd = async (id: string) => {
    setAdActing(p => ({ ...p, [id]: true }));
    const res = await fetch(`/api/admin/pro-ads/${id}/approve`, { method: "POST" });
    if (res.ok) setProAds(p => p.filter(a => a.id !== id));
    setAdActing(p => ({ ...p, [id]: false }));
  };
  const rejectProAd = async (id: string) => {
    setAdActing(p => ({ ...p, [id]: true }));
    await fetch(`/api/admin/pro-ads/${id}/reject`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: adRejectReasons[id] ?? "" }),
    });
    setProAds(p => p.filter(a => a.id !== id));
    setAdActing(p => ({ ...p, [id]: false }));
  };

  const approveFeatured = async (id: string) => {
    setFeatActing(p => ({ ...p, [id]: true }));
    const res = await fetch(`/api/admin/featured-listings/${id}/approve`, { method: "POST" });
    if (res.ok) setFeatItems(p => p.filter(f => f.id !== id));
    setFeatActing(p => ({ ...p, [id]: false }));
  };
  const rejectFeatured = async (id: string) => {
    setFeatActing(p => ({ ...p, [id]: true }));
    await fetch(`/api/admin/featured-listings/${id}/reject`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: featReasons[id] ?? "" }),
    });
    setFeatItems(p => p.filter(f => f.id !== id));
    setFeatActing(p => ({ ...p, [id]: false }));
  };

  const approveBlast = async (id: string) => {
    setBlastActing(p => ({ ...p, [id]: true }));
    const res = await fetch(`/api/admin/message-blasts/${id}/approve`, { method: "POST" });
    if (res.ok) setBlasts(p => p.filter(b => b.id !== id));
    setBlastActing(p => ({ ...p, [id]: false }));
  };
  const rejectBlast = async (id: string) => {
    setBlastActing(p => ({ ...p, [id]: true }));
    const res = await fetch(`/api/admin/message-blasts/${id}/reject`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReasons[id] ?? "" }),
    });
    if (res.ok) setBlasts(p => p.filter(b => b.id !== id));
    setBlastActing(p => ({ ...p, [id]: false }));
  };

  /* ── Listing actions ── */
  const updateListing = async (id: string, status: Status) => {
    setLActing(p => ({ ...p, [id]: true }));
    const res = await fetch(`/api/admin/listings/${id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    if (res.ok) setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    setLActing(p => ({ ...p, [id]: false }));
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this listing?")) return;
    setLActing(p => ({ ...p, [id]: true }));
    const res = await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
    if (res.ok) setListings(prev => prev.filter(l => l.id !== id));
    setLActing(p => ({ ...p, [id]: false }));
  };

  /* ── Pro app actions ── */
  const reviewApp = async (id: string, status: "APPROVED" | "REJECTED") => {
    setPActing(p => ({ ...p, [id]: true }));
    const res = await fetch(`/api/admin/professional-applications`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: id, status, note: noteMap[id] ?? "" }),
    });
    if (res.ok) setProApps(prev => prev.map(a => a.id === id ? { ...a, status, note: noteMap[id] ?? null } : a));
    setPActing(p => ({ ...p, [id]: false }));
  };

  const filteredListings = listings.filter(l =>
    (lFilter === "ALL" || l.status === lFilter) &&
    (l.title.toLowerCase().includes(lSearch.toLowerCase()) || l.user.name.toLowerCase().includes(lSearch.toLowerCase()))
  );

  const filteredApps = proApps.filter(a =>
    (pFilter === "ALL" || a.status === pFilter) &&
    (a.user.name.toLowerCase().includes(pSearch.toLowerCase()) || a.specialty.toLowerCase().includes(pSearch.toLowerCase()))
  );

  const pCounts = { ALL: proApps.length, PENDING: proApps.filter(a => a.status==="PENDING").length, APPROVED: proApps.filter(a => a.status==="APPROVED").length, REJECTED: proApps.filter(a => a.status==="REJECTED").length };

  const FilterChips = ({ options, active, setActive }: { options: { key: string; label: string; count: number; color: string }[]; active: string; setActive: (v: string) => void }) => (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button key={o.key} onClick={() => setActive(o.key)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-all ${active===o.key ? "border-[#0a1628] bg-[#0a1628] text-white" : `border-transparent ${o.color} hover:border-slate-200`}`}>
          {o.label}<span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active===o.key?"bg-white/20":"bg-white/70"}`}>{o.count}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#0a1628]">Approvals</h1>
        <p className="text-slate-500 text-sm mt-0.5">Review listings and professional applications</p>
      </div>

      {/* Tab switch */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 w-fit flex-wrap">
        <button onClick={() => setActiveTab("pros")} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab==="pros" ? "bg-[#0a1628] text-white shadow" : "text-slate-500 hover:text-[#0a1628]"}`}>
          <BadgeCheck className="w-4 h-4"/> Pro Applications
          {pCounts.PENDING > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{pCounts.PENDING}</span>}
        </button>
        <button onClick={() => setActiveTab("listings")} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab==="listings" ? "bg-[#0a1628] text-white shadow" : "text-slate-500 hover:text-[#0a1628]"}`}>
          <Users className="w-4 h-4"/> Listing Approvals
        </button>
        <button onClick={() => setActiveTab("blasts")} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab==="blasts" ? "bg-[#0a1628] text-white shadow" : "text-slate-500 hover:text-[#0a1628]"}`}>
          <Megaphone className="w-4 h-4"/> Message Blasts
          {blasts.length > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{blasts.length}</span>}
        </button>
        <button onClick={() => setActiveTab("proads")} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab==="proads" ? "bg-[#0a1628] text-white shadow" : "text-slate-500 hover:text-[#0a1628]"}`}>
          <MonitorPlay className="w-4 h-4"/> Pro Ads
          {proAds.length > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{proAds.length}</span>}
        </button>
        <button onClick={() => setActiveTab("featured")} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab==="featured" ? "bg-[#0a1628] text-white shadow" : "text-slate-500 hover:text-[#0a1628]"}`}>
          <Star className="w-4 h-4"/> Featured Listings
          {featItems.length > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{featItems.length}</span>}
        </button>
      </div>

      {/* ─── PRO APPLICATIONS TAB ─── */}
      {activeTab === "pros" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <FilterChips active={pFilter} setActive={v => setPFilter(v as Status | "ALL")} options={[
              { key:"ALL",      label:"All",      count:pCounts.ALL,      color:"bg-slate-100 text-slate-600" },
              { key:"PENDING",  label:"Pending",  count:pCounts.PENDING,  color:"bg-amber-100 text-amber-700" },
              { key:"APPROVED", label:"Approved", count:pCounts.APPROVED, color:"bg-emerald-100 text-emerald-700" },
              { key:"REJECTED", label:"Rejected", count:pCounts.REJECTED, color:"bg-red-100 text-red-600" },
            ]}/>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <input value={pSearch} onChange={e=>setPSearch(e.target.value)} placeholder="Search applicants…"
                className="w-full text-sm pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] transition-all font-[inherit]"/>
            </div>
          </div>

          {proLoad ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#0a1628]"/></div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
              <BadgeCheck className="w-8 h-8 mx-auto mb-3 opacity-40"/>
              <p className="font-semibold">No applications found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApps.map(app => {
                const sc = statusCfg[app.status]; const SI = sc.icon;
                return (
                  <div key={app.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Applicant info */}
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-[#0a1628] overflow-hidden flex items-center justify-center shrink-0 shadow">
                          {app.user.image ? <img src={app.user.image} alt={app.user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover"/> : <span className="text-white font-black">{app.user.name[0]}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className="font-bold text-[#0a1628] text-sm">{app.user.name}</span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.cls}`}><SI className="w-3 h-3"/>{sc.label}</span>
                          </div>
                          <p className="text-xs text-slate-400">{app.user.email} · {timeAgo(app.createdAt)}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full">🎯 {app.specialty}</span>
                            <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-full">🏅 {app.credentials}</span>
                          </div>
                          <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Reason</p>
                            <p className="text-xs text-slate-600 leading-relaxed">{app.reason}</p>
                          </div>
                          {app.status === "PENDING" && (
                            <div className="mt-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Admin Note (optional)</p>
                              <input value={noteMap[app.id]??""} onChange={e=>setNoteMap(p=>({...p,[app.id]:e.target.value}))}
                                placeholder="Note shown to applicant on rejection…"
                                className="w-full text-xs font-[inherit] px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] transition-all"/>
                            </div>
                          )}
                          {app.note && app.status !== "PENDING" && <p className="text-xs text-slate-500 mt-2 italic">Note: {app.note}</p>}
                        </div>
                      </div>

                      {/* Actions */}
                      {app.status === "PENDING" && (
                        <div className="flex sm:flex-col gap-2 shrink-0 sm:w-32 justify-end">
                          {pActing[app.id] ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto"/> : (<>
                            <button onClick={() => reviewApp(app.id, "APPROVED")}
                              className="flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-all w-full">
                              <CheckCircle2 className="w-3.5 h-3.5"/> Approve
                            </button>
                            <button onClick={() => reviewApp(app.id, "REJECTED")}
                              className="flex items-center justify-center gap-1.5 text-xs font-bold bg-red-50 text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-100 transition-all w-full">
                              <XCircle className="w-3.5 h-3.5"/> Reject
                            </button>
                          </>)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── LISTINGS TAB ─── */}
      {activeTab === "listings" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <FilterChips active={lFilter} setActive={v => setLFilter(v as Status | "ALL")} options={[
              { key:"ALL",      label:"All",      count:listings.length,                              color:"bg-slate-100 text-slate-600" },
              { key:"PENDING",  label:"Pending",  count:listings.filter(l=>l.status==="PENDING").length,  color:"bg-amber-100 text-amber-700" },
              { key:"APPROVED", label:"Approved", count:listings.filter(l=>l.status==="APPROVED").length, color:"bg-emerald-100 text-emerald-700" },
              { key:"REJECTED", label:"Rejected", count:listings.filter(l=>l.status==="REJECTED").length, color:"bg-red-100 text-red-600" },
            ]}/>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                <input value={lSearch} onChange={e=>setLSearch(e.target.value)} placeholder="Search listings…"
                  className="w-full text-sm pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] transition-all font-[inherit]"/>
              </div>
              <Link href="/marketplace/create" className="flex items-center gap-1.5 text-xs font-bold bg-[#0a1628] text-white px-3.5 py-2 rounded-xl hover:bg-[#1a3a6b] transition-all shrink-0">
                <Plus className="w-3.5 h-3.5" /> Create Listing
              </Link>
            </div>
          </div>

          {listLoad ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#0a1628]"/></div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left text-xs font-bold text-slate-500 px-5 py-3.5 uppercase tracking-wider">Listing</th>
                    <th className="text-left text-xs font-bold text-slate-500 px-5 py-3.5 uppercase tracking-wider hidden md:table-cell">Category</th>
                    <th className="text-left text-xs font-bold text-slate-500 px-5 py-3.5 uppercase tracking-wider hidden md:table-cell">Price</th>
                    <th className="text-left text-xs font-bold text-slate-500 px-5 py-3.5 uppercase tracking-wider">Status</th>
                    <th className="text-right text-xs font-bold text-slate-500 px-5 py-3.5 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredListings.map(l => { const sc = statusCfg[l.status]; const SI = sc.icon; return (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4"><div className="font-semibold text-[#0a1628] text-sm">{l.title}</div><div className="text-xs text-slate-400 mt-0.5">{l.user.name} · {timeAgo(l.createdAt)}</div></td>
                      <td className="px-5 py-4 hidden md:table-cell"><span className="text-xs bg-slate-100 text-slate-600 font-medium px-2.5 py-1 rounded-full">{catLabels[l.category]??l.category}</span></td>
                      <td className="px-5 py-4 hidden md:table-cell"><span className="text-sm font-bold text-[#0a1628]">{l.price!=null?`$${l.price}`:"Free"}</span></td>
                      <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sc.cls}`}><SI className="w-3 h-3"/>{sc.label}</span></td>
                      <td className="px-5 py-4"><div className="flex items-center gap-2 justify-end">
                        {lActing[l.id] ? <Loader2 className="w-4 h-4 animate-spin text-slate-400"/> : (<>
                          {l.status!=="APPROVED" && <button onClick={()=>updateListing(l.id,"APPROVED")} className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-all"><CheckCircle2 className="w-3 h-3"/>Approve</button>}
                          {l.status!=="REJECTED" && <button onClick={()=>updateListing(l.id,"REJECTED")} className="flex items-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-all"><XCircle className="w-3 h-3"/>Reject</button>}
                          <button onClick={()=>deleteListing(l.id)} title="Permanently delete listing" className="flex items-center gap-1 text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-all"><Trash2 className="w-3.5 h-3.5"/>Delete</button>
                        </>)}
                      </div></td>
                    </tr>
                  );})}
                </tbody>
              </table>
              {filteredListings.length===0 && <div className="text-center py-16 text-slate-400"><p className="font-semibold">No listings found</p></div>}
            </div>
          )}
        </div>
      )}
      {/* ─── BLASTS TAB ─── */}
      {activeTab === "blasts" && (
        <div className="space-y-4">
          {blastLoad ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#0a1628]"/></div>
          ) : blasts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
              <Megaphone className="w-8 h-8 mx-auto mb-3 opacity-30"/>
              <p className="font-semibold">No pending blasts</p>
              <p className="text-sm mt-1">All message blast submissions are up to date.</p>
            </div>
          ) : blasts.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#0a1628] overflow-hidden flex items-center justify-center shrink-0">
                  {b.sender.image
                    ? <img src={b.sender.image} alt={b.sender.name} referrerPolicy="no-referrer" className="w-full h-full object-cover"/>
                    : <span className="text-white font-black text-sm">{b.sender.name[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-[#0a1628] text-sm">{b.sender.name}</span>
                    <span className="text-xs text-slate-400">{b.sender.email}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full">{b.recipientCount.toLocaleString()} recipients</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full">${b.priceUsd} paid</span>
                    <span className="text-xs text-slate-400">{timeAgo(b.createdAt)}</span>
                  </div>
                  <p className="font-bold text-[#0a1628]">{b.subject}</p>
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap line-clamp-5 bg-slate-50 rounded-xl p-3 border border-slate-100">{b.content}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Rejection Reason (optional)</p>
                <input
                  value={rejectReasons[b.id] ?? ""}
                  onChange={e => setRejectReasons(p => ({ ...p, [b.id]: e.target.value }))}
                  placeholder="Reason shown to sender if rejected…"
                  className="w-full text-xs font-[inherit] px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] transition-all"/>
              </div>
              <div className="flex gap-2">
                {blastActing[b.id] ? <Loader2 className="w-5 h-5 animate-spin text-slate-400"/> : (<>
                  <button onClick={() => approveBlast(b.id)}
                    className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-all">
                    <CheckCircle2 className="w-3.5 h-3.5"/> Approve &amp; Deliver
                  </button>
                  <button onClick={() => rejectBlast(b.id)}
                    className="flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-100 transition-all">
                    <XCircle className="w-3.5 h-3.5"/> Reject
                  </button>
                </>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── PRO ADS TAB ─── */}
      {activeTab === "proads" && (
        <div className="space-y-4">
          {proAdsLoad ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#0a1628]"/></div>
          ) : proAds.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
              <MonitorPlay className="w-8 h-8 mx-auto mb-3 opacity-30"/>
              <p className="font-semibold">No pending ads</p>
              <p className="text-sm mt-1">All advertising submissions are up to date.</p>
            </div>
          ) : proAds.map(ad => (
            <div key={ad.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#0a1628] overflow-hidden flex items-center justify-center shrink-0">
                  {ad.user.image ? <img src={ad.user.image} alt={ad.user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover"/> : <span className="text-white font-black text-sm">{ad.user.name[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-[#0a1628] text-sm">{ad.user.name}</span>
                    <span className="text-xs text-slate-400">{ad.user.email}</span>
                    <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2.5 py-0.5 rounded-full">{ad.placement === "CENTER_COLUMN" ? "Center Column" : "Left Column"}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full">{ad.durationMonths} month{ad.durationMonths > 1 ? "s" : ""}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full">${ad.priceUsd} paid</span>
                    <span className="text-xs text-slate-400">{timeAgo(ad.createdAt)}</span>
                  </div>
                  <p className="font-bold text-[#0a1628]">{ad.title}</p>
                  {ad.description && <p className="text-sm text-slate-500 mt-0.5">{ad.description}</p>}
                  <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-0.5 block truncate">{ad.linkUrl}</a>
                </div>
              </div>
              {/* Banner preview */}
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img src={ad.imageUrl} alt={ad.title} className="w-full max-h-56 object-cover"
                  onError={e => { (e.target as HTMLImageElement).alt = "Image failed to load"; }}/>
                <div className="px-3 py-1.5 text-[10px] text-slate-400 font-medium">
                  {ad.placement === "CENTER_COLUMN" ? "Center Column — 1200 × 628 px" : "Left Column — 300 × 600 px"}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Rejection Reason (optional)</p>
                <input value={adRejectReasons[ad.id] ?? ""} onChange={e => setAdRejectReasons(p => ({ ...p, [ad.id]: e.target.value }))}
                  placeholder="Reason shown to advertiser if rejected…"
                  className="w-full text-xs font-[inherit] px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] transition-all"/>
              </div>
              <div className="flex gap-2">
                {adActing[ad.id] ? <Loader2 className="w-5 h-5 animate-spin text-slate-400"/> : (<>
                  <button onClick={() => approveProAd(ad.id)}
                    className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-all">
                    <CheckCircle2 className="w-3.5 h-3.5"/> Approve &amp; Activate
                  </button>
                  <button onClick={() => rejectProAd(ad.id)}
                    className="flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-100 transition-all">
                    <XCircle className="w-3.5 h-3.5"/> Reject
                  </button>
                </>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── FEATURED LISTINGS TAB ─── */}
      {activeTab === "featured" && (
        <div className="space-y-4">
          {featLoad ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#0a1628]"/></div>
          ) : featItems.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-30"/>
              <p className="font-semibold">No pending featured listing requests</p>
            </div>
          ) : featItems.map(f => (
            <div key={f.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-start gap-4">
                {/* Listing thumbnail */}
                <div className="w-20 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  {f.listing.images[0]
                    ? <img src={f.listing.images[0]} alt={f.listing.title} className="w-full h-full object-cover"/>
                    : <Star className="w-5 h-5 text-slate-300 m-4.5"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-[#0a1628]">{f.listing.title}</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{f.listing.category}</span>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{f.durationMonths} month{f.durationMonths > 1 ? "s" : ""}</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">${f.priceUsd} paid</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{f.listing.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {f.user.image && <img src={f.user.image} alt={f.user.name} className="w-5 h-5 rounded-full object-cover"/>}
                    <span className="text-xs text-slate-500">{f.user.name} · {f.user.email} · {new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rejection Reason (optional)</p>
                <input value={featReasons[f.id] ?? ""} onChange={e => setFeatReasons(p => ({ ...p, [f.id]: e.target.value }))}
                  placeholder="Reason shown to member if rejected…"
                  className="w-full text-xs font-[inherit] px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] transition-all"/>
              </div>
              <div className="flex gap-2">
                {featActing[f.id] ? <Loader2 className="w-5 h-5 animate-spin text-slate-400"/> : (<>
                  <button onClick={() => approveFeatured(f.id)}
                    className="flex items-center gap-1.5 text-xs font-bold bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition-all">
                    <Star className="w-3.5 h-3.5"/> Approve &amp; Feature
                  </button>
                  <button onClick={() => rejectFeatured(f.id)}
                    className="flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-100 transition-all">
                    <XCircle className="w-3.5 h-3.5"/> Reject
                  </button>
                </>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
