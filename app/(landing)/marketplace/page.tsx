"use client";

import { Suspense, useEffect, useReducer, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { Search01Icon, ShoppingBag01Icon, StarIcon, Add01Icon, ArrowRight01Icon, Briefcase01Icon, GlobeIcon, School01Icon, Rocket01Icon, Cancel01Icon, FilterIcon, Settings01Icon } from "hugeicons-react";
import "./marketplace.css";

type Category = "ALL" | "SERVICE" | "PRODUCT" | "NETWORK" | "TRAINING";
type Price = "all" | "free" | "under100" | "100plus";
type Sort = "recommended" | "newest" | "low" | "high";
interface Listing {
  href?: string; billingPeriod?: string; id: string; slug: string | null; title: string; description: string;
  category: string; price: number | null; tags: string[]; images: string[];
  isFeatured: boolean; viewCount: number; createdAt: string;
  user: { id: string; name: string; image: string | null };
}
const categories = [
  { value: "ALL", label: "Discover all", icon: ShoppingBag01Icon },
  { value: "SERVICE", label: "Services", icon: Briefcase01Icon },
  { value: "PRODUCT", label: "Products", icon: ShoppingBag01Icon },
  { value: "NETWORK", label: "Networks", icon: GlobeIcon },
  { value: "TRAINING", label: "Courses", icon: School01Icon },
] as const;
const prices: {value: Price; label: string}[] = [{value:"all",label:"Any price"},{value:"free",label:"Free"},{value:"under100",label:"Under $100"},{value:"100plus",label:"$100 and up"}];

function ListingCard({ listing: l }: { listing: Listing }) {
  const category = categories.find(c => c.value === l.category) ?? categories[0];
  const Icon = category.icon;
  return <Link className="mk-card" href={l.href || `/${l.slug || l.id}`}>
    <div className="mk-cover">
      {l.images?.[0] ? <img src={l.images[0]} alt={l.title} loading="lazy" /> : <div className="mk-cover-placeholder"><Icon size={44} /><span>{category.label}</span></div>}
      <span className="mk-category">{category.label}</span>
      {l.isFeatured && <span className="mk-featured"><StarIcon size={14} /> Featured</span>}
    </div>
    <div className="mk-card-body">
      <strong className="mk-price">{l.price == null ? "Contact for pricing" : l.price === 0 ? "Free" : new Intl.NumberFormat("en-US", {style:"currency",currency:"USD",maximumFractionDigits:2}).format(l.price)}{l.billingPeriod && !!l.price && "/mo"}</strong>
      <h2>{l.title}</h2><p>{l.description}</p>
      <div className="mk-seller"><span className="mk-avatar">{l.user.image ? <img src={l.user.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : l.user.name?.[0]}</span><span>{l.user.name}</span><ArrowRight01Icon size={18} /></div>
    </div>
  </Link>;
}
function ListingSkeletons() {
  return <div role="status" aria-label="Loading marketplace listings"><span className="sr-only">Loading listings…</span><div className="mk-grid" aria-hidden="true">{Array.from({length:8},(_,i)=><div className="mk-card mk-skeleton" key={i}><div className="mk-cover"/><div className="mk-card-body"><i/><i/><i/><div className="mk-seller"><i/></div></div></div>)}</div></div>;
}

function MarketplaceContent() {
  const user = useAppSelector(s=>s.auth.user);
  const params = useSearchParams();
  const [mounted, mount] = useReducer(()=>true,false);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [category, setCategory] = useState<Category>("ALL");
  const [price, setPrice] = useState<Price>("all");
  const [sort, setSort] = useState<Sort>("recommended");
  const [featured, setFeatured] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [request, retry] = useReducer(n=>n+1,0);
  const [data, setData] = useState<{listings:Listing[];loading:boolean;error:string}>({listings:[],loading:true,error:""});
  useEffect(()=>{mount();},[]);
  useEffect(()=>{
    const controller = new AbortController();
    fetch("/api/marketplace",{signal:controller.signal}).then(async r=>{
      if (!r.ok) throw new Error("Unable to load listings. Please try again.");
      const listings = await r.json();
      if (!Array.isArray(listings)) throw new Error("Unable to load listings. Please try again.");
      if (!controller.signal.aborted) setData({listings,loading:false,error:""});
    }).catch(error=>{if (!controller.signal.aborted) setData({listings:[],loading:false,error:error.message || "Unable to load listings."});});
    return ()=>controller.abort();
  },[request]);
  const authed = mounted ? user : null;
  const canSell = !!authed && (authed.role === "ADMIN" || authed.role === "PROFESSIONAL" || ["MARKETPLACE","MARKETPLACE_PLUS"].includes(authed.tier));
  const createHref = canSell ? "/marketplace/create" : authed ? "/upgrade" : "/register";
  const createLabel = canSell ? "Create listing" : authed ? "Upgrade to sell" : "Start selling";
  const query = search.trim().toLowerCase();
  const filtered = data.listings.filter(l=>
    (category === "ALL" || l.category === category) && (!featured || l.isFeatured) &&
    (!query || [l.title,l.description,l.user.name,...(l.tags ?? [])].join(" ").toLowerCase().includes(query)) &&
    (price === "all" || (l.price != null && (price === "free" ? l.price === 0 : price === "under100" ? l.price < 100 : l.price >= 100)))
  ).sort((a,b)=>{
    if (sort === "low" || sort === "high") {
      if (a.price == null) return b.price == null ? 0 : 1;
      if (b.price == null) return -1;
      return sort === "low" ? a.price-b.price : b.price-a.price;
    }
    if (sort === "recommended" && a.isFeatured !== b.isFeatured) return Number(b.isFeatured)-Number(a.isFeatured);
    return new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime();
  });
  const hasFilters = !!query || category !== "ALL" || price !== "all" || featured;
  const clearFilters = ()=>{setSearch("");setCategory("ALL");setPrice("all");setFeatured(false);};
  return <div className="mk-page">
    <aside className={`mk-sidebar ${filtersOpen ? "is-open" : ""}`} id="marketplace-filters" aria-label="Marketplace navigation and filters">
      <div className="mk-sidebar-title">Marketplace<button className="mk-mobile-close" onClick={()=>setFiltersOpen(false)} aria-label="Close filters"><Cancel01Icon size={22}/></button></div>
      <p className="mk-sidebar-intro">Find expertise. Grow your practice.</p>
      <nav aria-label="Marketplace categories">{categories.map(c=><button key={c.value} onClick={()=>setCategory(c.value)} aria-pressed={category===c.value}><c.icon size={21}/><span>{c.label}</span>{!data.loading && !data.error && <small>{data.listings.filter(l=>c.value === "ALL" || l.category === c.value).length}</small>}</button>)}</nav>
      <Link className="mk-primary" href={createHref}><Add01Icon size={18}/>{createLabel}</Link>
      <div className="mk-sidebar-section"><h2>Refine your search</h2><fieldset><legend>Price</legend>{prices.map(p=><label key={p.value}><input type="radio" name="marketplace-price" checked={price===p.value} onChange={()=>setPrice(p.value)}/>{p.label}</label>)}</fieldset><label className="mk-checkbox"><input type="checkbox" checked={featured} onChange={e=>setFeatured(e.target.checked)}/><StarIcon size={18}/>Featured listings only</label>{hasFilters && <button className="mk-reset" onClick={clearFilters}>Reset filters</button>}</div>
      <nav className="mk-sidebar-section" aria-label="Your marketplace"><h2>Your marketplace</h2><Link href="/marketplace-purchases"><ShoppingBag01Icon size={21}/>Your purchases</Link>{canSell && <><Link href="/my-listings"><Briefcase01Icon size={21}/>Your listings</Link><Link href="/seller-dashboard"><Rocket01Icon size={21}/>Seller dashboard</Link></>}{authed?.role === "ADMIN" && <Link href="/admin"><Settings01Icon size={21}/>Manage marketplace</Link>}<Link href="/contact"><GlobeIcon size={21}/>Help & support</Link></nav>
    </aside>
    <main className="mk-main">
      <header className="mk-heading"><div><span className="mk-eyebrow">THE PROFESSIONAL MARKETPLACE</span><h1>Your next opportunity.</h1><p>Explore services, products, courses, and networks from tax professionals.</p></div><Link href={createHref} className="mk-primary"><Add01Icon size={18}/>{createLabel}</Link></header>
      <div className="mk-banner"><img src="/mrkeplace_cover.png" alt="TaxCompPro Marketplace — Your Marketplace. Your Opportunity. Sell Your Expertise and Buy Your Opportunity." /></div>
      <section className="mk-results" aria-label="Browse listings">
        <div className="mk-toolbar"><div className="mk-search"><Search01Icon size={21}/><input aria-label="Search marketplace" placeholder="Search services, products, courses, or sellers…" value={search} onChange={e=>setSearch(e.target.value)}/>{search && <button onClick={()=>setSearch("")} aria-label="Clear search"><Cancel01Icon size={18}/></button>}</div><label className="mk-sort"><span>Sort by</span><select value={sort} onChange={e=>setSort(e.target.value as Sort)}><option value="recommended">Recommended</option><option value="newest">Newest first</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label><button className="mk-mobile-filter" onClick={()=>setFiltersOpen(o=>!o)} aria-expanded={filtersOpen} aria-controls="marketplace-filters"><FilterIcon size={20}/>Filters</button></div>
        <div className="mk-results-heading"><h2>{category === "ALL" ? "Discover the marketplace" : categories.find(c=>c.value===category)?.label}</h2><span aria-live="polite">{data.loading ? "Finding opportunities…" : data.error ? "" : `${filtered.length} listing${filtered.length === 1 ? "" : "s"}`}</span></div>
        {hasFilters && <div className="mk-active-filters">{query && <button onClick={()=>setSearch("")}>“{search}”<Cancel01Icon size={14}/></button>}{category!=="ALL" && <button onClick={()=>setCategory("ALL")}>{categories.find(c=>c.value===category)?.label}<Cancel01Icon size={14}/></button>}{price!=="all" && <button onClick={()=>setPrice("all")}>{prices.find(p=>p.value===price)?.label}<Cancel01Icon size={14}/></button>}{featured && <button onClick={()=>setFeatured(false)}>Featured<Cancel01Icon size={14}/></button>}<button onClick={clearFilters}>Clear all</button></div>}
        {data.loading ? <ListingSkeletons/> : data.error ? <div className="mk-empty" role="alert"><span className="mk-empty-icon"><ShoppingBag01Icon size={30}/></span><h2>We couldn’t load the marketplace</h2><p>{data.error}</p><button className="mk-primary" onClick={()=>{setData(d=>({...d,loading:true,error:""}));retry();}}>Try again</button></div> : filtered.length ? <div className="mk-grid">{filtered.map(l=><ListingCard key={l.id} listing={l}/>)}</div> : <div className="mk-empty"><span className="mk-empty-icon">{hasFilters ? <Search01Icon size={30}/> : <ShoppingBag01Icon size={30}/>}</span><h2>{hasFilters ? "No matches just yet" : "Opportunity starts here"}</h2><p>{hasFilters ? "Try another search or clear your filters to explore more listings." : "Share your expertise, products, or courses with a community of tax professionals."}</p>{hasFilters ? <button className="mk-primary" onClick={clearFilters}>Clear filters</button> : <Link className="mk-primary" href={createHref}><Add01Icon size={18}/>{createLabel}</Link>}</div>}
      </section>
    </main>
  </div>;
}
export default function MarketplacePage() {
  return <Suspense fallback={<div className="mk-page"><div className="mk-sidebar"/><main className="mk-main"><ListingSkeletons/></main></div>}><MarketplaceContent/></Suspense>;
}
