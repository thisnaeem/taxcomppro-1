"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Check, Zap, CreditCard, Video, Mic, Globe, Lock, Clock } from "lucide-react";
import { ArrowLeft01Icon, CalendarAdd01Icon, Radio01Icon, Calendar03Icon, Mic01Icon } from "hugeicons-react";
import { useAppSelector } from "@/store/hooks";
import { PRO_TALK_CATEGORIES } from "@/lib/proTalks";
import "../pro-talks-directory.css";
import "./create-talk.css";

const TITLE_MAX = 120;
const DESC_MAX = 600;

type Mode = "now" | "schedule";
type MediaType = "AUDIO_VIDEO" | "AUDIO";
type Visibility = "PUBLIC" | "PRIVATE";

function formatWhen(value: string) {
  if (!value) return "Pick a date & time";
  return new Date(value).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// ── Upgrade options for members who can't host yet ───────────────────────────
function HostAccess() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const payForPass = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/pro-talk-host-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { setError(data.error || "Couldn't start checkout. Please try again."); setLoading(false); }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="ptc-access">
      <div className="ptc-plan is-best">
        <span className="ptc-plan-tag">Best value · Unlimited</span>
        <p className="ptc-plan-price"><strong>$129.99</strong> /month</p>
        <h3>VIP + Marketplace Plus</h3>
        <ul>
          <li><Zap className="w-4 h-4" /> Unlimited Pro Talk hosting with video, audio &amp; screenshare</li>
          <li><Zap className="w-4 h-4" /> Full Marketplace seller privileges &amp; verified badge</li>
          <li><Zap className="w-4 h-4" /> Keep up to 5 replays on your profile</li>
        </ul>
        <Link href="/upgrade" className="ptd-primary">Upgrade to Marketplace Plus</Link>
      </div>
      <div className="ptc-plan">
        <p className="ptc-plan-price"><strong>$99.99</strong> one-time</p>
        <h3>Single Session Host Pass</h3>
        <p className="ptc-plan-copy">Host one live session with full stage controls, polls and invite links.</p>
        <button onClick={payForPass} disabled={loading} className="ptd-secondary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} Pay for 1 Host Pass
        </button>
        {error && <p className="ptc-error" role="alert">{error}</p>}
      </div>
    </div>
  );
}

