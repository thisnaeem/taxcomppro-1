"use client";
import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react";

const contactInfo = [
  { icon: Mail,    label: "Email",   value: "support@taxcomppro.com",         href: "mailto:support@taxcomppro.com" },
  { icon: Phone,   label: "Phone",   value: "+1 (800) TAX-CPRO",             href: "tel:+18008292776" },
  { icon: MapPin,  label: "Address", value: "United States — Remote First",   href: null },
  { icon: Clock,   label: "Hours",   value: "Mon–Fri, 9AM–6PM EST",           href: null },
];

export default function ContactPage() {
  const [form, setForm]     = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#0a1628] pt-24 pb-16 px-6 text-center">
        <p className="text-[#d4a017] font-bold text-sm uppercase tracking-widest mb-4">Get In Touch</p>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Contact Us</h1>
        <p className="text-white/60 max-w-xl mx-auto">Have a question, feedback, or need support? We&apos;d love to hear from you.</p>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Info cards */}
        <div className="space-y-4">
          {contactInfo.map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#0a1628] flex items-center justify-center shrink-0">
                <c.icon className="w-4 h-4 text-[#d4a017]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{c.label}</p>
                {c.href
                  ? <a href={c.href} className="text-sm font-semibold text-[#0a1628] hover:text-[#d4a017] transition-colors">{c.value}</a>
                  : <p className="text-sm font-semibold text-[#0a1628]">{c.value}</p>}
              </div>
            </div>
          ))}

          <div className="bg-gradient-to-br from-[#0a1628] to-[#173473] rounded-2xl p-5 text-white">
            <p className="font-black text-sm mb-2">Response Time</p>
            <p className="text-white/60 text-xs leading-relaxed">We typically respond to all inquiries within 24 business hours. For urgent support, please mark your subject as &ldquo;URGENT&rdquo;.</p>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          {sent ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <Send className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-xl font-black text-[#0a1628]">Message Sent!</h2>
              <p className="text-slate-500 text-sm max-w-xs">Thank you for reaching out. We&apos;ll get back to you within 24 business hours.</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-black text-[#0a1628] mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Full Name", key: "name",  type: "text",  placeholder: "John Smith" },
                    { label: "Email",     key: "email", type: "email", placeholder: "john@example.com" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">{f.label}</label>
                      <input required type={f.type} placeholder={f.placeholder}
                        value={(form as Record<string,string>)[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0a1628]/20 text-[#0a1628]" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Subject</label>
                  <input required type="text" placeholder="How can we help?"
                    value={form.subject}
                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0a1628]/20 text-[#0a1628]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Message</label>
                  <textarea required rows={5} placeholder="Tell us more…"
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0a1628]/20 resize-none text-[#0a1628] font-[inherit]" />
                </div>
                <button type="submit" disabled={sending}
                  className="flex items-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#1a3a6b] transition-all disabled:opacity-60">
                  {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : <><Send className="w-4 h-4" />Send Message</>}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
