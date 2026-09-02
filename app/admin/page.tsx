"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, ShoppingBag, TrendingUp, Users2,
  DollarSign, Clock, CheckCircle2, XCircle,
  ArrowRight, Plus, ListFilter, CreditCard,
  ArrowUpRight, ArrowDownRight, CalendarDays,
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

const PLAN_PRICE: Record<string, number> = {
  FREE: 0, VIP: 29, MARKETPLACE: 49, MARKETPLACE_PLUS: 99,
};

const tierColors: Record<string, string> = {
  FREE:             "bg-slate-700/50 text-slate-300",
  VIP:              "bg-amber-400/20 text-amber-300",
  MARKETPLACE:      "bg-blue-400/20 text-blue-300",
  MARKETPLACE_PLUS: "bg-emerald-400/20 text-emerald-300",
};

const catLabels: Record<string, string> = {
  SERVICE: "Service", PRODUCT: "Product", NETWORK: "Network", TRAINING: "Course",
};

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

function StatCard({
  label, value, sub, icon: Icon, gradient, trend, trendUp,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; gradient: string;
  trend?: string; trendUp?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col justify-between min-h-[130px] relative overflow-hidden ${gradient}`}>
      <div className="flex items-start justify-between">
        <div className="bg-white/15 rounded-xl p-2.5">
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? "bg-emerald-400/20 text-emerald-200" : "bg-red-400/20 text-red-200"}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <div className="text-3xl font-black text-white mt-3">{value}</div>
        <div className="text-white/60 text-xs mt-0.5">{label}</div>
        <div className="text-white/40 text-[11px] mt-1">{sub}</div>
      </div>
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="rounded-2xl p-5 animate-pulse bg-slate-800 min-h-[130px]">
      <div className="w-10 h-10 rounded-xl bg-slate-700 mb-4" />
      <div className="h-8 bg-slate-700 rounded w-1/2 mb-1" />
      <div className="h-3 bg-slate-700 rounded w-3/4" />
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
      sub: `+${stats.newUsersWeek} joined this week`,
      icon: Users, gradient: "bg-gradient-to-br from-blue-600 to-blue-800",
      trend: `+${stats.newUsersWeek}`, trendUp: stats.newUsersWeek > 0,
    },
    {
      label: "Marketplace Listings", value: stats.totalListings.toLocaleString(),
      sub: `${stats.pendingListings} pending review`,
      icon: ShoppingBag, gradient: "bg-gradient-to-br from-amber-500 to-orange-700",
      trend: stats.pendingListings > 0 ? `${stats.pendingListings} pending` : "All clear",
      trendUp: stats.pendingListings === 0,
    },
    {
      label: "Active Subscriptions", value: stats.activeSubscriptions.toLocaleString(),
      sub: "Paid members on platform",
      icon: CreditCard, gradient: "bg-gradient-to-br from-emerald-500 to-teal-700",
      trend: "Active", trendUp: true,
    },
    {
      label: "Est. Monthly Revenue", value: `$${estimatedMRR.toLocaleString()}`,
      sub: `$${(estimatedMRR * 12).toLocaleString()} ARR estimate`,
      icon: DollarSign, gradient: "bg-gradient-to-br from-purple-600 to-violet-800",
      trend: "MRR", trendUp: true,
    },
  ] : [];

  return (
    <div className="max-w-[1200px] mx-auto space-y-7">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-slate-400 text-xs sm:text-sm font-medium flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" /> {today}
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            {getGreeting()}, Admin 👋
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">Here's what's happening on TaxCompPro today.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Link href="/marketplace/create"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#f0c040] text-[#0a1628] font-black text-xs sm:text-sm px-3.5 sm:px-4 py-2.5 rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-400/20 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Create Listing
          </Link>
          <Link href="/admin/payments"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-2.5 rounded-xl transition-all whitespace-nowrap">
            <CreditCard className="w-4 h-4" /> Payments
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {loading
          ? [1, 2, 3, 4].map(i => <SkeletonStat key={i} />)
          : statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

        {/* LEFT */}
        <div className="space-y-5">

          {/* Pending Approvals */}
          <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black text-white text-base">Pending Approvals</h2>
                <p className="text-slate-400 text-xs mt-0.5">Listings waiting for review</p>
              </div>
              <Link href="/admin/approvals"
                className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-slate-700/50 animate-pulse" />
                ))}
              </div>
            ) : stats?.recentPending.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-white font-bold text-sm">All caught up!</p>
                <p className="text-slate-400 text-xs mt-1">No listings waiting for review.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats?.recentPending.map(l => (
                  <div key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-700/40 hover:bg-slate-700/60 border border-white/5 rounded-xl p-3.5 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm truncate">{l.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {l.user.name}</span>
                          <span>·</span>
                          <span>{catLabels[l.category] ?? l.category}</span>
                          {l.price != null && <span>· ${l.price}</span>}
                          <span>· {timeAgo(l.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => updateStatus(l.id, "APPROVED")}
                        className="flex items-center gap-1 text-xs font-bold bg-emerald-500 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-400 transition-all">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => updateStatus(l.id, "REJECTED")}
                        className="flex items-center gap-1 text-xs font-bold bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-all">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Signups */}
          <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black text-white text-base">Recent Signups</h2>
                <p className="text-slate-400 text-xs mt-0.5">Latest members joining the platform</p>
              </div>
              <Link href="/admin/users"
                className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
                Manage All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-xl bg-slate-700/50 animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-1">
                {stats?.recentUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/40 transition-all group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {u.image
                        ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                        : <span className="text-white font-black text-sm">{u.name?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm truncate">{u.name}</div>
                      <div className="text-xs text-slate-400 truncate">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierColors[u.tier] ?? tierColors.FREE}`}>
                        {u.tier}
                      </span>
                      <span className="text-xs text-slate-500">{timeAgo(u.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">

          {/* Revenue Breakdown */}
          <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Revenue Breakdown</p>
            <div className="space-y-3">
              {[
                { tier: "MARKETPLACE_PLUS", label: "Plus",        price: 99,  color: "bg-emerald-400" },
                { tier: "MARKETPLACE",      label: "Marketplace", price: 49,  color: "bg-blue-400" },
                { tier: "VIP",              label: "VIP",         price: 29,  color: "bg-amber-400" },
                { tier: "FREE",             label: "Free",        price: 0,   color: "bg-slate-600" },
              ].map(({ tier, label, price, color }) => {
                const count = stats?.tierCounts?.find(t => t.tier === tier)?._count.tier ?? 0;
                const maxCount = stats?.totalUsers ?? 1;
                const pct = Math.round((count / Math.max(maxCount, 1)) * 100);
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 font-semibold">{label}</span>
                      <span className="text-slate-400">{count} users · ${(count * price).toLocaleString()}/mo</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-white/8 flex items-center justify-between">
              <span className="text-slate-400 text-xs">Est. MRR</span>
              <span className="text-white font-black text-lg">${estimatedMRR.toLocaleString()}</span>
            </div>
          </div>

          {/* Platform Stats */}
          <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Platform Stats</p>
            <div className="space-y-2">
              {[
                { label: "Pending Reviews",  value: stats?.pendingListings ?? 0,     urgent: (stats?.pendingListings ?? 0) > 0 },
                { label: "New Users (7d)",   value: stats?.newUsersWeek ?? 0,        urgent: false },
                { label: "Communities",      value: stats?.totalCommunities ?? 0,    urgent: false },
                { label: "New Communities",  value: stats?.newCommunitiesWeek ?? 0,  urgent: false },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-slate-400 text-sm">{r.label}</span>
                  <span className={`font-black text-sm ${r.urgent ? "text-amber-400" : "text-white"}`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Quick Actions</p>
            <div className="flex flex-col gap-2">
              <Link href="/admin/content-calendar"
                className="flex items-center gap-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all border border-blue-500/20">
                📅 Content Calendar
              </Link>
              <Link href="/marketplace/create"
                className="flex items-center gap-2 bg-[#f0c040] text-[#0a1628] font-black text-sm px-4 py-2.5 rounded-xl hover:bg-amber-400 transition-all">
                <Plus className="w-4 h-4" /> Create Featured Listing
              </Link>
              <Link href="/admin/payments"
                className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all border border-emerald-500/20">
                <CreditCard className="w-4 h-4" /> View Payments
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
