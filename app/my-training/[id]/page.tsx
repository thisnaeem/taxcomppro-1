"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2, GraduationCap, PlayCircle, CheckCircle2, AlertTriangle, Award,
  Download, ArrowRight, ArrowLeft,
} from "lucide-react";
import { STATUS_COLORS } from "@/lib/training";

// Minimal YouTube IFrame API typings (no @types/youtube dependency needed).
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement | string, opts: Record<string, unknown>) => YTPlayer; PlayerState: { PLAYING: number } };
    onYouTubeIframeAPIReady?: () => void;
  }
}
interface YTPlayer { getCurrentTime(): number; seekTo(s: number, allow: boolean): void; getPlayerState(): number; }

interface Detail {
  id: string; toolkitName: string; officeName: string | null; status: string; statusLabel: string;
  version: {
    id: string; versionLabel: string; videoProvider: string; videoId: string | null; videoUrl: string | null;
    videoDurationSeconds: number; passingScore: number; questionsToShow: number; maxAttempts: number; acknowledgmentText: string;
  };
  videoFurthestSeconds: number; videoCompletedAt: string | null;
  attempts: { attemptNumber: number; score: number; passed: boolean; submittedAt: string | null }[];
  acknowledgment: { signedAt: string; signatureName: string } | null;
  certificate: { certificateNumber: string; issuedAt: string } | null;
}
interface Question { id: string; question: string; options: string[]; }

function loadYouTubeApi(): Promise<void> {
  return new Promise(resolve => {
    if (window.YT?.Player) return resolve();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  });
}

