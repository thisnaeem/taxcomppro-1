
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { Loader2, Download, ExternalLink } from "lucide-react";
import {
  ArrowLeft01Icon, StarIcon, EyeIcon, ShoppingBag01Icon,
  GlobeIcon, Briefcase01Icon, School01Icon, BookOpen01Icon,
  Tag01Icon, ArrowRight01Icon, Share01Icon, Flag01Icon,
  CrownIcon, Clock01Icon,
} from "hugeicons-react";

interface Listing {
  id: string; slug: string | null; title: string; description: string;
  category: string; price: number | null; tags: string[];
  images: string[];
  metadata: Record<string, string> | null;
  hasPurchased?: boolean;
  isFeatured: boolean; viewCount: number; createdAt: string;
  user: { id: string; name: string; image: string | null; headline: string | null; role: string; tier: string };
}

const CAT_CONFIG: Record<string, {
  label: string; icon: React.ElementType;
  pill: string; cta: string; ctaCls: string;
}> = {
  SERVICE:  { label: "Service",  icon: Briefcase01Icon, pill: "bg-blue-100 text-blue-700",       cta: "Learn More",   ctaCls: "bg-blue-600 hover:bg-blue-700 text-white" },
  PRODUCT:  { label: "Product",  icon: ShoppingBag01Icon, pill: "bg-amber-100 text-amber-700",   cta: "Buy Now",      ctaCls: "bg-[#0a1628] hover:bg-[#1a3a6b] text-white" },
  NETWORK:  { label: "Network",  icon: GlobeIcon,       pill: "bg-emerald-100 text-emerald-700", cta: "Join Network", ctaCls: "bg-emerald-600 hover:bg-emerald-700 text-white" },
  TRAINING: { label: "Training", icon: School01Icon,    pill: "bg-purple-100 text-purple-700",   cta: "Enroll Now",   ctaCls: "bg-purple-600 hover:bg-purple-700 text-white" },
};
const DEFAULT_CFG = { label: "Other", icon: BookOpen01Icon, pill: "bg-slate-100 text-slate-600", cta: "View", ctaCls: "bg-[#0a1628] hover:bg-[#1a3a6b] text-white" };

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ─── Skeleton ──────────────────────────────────────────────── */
function SkeletonDetail() {
  return (
    <div className="min-h-screen bg-slate-100 pt-4 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
              <div className="h-4 bg-slate-200 rounded w-4/6" />
              <div className="flex gap-2 pt-2">
                {[1,2,3].map(i => <div key={i} className="h-7 w-16 bg-slate-200 rounded-full" />)}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 animate-pulse space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-200 mx-auto" />
              <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto" />
              <div className="h-10 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ListingDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const user     = useAppSelector(s => s.auth.user);

  const [listing,    setListing]    = useState<Listing | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`/api/listing/${slug}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then(data => {
        if (data) {
          // Check if URL has ?success=true from Stripe checkout
          if (typeof window !== "undefined" && window.location.search.includes("success=true")) {
            data.hasPurchased = true;
          }
          setListing(data);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBuyListing = async () => {
    if (!user || !listing) return;
    setPurchasing(true);
    try {
      const res = await fetch("/api/stripe/marketplace-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.isFree || data.alreadyPurchased || data.success) {
        setListing(prev => prev ? { ...prev, hasPurchased: true } : prev);
      } else if (data.error) {
        alert(data.error);
      }
    } catch {
      alert("Something went wrong with checkout.");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <SkeletonDetail />;

  if (notFound || !listing) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center text-center px-4">
      <div className="bg-white rounded-2xl p-12 max-w-md">
        <ShoppingBag01Icon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h1 className="text-xl font-black text-[#0a1628] mb-2">Listing Not Found</h1>
        <p className="text-slate-400 text-sm mb-5">This listing may have been removed or is pending approval.</p>
        <Link href="/marketplace"
          className="inline-flex items-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#1a3a6b] transition-all">
          <ArrowLeft01Icon className="w-4 h-4" /> Back to Marketplace
        </Link>
      </div>
    </div>
  );

  const cfg  = CAT_CONFIG[listing.category] ?? DEFAULT_CFG;
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen bg-slate-100 pt-4 pb-12">
      <div className="max-w-5xl mx-auto px-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-5">
          <Link href="/marketplace" className="hover:text-[#0a1628] transition-colors flex items-center gap-1 font-medium">
            <ArrowLeft01Icon className="w-3.5 h-3.5" /> Marketplace
          </Link>
          <span className="text-slate-300">/</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cfg.pill}`}>{cfg.label}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-medium line-clamp-1 max-w-[200px]">{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

          {/* ── LEFT: single combined card ── */}
          <div className="bg-white rounded-2xl overflow-hidden">

            {/* Banner image */}
            {listing.images?.[0] && (
              <div className="h-52 w-full overflow-hidden border-b border-slate-100">
                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Header section */}
            <div className="p-6 pb-5">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${cfg.pill}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.pill}`}>{cfg.label}</span>
                    {listing.isFeatured && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#d4a017]">
                        <StarIcon className="w-3 h-3" /> Featured
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
                      <EyeIcon className="w-3 h-3" /> {listing.viewCount} views
                    </span>
                  </div>
                  <h1 className="text-xl font-black text-[#0a1628] leading-snug">{listing.title}</h1>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <Clock01Icon className="w-3.5 h-3.5" />
                    Listed {timeAgo(listing.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 mx-6" />

            {/* About section */}
            <div className="p-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">About This Listing</h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>

            {/* Category metadata */}
            {listing.metadata && Object.keys(listing.metadata).some(k => listing.metadata![k]) && (
              <>
                <div className="h-px bg-slate-100 mx-6" />
                <div className="p-6 pt-5">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Details</h2>
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                    {Object.entries(listing.metadata)
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <div key={k}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {k.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                          <p className="text-sm font-semibold text-[#0a1628] mt-0.5">{v}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Tags */}
            {listing.tags.length > 0 && (
              <>
                <div className="h-px bg-slate-100 mx-6" />
                <div className="p-6 pt-5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                    <Tag01Icon className="w-3.5 h-3.5" /> Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map(t => (
                      <span key={t} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium">#{t}</span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Action row */}
            <div className="h-px bg-slate-100 mx-6" />
            <div className="p-5 flex gap-3">
              <button onClick={handleShare}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0a1628] px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
                <Share01Icon className="w-4 h-4" />
                {copied ? "Copied!" : "Share"}
              </button>
              <button className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-red-500 px-4 py-2.5 rounded-xl hover:bg-red-50 transition-all">
                <Flag01Icon className="w-4 h-4" /> Report
              </button>
            </div>
          </div>

          {/* ── RIGHT: seller + CTA ── */}
          <div className="space-y-3 self-start sticky top-[100px]">

            {/* Seller card */}
            <div className="bg-white rounded-2xl p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">About the Seller</h3>

              {/* Seller info */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-full bg-[#0a1628] overflow-hidden flex items-center justify-center shrink-0">
                  {listing.user.image
                    ? <img src={listing.user.image} alt={listing.user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    : <span className="text-white font-black text-xl">{listing.user.name?.[0]?.toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-[#0a1628] text-sm">{listing.user.name}</div>
                  {listing.user.headline && (
                    <div className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">{listing.user.headline}</div>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {listing.user.role === "ADMIN" && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CrownIcon className="w-3 h-3" /> TaxCompPro Official
                      </span>
                    )}
                    {listing.user.role !== "ADMIN" && (
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {listing.user.role === "PROFESSIONAL" ? "Professional" : "Member"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="bg-slate-50 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {listing.price != null ? "One-time payment" : "Completely free"}
                </span>
                <span className="text-xl font-black text-[#0a1628]">
                  {listing.price != null ? `$${listing.price}` : "Free"}
                </span>
              </div>

              {/* CTA */}
              {(() => {
                const isFree = !listing.price || listing.price <= 0;
                const isOwner = user?.id === listing.user.id || user?.role === "ADMIN";
                const downloadUrl = listing.metadata?.downloadUrl;
                const linkUrl = listing.metadata?.linkUrl;
                const hasAccess = isFree || listing.hasPurchased || isOwner;

                // 1. Downloadable Product with Access
                if (downloadUrl && hasAccess) {
                  return (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
                    >
                      <Download className="w-4 h-4" /> Download Product
                    </a>
                  );
                }

                // 2. Paid Downloadable Product needing purchase
                if (downloadUrl && !hasAccess) {
                  if (!user) {
                    return (
                      <Link
                        href={`/login?redirect=/${listing.slug ?? listing.id}`}
                        className="w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-xl bg-[#0a1628] hover:bg-[#1a3a6b] text-white transition-all"
                      >
                        Sign in to Buy & Download (${listing.price}) <ArrowRight01Icon className="w-4 h-4" />
                      </Link>
                    );
                  }
                  return (
                    <button
                      onClick={handleBuyListing}
                      disabled={purchasing}
                      className="w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-xl bg-[#0a1628] hover:bg-[#1a3a6b] text-white shadow-md transition-all disabled:opacity-60"
                    >
                      {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag01Icon className="w-4 h-4" />}
                      {purchasing ? "Processing…" : `Buy & Unlock Download ($${listing.price})`}
                    </button>
                  );
                }

                // 3. Action / External Link
                if (linkUrl) {
                  if (!user) {
                    return (
                      <Link
                        href={`/login?redirect=/${listing.slug ?? listing.id}`}
                        className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-xl transition-all ${cfg.ctaCls}`}
                      >
                        Sign in to {cfg.cta} <ArrowRight01Icon className="w-4 h-4" />
                      </Link>
                    );
                  }
                  return (
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-xl transition-all ${cfg.ctaCls}`}
                    >
                      {cfg.cta} <ExternalLink className="w-4 h-4" />
                    </a>
                  );
                }

                // 4. Paid Service/Listing (No download URL or external link)
                if (!isFree && !hasAccess) {
                  if (!user) {
                    return (
                      <Link
                        href={`/login?redirect=/${listing.slug ?? listing.id}`}
                        className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-xl transition-all ${cfg.ctaCls}`}
                      >
                        Sign in to Buy (${listing.price}) <ArrowRight01Icon className="w-4 h-4" />
                      </Link>
                    );
                  }
                  return (
                    <button
                      onClick={handleBuyListing}
                      disabled={purchasing}
                      className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-xl transition-all disabled:opacity-60 ${cfg.ctaCls}`}
                    >
                      {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag01Icon className="w-4 h-4" />}
                      {purchasing ? "Processing…" : `Buy Now ($${listing.price})`}
                    </button>
                  );
                }

                // 5. Default Fallback (Contact Seller)
                return (
                  <Link
                    href={user ? `/messages?receiverId=${listing.user.id}` : `/login?redirect=/${listing.slug ?? listing.id}`}
                    className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-xl transition-all ${cfg.ctaCls}`}
                  >
                    Contact Seller <ArrowRight01Icon className="w-4 h-4" />
                  </Link>
                );
              })()}
            </div>

            {/* Views stat */}
            <div className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Views</span>
              <span className="flex items-center gap-1.5 font-black text-[#0a1628]">
                <EyeIcon className="w-4 h-4 text-slate-400" /> {listing.viewCount}
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
