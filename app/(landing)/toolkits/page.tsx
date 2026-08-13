"use client";

import { TOOLKITS, BUNDLES, type Toolkit, type Bundle } from "@/lib/toolkits";
import {
  ExternalLink, Sparkles, Download, ShieldCheck, Star, Check,
  ArrowRight, Zap, TrendingUp, Award, Clock, Users, Lock,
  FileText, BarChart3, BookOpen, Shield,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   TOOLKIT CARD
───────────────────────────────────────────────────────── */
function ToolkitCard({ tk }: { tk: Toolkit }) {
  return (
    <a
      href={tk.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col bg-white dark:bg-[#172135] rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/10 hover:border-amber-300/60 dark:hover:border-amber-500/30 cursor-pointer"
    >
      {tk.popular && (
        <div className="absolute top-4 right-4 z-20 inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
          <Star className="w-3 h-3 fill-white" /> Popular
        </div>
      )}

      {/* Image */}
      <div className="relative w-full h-44 bg-slate-50 dark:bg-[#1e2e45] flex items-center justify-center p-6 overflow-hidden group-hover:bg-slate-100/80 dark:group-hover:bg-[#253854] transition-colors duration-300">
        <img
          src={tk.badgeImage}
          alt={tk.name}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute bottom-3 left-3 bg-[#0a1628]/80 backdrop-blur-sm text-amber-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-400/30">
          ${tk.price}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-5">
        <h3 className="font-extrabold text-lg text-[#0a1628] dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200 mb-1.5">
          {tk.name}
        </h3>
        <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed mb-4 flex-1">
          {tk.description}
        </p>

        {/* Top 3 features */}
        <div className="space-y-1.5 mb-4">
          {tk.features.slice(0, 3).map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 stroke-[3]" />
              {f}
            </div>
          ))}
          {tk.features.length > 3 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 pl-5">+{tk.features.length - 3} more included</p>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <span className="text-xs font-extrabold text-[#1a3a6b] dark:text-amber-400 group-hover:text-amber-600 transition-colors">
            View Toolkit →
          </span>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-amber-500/20 text-[#1a3a6b] dark:text-amber-400 group-hover:bg-amber-500 dark:group-hover:bg-amber-500 group-hover:text-white dark:group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
            <ExternalLink className="w-4 h-4" />
          </div>
        </div>
      </div>
    </a>
  );
}

/* ─────────────────────────────────────────────────────────
   BUNDLE CARD
───────────────────────────────────────────────────────── */
function BundleCard({ bundle }: { bundle: Bundle }) {
  const savings = bundle.originalPrice - bundle.price;
  return (
    <a
      href={bundle.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col bg-white dark:bg-[#172135] rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/15 hover:border-amber-300/60 dark:hover:border-amber-500/40 cursor-pointer"
    >
      {/* Top badge */}
      <div className="absolute top-4 right-4 z-20 inline-flex items-center gap-1 bg-[#0a1628] dark:bg-amber-500 text-amber-300 dark:text-[#0a1628] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
        <Sparkles className="w-3 h-3" /> {bundle.badge}
      </div>

      {/* Image */}
      <div className="relative w-full h-52 bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] flex items-center justify-center p-6 overflow-hidden">
        {bundle.badgeImage ? (
          <img src={bundle.badgeImage} alt={bundle.name} className="w-28 h-28 object-contain transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <span className="text-7xl transition-transform duration-500 group-hover:scale-110">{bundle.icon}</span>
        )}
        {/* Savings ribbon */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
            Save ${savings.toLocaleString()}
          </span>
          <span className="text-white/40 text-xs line-through">${bundle.originalPrice.toLocaleString()}</span>
        </div>
        <div className="absolute bottom-3 right-3 text-2xl font-black text-amber-400">
          ${bundle.price.toLocaleString()}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-6">
        <h3 className="font-extrabold text-2xl text-[#0a1628] dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors mb-1">
          {bundle.name}
        </h3>
        <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed mb-5">{bundle.description}</p>

        <div className="grid grid-cols-2 gap-2 mb-5">
          {bundle.features.slice(0, 6).map(f => (
            <div key={f} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Check className="w-3 h-3 text-amber-500 shrink-0 stroke-[3]" /> {f}
            </div>
          ))}
        </div>

        {bundle.highlightFeatures && (
          <div className="bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 rounded-xl p-3 mb-5 space-y-1.5">
            {bundle.highlightFeatures.map(hf => (
              <div key={hf} className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                <Sparkles className="w-3 h-3 shrink-0" /> {hf}
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between mt-auto">
          <span className="text-sm font-black text-[#0a1628] dark:text-amber-400 group-hover:text-amber-600 transition-colors">
            Get This Bundle →
          </span>
          <div className="w-10 h-10 rounded-xl bg-amber-500 group-hover:bg-amber-600 text-white flex items-center justify-center transition-all duration-300 shadow-md">
            <ExternalLink className="w-4 h-4" />
          </div>
        </div>
      </div>
    </a>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function ToolkitsPage() {
  return (
    <div className="min-h-screen bg-[#f4f6fb] dark:bg-[#0c1527]">

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <div className="relative bg-gradient-to-br from-[#0a1628] via-[#0d2040] to-[#0a1628] text-white overflow-hidden">
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        {/* Glow blobs */}
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-16 flex flex-col lg:flex-row items-center gap-12">
          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
              <Download className="w-3.5 h-3.5" /> Premium Digital Resources &middot; Instant Access
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-5 leading-[1.05] tracking-tight">
              The Playbooks{" "}
              <span className="text-amber-400">Top Tax Pros</span>{" "}
              Use to Dominate.
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Stop guessing. Stop losing money to IRS penalties. Stop starting from scratch.
              Our battle-tested toolkits give you the exact systems, templates, and strategies the most protected and profitable practices use every day.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8">
              <a
                href="#toolkits"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-[#0a1628] font-black text-sm px-8 py-4 rounded-full shadow-xl shadow-amber-500/25 hover:scale-[1.03] active:scale-[0.98] transition-all"
              >
                Browse Toolkits <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#bundles"
                className="inline-flex items-center gap-2 border-2 border-white/20 text-white hover:bg-white/10 font-bold text-sm px-7 py-4 rounded-full transition-all"
              >
                View Bundles & Save
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs font-semibold text-white/70">
              {[
                { icon: ShieldCheck, label: "IRS-Compliant Standards" },
                { icon: Zap,         label: "Instant Access" },
                { icon: Award,       label: "Proven Blueprints" },
                { icon: Clock,       label: "VIP Membership Included" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-amber-400" /> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: hero image — same as original */}
          <div className="relative flex-shrink-0 w-full max-w-sm lg:max-w-md">
            <div className="absolute inset-0 bg-amber-400/20 rounded-3xl blur-2xl scale-110 pointer-events-none" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10">
              <img
                src="/irs-toolkit-audit-review-hero.webp"
                alt="IRS Toolkit Audit Review"
                className="w-full object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#0a1628]/80 backdrop-blur-sm border border-amber-400/40 text-amber-300 text-[10px] font-black px-3 py-1.5 rounded-full">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Professional Grade
              </div>
            </div>
          </div>
        </div>

        {/* Stats row below */}
        <div className="relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { num: "5+",      label: "Professional Toolkits" },
              { num: "$3,999+", label: "Value in the Elite Bundle" },
              { num: "10+",     label: "IRS-Ready Templates per Kit" },
              { num: "2 mo",    label: "VIP Membership Included" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-amber-400 mb-0.5">{s.num}</p>
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          WHY SECTION
      ══════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-400/10 border border-amber-300 dark:border-amber-400/30 text-amber-700 dark:text-amber-300 text-xs font-bold px-4 py-2 rounded-full mb-4 uppercase tracking-widest">
            Why Tax Compliance Pro Toolkits
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-[#0a1628] dark:text-white mb-4 leading-tight">
            Built by practitioners.<br />
            <span className="text-amber-600 dark:text-amber-400">Designed to protect your practice.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Every toolkit is built around one goal: helping tax professionals reduce risk, grow revenue, and run a tighter, more compliant operation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Shield,
              title: "IRS Penalty Protection",
              desc: "Every kit includes penalty defense resources, due diligence forms, and compliance documentation that protect you in an audit.",
              color: "text-blue-600 dark:text-blue-400",
              bg: "bg-blue-50 dark:bg-blue-400/10",
            },
            {
              icon: TrendingUp,
              title: "Revenue Growth Strategies",
              desc: "Proven pricing models, marketing blueprints, and referral systems that directly increase your bottom line — starting day one.",
              color: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-50 dark:bg-emerald-400/10",
            },
            {
              icon: FileText,
              title: "Done-For-You Templates",
              desc: "Response letters, audit prep systems, client intake forms, and office policy documents — all ready to customize and use.",
              color: "text-amber-600 dark:text-amber-400",
              bg: "bg-amber-50 dark:bg-amber-400/10",
            },
            {
              icon: BookOpen,
              title: "Step-by-Step Playbooks",
              desc: "No fluff. No theory. Each toolkit is a step-by-step operational guide built for real-world tax practice environments.",
              color: "text-purple-600 dark:text-purple-400",
              bg: "bg-purple-50 dark:bg-purple-400/10",
            },
            {
              icon: Users,
              title: "VIP Membership Included",
              desc: "Every toolkit purchase includes 2 months of VIP community access — mentorship, networking, and exclusive resources.",
              color: "text-rose-600 dark:text-rose-400",
              bg: "bg-rose-50 dark:bg-rose-400/10",
            },
            {
              icon: Lock,
              title: "Instant Secure Access",
              desc: "No waiting. Immediately access your downloads after purchase. All files are hosted securely and updated regularly.",
              color: "text-teal-600 dark:text-teal-400",
              bg: "bg-teal-50 dark:bg-teal-400/10",
            },
          ].map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-white dark:bg-[#172135] rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="font-extrabold text-lg text-[#0a1628] dark:text-white mb-2">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════
          URGENCY STRIP
      ══════════════════════════════════════ */}
      <div className="bg-amber-500 text-[#0a1628] py-4 px-6 overflow-hidden">
        <div className="flex gap-16 animate-[marquee_25s_linear_infinite] whitespace-nowrap text-sm font-black uppercase tracking-widest">
          {["Penalty Defense Templates", "Audit-Ready Workpapers", "30-Day Launch Plan", "IRS Response Letters", "Office Compliance Posters", "EFIN & PTIN Blueprint", "Revenue Model Strategy", "Schedule C Framework"].map((t, i) => (
            <span key={i} className="shrink-0">{t} <span className="mx-4 opacity-50">·</span></span>
          ))}
          {["Penalty Defense Templates", "Audit-Ready Workpapers", "30-Day Launch Plan", "IRS Response Letters", "Office Compliance Posters", "EFIN & PTIN Blueprint", "Revenue Model Strategy", "Schedule C Framework"].map((t, i) => (
            <span key={`r-${i}`} className="shrink-0">{t} <span className="mx-4 opacity-50">·</span></span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          TOOLKITS GRID
      ══════════════════════════════════════ */}
      <section id="toolkits" className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-1.5 h-7 bg-amber-500 rounded-full" />
            <h2 className="text-3xl font-black text-[#0a1628] dark:text-white">Individual Toolkits</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-300 text-base pl-5">
            Each toolkit is a standalone professional system. Get exactly what your practice needs — or bundle for maximum value.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLKITS.map((tk) => (
            <ToolkitCard key={tk.id} tk={tk} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          SOCIAL PROOF / TESTIMONIAL STRIP
      ══════════════════════════════════════ */}
      <section className="bg-[#0a1628] dark:bg-[#050d1a] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Trusted by Tax Professionals</p>
            <h2 className="text-3xl font-black text-white">What tax pros are saying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "The IRS Fine Defense Toolkit saved me during a preparer penalty audit. The response letter templates alone were worth 10x the price.",
                name: "T. Williams, EA",
                role: "Enrolled Agent, TX",
              },
              {
                quote: "I launched my office in 28 days using the 30 Day Launch kit. Everything from EFIN setup to pricing strategy was spelled out clearly.",
                name: "M. Johnson, CPA",
                role: "Firm Owner, GA",
              },
              {
                quote: "The Schedule C Reconstruction toolkit is what every preparer needs. Clients with missing records used to stress me out. Not anymore.",
                name: "R. Davis, CTEC",
                role: "Tax Consultant, CA",
              },
            ].map(t => (
              <div key={t.name} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-4 italic">"{t.quote}"</p>
                <div>
                  <p className="font-black text-white text-sm">{t.name}</p>
                  <p className="text-white/50 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          BUNDLES
      ══════════════════════════════════════ */}
      <section id="bundles" className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-400/10 border border-amber-300 dark:border-amber-400/30 text-amber-800 dark:text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Best Value &mdash; Save Up to $2,000
          </div>
          <h2 className="text-4xl font-black text-[#0a1628] dark:text-white mb-3">All-In-One Bundles</h2>
          <p className="text-slate-500 dark:text-slate-300 text-base max-w-xl">
            Get every toolkit, plus VIP membership, AI tools, and priority support — all at a fraction of the individual price.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {BUNDLES.map((b) => (
            <BundleCard key={b.id} bundle={b} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          COMPARISON / VALUE PROP
      ══════════════════════════════════════ */}
      <section className="bg-white dark:bg-[#172135] border-y border-slate-200/60 dark:border-slate-800 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-[#0a1628] dark:text-white mb-2">DIY vs. Toolkit — The Real Cost</h2>
            <p className="text-slate-500 dark:text-slate-300 text-sm">One IRS penalty or failed audit can cost thousands. Our toolkits cost a fraction of what they protect you from.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              {
                label: "Average IRS Preparer Penalty",
                value: "$500–$5,000",
                sub: "per violation — preventable with the right systems",
                color: "text-red-500",
                bg: "bg-red-50 dark:bg-red-400/10 border-red-200 dark:border-red-400/20",
              },
              {
                label: "Our Toolkit Price",
                value: "$299.99",
                sub: "one-time, includes VIP membership + all templates",
                color: "text-emerald-600",
                bg: "bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20",
              },
              {
                label: "ROI on One Prevented Penalty",
                value: "10x+",
                sub: "just one prevented $3,000 penalty pays for all 5 toolkits",
                color: "text-amber-600 dark:text-amber-400",
                bg: "bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20",
              },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl p-6 border ${s.bg}`}>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">{s.label}</p>
                <p className={`text-4xl font-black mb-2 ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TRUST / GUARANTEE STRIP
      ══════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] rounded-3xl p-10 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-0.5 bg-amber-400" />
                <span className="text-amber-400 text-xs font-black uppercase tracking-widest">Our Commitment</span>
              </div>
              <h2 className="text-3xl font-black leading-tight mb-4">
                Every toolkit is built to<br />
                <span className="text-amber-400">pay for itself fast.</span>
              </h2>
              <p className="text-white/70 text-sm leading-relaxed max-w-md">
                We don't sell generic content. Each toolkit is built on real practitioner experience, IRS guidance, and the exact systems high-performing tax offices use to stay protected, stay compliant, and keep growing.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { icon: "📥", title: "Instant Access", desc: "Download immediately after purchase — no waiting." },
                { icon: "🏅", title: "Proven Blueprints", desc: "Templates and systems tested in real practices." },
                { icon: "🛡️", title: "IRS-Ready Standards", desc: "Every document meets professional compliance standards." },
              ].map(f => (
                <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <span className="text-2xl block mb-3">{f.icon}</span>
                  <p className="font-bold text-sm mb-1">{f.title}</p>
                  <p className="text-white/50 text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════ */}
      <section className="bg-amber-50 dark:bg-amber-400/5 border-t border-amber-200/60 dark:border-amber-400/10 py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 text-amber-700 dark:text-amber-400 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5" /> Start protecting your practice today
          </div>
          <h2 className="text-4xl font-black text-[#0a1628] dark:text-white mb-4 leading-tight">
            The IRS won't wait.<br />
            <span className="text-amber-600 dark:text-amber-400">Neither should you.</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base mb-8 leading-relaxed">
            Every day without the right systems is another day your practice is exposed. Get the toolkit that matches your biggest challenge and start building a protected, profitable operation today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#toolkits"
              className="inline-flex items-center gap-2 bg-[#0a1628] dark:bg-amber-500 text-white dark:text-[#0a1628] font-black text-sm px-9 py-4 rounded-full hover:bg-[#1a3a6b] dark:hover:bg-amber-400 transition-all shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Shop Toolkits <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#bundles"
              className="inline-flex items-center gap-2 border-2 border-[#0a1628]/20 dark:border-white/20 text-[#0a1628] dark:text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-[#0a1628]/5 dark:hover:bg-white/10 transition-all"
            >
              View Bundles & Save Up to $2,000
            </a>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {["Instant Access", "IRS-Compliant", "VIP Membership Included"].map(b => (
              <div key={b} className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-amber-500" />{b}</div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
