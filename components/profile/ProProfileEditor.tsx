"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import Link from "next/link";
import { Loader2, BadgeCheck, X, MapPin } from "lucide-react";
import { Tick02Icon, GlobeIcon, Linkedin02Icon, NewTwitterIcon, NoteIcon, UserCircleIcon, Briefcase01Icon, Mail01Icon, Edit01Icon, BookOpen01Icon, UserGroupIcon, CrownIcon } from "hugeicons-react";
import ImageUpload from "@/components/profile/ImageUpload";
import MediaGallery from "@/components/profile/MediaGallery";
import ServiceEditor from "@/components/profile/ServiceEditor";
import DueDiligenceBadge from "@/components/badges/DueDiligenceBadge";
import { VoiceMemoEditor } from "@/components/profile/VoiceMemo";

interface Service { id: string; title: string; description: string | null; price: string | null; emoji: string; }

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");
  const add = () => { const v = input.trim(); if (v && !value.includes(v)) onChange([...value, v]); setInput(""); };
  return (
    <div className="border border-slate-200 rounded-xl p-2 flex flex-wrap gap-1.5 focus-within:border-[#0a1628] transition-all bg-white">
      {value.map(tag => (
        <span key={tag} className="flex items-center gap-1 text-xs font-semibold bg-[#0a1628]/8 text-[#0a1628] px-2.5 py-1 rounded-full">
          {tag}<button type="button" onClick={() => onChange(value.filter(t => t !== tag))}><X className="w-3 h-3 hover:text-red-500" /></button>
        </span>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        placeholder={value.length === 0 ? placeholder : "Add more…"}
        className="flex-1 min-w-[100px] text-xs outline-none bg-transparent placeholder-slate-400 px-1 py-0.5" />
    </div>
  );
}

const inp = "w-full font-[inherit] text-sm px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all bg-white";
const lbl = "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5";
const TABS = ["Basic","Mission","Professional","Social","Services","Media","Badges"] as const;

export default function ProProfileEditor() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const [tab, setTab] = useState<typeof TABS[number]>("Basic");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading,  setCoverUploading]  = useState(false);

  const [f, setF] = useState({
    name: "", headline: "", bio: "", mission: "",
    location: "", yearsExperience: "", website: "", linkedIn: "", twitter: "", facebook: "",
    coverImage: null as string|null, image: null as string|null,
  });
  const [specialties,    setSpecialties]    = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [languages,      setLanguages]      = useState<string[]>([]);
  const [mediaPhotos,    setMediaPhotos]    = useState<string[]>([]);
  const [services,       setServices]       = useState<Service[]>([]);
  const [voiceMemoUrl,   setVoiceMemoUrl]   = useState<string | null>(null);

  const field = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setF(p => ({...p, [k]: e.target.value}));

  const load = useCallback(async () => {
    const u = await fetch("/api/user/me").then(r => r.json()) as Record<string,unknown>;
    setF({
      name: (u.name as string)??"", headline: (u.headline as string)??"", bio: (u.bio as string)??"",
      mission: (u.mission as string)??"", location: (u.location as string)??"",
      yearsExperience: u.yearsExperience != null ? String(u.yearsExperience) : "",
      website: (u.website as string)??"", linkedIn: (u.linkedIn as string)??"",
      twitter: (u.twitter as string)??"", facebook: (u.facebook as string)??"",
      coverImage: (u.coverImage as string)??null, image: (u.image as string)??null,
    });
    setSpecialties((u.specialties as string[])??[]);
    setCertifications((u.certifications as string[])??[]);
    setLanguages((u.languages as string[])??[]);
    setMediaPhotos((u.mediaPhotos as string[])??[]);
    setVoiceMemoUrl((u.voiceMemoUrl as string | null) ?? null);
    if (user?.id) {
      const svcs = await fetch(`/api/pros/${user.id}/services`).then(r => r.json()) as Service[];
      setServices(Array.isArray(svcs) ? svcs : []);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({...f, yearsExperience: f.yearsExperience||null, specialties, certifications, languages, mediaPhotos}),
    });
    if (res.ok && user) { dispatch(setUser({...user, name: f.name, bio: f.bio, headline: f.headline, coverImage: f.coverImage, image: f.image})); setSaved(true); setTimeout(()=>setSaved(false),3000); }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-20">
      {/* Cover */}
      <div className="px-0">
        <ImageUpload current={f.coverImage} type="cover" onUploaded={url=>setF(p=>({...p,coverImage:url}))} uploading={coverUploading} setUploading={setCoverUploading} />
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Identity row */}
        <div className="flex flex-col sm:flex-row items-end gap-4 -mt-12 mb-5">
          <ImageUpload current={f.image} type="avatar" onUploaded={url=>setF(p=>({...p,image:url}))} uploading={avatarUploading} setUploading={setAvatarUploading} />
          <div className="flex-1 pb-1">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-lg font-black text-[#0a1628]">{user?.name}</span>
            {user?.hasDueDiligenceBadge && <DueDiligenceBadge size={22} />}
            <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700"><BadgeCheck className="w-3 h-3"/>{user?.role==="ADMIN"?"Admin":"Professional"}</span>
          </div>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
          <div className="flex gap-2 pb-1">
            {user?.role==="PROFESSIONAL" && <Link href={`/find-a-pro/${user.id}`} className="text-xs font-bold border border-[#0a1628] text-[#0a1628] px-4 py-2 rounded-full hover:bg-[#0a1628] hover:text-white transition-all">Public Profile</Link>}
            <button onClick={save} disabled={saving} className="flex items-center gap-1.5 text-xs font-bold bg-[#0a1628] text-white px-5 py-2 rounded-full hover:bg-[#1a3a6b] transition-all disabled:opacity-40">
              {saving?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Tick02Icon className="w-3.5 h-3.5"/>}{saving?"Saving…":saved?"Saved!":"Save Changes"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-100 rounded-2xl p-1.5 mb-5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={()=>setTab(t)} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab===t?"bg-[#0a1628] text-white":"text-slate-500 hover:text-[#0a1628] hover:bg-slate-50"}`}>{t}</button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">

            {tab==="Basic" && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                <h2 className="font-black text-[#0a1628] text-sm uppercase tracking-widest flex items-center gap-2"><Edit01Icon className="w-4 h-4"/>Basic Information</h2>
                <div><label className={lbl}>Full Name</label><div className="relative"><UserCircleIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input value={f.name} onChange={field("name")} className={`${inp} pl-10`}/></div></div>
                <div><label className={lbl}>Email (locked)</label><div className="relative"><Mail01Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"/><input value={user?.email??""} disabled className={`${inp} pl-10 bg-slate-50 text-slate-400 cursor-not-allowed`}/></div></div>
                <div><label className={lbl}>Headline</label><div className="relative"><Briefcase01Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input value={f.headline} onChange={field("headline")} placeholder="e.g. Enrolled Agent | Tax Resolution Expert" className={`${inp} pl-10`} maxLength={100}/></div></div>
                <div><label className={lbl}>Bio</label><div className="relative"><NoteIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400"/><textarea value={f.bio} onChange={field("bio")} rows={4} placeholder="About yourself…" className={`${inp} pl-10 resize-none`} maxLength={600}/></div></div>
                {/* Voice Memo */}
                <div>
                  <label className={lbl}>Voice Intro</label>
                  <p className="text-xs text-slate-400 mb-3">Record a short voice intro (max 4 min) that plays directly on your public profile.</p>
                  <VoiceMemoEditor currentUrl={voiceMemoUrl} onSaved={setVoiceMemoUrl} />
                </div>
              </div>
            )}

            {tab==="Mission" && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="font-black text-[#0a1628] text-sm uppercase tracking-widest flex items-center gap-2 mb-4"><span className="w-1 h-4 bg-[#0a1628] rounded-full"/>My Mission</h2>
                <textarea value={f.mission} onChange={field("mission")} rows={5} placeholder="e.g. To help every tax professional navigate IRS issues with confidence…" className={`${inp} resize-none`} maxLength={400}/>
                <p className="text-[10px] text-slate-400 mt-1">{f.mission.length}/400 — displayed prominently on your public profile</p>
              </div>
            )}

            {tab==="Professional" && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                <h2 className="font-black text-[#0a1628] text-sm uppercase tracking-widest mb-1">Professional Details</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className={lbl}>Location</label><div className="relative"><MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input value={f.location} onChange={field("location")} placeholder="City, State" className={`${inp} pl-10`}/></div></div>
                  <div><label className={lbl}>Years of Experience</label><input type="number" value={f.yearsExperience} onChange={field("yearsExperience")} placeholder="e.g. 10" min={0} max={60} className={inp}/></div>
                </div>
                <div><label className={lbl}>Specialties (Enter to add)</label><TagInput value={specialties} onChange={setSpecialties} placeholder="e.g. Tax Resolution…"/></div>
                <div><label className={lbl}>Certifications</label><TagInput value={certifications} onChange={setCertifications} placeholder="e.g. EA, CPA…"/></div>
                <div><label className={lbl}>Languages</label><TagInput value={languages} onChange={setLanguages} placeholder="e.g. English, Spanish…"/></div>
              </div>
            )}

            {tab==="Social" && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                <h2 className="font-black text-[#0a1628] text-sm uppercase tracking-widest mb-1">Online Presence</h2>
                {([["Website","website",GlobeIcon,"https://yoursite.com"],["LinkedIn","linkedIn",Linkedin02Icon,"https://linkedin.com/in/…"],["Twitter / X","twitter",NewTwitterIcon,"@handle"],["Facebook","facebook",null,"https://facebook.com/…"]] as const).map(([label, key, Icon, ph]) => (
                  <div key={key as string}>
                    <label className={lbl}>{label}</label>
                    <div className="relative">
                      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>}
                      <input value={(f as Record<string, string>)[key as string]??""} onChange={e=>setF(p=>({...p,[key as string]:e.target.value}))} placeholder={ph as string} className={`${inp} ${Icon?"pl-10":""}`}/>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab==="Services" && user?.id && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="font-black text-[#0a1628] text-sm uppercase tracking-widest mb-1">Services I Offer</h2>
                <p className="text-xs text-slate-400 mb-4">Showcase what clients can hire you for — add pricing, descriptions, and icons.</p>
                <ServiceEditor proId={user.id} initial={services}/>
              </div>
            )}

            {tab==="Media" && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="font-black text-[#0a1628] text-sm uppercase tracking-widest mb-1">Photos &amp; Media</h2>
                <p className="text-xs text-slate-400 mb-4">Upload up to 12 photos shown on your public profile.</p>
                <MediaGallery photos={mediaPhotos} onChange={setMediaPhotos}/>
              </div>
            )}

            {tab==="Badges" && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="font-black text-[#0a1628] text-sm uppercase tracking-widest mb-1">My Achievements</h2>
                <p className="text-xs text-slate-400 mb-5">Complete activities to unlock badges. Earned badges appear next to your name across the platform.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Due Diligence Badge */}
                  {(() => {
                    const earned = user?.hasDueDiligenceBadge ?? false;
                    return (
                      <div className={`relative rounded-2xl border-2 p-5 flex items-center gap-4 transition-all ${
                        earned ? "border-amber-300 bg-amber-50/40" : "border-slate-100 bg-slate-50/50 opacity-60 grayscale"
                      }`}>
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${earned ? "bg-amber-100" : "bg-slate-100"}`}>
                          <img src="/due_dilligence_badge.webp" alt="Due Diligence Badge" className="w-12 h-12 object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-[#0a1628] text-sm">Due Diligence</span>
                            {earned && (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">✓ Earned</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {earned
                              ? "Earned! Visible next to your name on posts and your profile."
                              : "Complete any course or purchase any toolkit to unlock."}
                          </p>
                        </div>
                        {!earned && (
                          <div className="absolute top-3 right-3 text-slate-300">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {/* Future badges */}
                  {["Course Creator", "Community Leader", "Top Contributor"].map(name => (
                    <div key={name} className="relative rounded-2xl border-2 border-slate-100 bg-slate-50/50 opacity-40 grayscale p-5 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-2xl">🏆</div>
                      <div className="flex-1">
                        <div className="font-black text-[#0a1628] text-sm">{name}</div>
                        <p className="text-xs text-slate-400 mt-0.5">Coming soon</p>
                      </div>
                      <div className="absolute top-3 right-3 text-slate-300">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Quick Links</p>
              {([
                [BookOpen01Icon,"My Courses","/my-courses","text-indigo-500 bg-indigo-50"],
                [UserGroupIcon,"Connections","/connections","text-emerald-500 bg-emerald-50"],
                [CrownIcon,"Pros Directory","/pros","text-amber-500 bg-amber-50"],
              ] as const).map(([Icon,label,href,c])=>(
                <Link key={href} href={href} className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${c}`}><Icon className="w-4 h-4"/></span>{label}
                </Link>
              ))}
            </div>
            <div className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] rounded-2xl p-4 text-white">
              <p className="text-xs font-black uppercase tracking-widest text-white/50 mb-2">Pro Tip</p>
              <p className="text-sm font-semibold leading-snug">A complete profile with mission, services, and media gets 3× more inquiries from clients.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
