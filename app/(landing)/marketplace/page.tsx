"use client";

import { Suspense, useEffect, useReducer, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import {
  Search01Icon,
  ShoppingBag01Icon,
  StarIcon,
  Add01Icon,
  ArrowRight01Icon,
  Briefcase01Icon,
  GlobeIcon,
  School01Icon,
  Rocket01Icon,
  Cancel01Icon,
  FilterIcon,
  Settings01Icon,
  CheckmarkCircle02Icon as CheckCircle2,
  Clock01Icon as Clock,
  Delete02Icon as Trash2,
  Loading03Icon as Loader2,
  EyeIcon,
  Tick02Icon,
  LockIcon,
} from "hugeicons-react";
import { GridSwitcher, useGridView, type GridViewType } from "@/components/pros/GridSwitcher";
import "./marketplace.css";

const MK_GRID_OPTIONS: GridViewType[] = ["grid-4", "grid-3", "grid-2"];

type Category = "ALL" | "SERVICE" | "PRODUCT" | "NETWORK" | "TRAINING";
type Price = "all" | "free" | "under100" | "100plus";
type Sort = "recommended" | "newest" | "low" | "high";
type MarketplaceView = "discover" | "purchases" | "listings";

interface Listing {
  href?: string;
  billingPeriod?: string;
  id: string;
  slug: string | null;
  title: string;
  description: string;
  category: string;
  price: number | null;
  tags: string[];
  images: string[];
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
}

interface MarketplacePurchase {
  id: string;
  createdAt: string;
  price: number;
  listing: {
    id: string;
    slug: string | null;
    title: string;
    description: string | null;
    category: string;
    images: string[];
    price: number;
    user: {
      name: string;
      image: string | null;
    };
  };
}

interface MyListing {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  category: string;
  price: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  viewCount: number;
  images: string[];
  isFeatured: boolean;
  createdAt: string;
}

const categories = [
  { value: "ALL", label: "Discover all", icon: ShoppingBag01Icon },
  { value: "SERVICE", label: "Services", icon: Briefcase01Icon },
  { value: "PRODUCT", label: "Products", icon: ShoppingBag01Icon },
  { value: "NETWORK", label: "Networks", icon: GlobeIcon },
  { value: "TRAINING", label: "Courses", icon: School01Icon },
] as const;

const prices: { value: Price; label: string }[] = [
  { value: "all", label: "Any price" },
  { value: "free", label: "Free" },
  { value: "under100", label: "Under $100" },
  { value: "100plus", label: "$100 and up" },
];

function ListingCard({ listing: l }: { listing: Listing }) {
  const category = categories.find((c) => c.value === l.category) ?? categories[0];
  const Icon = category.icon;
  return (
    <Link className="mk-card" href={l.href || `/${l.slug || l.id}`}>
      <div className="mk-cover">
        {l.images?.[0] ? (
          <img src={l.images[0]} alt={l.title} loading="lazy" />
        ) : (
          <div className="mk-cover-placeholder">
            <Icon size={44} />
            <span>{category.label}</span>
          </div>
        )}
        <span className="mk-category">{category.label}</span>
        {l.isFeatured && (
          <span className="mk-featured">
            <StarIcon size={14} /> Featured
          </span>
        )}
      </div>
      <div className="mk-card-body">
        <strong className="mk-price">
          {l.price == null
            ? "Contact for pricing"
            : l.price === 0
            ? "Free"
            : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(l.price)}
          {l.billingPeriod && !!l.price && "/mo"}
        </strong>
        <h2>{l.title}</h2>
        <p>{l.description}</p>
        <div className="mk-seller">
          <span className="mk-avatar">
            {l.user.image ? (
              <img src={l.user.image} alt="" loading="lazy" referrerPolicy="no-referrer" />
            ) : (
              l.user.name?.[0]
            )}
          </span>
          <span>{l.user.name}</span>
          <ArrowRight01Icon size={18} />
        </div>
      </div>
    </Link>
  );
}

function PurchaseCard({ p }: { p: MarketplacePurchase }) {
  const l = p.listing;
  const category = categories.find((c) => c.value === l.category) ?? categories[0];
  const Icon = category.icon;
  return (
    <div className="mk-card">
      <div className="mk-cover">
        {l.images?.[0] ? (
          <img src={l.images[0]} alt={l.title} loading="lazy" />
        ) : (
          <div className="mk-cover-placeholder">
            <Icon size={44} />
            <span>{category.label}</span>
          </div>
        )}
        <span className="mk-category">{category.label}</span>
        <span className="mk-purchased">
          <CheckCircle2 size={13} /> Purchased
        </span>
      </div>
      <div className="mk-card-body">
        <strong className="mk-price">
          {p.price === 0
            ? "Free"
            : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(p.price)}
        </strong>
        <h2>{l.title}</h2>
        {l.description && <p>{l.description}</p>}
        <div className="mk-seller">
          <span className="mk-avatar">
            {l.user.image ? (
              <img src={l.user.image} alt="" loading="lazy" referrerPolicy="no-referrer" />
            ) : (
              l.user.name?.[0]
            )}
          </span>
          <span>{l.user.name}</span>
          <span className="text-[11px] text-slate-400 dark:text-slate-400 ml-auto">
            {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <div className="mk-card-actions">
          <Link href={`/${l.slug || l.id}`} className="mk-card-action-btn primary">
            Access Item <ArrowRight01Icon size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MyListingCard({
  listing: l,
  onDelete,
  deleting,
}: {
  listing: MyListing;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const category = categories.find((c) => c.value === l.category) ?? categories[0];
  const Icon = category.icon;
  const status = l.status.toLowerCase();
  return (
    <div className="mk-card">
      <div className="mk-cover">
        {l.images?.[0] ? (
          <img src={l.images[0]} alt={l.title} loading="lazy" />
        ) : (
          <div className="mk-cover-placeholder">
            <Icon size={44} />
            <span>{category.label}</span>
          </div>
        )}
        <span className="mk-category">{category.label}</span>
        {l.isFeatured && (
          <span className="mk-featured">
            <StarIcon size={14} /> Featured
          </span>
        )}
      </div>
      <div className="mk-card-body">
        <div className="flex items-center justify-between gap-2">
          <strong className="mk-price">
            {l.price == null
              ? "Contact for pricing"
              : l.price === 0
              ? "Free"
              : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(l.price)}
          </strong>
          <span className={`mk-status-badge ${status}`}>
            {status === "approved" ? <Tick02Icon size={13} /> : status === "pending" ? <Clock size={13} /> : <Cancel01Icon size={13} />}
            {status === "approved" ? "Live" : status === "pending" ? "In Review" : "Rejected"}
          </span>
        </div>
        <h2>{l.title}</h2>
        {l.description && <p>{l.description}</p>}
        <div className="mk-seller">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <EyeIcon size={15} /> {l.viewCount ?? 0} view{(l.viewCount ?? 0) !== 1 ? "s" : ""}
          </span>
          <span className="text-[11px] text-slate-400 ml-auto">
            {new Date(l.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <div className="mk-card-actions">
          <Link href={`/${l.slug || l.id}`} target="_blank" className="mk-card-action-btn secondary">
            View <ArrowRight01Icon size={15} />
          </Link>
          <button
            onClick={() => onDelete(l.id)}
            disabled={deleting}
            className="mk-card-action-btn danger !flex-initial px-3"
            title="Delete listing"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function ListingSkeletons() {
  return (
    <div role="status" aria-label="Loading marketplace listings">
      <span className="sr-only">Loading listings…</span>
      <div className="mk-grid" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <div className="mk-card mk-skeleton" key={i}>
            <div className="mk-cover" />
            <div className="mk-card-body">
              <i />
              <i />
              <i />
              <div className="mk-seller">
                <i />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketplaceContent() {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const params = useSearchParams();

  const requestedView = params.get("view");
  const currentView: MarketplaceView =
    requestedView === "purchases" || requestedView === "listings" ? requestedView : "discover";

  const [mounted, mount] = useReducer(() => true, false);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [category, setCategory] = useState<Category>("ALL");
  const [price, setPrice] = useState<Price>("all");
  const [sort, setSort] = useState<Sort>("recommended");
  const [featured, setFeatured] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [gridView, setGridView] = useGridView("mk-grid-view", "grid-3", MK_GRID_OPTIONS);
  const [request, retry] = useReducer((n) => n + 1, 0);

  // Discover data
  const [data, setData] = useState<{ listings: Listing[]; loading: boolean; error: string }>({
    listings: [],
    loading: true,
    error: "",
  });

  // Purchases data
  const [purchases, setPurchases] = useState<MarketplacePurchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasesLoaded, setPurchasesLoaded] = useState(false);

  // My listings data
  const [myListings, setMyListings] = useState<MyListing[]>([]);
  const [myListingsLoading, setMyListingsLoading] = useState(false);
  const [myListingsLoaded, setMyListingsLoaded] = useState(false);
  const [listingStatusFilter, setListingStatusFilter] = useState<"ALL" | "APPROVED" | "PENDING" | "REJECTED">("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    mount();
  }, []);

  // Fetch Discover listings
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/marketplace", { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error("Unable to load listings. Please try again.");
        const listings = await r.json();
        if (!Array.isArray(listings)) throw new Error("Unable to load listings. Please try again.");
        if (!controller.signal.aborted) setData({ listings, loading: false, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setData({ listings: [], loading: false, error: error.message || "Unable to load listings." });
      });
    return () => controller.abort();
  }, [request]);

  const authed = mounted ? user : null;
  const canSell =
    !!authed &&
    (authed.role === "ADMIN" ||
      authed.role === "PROFESSIONAL" ||
      ["MARKETPLACE", "MARKETPLACE_PLUS"].includes(authed.tier));
  const createHref = canSell ? "/marketplace/create" : authed ? "/upgrade" : "/register";
  const createLabel = canSell ? "Create listing" : authed ? "Upgrade to sell" : "Start selling";

  // Load purchases when user is authenticated or view switched
  const loadPurchases = useCallback(() => {
    if (!authed) return;
    setPurchasesLoading(true);
    fetch("/api/marketplace-purchases")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        setPurchases(Array.isArray(d) ? d : []);
        setPurchasesLoaded(true);
      })
      .catch(() => {
        setPurchases([]);
      })
      .finally(() => setPurchasesLoading(false));
  }, [authed]);

  // Load seller's listings when authenticated and canSell
  const loadMyListings = useCallback(() => {
    if (!authed || !canSell) return;
    setMyListingsLoading(true);
    fetch("/api/marketplace/my")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        setMyListings(Array.isArray(d) ? d : []);
        setMyListingsLoaded(true);
      })
      .catch(() => {
        setMyListings([]);
      })
      .finally(() => setMyListingsLoading(false));
  }, [authed, canSell]);

  useEffect(() => {
    if (authed) {
      loadPurchases();
      if (canSell) loadMyListings();
    }
  }, [authed, canSell, loadPurchases, loadMyListings]);

  // Handle delete listing
  const handleDeleteListing = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/seller/listings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMyListings((prev) => prev.filter((l) => l.id !== id));
      } else {
        alert("Failed to delete listing. Please try again.");
      }
    } catch {
      alert("Network error while deleting listing.");
    } finally {
      setDeletingId(null);
    }
  };

  const setView = (v: MarketplaceView) => {
    if (v === "discover") {
      router.replace("/marketplace", { scroll: false });
    } else {
      router.replace(`/marketplace?view=${v}`, { scroll: false });
    }
  };

  const handleCategoryClick = (cat: Category) => {
    setCategory(cat);
    if (currentView !== "discover") {
      router.replace("/marketplace", { scroll: false });
    }
  };

  const query = search.trim().toLowerCase();

  // Filter Discover listings
  const filtered = data.listings
    .filter(
      (l) =>
        (category === "ALL" || l.category === category) &&
        (!featured || l.isFeatured) &&
        (!query || [l.title, l.description, l.user.name, ...(l.tags ?? [])].join(" ").toLowerCase().includes(query)) &&
        (price === "all" ||
          (l.price != null && (price === "free" ? l.price === 0 : price === "under100" ? l.price < 100 : l.price >= 100)))
    )
    .sort((a, b) => {
      if (sort === "low" || sort === "high") {
        if (a.price == null) return b.price == null ? 0 : 1;
        if (b.price == null) return -1;
        return sort === "low" ? a.price - b.price : b.price - a.price;
      }
      if (sort === "recommended" && a.isFeatured !== b.isFeatured) return Number(b.isFeatured) - Number(a.isFeatured);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Filter Purchases
  const filteredPurchases = purchases.filter(
    (p) =>
      !query ||
      [p.listing.title, p.listing.description ?? "", p.listing.user.name].join(" ").toLowerCase().includes(query)
  );

  // Filter My Listings
  const filteredMyListings = myListings
    .filter((l) => listingStatusFilter === "ALL" || l.status === listingStatusFilter)
    .filter((l) => !query || [l.title, l.description].join(" ").toLowerCase().includes(query));

  const hasFilters = !!query || category !== "ALL" || price !== "all" || featured;
  const clearFilters = () => {
    setSearch("");
    setCategory("ALL");
    setPrice("all");
    setFeatured(false);
  };

  return (
    <div className="mk-page">
      {/* ── Left Sidebar ── */}
      <aside
        className={`mk-sidebar ${filtersOpen ? "is-open" : ""}`}
        id="marketplace-filters"
        aria-label="Marketplace navigation and filters"
      >
        <div className="mk-sidebar-title">
          <button
            onClick={() => setView("discover")}
            className="text-left flex-1 hover:text-[#ffbe24] transition-colors"
          >
            Marketplace
          </button>
          <button
            className="mk-mobile-close"
            onClick={() => setFiltersOpen(false)}
            aria-label="Close filters"
          >
            <Cancel01Icon size={22} />
          </button>
        </div>
        <p className="mk-sidebar-intro">Find expertise. Grow your practice.</p>

        {/* Categories (Discover) */}
        <nav aria-label="Marketplace categories">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => handleCategoryClick(c.value)}
              aria-pressed={currentView === "discover" && category === c.value}
            >
              <c.icon size={21} />
              <span>{c.label}</span>
              {data.loading ? (
                <span className="mk-badge-skeleton" aria-hidden="true" />
              ) : !data.error ? (
                <small>
                  {data.listings.filter((l) => c.value === "ALL" || l.category === c.value).length}
                </small>
              ) : null}
            </button>
          ))}
        </nav>

        {/* Create CTA Button */}
        <Link className="mk-primary" href={createHref}>
          <Add01Icon size={18} />
          {createLabel}
        </Link>

        {/* Refine Search (Visible when in discover view) */}
        {currentView === "discover" && (
          <div className="mk-sidebar-section">
            <h2>Refine your search</h2>
            <fieldset>
              <legend>Price</legend>
              {prices.map((p) => (
                <label key={p.value}>
                  <input
                    type="radio"
                    name="marketplace-price"
                    checked={price === p.value}
                    onChange={() => setPrice(p.value)}
                  />
                  {p.label}
                </label>
              ))}
            </fieldset>
            <label className="mk-checkbox">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              <StarIcon size={18} />
              Featured listings only
            </label>
            {hasFilters && (
              <button className="mk-reset" onClick={clearFilters}>
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Your Marketplace (Purchases, My Listings, Dashboard) */}
        <nav className="mk-sidebar-section" aria-label="Your marketplace">
          <h2>Your marketplace</h2>
          <button
            type="button"
            onClick={() => setView("purchases")}
            aria-pressed={currentView === "purchases"}
          >
            <ShoppingBag01Icon size={21} />
            <span>Your purchases</span>
            {authed && (
              purchasesLoading || !purchasesLoaded ? (
                <span className="mk-badge-skeleton" aria-hidden="true" />
              ) : (
                <small>{purchases.length}</small>
              )
            )}
          </button>

          {canSell && (
            <>
              <button
                type="button"
                onClick={() => setView("listings")}
                aria-pressed={currentView === "listings"}
              >
                <Briefcase01Icon size={21} />
                <span>Your listings</span>
                {myListingsLoading || !myListingsLoaded ? (
                  <span className="mk-badge-skeleton" aria-hidden="true" />
                ) : (
                  <small>{myListings.length}</small>
                )}
              </button>
              <Link href="/seller-dashboard">
                <Rocket01Icon size={21} />
                <span>Seller dashboard</span>
              </Link>
            </>
          )}

          {authed?.role === "ADMIN" && (
            <Link href="/admin">
              <Settings01Icon size={21} />
              <span>Manage marketplace</span>
            </Link>
          )}
          <Link href="/contact">
            <GlobeIcon size={21} />
            <span>Help & support</span>
          </Link>
        </nav>
      </aside>

      {/* ── Main Workspace Area ── */}
      <main className="mk-main">
        {/* ========================================================= */}
        {/* VIEW 1: PURCHASES */}
        {/* ========================================================= */}
        {currentView === "purchases" && (
          <div>
            <header className="mk-heading">
              <div>
                <span className="mk-eyebrow">YOUR PURCHASES</span>
                <h1>My Purchases</h1>
                <p>Access your purchased services, downloadable tools, courses, and resources.</p>
              </div>
              <button onClick={() => setView("discover")} className="mk-primary">
                <ShoppingBag01Icon size={18} /> Browse Marketplace
              </button>
            </header>

            {!authed ? (
              <div className="mk-empty">
                <span className="mk-empty-icon">
                  <LockIcon size={30} />
                </span>
                <h2>Sign in to view your purchases</h2>
                <p>Log in to your account to view and access everything you’ve purchased.</p>
                <Link className="mk-primary" href="/login?redirect=/marketplace?view=purchases">
                  Sign In
                </Link>
              </div>
            ) : purchasesLoading ? (
              <ListingSkeletons />
            ) : filteredPurchases.length > 0 ? (
              <>
                <div className="mk-toolbar">
                  <div className="mk-search">
                    <Search01Icon size={21} />
                    <input
                      aria-label="Search purchases"
                      placeholder="Search your purchased items…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button onClick={() => setSearch("")} aria-label="Clear search">
                        <Cancel01Icon size={18} />
                      </button>
                    )}
                  </div>
                  <GridSwitcher
                    className="mk-grid-switcher"
                    currentView={gridView}
                    onViewChange={setGridView}
                    options={MK_GRID_OPTIONS}
                  />
                </div>

                <div className="mk-results-heading">
                  <h2>Purchased Items</h2>
                  <span>
                    {filteredPurchases.length} item{filteredPurchases.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className={`mk-grid ${gridView}`}>
                  {filteredPurchases.map((p) => (
                    <PurchaseCard key={p.id} p={p} />
                  ))}
                </div>
              </>
            ) : (
              <div className="mk-empty">
                <span className="mk-empty-icon">
                  <ShoppingBag01Icon size={30} />
                </span>
                <h2>{search ? "No purchases found matching your search" : "No purchases yet"}</h2>
                <p>
                  {search
                    ? "Try a different search keyword to find your item."
                    : "Explore the marketplace to discover products, services, and courses from fellow tax professionals."}
                </p>
                {search ? (
                  <button className="mk-primary" onClick={() => setSearch("")}>
                    Clear search
                  </button>
                ) : (
                  <button className="mk-primary" onClick={() => setView("discover")}>
                    <ShoppingBag01Icon size={18} /> Explore Marketplace
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: SELLER LISTINGS */}
        {/* ========================================================= */}
        {currentView === "listings" && (
          <div>
            <header className="mk-heading">
              <div>
                <span className="mk-eyebrow">SELLER WORKSPACE</span>
                <h1>Your Listings</h1>
                <p>Manage your listings, track impressions and views, and create new marketplace offerings.</p>
              </div>
              <Link href="/marketplace/create" className="mk-primary">
                <Add01Icon size={18} /> Create Listing
              </Link>
            </header>

            {!authed ? (
              <div className="mk-empty">
                <span className="mk-empty-icon">
                  <LockIcon size={30} />
                </span>
                <h2>Sign in to manage listings</h2>
                <p>Sign in with your seller account to view and create marketplace listings.</p>
                <Link className="mk-primary" href="/login?redirect=/marketplace?view=listings">
                  Sign In
                </Link>
              </div>
            ) : !canSell ? (
              <div className="mk-empty">
                <span className="mk-empty-icon">
                  <Briefcase01Icon size={30} />
                </span>
                <h2>Marketplace Plan Required</h2>
                <p>Upgrade to Marketplace or Marketplace Plus to publish services, products, and courses.</p>
                <Link className="mk-primary" href="/upgrade">
                  Upgrade to Sell
                </Link>
              </div>
            ) : myListingsLoading ? (
              <ListingSkeletons />
            ) : myListings.length > 0 ? (
              <>
                {/* Search and Status Pills */}
                <div className="mk-toolbar">
                  <div className="mk-search">
                    <Search01Icon size={21} />
                    <input
                      aria-label="Search my listings"
                      placeholder="Search your listings…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button onClick={() => setSearch("")} aria-label="Clear search">
                        <Cancel01Icon size={18} />
                      </button>
                    )}
                  </div>
                  <GridSwitcher
                    className="mk-grid-switcher"
                    currentView={gridView}
                    onViewChange={setGridView}
                    options={MK_GRID_OPTIONS}
                  />
                </div>

                <div className="mk-view-nav mt-4">
                  {(["ALL", "APPROVED", "PENDING", "REJECTED"] as const).map((st) => {
                    const count =
                      st === "ALL"
                        ? myListings.length
                        : myListings.filter((l) => l.status === st).length;
                    const label =
                      st === "ALL"
                        ? "All Listings"
                        : st === "APPROVED"
                        ? "Live"
                        : st === "PENDING"
                        ? "In Review"
                        : "Rejected";
                    return (
                      <button
                        key={st}
                        onClick={() => setListingStatusFilter(st)}
                        className={`mk-view-pill ${listingStatusFilter === st ? "active" : ""}`}
                      >
                        {label} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="mk-results-heading">
                  <h2>
                    {listingStatusFilter === "ALL"
                      ? "All Listings"
                      : listingStatusFilter === "APPROVED"
                      ? "Live Listings"
                      : listingStatusFilter === "PENDING"
                      ? "Pending Review"
                      : "Rejected Listings"}
                  </h2>
                  <span>
                    {filteredMyListings.length} listing{filteredMyListings.length === 1 ? "" : "s"}
                  </span>
                </div>

                {filteredMyListings.length > 0 ? (
                  <div className={`mk-grid ${gridView}`}>
                    {filteredMyListings.map((l) => (
                      <MyListingCard
                        key={l.id}
                        listing={l}
                        onDelete={handleDeleteListing}
                        deleting={deletingId === l.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mk-empty">
                    <h2>No listings found for this filter</h2>
                    <p>Try switching to "All Listings" or clearing your search.</p>
                    <button className="mk-primary" onClick={() => setListingStatusFilter("ALL")}>
                      View All Listings
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="mk-empty">
                <span className="mk-empty-icon">
                  <Briefcase01Icon size={30} />
                </span>
                <h2>Start selling on Tax Compliance Pro</h2>
                <p>Create your first service, digital product, network, or training course to reach thousands of tax pros.</p>
                <Link className="mk-primary" href="/marketplace/create">
                  <Add01Icon size={18} /> Create Your First Listing
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: DISCOVER ALL (DEFAULT) */}
        {/* ========================================================= */}
        {currentView === "discover" && (
          <div>
            <header className="mk-heading">
              <div>
                <span className="mk-eyebrow">THE PROFESSIONAL MARKETPLACE</span>
                <h1>Your next opportunity.</h1>
                <p>Explore services, products, courses, and networks from tax professionals.</p>
              </div>
              <Link href={createHref} className="mk-primary">
                <Add01Icon size={18} />
                {createLabel}
              </Link>
            </header>

            <div className="mk-banner">
              <img
                src="/mrkeplace_cover.png"
                alt="TaxCompPro Marketplace — Your Marketplace. Your Opportunity. Sell Your Expertise and Buy Your Opportunity."
              />
            </div>

            <section className="mk-results" aria-label="Browse listings">
              <div className="mk-toolbar">
                <div className="mk-search">
                  <Search01Icon size={21} />
                  <input
                    aria-label="Search marketplace"
                    placeholder="Search services, products, courses, or sellers…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button onClick={() => setSearch("")} aria-label="Clear search">
                      <Cancel01Icon size={18} />
                    </button>
                  )}
                </div>
                <label className="mk-sort">
                  <span>Sort by</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                    <option value="recommended">Recommended</option>
                    <option value="newest">Newest first</option>
                    <option value="low">Price: low to high</option>
                    <option value="high">Price: high to low</option>
                  </select>
                </label>
                <button
                  className="mk-mobile-filter"
                  onClick={() => setFiltersOpen((o) => !o)}
                  aria-expanded={filtersOpen}
                  aria-controls="marketplace-filters"
                >
                  <FilterIcon size={20} />
                  Filters
                </button>
              </div>

              <div className="mk-results-heading">
                <h2>
                  {category === "ALL"
                    ? "Discover the marketplace"
                    : categories.find((c) => c.value === category)?.label}
                </h2>
                <span aria-live="polite">
                  {data.loading
                    ? "Finding opportunities…"
                    : data.error
                    ? ""
                    : `${filtered.length} listing${filtered.length === 1 ? "" : "s"}`}
                </span>
                <GridSwitcher
                  className="mk-grid-switcher"
                  currentView={gridView}
                  onViewChange={setGridView}
                  options={MK_GRID_OPTIONS}
                />
              </div>

              {hasFilters && (
                <div className="mk-active-filters">
                  {query && (
                    <button onClick={() => setSearch("")}>
                      “{search}”
                      <Cancel01Icon size={14} />
                    </button>
                  )}
                  {category !== "ALL" && (
                    <button onClick={() => setCategory("ALL")}>
                      {categories.find((c) => c.value === category)?.label}
                      <Cancel01Icon size={14} />
                    </button>
                  )}
                  {price !== "all" && (
                    <button onClick={() => setPrice("all")}>
                      {prices.find((p) => p.value === price)?.label}
                      <Cancel01Icon size={14} />
                    </button>
                  )}
                  {featured && (
                    <button onClick={() => setFeatured(false)}>
                      Featured
                      <Cancel01Icon size={14} />
                    </button>
                  )}
                  <button onClick={clearFilters}>Clear all</button>
                </div>
              )}

              {data.loading ? (
                <ListingSkeletons />
              ) : data.error ? (
                <div className="mk-empty" role="alert">
                  <span className="mk-empty-icon">
                    <ShoppingBag01Icon size={30} />
                  </span>
                  <h2>We couldn’t load the marketplace</h2>
                  <p>{data.error}</p>
                  <button
                    className="mk-primary"
                    onClick={() => {
                      setData((d) => ({ ...d, loading: true, error: "" }));
                      retry();
                    }}
                  >
                    Try again
                  </button>
                </div>
              ) : filtered.length ? (
                <div className={`mk-grid ${gridView}`}>
                  {filtered.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              ) : (
                <div className="mk-empty">
                  <span className="mk-empty-icon">
                    {hasFilters ? <Search01Icon size={30} /> : <ShoppingBag01Icon size={30} />}
                  </span>
                  <h2>{hasFilters ? "No matches just yet" : "Opportunity starts here"}</h2>
                  <p>
                    {hasFilters
                      ? "Try another search or clear your filters to explore more listings."
                      : "Share your expertise, products, or courses with a community of tax professionals."}
                  </p>
                  {hasFilters ? (
                    <button className="mk-primary" onClick={clearFilters}>
                      Clear filters
                    </button>
                  ) : (
                    <Link className="mk-primary" href={createHref}>
                      <Add01Icon size={18} />
                      {createLabel}
                    </Link>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="mk-page">
          <div className="mk-sidebar" />
          <main className="mk-main">
            <ListingSkeletons />
          </main>
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