function VideoStep({ detail, onVideoComplete }: { detail: Detail; onVideoComplete: () => void }) {
  const playerRef = useRef<YTPlayer | null>(null);
  const furthestRef = useRef(detail.videoFurthestSeconds);
  const lastSentRef = useRef(0);
  const [furthest, setFurthest] = useState(detail.videoFurthestSeconds);
  const duration = detail.version.videoDurationSeconds;

  const sendProgress = useCallback(async (seconds: number) => {
    const res = await fetch(`/api/training/my/${detail.id}/progress`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ furthestSeconds: seconds }),
    });
    if (res.ok) {
      const d = await res.json() as { videoComplete: boolean };
      if (d.videoComplete) onVideoComplete();
    }
  }, [detail.id, onVideoComplete]);

  useEffect(() => {
    if (!detail.version.videoId || duration === 0) return;
    let interval: ReturnType<typeof setInterval>;
    loadYouTubeApi().then(() => {
      playerRef.current = new window.YT!.Player(`yt-player-${detail.id}`, {
        videoId: detail.version.videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
      });
      interval = setInterval(() => {
        const p = playerRef.current;
        if (!p || typeof p.getCurrentTime !== "function") return;
        const current = p.getCurrentTime();
        if (current > furthestRef.current + 5) {
          // Discourage skipping ahead of the furthest legitimately-watched point.
          p.seekTo(furthestRef.current, true);
          return;
        }
        if (current > furthestRef.current) {
          furthestRef.current = current;
          setFurthest(current);
          if (current - lastSentRef.current > 4) {
            lastSentRef.current = current;
            sendProgress(current);
          }
        }
      }, 2000);
    });
    return () => { if (interval) clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.id, detail.version.videoId]);

  useEffect(() => () => { if (furthestRef.current > lastSentRef.current) sendProgress(furthestRef.current); }, [sendProgress]);

  const pct = duration > 0 ? Math.min(100, Math.round((furthest / duration) * 100)) : 0;

  if (!detail.version.videoId || duration === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
        <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-3" />
        <p className="font-black text-[#0a1628] mb-1">Training video coming soon</p>
        <p className="text-sm text-slate-500 mb-5">Your administrator hasn&apos;t uploaded the training video yet. You can continue for now — the assessment is available below.</p>
        <button onClick={() => sendProgress(1).then(onVideoComplete)}
          className="bg-[#0a1628] text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-[#1a3a6b] transition-all">
          Continue to Assessment
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="aspect-video rounded-xl overflow-hidden bg-black mb-3">
        <div id={`yt-player-${detail.id}`} className="w-full h-full" />
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-[#0a1628] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400">
        {pct}% watched — you need at least 90% to unlock the assessment. Rewinding is fine; skipping ahead is restricted.
      </p>
    </div>
  );
}

function AssessmentStep({ detail, onPassed, onFailed }: { detail: Detail; onPassed: (score: number) => void; onFailed: () => void }) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ score: number; passed: boolean; attemptsRemaining: number; missed: { question: string; explanation: string }[] } | null>(null);

  const start = async () => {
    setError(""); setLoading(true); setResult(null);
    try {
      const res = await fetch(`/api/training/my/${detail.id}/assessment/start`, { method: "POST" });
      const data = await res.json() as { attemptId?: string; questions?: Question[]; error?: string };
      if (!res.ok) { setError(data.error || "Could not start the assessment."); return; }
      setAttemptId(data.attemptId!); setQuestions(data.questions!); setAnswers({});
    } finally { setLoading(false); }
  };

  const submit = async () => {
    if (!questions || !attemptId) return;
    setLoading(true); setError("");
    try {
      const orderedAnswers = questions.map(q => answers[q.id] ?? -1);
      const res = await fetch(`/api/training/my/${detail.id}/assessment/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attemptId, answers: orderedAnswers }),
      });
      const data = await res.json() as { score: number; passed: boolean; attemptsRemaining: number; missed: { question: string; explanation: string }[]; error?: string };
      if (!res.ok) { setError((data as { error?: string }).error || "Could not submit."); return; }
      setResult(data);
      setQuestions(null);
      if (data.passed) onPassed(data.score); else onFailed();
    } finally { setLoading(false); }
  };

  if (result) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
        {result.passed ? <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" /> : <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />}
        <p className="font-black text-[#0a1628] text-lg">{result.score}%</p>
        <p className="text-sm text-slate-500 mb-4">{result.passed ? "You passed! Continue to the acknowledgment below." : `Passing score is ${detail.version.passingScore}%. ${result.attemptsRemaining > 0 ? `You have ${result.attemptsRemaining} attempt(s) left.` : "You've used all your attempts — contact your ERO."}`}</p>
        {!result.passed && result.missed.length > 0 && (
          <div className="text-left bg-slate-50 rounded-xl p-4 space-y-2 mb-4 max-h-64 overflow-y-auto">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Review These Topics</p>
            {result.missed.map((m, i) => (
              <div key={i} className="text-xs">
                <p className="font-bold text-[#0a1628]">{m.question}</p>
                <p className="text-slate-500">{m.explanation}</p>
              </div>
            ))}
          </div>
        )}
        {!result.passed && result.attemptsRemaining > 0 && (
          <button onClick={start} disabled={loading} className="bg-[#0a1628] text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-[#1a3a6b] transition-all disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Retake Assessment"}
          </button>
        )}
      </div>
    );
  }

  if (!questions) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
        <p className="font-black text-[#0a1628] mb-1">Final Assessment</p>
        <p className="text-sm text-slate-500 mb-5">{detail.version.questionsToShow} randomly-selected questions • {detail.version.passingScore}% to pass • {detail.version.maxAttempts} attempts allowed</p>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}
        <button onClick={start} disabled={loading} className="bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-bold text-sm px-6 py-3 rounded-full hover:shadow-lg transition-all disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Start Assessment"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}
      <div className="space-y-5 mb-5">
        {questions.map((q, qi) => (
          <div key={q.id}>
            <p className="text-sm font-bold text-[#0a1628] mb-2">{qi + 1}. {q.question}</p>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => (
                <label key={oi} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border cursor-pointer ${answers[q.id] === oi ? "border-[#0a1628] bg-[#0a1628]/5" : "border-slate-200"}`}>
                  <input type="radio" name={q.id} checked={answers[q.id] === oi} onChange={() => setAnswers(a => ({ ...a, [q.id]: oi }))} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={submit} disabled={loading || Object.keys(answers).length < questions.length}
        className="w-full bg-[#0a1628] text-white font-bold text-sm py-3 rounded-full hover:bg-[#1a3a6b] transition-all disabled:opacity-40">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit Assessment"}
      </button>
    </div>
  );
}

