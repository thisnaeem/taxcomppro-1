"use client";
import { useState } from "react";
import { SparklesIcon, SentIcon } from "hugeicons-react";
import { PRIVACY_REMINDER } from "@/lib/specialists/catalog";
import "./specialists.css";
export interface SpecialistPublic {
  id: string;
  title: string;
  starters: string[];
  signature: string;
  expertise: string[];
  courseNames: string[];
  enabled: boolean;
}
export default function SpecialistProfilePanel({
  specialist: s,
}: {
  specialist: SpecialistPublic;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function ask(text = question) {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/atlas-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, specialist: s.id }),
      });
      const response = await r.text();
      if (!r.ok) throw new Error(response);
      setAnswer(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="ask-specialist" className="specialist-panel">
      <span className="ai-disclosure">
        <SparklesIcon size={16} /> Tax Comp Pro AI Specialist
      </span>
      <h2>Your specialist, ready to help.</h2>
      <p>{s.signature}</p>
      <div className="specialist-topics">
        {s.expertise.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <h3>Ask me about</h3>
      <div className="specialist-starters">
        {s.starters.map((t) => (
          <button
            key={t}
            disabled={busy || !s.enabled}
            onClick={() => {
              setQuestion(t);
              void ask(t);
            }}
          >
            {t}
            <SentIcon size={16} />
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <label htmlFor="specialist-question">Your question</label>
        <textarea
          id="specialist-question"
          value={question}
          maxLength={6000}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Share an anonymized scenario…"
        />
        <small>{PRIVACY_REMINDER}</small>
        <button
          className="specialist-primary"
          disabled={busy || !s.enabled || !question.trim()}
        >
          {busy
            ? "Thinking…"
            : s.enabled
              ? "Ask this specialist"
              : "Currently paused"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {answer && (
        <div className="specialist-answer" aria-live="polite">
          {answer}
        </div>
      )}
      {s.courseNames.length > 0 && (
        <>
          <h3>Course expertise</h3>
          <p>{s.courseNames.join(" · ")}</p>
          <small>
            Published courses assigned to this specialist appear in the Courses
            tab.
          </small>
        </>
      )}
    </section>
  );
}
