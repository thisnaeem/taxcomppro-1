export interface Toolkit {
  id: string;
  name: string;
  category: string;
  tagline: string;
  badge?: string;
  price: number;
  features: string[];
  membershipTier: "VIP" | "MARKETPLACE" | "MARKETPLACE_PLUS";
  membershipMonths: number;
  emoji: string;
  color: string;
  popular?: boolean;
  downloadEnvKey: string;
  badgeImage: string;
  description: string;
  externalUrl: string;
}

export const TOOLKITS: Toolkit[] = [
  {
    id: "30-day-tax-office",
    name: "30 Day Tax Office Launch",
    category: "BUSINESS LAUNCH",
    tagline: "Launch Fast & Compliant",
    badge: "Membership Included",
    price: 299.99,
    emoji: "🚀",
    color: "from-indigo-600 to-indigo-900",
    membershipTier: "VIP",
    membershipMonths: 2,
    downloadEnvKey: "TOOLKIT_DOWNLOAD_30_DAY_TAX_OFFICE",
    badgeImage: "/30-day-launch.png",
    description: "Build the foundation, systems, compliance, and client plan for your tax office in 30 focused days.",
    externalUrl: "https://30daylaunch.taxcomppro.com/",
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
    id: "due-diligence-course",
    name: "The Staff's Audit Ready Due Diligence Playbook",
    category: "STAFF TRAINING",
    tagline: "Staff Training & Compliance",
    badge: "Training Included",
    price: 299.99,
    emoji: "🎓",
    color: "from-amber-600 to-amber-900",
    membershipTier: "VIP",
    membershipMonths: 2,
    downloadEnvKey: "TOOLKIT_DOWNLOAD_DUE_DILIGENCE",
    badgeImage: "/audit-due-diligence.png",
    description: "Train staff, document completion, and maintain stronger office due-diligence records.",
    externalUrl: "https://staffaudit.taxcomppro.com/",
    features: [
      "Staff Due Diligence Certification",
      "IRS Due Diligence Workpapers",
      "Form 8867 Compliance Modules",
      "Office Recordkeeping Workflows",
      "Client Interview Protocols",
      "Staff Verification & Scoring",
    ],
  },
  {
    id: "irs-fine-defense",
    name: "IRS Fine Defense Toolkit",
    category: "COMPLIANCE TOOLKIT",
    tagline: "Penalty Risk Reduction",
    badge: "Most Popular",
    price: 299.99,
    emoji: "🛡️",
    color: "from-[#0a1628] to-[#1a3a6b]",
    popular: true,
    membershipTier: "VIP",
    membershipMonths: 2,
    downloadEnvKey: "TOOLKIT_DOWNLOAD_IRS_FINE_DEFENSE",
    badgeImage: "/irs-fine-defense.png",
    description: "Organize procedures, documentation, staff resources, and audit-readiness materials in one place.",
    externalUrl: "https://irsfinedefense.taxcomppro.com/",
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
    id: "schedule-c-reconstruction",
    name: "Schedule C Reconstruction Toolkit",
    category: "TAX PREPARATION",
    tagline: "Expense & Income Clarity",
    badge: "Membership Included",
    price: 299.99,
    emoji: "📊",
    color: "from-purple-600 to-purple-900",
    membershipTier: "VIP",
    membershipMonths: 2,
    downloadEnvKey: "TOOLKIT_DOWNLOAD_SCHEDULE_C",
    badgeImage: "/schedule-c-reconstruction.png",
    description: "Use a structured approach to interview, corroborate, and document reconstructed business records.",
    externalUrl: "https://schedulecrecon.taxcomppro.com/",
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
    id: "audit-playbook",
    name: "Audit Ready Playbook",
    category: "AUDIT READINESS",
    tagline: "IRS Audit Mastery",
    badge: "Membership Included",
    price: 299.99,
    emoji: "📋",
    color: "from-emerald-600 to-emerald-900",
    membershipTier: "VIP",
    membershipMonths: 2,
    downloadEnvKey: "TOOLKIT_DOWNLOAD_AUDIT_PLAYBOOK",
    badgeImage: "/audit-playbook.png",
    description: "Build repeatable workpaper, review, and documentation practices for defensible client files.",
    externalUrl: "https://auditplaybook.taxcomppro.com/",
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
    id: "credits-filing-status",
    name: "Credits & Filing Status Explained",
    category: "DUE DILIGENCE & CREDITS",
    tagline: "Tax Law & Due Diligence Clarity",
    badge: "Membership Included",
    price: 299.99,
    emoji: "📖",
    color: "from-blue-600 to-blue-900",
    membershipTier: "VIP",
    membershipMonths: 2,
    downloadEnvKey: "TOOLKIT_DOWNLOAD_CREDITS_FILING_STATUS",
    badgeImage: "/credits-filing-status.png",
    description: "Master filing statuses, qualifying dependents, head of household rules, and tax credit eligibility with audit-ready documentation.",
    externalUrl: "https://credits.taxcomppro.com/",
    features: [
      "Head of Household Qualification Protocols",
      "Tie-Breaker Rules & Dependent Decision Trees",
      "Earned Income Tax Credit (EITC) Due Diligence",
      "Child Tax Credit (CTC) & ACTC Verification Guide",
      "Credit for Other Dependents (ODC) Guidelines",
      "Form 8867 Preparer Due Diligence Checklists",
      "Client Interview Questionnaires & Intake Workpapers",
      "Disallowed Credit Recertification Process",
    ],
  },
];

