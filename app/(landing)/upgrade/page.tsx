"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Loader2, CheckCircle2, Lock } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

// Tier hierarchy: higher index = higher tier
const TIER_RANK: Record<string, number> = {
  FREE: 0,
  VIP: 1,
  MARKETPLACE: 2,
  MARKETPLACE_PLUS: 3,
};

const plans = [
  {
    name: "Basic Members Only", price: 0, label: "FREE", period: "",
    img: "/plan-basic.webp", tier: "FREE", popular: false, badge: null, savings: null,
    features: [
      "Email Support",
      "Marketplace Access (View)",
      "Member Directory Access",
      "Communities Access (View)",
      "Marketplace Feed Access",
      "Secure Members-Only Environment",
    ],
    cta: "Current Plan",
    href: null,
  },
  {
    name: "VIP Members Only", price: 39.99, label: "$39.99", period: "/month",
    img: "/plan-vip.webp", tier: "VIP", popular: false, badge: "2 Months FREE", savings: null,
    features: [
      "Priority Email Support",
      "Private Messaging & DMs",
      "Training & Educational Support",
      "Marketplace Feed Interaction",
      "Communities Interaction",
      "Private Discussion Forums",
      "Ongoing Education & Training",
      "Ability to Connect",
      "Pro Training Access",
      "ATLAS AI Tax Bot",
      "Professional Networking",
    ],
    cta: "Upgrade to VIP",
    href: null,
  },
  {
    name: "VIP + Marketplace Bundle", price: 79.99, label: "$79.99", period: "/month",
    img: "/plan-marketplace.webp", tier: "MARKETPLACE", popular: true, badge: "Most Popular", savings: "Save $131.96/yr",
    features: [
      "Professional marketplace listing",
      "Custom seller profile",
      "Ability to sell services",
      "Private Discussion Forums",
      "Fully Customizable Profile",
      "Featured in Marketplace directory",
      "Enhanced Visibility & Credibility",
      "Stronger Brand Authority",
    ],
    cta: "Upgrade to Marketplace",
    href: null,
  },
  {
    name: "VIP + Marketplace Plus", price: 109.99, label: "$109.99", period: "/month",
    img: "/plan-marketplace-plus.webp", tier: "MARKETPLACE_PLUS", popular: true, badge: "Best Value", savings: "Save $131.96/yr",
    features: [
      "Professional marketplace listing",
      "Custom seller profile",
      "Ability to sell services",
      "Private Discussion Forums",
      "Fully Customizable Profile",
      "Featured in directory",
      "Enhanced Visibility",
      "Live Audio Session Hosting",
      "Live Video Session Hosting",
      "Post ads/products/services",
    ],
    cta: "Upgrade to Plus",
    href: null,
  },
];

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const user = useAppSelector(s => s.auth.user);
  const userTier = user?.tier ?? "FREE";
  const userRank = TIER_RANK[userTier] ?? 0;

  const handleUpgrade = async (tier: string) => {
    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-bold uppercase tracking-widest text-[#d4a017] mb-3">Pricing</p>
          <h1 className="text-4xl font-black text-[#0a1628] mb-3">Upgrade Your Plan</h1>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">
            All paid plans include 2 months free community access. Cancel anytime.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => {
            const planRank = TIER_RANK[plan.tier] ?? 0;
            const isCurrentPlan = userTier === plan.tier;
            const isLowerTier = planRank < userRank;
            const showCurrentPlan = isCurrentPlan || isLowerTier;

            return (
              <div key={plan.name} className={`relative bg-white rounded-2xl flex flex-col overflow-hidden transition-all hover:-translate-y-1 ${
                plan.popular
                  ? "shadow-xl border-2 border-[#d4a017]"
                  : "shadow-md border border-slate-200 hover:shadow-xl"
              }`}>
                {/* Gold top accent bar */}
                {plan.popular && <div className="h-1.5 w-full bg-gradient-to-r from-[#f0c040] to-[#d4a017]" />}

                {/* Badge */}
                {plan.badge && !showCurrentPlan && (
                  <div className="absolute top-4 right-4">
                    <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide ${
                      plan.popular
                        ? "bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628]"
                        : "bg-[#0a1628] text-white"
                    }`}>{plan.badge}</span>
                  </div>
                )}

                {/* "Current Plan" badge when user is on this tier or above */}
                {showCurrentPlan && (
                  <div className="absolute top-4 right-4">
                    <span className="text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide bg-emerald-500 text-white">
                      {isCurrentPlan ? "Current Plan" : "Included"}
                    </span>
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1">
                  {/* Plan image */}
                  <div className="flex justify-center mb-5">
                    <Image src={plan.img} alt={plan.name} width={130} height={130} className="object-contain" />
                  </div>

                  {/* Name */}
                  <h3 className="text-center font-black text-base text-[#0a1628] mb-1">{plan.name}</h3>

                  {/* Savings */}
                  {plan.savings && !showCurrentPlan && (
                    <p className="text-center text-xs font-bold text-[#d4a017] mb-3">{plan.savings}</p>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline justify-center gap-1 mb-6">
                    <span className="text-4xl font-black text-[#0a1628]">{plan.label}</span>
                    <span className="text-sm text-slate-400">{plan.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2 items-start text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-px text-emerald-500" />{f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {showCurrentPlan ? (
                    <div className="w-full text-center text-sm font-bold py-3.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default">
                      {isCurrentPlan ? "✓ Current Plan" : "✓ Included in Your Plan"}
                    </div>
                  ) : plan.tier === "FREE" ? (
                    <div className="w-full text-center text-sm font-bold py-3.5 rounded-full bg-slate-100 text-slate-400 cursor-default">
                      {plan.cta}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.tier)}
                      disabled={loading === plan.tier}
                      className={`w-full text-sm font-bold py-3.5 rounded-full transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${
                        plan.popular
                          ? "bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] hover:shadow-[0_0_20px_rgba(212,160,23,0.4)]"
                          : "bg-[#0a1628] text-white hover:bg-[#1a3a6b]"
                      }`}>
                      {loading === plan.tier ? <><Loader2 className="w-4 h-4 animate-spin" />Redirecting…</> : plan.cta}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust strip */}
        <div className="mt-8 bg-white rounded-2xl p-5 text-center flex flex-col sm:flex-row items-center justify-center gap-4 border border-slate-200 shadow-sm">
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <Lock className="w-4 h-4 text-slate-400" />
            Secure payments powered by <strong className="text-[#0a1628]">Stripe</strong>.
            Cancel anytime. No hidden fees.
          </span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-sm text-slate-400">
            Questions?{" "}
            <Link href="/contact" className="text-[#0a1628] font-semibold hover:underline">Contact support</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
