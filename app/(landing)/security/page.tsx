import type { Metadata } from "next";
import { Shield, Lock, Eye, Server, AlertTriangle, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Security | TaxCompPro",
  description: "How TaxCompPro protects your data, accounts, and financial information.",
};

const measures = [
  { icon: Lock,         title: "End-to-End Encryption",   desc: "All data in transit is encrypted using TLS 1.3. Sensitive data at rest is encrypted with AES-256." },
  { icon: Shield,       title: "Secure Authentication",   desc: "We use industry-standard auth protocols with session tokens, and support Google OAuth. Passwords are hashed with bcrypt." },
  { icon: Server,       title: "Infrastructure Security", desc: "Hosted on Vercel's enterprise infrastructure with isolated environments, DDoS protection, and 99.9% uptime SLA." },
  { icon: Eye,          title: "Access Controls",         desc: "Role-based permissions mean your data is only accessible to you and admins under strict audit logging." },
  { icon: AlertTriangle,title: "Threat Monitoring",       desc: "Continuous monitoring for unusual activity, automated alerts, and rapid incident response protocols." },
  { icon: CheckCircle,  title: "Payment Security",        desc: "Payments are processed by Stripe — PCI DSS Level 1 certified. We never store your card details on our servers." },
];

const faqs = [
  { q: "Can TaxCompPro employees read my messages?", a: "Private messages are encrypted and access by staff is restricted to legal obligations and active abuse investigations, with full audit logging." },
  { q: "What happens if there's a data breach?", a: "We will notify all affected users within 72 hours, provide a detailed incident report, and work with authorities as required by law." },
  { q: "How do I report a security vulnerability?", a: "Please email security@taxcomppro.com with details. We have a responsible disclosure policy and will acknowledge reports within 24 hours." },
  { q: "Is my financial data safe?", a: "Yes. All billing is handled by Stripe (PCI DSS Level 1). TaxCompPro never stores card numbers, CVVs, or full account details." },
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#0a1628] pt-24 pb-16 px-6 text-center">
        <p className="text-[#d4a017] font-bold text-sm uppercase tracking-widest mb-4">Trust & Safety</p>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Security at TaxCompPro</h1>
        <p className="text-white/60 max-w-2xl mx-auto text-base leading-relaxed">
          Protecting your data, your clients' information, and your professional reputation is our highest priority.
        </p>
      </section>

      {/* Trust badges */}
      <section className="bg-[#0d1e4a] py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-center">
          {["TLS 1.3 Encryption","PCI DSS via Stripe","AES-256 at Rest","99.9% Uptime SLA"].map(b => (
            <div key={b} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-white/70 text-sm font-semibold">{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Security measures */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-[#0a1628] text-center mb-3">How We Protect You</h2>
        <p className="text-slate-500 text-center mb-12 max-w-xl mx-auto">Multiple layers of security work together to keep your account and data safe.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {measures.map(m => (
            <div key={m.title} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="w-11 h-11 rounded-xl bg-[#0a1628] flex items-center justify-center mb-4">
                <m.icon className="w-5 h-5 text-[#d4a017]" />
              </div>
              <h3 className="font-black text-[#0a1628] mb-2 text-sm">{m.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Best practices */}
      <section className="bg-slate-50 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-[#0a1628] mb-6">Your Security Checklist</h2>
          <div className="space-y-3">
            {[
              "Use a strong, unique password for your TaxCompPro account",
              "Enable Google Sign-In for stronger authentication",
              "Never share your login credentials with anyone",
              "Log out from shared or public devices",
              "Review your active sessions regularly in account settings",
              "Report suspicious account activity immediately",
            ].map(tip => (
              <div key={tip} className="flex items-center gap-3 bg-white rounded-xl p-4 border border-slate-100">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-slate-700">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-black text-[#0a1628] mb-8">Frequently Asked Questions</h2>
        <div className="space-y-5">
          {faqs.map(f => (
            <div key={f.q} className="border border-slate-100 rounded-2xl p-5">
              <p className="font-black text-[#0a1628] text-sm mb-2">{f.q}</p>
              <p className="text-slate-500 text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Report CTA */}
      <section className="bg-[#0a1628] py-16 px-6 text-center">
        <h2 className="text-2xl font-black text-white mb-3">Found a Vulnerability?</h2>
        <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">We take all security reports seriously and have a responsible disclosure program. Report issues privately and we'll work with you quickly.</p>
        <a href="mailto:security@taxcomppro.com"
          className="inline-flex items-center gap-2 bg-[#d4a017] text-[#0a1628] font-bold px-6 py-3 rounded-full text-sm hover:bg-[#e6b420] transition-all">
          <Shield className="w-4 h-4" /> Report a Vulnerability
        </a>
      </section>
    </main>
  );
}
