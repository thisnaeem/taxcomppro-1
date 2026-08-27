"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import {
  Loader2, X, Check, Zap, CreditCard, Radio, Copy, CheckCheck,
  Calendar, Clock, Users, Mic, Volume2, Sparkles, MessageSquare, Video
} from "lucide-react";
import {
  Mic01Icon, Radio01Icon, UserGroupIcon, Add01Icon, CalendarAdd01Icon,
} from "hugeicons-react";

interface SpaceHost { id: string; name: string; image: string | null; headline: string | null; }
interface Space {
  id: string; name: string; description: string | null; roomName: string;
  isLive: boolean; scheduledAt: string | null; shareToken: string | null;
  createdAt: string; host: SpaceHost; _count: { rsvps: number };
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function formatScheduled(d: string) {
  return new Date(d).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
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
    <div className="flex items-end gap-[2px] h-4">
      {[1, 0.5, 0.75, 0.3, 0.9, 0.6, 0.4, 0.8, 0.5, 1].map((h, i) => (
        <span key={i} className="w-[2px] bg-emerald-400 rounded-full animate-pulse"
          style={{ height: `${h * 14}px`, animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-semibold transition-all shrink-0"
    >
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

// ── Shareable link banner ─────────────────────────────────────────────────────
function ShareLinkBanner({ token }: { token: string }) {
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/pro-talks/invite/${token}`
    : `/pro-talks/invite/${token}`;
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl px-5 py-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
      <div className="flex-1 min-w-0">
        <p className="text-emerald-300 text-sm font-bold mb-0.5">🔗 Share this invite link</p>
        <p className="text-emerald-100/60 text-xs truncate">{url}</p>
      </div>
      <CopyButton text={url} label="Copy Link" />
    </div>
  );
}

// ── Host Payment Modal ─────────────────────────────────────────────────────────
function HostPaymentModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const handlePay = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/pro-talk-host-checkout", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-gradient-to-br from-[#061224] via-[#091b35] to-[#040a14] border border-emerald-500/30 rounded-3xl p-7 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3.5 mb-5">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-emerald-500/40 shadow-lg shadow-emerald-500/30 shrink-0 bg-[#061224]">
            <Image src="/protalk.png" alt="Pro Talks" fill className="object-cover" />
          </div>
          <div>
            <h2 className="text-white font-black text-xl leading-tight">Host a Pro Talk</h2>
            <p className="text-emerald-300/70 text-sm">One-time session payment</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-950/40 to-blue-950/30 border border-emerald-500/30 rounded-2xl p-5 mb-6">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-black text-white">$99.99</span>
            <span className="text-emerald-300/70 text-sm ml-1">one-time</span>
          </div>
          <p className="text-slate-300 text-sm mb-4">Pay once, host one live Pro Talk stage with audio and video.</p>
          <ul className="space-y-2">
            {[
              "Start instantly or schedule for later",
              "Get a shareable invite link",
              "No subscription or recurring charges",
              "Full live stage controls & speaker invitations",
            ].map(perk => (
              <li key={perk} className="flex items-center gap-2 text-slate-200 text-sm">
                <Zap className="w-3.5 h-3.5 text-lime-400 shrink-0 fill-lime-400/30" />{perk}
              </li>
            ))}
          </ul>
        </div>
        <button
          id="pro-talk-pay-btn"
          onClick={handlePay}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] font-black text-base hover:shadow-[0_0_30px_rgba(34,197,94,0.45)] hover:scale-[1.02] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin text-[#060e1a]" /> Redirecting to Stripe…</>
            : <><CreditCard className="w-5 h-5" /> Pay $99.99 &amp; Host Now</>
          }
        </button>
        <p className="text-center text-slate-400 text-xs mt-3">Secure payment via Stripe · No hidden fees</p>
        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <p className="text-slate-400 text-xs">Want unlimited hosting?</p>
          <Link href="/upgrade" onClick={onClose} className="text-lime-400 hover:text-lime-300 text-xs font-bold transition-colors">
            Upgrade to VIP + Marketplace Plus ($129.99/mo) →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Create Form (Start Now / Schedule tabs) ────────────────────────────────────
function CreateForm({
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
  const [tab, setTab]             = useState<"now" | "schedule">("now");
  const [name, setName]           = useState("");
  const [desc, setDesc]           = useState("");
  const [schedDate, setSchedDate] = useState("");
  const [creating, setCreating]   = useState(false);
  const [newToken, setNewToken]   = useState<string | null>(null);

  const minDateTime = new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16);

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    if (tab === "schedule" && !schedDate) return;
    setCreating(true);

    const body: Record<string, string> = { name, description: desc };
    if (hostPaid && hostSessionId) body.hostSessionId = hostSessionId;
    if (tab === "schedule") body.scheduledAt = new Date(schedDate).toISOString();

    const res = await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const space = await res.json() as Space;
      if (space.shareToken) setNewToken(space.shareToken);
      onCreated(space);
    }
    setCreating(false);
  };

  return (
    <div className="relative bg-gradient-to-br from-[#061426] via-[#091b35] to-[#040a14] border border-emerald-500/30 rounded-3xl p-6 sm:p-7 backdrop-blur-md shadow-[0_0_40px_rgba(16,185,129,0.15)]">
      <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all">
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3.5 mb-5">
        <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-emerald-500/40 shadow-lg shadow-emerald-500/30 shrink-0 bg-[#061224]">
          <Image src="/protalk.png" alt="Pro Talks" fill className="object-cover" />
        </div>
        <div>
          <h2 className="text-white font-black text-base">Host a Pro Talk</h2>
          <p className="text-emerald-300/70 text-xs">Start a live conversation or schedule for later</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-black/40 border border-emerald-500/20 rounded-xl mb-4">
        <button
          onClick={() => setTab("now")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            tab === "now"
              ? "bg-gradient-to-r from-lime-400 to-emerald-500 text-[#060e1a] shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Radio className="w-3.5 h-3.5" /> Start Now
        </button>
        <button
          onClick={() => setTab("schedule")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            tab === "schedule"
              ? "bg-gradient-to-r from-lime-400 to-emerald-500 text-[#060e1a] shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Schedule
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-3.5">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="What are we talking about?"
          className="w-full bg-[#050f1d] border border-emerald-500/25 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-emerald-400 transition-all text-sm"
        />
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Description (optional)…"
          rows={2}
          className="w-full bg-[#050f1d] border border-emerald-500/25 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-emerald-400 transition-all text-sm resize-none"
        />

        {tab === "schedule" && (
          <div>
            <label className="block text-emerald-300/80 text-xs font-semibold mb-1.5 uppercase tracking-wide">
              <Clock className="w-3 h-3 inline mr-1 text-emerald-400" />Date &amp; Time
            </label>
            <input
              type="datetime-local"
              value={schedDate}
              min={minDateTime}
              onChange={e => setSchedDate(e.target.value)}
              className="w-full bg-[#050f1d] border border-emerald-500/25 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-400 transition-all text-sm [color-scheme:dark]"
            />
          </div>
        )}

        <button
          id="protalk-create-btn"
          onClick={handleCreate}
          disabled={!name.trim() || creating || (tab === "schedule" && !schedDate)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] text-sm font-black transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02]"
        >
          {creating
            ? <><Loader2 className="w-4 h-4 animate-spin text-[#060e1a]" /> Creating…</>
            : tab === "now"
              ? <><Radio01Icon className="w-4 h-4" /> Go Live Now</>
              : <><CalendarAdd01Icon className="w-4 h-4" /> Schedule Pro Talk</>
          }
        </button>
      </div>

      {/* Share link after creation */}
      {newToken && (
        <div className="mt-5">
          <ShareLinkBanner token={newToken} />
        </div>
      )}
    </div>
  );
}

// ── Space Card (live) ─────────────────────────────────────────────────────────
function LiveCard({ space }: { space: Space }) {
  return (
    <Link href={`/pro-talks/${space.id}`}
      className="group relative bg-gradient-to-br from-[#061426]/90 to-[#040a14]/90 hover:from-[#091b35] hover:to-[#061224] border border-emerald-500/30 hover:border-emerald-400/80 rounded-3xl p-5 transition-all duration-300 backdrop-blur-md overflow-hidden flex flex-col shadow-[0_4px_25px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-lime-300 text-[11px] font-black uppercase tracking-wide">Live</span>
          </div>
          <LiveWave />
        </div>
        <span className="text-slate-400 text-xs font-semibold">{timeAgo(space.createdAt)}</span>
      </div>
      <h3 className="text-white font-black text-lg mb-1.5 group-hover:text-lime-300 transition-colors leading-snug">{space.name}</h3>
      {space.description && <p className="text-slate-300 text-sm leading-relaxed line-clamp-2 mb-4">{space.description}</p>}
      <div className="mt-auto flex items-center gap-3 pt-3 border-t border-emerald-900/40">
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-emerald-400/60 bg-gradient-to-br from-emerald-600 to-teal-800">
          {space.host.image
            ? <img src={space.host.image} alt={space.host.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            : <span className="w-full h-full flex items-center justify-center text-white text-xs font-black">{space.host.name[0]}</span>
          }
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-white text-xs font-bold truncate">{space.host.name}</div>
          {space.host.headline && <div className="text-slate-400 text-[11px] truncate">{space.host.headline}</div>}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold shrink-0">
          <UserGroupIcon className="w-3.5 h-3.5" /><span>Join</span>
        </div>
      </div>
    </Link>
  );
}

// ── Space Card (upcoming / scheduled) ─────────────────────────────────────────
function UpcomingCard({ space, currentUserId }: { space: Space; currentUserId: string }) {
  const [rsvped,    setRsvped]    = useState(false);
  const [rsvping,   setRsvping]   = useState(false);
  const [rsvpCount, setRsvpCount] = useState(space._count.rsvps);

  const shareUrl = space.shareToken
    ? (typeof window !== "undefined" ? `${window.location.origin}/pro-talks/invite/${space.shareToken}` : `/pro-talks/invite/${space.shareToken}`)
    : null;

  const toggleRsvp = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (rsvping || !currentUserId) return;
    setRsvping(true);
    if (rsvped) {
      await fetch(`/api/spaces/${space.id}/rsvp`, { method: "DELETE" });
      setRsvped(false);
      setRsvpCount(c => Math.max(0, c - 1));
    } else {
      const res = await fetch(`/api/spaces/${space.id}/rsvp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (res.ok) { setRsvped(true); setRsvpCount(c => c + 1); }
    }
    setRsvping(false);
  };

  return (
    <div className="group relative bg-gradient-to-br from-[#061426]/70 to-[#040a14]/70 hover:from-[#091b35]/90 hover:to-[#061224]/90 border border-emerald-500/20 hover:border-emerald-400/50 rounded-3xl p-5 transition-all duration-200 backdrop-blur-sm overflow-hidden flex flex-col">
      {/* Scheduled badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full px-3 py-1">
          <Calendar className="w-3 h-3 text-blue-300" />
          <span className="text-blue-200 text-[11px] font-black uppercase tracking-wide">Upcoming</span>
        </div>
        {space.scheduledAt && (
          <span className="text-emerald-300/80 text-xs font-semibold">{timeUntil(space.scheduledAt)}</span>
        )}
      </div>

      <h3 className="text-white font-black text-lg mb-1.5 leading-snug">{space.name}</h3>
      {space.description && <p className="text-slate-300 text-sm leading-relaxed line-clamp-2 mb-4">{space.description}</p>}

      {space.scheduledAt && (
        <div className="flex items-center gap-2 text-xs text-emerald-300/90 mb-4 bg-emerald-950/30 border border-emerald-500/20 rounded-xl px-3 py-2">
          <Clock className="w-3.5 h-3.5 text-lime-400" />
          <span>{formatScheduled(space.scheduledAt)}</span>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-emerald-900/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-emerald-400/40 bg-gradient-to-br from-emerald-600 to-teal-800">
            {space.host.image
              ? <img src={space.host.image} alt={space.host.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{space.host.name[0]}</span>
            }
          </div>
          <div className="text-white text-xs font-semibold truncate">{space.host.name}</div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {shareUrl && <CopyButton text={shareUrl} label="Share" />}
          <button
            onClick={toggleRsvp}
            disabled={rsvping}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              rsvped
                ? "bg-emerald-500/25 border border-emerald-400 text-lime-300"
                : "bg-white/10 hover:bg-white/18 text-white border border-white/10"
            }`}
          >
            <Users className="w-3 h-3" />
            <span>{rsvped ? "RSVP'd ✓" : `RSVP (${rsvpCount})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ProTalksInner() {
  const user           = useAppSelector(s => s.auth.user);
  const [spaces,        setSpaces]        = useState<Space[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [showPayModal,  setShowPayModal]  = useState(false);
  const [newShareToken, setNewShareToken] = useState<string | null>(null);

  const isAdmin       = user?.role === "ADMIN";
  const canHost       = isAdmin || user?.tier === "MARKETPLACE_PLUS";

  const searchParams  = useSearchParams();
  const hostPaid      = searchParams?.get("host_paid") === "1";
  const hostSessionId = searchParams?.get("session_id") ?? undefined;

  const fetchSpaces = useCallback(() => {
    fetch("/api/spaces").then(r => r.json()).then(setSpaces).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSpaces(); }, [fetchSpaces]);

  useEffect(() => {
    if (hostPaid && user && !canHost) setShowForm(true);
  }, [hostPaid, user, canHost]);

  const handleCreated = (space: Space) => {
    setSpaces(p => [space, ...p]);
    if (space.shareToken) setNewShareToken(space.shareToken);
    setShowForm(false);
  };

  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-[#040a14] via-[#061224] to-[#0a1c38] flex items-center justify-center px-4">
      <div className="text-center">
        <Mic01Icon className="w-16 h-16 text-emerald-400/40 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-white mb-2">Sign in to access Pro Talks</h1>
        <p className="text-slate-400 text-sm mb-6">Live audio and video rooms for professionals</p>
        <Link href="/login" className="inline-flex items-center gap-2 bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] font-black px-7 py-3 rounded-full hover:scale-105 transition-all">Sign In</Link>
      </div>
    </div>
  );

  const tierOrder    = ["FREE", "VIP", "MARKETPLACE", "MARKETPLACE_PLUS"];
  const userTierRank = tierOrder.indexOf(user.tier ?? "FREE");
  const canView      = isAdmin || userTierRank >= 1;
  const effectiveCanHost = canHost || (hostPaid && !!hostSessionId);

  if (!canView && !hostPaid) return (
    <div className="min-h-screen bg-gradient-to-br from-[#040a14] via-[#061224] to-[#0a1c38] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-lime-400 via-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
          <Mic01Icon className="w-10 h-10 text-[#060e1a]" />
        </div>
        <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
          <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" /> VIP Members Only
        </div>
        <h1 className="text-3xl font-black text-white mb-3 leading-tight">Unlock Pro Talks</h1>
        <p className="text-slate-300 text-sm leading-relaxed mb-8">
          Join live audio rooms hosted by verified professionals and industry experts.
          VIP members get full access — or pay a one-time fee to host your own session.
        </p>
        <div className="bg-gradient-to-br from-[#061426] to-[#0a1c38] rounded-2xl p-5 mb-4 text-white text-left border border-emerald-500/30">
          <div className="text-[11px] font-black uppercase tracking-widest text-lime-400 mb-2">VIP Membership</div>
          <div className="flex items-baseline gap-1 mb-1"><span className="text-3xl font-black">$39.99</span><span className="text-slate-400 text-sm">/month</span></div>
          <p className="text-slate-400 text-xs mb-4">Full platform access · Unlimited Pro Talks · Cancel anytime</p>
          <Link href="/upgrade" className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] font-black text-sm hover:opacity-90 transition-all">Upgrade to VIP</Link>
        </div>
        <div className="bg-gradient-to-br from-emerald-950/40 to-blue-950/30 rounded-2xl p-5 text-white text-left border border-emerald-500/30">
          <div className="text-[11px] font-black uppercase tracking-widest text-emerald-300 mb-2">Non-Member Hosting</div>
          <div className="flex items-baseline gap-1 mb-1"><span className="text-3xl font-black">$99.99</span><span className="text-slate-400 text-sm">per session</span></div>
          <p className="text-slate-400 text-xs mb-4">Host one live Pro Talk · Start now or schedule for later · Shareable invite link</p>
          <button id="pro-talk-gate-pay-btn" onClick={() => setShowPayModal(true)} className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] font-black text-sm hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/20">
            <Radio className="w-4 h-4" /> Pay $99.99 to Host
          </button>
        </div>
      </div>
      {showPayModal && <HostPaymentModal onClose={() => setShowPayModal(false)} />}
    </div>
  );

  const liveSpaces     = spaces.filter(s => s.isLive);
  const upcomingSpaces = spaces.filter(s => !s.isLive);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#040a14] via-[#061224] to-[#0a1c38]">
      {showPayModal && <HostPaymentModal onClose={() => setShowPayModal(false)} />}

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-emerald-950/60">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 pt-12 pb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            
            {/* Header branding with protalk.png */}
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
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse" />
                  <span className="text-lime-300 text-xs font-black uppercase tracking-widest">{liveSpaces.length} live now</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-300">PRO</span> TALKS
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-md">
                  Live audio &amp; video stages. Join a conversation or start your own.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {effectiveCanHost ? (
                <button
                  onClick={() => setShowForm(v => !v)}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] text-sm font-black transition-all shadow-xl shadow-emerald-500/30 hover:scale-105 shrink-0"
                >
                  <Add01Icon className="w-4 h-4" /> Host a Pro Talk
                </button>
              ) : (
                <button
                  id="pro-talk-host-header-btn"
                  onClick={() => setShowPayModal(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/50 text-emerald-300 hover:text-white text-sm font-bold transition-all shrink-0"
                >
                  <Add01Icon className="w-4 h-4 text-lime-400" /> Host a Pro Talk · $99.99
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Payment success banner */}
        {hostPaid && !canHost && (
          <div className="flex items-center gap-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl px-5 py-3.5">
            <Check className="w-5 h-5 text-lime-400 shrink-0" />
            <p className="text-emerald-200 text-sm font-semibold">Payment confirmed! You can now start your Pro Talk session below.</p>
          </div>
        )}

        {/* Share link after creation */}
        {newShareToken && (
          <div className="relative">
            <ShareLinkBanner token={newShareToken} />
            <button onClick={() => setNewShareToken(null)} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Create form */}
        {showForm && effectiveCanHost && (
          <CreateForm
            onClose={() => setShowForm(false)}
            onCreated={handleCreated}
            hostPaid={hostPaid}
            hostSessionId={hostSessionId}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
        ) : (
          <>
            {/* ── Live Now ── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse" />
                <h2 className="text-white font-black text-base uppercase tracking-wider text-sm">Live Now</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-lime-300 text-xs font-black">{liveSpaces.length}</span>
              </div>

              {liveSpaces.length === 0 ? (
                <div className="text-center py-14 bg-[#061426]/50 rounded-3xl border border-emerald-500/20 px-4">
                  <div className="relative w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.25)] bg-[#061224]">
                    <Image
                      src="/protalk.png"
                      alt="Pro Talks"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-slate-200 font-bold mb-1 text-base">No live sessions right now</p>
                  <p className="text-slate-400 text-sm">Check back later or start your own live stage</p>
                  {effectiveCanHost && (
                    <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] text-sm font-black hover:scale-105 transition-all shadow-md">
                      <Add01Icon className="w-4 h-4" /> Start a Pro Talk
                    </button>
                  )}
                  {!effectiveCanHost && (
                    <button id="pro-talk-empty-host-btn" onClick={() => setShowPayModal(true)} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-sm font-bold hover:bg-emerald-900/50 transition-all">
                      <Add01Icon className="w-4 h-4 text-lime-400" /> Host a Pro Talk · $99.99
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {liveSpaces.map(space => <LiveCard key={space.id} space={space} />)}
                </div>
              )}
            </section>

            {/* ── Upcoming ── */}
            {upcomingSpaces.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <h2 className="text-white font-black text-base uppercase tracking-wider text-sm">Upcoming</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black">{upcomingSpaces.length}</span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {upcomingSpaces.map(space => (
                    <UpcomingCard key={space.id} space={space} currentUserId={user?.id ?? ""} />
                  ))}
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
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#040a14] via-[#061224] to-[#0a1c38] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    }>
      <ProTalksInner />
    </Suspense>
  );
}
