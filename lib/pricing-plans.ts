export type PlanTier = "FREE" | "VIP" | "MARKETPLACE" | "MARKETPLACE_PLUS";

export interface PricingPlan {
  id: PlanTier;
  tier: PlanTier;
  name: string;
  price: string;
  priceAmount: number;
  period: string;
  img: string;
  popular: boolean;
  badge: string | null;
  savings: string | null;
  description: string;
  features: string[];
  cta: string;
  href: string;
}

export const TIER_RANK: Record<string, number> = {
  FREE: 0,
  VIP: 1,
  MARKETPLACE: 2,
  MARKETPLACE_PLUS: 3,
};

export const PRICING_DESCRIPTIONS: Record<PlanTier, string> = {
  FREE: "Explore the community and discover your next connection.",
  VIP: "Build your expertise with training and professional connections.",
  MARKETPLACE: "Put your practice in front of your next client.",
  MARKETPLACE_PLUS: "Grow your visibility with live sessions and more ways to share.",
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "FREE",
    tier: "FREE",
    name: "Basic Members Only",
    price: "FREE",
    priceAmount: 0,
    period: "Forever",
    img: "/plan-basic.webp",
    popular: false,
    badge: null,
    savings: "Start with the essentials",
    description: PRICING_DESCRIPTIONS.FREE,
    features: [
      "Email Support",
      "Marketplace Access (View)",
      "Member Directory Access",
      "Groups Access (View)",
      "Marketplace Feed Access",
      "Secure Members-Only Environment",
    ],
    cta: "Join For Free",
    href: "/register?plan=FREE",
  },
  {
    id: "VIP",
    tier: "VIP",
    name: "VIP Members Only",
    price: "$39.99",
    priceAmount: 39.99,
    period: "/month",
    img: "/plan-vip.webp",
    popular: false,
    badge: "2 Months FREE",
    savings: "Invest in your professional growth",
    description: PRICING_DESCRIPTIONS.VIP,
    features: [
      "Priority Email Support",
      "Private Messaging & DMs",
      "Training & Educational Support",
      "Marketplace Feed Interaction",
      "Groups Interaction",
      "Private Discussion Forums",
      "Ongoing Education & Training",
      "Ability to Connect",
      "Pro Training Access",
      "ATLAS AI Tax Bot",
      "Professional Networking",
    ],
    cta: "Join VIP",
    href: "/register?plan=VIP",
  },
  {
    id: "MARKETPLACE",
    tier: "MARKETPLACE",
    name: "VIP + Marketplace Bundle",
    price: "$79.99",
    priceAmount: 79.99,
    period: "/month",
    img: "/plan-marketplace.webp",
    popular: true,
    badge: "Most Popular",
    savings: "Save $131.96/yr",
    description: PRICING_DESCRIPTIONS.MARKETPLACE,
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
    cta: "Start Marketplace Plan",
    href: "/register?plan=MARKETPLACE",
  },
  {
    id: "MARKETPLACE_PLUS",
    tier: "MARKETPLACE_PLUS",
    name: "VIP + Marketplace Plus",
    price: "$129.99",
    priceAmount: 129.99,
    period: "/month",
    img: "/plan-marketplace-plus.webp",
    popular: true,
    badge: "Best Value",
    savings: "Save $131.96/yr",
    description: PRICING_DESCRIPTIONS.MARKETPLACE_PLUS,
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
      "Post Ads/Products/Services",
    ],
    cta: "Get Best Value",
    href: "/register?plan=MARKETPLACE_PLUS",
  },
];
