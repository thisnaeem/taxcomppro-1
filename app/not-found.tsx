"use client";

import Link from "next/link";
import {
  ArrowLeft01Icon, Home01Icon, ShoppingBag01Icon,
  UserGroupIcon, BookOpen01Icon, Search01Icon
} from "hugeicons-react";
import { Sparkles, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative px-4 py-16 overflow-hidden bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950 font-[var(--font-urbanist,Urbanist),sans-serif]">
      {/* Ambient Background Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/10 via-blue-600/10 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl text-xs font-bold text-amber-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>ERROR 404 • PAGE NOT FOUND</span>
        </div>

        {/* Graphic & 404 Hero Number */}
        <div className="relative flex flex-col items-center justify-center my-4">
          <h1 className="text-8xl sm:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-600 select-none drop-shadow-2xl">
            404
          </h1>
          <div className="absolute -bottom-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-center">
            <FileQuestion className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        {/* Heading & Text */}
        <div className="space-y-3 pt-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Looking for something here?
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            The page, listing, or resource you are trying to reach doesn't exist, has been removed, or is pending approval.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm px-6 py-3.5 rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all duration-200 shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <ShoppingBag01Icon className="w-4 h-4" />
            Back to Marketplace
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-sm px-6 py-3.5 rounded-xl transition-all duration-200 active:scale-95 shadow-md"
          >
            <Home01Icon className="w-4 h-4" />
            Return Home
          </Link>

          <button
            onClick={() => typeof window !== "undefined" && window.history.back()}
            className="inline-flex items-center gap-2 bg-transparent hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent font-medium text-sm px-4 py-3.5 rounded-xl transition-all"
          >
            <ArrowLeft01Icon className="w-4 h-4" />
            Previous Page
          </button>
        </div>

        {/* Quick Links Card */}
        <div className="pt-8 border-t border-slate-800/80">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Explore Popular Sections
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <Link
              href="/marketplace"
              className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 transition-all group"
            >
              <ShoppingBag01Icon className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-sm text-slate-200 group-hover:text-amber-400 transition-colors">Marketplace</div>
              <div className="text-xs text-slate-500">Tools & Services</div>
            </Link>

            <Link
              href="/communities"
              className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 transition-all group"
            >
              <UserGroupIcon className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-sm text-slate-200 group-hover:text-amber-400 transition-colors">Communities</div>
              <div className="text-xs text-slate-500">Pro Network</div>
            </Link>

            <Link
              href="/courses"
              className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 transition-all group"
            >
              <BookOpen01Icon className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-sm text-slate-200 group-hover:text-amber-400 transition-colors">Courses</div>
              <div className="text-xs text-slate-500">Tax Training</div>
            </Link>

            <Link
              href="/tools"
              className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 transition-all group"
            >
              <Search01Icon className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-sm text-slate-200 group-hover:text-amber-400 transition-colors">AI Tools</div>
              <div className="text-xs text-slate-500">Tax Utilities</div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
