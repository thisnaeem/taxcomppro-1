"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Radio01Icon, Mic01Icon } from "hugeicons-react";
import SpaceRoom from "@/components/spaces/SpaceRoom";

interface SpaceHost { id: string; name: string; image: string | null; headline: string | null; }
interface Space { id: string; name: string; description: string | null; roomName: string; isLive: boolean; createdAt: string; host: SpaceHost; hostId: string; }

// ── Guest Join Screen ────────────────────────────────────────────────────────
function GuestJoinScreen({
  space,
  onJoin,
}: {
  space: Space;
  onJoin: (displayName: string) => void;
}) {
  const [name, setName]     = useState("");
  const [joining, setJoining] = useState(false);

  const handleJoin = () => {
    if (!name.trim() || joining) return;
    setJoining(true);
    onJoin(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#06091a] via-[#0d1635] to-[#0a0e26] flex items-center justify-center p-4">
      {/* Ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-700/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-700/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-sm text-center">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Live Now
        </div>

        {/* Room icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-violet-500/30">
          <Radio01Icon className="w-9 h-9 text-white" />
        </div>

        {/* Room info */}
        <h1 className="text-2xl font-black text-white mb-1 leading-tight">{space.name}</h1>
        {space.description && (
          <p className="text-white/40 text-sm mb-2 leading-relaxed">{space.description}</p>
        )}
        <p className="text-white/30 text-xs mb-8">
          Hosted by <span className="text-white/60 font-semibold">{space.host.name}</span>
        </p>

        {/* Name entry */}
        <div className="bg-white/6 border border-white/12 rounded-2xl p-5 text-left space-y-3">
          <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
            Your display name
          </label>
          <input
            id="guest-name-input"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleJoin()}
            placeholder="Enter your name to join…"
            maxLength={40}
            autoFocus
            className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 outline-none focus:border-violet-500 transition-all text-sm"
          />
          <button
            id="guest-join-btn"
            onClick={handleJoin}
            disabled={!name.trim() || joining}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm hover:from-violet-500 hover:to-indigo-500 transition-all shadow-xl shadow-violet-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {joining
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
              : <><Mic01Icon className="w-4 h-4" /> Join Pro Talk</>
            }
          </button>
        </div>

        <p className="text-white/20 text-xs mt-4">No account needed · Audio only</p>
      </div>
    </div>
  );
}

export default function ProTalkPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [space,     setSpace]     = useState<Space | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [isAdmin,   setIsAdmin]   = useState(false);
  const [userId,    setUserId]    = useState("");
  const [ending,    setEnding]    = useState(false);

  // Guest join state
  const [isGuest,       setIsGuest]       = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Fetch space info + try to get a member token
    Promise.all([
      fetch(`/api/spaces/${id}`).then(r => r.json()),
      fetch(`/api/spaces/${id}/token`, { method: "POST" }).then(r => r.json()),
      fetch("/api/user/me").then(r => r.json()).catch(() => null),
    ]).then(([spaceData, tokenData, me]) => {
      if (spaceData.error) { setError(spaceData.error); return; }
      setSpace(spaceData as Space);

      if (tokenData.error) {
        // Not authenticated → guest flow
        setIsGuest(true);
        setShowGuestForm(true);
      } else {
        setToken(tokenData.token as string);
        if (me?.id) { setUserId(me.id); setIsAdmin(me.role === "ADMIN"); }
      }
    }).catch(() => setError("Failed to load Pro Talk"))
      .finally(() => setLoading(false));
  }, [id]);

  // Guest submits their display name
  const handleGuestJoin = async (displayName: string) => {
    setShowGuestForm(false);
    setLoading(true);
    try {
      const res  = await fetch(`/api/spaces/${id}/guest-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  // Loading
  if (loading) return (
    <div className="fixed inset-0 z-50 bg-[#06091a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
          <Radio01Icon className="w-7 h-7 text-white" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        <p className="text-white/40 text-sm">Joining Pro Talk…</p>
      </div>
    </div>
  );

  // Guest name form (space loaded, user not signed in)
  if (showGuestForm && space) return (
    <GuestJoinScreen space={space} onJoin={handleGuestJoin} />
  );

  // Error
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
