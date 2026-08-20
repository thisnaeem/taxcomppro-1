"use client";

import { Suspense, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { LayoutList, LayoutGrid, X } from "lucide-react";
import {
  Search01Icon, ShoppingBag01Icon, StarIcon, Add01Icon, EyeIcon,
  FilterIcon, BookOpen01Icon, GlobeIcon, Briefcase01Icon, School01Icon,
  UserCircleIcon, Rocket01Icon, ArrowRight01Icon,
} from "hugeicons-react";

type Category  = "ALL" | "SERVICE" | "PRODUCT" | "NETWORK" | "TRAINING";
type ViewMode  = "list" | "grid";

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
  viewMode:   ViewMode;
  mounted:    boolean;
};
type Action =
  | { type: "SET_LISTINGS"; payload: Listing[] }
  | { type: "SET_LOADING";  payload: boolean }
  | { type: "SET_CAT";      payload: Category }
  | { type: "SET_SEARCH";   payload: string }
  | { type: "COMMIT_QUERY" }
  | { type: "CLEAR_SEARCH" }
  | { type: "SET_VIEW";     payload: ViewMode }
  | { type: "MOUNTED" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LISTINGS": return { ...state, listings: action.payload };
    case "SET_LOADING":  return { ...state, loading: action.payload };
    case "SET_CAT":      return { ...state, cat: action.payload, loading: true };
    case "SET_SEARCH":   return { ...state, search: action.payload };
    case "COMMIT_QUERY": return { ...state, query: state.search, loading: true };
    case "CLEAR_SEARCH": return { ...state, search: "", query: "", loading: true };
    case "SET_VIEW":     return { ...state, viewMode: action.payload };
    case "MOUNTED":      return { ...state, mounted: true };
    default: return state;
  }
}

/* ── Per-category config ── */
const CAT_CONFIG: Record<string, { label: string; icon: React.ElementType; pill: string; bg: string }> = {
  SERVICE:  { label: "Service",  icon: Briefcase01Icon,  pill: "bg-blue-100 text-blue-700",      bg: "bg-blue-50"    },
  PRODUCT:  { label: "Product",  icon: ShoppingBag01Icon,pill: "bg-amber-100 text-amber-700",    bg: "bg-amber-50"   },
  NETWORK:  { label: "Network",  icon: GlobeIcon,        pill: "bg-emerald-100 text-emerald-700", bg: "bg-emerald-50" },
  TRAINING: { label: "Course", icon: School01Icon,     pill: "bg-purple-100 text-purple-700",  bg: "bg-purple-50"  },
};
const DEFAULT_CFG = { label: "Other", icon: BookOpen01Icon, pill: "bg-slate-100 text-slate-600", bg: "bg-slate-50" };
const CATS: Category[] = ["ALL", "SERVICE", "PRODUCT", "NETWORK", "TRAINING"];

/* ── Skeleton ── */
function SkeletonCard({ grid }: { grid?: boolean }) {
  return grid ? (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
      <div className="h-40 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-200 rounded w-16" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-6 bg-slate-200 rounded w-16" />
          <div className="h-5 bg-slate-200 rounded-full w-20" />
        </div>
      </div>
    </div>
  ) : (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse flex h-32">
      <div className="w-40 bg-slate-200 shrink-0" />
      <div className="flex-1 p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-3 bg-slate-200 rounded w-16" />
          <div className="h-5 bg-slate-200 rounded w-14" />
        </div>
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-3/4" />
      </div>
    </div>
  );
}

