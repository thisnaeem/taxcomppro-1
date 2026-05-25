"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Briefcase, Globe, ArrowLeft, Loader2, MessageSquare, Users, BadgeCheck, Star, ExternalLink, ChevronRight } from "lucide-react";
import { Linkedin02Icon, NewTwitterIcon } from "hugeicons-react";
import { VoiceMemoPlayer } from "@/components/profile/VoiceMemo";

interface Course { id: string; slug: string; title: string; thumbnail: string|null; level: string; price: number; isFree: boolean; }
interface Service { id: string; title: string; description: string|null; price: string|null; emoji: string; }
interface Review { id: string; rating: number; content: string; createdAt: string; reviewer: { id: string; name: string; image: string|null; headline: string|null; }; }
interface Pro {
  id: string; name: string; image: string|null; coverImage: string|null; headline: string|null;
  bio: string|null; mission: string|null; location: string|null; yearsExperience: number|null;
  website: string|null; linkedIn: string|null; twitter: string|null; facebook: string|null;
  specialties: string[]; certifications: string[]; languages: string[]; mediaPhotos: string[];
  voiceMemoUrl: string | null;
  createdAt: string; instructorCourses: Course[];
}

const levelColors: Record<string,string> = { BEGINNER:"bg-emerald-100 text-emerald-700", INTERMEDIATE:"bg-blue-100 text-blue-700", ADVANCED:"bg-purple-100 text-purple-700" };

function StarRow({ rating }: { rating: number }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} className={`w-3.5 h-3.5 ${i<=rating?"fill-amber-400 text-amber-400":"text-slate-200"}`}/>)}</div>;
}

