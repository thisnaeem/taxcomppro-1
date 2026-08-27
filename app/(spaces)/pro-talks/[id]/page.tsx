"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Calendar, Clock, Users, Check, CheckCheck, Copy, Play } from "lucide-react";
import { Radio01Icon, Mic01Icon } from "hugeicons-react";
import SpaceRoom from "@/components/spaces/SpaceRoom";
import RsvpPanel from "@/components/spaces/RsvpPanel";

interface SpaceHost { id: string; name: string; image: string | null; headline: string | null; }
interface Space {
  id: string; name: string; description: string | null; roomName: string;
  isLive: boolean; scheduledAt: string | null; shareToken: string | null;
  endedAt: string | null;
  createdAt: string; host: SpaceHost; hostId: string;
  _count?: { rsvps: number };
}

function formatScheduled(d: string) {
  return new Date(d).toLocaleString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function useCountdown(target: string | null) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!target) return;
    const tick = () => setLeft(Math.max(0, new Date(target).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return { h, m, s, expired: left === 0 };
}

// ── Countdown pad ──────────────────────────────────────────────────────────────
function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-white/8 border border-white/12 flex items-center justify-center text-3xl font-black text-white">
        {String(value).padStart(2, "0")}
      </div>
      <span className="text-white/35 text-xs mt-1.5 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ── Guest Join Screen ──────────────────────────────────────────────────────────
function GuestJoinScreen({ space, onJoin }: { space: Space; onJoin: (displayName: string) => void; }) {
  const [name, setName]       = useState("");
  const [joining, setJoining] = useState(false);
  const handleJoin = () => { if (!name.trim() || joining) return; setJoining(true); onJoin(name.trim()); };
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#040a14] via-[#061224] to-[#0a1c38] flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="relative w-full max-w-sm text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-lime-300 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" /> Live Now
        </div>
        <div className="relative w-20 h-20 rounded-3xl overflow-hidden border-2 border-emerald-500/40 mx-auto mb-5 shadow-2xl shadow-emerald-500/30 bg-[#061224]">
          <Image src="/protalk.png" alt="Pro Talks" fill className="object-cover" />
        </div>
        <h1 className="text-2xl font-black text-white mb-1 leading-tight">{space.name}</h1>
        {space.description && <p className="text-slate-300 text-sm mb-2 leading-relaxed">{space.description}</p>}
        <p className="text-slate-400 text-xs mb-8">Hosted by <span className="text-emerald-400 font-bold">{space.host.name}</span></p>
        <div className="bg-[#061426]/90 border border-emerald-500/25 rounded-2xl p-5 text-left space-y-3">
          <label className="block text-emerald-300/80 text-xs font-semibold uppercase tracking-wider mb-1">Your display name</label>
          <input
            id="guest-name-input"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleJoin()}
            placeholder="Enter your name to join…"
            maxLength={40}
            autoFocus
            className="w-full bg-[#040a14] border border-emerald-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-400 transition-all text-sm"
          />
          <button
            id="guest-join-btn"
            onClick={handleJoin}
            disabled={!name.trim() || joining}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] font-black text-sm hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {joining ? <><Loader2 className="w-4 h-4 animate-spin text-[#060e1a]" /> Joining…</> : <><Mic01Icon className="w-4 h-4" /> Join Pro Talk</>}
          </button>
        </div>
        <p className="text-slate-500 text-xs mt-4">No account needed · Audio only</p>
      </div>
    </div>
  );
}