/* ── List card (horizontal) ── */
function ListCard({ l, authed }: { l: Listing; authed: boolean }) {
  const cfg      = CAT_CONFIG[l.category] ?? DEFAULT_CFG;
  const slugOrId = l.slug ?? l.id;
  const href     = authed ? `/${slugOrId}` : `/login?redirect=/${slugOrId}`;
  const hasImage = !!(l.images?.[0]);

  return (
    <Link href={href}
      className="group bg-white rounded-2xl overflow-hidden flex flex-row transition-all hover:-translate-y-0.5 hover:shadow-md min-h-[8.5rem]">

      {/* Left: image or accent */}
      <div className={`relative shrink-0 w-36 sm:w-44 ${hasImage ? "" : cfg.bg}`}>
        {hasImage ? (
          <img src={l.images[0]} alt={l.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-black opacity-20 select-none">{cfg.label[0]}</span>
          </div>
        )}
        {/* Left accent bar */}
        <div className={`absolute left-0 inset-y-0 w-1 ${cfg.pill.split(" ")[0].replace("bg-", "bg-").replace("100", "400")}`} />
        {l.isFeatured && (
          <span className="absolute top-2 left-3 flex items-center gap-0.5 text-[9px] font-black text-[#d4a017] bg-white/90 px-1.5 py-0.5 rounded-full shadow-sm">
            <StarIcon className="w-2.5 h-2.5" /> Featured
          </span>
        )}
      </div>

      {/* Right: content */}
      <div className="flex-1 min-w-0 px-5 py-4 flex flex-col justify-between gap-1.5">
        {/* Top: pill + price */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.pill}`}>{cfg.label}</span>
          <span className="text-xl font-black text-[#0a1628] leading-none tabular-nums">
            {l.price != null ? `$${l.price.toLocaleString()}` : <span className="text-base text-emerald-600">Free</span>}
          </span>
        </div>

        {/* Title + desc */}
        <div>
          <h3 className="font-black text-[#0a1628] text-base leading-snug line-clamp-1 group-hover:text-[#1a3a6b] transition-colors">
            {l.title}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mt-0.5">{l.description}</p>
        </div>

        {/* Bottom: tags + seller + views + cta */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            {l.tags.slice(0, 2).map(t => (
              <span key={t} className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full font-medium">#{t}</span>
            ))}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[#0a1628] overflow-hidden flex items-center justify-center shrink-0">
                {l.user.image
                  ? <img src={l.user.image} alt={l.user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  : <span className="text-white font-bold text-[9px]">{l.user.name?.[0]?.toUpperCase()}</span>}
              </div>
              <span className="text-xs font-semibold text-slate-500 max-w-[80px] truncate hidden sm:block">{l.user.name}</span>
            </div>
            <span className="flex items-center gap-0.5 text-[10px] text-slate-300">
              <EyeIcon className="w-3 h-3" />{l.viewCount}
            </span>
            <span className="flex items-center gap-0.5 text-xs font-bold text-[#0a1628] group-hover:gap-1 transition-all">
              View <ArrowRight01Icon className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
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
      className="group bg-white rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg">

      {/* Image / accent header */}
      <div className={`relative h-40 shrink-0 ${hasImage ? "" : cfg.bg}`}>
        {hasImage ? (
          <img src={l.images[0]} alt={l.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-black opacity-20 select-none">{cfg.label[0]}</span>
          </div>
        )}
        {/* Category pill overlay */}
        <span className={`absolute bottom-2 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.pill} shadow-sm`}>{cfg.label}</span>
        {l.isFeatured && (
          <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[9px] font-black text-[#d4a017] bg-white/90 px-1.5 py-0.5 rounded-full shadow-sm">
            <StarIcon className="w-2.5 h-2.5" /> Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-[#0a1628] text-base leading-snug line-clamp-2 group-hover:text-[#1a3a6b] transition-colors flex-1">
            {l.title}
          </h3>
          <span className="text-lg font-black text-[#0a1628] shrink-0 tabular-nums">
            {l.price != null ? `$${l.price.toLocaleString()}` : <span className="text-sm text-emerald-600 font-bold">Free</span>}
          </span>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{l.description}</p>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#0a1628] overflow-hidden flex items-center justify-center shrink-0">
              {l.user.image
                ? <img src={l.user.image} alt={l.user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-[9px]">{l.user.name?.[0]?.toUpperCase()}</span>}
            </div>
            <span className="text-xs font-semibold text-slate-400 max-w-[90px] truncate">{l.user.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-[10px] text-slate-300">
              <EyeIcon className="w-3 h-3" />{l.viewCount}
            </span>
            <span className="text-[11px] font-bold text-[#0a1628] flex items-center gap-0.5 group-hover:gap-1 transition-all">
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
  user, cat, setCat, canSell,
}: {
  user: { name: string | null; image?: string | null; headline?: string | null; coverImage?: string | null; tier: string } | null;
  cat: Category; setCat: (c: Category) => void; canSell: boolean;
}) {
  return (
    <div className="space-y-2.5">
      {user && (
        <div className="bg-white rounded-2xl overflow-hidden">
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
              <div className="w-[72px] h-[72px] rounded-2xl bg-[#0a1628] border-[3px] border-white overflow-hidden flex items-center justify-center shadow-md">
                {user.image
                  ? <img src={user.image} alt={user.name ?? ""} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  : <span className="text-white font-black text-2xl">{user.name?.[0]?.toUpperCase()}</span>}
              </div>
            </div>
          </div>
          <div className="px-4 pt-12 pb-4">
            <div className="font-black text-[#0a1628] text-base">{user.name}</div>
            {user.headline
              ? <div className="text-sm text-slate-500 mt-0.5 line-clamp-2">{user.headline}</div>
              : <div className="text-sm text-slate-400 italic mt-0.5">No headline</div>}
          </div>
        </div>
      )}

      {canSell ? (
        <Link href="/marketplace/create"
          className="flex items-center justify-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-4 py-3 rounded-xl hover:bg-[#1a3a6b] transition-all w-full">
          <Add01Icon className="w-4 h-4" /> Create Listing
        </Link>
      ) : user ? (
        <Link href="/upgrade"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-bold text-sm px-4 py-3 rounded-xl transition-all w-full hover:shadow-md">
          <Rocket01Icon className="w-4 h-4" /> Upgrade to Sell
        </Link>
      ) : (
        <Link href="/register"
          className="flex items-center justify-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-4 py-3 rounded-xl hover:bg-[#1a3a6b] transition-all w-full">
          <UserCircleIcon className="w-4 h-4" /> Sign up to Sell
        </Link>
      )}

      <div className="bg-white rounded-2xl p-3">
        <p className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2 px-2">Browse By</p>
        <div className="space-y-0.5">
          {CATS.map(c => {
            const cfg  = c === "ALL" ? null : CAT_CONFIG[c];
            const Icon = cfg?.icon ?? FilterIcon;
            return (
              <button key={c} onClick={() => setCat(c)}
                className={`flex items-center gap-2.5 w-full text-left text-sm font-semibold px-3 py-2.5 rounded-xl transition-all ${cat === c ? "bg-[#0a1628] text-white" : "text-slate-600 hover:bg-slate-50 hover:text-[#0a1628]"}`}>
                {c === "ALL" ? <ShoppingBag01Icon className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                {c === "ALL" ? "All Categories" : cfg!.label}
              </button>
            );
          })}
        </div>
      </div>

      {canSell && (
        <div className="space-y-0.5">
          <Link href="/my-listings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white hover:text-[#0a1628] transition-all">
            <ShoppingBag01Icon className="w-4 h-4 text-slate-400" /> My Listings
          </Link>
          <Link href="/seller-dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white hover:text-[#0a1628] transition-all">
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
    viewMode:  "list",
    mounted:   false,
  });

  const { listings, loading, cat, search, query, viewMode, mounted } = state;
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

  const isGrid = viewMode === "grid";

  return (
    <div className="min-h-screen bg-[#f4f6fb] pt-4 pb-12">
      <div className="max-w-[1320px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

          {/* Sidebar */}
          <div className="hidden lg:block self-start sticky top-[100px] h-fit max-h-[calc(100vh-100px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <MarketplaceSidebar
              user={authedUser ? { ...authedUser, image: authedUser.image ?? null, headline: authedUser.headline ?? null, coverImage: authedUser.coverImage ?? null } : null}
              cat={cat} setCat={c => dispatch({ type: "SET_CAT", payload: c })} canSell={canSell}
            />
          </div>

          {/* Main */}
          <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-black text-[#0a1628]">Marketplace</h1>
                <p className="text-slate-400 text-base mt-0.5">
                  {listings.length > 0
                    ? <>{listings.length} listing{listings.length !== 1 ? "s" : ""}{loading && <span className="inline-block w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse ml-1.5 align-middle" />}</>
                    : loading ? "Loading…" : "No listings"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* View toggle */}
                <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 gap-0.5">
                  <button onClick={() => dispatch({ type: "SET_VIEW", payload: "list" })}
                    className={`p-2 rounded-lg transition-all ${!isGrid ? "bg-[#0a1628] text-white" : "text-slate-400 hover:text-slate-600"}`}
                    title="List view">
                    <LayoutList className="w-4 h-4" />
                  </button>
                  <button onClick={() => dispatch({ type: "SET_VIEW", payload: "grid" })}
                    className={`p-2 rounded-lg transition-all ${isGrid ? "bg-[#0a1628] text-white" : "text-slate-400 hover:text-slate-600"}`}
                    title="Grid view">
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
                {canSell && (
                  <Link href="/marketplace/create"
                    className="flex items-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#1a3a6b] transition-all lg:hidden">
                    <Add01Icon className="w-4 h-4" /> Create
                  </Link>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3">
              <Search01Icon className="w-4 h-4 text-slate-400 shrink-0" />
              <input type="text" placeholder="Search services, products, trainers…"
                value={search} onChange={e => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
                className="flex-1 bg-transparent font-[inherit] text-base text-slate-700 outline-none placeholder-slate-400" />
              {search && (
                <button onClick={() => dispatch({ type: "CLEAR_SEARCH" })}
                  className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile category chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {CATS.map(c => (
                <button key={c} onClick={() => dispatch({ type: "SET_CAT", payload: c })}
                  className={`text-xs font-semibold px-3.5 py-2 rounded-full transition-all shrink-0 ${cat === c ? "bg-[#0a1628] text-white" : "bg-white text-slate-600"}`}>
                  {c === "ALL" ? "All" : CAT_CONFIG[c]?.label}
                </button>
              ))}
            </div>

            {/* Cards */}
            {loading && listings.length === 0 ? (
              /* True initial load — show skeletons */
              isGrid
                ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <SkeletonCard key={i} grid />)}</div>
                : <div className="space-y-3">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
            ) : !loading && listings.length === 0 ? (
              /* Empty state */
              <div className="bg-white rounded-2xl py-24 text-center">
                <ShoppingBag01Icon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="font-bold text-slate-400 text-lg">No listings found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {query ? "Try a different search term" : "Be the first to list your services!"}
                </p>
                {canSell && (
                  <Link href="/marketplace/create"
                    className="inline-flex items-center gap-2 mt-5 bg-[#0a1628] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#1a3a6b] transition-all">
                    <Add01Icon className="w-4 h-4" /> Create First Listing
                  </Link>
                )}
              </div>
            ) : (
              /* Show listings — always fully interactive */
              isGrid ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {listings.map(l => <GridCard key={l.id} l={l} authed={!!authedUser} />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {listings.map(l => <ListCard key={l.id} l={l} authed={!!authedUser} />)}
                </div>
              )
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f6fb]" />}>
      <MarketplaceContent />
    </Suspense>
  );
}
