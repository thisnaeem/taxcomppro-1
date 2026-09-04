"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag, Users, GraduationCap,
  ArrowRight, CheckCircle2, TrendingUp, Star, Shield,
  Radio, Sparkles, Mic, Calendar, Volume2, Play
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

const features = [
  {
    img: "/features/professional_network.webp",
    title: "Professional Network",
    desc: "Connect with verified CPAs, EAs, tax attorneys, and business experts nationwide to build strategic referral channels."
  },
  {
    img: "/features/markeplace.webp",
    title: "Pro Marketplace",
    desc: "Buy and sell tax software, office workflows, due diligence toolkits, coaching sessions, and digital products."
  },
  {
    img: "/features/communitues.webp",
    title: "Niche Communities",
    desc: "Join high-level masterminds or launch your own branded community for peer support and industry masterclasses."
  },
  {
    img: "/features/atlas.webp",
    title: "ATLAS AI Tax Assistant",
    desc: "Instant, real-time AI guidance for IRC codes, Schedule C due diligence, IRS notice resolution, and compliance queries."
  },
  {
    img: "/protalk.png",
    title: "Pro Talks Live Hub",
    desc: "Host interactive breakout rooms, live tax filing workshops, and audio & video AMAs directly with members."
  },
  {
    img: "/features/members-only-access.webp",
    title: "Members-Only Vault",
    desc: "Restricted, secure environment with private discussion boards, verified badges, and proprietary document libraries."
  },
];

const sampleMarketplace = [
  {
    title: "Complete 1040 Due Diligence Checklist 2026",
    seller: "Sarah Jenkins, CPA",
    price: "$79",
    category: "Toolkit",
    rating: "5.0",
    reviews: "48",
    color: "from-amber-500/15 to-orange-500/10 text-amber-600",
    icon: Shield,
  },
  {
    title: "IRS Audit Defense & Representation Course",
    seller: "Marcus Sterling, EA",
    price: "$199",
    category: "Masterclass",
    rating: "4.9",
    reviews: "64",
    color: "from-blue-500/15 to-indigo-500/10 text-blue-600",
    icon: GraduationCap,
  },
  {
    title: "Multi-Location Tax Office Workflow SOPs",
    seller: "Apex Tax Advisory",
    price: "$299",
    category: "Operations",
    rating: "5.0",
    reviews: "32",
    color: "from-emerald-500/15 to-teal-500/10 text-emerald-600",
    icon: TrendingUp,
  },
  {
    title: "1-on-1 Practice Scaling & Client Acquisition",
    seller: "Elena Rostova, MST",
    price: "$150/hr",
    category: "Coaching",
    rating: "5.0",
    reviews: "29",
    color: "from-purple-500/15 to-pink-500/10 text-purple-600",
    icon: Users,
  },
];

