"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search, MapPin, Briefcase, Globe, Loader2, BadgeCheck,
  Shield, Check, ArrowRight, Star, Sparkles, UserCheck, ChevronRight
} from "lucide-react";

interface Pro {
  id: string;
  name: string;
  image: string | null;
  coverImage: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  yearsExperience: number | null;
  specialties: string[];
  certifications: string[];
}

const FILTER_PILLS = [
  { label: "All", value: "" },
  { label: "CPA", value: "CPA" },
  { label: "EA", value: "EA" },
  { label: "Attorney", value: "Attorney" },
  { label: "Bookkeeper", value: "Bookkeeper" },
  { label: "CFP", value: "CFP" },
  { label: "Consultant", value: "Consultant" },
  { label: "JD", value: "JD" },
  { label: "MBA", value: "MBA" },
];

export default function FindAProPage() {
  const [pros, setPros] = useState<Pro[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/pros?${params}`);
      const data = (await res.json()) as Pro[];

      if (selectedFilter) {
        setPros(
          data.filter(
            p =>
              (p.certifications && p.certifications.some(c => c.toLowerCase().includes(selectedFilter.toLowerCase()))) ||
              (p.headline && p.headline.toLowerCase().includes(selectedFilter.toLowerCase())) ||
              (p.specialties && p.specialties.some(s => s.toLowerCase().includes(selectedFilter.toLowerCase())))
          )
        );
      } else {
        setPros(data);
      }
    } catch {
      setPros([]);
    } finally {
      setLoading(false);
    }
  }, [q, selectedFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070f1e]">

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#060e1a] via-[#0a1628] to-[#142848] text-white py-16 sm:py-20 px-4 border-b border-slate-800 overflow-hidden">
        {/* Glow meshes */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold text-amber-300 mb-5 shadow-sm">
            <BadgeCheck className="w-4 h-4 text-amber-400" />
            Verified Professionals
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 text-white">
            Find a <span className="text-amber-400">Pro</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Connect with verified Enrolled Agents, CPAs, and tax specialists.
          </p>

          {/* Search Bar */}
          <div className="flex items-center gap-3 bg-white dark:bg-[#111c30] rounded-2xl px-5 py-3.5 mt-8 max-w-2xl mx-auto shadow-2xl border border-slate-200/40 dark:border-slate-700">
            <Search className="w-5 h-5 text-amber-500 shrink-0" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by name or specialty…"
              className="flex-1 text-slate-800 dark:text-white text-sm outline-none placeholder-slate-400 bg-transparent font-[inherit]"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white px-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-12">

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-8 justify-center sm:justify-start">
          {FILTER_PILLS.map(pill => {
            const active = selectedFilter === pill.value;
            return (
              <button
                key={pill.label}
                onClick={() => setSelectedFilter(pill.value)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all ${
                  active
                    ? "bg-[#0a1628] text-white border-[#0a1628] shadow-md dark:bg-amber-400 dark:text-[#0a1628] dark:border-amber-400"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400/50 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Professional Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-3" />
            <p className="text-sm font-bold text-slate-500">Loading verified professionals…</p>
          </div>
        ) : pros.length === 0 ? (
          <div className="bg-white dark:bg-[#111c30] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center max-w-lg mx-auto shadow-sm my-8">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search className="w-8 h-8" />
            </div>
            <p className="text-[#0a1628] dark:text-white text-lg font-black">No professionals found</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-6">
              Try adjusting your search query or choosing a different filter.
            </p>
            <button
              onClick={() => {
                setQ("");
                setSelectedFilter("");
              }}
              className="px-6 py-2.5 bg-[#0a1628] text-white text-xs font-bold rounded-xl hover:bg-[#1a3a6b] transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pros.map(pro => (
              <Link
                key={pro.id}
                href={`/find-a-pro/${pro.id}`}
                className="group bg-white dark:bg-[#111c30] rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-400/60 dark:hover:border-amber-400/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Cover Header */}
                <div className="h-24 bg-gradient-to-br from-[#0a1628] via-[#102544] to-[#1a3a6b] relative overflow-hidden">
                  {pro.coverImage && (
                    <img
                      src={pro.coverImage}
                      alt=""
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  {/* Floating Avatar */}
                  <div className="absolute -bottom-6 left-5">
                    <div className="w-14 h-14 rounded-2xl border-2 border-white dark:border-slate-800 bg-[#0a1628] overflow-hidden flex items-center justify-center shadow-lg relative">
                      {pro.image ? (
                        <img
                          src={pro.image}
                          alt={pro.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-black text-xl">{pro.name[0]}</span>
                      )}
                    </div>
                  </div>
                  {/* Cert badge top right */}
                  {pro.certifications.length > 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-black bg-amber-400/90 text-[#0a1628] px-2.5 py-1 rounded-full shadow-sm">
                        {pro.certifications[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="pt-8 px-5 pb-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h2 className="font-bold text-[#0a1628] dark:text-white text-base group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors leading-snug truncate">
                      {pro.name}
                    </h2>
                    <BadgeCheck className="w-4 h-4 text-amber-500 shrink-0" />
                  </div>

                  {pro.headline && (
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-3 line-clamp-1 font-medium">
                      {pro.headline}
                    </p>
                  )}

                  {/* Specialties chips */}
                  {pro.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {pro.specialties.slice(0, 3).map(s => (
                        <span
                          key={s}
                          className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-md"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta details footer */}
                  <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      {pro.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-500" />
                          <span className="truncate max-w-[100px]">{pro.location}</span>
                        </span>
                      )}
                      {pro.yearsExperience && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          {pro.yearsExperience}+ yrs
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-amber-500 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-[11px]">
                      View <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA for members */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="bg-gradient-to-br from-[#0a1628] via-[#102444] to-[#1a3a6b] rounded-3xl p-8 sm:p-10 text-white text-center shadow-2xl border border-slate-800 relative overflow-hidden">
          <div className="w-14 h-14 bg-amber-400/20 border border-amber-400/40 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BadgeCheck className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">Are you a Professional?</h2>
          <p className="text-slate-300 text-sm sm:text-base mb-6 max-w-lg mx-auto leading-relaxed">
            Join the directory and get discovered.
          </p>
          <Link
            href="/apply-professional"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-black text-sm px-8 py-3.5 rounded-full hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-105 transition-all"
          >
            Get Listed <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}