export default function ProProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pro,      setPro]      = useState<Pro|null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews,  setReviews]  = useState<Review[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [lightbox, setLightbox] = useState<string|null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/pros/${id}`).then(r => r.ok ? r.json() as Promise<Pro> : Promise.reject()),
      fetch(`/api/pros/${id}/services`).then(r => r.json() as Promise<Service[]>),
      fetch(`/api/pros/${id}/reviews`).then(r => r.json() as Promise<Review[]>),
    ]).then(([p, s, rv]) => {
      const safePro: Pro = {
        ...p,
        specialties:     p.specialties     ?? [],
        certifications:  p.certifications  ?? [],
        languages:       p.languages       ?? [],
        mediaPhotos:     p.mediaPhotos      ?? [],
        instructorCourses: p.instructorCourses ?? [],
      };
      setPro(safePro);
      setServices(Array.isArray(s) ? s : []);
      setReviews(Array.isArray(rv) ? rv : []);
    })
      .catch(() => router.push("/find-a-pro"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb]"><Loader2 className="w-8 h-8 animate-spin text-[#0a1628]"/></div>;
  if (!pro) return null;

  const avgRating = reviews.length ? (reviews.reduce((a,r)=>a+r.rating,0)/reviews.length).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={()=>setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain"/>
        </div>
      )}

      {/* Hero cover */}
      <div className="relative h-64 bg-gradient-to-br from-[#0a1628] via-[#1a3a6b] to-[#0f2d52] overflow-hidden">
        {pro.coverImage && <img src={pro.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40"/>}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle,white 1px,transparent 1px)",backgroundSize:"28px 28px"}}/>
        <button onClick={()=>router.back()} className="absolute top-5 left-5 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm font-medium border border-white/20 transition-all">
          <ArrowLeft className="w-4 h-4"/> Back
        </button>
        {pro.certifications.length>0 && (
          <div className="absolute top-5 right-5 flex gap-2">
            {pro.certifications.map(c=>(
              <span key={c} className="flex items-center gap-1 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm"><BadgeCheck className="w-3 h-3"/>{c}</span>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Identity card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 -mt-16 relative z-10 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative -mt-16 sm:-mt-20 shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] overflow-hidden shadow-xl flex items-center justify-center">
                {pro.image ? <img src={pro.image} alt={pro.name} referrerPolicy="no-referrer" className="w-full h-full object-cover"/> : <span className="text-white font-black text-4xl">{pro.name[0]}</span>}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full p-1 border-2 border-white shadow"><BadgeCheck className="w-3.5 h-3.5 text-white"/></div>
            </div>
            <div className="flex-1 min-w-0 pt-1 sm:pt-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl font-black text-[#0a1628]">{pro.name}</h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full"><BadgeCheck className="w-3 h-3"/>Verified Professional</span>
                {avgRating && <span className="flex items-center gap-1 text-xs font-bold text-amber-600"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>{avgRating} ({reviews.length})</span>}
              </div>
              {pro.headline && <p className="text-slate-600 font-semibold text-sm mb-3">{pro.headline}</p>}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                {pro.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/>{pro.location}</span>}
                {pro.yearsExperience && <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5"/>{pro.yearsExperience}+ years exp</span>}
                {pro.languages.length>0 && <span>🗣 {pro.languages.join(", ")}</span>}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto shrink-0">
              <Link href={`/messages?user=${pro.id}`} className="flex items-center justify-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#1a3a6b] transition-all shadow-md"><MessageSquare className="w-4 h-4"/>Message</Link>
              <Link href={`/connections?add=${pro.id}`} className="flex items-center justify-center gap-2 border-2 border-[#0a1628] text-[#0a1628] font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#0a1628] hover:text-white transition-all"><Users className="w-4 h-4"/>Connect</Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 pb-20">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5">
            {/* Voice Memo */}
            {pro.voiceMemoUrl && (
              <VoiceMemoPlayer url={pro.voiceMemoUrl} name={pro.name} />
            )}
            {pro.bio && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="text-sm font-black text-[#0a1628] uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-[#0a1628] rounded-full"/>About</h2>
                <p className="text-slate-600 text-sm leading-7 whitespace-pre-line">{pro.bio}</p>
              </div>
            )}
            {pro.mission && (
              <div className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] rounded-2xl p-6 text-white">
                <h2 className="text-sm font-black uppercase tracking-widest mb-3 text-white/60">My Mission</h2>
                <p className="text-white text-base font-semibold leading-relaxed italic">"{pro.mission}"</p>
              </div>
            )}
            {services.length>0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="text-sm font-black text-[#0a1628] uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-emerald-500 rounded-full"/>Services Offered</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {services.map(s=>(
                    <div key={s.id} className="flex gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all">
                      <span className="text-2xl shrink-0">{s.emoji}</span>
                      <div>
                        <p className="font-bold text-[#0a1628] text-sm">{s.title}</p>
                        {s.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{s.description}</p>}
                        {s.price && <p className="text-xs font-bold text-emerald-600 mt-1.5">{s.price}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <Link href={`/messages?user=${pro.id}`} className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#0a1628]/5 hover:bg-[#0a1628]/10 text-[#0a1628] text-xs font-bold transition-all">
                  Inquire about services <ChevronRight className="w-3.5 h-3.5"/>
                </Link>
              </div>
            )}
            {pro.specialties.length>0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="text-sm font-black text-[#0a1628] uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-[#0a1628] rounded-full"/>Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {pro.specialties.map(s=><span key={s} className="px-4 py-2 bg-[#0a1628]/5 hover:bg-[#0a1628]/10 text-[#0a1628] text-sm font-semibold rounded-xl transition-colors border border-[#0a1628]/8">{s}</span>)}
                </div>
              </div>
            )}
            {pro.certifications.length>0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="text-sm font-black text-[#0a1628] uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-amber-400 rounded-full"/>Credentials</h2>
                <div className="flex flex-wrap gap-3">
                  {pro.certifications.map(c=>(
                    <div key={c} className="flex items-center gap-2 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 px-4 py-2.5 rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shrink-0"><BadgeCheck className="w-3.5 h-3.5 text-white"/></div>
                      <div><p className="text-xs font-black text-amber-800">{c}</p><p className="text-[10px] text-amber-600">Verified</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {reviews.length>0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black text-[#0a1628] uppercase tracking-widest flex items-center gap-2"><span className="w-1 h-4 bg-amber-400 rounded-full"/>Reviews</h2>
                  {avgRating && <span className="flex items-center gap-1.5 text-sm font-black text-amber-600"><Star className="w-4 h-4 fill-amber-400 text-amber-400"/>{avgRating} · {reviews.length} reviews</span>}
                </div>
                <div className="space-y-4">
                  {reviews.map(r=>(
                    <div key={r.id} className="flex gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-9 h-9 rounded-full bg-[#0a1628] overflow-hidden flex items-center justify-center shrink-0 shadow">
                        {r.reviewer.image ? <img src={r.reviewer.image} alt={r.reviewer.name} referrerPolicy="no-referrer" className="w-full h-full object-cover"/> : <span className="text-white font-black text-sm">{r.reviewer.name[0]}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div>
                            <span className="text-xs font-bold text-[#0a1628]">{r.reviewer.name}</span>
                            {r.reviewer.headline && <span className="text-[10px] text-slate-400 ml-2">{r.reviewer.headline}</span>}
                          </div>
                          <StarRow rating={r.rating}/>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{r.content}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pro.mediaPhotos.length>0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="text-sm font-black text-[#0a1628] uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-indigo-500 rounded-full"/>Photos &amp; Media</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {pro.mediaPhotos.map((p,i)=>(
                    <button key={i} onClick={()=>setLightbox(p)} className="aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity">
                      <img src={p} alt="" className="w-full h-full object-cover"/>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {pro.instructorCourses.length>0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="text-sm font-black text-[#0a1628] uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-indigo-500 rounded-full"/>Courses by {pro.name.split(" ")[0]}</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {pro.instructorCourses.map(c=>(
                    <Link key={c.id} href={`/courses/${c.slug}`} className="group flex gap-3.5 p-4 rounded-xl border border-slate-100 hover:border-[#0a1628]/20 hover:shadow-md transition-all bg-slate-50/50 hover:bg-white">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] overflow-hidden shrink-0 shadow-sm">
                        {c.thumbnail ? <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-white font-black">{c.title[0]}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0a1628] line-clamp-2 leading-snug group-hover:text-[#1a3a6b] transition-colors">{c.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelColors[c.level]??"bg-slate-100 text-slate-600"}`}>{c.level}</span>
                          <span className="text-[10px] font-bold text-slate-500">{c.isFree?"Free":`$${c.price}`}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Overview</h3>
              <div className="space-y-3">
                {pro.yearsExperience && <div className="flex items-center justify-between"><span className="text-sm text-slate-500 flex items-center gap-2"><Briefcase className="w-3.5 h-3.5"/>Experience</span><span className="text-sm font-black text-[#0a1628]">{pro.yearsExperience}+ yrs</span></div>}
                {pro.certifications.length>0 && <div className="flex items-center justify-between"><span className="text-sm text-slate-500 flex items-center gap-2"><BadgeCheck className="w-3.5 h-3.5"/>Credentials</span><span className="text-sm font-black text-[#0a1628]">{pro.certifications.join(", ")}</span></div>}
                {services.length>0 && <div className="flex items-center justify-between"><span className="text-sm text-slate-500">Services</span><span className="text-sm font-black text-[#0a1628]">{services.length}</span></div>}
                {pro.instructorCourses.length>0 && <div className="flex items-center justify-between"><span className="text-sm text-slate-500">Courses</span><span className="text-sm font-black text-[#0a1628]">{pro.instructorCourses.length}</span></div>}
                {avgRating && <div className="flex items-center justify-between"><span className="text-sm text-slate-500">Rating</span><span className="text-sm font-black text-amber-600 flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>{avgRating}</span></div>}
                <div className="flex items-center justify-between"><span className="text-sm text-slate-500">Member since</span><span className="text-sm font-black text-[#0a1628]">{new Date(pro.createdAt).getFullYear()}</span></div>
              </div>
            </div>
            {(pro.website||pro.linkedIn||pro.twitter||pro.facebook) && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Online</h3>
                <div className="space-y-2">
                  {pro.website && <a href={pro.website.startsWith("http")?pro.website:`https://${pro.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"><div className="w-8 h-8 rounded-lg bg-[#0a1628]/8 flex items-center justify-center shrink-0"><Globe className="w-4 h-4 text-[#0a1628]"/></div><span className="text-xs font-semibold text-slate-600 group-hover:text-[#0a1628] truncate flex-1">{pro.website.replace(/^https?:\/\//,"")}</span><ExternalLink className="w-3 h-3 text-slate-400 shrink-0"/></a>}
                  {pro.linkedIn && <a href={pro.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 transition-colors group"><div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"><Linkedin02Icon className="w-4 h-4 text-blue-700"/></div><span className="text-xs font-semibold text-slate-600 group-hover:text-blue-700 flex-1">LinkedIn</span><ExternalLink className="w-3 h-3 text-slate-400 shrink-0"/></a>}
                  {pro.twitter && <a href={`https://twitter.com/${pro.twitter.replace("@","")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-sky-50 transition-colors group"><div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0"><NewTwitterIcon className="w-4 h-4 text-sky-600"/></div><span className="text-xs font-semibold text-slate-600 group-hover:text-sky-600 flex-1">@{pro.twitter.replace("@","")}</span><ExternalLink className="w-3 h-3 text-slate-400 shrink-0"/></a>}
                  {pro.facebook && <a href={pro.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 transition-colors group"><div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"><span className="text-blue-700 font-black text-sm">f</span></div><span className="text-xs font-semibold text-slate-600 group-hover:text-blue-700 flex-1">Facebook</span><ExternalLink className="w-3 h-3 text-slate-400 shrink-0"/></a>}
                </div>
              </div>
            )}
            <div className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] rounded-2xl p-5 text-white text-center">
              <p className="font-black text-base mb-1">Work with {pro.name.split(" ")[0]}</p>
              <p className="text-white/60 text-xs mb-4">Send a message to get started</p>
              <Link href={`/messages?user=${pro.id}`} className="block w-full py-2.5 bg-[#f0c040] text-[#0a1628] font-bold text-sm rounded-xl hover:bg-[#d4a017] transition-all">Send Message</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