// ── Create form ──────────────────────────────────────────────────────────────
function CreateTalkInner() {
  const router = useRouter();
  const params = useSearchParams();
  const user = useAppSelector(s => s.auth.user);
  const hostPaid = params.get("host_paid") === "1";
  const hostSessionId = params.get("session_id") ?? undefined;
  const canHost = user?.role === "ADMIN" || user?.tier === "MARKETPLACE_PLUS" || (hostPaid && !!hostSessionId);

  const [mode, setMode] = useState<Mode>(params.get("mode") === "schedule" ? "schedule" : "now");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState(PRO_TALK_CATEGORIES[0]?.name ?? "Open Discussion");
  const [mediaType, setMediaType] = useState<MediaType>("AUDIO_VIDEO");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [schedDate, setSchedDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minDateTime] = useState(() => {
    const d = new Date(Date.now() + 5 * 60_000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // local time for <input type="datetime-local">
    return d.toISOString().slice(0, 16);
  });

  const ready = name.trim().length > 0 && (mode === "now" || !!schedDate);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || creating) return;
    setCreating(true);
    setError(null);
    const body: Record<string, unknown> = { name: name.trim(), description: desc.trim() || null, category, mediaType, visibility };
    if (hostPaid && hostSessionId) body.hostSessionId = hostSessionId;
    if (mode === "schedule") body.scheduledAt = new Date(schedDate).toISOString();
    try {
      const res = await fetch("/api/spaces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Couldn't create your Pro Talk."); setCreating(false); return; }
      // Live now → straight onto the stage. Scheduled → back to the directory.
      router.push(mode === "now" ? `/pro-talks/${data.id}` : "/pro-talks?tab=upcoming");
    } catch {
      setError("Network error. Please try again.");
      setCreating(false);
    }
  };

  return (
    <div className="ptd-page">
      <span className="ptd-glow ptd-glow--tl" aria-hidden="true" />
      <span className="ptd-glow ptd-glow--tr" aria-hidden="true" />

      <div className="ptd-container ptc-container">
        <div className="ptd-top">
          <Link href="/pro-talks" className="ptd-top-link"><ArrowLeft01Icon size={16} /> <b>Back to Pro Talks</b></Link>
          <span className="ptd-eyebrow"><Mic01Icon size={15} /> Host a Pro Talk</span>
        </div>

        <header className="ptc-head">
          <span className="ptc-head-mic"><Image src="/protalk.png" alt="" fill className="object-cover" sizes="72px" priority /></span>
          <div>
            <h1>Open your <span>stage.</span></h1>
            <p>Go live right now or schedule a talk for your audience. Everyone joins muted — you control who speaks.</p>
          </div>
        </header>

        {!user ? (
          <div className="ptc-card ptc-signin">
            <strong>Sign in to host a Pro Talk</strong>
            <p>You need a Tax Compliance Pro account to open a stage.</p>
            <Link href="/login?next=/pro-talks/new" className="ptd-primary">Sign in</Link>
          </div>
        ) : !canHost ? (
          <>
            <p className="ptc-access-intro">Hosting is included with <strong>Marketplace Plus</strong>, or grab a one-time pass for a single session.</p>
            <HostAccess />
          </>
        ) : (
          <form className="ptc-layout" onSubmit={submit} noValidate>
            <div className="ptc-form">
              {hostPaid && (
                <div className="ptc-banner"><Check className="w-5 h-5" /> Host pass confirmed — you&apos;re ready to open your stage.</div>
              )}

              {/* 1. When */}
              <section className="ptc-card">
                <h2>When</h2>
                <div className="ptc-segment" role="radiogroup" aria-label="When to start">
                  <button type="button" role="radio" aria-checked={mode === "now"} onClick={() => setMode("now")}><Radio01Icon className="w-4 h-4" /> Go live now</button>
                  <button type="button" role="radio" aria-checked={mode === "schedule"} onClick={() => setMode("schedule")}><Calendar03Icon className="w-4 h-4" /> Schedule for later</button>
                </div>
                {mode === "schedule" && (
                  <label className="ptc-field">
                    <span><Clock className="w-3.5 h-3.5" /> Date &amp; start time *</span>
                    <input type="datetime-local" value={schedDate} min={minDateTime} onChange={e => setSchedDate(e.target.value)} required />
                  </label>
                )}
              </section>

              {/* 2. Details */}
              <section className="ptc-card">
                <h2>Details</h2>
                <label className="ptc-field">
                  <span>Title * <em>{name.length}/{TITLE_MAX}</em></span>
                  <input value={name} maxLength={TITLE_MAX} onChange={e => setName(e.target.value)} placeholder="e.g. Schedule C Audit Defense: Red Flags & Best Practices" required />
                </label>
                <label className="ptc-field">
                  <span>Category *</span>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    {PRO_TALK_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </label>
                <label className="ptc-field">
                  <span>Description <em>{desc.length}/{DESC_MAX}</em></span>
                  <textarea value={desc} maxLength={DESC_MAX} onChange={e => setDesc(e.target.value)} rows={4} placeholder="What will you cover? What should attendees prepare?" />
                </label>
              </section>

              {/* 3. Stage settings */}
              <section className="ptc-card">
                <h2>Stage settings</h2>
                <p className="ptc-label">Format</p>
                <div className="ptc-options" role="radiogroup" aria-label="Format">
                  <button type="button" role="radio" aria-checked={mediaType === "AUDIO_VIDEO"} onClick={() => setMediaType("AUDIO_VIDEO")}>
                    <Video className="w-5 h-5" /><strong>Audio + Video</strong><small>Cameras and screenshare on stage</small>
                  </button>
                  <button type="button" role="radio" aria-checked={mediaType === "AUDIO"} onClick={() => setMediaType("AUDIO")}>
                    <Mic className="w-5 h-5" /><strong>Audio only</strong><small>A lighter, podcast-style room</small>
                  </button>
                </div>
                <p className="ptc-label">Who can join?</p>
                <div className="ptc-options" role="radiogroup" aria-label="Who can join">
                  <button type="button" role="radio" aria-checked={visibility === "PUBLIC"} onClick={() => setVisibility("PUBLIC")}>
                    <Globe className="w-5 h-5" /><strong>Public</strong><small>Listed in Pro Talks — anyone can join</small>
                  </button>
                  <button type="button" role="radio" aria-checked={visibility === "PRIVATE"} onClick={() => setVisibility("PRIVATE")}>
                    <Lock className="w-5 h-5" /><strong>Private</strong><small>Hidden — join with your invite link</small>
                  </button>
                </div>
              </section>

              {error && <p className="ptc-error" role="alert">{error}</p>}
            </div>

            {/* Live preview + submit (sticky on desktop, bottom bar on phones) */}
            <aside className="ptc-side">
              <div className="ptc-preview" aria-label="Preview">
                <span className="ptc-preview-label">Preview</span>
                <div className="ptc-preview-card">
                  <div className="ptc-preview-top">
                    {mode === "now"
                      ? <span className="ptc-pill is-live"><span className="ptd-dot" /> Live</span>
                      : <span className="ptc-pill is-up"><Calendar03Icon className="w-3.5 h-3.5" /> Upcoming</span>}
                    <span className="ptc-pill">{mediaType === "AUDIO_VIDEO" ? <Video className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}{mediaType === "AUDIO_VIDEO" ? "Audio + Video" : "Audio only"}</span>
                  </div>
                  <span className="ptc-preview-cat">{category}</span>
                  <h3>{name.trim() || "Your Pro Talk title"}</h3>
                  {desc.trim() && <p>{desc.trim()}</p>}
                  {mode === "schedule" && <span className="ptc-preview-when"><Clock className="w-3.5 h-3.5" /> {formatWhen(schedDate)}</span>}
                  <div className="ptc-preview-host">
                    <span className="ptc-avatar">{user.image ? <img src={user.image} alt="" /> : (user.name || "?")[0]}</span>
                    <span><strong>{user.name}</strong><small>{visibility === "PUBLIC" ? "Public stage" : "Private · invite only"}</small></span>
                  </div>
                </div>
              </div>

              <div className="ptc-submit">
                <button type="submit" className="ptd-primary" disabled={!ready || creating}>
                  {creating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing stage…</>
                    : mode === "now"
                      ? <><Radio01Icon className="w-4 h-4" /> Go live now</>
                      : <><CalendarAdd01Icon className="w-4 h-4" /> Schedule Pro Talk</>}
                </button>
                <p>{!name.trim() ? "Add a title to continue." : mode === "schedule" && !schedDate ? "Pick a start time to continue." : "Everyone enters muted. You control who speaks."}</p>
              </div>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CreateProTalkPage() {
  return (
    <Suspense fallback={<div className="ptd-page"><div className="ptd-loading"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div></div>}>
      <CreateTalkInner />
    </Suspense>
  );
}
