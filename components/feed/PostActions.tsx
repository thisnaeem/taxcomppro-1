"use client";
import { useEffect, useRef, useState } from "react";
import { ThumbsUpIcon, Comment01Icon, Share01Icon, Cancel01Icon, Copy01Icon, ArrowDown01Icon, Link01Icon } from "hugeicons-react";
import { REACTIONS, isReaction, type ReactionType, type ReactionCounts } from "@/lib/reactions";

export default function PostActions({ postId, content, initialReaction, initialCounts, initialCount, commentCount, canReact, onRequireUpgrade, onComments, onShowReactions, onCountChange, privateGroup = false }: {
  postId: string; content: string; initialReaction?: string | null; initialCounts?: ReactionCounts; initialCount: number; commentCount: number;
  canReact: boolean; onRequireUpgrade: () => void; onComments: () => void; onShowReactions: () => void; onCountChange: (count: number) => void; privateGroup?: boolean;
}) {
  const [reaction, setReaction] = useState<ReactionType | null>(isReaction(initialReaction) ? initialReaction : null);
  const [counts, setCounts] = useState<ReactionCounts>(initialCounts ?? (initialCount ? { LIKE: initialCount } : {}));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [nativeShare, setNativeShare] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [people, setPeople] = useState<{ id: string; reaction?: string; user: { name: string } }[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState(false);
  const peopleLoaded = useRef(false);
  const peoplePending = useRef(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(false);
  const picker = useRef<HTMLDetailsElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const linkInput = useRef<HTMLInputElement>(null);
  const total = Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0);
  const selected = REACTIONS.find(item => item.type === reaction);
  const top = REACTIONS.filter(item => (counts[item.type] ?? 0) > 0).sort((a,b) => (counts[b.type] ?? 0) - (counts[a.type] ?? 0));

  useEffect(() => {
    if (!shareOpen) return;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); };
  }, [shareOpen]);

  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);
  const openPicker = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (picker.current) picker.current.open = true;
  };
  const closePicker = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => { if (picker.current) picker.current.open = false; }, 180);
  };
  const showPeople = async () => {
    setPeopleOpen(true);
    if (peopleLoaded.current || peoplePending.current) return;
    peoplePending.current = true; setPeopleLoading(true); setPeopleError(false);
    try {
      const response = await fetch(`/api/feed/${postId}/like`);
      if (!response.ok) throw new Error("Unable to load reactions");
      const data = await response.json();
      setPeople(Array.isArray(data.likes) ? data.likes.slice(0, 6) : []);
      peopleLoaded.current = true;
    } catch { setPeopleError(true); }
    finally { peoplePending.current = false; setPeopleLoading(false); }
  };

  const react = async (type: ReactionType) => {
    if (picker.current) picker.current.open = false;
    if (!canReact) { onRequireUpgrade(); return; }
    if (pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/feed/${postId}/like`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reaction: reaction === type ? null : type }) });
      const data = await response.json();
      if (!response.ok) throw new Error("Reaction failed");
      setReaction(isReaction(data.reaction) ? data.reaction : null);
      setCounts(data.reactionCounts ?? {});
      onCountChange(data.totalCount ?? 0);
      peopleLoaded.current = false;
    } catch { setError("Your reaction wasn’t saved. Please try again."); }
    finally { pending.current = false; setBusy(false); }
  };
  const openShare = () => {
    setShareUrl(`${window.location.origin}/feed?post=${encodeURIComponent(postId)}`);
    setNativeShare(typeof navigator.share === "function");
    setShareStatus(""); setShareOpen(true);
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setShareStatus("Link copied."); }
    catch { linkInput.current?.focus(); linkInput.current?.select(); setShareStatus("Select and copy the link above."); }
  };
  const share = async () => {
    try { await navigator.share({ title: "Post on Tax Compliance Pro", url: shareUrl, ...(privateGroup ? {} : { text: content.slice(0,160) }) }); setShareOpen(false); }
    catch (error) { if (!(error instanceof Error && error.name === "AbortError")) setShareStatus("Sharing isn’t available right now. You can copy the link instead."); }
  };

  return <>
    {(total > 0 || commentCount > 0) && <div className="feed-reaction-stats">
      {total > 0 && <div className="feed-people-hover" onMouseEnter={showPeople} onMouseLeave={() => setPeopleOpen(false)} onFocus={showPeople} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPeopleOpen(false); }} onKeyDown={event => { if (event.key === "Escape") setPeopleOpen(false); }}>
        <button type="button" className="feed-reaction-summary" onClick={onShowReactions} aria-describedby={peopleOpen ? `reaction-people-${postId}` : undefined} aria-label={`${total} reactions. View who reacted.`}>
          {top.slice(0,3).map(item => <span key={item.type} aria-hidden="true">{item.emoji}</span>)}<strong>{total}</strong>
        </button>
        {peopleOpen && <div className="feed-people-tooltip" id={`reaction-people-${postId}`} role="tooltip">
          <h3>People who reacted</h3>
          {peopleLoading ? <p>Loading reactions…</p> : peopleError ? <p>Couldn’t load names. Click to try the full list.</p> : <><ul>{people.map(person => <li key={person.id}><span aria-label={REACTIONS.find(item => item.type === person.reaction)?.label ?? "Like"}>{REACTIONS.find(item => item.type === person.reaction)?.emoji ?? "👍"}</span>{person.user.name}</li>)}</ul>{total > people.length && <p>And {total - people.length} more · click to view all</p>}</>}
        </div>}
      </div>}
      {commentCount > 0 && <button type="button" className="feed-comment-total" onClick={onComments}>{commentCount} comment{commentCount === 1 ? "" : "s"}</button>}
    </div>}
    <div className="feed-social-bar">
      <div className="feed-social-actions">
        <div className="feed-reaction-control" onMouseEnter={openPicker} onMouseLeave={closePicker}>
          <button type="button" onClick={() => react(reaction ?? "LIKE")} disabled={busy} aria-pressed={!!reaction} aria-label={selected ? `Remove ${selected.label} reaction` : "Like post"} className={reaction ? "is-reacted" : ""}>{selected ? <span className="feed-reaction-emoji" aria-hidden="true">{selected.emoji}</span> : <ThumbsUpIcon size={21} />}<span>{selected?.label ?? "Like"}</span></button>
          <details ref={picker} className="feed-reaction-picker" onKeyDown={event => { if (event.key === "Escape" && picker.current) picker.current.open = false; }}>
            <summary aria-label="Choose a reaction"><ArrowDown01Icon size={14} /></summary>
            <div className="feed-reaction-options" role="group" aria-label="Post reactions">{REACTIONS.map(item => <button key={item.type} type="button" title={item.label} aria-label={item.label} aria-pressed={reaction === item.type} disabled={busy} onClick={() => react(item.type)}><span aria-hidden="true">{item.emoji}</span><small>{item.label}</small></button>)}</div>
          </details>
        </div>
        <button type="button" onClick={onComments} aria-label={`${commentCount} comments`}><Comment01Icon size={21} /><span>Comment</span></button>
        <button type="button" onClick={openShare} aria-label="Share post"><Share01Icon size={21} /><span>Share</span></button>
      </div>
    </div>
    {error && <p className="feed-action-error" role="alert">{error}</p>}
    {shareOpen && <dialog ref={dialog} className="feed-share-dialog" onCancel={() => setShareOpen(false)} onClick={event => { if (event.target === event.currentTarget) setShareOpen(false); }}>
      <div className="feed-share-content"><header><h2>Share this post</h2><button type="button" aria-label="Close sharing" onClick={() => setShareOpen(false)}><Cancel01Icon size={22} /></button></header>
      <p>{privateGroup ? "This post is in a private group. Only group members can open it." : "Send this conversation to someone who would find it useful."}</p>
      <label htmlFor={`share-link-${postId}`}>Post link</label><div className="feed-share-link"><Link01Icon size={18} /><input ref={linkInput} id={`share-link-${postId}`} readOnly value={shareUrl} onFocus={event => event.target.select()} /></div>
      <div className="feed-share-buttons"><button type="button" onClick={copyLink}><Copy01Icon size={18} />Copy link</button>{nativeShare && <button type="button" onClick={share}><Share01Icon size={18} />More ways to share</button>}</div>
      <p role="status">{shareStatus}</p></div>
    </dialog>}
  </>;
}
