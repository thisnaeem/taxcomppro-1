"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users as UserGroupIcon,
  DollarSign as DollarCircleIcon,
  Settings as Settings01Icon,
  ToggleRight as ToggleOnIcon,
  ToggleLeft as ToggleOffIcon,
  Check as Tick02Icon,
  Clock as Clock01Icon,
  X as Cancel01Icon,
  Loader2,
  Sliders,
  Plus,
  Minus,
  Search,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Check,
  Copy,
} from "lucide-react";

interface AffiliateSettings {
  programEnabled: boolean;
  commissionVip: number;
  commissionMarketplace: number;
  commissionPlus: number;
  minPayoutAmount: number;
  cookieDays: number;
}

interface AffiliateItem {
  id: string;
  code: string;
  isActive: boolean;
  totalEarned: number;
  pendingBalance: number;
  totalPaid: number;
  customCommissionRate: number | null;
  customVip: number | null;
  customMarketplace: number | null;
  customPlus: number | null;
  user: { id: string; name: string; email: string; image?: string | null };
  _count: { referrals: number; payouts: number };
}

interface PayoutItem {
  id: string;
  amount: number;
  method: string;
  details: string;
  status: string;
  createdAt: string;
  note?: string;
  affiliateId: string;
  affiliate: { id: string; user: { name: string; email: string } };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-400/15 text-amber-300 border border-amber-400/20",
  APPROVED: "bg-blue-400/15 text-blue-300 border border-blue-400/20",
  PAID: "bg-emerald-400/15 text-emerald-300 border border-emerald-400/20",
  REJECTED: "bg-red-400/15 text-red-300 border border-red-400/20",
};

