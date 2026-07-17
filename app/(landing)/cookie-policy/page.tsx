import type { Metadata } from "next";
import { Cookie, Settings, BarChart2, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy | TaxCompPro",
  description: "Learn how TaxCompPro uses cookies and similar tracking technologies.",
};

const cookieTypes = [
  {
    icon: Shield,
    name: "Essential Cookies",
    required: true,
    color: "bg-blue-50 border-blue-100",
    iconColor: "bg-blue-600",
    description: "Required for the platform to function. These enable authentication, session management, security tokens, and core feature access. They cannot be disabled.",
    examples: ["Session token (auth cookie)", "CSRF protection token", "User preference cache"],
  },
  {
    icon: BarChart2,
    name: "Analytics Cookies",
    required: false,
    color: "bg-purple-50 border-purple-100",
    iconColor: "bg-purple-600",
    description: "Help us understand how users interact with the platform so we can improve performance and features. All data is aggregated and anonymized.",
    examples: ["Page view tracking", "Feature usage metrics", "Error monitoring (Sentry)"],
  },
  {
    icon: Settings,
    name: "Preference Cookies",
    required: false,
    color: "bg-amber-50 border-amber-100",
    iconColor: "bg-amber-600",
    description: "Remember your settings and preferences to personalize your experience across sessions.",
    examples: ["Theme preference", "Sidebar state", "Notification settings"],
  },
];

const sections = [
  { title: "What Are Cookies?", body: "Cookies are small text files stored on your device by your browser when you visit a website. They help websites remember information about your visit, making it easier to use the site again and more useful to you. Cookies cannot access other information on your device." },
  { title: "How Long Do Cookies Last?", body: "Session cookies are temporary and deleted when you close your browser. Persistent cookies remain on your device for a set period (typically 7–30 days for auth tokens, up to 1 year for analytics). You can delete cookies at any time through your browser settings." },
  { title: "Third-Party Cookies", body: "We use a limited number of trusted third-party services that may set their own cookies: Stripe (payment processing), Vercel (hosting and performance), and Anthropic/OpenAI API calls (no cookies set client-side). We do not use advertising networks or social media tracking pixels." },
  { title: "Managing Your Cookies", body: "You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. Note that blocking essential cookies will prevent you from logging in or using core platform features. Blocking analytics cookies will not affect platform functionality." },
  { title: "Do Not Track", body: "We respect browser Do Not Track (DNT) signals. When DNT is enabled, we disable non-essential analytics tracking. Essential cookies required for authentication and security are still used as they are necessary for platform operation." },
  { title: "Updates to This Policy", body: "We may update this Cookie Policy as our practices change. We will notify you of significant changes via platform notifications. The effective date at the top of this page reflects the latest revision. Continued use of the platform after changes constitutes acceptance." },
];

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#0a1628] pt-24 pb-16 px-6 text-center">
        <p className="text-[#d4a017] font-bold text-sm uppercase tracking-widest mb-4">Legal</p>
        <h1 className="text-4xl font-black text-white mb-4 flex items-center justify-center gap-3">
          <Cookie className="w-9 h-9 text-[#d4a017]" /> Cookie Policy
        </h1>
        <p className="text-white/50 text-sm">Effective date: January 1, 2025</p>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 space-y-14">

        {/* Quick summary */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <h2 className="font-black text-[#0a1628] mb-2">Quick Summary</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We use <strong>essential cookies</strong> (required for login and security), <strong>analytics cookies</strong> (optional, to improve the platform), and <strong>preference cookies</strong> (to remember your settings). We do <strong>not</strong> use advertising cookies or sell cookie data. You can manage non-essential cookies via your browser settings.
          </p>
        </div>

        {/* Cookie type cards */}
        <div>
          <h2 className="text-2xl font-black text-[#0a1628] mb-6">Cookies We Use</h2>
          <div className="space-y-5">
            {cookieTypes.map(c => (
              <div key={c.name} className={`rounded-2xl border p-6 ${c.color}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${c.iconColor} flex items-center justify-center shrink-0`}>
                    <c.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-black text-[#0a1628]">{c.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.required ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                        {c.required ? "Required" : "Optional"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">{c.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {c.examples.map(ex => (
                        <span key={ex} className="text-xs bg-white/70 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Text sections */}
        <div className="space-y-8">
          {sections.map(s => (
            <div key={s.title}>
              <h2 className="text-lg font-black text-[#0a1628] mb-2">{s.title}</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Browser links */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <h2 className="font-black text-[#0a1628] mb-3">Manage Cookies in Your Browser</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { name: "Chrome", href: "https://support.google.com/chrome/answer/95647" },
              { name: "Firefox", href: "https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" },
              { name: "Safari", href: "https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471" },
              { name: "Edge", href: "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge" },
            ].map(b => (
              <a key={b.name} href={b.href} target="_blank" rel="noopener noreferrer"
                className="text-sm font-semibold text-[#0a1628] border border-[#0a1628]/15 bg-white px-4 py-2 rounded-full hover:bg-[#0a1628] hover:text-white transition-all">
                {b.name} →
              </a>
            ))}
          </div>
        </div>

        <div className="text-center text-slate-400 text-xs border-t border-slate-100 pt-8">
          Questions about our cookie use? <a href="mailto:privacy@taxcomppro.com" className="hover:text-[#0a1628] transition-colors">privacy@taxcomppro.com</a>
        </div>
      </section>
    </main>
  );
}
