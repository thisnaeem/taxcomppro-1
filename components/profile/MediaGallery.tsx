"use client";

import { useState, useRef } from "react";
import { Plus, X, Loader2, Image as ImageIcon, FileText, Play } from "lucide-react";
import { mediaFileName, mediaKind } from "@/lib/mediaType";

interface MediaGalleryProps {
  photos: string[];
  onChange: (photos: string[]) => void;
}

export default function MediaGallery({ photos, onChange }: MediaGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    // Cloudinary limits: 100 MB per video, 10 MB per image/PDF
    const tooBig = picked.filter(f => f.size > (f.type.startsWith("video/") ? 100 : 10) * 1024 * 1024);
    const files = picked.filter(f => !tooBig.includes(f));
    if (tooBig.length) setError(`${tooBig.map(f => f.name).join(", ")} ${tooBig.length === 1 ? "is" : "are"} too large (max 100 MB for videos, 10 MB for photos/PDFs).`);
    if (!files.length) { e.target.value = ""; return; }
    setUploading(true);
    if (!tooBig.length) setError("");
    const fd = new FormData();
    files.slice(0, Math.min(8, 12 - photos.length)).forEach(f => fd.append("files", f));
    fd.append("type", "media");
    try {
      const res = await fetch("/api/upload/profile", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({})) as { urls?: string[]; error?: string };
      if (res.ok && data.urls) onChange([...photos, ...data.urls].slice(0, 12));
      else setError(data.error || "Upload failed. Please try again.");
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const remove = (url: string) => onChange(photos.filter(p => p !== url));

  return (
    <div>
      {photos.length > 0 && <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {photos.map(p => (
          <div key={p} className="relative aspect-square rounded-xl overflow-hidden group">
            {mediaKind(p) === "video" ? (
              <>
                <video src={`${p}#t=0.5`} preload="metadata" muted playsInline className="w-full h-full object-cover" />
                <span className="absolute inset-0 grid place-items-center pointer-events-none"><span className="w-9 h-9 rounded-full bg-black/55 text-white grid place-items-center"><Play className="w-4 h-4 fill-current" /></span></span>
              </>
            ) : mediaKind(p) === "document" ? (
              <a href={p} target="_blank" rel="noopener noreferrer" className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                <FileText className="w-7 h-7 text-amber-500" />
                <span className="text-[10px] font-semibold text-center line-clamp-2 break-all">{mediaFileName(p)}</span>
              </a>
            ) : (
              <img src={p} alt="" className="w-full h-full object-cover" />
            )}
            <button onClick={() => remove(p)}
              className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {photos.length < 12 && (
          <button onClick={() => ref.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-[#0a1628] hover:bg-slate-50 flex flex-col items-center justify-center gap-1 transition-all text-slate-400 hover:text-[#0a1628]">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /><span className="text-[10px] font-bold">Add</span></>}
          </button>
        )}
      </div>}
      {photos.length === 0 && (
        <div onClick={() => ref.current?.click()}
          className="p-8 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center gap-2 cursor-pointer hover:border-[#0a1628] hover:bg-slate-50 transition-all">
          {uploading ? <Loader2 className="w-8 h-8 text-slate-300 animate-spin" /> : <ImageIcon className="w-8 h-8 text-slate-300" />}
          <p className="text-xs font-semibold text-slate-400">{uploading ? "Uploading…" : "Click to upload photos, videos or PDFs"}</p>
          <p className="text-[10px] text-slate-300">Up to 12 files</p>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-500">{error}</p>}
      <input ref={ref} type="file" accept="image/*,video/*,application/pdf" multiple className="hidden" onChange={handleFiles} />
    </div>
  );
}
