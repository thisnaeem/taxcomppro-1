import type { Metadata } from "next";
import { CheckCircle, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Community Guidelines | TaxCompPro",
  description: "The rules and standards that keep TaxCompPro a professional, respectful, and trustworthy community.",
};

const dos = [
  "Be respectful and professional in all interactions",
  "Share accurate, well-sourced tax information",
  "Clearly disclose your professional credentials",
  "Cite IRS publications or authoritative sources when relevant",
  "Report suspicious or harmful content to our team",
  "Give constructive feedback and support fellow members",
  "Use the marketplace only for legitimate professional services",
  "Maintain confidentiality of client information shared privately",
];

const donts = [
  "Harass, threaten, or demean other community members",
  "Share false, misleading, or fraudulent tax information",
  "Impersonate licensed professionals you are not",
  "Spam the community with unsolicited promotions",
  "Post client personal data or confidential documents",
  "Engage in price-fixing or anti-competitive behavior",
  "Use the platform for money laundering or fraud",
  "Create multiple accounts to circumvent bans",
];

const enforcement = [
  { level: "Warning", desc: "First-time minor violations receive a formal warning with guidance on corrective action." },
  { level: "Content Removal", desc: "Content that violates guidelines is removed immediately, with notice to the author." },
  { level: "Temporary Suspension", desc: "Repeated or serious violations result in temporary account suspension of 7–30 days." },
  { level: "Permanent Ban", desc: "Severe violations (fraud, harassment, illegal activity) result in immediate permanent removal." },
];

export default function CommunityGuidelinesPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#0a1628] pt-24 pb-16 px-6 text-center">
        <p className="text-[#d4a017] font-bold text-sm uppercase tracking-widest mb-4">Community</p>
        <h1 className="text-4xl font-black text-white mb-4">Community Guidelines</h1>
        <p className="text-white/60 max-w-xl mx-auto text-sm leading-relaxed">
          TaxCompPro is a professional community built on trust and expertise. These guidelines protect the integrity every member depends on.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 space-y-14">
        {/* Do & Don't */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
            <h2 className="font-black text-emerald-800 text-lg mb-5 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> We Encourage
            </h2>
            <ul className="space-y-2.5">
              {dos.map(d => (
                <li key={d} className="flex items-start gap-2 text-sm text-emerald-800">
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
            <h2 className="font-black text-red-800 text-lg mb-5 flex items-center gap-2">
              <XCircle className="w-5 h-5" /> We Prohibit
            </h2>
            <ul className="space-y-2.5">
              {donts.map(d => (
                <li key={d} className="flex items-start gap-2 text-sm text-red-800">
                  <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Professional Standards */}
        <div>
          <h2 className="text-2xl font-black text-[#0a1628] mb-4">Professional Standards</h2>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>Tax professionals on TaxCompPro are held to the same ethical standards required by their licensing bodies (AICPA, IRS Circular 230, state bar associations, etc.). Misrepresenting credentials is grounds for immediate removal and may be reported to relevant authorities.</p>
            <p>When providing guidance, always clarify whether your response is general educational information or professional advice specific to a situation. Encourage clients to schedule formal consultations for complex matters.</p>
            <p>Atlas AI responses are AI-generated educational content and should not be presented to clients as professional advice. Professionals are responsible for verifying AI-generated information before relying on it.</p>
          </div>
        </div>

        {/* Enforcement */}
        <div>
          <h2 className="text-2xl font-black text-[#0a1628] mb-6">Enforcement Tiers</h2>
          <div className="space-y-3">
            {enforcement.map((e, i) => (
              <div key={e.level} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white font-black text-sm ${
                  i === 0 ? "bg-amber-400" : i === 1 ? "bg-orange-500" : i === 2 ? "bg-red-500" : "bg-red-800"
                }`}>{i + 1}</div>
                <div>
                  <p className="font-black text-[#0a1628] text-sm">{e.level}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reporting */}
        <div className="bg-[#0a1628] rounded-2xl p-8 text-center text-white">
          <h2 className="text-xl font-black mb-3">See Something? Report It.</h2>
          <p className="text-white/60 text-sm mb-5 max-w-md mx-auto">Every report is reviewed by our moderation team within 24 hours. Your identity is kept confidential.</p>
          <a href="mailto:safety@taxcomppro.com"
            className="inline-flex items-center gap-2 bg-[#d4a017] text-[#0a1628] font-bold px-6 py-3 rounded-full text-sm hover:bg-[#e6b420] transition-all">
            Report a Violation
          </a>
        </div>

        <div className="text-center text-slate-400 text-xs">
          Last updated: January 2025 · Questions? <a href="mailto:safety@taxcomppro.com" className="hover:text-[#0a1628] transition-colors">safety@taxcomppro.com</a>
        </div>
      </section>
    </main>
  );
}
