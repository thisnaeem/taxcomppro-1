import Link from "next/link";
import { Scale, Users, Shield, Zap, Globe, Award } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | TaxCompPro",
  description: "TaxCompPro is the premier professional community connecting tax experts, CPAs, and taxpayers across America.",
};

const stats = [
  { value: "10,000+", label: "Tax Professionals" },
  { value: "50 States", label: "Coverage" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "$2M+", label: "Saved for Clients" },
];

const values = [
  { icon: Shield,  title: "Trust & Integrity",  desc: "We hold ourselves and our community to the highest professional standards." },
  { icon: Users,   title: "Community First",    desc: "Built by tax professionals, for tax professionals and the people they serve." },
  { icon: Zap,     title: "Innovation",         desc: "We leverage AI and modern technology to simplify complex tax workflows." },
  { icon: Globe,   title: "Accessibility",      desc: "Bringing expert-level tax guidance to every American, regardless of location." },
  { icon: Award,   title: "Excellence",         desc: "We celebrate and promote professional excellence across our platform." },
  { icon: Scale,   title: "Compliance",         desc: "Every feature is built with IRS regulations and ethical standards in mind." },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#0a1628] pt-24 pb-20 px-6 text-center">
        <p className="text-[#d4a017] font-bold text-sm uppercase tracking-widest mb-4">About TaxCompPro</p>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 max-w-3xl mx-auto leading-tight">
          The Professional Community for <span className="text-[#d4a017]">Tax Excellence</span>
        </h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
          TaxCompPro was founded with a single mission: to connect, educate, and empower every tax professional and taxpayer in America.
        </p>
      </section>

      {/* Stats */}
      <section className="bg-[#0d1e4a] py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black text-[#d4a017]">{s.value}</p>
              <p className="text-white/50 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-[#0a1628] mb-6">Our Story</h2>
        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4 text-base">
          <p>
            TaxCompPro was born out of frustration — tax professionals were working in silos, taxpayers were getting poor advice from generic resources, and the gap between expert knowledge and everyday people kept growing. We set out to change that.
          </p>
          <p>
            We built a platform where CPAs, enrolled agents, tax attorneys, and tax preparers can share knowledge, grow their practices, and connect directly with the clients who need them most. Our marketplace enables professionals to offer their services, while our Pro Hub communities foster ongoing learning and collaboration.
          </p>
          <p>
            Atlas AI — our built-in tax intelligence assistant — makes expert-level guidance available 24/7, helping both professionals and taxpayers navigate complex questions with confidence backed by real IRS knowledge.
          </p>
          <p>
            Today, TaxCompPro is trusted by thousands of professionals across all 50 states. We&apos;re proud to be the platform where tax excellence meets community.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-[#0a1628] text-center mb-3">Our Values</h2>
          <p className="text-slate-500 text-center mb-12">The principles that guide everything we build and every decision we make.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map(v => (
              <div key={v.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="w-11 h-11 rounded-xl bg-[#0a1628] flex items-center justify-center mb-4">
                  <v.icon className="w-5 h-5 text-[#d4a017]" />
                </div>
                <h3 className="font-black text-[#0a1628] mb-2">{v.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-black text-[#0a1628] mb-4">Ready to Join the Community?</h2>
        <p className="text-slate-500 mb-8 max-w-xl mx-auto">Whether you&apos;re a tax professional looking to grow your practice or a taxpayer seeking expert guidance, TaxCompPro has a place for you.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="inline-flex items-center justify-center px-8 py-3.5 bg-[#0a1628] text-white font-bold rounded-full hover:bg-[#1a3a6b] transition-all">
            Get Started Free
          </Link>
          <Link href="/contact" className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-[#0a1628] text-[#0a1628] font-bold rounded-full hover:bg-slate-50 transition-all">
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}
