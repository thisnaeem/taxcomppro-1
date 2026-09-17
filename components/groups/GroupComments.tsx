"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Message01Icon } from "hugeicons-react";
type Comment = { id: string; content: string; author: { name: string }; createdAt: string };
export function GroupComments({ postId, count, canPost, onAdded, likeAction }: { postId: string; count: number; canPost: boolean; onAdded: () => void; likeAction: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="gf-comments"><div className="gf-post-reactions">{likeAction}<button className="gf-comment-toggle" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><Message01Icon size={17} />{count} {count===1 ? "comment" : "comments"}</button></div>{open && <CommentThread postId={postId} canPost={canPost} onAdded={onAdded} />}</div>;
}
function CommentThread({ postId, canPost, onAdded }: { postId: string; canPost: boolean; onAdded: () => void }) {
  const [comments,setComments]=useState<Comment[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[draft,setDraft]=useState(""),[saving,setSaving]=useState(false),[retry,setRetry]=useState(0);
  const pending=useRef(false);
  useEffect(()=>{const controller=new AbortController();fetch(`/api/feed/${postId}/comment`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error("Couldn’t load comments.");return r.json();}).then(setComments).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[postId,retry]);
  async function submit(e:React.FormEvent){e.preventDefault();if(!draft.trim()||pending.current)return;pending.current=true;setSaving(true);setError("");try{const r=await fetch(`/api/feed/${postId}/comment`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:draft})});if(!r.ok)throw Error("Couldn’t post your reply. Your draft is still here.");const comment=await r.json();setComments(c=>[...c,comment]);setDraft("");onAdded();}catch(e){setError((e as Error).message);}finally{pending.current=false;setSaving(false);}}
  return <div className="gf-comment-thread">{error && <p role="alert" className="gp-form-error">{error}<button onClick={()=>{setError("");setRetry(v=>v+1);}}>Retry</button></p>}{loading ? <p role="status">Loading comments…</p> : comments.map(c=><div className="gf-comment" key={c.id}><strong>{c.author.name}</strong><p>{c.content}</p></div>)}{!loading&&!comments.length&&!error&&<p className="gd-muted">Be the first to reply.</p>}{canPost && <form onSubmit={submit}><textarea aria-label="Write a comment" placeholder="Write a reply…" value={draft} maxLength={5000} rows={2} onChange={e=>setDraft(e.target.value)} /><button className="gp-join" disabled={saving||loading||!draft.trim()}>{saving ? "Posting…" : "Post reply"}</button></form>}</div>;
}
