"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import {
  BookOpen, Search, Users, Clock, Star, ChevronRight,
  Loader2, GraduationCap, Filter, SlidersHorizontal, Lock,
} from "lucide-react";

interface Course {
  id: string; slug: string; title: string; description: string;
  thumbnail: string | null; level: string; category: string;
  price: number; isFree: boolean; totalDuration: number;
  instructor: { name: string; image: string | null };
  _count: { enrollments: number; sections: number };
  sections: { _count: { lessons: number } }[];
}

const CATEGORIES = [
  "All", "Tax Law", "Compliance", "Accounting", "Bookkeeping",
  "Audit", "Financial Planning", "Business Tax", "Payroll",
];

const LEVELS = [
  { value: "", label: "All Levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER:     "bg-emerald-100 text-emerald-700",
  INTERMEDIATE: "bg-blue-100 text-blue-700",
  ADVANCED:     "bg-purple-100 text-purple-700",
};

function fmtDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function CourseCard({ course, isLoggedIn }: { course: Course; isLoggedIn: boolean }) {
  const totalLessons = course.sections.reduce((s, sec) => s + sec._count.lessons, 0);
  const [imgError, setImgError] = useState(false);
  return (
    <Link href={`/courses/${course.slug}`}
      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Thumbnail — 1:1 square */}
      <div className="relative aspect-square bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] overflow-hidden">
        {course.thumbnail && !imgError
          ? <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          : (
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-16 h-16 text-white/20" />
            </div>
          )
        }
        {/* Price badge — hidden for guests */}
        <div className="absolute top-3 right-3">
          {isLoggedIn ? (
            course.isFree
              ? <span className="bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full">FREE</span>
              : <span className="bg-[#f0c040] text-[#0a1628] text-xs font-black px-3 py-1 rounded-full">${course.price}</span>
          ) : (
            <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" /> Login to see price
            </span>
          )}
        </div>
        {/* Level badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${LEVEL_COLORS[course.level] ?? "bg-slate-100 text-slate-600"}`}>
            {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-semibold text-[#d4a017] uppercase tracking-wider mb-1">{course.category}</div>
        <h3 className="font-bold text-[#0a1628] text-base leading-snug mb-2 group-hover:text-[#1a3a6b] transition-colors line-clamp-2">
          {course.title}
        </h3>
        <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2 flex-1">{course.description}</p>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-[#0a1628] overflow-hidden flex items-center justify-center shrink-0">
            {course.instructor.image
              ? <img src={course.instructor.image} alt={course.instructor.name} className="w-full h-full object-cover" />
              : <span className="text-white text-[10px] font-bold">{course.instructor.name[0]}</span>
            }
          </div>
          <span className="text-xs text-slate-500 font-medium truncate">{course.instructor.name}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{totalLessons} lessons</span>
          {course.totalDuration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDuration(course.totalDuration)}</span>}
          <span className="flex items-center gap-1 ml-auto"><Users className="w-3 h-3" />{course._count.enrollments}</span>
        </div>
      </div>
    </Link>
  );
}

export default function CoursesPage() {
  const user = useAppSelector(s => s.auth.user);
  const isLoggedIn = !!user;
  const [courses, setCourses]   = useState<Course[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel]       = useState("");
  const [query, setQuery]       = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query)                   params.set("search",   query);
    if (category !== "All")      params.set("category", category);
    if (level)                   params.set("level",    level);

    fetch(`/api/courses?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setCourses(Array.isArray(d) ? d : []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [query, category, level]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-[#0a1628] text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#f0c040]/15 border border-[#f0c040]/30 text-[#f0c040] text-sm font-bold px-4 py-1.5 rounded-full mb-5">
            <GraduationCap className="w-4 h-4" />
            Tax & Finance Learning Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Learn Tax & Compliance<br />
            <span className="text-[#f0c040]">from the Pros</span>
          </h1>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            Practical courses on tax law, compliance, accounting, and
more—built by experienced professionals.
          </p>
          <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto">
            <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
              <Search className="w-4 h-4 text-white/50 shrink-0" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search courses…"
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm font-[inherit]"
              />
            </div>
            <button type="submit"
              className="bg-[#f0c040] text-[#0a1628] font-bold px-6 py-3 rounded-xl hover:bg-[#d4a017] transition-all shrink-0">
              Search
            </button>
          </form>
        </div>
      </div>


      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Category chips */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`text-sm font-semibold px-3.5 py-1.5 rounded-full transition-all border ${
                  category === cat
                    ? "bg-[#0a1628] text-white border-[#0a1628]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}>
                {cat}
              </button>
            ))}
          </div>
          {/* Level select */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <select value={level} onChange={e => setLevel(e.target.value)}
              className="font-[inherit] text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none focus:border-[#0a1628] cursor-pointer">
              {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 text-[#d4a017] animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">No courses found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(c => <CourseCard key={c.id} course={c} isLoggedIn={isLoggedIn} />)}
          </div>
        )}
      </div>
    </div>
  );
}
