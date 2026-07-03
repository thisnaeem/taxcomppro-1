"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import {
  Loader2, X, Check, Zap, CreditCard, Radio, Copy, CheckCheck,
  Calendar, Clock, Users,
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
        <span key={i} className="w-[2px] bg-rose-400 rounded-full animate-pulse"
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
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/18 text-white/60 hover:text-white text-xs font-semibold transition-all shrink-0"
    >
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-5 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-emerald-300 text-sm font-bold mb-0.5">🔗 Share this invite link</p>
        <p className="text-white/40 text-xs truncate">{url}</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gradient-to-br from-[#0d1635] to-[#0a0e26] border border-white/15 rounded-3xl p-7 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Radio01Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-black text-xl leading-tight">Host a Pro Talk</h2>
            <p className="text-white/40 text-sm">One-time session payment</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/15 border border-violet-500/30 rounded-2xl p-5 mb-6">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-black text-white">$99.99</span>
            <span className="text-white/40 text-sm ml-1">one-time</span>
          </div>
          <p className="text-white/50 text-sm mb-4">Pay once, host one live Pro Talk audio room.</p>
          <ul className="space-y-2">
            {[
              "Start instantly or schedule for later",
              "Get a shareable invite link",
              "No subscription or recurring charges",
              "Full audio room features",
            ].map(perk => (
              <li key={perk} className="flex items-center gap-2 text-white/65 text-sm">
                <Zap className="w-3.5 h-3.5 text-violet-400 shrink-0 fill-violet-400/30" />{perk}
              </li>
            ))}
          </ul>
        </div>
        <button
          id="pro-talk-pay-btn"
          onClick={handlePay}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-base hover:from-violet-500 hover:to-indigo-500 transition-all shadow-xl shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting to Stripe…</>
            : <><CreditCard className="w-5 h-5" /> Pay $99.99 &amp; Host Now</>
          }
        </button>
        <p className="text-center text-white/25 text-xs mt-3">Secure payment via Stripe · No hidden fees</p>
        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <p className="text-white/35 text-xs">Want unlimited hosting?</p>
          <Link href="/upgrade" onClick={onClose} className="text-violet-400 hover:text-violet-300 text-xs font-semibold transition-colors">
            Upgrade to VIP ($39.99/mo) →
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

  // Build min datetime string for the picker (now + 5 min)
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
    <div className="relative bg-gradient-to-br from-white/8 to-white/4 border border-white/15 rounded-3xl p-6 backdrop-blur-sm">
      <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all">
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <Radio01Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-base">Host a Pro Talk</h2>
          <p className="text-white/40 text-xs">Set up your audio room</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/6 rounded-xl p-1 mb-5">
        <button
          id="protalk-tab-now"
          onClick={() => setTab("now")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "now"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
              : "text-white/50 hover:text-white"
          }`}
        >
          <Radio className="w-4 h-4" /> Start Now
        </button>
        <button
          id="protalk-tab-schedule"
          onClick={() => setTab("schedule")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "schedule"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
              : "text-white/50 hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4" /> Schedule
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="What are we talking about?"
          className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-violet-500 transition-all text-sm"
        />
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Description (optional)…"
          rows={2}
          className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-violet-500 transition-all text-sm resize-none"
        />

        {tab === "schedule" && (
          <div>
            <label className="block text-white/50 text-xs font-semibold mb-1.5 uppercase tracking-wide">
              <Clock className="w-3 h-3 inline mr-1" />Date &amp; Time
            </label>
            <input
              type="datetime-local"
              value={schedDate}
              min={minDateTime}
              onChange={e => setSchedDate(e.target.value)}
              className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 transition-all text-sm [color-scheme:dark]"
            />
          </div>
        )}

        <button
          id="protalk-create-btn"
          onClick={handleCreate}
          disabled={!name.trim() || creating || (tab === "schedule" && !schedDate)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {creating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
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
      className="group relative bg-gradient-to-br from-white/6 to-white/3 hover:from-white/10 hover:to-white/5 border border-white/10 hover:border-violet-500/40 rounded-3xl p-5 transition-all duration-200 backdrop-blur-sm overflow-hidden flex flex-col"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/30 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-rose-300 text-[11px] font-bold uppercase tracking-wide">Live</span>
          </div>
          <LiveWave />
        </div>
        <span className="text-white/30 text-xs">{timeAgo(space.createdAt)}</span>
      </div>
      <h3 className="text-white font-bold text-base mb-1.5 group-hover:text-violet-200 transition-colors leading-snug">{space.name}</h3>
      {space.description && <p className="text-white/45 text-sm leading-relaxed line-clamp-2 mb-4">{space.description}</p>}
      <div className="mt-auto flex items-center gap-3 pt-3 border-t border-white/8">
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-violet-500/40" style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)" }}>
          {space.host.image
            ? <img src={space.host.image} alt={space.host.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            : <span className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{space.host.name[0]}</span>
          }
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-white/80 text-xs font-semibold truncate">{space.host.name}</div>
          {space.host.headline && <div className="text-white/35 text-[11px] truncate">{space.host.headline}</div>}
        </div>
        <div className="flex items-center gap-1 text-white/35 text-xs shrink-0">
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
    <div className="group relative bg-gradient-to-br from-white/5 to-white/2 border border-white/10 hover:border-indigo-500/40 rounded-3xl p-5 transition-all duration-200 backdrop-blur-sm overflow-hidden flex flex-col">
      {/* Scheduled badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-2.5 py-1">
          <Calendar className="w-3 h-3 text-indigo-300" />
          <span className="text-indigo-200 text-[11px] font-bold uppercase tracking-wide">Upcoming</span>
        </div>
        {space.scheduledAt && (
          <span className="text-violet-300/70 text-xs font-semibold">{timeUntil(space.scheduledAt)}</span>
        )}
      </div>

      <h3 className="text-white font-bold text-base mb-1 group-hover:text-indigo-200 transition-colors leading-snug">{space.name}</h3>
      {space.description && <p className="text-white/40 text-sm leading-relaxed line-clamp-2 mb-2">{space.description}</p>}

      {space.scheduledAt && (
        <div className="flex items-center gap-1.5 text-white/50 text-xs mb-4">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          {formatScheduled(space.scheduledAt)}
        </div>
      )}

      <div className="mt-auto space-y-3">
        {/* Host row */}
        <div className="flex items-center gap-3 pt-3 border-t border-white/8">
          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-indigo-500/40" style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)" }}>
            {space.host.image
              ? <img src={space.host.image} alt={space.host.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center text-white text-[11px] font-bold">{space.host.name[0]}</span>
            }
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white/70 text-xs font-semibold truncate">{space.host.name}</div>
          </div>
          <div className="flex items-center gap-1 text-white/30 text-xs">
            <Users className="w-3 h-3" />{rsvpCount}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {currentUserId && (
            <button
              id={`rsvp-btn-${space.id}`}
              onClick={toggleRsvp}
              disabled={rsvping}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                rsvped
                  ? "bg-indigo-500/30 border border-indigo-400/50 text-indigo-200 hover:bg-rose-500/20 hover:border-rose-400/40 hover:text-rose-300"
                  : "bg-indigo-600/25 border border-indigo-500/30 text-indigo-200 hover:bg-indigo-600/50"
              }`}
            >
              {rsvping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : rsvped ? <><CheckCheck className="w-3.5 h-3.5" /> RSVPed</> : <><Check className="w-3.5 h-3.5" /> RSVP</>}
            </button>
          )}
          {shareUrl && <CopyButton text={shareUrl} label="Share" />}
          <Link
            href={`/pro-talks/${space.id}`}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white/8 hover:bg-white/14 text-white/50 hover:text-white text-xs font-semibold transition-all"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Inner Page ─────────────────────────────────────────────────────────────────
