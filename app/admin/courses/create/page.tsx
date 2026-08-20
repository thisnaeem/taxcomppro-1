"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight,
  Loader2, CheckCircle2, BookOpen, Video, FileText, HelpCircle, GraduationCap,
  Upload, X,
} from "lucide-react";
import RichTextEditor from "@/components/courses/RichTextEditor";

const CATEGORIES = ["Tax Office Startup","Compliance","Accounting","Bookkeeping","Audit","Financial Planning","Business Tax","Payroll"];
type ContentType = "VIDEO" | "TEXT" | "QUIZ";

interface QuizQ { question: string; options: string[]; correctAnswer: number; explanation: string; }
interface LessonDraft {
  id: string; title: string; description: string;
  contentType: ContentType;
  videoUrl: string; textContent: string;
  downloadUrl?: string; downloadName?: string;
  duration: number; isFree: boolean;
  quiz: { title: string; passMark: number; questions: QuizQ[] };
}
interface SectionDraft { id: string; title: string; lessons: LessonDraft[]; }

const uid = () => Math.random().toString(36).slice(2);
const emptyQuiz = () => ({ title: "Lesson Quiz", passMark: 70, questions: [] });
const emptyLesson = (): LessonDraft => ({ id: uid(), title: "", description: "", contentType: "VIDEO", videoUrl: "", textContent: "", downloadUrl: "", downloadName: "", duration: 0, isFree: false, quiz: emptyQuiz() });

const CT_ICONS: Record<ContentType, React.ElementType> = { VIDEO: Video, TEXT: FileText, QUIZ: HelpCircle };
const CT_LABELS: Record<ContentType, string> = { VIDEO: "Video", TEXT: "Article", QUIZ: "Quiz" };

