"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Mail01Icon, CallIcon, Clock01Icon, SentIcon, Tick02Icon, ArrowRight01Icon, ArrowDown01Icon } from "hugeicons-react";
import "@/components/landing/member-pages.css";

const contactInfo = [
  { icon: Mail01Icon, label: "Email us", value: "support@taxcomppro.com", href: "mailto:support@taxcomppro.com" },
  { icon: CallIcon, label: "Give us a call", value: "+1 888-702-8272", href: "tel:+18887028272" },
  { icon: Clock01Icon, label: "Support hours", value: "Mon–Fri, 9AM–6PM EST", href: null },
];
const topics = ["General question", "Membership & billing", "Courses & toolkits", "Marketplace", "Technical support", "Feedback"];
const emptyForm = { name: "", email: "", subject: "", message: "", topic: topics[0] };

export default function ContactPage() {
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [error, setError] = useState("");
  const pending = useRef(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending.current) return;
    if (![form.name, form.email, form.subject, form.message].every(value => value.trim())) {
      setError("Please fill in your name, email, subject, and message.");
      return;
    }
    pending.current = true;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/support", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), subject: `[${form.topic}] ${form.subject.trim()}`, description: form.message.trim() }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.id !== "string" || !data.id) throw new Error("Submission failed");
      setTicketId(data.id);
    } catch {
      setError("We couldn’t submit your message. Your draft is still here—please try again, or email support@taxcomppro.com.");
    } finally { pending.current = false; setSending(false); }
  };

  return (
    <div className="mp-page contact-page">
      <div className="mp-container">
        <header className="mp-hero">
          <p className="mp-eyebrow">Get in touch</p>
          <h1>Let’s talk.<br /><span>We’re here to help.</span></h1>
          <p>Have a question, feedback, or need support? We&apos;d love to hear from you.</p>
        </header>
        <div className="contact-layout">
          <aside className="contact-aside" aria-label="Contact information">
            <div className="contact-info-panel">
              <h2>A real conversation starts here.</h2>
              <p>Choose the best way to reach our team.</p>
              {contactInfo.map(item => <div className="contact-info-row" key={item.label}><span className="mp-icon-tile"><item.icon size={21} aria-hidden="true" /></span><div><h3>{item.label}</h3>{item.href ? <a href={item.href}>{item.value}</a> : <p>{item.value}</p>}</div></div>)}
              <div className="contact-response"><Clock01Icon size={18} aria-hidden="true" /><p>We typically respond within <strong>24 business hours.</strong> For urgent support, mark your subject “URGENT”.</p></div>
            </div>
            <div className="contact-shortcuts"><h2>Looking for something?</h2><Link href="/upgrade">Membership & pricing <ArrowRight01Icon size={18} /></Link><Link href="/my-courses">Access your courses <ArrowRight01Icon size={18} /></Link><Link href="/marketplace-purchases">Marketplace purchases <ArrowRight01Icon size={18} /></Link></div>
          </aside>
          <section className="contact-form-panel" aria-labelledby="contact-form-title">
            {ticketId ? <div className="contact-success" role="status"><span className="mp-icon-tile"><Tick02Icon size={30} /></span><h2 id="contact-form-title">Your message is with our team.</h2><p>Thank you for reaching out. We typically respond within 24 business hours.</p><div className="contact-reference">Ticket reference<strong>{ticketId}</strong></div><button className="mp-button" onClick={() => { setTicketId(""); setForm(emptyForm); }}>Send another message <ArrowRight01Icon size={18} /></button></div> : <>
              <div className="contact-form-heading"><span className="mp-icon-tile"><SentIcon size={22} aria-hidden="true" /></span><div><h2 id="contact-form-title">Send us a message</h2><p>Tell us what you need. We’ll take it from here.</p></div></div>
              <form onSubmit={handleSubmit}>
                <fieldset disabled={sending}>
                  <div className="contact-fields">
                    <label htmlFor="contact-name">Full name<input id="contact-name" autoComplete="name" required maxLength={100} placeholder="Your full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></label>
                    <label htmlFor="contact-email">Email address<input id="contact-email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></label>
                  </div>
                  <label htmlFor="contact-topic">What can we help with?<select id="contact-topic" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})}>{topics.map(topic => <option key={topic}>{topic}</option>)}</select></label>
                  <label htmlFor="contact-subject">Subject<input id="contact-subject" required maxLength={160} placeholder="A short summary of your question" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} /></label>
                  <label htmlFor="contact-message">Your message<textarea id="contact-message" required maxLength={5000} rows={6} placeholder="Tell us a little more so we can help…" value={form.message} onChange={e => setForm({...form, message: e.target.value})} aria-describedby="contact-message-count" /></label>
                  <p className="contact-character-count" id="contact-message-count">{form.message.length.toLocaleString()} / 5,000</p>
                  {error && <p className="mp-error" role="alert">{error}</p>}
                  <div className="contact-submit"><p>We’ll use your details to respond to your request. <Link href="/privacy">Privacy policy</Link></p><button className="mp-button" type="submit" disabled={sending}>{sending ? "Sending message…" : "Send message"}<SentIcon size={18} aria-hidden="true" /></button></div>
                </fieldset>
              </form>
            </>}
          </section>
        </div>
        <section className="mp-faq" aria-labelledby="contact-faq"><div><p className="mp-eyebrow">Quick answers</p><h2 id="contact-faq">A helpful head start.</h2><p>A few places to check while our team gets back to you.</p></div><div className="mp-faq-items">
          <details><summary>Where can I find my courses?<ArrowDown01Icon size={18} /></summary><p>Sign in and visit <Link href="/my-courses">My courses</Link> to access your enrolled courses. If something is missing, send us the course name and the email used for your purchase.</p></details>
          <details><summary>Can you help me choose a membership?<ArrowDown01Icon size={18} /></summary><p>Of course. Explore our <Link href="/upgrade">membership plans</Link>, or select “Membership & billing” above and tell us what you want to achieve.</p></details>
          <details><summary>What should I include for a technical issue?<ArrowDown01Icon size={18} /></summary><p>Include the page you were using, what you expected to happen, and any error message. Let us know your browser and device so we can investigate.</p></details>
        </div></section>
      </div>
    </div>
  );
}
