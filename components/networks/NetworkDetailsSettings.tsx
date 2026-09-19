"use client";
import { useState } from "react";

type Details = { name: string; description: string; tagline: string | null; rules: string | null; welcomeMessage: string | null };
export default function NetworkDetailsSettings({ slug, initial, onSaved }: { slug: string; initial: Details; onSaved: (details: Details) => void }) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (busy || !draft.name.trim()) return;
    setBusy(true); setMessage("");
    try {
      const res = await fetch(`/api/pro-networks/${slug}`, {method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(draft)});
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Could not save settings.");
      onSaved(draft); setMessage("Network details saved.");
    } catch (err) {setMessage(err instanceof Error ? err.message : "Could not save settings.");}
    finally {setBusy(false);}
  }
  return <form className="pn-settings-card np-details-form" onSubmit={save}><h3>Network details</h3><p>Update the information and guidelines members see.</p>
    {(["name","tagline","description","welcomeMessage","rules"] as const).map(key => <label key={key}>{({name:"Network name",tagline:"Short introduction",description:"About this network",welcomeMessage:"Welcome message",rules:"Network rules"})[key]}
      {key === "name" || key === "tagline" ? <input value={draft[key] || ""} required={key === "name"} maxLength={key === "name" ? 120 : 240} onChange={e => setDraft(previous => ({...previous,[key]:e.target.value}))} /> : <textarea rows={3} maxLength={5000} value={draft[key] || ""} onChange={e => setDraft(previous => ({...previous,[key]:e.target.value}))} />}</label>)}
    <button className="pn-button pn-primary" disabled={busy || !draft.name.trim()}>{busy ? "Saving…" : "Save details"}</button><p role="status">{message}</p>
  </form>;
}
