"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign, TrendingUp, CreditCard, Users,
  XCircle, CheckCircle2, AlertTriangle, X,
  Search, RefreshCw, BarChart3, Calendar,
} from "lucide-react";

const PLAN_PRICE: Record<string, number> = {
  FREE: 0, VIP: 29, MARKETPLACE: 49, MARKETPLACE_PLUS: 99,
};

const PLAN_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  FREE:             { bg: "bg-slate-700/50",     text: "text-slate-300",   dot: "bg-slate-400" },
  VIP:              { bg: "bg-amber-400/15",      text: "text-amber-300",   dot: "bg-amber-400" },
  MARKETPLACE:      { bg: "bg-blue-400/15",       text: "text-blue-300",    dot: "bg-blue-400" },
  MARKETPLACE_PLUS: { bg: "bg-emerald-400/15",    text: "text-emerald-300", dot: "bg-emerald-400" },
};

const STATUS_STYLES: Record<string, string> = {
  active:   "bg-emerald-400/15 text-emerald-300",
  canceled: "bg-red-400/15 text-red-300",
  past_due: "bg-amber-400/15 text-amber-300",
};

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  createdAt: string;
  stripeSubscriptionId: string | null;
  user: { id: string; name: string; email: string; image: string | null; tier: string };
}

interface PaymentData {
  subscriptions: Subscription[];
  tierBreakdown: { plan: string; count: number; monthlyRevenue: number }[];
  totalMRR: number;
  totalARR: number;
  activeCount: number;
  canceledCount: number;
  totalCount: number;
  monthlyRevenue: { month: string; revenue: number; count: number }[];
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function KpiCard({ label, value, sub, icon: Icon, gradient, badge }: {
  label: string; value: string; sub: string;
  icon: React.ElementType; gradient: string; badge?: string;
}) {
  return (
    <div className={`rounded-2xl p-5 ${gradient} relative overflow-hidden`}>
      <div className="flex items-start justify-between mb-3">
        <div className="bg-white/15 rounded-xl p-2.5">
          <Icon className="w-5 h-5 text-white" />
        </div>
        {badge && (
          <span className="bg-white/20 text-white/80 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="text-white/60 text-xs mt-0.5">{label}</div>
      <div className="text-white/35 text-[11px] mt-1">{sub}</div>
    </div>
  );
}

function ConfirmModal({ name, plan, onConfirm, onClose, loading }: {
  name: string; plan: string;
  onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0f1e33] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-white font-black text-lg mb-1">Cancel Subscription</h3>
        <p className="text-slate-400 text-sm mb-2">
          You're about to cancel <strong className="text-white">{name}</strong>'s{" "}
          <strong className="text-amber-300">{plan}</strong> subscription.
        </p>
        <p className="text-slate-500 text-xs mb-5">
          Their account will be downgraded to <strong className="text-white">FREE</strong> immediately.
          This only cancels in your database — cancel in Stripe separately if needed.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/5 transition-all">
            Keep Active
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-black transition-all flex items-center justify-center gap-2">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            {loading ? "Canceling…" : "Yes, Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [data, setData]       = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<"all" | "active" | "canceled">("all");
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/payments")
      .then(r => r.json()).then(setData)
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    const res = await fetch(`/api/admin/payments/${cancelTarget.id}/cancel`, { method: "PATCH" });
    if (res.ok) {
      setData(prev => prev ? {
        ...prev,
        subscriptions: prev.subscriptions.map(s =>
          s.id === cancelTarget.id ? { ...s, status: "canceled", user: { ...s.user, tier: "FREE" } } : s
        ),
        activeCount: prev.activeCount - 1,
        canceledCount: prev.canceledCount + 1,
        totalMRR: prev.totalMRR - (PLAN_PRICE[cancelTarget.plan] ?? 0),
        totalARR: prev.totalARR - (PLAN_PRICE[cancelTarget.plan] ?? 0) * 12,
      } : prev);
    }
    setCancelLoading(false);
    setCancelTarget(null);
  };

  const filtered = (data?.subscriptions ?? []).filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.user.name.toLowerCase().includes(q) || s.user.email.toLowerCase().includes(q) || s.plan.toLowerCase().includes(q);
    const matchFilter = filter === "all" || s.status === filter;
    return matchSearch && matchFilter;
  });

  const maxRevenue = Math.max(...(data?.monthlyRevenue ?? []).map(m => m.revenue), 1);

