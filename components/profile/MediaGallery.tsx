"use client";

import { useState, useRef } from "react";
import { Plus, X, Loader2, Image as ImageIcon } from "lucide-react";

interface MediaGalleryProps {
  photos: string[];
  onChange: (photos: string[]) => void;
}

export default function MediaGallery({ photos, onChange }: MediaGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError("");
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
            <img src={p} alt="" className="w-full h-full object-cover" />
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
          <p className="text-xs font-semibold text-slate-400">{uploading ? "Uploading…" : "Click to upload photos & media"}</p>
          <p className="text-[10px] text-slate-300">Up to 12 photos</p>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-500">{error}</p>}
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
    </div>
  );
}
