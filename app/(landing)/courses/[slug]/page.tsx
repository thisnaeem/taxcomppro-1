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
  instructor:{ id:string; name:string; image:string|null; headline:string|null };
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

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/courses/${slug}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        if (!d) return;
        setCourse(d); setEnrolled(d.isEnrolled);
        if (d.sections?.length) setOpenSec(new Set([d.sections[0].id]));
        if (d.userRating) { setMyRating(d.userRating.rating); setMyReview(d.userRating.review??"")}
      })
      .finally(()=>setLoading(false));
  }, [slug]);

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
        // Refresh course data so isEnrolled flips to true
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

    // Paid course — go through Stripe
    if (course && !course.isFree && course.price > 0) {
      setCheckoutLoading(true);
      try {
        const res = await fetch("/api/stripe/course-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        const data = await res.json() as { url?: string; error?: string; alreadyEnrolled?: boolean };
        if (data.alreadyEnrolled) {
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

    // Free course — enroll directly
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
      if (res.ok) { setRD(true); showToast("â­ Rating submitted!"); }
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
      <Link href="/courses" className="text-[#d4a017] font-bold text-sm hover:underline">â† Back to Courses</Link>
    </div>
  );

  const totalLessons = course.sections.reduce((s,sec)=>s+sec.lessons.length,0);

  return (
    <div className="min-h-screen bg-slate-50">
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0a1628] text-white text-sm font-semibold px-6 py-3 rounded-full shadow-xl animate-bounce">{toastMsg}</div>
      )}

      <div className="max-w-6xl mx-auto px-6">
        {/* Back link */}
        <div className="pt-6 pb-0">
          <Link href="/courses" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#0a1628] text-base font-medium transition-colors">
            <ArrowLeft className="w-4 h-4"/> All Courses
          </Link>
        </div>

        {/* Single grid spanning full page â€” card column is sticky */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start py-8">

          {/* â”€â”€ LEFT COLUMN: hero info + all body content â”€â”€ */}
          <div className="lg:col-span-2 space-y-10">

            {/* Hero info block */}
            <div className="bg-[#0a1628] text-white rounded-2xl px-8 py-10">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${LEVEL_COLOR[course.level]??""}`}>
                  {course.level.charAt(0)+course.level.slice(1).toLowerCase()}
                </span>
                <span className="text-[#f0c040] text-sm font-semibold uppercase tracking-wider">{course.category}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">{course.title}</h1>
              <p className="text-white/65 text-lg mb-5 leading-relaxed">{course.description}</p>

              {course.ratingCount > 0 && (
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-[#f0c040] font-black text-xl">{course.avgRating}</span>
                  <Stars value={course.avgRating} size="sm"/>
                  <span className="text-white/40 text-base">({course.ratingCount} rating{course.ratingCount!==1?"s":""})</span>
                </div>
              )}

              <div className="flex flex-wrap gap-5 text-base text-white/55 mb-6">
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-[#f0c040]"/>{totalLessons} lessons</span>
                {course.totalDuration>0 && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#f0c040]"/>{fmtDur(course.totalDuration)}</span>}
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-[#f0c040]"/>{course._count.enrollments} enrolled</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1a3a6b] overflow-hidden flex items-center justify-center shrink-0">
                  {course.instructor.image
                    ? <img src={course.instructor.image} alt={course.instructor.name} className="w-full h-full object-cover"/>
                    : <span className="text-white font-black text-base">{course.instructor.name[0]}</span>}
                </div>
                <div>
                  <div className="text-white font-bold text-base">{course.instructor.name}</div>
                  {course.instructor.headline && <div className="text-white/45 text-sm">{course.instructor.headline}</div>}
                </div>
              </div>
            </div>

            {/* What You'll Learn */}
            {course.learningOutcomes.length > 0 && (
              <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <h2 className="text-2xl font-black text-[#0a1628] mb-4">What you&apos;ll learn</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.learningOutcomes.map((item,i)=>(
                    <div key={i} className="flex items-start gap-2.5 text-base text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-[#d4a017] shrink-0 mt-0.5"/>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Requirements */}
            {course.requirements.length > 0 && (
              <section>
                <h2 className="text-2xl font-black text-[#0a1628] mb-3">Requirements</h2>
                <ul className="space-y-2">
                  {course.requirements.map((r,i)=>(
                    <li key={i} className="flex items-start gap-2 text-base text-slate-600">
                      <span className="text-[#d4a017] mt-0.5">â€¢</span>{r}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Course Content */}
            <section>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <h2 className="text-2xl font-black text-[#0a1628]">Course content</h2>
                  <p className="text-slate-500 text-base mt-0.5">
                    {course.sections.length} section{course.sections.length!==1?"s":""} Â· {totalLessons} lecture{totalLessons!==1?"s":""}
                    {course.totalDuration>0&&` Â· ${fmtDur(course.totalDuration)} total length`}
                  </p>
                </div>
                <button onClick={toggleAll} className="text-base font-bold text-[#1a3a6b] hover:underline whitespace-nowrap">
                  {allOpen?"Collapse all sections":"Expand all sections"}
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                {course.sections.map(section=>{
                  const isOpen = openSec.has(section.id);
                  const secDur = section.lessons.reduce((s,l)=>s+l.duration,0);
                  return (
                    <div key={section.id}>
                      <button onClick={()=>toggleSec(section.id)}
                        className="w-full flex items-center gap-3 px-4 py-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-500 shrink-0"/> : <ChevronDown className="w-5 h-5 text-slate-500 shrink-0"/>}
                        <span className="flex-1 font-bold text-[#0a1628] text-base">{section.title}</span>
                        <span className="text-sm text-slate-400 shrink-0">
                          {section.lessons.length} lecture{section.lessons.length!==1?"s":""}
                          {secDur>0&&` Â· ${fmtDur(secDur)}`}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="bg-white divide-y divide-slate-50">
                          {section.lessons.map(lesson=>{
                            const isCompleted = course.completedLessonIds.includes(lesson.id);
                            const canPlay = enrolled || lesson.isFree;
                            const LIcon = CT_ICONS[lesson.contentType]??Play;
                            return (
                              <div key={lesson.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                                <div className="shrink-0 w-5 flex justify-center">
                                  {isCompleted
                                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500"/>
                                    : <LIcon className={`w-4 h-4 ${canPlay?"text-[#1a3a6b]":"text-slate-300"}`}/>}
                                </div>
                                <span className={`flex-1 text-base ${isCompleted?"text-slate-400 line-through":"text-slate-700"}`}>
                                  {lesson.title}
                                </span>
                                <div className="flex items-center gap-2 shrink-0">
                                  {lesson.isFree && !enrolled && (
                                    <Link href={`/courses/${slug}/learn`}
                                      className="text-sm font-bold text-[#1a3a6b] hover:underline flex items-center gap-1">
                                      <Play className="w-3.5 h-3.5"/> Preview
                                    </Link>
                                  )}
                                  {!canPlay && <Lock className="w-3.5 h-3.5 text-slate-300"/>}
                                  {lesson.duration>0 && <span className="text-sm text-slate-400">{fmtDur(lesson.duration)}</span>}
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

            {/* Ratings */}
            <section>
              <h2 className="text-2xl font-black text-[#0a1628] mb-4">Student Reviews</h2>

              {course.ratingCount > 0 && (
                <div className="flex items-center gap-5 mb-6 bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="text-center">
                    <div className="text-5xl font-black text-[#0a1628]">{course.avgRating}</div>
                    <Stars value={course.avgRating} size="lg"/>
                    <div className="text-xs text-slate-400 mt-1">Course Rating</div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5,4,3,2,1].map(s=>{
                      const cnt = course.ratings.filter(r=>r.rating===s).length;
                      const pct = course.ratingCount>0?Math.round((cnt/course.ratingCount)*100):0;
                      return (
                        <div key={s} className="flex items-center gap-2 text-base">
                          <span className="text-slate-500 w-3 text-right">{s}</span>
                          <Star className="w-3.5 h-3.5 fill-[#f0c040] text-[#f0c040]"/>
                          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#f0c040] rounded-full" style={{width:`${pct}%`}}/>
                          </div>
                          <span className="text-slate-400 text-sm w-8">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                  <textarea value={myReview} onChange={e=>setMyReview(e.target.value)} rows={3} placeholder="Share your experienceâ€¦"
                    className="w-full font-[inherit] text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#0a1628] resize-none mb-3"/>
                  <button onClick={submitRating} disabled={!myRating||ratingSubmitting}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-bold px-5 py-2.5 rounded-xl hover:shadow disabled:opacity-40 transition-all text-sm">
                    {ratingSubmitting?<Loader2 className="w-4 h-4 animate-spin"/>:<Star className="w-4 h-4"/>}
                    Submit Rating
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {course.ratings.map(r=>(
                  <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#0a1628] flex items-center justify-center overflow-hidden shrink-0">
                        {r.user.image
                          ? <img src={r.user.image} alt={r.user.name} className="w-full h-full object-cover"/>
                          : <span className="text-white text-xs font-bold">{r.user.name[0]}</span>}
                      </div>
                      <div>
                        <div className="font-bold text-[#0a1628] text-base">{r.user.name}</div>
                        <Stars value={r.rating}/>
                      </div>
                      <span className="ml-auto text-sm text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    {r.review && <p className="text-base text-slate-600">{r.review}</p>}
                  </div>
                ))}
                {course.ratings.length===0 && (
                  <div className="text-center py-10 text-slate-400">
                    <Star className="w-10 h-10 mx-auto mb-3 opacity-30"/>
                    <p className="text-base">No ratings yet. Be the first!</p>
                  </div>
                )}
              </div>
            </section>

            {/* Bottom enroll CTA */}
            {!enrolled && (
              <div className="bg-gradient-to-r from-[#0a1628] to-[#1a3a6b] rounded-2xl p-8 text-white text-center mb-10">
                <GraduationCap className="w-12 h-12 text-[#f0c040] mx-auto mb-4"/>
                <h3 className="text-2xl font-black mb-2">Ready to get started?</h3>
                <p className="text-white/60 text-lg mb-5">{course.isFree?"This course is completely free.":`Enroll for just $${course.price}.`}</p>
                <button onClick={handleEnroll} disabled={enrolling}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-black px-8 py-3.5 rounded-xl hover:shadow-lg transition-all disabled:opacity-60">
                  {enrolling?<Loader2 className="w-4 h-4 animate-spin"/>:<GraduationCap className="w-4 h-4"/>}
                  {session?"Enroll Now":"Sign In to Enroll"}
                </button>
              </div>
            )}
          </div>

          {/* â”€â”€ RIGHT COLUMN: sticky enroll card â”€â”€ */}
          <div className="sticky top-6 self-start">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Square thumbnail */}
              <div className="relative aspect-square bg-gradient-to-br from-[#1a3a6b] to-[#0a1628] overflow-hidden">
                {course.thumbnail
                  ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}/>
                  : <div className="absolute inset-0 flex items-center justify-center"><GraduationCap className="w-16 h-16 text-white/15"/></div>}
              </div>
              <div className="p-5">
                <div className="mb-4">
                  {session ? (
                    <div className="text-3xl font-black text-[#0a1628]">
                      {course.isFree ? <span className="text-emerald-600">Free</span> : <>${course.price}</>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-sm font-semibold text-slate-500">Sign in to see price</span>
                    </div>
                  )}
                </div>
                {enrolled && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Progress</span><span className="font-bold">{course.progressPercent}%</span></div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#f0c040] to-[#d4a017] rounded-full transition-all" style={{width:`${course.progressPercent}%`}}/>
                    </div>
                  </div>
                )}
                <button onClick={handleEnroll} disabled={enrolling || checkoutLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-black py-3.5 rounded-xl hover:shadow-lg hover:shadow-[#f0c040]/30 transition-all disabled:opacity-60 text-base">
                  {(enrolling || checkoutLoading) ? <Loader2 className="w-5 h-5 animate-spin"/>
                    : enrolled ? <PlayCircle className="w-5 h-5"/> : <GraduationCap className="w-5 h-5"/>}
                  {(enrolling || checkoutLoading) ? (enrolled ? "Starting…" : "Processing…") : enrolled ? (course.progressPercent>0?"Continue Learning":"Start Course") : session ? (course.isFree ? "Enroll Free" : `Buy Now — $${course.price}`) : "Sign In to Enroll"}
                </button>
                <div className="mt-4 space-y-2 pt-4 border-t border-slate-100">
                  {[
                    { icon:BookOpen, text:`${totalLessons} on-demand lessons` },
                    { icon:Award, text:"Certificate on completion" },
                    { icon:CheckCircle2, text:"Full lifetime access" },
                    { icon:Users, text:`${course._count.enrollments} fellow learners` },
                  ].map(({icon:Icon,text})=>(
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
