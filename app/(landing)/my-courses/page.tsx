"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Loader2, PlayCircle, CheckCircle2,
  BookOpen, Trophy, Clock,
} from "lucide-react";

interface EnrolledCourse {
  id: string; enrolledAt: string; completedAt: string | null;
  progressPercent: number; completedCount: number; totalLessons: number;
  course: {
    id: string; slug: string; title: string; thumbnail: string | null;
    level: string; category: string;
    instructor: { name: string; image: string | null };
  };
}

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER:     "bg-emerald-100 text-emerald-700",
  INTERMEDIATE: "bg-blue-100 text-blue-700",
  ADVANCED:     "bg-purple-100 text-purple-700",
};

export default function MyCoursesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (isPending) return;
    if (!session) { router.push("/login"); return; }
    fetch("/api/my-courses")
      .then(r => r.ok ? r.json() : [])
      .then(d => setEnrollments(Array.isArray(d) ? d : []))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, [session, isPending, router]);

  const inProgress  = enrollments.filter(e => !e.completedAt);
  const completed   = enrollments.filter(e => !!e.completedAt);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 text-[#ffbe24] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-[#0a1628] flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-[#ffbe24]" />
              My Courses
            </h1>
            <p className="text-slate-500 mt-1">{enrollments.length} course{enrollments.length !== 1 ? "s" : ""} enrolled</p>
          </div>
          <Link href="/courses"
            className="flex items-center gap-2 text-sm font-bold bg-[#0a1628] text-white px-5 py-2.5 rounded-xl hover:bg-[#1a3a6b] transition-all">
            <BookOpen className="w-4 h-4" /> Browse More
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200">
            <GraduationCap className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <p className="font-bold text-slate-500 text-lg">No courses yet</p>
            <p className="text-slate-400 text-sm mt-1 mb-6">Start learning from expert-led tax & finance courses</p>
            <Link href="/courses"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ffbe24] to-[#ffbe24] text-[#0a1628] font-black px-6 py-3 rounded-xl hover:shadow-lg transition-all">
              <BookOpen className="w-4 h-4" /> Explore Courses
            </Link>
          </div>
        ) : (
          <>
            {/* In Progress */}
            {inProgress.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-black text-[#0a1628] mb-4 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-[#ffbe24]" /> In Progress
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {inProgress.map(e => (
                    <CourseProgressCard key={e.id} enrollment={e} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <section>
                <h2 className="text-lg font-black text-[#0a1628] mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-emerald-500" /> Completed
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {completed.map(e => (
                    <CourseProgressCard key={e.id} enrollment={e} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CourseProgressCard({ enrollment: e }: { enrollment: EnrolledCourse }) {
  const c = e.course;
  const done = !!e.completedAt;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all">
      <div className="relative h-36 bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] overflow-hidden">
        {c.thumbnail
          ? <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
          : <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-white/20" />
            </div>
        }
        {done && (
          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-emerald-400" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[c.level] ?? "bg-slate-100 text-slate-600"}`}>
            {c.level.charAt(0) + c.level.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      <div className="p-4">
        <p className="text-[10px] font-semibold text-[#ffbe24] uppercase tracking-wider mb-1">{c.category}</p>
        <h3 className="font-bold text-[#0a1628] text-sm leading-snug mb-3 line-clamp-2">{c.title}</h3>

        {/* Progress bar */}
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>{e.completedCount}/{e.totalLessons} lessons</span>
          <span className="font-bold">{e.progressPercent}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div className={`h-full rounded-full transition-all ${done ? "bg-emerald-500" : "bg-gradient-to-r from-[#ffbe24] to-[#ffbe24]"}`}
            style={{ width: `${e.progressPercent}%` }} />
        </div>

        <Link href={`/courses/${c.slug}/learn`}
          className={`flex items-center justify-center gap-2 w-full text-sm font-bold py-2.5 rounded-xl transition-all ${
            done
              ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              : "bg-gradient-to-r from-[#ffbe24] to-[#ffbe24] text-[#0a1628] hover:shadow-md"
          }`}>
          {done
            ? <><CheckCircle2 className="w-4 h-4" /> Review Course</>
            : <><PlayCircle className="w-4 h-4" /> {e.progressPercent > 0 ? "Continue" : "Start"}</>
          }
        </Link>
      </div>
    </div>
  );
}
