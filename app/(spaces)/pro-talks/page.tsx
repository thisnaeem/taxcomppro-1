"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { Loader2, X, Check, Zap, CreditCard, Radio } from "lucide-react";
import { Mic01Icon, Radio01Icon, UserGroupIcon, Add01Icon } from "hugeicons-react";

interface SpaceHost { id: string; name: string; image: string | null; headline: string | null; }
interface Space { id: string; name: string; description: string | null; roomName: string; isLive: boolean; createdAt: string; host: SpaceHost; }

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
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

// ── Host Payment Modal (one-time $99.99) ──────────────────────────────────────
function HostPaymentModal({ onClose }: { onClose: () => void }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gradient-to-br from-[#0d1635] to-[#0a0e26] border border-white/15 rounded-3xl p-7 shadow-2xl">

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all">
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Radio01Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-black text-xl leading-tight">Host a Pro Talk</h2>
            <p className="text-white/40 text-sm">One-time session payment</p>
          </div>
        </div>

        {/* Price card */}
        <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/15 border border-violet-500/30 rounded-2xl p-5 mb-6">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-black text-white">$99.99</span>
            <span className="text-white/40 text-sm ml-1">one-time</span>
          </div>
          <p className="text-white/50 text-sm mb-4">Pay once, host one live Pro Talk audio room.</p>
          <ul className="space-y-2">
            {[
              "Host one live session instantly",
              "No subscription or recurring charges",
              "Full audio room features",
              "Listed publicly for all members to join",
            ].map(perk => (
              <li key={perk} className="flex items-center gap-2 text-white/65 text-sm">
                <Zap className="w-3.5 h-3.5 text-violet-400 shrink-0 fill-violet-400/30" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
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

        <p className="text-center text-white/25 text-xs mt-3">
          Secure payment via Stripe · No hidden fees
        </p>

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

function ProTalksInner() {
  const user    = useAppSelector(s => s.auth.user);
  const isAdmin = user?.role === "ADMIN";
  const canHost = isAdmin || user?.tier === "MARKETPLACE_PLUS";

  const [spaces, setSpaces]             = useState<Space[]>([]);
  const [loading, setLoading]           = useState(true);
  const [creating, setCreating]         = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [name, setName]                 = useState("");
  const [desc, setDesc]                 = useState("");

  const searchParams  = useSearchParams();
  const hostPaid      = searchParams?.get("host_paid") === "1";
  const hostSessionId = searchParams?.get("session_id") ?? undefined;

  useEffect(() => {
    fetch("/api/spaces").then(r => r.json()).then(setSpaces).finally(() => setLoading(false));
  }, []);

  // After one-time payment redirect — auto-open the create form
  useEffect(() => {
    if (hostPaid && user && !canHost) setShowForm(true);
  }, [hostPaid, user, canHost]);

  // ── Login gate ────────────────────────────────────────────────────────────
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

  // ── FREE tier: can VIEW rooms but must pay to HOST ──────────────────────
  const tierOrder    = ["FREE", "VIP", "MARKETPLACE", "MARKETPLACE_PLUS"];
  const userTierRank = tierOrder.indexOf(user.tier ?? "FREE");
  const canView      = isAdmin || userTierRank >= 1; // VIP and above can view

  // Effective host capability — canHost OR just paid via one-time session
  const effectiveCanHost = canHost || (hostPaid && !!hostSessionId);

  // Full access gate for FREE users who haven't paid yet (non-VIP, no session)
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

        {/* Upgrade to VIP card */}
        <div className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] rounded-2xl p-5 mb-4 text-white text-left border border-white/10">
          <div className="text-[11px] font-black uppercase tracking-widest text-[#f0c040] mb-2">VIP Membership</div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-black">$39.99</span>
            <span className="text-white/50 text-sm">/month</span>
          </div>
          <p className="text-white/40 text-xs mb-4">Full platform access · Unlimited Pro Talks · Cancel anytime</p>
          <Link href="/upgrade" className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-black text-sm hover:opacity-90 transition-all">
            Upgrade to VIP
          </Link>
        </div>

        {/* Host one-time */}
        <div className="bg-gradient-to-br from-violet-600/15 to-indigo-600/10 rounded-2xl p-5 text-white text-left border border-violet-500/25">
          <div className="text-[11px] font-black uppercase tracking-widest text-violet-400 mb-2">Non-Member Hosting</div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-black">$99.99</span>
            <span className="text-white/50 text-sm">per session</span>
          </div>
          <p className="text-white/40 text-xs mb-4">Host one live Pro Talk · No subscription required</p>
          <button
            id="pro-talk-gate-pay-btn"
            onClick={() => setShowPayModal(true)}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20"
          >
            <Radio className="w-4 h-4" /> Pay $99.99 to Host
          </button>
        </div>

        <p className="text-xs text-white/25 mt-5">Already a VIP member? Try refreshing the page.</p>
      </div>

      {showPayModal && <HostPaymentModal onClose={() => setShowPayModal(false)} />}
    </div>
  );

  // ── Main page (VIP+ users or just-paid one-time users) ──────────────────
  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    const body: Record<string, string> = { name, description: desc };
    if (hostPaid && hostSessionId && !canHost) body.hostSessionId = hostSessionId;
    const res = await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const space = await res.json() as Space;
      setSpaces(p => [space, ...p]);
      setShowForm(false);
      setName("");
      setDesc("");
    }
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#06091a] via-[#0d1635] to-[#0a0e26]">
      {showPayModal && <HostPaymentModal onClose={() => setShowPayModal(false)} />}

      <div className="relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
                <span className="text-rose-300 text-xs font-bold uppercase tracking-widest">{spaces.length} live now</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">Pro Talks</h1>
              <p className="text-white/40 text-sm mt-2 max-w-sm">Live audio rooms. Join a conversation or start your own.</p>
            </div>

            <div className="flex items-center gap-3">
              {effectiveCanHost ? (
                <button onClick={() => setShowForm(v => !v)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold transition-all shadow-xl shadow-violet-500/25 shrink-0">
                  <Add01Icon className="w-4 h-4" /> Start a Pro Talk
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

      <div className="max-w-5xl mx-auto px-4 pb-16 space-y-6">

        {/* Payment success banner */}
        {hostPaid && !canHost && (
          <div className="flex items-center gap-3 bg-violet-600/20 border border-violet-500/30 rounded-2xl px-5 py-3.5">
            <Check className="w-5 h-5 text-violet-400 shrink-0" />
            <p className="text-violet-200 text-sm font-semibold">Payment confirmed! You can now start your Pro Talk session below.</p>
          </div>
        )}

        {/* Create form */}
        {showForm && effectiveCanHost && (
          <div className="relative bg-gradient-to-br from-white/8 to-white/4 border border-white/15 rounded-3xl p-6 backdrop-blur-sm">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Radio01Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base">Start a new Pro Talk</h2>
                <p className="text-white/40 text-xs">Your room goes live instantly</p>
              </div>
            </div>
            <div className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="What are we talking about?" className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-violet-500 transition-all text-sm" />
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)…" rows={2} className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-violet-500 transition-all text-sm resize-none" />
              <button onClick={handleCreate} disabled={!name.trim() || creating} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold transition-all shadow-lg disabled:opacity-40">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio01Icon className="w-4 h-4" />} Go Live Now
              </button>
            </div>
          </div>
        )}

        {/* Spaces list */}
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-violet-400" /></div>
        ) : spaces.length === 0 ? (
          <div className="text-center py-24 space-y-5">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Mic01Icon className="w-10 h-10 text-white/20" />
            </div>
            <div>
              <p className="text-white/50 text-xl font-bold mb-1">No Pro Talks live right now</p>
              <p className="text-white/25 text-sm">Check back later or start your own conversation</p>
            </div>
            {effectiveCanHost && (
              <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-violet-600/30 border border-violet-500/30 text-violet-300 text-sm font-bold hover:bg-violet-600/50 transition-all">
                <Add01Icon className="w-4 h-4" /> Start the first Pro Talk
              </button>
            )}
            {!effectiveCanHost && (
              <button
                id="pro-talk-empty-host-btn"
                onClick={() => setShowPayModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-violet-600/20 border border-violet-500/25 text-violet-300 text-sm font-bold hover:bg-violet-600/35 transition-all"
              >
                <Add01Icon className="w-4 h-4" /> Host a Pro Talk · $99.99 one-time
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {spaces.map(space => (
              <Link key={space.id} href={`/pro-talks/${space.id}`}
                className="group relative bg-gradient-to-br from-white/6 to-white/3 hover:from-white/10 hover:to-white/5 border border-white/10 hover:border-violet-500/40 rounded-3xl p-5 transition-all duration-200 backdrop-blur-sm overflow-hidden">
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
                <div className="flex items-center gap-3 pt-3 border-t border-white/8">
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
                  <div className="flex items-center gap-1 text-white/35 text-xs">
                    <UserGroupIcon className="w-3.5 h-3.5" /><span>Tap to join</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