  return (
    <div className="max-w-[1200px] mx-auto space-y-7">

      {cancelTarget && (
        <ConfirmModal
          name={cancelTarget.user.name}
          plan={cancelTarget.plan}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
          loading={cancelLoading}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Payments & Revenue</h1>
          <p className="text-slate-400 text-sm mt-1">Subscription management and financial overview</p>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-2 bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all border border-white/8">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="rounded-2xl h-[130px] bg-slate-800 animate-pulse" />)
        ) : (<>
          <KpiCard
            label="Monthly Recurring Revenue" value={`$${(data?.totalMRR ?? 0).toLocaleString()}`}
            sub="From active paid subscriptions"
            icon={DollarSign} gradient="bg-gradient-to-br from-emerald-600 to-teal-800" badge="MRR"
          />
          <KpiCard
            label="Annual Recurring Revenue" value={`$${(data?.totalARR ?? 0).toLocaleString()}`}
            sub={`${data?.activeCount ?? 0} active subscribers × 12`}
            icon={TrendingUp} gradient="bg-gradient-to-br from-blue-600 to-blue-900" badge="ARR"
          />
          <KpiCard
            label="Active Subscribers" value={String(data?.activeCount ?? 0)}
            sub={`${data?.canceledCount ?? 0} canceled, ${data?.totalCount ?? 0} total`}
            icon={Users} gradient="bg-gradient-to-br from-purple-600 to-violet-900"
          />
          <KpiCard
            label="Avg Revenue / Subscriber" value={`$${data?.activeCount ? Math.round((data.totalMRR) / data.activeCount) : 0}`}
            sub="Per paid member per month"
            icon={CreditCard} gradient="bg-gradient-to-br from-amber-500 to-orange-700" badge="ARPU"
          />
        </>)}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

        {/* Revenue Chart */}
        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-white text-base">Revenue Over Time</h2>
              <p className="text-slate-400 text-xs mt-0.5">New subscriptions revenue by month</p>
            </div>
            <BarChart3 className="w-5 h-5 text-slate-500" />
          </div>
          {loading ? (
            <div className="h-40 bg-slate-700/50 rounded-xl animate-pulse" />
          ) : (
            <div className="flex items-end gap-3 h-40">
              {(data?.monthlyRevenue ?? []).map(m => {
                const pct = (m.revenue / maxRevenue) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-slate-400 text-[10px] font-bold">
                      {m.revenue > 0 ? `$${m.revenue}` : "—"}
                    </div>
                    <div className="w-full flex items-end" style={{ height: "96px" }}>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-700 min-h-[4px]"
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <div className="text-slate-500 text-[10px]">{m.month}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tier Breakdown */}
        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-white text-base">Plan Breakdown</h2>
              <p className="text-slate-400 text-xs mt-0.5">Subscribers by tier</p>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-10 rounded-xl bg-slate-700/50 animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.tierBreakdown ?? [])
                .filter(t => t.plan !== "FREE")
                .map(t => {
                  const clr = PLAN_COLORS[t.plan] ?? PLAN_COLORS.FREE;
                  const maxCount = Math.max(...(data?.tierBreakdown ?? []).map(x => x.count), 1);
                  const pct = Math.round((t.count / maxCount) * 100);
                  return (
                    <div key={t.plan}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${clr.dot}`} />
                          <span className="text-slate-300 font-semibold">
                            {t.plan.replace("_", " ")}
                          </span>
                        </div>
                        <span className="text-slate-400">
                          {t.count} · <span className="text-white font-bold">${t.monthlyRevenue}/mo</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${clr.dot} transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-white/8">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Paid MRR</span>
              <span className="text-white font-black">${data?.totalMRR ?? 0}/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Subscriber Table ── */}
      <div className="bg-slate-800/60 border border-white/8 rounded-2xl backdrop-blur-sm overflow-hidden">
        {/* Table header */}
        <div className="p-5 border-b border-white/8 flex items-center gap-3 flex-wrap">
          <div>
            <h2 className="font-black text-white text-base">All Subscribers</h2>
            <p className="text-slate-400 text-xs mt-0.5">{filtered.length} of {data?.totalCount ?? 0} records</p>
          </div>
          <div className="flex-1" />
          {/* Filter pills */}
          <div className="flex gap-1.5">
            {(["all", "active", "canceled"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  filter === f
                    ? "bg-[#f0c040] text-[#0a1628]"
                    : "bg-slate-700/60 text-slate-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search subscribers…"
              className="bg-slate-700/50 border border-white/8 text-white text-sm placeholder:text-slate-500 rounded-xl pl-9 pr-4 py-2 w-52 focus:outline-none focus:border-amber-400/50 transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-5 py-3">Subscriber</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">Plan</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">Status</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">Revenue</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">Period End</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">Joined</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">Stripe ID</th>
                <th className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={8} className="px-5 py-4">
                      <div className="h-9 bg-slate-700/50 rounded-xl animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-500">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold">No subscribers found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(s => {
                  const clr = PLAN_COLORS[s.plan] ?? PLAN_COLORS.FREE;
                  const monthlyAmt = PLAN_PRICE[s.plan] ?? 0;
                  const isActive = s.status === "active";
                  return (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-slate-700/30 transition-colors group">
                      {/* Subscriber */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shrink-0 overflow-hidden">
                            {s.user.image
                              ? <img src={s.user.image} alt={s.user.name} className="w-full h-full object-cover" />
                              : <span className="text-white font-black text-xs">{s.user.name?.[0]?.toUpperCase()}</span>}
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-semibold text-sm truncate max-w-[160px]">{s.user.name}</div>
                            <div className="text-slate-500 text-xs truncate max-w-[160px]">{s.user.email}</div>
                          </div>
                        </div>
                      </td>
                      {/* Plan */}
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${clr.bg} ${clr.text}`}>
                          {s.plan.replace("_", " ")}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[s.status] ?? "bg-slate-700 text-slate-300"}`}>
                          {s.status}
                        </span>
                      </td>
                      {/* Revenue */}
                      <td className="px-4 py-3.5">
                        <span className="text-white font-bold text-sm">
                          {monthlyAmt > 0 ? `$${monthlyAmt}/mo` : <span className="text-slate-500">Free</span>}
                        </span>
                      </td>
                      {/* Period End */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Calendar className="w-3 h-3" />
                          {formatDate(s.currentPeriodEnd)}
                        </div>
                      </td>
                      {/* Joined */}
                      <td className="px-4 py-3.5 text-slate-400 text-xs">{timeAgo(s.createdAt)}</td>
                      {/* Stripe ID */}
                      <td className="px-4 py-3.5">
                        {s.stripeSubscriptionId ? (
                          <span className="text-slate-500 text-[10px] font-mono bg-slate-700/50 px-2 py-0.5 rounded truncate max-w-[100px] block">
                            {s.stripeSubscriptionId.slice(0, 16)}…
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {isActive ? (
                          <button
                            onClick={() => setCancelTarget(s)}
                            className="flex items-center gap-1.5 text-xs font-bold bg-red-500/15 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg transition-all ml-auto"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs px-3 py-1.5">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
