"use client";

import { Suspense, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { X, Trash2, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import {
  Search01Icon, ShoppingBag01Icon, StarIcon, Add01Icon, EyeIcon,
  FilterIcon, BookOpen01Icon, GlobeIcon, Briefcase01Icon, School01Icon,
  UserCircleIcon, Rocket01Icon, ArrowRight01Icon,
} from "hugeicons-react";

type Category = "ALL" | "SERVICE" | "PRODUCT" | "NETWORK" | "TRAINING";

interface Listing {
  id: string; slug: string | null; title: string; description: string;
  category: string; price: number | null; tags: string[];
  images: string[];
  isFeatured: boolean; viewCount: number; createdAt: string;
  user: { id: string; name: string; image: string | null; headline: string | null; role: string; tier: string };
}

/* ── State ── */
type State = {
  listings:   Listing[];
  loading:    boolean;
  cat:        Category;
  search:     string;     // debounce input value
  query:      string;     // committed search value
  mounted:    boolean;
};
type Action =
  | { type: "SET_LISTINGS"; payload: Listing[] }
  | { type: "SET_LOADING";  payload: boolean }
  | { type: "SET_CAT";      payload: Category }
  | { type: "SET_SEARCH";   payload: string }
  | { type: "COMMIT_QUERY" }
  | { type: "CLEAR_SEARCH" }
  | { type: "MOUNTED" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LISTINGS": return { ...state, listings: action.payload };
    case "SET_LOADING":  return { ...state, loading: action.payload };
    case "SET_CAT":      return { ...state, cat: action.payload, loading: true };
    case "SET_SEARCH":   return { ...state, search: action.payload };
    case "COMMIT_QUERY": return { ...state, query: state.search, loading: true };
    case "CLEAR_SEARCH": return { ...state, search: "", query: "", loading: true };
    case "MOUNTED":      return { ...state, mounted: true };
    default: return state;
  }
}

/* ── Per-category config ── */
const CAT_CONFIG: Record<string, { label: string; icon: React.ElementType; pill: string; bg: string }> = {
  SERVICE:  { label: "Service",  icon: Briefcase01Icon,  pill: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",      bg: "bg-blue-50 dark:bg-blue-950/40"    },
  PRODUCT:  { label: "Product",  icon: ShoppingBag01Icon,pill: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",    bg: "bg-amber-50 dark:bg-amber-950/40"   },
  NETWORK:  { label: "Network",  icon: GlobeIcon,        pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  TRAINING: { label: "Course",   icon: School01Icon,     pill: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",  bg: "bg-purple-50 dark:bg-purple-950/40"  },
};
const DEFAULT_CFG = { label: "Other", icon: BookOpen01Icon, pill: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", bg: "bg-slate-50 dark:bg-slate-900" };
const CATS: Category[] = ["ALL", "SERVICE", "PRODUCT", "NETWORK", "TRAINING"];

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#172135] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 animate-pulse">
      <div className="h-44 bg-slate-200 dark:bg-slate-800" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-16" />
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

/* ── Grid card (vertical) ── */
function GridCard({ l, authed }: { l: Listing; authed: boolean }) {
  const cfg      = CAT_CONFIG[l.category] ?? DEFAULT_CFG;
  const slugOrId = l.slug ?? l.id;
  const href     = authed ? `/${slugOrId}` : `/login?redirect=/${slugOrId}`;
  const hasImage = !!(l.images?.[0]);

  return (
    <Link href={href}
      className="group bg-white dark:bg-[#172135] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-[0_0_25px_rgba(240,192,64,0.12)]">

      {/* Image / accent header */}
      <div className={`relative h-44 shrink-0 overflow-hidden ${hasImage ? "bg-slate-900" : cfg.bg}`}>
        {hasImage ? (
          <img src={l.images[0]} alt={l.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-black opacity-20 select-none">{cfg.label[0]}</span>
          </div>
        )}
        {/* Category pill overlay */}
        <span className={`absolute bottom-2.5 left-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${cfg.pill} shadow-md backdrop-blur-sm`}>
          {cfg.label}
        </span>
        {l.isFeatured && (
          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[9px] font-black text-[#d4a017] bg-white/95 dark:bg-[#0a1628]/95 px-2 py-0.5 rounded-full shadow-md">
            <StarIcon className="w-2.5 h-2.5 fill-[#d4a017]" /> Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-[#0a1628] dark:text-white text-base leading-snug line-clamp-2 group-hover:text-[#f0c040] transition-colors flex-1">
            {l.title}
          </h3>
          <span className="font-black text-[#0a1628] dark:text-white text-base shrink-0">
            {l.price ? `$${l.price.toLocaleString()}` : <span className="text-emerald-600 dark:text-emerald-400 text-xs">Free</span>}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed flex-1">
          {l.description}
        </p>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[#0a1628] overflow-hidden flex items-center justify-center shrink-0">
              {l.user.image
                ? <img src={l.user.image} alt={l.user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-[10px]">{l.user.name[0]?.toUpperCase()}</span>}
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">{l.user.name}</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <EyeIcon className="w-3 h-3" />{l.viewCount}
            </span>
            <span className="text-[11px] font-bold text-[#0a1628] dark:text-[#f0c040] flex items-center gap-0.5 group-hover:gap-1 transition-all">
              View <ArrowRight01Icon className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Sidebar ── */
function MarketplaceSidebar({
  user, cat, setCat, canSell, onClearAllListings,
}: {
  user: { name: string | null; image?: string | null; headline?: string | null; coverImage?: string | null; tier: string; role?: string } | null;
  cat: Category; setCat: (c: Category) => void; canSell: boolean;
  onClearAllListings?: () => void;
}) {
  return (
    <div className="space-y-3">
      {user && (
        <div className="bg-white dark:bg-[#172135] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* Banner */}
          <div className="h-24 relative">
            {user.coverImage
              ? <div className="absolute inset-0 overflow-hidden"><img src={user.coverImage} alt="" className="w-full h-full object-cover" /></div>
              : <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a3a6b] to-[#0d2a50]">
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                </div>
            }
            <div className="absolute -bottom-9 left-4">
              <div className="w-[72px] h-[72px] rounded-2xl bg-[#0a1628] border-[3px] border-white dark:border-[#172135] overflow-hidden flex items-center justify-center shadow-md">
                {user.image
                  ? <img src={user.image} alt={user.name ?? ""} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  : <span className="text-white font-black text-2xl">{user.name?.[0]?.toUpperCase()}</span>}
              </div>
            </div>
          </div>
          <div className="px-4 pt-12 pb-4">
            <div className="font-black text-[#0a1628] dark:text-white text-base">{user.name}</div>
            {user.headline
              ? <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{user.headline}</div>
              : <div className="text-sm text-slate-400 dark:text-slate-500 italic mt-0.5">No headline</div>}
          </div>
        </div>
      )}

      {canSell ? (
        <Link href="/marketplace/create"
          className="flex items-center justify-center gap-2 bg-[#0a1628] dark:bg-[#f0c040] text-white dark:text-[#0a1628] font-bold text-sm px-4 py-3 rounded-xl hover:bg-[#1a3a6b] dark:hover:bg-[#d4a017] transition-all w-full shadow-sm">
          <Add01Icon className="w-4 h-4" /> Create Listing
        </Link>
      ) : user ? (
        <Link href="/upgrade"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-bold text-sm px-4 py-3 rounded-xl transition-all w-full hover:shadow-md">
          <Rocket01Icon className="w-4 h-4" /> Upgrade to Sell
        </Link>
      ) : (
        <Link href="/register"
          className="flex items-center justify-center gap-2 bg-[#0a1628] dark:bg-[#f0c040] text-white dark:text-[#0a1628] font-bold text-sm px-4 py-3 rounded-xl hover:bg-[#1a3a6b] dark:hover:bg-[#d4a017] transition-all w-full">
          <UserCircleIcon className="w-4 h-4" /> Sign up to Sell
        </Link>
      )}

      {/* Admin Action Button */}
      {user?.role === "ADMIN" && onClearAllListings && (
        <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-3 border border-rose-200/80 dark:border-rose-900/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">Admin Action</span>
            <span className="text-[9px] font-bold bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 px-1.5 py-0.5 rounded">ADMIN</span>
          </div>
          <button
            type="button"
            onClick={onClearAllListings}
            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All Listings
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-[#172135] rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 px-2">Browse By</p>
        <div className="space-y-1">
          {CATS.map(c => {
            const cfg  = c === "ALL" ? null : CAT_CONFIG[c];
            const Icon = cfg?.icon ?? FilterIcon;
            return (
              <button key={c} onClick={() => setCat(c)}
                className={`flex items-center gap-2.5 w-full text-left text-sm font-semibold px-3 py-2.5 rounded-xl transition-all ${
                  cat === c
                    ? "bg-[#0a1628] dark:bg-white/10 text-white dark:text-[#f0c040]"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-[#0a1628] dark:hover:text-white"
                }`}>
                {c === "ALL" ? <ShoppingBag01Icon className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                {c === "ALL" ? "All Categories" : cfg!.label}
              </button>
            );
          })}
        </div>
      </div>

      {canSell && (
        <div className="space-y-1 bg-white dark:bg-[#172135] rounded-2xl p-2 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <Link href="/my-listings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-[#0a1628] dark:hover:text-white transition-all">
            <ShoppingBag01Icon className="w-4 h-4 text-slate-400" /> My Listings
          </Link>
          <Link href="/seller-dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-[#0a1628] dark:hover:text-white transition-all">
            <Rocket01Icon className="w-4 h-4 text-slate-400" /> Seller Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */
function MarketplaceContent() {
  const user         = useAppSelector(s => s.auth.user);
  const searchParams = useSearchParams();

  const [state, dispatch] = useReducer(reducer, {
    listings:  [],
    loading:   true,
    cat:       "ALL",
    search:    searchParams.get("search") ?? "",
    query:     searchParams.get("search") ?? "",
    mounted:   false,
  });

  const [showClearModal, setShowClearModal] = useState(false);
  const [clearingListings, setClearingListings] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const { listings, loading, cat, search, query, mounted } = state;
  const authedUser = mounted ? user : null;
  const canSell    = !!(authedUser && (
    authedUser.role === "ADMIN" || authedUser.role === "PROFESSIONAL" ||
    authedUser.tier === "MARKETPLACE" || authedUser.tier === "MARKETPLACE_PLUS"
  ));

  const firstRender = useRef(true);

  // Mount guard
  useEffect(() => { dispatch({ type: "MOUNTED" }); }, []);

  // Fetch listings
  useEffect(() => {
    const params = new URLSearchParams();
    if (cat !== "ALL") params.set("category", cat);
    if (query) params.set("search", query);
    dispatch({ type: "SET_LOADING", payload: true });
    fetch(`/api/marketplace?${params}`)
      .then(r => r.json())
      .then(data => dispatch({ type: "SET_LISTINGS", payload: Array.isArray(data) ? data : [] }))
      .catch(() => dispatch({ type: "SET_LISTINGS", payload: [] }))
      .finally(() => dispatch({ type: "SET_LOADING", payload: false }));
  }, [cat, query]);

  // Search debounce — skip on initial mount to avoid double-fetch
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const t = setTimeout(() => dispatch({ type: "COMMIT_QUERY" }), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleClearAllListings = async () => {
    setClearingListings(true);
    try {
      const res = await fetch("/api/admin/listings", { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SET_LISTINGS", payload: [] });
        setShowClearModal(false);
        setToastMsg(`Successfully cleared ${data.count ?? "all"} marketplace listings!`);
        setTimeout(() => setToastMsg(""), 4000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to clear listings");
      }
    } catch {
      alert("Error clearing listings");
    } finally {
      setClearingListings(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] dark:bg-[#0c1527] pt-6 pb-16">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-xl animate-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── Clear All Confirmation Modal ── */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#172135] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-[#0a1628] dark:text-white">Clear All Marketplace Listings?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                This will permanently delete <strong className="text-rose-600 dark:text-rose-400">ALL marketplace listings</strong> across the platform. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={clearingListings}
                onClick={() => setShowClearModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearingListings}
                onClick={handleClearAllListings}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 disabled:opacity-50"
              >
                {clearingListings ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  "Yes, Clear All"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4">

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] gap-6 items-start">

          {/* Sidebar - Touching Top */}
          <div className="hidden lg:block self-start sticky top-[90px] h-fit max-h-[calc(100vh-90px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <MarketplaceSidebar
              user={authedUser ? { ...authedUser, image: authedUser.image ?? null, headline: authedUser.headline ?? null, coverImage: authedUser.coverImage ?? null, role: authedUser.role } : null}
              cat={cat} setCat={c => dispatch({ type: "SET_CAT", payload: c })} canSell={canSell}
              onClearAllListings={() => setShowClearModal(true)}
            />
          </div>

          {/* Main Content Area */}
          <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-[#0a1628] dark:text-white">Marketplace</h1>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">
                  {listings.length > 0
                    ? <>{listings.length} listing{listings.length !== 1 ? "s" : ""}{loading && <span className="inline-block w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse ml-1.5 align-middle" />}</>
                    : loading ? "Loading listings…" : "No listings found"}
                </p>
              </div>
              {canSell && (
                <Link href="/marketplace/create"
                  className="flex items-center gap-2 bg-[#0a1628] dark:bg-[#f0c040] text-white dark:text-[#0a1628] font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#1a3a6b] dark:hover:bg-[#d4a017] transition-all shadow-sm">
                  <Add01Icon className="w-4 h-4" /> Create Listing
                </Link>
              )}
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-[#172135] rounded-xl px-4 py-3.5 flex items-center gap-3 border border-slate-200/80 dark:border-slate-800 shadow-sm focus-within:border-amber-400 dark:focus-within:border-amber-400 transition-colors">
              <Search01Icon className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search services, products, trainers…"
                value={search}
                onChange={e => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
                className="flex-1 bg-transparent font-[inherit] text-base text-slate-700 dark:text-white outline-none placeholder-slate-400 dark:placeholder-slate-500"
              />
              {search && (
                <button
                  onClick={() => dispatch({ type: "CLEAR_SEARCH" })}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* ── Banner Below Search Bar ── */}
            <div className="w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#172135]">
              <img
                src="/mrkeplace_cover.png"
                alt="TaxCompPro Marketplace - Your Marketplace. Your Opportunity."
                className="w-full h-auto object-cover max-h-[300px]"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {CATS.map(c => {
                const cfg  = c === "ALL" ? null : CAT_CONFIG[c];
                const Icon = cfg?.icon ?? ShoppingBag01Icon;
                return (
                  <button
                    key={c}
                    onClick={() => dispatch({ type: "SET_CAT", payload: c })}
                    className={`flex items-center gap-2 text-xs md:text-sm font-bold px-4 py-2 rounded-full transition-all shrink-0 border ${
                      cat === c
                        ? "bg-[#0a1628] dark:bg-[#f0c040] text-white dark:text-[#0a1628] border-transparent shadow-sm"
                        : "bg-white dark:bg-[#172135] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {c === "ALL" ? "All Categories" : cfg!.label}
                  </button>
                );
              })}
            </div>

            {/* Listings Grid */}
            {loading && listings.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : !loading && listings.length === 0 ? (
              <div className="bg-white dark:bg-[#172135] rounded-2xl py-24 text-center border border-slate-200/80 dark:border-slate-800">
                <ShoppingBag01Icon className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <p className="font-bold text-slate-400 text-lg">No listings found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {query ? "Try a different search term" : "Be the first to list your services, products, or courses!"}
                </p>
                {canSell && (
                  <Link
                    href="/marketplace/create"
                    className="inline-flex items-center gap-2 mt-5 bg-[#0a1628] dark:bg-[#f0c040] text-white dark:text-[#0a1628] font-bold text-sm px-6 py-3 rounded-full hover:bg-[#1a3a6b] dark:hover:bg-[#d4a017] transition-all shadow-sm"
                  >
                    <Add01Icon className="w-4 h-4" /> Create First Listing
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {listings.map(l => <GridCard key={l.id} l={l} authed={!!authedUser} />)}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f6fb] dark:bg-[#0c1527]" />}>
      <MarketplaceContent />
    </Suspense>
  );
}
