"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import {
  ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, GraduationCap,
  Loader2, Lock, Play, Trophy, FileText, HelpCircle, Video, Award, Type,
} from "lucide-react";
import Certificate from "@/components/courses/Certificate";

interface QuizQuestion { id: string; question: string; options: string[]; correctAnswer: number; explanation: string | null; order: number; }
interface Quiz { id: string; title: string; passMark: number; questions: QuizQuestion[]; }
interface Lesson {
  id: string; title: string; duration: number; order: number; isFree: boolean;
  videoUrl: string | null; textContent: string | null; description: string | null;
  contentType: "VIDEO" | "TEXT" | "QUIZ"; quiz: Quiz | null;
}
interface Section { id: string; title: string; order: number; lessons: Lesson[]; }
interface Course {
  id: string; slug: string; title: string; isSequential: boolean;
  sections: Section[]; completedLessonIds: string[]; progressPercent: number;
  instructor: { id?: string; name: string; role?: string };
}

interface QuizResult {
  score: number; passed: boolean; passMark: number; correct: number; total: number;
  results: { question: string; yourAnswer: number; correctAnswer: number; correct: boolean; explanation: string | null }[];
}

const CONTENT_ICONS = { VIDEO: Video, TEXT: FileText, QUIZ: HelpCircle };

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function LearnPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [course, setCourse]           = useState<Course | null>(null);
  const [loading, setLoading]         = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completing, setCompleting]   = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [progress, setProgress]       = useState(0);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult]   = useState<QuizResult | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [showCert, setShowCert]       = useState(false);
  const [fontSize, setFontSize]       = useState(16);

  useEffect(() => {
    if (isPending) return;
    if (!session) { router.push("/login"); return; }
  }, [session, isPending, router]);

  const fetchCourse = useCallback(async () => {
    if (!slug) return;
    const data = await fetch(`/api/courses/${slug}`).then(r => r.ok ? r.json() : null).catch(() => null);
    if (!data) { router.push("/courses"); return; }
    if (!data.isEnrolled) { router.push(`/courses/${slug}`); return; }
    setCourse(data);
    setCompletedIds(new Set(data.completedLessonIds));
    setProgress(data.progressPercent);
    const firstLesson = data.sections?.[0]?.lessons?.[0];
    if (firstLesson) { setActiveLesson(firstLesson); setOpenSections(new Set([data.sections[0].id])); }
    setLoading(false);
  }, [slug, router]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  const isUnlocked = useCallback((lesson: Lesson, allLessons: Lesson[]): boolean => {
    const userRole = (session?.user as any)?.role;
    if (course?.instructor?.id === session?.user?.id || userRole === "ADMIN") return true;
    if (!course?.isSequential) return true;
    if (completedIds.has(lesson.id)) return true;
    const idx = allLessons.findIndex(l => l.id === lesson.id);
    if (idx === 0) return true;
    return completedIds.has(allLessons[idx - 1].id);
  }, [course, completedIds, session]);

  const selectLesson = (lesson: Lesson, allLessons: Lesson[]) => {
    if (!isUnlocked(lesson, allLessons)) return;
    setActiveLesson(lesson);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const markComplete = async () => {
    if (!activeLesson || !course || completing) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/courses/${slug}/progress`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: activeLesson.id }),
      });
      if (res.ok) {
        const data = await res.json();
        const newCompleted = new Set([...completedIds, activeLesson.id]);
        setCompletedIds(newCompleted);
        setProgress(data.progressPercent);
        if (data.progressPercent === 100) setShowCert(true);
      }
    } finally { setCompleting(false); }
  };

  const submitQuiz = async () => {
    if (!activeLesson?.quiz) return;
    setQuizSubmitting(true);
    try {
      const answers = activeLesson.quiz.questions.map((_, i) => quizAnswers[i] ?? -1);
      const res = await fetch(`/api/courses/${slug}/quiz-attempt`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: activeLesson.id, answers }),
      });
      if (res.ok) {
        const result: QuizResult = await res.json();
        setQuizResult(result);
        if (result.passed) {
          const newCompleted = new Set([...completedIds, activeLesson.id]);
          setCompletedIds(newCompleted);
          setProgress(result.score);
          // Check if all lessons done
          const totalLessons = course?.sections.flatMap(s => s.lessons).length ?? 0;
          if (newCompleted.size >= totalLessons) setShowCert(true);
        }
      }
    } finally { setQuizSubmitting(false); }
  };

  const goNext = () => {
    if (!course) return;
    const all = course.sections.flatMap(s => s.lessons);
    const idx = all.findIndex(l => l.id === activeLesson?.id);
    if (idx < all.length - 1) { setActiveLesson(all[idx + 1]); setQuizAnswers({}); setQuizResult(null); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
      <Loader2 className="w-8 h-8 text-[#f0c040] animate-spin" />
    </div>
  );
  if (!course) return null;

  const allLessons = course.sections.flatMap(s => s.lessons);
  const currentIdx = allLessons.findIndex(l => l.id === activeLesson?.id);
  const isLastLesson  = currentIdx === allLessons.length - 1;
  const isDone        = activeLesson ? completedIds.has(activeLesson.id) : false;
  const ytId          = activeLesson?.videoUrl ? getYouTubeId(activeLesson.videoUrl) : null;
  const CIcon         = activeLesson ? CONTENT_ICONS[activeLesson.contentType] : Play;

  return (
    <div className="min-h-screen bg-[#0d1b2e] text-white flex flex-col">
      {showCert && course && (
        <Certificate
          studentName={session?.user?.name ?? "Student"}
          courseName={course.title}
          instructorName={course.instructor?.name ?? "TaxCom Pro"}
          onClose={() => setShowCert(false)}
        />
      )}
      {/* Topbar */}
      <header className="h-14 flex items-center justify-between px-6 bg-[#0a1628] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/courses/${slug}`} className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#f0c040]" />
            <span className="font-bold text-sm truncate max-w-xs">{course.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {course.isSequential && (
            <span className="text-xs text-white/40 hidden sm:block">Sequential mode on</span>
          )}
          <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#f0c040] to-[#d4a017] rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-white/60 font-medium">{progress}%</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-[#0a1628] border-r border-white/10 overflow-y-auto shrink-0 hidden lg:block">
          <div className="p-4 border-b border-white/10">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Course Content</p>
          </div>
          {course.sections.map(section => {
            const isOpen = openSections.has(section.id);
            return (
              <div key={section.id} className="border-b border-white/5">
                <button onClick={() => setOpenSections(prev => { const n = new Set(prev); n.has(section.id) ? n.delete(section.id) : n.add(section.id); return n; })}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors text-left">
                  <span className="text-sm font-semibold text-white/80 truncate flex-1">{section.title}</span>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-white/40 shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />}
                </button>
                {isOpen && section.lessons.map(lesson => {
                  const done    = completedIds.has(lesson.id);
                  const active  = lesson.id === activeLesson?.id;
                  const unlocked = isUnlocked(lesson, allLessons);
                  const LIcon   = CONTENT_ICONS[lesson.contentType];
                  return (
                    <button key={lesson.id} onClick={() => selectLesson(lesson, allLessons)}
                      disabled={!unlocked}
                      className={`w-full flex items-center gap-3 pl-8 pr-4 py-3 text-left transition-colors disabled:cursor-not-allowed ${
                        active ? "bg-[#f0c040]/15 border-l-2 border-[#f0c040]" : unlocked ? "hover:bg-white/5" : "opacity-40"
                      }`}>
                      {done
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        : unlocked
                          ? <LIcon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-[#f0c040]" : "text-white/40"}`} />
                          : <Lock className="w-3.5 h-3.5 text-white/30 shrink-0" />
                      }
                      <span className={`text-xs flex-1 leading-snug ${active ? "text-[#f0c040] font-semibold" : done ? "text-white/40" : "text-white/70"}`}>
                        {lesson.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          {activeLesson ? (
            <>
              {/* VIDEO */}
              {activeLesson.contentType === "VIDEO" && (
                <div className="w-full bg-black aspect-video max-h-[65vh]">
                  {ytId
                    ? <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0`} className="w-full h-full" allowFullScreen />
                    : activeLesson.videoUrl
                      ? <video src={activeLesson.videoUrl} controls className="w-full h-full" />
                      : <div className="w-full h-full flex flex-col items-center justify-center text-white/30 gap-3">
                          <Play className="w-14 h-14" /><p className="text-sm">No video attached</p>
                        </div>
                  }
                </div>
              )}

              {activeLesson.contentType === "TEXT" && (
                <div className="max-w-3xl mx-auto">
                  {/* Font-size control bar */}
                  <div className="sticky top-0 z-10 flex items-center gap-3 px-10 py-2.5 bg-[#0a1628]/90 backdrop-blur border-b border-white/8">
                    <Type className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    <span className="text-white/40 text-xs shrink-0">Aa</span>
                    <button
                      type="button"
                      onClick={() => setFontSize(s => Math.max(12, s - 1))}
                      className="w-6 h-6 rounded-md bg-white/8 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center text-base leading-none transition-all shrink-0"
                      title="Decrease font size"
                    >−</button>
                    <input
                      type="range"
                      min={12}
                      max={28}
                      step={1}
                      value={fontSize}
                      onChange={e => setFontSize(Number(e.target.value))}
                      className="flex-1 h-1.5 accent-[#f0c040] cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setFontSize(s => Math.min(28, s + 1))}
                      className="w-6 h-6 rounded-md bg-white/8 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center text-base leading-none transition-all shrink-0"
                      title="Increase font size"
                    >+</button>
                    <span className="text-white/30 text-xs w-8 text-right shrink-0">{fontSize}px</span>
                    <button
                      type="button"
                      onClick={() => setFontSize(16)}
                      className="text-[10px] text-white/25 hover:text-white/60 transition-colors shrink-0 ml-1"
                      title="Reset to default"
                    >Reset</button>
                  </div>

                  {/* Article content */}
                  <div className="p-10">
                    <div className="flex items-center gap-2 mb-6 text-white/40 text-sm">
                      <FileText className="w-4 h-4" /> Article
                    </div>
                    {activeLesson.textContent ? (
                      <div
                        style={{ fontSize: `${fontSize}px`, lineHeight: 1.75 }}
                        className="prose prose-invert max-w-none text-white/80
                          prose-h1:text-white prose-h1:font-black prose-h1:mb-3
                          prose-h2:text-white prose-h2:font-bold prose-h2:mb-2
                          prose-p:mb-3 prose-p:text-white/80
                          prose-ul:list-disc prose-ul:pl-5 prose-li:mb-1
                          prose-ol:list-decimal prose-ol:pl-5
                          prose-blockquote:border-l-4 prose-blockquote:border-[#d4a017] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-white/50
                          prose-a:text-[#f0c040] prose-a:underline
                          prose-img:rounded-xl prose-img:max-w-full prose-img:my-4
                          prose-hr:border-white/10 prose-hr:my-6
                          prose-strong:text-white prose-em:text-white/90"
                        dangerouslySetInnerHTML={{ __html: activeLesson.textContent }}
                      />
                    ) : (
                      <p className="text-white/30 italic">No content for this lesson.</p>
                    )}
                  </div>
                </div>
              )}

              {/* QUIZ */}
              {activeLesson.contentType === "QUIZ" && (
                <div className="max-w-2xl mx-auto p-10">
                  {activeLesson.quiz && activeLesson.quiz.questions.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 mb-4 text-[#f0c040] text-sm font-bold">
                        <HelpCircle className="w-4 h-4" /> Quiz · Pass mark: {activeLesson.quiz.passMark}%
                      </div>
                      <h2 className="text-2xl font-black text-white mb-6">{activeLesson.quiz.title}</h2>

                      {quizResult ? (
                        <div className="space-y-4">
                          <div className={`rounded-2xl p-6 text-center ${quizResult.passed ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-red-500/15 border border-red-500/20"}`}>
                            <div className="text-4xl font-black mb-1">{quizResult.score}%</div>
                            <p className={`font-bold ${quizResult.passed ? "text-emerald-400" : "text-red-400"}`}>
                              {quizResult.passed ? `🎉 Passed! (${quizResult.correct}/${quizResult.total} correct)` : `❌ Failed — need ${quizResult.passMark}% to pass`}
                            </p>
                          </div>
                          {quizResult.results.map((r, i) => (
                            <div key={i} className={`rounded-xl p-4 ${r.correct ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                              <p className="text-sm font-semibold text-white/90 mb-2">{i+1}. {r.question}</p>
                              <p className={`text-xs font-bold ${r.correct ? "text-emerald-400" : "text-red-400"}`}>
                                Your answer: {activeLesson.quiz!.questions[i]?.options[r.yourAnswer] ?? "—"}
                                {!r.correct && ` · Correct: ${activeLesson.quiz!.questions[i]?.options[r.correctAnswer]}`}
                              </p>
                              {r.explanation && <p className="text-xs text-white/50 mt-1">{r.explanation}</p>}
                            </div>
                          ))}
                          {!quizResult.passed && (
                            <button onClick={() => { setQuizResult(null); setQuizAnswers({}); }}
                              className="w-full mt-2 bg-white/10 hover:bg-white/15 text-white font-bold py-3 rounded-xl transition-all">
                              Retry Quiz
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {activeLesson.quiz.questions.map((q, qi) => (
                            <div key={q.id} className="bg-white/5 rounded-xl p-5">
                              <p className="text-white font-semibold mb-4 text-sm">{qi+1}. {q.question}</p>
                              <div className="space-y-2">
                                {q.options.map((opt, oi) => (
                                  <button key={oi} onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                                    className={`w-full text-left text-sm px-4 py-3 rounded-xl border transition-all font-medium ${
                                      quizAnswers[qi] === oi
                                        ? "bg-[#f0c040]/20 border-[#f0c040] text-[#f0c040]"
                                        : "border-white/10 text-white/70 hover:bg-white/5 hover:border-white/20"
                                    }`}>{opt}</button>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button onClick={submitQuiz} disabled={quizSubmitting || Object.keys(quizAnswers).length < activeLesson.quiz.questions.length}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-black py-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
                            {quizSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
                            Submit Quiz
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    /* No quiz created yet — allow manual completion */
                    <div className="text-center py-16">
                      <HelpCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                      <p className="text-white/60 font-semibold mb-2">No quiz questions added yet</p>
                      <p className="text-white/40 text-sm">Mark this lesson as complete to continue</p>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom controls — always visible */}
              <div className="max-w-3xl mx-auto px-8 py-6 border-t border-white/5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                      <CIcon className="w-3.5 h-3.5" />
                      {activeLesson.contentType === "VIDEO" ? "Video Lesson" : activeLesson.contentType === "TEXT" ? "Article" : "Quiz"}
                    </div>
                    <h2 className="text-xl font-black text-white">{activeLesson.title}</h2>
                    {activeLesson.description && <p className="text-white/50 text-sm mt-1">{activeLesson.description}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Mark Complete — show for VIDEO/TEXT always, and for QUIZ with no questions */}
                    {(activeLesson.contentType !== "QUIZ" || !activeLesson.quiz || activeLesson.quiz.questions.length === 0) && (
                      isDone ? (
                        <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl">
                          <CheckCircle2 className="w-4 h-4" /> Completed
                        </span>
                      ) : (
                        <button onClick={markComplete} disabled={completing}
                          className="flex items-center gap-2 text-sm font-bold bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] px-5 py-2 rounded-xl hover:shadow-lg transition-all disabled:opacity-60">
                          {completing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Mark Complete
                        </button>
                      )
                    )}

                    {/* Next button — always rendered, disabled until lesson is done in sequential mode */}
                    {!isLastLesson && (
                      <button onClick={goNext}
                        disabled={course.isSequential && !isDone}
                        title={course.isSequential && !isDone ? "Complete this lesson first" : "Next lesson"}
                        className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl border transition-all ${
                          isDone
                            ? "text-white border-white/30 hover:border-white/60 hover:bg-white/10"
                            : "text-white/30 border-white/10 cursor-not-allowed"
                        }`}>
                        Next →
                      </button>
                    )}
                  </div>
                </div>

                {progress === 100 && (
                  <div className="mt-6 bg-gradient-to-r from-[#f0c040]/20 to-[#d4a017]/10 border border-[#f0c040]/30 rounded-2xl p-6 text-center">
                    <Trophy className="w-10 h-10 text-[#f0c040] mx-auto mb-2" />
                    <p className="font-black text-lg text-white">Course Complete! 🎉</p>
                    <p className="text-white/50 text-sm mt-1 mb-4">Congratulations! You've earned your certificate.</p>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => setShowCert(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-black px-5 py-2.5 rounded-xl hover:shadow-lg transition-all">
                        <Award className="w-4 h-4" /> View Certificate
                      </button>
                      <Link href="/my-courses" className="text-sm font-bold text-white/60 hover:text-white transition-colors">
                        My Courses →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/40 gap-3">
              <GraduationCap className="w-12 h-12" />
              <p>Select a lesson to begin</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