export default function CreateCoursePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(""); const [slug, setSlug] = useState(""); const [description, setDesc] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbUploading, setThumbUploading] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [level, setLevel] = useState("BEGINNER"); const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState(0); const [isSequential, setIsSequential] = useState(true);
  const [sections, setSections] = useState<SectionDraft[]>([]);
  const [openSec, setOpenSec] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [done, setDone] = useState(false);
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([""]);  
  const [requirements, setRequirements]         = useState<string[]>([""]);

  const handleThumbUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setThumbUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      fd.append("folder", "course-thumbnails");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to upload image. Please try a smaller image.");
        return;
      }
      const data = (await res.json()) as { urls?: string[] };
      if (data.urls?.[0]) setThumbnail(data.urls[0]);
    } catch (e) {
      console.error(e);
      alert("An error occurred while uploading the thumbnail.");
    } finally {
      setThumbUploading(false);
    }
  };

  const autoSlug = (t: string) => t.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").slice(0,80);
  const handleTitle = (t: string) => { setTitle(t); if (!slug || slug === autoSlug(title)) setSlug(autoSlug(t)); };
  const addSection = () => { const id = uid(); setSections(p => [...p, { id, title: `Section ${p.length + 1}`, lessons: [] }]); setOpenSec(p => new Set([...p, id])); };
  const rmSection  = (id: string) => setSections(p => p.filter(s => s.id !== id));
  const updSection = (id: string, title: string) => setSections(p => p.map(s => s.id === id ? { ...s, title } : s));
  const addLesson  = (sid: string) => setSections(p => p.map(s => s.id === sid ? { ...s, lessons: [...s.lessons, emptyLesson()] } : s));
  const rmLesson   = (sid: string, lid: string) => setSections(p => p.map(s => s.id === sid ? { ...s, lessons: s.lessons.filter(l => l.id !== lid) } : s));
  const updLesson  = (sid: string, lid: string, field: keyof LessonDraft, val: unknown) =>
    setSections(p => p.map(s => s.id === sid ? { ...s, lessons: s.lessons.map(l => l.id === lid ? { ...l, [field]: val } : l) } : s));
  const updQuiz    = (sid: string, lid: string, field: string, val: unknown) =>
    setSections(p => p.map(s => s.id === sid ? { ...s, lessons: s.lessons.map(l => l.id === lid ? { ...l, quiz: { ...l.quiz, [field]: val } } : l) } : s));
  const addQ       = (sid: string, lid: string) =>
    setSections(p => p.map(s => s.id === sid ? { ...s, lessons: s.lessons.map(l => l.id === lid ? { ...l, quiz: { ...l.quiz, questions: [...l.quiz.questions, { question: "", options: ["","","",""], correctAnswer: 0, explanation: "" }] } } : l) } : s));
  const rmQ        = (sid: string, lid: string, qi: number) =>
    setSections(p => p.map(s => s.id === sid ? { ...s, lessons: s.lessons.map(l => l.id === lid ? { ...l, quiz: { ...l.quiz, questions: l.quiz.questions.filter((_,i) => i !== qi) } } : l) } : s));
  const updQ       = (sid: string, lid: string, qi: number, field: string, val: unknown) =>
    setSections(p => p.map(s => s.id === sid ? { ...s, lessons: s.lessons.map(l => l.id === lid ? { ...l, quiz: { ...l.quiz, questions: l.quiz.questions.map((q,i) => i === qi ? { ...q, [field]: val } : q) } } : l) } : s));
  const updQOpt    = (sid: string, lid: string, qi: number, oi: number, val: string) =>
    setSections(p => p.map(s => s.id === sid ? { ...s, lessons: s.lessons.map(l => l.id === lid ? { ...l, quiz: { ...l.quiz, questions: l.quiz.questions.map((q,i) => i === qi ? { ...q, options: q.options.map((o,j) => j === oi ? val : o) } : q) } } : l) } : s));
  const toggleSec  = (id: string) => setOpenSec(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handlePublish = async (publishNow: boolean) => {
    setSaving(true); setError("");
    try {
      const cr = await fetch("/api/admin/courses", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ title, slug, description, thumbnail, category, level, isFree, price, isSequential, tags:[], learningOutcomes: learningOutcomes.filter(x=>x.trim()), requirements: requirements.filter(x=>x.trim()) }) });
      if (!cr.ok) { const e = await cr.json(); setError(e.error ?? "Failed"); setSaving(false); return; }
      const course = await cr.json();

      for (let si = 0; si < sections.length; si++) {
        const sec = sections[si];
        const sr = await fetch(`/api/admin/courses/${course.id}/sections`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ title: sec.title, order: si }) });
        if (!sr.ok) continue;
        const secData = await sr.json();
        for (let li = 0; li < sec.lessons.length; li++) {
          const l = sec.lessons[li];
          const lr = await fetch(`/api/admin/courses/${course.id}/sections/${secData.id}/lessons`, { method:"POST", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ title:l.title, description:l.description, contentType:l.contentType, videoUrl:l.videoUrl, textContent:l.textContent, downloadUrl:l.downloadUrl, downloadName:l.downloadName, duration:l.duration, isFree:l.isFree, order:li }) });
          if (!lr.ok) continue;
          const lessonData = await lr.json();
          if (l.contentType === "QUIZ" && l.quiz.questions.length > 0) {
            await fetch(`/api/admin/courses/${course.id}/sections/${secData.id}/lessons/${lessonData.id}/quiz`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(l.quiz) });
          }
        }
      }

      if (publishNow) await fetch(`/api/admin/courses/${course.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ status:"PUBLISHED" }) });
      setDone(true);
    } catch { setError("Something went wrong."); }
    finally { setSaving(false); }
  };

  if (done) return (
    <div className="max-w-xl mx-auto text-center py-24">
      <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10 text-emerald-400" /></div>
      <h2 className="text-2xl font-black text-white mb-2">Course Created!</h2>
      <p className="text-slate-400 mb-8">Your course has been saved successfully.</p>
      <div className="flex gap-3 justify-center">
        <Link href="/admin/courses" className="bg-[#f0c040] hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-400/20">Back to Courses</Link>
        <Link href="/courses" className="bg-slate-800 text-slate-200 border border-white/10 font-bold px-6 py-3 rounded-xl hover:bg-slate-700 transition-all">View Catalog</Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-4">
        <Link href="/admin/courses" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <div><h1 className="text-2xl font-black text-white">Create New Course</h1><p className="text-slate-400 text-sm">Step {step} of 2</p></div>
      </div>

      <div className="flex items-center gap-3">
        {[{n:1,label:"Course Details"},{n:2,label:"Curriculum"}].map(({n,label}) => (
          <button key={n} onClick={() => n <= step && setStep(n)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${step===n?"bg-[#f0c040] text-slate-950 font-black shadow-md shadow-amber-400/20":step>n?"bg-emerald-500/15 text-emerald-300 border border-emerald-500/20":"bg-slate-800/80 text-slate-400 border border-white/10"}`}>
            {step>n ? <CheckCircle2 className="w-4 h-4"/> : n} {label}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Title *</label>
              <input value={title} onChange={e=>handleTitle(e.target.value)} placeholder="e.g. Tax Filing Fundamentals"
                className="w-full font-[inherit] text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#0a1628] transition-all"/>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Slug *</label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-[#0a1628] transition-all">
                <span className="text-slate-400 text-sm">/courses/</span>
                <input value={slug} onChange={e=>setSlug(autoSlug(e.target.value))} className="flex-1 font-[inherit] text-sm outline-none"/>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Description *</label>
              <textarea value={description} onChange={e=>setDesc(e.target.value)} rows={4} placeholder="What will students learn?"
                className="w-full font-[inherit] text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#0a1628] transition-all resize-none"/>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Course Thumbnail</label>
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleThumbUpload(f); e.target.value = ""; }}
              />
              {thumbnail ? (
                <div className="relative inline-block">
                  <img src={thumbnail} alt="Thumbnail" className="h-36 w-auto rounded-xl object-cover border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => setThumbnail("")}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => thumbInputRef.current?.click()}
                    className="absolute bottom-2 right-2 text-xs font-bold bg-white/90 text-slate-700 px-2 py-1 rounded-lg shadow hover:bg-white transition-all"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  disabled={thumbUploading}
                  className="flex flex-col items-center justify-center gap-2 w-full h-36 border-2 border-dashed border-slate-200 rounded-xl hover:border-[#0a1628] hover:bg-slate-50 transition-all text-slate-400 disabled:opacity-50"
                >
                  {thumbUploading
                    ? <Loader2 className="w-6 h-6 animate-spin" />
                    : <Upload className="w-6 h-6" />}
                  <span className="text-sm font-medium">{thumbUploading ? "Uploading…" : "Click to upload thumbnail"}</span>
                  <span className="text-xs text-slate-300">PNG, JPG, WEBP — max 5 MB</span>
                </button>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Category *</label>
              <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full font-[inherit] text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none bg-white cursor-pointer">
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Level *</label>
              <select value={level} onChange={e=>setLevel(e.target.value)} className="w-full font-[inherit] text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none bg-white cursor-pointer">
                <option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Price (USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={price || ""}
                  onChange={e => {
                    const val = Number(e.target.value) || 0;
                    setPrice(val);
                    setIsFree(val <= 0);
                  }}
                  placeholder="0.00 — leave blank for free"
                  className="w-full font-[inherit] text-sm border border-slate-200 rounded-xl pl-8 pr-4 py-3 outline-none focus:border-[#0a1628] transition-all bg-white"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isSequential} onChange={e=>setIsSequential(e.target.checked)} className="w-4 h-4 rounded"/>
                <div>
                  <span className="text-sm font-bold text-[#0a1628]">Sequential Learning</span>
                  <p className="text-xs text-slate-400 mt-0.5">Students must complete each lesson in order before accessing the next</p>
                </div>
              </label>
            </div>

            {/* What You'll Learn */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">What You&apos;ll Learn</label>
              <p className="text-xs text-slate-400 mb-2">Key skills students will gain (shown as checkmarks on the course page)</p>
              <div className="space-y-2">
                {learningOutcomes.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={item} onChange={e=>{ const n=[...learningOutcomes]; n[i]=e.target.value; setLearningOutcomes(n); }}
                      placeholder={`Learning outcome ${i+1}`}
                      className="flex-1 font-[inherit] text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#0a1628] transition-all"/>
                    {learningOutcomes.length > 1 && (
                      <button onClick={()=>setLearningOutcomes(p=>p.filter((_,j)=>j!==i))} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={()=>setLearningOutcomes(p=>[...p,""])}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#d4a017] hover:underline">
                  <Plus className="w-3.5 h-3.5"/> Add outcome
                </button>
              </div>
            </div>

            {/* Requirements */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Requirements</label>
              <p className="text-xs text-slate-400 mb-2">Prerequisites or things students should know before starting</p>
              <div className="space-y-2">
                {requirements.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={item} onChange={e=>{ const n=[...requirements]; n[i]=e.target.value; setRequirements(n); }}
                      placeholder={`Requirement ${i+1}`}
                      className="flex-1 font-[inherit] text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#0a1628] transition-all"/>
                    {requirements.length > 1 && (
                      <button onClick={()=>setRequirements(p=>p.filter((_,j)=>j!==i))} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={()=>setRequirements(p=>[...p,""])}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#d4a017] hover:underline">
                  <Plus className="w-3.5 h-3.5"/> Add requirement
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={()=>setStep(2)} disabled={!title.trim()||!slug.trim()||!description.trim()}
              className="flex items-center gap-2 bg-[#0a1628] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#1a3a6b] disabled:opacity-40 transition-all">
              Next: Curriculum <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {sections.length === 0 && (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
              <p className="text-slate-500 font-semibold">No sections yet</p>
            </div>
          )}

          {sections.map((sec, si) => {
            const isOpen = openSec.has(sec.id);
            return (
              <div key={sec.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                  <button onClick={()=>toggleSec(sec.id)} className="text-slate-400 hover:text-slate-600">
                    {isOpen ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                  </button>
                  <span className="text-xs font-black text-slate-400 shrink-0">Section {si+1}</span>
                  <input value={sec.title} onChange={e=>updSection(sec.id,e.target.value)}
                    className="flex-1 font-[inherit] text-sm font-bold text-[#0a1628] border-0 outline-none bg-transparent"/>
                  <span className="text-xs text-slate-400">{sec.lessons.length} lessons</span>
                  <button onClick={()=>rmSection(sec.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>

                {isOpen && (
                  <div className="p-4 space-y-4">
                    {sec.lessons.map((l, li) => {
                      const CTIcon = CT_ICONS[l.contentType];
                      return (
                        <div key={l.id} className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                          <div className="flex items-center gap-2">
                            <CTIcon className="w-4 h-4 text-slate-400 shrink-0"/>
                            <span className="text-xs text-slate-400">Lesson {li+1}</span>
                            <div className="flex gap-1 ml-auto">
                              {(["VIDEO","TEXT","QUIZ"] as ContentType[]).map(ct => (
                                <button key={ct} onClick={()=>updLesson(sec.id,l.id,"contentType",ct)}
                                  className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${l.contentType===ct?"bg-[#0a1628] text-white":"bg-white text-slate-500 border border-slate-200 hover:border-slate-300"}`}>
                                  {CT_LABELS[ct]}
                                </button>
                              ))}
                            </div>
                            <button onClick={()=>rmLesson(sec.id,l.id)} className="text-slate-300 hover:text-red-500 transition-colors ml-1"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>

                          <input value={l.title} onChange={e=>updLesson(sec.id,l.id,"title",e.target.value)} placeholder="Lesson title *"
                            className="w-full font-[inherit] text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#0a1628] bg-white"/>

                          <input value={l.description} onChange={e=>updLesson(sec.id,l.id,"description",e.target.value)} placeholder="Lesson description or overview (optional)"
                            className="w-full font-[inherit] text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#0a1628] bg-white text-slate-600"/>

                          {/* Downloadable Attachment */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <input value={l.downloadName ?? ""} onChange={e=>updLesson(sec.id,l.id,"downloadName",e.target.value)} placeholder="Resource / Download Name (e.g. Worksheet.pdf)"
                              className="font-[inherit] text-xs border border-slate-200 rounded-md px-2.5 py-1.5 outline-none bg-white"/>
                            <input value={l.downloadUrl ?? ""} onChange={e=>updLesson(sec.id,l.id,"downloadUrl",e.target.value)} placeholder="Download File URL (Cloudinary / PDF link)"
                              className="font-[inherit] text-xs border border-slate-200 rounded-md px-2.5 py-1.5 outline-none bg-white"/>
                          </div>

                          {l.contentType === "VIDEO" && (
                            <div className="grid grid-cols-2 gap-3">
                              <input value={l.videoUrl} onChange={e=>updLesson(sec.id,l.id,"videoUrl",e.target.value)} placeholder="Video URL (YouTube/direct)"
                                className="col-span-2 w-full font-[inherit] text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#0a1628] bg-white"/>
                              <input type="number" value={l.duration} onChange={e=>updLesson(sec.id,l.id,"duration",Number(e.target.value))} placeholder="Duration (seconds)"
                                className="font-[inherit] text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#0a1628] bg-white"/>
                              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                <input type="checkbox" checked={l.isFree} onChange={e=>updLesson(sec.id,l.id,"isFree",e.target.checked)} className="w-4 h-4 rounded cursor-pointer"/>
                                Free Preview
                              </label>
                            </div>
                          )}

                          {l.contentType === "TEXT" && (
                            <RichTextEditor
                              value={l.textContent}
                              onChange={val => updLesson(sec.id, l.id, "textContent", val)}
                              placeholder="Write the article content here…"
                              minHeight={220}
                            />
                          )}

                          {l.contentType === "QUIZ" && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <input value={l.quiz.title} onChange={e=>updQuiz(sec.id,l.id,"title",e.target.value)} placeholder="Quiz title"
                                  className="font-[inherit] text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#0a1628] bg-white"/>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500 shrink-0">Pass mark %</span>
                                  <input type="number" value={l.quiz.passMark} min={0} max={100} onChange={e=>updQuiz(sec.id,l.id,"passMark",Number(e.target.value))}
                                    className="flex-1 font-[inherit] text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#0a1628] bg-white"/>
                                </div>
                              </div>
                              {l.quiz.questions.map((q, qi) => (
                                <div key={qi} className="bg-white rounded-xl p-3 border border-slate-200 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-400">Q{qi+1}</span>
                                    <input value={q.question} onChange={e=>updQ(sec.id,l.id,qi,"question",e.target.value)} placeholder="Question text"
                                      className="flex-1 font-[inherit] text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#0a1628]"/>
                                    <button onClick={()=>rmQ(sec.id,l.id,qi)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {q.options.map((opt, oi) => (
                                      <div key={oi} className="flex items-center gap-1.5">
                                        <input type="radio" checked={q.correctAnswer===oi} onChange={()=>updQ(sec.id,l.id,qi,"correctAnswer",oi)} className="cursor-pointer"/>
                                        <input value={opt} onChange={e=>updQOpt(sec.id,l.id,qi,oi,e.target.value)} placeholder={`Option ${oi+1}`}
                                          className="flex-1 font-[inherit] text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#0a1628]"/>
                                      </div>
                                    ))}
                                  </div>
                                  <input value={q.explanation} onChange={e=>updQ(sec.id,l.id,qi,"explanation",e.target.value)} placeholder="Explanation (optional)"
                                    className="w-full font-[inherit] text-xs border border-slate-100 rounded-lg px-3 py-1.5 outline-none bg-slate-50 text-slate-500"/>
                                </div>
                              ))}
                              <button onClick={()=>addQ(sec.id,l.id)}
                                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#d4a017] border border-dashed border-[#d4a017]/30 py-2 rounded-lg hover:bg-[#f0c040]/5 transition-all">
                                <Plus className="w-3.5 h-3.5"/> Add Question
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button onClick={()=>addLesson(sec.id)}
                      className="w-full flex items-center justify-center gap-2 text-sm font-bold text-[#d4a017] border-2 border-dashed border-[#d4a017]/30 py-2.5 rounded-xl hover:bg-[#f0c040]/5 transition-all">
                      <Plus className="w-4 h-4"/> Add Lesson
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <button onClick={addSection}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-600 border-2 border-dashed border-slate-200 py-3.5 rounded-2xl hover:bg-slate-50 transition-all">
            <Plus className="w-4 h-4"/> Add Section
          </button>

          {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

          <div className="flex items-center gap-3 justify-between pt-2">
            <button onClick={()=>setStep(1)} className="text-sm font-bold text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-all">← Back</button>
            <div className="flex gap-3">
              <button onClick={()=>handlePublish(false)} disabled={saving}
                className="flex items-center gap-2 text-sm font-bold border-2 border-[#0a1628] text-[#0a1628] px-5 py-2.5 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all">
                {saving&&<Loader2 className="w-4 h-4 animate-spin"/>} Save Draft
              </button>
              <button onClick={()=>handlePublish(true)} disabled={saving}
                className="flex items-center gap-2 text-sm font-bold bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] px-5 py-2.5 rounded-xl hover:shadow-lg disabled:opacity-40 transition-all">
                {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<GraduationCap className="w-4 h-4"/>} Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
