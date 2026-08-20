"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import {
  ArrowLeft, BookOpen, CheckCircle2, ChevronDown, ChevronUp,
  Clock, GraduationCap, Loader2, Lock, Play, Users,
  PlayCircle, Star, FileText, HelpCircle, Award,
} from "lucide-react";

interface Lesson { id:string; title:string; duration:number; order:number; isFree:boolean; videoUrl:string|null; contentType:"VIDEO"|"TEXT"|"QUIZ"; }
interface Section { id:string; title:string; order:number; lessons:Lesson[]; }
interface Rating { id:string; rating:number; review:string|null; createdAt:string; user:{ name:string; image:string|null }; userId:string; }
interface Course {
  id:string; slug:string; title:string; description:string; thumbnail:string|null;
  level:string; category:string; price:number; isFree:boolean; totalDuration:number;
  tags:string[]; learningOutcomes:string[]; requirements:string[];
  instructor:{ id:string; name:string; image:string|null; headline:string|null; role?:string };
  sections:Section[]; _count:{ enrollments:number };
  totalLessons:number; isEnrolled:boolean; completedLessonIds:string[]; progressPercent:number;
  ratings:Rating[]; avgRating:number; ratingCount:number; userRating:Rating|null;
}

const LEVEL_COLOR: Record<string,string> = {
  BEGINNER:"bg-emerald-100 text-emerald-700", INTERMEDIATE:"bg-blue-100 text-blue-700", ADVANCED:"bg-purple-100 text-purple-700"
};
const CT_ICONS = { VIDEO: Play, TEXT: FileText, QUIZ: HelpCircle };

function fmtDur(s:number) { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60); return h>0?`${h}h ${m}m`:`${m}m`; }
function Stars({ value, size="sm" }: { value:number; size?:"sm"|"lg" }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map(i=>(
        <Star key={i} className={`${size==="lg"?"w-5 h-5":"w-3.5 h-3.5"} ${i<=Math.round(value)?"fill-[#f0c040] text-[#f0c040]":"fill-slate-200 text-slate-200"}`}/>
      ))}
    </span>
  );
}

export default function CourseDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-[#d4a017] animate-spin" />
      </div>
    }>
      <CourseDetailContent />
    </Suspense>
  );
}