// ── Scheduled (pre-live) Screen ────────────────────────────────────────────────
function ScheduledScreen({
  space,
  isHost,
  currentUserId,
  onStartNow,
  starting,
}: {
  space: Space;
  isHost: boolean;
  currentUserId: string;
  onStartNow: () => void;
  starting: boolean;
}) {
  const { h, m, s, expired } = useCountdown(space.scheduledAt);
  const [rsvped,  setRsvped]  = useState(false);
  const [rsvping, setRsvping] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(space._count?.rsvps ?? 0);
  const [copied, setCopied] = useState(false);

  const shareUrl = space.shareToken
    ? (typeof window !== "undefined" ? `${window.location.origin}/pro-talks/invite/${space.shareToken}` : `/pro-talks/invite/${space.shareToken}`)
    : null;

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleRsvp = async () => {
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
    <div className="min-h-screen bg-gradient-to-br from-[#040a14] via-[#061224] to-[#0a1c38] flex flex-col">
      <div className="absolute -top-20 left-1/3 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 gap-8 relative">
        {/* Badge */}
        <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-300" />
          <span className="text-blue-200 text-xs font-bold uppercase tracking-widest">Scheduled</span>
        </div>

        {/* Room icon */}
        <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl shadow-emerald-500/30 bg-[#061224]">
          <Image src="/protalk.png" alt="Pro Talks" fill className="object-cover" />
        </div>

        {/* Title */}
        <div className="text-center max-w-lg">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 leading-tight">{space.name}</h1>
          {space.description && <p className="text-slate-300 text-sm leading-relaxed mb-3">{space.description}</p>}
          <div className="flex items-center justify-center gap-2 text-emerald-300 text-sm">
            <Clock className="w-4 h-4 text-lime-400" />
            {space.scheduledAt ? formatScheduled(space.scheduledAt) : ""}
          </div>
        </div>

        {/* Countdown */}
        {!expired && (
          <div className="flex items-center gap-3">
            <CountdownUnit value={h} label="hrs" />
            <span className="text-white/30 text-3xl font-black mb-3">:</span>
            <CountdownUnit value={m} label="min" />
            <span className="text-white/30 text-3xl font-black mb-3">:</span>
            <CountdownUnit value={s} label="sec" />
          </div>
        )}
        {expired && (
          <div className="text-lime-400 font-black text-lg animate-pulse">Starting any moment…</div>
        )}

        {/* RSVP count */}
        <div className="flex items-center gap-1.5 text-slate-400 text-sm">
          <Users className="w-4 h-4" />
          <span>{rsvpCount} {rsvpCount === 1 ? "person" : "people"} RSVP'd</span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* RSVP button (non-host only) */}
          {currentUserId && !isHost && (
            <button
              id="detail-rsvp-btn"
              onClick={toggleRsvp}
              disabled={rsvping}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg ${
                rsvped
                  ? "bg-emerald-500/30 border border-emerald-400/50 text-lime-300"
                  : "bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] font-black hover:scale-105 shadow-emerald-500/25"
              }`}
            >
              {rsvping ? <Loader2 className="w-4 h-4 animate-spin" /> : rsvped ? <><CheckCheck className="w-4 h-4" /> You're in!</> : <><Check className="w-4 h-4" /> RSVP to Attend</>}
            </button>
          )}

          {/* Copy invite link */}
          {shareUrl && (
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 text-emerald-300 hover:text-white text-sm font-semibold transition-all"
            >
              {copied ? <CheckCheck className="w-4 h-4 text-lime-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Invite Link"}
            </button>
          )}

          {/* Host: Start Now */}
          {isHost && (
            <button
              id="host-start-now-btn"
              onClick={onStartNow}
              disabled={starting}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-black hover:from-rose-400 hover:to-pink-500 transition-all shadow-lg shadow-rose-500/25 disabled:opacity-50"
            >
              {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              {starting ? "Starting…" : "Start Now"}
            </button>
          )}
        </div>

        {/* Back link */}
        <Link href="/pro-talks" className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Back to Pro Talks
        </Link>
      </div>

      {/* Host RSVP panel */}
      {isHost && (
        <div className="max-w-xl mx-auto w-full px-4 pb-12">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Host View · RSVP List</p>
          <RsvpPanel spaceId={space.id} />
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ProTalkPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [space,         setSpace]         = useState<Space | null>(null);
  const [token,         setToken]         = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [isAdmin,       setIsAdmin]       = useState(false);
  const [userId,        setUserId]        = useState("");
  const [ending,        setEnding]        = useState(false);
  const [starting,      setStarting]      = useState(false);
  const [isGuest,       setIsGuest]       = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [spaceData, tokenData, me] = await Promise.all([
        fetch(`/api/spaces/${id}`).then(r => r.json()),
        fetch(`/api/spaces/${id}/token`, { method: "POST" }).then(r => r.json()),
        fetch("/api/user/me").then(r => r.json()).catch(() => null),
      ]);

      if (spaceData.error) { setError(spaceData.error); return; }
      setSpace(spaceData as Space);

      // Always resolve identity from /api/user/me — even for scheduled (non-live) spaces
      // where the token endpoint returns an error. This ensures userId is set so the
      // RSVP button shows for non-host members on the countdown screen.
      if (me?.id) { setUserId(me.id); setIsAdmin(me.role === "ADMIN"); }

      if (tokenData.error) {
        setIsGuest(!me?.id); // only truly a guest if not logged in
        // Only show guest join form if the space is actually live
        if (spaceData.isLive && !me?.id) setShowGuestForm(true);
      } else {
        setToken(tokenData.token as string);
      }
    } catch {
      setError("Failed to load Pro Talk");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleGuestJoin = async (displayName: string) => {
    setShowGuestForm(false);
    setLoading(true);
    try {
      const res  = await fetch(`/api/spaces/${id}/guest-token`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setToken(data.token as string);
    } catch {
      setError("Failed to join as guest.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (ending) return;
    setEnding(true);
    await fetch(`/api/spaces/${id}`, { method: "DELETE" });
    router.push("/pro-talks");
  };

  const handleStartNow = async () => {
    if (starting || !space) return;
    setStarting(true);
    const res = await fetch(`/api/spaces/${id}`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json() as Space;
      setSpace(updated);
      // Now fetch a token since the space is live
      const tokenRes = await fetch(`/api/spaces/${id}/token`, { method: "POST" });
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        if (tokenData.token) setToken(tokenData.token);
      }
    }
    setStarting(false);
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 bg-[#06091a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
          <Radio01Icon className="w-7 h-7 text-white" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        <p className="text-white/40 text-sm">Loading Pro Talk…</p>
      </div>
    </div>
  );

  // Guest name form (space loaded + live, user not signed in)
  if (showGuestForm && space) return <GuestJoinScreen space={space} onJoin={handleGuestJoin} />;

  // Scheduled (not yet live) screen
  if (space && !space.isLive && !space.endedAt) {
    const isHostUser = space.hostId === userId || isAdmin;
    // If host is here and already has a token, we show the scheduled screen too (they can start)
    return (
      <ScheduledScreen
        space={space}
        isHost={isHostUser}
        currentUserId={userId}
        onStartNow={handleStartNow}
        starting={starting}
      />
    );
  }

  if (error || !space || !token) return (
    <div className="fixed inset-0 z-50 bg-[#06091a] flex flex-col items-center justify-center gap-5">
      <p className="text-white/50 text-lg">{error ?? "Pro Talk unavailable"}</p>
      <button onClick={() => router.push("/pro-talks")} className="px-6 py-2.5 rounded-full bg-violet-600 text-white font-bold text-sm hover:bg-violet-500 transition-all">
        Back to Pro Talks
      </button>
    </div>
  );

  return (
    <SpaceRoom
      space={space}
      token={token}
      isAdmin={isAdmin}
      userId={userId}
      onEnd={handleEnd}
      ending={ending}
    />
  );
}
