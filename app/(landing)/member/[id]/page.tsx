"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import {
  Loader2,
  Globe,
  ExternalLink,
  MapPin,
  Briefcase,
  MessageSquare,
  UserPlus,
  UserCheck,
  BadgeCheck,
  ChevronLeft,
  Share2,
  Copy,
  Check,
  Crown,
  ShieldCheck,
  Calendar,
  Star,
  Clock,
  BookOpen,
  ShoppingBag,
  X,
  Heart,
  Award,
  ChevronRight,
  Sparkles,
  Users,
  Eye,
} from "lucide-react";
import { VoiceMemoPlayer } from "@/components/profile/VoiceMemo";
import DueDiligenceBadge from "@/components/badges/DueDiligenceBadge";
import FeedVideoPlayer from "@/components/feed/FeedVideoPlayer";

interface CourseItem {
  id: string;
  slug: string;
  title: string;
  thumbnail: string | null;
  level: string;
  price: number;
  isFree: boolean;
}

interface ListingItem {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  price: number | null;
  category: string;
  images: string[];
}

interface ServiceItem {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  emoji: string;
}

interface ReviewItem {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    image: string | null;
    headline: string | null;
  };
}

interface PostItem {
  id: string;
  content: string;
  images: string[];
  videoUrl: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

interface PublicUser {
  id: string;
  name: string;
  image: string | null;
  coverImage: string | null;
  headline: string | null;
  bio: string | null;
  mission: string | null;
  location: string | null;
  yearsExperience: number | null;
  website: string | null;
  linkedIn: string | null;
  twitter: string | null;
  facebook: string | null;
  specialties: string[];
  certifications: string[];
  languages: string[];
  mediaPhotos: string[];
  voiceMemoUrl: string | null;
  role: string;
  tier: string;
  createdAt: string;
  connectionCount: number;
  hasDueDiligenceBadge: boolean;
  instructorCourses: CourseItem[];
  listings: ListingItem[];
  proServices?: ServiceItem[];
  reviewsReceived?: ReviewItem[];
  posts?: PostItem[];
  _count?: {
    posts: number;
    instructorCourses: number;
    listings: number;
    reviewsReceived: number;
  };
}

const TIER_CONFIG: Record<
  string,
  { label: string; badgeCls: string; ringCls: string; glowCls: string; iconColor: string }
> = {
  FREE: {
    label: "Member",
    badgeCls: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    ringCls: "ring-slate-400/20",
    glowCls: "from-slate-500/10 to-slate-600/5",
    iconColor: "text-slate-500",
  },
  VIP: {
    label: "VIP Member",
    badgeCls: "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/40 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/60 shadow-xs",
    ringCls: "ring-amber-500/40 shadow-amber-500/10",
    glowCls: "from-amber-500/15 to-yellow-500/5",
    iconColor: "text-amber-500",
  },
  MARKETPLACE: {
    label: "Marketplace Pro",
    badgeCls: "bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-700/60 shadow-xs",
    ringCls: "ring-indigo-500/40 shadow-indigo-500/10",
    glowCls: "from-indigo-500/15 to-blue-500/5",
    iconColor: "text-indigo-500",
  },
  MARKETPLACE_PLUS: {
    label: "Marketplace Plus",
    badgeCls: "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/60 shadow-xs",
    ringCls: "ring-emerald-500/40 shadow-emerald-500/10",
    glowCls: "from-emerald-500/15 to-teal-500/5",
    iconColor: "text-emerald-500",
  },
};

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  INTERMEDIATE: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  ADVANCED: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
};

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const me = useAppSelector((s) => s.auth.user);

  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [connState, setConnState] = useState<"idle" | "pending" | "connected" | "sending">("idle");
  const [activeTab, setActiveTab] = useState<"overview" | "posts" | "services" | "courses" | "reviews">("overview");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!id) return;
    if (me?.id === id) {
      router.replace("/profile");
      return;
    }
    fetch(`/api/user/${id}`)
      .then((r) => {
        if (r.status === 404) {
          setIsNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) {
          setProfile({
            ...d,
            specialties: d.specialties ?? [],
            certifications: d.certifications ?? [],
            languages: d.languages ?? [],
            mediaPhotos: d.mediaPhotos ?? [],
            instructorCourses: d.instructorCourses ?? [],
            listings: d.listings ?? [],
            proServices: d.proServices ?? [],
            reviewsReceived: d.reviewsReceived ?? [],
            posts: d.posts ?? [],
          });
        }
      })
      .catch(() => setIsNotFound(true))
      .finally(() => setLoading(false));
  }, [id, me, router]);

  // Check connection status
  useEffect(() => {
    if (!me || !id || me.id === id) return;
    fetch("/api/connections")
      .then((r) => r.json())
      .then((data: { id: string; status: string; requesterId: string; receiverId: string }[]) => {
        if (!Array.isArray(data)) return;
        const match = data.find(
          (c) =>
            (c.requesterId === me.id && c.receiverId === id) ||
            (c.receiverId === me.id && c.requesterId === id)
        );
        if (!match) return;
        if (match.status === "ACCEPTED") setConnState("connected");
        else if (match.status === "PENDING") setConnState("pending");
      })
      .catch(() => {});
  }, [me, id]);

  const sendConnect = async () => {
    if (!me || connState !== "idle") return;
    setConnState("sending");
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: id }),
      });
      if (res.ok) setConnState("pending");
      else setConnState("idle");
    } catch {
      setConnState("idle");
    }
  };

  const handleCopyShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
        <p className="text-sm font-semibold text-slate-400 tracking-wide">Loading member profile...</p>
      </div>
    );
  }

  if (isNotFound || !profile) {
    notFound();
  }

  const tierInfo = TIER_CONFIG[profile.tier] ?? TIER_CONFIG["FREE"];
  const isPro = profile.role === "PROFESSIONAL";
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Recently";

  const totalPosts = profile._count?.posts ?? profile.posts?.length ?? 0;
  const totalServices = (profile.proServices?.length ?? 0) + (profile.listings?.length ?? 0);
  const totalCourses = profile.instructorCourses?.length ?? 0;
  const totalReviews = profile.reviewsReceived?.length ?? 0;

  const avgRating =
    profile.reviewsReceived && profile.reviewsReceived.length > 0
      ? (
          profile.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
          profile.reviewsReceived.length
        ).toFixed(1)
      : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c1527] transition-colors duration-200">
      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImg}
            alt="Enlarged media"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

      {/* ── HERO BANNER ──────────────────────────────────────────────────────── */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-[#0a1628] via-[#112340] to-[#1c3a6b] overflow-hidden">
        {/* Cover Photo */}
        {profile.coverImage ? (
          <img
            src={profile.coverImage}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity"
          />
        ) : null}

        {/* Geometric Dot Grid Texture */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1.2px, transparent 1.2px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Ambient Gradient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Controls Bar */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-5 flex items-center justify-between">
          <button
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/marketplace"))}
            className="flex items-center gap-2 text-white/90 hover:text-white text-xs sm:text-sm font-bold bg-black/30 hover:bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/15 transition-all shadow-md active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-2">
            {/* Share Profile Button */}
            <button
              onClick={handleCopyShare}
              className="flex items-center gap-1.5 text-white/90 hover:text-white text-xs sm:text-sm font-bold bg-black/30 hover:bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/15 transition-all shadow-md active:scale-95"
              title="Copy public profile link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>

            {/* Top Tier Pill */}
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border backdrop-blur-md ${tierInfo.badgeCls}`}
            >
              <Crown className="w-3.5 h-3.5" />
              {tierInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── PROFILE CONTAINER ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        {/* ── ELEVATED IDENTITY CARD ─────────────────────────────────────────── */}
        <div className="relative z-20 -mt-20 sm:-mt-24 rounded-3xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 shadow-xl p-6 sm:p-8 mb-6 transition-colors">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Left: Avatar & Personal Info */}
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start sm:items-center w-full lg:w-auto">
              {/* Avatar Frame */}
              <div className="relative shrink-0 -mt-10 sm:-mt-12 group self-start sm:self-center">
                <div
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl border-4 border-white dark:border-[#172135] bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] shadow-2xl overflow-hidden ring-4 ${tierInfo.ringCls} flex items-center justify-center`}
                >
                  {profile.image ? (
                    <img
                      src={profile.image}
                      alt={profile.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-white font-black text-4xl sm:text-5xl">
                      {(profile.name || "?")[0]?.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Role / Verified Badge overlay on Avatar */}
                {profile.hasDueDiligenceBadge ? (
                  <div
                    className="absolute -bottom-2 -right-2 bg-white dark:bg-[#172135] rounded-full p-1 shadow-md border-2 border-amber-400"
                    title="Due Diligence Award Verified"
                  >
                    <DueDiligenceBadge size={22} showTooltip={false} />
                  </div>
                ) : isPro ? (
                  <div className="absolute -bottom-1.5 -right-1.5 bg-blue-500 text-white rounded-full p-1.5 shadow-md border-2 border-white dark:border-[#172135]">
                    <BadgeCheck className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#172135]" />
                )}
              </div>

              {/* Text & Badges */}
              <div className="space-y-1.5 min-w-0 flex-1">
                {/* Name & Badges Row */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white tracking-tight">
                    {profile.name}
                  </h1>

                  {/* Pro Badge */}
                  {isPro && (
                    <span className="inline-flex items-center gap-1 text-xs font-black bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/40 px-2.5 py-0.5 rounded-full">
                      <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                      Verified Pro
                    </span>
                  )}

                  {/* Due Diligence Badge */}
                  {profile.hasDueDiligenceBadge && (
                    <span className="inline-flex items-center gap-1 text-xs font-black bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 px-2.5 py-0.5 rounded-full">
                      <DueDiligenceBadge size={16} showTooltip={false} />
                      Due Diligence Verified
                    </span>
                  )}

                  {/* Tier Badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${tierInfo.badgeCls}`}
                  >
                    <Crown className="w-3 h-3" />
                    {tierInfo.label}
                  </span>
                </div>

                {/* Headline */}
                <p className="text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base leading-snug">
                  {profile.headline || (isPro ? "Verified Tax & Compliance Professional" : "Active Community Member")}
                </p>

                {/* Metadata Chips */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">
                  {profile.location && (
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-[#1E56A0] dark:text-[#60a5fa]" />
                      {profile.location}
                    </span>
                  )}
                  {profile.yearsExperience && (
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Briefcase className="w-3.5 h-3.5 text-[#1E56A0] dark:text-[#60a5fa]" />
                      {profile.yearsExperience}+ years experience
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Member since {memberSince}
                  </span>
                  {avgRating && (
                    <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {avgRating} ({profile.reviewsReceived?.length} reviews)
                    </span>
                  )}
                </div>

                {/* Social Links Chips */}
                {(profile.website || profile.linkedIn || profile.twitter || profile.facebook) && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#1E56A0] dark:hover:text-[#60a5fa] bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" /> Website
                      </a>
                    )}
                    {profile.linkedIn && (
                      <a
                        href={profile.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> LinkedIn
                      </a>
                    )}
                    {profile.twitter && (
                      <a
                        href={profile.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> X/Twitter
                      </a>
                    )}
                    {profile.facebook && (
                      <a
                        href={profile.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Facebook
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
              {me && me.id !== profile.id ? (
                <>
                  <Link
                    href={`/messages?user=${profile.id}`}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0a1628] hover:bg-[#1a3a6b] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                  </Link>

                  <button
                    onClick={sendConnect}
                    disabled={connState !== "idle"}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border-2 transition-all active:scale-[0.98] ${
                      connState === "connected"
                        ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 cursor-default"
                        : connState === "pending"
                        ? "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default"
                        : "border-[#0a1628] dark:border-slate-700 text-[#0a1628] dark:text-white bg-white dark:bg-slate-800 hover:bg-[#0a1628] hover:text-white dark:hover:bg-slate-700 shadow-sm"
                    }`}
                  >
                    {connState === "sending" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : connState === "connected" ? (
                      <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : connState === "pending" ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    {connState === "connected"
                      ? "Connected"
                      : connState === "pending"
                      ? "Request Sent"
                      : "Connect"}
                  </button>
                </>
              ) : me && me.id === profile.id ? (
                <Link
                  href="/profile"
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1E56A0] hover:bg-[#16437E] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                >
                  Edit Profile
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0a1628] hover:bg-[#1a3a6b] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                >
                  <UserPlus className="w-4 h-4" /> Connect with {profile.name.split(" ")[0]}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── QUICK STATS RIBBON ────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 p-4 sm:p-5 shadow-xs mb-8 transition-colors">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80 gap-y-4">
            {/* 1. MEMBERSHIP */}
            <div className="flex items-center gap-3.5 px-3 sm:first:pl-2">
              <div className="w-11 h-11 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <Crown className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-[#0a1628] dark:text-white leading-tight truncate">
                  {tierInfo.label.toUpperCase()}
                </p>
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
                  MEMBERSHIP
                </p>
              </div>
            </div>

            {/* 2. CONNECTIONS */}
            <div className="flex items-center gap-3.5 px-3 sm:pl-4">
              <div className="w-11 h-11 rounded-full border border-blue-500/25 bg-blue-500/10 text-[#1E56A0] dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-black text-[#0a1628] dark:text-white leading-tight tracking-tight">
                  {(profile.connectionCount ?? 0).toLocaleString()}
                </p>
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
                  CONNECTIONS
                </p>
              </div>
            </div>

            {/* 3. POSTS */}
            <div className="flex items-center gap-3.5 px-3 sm:pl-4">
              <div className="w-11 h-11 rounded-full border border-purple-500/25 bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-black text-[#0a1628] dark:text-white leading-tight tracking-tight">
                  {totalPosts.toLocaleString()}
                </p>
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
                  COMMUNITY POSTS
                </p>
              </div>
            </div>

            {/* 4. DUE DILIGENCE */}
            <div className="flex items-center gap-3.5 px-3 sm:pl-4">
              <div className="w-11 h-11 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-[#0a1628] dark:text-white leading-tight truncate">
                  {profile.hasDueDiligenceBadge ? "VERIFIED" : "STANDARD"}
                </p>
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
                  DUE DILIGENCE
                </p>
              </div>
            </div>

            {/* 5. MEMBER SINCE */}
            <div className="flex items-center gap-3.5 px-3 sm:pl-4 sm:last:pr-2">
              <div className="w-11 h-11 rounded-full border border-slate-500/25 bg-slate-500/10 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-[#0a1628] dark:text-white leading-tight truncate">
                  {memberSince}
                </p>
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
                  MEMBER SINCE
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── NAVIGATION TABS ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-8 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm tracking-normal transition-all shrink-0 ${
              activeTab === "overview"
                ? "bg-[#0a1628] text-white dark:bg-white dark:text-[#0a1628] shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-[#0a1628] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <Sparkles className="w-4 h-4" /> Overview
          </button>

          <button
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm tracking-normal transition-all shrink-0 ${
              activeTab === "posts"
                ? "bg-[#0a1628] text-white dark:bg-white dark:text-[#0a1628] shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-[#0a1628] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Community Activity
            {totalPosts > 0 && (
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {totalPosts}
              </span>
            )}
          </button>

          {totalServices > 0 && (
            <button
              onClick={() => setActiveTab("services")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm tracking-normal transition-all shrink-0 ${
                activeTab === "services"
                  ? "bg-[#0a1628] text-white dark:bg-white dark:text-[#0a1628] shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-[#0a1628] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> Services &amp; Listings
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {totalServices}
              </span>
            </button>
          )}

          {totalCourses > 0 && (
            <button
              onClick={() => setActiveTab("courses")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm tracking-normal transition-all shrink-0 ${
                activeTab === "courses"
                  ? "bg-[#0a1628] text-white dark:bg-white dark:text-[#0a1628] shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-[#0a1628] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <BookOpen className="w-4 h-4" /> Courses
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {totalCourses}
              </span>
            </button>
          )}

          {totalReviews > 0 && (
            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm tracking-normal transition-all shrink-0 ${
                activeTab === "reviews"
                  ? "bg-[#0a1628] text-white dark:bg-white dark:text-[#0a1628] shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-[#0a1628] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Star className="w-4 h-4" /> Reviews
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {totalReviews}
              </span>
            </button>
          )}
        </div>

        {/* ── TAB CONTENT: OVERVIEW ──────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Main (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Voice Memo Intro Player */}
              {profile.voiceMemoUrl && (
                <div className="rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs">
                  <VoiceMemoPlayer url={profile.voiceMemoUrl} name={profile.name} />
                </div>
              )}

              {/* About Section */}
              <div className="rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-xs font-black text-[#0a1628] dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#1E56A0] rounded-full" />
                    About {profile.name.split(" ")[0]}
                  </h3>
                </div>

                {profile.bio ? (
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {profile.bio}
                  </p>
                ) : (
                  /* Welcoming Fallback Card */
                  <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/60 dark:to-[#172135] border border-slate-200/80 dark:border-slate-700/60 p-5 sm:p-6 space-y-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#1E56A0]/10 text-[#1E56A0] dark:text-[#60a5fa] flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#0a1628] dark:text-white">
                          Welcome to {profile.name}&apos;s Community Profile
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {profile.name} is an active {tierInfo.label} in the Tax Compliance Pro network
                          {profile.location ? ` based in ${profile.location}` : ""}. Connect or message to
                          collaborate, share tax defense strategies, and exchange client referrals.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mission Quote Card */}
              {profile.mission && (
                <div className="relative rounded-2xl bg-gradient-to-br from-[#0a1628] via-[#122340] to-[#1a3a6b] p-6 sm:p-7 text-white shadow-md overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Sparkles className="w-24 h-24" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                    PROFESSIONAL MISSION
                  </span>
                  <p className="text-base sm:text-lg font-semibold leading-relaxed italic mt-2 text-white/95">
                    &ldquo;{profile.mission}&rdquo;
                  </p>
                </div>
              )}

              {/* Recent Community Activity Preview */}
              {profile.posts && profile.posts.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 p-6 sm:p-7 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-xs font-black text-[#0a1628] dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-purple-500 rounded-full" />
                      Recent Community Activity
                    </h3>
                    <button
                      onClick={() => setActiveTab("posts")}
                      className="text-xs font-bold text-[#1E56A0] dark:text-[#60a5fa] hover:underline flex items-center gap-1"
                    >
                      View all ({profile.posts.length}) <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {profile.posts.slice(0, 2).map((post) => (
                      <div
                        key={post.id}
                        className="p-4 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#0a1628] shrink-0">
                              {profile.image ? (
                                <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white text-xs font-bold flex items-center justify-center w-full h-full">
                                  {profile.name[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#0a1628] dark:text-white">{profile.name}</p>
                              <p className="text-[10px] text-slate-400">{timeAgo(post.createdAt)}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            Post
                          </span>
                        </div>

                        {post.content && (
                          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                            {post.content}
                          </p>
                        )}

                        {/* Video Player */}
                        {post.videoUrl && (
                          <div className="rounded-xl overflow-hidden shadow-sm">
                            <FeedVideoPlayer src={post.videoUrl} className="w-full max-h-96" />
                          </div>
                        )}

                        {/* Photo gallery */}
                        {post.images && post.images.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {post.images.map((img, i) => (
                              <button
                                key={i}
                                onClick={() => setLightboxImg(img)}
                                className="relative rounded-lg overflow-hidden group/img aspect-video bg-black/10"
                              >
                                <img
                                  src={img}
                                  alt="Post attachment"
                                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                                />
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                            {post.likeCount} likes
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                            {post.commentCount} comments
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Due Diligence Verified Card */}
              {profile.hasDueDiligenceBadge ? (
                <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-300/80 dark:border-amber-700/60 p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <DueDiligenceBadge size={32} showTooltip={false} />
                    <div>
                      <h4 className="text-sm font-black text-[#0a1628] dark:text-white">
                        Due Diligence Verified
                      </h4>
                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        Course Completion &amp; Toolkit Certified
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    This member has completed verified training or acquired official IRS practice toolkits on Tax
                    Compliance Pro.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#1E56A0] dark:text-[#60a5fa]" />
                    <h4 className="text-sm font-black text-[#0a1628] dark:text-white">
                      Verified Community Member
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Active registered member of Tax Compliance Pro with direct messaging and network collaboration access.
                  </p>
                </div>
              )}

              {/* Specialties */}
              {profile.specialties?.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-black text-[#0a1628] dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#1E56A0] rounded-full" />
                    Specialties
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile.specialties.map((s) => (
                      <span
                        key={s}
                        className="text-xs font-semibold bg-[#1E56A0]/10 text-[#1E56A0] dark:text-blue-300 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl border border-[#1E56A0]/15"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Credentials & Certifications */}
              {profile.certifications?.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-black text-[#0a1628] dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-amber-400 rounded-full" />
                    Certifications &amp; Licenses
                  </h3>
                  <ul className="space-y-2 pt-1">
                    {profile.certifications.map((c) => (
                      <li
                        key={c}
                        className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                      >
                        <Award className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Languages */}
              {profile.languages?.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-black text-[#0a1628] dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-500" />
                    Languages Spoken
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile.languages.map((l) => (
                      <span
                        key={l}
                        className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Media & Photos Gallery */}
              {profile.mediaPhotos?.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-[#0a1628] dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <Eye className="w-4 h-4 text-indigo-500" />
                      Photos &amp; Media
                    </h3>
                    <span className="text-[11px] text-slate-400 font-bold">
                      {profile.mediaPhotos.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {profile.mediaPhotos.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setLightboxImg(p)}
                        className="aspect-square rounded-xl overflow-hidden group relative bg-black/10 focus:outline-none"
                      >
                        <img
                          src={p}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Connect Card */}
              {me && me.id !== profile.id && (
                <div className="rounded-2xl bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] p-6 text-white shadow-md space-y-3">
                  <h4 className="text-sm font-extrabold text-white">Direct Connect</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Have a client inquiry or want to collaborate with {profile.name}? Send a direct message through
                    our secure portal.
                  </p>
                  <Link
                    href={`/messages?user=${profile.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#0a1628] font-bold text-xs transition-all shadow-sm active:scale-[0.98]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Start Conversation
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: COMMUNITY POSTS ──────────────────────────────────── */}
        {activeTab === "posts" && (
          <div className="max-w-3xl mx-auto space-y-6">
            {profile.posts && profile.posts.length > 0 ? (
              profile.posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 p-6 shadow-sm space-y-4"
                >
                  {/* Author Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-[#0a1628] shrink-0 border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                        {profile.image ? (
                          <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-sm font-bold flex items-center justify-center w-full h-full">
                            {profile.name[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-sm text-[#0a1628] dark:text-white">{profile.name}</h4>
                          {profile.hasDueDiligenceBadge && <DueDiligenceBadge size={16} />}
                        </div>
                        <p className="text-xs text-slate-400 font-medium">{timeAgo(post.createdAt)}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${tierInfo.badgeCls}`}>
                      {tierInfo.label}
                    </span>
                  </div>

                  {/* Post Content */}
                  {post.content && (
                    <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>
                  )}

                  {/* Video Attachment with Cloudinary frame preview */}
                  {post.videoUrl && (
                    <div className="rounded-2xl overflow-hidden shadow-md">
                      <FeedVideoPlayer src={post.videoUrl} className="w-full max-h-[500px]" />
                    </div>
                  )}

                  {/* Photo attachments */}
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2.5">
                      {post.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setLightboxImg(img)}
                          className="rounded-xl overflow-hidden aspect-video bg-black/10 group focus:outline-none"
                        >
                          <img
                            src={img}
                            alt="Post attachment"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Post Interaction Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-5">
                      <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                        {post.likeCount} {post.likeCount === 1 ? "Like" : "Likes"}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <MessageSquare className="w-4 h-4" />
                        {post.commentCount} {post.commentCount === 1 ? "Comment" : "Comments"}
                      </span>
                    </div>

                    <Link
                      href="/feed"
                      className="text-xs font-bold text-[#1E56A0] dark:text-[#60a5fa] hover:underline flex items-center gap-1"
                    >
                      View on Feed <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 p-12 text-center shadow-xs">
                <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#0a1628] dark:text-white">No Posts Published Yet</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  {profile.name} hasn&apos;t shared any public feed posts yet. Check back soon for tax tips and updates.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT: SERVICES & LISTINGS ──────────────────────────────── */}
        {activeTab === "services" && (
          <div className="space-y-8">
            {/* Pro Services */}
            {profile.proServices && profile.proServices.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-[#0a1628] dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                  Professional Services Offered
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.proServices.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
                    >
                      <div className="space-y-2">
                        <span className="text-3xl block">{s.emoji}</span>
                        <h4 className="font-bold text-[#0a1628] dark:text-white text-base">{s.title}</h4>
                        {s.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                            {s.description}
                          </p>
                        )}
                      </div>
                      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {s.price || "Contact for rate"}
                        </span>
                        <Link
                          href={`/messages?user=${profile.id}`}
                          className="text-xs font-bold text-[#1E56A0] dark:text-[#60a5fa] hover:underline flex items-center gap-1"
                        >
                          Inquire <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Marketplace Listings */}
            {profile.listings && profile.listings.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-[#0a1628] dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#1E56A0] rounded-full" />
                  Marketplace Products &amp; Toolkits
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.listings.map((l) => (
                    <Link
                      key={l.id}
                      href={l.slug ? `/marketplace/${l.slug}` : `/marketplace`}
                      className="group rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        {l.images?.[0] ? (
                          <img
                            src={l.images[0]}
                            alt={l.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] flex items-center justify-center text-white/40">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                        )}
                        <span className="absolute top-2.5 left-2.5 text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-md">
                          {l.category}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <h4 className="font-bold text-sm text-[#0a1628] dark:text-white group-hover:text-[#1E56A0] transition-colors line-clamp-1">
                            {l.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                            {l.description}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-sm font-black text-[#d4a017]">
                            {l.price != null ? `$${l.price}` : "Free"}
                          </span>
                          <span className="text-xs font-bold text-slate-400 group-hover:text-[#0a1628] dark:group-hover:text-white flex items-center gap-0.5">
                            View Details <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT: COURSES ──────────────────────────────────────────── */}
        {activeTab === "courses" && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-[#0a1628] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
              Courses Instructed by {profile.name}
            </h3>

            {profile.instructorCourses && profile.instructorCourses.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {profile.instructorCourses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/courses/${c.slug}`}
                    className="group rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {c.thumbnail ? (
                        <img
                          src={c.thumbnail}
                          alt={c.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] flex items-center justify-center text-white/40">
                          <BookOpen className="w-8 h-8" />
                        </div>
                      )}
                      <span
                        className={`absolute top-2.5 left-2.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          LEVEL_COLORS[c.level] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {c.level}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <h4 className="font-bold text-sm text-[#0a1628] dark:text-white group-hover:text-[#1E56A0] transition-colors line-clamp-2 leading-snug">
                        {c.title}
                      </h4>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-sm font-black text-[#d4a017]">
                          {c.isFree ? "Free" : `$${c.price}`}
                        </span>
                        <span className="text-xs font-bold text-slate-400 group-hover:text-[#0a1628] dark:group-hover:text-white flex items-center gap-0.5">
                          View Course <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-[#0a1628] dark:text-white">No Courses Published</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  This member has not authored any public courses yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT: REVIEWS ──────────────────────────────────────────── */}
        {activeTab === "reviews" && (
          <div className="space-y-5 max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-[#0a1628] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                Client &amp; Member Reviews
              </h3>
              {avgRating && (
                <span className="flex items-center gap-1.5 text-sm font-black text-amber-600 dark:text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {avgRating} / 5.0 ({profile.reviewsReceived?.length} reviews)
                </span>
              )}
            </div>

            {profile.reviewsReceived && profile.reviewsReceived.length > 0 ? (
              <div className="space-y-4">
                {profile.reviewsReceived.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-[#0a1628] shrink-0">
                          {r.reviewer.image ? (
                            <img
                              src={r.reviewer.image}
                              alt={r.reviewer.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-xs font-bold flex items-center justify-center w-full h-full">
                              {r.reviewer.name[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0a1628] dark:text-white">{r.reviewer.name}</p>
                          {r.reviewer.headline && (
                            <p className="text-[10px] text-slate-400">{r.reviewer.headline}</p>
                          )}
                        </div>
                      </div>

                      <StarRow rating={r.rating} />
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{r.content}</p>
                    <p className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white dark:bg-[#172135] border border-slate-200/90 dark:border-slate-800/90 p-12 text-center">
                <Star className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-[#0a1628] dark:text-white">No Reviews Yet</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Reviews from completed services and marketplace products will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
