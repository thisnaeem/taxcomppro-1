"use client";

import { TOOLKITS, BUNDLES, type Toolkit, type Bundle } from "@/lib/toolkits";
import {
  Download,
  ShieldCheck,
  Star,
  ArrowRight,
  Zap,
  TrendingUp,
  Award,
  Clock,
  Users,
  Lock,
  FileText,
  BookOpen,
  Shield,
  Sparkles,
  Check,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   TOOLKIT CARD (No White Enclosing Box, Dark Mode Glow, ACCESS TOOLKIT Button)
───────────────────────────────────────────────────────── */
function ToolkitCard({ tk }: { tk: Toolkit }) {
  return (
    <div className="relative group flex flex-col rounded-3xl overflow-hidden border border-slate-200/90 dark:border-amber-400/20 bg-white dark:bg-gradient-to-b dark:from-[#17253e] dark:to-[#0f192b] shadow-md dark:shadow-[0_4px_25px_rgba(0,0,0,0.5)] hover:shadow-2xl dark:hover:shadow-[0_0_40px_rgba(245,158,11,0.25)] dark:hover:border-amber-400/60 hover:-translate-y-2 transition-all duration-300">
      {/* Dark mode background ambient illumination */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-500/0 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Floating Badge Image — No nested white box */}
      <div className="w-full h-72 sm:h-80 flex items-center justify-center p-4 overflow-hidden">
        <img
          src={tk.badgeImage}
          alt={tk.name}
          className="w-full h-full max-h-72 object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 sm:p-7 pt-2 relative z-10">
        {/* Category */}
        <p className="text-[11px] font-black uppercase tracking-widest text-[#c28e10] dark:text-amber-400 mb-2">
          {tk.category}
        </p>

        {/* Title */}
        <h3 className="font-extrabold text-xl text-[#0a1628] dark:text-white leading-tight mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {tk.name}
        </h3>

        {/* Description */}
        <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed mb-6 flex-1">
          {tk.description}
        </p>

        {/* ACCESS TOOLKIT Action Button */}
        <div className="pt-2 mt-auto">
          <a
            href={tk.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#0a1628] dark:bg-amber-500 text-white dark:text-[#0a1628] hover:bg-[#1a3a6b] dark:hover:bg-amber-400 font-black text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
          >
            ACCESS TOOLKIT <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ULTIMATE BUNDLE CARD (No Price, Full Included Features)
───────────────────────────────────────────────────────── */
function UltimateBundleCard({ bundle }: { bundle: Bundle }) {
  return (
    <div className="relative group rounded-3xl overflow-hidden border-2 border-amber-400/40 dark:border-amber-400/60 bg-white dark:bg-gradient-to-b dark:from-[#1b2b48] dark:to-[#0f192b] shadow-xl dark:shadow-[0_0_50px_rgba(245,158,11,0.25)] p-8 sm:p-10 transition-all duration-300 hover:shadow-2xl">
      {/* Top ribbon */}
      <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-[#0a1628] text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md mb-6">
        <Sparkles className="w-4 h-4 fill-[#0a1628]" /> {bundle.badge}
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
        {bundle.badgeImage && (
          <div className="w-48 sm:w-56 h-48 sm:h-56 flex items-center justify-center shrink-0">
            <img
              src={bundle.badgeImage}
              alt={bundle.name}
              className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <div className="flex-1 text-center lg:text-left">
          <h3 className="text-3xl sm:text-4xl font-black text-[#0a1628] dark:text-white mb-2">
            {bundle.name}
          </h3>
          <p className="text-slate-500 dark:text-slate-300 text-base max-w-2xl leading-relaxed">
            {bundle.description}
          </p>
        </div>

        <a
          href={bundle.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#0a1628] font-black text-sm uppercase tracking-wider px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all shrink-0"
        >
          ACCESS ULTIMATE BUNDLE <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-200/80 dark:border-slate-800/80 pt-6">
        {bundle.features.map((feat) => (
          <div
            key={feat}
            className="flex items-center gap-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-3.5 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <Check className="w-4 h-4 text-amber-500 shrink-0 stroke-[3]" />
            <span>{feat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function ToolkitsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0c1527]">
      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <div className="relative bg-gradient-to-br from-[#0a1628] via-[#0d2040] to-[#0a1628] text-white overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-16 flex flex-col lg:flex-row items-center gap-12">
          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
              <Download className="w-3.5 h-3.5" /> Premium Digital Resources · Instant Access
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-5 leading-[1.05] tracking-tight">
              The Playbooks <span className="text-amber-400">Top Tax Pros</span> Use to Dominate.
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Premium digital resources for Tax Professionals — each kit includes exclusive tools,
              templates, courses, and Free Community Membership.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8">
              <a
                href="#toolkits"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-[#0a1628] font-black text-sm px-8 py-4 rounded-full shadow-xl shadow-amber-500/25 hover:scale-[1.03] active:scale-[0.98] transition-all"
              >
                Browse Toolkits <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#bundle"
                className="inline-flex items-center gap-2 border-2 border-white/20 text-white hover:bg-white/10 font-bold text-sm px-7 py-4 rounded-full transition-all"
              >
                View Ultimate Bundle
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs font-semibold text-white/70">
              {[
                { icon: ShieldCheck, label: "IRS-Compliant Standards" },
                { icon: Zap, label: "Instant Access" },
                { icon: Award, label: "Proven Blueprints" },
                { icon: Clock, label: "2 Months Free Community Membership" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-amber-400" /> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: hero image */}
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
              { num: "5", label: "Professional Toolkits" },
              { num: "100%", label: "IRS-Compliant Workpapers" },
              { num: "10+", label: "Templates per Toolkit" },
              { num: "2 mo", label: "Free Community Membership" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-amber-400 mb-0.5">{s.num}</p>
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider leading-snug">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          TOOLKITS GRID (All 6 Toolkits)
      ══════════════════════════════════════ */}
      <section id="toolkits" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-400/10 border border-amber-300 dark:border-amber-400/30 text-amber-800 dark:text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Practice Growth &amp;
            Defense Systems
          </div>
          <h2 className="text-4xl font-black text-[#0a1628] dark:text-white mb-3">
            Individual Toolkits
          </h2>
          <p className="text-slate-500 dark:text-slate-300 text-base max-w-xl mx-auto">
            Choose the exact toolkit built for your firm&apos;s launch, due diligence, compliance,
            and audit defense.
          </p>
        </div>

        {/* 3-column responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TOOLKITS.map((tk) => (
            <ToolkitCard key={tk.id} tk={tk} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          ULTIMATE BUNDLE SECTION
      ══════════════════════════════════════ */}
      {BUNDLES.length > 0 && (
        <section id="bundle" className="max-w-7xl mx-auto px-6 pb-20">
          <UltimateBundleCard bundle={BUNDLES[0]} />
        </section>
      )}

      {/* ══════════════════════════════════════
          WHY SECTION
      ══════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-200/60 dark:border-slate-800">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-400/10 border border-amber-300 dark:border-amber-400/30 text-amber-700 dark:text-amber-300 text-xs font-bold px-4 py-2 rounded-full mb-4 uppercase tracking-widest">
            Why Tax Compliance Pro Toolkits
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0a1628] dark:text-white mb-4 leading-tight">
            Built by practitioners. Designed to protect your practice.
          </h2>
          <p className="text-slate-500 dark:text-slate-300 text-base max-w-2xl mx-auto leading-relaxed">
            Every toolkit is built around one goal: helping tax professionals reduce risk, grow
            revenue, and run a tighter, more compliant operation.
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
              desc: "Proven pricing models, marketing blueprints, and referral systems that directly increase your bottom line.",
              color: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-50 dark:bg-emerald-400/10",
            },
            {
              icon: FileText,
              title: "Done-For-You Templates",
              desc: "Response letters, audit prep systems, client intake forms, and office policy documents — all ready to use.",
              color: "text-amber-600 dark:text-amber-400",
              bg: "bg-amber-50 dark:bg-amber-400/10",
            },
            {
              icon: BookOpen,
              title: "Step-by-Step Playbooks",
              desc: "No fluff. Each toolkit is a step-by-step operational guide built for real-world tax practice environments.",
              color: "text-purple-600 dark:text-purple-400",
              bg: "bg-purple-50 dark:bg-purple-400/10",
            },
            {
              icon: Users,
              title: "2 Months Free Community Membership",
              desc: "Every toolkit purchase includes 2 months of VIP community access — mentorship, networking, and exclusive resources.",
              color: "text-rose-600 dark:text-rose-400",
              bg: "bg-rose-50 dark:bg-rose-400/10",
            },
            {
              icon: Lock,
              title: "Instant Secure Access",
              desc: "Immediately access your downloads after purchase. All files are hosted securely and updated regularly.",
              color: "text-teal-600 dark:text-teal-400",
              bg: "bg-teal-50 dark:bg-teal-400/10",
            },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-white dark:bg-[#172135] rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="font-extrabold text-lg text-[#0a1628] dark:text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════ */}
      <section className="bg-amber-50 dark:bg-amber-400/5 border-t border-amber-200/60 dark:border-amber-400/10 py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 text-amber-700 dark:text-amber-400 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5" /> Start protecting your practice today
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0a1628] dark:text-white mb-4 leading-tight">
            The IRS won&apos;t wait. Neither should you.
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base mb-8 leading-relaxed">
            Get the toolkit that matches your biggest challenge and start building a protected,
            profitable operation today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#toolkits"
              className="inline-flex items-center gap-2 bg-[#0a1628] dark:bg-amber-500 text-white dark:text-[#0a1628] font-black text-sm px-9 py-4 rounded-full hover:bg-[#1a3a6b] dark:hover:bg-amber-400 transition-all shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Shop Toolkits <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
