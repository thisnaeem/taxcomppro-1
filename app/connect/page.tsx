"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2, Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff, Camera,
  Briefcase, Phone, Globe, Calendar, Plus, X, Check, CreditCard,
  Sparkles, TrendingUp, UserCheck, ExternalLink,
  Smartphone, CheckCircle2, Zap, Upload, Wifi, QrCode, BarChart3,
  Shield, Link2, Eye as EyeIcon,
} from "lucide-react";
import { signUp, useSession } from "@/lib/auth-client";
import { CARD_THEMES, type Visibility } from "@/lib/connectCard";
import Navbar from "@/components/landing/Navbar";

/* â”€â”€â”€ Inline SVG Icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}
function LinkedinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>
    </svg>
  );
}
function TwitterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
    </svg>
  );
}

/* â”€â”€â”€ Shared constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const inp = "w-full text-base px-5 py-4 border border-slate-200 dark:border-slate-700/80 rounded-2xl outline-none focus:border-[#0a1628] dark:focus:border-amber-400 focus:ring-4 focus:ring-[#0a1628]/10 dark:focus:ring-amber-400/20 transition-all bg-white dark:bg-[#1e2e45] text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm font-medium";
const lbl = "block text-xs font-black uppercase tracking-widest text-[#0a1628] dark:text-slate-200 mb-2";

const GOALS = [
  { id: "tax-pro",    title: "Tax Professional & Firm",          desc: "Build my practice brand, share booking links & IRS tax services.", icon: Briefcase,  color: "from-blue-600 to-indigo-700" },
  { id: "advisor",   title: "Financial Advisor & Consultant",   desc: "Grow my accounting business & client consultation pipeline.",   icon: TrendingUp, color: "from-amber-500 to-amber-700" },
  { id: "creator",   title: "Tax Educator & Content Creator",   desc: "Share tax tips, digital guides, courses & social channels.",    icon: Sparkles,   color: "from-purple-600 to-indigo-800" },
  { id: "networking",title: "Personal Networking & Business Card",desc: "Share my digital business card, socials & contact details.",  icon: UserCheck,  color: "from-emerald-600 to-teal-800" },
];

const SUGGESTED_TITLES = ["Enrolled Agent", "CPA", "Tax Resolution Expert", "Tax Preparer", "Firm Owner"];

const STEP_LABELS = ["Goal","Name","Title","Firm","Bio","Photo","Logo","Contact","Booking","Socials","Links","Theme","Activate"];

interface LinkRow { label: string; url: string }

async function uploadImage(file: File, type: "avatar" | "logo"): Promise<string | null> {
  const fd = new FormData();
  fd.append("files", file); fd.append("type", type);
  const res = await fetch("/api/upload/profile", { method: "POST", body: fd });
  if (!res.ok) return null;
  const { urls } = await res.json() as { urls: string[] };
  return urls[0] ?? null;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   LANDING PAGE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ConnectLandingPage({
  onStart,
  hasPurchased,
  onBuy,
  buying,
}: {
  onStart: () => void;
  hasPurchased: boolean;
  onBuy: () => void;
  buying: boolean;
}) {
  return (
    <div className="bg-[#f5f0e8] dark:bg-[#0a1628] min-h-screen proconnect-landing">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap" rel="stylesheet" />
      <Navbar />

      {/* ── Announcement bar ── */}
      <div className="bg-[#0a1628] text-white text-center text-xs font-semibold py-2.5 px-4 tracking-wide">
        <span className="opacity-70">A smarter first impression for professionals</span>
        <span className="mx-3 opacity-30">·</span>
        <span className="text-amber-400 font-black uppercase tracking-widest">Introducing ProConnect — $29 One-Time</span>
      </div>

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-0.5 bg-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>Meet ProConnect</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-6xl sm:text-7xl font-bold leading-[1.0] text-[#0a1628] dark:text-white mb-5">
            Your expertise.<br />
            <em className="text-amber-700 dark:text-amber-400 not-italic" style={{ fontStyle: "italic", fontWeight: 600 }}>
              One powerful<br />tap.
            </em>
          </h1>
          <p className="text-lg font-bold text-[#0a1628] dark:text-white mb-1" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem" }}>Tap it. Scan it. Share it.</p>
          <p className="text-slate-600 dark:text-slate-300 text-base mb-8 max-w-md leading-relaxed">
            Give clients and connections one simple link to find you, connect with you, and explore your full{" "}
            <span className="text-[#0a1628] dark:text-amber-400 font-bold">Tax Compliance Pro Marketplace</span> presence.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-8">
            {hasPurchased ? (
              <button
                onClick={onStart}
                className="flex items-center gap-2 bg-[#0a1628] dark:bg-amber-500 text-white dark:text-[#0a1628] font-black text-sm px-7 py-3.5 rounded-full hover:bg-[#1a3a6b] dark:hover:bg-amber-400 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                Set Up Your Card <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={onBuy}
                  disabled={buying}
                  className="flex items-center gap-2 bg-[#0a1628] dark:bg-amber-500 text-white dark:text-[#0a1628] font-black text-sm px-7 py-3.5 rounded-full hover:bg-[#1a3a6b] dark:hover:bg-amber-400 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {buying ? "Opening Checkout..." : "Buy ProConnect — $29"} <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onStart}
                  className="flex items-center gap-1.5 border-2 border-[#0a1628]/20 dark:border-white/20 text-[#0a1628] dark:text-white font-bold text-sm px-6 py-3.5 rounded-full hover:bg-[#0a1628]/5 dark:hover:bg-white/10 transition-all"
                >
                  Activate Existing Card
                </button>
              </>
            )}
            <a href="#how-it-works" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-4 py-2 transition-colors">
              See How It Works ↓
            </a>
          </div>

          <div className="flex items-center gap-2 mb-8">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-sm text-slate-600 dark:text-slate-300">$29 one-time · No monthly fee · You control what people see</span>
          </div>

          <div className="flex items-center gap-8 pt-6 border-t border-[#0a1628]/10 dark:border-white/10">
            {[
              { label: "No app", sub: "needed to view" },
              { label: "One activation", sub: "two professional profiles" },
              { label: "You control", sub: "what people see" },
            ].map(s => (
              <div key={s.label}>
                <p className="font-black text-sm text-[#0a1628] dark:text-white">{s.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right â€” Real card + phone mockup */}
        <div className="relative flex items-center justify-center min-h-[480px]">
          {/* Card back (slightly rotated, slightly behind) */}
          <div className="absolute left-0 bottom-10 w-[300px] shadow-2xl rotate-[-7deg] z-10 drop-shadow-2xl">
            <Image
              src="/proconnect-card-front.png"
              alt="ProConnect Digital Business Card"
              width={640}
              height={400}
              className="w-full rounded-2xl"
              style={{ height: "auto" }}
              priority
            />
          </div>

          {/* Card front (slightly elevated, slightly rotated other way) */}
          <div className="absolute left-8 bottom-2 w-[290px] shadow-2xl rotate-[-2deg] z-20 drop-shadow-xl">
            <Image
              src="/proconnect-card-front.png"
              alt="ProConnect Digital Business Card"
              width={640}
              height={400}
              className="w-full rounded-2xl"
              style={{ height: "auto" }}
              priority
            />
          </div>

          {/* Phone mockup (right side) */}
          <div className="absolute right-0 top-0 w-[200px] h-[420px] bg-slate-950 rounded-[36px] p-2.5 shadow-2xl ring-1 ring-slate-800 z-30">
            <div className="w-20 h-3 bg-slate-900 rounded-full mx-auto mb-1.5" />
            <div className="h-full rounded-[28px] bg-gradient-to-b from-[#0a1628] to-[#1a3a6b] p-4 flex flex-col items-center overflow-hidden">
              <div className="text-amber-400/40 font-black text-2xl tracking-widest mb-1">TCP</div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center mb-2 text-xl font-black text-amber-400">JW</div>
              <p className="text-white font-black text-sm">Jordan Williams</p>
              <p className="text-white/60 text-[10px] mb-3">Tax Professional</p>
              <div className="w-full space-y-1.5">
                <div className="w-full bg-white/10 text-white/70 text-[9px] font-bold py-2 rounded-lg text-center">Tax Prep â†’</div>
                <div className="w-full bg-white/10 text-white/70 text-[9px] font-bold py-2 rounded-lg text-center">Business Tax â†’</div>
                <div className="w-full bg-amber-500 text-[#0a1628] text-[9px] font-black py-2 rounded-lg text-center mt-2">View full Marketplace profile â†’</div>
              </div>
            </div>
          </div>

          {/* Tap detected pill */}
          <div className="absolute bottom-0 right-2 bg-white shadow-xl rounded-xl px-3 py-2 flex items-center gap-2 z-40">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
              <Wifi className="w-3.5 h-3.5 text-amber-600 rotate-90" />
            </div>
            <div>
              <p className="text-[11px] font-black text-[#0a1628]">Tap detected</p>
              <p className="text-[10px] text-slate-500">Profile opens instantly</p>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ Ticker strip â”€â”€ */}
      <div className="border-t border-b border-[#0a1628]/10 dark:border-white/10 py-4 overflow-hidden bg-[#f0ece2] dark:bg-[#0a1628]/60">
        <div className="flex gap-12 animate-[marquee_20s_linear_infinite] whitespace-nowrap text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {["Client Meetings","Networking Events","Referral Partners","Everyday Connections","IRS Consultations","Tax Conferences"].map((t, i) => (
            <span key={i} className="shrink-0">{t} <span className="text-amber-500 mx-3">Â·</span></span>
          ))}
          {["Client Meetings","Networking Events","Referral Partners","Everyday Connections","IRS Consultations","Tax Conferences"].map((t, i) => (
            <span key={`r-${i}`} className="shrink-0">{t} <span className="text-amber-500 mx-3">Â·</span></span>
          ))}
        </div>
      </div>

      {/* â”€â”€ Value Proposition / Pricing â”€â”€ */}
      <section className="bg-[#0a1628] dark:bg-[#050d1a] py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-0.5 bg-amber-500" />
              <span className="text-amber-400 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>Premium Value</span>
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Professional connection<br />without the premium price.
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-1">ProConnect</p>
              <p className="text-5xl font-black text-amber-400">Free</p>
              <p className="text-xs text-white/50 mt-1">Activate today</p>
            </div>
            <div className="text-white/30 font-black text-2xl">vs.</div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-1">Competitor Pricing</p>
              <p className="text-5xl font-black text-white/30 line-through">$50+</p>
              <p className="text-xs text-white/40 mt-1">Comparable card</p>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-400/20 rounded-2xl p-6">
            <p className="text-amber-400 text-3xl font-black mb-1">Save $50+</p>
            <p className="text-white/80 text-sm leading-relaxed">
              ProConnect gives you a fully activated digital identity at no cost â€” included with your Tax Compliance Pro membership.
            </p>
          </div>
        </div>
      </section>

      {/* â”€â”€ How It Works â”€â”€ */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-0.5 bg-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>More Than a Business Card</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
            <h2 className="text-5xl sm:text-6xl font-bold leading-tight text-[#0a1628] dark:text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              From introduction<br />
              <em className="text-amber-600 dark:text-amber-400" style={{ fontStyle: "italic" }}>to opportunity.</em>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed max-w-md">
              It gives you one simple, shareable profile where clients and professional connections can quickly find your contact information, services, social links, and more.<br /><br />
              Update your information anytime â€” no reprinting business cards.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-px bg-[#0a1628]/10 dark:bg-white/10 z-0" />

          {[
            { num: "01", icon: CreditCard, title: "Activate Free", desc: "Visit taxcomppro.com/connect and activate your free Connect Card with your account." },
            { num: "02", icon: Sparkles, title: "Build your profile",  desc: "Tap your card or visit taxcomppro.com/connect to build your profile and choose your public URL." },
            { num: "03", icon: User, title: "Publish two profiles", desc: "Activation creates your public Tap Card page and your Marketplace profile together." },
            { num: "04", icon: TrendingUp, title: "Tap. Share. Grow.", desc: "Connect in person, by QR, or by link â€” and refine your presence with analytics." },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="relative z-10 flex flex-col gap-4 p-6 bg-white dark:bg-[#172135] rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#0a1628] dark:text-amber-400" />
                  </div>
                  <span className="text-2xl font-black text-slate-200 dark:text-slate-700">{s.num}</span>
                </div>
                <div>
                  <h3 className="font-black text-[#0a1628] dark:text-white mb-1.5">{s.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* â”€â”€ Features Grid â”€â”€ */}
      <section className="bg-[#0a1628] dark:bg-[#050d1a] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-6 h-0.5 bg-amber-500" />
              <span className="text-amber-400 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>Made for Modern Professionals</span>
              <div className="w-6 h-0.5 bg-amber-500" />
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Everything you need to<br />
              <em className="text-amber-400" style={{ fontStyle: "italic" }}>connect with confidence.</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/10">
            {[
              { icon: Wifi,      title: "Tap, scan, or share",     desc: "Open your public card by NFC tap, QR code, or a direct link â€” whatever fits the moment." },
              { icon: Plus,      title: "Save-ready contact",       desc: "Put contact, save, share, and QR actions up front so follow-up takes less effort." },
              { icon: Link2,     title: "Your links, your way",     desc: "Add, reorder, style, schedule, or pause websites, booking pages, services, reviews, courses, and social links." },
              { icon: User,      title: "Built-in visibility",      desc: "One activation creates your public Tap Card page and your professional Marketplace profile." },
              { icon: Shield,    title: "Three visibility levels",  desc: "Set applicable fields as public, members-only, or private â€” including contact details, documents, credentials, and links." },
              { icon: BarChart3, title: "Insights that help",       desc: "Track page views, NFC taps, QR scans, link clicks, contact saves, and full-profile visits." },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-[#0a1628] p-8 hover:bg-[#0d1f3c] transition-colors">
                  <div className="w-10 h-10 rounded-2xl border border-white/10 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-black text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* â”€â”€ Marketplace Integration â”€â”€ */}
      <section className="max-w-6xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Browser mockup */}
        <div className="bg-white dark:bg-[#172135] rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800">
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <div className="ml-3 flex-1 bg-white dark:bg-slate-800 rounded-lg px-3 py-1 text-[10px] text-slate-400 font-mono">
              marketplace.taxcomppro.com
            </div>
          </div>
          {/* Profile card inside */}
          <div className="p-6">
            <div className="bg-gradient-to-r from-[#0a1628] to-[#1a3a6b] rounded-xl p-4 flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-black text-sm">JW</div>
              <div>
                <p className="text-white font-black text-sm">Verified Professional Profile</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 font-black text-lg">JW</div>
              <div>
                <p className="font-black text-[#0a1628] dark:text-white">Jordan Williams</p>
                <p className="text-xs text-slate-500">Tax Compliance Professional</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {["Tax Preparation","Business Tax","Advisory"].map(t => (
                <span key={t} className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">{t}</span>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Helping individuals and growing businesses navigate tax compliance with clarity and confidence.</p>
            <button className="w-full bg-[#0a1628] dark:bg-amber-500 text-white dark:text-[#0a1628] text-xs font-black py-3 rounded-xl flex items-center justify-center gap-2">
              View services & credentials <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Flow arrow */}
          <div className="mx-4 mb-4 flex items-center rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 text-[11px] font-black">
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-center py-2.5">Public Tap Card</div>
            <ArrowRight className="w-4 h-4 text-slate-400 mx-2 shrink-0" />
            <div className="flex-1 bg-amber-400 text-[#0a1628] text-center py-2.5">Marketplace Profile</div>
          </div>
        </div>

        {/* Right: Copy */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-0.5 bg-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>Connected to the Marketplace</span>
          </div>
          <h2 className="text-5xl sm:text-6xl font-bold leading-tight text-[#0a1628] dark:text-white mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            A quick introduction.<br />
            <em className="text-amber-600 dark:text-amber-400" style={{ fontStyle: "italic" }}>A complete presence.</em>
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-8">
            Your public card keeps the first interaction fast. When someone wants to learn more, they can continue to your fuller Marketplace profile â€” without asking you to repeat your story.
          </p>
          <div className="space-y-4">
            {[
              { title: "One profile foundation", desc: "Create your public card and Marketplace presence from one activation." },
              { title: "A natural next step", desc: "Guide serious prospects from key details to deeper professional information." },
              { title: "Optional member handoff", desc: "The fuller profile experience can invite visitors to log in or register when appropriate." },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Check className="w-4 h-4 text-amber-500 mt-1 shrink-0 stroke-[3]" />
                <div>
                  <p className="font-black text-[#0a1628] dark:text-white text-sm">{item.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Dashboard & Analytics â”€â”€ */}
      <section className="bg-[#0a1628] dark:bg-[#050d1a] py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-0.5 bg-amber-500" />
              <span className="text-amber-400 text-xs font-black uppercase tracking-widest">Your Profile, Your Rules</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight text-white mb-6">
              Stay visible.<br />
              <span className="italic text-amber-400">Stay in control.</span>
            </h2>
            <p className="text-white/70 text-base leading-relaxed mb-8">
              Your dashboard keeps the details behind your first impression easy to manage. Update what people see, decide what is public, members-only, or private, and understand how your profile is working for you.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { dot: "amber", label: "Content & Custom Links" },
                { dot: "amber", label: "Privacy Controls" },
                { dot: "amber", label: "QR & Sharing Tools" },
                { dot: "amber", label: "Profile Analytics" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-white/80 text-xs font-bold uppercase tracking-wider">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Dashboard mockup */}
          <div className="bg-[#0d1f3c] rounded-3xl border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                </div>
                <span className="font-black text-white text-sm">Dashboard</span>
              </div>
              <span className="text-xs text-amber-400 font-bold">Live â€¢</span>
            </div>

            <div className="mb-5">
              <p className="text-white/50 text-xs font-bold mb-1">Profile views Â· Last 30 days</p>
              <div className="flex items-end justify-between gap-2 h-24">
                {[40, 52, 38, 65, 71, 58, 80, 72, 85, 90, 95].map((h, i) => (
                  <div key={i} className="flex-1 bg-amber-500/30 hover:bg-amber-500/60 transition-all rounded-t-md" style={{ height: `${h}%` }} />
                ))}
              </div>
              <p className="text-3xl font-black text-amber-400 mt-2">428 <span className="text-sm text-emerald-400 font-bold">+18%</span></p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Public card status", value: "Active", color: "text-emerald-400" },
                { label: "Privacy controls", value: "Manage â†’", color: "text-amber-400" },
                { label: "Share, QR & Wallet", value: "Open â†’", color: "text-amber-400" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-white/70 text-xs font-semibold">{row.label}</span>
                  </div>
                  <span className={`text-xs font-black ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-6 h-0.5 bg-amber-500" />
          <span className="text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest">Ready when you are</span>
          <div className="w-6 h-0.5 bg-amber-500" />
        </div>
        <h2 className="text-4xl sm:text-5xl font-black leading-tight text-[#0a1628] dark:text-white mb-4">
          Your digital identity,<br />
          <span className="italic text-amber-600 dark:text-amber-400">one tap away.</span>
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-lg mb-10 max-w-xl mx-auto">
          Get your ProConnect NFC digital business card for a one-time $29 purchase and start sharing a professional profile that works for you 24/7.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {hasPurchased ? (
            <button
              onClick={onStart}
              className="flex items-center gap-2 bg-[#0a1628] dark:bg-amber-500 text-white dark:text-[#0a1628] font-black text-base px-10 py-4 rounded-full hover:bg-[#1a3a6b] dark:hover:bg-amber-400 transition-all shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Set Up Your Card <Zap className="w-5 h-5 fill-white dark:fill-[#0a1628]" />
            </button>
          ) : (
            <button
              onClick={onBuy}
              disabled={buying}
              className="flex items-center gap-2 bg-[#0a1628] dark:bg-amber-500 text-white dark:text-[#0a1628] font-black text-base px-10 py-4 rounded-full hover:bg-[#1a3a6b] dark:hover:bg-amber-400 transition-all shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {buying ? "Opening Checkout..." : "Buy ProConnect Card — $29"} <Zap className="w-5 h-5 fill-white dark:fill-[#0a1628]" />
            </button>
          )}
          <Link href="/login?next=/connect" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-[#0a1628] dark:hover:text-white transition-colors">
            Already have an account? Log in →
          </Link>
        </div>
      </section>

      {/* CSS for marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   WIZARD (unchanged logic, upgraded from landing page)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ConnectWizard({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const loggedIn = !!session;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [goal, setGoal] = useState("tax-pro");

  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [biz, setBiz] = useState({ professionalTitle: "", businessName: "", businessDescription: "" });
  const [contact, setContact] = useState({ phone: "", businessAddress: "", website: "", bookingUrl: "" });
  const [social, setSocial] = useState({ instagram: "", linkedIn: "", twitter: "" });
  const [services] = useState<string[]>([]);

  const [theme, setTheme] = useState("classic");
  const [visibility] = useState<Record<string, Visibility>>({
    phone: "PUBLIC", email: "PUBLIC", address: "PRIVATE", booking: "PUBLIC",
    website: "PUBLIC", social: "PUBLIC", services: "PUBLIC",
  });
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [linkDraft, setLinkDraft] = useState<LinkRow>({ label: "", url: "" });

  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const [account, setAccount] = useState({ email: "", password: "", confirmPassword: "" });

  useEffect(() => {
    if (isPending || !loggedIn) return;
    setName(n => n || session!.user.name || "");
    fetch("/api/dashboard/connect-card")
      .then(r => r.json())
      .then((d: { card: { username: string; isActivated: boolean } | null }) => {
        if (d.card?.isActivated) router.replace(`/connect/${d.card.username}`);
      })
      .catch(() => {});
  }, [isPending, loggedIn, session, router]);

  const checkUsername = useCallback(async (value: string) => {
    if (value.trim().length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    try {
      const res = await fetch(`/api/connect/check-username?username=${encodeURIComponent(value)}`);
      const data = await res.json() as { available: boolean };
      setUsernameStatus(data.available ? "ok" : "taken");
    } catch { setUsernameStatus("idle"); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (username) checkUsername(username); }, 400);
    return () => clearTimeout(t);
  }, [username, checkUsername]);

  const addLink = () => {
    if (!linkDraft.label.trim() || !linkDraft.url.trim()) return;
    if (links.length >= 8) return;
    setLinks([...links, linkDraft]);
    setLinkDraft({ label: "", url: "" });
  };

  const activate = async () => {
    setError("");
    if (usernameStatus !== "ok") { setError("Choose an available username first."); return; }
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!loggedIn) {
      if (!account.email.trim()) { setError("Please enter your email address."); return; }
      if (account.password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (account.password !== account.confirmPassword) { setError("Passwords do not match."); return; }
    }
    setLoading(true);
    try {
      let currentUserId = session?.user?.id;
      if (!loggedIn) {
        const res = await signUp.email({ email: account.email, password: account.password, name });
        if (res.error) { setError(res.error.message || "Could not create your account."); setLoading(false); return; }
        const me = await fetch("/api/user/me").then(r => r.ok ? r.json() as Promise<{ id?: string }> : null).catch(() => null);
        currentUserId = me?.id;
      }
      const [image, logoUrl] = await Promise.all([
        imageFile ? uploadImage(imageFile, "avatar") : Promise.resolve(null),
        logoFile ? uploadImage(logoFile, "logo") : Promise.resolve(null),
      ]);
      const res = await fetch("/api/connect/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, image, logoUrl, headline: biz.professionalTitle, professionalTitle: biz.professionalTitle, businessName: biz.businessName, businessDescription: biz.businessDescription, phone: contact.phone, businessAddress: contact.businessAddress, website: contact.website, bookingUrl: contact.bookingUrl, linkedIn: social.linkedIn, twitter: social.twitter, theme, visibility, links }),
      });
      const data = await res.json() as { username?: string; error?: string };
      if (!res.ok) { setError(data.error || "Could not activate your card."); setLoading(false); return; }
      if (currentUserId && services.length > 0) {
        await Promise.all(services.map(title => fetch(`/api/pros/${currentUserId}/services`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) }).catch(() => {})));
      }
      router.push(`/connect/${data.username}`);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const selectedThemeObj = CARD_THEMES.find(t => t.value === theme) || CARD_THEMES[0];
  const progressPercent = Math.round(((step + 1) / STEP_LABELS.length) * 100);

  const Nav = ({ back, next, nextLabel = "Continue", canNext = true }: { back?: () => void; next?: () => void; nextLabel?: string; canNext?: boolean }) => (
    <div className="flex items-center justify-between pt-6 mt-8 border-t border-slate-100 dark:border-slate-800">
      {back ? (
        <button type="button" onClick={back} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-5 py-3 rounded-full transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      ) : (
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-5 py-3 rounded-full transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4" /> Overview
        </button>
      )}
      {next && (
        <button type="button" onClick={next} disabled={!canNext} className="flex items-center gap-2 bg-[#0a1628] dark:bg-amber-500 hover:bg-[#1a3a6b] dark:hover:bg-amber-400 text-white dark:text-[#0a1628] font-extrabold text-sm px-8 py-3.5 rounded-full shadow-lg transition-all disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]">
          {nextLabel} <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const handleKeyDown = (e: React.KeyboardEvent, nextFn: () => void) => {
    if (e.key === "Enter") { e.preventDefault(); nextFn(); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c1527] font-[var(--font-urbanist,Urbanist),sans-serif]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: Wizard */}
          <div className="lg:col-span-7 bg-white dark:bg-[#172135] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-10">

            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                <span>Step {step + 1} of {STEP_LABELS.length} Â· {STEP_LABELS[step]}</span>
                <span className="text-[#0a1628] dark:text-amber-400">{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#0a1628] to-[#1a3a6b] dark:from-amber-500 dark:to-amber-400 transition-all duration-500 ease-out rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 rounded-2xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" /><span>{error}</span>
              </div>
            )}

            {/* â”€â”€ Step 0: Goal â”€â”€ */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-amber-400/10 text-amber-600 dark:text-amber-400 text-xs font-extrabold px-3 py-1 rounded-full mb-3">
                    <Sparkles className="w-3.5 h-3.5" /> Step 1 of {STEP_LABELS.length}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white mb-2">Which best describes your primary goal?</h1>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">Select your goal to personalize your Tap Card &amp; Link-in-Bio page.</p>
                </div>
                <div className="grid grid-cols-1 gap-3.5">
                  {GOALS.map(g => {
                    const Icon = g.icon; const isSel = goal === g.id;
                    return (
                      <div key={g.id} onClick={() => setGoal(g.id)} className={`group relative flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${isSel ? "bg-slate-50 dark:bg-[#1e2e45] border-[#0a1628] dark:border-amber-400 shadow-md scale-[1.01]" : "bg-white dark:bg-[#172135] border-slate-200/80 dark:border-slate-800 hover:border-slate-300"}`}>
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${g.color} text-white flex items-center justify-center shrink-0 shadow-md`}><Icon className="w-6 h-6" /></div>
                        <div className="flex-1 pr-6">
                          <h3 className="font-extrabold text-base text-[#0a1628] dark:text-white mb-0.5">{g.title}</h3>
                          <p className="text-slate-500 dark:text-slate-300 text-xs leading-relaxed">{g.desc}</p>
                        </div>
                        {isSel && <div className="absolute top-5 right-5 w-6 h-6 rounded-full bg-[#0a1628] dark:bg-amber-500 text-white dark:text-[#0a1628] flex items-center justify-center"><Check className="w-4 h-4 stroke-[3]" /></div>}
                      </div>
                    );
                  })}
                </div>
                <Nav next={() => setStep(1)} />
              </div>
            )}

            {/* â”€â”€ Step 1: Name â”€â”€ */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white mb-2">What is your full display name?</h1>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">This appears at the top of your Connect Card &amp; link profile.</p>
                </div>
                <div>
                  <label className={lbl}>Display Name *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => handleKeyDown(e, () => { if (name.trim()) setStep(2); })} placeholder="Jane Smith, EA" className={`${inp} pl-12`} />
                  </div>
                </div>
                <Nav back={() => setStep(0)} next={() => setStep(2)} canNext={!!name.trim()} />
              </div>
            )}

            {/* â”€â”€ Step 2: Title â”€â”€ */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white mb-2">What is your professional title?</h1>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">Let clients know your specialty and credentials.</p>
                </div>
                <div className="space-y-3">
                  <label className={lbl}>Professional Title</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input autoFocus value={biz.professionalTitle} onChange={e => setBiz(b => ({ ...b, professionalTitle: e.target.value }))} onKeyDown={e => handleKeyDown(e, () => setStep(3))} placeholder="Enrolled Agent | IRS Tax Specialist" className={`${inp} pl-12`} />
                  </div>
                  <div className="pt-1">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Popular Suggestions</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_TITLES.map(st => (
                        <button key={st} type="button" onClick={() => setBiz(b => ({ ...b, professionalTitle: st }))} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${biz.professionalTitle === st ? "bg-[#0a1628] dark:bg-amber-500 text-white dark:text-[#0a1628] border-transparent" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"}`}>+ {st}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <Nav back={() => setStep(1)} next={() => setStep(3)} />
              </div>
            )}

            {/* â”€â”€ Step 3: Firm â”€â”€ */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white mb-2">What is your business or firm name?</h1>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">Optional â€” leave blank if operating under your personal name.</p>
                </div>
                <div>
                  <label className={lbl}>Business / Firm Name</label>
                  <input autoFocus value={biz.businessName} onChange={e => setBiz(b => ({ ...b, businessName: e.target.value }))} onKeyDown={e => handleKeyDown(e, () => setStep(4))} placeholder="Smith Tax Solutions LLC" className={inp} />
                </div>
                <Nav back={() => setStep(2)} next={() => setStep(4)} />
              </div>
            )}

            {/* â”€â”€ Step 4: Bio â”€â”€ */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white mb-2">Write a short bio or tagline</h1>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">Tell clients what you offer in 160 characters or less.</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={lbl}>Bio / Tagline</label>
                    <span className="text-xs font-bold text-slate-400">{biz.businessDescription.length}/160</span>
                  </div>
                  <textarea autoFocus value={biz.businessDescription} onChange={e => setBiz(b => ({ ...b, businessDescription: e.target.value.slice(0, 160) }))} rows={4} maxLength={160} placeholder="Helping individuals and small businesses navigate IRS audits, tax prep & representation..." className={`${inp} resize-none`} />
                </div>
                <Nav back={() => setStep(3)} next={() => setStep(5)} />
              </div>
            )}

            {/* â”€â”€ Step 5: Photo â”€â”€ */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white mb-2">Add your profile photo</h1>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">Upload a clean photo for your digital card â€” displayed as a modern rounded square.</p>
                </div>
                <div className="flex flex-col items-center p-10 rounded-3xl bg-slate-50 dark:bg-[#1e2e45] border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <div className="w-32 h-32 rounded-2xl bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden relative cursor-pointer group shadow-md hover:border-[#0a1628] dark:hover:border-amber-400 transition-all mb-4" onClick={() => document.getElementById("connect-avatar-input")?.click()}>
                    {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> : <Camera className="w-10 h-10 text-slate-400 group-hover:scale-110 transition-transform" />}
                    <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#0a1628] dark:bg-amber-500 text-white dark:text-[#0a1628] flex items-center justify-center shadow-lg"><Upload className="w-4 h-4" /></div>
                  </div>
                  <button type="button" onClick={() => document.getElementById("connect-avatar-input")?.click()} className="text-xs font-extrabold text-[#0a1628] dark:text-amber-400 hover:underline">{imagePreview ? "Change Photo" : "Upload Profile Photo"}</button>
                  <input id="connect-avatar-input" type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; setImageFile(f); setImagePreview(URL.createObjectURL(f)); }} />
                </div>
                <Nav back={() => setStep(4)} next={() => setStep(6)} />
              </div>
            )}

            {/* â”€â”€ Step 6: Logo â”€â”€ */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white mb-2">Upload your firm logo</h1>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">Optional â€” displays your firm logo alongside your profile.</p>
                </div>
                <div className="flex flex-col items-center p-10 rounded-3xl bg-slate-50 dark:bg-[#1e2e45] border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <div className="w-32 h-32 rounded-2xl bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden relative cursor-pointer group shadow-md hover:border-[#0a1628] dark:hover:border-amber-400 transition-all mb-4" onClick={() => document.getElementById("connect-logo-input")?.click()}>
                    {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-contain p-2" /> : <Briefcase className="w-10 h-10 text-slate-400 group-hover:scale-110 transition-transform" />}
                    <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#0a1628] dark:bg-amber-500 text-white dark:text-[#0a1628] flex items-center justify-center shadow-lg"><Upload className="w-4 h-4" /></div>
                  </div>
                  <button type="button" onClick={() => document.getElementById("connect-logo-input")?.click()} className="text-xs font-extrabold text-[#0a1628] dark:text-amber-400 hover:underline">{logoPreview ? "Change Logo" : "Upload Company Logo"}</button>
                  <input id="connect-logo-input" type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }} />
                </div>
                <Nav back={() => setStep(5)} next={() => setStep(7)} nextLabel={logoPreview ? "Continue" : "Skip for Now"} />
              </div>
            )}

            {/* â”€â”€ Step 7: Contact â”€â”€ */}
            {step === 7 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white mb-2">Direct Contact Information</h1>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">How clients reach you via phone or website.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={lbl}>Direct Phone Number</label>
                    <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} placeholder="(555) 000-0000" className={`${inp} pl-12`} /></div>
                  </div>
                  <div>
                    <label className={lbl}>Website URL</label>
                    <div className="relative"><Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input value={contact.website} onChange={e => setContact(c => ({ ...c, website: e.target.value }))} placeholder="https://yourfirm.com" className={`${inp} pl-12`} /></div>
                  </div>
                </div>
                <Nav back={() => setStep(6)} next={() => setStep(8)} />
              </div>
            )}

            {/* â”€â”€ Step 8: Booking â”€â”€ */}
            {step === 8 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white mb-2">Consultation Booking Link</h1>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">Allow clients to schedule consultations directly from your profile.</p>
                </div>
                <div>
                  <label className={lbl}>Calendly / Booking Link</label>
                  <div className="relative"><Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input autoFocus value={contact.bookingUrl} onChange={e => setContact(c => ({ ...c, bookingUrl: e.target.value }))} onKeyDown={e => handleKeyDown(e, () => setStep(9))} placeholder="https://calendly.com/your-name/consultation" className={`${inp} pl-12`} /></div>
                </div>
                <Nav back={() => setStep(7)} next={() => setStep(9)} nextLabel={contact.bookingUrl ? "Continue" : "Skip for Now"} />
              </div>
            )}

            {/* â”€â”€ Step 9: Socials â”€â”€ */}
            {step === 9 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white mb-2">Connect your social channels</h1>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">Add your professional social media handles.</p>
                </div>
                <div className="space-y-4">
                  <div><label className={lbl}>LinkedIn Profile URL</label><div className="relative"><LinkedinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input value={social.linkedIn} onChange={e => setSocial(s => ({ ...s, linkedIn: e.target.value }))} placeholder="https://linkedin.com/in/username" className={`${inp} pl-12`} /></div></div>
                  <div><label className={lbl}>Instagram @handle</label><div className="relative"><InstagramIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input value={social.instagram} onChange={e => setSocial(s => ({ ...s, instagram: e.target.value }))} placeholder="@username" className={`${inp} pl-12`} /></div></div>
                  <div><label className={lbl}>Twitter / X @handle</label><div className="relative"><TwitterIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input value={social.twitter} onChange={e => setSocial(s => ({ ...s, twitter: e.target.value }))} placeholder="@handle" className={`${inp} pl-12`} /></div></div>
                </div>
                <Nav back={() => setStep(8)} next={() => setStep(10)} />
              </div>
            )}

            {/* â”€â”€ Step 10: Custom Links â”€â”€ */}
            {step === 10 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white mb-2">Add custom link buttons</h1>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">Add Linktree-style buttons â€” guides, resources, booking pages, and more.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {links.map((l, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-[#1e2e45] rounded-2xl px-4 py-3 border border-slate-200/80 dark:border-slate-700/80">
                        <div><span className="font-extrabold text-[#0a1628] dark:text-white block">{l.label}</span><span className="text-xs text-slate-400 truncate max-w-xs block">{l.url}</span></div>
                        <button onClick={() => setLinks(links.filter((_, j) => j !== i))} className="p-1.5 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                  {links.length < 8 && (
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#1e2e45] border border-slate-200/60 dark:border-slate-800">
                      <input value={linkDraft.label} onChange={e => setLinkDraft(d => ({ ...d, label: e.target.value }))} placeholder="Button title (e.g. Download 2026 Tax Guide)" className={inp} />
                      <div className="flex gap-2">
                        <input value={linkDraft.url} onChange={e => setLinkDraft(d => ({ ...d, url: e.target.value }))} placeholder="https://..." className={`${inp} flex-1`} />
                        <button type="button" onClick={addLink} className="shrink-0 px-5 flex items-center rounded-2xl bg-[#0a1628] dark:bg-amber-500 text-white dark:text-[#0a1628] font-bold text-xs"><Plus className="w-4 h-4 mr-1" /> Add</button>
                      </div>
                    </div>
                  )}
                </div>
                <Nav back={() => setStep(9)} next={() => setStep(11)} />
              </div>
            )}

            {/* â”€â”€ Step 11: Theme â”€â”€ */}
            {step === 11 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white mb-2">Choose your visual theme</h1>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">Select a color palette for your Tap Card and public profile.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {CARD_THEMES.map(t => (
                    <button key={t.value} type="button" onClick={() => setTheme(t.value)} className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${theme === t.value ? "border-[#0a1628] dark:border-amber-400 ring-2 ring-amber-400/20 scale-[1.02]" : "border-slate-200 dark:border-slate-800"}`}>
                      <div className="w-12 h-12 rounded-xl shadow-md flex items-center justify-center shrink-0" style={{ background: t.bg, color: t.text }}><CreditCard className="w-6 h-6" /></div>
                      <div><h4 className="font-extrabold text-sm text-[#0a1628] dark:text-white">{t.label}</h4><span className="text-[10px] text-slate-400 font-semibold">Tap Card Theme</span></div>
                      {theme === t.value && <div className="ml-auto w-5 h-5 rounded-full bg-[#0a1628] dark:bg-amber-400 text-white dark:text-[#0a1628] flex items-center justify-center"><Check className="w-3 h-3 stroke-[3]" /></div>}
                    </button>
                  ))}
                </div>
                <Nav back={() => setStep(10)} next={() => setStep(12)} />
              </div>
            )}

            {/* â”€â”€ Step 12: Claim & Activate â”€â”€ */}
            {step === 12 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white mb-2">Claim your public profile link</h1>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">Choose your unique username handle and activate your page.</p>
                </div>
                <div>
                  <label className={lbl}>Your Custom URL Handle</label>
                  <div className="flex items-center border-2 border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#1e2e45] focus-within:border-[#0a1628] dark:focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20">
                    <span className="pl-4 pr-1 text-sm font-bold text-slate-400 shrink-0">taxcomppro.com/connect/</span>
                    <input autoFocus value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="jane-smith" className="flex-1 text-sm py-4 pr-4 bg-transparent outline-none font-bold text-[#0a1628] dark:text-white" />
                  </div>
                  <div className="text-xs h-5 flex items-center mt-1">
                    {usernameStatus === "checking" && <span className="text-slate-400 flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking availability...</span>}
                    {usernameStatus === "ok" && <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Handle available!</span>}
                    {usernameStatus === "taken" && <span className="text-red-500 font-bold">Handle taken â€” try another</span>}
                  </div>
                </div>

                {!loggedIn && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Set Up Your Account Login</h3>
                    <div><label className={lbl}>Email Address</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="email" value={account.email} onChange={e => setAccount(a => ({ ...a, email: e.target.value }))} placeholder="jane@example.com" className={`${inp} pl-12`} /></div></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><label className={lbl}>Password</label><div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type={showPw ? "text" : "password"} value={account.password} onChange={e => setAccount(a => ({ ...a, password: e.target.value }))} placeholder="At least 8 chars" className={`${inp} pl-12 pr-10`} /><button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                      <div><label className={lbl}>Confirm Password</label><div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type={showPw ? "text" : "password"} value={account.confirmPassword} onChange={e => setAccount(a => ({ ...a, confirmPassword: e.target.value }))} placeholder="Confirm password" className={`${inp} pl-12`} /></div></div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-[#1e2e45] rounded-2xl p-4 text-xs text-slate-500 dark:text-slate-300 leading-relaxed border border-slate-200/50 dark:border-slate-800">
                  Activating creates your public Tap Card at <strong>taxcomppro.com/connect/{username || "your-username"}</strong> and links to your Marketplace profile.
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setStep(11)} className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</button>
                  <button onClick={activate} disabled={loading || usernameStatus !== "ok"} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-sm px-9 py-4 rounded-full hover:shadow-xl hover:shadow-amber-500/20 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Activate Connect Card <Zap className="w-4 h-4 fill-white" /></>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Preview */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="text-center mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <Smartphone className="w-4 h-4 text-amber-500" /> Live Profile Preview
              </span>
            </div>
            <div className="w-full max-w-[320px] mx-auto h-[610px] bg-slate-950 rounded-[44px] p-3 shadow-2xl ring-1 ring-slate-800/80 flex flex-col overflow-hidden">
              <div className="w-28 h-4 bg-slate-900 rounded-full mx-auto mb-2 shrink-0" />
              <div className="flex-1 rounded-[34px] p-5 overflow-y-auto flex flex-col justify-between text-center transition-all duration-500" style={{ background: selectedThemeObj.bg, color: selectedThemeObj.text }}>
                <div>
                  <div className="w-20 h-20 rounded-2xl mx-auto mb-3 border-2 border-white/40 overflow-hidden shadow-lg bg-slate-800 flex items-center justify-center">
                    {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-white/60" />}
                  </div>
                  <h3 className="font-extrabold text-lg leading-tight mb-1 truncate px-2">{name || "Your Display Name"}</h3>
                  <p className="text-xs opacity-80 font-medium mb-1 truncate px-2">{biz.professionalTitle || "Tax Professional"}</p>
                  {biz.businessName && <p className="text-[11px] opacity-70 font-semibold mb-3">{biz.businessName}</p>}
                  {biz.businessDescription && <p className="text-[11px] opacity-80 leading-relaxed max-w-[240px] mx-auto mb-4 bg-black/10 backdrop-blur-sm rounded-xl p-2">{biz.businessDescription}</p>}
                  <div className="flex items-center justify-center gap-2.5 mb-5">
                    {contact.phone && <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Phone className="w-4 h-4" /></div>}
                    {contact.website && <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Globe className="w-4 h-4" /></div>}
                    {social.linkedIn && <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><LinkedinIcon className="w-4 h-4" /></div>}
                    {social.instagram && <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><InstagramIcon className="w-4 h-4" /></div>}
                    {social.twitter && <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><TwitterIcon className="w-4 h-4" /></div>}
                  </div>
                  <div className="space-y-2">
                    {contact.bookingUrl && (
                      <div className="w-full bg-amber-400 text-slate-950 font-extrabold text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> Book Consultation
                      </div>
                    )}
                    {links.map((l, i) => (
                      <div key={i} className="w-full bg-white/20 backdrop-blur-md text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-between border border-white/20">
                        <span className="truncate">{l.label}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10 mt-4 text-[9px] opacity-60 font-mono">
                  taxcomppro.com/connect/{username || "username"}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ROOT PAGE â€” switches between Landing â†’ Wizard
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ConnectRoot() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [mode, setMode] = useState<"landing" | "wizard">("landing");
  const [hasPurchased, setHasPurchased] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [buying, setBuying] = useState(false);

  // Check purchase status and handle Stripe redirect
  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      setHasPurchased(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const isPurchasedRedirect = params.get("purchased") === "1";
    const wantsActivate = params.get("activate") === "1";

    fetch(`/api/connect/verify-purchase${sessionId ? `?session_id=${sessionId}` : ""}`)
      .then((r) => r.json())
      .then((data: { hasPurchased?: boolean; isActivated?: boolean; username?: string | null }) => {
        if (data.hasPurchased) {
          setHasPurchased(true);
          if (data.isActivated && data.username) {
            router.replace(`/connect/${data.username}`);
            return;
          }
          if (isPurchasedRedirect || wantsActivate) {
            setMode("wizard");
          }
        } else {
          setHasPurchased(false);
        }
      })
      .catch(() => {});
  }, [session, isPending, router]);

  async function handleBuy() {
    if (!session?.user) {
      router.push("/login?next=/connect");
      return;
    }

    setBuying(true);
    try {
      const res = await fetch("/api/stripe/proconnect-checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Could not start checkout. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setBuying(false);
    }
  }

  function handleStart() {
    if (!session?.user) {
      router.push("/login?next=/connect?activate=1");
      return;
    }

    if (hasPurchased || (session.user as { role?: string }).role === "ADMIN") {
      setMode("wizard");
    } else {
      setShowPurchaseModal(true);
    }
  }

  if (mode === "wizard") {
    return <ConnectWizard onBack={() => setMode("landing")} />;
  }

  return (
    <>
      <ConnectLandingPage
        onStart={handleStart}
        hasPurchased={hasPurchased}
        onBuy={handleBuy}
        buying={buying}
      />

      {/* Modal shown if user tries to activate without purchasing */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-[#172135] rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
            <button
              type="button"
              onClick={() => setShowPurchaseModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
              <CreditCard className="w-7 h-7" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              ProConnect Card Required
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
              To activate your verified public profile and link your NFC card, a one-time <strong>$29</strong> card purchase is required.
            </p>

            <div className="bg-slate-50 dark:bg-[#1e2e45] rounded-2xl p-4 mb-6 text-left space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Physical Premium NFC Tap Card shipped to you</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Instant Digital Business Card &amp; Marketplace profile</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>No monthly or recurring card fees</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleBuy}
                disabled={buying}
                className="w-full bg-[#0a1628] dark:bg-amber-500 text-white dark:text-[#0a1628] font-black text-sm py-4 rounded-full hover:bg-[#1a3a6b] dark:hover:bg-amber-400 transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {buying ? "Redirecting to Stripe..." : "Buy ProConnect Card — $29"}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowPurchaseModal(false)}
                className="w-full text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white py-2"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ConnectActivationPage() {
  return (
    <Suspense>
      <ConnectRoot />
    </Suspense>
  );
}

