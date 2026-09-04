"use client";

import { useState, useRef, useEffect } from "react";
import { X, UploadCloud, Loader2, Image as ImageIcon, Trash2, Check, AlertCircle, Sparkles } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";

interface CoverPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoverUrl: string | null;
  userAvatarUrl?: string | null;
  userName?: string | null;
  onCoverUpdated: (newUrl: string | null) => void;
}

export default function CoverPhotoModal({
  isOpen,
  onClose,
  currentCoverUrl,
  userAvatarUrl,
  userName,
  onCoverUpdated,
}: CoverPhotoModalProps) {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Clean up object URL when file changes or modal closes
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setErrorMsg(null);
      setUploading(false);
      setRemoving(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !uploading && !removing) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, uploading, removing, onClose]);

  if (!isOpen) return null;

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Please select a valid image file (JPEG, PNG, or WebP).");
      return;
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg("Image size exceeds 5MB. Please choose a smaller image.");
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setErrorMsg(null);

    try {
      const fd = new FormData();
      fd.append("files", selectedFile);
      fd.append("type", "cover");

      const uploadRes = await fetch("/api/upload/profile", {
        method: "POST",
        body: fd,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload image. Please try again.");
      }

      const { urls } = (await uploadRes.json()) as { urls: string[] };
      const newCoverUrl = urls[0];

      if (!newCoverUrl) {
        throw new Error("Did not receive uploaded image URL.");
      }

      // Update user profile in database
      const patchRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: newCoverUrl }),
      });

      if (!patchRes.ok) {
        throw new Error("Failed to update profile cover in database.");
      }

      // Update Redux state
      if (authUser) {
        dispatch(setUser({ ...authUser, coverImage: newCoverUrl }));
      }

      // Notify parent component
      onCoverUpdated(newCoverUrl);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!confirm("Are you sure you want to remove your cover photo?")) return;
    setRemoving(true);
    setErrorMsg(null);

    try {
      const patchRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: null }),
      });

      if (!patchRes.ok) {
        throw new Error("Failed to remove cover photo.");
      }

      if (authUser) {
        dispatch(setUser({ ...authUser, coverImage: null }));
      }

      onCoverUpdated(null);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to remove cover photo.");
    } finally {
      setRemoving(false);
    }
  };

  const activeDisplayUrl = previewUrl || currentCoverUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={() => {
        if (!uploading && !removing) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#111c2e] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-[#0a1628] dark:text-white flex items-center gap-2">
              <span>Cover Photo</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Personalize your profile banner with a professional cover image
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={uploading || removing}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Recommended Dimensions Banner Notice */}
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs flex-1">
              <div className="font-bold text-[#0a1628] dark:text-amber-200 flex items-center gap-2">
                <span>Recommended Cover Size</span>
                <span className="bg-amber-200/80 dark:bg-amber-800/60 text-amber-900 dark:text-amber-200 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                  1400 × 400 px
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                Aspect ratio <span className="font-bold">3.5:1</span> (minimum 1200 × 350 px) • Max file size <span className="font-bold">5 MB</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Formats: <strong className="text-slate-700 dark:text-slate-300">JPEG, PNG, WebP</strong>. Keep important text and logos centered, as your avatar overlays the bottom-left.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Interactive Cover Preview with Silhouette */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>{selectedFile ? "New Cover Preview" : "Current Banner View"}</span>
              {selectedFile && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Ready to save
                </span>
              )}
            </div>

            <div className="relative w-full h-36 sm:h-44 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 shadow-inner">
              {activeDisplayUrl ? (
                <img
                  src={activeDisplayUrl}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-800/50">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                  <span className="text-xs font-semibold">No cover photo set</span>
                </div>
              )}

              {/* Simulated avatar overlay showing actual placement */}
              <div className="absolute bottom-2 left-3 flex items-end gap-2 pointer-events-none">
                <div className="w-12 h-12 rounded-xl bg-[#0a1628] border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center overflow-hidden">
                  {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xs">
                      {userName?.[0]?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md mb-1 hidden sm:block">
                  Avatar overlay zone
                </div>
              </div>

              {/* Change/Clear badge on preview */}
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="absolute top-2.5 right-2.5 bg-black/70 hover:bg-black/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs transition-all flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Cancel selection
                </button>
              )}
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-[#f0c040] bg-[#f0c040]/10 scale-[1.01]"
                : "border-slate-300 dark:border-slate-700 hover:border-[#1a3a6b] dark:hover:border-slate-500 bg-slate-50/50 dark:bg-slate-800/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>

              <div className="text-xs">
                <span className="font-bold text-[#0a1628] dark:text-white">Click to browse</span> or drag and drop image here
              </div>

              <div className="text-[11px] text-slate-400">
                1400 × 400 recommended • PNG, JPG, or WebP up to 5MB
              </div>

              {selectedFile && (
                <div className="mt-1 px-3 py-1 bg-white dark:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-xs">
                  {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-3">
          {/* Remove cover button */}
          {currentCoverUrl && !selectedFile ? (
            <button
              type="button"
              onClick={handleRemoveCover}
              disabled={removing || uploading}
              className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Remove Photo</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading || removing}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!selectedFile || uploading || removing}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0a1628] hover:bg-[#1a3a6b] text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading Cover…</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Save Cover</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
