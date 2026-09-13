export interface ProTalkCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  emoji?: string;
  description: string;
}

export const PRO_TALK_CATEGORIES: ProTalkCategory[] = [
  { id: "tax-law", name: "Tax Law & Updates", slug: "tax-law-updates", icon: "CourtLawIcon", description: "IRS code changes, statutory updates, and court rulings" },
  { id: "due-diligence", name: "Due Diligence & Compliance", slug: "due-diligence-compliance", icon: "CheckListIcon", description: "Circular 230, Form 8867, and regulatory safeguards" },
  { id: "irs-audits", name: "IRS Audits & Notices", slug: "irs-audits-notices", icon: "Audit01Icon", description: "Audit defense, CP notices, and representation strategies" },
  { id: "tax-credits", name: "Tax Credits & Filing Status", slug: "tax-credits-filing-status", icon: "CreditCardIcon", description: "EITC, CTC, clean energy, and dependent rules" },
  { id: "schedule-c", name: "Schedule C & Business Returns", slug: "schedule-c-business-returns", icon: "Briefcase01Icon", description: "Sole props, 1099, deductions, and small business tax" },
  { id: "office-startup", name: "Tax Office Start-Up", slug: "tax-office-start-up", icon: "Rocket01Icon", description: "Licensing, software selection, and launch blueprint" },
  { id: "office-operations", name: "Tax Office Operations", slug: "tax-office-operations", icon: "Building02Icon", description: "SOPs, workflow optimization, and practice management" },
  { id: "software-tech", name: "Tax Software & Technology", slug: "tax-software-technology", icon: "ComputerIcon", description: "Drake, ProConnect, TaxSlayer, and tech stacks" },
  { id: "ai-automation", name: "AI & Automation", slug: "ai-automation", icon: "AiBrain01Icon", description: "Atlas AI, automated intake, and bot workflows" },
  { id: "marketing-growth", name: "Marketing & Business Growth", slug: "marketing-business-growth", icon: "Analytics01Icon", description: "Client acquisition, social proof, and scaling revenue" },
  { id: "client-management", name: "Client Management", slug: "client-management", icon: "UserGroupIcon", description: "Onboarding, retention, pricing, and boundaries" },
  { id: "staffing-training", name: "Staffing & Training", slug: "staffing-training", icon: "School01Icon", description: "Hiring preparers, review processes, and team growth" },
  { id: "efin-ero", name: "EFIN / ERO Discussions", slug: "efin-ero-discussions", icon: "Shield01Icon", description: "EFIN applications, monitoring, and compliance" },
  { id: "tax-season-talk", name: "Tax Season Talk", slug: "tax-season-talk", icon: "Clock01Icon", description: "Peak season strategy, triage, and real-time war stories" },
  { id: "industry-news", name: "Industry News & Updates", slug: "industry-news-updates", icon: "News01Icon", description: "Fintech, national developments, and IRS bulletins" },
  { id: "prof-development", name: "Professional Development", slug: "professional-development", icon: "Award01Icon", description: "EA, CPA, CE credits, and credentials" },
  { id: "networking-collab", name: "Networking & Collaboration", slug: "networking-collaboration", icon: "UserMultiple02Icon", description: "Partnering, cross-referrals, and pro network building" },
  { id: "expert-qa", name: "Expert Q&A", slug: "expert-qa", icon: "QuestionIcon", description: "Live open floor with seasoned tax practitioners" },
  { id: "open-discussion", name: "Open Discussion", slug: "open-discussion", icon: "Mic01Icon", description: "Unfiltered discussions, community ideas, and open mic" },
];

export const AUDIENCE_REACTIONS = ["👏", "❤️", "👍", "🔥", "😂", "💡", "🎯"] as const;
export type AudienceReaction = typeof AUDIENCE_REACTIONS[number];

export interface LivePoll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  isActive: boolean;
  showResultsToAudience: boolean;
  createdAt: number;
}
