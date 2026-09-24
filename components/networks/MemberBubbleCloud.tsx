"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Crown,
  ShieldCheck,
  MapPin,
  MessageCircle,
  ExternalLink,
  UserPlus,
  Sparkles,
  Search,
  X,
} from "lucide-react";

export interface NetworkMemberItem {
  id: string;
  role: string;
  status?: string;
  joinedAt?: string | Date;
  user: {
    id: string;
    name: string;
    image: string | null;
    role: string;
    tier?: string;
    headline?: string | null;
    professionalTitle?: string | null;
    location?: string | null;
    digitalCard?: {
      username: string;
    } | null;
  };
}

interface MemberBubbleCloudProps {
  members: NetworkMemberItem[];
  networkName: string;
  isOwner?: boolean;
  onInviteClick?: () => void;
}

// Deterministic sizing helper
function getBubbleSize(role: string, index: number, total: number) {
  const isOwner = role.toUpperCase() === "OWNER";
  if (isOwner) {
    return {
      sizeClass: "w-24 h-24 sm:w-28 sm:h-28",
      ringClass: "ring-4 ring-amber-400 shadow-xl shadow-amber-400/25",
    };
  }

  // Vary sizes deterministically across 4 tiers
  const cycle = index % 4;
  if (total <= 3 || cycle === 0) {
    return {
      sizeClass: "w-20 h-20 sm:w-22 sm:h-22",
      ringClass: "ring-3 ring-blue-400 shadow-lg shadow-blue-400/20",
    };
  } else if (cycle === 1) {
    return {
      sizeClass: "w-16 h-16 sm:w-18 sm:h-18",
      ringClass: "ring-2 ring-emerald-400 shadow-md shadow-emerald-400/15",
    };
  } else if (cycle === 2) {
    return {
      sizeClass: "w-14 h-14 sm:w-16 sm:h-16",
      ringClass: "ring-2 ring-purple-400 shadow-md shadow-purple-400/15",
    };
  } else {
    return {
      sizeClass: "w-12 h-12 sm:w-14 sm:h-14",
      ringClass: "ring-2 ring-slate-300 dark:ring-white/20 shadow-sm",
    };
  }
}

