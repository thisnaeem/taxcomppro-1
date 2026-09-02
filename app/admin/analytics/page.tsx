"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, ShoppingBag, MessageSquare, DollarSign, TrendingUp, Crown } from "lucide-react";

interface Stats {
  totalUsers: number;
  newUsersWeek: number;
  totalListings: number;
  pendingListings: number;
  totalCommunities: number;
  newCommunitiesWeek: number;
  activeSubscriptions: number;
  tierCounts: { tier: string; _count: { tier: number } }[];
}

const tierColors: Record<string, string> = {
  FREE: "bg-slate-500",
  VIP: "bg-[#f0c040]",
  MARKETPLACE: "bg-indigo-400",
  MARKETPLACE_PLUS: "bg-emerald-400",
};
const tierLabels: Record<string, string> = {
  FREE: "Free",
  VIP: "VIP",
  MARKETPLACE: "Marketplace",
  MARKETPLACE_PLUS: "Plus",
};

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalTierUsers = stats?.tierCounts.reduce((a, t) => a + t._count.tier, 0) ?? 1;

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-0.5">Platform-wide metrics and growth overview</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                label: "Total Users",
                value: stats?.totalUsers ?? 0,
                sub: `+${stats?.newUsersWeek ?? 0} this week`,
                icon: Users,
                color: "text-blue-400 bg-blue-500/15 border-blue-500/20",
              },
              {
                label: "Total Listings",
                value: stats?.totalListings ?? 0,
                sub: `${stats?.pendingListings ?? 0} pending`,
                icon: ShoppingBag,
                color: "text-amber-400 bg-amber-500/15 border-amber-500/20",
              },
              {
                label: "Communities",
                value: stats?.totalCommunities ?? 0,
                sub: `+${stats?.newCommunitiesWeek ?? 0} new`,
                icon: MessageSquare,
                color: "text-purple-400 bg-purple-500/15 border-purple-500/20",
              },
              {
                label: "Active Subs",
                value: stats?.activeSubscriptions ?? 0,
                sub: "paying subscribers",
                icon: DollarSign,
                color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/20",
              },
            ].map((s) => (
              <div key={s.label} className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-white">{s.value.toLocaleString()}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                <div className="text-xs text-emerald-400 font-semibold mt-2">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tier distribution */}
            <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-5">
                <Crown className="w-4 h-4 text-amber-400" />
                <h2 className="font-bold text-white">User Tier Distribution</h2>
              </div>
              <div className="space-y-4">
                {stats?.tierCounts
                  .sort((a, b) => b._count.tier - a._count.tier)
                  .map((t) => {
                    const pct = Math.round((t._count.tier / totalTierUsers) * 100);
                    return (
                      <div key={t.tier}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-slate-300">
                            {tierLabels[t.tier] ?? t.tier}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {t._count.tier.toLocaleString()}{" "}
                            <span className="text-slate-400 font-normal text-xs">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full rounded-full transition-all ${
                              tierColors[t.tier] ?? "bg-slate-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Growth summary */}
            <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h2 className="font-bold text-white">This Week's Growth</h2>
              </div>
              <div className="space-y-4">
                {[
                  {
                    label: "New Users",
                    value: stats?.newUsersWeek ?? 0,
                    total: stats?.totalUsers ?? 0,
                    unit: "users",
                  },
                  {
                    label: "New Communities",
                    value: stats?.newCommunitiesWeek ?? 0,
                    total: stats?.totalCommunities ?? 0,
                    unit: "communities",
                  },
                  {
                    label: "Pending Listings",
                    value: stats?.pendingListings ?? 0,
                    total: stats?.totalListings ?? 0,
                    unit: "listings need review",
                  },
                ].map((g) => (
                  <div key={g.label} className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-white/5 rounded-xl">
                    <div>
                      <div className="text-sm font-bold text-white">{g.label}</div>
                      <div className="text-xs text-slate-400">{g.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-amber-400">+{g.value}</div>
                      <div className="text-[11px] text-slate-400">{g.total} total</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
