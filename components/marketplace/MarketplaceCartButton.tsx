"use client";

import { useMarketplaceCart } from "@/lib/marketplace-cart";
import { ShoppingBag } from "lucide-react";

export function MarketplaceCartButton({ className = "" }: { className?: string }) {
  const { count, openCart, isLoaded } = useMarketplaceCart();

  if (!isLoaded) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openCart();
        }}
        className={`relative inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1527] text-slate-600 dark:text-slate-300 ${className}`}
        aria-label="Marketplace Cart"
      >
        <ShoppingBag className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openCart();
      }}
      className={`relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1527] hover:border-[#ffbe24]/60 dark:hover:border-[#ffbe24]/60 text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:-translate-y-0.5 ${className}`}
      aria-label={`Marketplace Cart with ${count} items`}
      title="View Marketplace Cart"
    >
      <ShoppingBag className="w-4 h-4 text-[#ffbe24]" />
      <span className="text-xs font-bold hidden sm:inline">Cart</span>
      {count > 0 && (
        <span className="bg-[#ffbe24] text-[#0a1628] text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center -ml-0.5">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
