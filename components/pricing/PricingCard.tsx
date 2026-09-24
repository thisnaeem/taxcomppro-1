"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Tick02Icon, ArrowRight01Icon, CheckmarkCircle02Icon } from "hugeicons-react";
import { Check } from "lucide-react";
import { PricingPlan, PlanTier } from "@/lib/pricing-plans";
import "@/components/landing/member-pages.css";

export interface PricingCardProps {
  plan: PricingPlan;
  mode?: "select" | "landing" | "upgrade";
  selected?: boolean;
  onSelect?: (tier: PlanTier) => void;
  // Upgrade mode props
  isCurrent?: boolean;
  included?: boolean;
  user?: any;
  isLoading?: boolean;
  upgradeLoadingTier?: string | null;
  onUpgrade?: (tier: PlanTier) => void;
  // Optional features expansion
  expanded?: boolean;
  className?: string;
}

export function PricingCard({
  plan,
  mode = "landing",
  selected = false,
  onSelect,
  isCurrent = false,
  included = false,
  user,
  isLoading = false,
  upgradeLoadingTier = null,
  onUpgrade,
  expanded = false,
  className = "",
}: PricingCardProps) {
  const isSelected = mode === "select" && selected;
  const isSelectable = mode === "select";

  const handleCardClick = () => {
    if (isSelectable && onSelect) {
      onSelect(plan.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isSelectable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onSelect?.(plan.id);
    }
  };

  // Determine features to display
  const displayedFeatures = expanded
    ? plan.features
    : plan.tier === "MARKETPLACE_PLUS"
    ? [...plan.features.slice(-3), ...plan.features.slice(0, 2)]
    : plan.features.slice(0, 5);

  const cardClasses = [
    "pricing-card",
    plan.popular ? "pricing-featured" : "",
    isSelected ? "pricing-selected" : "",
    isSelectable ? "pricing-selectable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={cardClasses}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role={isSelectable ? "radio" : undefined}
      aria-checked={isSelectable ? isSelected : undefined}
      tabIndex={isSelectable ? 0 : undefined}
    >
      {/* Top Visual Art Box */}
      <div className="pricing-art">
        <Image
          src={plan.img}
          alt=""
          width={120}
          height={120}
          className="object-contain"
        />

        {/* Badge or Status Badge */}
        {mode === "upgrade" && (isCurrent || included || plan.badge) && (
          <span className="pricing-badge">
            {isCurrent ? "Current plan" : included ? "Included" : plan.badge}
          </span>
        )}

        {mode === "landing" && plan.badge && (
          <span className="pricing-badge">{plan.badge}</span>
        )}

        {mode === "select" && (
          <>
            {plan.badge && (
              <span className="pricing-badge pricing-badge-left">
                {plan.badge}
              </span>
            )}
            <div
              className={`pricing-select-indicator ${
                isSelected ? "is-selected" : ""
              }`}
              aria-hidden="true"
            >
              {isSelected ? (
                <Check size={14} strokeWidth={3} />
              ) : null}
            </div>
          </>
        )}
      </div>

      {/* Card Content Body */}
      <div className="pricing-body">
        <h2>{plan.name}</h2>
        <p className="pricing-description">{plan.description}</p>

        {/* Price & Period */}
        <div className="pricing-price">
          <strong>{plan.price}</strong>
          <span>{plan.period || "Forever"}</span>
        </div>

        {/* Savings / Value Subtitle */}
        <p className="pricing-savings">
          {plan.savings ||
            (plan.priceAmount === 0
              ? "Start with the essentials"
              : "Invest in your professional growth")}
        </p>

        {/* Action Button Area */}
        <div className="pricing-action">
          {mode === "select" && (
            <button
              type="button"
              className={`mp-button ${isSelected ? "" : "mp-button-secondary"}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(plan.id);
              }}
            >
              {isSelected ? (
                <>
                  <Tick02Icon size={18} />
                  <span>Selected</span>
                </>
              ) : (
                <span>Choose {plan.tier === "FREE" ? "Free" : "Plan"}</span>
              )}
            </button>
          )}

          {mode === "landing" && (
            <Link
              href={plan.href}
              className={`mp-button ${plan.popular ? "" : "mp-button-secondary"}`}
            >
              <span>{plan.cta}</span>
              <ArrowRight01Icon size={17} />
            </Link>
          )}

          {mode === "upgrade" && (
            <>
              {isCurrent || included ? (
                <span className="mp-button mp-button-secondary">
                  <Tick02Icon size={18} />
                  {isCurrent ? "Current plan" : "Included in your plan"}
                </span>
              ) : !user && !isLoading ? (
                <Link
                  className={`mp-button ${
                    plan.popular ? "" : "mp-button-secondary"
                  }`}
                  href={
                    plan.tier === "FREE"
                      ? "/register"
                      : "/login?next=%2Fupgrade"
                  }
                >
                  {plan.tier === "FREE"
                    ? "Get started free"
                    : "Sign in to upgrade"}
                  <ArrowRight01Icon size={17} />
                </Link>
              ) : (
                <button
                  type="button"
                  className={`mp-button ${
                    plan.popular ? "" : "mp-button-secondary"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpgrade?.(plan.id);
                  }}
                  disabled={Boolean(upgradeLoadingTier) || isLoading}
                >
                  {isLoading
                    ? "Loading your plan…"
                    : upgradeLoadingTier === plan.id
                    ? "Opening checkout…"
                    : plan.cta}
                  <ArrowRight01Icon size={17} />
                </button>
              )}
            </>
          )}
        </div>

        {/* Features Checklist */}
        <p className="pricing-list-label">What’s included</p>
        <ul id={`features-${plan.tier}`} className="pricing-features">
          {displayedFeatures.map((feature) => (
            <li key={feature}>
              <Tick02Icon size={17} aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default PricingCard;
