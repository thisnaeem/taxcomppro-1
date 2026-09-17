"use client";
import { useEffect, useId, useState } from "react";
import { PROFESSIONAL_TITLES } from "@/lib/professionalTitles";

export default function ProfessionalTitleEditor({onSaved}: {onSaved?: () => void}) {
  const id = useId();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/profile/professional-title", {signal: controller.signal}).then(async r => {
      if (!r.ok) throw new Error("Could not load your title.");
      const data = await r.json(); setTitle(data.professionalTitle || "");
    }).catch(e => {if (!controller.signal.aborted) setMessage(e.message);}).finally(() => {if (!controller.signal.aborted) setLoading(false);});
    return () => controller.abort();
  }, []);
  async function save() {
    setSaving(true); setMessage("");
    try {
      const r = await fetch("/api/profile/professional-title", {method: "PATCH", headers: {"Content-Type": "application/json"}, body: JSON.stringify({professionalTitle: title})});
      if (!r.ok) throw new Error((await r.json()).error || "Could not save title.");
      setMessage("Title saved for your profile and Network memberships."); onSaved?.();
    } catch(e) {setMessage(e instanceof Error ? e.message : "Could not save title.");} finally {setSaving(false);}
  }
  return <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/15 col-span-full">
    <label htmlFor={id} className="block font-semibold mb-2">Your Title / Role</label>
    <p className="text-sm mb-3 opacity-75">Shown in Network member directories. This does not change your account permissions.</p>
    <div className="flex flex-wrap gap-3"><select id={id} value={title} disabled={loading || saving} onChange={e=>setTitle(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white text-slate-900 p-3 dark:bg-slate-900 dark:text-white dark:border-slate-600"><option value="">Select your title</option>{PROFESSIONAL_TITLES.map(t=><option key={t}>{t}</option>)}</select><button type="button" disabled={!title || saving || loading} onClick={save} className="pn-button pn-primary rounded-xl bg-amber-300 text-slate-950 px-4 py-2 disabled:opacity-50">{saving ? "Saving…" : "Save title"}</button></div>
    <p role="status" className="text-sm mt-2">{message}</p>
  </div>;
}
