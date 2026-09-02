"use client";

import { useEffect, useState, useCallback, useRef } from "react";

import {
  Loader2, ChevronLeft, ChevronRight, Calendar,
  List, Trash2, Zap, Clock, ImageIcon, Video,
  User, RefreshCw, AlertTriangle, X, Plus,
} from "lucide-react";

interface ScheduledPost {
  id: string;
  content: string;
  images: string[];
  videoUrl: string | null;
  scheduledAt: string;
  author: { id: string; name: string; image: string | null; email: string; role: string };
}

type View = "calendar" | "list";

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtMonth(y: number, m: number) { return `${y}-${pad(m)}`; }

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}
function getFirstDayOfMonth(y: number, m: number) {
  return new Date(y, m - 1, 1).getDay(); // 0=Sun
}

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

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

function PostPill({ post, onDelete, onPublish }: {
  post: ScheduledPost;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
}) {
  const [acting, setActing] = useState<"delete" | "publish" | null>(null);
  const [confirm, setConfirm] = useState<"delete" | "publish" | null>(null);

  const doDelete = async () => {
    setActing("delete");
    await fetch(`/api/admin/content-calendar/${post.id}`, { method: "DELETE" });
    onDelete(post.id);
  };
  const doPublish = async () => {
    setActing("publish");
    await fetch(`/api/admin/content-calendar/${post.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publishNow: true }),
    });
    onPublish(post.id);
  };

  const time = new Date(post.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-blue-600 text-white rounded-lg px-2 py-1.5 text-[11px] group relative">
      <div className="flex items-start gap-1 min-w-0">
        <Clock className="w-3 h-3 shrink-0 mt-0.5 opacity-70" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[10px] opacity-80">{time}</div>
          <div className="line-clamp-1 leading-tight">{post.content || "(media only)"}</div>
          <div className="flex items-center gap-1 mt-0.5 opacity-70">
            <User className="w-2.5 h-2.5" />
            <span className="text-[10px] truncate">{post.author.name}</span>
          </div>
        </div>
      </div>
      <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5 z-10">
        {confirm === "publish" ? (
          <>
            <button onClick={doPublish} disabled={!!acting}
              className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg hover:bg-emerald-600">
              {acting === "publish" ? "…" : "Confirm"}
            </button>
            <button onClick={() => setConfirm(null)} className="bg-slate-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg">✕</button>
          </>
        ) : confirm === "delete" ? (
          <>
            <button onClick={doDelete} disabled={!!acting}
              className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg hover:bg-red-600">
              {acting === "delete" ? "…" : "Delete?"}
            </button>
            <button onClick={() => setConfirm(null)} className="bg-slate-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg">✕</button>
          </>
        ) : (
          <>
            <button onClick={() => setConfirm("publish")} title="Publish now"
              className="bg-emerald-500 text-white w-5 h-5 rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-600">
              <Zap className="w-3 h-3" />
            </button>
            <button onClick={() => setConfirm("delete")} title="Delete"
              className="bg-red-500 text-white w-5 h-5 rounded-full shadow-lg flex items-center justify-center hover:bg-red-600">
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CreatePostModal({ defaultDate, onClose, onCreated }: {
  defaultDate: string;
  onClose: () => void;
  onCreated: (post: ScheduledPost) => void;
}) {
  const [content,    setContent]    = useState("");
  const [time,       setTime]       = useState("12:00");
  const [submitting, setSubmitting] = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState("");

  // Image state
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const imageRef = useRef<HTMLInputElement>(null);

  // Video state
  const [video,      setVideo]      = useState<{ file: File; url: string } | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const scheduledAt = `${defaultDate}T${time}`;

  /* ── image handlers ── */
  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const remaining = 4 - previews.length;
    Array.from(files).slice(0, remaining).forEach(file => {
      setPreviews(p => [...p, { file, url: URL.createObjectURL(file) }]);
    });
    setVideo(null); // can't mix images and video
  };

  const removeImage = (idx: number) => {
    setPreviews(p => {
      URL.revokeObjectURL(p[idx].url);
      return p.filter((_, i) => i !== idx);
    });
  };

  /* ── video handlers ── */
  const handleVideo = (files: FileList | null) => {
    setVideoError(null);
    if (!files || !files[0]) return;
    const file = files[0];
    if (!file.type.startsWith("video/")) { setVideoError("Only video files are allowed."); return; }
    const url = URL.createObjectURL(file);
    const el  = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      if (el.duration > 60) {
        setVideoError(`Video must be 60 seconds or less.`);
        URL.revokeObjectURL(url);
      } else {
        setPreviews([]); // can't mix images and video
        setVideo({ file, url });
      }
      URL.revokeObjectURL(el.src);
    };
    el.src = url;
  };

  const removeVideo = () => {
    if (video) URL.revokeObjectURL(video.url);
    setVideo(null);
    setVideoError(null);
    if (videoRef.current) videoRef.current.value = "";
  };

  const hasMedia = previews.length > 0 || !!video;

  const submit = async () => {
    if (!content.trim() && !hasMedia) { setError("Add content, an image, or a video."); return; }
    const dt = new Date(scheduledAt);
    if (dt <= new Date(Date.now() + 60_000)) { setError("Must be at least 1 minute in the future."); return; }
    setError(""); setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      let videoUrl: string | null = null;

      /* upload images */
      if (previews.length > 0) {
        setUploading(true);
        const fd = new FormData();
        previews.forEach(p => fd.append("files", p.file));
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        setUploading(false);
        if (!res.ok) { setError("Image upload failed."); return; }
        const data = await res.json() as { urls: string[] };
        imageUrls = data.urls;
      }

      /* upload video via signed ticket */
      if (video) {
        setUploading(true);
        const ticketRes = await fetch("/api/upload-video");
        if (!ticketRes.ok) { setError("Could not get upload token."); setUploading(false); return; }
        const { timestamp, signature, folder, apiKey, cloudName } =
          await ticketRes.json() as { timestamp: number; signature: string; folder: string; apiKey: string; cloudName: string };
        const fd = new FormData();
        fd.append("file",      video.file);
        fd.append("timestamp", String(timestamp));
        fd.append("signature", signature);
        fd.append("api_key",   apiKey);
        fd.append("folder",    folder);
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, { method: "POST", body: fd });
        setUploading(false);
        if (!uploadRes.ok) { setError("Video upload failed."); return; }
        const data = await uploadRes.json() as { secure_url: string };
        videoUrl = data.secure_url;
      }

      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), images: imageUrls, videoUrl, scheduledAt: dt.toISOString() }),
      });

      if (res.ok) {
        const post = await res.json();
        onCreated(post);
        onClose();
      } else {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error ?? "Failed to schedule post.");
      }
    } catch { setError("Something went wrong. Please try again."); }
    finally { setSubmitting(false); setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-black text-[#0a1628] text-lg">Schedule a Post</h2>
            <p className="text-slate-400 text-xs mt-0.5">Posting as Admin · {new Date(defaultDate).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Text area */}
          <textarea
            value={content} onChange={e => { setContent(e.target.value); setError(""); }}
            placeholder="Write a tax insight, update, or announcement…"
            rows={4}
            className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 resize-none outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all font-[inherit]"
          />

          {/* Image previews */}
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previews.map((p, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {previews.length < 4 && (
                <button onClick={() => imageRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:border-[#0a1628] hover:text-[#0a1628] transition-all">
                  <Plus className="w-6 h-6" />
                </button>
              )}
            </div>
          )}

          {/* Video preview */}
          {video && (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video src={video.url} controls className="w-full max-h-48 object-contain" />
              <button onClick={removeVideo}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {videoError && <p className="text-xs text-red-500">{videoError}</p>}

          {/* Media toolbar */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <input ref={imageRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => { handleImages(e.target.files); e.target.value = ""; }} />
            <input ref={videoRef} type="file" accept="video/*" className="hidden"
              onChange={e => { handleVideo(e.target.files); e.target.value = ""; }} />
            <button onClick={() => imageRef.current?.click()} disabled={!!video || previews.length >= 4}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0a1628] hover:bg-slate-100 px-3 py-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <ImageIcon className="w-4 h-4 text-blue-500" />
              {previews.length > 0 ? `${previews.length}/4 images` : "Add Images"}
            </button>
            <button onClick={() => videoRef.current?.click()} disabled={previews.length > 0 || !!video}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0a1628] hover:bg-slate-100 px-3 py-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <Video className="w-4 h-4 text-purple-500" />
              {video ? "1 video" : "Add Video"}
            </button>
            <span className="text-[10px] text-slate-300 ml-1">Images and video are mutually exclusive</span>
          </div>

          {/* Time picker */}
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-bold text-blue-800 mb-1">Publish time on {new Date(defaultDate + "T12:00").toLocaleDateString([], { month: "short", day: "numeric" })}</div>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="text-sm font-bold text-[#0a1628] bg-transparent outline-none border-none" />
            </div>
            <div className="text-[11px] text-blue-600 font-semibold">
              {new Date(scheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="text-sm font-semibold text-slate-400 hover:text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all">Cancel</button>
          <button onClick={submit} disabled={submitting || uploading || (!content.trim() && !hasMedia)}
            className="flex items-center gap-2 bg-[#0a1628] text-white font-black text-sm px-6 py-2.5 rounded-xl hover:bg-[#1a3a6b] transition-all disabled:opacity-40">
            {(submitting || uploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            {uploading ? "Uploading…" : submitting ? "Scheduling…" : "Schedule Post"}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function AdminContentCalendarPage() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [posts,   setPosts]   = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState<View>("calendar");
  const [search,  setSearch]  = useState("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content-calendar?month=${fmtMonth(y, m)}`);
      if (res.ok) setPosts(await res.json() as ScheduledPost[]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(year, month); }, [load, year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const removePost  = (id: string) => setPosts(p => p.filter(x => x.id !== id));
  const publishPost = (id: string) => setPosts(p => p.filter(x => x.id !== id));
  const onCreated   = (post: ScheduledPost) => {
    // Add to list if it falls in current month view
    const d = new Date(post.scheduledAt);
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      setPosts(p => [...p, post].sort((a,b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));
    }
  };

  // Group posts by day-of-month
  const byDay: Record<number, ScheduledPost[]> = {};
  for (const p of posts) {
    const d = new Date(p.scheduledAt).getDate();
    (byDay[d] ??= []).push(p);
  }

  const daysInMonth  = getDaysInMonth(year, month);
  const firstDay     = getFirstDayOfMonth(year, month);

  // Filter for list view
  const filtered = posts.filter(p =>
    !search || p.author.name.toLowerCase().includes(search.toLowerCase()) ||
    p.author.email.toLowerCase().includes(search.toLowerCase()) ||
    p.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Content Calendar</h1>
          <p className="text-slate-400 text-sm mt-0.5">All scheduled posts across the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(year, month)}
            className="p-2 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700 transition-all text-slate-300">
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex rounded-xl border border-white/10 overflow-hidden bg-slate-800/80">
            <button onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-all ${view === "calendar" ? "bg-[#f0c040] text-slate-950 font-black" : "text-slate-400 hover:text-white"}`}>
              <Calendar className="w-4 h-4" /> Calendar
            </button>
            <button onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-all ${view === "list" ? "bg-[#f0c040] text-slate-950 font-black" : "text-slate-400 hover:text-white"}`}>
              <List className="w-4 h-4" /> List
            </button>
          </div>
        </div>
      </div>

      {/* Month nav + stats */}
      <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-700/60 transition-all text-slate-300">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-black text-white min-w-[180px] text-center">
            {MONTHS[month - 1]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-700/60 transition-all text-slate-300">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={() => { const n = new Date(); setYear(n.getFullYear()); setMonth(n.getMonth() + 1); }}
            className="text-xs font-bold text-amber-300 border border-amber-400/30 px-3 py-1.5 rounded-lg hover:bg-amber-400/10 transition-all">
            Today
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-300 font-semibold">{posts.length} scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-300 font-semibold">{[...new Set(posts.map(p => p.author.id))].length} authors</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
      ) : view === "calendar" ? (
        /* ── CALENDAR VIEW ── */
        <div className="bg-white rounded-2xl overflow-x-auto border border-slate-100 shadow-xl">
          <div className="min-w-[640px]">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DAYS.map(d => (
                <div key={d} className="py-3 text-center text-xs font-black text-slate-400 uppercase tracking-widest">{d}</div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[120px] bg-slate-50/50 border-r border-b border-slate-100" />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day      = i + 1;
                const dayPosts = byDay[day] ?? [];
                const isToday  = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
                const isPast   = new Date(year, month - 1, day) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const isoDate  = `${year}-${pad(month)}-${pad(day)}`;
                return (
                  <div key={day}
                    onClick={() => !isPast && setSelectedDay(isoDate)}
                    className={`min-h-[120px] border-r border-b border-slate-100 p-1.5 flex flex-col gap-1 transition-all
                      ${isPast ? "bg-slate-50/60" : "bg-white hover:bg-blue-50/30 cursor-pointer"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-0.5 self-start ${
                      isToday ? "bg-[#0a1628] text-white" : "text-slate-400"
                    }`}>{day}</div>
                    {!isPast && dayPosts.length === 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 px-1">
                        <Plus className="w-3 h-3"/> Add post
                      </div>
                    )}
                    {dayPosts.slice(0, 3).map(p => (
                      <div key={p.id} onClick={e => e.stopPropagation()}>
                        <PostPill post={p} onDelete={removePost} onPublish={publishPost} />
                      </div>
                    ))}
                    {dayPosts.length > 3 && (
                      <div className="text-[10px] font-bold text-slate-400 px-1">+{dayPosts.length - 3} more</div>
                    )}
                  </div>
                );
              })}
              {/* Fill remaining cells */}
              {Array.from({ length: (7 - (firstDay + daysInMonth) % 7) % 7 }).map((_, i) => (
                <div key={`trail-${i}`} className="min-h-[120px] bg-slate-50/50 border-r border-b border-slate-100" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="space-y-4">
          {/* Search */}
          <div className="bg-white rounded-2xl p-4">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by author name, email, or content…"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#0a1628] transition-all"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-14 text-center">
              <AlertTriangle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-black text-slate-400">No scheduled posts for {MONTHS[month - 1]} {year}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-100">
              {/* Header row */}
              <div className="grid grid-cols-[160px_1fr_80px_160px_220px] gap-4 border-b border-slate-100 px-5 py-3">
                {["Author","Content","Media","Scheduled","Actions"].map(h => (
                  <div key={h} className="text-xs font-black text-slate-400 uppercase tracking-widest">{h}</div>
                ))}
              </div>
              <div className="divide-y divide-slate-50">
                {filtered.map(post => (
                  <ListRow key={post.id} post={post} onDelete={removePost} onPublish={publishPost} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-slate-400 pb-4">
        <Plus className="w-3.5 h-3.5 text-blue-500" />
        <span>Click any future date to schedule a new post</span>
        <span className="mx-2">·</span>
        <Zap className="w-3.5 h-3.5 text-emerald-500" />
        <span>Hover a post to publish or delete</span>
      </div>

      {/* Create Post Modal */}
      {selectedDay && (
        <CreatePostModal
          defaultDate={selectedDay}
          onClose={() => setSelectedDay(null)}
          onCreated={onCreated}
        />
      )}
    </div>
  );
}

function ListRow({ post, onDelete, onPublish }: {
  post: ScheduledPost;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
}) {
  const [acting, setActing] = useState<"delete" | "publish" | null>(null);
  const [confirm, setConfirm] = useState<"delete" | "publish" | null>(null);

  const doDelete = async () => {
    setActing("delete");
    await fetch(`/api/admin/content-calendar/${post.id}`, { method: "DELETE" });
    onDelete(post.id);
  };
  const doPublish = async () => {
    setActing("publish");
    await fetch(`/api/admin/content-calendar/${post.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publishNow: true }),
    });
    onPublish(post.id);
  };

  return (
    <div className="grid grid-cols-[160px_1fr_80px_160px_220px] gap-4 items-start px-5 py-4 hover:bg-slate-50 transition-all">
      {/* Author */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[#0a1628] flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
          {post.author.image
            ? <img src={post.author.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            : post.author.name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-[#0a1628] truncate">{post.author.name}</div>
          <div className="text-[10px] text-slate-400 truncate">{post.author.email}</div>
        </div>
      </div>
      {/* Content */}
      <div className="min-w-0">
        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {post.content || <span className="italic text-slate-400">(media only)</span>}
        </p>
      </div>
      {/* Media */}
      <div className="flex items-center gap-1 flex-wrap">
        {post.images.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
            <ImageIcon className="w-3 h-3" />{post.images.length}
          </span>
        )}
        {post.videoUrl && (
          <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
            <Video className="w-3 h-3" />
          </span>
        )}
      </div>
      {/* Scheduled */}
      <div>
        <div className="text-xs font-bold text-[#0a1628]">
          {new Date(post.scheduledAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
        </div>
        <div className="text-[10px] text-blue-500 font-semibold flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />
          {new Date(post.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          <span className="text-slate-400">· {timeUntil(post.scheduledAt)}</span>
        </div>
      </div>
      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {confirm === "publish" ? (
          <>
            <button onClick={doPublish} disabled={!!acting}
              className="text-xs font-bold bg-emerald-500 text-white px-3 py-1.5 rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-1">
              {acting === "publish" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}Confirm
            </button>
            <button onClick={() => setConfirm(null)} className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1.5 rounded-xl hover:bg-slate-200 transition-all">✕</button>
          </>
        ) : confirm === "delete" ? (
          <>
            <button onClick={doDelete} disabled={!!acting}
              className="text-xs font-bold bg-red-500 text-white px-3 py-1.5 rounded-xl hover:bg-red-600 transition-all flex items-center gap-1">
              {acting === "delete" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}Delete?
            </button>
            <button onClick={() => setConfirm(null)} className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1.5 rounded-xl hover:bg-slate-200 transition-all">✕</button>
          </>
        ) : (
          <>
            <button onClick={() => setConfirm("publish")} title="Publish now"
              className="flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-all">
              <Zap className="w-3 h-3" /> Publish Now
            </button>
            <button onClick={() => setConfirm("delete")} title="Delete"
              className="flex items-center gap-1 text-xs font-bold bg-red-50 text-red-500 px-3 py-1.5 rounded-xl hover:bg-red-100 transition-all">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
