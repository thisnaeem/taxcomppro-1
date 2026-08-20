"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  BookOpen,
  Users,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  Clock,
  Archive,
  Loader2,
} from "lucide-react";

type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string | null;
  level: string;
  status: CourseStatus;
  price: number;
  isFree: boolean;
  category: string;
  _count: { sections: number; enrollments: number };
  instructor: { id: string; name: string };
  createdAt: string;
}

const STATUS_CFG: Record<CourseStatus, { label: string; cls: string; icon: React.ElementType }> = {
  DRAFT:     { label: "Draft",     cls: "bg-slate-700/60 text-slate-300 border border-slate-600",    icon: Clock },
  PUBLISHED: { label: "Published", cls: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20", icon: CheckCircle2 },
  ARCHIVED:  { label: "Archived",  cls: "bg-amber-500/15 text-amber-300 border border-amber-500/20",     icon: Archive },
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/admin/courses")
      .then(r => r.json())
      .then(d => setCourses(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: CourseStatus) => {
    setActing(p => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setCourses(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      }
    } finally {
      setActing(p => ({ ...p, [id]: false }));
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("Delete this course? All enrollments will be lost.")) return;
    setActing(p => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
      if (res.ok) setCourses(prev => prev.filter(c => c.id !== id));
    } finally { setActing(p => ({ ...p, [id]: false })); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Course Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Create and manage all platform courses</p>
        </div>
        <Link href="/admin/courses/create"
          className="flex items-center gap-2 bg-[#f0c040] hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-lg shadow-amber-400/20 transition-all">
          <Plus className="w-4 h-4" /> New Course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Courses",     value: courses.length,                                               icon: GraduationCap, color: "text-[#f0c040]" },
          { label: "Published",         value: courses.filter(c => c.status === "PUBLISHED").length,         icon: CheckCircle2,  color: "text-emerald-400" },
          { label: "Enrolled Students", value: courses.reduce((s, c) => s + c._count.enrollments, 0),       icon: Users,         color: "text-blue-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
            <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full">
            <thead className="bg-slate-900/60 border-b border-white/8">
              <tr>
                <th className="text-left text-xs font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wider">Course</th>
                <th className="text-left text-xs font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wider hidden md:table-cell">Stats</th>
                <th className="text-left text-xs font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wider">Status</th>
                <th className="text-right text-xs font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {courses.map(c => {
                const sc = STATUS_CFG[c.status] ?? STATUS_CFG.DRAFT;
                const SI = sc.icon;
                return (
                  <tr key={c.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white text-sm">{c.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.category} · {c.level.charAt(0) + c.level.slice(1).toLowerCase()}</div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-4 text-xs text-slate-300">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3 text-blue-400" />{c._count.enrollments}</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-slate-400" />{c._count.sections} sections</span>
                        <span className="font-bold text-amber-400">{c.isFree ? "Free" : `$${c.price}`}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sc.cls}`}>
                        <SI className="w-3 h-3" />{sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        {acting[c.id] ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : (
                          <>
                            <Link href={`/admin/courses/edit/${c.id}`}
                              className="text-xs font-semibold bg-slate-700/60 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-white/5 transition-all">
                              Edit
                            </Link>
                            {c.status !== "PUBLISHED" && (
                              <button onClick={() => updateStatus(c.id, "PUBLISHED")}
                                className="flex items-center gap-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg transition-all">
                                <Eye className="w-3 h-3" /> Publish
                              </button>
                            )}
                            {c.status === "PUBLISHED" && (
                              <button onClick={() => updateStatus(c.id, "ARCHIVED")}
                                className="flex items-center gap-1 text-xs font-semibold bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-white/5 transition-all">
                                <EyeOff className="w-3 h-3" /> Archive
                              </button>
                            )}
                            <button onClick={() => deleteCourse(c.id)}
                              className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/15 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-all">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {courses.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
              <p className="font-semibold text-white">No courses yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
