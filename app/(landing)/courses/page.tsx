"use client";

import { useState } from "react";
import Link from "next/link";
import { COURSES, CourseOffering } from "@/lib/courses";
import {
  BookOpen,
  Search,
  Users,
  Clock,
  Star,
  GraduationCap,
  Filter,
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  Zap,
  Award,
  Layers,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Tax Office Startup",
  "Compliance",
  "Business Tax",
  "Audit",
];

const LEVELS = [
  { value: "", label: "All Levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "bg-emerald-500/90 text-white backdrop-blur-md",
  INTERMEDIATE: "bg-blue-500/90 text-white backdrop-blur-md",
  ADVANCED: "bg-purple-500/90 text-white backdrop-blur-md",
};

function CourseCard({ course }: { course: CourseOffering }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group bg-white dark:bg-[#172135] rounded-[32px] border border-slate-200/80 dark:border-slate-800/90 overflow-hidden hover:shadow-2xl dark:hover:shadow-[0_0_45px_rgba(240,192,64,0.18)] hover:-translate-y-2 transition-all duration-300 flex flex-col">
      {/* Big Crisp Artwork Header */}
      <div className="relative w-full h-80 sm:h-96 md:h-[360px] lg:h-[400px] xl:h-[420px] bg-gradient-to-br from-[#0a1628] via-[#0d1c32] to-[#1a3a6b] overflow-hidden border-b border-slate-100 dark:border-slate-800">
        {course.thumbnail && !imgError ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-24 h-24 text-white/20" />
          </div>
        )}

        {/* Gradient Overlay for Badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Level badge */}
        <div className="absolute top-4 left-4 z-10">
          <span
            className={`text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg ${
              LEVEL_COLORS[course.level] ?? "bg-slate-900 text-white"
            }`}
          >
            {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
          </span>
        </div>

        {/* Modules count badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className="text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-[#0a1628]/90 text-amber-400 border border-amber-400/40 backdrop-blur-md shadow-lg flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> {course.modules} Modules
          </span>
        </div>

        {/* Bottom category pill on image */}
        <div className="absolute bottom-4 left-4 z-10">
          <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-amber-300 border border-amber-300/20">
            {course.category}
          </span>
        </div>
      </div>

      <div className="p-7 sm:p-8 md:p-9 flex flex-col flex-1">
        <h3 className="font-extrabold text-[#0a1628] dark:text-white text-xl sm:text-2xl leading-snug mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
          {course.title}
        </h3>
        <p className="text-slate-500 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-6 line-clamp-3 flex-1">
          {course.description}
        </p>

        {/* Instructor / Platform Branding */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-[#0a1628] overflow-hidden flex items-center justify-center shrink-0 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
            {course.instructor.image ? (
              <img
                src={course.instructor.image}
                alt={course.instructor.name}
                className="w-full h-full object-contain p-0.5"
              />
            ) : (
              <span className="text-white text-xs font-bold">{course.instructor.name?.[0] || "U"}</span>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Instructor</p>
            <p className="text-sm text-slate-800 dark:text-slate-200 font-extrabold truncate">
              {course.instructor.name}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-4 mb-6 font-medium">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-700 dark:text-slate-200">{course.totalLessons}</span> lessons
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-700 dark:text-slate-200">{course.duration}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-700 dark:text-slate-200">{course.enrolledCount}</span> enrolled
          </span>
        </div>

        {/* High-Impact Call to Action Button */}
        <a
          href={course.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-white dark:bg-white text-[#0a1628] hover:bg-slate-50 border border-slate-200 dark:border-slate-300 shadow-md font-black text-sm uppercase tracking-wider py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 transition-all hover:shadow-lg active:scale-[0.99] group/btn"
        >
          <span>VIEW COURSE DETAILS</span>
          <ArrowRight className="w-4 h-4 text-[#0a1628] transition-transform group-hover/btn:translate-x-1" />
        </a>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("");
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search.trim());
  };

  const filteredCourses = COURSES.filter((c) => {
    if (category !== "All" && c.category !== category) return false;
    if (level && c.level !== level) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.instructor.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0c1527]">
      {/* ══════════════════════════════════════
          EXPANSIVE HERO
      ══════════════════════════════════════ */}
      <div className="relative bg-gradient-to-br from-[#0a1628] via-[#0d2040] to-[#0a1628] text-white overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-amber-400/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-16 pt-20 pb-20 sm:pt-24 sm:pb-24 lg:pt-28 lg:pb-28 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest shadow-md">
              <GraduationCap className="w-4 h-4" /> Atlas Academy · Professional Learning Hub
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-5 leading-[1.08] tracking-tight">
              Knowledge is Your <span className="text-amber-400">Competitive Edge</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed font-normal">
              Atlas Academy equips Tax Professionals with due diligence training, compliance
              strategies, and business skills to help build a stronger, more profitable practice.
            </p>

            {/* Search form in hero */}
            <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto lg:mx-0 mb-10">
              <div className="flex-1 flex items-center gap-3 bg-white/10 border border-white/20 rounded-full px-5 py-4 focus-within:border-amber-400 focus-within:bg-white/15 transition-all shadow-inner">
                <Search className="w-5 h-5 text-white/50 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search masterclasses, compliance, due diligence…"
                  className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-base font-[inherit]"
                />
              </div>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-[#0a1628] font-black px-8 py-4 rounded-full transition-all shrink-0 text-base shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 text-xs sm:text-sm font-bold text-white/80">
              {[
                { icon: ShieldCheck, label: "IRS-Compliant Content" },
                { icon: Zap, label: "Self-Paced Learning" },
                { icon: Award, label: "Verified Certificates" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-amber-400" /> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Large hero visual banner */}
          <div className="relative flex-shrink-0 w-full max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl">
            <div className="absolute inset-0 bg-amber-400/20 rounded-3xl blur-3xl scale-110 pointer-events-none" />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/15 bg-[#172135]">
              <img
                src="/courses-hero.webp"
                alt="Atlas Academy Courses"
                className="w-full h-auto object-cover"
              />
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#0a1628]/85 backdrop-blur-md border border-amber-400/40 text-amber-300 text-xs font-black px-4 py-2 rounded-full shadow-lg">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Professional Academy
              </div>
            </div>
          </div>
        </div>

        {/* Big Stats Row */}
        <div className="relative border-t border-white/10 bg-black/20">
          <div className="max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-16 py-8 sm:py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { num: "6", label: "Professional Masterclasses" },
              { num: "100%", label: "IRS-Compliant Modules" },
              { num: "CPE / CE", label: "Ready Curriculum" },
              { num: "2 mo", label: "Free VIP Membership" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-400 mb-1 tracking-tight">{s.num}</p>
                <p className="text-xs sm:text-sm font-extrabold text-white/60 uppercase tracking-wider leading-snug">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          BIG COURSES GRID & EXPANDED FILTERS
      ══════════════════════════════════════ */}
      <div className="max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-16 py-14 sm:py-18">
        {/* Header matching Toolkits */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-400/10 border border-amber-300 dark:border-amber-400/30 text-amber-800 dark:text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Practice Growth &amp; Defense Systems
          </div>
          <h2 className="text-4xl font-black text-[#0a1628] dark:text-white mb-3">
            Individual Courses
          </h2>
          <p className="text-slate-800 dark:text-white text-lg font-medium max-w-4xl mx-auto mb-2">
            Choose the exact course built for your firm&apos;s launch, due diligence, compliance, and audit defense.
          </p>
          <p className="text-red-600 dark:text-red-400 text-base sm:text-lg font-bold tracking-wide">
            Receive 2 Months FREE Marketplace Membership Plus with the purchase of ANY Toolkit or Course Bundle.
          </p>
        </div>

        {/* Expanded Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-32 bg-white dark:bg-[#172135] rounded-3xl border border-slate-200 dark:border-slate-800 p-12">
            <GraduationCap className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-200 font-extrabold text-xl">No courses found</p>
            <p className="text-slate-400 text-sm mt-1.5">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10 xl:gap-12">
            {filteredCourses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
