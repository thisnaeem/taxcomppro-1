"use client";

import { useEffect, useState, useMemo, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import {
  Loader2, X, Check, Zap, CreditCard, Radio, Copy, CheckCheck,
  Calendar, Clock, Users, Mic, Video, ArrowRight
} from "lucide-react";
import {
  Radio01Icon, Add01Icon, CalendarAdd01Icon, Search01Icon, Cancel01Icon,
  GridViewIcon, Calendar03Icon, StarIcon, FireIcon,
  CourtLawIcon, CheckListIcon, Audit01Icon, CreditCardIcon as HugeCreditCardIcon, Briefcase01Icon,
  Rocket01Icon, Building02Icon, ComputerIcon, AiBrain01Icon, Analytics01Icon,
  UserGroupIcon, School01Icon, Shield01Icon, Clock01Icon, News01Icon,
  Award01Icon, UserMultiple02Icon, QuestionIcon, Mic01Icon,
  ArrowLeft01Icon, ArrowRight01Icon,
} from "hugeicons-react";
import { PRO_TALK_CATEGORIES } from "@/lib/proTalks";

interface SpaceHost {
  id: string;
  name: string;
  image: string | null;
  headline: string | null;
  role?: string;
  tier?: string;
}

interface Space {
  id: string;
  name: string;
  description: string | null;
  hostId?: string;
  roomName: string;
  category: string;
  mediaType: string;
  visibility?: "PUBLIC" | "PRIVATE";
  isLive: boolean;
  scheduledAt: string | null;
  shareToken: string | null;
  totalAttendees: number;
  peakAttendees: number;
  replayUrl: string | null;
  replayDurationMinutes: number | null;
  isReplay: boolean;
  createdAt: string;
  endedAt: string | null;
  host: SpaceHost;
  _count: { rsvps: number; attendances?: number };
}

function CategoryIcon({ slug, className = "w-3.5 h-3.5 shrink-0" }: { slug?: string; className?: string }) {
  switch (slug) {
    case "tax-law-updates": return <CourtLawIcon className={className} />;
    case "due-diligence-compliance": return <CheckListIcon className={className} />;
    case "irs-audits-notices": return <Audit01Icon className={className} />;
    case "tax-credits-filing-status": return <HugeCreditCardIcon className={className} />;
    case "schedule-c-business-returns": return <Briefcase01Icon className={className} />;
    case "tax-office-start-up": return <Rocket01Icon className={className} />;
    case "tax-office-operations": return <Building02Icon className={className} />;
    case "tax-software-technology": return <ComputerIcon className={className} />;
    case "ai-automation": return <AiBrain01Icon className={className} />;
    case "marketing-business-growth": return <Analytics01Icon className={className} />;
    case "client-management": return <UserGroupIcon className={className} />;
    case "staffing-training": return <School01Icon className={className} />;
    case "efin-ero-discussions": return <Shield01Icon className={className} />;
    case "tax-season-talk": return <Clock01Icon className={className} />;
    case "industry-news-updates": return <News01Icon className={className} />;
    case "professional-development": return <Award01Icon className={className} />;
    case "networking-collaboration": return <UserMultiple02Icon className={className} />;
    case "expert-qa": return <QuestionIcon className={className} />;
    case "open-discussion": return <Mic01Icon className={className} />;
    case "all":
    default:
      return <GridViewIcon className={className} />;
  }
}

function getCategoryIconByName(name: string, className = "w-3.5 h-3.5 shrink-0") {
  const cat = PRO_TALK_CATEGORIES.find(c => c.name === name);
  return <CategoryIcon slug={cat?.slug} className={className} />;
}

type TabType = "all" | "live" | "upcoming" | "following" | "popular";

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function formatScheduled(d: string) {
  return new Date(d).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeUntil(d: string) {
  const ms = new Date(d).getTime() - Date.now();
  if (ms <= 0) return "starting soon";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `in ${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

function LiveWave() {
  return (
    <div className="flex items-end gap-[2px] h-3.5">
      {[1, 0.4, 0.8, 0.3, 1, 0.6, 0.4, 0.9, 0.5, 0.9].map((h, i) => (
        <span
          key={i}
          className="w-[2px] bg-emerald-400 rounded-full animate-pulse"
          style={{ height: `${h * 13}px`, animationDelay: `${i * 90}ms` }}
        />
      ))}
    </div>
  );
}

// ── Copy Link Button ──────────────────────────────────────────────────────────
function CopyButton({ text, label = "Share" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-semibold transition-all shrink-0"
    >
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

// ── Host Payment / Upgrade Modal ──────────────────────────────────────────────
function HostUpgradeModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const handlePay = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/pro-talk-host-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-gradient-to-br from-[#061224] via-[#091b35] to-[#040a14] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-emerald-500/40 shadow-lg shadow-emerald-500/30 shrink-0 bg-[#061224]">
            <Image src="/protalk.png" alt="Pro Talks" fill className="object-cover" />
          </div>
          <div>
            <h2 className="text-white font-black text-xl leading-tight">Host a Pro Talk</h2>
            <p className="text-emerald-300/80 text-xs">Exclusively for Marketplace Plus members</p>
          </div>
        </div>

        {/* Plan 1: Marketplace Plus Membership (Recommended) */}
        <div className="relative bg-gradient-to-br from-emerald-950/60 to-[#071d34] border-2 border-lime-400/60 rounded-2xl p-5 mb-4 shadow-xl">
          <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-lime-400 text-[#060e1a] text-[10px] font-black uppercase tracking-wider">
            Best Value · Unlimited
          </div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-3xl font-black text-white">$129.99</span>
            <span className="text-emerald-300/70 text-xs">/month</span>
          </div>
          <p className="text-slate-200 text-xs font-semibold mb-3">
            VIP + Marketplace Plus Membership
          </p>
          <ul className="space-y-1.5 text-xs text-slate-300 mb-4">
            <li className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-lime-400 shrink-0" />
              <span><strong>Unlimited Pro Talk hosting</strong> with video, audio &amp; screenshare</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-lime-400 shrink-0" />
              <span>Full Marketplace seller privileges &amp; premium verified badge</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-lime-400 shrink-0" />
              <span>Host up to 5 replay archives permanently on your profile</span>
            </li>
          </ul>
          <Link
            href="/upgrade"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] font-black text-xs sm:text-sm hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/25"
          >
            Upgrade to Marketplace Plus →
          </Link>
        </div>

        {/* Plan 2: Single-Session Host Pass */}
        <div className="bg-[#050f1d]/80 border border-emerald-500/20 rounded-2xl p-4 text-left">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-white font-bold text-sm">Single Session Host Pass</span>
            <span className="text-emerald-300 font-bold text-sm">$99.99 <span className="text-slate-400 text-xs font-normal">one-time</span></span>
          </div>
          <p className="text-slate-400 text-xs mb-3">Host a single live session with full stage controls, polls, and invite links.</p>
          <button
            id="pro-talk-pay-btn"
            onClick={handlePay}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-emerald-500/30 text-white font-bold text-xs transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4 text-lime-400" />}
            Pay $99.99 for 1 Pro Talk Pass
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Pro Talk Form Modal ────────────────────────────────────────────────
function CreateFormModal({
  onClose,
  onCreated,
  hostPaid,
  hostSessionId,
}: {
  onClose: () => void;
  onCreated: (space: Space) => void;
  hostPaid: boolean;
  hostSessionId?: string;
}) {
  const [tab, setTab] = useState<"now" | "schedule">("now");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("Tax Law & Updates");
  const [mediaType, setMediaType] = useState<"AUDIO_VIDEO" | "AUDIO">("AUDIO_VIDEO");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [schedDate, setSchedDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [minDateTime] = useState(() => new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16));

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    if (tab === "schedule" && !schedDate) return;
    setCreating(true);
    setError(null);

    const body: Record<string, unknown> = {
      name: name.trim(),
      description: desc.trim() || null,
      category,
      mediaType,
      visibility,
    };
    if (hostPaid && hostSessionId) body.hostSessionId = hostSessionId;
    if (tab === "schedule") body.scheduledAt = new Date(schedDate).toISOString();

    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create session.");
        setCreating(false);
        return;
      }

      onCreated(data as Space);
    } catch {
      setError("Network error occurred.");
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-gradient-to-br from-[#061426] via-[#091b35] to-[#040a14] border border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-emerald-500/40 shadow-lg shadow-emerald-500/30 shrink-0 bg-[#061224]">
            <Image src="/protalk.png" alt="Pro Talks" fill className="object-cover" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg">Create a Pro Talk</h2>
            <p className="text-emerald-300/70 text-xs">Broadcast live or schedule for your audience</p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex p-1 bg-black/40 border border-emerald-500/20 rounded-xl mb-4">
          <button
            onClick={() => setTab("now")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === "now"
                ? "bg-gradient-to-r from-lime-400 to-emerald-500 text-[#060e1a] shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> Go Live Now
          </button>
          <button
            onClick={() => setTab("schedule")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === "schedule"
                ? "bg-gradient-to-r from-lime-400 to-emerald-500 text-[#060e1a] shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Schedule for Later
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-emerald-300/80 text-xs font-semibold mb-1 uppercase tracking-wide">
              Pro Talk Title *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Schedule C Audit Defense: Red Flags & Best Practices"
              className="w-full bg-[#050f1d] border border-emerald-500/25 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-400 transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category selection */}
            <div>
              <label className="block text-emerald-300/80 text-xs font-semibold mb-1 uppercase tracking-wide">
                Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#050f1d] border border-emerald-500/25 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-emerald-400 transition-all cursor-pointer [color-scheme:dark]"
              >
                {PRO_TALK_CATEGORIES.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Media format */}
            <div>
              <label className="block text-emerald-300/80 text-xs font-semibold mb-1 uppercase tracking-wide">
                Format
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMediaType("AUDIO_VIDEO")}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    mediaType === "AUDIO_VIDEO"
                      ? "bg-emerald-500/25 border-emerald-400 text-lime-300"
                      : "bg-[#050f1d] border-emerald-500/20 text-slate-400 hover:text-white"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" /> Audio + Video
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType("AUDIO")}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    mediaType === "AUDIO"
                      ? "bg-emerald-500/25 border-emerald-400 text-lime-300"
                      : "bg-[#050f1d] border-emerald-500/20 text-slate-400 hover:text-white"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" /> Audio Only
                </button>
              </div>
            </div>
          </div>

          <fieldset>
            <legend className="text-emerald-300/80 text-xs font-semibold mb-2 uppercase tracking-wide">Who can join?</legend>
            <div className="grid grid-cols-2 gap-3">
              {(["PUBLIC", "PRIVATE"] as const).map(value => (
                <label key={value} className={`cursor-pointer rounded-xl border p-3 text-sm ${visibility === value ? "border-emerald-400 bg-emerald-500/20 text-white" : "border-emerald-500/20 bg-[#050f1d] text-slate-300"}`}>
                  <span className="flex items-center gap-2 font-bold"><input type="radio" name="talk-visibility" value={value} checked={visibility === value} onChange={() => setVisibility(value)} className="accent-emerald-400" />{value === "PUBLIC" ? "Public" : "Private / Invite only"}</span>
                  <span className="block mt-2 text-xs leading-relaxed text-slate-400">{value === "PUBLIC" ? "Visible in Pro Talks. Anyone can join." : "Hidden from discovery. Join with an invitation link."}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">Everyone enters muted. The host controls who can speak.</p>
          </fieldset>
          <div>
            <label className="block text-emerald-300/80 text-xs font-semibold mb-1 uppercase tracking-wide">
              Description (Optional)
            </label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="What topics will be covered? What should attendees prepare?"
              rows={3}
              className="w-full bg-[#050f1d] border border-emerald-500/25 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-400 transition-all text-xs resize-none"
            />
          </div>

          {tab === "schedule" && (
            <div>
              <label className="block text-emerald-300/80 text-xs font-semibold mb-1.5 uppercase tracking-wide">
                <Clock className="w-3 h-3 inline mr-1 text-emerald-400" /> Date &amp; Start Time *
              </label>
              <input
                type="datetime-local"
                value={schedDate}
                min={minDateTime}
                onChange={e => setSchedDate(e.target.value)}
                className="w-full bg-[#050f1d] border border-emerald-500/25 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-400 transition-all text-sm [color-scheme:dark]"
              />
            </div>
          )}

          {error && (
            <p className="text-rose-400 text-xs bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-xl">
              {error}
            </p>
          )}

          <button
            id="protalk-create-btn"
            onClick={handleCreate}
            disabled={!name.trim() || creating || (tab === "schedule" && !schedDate)}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] text-sm font-black transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01]"
          >
            {creating ? (
              <><Loader2 className="w-4 h-4 animate-spin text-[#060e1a]" /> Preparing Stage…</>
            ) : tab === "now" ? (
              <><Radio01Icon className="w-4 h-4" /> Go Live Now</>
            ) : (
              <><CalendarAdd01Icon className="w-4 h-4" /> Schedule Pro Talk</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Live Session Card ─────────────────────────────────────────────────────────
function LiveCard({ space }: { space: Space }) {
  const isVideo = space.mediaType === "AUDIO_VIDEO";
  return (
    <Link
      href={`/pro-talks/${space.id}`}
      className="group relative bg-gradient-to-br from-[#061426]/95 via-[#07192f]/90 to-[#040a14]/95 hover:from-[#091e38] hover:to-[#071526] border border-emerald-500/35 hover:border-emerald-400 rounded-3xl p-5 transition-all duration-300 backdrop-blur-md overflow-hidden flex flex-col shadow-[0_4px_25px_rgba(0,0,0,0.5)] hover:shadow-[0_0_35px_rgba(16,185,129,0.25)] hover:-translate-y-1"
    >
      {/* Glow pulse behind card */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

      {/* Badges row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-500/25 border border-emerald-400/50 rounded-full px-3 py-1 shadow-[0_0_12px_rgba(16,185,129,0.35)]">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-lime-300 text-[11px] font-black uppercase tracking-wide">Live</span>
          </div>
          <LiveWave />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-white/8 border border-white/10 text-slate-300 text-[10px] font-semibold flex items-center gap-1">
            {isVideo ? <Video className="w-3 h-3 text-emerald-400" /> : <Mic className="w-3 h-3 text-teal-400" />}
            {isVideo ? "Audio + Video" : "Audio Only"}
          </span>
          <span className="text-slate-400 text-xs">{timeAgo(space.createdAt)}</span>
        </div>
      </div>

      {/* Category Pill */}
      <div className="mb-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
          {getCategoryIconByName(space.category || "Open Discussion", "w-3 h-3 text-emerald-400")}
          <span>{space.category || "Open Discussion"}</span>
        </span>
      </div>

      {/* Title & Description */}
      <h3 className="text-white font-black text-lg mb-1.5 group-hover:text-lime-300 transition-colors leading-snug">
        {space.name}
      </h3>
      {space.description && (
        <p className="text-slate-300 text-xs leading-relaxed line-clamp-2 mb-4">
          {space.description}
        </p>
      )}

      {/* Host Profile & Join */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-3.5 border-t border-emerald-900/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-emerald-400/60 bg-gradient-to-br from-emerald-600 to-teal-800">
            {space.host.image ? (
              <img
                src={space.host.image}
                alt={space.host.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-white text-xs font-black">
                {space.host.name[0]}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-bold truncate">{space.host.name}</div>
            {space.host.headline && (
              <div className="text-slate-400 text-[10px] truncate">{space.host.headline}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-slate-300 text-xs font-semibold px-2 py-1 rounded-lg bg-white/5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{Math.max(1, space.totalAttendees || 1)}</span>
          </span>
          <span className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 text-[#060e1a] text-xs font-black shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-all">
            Join Live <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Upcoming Session Card ─────────────────────────────────────────────────────
function UpcomingCard({
  space,
  currentUserId,
}: {
  space: Space;
  currentUserId: string;
}) {
  const [rsvped, setRsvped] = useState(false);
  const [rsvping, setRsvping] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(space._count?.rsvps ?? 0);

  const shareUrl = space.shareToken
    ? typeof window !== "undefined"
      ? `${window.location.origin}/pro-talks/invite/${space.shareToken}`
      : `/pro-talks/invite/${space.shareToken}`
    : null;

  const toggleRsvp = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (rsvping || !currentUserId) return;
    setRsvping(true);
    if (rsvped) {
      await fetch(`/api/spaces/${space.id}/rsvp`, { method: "DELETE" });
      setRsvped(false);
      setRsvpCount(c => Math.max(0, c - 1));
    } else {
      const res = await fetch(`/api/spaces/${space.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setRsvped(true);
        setRsvpCount(c => c + 1);
      }
    }
    setRsvping(false);
  };

  return (
    <div className="group relative bg-gradient-to-br from-[#061426]/75 to-[#040a14]/75 hover:from-[#091b35]/90 hover:to-[#061224]/90 border border-emerald-500/20 hover:border-emerald-400/50 rounded-3xl p-5 transition-all duration-200 backdrop-blur-sm overflow-hidden flex flex-col">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full px-3 py-1">
            <Calendar className="w-3 h-3 text-blue-300" />
            <span className="text-blue-200 text-[11px] font-black uppercase tracking-wide">
              Upcoming
            </span>
          </div>
          {space.scheduledAt && (
            <span className="text-emerald-300/80 text-xs font-semibold">
              {timeUntil(space.scheduledAt)}
            </span>
          )}
        </div>

        {shareUrl && <CopyButton text={shareUrl} label="Share" />}
      </div>

      {/* Category */}
      <div className="mb-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
          {getCategoryIconByName(space.category || "Open Discussion", "w-3 h-3 text-emerald-400")}
          <span>{space.category || "Open Discussion"}</span>
        </span>
      </div>

      {/* Title */}
      <h3 className="text-white font-black text-lg mb-1.5 leading-snug">
        {space.name}
      </h3>
      {space.description && (
        <p className="text-slate-300 text-xs leading-relaxed line-clamp-2 mb-3">
          {space.description}
        </p>
      )}

      {/* Date & Time pill */}
      {space.scheduledAt && (
        <div className="flex items-center gap-2 text-xs text-emerald-300 mb-4 bg-emerald-950/30 border border-emerald-500/20 rounded-xl px-3 py-2">
          <Clock className="w-3.5 h-3.5 text-lime-400 shrink-0" />
          <span className="font-semibold">{formatScheduled(space.scheduledAt)}</span>
        </div>
      )}

      {/* Host profile and RSVP */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-emerald-900/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-emerald-400/40 bg-gradient-to-br from-emerald-600 to-teal-800">
            {space.host.image ? (
              <img
                src={space.host.image}
                alt={space.host.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                {space.host.name[0]}
              </span>
            )}
          </div>
          <div className="text-white text-xs font-semibold truncate">{space.host.name}</div>
        </div>

        <button
          onClick={toggleRsvp}
          disabled={rsvping}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
            rsvped
              ? "bg-emerald-500/25 border border-emerald-400 text-lime-300"
              : "bg-white/10 hover:bg-white/18 text-white border border-white/10 hover:border-emerald-400/40"
          }`}
        >
          <Users className="w-3 h-3" />
          <span>{rsvped ? "Reminding You ✓" : `Remind Me (${rsvpCount})`}</span>
        </button>
      </div>
    </div>
  );
}

// ── Main Page Inner ───────────────────────────────────────────────────────────
function ProTalksInner() {
  const user = useAppSelector(s => s.auth.user);
  const searchParams = useSearchParams();
  const hostPaid = searchParams?.get("host_paid") === "1";
  const hostSessionId = searchParams?.get("session_id") ?? undefined;

  const isAdmin = user?.role === "ADMIN";
  const isMarketplacePlus = user?.tier === "MARKETPLACE_PLUS";
  const canHost = isAdmin || isMarketplacePlus;
  const effectiveCanHost = canHost || (hostPaid && !!hostSessionId);

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(() => Boolean(hostPaid && !canHost));
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Category horizontal scroll controls
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkScroll]);

  const handleScroll = (direction: "left" | "right") => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const scrollAmount = direction === "left" ? -320 : 320;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
    setTimeout(checkScroll, 320);
  };

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (activeTab !== "all") params.set("tab", activeTab);

    fetch(`/api/spaces?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (active) {
          if (Array.isArray(data)) setSpaces(data);
          else setSpaces([]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setSpaces([]);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedCategory, searchQuery, activeTab]);

  const handleCreated = (newSpace: Space) => {
    setSpaces(p => [newSpace, ...p]);
    setShowForm(false);
  };

  const handleHostClick = () => {
    if (effectiveCanHost) {
      setShowForm(true);
    } else {
      setShowUpgradeModal(true);
    }
  };

  const liveSpaces = useMemo(() => spaces.filter(s => s.isLive), [spaces]);
  const upcomingSpaces = useMemo(() => spaces.filter(s => !s.isLive && !s.endedAt), [spaces]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#040a14] via-[#061224] to-[#0a1c38]">
      {showUpgradeModal && <HostUpgradeModal onClose={() => setShowUpgradeModal(false)} />}
      {showForm && (
        <CreateFormModal
          onClose={() => setShowForm(false)}
          onCreated={handleCreated}
          hostPaid={hostPaid}
          hostSessionId={hostSessionId}
        />
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-emerald-950/60 bg-gradient-to-b from-[#061426]/80 to-transparent">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            {/* Branding */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.35)] shrink-0 bg-[#061224] group hover:scale-105 transition-transform">
                <Image
                  src="/protalk.png"
                  alt="Pro Talks"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse" />
                  <span className="text-lime-300 text-xs font-black uppercase tracking-widest">
                    {liveSpaces.length} live now
                  </span>
                  <span className="text-slate-500 text-xs">• Free Access for All Members</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-300">
                    PRO
                  </span>{" "}
                  TALKS
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                  Real-time audio &amp; video stages with tax masters, EAs, CPAs, and industry leaders.
                  Join live discussions, ask questions, or host your own stage.
                </p>
              </div>
            </div>

            {/* Host Button */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleHostClick}
                className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] text-sm font-black transition-all shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 shrink-0"
              >
                <Add01Icon className="w-4 h-4" /> Host a Pro Talk
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="flex items-center bg-[#061426]/95 border border-emerald-500/35 rounded-2xl px-4 py-3 shadow-lg focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <Search01Icon className="w-5 h-5 text-emerald-400 shrink-0 mr-3" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Pro Talks by topic, keyword (e.g. Schedule C, EFIN), or host name..."
                className="w-full bg-transparent text-white placeholder-slate-400 text-sm outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-white text-xs px-2 flex items-center gap-1 transition-colors"
                >
                  <Cancel01Icon className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* 19 Category Carousel with Controls & Hidden Scrollbar */}
          <div className="space-y-2 mb-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/90 flex items-center gap-1.5">
                  <GridViewIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Categories &amp; Tracks
                </span>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                  ({PRO_TALK_CATEGORIES.length} Specialized Tracks)
                </span>
              </div>

              {/* Scroll controls for desktop */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleScroll("left")}
                  disabled={!canScrollLeft}
                  aria-label="Scroll categories left"
                  className="w-7 h-7 rounded-lg bg-[#061426] border border-emerald-500/20 flex items-center justify-center text-slate-300 hover:text-white hover:border-emerald-400/50 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                >
                  <ArrowLeft01Icon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleScroll("right")}
                  disabled={!canScrollRight}
                  aria-label="Scroll categories right"
                  className="w-7 h-7 rounded-lg bg-[#061426] border border-emerald-500/20 flex items-center justify-center text-slate-300 hover:text-white hover:border-emerald-400/50 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                >
                  <ArrowRight01Icon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scroll Track with Gradient Masks */}
            <div className="relative group/track">
              {canScrollLeft && (
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#040e1a] to-transparent pointer-events-none z-10 rounded-l-xl" />
              )}
              {canScrollRight && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#040e1a] to-transparent pointer-events-none z-10 rounded-r-xl" />
              )}

              <div
                ref={categoryScrollRef}
                onScroll={checkScroll}
                className="overflow-x-auto no-scrollbar scrollbar-none py-1.5 px-0.5 flex items-center gap-2 scroll-smooth"
              >
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3.5 py-2 rounded-xl text-xs transition-all shrink-0 flex items-center gap-2 ${
                    selectedCategory === "all"
                      ? "bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-400 text-[#040e1a] shadow-lg shadow-emerald-500/25 ring-2 ring-lime-400/50 font-black scale-[1.02]"
                      : "bg-[#061426]/90 border border-emerald-500/20 text-slate-300 hover:text-white hover:border-emerald-400/50 hover:bg-[#0c2444] shadow-sm font-medium"
                  }`}
                >
                  <GridViewIcon className={`w-3.5 h-3.5 ${selectedCategory === "all" ? "text-[#040e1a]" : "text-emerald-400"}`} />
                  <span>All Categories</span>
                </button>
                {PRO_TALK_CATEGORIES.map(cat => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-3.5 py-2 rounded-xl text-xs transition-all shrink-0 flex items-center gap-2 ${
                        isSelected
                          ? "bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-400 text-[#040e1a] shadow-lg shadow-emerald-500/25 ring-2 ring-lime-400/50 font-black scale-[1.02]"
                          : "bg-[#061426]/90 border border-emerald-500/20 text-slate-300 hover:text-white hover:border-emerald-400/50 hover:bg-[#0c2444] shadow-sm font-medium"
                      }`}
                    >
                      <CategoryIcon
                        slug={cat.slug}
                        className={`w-3.5 h-3.5 ${isSelected ? "text-[#040e1a]" : "text-emerald-400/90"}`}
                      />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Filter Tabs */}
          <div className="mt-4 pt-3.5 border-t border-emerald-950/40">
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#061426]/95 border border-emerald-500/25 backdrop-blur-md overflow-x-auto no-scrollbar scrollbar-none max-w-full">
              {[
                { id: "all", label: "All Talks", icon: GridViewIcon, color: "text-emerald-400" },
                { id: "live", label: "Live Now", icon: Radio01Icon, color: "text-rose-400", count: liveSpaces.length, isLive: true },
                { id: "upcoming", label: "Upcoming", icon: Calendar03Icon, color: "text-blue-400", count: upcomingSpaces.length },
                { id: "following", label: "Following", icon: StarIcon, color: "text-amber-400" },
                { id: "popular", label: "Popular / Trending", icon: FireIcon, color: "text-orange-400" },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border border-emerald-400/60 text-white shadow-md shadow-emerald-500/15"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <span className="relative flex items-center">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : tab.color}`} />
                      {tab.isLive && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      )}
                    </span>
                    <span>{tab.label}</span>
                    {typeof tab.count === "number" && tab.count > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          isActive
                            ? "bg-white/20 text-white"
                            : tab.isLive
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-emerald-500/20 text-lime-300"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Payment Confirmation Banner */}
        {hostPaid && !canHost && (
          <div className="flex items-center gap-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl px-5 py-3.5">
            <Check className="w-5 h-5 text-lime-400 shrink-0" />
            <p className="text-emerald-200 text-sm font-semibold">
              Host pass confirmed! You can now start or schedule your Pro Talk below.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-slate-400 text-xs">Discovering Pro Talks…</p>
          </div>
        ) : (
          <>
            {/* LIVE NOW SECTION */}
            {(activeTab === "all" || activeTab === "live") && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Radio01Icon className="w-4 h-4 text-rose-500 animate-pulse" />
                    <h2 className="text-white font-black text-lg uppercase tracking-wide">
                      Live Now
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black">
                      {liveSpaces.length}
                    </span>
                  </div>
                  {liveSpaces.length > 0 && (
                    <span className="text-slate-400 text-xs">Updated in real-time</span>
                  )}
                </div>

                {liveSpaces.length === 0 ? (
                  <div className="text-center py-12 bg-[#061426]/50 rounded-3xl border border-emerald-500/20 px-4">
                    <div className="relative w-14 h-14 mx-auto mb-3 rounded-2xl overflow-hidden border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.25)] bg-[#061224]">
                      <Image src="/protalk.png" alt="Pro Talks" fill className="object-cover" />
                    </div>
                    <p className="text-slate-200 font-bold mb-1 text-sm">No live sessions right now</p>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto">
                      Check upcoming scheduled talks below or start your own live stage.
                    </p>
                    <button
                      onClick={handleHostClick}
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] text-xs font-black hover:scale-105 transition-all shadow-md"
                    >
                      <Add01Icon className="w-3.5 h-3.5" /> Start a Pro Talk
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {liveSpaces.map(space => (
                      <LiveCard key={space.id} space={space} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* UPCOMING PRO TALKS SECTION */}
            {(activeTab === "all" || activeTab === "upcoming") && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Calendar03Icon className="w-4 h-4 text-blue-400" />
                    <h2 className="text-white font-black text-lg uppercase tracking-wide">
                      Upcoming Pro Talks
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black">
                      {upcomingSpaces.length}
                    </span>
                  </div>
                  <span className="text-slate-400 text-xs">Sorted by soonest first</span>
                </div>

                {upcomingSpaces.length === 0 ? (
                  <div className="text-center py-10 bg-[#061426]/30 rounded-3xl border border-emerald-500/15 px-4">
                    <p className="text-slate-300 font-bold mb-1 text-sm">No upcoming talks scheduled</p>
                    <p className="text-slate-500 text-xs">Be the first to schedule a session in this category.</p>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {upcomingSpaces.map(space => (
                      <UpcomingCard
                        key={space.id}
                        space={space}
                        currentUserId={user?.id ?? ""}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* FROM HOSTS YOU FOLLOW */}
            {activeTab === "following" && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <StarIcon className="w-4 h-4 text-amber-400" />
                  <h2 className="text-white font-black text-lg uppercase tracking-wide">
                    From Hosts You Follow
                  </h2>
                </div>
                {spaces.length === 0 ? (
                  <div className="text-center py-12 bg-[#061426]/40 rounded-3xl border border-emerald-500/20 px-4">
                    <p className="text-slate-300 font-bold mb-1 text-sm">No talks from followed hosts yet</p>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto mb-4">
                      Connect with experienced tax professionals on Pro Connect to see their live talks here.
                    </p>
                    <Link
                      href="/find-a-pro"
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/15"
                    >
                      Browse Pros →
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {spaces.map(space =>
                      space.isLive ? (
                        <LiveCard key={space.id} space={space} />
                      ) : (
                        <UpcomingCard key={space.id} space={space} currentUserId={user?.id ?? ""} />
                      )
                    )}
                  </div>
                )}
              </section>
            )}

            {/* POPULAR / TRENDING */}
            {activeTab === "popular" && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <FireIcon className="w-4 h-4 text-orange-400" />
                  <h2 className="text-white font-black text-lg uppercase tracking-wide">
                    Popular &amp; Trending
                  </h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {spaces.map(space =>
                    space.isLive ? (
                      <LiveCard key={space.id} space={space} />
                    ) : (
                      <UpcomingCard key={space.id} space={space} currentUserId={user?.id ?? ""} />
                    )
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ProTalksPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#040a14] via-[#061224] to-[#0a1c38] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      }
    >
      <ProTalksInner />
    </Suspense>
  );
}
