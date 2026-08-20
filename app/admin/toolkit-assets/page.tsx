"use client";

import { useEffect, useState, useRef } from "react";
import { TOOLKITS } from "@/lib/toolkits";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  FileIcon,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface AssetRecord {
  id: string;
  toolkitId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  updatedAt: string;
}

interface ToolkitRow {
  toolkitId: string;
  name: string;
  price: number;
  emoji: string;
  asset: AssetRecord | null;
}

function fmtSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminToolkitAssetsPage() {
  const [rows, setRows] = useState<ToolkitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null); // toolkitId being uploaded
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/toolkit-assets");
      const assets: AssetRecord[] = res.ok ? await res.json() : [];
      const assetMap = new Map(assets.map((a) => [a.toolkitId, a]));

      const combined: ToolkitRow[] = TOOLKITS.map((tk) => ({
        toolkitId: tk.id,
        name: tk.name,
        price: tk.price,
        emoji: tk.emoji ?? "📦",
        asset: assetMap.get(tk.id) ?? null,
      }));
      setRows(combined);
    } catch {
      showToast("Failed to load toolkit assets", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleFileChange = async (toolkitId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(toolkitId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("toolkitId", toolkitId);

      const res = await fetch("/api/admin/toolkit-assets/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      showToast(`Uploaded ${data.fileName} successfully!`);
      // Update local state
      setRows((prev) =>
        prev.map((r) => (r.toolkitId === toolkitId ? { ...r, asset: data } : r))
      );
    } catch (err: any) {
      showToast(err.message || "Upload failed", false);
    } finally {
      setUploading(null);
      // Reset input
      if (fileInputRefs.current[toolkitId]) {
        fileInputRefs.current[toolkitId]!.value = "";
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl text-sm font-bold transition-all ${
            toast.ok ? "bg-emerald-500 text-slate-950" : "bg-red-500 text-white"
          }`}
        >
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Toolkit Digital Downloads</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Upload downloadable files for each toolkit. Users receive instant access after purchase.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3 backdrop-blur-sm shadow-md">
        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-300 leading-relaxed">
          Files are stored securely under Cloudinary <code className="bg-blue-500/20 px-1 rounded">toolkit-downloads/</code>.
          Each new upload <strong className="text-white">replaces</strong> the active download file for that toolkit.
        </div>
      </div>

      {/* Toolkit rows */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.toolkitId}
              className="bg-slate-800/60 rounded-2xl border border-white/8 shadow-xl overflow-hidden backdrop-blur-sm"
            >
              <div className="p-5 flex items-start gap-4">
                {/* Emoji + info */}
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-2xl shrink-0">
                  {row.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-white text-sm">{row.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    ${row.price} · ID: <code className="bg-slate-900 border border-white/5 px-1.5 py-0.5 rounded text-amber-300 font-mono">{row.toolkitId}</code>
                  </div>

                  {/* Current file */}
                  {row.asset ? (
                    <div className="mt-3 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-emerald-300 truncate">{row.asset.fileName}</p>
                        <p className="text-[10px] text-emerald-400/80 mt-0.5">
                          {fmtSize(row.asset.fileSize)} · Updated {new Date(row.asset.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={`/api/download/toolkit/${row.toolkitId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-emerald-200 underline shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" /> Preview
                      </a>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
                      <FileIcon className="w-4 h-4 text-amber-400 shrink-0" />
                      <p className="text-xs text-amber-300 font-semibold">
                        No file uploaded yet — users cannot download after purchase.
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload button */}
                <div className="shrink-0 flex items-center gap-2">
                  <input
                    ref={(el) => {
                      fileInputRefs.current[row.toolkitId] = el;
                    }}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileChange(row.toolkitId, e)}
                  />
                  <button
                    disabled={uploading === row.toolkitId}
                    onClick={() => fileInputRefs.current[row.toolkitId]?.click()}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md ${
                      uploading === row.toolkitId
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-[#f0c040] hover:bg-amber-400 text-slate-950 shadow-amber-400/20"
                    }`}
                  >
                    {uploading === row.toolkitId ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        {row.asset ? "Replace File" : "Upload File"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
