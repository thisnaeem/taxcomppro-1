"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";

// Dynamically import the PDF editor with SSR disabled
// to avoid loading canvas/browser APIs during server rendering
const PdfEditor = dynamic(() => import("@/components/tools/PdfEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-white dark:bg-[#172135] border border-gray-200 dark:border-[#243550] rounded-3xl p-10">
      <Loader2 className="w-10 h-10 animate-spin text-[#173473] dark:text-amber-400 mb-4" />
      <p className="text-sm font-extrabold text-slate-600 dark:text-slate-400">Loading editor environment...</p>
    </div>
  ),
});

export default function PdfFillablePage() {
  return (
    <div className="min-h-screen bg-[#f4f6fb] dark:bg-[#0f172a] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Navigation Breadcrumb & Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link 
              href="/tools"
              className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-[#0a1628] dark:hover:text-white uppercase tracking-wider transition-colors mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Tools
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-[#0a1628] dark:text-white tracking-tight">
                Atlas AI PDF Fillable
              </h1>
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full select-none">
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" /> Beta
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Add interactive AcroForm fields to standard PDF documents. Complete PDF signing and logo placement entirely client-side.
            </p>
          </div>
        </div>

        {/* Dynamic Editor Panel */}
        <div className="bg-white dark:bg-[#172135] rounded-3xl border border-slate-200 dark:border-[#243550] shadow-sm overflow-hidden">
          <PdfEditor />
        </div>
        
      </div>
    </div>
  );
}
