"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, Plus, Trash2, GraduationCap } from "lucide-react";

const inp = "w-full font-[inherit] text-sm px-3.5 py-2.5 border border-white/10 rounded-xl outline-none focus:border-[#d4a017] bg-white/5 text-white placeholder-white/30";
const lbl = "block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5";

interface Version {
  id: string; versionLabel: string; videoId: string | null; videoUrl: string | null; videoDurationSeconds: number;
  passingScore: number; questionsToShow: number; maxAttempts: number; acknowledgmentText: string;
}
interface Question { id: string; question: string; options: string[]; correctIndex: number; explanation: string | null; order: number; }

export default function AdminTrainingPage() {
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState<Version | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const d = await fetch("/api/admin/training?toolkitId=irs-fine-defense").then(r => r.json()) as { version: Version; questions: Question[] };
    setVersion(d.version); setQuestions(d.questions);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveVersion = async () => {
    if (!version) return;
    setSaving(true);
    await fetch("/api/admin/training", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId: version.id, ...version }),
    });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const saveQuestion = async (q: Question) => {
    await fetch(`/api/admin/training/questions/${q.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation }),
    });
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/admin/training/questions/${id}`, { method: "DELETE" });
    await load();
  };

  const addQuestion = async () => {
    if (!version) return;
    await fetch("/api/admin/training/questions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId: version.id, question: "New question", options: ["Option A", "Option B", "Option C", "Option D"], correctIndex: 0 }),
    });
    await load();
  };

  if (loading || !version) return <div className="flex items-center justify-center h-64"><Loader2 className="w-7 h-7 animate-spin text-white/40" /></div>;

  return (
    <div className="max-w-4xl mx-auto text-white pb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#d4a017]/20 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-[#d4a017]" /></div>
        <div><h1 className="text-2xl font-black text-white">Staff Training — IRS Fine Defense Toolkit</h1><p className="text-sm text-slate-400 mt-0.5">Manage the video, settings, and question bank for the active training version.</p></div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 space-y-4">
        <h2 className="font-black text-sm uppercase tracking-widest text-white/60">Version Settings</h2>
        <div><label className={lbl}>Version Label</label><input value={version.versionLabel} onChange={e => setVersion(v => v && { ...v, versionLabel: e.target.value })} className={inp} /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={lbl}>YouTube Video ID</label><input value={version.videoId ?? ""} onChange={e => setVersion(v => v && { ...v, videoId: e.target.value })} placeholder="e.g. dQw4w9WgXcQ" className={inp} /></div>
          <div><label className={lbl}>Video Duration (seconds)</label><input type="number" value={version.videoDurationSeconds} onChange={e => setVersion(v => v && { ...v, videoDurationSeconds: Number(e.target.value) })} className={inp} /></div>
        </div>
        <p className="text-[11px] text-white/30">Set the video as Unlisted on YouTube (not Public) so it's only reachable by direct link. Duration must be set accurately — it drives the 90%-watched completion rule.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <div><label className={lbl}>Passing Score %</label><input type="number" value={version.passingScore} onChange={e => setVersion(v => v && { ...v, passingScore: Number(e.target.value) })} className={inp} /></div>
          <div><label className={lbl}>Questions Shown</label><input type="number" value={version.questionsToShow} onChange={e => setVersion(v => v && { ...v, questionsToShow: Number(e.target.value) })} className={inp} /></div>
          <div><label className={lbl}>Max Attempts</label><input type="number" value={version.maxAttempts} onChange={e => setVersion(v => v && { ...v, maxAttempts: Number(e.target.value) })} className={inp} /></div>
        </div>
        <div><label className={lbl}>Acknowledgment Statements (one per line)</label><textarea value={version.acknowledgmentText} onChange={e => setVersion(v => v && { ...v, acknowledgmentText: e.target.value })} rows={4} className={`${inp} resize-none`} /></div>
        <button onClick={saveVersion} disabled={saving} className="flex items-center gap-2 bg-[#d4a017] text-[#0a1628] font-bold text-sm px-5 py-2.5 rounded-full disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saved ? "Saved!" : "Save Version Settings"}
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-sm uppercase tracking-widest text-white/60">Question Bank ({questions.length})</h2>
          <button onClick={addQuestion} className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg"><Plus className="w-3.5 h-3.5" />Add Question</button>
        </div>
        <p className="text-[11px] text-white/30 mb-4">These 30 questions are placeholders — replace the text and answer key below with the real due-diligence assessment before inviting real staff.</p>
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <div key={q.id} className="border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-black text-white/30 mt-2">#{qi + 1}</span>
                <textarea value={q.question} onChange={e => setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, question: e.target.value } : x))}
                  onBlur={() => saveQuestion(q)} rows={2} className={`${inp} flex-1 resize-none`} />
                <button onClick={() => deleteQuestion(q.id)} className="text-white/30 hover:text-red-400 mt-2"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {q.options.map((opt, oi) => (
                  <label key={oi} className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-lg border ${q.correctIndex === oi ? "border-emerald-400/60 bg-emerald-400/10" : "border-white/10"}`}>
                    <input type="radio" checked={q.correctIndex === oi} onChange={() => { setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, correctIndex: oi } : x)); saveQuestion({ ...q, correctIndex: oi }); }} />
                    <input value={opt} onChange={e => setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, options: x.options.map((o, j) => j === oi ? e.target.value : o) } : x))}
                      onBlur={() => saveQuestion(q)} className="flex-1 bg-transparent outline-none" />
                  </label>
                ))}
              </div>
              <input value={q.explanation ?? ""} onChange={e => setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, explanation: e.target.value } : x))}
                onBlur={() => saveQuestion(q)} placeholder="Explanation / playbook section shown if missed" className={`${inp} text-xs`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
