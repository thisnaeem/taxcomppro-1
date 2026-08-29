"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Loader2, Package, Calendar, DollarSign,
  ExternalLink, User,
} from "lucide-react";

interface MarketplacePurchase {
  id: string;
  createdAt: string;
  price: number;
  listing: {
    id: string;
    slug: string;
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

const CATEGORY_COLORS: Record<string, string> = {
  SERVICE:  "bg-blue-100 text-blue-700",
  PRODUCT:  "bg-emerald-100 text-emerald-700",
  NETWORK:  "bg-purple-100 text-purple-700",
  COURSE:   "bg-amber-100 text-amber-700",
};

export default function MarketplacePurchasesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [purchases, setPurchases] = useState<MarketplacePurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }

    fetch("/api/marketplace-purchases")
      .then(r => r.ok ? r.json() : [])
      .then(d => setPurchases(Array.isArray(d) ? d : []))
      .catch(() => setPurchases([]))
      .finally(() => setLoading(false));
  }, [session, isPending, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-[#d4a017] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-[#0a1628] flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-[#d4a017]" />
              Marketplace Purchases
            </h1>
            <p className="text-slate-500 mt-1">
              {purchases.length} purchase{purchases.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/marketplace"
            className="flex items-center gap-2 text-sm font-bold bg-[#0a1628] text-white px-5 py-2.5 rounded-xl hover:bg-[#1a3a6b] transition-all"
          >
            <Package className="w-4 h-4" /> Browse Marketplace
          </Link>
        </div>

        {purchases.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200">
            <ShoppingBag className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <h3 className="font-bold text-slate-500 text-lg">No purchases yet</h3>
            <p className="text-slate-400 text-sm mt-1 mb-6">
              Explore our marketplace to find services, products, and courses
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-black px-6 py-3 rounded-xl hover:shadow-lg transition-all"
            >
              <Package className="w-4 h-4" /> Explore Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map(purchase => (
              <PurchaseCard key={purchase.id} purchase={purchase} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PurchaseCard({ purchase }: { purchase: MarketplacePurchase }) {
  const listing = purchase.listing;
  const thumbnail = listing.images[0] || "/placeholder-marketplace.png";
  const categoryLabel = listing.category.charAt(0) + listing.category.slice(1).toLowerCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all group">
      {/* Thumbnail */}
      <div className="relative h-44 bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] overflow-hidden">
        <img
          src={thumbnail}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => {
            (e.target as HTMLImageElement).src = "/placeholder-marketplace.png";
          }}
        />
        <div className="absolute top-3 left-3">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              CATEGORY_COLORS[listing.category] ?? "bg-slate-100 text-slate-600"
            }`}
          >
            {categoryLabel}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur-sm">
            Purchased
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* Title */}
        <h3 className="font-bold text-[#0a1628] text-base leading-snug mb-2 line-clamp-2">
          {listing.title}
        </h3>

        {/* Description */}
        {listing.description && (
          <p className="text-sm text-slate-500 leading-relaxed mb-3 line-clamp-2">
            {listing.description}
          </p>
        )}

        {/* Seller Info */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-full bg-[#0a1628] overflow-hidden flex items-center justify-center">
            {listing.user.image ? (
              <img
                src={listing.user.image}
                alt={listing.user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-600 truncate">
              {listing.user.name}
            </p>
            <p className="text-[10px] text-slate-400">Seller</p>
          </div>
        </div>

        {/* Purchase Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Paid
            </span>
            <span className="font-bold text-[#0a1628]">
              ${purchase.price.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Date
            </span>
            <span className="font-semibold text-slate-600">
              {new Date(purchase.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* View Listing Button */}
        <Link
          href={`/marketplace/${listing.slug}`}
          className="flex items-center justify-center gap-2 w-full text-sm font-bold py-2.5 rounded-xl transition-all bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
        >
          <ExternalLink className="w-4 h-4" /> View Listing
        </Link>
      </div>
    </div>
  );
}