export default function MemberBubbleCloud({
  members,
  networkName,
  isOwner = false,
  onInviteClick,
}: MemberBubbleCloudProps) {
  const [hoveredMember, setHoveredMember] = useState<NetworkMemberItem | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "OWNER" | "MEMBER">("ALL");

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        !searchFilter ||
        m.user.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (m.user.professionalTitle?.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (m.user.headline && m.user.headline.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (m.user.location && m.user.location.toLowerCase().includes(searchFilter.toLowerCase()));

      const isOwnerRole = m.role.toUpperCase() === "OWNER";

      let matchesRole = true;
      if (roleFilter === "OWNER") matchesRole = isOwnerRole;
      if (roleFilter === "MEMBER") matchesRole = !isOwnerRole;

      return matchesSearch && matchesRole;
    });
  }, [members, searchFilter, roleFilter]);

  const handleMouseEnterBubble = (
    m: NetworkMemberItem,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parent = e.currentTarget.closest(".bubble-cloud-container")?.getBoundingClientRect();

    if (parent) {
      setPopoverPos({
        x: rect.left - parent.left + rect.width / 2,
        y: rect.top - parent.top,
      });
    }
    setHoveredMember(m);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-200 dark:border-white/10">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Find a member in the network..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 text-xs font-bold text-slate-800 dark:text-white placeholder:font-medium placeholder:text-slate-400"
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role Filters & Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="inline-flex rounded-xl p-0.5 bg-slate-200/70 dark:bg-white/10 text-[11px] font-bold">
            {(["ALL", "OWNER", "MEMBER"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  roleFilter === r
                    ? "bg-white dark:bg-[#0a1628] text-slate-900 dark:text-amber-400 font-black shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {r === "ALL" ? `All (${members.length})` : r === "OWNER" ? "Owner" : "Members"}
              </button>
            ))}
          </div>

          {onInviteClick && (
            <button
              type="button"
              onClick={onInviteClick}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Members</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Bubble Constellation Canvas */}
      <div
        className="bubble-cloud-container relative min-h-[420px] sm:min-h-[460px] rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 bg-gradient-to-b from-slate-900 via-[#0c182b] to-[#070e1a] p-6 sm:p-10 flex flex-col justify-center items-center shadow-inner select-none"
        onMouseLeave={() => setHoveredMember(null)}
      >
        {/* Subtle Ambient Background Lighting & Constellation Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
          <svg className="w-full h-full stroke-white/5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="bubble-grid" width="36" height="36" patternUnits="userSpaceOnUse">
                <circle cx="18" cy="18" r="1" fill="rgba(255,255,255,0.08)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bubble-grid)" />
          </svg>
        </div>

        {/* Center Constellation Title Tag */}
        <div className="absolute top-4 left-6 z-10 flex items-center gap-2 text-white/50 text-[11px] font-bold uppercase tracking-widest pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Interactive Member Galaxy • Hover to View Profile</span>
        </div>

        {/* Dynamic Bubble Cluster */}
        <div className="relative z-10 w-full max-w-4xl flex flex-wrap items-center justify-center gap-5 sm:gap-7 py-8">
          {filteredMembers.map((m, idx) => {
            const isOwnerMember = m.role.toUpperCase() === "OWNER";
            const { sizeClass, ringClass } = getBubbleSize(m.role, idx, filteredMembers.length);
            const isHovered = hoveredMember?.id === m.id;

            // Organic float animation duration and delay
            const floatDelay = `${(idx * 0.45) % 3}s`;
            const floatDuration = `${4 + (idx % 3) * 0.7}s`;

            return (
              <div
                key={m.id}
                onMouseEnter={(e) => handleMouseEnterBubble(m, e)}
                className="relative group cursor-pointer transition-all duration-300"
                style={{
                  animation: `bubbleFloat ${floatDuration} ease-in-out infinite alternate`,
                  animationDelay: floatDelay,
                }}
              >
                {/* Bubble Circle Avatar */}
                <div
                  className={`relative rounded-full overflow-hidden transition-all duration-300 bg-slate-800 ${sizeClass} ${ringClass} ${
                    isHovered
                      ? "scale-115 -translate-y-2 ring-amber-400 shadow-2xl z-30 ring-4"
                      : "hover:scale-108 hover:-translate-y-1 hover:z-20"
                  }`}
                >
                  {m.user.image ? (
                    <img
                      src={m.user.image}
                      alt={m.user.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-amber-300 bg-gradient-to-br from-amber-500/20 via-slate-800 to-[#0a1628] text-base sm:text-lg">
                      {m.user.name ? m.user.name.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}

                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                  {/* Active / Online Pulsing Indicator */}
                  <span className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900 shadow-xs" />

                  {/* Crown Icon badge for Owner */}
                  {isOwnerMember ? (
                    <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-400 text-[#0a1628] flex items-center justify-center shadow-md font-black">
                      <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                    </span>
                  ) : m.user.tier === "VERIFIED_PRO" || m.user.role === "PRO" ? (
                    <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
                      <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </span>
                  ) : null}
                </div>

                {/* Subtitle Name Badge under Bubble */}
                <div className="text-center mt-1.5 pointer-events-none">
                  <div className="text-[11px] font-black text-white/90 truncate max-w-[80px] sm:max-w-[100px] mx-auto drop-shadow-md">
                    {m.user.name.split(" ")[0]}
                  </div>
                  {isOwnerMember && (
                    <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
                      Host
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Interactive "+ Invite Member" Bubble */}
          {onInviteClick && (
            <div
              onClick={onInviteClick}
              className="cursor-pointer group flex flex-col items-center justify-center transition-all duration-300 hover:scale-105"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-amber-400/40 hover:border-amber-400 bg-amber-400/5 hover:bg-amber-400/15 transition-all flex flex-col items-center justify-center text-amber-300 shadow-md">
                <UserPlus className="w-5 h-5 text-amber-400 transition-transform duration-300 group-hover:scale-110" />
                <span className="text-[10px] font-black mt-1 text-amber-300">+ Invite</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 mt-1.5 text-center">
                Grow Network
              </div>
            </div>
          )}
        </div>

        {/* Empty Search State */}
        {filteredMembers.length === 0 && (
          <div className="text-center py-12 relative z-10 text-white/70 space-y-2">
            <p className="text-sm font-bold">No members matching &quot;{searchFilter}&quot;</p>
            <button
              type="button"
              onClick={() => {
                setSearchFilter("");
                setRoleFilter("ALL");
              }}
              className="text-xs font-black text-amber-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* ── RICH HOVER PROFILE POPOVER CARD ── */}
        {hoveredMember && popoverPos && (
          <div
            className="absolute z-50 pointer-events-auto transition-all duration-200"
            style={{
              left: `${popoverPos.x}px`,
              top: `${Math.max(16, popoverPos.y - 210)}px`,
              transform: "translateX(-50%)",
            }}
            onMouseEnter={() => setHoveredMember(hoveredMember)}
            onMouseLeave={() => setHoveredMember(null)}
          >
            <div className="w-72 sm:w-80 bg-white/95 dark:bg-[#0f1b2e]/95 backdrop-blur-xl border border-amber-400/40 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 text-slate-900 dark:text-white">
              {/* Header Avatar & Role Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-amber-400/40 bg-slate-800 shrink-0">
                    {hoveredMember.user.image ? (
                      <img
                        src={hoveredMember.user.image}
                        alt={hoveredMember.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-amber-300 text-lg">
                        {hoveredMember.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                      <span>{hoveredMember.user.name}</span>
                      {hoveredMember.role.toUpperCase() === "OWNER" && (
                        <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                      )}
                    </h4>
                    <span
                      className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full mt-0.5 ${
                        hoveredMember.role.toUpperCase() === "OWNER"
                          ? "bg-amber-400/20 text-amber-700 dark:text-amber-300"
                          : "bg-blue-500/20 text-blue-600 dark:text-blue-300"
                      }`}
                    >
                      {hoveredMember.role.toUpperCase() === "OWNER"
                        ? "Network Host & Owner"
                        : hoveredMember.role}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHoveredMember(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bio / Headline */}
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                  {hoveredMember.user.professionalTitle || hoveredMember.user.headline ||
                    (hoveredMember.role.toUpperCase() === "OWNER"
                      ? `Host and creator of ${networkName}.`
                      : "Verified Member of this private Pro Network.")}
                </p>

                {hoveredMember.user.location && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 pt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{hoveredMember.user.location}</span>
                  </div>
                )}
              </div>

              {/* Quick Actions inside Popover */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center gap-2">
                <Link
                  href={`/messages?userId=${hoveredMember.user.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Message</span>
                </Link>

                <Link
                  href={
                    hoveredMember.user.digitalCard?.username
                      ? `/u/${hoveredMember.user.digitalCard.username}`
                      : `/find-a-pro/${hoveredMember.user.id}`
                  }
                  className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white font-black text-xs transition-all"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