const plans = [
  {
    name: "Basic Members Only", price: "FREE", period: "", img: "/plan-basic.webp",
    popular: false, badge: null, savings: null,
    features: ["Email Support","Marketplace Access (View)","Member Directory Access","Communities Access (View)","Marketplace Feed Access","Secure Members-Only Environment"],
    cta: "Join For Free", href: "/register",
  },
  {
    name: "VIP Members Only", price: "$39.99", period: "/month", img: "/plan-vip.webp",
    popular: false, badge: "2 Months FREE", savings: null,
    features: ["Priority Email Support","Private Messaging & DMs","Training & Educational Support","Marketplace Feed Interaction","Communities Interaction","Private Discussion Forums","Ongoing Education & Training","Ability to Connect","Pro Training Access","ATLAS AI Tax Bot","Professional Networking"],
    cta: "Join VIP", href: "/register?plan=VIP",
  },
  {
    name: "VIP + Marketplace Bundle", price: "$79.99", period: "/month", img: "/plan-marketplace.webp",
    popular: true, badge: "Most Popular", savings: "Save $131.96/yr",
    features: ["Professional marketplace listing","Custom seller profile page","Ability to sell services","Private Discussion Forums","Fully Customizable Profile","Featured in Marketplace directory","Enhanced Visibility & Credibility","Stronger Brand Authority"],
    cta: "Start Marketplace Plan", href: "/register?plan=MARKETPLACE",
  },
  {
    name: "VIP + Marketplace Plus", price: "$129.99", period: "/month", img: "/plan-marketplace-plus.webp",
    popular: true, badge: "Best Value", savings: "Save $131.96/yr",
    features: ["Professional marketplace listing","Custom seller profile","Ability to sell services","Private Discussion Forums","Fully Customizable Profile","Featured in directory","Enhanced Visibility","Live Audio Session Hosting","Live Video Session Hosting","Post Ads/Products/Services"],
    cta: "Get Best Value", href: "/register?plan=MARKETPLACE_PLUS",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#070f1e] text-slate-900 dark:text-white font-[var(--font-urbanist,Urbanist),sans-serif] selection:bg-[#f0c040] selection:text-[#0a1628]">

      <Navbar />

      {/* ── HERO SECTION (Sharp bottom border, vibrant glow, no fading gradient, no stats ribbon) ── */}
      <section className="relative pt-[72px] pb-16 md:pb-24 bg-gradient-to-br from-[#060e1a] via-[#0a1628] to-[#102444] text-white border-b border-slate-800 overflow-hidden">
        {/* Glow ambient meshes */}
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-[#d4a017]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-[550px] h-[550px] bg-[#1a3a6b]/40 rounded-full blur-[140px] pointer-events-none" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 pt-10 md:pt-14">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-14">

            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-[#d4a017]/15 border border-[#d4a017]/40 text-[#f0c040] text-xs sm:text-sm font-bold px-4 py-2 rounded-full mb-6 shadow-[0_0_20px_rgba(212,160,23,0.2)]">
                <Sparkles className="w-4 h-4 text-[#f0c040]" />
                <span>America&apos;s #1 Tax Professional Community</span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[62px] font-black leading-[1.08] tracking-tight mb-6">
                The Professional Hub for{" "}
                <span className="bg-gradient-to-r from-[#f0c040] via-[#fbbf24] to-[#d4a017] bg-clip-text text-transparent">
                  Tax & Business Experts
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8 font-normal">
                Connect, Collaborate, Sell, and Grow with powerful tools built for professionals all on one secure platform.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#f0c040] via-[#e5a919] to-[#d4a017] text-[#0a1628] font-black text-base px-8 py-4 rounded-full hover:shadow-[0_0_35px_rgba(240,192,64,0.45)] hover:scale-[1.02] active:scale-95 transition-all duration-200"
                >
                  Join For Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="#pricing"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold text-base px-7 py-4 rounded-full border border-white/20 backdrop-blur-md transition-all hover:border-[#f0c040]/50"
                >
                  View Pricing
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified Tax Pros</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Encrypted Platform</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Members-Only Access</span>
                </div>
              </div>
            </div>

            {/* Right Floating Cards */}
            <div className="hidden lg:flex flex-col gap-4 shrink-0 min-w-[280px]">
              {[
                { icon: ShoppingBag, title: "Pro Marketplace", sub: "Browse verified listings", color: "text-[#f0c040]" },
                { icon: Users,       title: "Community Hub",    sub: "Live audio sessions",   color: "text-blue-400" },
                { icon: Radio,       title: "Pro Talks Live",   sub: "Drop-in voice stages",  color: "text-purple-400" },
                { icon: Shield,      title: "ATLAS AI Assistant", sub: "Real-time tax guidance", color: "text-emerald-400" },
              ].map((c) => (
                <div
                  key={c.title}
                  className="flex items-center gap-3.5 bg-white/8 hover:bg-white/12 backdrop-blur-xl border border-white/15 hover:border-[#f0c040]/40 rounded-2xl px-5 py-4 transition-all duration-300 hover:translate-x-1 shadow-lg"
                >
                  <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                    <c.icon className={`w-5 h-5 ${c.color}`} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-base">{c.title}</div>
                    <div className="text-white/60 text-xs mt-0.5">{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>


      {/* ── FEATURES ("Why TaxCompPro" - Clean, Large Icons with Nothing Around Them) ── */}
      <section id="about" className="py-24 bg-white dark:bg-[#0a1628] border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#d4a017] dark:text-[#f0c040] mb-3">
              Why TaxCompPro
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0a1628] dark:text-white tracking-tight mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Whether you&apos;re solo or multi-location, TaxCompPro grows with you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-[#f8fafc] dark:bg-[#0c182b] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:border-[#d4a017] dark:hover:border-[#f0c040] hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#d4a017]/10 transition-all duration-300 flex flex-col items-center text-center group"
              >
                {/* Big prominent icon with nothing around it */}
                <div className="mb-6 w-24 h-24 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Image
                    src={f.img}
                    alt={f.title}
                    width={96}
                    height={96}
                    className="w-24 h-24 object-contain drop-shadow-md"
                  />
                </div>

                <h3 className="text-xl font-black text-[#0a1628] dark:text-white mb-3 group-hover:text-[#d4a017] dark:group-hover:text-[#f0c040] transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ── PRO TALKS SECTION (Dedicated Live Audio & Video Showcase - Green & Blue Theme) ── */}
      <section className="py-24 bg-gradient-to-br from-[#040a14] via-[#061224] to-[#0a1c38] text-white border-b border-emerald-950/60 relative overflow-hidden">
        {/* Glow ambient meshes */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Live Audio &amp; Video Stages
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-300">PRO</span> TALKS
              </h2>
              <p className="text-lg sm:text-xl font-bold text-slate-200 mb-3">
                Go Live. Share Insight. <span className="text-emerald-400">Grow Your Voice.</span>
              </p>
              <p className="text-base text-slate-300 leading-relaxed mb-8 max-w-xl">
                Host live conversations, join expert discussions, and connect with your audience in real time. Drop in to listen or raise your hand to speak on stage.
              </p>

              {/* 4 Feature Action Cards matching the inspiration artwork */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8 text-left">
                {[
                  { title: "HOST LIVE TALKS", desc: "Start conversations that matter with your community." },
                  { title: "JOIN THE AUDIENCE", desc: "Listen, learn, and engage with verified speakers live." },
                  { title: "ASK QUESTIONS", desc: "Interact in real time and request to speak on stage." },
                  { title: "SCHEDULE SESSIONS", desc: "Plan upcoming talks and topics with automated calendar invites." },
                ].map(item => (
                  <div key={item.title} className="bg-[#08172c]/80 border border-emerald-500/25 hover:border-emerald-400/50 rounded-2xl p-4 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                    <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-emerald-300 mb-1 tracking-wide">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item.title}</span>
                    </div>
                    <p className="text-xs text-slate-300 pl-6 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex gap-4 justify-center lg:justify-start flex-wrap">
                <Link
                  href="/pro-talks"
                  className="inline-flex items-center gap-2.5 bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] font-black px-8 py-4 rounded-full hover:shadow-[0_0_35px_rgba(34,197,94,0.5)] hover:scale-105 transition-all text-base"
                >
                  <Radio className="w-5 h-5" /> Explore Pro Talks
                </Link>
                <Link
                  href="/upgrade"
                  className="inline-flex items-center gap-2 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 font-bold px-7 py-4 rounded-full border border-emerald-500/40 hover:border-emerald-400 transition-all text-base"
                >
                  Host Your Own Stage
                </Link>
              </div>
            </div>

            {/* Right Visual Poster showcasing /protalk.png */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.25)] group hover:border-lime-400/80 transition-all duration-500 bg-[#061224]">
                <Image
                  src="/protalk.png"
                  alt="Pro Talks - Go Live. Share Insight. Grow Your Voice."
                  width={720}
                  height={540}
                  className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500 drop-shadow-2xl"
                  priority
                />
                {/* Ambient glow accent */}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl pointer-events-none" />
              </div>
            </div>

          </div>

          {/* 5 Bottom Pillars Strip */}
          <div className="mt-14 pt-8 border-t border-emerald-900/40 grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            {[
              { label: "CONNECT", desc: "Build real connections." },
              { label: "SPEAK", desc: "Share your expertise." },
              { label: "LEARN", desc: "Gain valuable insights." },
              { label: "ENGAGE", desc: "Participate & stay active." },
              { label: "GROW", desc: "Expand your influence." },
            ].map(p => (
              <div key={p.label} className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl">
                <div className="text-xs font-black text-lime-400 tracking-wider mb-0.5">{p.label}</div>
                <div className="text-[11px] text-slate-300">{p.desc}</div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ── MARKETPLACE PREVIEW ── */}
      <section className="py-24 bg-[#f8fafc] dark:bg-[#070f1e] border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-16">
            
            {/* Left Description */}
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#d4a017] dark:text-[#f0c040] mb-3">
                Marketplace
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0a1628] dark:text-white tracking-tight mb-5">
                Sell Your Expertise.<br />
                <span className="text-[#d4a017] dark:text-[#f0c040]">Buy What You Need.</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Connect professionals offering services, training courses, and digital products with members who need them.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {[
                  "Skill Building & Certifications",
                  "Tax Office Branding",
                  "End to End Tax Office Solutions",
                  "Done-for-you systems",
                  "Real Estate Investing Courses",
                  "Business Startup Training",
                ].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3.5 flex-wrap">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-black px-7 py-3.5 rounded-full hover:shadow-[0_0_25px_rgba(212,160,23,0.35)] transition-all text-sm"
                >
                  Browse Marketplace <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/upgrade"
                  className="inline-flex items-center gap-2 bg-white dark:bg-[#0e1d33] text-[#0a1628] dark:text-white font-bold px-6 py-3.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
                >
                  Become a Seller
                </Link>
              </div>
            </div>

            {/* Right Preview Grid */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sampleMarketplace.map(item => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.title}
                    className="bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl hover:border-[#d4a017] dark:hover:border-[#f0c040] transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r ${item.color} border border-current/20`}>
                          {item.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{item.rating}</span>
                          <span className="text-slate-400 font-normal">({item.reviews})</span>
                        </div>
                      </div>

                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3 text-[#0a1628] dark:text-white group-hover:bg-[#f0c040]/10 group-hover:text-[#d4a017] transition-colors">
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <h4 className="font-bold text-sm text-[#0a1628] dark:text-white line-clamp-2 mb-1 group-hover:text-[#d4a017] dark:group-hover:text-[#f0c040] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">By {item.seller}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-base font-black text-[#0a1628] dark:text-white">{item.price}</span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline">View Item →</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>


      {/* ── COMMUNITIES SECTION (Clean Details & Checklist, No Dynamic Cards) ── */}
      <section className="py-24 bg-white dark:bg-[#0a1628] border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#d4a017] dark:text-[#f0c040] mb-3">
              Communities
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0a1628] dark:text-white tracking-tight mb-4">
              Your Community.<br />Your Rules.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Create or join niche communities for tax professionals. Share knowledge, host live sessions, and run private discussion forums.
            </p>
          </div>

          {/* 2-col checklist grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-10">
            {[
              "Create your own branded community",
              "Discussion boards & forums",
              "Live audio & video sessions",
              "Exclusive member-only content",
              "Private messaging & networking",
              "Grow your professional audience",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 bg-[#f8fafc] dark:bg-[#0c182b] rounded-2xl border border-slate-200 dark:border-slate-800 px-5 py-4 hover:border-[#d4a017] transition-all">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-base font-semibold text-slate-700 dark:text-slate-200">{item}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              href="/communities"
              className="inline-flex items-center gap-2 bg-[#0a1628] dark:bg-white text-white dark:text-[#0a1628] font-bold px-8 py-3.5 rounded-full hover:bg-[#1a3a6b] dark:hover:bg-slate-100 transition-all text-base shadow-lg"
            >
              Explore Communities <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>


      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 bg-[#f8fafc] dark:bg-[#070f1e]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#d4a017] dark:text-[#f0c040] mb-3">
              Pricing
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0a1628] dark:text-white tracking-tight mb-4">
              Choose Your Plan
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
              Start free, upgrade when you&apos;re ready. All paid plans include <span className="font-bold text-[#d4a017] dark:text-[#f0c040]">2 months free</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white dark:bg-[#0c182b] rounded-3xl flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular
                    ? "shadow-2xl shadow-[#f0c040]/15 border-2 border-[#d4a017] dark:border-[#f0c040]"
                    : "shadow-md border border-slate-200 dark:border-slate-800 hover:shadow-xl"
                }`}
              >
                {/* Gold Top Accent Bar */}
                {plan.popular && (
                  <div className="h-2 w-full bg-gradient-to-r from-[#f0c040] via-[#fbbf24] to-[#d4a017]" />
                )}

                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                      plan.popular
                        ? "bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] shadow-sm"
                        : "bg-[#0a1628] dark:bg-white text-white dark:text-[#0a1628]"
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-7 sm:p-8 flex flex-col flex-1">
                  {/* Plan image */}
                  <div className="flex justify-center mb-5 mt-2">
                    <Image src={plan.img} alt={plan.name} width={120} height={120} className="object-contain hover:scale-105 transition-transform" style={{ width: "auto", height: "auto" }} />
                  </div>

                  {/* Name */}
                  <h3 className="text-center font-black text-lg text-[#0a1628] dark:text-white mb-1">
                    {plan.name}
                  </h3>

                  {/* Savings */}
                  {plan.savings ? (
                    <p className="text-center text-xs font-bold text-[#d4a017] dark:text-[#f0c040] mb-3">{plan.savings}</p>
                  ) : (
                    <div className="h-5 mb-1" />
                  )}

                  {/* Price */}
                  <div className="flex items-baseline justify-center gap-1 mb-6">
                    <span className="text-4xl sm:text-5xl font-black text-[#0a1628] dark:text-white">{plan.price}</span>
                    <span className="text-sm font-semibold text-slate-400">{plan.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => {
                      const isBold =
                        plan.name.includes("Marketplace Plus") &&
                        (f.toLowerCase().includes("live audio") ||
                         f.toLowerCase().includes("live video") ||
                         f.toLowerCase().includes("post ads"));
                      return (
                        <li key={f} className={`flex gap-2.5 items-start text-xs sm:text-sm ${isBold ? "text-[#0a1628] dark:text-white font-bold" : "text-slate-600 dark:text-slate-300"}`}>
                          <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isBold ? "text-emerald-600 stroke-[2.5]" : "text-emerald-500"}`} />
                          <span className={isBold ? "font-bold text-[#0a1628] dark:text-white" : ""}>{f}</span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={plan.href}
                    className={`w-full text-center block font-black text-sm py-4 rounded-full transition-all mt-auto ${
                      plan.popular
                        ? "bg-gradient-to-r from-[#f0c040] via-[#e5a919] to-[#d4a017] text-[#0a1628] hover:shadow-[0_0_25px_rgba(240,192,64,0.4)] hover:scale-[1.02]"
                        : "bg-[#0a1628] dark:bg-white text-white dark:text-[#0a1628] hover:bg-[#1a3a6b] dark:hover:bg-slate-100"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ── HIGH CONVERTING BOTTOM CTA ── */}
      <section className="py-24 bg-gradient-to-br from-[#060e1a] via-[#0a1628] to-[#12284c] text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(240,192,64,0.15),transparent_70%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-5 sm:px-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Ready to Join TaxCompPro?
          </h2>
          <p className="text-slate-300 text-base sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Join a growing network of members building their future today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#f0c040] via-[#e5a919] to-[#d4a017] text-[#0a1628] font-black text-base px-9 py-4 rounded-full hover:shadow-[0_0_35px_rgba(240,192,64,0.45)] hover:scale-105 transition-all"
            >
              Create Free Account <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold text-base px-8 py-4 rounded-full border border-white/20 backdrop-blur-md transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>


      {/* ── FOOTER ── */}
      <footer className="bg-[#0a1628] pt-14 pb-8 text-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <Link href="/" className="inline-block mb-4">
                <img src="/logo_dark.webp" alt="TaxCompPro" className="h-12 w-auto" />
              </Link>
              <p className="text-white/45 text-sm leading-relaxed">The professional community for tax experts across America.</p>
            </div>
            {[
              { title: "Platform", links: [["Marketplace","/marketplace"],["Communities","/communities"],["Pro Talks","/pro-talks"],["Pricing Plans","/#pricing"]] },
              { title: "Company",  links: [["About Us","/about"],["Contact","/contact"],["Become an Affiliate","https://affiliate.taxcomppro.com"],["Security","/security"]] },
              { title: "Legal",    links: [["Terms of Service","/terms"],["Privacy Policy","/privacy"],["Community Guidelines","/community-guidelines"],["Cookie Policy","/cookie-policy"]] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-bold text-sm mb-4">{col.title}</h4>
                {col.links.map(([label, href]) => (
                  href.startsWith("http") ? (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="block text-white/45 text-sm mb-2.5 hover:text-[#f0c040] transition-colors">{label}</a>
                  ) : (
                    <Link key={label} href={href} className="block text-white/45 text-sm mb-2.5 hover:text-[#f0c040] transition-colors">{label}</Link>
                  )
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-white/30 text-xs">
            <p>© {new Date().getFullYear()} TaxCompPro. All rights reserved.</p>
            <p>Built for tax professionals</p>
          </div>
        </div>
      </footer>
      <MobileBottomNav />
    </div>
  );
}
