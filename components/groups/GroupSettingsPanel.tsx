"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageUploadIcon, Delete02Icon, Tick02Icon } from "hugeicons-react";

type GroupSettings = { name: string; description: string; coverImage: string | null; slug: string };

export default function GroupSettingsPanel({ group, onSaved, onCancel }: { group: GroupSettings; onSaved: (value: GroupSettings) => void; onCancel: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [coverImage, setCoverImage] = useState(group.coverImage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const pending = useRef(false);

  async function upload(file?: File) {
    if (!file || pending.current) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) { setError("Choose a JPG, PNG, or WebP image smaller than 10 MB."); return; }
    pending.current = true; setBusy(true); setError(""); setSaved(false);
    try {
      const form = new FormData(); form.append("file", file); form.append("folder", "taxcomppro/group-covers");
      const response = await fetch("/api/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok || typeof data.url !== "string") throw new Error(data.error || "Upload failed. Try again.");
      setCoverImage(data.url);
    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed."); }
    finally { pending.current = false; setBusy(false); }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(""); setSaved(false);
    try {
      const response = await fetch(`/api/communities/${encodeURIComponent(group.slug)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, coverImage }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Changes could not be saved.");
      setName(data.name); setDescription(data.description); onSaved(data); setSaved(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Changes could not be saved."); }
    finally { pending.current = false; setBusy(false); }
  }

  async function remove() {
    if (pending.current || confirmation !== group.name) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/communities/${encodeURIComponent(group.slug)}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The group could not be deleted.");
      router.replace("/groups"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "The group could not be deleted."); pending.current = false; setBusy(false); }
  }

  return <div className="gd-settings">
    <form className="gd-panel" onSubmit={save}>
      <span className="gp-eyebrow">MANAGE YOUR GROUP</span><h2>Group settings</h2><p className="gd-muted">Make this space your own. Changes appear for everyone after you save.</p>
      {error && <p className="gp-form-error" role="alert">{error}</p>}
      {saved && <p className="gd-save-status" role="status"><Tick02Icon size={18} />Changes saved.</p>}
      <fieldset disabled={busy}>
        <label htmlFor="group-name">Group name</label><input id="group-name" required minLength={2} maxLength={100} value={name} onChange={e => { setName(e.target.value); setSaved(false); }} />
        <label htmlFor="group-description">About this group</label><textarea id="group-description" required minLength={10} maxLength={2000} rows={5} value={description} onChange={e => { setDescription(e.target.value); setSaved(false); }} />
        <label htmlFor="group-cover">Cover photo</label>
        {coverImage && <div className="gd-settings-cover"><Image src={coverImage} fill unoptimized alt="Group cover preview" /></div>}
        <div className="gd-cover-controls"><label className="gd-secondary" htmlFor="group-cover"><ImageUploadIcon size={18} />{coverImage ? "Change cover" : "Upload cover"}</label>{coverImage && <button className="gd-secondary" type="button" onClick={() => { setCoverImage(null); setSaved(false); }}>Remove cover</button>}</div>
        <input className="sr-only" id="group-cover" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} />
        <p className="gd-muted">JPG, PNG, or WebP · Up to 10 MB. A wide image works best.</p>
      </fieldset>
      <footer><button type="button" className="gd-secondary" disabled={busy} onClick={onCancel}>Back to discussions</button><button type="submit" className="gp-join" disabled={busy}>{busy ? "Please wait…" : "Save changes"}</button></footer>
    </form>
    <section className="gd-panel gd-danger"><h2>Delete group</h2><p>This permanently deletes the group, its discussions, comments, and memberships. This cannot be undone.</p>
      {confirming ? <><label htmlFor="delete-group-name">Type <strong>{group.name}</strong> to confirm</label><input id="delete-group-name" autoComplete="off" value={confirmation} disabled={busy} onChange={e => setConfirmation(e.target.value)} /><div className="gd-cover-controls"><button type="button" className="gd-secondary" disabled={busy} onClick={() => { setConfirming(false); setConfirmation(""); }}>Cancel</button><button type="button" className="gd-delete" disabled={busy || confirmation !== group.name} onClick={remove}>Permanently delete group</button></div></> : <button type="button" className="gd-delete" disabled={busy} onClick={() => setConfirming(true)}><Delete02Icon size={17} />Delete group</button>}
    </section>
  </div>;
}
