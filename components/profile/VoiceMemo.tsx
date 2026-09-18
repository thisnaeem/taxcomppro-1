"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Mic, Square, Play, Pause, Trash2, Upload, Loader2, Volume2 } from "lucide-react";

const MAX_SECONDS = 4 * 60; // 4 minutes

function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ── Public Player (read-only) ─────────────────────────────────────────────────
const BAR_COUNT = 56;

/** Deterministic fallback shape so the waveform never looks empty. */
function seededBars(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const noise = ((h >>> 0) % 1000) / 1000;
    const envelope = 0.55 + 0.45 * Math.sin((i / BAR_COUNT) * Math.PI);
    return Math.max(0.12, envelope * (0.35 + noise * 0.65));
  });
}

/** Decode the audio once to get real peaks and a reliable duration (webm recordings report Infinity). */
async function analyse(url: string, signal: AbortSignal) {
  const buf = await fetch(url, { signal }).then(r => r.arrayBuffer());
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  try {
    const audio = await ctx.decodeAudioData(buf);
    const data = audio.getChannelData(0);
    const block = Math.floor(data.length / BAR_COUNT) || 1;
    const peaks = Array.from({ length: BAR_COUNT }, (_, i) => {
      let max = 0;
      for (let j = i * block; j < (i + 1) * block && j < data.length; j += 16) max = Math.max(max, Math.abs(data[j]));
      return max;
    });
    const top = Math.max(...peaks) || 1;
    return { duration: audio.duration, bars: peaks.map(p => Math.max(0.1, p / top)) };
  } finally {
    void ctx.close();
  }
}

export function VoiceMemoPlayer({ url, name }: { url: string; name?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveRef  = useRef<HTMLDivElement>(null);
  const [playing, setPlaying]   = useState(false);
  const [current, setCurrent]   = useState(0);
  const [duration, setDuration] = useState(0);
  const [bars, setBars]         = useState<number[]>(() => seededBars(url));

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const useDuration = () => { if (Number.isFinite(el.duration) && el.duration > 0) setDuration(el.duration); };
    const onTime = () => setCurrent(el.currentTime);
    const onEnd  = () => { setPlaying(false); setCurrent(0); };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", useDuration);
    el.addEventListener("durationchange", useDuration);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", useDuration);
      el.removeEventListener("durationchange", useDuration);
      el.removeEventListener("ended", onEnd);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    analyse(url, controller.signal)
      .then(r => { if (!controller.signal.aborted) { setBars(r.bars); if (r.duration > 0) setDuration(r.duration); } })
      .catch(() => {});
    return () => controller.abort();
  }, [url]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  };

  const seekTo = (fraction: number) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    el.currentTime = Math.min(Math.max(fraction, 0), 1) * duration;
    setCurrent(el.currentTime);
  };

  const onWavePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.type === "pointermove" && e.buttons !== 1) return;
    const rect = waveRef.current?.getBoundingClientRect();
    if (rect) seekTo((e.clientX - rect.left) / rect.width);
  };

  const onWaveKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!duration) return;
    if (e.key === "ArrowRight") { e.preventDefault(); seekTo((current + 5) / duration); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); seekTo((current - 5) / duration); }
  };

  const progress = duration > 0 ? current / duration : 0;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700/70 bg-slate-50 dark:bg-[#0f1a2e] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="w-3.5 h-3.5 text-amber-500" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">Voice Intro</p>
        {name && <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 ml-auto truncate">{name}</p>}
      </div>

      <audio ref={audioRef} src={url} preload="metadata" />

      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          aria-label={playing ? "Pause voice intro" : "Play voice intro"}
          className="w-12 h-12 rounded-full bg-[#ffbe24] text-[#0a1628] flex items-center justify-center shrink-0 hover:brightness-105 active:scale-95 transition-all shadow-[0_6px_20px_-6px_rgba(255,190,36,0.7)]"
        >
          {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
        </button>

        <div className="flex-1 min-w-0">
          <div
            ref={waveRef}
            role="slider"
            tabIndex={0}
            aria-label="Seek voice intro"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(current)}
            aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
            onPointerDown={onWavePointer}
            onPointerMove={onWavePointer}
            onKeyDown={onWaveKey}
            className="flex items-center gap-[3px] h-12 cursor-pointer select-none touch-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 rounded"
          >
            {bars.map((h, i) => {
              const played = (i + 0.5) / bars.length <= progress;
              return (
                <span
                  key={i}
                  className={`flex-1 min-w-[2px] rounded-full transition-colors duration-150 ${played ? "bg-[#ffbe24]" : "bg-slate-300 dark:bg-slate-600/70"}`}
                  style={{ height: `${Math.round(h * 100)}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-300">
            <span>{formatTime(current)}</span>
            <span>{duration ? formatTime(duration) : "--:--"}</span>
          </div>
        </div>
      </div>
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
