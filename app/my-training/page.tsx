"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, GraduationCap, ChevronRight, Award } from "lucide-react";
import { STATUS_COLORS } from "@/lib/training";

interface Assignment {
  id: string; toolkitName: string; officeName: string | null; versionLabel: string;
  status: string; statusLabel: string; videoFurthestSeconds: number; videoDurationSeconds: number;
  latestAttempt: { score: number; passed: boolean } | null; certificateNumber: string | null;
}

export default function MyTrainingPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Assignment[]>([]);

  useEffect(() => {
    fetch("/api/training/my").then(r => r.json()).then((d: Assignment[]) => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb]"><Loader2 className="w-8 h-8 animate-spin text-[#0a1628]" /></div>;

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#0a1628] flex items-center justify-center"><GraduationCap className="w-5 h-5 text-white" /></div>
          <h1 className="text-xl font-black text-[#0a1628]">My Assigned Training</h1>
        </div>
        <p className="text-sm text-slate-500 mb-8">Only training assigned specifically to you shows up here.</p>

        {items.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-sm text-slate-400">
            No training has been assigned to you yet.
          </div>
        )}

        <div className="space-y-3">
          {items.map(a => (
            <Link key={a.id} href={`/my-training/${a.id}`} className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 transition-all">
              <div className="min-w-0">
                <p className="font-black text-[#0a1628] text-sm truncate">{a.toolkitName}</p>
                <p className="text-xs text-slate-400 truncate">{a.versionLabel}{a.officeName ? ` — ${a.officeName}` : ""}</p>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded-full font-bold text-[10px] ${STATUS_COLORS[a.status] ?? "bg-slate-100 text-slate-600"}`}>{a.statusLabel}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {a.certificateNumber && <Award className="w-4 h-4 text-emerald-600" />}
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
