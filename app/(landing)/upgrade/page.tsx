"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { Tick02Icon, LockKeyIcon, ArrowRight01Icon, ArrowDown01Icon } from "hugeicons-react";
import { useAppSelector } from "@/store/hooks";

import { PRICING_PLANS, TIER_RANK, PlanTier } from "@/lib/pricing-plans";
import PricingCard from "@/components/pricing/PricingCard";
import "@/components/landing/member-pages.css";

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const checkoutPending = useRef(false);
  const { user, isLoading } = useAppSelector((s) => s.auth);
  const userTier = (user?.tier as PlanTier) ?? "FREE";
  const userRank = TIER_RANK[userTier] ?? 0;

  const handleUpgrade = async (tier: PlanTier) => {
    if (checkoutPending.current) return;
    checkoutPending.current = true;
    setLoading(tier);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      if (res.status === 401) {
        window.location.assign("/login?next=%2Fupgrade");
        return;
      }
      const data = await res.json();
      if (!res.ok || typeof data.url !== "string" || !data.url) {
        throw new Error("Checkout could not be started. Please try again or contact support.");
      }
      window.location.assign(data.url);
    } catch {
      setError("Checkout could not be started. Please try again or contact support.");
    } finally {
      checkoutPending.current = false;
      setLoading(null);
    }
  };

  return (
    <div className="mp-page pricing-page">
      <div className="mp-container">
        <header className="mp-hero">
          <p className="mp-eyebrow">Memberships for your next chapter</p>
          <h1>
            Upgrade your plan.
            <br />
            <span>Move your practice forward.</span>
          </h1>
          <p>All paid plans include 2 months free community access. Cancel anytime.</p>
          <div className="mp-hero-links">
            <a href="#plans">
              Explore plans <ArrowDown01Icon size={18} />
            </a>
            <Link href="/contact">
              Need help choosing? <ArrowRight01Icon size={18} />
            </Link>
          </div>
        </header>

        <section id="plans" aria-label="Membership plans">
          <div className="pricing-toolbar">
            <p>Find the right fit for your practice</p>
            <span>Monthly memberships · USD</span>
          </div>
          {error && (
            <div className="mp-error" role="alert">
              {error} <Link href="/contact">Contact support</Link>
            </div>
          )}
          <div className="pricing-grid">
            {PRICING_PLANS.map((plan) => {
              const isCurrent = !!user && userTier === plan.tier;
              const included = !!user && (TIER_RANK[plan.tier] ?? 0) < userRank;
              return (
                <PricingCard
                  key={plan.tier}
                  plan={plan}
                  mode="upgrade"
                  isCurrent={isCurrent}
                  included={included}
                  user={user}
                  isLoading={isLoading}
                  upgradeLoadingTier={loading}
                  onUpgrade={handleUpgrade}
                  expanded={expanded}
                />
              );
            })}
          </div>
          <div className="pricing-compare">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-controls={PRICING_PLANS.map((p) => `features-${p.tier}`).join(" ")}
            >
              {expanded ? "Show key features" : "Compare all plan features"}
              <ArrowDown01Icon size={18} className={expanded ? "mp-rotate" : ""} />
            </button>
          </div>
        </section>
        <div className="pricing-trust"><LockKeyIcon size={21} aria-hidden="true" /><p>Secure payments powered by <strong>Stripe</strong>. Cancel anytime. No hidden fees.</p><Link href="/contact">Contact support <ArrowRight01Icon size={17} /></Link></div>
        <section className="mp-faq" aria-labelledby="pricing-faq">
          <div><p className="mp-eyebrow">A little clarity</p><h2 id="pricing-faq">Before you choose.</h2><p>Have a question about the right membership for your practice? <Link href="/contact">Talk to our team.</Link></p></div>
          <div className="mp-faq-items">
            <details><summary>Can I get started for free?<ArrowDown01Icon size={18} /></summary><p>Yes. Basic membership includes email support, member directory access, and view access to the marketplace and groups. Create an account to get started.</p></details>
            <details><summary>Which plan is right for my practice?<ArrowDown01Icon size={18} /></summary><p>Choose VIP for training and professional connections. The Marketplace Bundle adds a professional listing and seller profile. Marketplace Plus adds live audio and video hosting and the ability to post ads, products, and services.</p></details>
            <details><summary>How am I billed?<ArrowDown01Icon size={18} /></summary><p>Paid plans are monthly memberships, with prices shown in US dollars. Review your payment details in Stripe checkout before confirming your subscription.</p></details>
            <details><summary>Can I cancel my membership?<ArrowDown01Icon size={18} /></summary><p>You can cancel anytime. Contact support if you need help with your membership or billing.</p></details>
          </div>
        </section>
      </div>
    </div>
  );
}


