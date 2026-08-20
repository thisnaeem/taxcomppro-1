"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Save, Trash2, Eye, EyeOff, CheckCircle2,
  Plus, ChevronDown, ChevronRight, Video, FileText, HelpCircle, GraduationCap,
  Upload, X,
} from "lucide-react";
import RichTextEditor from "@/components/courses/RichTextEditor";

const CATEGORIES = ["Tax Office Startup","Compliance","Accounting","Bookkeeping","Audit","Financial Planning","Business Tax","Payroll"];
type ContentType = "VIDEO"|"TEXT"|"QUIZ";
const CT_ICONS: Record<ContentType, React.ElementType> = { VIDEO: Video, TEXT: FileText, QUIZ: HelpCircle };
const CT_LABELS: Record<ContentType, string> = { VIDEO: "Video", TEXT: "Article", QUIZ: "Quiz" };

interface Lesson { id:string; title:string; description:string|null; contentType:ContentType; videoUrl:string|null; textContent:string|null; duration:number; isFree:boolean; order:number; }
interface Section { id:string; title:string; order:number; lessons:Lesson[]; }
interface Course { id:string; slug:string; title:string; description:string; thumbnail:string|null; category:string; level:string; status:string; isFree:boolean; price:number; isSequential:boolean; sections:Section[]; }

