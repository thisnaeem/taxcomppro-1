"use client";

import Link from "next/link";
import { ArrowRight, Crown, Zap, CheckCircle2 } from "lucide-react";

interface Props {
  feature: string;
  description?: string;
}

export default function UpgradeGate({ feature, description }: Props) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-slate-50">
      <div className="max-w-md w-full text-center">

        {/* Crown icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#ffbe24] to-[#ffbe24] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-200/60">
          <Crown className="w-10 h-10 text-[#0a1628]" />
        </div>

        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
          <Zap className="w-3.5 h-3.5 fill-amber-500" /> VIP Members Only
        </div>

        <h1 className="text-3xl font-black text-[#0a1628] mb-3 leading-tight">
          Unlock {feature}
        </h1>
        <p className="text-slate-500 text-base leading-relaxed mb-8">
          {description ??
            `${feature} is exclusively available to VIP members. Upgrade now to get full access to all platform features.`}
        </p>

        {/* Pricing card */}
        <div className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] rounded-2xl p-6 mb-6 text-white text-left">
          <div className="text-[11px] font-black uppercase tracking-widest text-[#ffbe24] mb-3">
            VIP Membership
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-4xl font-black">$39.99</span>
            <span className="text-white/50 text-sm">/month</span>
          </div>
          <p className="text-white/40 text-xs mb-5">Cancel anytime · 2 months free on annual plan</p>
          <ul className="space-y-2.5">
            {[
              "Private Messaging & DMs",
              "Connections & Networking",
              "Pro Talks Audio Rooms",
              "Feed Posting, Liking & Commenting",
              "ATLAS AI Tax Assistant",
              "Communities Full Interaction",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                <CheckCircle2 className="w-4 h-4 text-[#ffbe24] shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/upgrade"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ffbe24] to-[#ffbe24] text-[#0a1628] font-black px-8 py-4 rounded-full hover:shadow-[0_0_30px_rgba(255, 190, 36,0.45)] hover:-translate-y-0.5 transition-all text-base"
        >
          Upgrade to VIP <ArrowRight className="w-5 h-5" />
        </Link>

        <p className="text-xs text-slate-400 mt-4">Already a VIP member? Try refreshing the page.</p>
      </div>
    </div>
  );
}
