"use client";

import { useState, useEffect } from "react";
import { Loader2, X, Trash2, Calendar, Clock, Video, Mic, Globe, Lock, Check } from "lucide-react";
import { PRO_TALK_CATEGORIES } from "@/lib/proTalks";

interface SpaceData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  mediaType: string;
  visibility?: "PUBLIC" | "PRIVATE" | string;
  scheduledAt: string | null;
}

interface EditTalkDialogProps {
  space: SpaceData;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: any) => void;
  onCancelled: (spaceId: string) => void;
}

export default function EditTalkDialog({
  space,
  isOpen,
  onClose,
  onSaved,
  onCancelled,
}: EditTalkDialogProps) {
  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description || "");
  const [category, setCategory] = useState(space.category || "Open Discussion");
  const [mediaType, setMediaType] = useState<"AUDIO_VIDEO" | "AUDIO">(
    space.mediaType === "AUDIO" ? "AUDIO" : "AUDIO_VIDEO"
  );
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(
    space.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC"
  );
  const [scheduledAt, setScheduledAt] = useState(() => {
    if (!space.scheduledAt) return "";
    const d = new Date(space.scheduledAt);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(space.name);
      setDescription(space.description || "");
      setCategory(space.category || "Open Discussion");
      setMediaType(space.mediaType === "AUDIO" ? "AUDIO" : "AUDIO_VIDEO");
      setVisibility(space.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC");
      if (space.scheduledAt) {
        const d = new Date(space.scheduledAt);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setScheduledAt(d.toISOString().slice(0, 16));
      } else {
        setScheduledAt("");
      }
      setConfirmCancel(false);
      setError(null);
    }
  }, [isOpen, space]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        description: description.trim() || null,
        category,
        mediaType,
        visibility,
      };

      if (scheduledAt) {
        payload.scheduledAt = new Date(scheduledAt).toISOString();
      }

      const res = await fetch(`/api/spaces/${space.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update talk.");
        return;
      }

      onSaved(data);
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelTalk = async () => {
    if (cancelling) return;
    setCancelling(true);
    setError(null);

    try {
      const res = await fetch(`/api/spaces/${space.id}?action=cancel`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to cancel talk.");
        setCancelling(false);
        return;
      }

      onCancelled(space.id);
      onClose();
    } catch {
      setError("Network error while cancelling talk.");
      setCancelling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-gradient-to-b from-[#0a192f] via-[#071324] to-[#040c18] border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Calendar className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-white text-lg font-black tracking-tight">Edit Scheduled Pro Talk</h2>
              <p className="text-slate-400 text-xs">Update your stage details or cancel this session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form body */}
        <form onSubmit={handleSave} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Title */}
          <div>
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">
              Talk Title <span className="text-lime-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Navigating ERC Audits & Appeals"
              maxLength={120}
              required
              className="w-full px-4 py-3 rounded-2xl bg-[#040e1c] border border-emerald-500/30 focus:border-lime-400 text-white text-sm outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">
              Description / Agenda
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What will you cover in this session?"
              rows={3}
              maxLength={600}
              className="w-full px-4 py-3 rounded-2xl bg-[#040e1c] border border-emerald-500/30 focus:border-lime-400 text-white text-sm outline-none transition-all placeholder:text-slate-500 resize-none"
            />
          </div>

          {/* Category & Media Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl bg-[#040e1c] border border-emerald-500/30 focus:border-lime-400 text-white text-sm outline-none transition-all"
              >
                {PRO_TALK_CATEGORIES.map(c => (
                  <option key={c.id} value={c.name} className="bg-[#071324] text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                Media Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMediaType("AUDIO_VIDEO")}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                    mediaType === "AUDIO_VIDEO"
                      ? "bg-emerald-500/20 border-lime-400 text-lime-300"
                      : "bg-[#040e1c] border-emerald-500/20 text-slate-400 hover:text-white"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" /> Video + Audio
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType("AUDIO")}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                    mediaType === "AUDIO"
                      ? "bg-emerald-500/20 border-lime-400 text-lime-300"
                      : "bg-[#040e1c] border-emerald-500/20 text-slate-400 hover:text-white"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" /> Audio Only
                </button>
              </div>
            </div>
          </div>

          {/* Scheduled Date & Time */}
          <div>
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">
              Scheduled Date &amp; Time
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#040e1c] border border-emerald-500/30 focus:border-lime-400 text-white text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">
              Audience Access
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setVisibility("PUBLIC")}
                className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all ${
                  visibility === "PUBLIC"
                    ? "bg-emerald-500/20 border-lime-400 text-white shadow-sm"
                    : "bg-[#040e1c] border-emerald-500/20 text-slate-400 hover:text-white"
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Public Talk</div>
                  <div className="text-[10px] text-slate-400">Discoverable on landing</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility("PRIVATE")}
                className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all ${
                  visibility === "PRIVATE"
                    ? "bg-purple-500/20 border-purple-400 text-white shadow-sm"
                    : "bg-[#040e1c] border-emerald-500/20 text-slate-400 hover:text-white"
                }`}
              >
                <Lock className="w-4 h-4 text-purple-300 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Private / Invite Only</div>
                  <div className="text-[10px] text-slate-400">Direct invite link only</div>
                </div>
              </button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            {confirmCancel ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCancelTalk}
                  disabled={cancelling}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-lg shadow-red-600/30 transition-all"
                >
                  {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Confirm Cancel Talk
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold"
                >
                  Keep Talk
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-bold transition-colors py-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Cancel Scheduled Talk
              </button>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-lime-400 to-emerald-500 hover:from-lime-300 hover:to-emerald-400 text-[#060e1a] text-xs font-black shadow-md shadow-emerald-500/25 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
