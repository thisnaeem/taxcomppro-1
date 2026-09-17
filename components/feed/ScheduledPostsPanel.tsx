"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar03Icon as Calendar, Delete02Icon as Trash2, Loading03Icon as Loader2, Clock01Icon as Clock, Image01Icon as ImageIcon, Video02Icon as Video, RefreshIcon as RefreshCw } from "hugeicons-react";

interface ScheduledPost {
  id: string;
  content: string;
  images: string[];
  videoUrl: string | null;
  scheduledAt: string;
}

function timeUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "Publishing soon…";
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `in ${d}d ${h % 24}h`;
  if (h > 0) return `in ${h}h ${m % 60}m`;
  return `in ${m}m`;
}

interface Props {
  refreshKey?: number; // increment to force refresh
}

export default function ScheduledPostsPanel({ refreshKey = 0 }: Props) {
  const [posts,   setPosts]   = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => fetch("/api/feed/scheduled")
    .then(async res => { if (res.ok) setPosts(await res.json() as ScheduledPost[]); })
    .catch(() => { /* Preserve the current list if a refresh fails. */ })
    .finally(() => setLoading(false)), []);
  useEffect(() => { load(); }, [load, refreshKey]);

  const deletePost = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/feed/scheduled/${id}`, { method: "DELETE" });
      setPosts(p => p.filter(x => x.id !== id));
    } finally { setDeleting(null); }
  };

  if (posts.length === 0) return null;

  return (
    <div className="feed-surface feed-scheduled overflow-hidden">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => e.key === "Enter" && setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-all cursor-pointer select-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-[#0a1628] text-sm">Scheduled Posts</span>
          {!loading && (
            <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">
              {posts.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Refresh scheduled posts" onClick={e => { e.stopPropagation(); setLoading(true); load(); }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <span className="text-slate-400 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* List */}
      {open && (
        <div className="border-t border-blue-50 divide-y divide-slate-50">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-all">
                <div className="flex-1 min-w-0">
                  {/* Scheduled time */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="text-[10px] font-bold text-blue-600">
                      {new Date(post.scheduledAt).toLocaleString()} · {timeUntil(post.scheduledAt)}
                    </span>
                  </div>
                  {/* Content preview */}
                  {post.content && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{post.content}</p>
                  )}
                  {/* Attachments indicator */}
                  <div className="flex items-center gap-2 mt-1">
                    {post.images.length > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <ImageIcon className="w-3 h-3" />{post.images.length} image{post.images.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {post.videoUrl && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Video className="w-3 h-3" />Video
                      </span>
                    )}
                  </div>
                </div>
                {/* Delete */}
                <button
                  onClick={() => deletePost(post.id)}
                  disabled={deleting === post.id}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40">
                  {deleting === post.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
