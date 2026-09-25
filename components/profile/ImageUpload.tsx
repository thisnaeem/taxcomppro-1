"use client";

import { useRef } from "react";
import { Camera, Loader2 } from "lucide-react";

interface ImageUploadProps {
  current: string | null;
  type: "avatar" | "cover";
  onUploaded: (url: string) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
}

export default function ImageUpload({ current, type, onUploaded, uploading, setUploading }: ImageUploadProps) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("files", file);
    fd.append("type", type);
    const res = await fetch("/api/upload/profile", { method: "POST", body: fd });
    if (res.ok) {
      const { urls } = await res.json() as { urls: string[] };
      onUploaded(urls[0]);
    }
    setUploading(false);
    e.target.value = "";
  };

  if (type === "cover") {
    return (
      <div className="relative h-48 bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] rounded-2xl overflow-hidden group cursor-pointer"
        onClick={() => ref.current?.click()}>
        {current && <img src={current} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
          {uploading
            ? <Loader2 className="w-7 h-7 text-white animate-spin" />
            : <div className="flex flex-col items-center gap-1.5 text-white">
                <Camera className="w-7 h-7" />
                <span className="text-xs font-bold">Change Banner</span>
                <span className="text-[10px] text-slate-200 font-medium">Recommended: 1400 × 400 px (3.5:1) • max 5MB</span>
              </div>}
        </div>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    );
  }

  return (
    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg cursor-pointer group"
      onClick={() => ref.current?.click()}>
      <div className="w-full h-full bg-[#0a1628] flex items-center justify-center">
        {current
          ? <img src={current} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          : <span className="text-white font-black text-3xl">?</span>}
      </div>
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-0.5">
        {uploading
          ? <Loader2 className="w-5 h-5 text-white animate-spin" />
          : <><Camera className="w-5 h-5 text-white" /><span className="text-[9px] font-bold text-white/90">400×400</span></>}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
