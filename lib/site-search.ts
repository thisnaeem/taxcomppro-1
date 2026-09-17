export const SEARCH_CATEGORIES = ["Pages", "Courses", "Toolkits", "Professionals", "Groups", "Networks", "Marketplace"] as const;
export type SearchCategory = typeof SEARCH_CATEGORIES[number];
export type SiteSearchResult = { id: string; title: string; description: string; href: string; category: SearchCategory };
export const SEARCH_PAGES: SiteSearchResult[] = [
  { id: "feed", title: "Home feed", description: "Community posts and conversations", href: "/feed", category: "Pages" },
  { id: "courses", title: "Courses", description: "Atlas Academy · Training, compliance, due diligence and professional learning", href: "/courses", category: "Pages" },
  { id: "toolkits", title: "Toolkits", description: "Resources and templates for your tax practice", href: "/toolkits", category: "Pages" },
  { id: "pros", title: "Find a Pro", description: "Find tax professionals and specialists", href: "/find-a-pro", category: "Pages" },
  { id: "groups", title: "Groups", description: "Discover communities and conversations", href: "/groups", category: "Pages" },
  { id: "networks", title: "Pro Networks", description: "Professional circles and member networks", href: "/pro-networks", category: "Pages" },
  { id: "marketplace", title: "Marketplace", description: "Services, products and training", href: "/marketplace", category: "Pages" },
  { id: "talks", title: "Pro Talks", description: "Live audio conversations and events", href: "/pro-talks", category: "Pages" },
  { id: "plans", title: "Membership plans", description: "Pricing, benefits and upgrades", href: "/upgrade", category: "Pages" },
  { id: "contact", title: "Contact us", description: "Get help from Tax Compliance Pro", href: "/contact", category: "Pages" },
];
export function searchScore(result: SiteSearchResult, query: string) {
  const title = result.title.toLowerCase(), text = `${title} ${result.description.toLowerCase()}`;
  const words = query.toLowerCase().trim().split(/\s+/);
  if (!words.every(word => text.includes(word))) return 0;
  return title === query.toLowerCase() ? 100 : title.startsWith(query.toLowerCase()) ? 80 : words.every(word => title.includes(word)) ? 60 : 30;
}
