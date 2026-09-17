"use client";
import { useRef, useState } from "react";
import { Menu01Icon, Delete02Icon } from "hugeicons-react";

export function GroupPostContent({ postId, content, canEdit, canDelete, onSaved, onDeleted }: { postId: string; content: string; canEdit: boolean; canDelete: boolean; onSaved: (content: string) => void; onDeleted: () => void }) {
  const [menu, setMenu] = useState(false), [editing, setEditing] = useState(false), [confirming, setConfirming] = useState(false);
  const [draft, setDraft] = useState(content), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const pending = useRef(false);
  async function mutate(method: "PATCH" | "DELETE") {
    if (pending.current || (method === "PATCH" && !draft.trim())) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/feed/${postId}`, { method, ...(method === "PATCH" ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: draft }) } : {}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The post could not be updated. Please try again.");
      if (method === "DELETE") onDeleted();
      else { onSaved(data.content); setEditing(false); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Something went wrong. Please try again."); }
    finally { pending.current = false; setBusy(false); }
  }
  return <>
    {(canEdit || canDelete) && <div className="gf-post-tools" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setMenu(false); }} onKeyDown={e => { if (e.key === "Escape") setMenu(false); }}><button className="gf-post-menu-button" aria-label="Post options" aria-expanded={menu} onClick={() => setMenu(v => !v)} disabled={busy}><Menu01Icon size={20} /></button>{menu && <div className="gf-post-menu">{canEdit && <button onClick={() => { setDraft(content); setEditing(true); setConfirming(false); setMenu(false); setError(""); }}>Edit post</button>}{canDelete && <button onClick={() => { setConfirming(true); setEditing(false); setMenu(false); setError(""); }}><Delete02Icon size={16} />Delete post</button>}</div>}</div>}
    {error && <p className="gp-form-error" role="alert">{error}</p>}
    {editing ? <form className="gf-post-editor" onSubmit={e => { e.preventDefault(); void mutate("PATCH"); }}><label htmlFor={`edit-${postId}`}>Edit your post</label><textarea id={`edit-${postId}`} autoFocus rows={4} maxLength={20000} value={draft} disabled={busy} onChange={e => setDraft(e.target.value)} /><div><button type="button" className="gd-secondary" disabled={busy} onClick={() => { setEditing(false); setError(""); }}>Cancel</button><button className="gp-join" disabled={busy || !draft.trim()}>{busy ? "Saving…" : "Save changes"}</button></div></form> : <p className="gd-post-content">{content}</p>}
    {confirming && <div className="gf-post-delete" role="group" aria-label="Confirm post deletion"><strong>Delete this post?</strong><p>The post and its comments and reactions will be permanently removed.</p><div><button className="gd-secondary" disabled={busy} onClick={() => { setConfirming(false); setError(""); }}>Cancel</button><button className="gd-delete" disabled={busy} onClick={() => mutate("DELETE")}>{busy ? "Deleting…" : "Delete post"}</button></div></div>}
  </>;
}
