"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { TOOLKITS, BUNDLES, type Toolkit, type Bundle } from "@/lib/toolkits";
import { Check, Download, Loader2, Lock, Zap, ShieldCheck, Star } from "lucide-react";

/* ─── Shared card styles ─── */
const CARD = "group flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/80 cursor-pointer";
const tierLabel = (t: string, m: number) =>
  `${m} Months ${t === "VIP" ? "VIP" : t === "MARKETPLACE_PLUS" ? "Marketplace Plus" : "Marketplace"} FREE`;

/* ─── Individual Toolkit Card ─── */
function ToolkitCard({ tk }: { tk: Toolkit }) {
  const router = useRouter();
  const user   = useAppSelector(s => s.auth.user);
  const [loading, setLoading] = useState(false);
  const [agreed,  setAgreed]  = useState(false);

  const buy = async () => {
    if (!user) { router.push("/login?next=/toolkits"); return; }
    if (!agreed) return;
    setLoading(true);
    const res  = await fetch("/api/stripe/toolkit-checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolkitId: tk.id }),
    });
    const data = await res.json() as { url?: string };
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  };

  return (
    <div className={CARD}>
      {/* White header with badge */}
      <div className="bg-white px-6 pt-8 pb-5 flex flex-col items-center border-b border-slate-100">
        <div className="w-48 h-48 mb-4 flex items-center justify-center overflow-hidden">
          <img src={tk.badgeImage} alt={tk.name} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" />
        </div>
        <h3 className="font-black text-base text-[#0a1628] uppercase tracking-wide text-center leading-tight mb-2 transition-colors duration-200 group-hover:text-[#1a3a6b]">
          {tk.name}
        </h3>
        {tk.membershipMonths > 0 && (
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            {tierLabel(tk.membershipTier, tk.membershipMonths)}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="flex-1 px-5 py-4 bg-white">
        <ul className="space-y-2.5">
          {tk.features.map(f => (
            <li key={f} className="flex items-start gap-2 text-base text-slate-600">
              <Check className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />{f}
            </li>
          ))}
        </ul>
      </div>

      {/* Price + CTA — visible to all; guests redirected to login on buy */}
      <div className="px-5 pb-5 pt-4 bg-white border-t border-slate-100">
        <div className="text-center mb-3">
          <span className="text-4xl font-black text-[#0a1628]">${tk.price}</span>
          {tk.membershipMonths > 0 && (
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
              + {tierLabel(tk.membershipTier, tk.membershipMonths)}
            </p>
          )}
        </div>
        {user ? (
          <>
            <label className="flex items-start gap-2 mb-3 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 rounded w-3.5 h-3.5 shrink-0 accent-[#0a1628] cursor-pointer" />
              <span className="text-[10px] text-slate-400">
                I accept the <a href="/terms" className="underline text-[#0a1628]" target="_blank">Terms of Service</a>
              </span>
            </label>
            <button onClick={buy} disabled={loading || !agreed}
              className={`w-full flex items-center justify-center gap-2 font-black py-2.5 rounded-xl text-xs uppercase tracking-wide transition-all duration-200 ${
                agreed ? "bg-[#0a1628] hover:bg-[#1a3a6b] text-white hover:scale-[1.02] active:scale-[0.98]" : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}>
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : agreed ? <Zap className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {loading ? "Redirecting…" : "Buy Now"}
            </button>
          </>
        ) : (
          <>
            <button onClick={buy}
              className="w-full flex items-center justify-center gap-2 font-black py-2.5 rounded-xl text-xs uppercase tracking-wide bg-[#0a1628] hover:bg-[#1a3a6b] text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <Zap className="w-3.5 h-3.5" /> Buy Now
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-1.5 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Sign in required to complete purchase
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Bundle Card — same card width, richer content ─── */
function BundleCard({ bundle }: { bundle: Bundle }) {
  const router = useRouter();
  const user   = useAppSelector(s => s.auth.user);
  const [loading, setLoading] = useState(false);
  const [agreed,  setAgreed]  = useState(false);
  const isElite = bundle.id === "atlas-elite-bundle";
  const savings = bundle.originalPrice - bundle.price;

  const buy = async () => {
    if (!user) { router.push("/login?next=/toolkits"); return; }
    if (!agreed) return;
    setLoading(true);
    const res  = await fetch("/api/stripe/bundle-checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bundleId: bundle.id }),
    });
    const data = await res.json() as { url?: string };
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  };

  return (
    <div className={CARD}>
      {/* White header */}
      <div className="bg-white px-6 pt-8 pb-5 flex flex-col items-center border-b border-slate-100">
        <div className="w-48 h-48 mb-4 flex items-center justify-center overflow-hidden">
          {bundle.id === "atlas-elite-bundle"
            ? <img src="/icon.webp" alt="Atlas Elite" className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" />
            : <span className="text-7xl transition-transform duration-300 group-hover:scale-110 inline-block">{bundle.icon}</span>}
        </div>
        <h3 className="font-black text-sm text-[#0a1628] uppercase tracking-wide text-center leading-tight mb-1">
          {bundle.name}
        </h3>
        <p className={`text-xs font-semibold italic mb-2 ${isElite ? "text-amber-500" : "text-amber-600"}`}>
          {bundle.tagline}
        </p>
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3 h-3" />
          {bundle.membershipMonths} Months FREE Community Access
        </div>
      </div>

      {/* Features */}
      <div className="flex-1 px-5 py-4 bg-white">
        <ul className="space-y-2.5 mb-3">
          {bundle.features.map(f => (
            <li key={f} className="flex items-start gap-2 text-base text-slate-600">
              <Check className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />{f}
            </li>
          ))}
        </ul>
        {bundle.highlightFeatures && (
          <>
            <div className="border-t border-slate-100 pt-3 mb-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Exclusive to Atlas Elite</p>
            </div>
            <ul className="space-y-2">
              {bundle.highlightFeatures.map(f => (
                <li key={f} className="flex items-start gap-2 text-base font-bold text-[#0a1628]">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 mt-0.5 shrink-0" />{f}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Price + CTA — visible to all; guests redirected to login on buy */}
      <div className="px-5 pb-5 pt-4 bg-white border-t border-slate-100">
        <div className="text-center mb-3">
          <p className="text-slate-400 line-through text-base font-semibold">${bundle.originalPrice.toLocaleString()}</p>
          <span className="text-4xl font-black text-[#0a1628]">${bundle.price.toLocaleString()}</span>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">You save ${savings.toLocaleString()}!</p>
          <p className="text-[10px] text-amber-600 font-bold">{bundle.membershipMonths} Months FREE Community Access</p>
        </div>
        {user ? (
          <>
            <label className="flex items-start gap-2 mb-3 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 rounded w-3.5 h-3.5 shrink-0 accent-[#0a1628] cursor-pointer" />
              <span className="text-[10px] text-slate-400">
                I accept the <a href="/terms" className="underline text-[#0a1628]" target="_blank">Terms of Service</a>
              </span>
            </label>
            <button onClick={buy} disabled={loading || !agreed}
              className={`w-full flex items-center justify-center gap-2 font-black py-2.5 rounded-xl text-xs uppercase tracking-wide transition-all duration-200 ${
                agreed
                  ? isElite ? "bg-[#0a1628] hover:bg-[#1a3a6b] text-white hover:scale-[1.02] active:scale-[0.98]" : "bg-amber-500 hover:bg-amber-600 text-white hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}>
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {loading ? "Redirecting…" : "Buy Now!"}
            </button>
          </>
        ) : (
          <>
            <button onClick={buy}
              className={`w-full flex items-center justify-center gap-2 font-black py-2.5 rounded-xl text-xs uppercase tracking-wide transition-all duration-200 ${
                isElite ? "bg-[#0a1628] hover:bg-[#1a3a6b] text-white" : "bg-amber-500 hover:bg-amber-600 text-white"
              } hover:scale-[1.02] active:scale-[0.98]`}>
              <Zap className="w-3.5 h-3.5" /> Buy Now!
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-1.5 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Sign in required to complete purchase
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function ToolkitsPage() {
  const user = useAppSelector(s => s.auth.user);

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#0a1628] via-[#1a3a6b] to-[#0d2a50] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)", backgroundSize: "28px 28px" }} />

        {/* Glow blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-16 flex flex-col lg:flex-row items-center gap-10">

          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold px-4 py-2 rounded-full mb-5">
              <Download className="w-3.5 h-3.5" /> Digital Downloads · Instant Access
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
              Professional Tax <span className="text-amber-400">Toolkits</span>
            </h1>
            <p className="text-white text-base max-w-lg mb-6">
              Premium digital resources for tax professionals — each kit includes exclusive tools, templates, and free community membership.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-white">
              {["Instant Download", "2 Months Free Membership", "IRS-Compliant Resources", "One-Time Payment"].map(b => (
                <div key={b} className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" />{b}</div>
              ))}
            </div>
          </div>

          {/* Right: hero image */}
          <div className="relative flex-shrink-0 w-full max-w-sm lg:max-w-md">
            {/* Amber glow behind image */}
            <div className="absolute inset-0 bg-amber-400/20 rounded-3xl blur-2xl scale-110 pointer-events-none" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10 rotate-1 hover:rotate-0 transition-transform duration-500">
              <img
                src="/irs-toolkit-audit-review-hero.webp"
                alt="IRS Toolkit Audit Review"
                className="w-full object-cover"
              />
              {/* Overlay badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#0a1628]/80 backdrop-blur-sm border border-amber-400/40 text-amber-300 text-[10px] font-black px-3 py-1.5 rounded-full">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> IRS-Compliant Resources
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-14 space-y-16">

        {/* Individual Toolkits — 3 top row, 2 centred bottom row */}
        <section>
          <h2 className="text-2xl font-black text-[#0a1628] mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#0a1628] rounded-full" /> Individual Toolkits
          </h2>
          <div className="grid md:grid-cols-3 gap-5 mb-5">
            {TOOLKITS.slice(0, 3).map(tk => <ToolkitCard key={tk.id} tk={tk} />)}
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {TOOLKITS.slice(3).map(tk => <ToolkitCard key={tk.id} tk={tk} />)}
          </div>
        </section>

        {/* Bundles */}
        <section>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold px-4 py-1.5 rounded-full mb-3">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Best Value Bundles
            </div>
            <h2 className="text-3xl font-black text-[#0a1628]">Bundle &amp; Save Big</h2>
            <p className="text-slate-500 mt-1 text-base">Get everything you need at a massive discount</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {BUNDLES.map(b => <BundleCard key={b.id} bundle={b} />)}
          </div>
        </section>

        {/* Trust bar */}
        <div className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] rounded-2xl p-8 text-white grid sm:grid-cols-3 gap-6">
          {[
            { icon: "📥", title: "Instant Download", desc: "Access your files immediately after purchase." },
            { icon: "🏅", title: "Free Membership", desc: "Marketplace or VIP access included with every purchase." },
            { icon: "🛡️", title: "IRS-Ready Resources", desc: "Every document meets professional compliance standards." },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="text-2xl shrink-0">{f.icon}</span>
              <div><p className="font-bold text-base">{f.title}</p><p className="text-white/50 text-sm mt-0.5">{f.desc}</p></div>
            </div>
          ))}
        </div>
        {user && <p className="text-center text-xs text-slate-400">Purchasing as <span className="font-semibold text-slate-600">{user.email}</span></p>}
      </div>
    </div>
  );
}
