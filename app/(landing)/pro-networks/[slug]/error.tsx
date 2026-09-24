"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowLeft, Headphones } from "lucide-react";

export default function ProNetworkError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Pro Network Page Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#08101e] flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="max-w-md w-full bg-[#0d1627] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-400/10">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Network Temporarily Unavailable
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            We encountered an unexpected issue while loading this professional network. Please try reloading or check other active Pro Networks.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1a56db] hover:bg-blue-600 text-white font-black text-xs shadow-lg transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/pro-networks"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white font-bold text-xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Networks</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Headphones className="w-3.5 h-3.5" />
          <span>Need help? <Link href="/contact" className="text-blue-400 hover:underline">Contact Support</Link></span>
        </div>
      </div>
    </div>
  );
}
