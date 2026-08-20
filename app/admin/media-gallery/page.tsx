"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Video,
  ExternalLink,
  ThumbsUp,
  MessageCircle,
  Calendar,
  Search,
  Grid3x3,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface MediaPost {
  id: string;
  content: string;
  images: string[];
  videoUrl: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

type MediaType = "all" | "images" | "videos";
type GridSize = "compact" | "large";

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function AdminMediaGalleryPage() {
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<MediaType>("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [grid, setGrid] = useState<GridSize>("large");
  const [search, setSearch] = useState("");
  const [lightbox, setLightbox] = useState<{ url: string; type: "image" | "video" } | null>(null);

  const fetchMedia = async (t: MediaType, p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/media-gallery?type=${t}&page=${p}&limit=40`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia(type, page);
  }, [type, page]);

  const handleTypeChange = (t: MediaType) => {
    setType(t);
    setPage(1);
  };

  // Flatten media items from posts
  const mediaItems = posts.flatMap((post) => [
    ...post.images.map((url) => ({ url, kind: "image" as const, post })),
    ...(post.videoUrl ? [{ url: post.videoUrl, kind: "video" as const, post }] : []),
  ]).filter((item) =>
    !search ||
    item.post.content.toLowerCase().includes(search.toLowerCase()) ||
    item.post.author.name.toLowerCase().includes(search.toLowerCase())
  );

  const imageCount = posts.reduce((s, p) => s + p.images.length, 0);
  const videoCount = posts.filter((p) => p.videoUrl).length;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Media Gallery</h1>
          <p className="text-slate-400 text-sm mt-0.5">All images &amp; videos posted to the feed</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Grid size toggle */}
          <div className="flex rounded-xl border border-white/10 overflow-hidden bg-slate-800/80">
            <button
              onClick={() => setGrid("compact")}
              className={`p-2 transition-all ${
                grid === "compact" ? "bg-[#f0c040] text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGrid("large")}
              className={`p-2 transition-all ${
                grid === "large" ? "bg-[#f0c040] text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats + Filter bar */}
      <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4 shadow-xl backdrop-blur-sm">
        {/* Type tabs */}
        <div className="flex gap-1 bg-slate-900/60 border border-white/5 rounded-xl p-1">
          {(["all", "images", "videos"] as MediaType[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                type === t
                  ? "bg-[#f0c040] text-[#0a1628] shadow-sm font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t === "images" ? (
                <ImageIcon className="w-3.5 h-3.5" />
              ) : t === "videos" ? (
                <Video className="w-3.5 h-3.5" />
              ) : null}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-700/50 border border-white/10 rounded-xl px-3 py-2 w-64">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by author or content…"
            className="text-sm bg-transparent outline-none text-white placeholder-slate-500 w-full"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-slate-300">
          <span className="flex items-center gap-1.5 font-semibold">
            <ImageIcon className="w-4 h-4 text-blue-400" />
            {imageCount} images
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <Video className="w-4 h-4 text-purple-400" />
            {videoCount} videos
          </span>
          <span className="text-slate-400">{total} posts total</span>
        </div>
      </div>

      {/* Gallery */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      ) : mediaItems.length === 0 ? (
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-16 text-center shadow-xl">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="font-black text-slate-300 text-lg">No media found</p>
          <p className="text-sm text-slate-500 mt-1">Posts with images or videos will appear here.</p>
        </div>
      ) : (
        <div
          className={`grid gap-2 ${
            grid === "compact"
              ? "grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8"
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
          }`}
        >
          {mediaItems.map((item, i) => (
            <div
              key={`${item.post.id}-${i}`}
              className="group relative rounded-xl overflow-hidden bg-slate-900 border border-white/5 cursor-pointer shadow-md"
              style={{ aspectRatio: "1" }}
              onClick={() => setLightbox({ url: item.url, type: item.kind })}
            >
              {item.kind === "image" ? (
                <img
                  src={item.url}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <video src={item.url} className="w-full h-full object-cover" muted playsInline />
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex flex-col justify-between p-2.5 opacity-0 group-hover:opacity-100">
                {/* Type badge */}
                <div className="flex justify-between">
                  <span
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.kind === "video" ? "bg-purple-500 text-white" : "bg-blue-500 text-white"
                    }`}
                  >
                    {item.kind === "video" ? (
                      <Video className="w-2.5 h-2.5" />
                    ) : (
                      <ImageIcon className="w-2.5 h-2.5" />
                    )}
                    {item.kind}
                  </span>
                  <Link
                    href={`/feed`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-6 h-6 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-all"
                  >
                    <ExternalLink className="w-3 h-3 text-white" />
                  </Link>
                </div>

                {/* Author + stats */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 overflow-hidden shrink-0">
                      {item.post.author.image ? (
                        <img src={item.post.author.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-white text-[8px] font-black">
                          {item.post.author.name[0]}
                        </span>
                      )}
                    </div>
                    <span className="text-white text-[10px] font-bold truncate">
                      {item.post.author.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-white/80">
                    <span className="flex items-center gap-0.5">
                      <ThumbsUp className="w-2.5 h-2.5 text-amber-400" />
                      {item.post._count.likes}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MessageCircle className="w-2.5 h-2.5 text-blue-400" />
                      {item.post._count.comments}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5 text-slate-400" />
                      {timeAgo(item.post.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 pb-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 transition-all text-white"
          >
            <ChevronLeft className="w-4 h-4 text-slate-300" />
          </button>
          <span className="text-sm font-bold text-slate-300">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="p-2 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 transition-all text-white"
          >
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all z-10"
          >
            ✕
          </button>
          {lightbox.type === "image" ? (
            <img
              src={lightbox.url}
              alt="Media"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              src={lightbox.url}
              controls
              autoPlay
              className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl bg-black"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}