export function getToolkit(id: string): Toolkit | undefined {
  return TOOLKITS.find((t) => t.id === id);
}

export function getAllToolkits(): Toolkit[] {
  return TOOLKITS;
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
  badgeImage?: string;
  description: string;
  externalUrl: string;
}

export const BUNDLES: Bundle[] = [
  {
    id: "ultimate-bundle",
    name: "Ultimate Bundle",
    tagline: "All Success Toolkits + Playbooks + VIP Membership",
    badge: "Ultimate Package",
    originalPrice: 1800,
    price: 1200,
    membershipTier: "MARKETPLACE_PLUS",
    membershipMonths: 2,
    color: "from-[#0a1628] to-[#1a3a6b]",
    accentColor: "amber",
    icon: "🏆",
    badgeImage: "/ultimate.webp",
    description: "The complete practice defense suite including all success toolkits, staff due diligence training, posters, and VIP community access.",
    externalUrl: "https://ultimate.taxcomppro.com/",
    features: [
      "30 Day Tax Office Launch",
      "The Staff's Audit Ready Due Diligence Course",
      "IRS Fine Defense Toolkit",
      "Schedule C Reconstruction",
      "Audit Ready Playbook",
      "Credits & Filing Status Explained",
      "IRS Penalty Defense Posters",
      "VIP Community Access (2 Months Free)",
      "Marketplace Plus",
    ],
  },
  {
    id: "ultimate-bundle-plus",
    name: "Ultimate Bundle PLUS",
    tagline: "All Toolkits + All Video Courses + 10 Staff Licenses",
    badge: "Flagship Suite",
    originalPrice: 3588,
    price: 2400,
    membershipTier: "MARKETPLACE_PLUS",
    membershipMonths: 6,
    color: "from-[#071426] to-[#162e52]",
    accentColor: "amber",
    icon: "👑",
    badgeImage: "/ultimateplus.webp",
    description: "The premier flagship suite: All 6 success toolkits, all complete video masterclasses on Atlas Academy with 10 staff training licenses, and 6 months of Marketplace Membership Plus.",
    externalUrl: "https://ultimateplus.taxcomppro.com/",
    features: [
      "All 6 Success Toolkits & Workpapers",
      "All 6 Atlas Academy Video Masterclasses",
      "10 Staff Training Licenses Included",
      "6 Months FREE Marketplace Membership Plus",
      "IRS Penalty Defense Office Posters",
      "Auto-Launch Atlas Academy Access",
      "Lifetime Form & Course Revisions",
      "Staff Due Diligence Certification",
    ],
  },
];

export function getBundle(id: string): Bundle | undefined {
  return BUNDLES.find((b) => b.id === id);
}

