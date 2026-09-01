"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import NetworkBadge from "@/components/networks/NetworkBadge";
import {
  Search,
  Plus,
  Users,
  Sparkles,
  Shield,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Crown,
  BookOpen,
  MessageSquare,
  Radio,
  FileText,
  Loader2,
} from "lucide-react";

interface ProNetworkItem {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string;
  category: string;
  coverImage: string | null;
  logoImage: string | null;
  monthlyPrice: number;
  memberCount: number;
  followerCount: number;
  memberBenefits: string[];
  badgeShape: string;
  badgeInitials: string | null;
  badgeText: string;
  badgeIcon: string;
  badgeBgColor: string;
  badgeTextColor: string;
  badgeBorderColor: string;
  badgeCustomImage: string | null;
  isOwner: boolean;
  isMember: boolean;
  isFollowing: boolean;
  owner: {
    id: string;
    name: string;
    image: string | null;
    role: string;
    tier: string;
    headline: string | null;
    digitalCard?: { username: string } | null;
  };
  _count: {
    members: number;
    discussions: number;
    resources: number;
    media: number;
    events: number;
  };
}

const categories = [
  "All",
  "Tax Strategy",
  "Tax Office Growth",
  "Due Diligence",
  "CPA Practice",
  "Audit Defense",
  "Marketing & Growth",
  "Software & Systems",
];

