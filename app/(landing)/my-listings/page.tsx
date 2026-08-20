"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  ShoppingBag01Icon, Add01Icon, Clock01Icon, Tick02Icon, Cancel01Icon,
  EyeIcon, ArrowRight01Icon,
} from "hugeicons-react";

interface Listing {
  id: string; title: string; category: string; price: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED"; viewCount: number; createdAt: string;
}

const catLabels: Record<string, string> = {
  SERVICE: "Service", PRODUCT: "Product", NETWORK: "Network", TRAINING: "Course",
};
const catColors: Record<string, string> = {
  SERVICE: "bg-blue-100 text-blue-700",
  PRODUCT: "bg-amber-100 text-amber-700",
  NETWORK: "bg-emerald-100 text-emerald-700",
  TRAINING: "bg-purple-100 text-purple-700",
};
const statusConfig = {
  PENDING:  { label: "Pending Review", cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Live",           cls: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Rejected",       cls: "bg-red-100 text-red-600" },
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="h-3 bg-slate-200 rounded w-1/3" />
      </div>
      <div className="h-6 w-16 bg-slate-200 rounded-full hidden md:block" />
      <div className="h-5 w-12 bg-slate-200 rounded hidden md:block" />
      <div className="h-6 w-24 bg-slate-200 rounded-full" />
      <div className="h-4 w-8 bg-slate-200 rounded ml-auto" />
    </div>
  );
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [canSell,  setCanSell]  = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch("/api/marketplace/my")
      .then(r => {
        if (r.status === 403) { setCanSell(false); return []; }
        return r.json();
      })
      .then(d => setListings(Array.isArray(d) ? d : []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  if (!canSell) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-12 text-center max-w-md mx-auto">
        <ShoppingBag01Icon className="w-14 h-14 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-black text-[#0a1628] mb-2">Marketplace Access Required</h2>
        <p className="text-slate-500 text-sm mb-6">Upgrade to Marketplace or Marketplace Plus to create and manage listings.</p>
        <Link href="/upgrade"
          className="inline-flex items-center gap-2 bg-[#0a1628] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#1a3a6b] transition-all">
          Upgrade Now <ArrowRight01Icon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 pt-4 pb-12">
      <div className="max-w-4xl mx-auto px-4 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#0a1628]">My Listings</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {loading ? "Loading…" : `${listings.length} listing${listings.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/marketplace"
              className="text-sm font-semibold text-slate-500 hover:text-[#0a1628] px-4 py-2.5 rounded-xl hover:bg-white transition-all">
              Browse Marketplace
            </Link>
            <Link href="/marketplace/create"
              className="flex items-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#1a3a6b] transition-all">
              <Add01Icon className="w-4 h-4" /> Create Listing
            </Link>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-100">
            {[1,2,3,4].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl py-24 text-center">
            <ShoppingBag01Icon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="font-bold text-slate-400 text-lg">No listings yet</p>
            <p className="text-slate-400 text-sm mt-1">Create your first listing to start selling on the marketplace.</p>
            <Link href="/marketplace/create"
              className="inline-flex items-center gap-2 mt-5 bg-[#0a1628] text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#1a3a6b] transition-all">
              <Add01Icon className="w-4 h-4" /> Create First Listing
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Table head */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Listing</span>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 hidden md:block">Category</span>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 hidden md:block">Price</span>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Status</span>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 text-right">
                <EyeIcon className="w-4 h-4 inline" />
              </span>
            </div>
            {/* Rows */}
            <div className="divide-y divide-slate-50">
              {listings.map(l => {
                const sc = statusConfig[l.status];
                return (
                  <div key={l.id}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-slate-50/70 transition-colors">
                    <div>
                      <div className="font-bold text-[#0a1628] text-sm leading-snug">{l.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{new Date(l.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full hidden md:inline-flex ${catColors[l.category] ?? "bg-slate-100 text-slate-600"}`}>
                      {catLabels[l.category] ?? l.category}
                    </span>
                    <span className="font-bold text-[#0a1628] text-sm hidden md:block">
                      {l.price != null ? `$${l.price}` : "Free"}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${sc.cls}`}>
                      {l.status === "APPROVED"
                        ? <Tick02Icon className="w-3 h-3" />
                        : l.status === "PENDING"
                        ? <Clock01Icon className="w-3 h-3" />
                        : <Cancel01Icon className="w-3 h-3" />}
                      {sc.label}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 text-right">{l.viewCount}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
