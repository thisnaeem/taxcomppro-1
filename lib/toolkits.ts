export interface Toolkit {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  price: number;
  features: string[];
  membershipTier: "VIP" | "MARKETPLACE" | "MARKETPLACE_PLUS";
  membershipMonths: number;
  emoji: string;
  color: string;
  popular?: boolean;
  downloadEnvKey: string;
  badgeImage: string;
}

export interface Bundle {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  originalPrice: number;
  price: number;
  features: string[];
  highlightFeatures?: string[];
  membershipTier: "MARKETPLACE_PLUS";
  membershipMonths: number;
  color: string;
  accentColor: string;
  icon: string;
}

export const TOOLKITS: Toolkit[] = [
  {
    id: "irs-fine-defense",
    name: "IRS Fine Defense Toolkit",
    tagline: "Penalty Risk Reduction",
    badge: "Most Popular",
    price: 299.99,
    emoji: "🛡️",
    color: "from-[#0a1628] to-[#1a3a6b]",
    popular: true,
    membershipTier: "VIP",
    membershipMonths: 2,
    downloadEnvKey: "TOOLKIT_DOWNLOAD_IRS_FINE_DEFENSE",
    badgeImage: "/toolkits-badge/irs-fine-defense.webp",
    features: [
      "Penalty Risk Reduction Tools",
      "Practice Protection Resources",
      "Office Procedures/Controls",
      "Penalty Defense Posters",
      "Post Audit Direction",
      "Employee Forms",
      "Due Diligence/Compliance Forms",
      "Documentation & Recordkeeping Support",
      "Proven Marketing Strategies",
      "Brand Positioning",
    ],
  },
  {
    id: "30-day-tax-office",
    name: "30 Day Tax Office Launch",
    tagline: "Launch Fast & Compliant",
    badge: "Membership Included",
    price: 299.99,
    emoji: "🚀",
    color: "from-indigo-600 to-indigo-900",
    membershipTier: "VIP",
    membershipMonths: 2,
    downloadEnvKey: "TOOLKIT_DOWNLOAD_30_DAY_TAX_OFFICE",
    badgeImage: "/toolkits-badge/30 DAY TAX OFFICE LAUNCH.webp",
    features: [
      "Legal Setup Guide",
      "Business Banking Setup",
      "Pricing & Revenue Model Strategy",
      "PTIN & EFIN Application Blueprint",
      "Step-by-Step 30-Day Launch Plan",
      "Office Setup & Data Security",
      "ERO Responsibilities & Compliance",
      "Tax Software & Selection Guide",
      "Marketing & Branding Setup Checklist",
      "Hiring & Staff Accountability Structure",
    ],
  },
  {
    id: "audit-playbook",
    name: "Audit Playbook",
    tagline: "IRS Audit Mastery",
    badge: "Membership Included",
    price: 299.99,
    emoji: "📋",
    color: "from-emerald-600 to-emerald-900",
    membershipTier: "VIP",
    membershipMonths: 2,
    downloadEnvKey: "TOOLKIT_DOWNLOAD_AUDIT_PLAYBOOK",
    badgeImage: "/toolkits-badge/audit-playbok.webp",
    features: [
      "First 48-Hour Action Plan",
      "Revenue Agent Interview",
      "IRS Notice Breakdown Guide",
      "Audit File Preparation System",
      "Client Representation Blueprint",
      "Preparer Penalty Protection Guide",
      "Appeals & Adjustment Strategy",
      "Response Letter Templates",
      "Step-by-Step Audit Response Framework",
    ],
  },
  {
    id: "schedule-c-reconstruction",
    name: "Schedule C Reconstruction",
    tagline: "Expense & Income Clarity",
    badge: "Membership Included",
    price: 299.99,
    emoji: "📊",
    color: "from-purple-600 to-purple-900",
    membershipTier: "VIP",
    membershipMonths: 2,
    downloadEnvKey: "TOOLKIT_DOWNLOAD_SCHEDULE_C",
    badgeImage: "/toolkits-badge/SCHEDULE C RECONSTRUCTION.webp",
    features: [
      "Step-by-Step Reconstruction Framework",
      "Expense Categorization Blueprint",
      "Reconstruction Methods",
      "Home Office & COGS Verification",
      "Incomplete Records Strategy",
      "Audit Ready Workpaper System",
      "IRC §162 'Ordinary & Necessary' Standard",
      "Vehicle & Mileage Reconstruction Methods",
      "Personal vs Business Allocation Guide",
    ],
  },
  {
    id: "penalty-defense-posters",
    name: "IRS Penalty Defense Posters",
    tagline: "Compliance Posters",
    badge: "VIP Membership",
    price: 69.99,
    emoji: "🖼️",
    color: "from-amber-600 to-amber-800",
    membershipTier: "VIP",
    membershipMonths: 0,
    downloadEnvKey: "TOOLKIT_DOWNLOAD_PENALTY_POSTERS",
    badgeImage: "/toolkits-badge/irs-penalty-defense-posters-.webp",
    features: [
      "Due Diligence Disclosures",
      "Preparer Protection Statements",
      "Penalty Prevention Education",
      "Office Policy & Process",
      "Audit Awareness & Readiness",
      "Compliance-Focused Design",
      "Client Education & Awareness Messaging",
    ],
  },
];

export const BUNDLES: Bundle[] = [
  {
    id: "ultimate-bundle",
    name: "Ultimate Bundle",
    tagline: "All 4 Success Toolkits + VIP Membership + Marketplace Plus",
    badge: "Most Value",
    originalPrice: 1599,
    price: 1200,
    membershipTier: "MARKETPLACE_PLUS",
    membershipMonths: 3,
    color: "from-amber-500 to-amber-700",
    accentColor: "amber",
    icon: "🏆",
    features: [
      "VIP Community",
      "Marketplace Plus",
      "IRS Fine Defense Toolkits",
      "IRS Penalty Defense Posters",
      "30 Day Tax Office Launch",
      "Schedule C Reconstruction Toolkit",
      "Enhanced Visibility & Credibility",
      "VIP Priority Support",
      "Featured Marketplace Listing",
      "Quarterly Strategy Sessions",
    ],
  },
  {
    id: "atlas-elite-bundle",
    name: "Atlas Elite Bundle",
    tagline: "Our Everything for Success Bundle",
    badge: "Most Value",
    originalPrice: 3999,
    price: 1999,
    membershipTier: "MARKETPLACE_PLUS",
    membershipMonths: 3,
    color: "from-[#0a1628] to-[#1a3a6b]",
    accentColor: "blue",
    icon: "🤖",
    features: [
      "VIP Community",
      "Marketplace Plus",
      "IRS Fine Defense Toolkits",
      "IRS Penalty Defense Posters",
      "30 Day Tax Office Launch",
      "Schedule C Reconstruction Toolkit",
      "Enhanced Visibility & Credibility",
      "VIP Priority Support",
      "Featured Marketplace Listing",
      "Quarterly Strategy Sessions",
    ],
    highlightFeatures: [
      "ATLAS Software included",
      "10 ATLAS AI Bot assistant licenses",
      "Office automation tools",
    ],
  },
];

export function getToolkit(id: string): Toolkit | undefined {
  return TOOLKITS.find(t => t.id === id);
}

export function getAllToolkits(): Toolkit[] {
  return TOOLKITS;
}

export function getBundle(id: string): Bundle | undefined {
  return BUNDLES.find(b => b.id === id);
}