export default function ProNetworksDirectoryPage() {
  const { data: session } = useSession();
  const [networks, setNetworks] = useState<ProNetworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "joined" | "mine" | "following">("all");

  useEffect(() => {
    fetchNetworks();
  }, [selectedCategory, activeFilter]);

  const fetchNetworks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.set("category", selectedCategory);
      if (activeFilter !== "all") params.set("filter", activeFilter);
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/pro-networks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNetworks(data.networks || []);
      }
    } catch (err) {
      console.error("Error loading pro networks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNetworks();
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] dark:bg-[#0c1527] pb-24">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0a1628] via-[#0f1d33] to-[#0a1628] text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Tax Compliance Pro — Pro Networks</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Build, Scale &amp; Monetize Your Private{" "}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              Professional Network
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            Join elite masterminds hosted by top CPAs and tax experts, or launch your own private
            membership network with zero platform commissions.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href="/pro-networks/create"
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#0a1628] font-black text-sm px-7 py-3.5 rounded-full shadow-xl hover:shadow-amber-500/25 transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create My Pro Network</span>
            </Link>

            <a
              href="#explore"
              className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm px-6 py-3.5 rounded-full transition-all backdrop-blur-md"
            >
              Explore Networks
            </a>
          </div>

          {/* Quick value badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-8 border-t border-white/10 text-xs text-slate-300 font-semibold">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>0% Platform Commission</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Custom Member Badges</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Private Feeds &amp; Vaults</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Radio className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Members-Only Pro Talks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main id="explore" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Navigation Tabs (My Networks Filter) */}
        {session?.user && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === "all"
                  ? "bg-[#0a1628] text-white dark:bg-amber-400 dark:text-[#0a1628] shadow-md"
                  : "bg-white dark:bg-[#172135] text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              🌐 Discover All Networks
            </button>
            <button
              onClick={() => setActiveFilter("joined")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === "joined"
                  ? "bg-[#0a1628] text-white dark:bg-amber-400 dark:text-[#0a1628] shadow-md"
                  : "bg-white dark:bg-[#172135] text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              ⭐ Networks I Joined
            </button>
            <button
              onClick={() => setActiveFilter("mine")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === "mine"
                  ? "bg-[#0a1628] text-white dark:bg-amber-400 dark:text-[#0a1628] shadow-md"
                  : "bg-white dark:bg-[#172135] text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              👑 Networks I Own
            </button>
            <button
              onClick={() => setActiveFilter("following")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === "following"
                  ? "bg-[#0a1628] text-white dark:bg-amber-400 dark:text-[#0a1628] shadow-md"
                  : "bg-white dark:bg-[#172135] text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              🔔 Following
            </button>
          </div>
        )}

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  selectedCategory === cat
                    ? "bg-amber-400 border-amber-400 text-[#0a1628] shadow-sm font-black"
                    : "bg-white dark:bg-[#172135] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pro networks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#172135] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </form>
        </div>

        {/* Networks Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-bold text-slate-500">Loading Pro Networks...</p>
          </div>
        ) : networks.length === 0 ? (
          <div className="bg-white dark:bg-[#172135] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-500 mx-auto flex items-center justify-center">
              <Crown className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              No Pro Networks Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {activeFilter === "mine"
                ? "You haven't created a Pro Network yet. Launch your own network and start building your private professional community."
                : "No professional networks match your current filter. Be the first to create one in this category!"}
            </p>
            <div className="pt-2">
              <Link
                href="/pro-networks/create"
                className="inline-flex items-center gap-2 bg-[#0a1628] dark:bg-amber-400 text-white dark:text-[#0a1628] font-black text-xs px-6 py-3 rounded-full hover:scale-105 transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" /> Create My Pro Network
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {networks.map((net) => (
              <div
                key={net.id}
                className="group bg-white dark:bg-[#172135] border border-slate-200 dark:border-slate-800 hover:border-amber-400/60 dark:hover:border-amber-400/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col"
              >
                {/* Network Banner */}
                <div className="relative h-40 bg-gradient-to-r from-slate-900 via-[#0a1628] to-slate-900 overflow-hidden">
                  {net.coverImage ? (
                    <img
                      src={net.coverImage}
                      alt={net.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#172b4d] to-[#0a1628]">
                      <span className="text-4xl font-black text-white/10 tracking-widest">
                        {net.name.slice(0, 3).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Category Pill */}
                  <div className="absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-md border border-white/15 text-amber-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                    {net.category}
                  </div>

                  {/* Price Tag */}
                  <div className="absolute top-3.5 right-3.5 bg-amber-400 text-[#0a1628] text-xs font-black px-3 py-1 rounded-full shadow-lg">
                    {net.monthlyPrice > 0 ? `$${net.monthlyPrice.toFixed(2)}/mo` : "FREE"}
                  </div>

                  {/* Custom Network Badge Preview */}
                  <div className="absolute bottom-3 left-3.5">
                    <NetworkBadge
                      shape={net.badgeShape}
                      initials={net.badgeInitials}
                      text={net.badgeText}
                      icon={net.badgeIcon}
                      bgColor={net.badgeBgColor}
                      textColor={net.badgeTextColor}
                      borderColor={net.badgeBorderColor}
                      customImage={net.badgeCustomImage}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Owner Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-amber-400/30 shrink-0">
                        {net.owner.image ? (
                          <img
                            src={net.owner.image}
                            alt={net.owner.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-xs text-slate-700 bg-amber-400/20">
                            {net.owner.name[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {net.owner.name}
                          </span>
                          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black px-1.5 py-0.2 rounded">
                            HOST
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {net.owner.headline || "Tax Professional & Network Owner"}
                        </p>
                      </div>
                    </div>

                    {/* Network Name & Tagline */}
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors line-clamp-1">
                        {net.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {net.tagline || net.description}
                      </p>
                    </div>

                    {/* Benefits Preview */}
                    {net.memberBenefits && net.memberBenefits.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {net.memberBenefits.slice(0, 3).map((benefit, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg truncate max-w-full"
                          >
                            ✓ {benefit}
                          </span>
                        ))}
                        {net.memberBenefits.length > 3 && (
                          <span className="text-[10px] font-bold text-slate-400 self-center">
                            +{net.memberBenefits.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <Users className="w-4 h-4 text-amber-500" />
                      <span>{net.memberCount.toLocaleString()} Members</span>
                    </div>

                    <Link
                      href={`/pro-networks/${net.slug}`}
                      className={`inline-flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm ${
                        net.isMember || net.isOwner
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                          : "bg-[#0a1628] dark:bg-amber-400 text-white dark:text-[#0a1628] hover:scale-105 active:scale-95"
                      }`}
                    >
                      <span>{net.isMember || net.isOwner ? "Open Network" : "View Network"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