export default function EditCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const [course, setCourse]           = useState<Course | null>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState("");
  const [openSec, setOpenSec]         = useState<Set<string>>(new Set());
  const [thumbUploading, setThumbUploading] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Metadata fields
  const [title, setTitle]             = useState("");
  const [slug, setSlug]               = useState("");
  const [description, setDesc]        = useState("");
  const [thumbnail, setThumbnail]     = useState("");
  const [category, setCategory]       = useState(CATEGORIES[0]);
  const [level, setLevel]             = useState("BEGINNER");
  const [isFree, setIsFree]           = useState(true);
  const [price, setPrice]             = useState(0);
  const [isSequential, setIsSeq]      = useState(true);
  const [status, setStatus]           = useState("DRAFT");
  const [sections, setSections]       = useState<Section[]>([]);

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

  useEffect(() => {
    if (!courseId) return;
    fetch(`/api/admin/courses/${courseId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { router.push("/admin/courses"); return; }
        setCourse(d);
        setTitle(d.title); setSlug(d.slug); setDesc(d.description);
        setThumbnail(d.thumbnail ?? ""); setCategory(d.category);
        setLevel(d.level); setIsFree(d.isFree); setPrice(d.price);
        setIsSeq(d.isSequential); setStatus(d.status);
        setSections(d.sections ?? []);
        if (d.sections?.length) setOpenSec(new Set([d.sections[0].id]));
      })
      .finally(() => setLoading(false));
  }, [courseId, router]);

  // Helpers
  const uid = () => Math.random().toString(36).slice(2);
  const toggle = (id: string) => setOpenSec(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const addSection = () => { const id = uid(); setSections(p => [...p, { id, title: `Section ${p.length+1}`, order: p.length, lessons: [] }]); setOpenSec(p => new Set([...p, id])); };
  const rmSection  = (id: string) => setSections(p => p.filter(s => s.id !== id));
  const updSec     = (id: string, t: string) => setSections(p => p.map(s => s.id === id ? { ...s, title: t } : s));
  const addLesson  = (sid: string) => setSections(p => p.map(s => s.id === sid ? { ...s, lessons: [...s.lessons, { id: uid(), title:"", description:null, contentType:"VIDEO", videoUrl:null, textContent:null, duration:0, isFree:false, order:s.lessons.length }] } : s));
  const rmLesson   = (sid: string, lid: string) => setSections(p => p.map(s => s.id === sid ? { ...s, lessons: s.lessons.filter(l => l.id !== lid) } : s));
  const updLesson  = (sid: string, lid: string, f: string, v: unknown) =>
    setSections(p => p.map(s => s.id === sid ? { ...s, lessons: s.lessons.map(l => l.id === lid ? { ...l, [f]: v } : l) } : s));

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      // Update metadata
      const mr = await fetch(`/api/admin/courses/${courseId}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ title, slug, description, thumbnail: thumbnail||null, category, level, isFree, price, isSequential, status }),
      });
      if (!mr.ok) { const e = await mr.json(); setError(e.error ?? "Failed to save"); setSaving(false); return; }

      // Sync sections & lessons (create new ones, update existing)
      for (let si = 0; si < sections.length; si++) {
        const sec = sections[si];
        const isNew = !course?.sections.find(s => s.id === sec.id);
        let secId = sec.id;
        if (isNew) {
          const sr = await fetch(`/api/admin/courses/${courseId}/sections`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ title: sec.title, order: si }) });
          if (!sr.ok) continue;
          secId = (await sr.json()).id;
        }
        for (let li = 0; li < sec.lessons.length; li++) {
          const l = sec.lessons[li];
          const isNewL = !course?.sections.flatMap(s => s.lessons).find(x => x.id === l.id);
          if (isNewL) {
            await fetch(`/api/admin/courses/${courseId}/sections/${secId}/lessons`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ title:l.title, description:l.description, contentType:l.contentType, videoUrl:l.videoUrl, textContent:l.textContent, duration:l.duration, isFree:l.isFree, order:li }) });
          } else {
            await fetch(`/api/admin/courses/${courseId}/sections/${secId}/lessons/${l.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ title:l.title, description:l.description, contentType:l.contentType, videoUrl:l.videoUrl, textContent:l.textContent, duration:l.duration, isFree:l.isFree }) });
          }
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError("Something went wrong."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${title}"? This will remove all enrollments and progress. This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/admin/courses/${courseId}`, { method:"DELETE" });
      if (r.ok) router.push("/admin/courses");
      else setError("Failed to delete course.");
    } finally { setDeleting(false); }
  };

  const handlePublishToggle = () => setStatus(s => s === "PUBLISHED" ? "DRAFT" : "PUBLISHED");

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-[#d4a017] animate-spin"/></div>;
  if (!course) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/courses" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5"/></Link>
          <div>
            <h1 className="text-2xl font-black text-white">Edit Course</h1>
            <p className="text-slate-400 text-sm mt-0.5 truncate max-w-xs">{course.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-1.5 text-sm font-bold text-red-500 border-2 border-red-200 bg-red-50 px-4 py-2.5 rounded-xl hover:bg-red-100 transition-all disabled:opacity-50">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>} Delete
          </button>
          <button onClick={handlePublishToggle}
            className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl border-2 transition-all ${status==="PUBLISHED" ? "border-slate-300 bg-white text-slate-600 hover:bg-slate-50" : "border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
            {status==="PUBLISHED" ? <><EyeOff className="w-4 h-4"/> Unpublish</> : <><Eye className="w-4 h-4"/> Publish</>}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 text-sm font-bold bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] px-5 py-2.5 rounded-xl hover:shadow-lg disabled:opacity-50 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : saved ? <CheckCircle2 className="w-4 h-4"/> : <Save className="w-4 h-4"/>}
            {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">{error}</div>}
      {saved && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Changes saved successfully!</div>}

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${status==="PUBLISHED"?"bg-emerald-100 text-emerald-700":status==="ARCHIVED"?"bg-red-100 text-red-600":"bg-slate-100 text-slate-500"}`}>
          {status}
        </span>
        <span className="text-xs text-slate-400">Current status · changes saved on "Save Changes"</span>
      </div>

      {/* Metadata */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <h2 className="font-black text-[#0a1628] text-sm uppercase tracking-wider">Course Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full font-[inherit] text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#0a1628] transition-all"/>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Slug</label>
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-[#0a1628] transition-all">
              <span className="text-slate-400 text-sm">/courses/</span>
              <input value={slug} onChange={e=>setSlug(e.target.value)} className="flex-1 font-[inherit] text-sm outline-none"/>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Description</label>
            <textarea value={description} onChange={e=>setDesc(e.target.value)} rows={4} className="w-full font-[inherit] text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#0a1628] transition-all resize-none"/>
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
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Category</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full font-[inherit] text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none bg-white cursor-pointer">
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Level</label>
            <select value={level} onChange={e=>setLevel(e.target.value)} className="w-full font-[inherit] text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none bg-white cursor-pointer">
              <option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Pricing</label>
            <div className="flex gap-3">
              {["Free","Paid"].map((l,i)=>(
                <button key={l} onClick={()=>setIsFree(i===0)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${(i===0)===isFree?"border-[#0a1628] bg-[#0a1628] text-white":"border-slate-200 text-slate-500"}`}>{l}</button>
              ))}
            </div>
          </div>
          {!isFree && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Price (USD)</label>
              <input type="number" value={price} onChange={e=>setPrice(Number(e.target.value))} min={0} className="w-full font-[inherit] text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#0a1628] transition-all"/>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isSequential} onChange={e=>setIsSeq(e.target.checked)} className="w-4 h-4 rounded"/>
              <div>
                <span className="text-sm font-bold text-[#0a1628]">Sequential Learning</span>
                <p className="text-xs text-slate-400 mt-0.5">Students must complete each lesson in order</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-[#0a1628] text-sm uppercase tracking-wider">Curriculum</h2>
          <span className="text-xs text-slate-400">{sections.reduce((s,sec)=>s+sec.lessons.length,0)} lessons · {sections.length} sections</span>
        </div>

        {sections.map((sec, si) => {
          const isOpen = openSec.has(sec.id);
          return (
            <div key={sec.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                <button onClick={()=>toggle(sec.id)} className="text-slate-400 hover:text-slate-600">
                  {isOpen ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                </button>
                <span className="text-xs font-black text-slate-400 shrink-0">§{si+1}</span>
                <input value={sec.title} onChange={e=>updSec(sec.id,e.target.value)}
                  className="flex-1 font-[inherit] text-sm font-bold text-[#0a1628] border-0 outline-none bg-transparent"/>
                <span className="text-xs text-slate-400 shrink-0">{sec.lessons.length} lessons</span>
                <button onClick={()=>rmSection(sec.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
              </div>
              {isOpen && (
                <div className="p-4 space-y-3">
                  {sec.lessons.map((l, li) => {
                    const LIcon = CT_ICONS[l.contentType];
                    return (
                      <div key={l.id} className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                        <div className="flex items-center gap-2">
                          <LIcon className="w-4 h-4 text-slate-400 shrink-0"/>
                          <span className="text-xs text-slate-400">Lesson {li+1}</span>
                          <div className="flex gap-1 ml-auto">
                            {(["VIDEO","TEXT","QUIZ"] as ContentType[]).map(ct=>(
                              <button key={ct} onClick={()=>updLesson(sec.id,l.id,"contentType",ct)}
                                className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${l.contentType===ct?"bg-[#0a1628] text-white":"bg-white text-slate-500 border border-slate-200 hover:border-slate-300"}`}>
                                {CT_LABELS[ct]}
                              </button>
                            ))}
                          </div>
                          <button onClick={()=>rmLesson(sec.id,l.id)} className="text-slate-300 hover:text-red-500 transition-colors ml-1"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                        <input value={l.title} onChange={e=>updLesson(sec.id,l.id,"title",e.target.value)} placeholder="Lesson title"
                          className="w-full font-[inherit] text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#0a1628] bg-white"/>
                        {l.contentType==="VIDEO" && (
                          <div className="grid grid-cols-2 gap-3">
                            <input value={l.videoUrl??""} onChange={e=>updLesson(sec.id,l.id,"videoUrl",e.target.value)} placeholder="Video URL"
                              className="col-span-2 w-full font-[inherit] text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#0a1628] bg-white"/>
                            <input type="number" value={l.duration} onChange={e=>updLesson(sec.id,l.id,"duration",Number(e.target.value))} placeholder="Duration (sec)"
                              className="font-[inherit] text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#0a1628] bg-white"/>
                            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                              <input type="checkbox" checked={l.isFree} onChange={e=>updLesson(sec.id,l.id,"isFree",e.target.checked)} className="w-4 h-4 rounded cursor-pointer"/>
                              Free Preview
                            </label>
                          </div>
                        )}
                        {l.contentType==="TEXT" && (
                          <RichTextEditor
                            value={l.textContent ?? ""}
                            onChange={val => updLesson(sec.id, l.id, "textContent", val)}
                            placeholder="Write article content…"
                            minHeight={200}
                          />
                        )}
                        {l.contentType==="QUIZ" && (
                          <p className="text-xs text-slate-400 italic">Quiz questions managed via API after saving. Set type and save first.</p>
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
      </div>

      {/* Bottom save */}
      <div className="flex items-center justify-between pb-8">
        <button onClick={handleDelete} disabled={deleting}
          className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 transition-colors disabled:opacity-50">
          {deleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
          Delete Course Permanently
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 text-sm font-bold bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] px-6 py-3 rounded-xl hover:shadow-lg disabled:opacity-50 transition-all">
          {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <GraduationCap className="w-4 h-4"/>}
          {saving ? "Saving…" : "Save All Changes"}
        </button>
      </div>
    </div>
  );
}
