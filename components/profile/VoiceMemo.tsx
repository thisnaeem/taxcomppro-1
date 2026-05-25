"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Mic, Square, Play, Pause, Trash2, Upload, Loader2, Volume2 } from "lucide-react";

const MAX_SECONDS = 4 * 60; // 4 minutes

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ── Public Player (read-only) ─────────────────────────────────────────────────
export function VoiceMemoPlayer({ url, name }: { url: string; name?: string }) {
  const audioRef  = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]   = useState(false);
  const [current, setCurrent]   = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded,  setLoaded]    = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime  = () => setCurrent(el.currentTime);
    const onMeta  = () => { setDuration(el.duration); setLoaded(true); };
    const onEnd   = () => setPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnd);
    return () => { el.removeEventListener("timeupdate", onTime); el.removeEventListener("loadedmetadata", onMeta); el.removeEventListener("ended", onEnd); };
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else         { el.play();  setPlaying(true); }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Number(e.target.value);
    setCurrent(el.currentTime);
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-[#0a1628]/8 to-[#1a3a6b]/8 border border-[#0a1628]/12 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="w-3.5 h-3.5 text-[#0a1628]/50" />
        <p className="text-[10px] font-black uppercase tracking-widest text-[#0a1628]/50">Voice Intro</p>
        {name && <p className="text-[10px] text-slate-400 ml-auto">{name}</p>}
      </div>

      <audio ref={audioRef} src={url} preload="metadata" />

      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          disabled={!loaded}
          className="w-10 h-10 rounded-full bg-[#0a1628] text-white flex items-center justify-center shrink-0 hover:bg-[#1a3a6b] transition-all disabled:opacity-40 shadow-md"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="flex-1 space-y-1">
          <div className="relative h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-[#0a1628] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={current}
              onChange={seek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>{formatTime(current)}</span>
            <span>{loaded ? formatTime(duration) : "--:--"}</span>
          </div>
        </div>
      </div>

      {/* Animated waveform bars while playing */}
      {playing && (
        <div className="flex items-end justify-center gap-0.5 mt-3 h-5">
          {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.3, 0.7, 1, 0.6, 0.4].map((h, i) => (
            <span
              key={i}
              className="w-1 bg-[#0a1628]/40 rounded-full animate-pulse"
              style={{ height: `${h * 18}px`, animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Editor (record + upload + delete) ────────────────────────────────────────
interface EditorProps {
  currentUrl: string | null;
  onSaved: (url: string | null) => void;
}

export function VoiceMemoEditor({ currentUrl, onSaved }: EditorProps) {
  const [memoUrl,    setMemoUrl]    = useState<string | null>(currentUrl);
  const [recording,  setRecording]  = useState(false);
  const [elapsed,    setElapsed]    = useState(0);
  const [uploading,  setUploading]  = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [error,      setError]      = useState("");
  const [blobUrl,    setBlobUrl]    = useState<string | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const mediaRef    = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef     = useRef<Blob | null>(null);
  const previewRef  = useRef<HTMLAudioElement>(null);

  const startRecording = useCallback(async () => {
    setError("");
    setBlobUrl(null);
    blobRef.current = null;
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
      return;
    }

    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRef.current = mr;
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      blobRef.current = blob;
      setBlobUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach(t => t.stop());
    };
    mr.start(250);
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(p => {
        if (p + 1 >= MAX_SECONDS) {
          stopRecording();
          return MAX_SECONDS;
        }
        return p + 1;
      });
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRef.current && mediaRef.current.state !== "inactive") mediaRef.current.stop();
    setRecording(false);
  }, []);

  // Auto-stop at 4 min
  useEffect(() => {
    if (elapsed >= MAX_SECONDS) stopRecording();
  }, [elapsed, stopRecording]);

  const uploadBlob = async () => {
    if (!blobRef.current) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", blobRef.current, "voice-memo.webm");
      const res  = await fetch("/api/user/voice-memo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Upload failed"); return; }
      setMemoUrl(data.url);
      setBlobUrl(null);
      blobRef.current = null;
      onSaved(data.url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const deleteMemo = async () => {
    setDeleting(true);
    setError("");
    try {
      await fetch("/api/user/voice-memo", { method: "DELETE" });
      setMemoUrl(null);
      onSaved(null);
    } catch {
      setError("Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const togglePreview = () => {
    const el = previewRef.current;
    if (!el) return;
    if (previewPlaying) { el.pause(); setPreviewPlaying(false); }
    else                { el.play();  setPreviewPlaying(true); }
  };

  const timeLeft = MAX_SECONDS - elapsed;

  return (
    <div className="space-y-4">
      {/* Existing saved memo */}
      {memoUrl && !blobUrl && (
        <div className="space-y-2">
          <VoiceMemoPlayer url={memoUrl} />
          <button
            onClick={deleteMemo}
            disabled={deleting}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-semibold transition-colors"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {deleting ? "Removing…" : "Remove voice memo"}
          </button>
        </div>
      )}

      {/* Preview recorded blob before uploading */}
      {blobUrl && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">Preview Recording</p>
          <audio ref={previewRef} src={blobUrl} onEnded={() => setPreviewPlaying(false)} />
          <div className="flex items-center gap-3">
            <button onClick={togglePreview} className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-500 transition-all shadow">
              {previewPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <div className="flex-1">
              <p className="text-xs text-violet-600 font-semibold">Recording ready · {formatTime(elapsed)}</p>
              <p className="text-[10px] text-violet-400">Review and save or re-record</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={uploadBlob}
              disabled={uploading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Saving…" : "Save to Profile"}
            </button>
            <button
              onClick={() => { setBlobUrl(null); blobRef.current = null; setElapsed(0); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-violet-200 text-violet-600 text-xs font-semibold hover:bg-violet-50 transition-all"
            >
              Re-record
            </button>
          </div>
        </div>
      )}

      {/* Record button */}
      {!blobUrl && (
        <div className="flex items-center gap-3">
          {!recording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0a1628] hover:bg-[#1a3a6b] text-white text-sm font-bold transition-all shadow"
            >
              <Mic className="w-4 h-4" />
              {memoUrl ? "Re-record Memo" : "Record Voice Memo"}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all shadow animate-pulse"
              >
                <Square className="w-4 h-4 fill-current" /> Stop
              </button>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-bold text-red-600 tabular-nums">{formatTime(elapsed)}</span>
                <span className="text-xs text-slate-400">/ {formatTime(MAX_SECONDS)} max</span>
              </div>
              {timeLeft <= 30 && (
                <span className="text-xs font-bold text-amber-600">{timeLeft}s left!</span>
              )}
            </div>
          )}
          <p className="text-xs text-slate-400">Max 4 minutes · plays on your public profile</p>
        </div>
      )}

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
