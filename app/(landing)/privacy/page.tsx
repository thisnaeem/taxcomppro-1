import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Tax Compliance Pro",
  description: "Learn how Tax Compliance Pro collects, uses, stores, and safeguards your personal information.",
};

const sections = [
  {
    title: "1. Information We Collect",
    body: `When you register for TaxCompPro, we collect information you provide directly to us, including your name, email address, business name, title/role, city, state, and profile description. We also collect information about your activity on the platform, including posts, comments, messages, and connections.

In addition to information you voluntarily provide, we may automatically collect certain data when you visit our website. This may include IP address, browser type, device information, pages visited, referring URLs, and usage data. This information is collected through cookies, log files, and similar technologies to help us understand how users interact with our website and to improve functionality and user experience.`,
  },
  {
    title: "2. How We Use Your Information",
    body: `We use the information we collect to provide, maintain, and improve our services, including to create and manage your account, facilitate connections between members, enable private messaging, display your profile in the member directory, and send you service-related notifications.

We use collected information to provide and manage our products and services, process payments, communicate with users, respond to inquiries, improve website performance, enforce policies, and comply with legal obligations. We may also use your information to send updates, promotional communications, or service-related notices. You may opt out of marketing communications at any time by following the unsubscribe instructions provided.`,
  },
  {
    title: "3. Information Sharing",
    body: `Your profile information is visible to other registered members of the TaxCompPro community. We do not sell your personal information to third parties.

Tax Compliance Pros does not sell or rent your personal information. We may share information with trusted third-party service providers who assist with payment processing, website hosting, analytics, communications, or business operations, provided they are contractually obligated to protect your information. Information may also be disclosed if required by law, court order, or governmental request, or to protect our rights, property, or users.`,
  },
  {
    title: "4. Cookies and Tracking Technologies",
    body: `Our website may use cookies and similar tracking technologies to enhance performance, personalize content, analyze traffic, and support marketing efforts. Cookies are small data files stored on your device. You may choose to disable cookies through your browser settings; however, doing so may limit certain features or functionality of the website.`,
  },
  {
    title: "5. Data Security",
    body: `We implement reasonable administrative, technical, and physical safeguards designed to protect your personal information from unauthorized access, disclosure, alteration, or destruction. While we strive to protect your information, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.`,
  },
  {
    title: "6. Data Retention",
    body: `We retain personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce agreements. When information is no longer needed, it is securely deleted or anonymized.`,
  },
  {
    title: "7. Your Rights and Choices",
    body: `Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, update, or request deletion of your data. You may also have the right to object to or restrict certain processing activities. Requests can be submitted using the contact information provided below, subject to applicable legal requirements.`,
  },
  {
    title: "8. Third-Party Links",
    body: `Our website may contain links to third-party websites or services. We are not responsible for the privacy practices, content, or security of those external sites. We encourage users to review the privacy policies of any third-party websites they visit.`,
  },
  {
    title: "9. Children's Privacy",
    body: `Our services and website are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that personal information has been collected from a minor, we will take steps to delete it promptly.`,
  },
  {
    title: "10. Changes to This Privacy Policy",
    body: `Tax Compliance Pros reserves the right to update or modify this Privacy Policy at any time. Any changes will be effective immediately upon posting on this page. Continued use of the website after changes are posted constitutes acceptance of the updated policy.`,
  },
  {
    title: "11. Contact Information",
    body: `If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact Tax Compliance Pros through the contact information provided on our website or via email at support@taxcomp.com.`,
    contact: "support@taxcomp.com",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#0a1628] pt-24 pb-16 px-6 text-center">
        <p className="text-[#ffbe24] font-bold text-sm uppercase tracking-widest mb-4">Legal</p>
        <h1 className="text-4xl font-black text-white mb-4">Privacy Policy</h1>
        <p className="text-white/50 text-sm">Tax Compliance Pros · Last Updated: May 2026</p>
      </section>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        {/* Summary banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-800 leading-relaxed">
          <strong>Summary:</strong> Tax Compliance Pros respects your privacy and is committed to protecting the personal information you share with us. We collect only what we need, never sell your data, protect it with reasonable safeguards, and give you control over your information.
        </div>

        {sections.map((s) => (
          <div key={s.title} className="border-b border-slate-100 pb-8 last:border-0">
            <h2 className="text-base font-black text-[#0a1628] mb-3 uppercase tracking-wide">{s.title}</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{s.body}</p>
            {s.contact && (
              <p className="text-sm mt-2">
                <a href={`mailto:${s.contact}`} className="text-[#0a1628] font-bold hover:text-[#ffbe24] transition-colors">
                  {s.contact}
                </a>
              </p>
            )}
          </div>
        ))}

        <div className="pt-4 text-center text-slate-400 text-xs">
          Last updated: May 2026 &nbsp;·&nbsp;
          <a href="mailto:support@taxcomp.com" className="hover:text-[#0a1628] transition-colors">
            support@taxcomp.com
          </a>
        </div>
      </section>
    </main>
  );
}
