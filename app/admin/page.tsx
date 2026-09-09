"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, ShoppingBag, CheckCircle2, XCircle,
  ArrowRight, Plus, CreditCard, DollarSign, Clock,
  ArrowUpRight, ArrowDownRight, CalendarDays, CalendarRange,
} from "lucide-react";

interface Stats {
  totalUsers: number; newUsersWeek: number;
  totalListings: number; pendingListings: number;
  totalCommunities: number; newCommunitiesWeek: number;
  activeSubscriptions: number;
  tierCounts: { tier: string; _count: { tier: number } }[];
  recentUsers: { id: string; name: string; email: string; role: string; tier: string; image?: string; createdAt: string }[];
  recentPending: { id: string; title: string; category: string; price: number | null; createdAt: string; user: { name: string } }[];
}

// Live plan pricing, confirmed against /register.
const PLAN_PRICE: Record<string, number> = {
  FREE: 0, VIP: 39.99, MARKETPLACE: 79.99, MARKETPLACE_PLUS: 129.99,
};

// Panel and text tokens. Light-mode utilities only: globals.css maps them to the
// dark palette, which keeps this page consistent with the rest of the app.
const PANEL = "bg-white border border-slate-200 rounded-2xl shadow-sm";
const PANEL_LABEL = "text-[11px] font-black uppercase tracking-widest text-slate-600";
const MUTED = "text-slate-600";

const tierColors: Record<string, string> = {
  FREE:             "bg-slate-100 text-slate-700 border border-slate-200",
  VIP:              "bg-amber-100 text-amber-800 border border-amber-200",
  MARKETPLACE:      "bg-blue-100 text-blue-800 border border-blue-200",
  MARKETPLACE_PLUS: "bg-emerald-100 text-emerald-800 border border-emerald-200",
};

const catLabels: Record<string, string> = {
  SERVICE: "Service", PRODUCT: "Product", NETWORK: "Network", TRAINING: "Course",
};

