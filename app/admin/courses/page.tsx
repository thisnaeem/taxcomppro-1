"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { COURSES } from "@/lib/courses";

export default function AdminCoursesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Course Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Atlas Academy Masterclasses &amp; Compliance Curriculums</p>
        </div>
        <Link
          href="/courses"
          className="flex items-center gap-2 bg-[#f0c040] hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-lg shadow-amber-400/20 transition-all text-xs uppercase tracking-wider"
        >
          View Public Course Hub <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-[#0a1628] to-[#172b4d] border border-amber-400/30 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">CENTRALIZED ACADEMY CURRICULUM</span>
            <h2 className="text-xl font-black mt-1 mb-2">Canonical Course Offerings Hardcoded &amp; Synchronized</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              All 6 masterclass video courses and practitioner due diligence curriculums are centrally configured in <code className="text-amber-300 font-mono text-xs px-1.5 py-0.5 bg-black/40 rounded">lib/courses.ts</code> with direct routing to Atlas Academy and their respective toolkit landing pages. Manual database course creation has been disabled to ensure 100% fidelity.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Canonical Courses */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {COURSES.map((course) => (
          <div key={course.id} className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-slate-950">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/90 text-white">
                  {course.level}
                </span>
                <span className="absolute bottom-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/80 text-amber-300">
                  {course.duration}
                </span>
              </div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">{course.category}</span>
              <h3 className="text-sm font-bold text-white mt-1 leading-snug">{course.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{course.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">{course.modules} Modules · {course.totalLessons} Lessons</span>
              <a
                href={course.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Landing Page →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