function AcknowledgmentStep({ detail, onSigned }: { detail: Detail; onSigned: () => void }) {
  const statements = detail.version.acknowledgmentText.split("\n").filter(Boolean);
  const [checked, setChecked] = useState<boolean[]>(statements.map(() => false));
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (checked.some(c => !c)) return setError("Please check every statement.");
    if (!signature.trim()) return setError("Type your full legal name to sign.");
    setLoading(true);
    try {
      const res = await fetch(`/api/training/my/${detail.id}/acknowledge`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signatureName: signature, agreedAll: true }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error || "Could not save your acknowledgment."); return; }
      onSigned();
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <p className="font-black text-[#0a1628] mb-1">Training Acknowledgment</p>
      <p className="text-sm text-slate-500 mb-4">Check each statement, then type your full legal name as your electronic signature.</p>
      <div className="space-y-3 mb-5">
        {statements.map((s, i) => (
          <label key={i} className="flex items-start gap-2.5 text-sm cursor-pointer">
            <input type="checkbox" checked={checked[i]} onChange={e => setChecked(c => c.map((v, j) => j === i ? e.target.checked : v))} className="mt-1 w-4 h-4 accent-[#0a1628]" />
            <span className="text-slate-600">{s}</span>
          </label>
        ))}
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Type your full legal name to sign</label>
      <input value={signature} onChange={e => setSignature(e.target.value)} placeholder="Jane A. Smith"
        className="w-full text-sm px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 mb-4" />
      <button onClick={submit} disabled={loading} className="w-full bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-bold text-sm py-3 rounded-full hover:shadow-lg transition-all disabled:opacity-50">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Sign & Complete Training"}
      </button>
    </div>
  );
}

function CertificateStep({ detail }: { detail: Detail }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
      <Award className="w-10 h-10 text-amber-500 mx-auto mb-3" />
      <p className="font-black text-[#0a1628] text-lg mb-1">Training Completed!</p>
      <p className="text-sm text-slate-500 mb-1">Certificate No. {detail.certificate?.certificateNumber}</p>
      <p className="text-xs text-slate-400 mb-6">Issued {detail.certificate ? new Date(detail.certificate.issuedAt).toLocaleDateString() : ""}</p>
      <a href={`/api/training/my/${detail.id}/certificate`} className="inline-flex items-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#1a3a6b] transition-all">
        <Download className="w-4 h-4" />Download Certificate
      </a>
    </div>
  );
}

export default function MyTrainingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null | undefined>(undefined);

  const load = useCallback(async () => {
    const res = await fetch(`/api/training/my/${id}`);
    if (!res.ok) { setDetail(null); return; }
    setDetail(await res.json());
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (detail === undefined) return <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb]"><Loader2 className="w-8 h-8 animate-spin text-[#0a1628]" /></div>;
  if (detail === null) return <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb] text-sm text-slate-400">Training assignment not found.</div>;

  const showVideo = !detail.videoCompletedAt && !["PASSED", "TRAINING_COMPLETED", "FAILED_RETAKE_REQUIRED"].includes(detail.status);
  const showAssessment = (detail.videoCompletedAt || detail.status === "FAILED_RETAKE_REQUIRED") && detail.status !== "PASSED" && detail.status !== "TRAINING_COMPLETED";
  const showAcknowledgment = detail.status === "PASSED";
  const showCertificate = detail.status === "TRAINING_COMPLETED";
  const revoked = detail.status === "ACCESS_REVOKED";

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-16">
      <div className="max-w-xl mx-auto px-4 pt-10">
        <Link href="/my-training" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-4"><ArrowLeft className="w-3.5 h-3.5" />All Assigned Training</Link>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#0a1628] flex items-center justify-center"><GraduationCap className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-lg font-black text-[#0a1628]">{detail.toolkitName}</h1>
            <p className="text-xs text-slate-400">{detail.version.versionLabel}</p>
          </div>
        </div>
        <span className={`inline-block mt-2 mb-6 px-2.5 py-1 rounded-full font-bold text-[10px] ${STATUS_COLORS[detail.status] ?? "bg-slate-100 text-slate-600"}`}>{detail.statusLabel}</span>

        {revoked && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-sm text-slate-500">
            Your access to this training has been revoked by your office administrator.
          </div>
        )}

        {!revoked && showVideo && <VideoStep detail={detail} onVideoComplete={load} />}
        {!revoked && !showVideo && showAssessment && (
          <AssessmentStep detail={detail} onPassed={load} onFailed={load} />
        )}
        {!revoked && showAcknowledgment && <AcknowledgmentStep detail={detail} onSigned={load} />}
        {!revoked && showCertificate && <CertificateStep detail={detail} />}
      </div>
    </div>
  );
}
