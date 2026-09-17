"use client";
import { useState } from "react";
import { Image01Icon, PaintBoardIcon } from "hugeicons-react";

type Branding = {accentColor: string; logoImage: string | null; coverImage: string | null};
export default function NetworkBranding({slug, initial, onSaved}: {slug: string; initial: Branding; onSaved: (b: Branding) => void}) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function upload(kind: "logoImage" | "coverImage", file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {setMessage("Choose a JPG, PNG or WebP under 10 MB."); return;}
    setBusy(true); setMessage("");
    try {
      const form = new FormData(); form.append("file", file);
      const r = await fetch("/api/upload", {method:"POST", body:form}); const data = await r.json();
      if (!r.ok || !data.url) throw new Error(data.error || "Upload failed.");
      setDraft(d=>({...d, [kind]: data.url}));
    } catch(e) {setMessage(e instanceof Error ? e.message : "Upload failed.");} finally {setBusy(false);}
  }
  async function save() {
    setBusy(true); setMessage("");
    try {
      const r = await fetch(`/api/pro-networks/${slug}`, {method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(draft)});
      const data=await r.json(); if(!r.ok) throw new Error(data.error || "Could not save branding.");
      onSaved(draft); setMessage("Network appearance saved.");
    } catch(e) {setMessage(e instanceof Error ? e.message : "Could not save branding.");} finally {setBusy(false);}
  }
  return <section className="pn-settings-card"><h3><PaintBoardIcon size={22}/>Network appearance</h3><p>Make this Network your own. Images are uploaded securely using your existing media service.</p>
    <label className="pn-settings-color">Accent color <input aria-label="Accent color" type="color" value={draft.accentColor} onChange={e=>setDraft(d=>({...d, accentColor:e.target.value}))} /><span>{draft.accentColor}</span></label>
    <div className="pn-brand-grid">{(["logoImage","coverImage"] as const).map(kind=><div key={kind}><div className={`pn-brand-preview ${kind === "logoImage" ? "pn-brand-logo" : ""}`}>{draft[kind] ? <img src={draft[kind]!} alt={kind === "logoImage" ? "Network logo preview" : "Network cover preview"}/> : <Image01Icon size={36}/>}</div><label className="pn-button pn-secondary">{kind === "logoImage" ? "Upload logo" : "Upload cover"}<input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{void upload(kind,e.target.files?.[0]);e.target.value="";}}/></label>{draft[kind] && <button disabled={busy} className="pn-button" onClick={()=>setDraft(d=>({...d,[kind]:null}))}>Remove</button>}</div>)}</div>
    <button className="pn-button pn-primary" disabled={busy} onClick={save}>{busy ? "Saving / uploading…" : "Save appearance"}</button><p role="status">{message}</p>
  </section>;
}
