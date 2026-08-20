"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import {
  BookOpen,
  Search,
  Users,
  Clock,
  Star,
  Loader2,
  GraduationCap,
  Filter,
  SlidersHorizontal,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Award,
} from "lucide-react";

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string | null;
  level: string;
  category: string;
  price: number;
  isFree: boolean;
  totalDuration: number;
  instructor: { name: string; image: string | null; role?: string };
  _count: { enrollments: number; sections: number };
  sections: { _count: { lessons: number } }[];
}

const CATEGORIES = [
  "All",
  "Tax Office Startup",
  "Compliance",
  "Accounting",
  "Bookkeeping",
  "Audit",
  "Financial Planning",
  "Business Tax",
  "Payroll",
];

const LEVELS = [
  { value: "", label: "All Levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  INTERMEDIATE: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  ADVANCED: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300",
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
    <div className="group bg-white dark:bg-[#172135] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(240,192,64,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col">
      {/* Thumbnail — Full uncropped image visible */}
      <div className="relative w-full h-72 sm:h-80 bg-gradient-to-br from-[#0a1628] via-[#0d1c32] to-[#1a3a6b] flex items-center justify-center p-4 overflow-hidden border-b border-slate-100 dark:border-slate-800">
        {course.thumbnail && !imgError ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-16 h-16 text-white/20" />
          </div>
        )}

        {/* Level badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${
              LEVEL_COLORS[course.level] ?? "bg-slate-100 text-slate-700"
            }`}
          >
            {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="text-[11px] font-black text-[#c28e10] dark:text-amber-400 uppercase tracking-widest mb-1.5">
          {course.category}
        </div>
        <h3 className="font-extrabold text-[#0a1628] dark:text-white text-lg leading-snug mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
          {course.title}
        </h3>
        <p className="text-slate-500 dark:text-slate-300 text-xs leading-relaxed mb-4 line-clamp-2 flex-1">
          {course.description}
        </p>

        {/* Instructor / Platform Branding */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-full bg-[#0a1628] overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
            {course.instructor.role !== "ADMIN" && course.instructor.image ? (
              <img
                src={course.instructor.image}
                alt={course.instructor.name}
                className="w-full h-full object-cover"
              />
            ) : course.instructor.role !== "ADMIN" ? (
              <span className="text-white text-xs font-bold">{course.instructor.name?.[0] || "U"}</span>
            ) : (
              <img
                src="/fevicon.webp"
                alt="TaxCompPro"
                className="w-full h-full object-contain p-0.5"
              />
            )}
          </div>
          <span className="text-xs text-slate-700 dark:text-slate-300 font-bold truncate">
            {course.instructor.role !== "ADMIN" ? course.instructor.name : "TaxCompPro"}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3 mb-5">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {totalLessons} lessons
          </span>
          {course.totalDuration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {fmtDuration(course.totalDuration)}
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Users className="w-3.5 h-3.5" />
            {course._count.enrollments} enrolled
          </span>
        </div>

        {/* White Call to Action Button */}
        <Link
          href={`/courses/${course.slug}`}
          className="w-full bg-white dark:bg-white text-[#0a1628] hover:bg-slate-50 border border-slate-200 shadow-sm font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-md active:scale-[0.99]"
        >
          VIEW COURSE DETAILS <ArrowRight className="w-3.5 h-3.5 text-[#0a1628]" />
        </Link>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const user = useAppSelector((s) => s.auth.user);
  const isLoggedIn = !!user;
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (category !== "All") params.set("category", category);
    if (level) params.set("level", level);

    fetch(`/api/courses?${params}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setCourses(Array.isArray(d) ? d : []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [query, category, level]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search.trim());
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0c1527]">
      {/* ══════════════════════════════════════
          HERO (Same layout as toolkits)
      ══════════════════════════════════════ */}
      <div className="relative bg-gradient-to-br from-[#0a1628] via-[#0d2040] to-[#0a1628] text-white overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-16 flex flex-col lg:flex-row items-center gap-12">
          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
              <GraduationCap className="w-3.5 h-3.5" /> Atlas Academy · Tax &amp; Finance Learning Hub
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-5 leading-[1.05] tracking-tight uppercase">
              KNOWLEDGE IS YOUR <span className="text-amber-400">COMPETITIVE EDGE</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Atlas Academy equips Tax Professionals with due diligence training, compliance
              strategies, and business skills to help build a stronger, more profitable business.
            </p>

            {/* Search form in hero */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto lg:mx-0 mb-8">
              <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-3 focus-within:border-amber-400">
                <Search className="w-4 h-4 text-white/50 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses, compliance, tax…"
                  className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm font-[inherit]"
                />
              </div>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-[#0a1628] font-black px-6 py-3 rounded-full transition-all shrink-0 text-sm shadow-lg shadow-amber-500/20"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs font-semibold text-white/70">
              {[
                { icon: ShieldCheck, label: "IRS-Compliant Content" },
                { icon: Zap, label: "Self-Paced Learning" },
                { icon: Award, label: "Verified Certificates" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-amber-400" /> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: hero image */}
          <div className="relative flex-shrink-0 w-full max-w-sm lg:max-w-md">
            <div className="absolute inset-0 bg-amber-400/20 rounded-3xl blur-2xl scale-110 pointer-events-none" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10 bg-[#172135]">
              <img
                src="/courses-hero.webp"
                alt="Atlas Academy Courses"
                className="w-full h-auto object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#0a1628]/80 backdrop-blur-sm border border-amber-400/40 text-amber-300 text-[10px] font-black px-3 py-1.5 rounded-full">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Professional Academy
              </div>
            </div>
          </div>
        </div>

        {/* Stats row below */}
        <div className="relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { num: "10+", label: "Professional Courses" },
              { num: "100%", label: "IRS-Compliant Modules" },
              { num: "CPE / CE", label: "Ready Content" },
              { num: "2 mo", label: "Free Community Access" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-amber-400 mb-0.5">{s.num}</p>
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider leading-snug">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          COURSES LISTING & FILTERS
      ══════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between">
          {/* Category chips */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all border ${
                  category === cat
                    ? "bg-[#0a1628] dark:bg-amber-500 text-white dark:text-[#0a1628] border-transparent shadow-md"
                    : "bg-white dark:bg-[#172135] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Level select */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="font-[inherit] text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-white dark:bg-[#172135] text-slate-700 dark:text-white outline-none focus:border-[#0a1628] cursor-pointer"
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 text-[#d4a017] animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-[#172135] rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-200 font-bold text-lg">No courses found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