function CourseDetailContent() {
  const { slug } = useParams<{ slug:string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const [course, setCourse]         = useState<Course|null>(null);
  const [loading, setLoading]       = useState(true);
  const [enrolling, setEnrolling]   = useState(false);
  const [enrolled, setEnrolled]     = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [openSec, setOpenSec]       = useState<Set<string>>(new Set());
  const [allOpen, setAllOpen]       = useState(false);
  const [toastMsg, setToastMsg]     = useState("");
  const searchParams = useSearchParams();

  // Rating state
  const [myRating, setMyRating]     = useState(0);
  const [myReview, setMyReview]     = useState("");
  const [ratingSubmitting, setRS]   = useState(false);
  const [ratingDone, setRD]         = useState(false);

  // Coupon & Referral state
  const [couponInput,      setCouponInput]      = useState("");
  const [appliedCoupon,    setAppliedCoupon]    = useState<{
    code: string; discountType: string; discountValue: number;
    originalPrice: number; discountedPrice: number; savings: number; label: string;
  } | null>(null);
  const [couponError,      setCouponError]      = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [refCode,          setRefCode]          = useState("");

  const applyPromo = async (codeToApply: string, cSlug?: string) => {
    const s = cSlug ?? slug;
    if (!codeToApply.trim() || !s) return;
    setValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToApply, courseSlug: s }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon(data);
        setCouponInput(data.code);
      } else {
        setCouponError(data.error || "Invalid promo code");
      }
    } catch {
      setCouponError("Failed to apply promo code");
    } finally {
      setValidatingCoupon(false);
    }
  };

  useEffect(() => {
    if (!slug) return;
    const qCoupon = searchParams.get("coupon");
    const qRef = searchParams.get("ref");
    if (qRef) setRefCode(qRef);

    fetch(`/api/courses/${slug}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        if (!d) return;
        setCourse(d); setEnrolled(d.isEnrolled);
        if (d.sections?.length) setOpenSec(new Set([d.sections[0].id]));
        if (d.userRating) { setMyRating(d.userRating.rating); setMyReview(d.userRating.review??"")}
        if (qCoupon && !d.isFree && d.price > 0) {
          applyPromo(qCoupon, d.slug);
        }
      })
      .finally(()=>setLoading(false));
  }, [slug, searchParams]);

  // Handle return from Stripe for paid course — verify payment and create enrollment
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || !slug) return;
    // Clean URL
    window.history.replaceState({}, "", `/courses/${slug}`);
    setCheckoutLoading(true);
    fetch("/api/stripe/verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(r => r.json())
      .then(() => {
        return fetch(`/api/courses/${slug}`).then(r => r.ok ? r.json() : null);
      })
      .then(d => {
        if (!d) return;
        setCourse(d); setEnrolled(d.isEnrolled);
        showToast("🎉 Purchase complete! Start learning now.");
      })
      .catch(() => {})
      .finally(() => setCheckoutLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSec = (id:string) => setOpenSec(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll = () => {
    if (allOpen) { setOpenSec(new Set()); setAllOpen(false); }
    else { setOpenSec(new Set(course?.sections.map(s=>s.id)??[])); setAllOpen(true); }
  };
  const showToast = (msg:string) => { setToastMsg(msg); setTimeout(()=>setToastMsg(""),3000); };

  const handleEnroll = async () => {
    if (!session) { router.push(`/login?callbackUrl=/courses/${slug}`); return; }
    if (enrolled) { router.push(`/courses/${slug}/learn`); return; }

    const finalPrice = appliedCoupon ? appliedCoupon.discountedPrice : (course?.price ?? 0);

    if (course && !course.isFree && finalPrice > 0) {
      setCheckoutLoading(true);
      try {
        const res = await fetch("/api/stripe/course-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            couponCode: appliedCoupon?.code,
            refCode: refCode || undefined,
          }),
        });
        const data = await res.json() as { url?: string; error?: string; alreadyEnrolled?: boolean; success?: boolean };
        if (data.alreadyEnrolled || data.success) {
          setEnrolled(true);
          router.push(`/courses/${slug}/learn`);
          return;
        }
        if (data.url) { window.location.href = data.url; return; }
        showToast(data.error ?? "Could not initiate checkout.");
      } finally {
        setCheckoutLoading(false);
      }
      return;
    }

    setEnrolling(true);
    try {
      const res = await fetch(`/api/courses/${slug}/enroll`,{method:"POST"});
      if (res.ok) {
        setEnrolled(true);
        showToast("🎉 Enrolled! Start learning now.");
        setCourse(prev=>prev?{...prev,isEnrolled:true,_count:{enrollments:prev._count.enrollments+1}}:prev);
      } else { const e=await res.json(); showToast(e.error??"Something went wrong."); }
    } finally { setEnrolling(false); }
  };

  const submitRating = async () => {
    if (!myRating) return;
    setRS(true);
    try {
      const res = await fetch(`/api/courses/${slug}/rate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rating:myRating,review:myReview})});
      if (res.ok) { setRD(true); showToast("⭐ Rating submitted!"); }
    } finally { setRS(false); }
  };

  if (loading || checkoutLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-[#d4a017] animate-spin mx-auto mb-2"/>
        {checkoutLoading && <p className="text-sm text-slate-500">Activating your enrollment…</p>}
      </div>
    </div>
  );
  if (!course) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
      <GraduationCap className="w-14 h-14 text-slate-200"/>
      <p className="text-slate-500 font-bold">Course not found</p>
      <Link href="/courses" className="text-[#d4a017] font-bold text-sm hover:underline">← Back to Courses</Link>
    </div>
  );

  const totalLessons = course.sections.reduce((s,sec)=>s+sec.lessons.length,0);

  return (
    <div className="min-h-screen bg-slate-50">
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0a1628] text-white text-sm font-semibold px-6 py-3 rounded-full shadow-xl animate-bounce">{toastMsg}</div>
      )}

      <div className="max-w-6xl mx-auto px-6">
        <div className="pt-6">
          <Link href="/courses" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#0a1628] text-base font-medium transition-colors">
            <ArrowLeft className="w-4 h-4"/> All Courses
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-6 pb-16">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${LEVEL_COLOR[course.level]??LEVEL_COLOR.BEGINNER}`}>{course.level}</span>
                <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full">{course.category}</span>
                {course.avgRating>0 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-[#0a1628] bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-[#f0c040] text-[#f0c040]"/>{course.avgRating} ({course.ratingCount})
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black text-[#0a1628] mb-3 leading-tight">{course.title}</h1>
              <p className="text-slate-600 text-base leading-relaxed">{course.description}</p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl mb-8">
              <div className="w-12 h-12 rounded-full bg-[#0a1628] flex items-center justify-center overflow-hidden shrink-0">
                {course.instructor.image
                  ? <img src={course.instructor.image} alt={course.instructor.name} className="w-full h-full object-cover"/>
                  : <span className="text-white font-bold text-lg">{course.instructor.name[0]}</span>}
              </div>
              <div>
                <div className="font-bold text-[#0a1628] text-base">{course.instructor.name}</div>
                <div className="text-sm text-slate-500">{course.instructor.headline ?? "Course Instructor"}</div>
              </div>
            </div>

            {course.learningOutcomes.length>0 && (
              <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
                <h2 className="text-lg font-black text-[#0a1628] mb-4">What you&apos;ll learn</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.learningOutcomes.map((item,i)=>(
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/>
                      <span className="text-sm text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black text-[#0a1628]">Course Curriculum</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{course.sections.length} sections • {totalLessons} lessons • {fmtDur(course.totalDuration)} total</p>
                </div>
                <button onClick={toggleAll} className="text-xs font-bold text-[#d4a017] hover:underline">
                  {allOpen?"Collapse all":"Expand all"}
                </button>
              </div>

              <div className="space-y-3">
                {course.sections.map((sec,si)=>{
                  const isOpen = openSec.has(sec.id);
                  const secDur = sec.lessons.reduce((s,l)=>s+l.duration,0);
                  return (
                    <div key={sec.id} className="border border-slate-100 rounded-xl overflow-hidden">
                      <button onClick={()=>toggleSec(sec.id)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#0a1628] text-white text-xs font-bold flex items-center justify-center shrink-0">{si+1}</span>
                          <span className="font-bold text-[#0a1628] text-sm">{sec.title}</span>
                          <span className="text-xs text-slate-400">({sec.lessons.length} lessons)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {secDur>0 && <span className="text-xs text-slate-400">{fmtDur(secDur)}</span>}
                          {isOpen?<ChevronUp className="w-4 h-4 text-slate-400"/>:<ChevronDown className="w-4 h-4 text-slate-400"/>}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="divide-y divide-slate-50 bg-white">
                          {sec.lessons.map((lesson,li)=>{
                            const Icon = CT_ICONS[lesson.contentType] ?? Play;
                            const isComp = course.completedLessonIds.includes(lesson.id);
                            return (
                              <div key={lesson.id} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                  {isComp ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/> : <Icon className="w-4 h-4 text-slate-400 shrink-0"/>}
                                  <span className={`text-slate-700 ${isComp?"line-through text-slate-400":""}`}>
                                    {li+1}. {lesson.title}
                                  </span>
                                  {lesson.isFree && !enrolled && (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Free Preview</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {lesson.duration>0 && <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/>{fmtDur(lesson.duration)}</span>}
                                  {!lesson.isFree && !enrolled && <Lock className="w-3.5 h-3.5 text-slate-300"/>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {course.requirements.length>0 && (
              <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
                <h2 className="text-lg font-black text-[#0a1628] mb-3">Requirements</h2>
                <ul className="space-y-1.5 list-disc list-inside text-sm text-slate-600">
                  {course.requirements.map((r,i)=><li key={i}>{r}</li>)}
                </ul>
              </section>
            )}

            <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-black text-[#0a1628]">Student Reviews</h2>
                  {course.ratingCount>0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <Stars value={course.avgRating} size="lg"/>
                      <span className="font-bold text-[#0a1628] text-base">{course.avgRating}</span>
                      <span className="text-xs text-slate-400">({course.ratingCount} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
              {enrolled && !ratingDone && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5">
                  <p className="font-bold text-[#0a1628] text-base mb-3">Leave a rating</p>
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(s=>(
                      <button key={s} onClick={()=>setMyRating(s)}>
                        <Star className={`w-7 h-7 transition-all ${s<=myRating?"fill-[#f0c040] text-[#f0c040]":"text-slate-200 hover:text-[#f0c040]"}`}/>
                      </button>
                    ))}
                  </div>
                  <textarea value={myReview} onChange={e=>setMyReview(e.target.value)} rows={3} placeholder="Share your experience…"
                    className="w-full font-[inherit] text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#0a1628] resize-none mb-3"/>
                  <button onClick={submitRating} disabled={!myRating||ratingSubmitting}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-bold px-5 py-2.5 rounded-xl hover:shadow disabled:opacity-40 transition-all text-sm">
                    {ratingSubmitting?<Loader2 className="w-4 h-4 animate-spin"/>:<Star className="w-4 h-4"/>}
                    Submit Rating
                  </button>
                </div>
              )}
            </section>

            {!enrolled && (
              <div className="bg-gradient-to-r from-[#0a1628] to-[#1a3a6b] rounded-2xl p-8 text-white text-center mb-10">
                <GraduationCap className="w-12 h-12 text-[#f0c040] mx-auto mb-4"/>
                <h3 className="text-2xl font-black mb-2">Ready to get started?</h3>
                <p className="text-white/60 text-lg mb-5">
                  {course.isFree ? "This course is completely free." : appliedCoupon ? `Enroll with discount for just $${appliedCoupon.discountedPrice} (${appliedCoupon.label}).` : `Enroll for just $${course.price}.`}
                </p>
                <button onClick={handleEnroll} disabled={enrolling}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-black px-8 py-3.5 rounded-xl hover:shadow-lg transition-all disabled:opacity-60">
                  {enrolling?<Loader2 className="w-4 h-4 animate-spin"/>:<GraduationCap className="w-4 h-4"/>}
                  {session?"Enroll Now":"Sign In to Enroll"}
                </button>
              </div>
            )}
          </div>

          <div className="sticky top-6 self-start">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
              <div className="relative w-full h-72 sm:h-80 bg-gradient-to-br from-[#1a3a6b] to-[#0a1628] flex items-center justify-center p-4 overflow-hidden">
                {course.thumbnail
                  ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-contain drop-shadow-xl" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}/>
                  : <div className="absolute inset-0 flex items-center justify-center"><GraduationCap className="w-16 h-16 text-white/15"/></div>}
              </div>
              <div className="p-5 space-y-4">
                <div>
                  {session ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        {appliedCoupon && appliedCoupon.savings > 0 ? (
                          <>
                            <span className="text-3xl font-black text-emerald-600">${appliedCoupon.discountedPrice}</span>
                            <span className="text-lg text-slate-400 line-through">${appliedCoupon.originalPrice}</span>
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full ml-auto">{appliedCoupon.label}</span>
                          </>
                        ) : (
                          <div className="text-3xl font-black text-[#0a1628]">{course.isFree ? <span className="text-emerald-600">Free</span> : <>${course.price}</>}</div>
                        )}
                      </div>
                      {appliedCoupon && (
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                          <span className="truncate">Promo {appliedCoupon.code} applied (-${appliedCoupon.savings.toFixed(2)})</span>
                          <button type="button" onClick={() => { setAppliedCoupon(null); setCouponInput(""); }} className="text-slate-400 hover:text-red-500 p-0.5 ml-2">✕</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-sm font-semibold text-slate-500">Sign in to see price</span>
                    </div>
                  )}
                </div>
                {!course.isFree && course.price > 0 && !appliedCoupon && (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input type="text" placeholder="Promo code?" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyPromo(couponInput); } }}
                        className="flex-1 text-xs font-bold uppercase tracking-wider border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#0a1628] bg-slate-50" />
                      <button type="button" onClick={() => applyPromo(couponInput)} disabled={validatingCoupon || !couponInput.trim()}
                        className="px-3.5 py-2 text-xs font-bold bg-[#0a1628] hover:bg-[#1a3a6b] text-white rounded-xl transition-all disabled:opacity-50">
                        {validatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] font-bold text-red-500">{couponError}</p>}
                  </div>
                )}
                {enrolled && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Progress</span><span className="font-bold">{course.progressPercent}%</span></div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#f0c040] to-[#d4a017] rounded-full transition-all" style={{width:`${course.progressPercent}%`}}/>
                    </div>
                  </div>
                )}
                <button onClick={handleEnroll} disabled={enrolling || checkoutLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-black py-3.5 rounded-xl hover:shadow-lg transition-all disabled:opacity-60 text-base">
                  {(enrolling || checkoutLoading) ? <Loader2 className="w-5 h-5 animate-spin"/> : enrolled ? <PlayCircle className="w-5 h-5"/> : <GraduationCap className="w-5 h-5"/>}
                  {(enrolling || checkoutLoading) ? (enrolled ? "Starting…" : "Processing…") : enrolled ? (course.progressPercent>0?"Continue Learning":"Start Course") : session ? (course.isFree ? "Enroll Free" : `Buy Now — $${appliedCoupon ? appliedCoupon.discountedPrice : course.price}`) : "Sign In to Enroll"}
                </button>
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  {[ { icon:BookOpen, text:`${totalLessons} on-demand lessons` }, { icon:Award, text:"Certificate on completion" }, { icon:CheckCircle2, text:"Full lifetime access" }, { icon:Users, text:`${course._count.enrollments} fellow learners` }, ].map(({icon:Icon,text})=>(
                    <div key={text} className="flex items-center gap-2 text-base text-slate-600">
                      <Icon className="w-4 h-4 text-[#d4a017] shrink-0"/>{text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