function ago(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminAffiliatePage() {
  const [tab, setTab] = useState<"affiliates" | "payouts" | "settings">("affiliates");
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [affiliates, setAffiliates] = useState<AffiliateItem[]>([]);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [payoutNotes, setPayoutNotes] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [s, a, p] = await Promise.all([
        fetch("/api/admin/affiliate").then((r) => r.json()),
        fetch("/api/admin/affiliate/affiliates").then((r) => r.json()),
        fetch("/api/admin/affiliate/payouts").then((r) => r.json()),
      ]);
      if (s && !s.error) setSettings(s);
      if (Array.isArray(a)) setAffiliates(a);
      if (Array.isArray(p)) setPayouts(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/affiliate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const updatePayout = async (id: string, status: string) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/affiliate/payouts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: payoutNotes[id] ?? "" }),
      });
      if (res.ok) {
        const upd = await res.json();
        setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, ...upd } : p)));
        // Refresh affiliates to reflect updated balances
        fetch("/api/admin/affiliate/affiliates")
          .then((r) => r.json())
          .then((a) => Array.isArray(a) && setAffiliates(a));
      }
    } finally {
      setProcessing(null);
    }
  };

  // Quick inline adjustment of affiliate commission rate
  const handleQuickAdjustRate = async (affiliate: AffiliateItem, delta: number) => {
    const currentRate =
      affiliate.customCommissionRate ?? settings?.commissionVip ?? 10;
    const nextRate = Math.max(0, Math.min(100, parseFloat((currentRate + delta).toFixed(1))));

    setAdjustingId(affiliate.id);
    try {
      const res = await fetch("/api/admin/affiliate/affiliates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: affiliate.id,
          customCommissionRate: nextRate,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAffiliates((prev) =>
          prev.map((a) => (a.id === affiliate.id ? { ...a, customCommissionRate: updated.customCommissionRate } : a))
        );
      }
    } finally {
      setAdjustingId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Summary Metrics
  const totalEarnedAll = affiliates.reduce((sum, a) => sum + (a.totalEarned || 0), 0);
  const totalPendingAll = affiliates.reduce((sum, a) => sum + (a.pendingBalance || 0), 0);
  const totalPaidAll = affiliates.reduce((sum, a) => sum + (a.totalPaid || 0), 0);
  const totalReferralsAll = affiliates.reduce((sum, a) => sum + (a._count?.referrals || 0), 0);

  const filteredAffiliates = affiliates.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.user.name?.toLowerCase().includes(q) ||
      a.user.email?.toLowerCase().includes(q) ||
      a.code?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-slate-400 text-xs font-semibold">Loading affiliate management…</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Affiliate Program</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Manage affiliates, adjust individual commission rates, track earnings, and process payouts.
          </p>
        </div>
      </div>

      {/* ── TOP KPI SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Total Earned</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">${totalEarnedAll.toFixed(2)}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Lifetime referral earnings</p>
        </div>

        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Payouts</span>
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
              <Clock01Icon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">${totalPendingAll.toFixed(2)}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Owed to affiliates</p>
        </div>

        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Total Paid</span>
            <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">${totalPaidAll.toFixed(2)}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Completed disbursements</p>
        </div>

        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Total Referrals</span>
            <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400">
              <UserGroupIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300">{totalReferralsAll}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Converted paying members</p>
        </div>
      </div>

      {/* ── TABS SWITCHER ── */}
      <div className="flex gap-1.5 bg-slate-800/80 border border-white/10 rounded-2xl p-1.5 w-fit shadow-xl">
        {[
          { id: "affiliates", label: `All Affiliates (${affiliates.length})`, icon: UserGroupIcon },
          { id: "payouts", label: `Payout Requests (${payouts.length})`, icon: DollarCircleIcon },
          { id: "settings", label: "Program Settings", icon: Settings01Icon },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                active
                  ? "bg-[#f0c040] text-slate-950 shadow-md shadow-amber-400/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════
          TAB 1: ALL AFFILIATES LIST (WITH INLINE RATES & DETAILS LINK)
      ════════════════════════════════════════════════════════════ */}
      {tab === "affiliates" && (
        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/8">
            <div>
              <h2 className="font-black text-lg text-white flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-blue-400" />
                Affiliate Members ({filteredAffiliates.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click on any affiliate to view detailed earnings, referral history, or adjust individual commission rates.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition-all"
              />
            </div>
          </div>

          {filteredAffiliates.length === 0 ? (
            <p className="text-center text-slate-400 py-12 text-sm font-semibold">
              {search ? "No affiliates match your search." : "No registered affiliates yet."}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredAffiliates.map((a) => {
                const isCustom = a.customCommissionRate !== null;
                const activeRate = a.customCommissionRate ?? settings?.commissionVip ?? 10;

                return (
                  <div
                    key={a.id}
                    className="p-4 bg-slate-900/60 hover:bg-slate-900/90 border border-white/5 hover:border-amber-400/30 rounded-2xl transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                  >
                    {/* User Info & Code */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                        {a.user.image ? (
                          <img src={a.user.image} alt={a.user.name} className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                          a.user.name?.[0]?.toUpperCase() || "A"
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/affiliate/${a.id}`}
                            className="font-black text-sm text-white hover:text-amber-400 transition-colors truncate"
                          >
                            {a.user.name}
                          </Link>
                          {isCustom ? (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full shrink-0">
                              Custom {a.customCommissionRate}%
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                              Global Default
                            </span>
                          )}
                          {!a.isActive && (
                            <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full shrink-0">
                              Disabled
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="truncate">{a.user.email}</span>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => copyCode(a.code)}
                            className="font-mono text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 shrink-0"
                            title="Click to copy code"
                          >
                            <span>{a.code}</span>
                            {copiedCode === a.code ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Commission Rate Inline Controller */}
                    <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-2 rounded-xl border border-white/5 shrink-0 self-start lg:self-auto">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Rate:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjustRate(a, -1)}
                        disabled={adjustingId === a.id}
                        className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-xs font-bold transition-all disabled:opacity-50"
                        title="Decrease rate 1%"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-black text-sm text-amber-400 w-10 text-center">
                        {activeRate}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjustRate(a, 1)}
                        disabled={adjustingId === a.id}
                        className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-xs font-bold transition-all disabled:opacity-50"
                        title="Increase rate 1%"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Financial Metrics */}
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0 justify-between sm:justify-end text-right border-t border-white/5 lg:border-none pt-3 lg:pt-0">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Referrals</div>
                        <div className="font-black text-white text-sm">{a._count.referrals}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Earned</div>
                        <div className="font-black text-emerald-400 text-sm">${a.totalEarned.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Pending</div>
                        <div className="font-black text-amber-400 text-sm">${a.pendingBalance.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Paid</div>
                        <div className="font-black text-slate-300 text-sm">${a.totalPaid.toFixed(2)}</div>
                      </div>

                      {/* Detail Page Link Button */}
                      <Link
                        href={`/admin/affiliate/${a.id}`}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-[#f0c040] text-slate-300 hover:text-slate-950 font-black text-xs transition-all flex items-center gap-1 shadow-sm shrink-0"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 2: PAYOUT REQUESTS
      ════════════════════════════════════════════════════════════ */}
      {tab === "payouts" && (
        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
          <h2 className="font-black text-lg text-white flex items-center gap-2">
            <DollarCircleIcon className="w-5 h-5 text-emerald-400" />
            Payout Requests ({payouts.length})
          </h2>
          {payouts.length === 0 ? (
            <p className="text-center text-slate-400 py-12 text-sm font-semibold">No payout requests found.</p>
          ) : (
            <div className="space-y-3">
              {payouts.map((p) => (
                <div key={p.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {p.affiliate.user.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <Link
                            href={`/admin/affiliate/${p.affiliateId || p.affiliate.id}`}
                            className="hover:text-amber-400 transition-colors"
                          >
                            {p.affiliate.user.name}
                          </Link>
                          <span>•</span>
                          <span className="text-emerald-400 font-black">${p.amount.toFixed(2)}</span>
                          <span className="text-xs text-slate-400 font-normal">via {p.method}</span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{p.details}</span>
                          <span>•</span>
                          <Clock01Icon className="w-3 h-3 inline text-slate-500" />
                          <span>{ago(p.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${statusColors[p.status] ?? "bg-slate-700 text-slate-300"}`}>
                        {p.status}
                      </span>
                      <Link
                        href={`/admin/affiliate/${p.affiliateId || p.affiliate.id}`}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs"
                        title="View Affiliate Profile"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {p.status === "PENDING" && (
                    <div className="flex gap-2 items-center pt-1 border-t border-white/5">
                      <input
                        type="text"
                        placeholder="Optional note / transaction ID…"
                        value={payoutNotes[p.id] ?? ""}
                        onChange={(e) => setPayoutNotes((n) => ({ ...n, [p.id]: e.target.value }))}
                        className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                      />
                      <button
                        onClick={() => updatePayout(p.id, "APPROVED")}
                        disabled={processing === p.id}
                        className="flex items-center gap-1 text-xs font-black bg-blue-500 text-slate-950 px-3.5 py-2 rounded-xl hover:bg-blue-400 transition-all disabled:opacity-60"
                      >
                        {processing === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Tick02Icon className="w-3 h-3" />} Approve
                      </button>
                      <button
                        onClick={() => updatePayout(p.id, "PAID")}
                        disabled={processing === p.id}
                        className="flex items-center gap-1 text-xs font-black bg-[#f0c040] text-slate-950 px-3.5 py-2 rounded-xl hover:bg-amber-400 transition-all disabled:opacity-60 shadow-md shadow-amber-400/20"
                      >
                        {processing === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Mark as Paid
                      </button>
                      <button
                        onClick={() => updatePayout(p.id, "REJECTED")}
                        disabled={processing === p.id}
                        className="flex items-center gap-1 text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl hover:bg-red-500/30 transition-all disabled:opacity-60"
                      >
                        <Cancel01Icon className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  )}

                  {p.status === "APPROVED" && (
                    <div className="flex justify-end pt-1 border-t border-white/5">
                      <button
                        onClick={() => updatePayout(p.id, "PAID")}
                        disabled={processing === p.id}
                        className="flex items-center gap-1.5 text-xs font-black bg-[#f0c040] hover:bg-amber-400 text-slate-950 px-5 py-2.5 rounded-xl transition-all disabled:opacity-60 shadow-md shadow-amber-400/20"
                      >
                        {processing === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tick02Icon className="w-3.5 h-3.5" />} Mark as Paid &amp; Deduct Balance
                      </button>
                    </div>
                  )}

                  {p.note && <p className="text-xs text-slate-400 italic">Note: {p.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 3: GLOBAL PROGRAM SETTINGS
      ════════════════════════════════════════════════════════════ */}
      {tab === "settings" && settings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl backdrop-blur-sm">
            <h2 className="font-black text-white flex items-center gap-2">
              <Settings01Icon className="w-4 h-4 text-amber-400" />
              Global Program Configuration
            </h2>
            <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-white/5 rounded-xl">
              <div>
                <div className="font-bold text-white text-sm">Program Enabled</div>
                <div className="text-xs text-slate-400">Allow users to access the affiliate program and earn commissions</div>
              </div>
              <button onClick={() => setSettings((s) => (s ? { ...s, programEnabled: !s.programEnabled } : s))}>
                {settings.programEnabled ? (
                  <ToggleOnIcon className="w-8 h-8 text-emerald-400" />
                ) : (
                  <ToggleOffIcon className="w-8 h-8 text-slate-600" />
                )}
              </button>
            </div>
            {[
              { key: "minPayoutAmount", label: "Minimum Payout Threshold ($)", min: 1, max: 1000, step: 1 },
              { key: "cookieDays", label: "Referral Cookie Duration (days)", min: 1, max: 365, step: 1 },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-bold text-slate-400 mb-1 block">{f.label}</label>
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={(settings as unknown as Record<string, number | boolean | string>)[f.key] as number}
                  onChange={(e) => setSettings((s) => (s ? { ...s, [f.key]: parseFloat(e.target.value) } : s))}
                  className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-amber-400"
                />
              </div>
            ))}
          </div>

          <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl backdrop-blur-sm">
            <h2 className="font-black text-white flex items-center gap-2">
              <DollarCircleIcon className="w-4 h-4 text-emerald-400" />
              Default Commission Rates (%)
            </h2>
            {[
              { key: "commissionVip", label: "VIP Plan ($39.99/mo)", price: 39.99 },
              { key: "commissionMarketplace", label: "Marketplace Plan ($79.99/mo)", price: 79.99 },
              { key: "commissionPlus", label: "Marketplace Plus ($109.99/mo)", price: 109.99 },
            ].map((f) => (
              <div key={f.key} className="p-3.5 bg-slate-900/60 border border-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-white">{f.label}</label>
                  <span className="text-xs text-slate-400">
                    ${f.price}/mo →{" "}
                    <strong className="text-emerald-400">
                      ${(
                        (f.price *
                          ((settings as unknown as Record<string, number>)[f.key] ?? 10)) /
                        100
                      ).toFixed(2)}
                    </strong>
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={60}
                  step={0.5}
                  value={(settings as unknown as Record<string, number>)[f.key]}
                  onChange={(e) => setSettings((s) => (s ? { ...s, [f.key]: parseFloat(e.target.value) } : s))}
                  className="w-full accent-[#f0c040]"
                />
                <div className="text-right text-sm font-black text-amber-400 mt-1">
                  {(settings as unknown as Record<string, number>)[f.key]}%
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className={`px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 shadow-lg ${
                saved
                  ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
                  : "bg-[#f0c040] hover:bg-amber-400 text-slate-950 shadow-amber-400/20"
              } disabled:opacity-60`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Tick02Icon className="w-4 h-4" />Saved!</> : null}
              {!saving && !saved ? "Save Settings" : saving ? "Saving…" : null}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