/** Plan prices carry cents, so round-trip money through a real currency formatter. */
function fmtMoney(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Metric tile. A tinted icon chip carries the category colour while the number stays
 * on the panel surface, so the value keeps full contrast in both themes.
 */
function StatCard({
  label, value, sub, icon: Icon, chip, trend, trendUp,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; chip: string;
  trend?: string; trendUp?: boolean;
}) {
  return (
    <div className={`${PANEL} p-5 flex flex-col justify-between min-h-[132px] transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-xl p-2.5 ${chip}`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${
              trendUp
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-[28px] leading-none font-black text-slate-900 tabular-nums">{value}</div>
        <div className="text-slate-900 text-sm font-semibold mt-1.5">{label}</div>
        <div className={`${MUTED} text-xs mt-0.5`}>{sub}</div>
      </div>
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className={`${PANEL} p-5 min-h-[132px] animate-pulse`} aria-hidden="true">
      <div className="w-10 h-10 rounded-xl bg-slate-200 mb-6" />
      <div className="h-7 bg-slate-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-200 rounded w-3/4" />
    </div>
  );
}

export default function AdminPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch("/api/admin/stats")
      .then(r => r.json()).then(setStats)
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    await fetch(`/api/admin/listings/${id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setStats(prev => prev
      ? { ...prev, recentPending: prev.recentPending.filter(l => l.id !== id), pendingListings: prev.pendingListings - 1 }
      : prev);
  };

  // Estimated MRR from tier counts
  const estimatedMRR = stats?.tierCounts?.reduce((sum, t) => {
    return sum + (PLAN_PRICE[t.tier] ?? 0) * t._count.tier;
  }, 0) ?? 0;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const statCards = stats ? [
    {
      label: "Total Users", value: stats.totalUsers.toLocaleString(),
      sub: `${stats.newUsersWeek} joined this week`,
      icon: Users, chip: "bg-blue-100 text-blue-700",
      trend: `+${stats.newUsersWeek}`, trendUp: stats.newUsersWeek > 0,
    },
    {
      label: "Marketplace Listings", value: stats.totalListings.toLocaleString(),
      sub: `${stats.pendingListings} pending review`,
      icon: ShoppingBag, chip: "bg-amber-100 text-amber-700",
      trend: stats.pendingListings > 0 ? `${stats.pendingListings} pending` : "All clear",
      trendUp: stats.pendingListings === 0,
    },
    {
      label: "Active Subscriptions", value: stats.activeSubscriptions.toLocaleString(),
      sub: "Paid members on platform",
      icon: CreditCard, chip: "bg-emerald-100 text-emerald-700",
      trend: "Active", trendUp: true,
    },
    {
      label: "Est. Monthly Revenue", value: fmtMoney(estimatedMRR),
      sub: `${fmtMoney(estimatedMRR * 12)} ARR estimate`,
      icon: DollarSign, chip: "bg-violet-100 text-violet-700",
      trend: "MRR", trendUp: true,
    },
  ] : [];

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className={`${MUTED} text-xs sm:text-sm font-medium flex items-center gap-1.5`}>
            <CalendarDays className="w-3.5 h-3.5" /> {today}
          </p>
          <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 mt-1.5 tracking-tight">
            {getGreeting()}, Admin
          </h1>
          <p className={`${MUTED} text-sm mt-1`}>
            Here&apos;s what&apos;s happening on TaxCompPro today.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Link href="/marketplace/create"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#f0c040] text-[#0a1628] font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#e5b52e] active:scale-[0.98] transition-all whitespace-nowrap">
            <Plus className="w-4 h-4" /> Create Listing
          </Link>
          <Link href="/admin/payments"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-900 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all whitespace-nowrap">
            <CreditCard className="w-4 h-4" /> Payments
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? [1, 2, 3, 4].map(i => <SkeletonStat key={i} />)
          : statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-5">

        {/* LEFT */}
        <div className="space-y-5 min-w-0">

          {/* Pending Approvals */}
          <section className={`${PANEL} p-5`}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-black text-slate-900 text-base">Pending Approvals</h2>
                <p className={`${MUTED} text-xs mt-0.5`}>Listings waiting for review</p>
              </div>
              <Link href="/admin/approvals"
                className="flex items-center gap-1 text-xs font-bold text-[#b8860b] hover:underline whitespace-nowrap">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2" aria-hidden="true">
                {[1, 2, 3].map(i => <div key={i} className="h-[68px] rounded-xl bg-slate-100 animate-pulse" />)}
              </div>
            ) : stats?.recentPending.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                </div>
                <p className="text-slate-900 font-bold text-sm">All caught up</p>
                <p className={`${MUTED} text-xs mt-1`}>No listings are waiting for review.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats?.recentPending.map(l => (
                  <div key={l.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 transition-colors hover:bg-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4 text-amber-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate">{l.title}</div>
                        <div className={`${MUTED} text-xs mt-1 flex items-center gap-x-2.5 gap-y-1 flex-wrap`}>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {l.user.name}
                          </span>
                          <span>{catLabels[l.category] ?? l.category}</span>
                          {l.price != null && <span className="tabular-nums">${l.price}</span>}
                          <span>{timeAgo(l.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => updateStatus(l.id, "APPROVED")}
                        className="flex items-center gap-1 text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 active:scale-[0.97] transition-all">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => updateStatus(l.id, "REJECTED")}
                        className="flex items-center gap-1 text-xs font-bold bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 active:scale-[0.97] transition-all">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Signups */}
          <section className={`${PANEL} p-5`}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-black text-slate-900 text-base">Recent Signups</h2>
                <p className={`${MUTED} text-xs mt-0.5`}>Latest members joining the platform</p>
              </div>
              <Link href="/admin/users"
                className="flex items-center gap-1 text-xs font-bold text-[#b8860b] hover:underline whitespace-nowrap">
                Manage all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2" aria-hidden="true">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}
              </div>
            ) : stats?.recentUsers.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-slate-900 font-bold text-sm">No signups yet</p>
                <p className={`${MUTED} text-xs mt-1`}>New members will appear here as they join.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats?.recentUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="w-9 h-9 rounded-full bg-[#0a1628] flex items-center justify-center shrink-0 overflow-hidden">
                      {u.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={u.image} alt="" className="w-full h-full object-cover" />
                        : <span className="text-white font-black text-sm">{u.name?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm truncate">{u.name}</div>
                      <div className={`${MUTED} text-xs truncate`}>{u.email}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierColors[u.tier] ?? tierColors.FREE}`}>
                        {u.tier}
                      </span>
                      <span className={`${MUTED} text-xs hidden sm:inline whitespace-nowrap`}>{timeAgo(u.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT */}
        <div className="space-y-5 min-w-0">

          {/* Revenue Breakdown */}
          <section className={`${PANEL} p-5`}>
            <p className={`${PANEL_LABEL} mb-4`}>Revenue Breakdown</p>
            <div className="space-y-3.5">
              {[
                { tier: "MARKETPLACE_PLUS", label: "Plus",        price: PLAN_PRICE.MARKETPLACE_PLUS, color: "bg-emerald-500" },
                { tier: "MARKETPLACE",      label: "Marketplace", price: PLAN_PRICE.MARKETPLACE,      color: "bg-blue-500" },
                { tier: "VIP",              label: "VIP",         price: PLAN_PRICE.VIP,              color: "bg-amber-500" },
                { tier: "FREE",             label: "Free",        price: PLAN_PRICE.FREE,             color: "bg-slate-400" },
              ].map(({ tier, label, price, color }) => {
                const count = stats?.tierCounts?.find(t => t.tier === tier)?._count.tier ?? 0;
                const maxCount = stats?.totalUsers ?? 1;
                const pct = Math.round((count / Math.max(maxCount, 1)) * 100);
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <span className="text-slate-900 font-semibold">{label}</span>
                      <span className={`${MUTED} tabular-nums whitespace-nowrap`}>
                        {count} users, {fmtMoney(count * price)}/mo
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className={`${MUTED} text-xs font-semibold`}>Est. MRR</span>
              <span className="text-slate-900 font-black text-xl tabular-nums">{fmtMoney(estimatedMRR)}</span>
            </div>
          </section>

          {/* Platform Stats */}
          <section className={`${PANEL} p-5`}>
            <p className={`${PANEL_LABEL} mb-2`}>Platform Stats</p>
            <div>
              {[
                { label: "Pending Reviews",  value: stats?.pendingListings ?? 0,     urgent: (stats?.pendingListings ?? 0) > 0 },
                { label: "New Users (7d)",   value: stats?.newUsersWeek ?? 0,        urgent: false },
                { label: "Communities",      value: stats?.totalCommunities ?? 0,    urgent: false },
                { label: "New Communities",  value: stats?.newCommunitiesWeek ?? 0,  urgent: false },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <span className={`${MUTED} text-sm`}>{r.label}</span>
                  <span className={`font-black text-sm tabular-nums ${r.urgent ? "text-amber-700" : "text-slate-900"}`}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className={`${PANEL} p-5`}>
            <p className={`${PANEL_LABEL} mb-3`}>Quick Actions</p>
            <div className="flex flex-col gap-2">
              <Link href="/marketplace/create"
                className="flex items-center gap-2 bg-[#f0c040] text-[#0a1628] font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#e5b52e] active:scale-[0.98] transition-all">
                <Plus className="w-4 h-4" /> Create Featured Listing
              </Link>
              <Link href="/admin/content-calendar"
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-900 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all">
                <CalendarRange className="w-4 h-4 text-slate-600" /> Content Calendar
              </Link>
              <Link href="/admin/payments"
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-900 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all">
                <CreditCard className="w-4 h-4 text-slate-600" /> View Payments
              </Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
