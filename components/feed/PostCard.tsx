"use client";

import { useState, useRef, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { Loader2, MoreHorizontal, Pencil, Trash2, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ThumbsUpIcon, Comment01Icon, Share01Icon, SentIcon } from "hugeicons-react";
import DueDiligenceBadge from "@/components/badges/DueDiligenceBadge";
import UpgradeModal from "@/components/ui/UpgradeModal";

interface Author {
  id: string; name: string; image: string | null;
  headline: string | null; role: string; tier: string;
  hasDueDiligenceBadge?: boolean;
}

interface Comment {
  id: string; content: string; createdAt: string;
  author: { id: string; name: string; image: string | null };
}

export interface FeedPost {
  id: string; content: string; images: string[];
  videoUrl: string | null;
  likeCount: number; commentCount: number; createdAt: string;
  author: Author;
  comments: Comment[];
  _count: { likes: number; comments: number };
  likes: { id: string }[];
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

const tierBadge: Record<string, string> = {
  VIP: "bg-amber-100 text-amber-700",
  MARKETPLACE: "bg-indigo-100 text-indigo-700",
  MARKETPLACE_PLUS: "bg-emerald-100 text-emerald-700",
};

export default function PostCard({ post, onUpdate, onDelete }: { post: FeedPost; onUpdate: (updated: FeedPost) => void; onDelete?: (id: string) => void }) {
  const user = useAppSelector(s => s.auth.user);
  const isFree = user?.tier === "FREE" && user?.role !== "ADMIN";
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [liked, setLiked]           = useState(post.likes.length > 0);
  const [likeCount, setLikeCount]   = useState(post._count.likes);
  const [liking, setLiking]         = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]     = useState<Comment[]>(post.comments);
  const [commentCount, setCommentCount] = useState(post._count.comments);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [expanded, setExpanded]     = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // ── edit / delete state ──
  const [menuOpen, setMenuOpen]     = useState(false);
  const [editing, setEditing]       = useState(false);
  const [editText, setEditText]     = useState(post.content);
  const [saving, setSaving]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwn = user?.id === post.author.id;

  // close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowLeft")  setLightboxIdx(p => p !== null && p > 0 ? p - 1 : p);
      if (e.key === "ArrowRight") setLightboxIdx(p => p !== null && p < post.images.length - 1 ? p + 1 : p);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightboxIdx, post.images.length]);

  const handleSaveEdit = async () => {
    if (!editText.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/feed/${post.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText.trim() }),
      });
      if (res.ok) {
        const updated = await res.json() as FeedPost;
        onUpdate(updated);
        setEditing(false);
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/feed/${post.id}`, { method: "DELETE" });
      if (res.ok) onDelete?.(post.id);
    } finally { setDeleting(false); setConfirmDelete(false); }
  };

  const handleLike = async () => {
    if (!user || isFree) { setShowUpgrade(true); return; }
    if (liking) return;
    setLiking(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(n => newLiked ? n + 1 : n - 1);
    try {
      await fetch(`/api/feed/${post.id}/like`, { method: "POST" });
    } catch {
      setLiked(!newLiked);
      setLikeCount(n => newLiked ? n - 1 : n + 1);
    } finally { setLiking(false); }
  };

  const handleToggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0 && commentCount > 0) {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/feed/${post.id}/comment`);
        const data = await res.json() as Comment[];
        setComments(data);
      } catch { /* ignore */ }
      finally { setLoadingComments(false); }
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || postingComment) return;
    if (isFree) { setShowUpgrade(true); return; }
    setPostingComment(true);
    try {
      const res = await fetch(`/api/feed/${post.id}/comment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        const c = await res.json() as Comment;
        setComments(prev => [...prev, c]);
        setCommentCount(n => n + 1);
        setCommentText("");
      }
    } catch { /* ignore */ }
    finally { setPostingComment(false); }
  };

  const contentText = post.content;
  const isLong = contentText.length > 300;
  const displayText = isLong && !expanded ? contentText.slice(0, 300) + "…" : contentText;

  return (
    <>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} feature="Liking & commenting" />}
      <div className="bg-white rounded-2xl overflow-hidden transition-all">
      {/* Header */}
      <div className="flex items-start gap-3 p-5 pb-3">
        <div className="w-12 h-12 rounded-xl bg-[#0a1628] flex items-center justify-center overflow-hidden shrink-0">
          {post.author.image
            ? <img src={post.author.image} alt={post.author.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            : <span className="text-white font-bold text-base">{post.author.name?.[0]?.toUpperCase()}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[#0a1628] text-base">{post.author.name}</span>
            {post.author.hasDueDiligenceBadge && (
              <DueDiligenceBadge size={22} />
            )}
            {post.author.tier !== "FREE" && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tierBadge[post.author.tier] ?? ""}`}>
                {post.author.tier === "MARKETPLACE_PLUS" ? "Plus" : post.author.tier === "MARKETPLACE" ? "Market" : post.author.tier}
              </span>
            )}
          </div>
          {post.author.headline && (
            <div className="text-sm text-slate-400 truncate mt-0.5">{post.author.headline}</div>
          )}
          <div className="text-sm text-slate-400 mt-0.5">{timeAgo(post.createdAt)}</div>
        </div>
        {/* Three-dot menu for own posts */}
        {isOwn && (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(o => !o)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#0a1628] transition-all">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 w-36 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                <button onClick={() => { setEditing(true); setEditText(post.content); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  <Pencil className="w-3.5 h-3.5 text-slate-400" /> Edit post
                </button>
                <button onClick={() => { setConfirmDelete(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content / inline edit */}
      <div className="px-5 pb-4">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editText} onChange={e => setEditText(e.target.value)} rows={4}
              className="w-full text-sm text-slate-700 leading-relaxed border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#0a1628] resize-none font-[inherit] transition-all"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-all">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={saving || !editText.trim()}
                className="flex items-center gap-1.5 text-xs font-bold bg-[#0a1628] text-white px-4 py-1.5 rounded-xl hover:bg-[#1a3a6b] disabled:opacity-40 transition-all">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">{displayText}</p>
            {isLong && (
              <button onClick={() => setExpanded(e => !e)} className="text-xs font-semibold text-[#0a1628] mt-1 hover:underline">
                {expanded ? "Show less" : "…see more"}
              </button>
            )}
          </>
        )}
      </div>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className="px-5 pb-4">
          {/* ── 1 image ── */}
          {post.images.length === 1 && (
            <button onClick={() => setLightboxIdx(0)}
              className="block w-full rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in">
              <img src={post.images[0]} alt="Post image 1"
                className="w-full object-cover max-h-[480px] hover:opacity-95 transition-opacity" />
            </button>
          )}
          {/* ── 2 images ── */}
          {post.images.length === 2 && (
            <div className="grid grid-cols-2 gap-1.5">
              {post.images.map((url, i) => (
                <button key={i} onClick={() => setLightboxIdx(i)}
                  className="block rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in">
                  <img src={url} alt={`Post image ${i + 1}`}
                    className="w-full h-56 object-cover hover:opacity-95 transition-opacity" />
                </button>
              ))}
            </div>
          )}
          {/* ── 3 images: 1 full-width top, 2 below ── */}
          {post.images.length === 3 && (
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => setLightboxIdx(0)}
                className="col-span-2 block rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in">
                <img src={post.images[0]} alt="Post image 1"
                  className="w-full h-60 object-cover hover:opacity-95 transition-opacity" />
              </button>
              {post.images.slice(1).map((url, i) => (
                <button key={i + 1} onClick={() => setLightboxIdx(i + 1)}
                  className="block rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in">
                  <img src={url} alt={`Post image ${i + 2}`}
                    className="w-full h-44 object-cover hover:opacity-95 transition-opacity" />
                </button>
              ))}
            </div>
          )}
          {/* ── 4+ images: 2×2 grid, last tile shows +N overlay ── */}
          {post.images.length >= 4 && (
            <div className="grid grid-cols-2 gap-1.5">
              {post.images.slice(0, 4).map((url, i) => (
                <button key={i} onClick={() => setLightboxIdx(i)}
                  className="relative block rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in">
                  <img src={url} alt={`Post image ${i + 1}`}
                    className="w-full h-44 object-cover hover:opacity-95 transition-opacity" />
                  {i === 3 && post.images.length > 4 && (
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center rounded-xl">
                      <span className="text-white font-black text-3xl">+{post.images.length - 4}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video */}
      {post.videoUrl && (
        <div className="px-5 pb-4">
          <video
            src={post.videoUrl}
            controls
            playsInline
            className="w-full rounded-xl overflow-hidden max-h-[420px] bg-black object-contain"
            style={{ aspectRatio: "16/9" }}
          />
        </div>
      )}

      {/* Like / Comment counts */}
      {(likeCount > 0 || commentCount > 0) && (
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm font-medium text-slate-500">
          {likeCount > 0 && <span className="flex items-center gap-1.5"><ThumbsUpIcon className="w-3.5 h-3.5" /> {likeCount}</span>}
          {commentCount > 0 && (
            <button onClick={handleToggleComments} className="hover:text-[#0a1628] transition-colors">
              {commentCount} comment{commentCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-slate-100 px-3 py-1.5 flex items-center gap-2">
        <button onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${liked ? "text-[#1a3a6b] bg-[#1a3a6b]/5" : "text-slate-500 hover:bg-slate-50 hover:text-[#0a1628]"}`}>
          {liking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUpIcon className={`w-4 h-4 ${liked ? "fill-[#1a3a6b] stroke-none" : ""}`} />}
          Like
        </button>
        <button onClick={handleToggleComments}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-[#0a1628] transition-all">
          <Comment01Icon className="w-4 h-4" /> Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-[#0a1628] transition-all">
          <Share01Icon className="w-4 h-4" /> Share
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4 bg-slate-50/50">
          {loadingComments ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : (
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0a1628] flex items-center justify-center overflow-hidden shrink-0">
                    {c.author.image
                      ? <img src={c.author.image} alt={c.author.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      : <span className="text-white text-xs font-bold">{c.author.name?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                    <div className="text-sm font-bold text-[#0a1628]">{c.author.name}</div>
                    <div className="text-sm text-slate-600 mt-0.5 leading-relaxed">{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add comment — upgrade nudge for FREE users, input for VIP+ */}
          {isFree ? (
            <button
              onClick={() => setShowUpgrade(true)}
              className="flex items-center gap-2 w-full bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl px-4 py-3 text-xs font-bold text-amber-700 hover:from-amber-100 hover:to-amber-200 transition-all"
            >
              💎 Upgrade to VIP to add a comment
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#0a1628] flex items-center justify-center overflow-hidden shrink-0">
                {user?.image
                  ? <img src={user.image} alt={user.name ?? ""} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  : <span className="text-white text-[10px] font-bold">{user?.name?.[0]?.toUpperCase()}</span>}
              </div>
              <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-2">
                <input
                  type="text" placeholder="Add a comment…" value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAddComment(); }}
                  className="flex-1 font-[inherit] text-sm outline-none bg-transparent text-slate-700 placeholder-slate-400"
                />
                <button onClick={handleAddComment} disabled={!commentText.trim() || postingComment}
                  className="w-8 h-8 rounded-full bg-[#0a1628] flex items-center justify-center text-white hover:bg-[#1a3a6b] transition-colors disabled:opacity-30">
                  {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <SentIcon className="w-4 h-4 ml-0.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>

    {/* ── Confirm delete modal ── */}
    {confirmDelete && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="font-black text-[#0a1628] text-base">Delete post?</h3>
          <p className="text-slate-500 text-sm mt-1">This action cannot be undone. The post and all its comments will be permanently removed.</p>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setConfirmDelete(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
            <button onClick={handleDelete} disabled={deleting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Image lightbox ── */}
    {lightboxIdx !== null && post.images.length > 0 && (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={() => setLightboxIdx(null)}
      >
        {/* Close */}
        <button
          onClick={() => setLightboxIdx(null)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/40 text-white/80 text-sm font-bold px-4 py-1.5 rounded-full">
          {lightboxIdx + 1} / {post.images.length}
        </div>

        {/* Prev */}
        {lightboxIdx > 0 && (
          <button
            onClick={e => { e.stopPropagation(); setLightboxIdx(p => p! - 1); }}
            className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}

        {/* Image */}
        <img
          src={post.images[lightboxIdx]}
          alt={`Image ${lightboxIdx + 1}`}
          className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl select-none"
          onClick={e => e.stopPropagation()}
          draggable={false}
        />

        {/* Next */}
        {lightboxIdx < post.images.length - 1 && (
          <button
            onClick={e => { e.stopPropagation(); setLightboxIdx(p => p! + 1); }}
            className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        )}

        {/* Thumbnail strip */}
        {post.images.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
            {post.images.map((url, i) => (
              <button key={i}
                onClick={e => { e.stopPropagation(); setLightboxIdx(i); }}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === lightboxIdx ? "border-white scale-110" : "border-white/30 opacity-60 hover:opacity-90"
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    )}
  </>
  );
}
