"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Tag, DollarSign, CheckCircle2, Loader2, ArrowLeft,
  Upload, X, Clock, Users, Globe, BookOpen,
  Download, Wifi, Monitor, Package, Award, Briefcase, ShoppingBag,
  Network, GraduationCap, Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";

/* ── Shared styles ── */
const inp = "w-full font-[inherit] text-sm px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all bg-white";
const sel = `${inp}`;
const lbl = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1";

/* ── Categories ── */
const CATEGORIES = [
  { value: "SERVICE",  label: "Service",  icon: Briefcase,      desc: "Consulting, advice, or professional work" },
  { value: "PRODUCT",  label: "Product",  icon: ShoppingBag,    desc: "Downloadable guides, templates, or tools" },
  { value: "NETWORK",  label: "Network",  icon: Network,        desc: "Referral networks or professional groups" },
  { value: "TRAINING", label: "Training", icon: GraduationCap,  desc: "Courses, webinars, or CE credit programs" },
];

/* ── Category-specific metadata fields ── */
function ServiceFields({ meta, set }: { meta: Record<string, string>; set: (k: string, v: string) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Service Type</label>
          <select className={sel} value={meta.serviceType ?? ""} onChange={e => set("serviceType", e.target.value)}>
            <option value="">Select…</option>
            {["Tax Preparation", "Audit Defense", "Consulting", "Bookkeeping", "Payroll", "IRS Representation", "Business Formation", "Other"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Delivery Method</label>
          <select className={sel} value={meta.deliveryMethod ?? ""} onChange={e => set("deliveryMethod", e.target.value)}>
            <option value="">Select…</option>
            {["Remote / Virtual", "In-Person", "Hybrid"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}><Clock className="w-3 h-3 inline mr-1" />Turnaround</label>
          <input className={inp} placeholder="e.g. 3–5 business days" value={meta.turnaround ?? ""} onChange={e => set("turnaround", e.target.value)} />
        </div>
        <div>
          <label className={lbl}><Globe className="w-3 h-3 inline mr-1" />Availability</label>
          <input className={inp} placeholder="e.g. Mon–Fri, 9am–5pm EST" value={meta.availability ?? ""} onChange={e => set("availability", e.target.value)} />
        </div>
      </div>
    </>
  );
}

function ProductFields({ meta, set }: { meta: Record<string, string>; set: (k: string, v: string) => void }) {
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError]         = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) { setFileError("File must be under 15 MB"); return; }
    setFileError("");
    setUploadingFile(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/upload/listing", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        set("downloadUrl", data.url);
        if (!meta.downloadName) set("downloadName", f.name);
      } else {
        setFileError(data.error ?? "Upload failed");
      }
    } catch { setFileError("Upload failed"); }
    finally { setUploadingFile(false); }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}><Package className="w-3 h-3 inline mr-1" />Product Type</label>
          <select className={sel} value={meta.productType ?? ""} onChange={e => set("productType", e.target.value)}>
            <option value="">Select…</option>
            {["PDF Guide", "Excel Template", "Word Template", "Software Tool", "Bundle / Pack", "Checklist", "Other"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}><Download className="w-3 h-3 inline mr-1" />Delivery</label>
          <select className={sel} value={meta.deliveryMethod ?? ""} onChange={e => set("deliveryMethod", e.target.value)}>
            <option value="">Select…</option>
            {["Instant Download", "Email Delivery", "Member Portal Access"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>File Format(s)</label>
          <input className={inp} placeholder="e.g. PDF, XLSX, DOCX" value={meta.fileFormats ?? ""} onChange={e => set("fileFormats", e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Number of Files</label>
          <input className={inp} type="number" min="1" placeholder="e.g. 5" value={meta.fileCount ?? ""} onChange={e => set("fileCount", e.target.value)} />
        </div>
      </div>

      {/* Downloadable Product File / Link */}
      <div className="pt-2 space-y-2 border-t border-slate-100">
        <label className={lbl}><Download className="w-3 h-3 inline mr-1" />Downloadable Product File / Link</label>
        <div className="space-y-2">
          <input
            className={inp}
            placeholder="https://drive.google.com/file/... or direct file URL"
            value={meta.downloadUrl ?? ""}
            onChange={e => set("downloadUrl", e.target.value)}
          />
          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all border border-slate-200">
              {uploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-slate-500" />}
              {uploadingFile ? "Uploading File…" : "Upload File (PDF, ZIP, Excel, Word)"}
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
            {meta.downloadUrl && (
              <span className="text-xs font-bold text-emerald-600 truncate max-w-xs">
                ✓ File attached
              </span>
            )}
          </div>
          {fileError && <p className="text-red-500 text-xs">{fileError}</p>}
          <p className="text-[11px] text-slate-400">Buyers will gain instant download access after payment (or immediately if free).</p>
        </div>
      </div>
    </>
  );
}

function NetworkFields({ meta, set }: { meta: Record<string, string>; set: (k: string, v: string) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}><Globe className="w-3 h-3 inline mr-1" />Network Type</label>
          <select className={sel} value={meta.networkType ?? ""} onChange={e => set("networkType", e.target.value)}>
            <option value="">Select…</option>
            {["Referral Network", "Professional Group", "Study Group", "Mastermind", "Accountability Group", "Trade Association"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}><Users className="w-3 h-3 inline mr-1" />Max Members</label>
          <input className={inp} type="number" min="2" placeholder="e.g. 50" value={meta.maxMembers ?? ""} onChange={e => set("maxMembers", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Meeting Frequency</label>
          <select className={sel} value={meta.meetingFrequency ?? ""} onChange={e => set("meetingFrequency", e.target.value)}>
            <option value="">Select…</option>
            {["Weekly", "Bi-Weekly", "Monthly", "Quarterly", "As Needed"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}><Wifi className="w-3 h-3 inline mr-1" />Format</label>
          <select className={sel} value={meta.format ?? ""} onChange={e => set("format", e.target.value)}>
            <option value="">Select…</option>
            {["Online", "In-Person", "Hybrid"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={lbl}>Key Benefits</label>
        <input className={inp} placeholder="e.g. Lead sharing, accountability, mentorship" value={meta.benefits ?? ""} onChange={e => set("benefits", e.target.value)} />
      </div>
    </>
  );
}

function TrainingFields({ meta, set }: { meta: Record<string, string>; set: (k: string, v: string) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}><Monitor className="w-3 h-3 inline mr-1" />Format</label>
          <select className={sel} value={meta.format ?? ""} onChange={e => set("format", e.target.value)}>
            <option value="">Select…</option>
            {["Self-Paced Video", "Live Webinar", "Live In-Person", "Hybrid", "1-on-1 Coaching"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}><BookOpen className="w-3 h-3 inline mr-1" />Level</label>
          <select className={sel} value={meta.level ?? ""} onChange={e => set("level", e.target.value)}>
            <option value="">Select…</option>
            {["Beginner", "Intermediate", "Advanced", "All Levels"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}><Clock className="w-3 h-3 inline mr-1" />Duration</label>
          <input className={inp} placeholder="e.g. 4 hours, 6 weeks" value={meta.duration ?? ""} onChange={e => set("duration", e.target.value)} />
        </div>
        <div>
          <label className={lbl}><Award className="w-3 h-3 inline mr-1" />CE Credits</label>
          <input className={inp} type="number" min="0" step="0.5" placeholder="e.g. 2.0" value={meta.ceCredits ?? ""} onChange={e => set("ceCredits", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={lbl}>What Students Will Learn</label>
        <input className={inp} placeholder="e.g. IRS audit process, penalty reduction strategies" value={meta.outcomes ?? ""} onChange={e => set("outcomes", e.target.value)} />
      </div>
    </>
  );
}

/* ── Inline image uploader — routes through /api/upload/listing ── */
function ImageUploader({ image, onUpload, onRemove }: { image: string | null; onUpload: (url: string) => void; onRemove: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const upload = async (file: File) => {
    // 10 MB client-side guard
    if (file.size > 10 * 1024 * 1024) { setUploadError("Image must be under 10 MB."); return; }
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/listing", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) onUpload(data.url);
      else setUploadError(data.error ?? "Upload failed");
    } catch { setUploadError("Upload failed — please try again."); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-1.5">
      {image ? (
        <div className="relative rounded-xl overflow-hidden h-44 border border-slate-200">
          <img src={image} alt="Banner" className="w-full h-full object-cover" />
          <button type="button" onClick={onRemove} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-all"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-[#0a1628] hover:bg-slate-50 transition-all">
          {uploading
            ? <><Loader2 className="w-6 h-6 text-slate-400 animate-spin mb-1.5" /><span className="text-xs text-slate-400">Uploading…</span></>
            : <><ImageIcon className="w-7 h-7 text-slate-300 mb-2" /><span className="text-sm font-semibold text-slate-400">Click to upload banner</span><span className="text-xs text-slate-300 mt-0.5">JPG, PNG, WEBP — max 10 MB</span></>}
          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
        </label>
      )}
      {uploadError && <p className="text-red-500 text-xs">{uploadError}</p>}
    </div>
  );
}

/* ─────────────────── Page ─────────────────── */
export default function CreateListingPage() {
  const router   = useRouter();
  const authUser = useAppSelector(s => s.auth.user);
  const isAdmin  = authUser?.role === "ADMIN";

  const [category,    setCategory]    = useState("SERVICE");
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [price,       setPrice]       = useState("");
  const [tags,        setTags]        = useState<string[]>([]);
  const [tagInput,    setTagInput]    = useState("");
  const [image,       setImage]       = useState<string | null>(null);
  const [meta,        setMetaRaw]     = useState<Record<string, string>>({});
  const [submitting,  setSubmitting]  = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState("");

  const setMeta = (k: string, v: string) => setMetaRaw(p => ({ ...p, [k]: v }));
  const addTag  = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 8) { setTags(p => [...p, t]); setTagInput(""); }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) { setError("Title and description are required."); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, description, price: price ? parseFloat(price) : null, tags, images: image ? [image] : [], metadata: meta }),
      });
      if (!res.ok) { setError((await res.json()).error ?? "Failed to create listing"); return; }
      setSuccess(true);
      setTimeout(() => router.push("/marketplace"), 2000);
    } catch { setError("Something went wrong."); }
    finally { setSubmitting(false); }
  };

  if (success) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-12 text-center max-w-md mx-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isAdmin ? "bg-amber-100" : "bg-emerald-100"}`}>
          <CheckCircle2 className={`w-8 h-8 ${isAdmin ? "text-amber-500" : "text-emerald-500"}`} />
        </div>
        <h2 className="text-xl font-black text-[#0a1628] mb-2">{isAdmin ? "Live & Featured! ⭐" : "Listing Submitted!"}</h2>
        <p className="text-slate-500 text-sm">{isAdmin ? "Pinned at the top of the marketplace." : "Under review — we'll notify you when it's live."}</p>
        <p className="text-slate-400 text-xs mt-2">Redirecting…</p>
      </div>
    </div>
  );

  const activeCat = CATEGORIES.find(c => c.value === category)!;

  return (
    <div className="min-h-screen bg-[#f4f6fb] py-8">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/marketplace" className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#0a1628]">Create Listing</h1>
            <p className="text-slate-400 text-sm">{isAdmin ? "Your listing will be instantly live and featured" : "Your listing will be reviewed before going live"}</p>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="flex gap-5 items-start">

            {/* ── LEFT: Sidebar ── */}
            <div className="w-64 shrink-0 space-y-4">

              {/* Category picker */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Category</p>
                <div className="space-y-1">
                  {CATEGORIES.map(c => {
                    const Icon = c.icon;
                    const active = category === c.value;
                    return (
                      <button key={c.value} type="button" onClick={() => { setCategory(c.value); setMetaRaw({}); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${active ? "bg-[#0a1628] text-white" : "text-slate-600 hover:bg-slate-50 hover:text-[#0a1628]"}`}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <div>
                          <p className="font-bold leading-tight">{c.label}</p>
                          <p className={`text-[10px] leading-tight ${active ? "text-white/60" : "text-slate-400"}`}>{c.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Preview</p>
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  {image
                    ? <img src={image} alt="preview" className="w-full h-24 object-cover" />
                    : <div className="w-full h-24 bg-slate-50 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-slate-200" /></div>}
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-full">{activeCat.label}</span>
                    </div>
                    <p className="text-xs font-black text-[#0a1628] line-clamp-1">{title || "Your listing title"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{description || "Description will appear here…"}</p>
                    <p className="text-sm font-black text-[#0a1628] mt-2">{price ? `$${price}` : "Free"}</p>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Tips</p>
                <ul className="space-y-1.5 text-xs text-amber-700">
                  <li>• Add a banner image to increase visibility</li>
                  <li>• Clear titles get 3× more clicks</li>
                  <li>• Fill in all detail fields for faster approval</li>
                  <li>• Use up to 8 relevant tags</li>
                </ul>
              </div>
            </div>

            {/* ── RIGHT: Main form — single card ── */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">

              {/* Banner image */}
              <div className="p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Banner / Cover Image</p>
                <ImageUploader image={image} onUpload={setImage} onRemove={() => setImage(null)} />
              </div>

              {/* Core fields */}
              <div className="p-5 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Listing Info</p>
                <div>
                  <label className={lbl}>Title *</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="text" placeholder={`e.g. ${activeCat.desc}`} value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full font-[inherit] text-sm pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all" />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Description *</label>
                  <textarea placeholder="Describe your listing in detail…" rows={4} value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full font-[inherit] text-sm px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all resize-none" />
                </div>
                <div className="w-48">
                  <label className={lbl}>Price (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="number" min="0" step="0.01" placeholder="0.00 — leave blank for free" value={price}
                      onChange={e => setPrice(e.target.value)}
                      className="w-full font-[inherit] text-sm pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all" />
                  </div>
                </div>
                <div>
                  <label className={lbl}><Globe className="w-3 h-3 inline mr-1" />Action / External Link (Website, Booking, Learn More)</label>
                  <input type="url" placeholder="https://example.com/booking or https://yoursite.com"
                    value={meta.linkUrl ?? ""} onChange={e => setMeta("linkUrl", e.target.value)}
                    className="w-full font-[inherit] text-sm px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all" />
                  <p className="text-[11px] text-slate-400 mt-1">Optional. Direct link for users clicking your listing button (e.g. your scheduling page, website, or form).</p>
                </div>
              </div>

              {/* Category-specific details */}
              <div className="p-5 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{activeCat.label} Details</p>
                {category === "SERVICE"  && <ServiceFields  meta={meta} set={setMeta} />}
                {category === "PRODUCT"  && <ProductFields  meta={meta} set={setMeta} />}
                {category === "NETWORK"  && <NetworkFields  meta={meta} set={setMeta} />}
                {category === "TRAINING" && <TrainingFields meta={meta} set={setMeta} />}
              </div>

              {/* Tags */}
              <div className="p-5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tags (up to 8)</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="text" placeholder="e.g. irs, audit, cpa" value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                      className="w-full font-[inherit] text-sm pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all" />
                  </div>
                  <button type="button" onClick={addTag}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-lg transition-all">Add</button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1.5 bg-[#0a1628] text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {t}<button type="button" onClick={() => setTags(p => p.filter(x => x !== t))} className="text-white/50 hover:text-white">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="p-5">
                <button type="submit" disabled={submitting}
                  className={`w-full font-black text-sm py-3.5 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${isAdmin ? "bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] hover:shadow-lg" : "bg-[#0a1628] text-white hover:bg-[#1a3a6b]"}`}>
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : isAdmin ? "Publish as Featured ⭐" : "Submit for Review"}
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