function ProTalksInner() {
  const user    = useAppSelector(s => s.auth.user);
  const isAdmin = user?.role === "ADMIN";
  const canHost = isAdmin || user?.tier === "MARKETPLACE_PLUS";

  const [spaces,        setSpaces]        = useState<Space[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [showPayModal,  setShowPayModal]  = useState(false);
  const [newShareToken, setNewShareToken] = useState<string | null>(null);

  const searchParams  = useSearchParams();
  const hostPaid      = searchParams?.get("host_paid") === "1";
  const hostSessionId = searchParams?.get("session_id") ?? undefined;

  const fetchSpaces = useCallback(() => {
    fetch("/api/spaces").then(r => r.json()).then(setSpaces).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSpaces(); }, [fetchSpaces]);

  // After one-time payment redirect — auto-open the create form
  useEffect(() => {
    if (hostPaid && user && !canHost) setShowForm(true);
  }, [hostPaid, user, canHost]);

  const handleCreated = (space: Space) => {
    setSpaces(p => [space, ...p]);
    if (space.shareToken) setNewShareToken(space.shareToken);
    setShowForm(false);
  };

  // ── Login gate ─────────────────────────────────────────────────────────────
  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-[#06091a] via-[#0d1635] to-[#0a0e26] flex items-center justify-center px-4">
      <div className="text-center">
        <Mic01Icon className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-white mb-2">Sign in to access Pro Talks</h1>
        <p className="text-white/40 text-sm mb-6">Live audio rooms for tax professionals</p>
        <Link href="/login" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-full hover:from-violet-500 hover:to-indigo-500 transition-all">Sign In</Link>
      </div>
    </div>
  );

  const tierOrder    = ["FREE", "VIP", "MARKETPLACE", "MARKETPLACE_PLUS"];
  const userTierRank = tierOrder.indexOf(user.tier ?? "FREE");
  const canView      = isAdmin || userTierRank >= 1;
  const effectiveCanHost = canHost || (hostPaid && !!hostSessionId);

  // Full access gate for FREE users
  if (!canView && !hostPaid) return (
    <div className="min-h-screen bg-gradient-to-br from-[#06091a] via-[#0d1635] to-[#0a0e26] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/20">
          <Mic01Icon className="w-10 h-10 text-white" />
        </div>
        <div className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
          <Zap className="w-3.5 h-3.5 fill-violet-400" /> VIP Members Only
        </div>
        <h1 className="text-3xl font-black text-white mb-3 leading-tight">Unlock Pro Talks</h1>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          Join live audio rooms hosted by tax professionals and industry experts.
          VIP members get full access — or pay a one-time fee to host your own session.
        </p>
        <div className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] rounded-2xl p-5 mb-4 text-white text-left border border-white/10">
          <div className="text-[11px] font-black uppercase tracking-widest text-[#f0c040] mb-2">VIP Membership</div>
          <div className="flex items-baseline gap-1 mb-1"><span className="text-3xl font-black">$39.99</span><span className="text-white/50 text-sm">/month</span></div>
          <p className="text-white/40 text-xs mb-4">Full platform access · Unlimited Pro Talks · Cancel anytime</p>
          <Link href="/upgrade" className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-black text-sm hover:opacity-90 transition-all">Upgrade to VIP</Link>
        </div>
        <div className="bg-gradient-to-br from-violet-600/15 to-indigo-600/10 rounded-2xl p-5 text-white text-left border border-violet-500/25">
          <div className="text-[11px] font-black uppercase tracking-widest text-violet-400 mb-2">Non-Member Hosting</div>
          <div className="flex items-baseline gap-1 mb-1"><span className="text-3xl font-black">$99.99</span><span className="text-white/50 text-sm">per session</span></div>
          <p className="text-white/40 text-xs mb-4">Host one live Pro Talk · Start now or schedule for later · Shareable invite link</p>
          <button id="pro-talk-gate-pay-btn" onClick={() => setShowPayModal(true)} className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20">
            <Radio className="w-4 h-4" /> Pay $99.99 to Host
          </button>
        </div>
        <p className="text-xs text-white/25 mt-5">Already a VIP member? Try refreshing the page.</p>
      </div>
      {showPayModal && <HostPaymentModal onClose={() => setShowPayModal(false)} />}
    </div>
  );

  // Split spaces into live and upcoming
  const liveSpaces     = spaces.filter(s => s.isLive);
  const upcomingSpaces = spaces.filter(s => !s.isLive);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#06091a] via-[#0d1635] to-[#0a0e26]">
      {showPayModal && <HostPaymentModal onClose={() => setShowPayModal(false)} />}

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
                <span className="text-rose-300 text-xs font-bold uppercase tracking-widest">{liveSpaces.length} live now</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">Pro Talks</h1>
              <p className="text-white/40 text-sm mt-2 max-w-sm">Live audio rooms. Join a conversation or start your own.</p>
            </div>

            <div className="flex items-center gap-3">
              {effectiveCanHost ? (
                <button
                  onClick={() => setShowForm(v => !v)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold transition-all shadow-xl shadow-violet-500/25 shrink-0"
                >
                  <Add01Icon className="w-4 h-4" /> Host a Pro Talk
                </button>
              ) : (
                <button
                  id="pro-talk-host-header-btn"
                  onClick={() => setShowPayModal(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-violet-600/25 border border-violet-500/30 hover:bg-violet-600/40 text-violet-200 hover:text-white text-sm font-bold transition-all shrink-0"
                >
                  <Add01Icon className="w-4 h-4" /> Host a Pro Talk · $99.99
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-16 space-y-8">

        {/* Payment success banner */}
        {hostPaid && !canHost && (
          <div className="flex items-center gap-3 bg-violet-600/20 border border-violet-500/30 rounded-2xl px-5 py-3.5">
            <Check className="w-5 h-5 text-violet-400 shrink-0" />
            <p className="text-violet-200 text-sm font-semibold">Payment confirmed! You can now start your Pro Talk session below.</p>
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
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-violet-400" /></div>
        ) : (
          <>
            {/* ── Live Now ── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <h2 className="text-white font-bold text-base uppercase tracking-wider text-sm">Live Now</h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-xs font-bold">{liveSpaces.length}</span>
              </div>

              {liveSpaces.length === 0 ? (
                <div className="text-center py-12 bg-white/3 rounded-3xl border border-white/8">
                  <Mic01Icon className="w-10 h-10 text-white/15 mx-auto mb-3" />
                  <p className="text-white/35 font-semibold mb-1">No live sessions right now</p>
                  <p className="text-white/20 text-sm">Check back later or start your own</p>
                  {effectiveCanHost && (
                    <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600/30 border border-violet-500/30 text-violet-300 text-sm font-bold hover:bg-violet-600/50 transition-all">
                      <Add01Icon className="w-4 h-4" /> Start a Pro Talk
                    </button>
                  )}
                  {!effectiveCanHost && (
                    <button id="pro-talk-empty-host-btn" onClick={() => setShowPayModal(true)} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600/20 border border-violet-500/25 text-violet-300 text-sm font-bold hover:bg-violet-600/35 transition-all">
                      <Add01Icon className="w-4 h-4" /> Host a Pro Talk · $99.99
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {liveSpaces.map(space => <LiveCard key={space.id} space={space} />)}
                </div>
              )}
            </section>

            {/* ── Upcoming ── */}
            {upcomingSpaces.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-white font-bold text-base uppercase tracking-wider text-sm">Upcoming</h2>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-bold">{upcomingSpaces.length}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
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
      <div className="min-h-screen bg-gradient-to-br from-[#06091a] via-[#0d1635] to-[#0a0e26] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    }>
      <ProTalksInner />
    </Suspense>
  );
}
