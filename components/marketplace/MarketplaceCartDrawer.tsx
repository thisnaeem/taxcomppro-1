"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import {
  useMarketplaceCart,
  MarketplaceCartItem,
  saveMarketplaceCart,
  getMarketplaceCoupon,
  saveMarketplaceCoupon,
} from "@/lib/marketplace-cart";
import {
  ShoppingBag,
  X,
  Trash2,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
} from "lucide-react";

export function MarketplaceCartDrawer() {
  const { items, count, total, remove, clear, isOpen, closeCart } = useMarketplaceCart();
  const router = useRouter();
  const currentUser = useAppSelector((s) => s.auth.user);

  interface AppliedCouponInfo {
    code: string;
    discountType: string;
    discountValue: number;
    savings: number;
    label: string;
  }

  const [mounted, setMounted] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponInfo | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Check for owned listings in cart
  const ownItems = items.filter(
    (i) => Boolean(currentUser?.id && i.seller?.id && i.seller.id === currentUser.id)
  );
  const hasOwnItems = ownItems.length > 0;

  // Check for multiple sellers in cart
  const sellersMap = new Map<string, { id: string; name: string }>();
  items.forEach((i) => {
    if (i.seller?.id) {
      sellersMap.set(i.seller.id, { id: i.seller.id, name: i.seller.name });
    }
  });
  const distinctSellers: { id: string; name: string }[] = Array.from(sellersMap.values());
  const hasMultipleSellers = distinctSellers.length > 1;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeCart]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Auto-clean any legacy network items on drawer open
  useEffect(() => {
    if (isOpen) {
      const cleaned = items.filter(
        (i) => i.category !== "NETWORK" && !i.id?.startsWith("network-")
      );
      if (cleaned.length !== items.length) {
        saveMarketplaceCart(cleaned);
      }
    }
  }, [isOpen, items]);

  const handleApplyCoupon = async (codeOverride?: string) => {
    const codeToValidate = (codeOverride !== undefined ? codeOverride : couponCode).trim().toUpperCase();
    if (!codeToValidate) return;
    if (items.length === 0) {
      setCouponError("Add items to cart to apply promo code");
      return;
    }
    setValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeToValidate,
          cartItems: items.map((i) => ({
            id: i.id,
            slug: i.slug,
            title: i.title,
            price: i.price ?? 0,
            sellerId: i.seller?.id,
            category: i.category,
          })),
          subtotal: total,
          sellerId: items[0]?.seller?.id,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          savings: data.savings,
          label: data.label,
        });
        setCouponCode(data.code);
        saveMarketplaceCoupon(data.code);
      } else {
        setAppliedCoupon(null);
        setCouponError(data.error || "Invalid promo code");
      }
    } catch {
      setAppliedCoupon(null);
      setCouponError("Could not validate promo code");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
    saveMarketplaceCoupon(null);
  };

  // Auto-load saved coupon from storage
  useEffect(() => {
    if (isOpen && items.length > 0 && !appliedCoupon) {
      const savedCode = getMarketplaceCoupon();
      if (savedCode) {
        setCouponCode(savedCode);
        handleApplyCoupon(savedCode);
      }
    }
  }, [isOpen, items.length]);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!currentUser) {
      closeCart();
      router.push(`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/marketplace")}`);
      return;
    }
    setLoadingCheckout(true);
    setCheckoutError(null);

    try {
      const activeCode = appliedCoupon?.code || couponCode.trim().toUpperCase() || undefined;
      const res = await fetch("/api/stripe/marketplace-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingIds: items.map((i) => i.id),
          couponCode: activeCode,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.isFree || data.success) {
        clear();
        saveMarketplaceCoupon(null);
        closeCart();
        router.push("/marketplace?view=purchases&checkout_success=true");
      } else if (data.alreadyPurchased) {
        setCheckoutError("One or more items have already been purchased. Please check your Purchases tab.");
        setLoadingCheckout(false);
      } else {
        throw new Error(data.error || "Failed to start checkout");
      }
    } catch (err: any) {
      console.error("Marketplace checkout error:", err);
      setCheckoutError(err?.message || "Failed to initiate Stripe checkout. Please try again.");
      setLoadingCheckout(false);
    }
  };

  if (!mounted || !isOpen) return null;

  const discountAmount = appliedCoupon ? appliedCoupon.savings : 0;
  const finalTotal = Math.max(0, total - discountAmount);

  const drawerContent = (
    <div
      className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex justify-end transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeCart();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md h-full bg-[#0a1628] border-l border-white/10 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/10 bg-[#071120]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ffbe24]/10 border border-[#ffbe24]/20 flex items-center justify-center text-[#ffbe24]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Marketplace Cart</h2>
              <p className="text-xs text-slate-400">
                {count === 1 ? "1 item selected" : `${count} items selected`}
              </p>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Close Cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notice */}
        {checkoutError && (
          <div className="p-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* Own Listing Warning */}
        {hasOwnItems && (
          <div className="p-3.5 bg-red-500/15 border-b border-red-500/30 text-xs text-red-300 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>You cannot purchase your own listing</span>
            </div>
            <p className="text-[11px] text-red-300/90 leading-tight">
              Direct Stripe payouts cannot charge yourself. Please remove your listing ({ownItems.map(i => i.title).join(", ")}) to proceed.
            </p>
            <button
              type="button"
              onClick={() => {
                const cleaned = items.filter((i) => i.seller?.id !== currentUser?.id);
                saveMarketplaceCart(cleaned);
              }}
              className="self-start px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 rounded text-[11px] font-bold transition-colors"
            >
              Remove My Listing(s)
            </button>
          </div>
        )}

        {/* Multiple Sellers Notice */}
        {hasMultipleSellers && !hasOwnItems && (
          <div className="p-3.5 bg-amber-500/15 border-b border-amber-500/30 text-xs text-amber-200 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Multiple sellers in cart</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-tight">
              Payments go directly to each seller's connected Stripe account. Stripe requires checking out one seller at a time.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {distinctSellers.map((seller) => (
                <button
                  key={seller.id}
                  type="button"
                  onClick={() => {
                    const cleaned = items.filter((i) => i.seller?.id === seller.id);
                    saveMarketplaceCart(cleaned);
                  }}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded text-[11px] font-bold transition-colors"
                >
                  Keep only {seller.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Single Seller Direct Payout Banner */}
        {!hasMultipleSellers && !hasOwnItems && items.length > 0 && (
          <div className="px-5 py-2.5 bg-[#071120] border-b border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Seller: <strong className="text-white ml-1">{items[0]?.seller?.name || "Professional"}</strong>
            </span>
            <span className="text-[10.5px] text-emerald-400 flex items-center gap-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct Stripe Payout
            </span>
          </div>
        )}

        {/* Cart Contents */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-4">
              <ShoppingBag className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Your marketplace cart is empty</h3>
            <p className="text-xs text-slate-400 max-w-xs mb-6 leading-relaxed">
              Explore professional services, compliance toolkits, specialist networks, and practitioner resources.
            </p>
            <button
              onClick={closeCart}
              className="bg-[#ffbe24] hover:bg-[#f0b01c] text-[#0a1628] font-bold text-xs px-5 py-2.5 rounded-lg transition-transform hover:-translate-y-0.5"
            >
              Browse Marketplace Items
            </button>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#0f1f38] border border-white/10 rounded-xl p-3.5 flex gap-3 hover:border-[#ffbe24]/40 transition-colors"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#071120] border border-white/10 shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-slate-300">
                            {item.category}
                          </span>
                          {currentUser?.id && item.seller?.id === currentUser.id && (
                            <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                              Your Listing
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => remove(item.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">By {item.seller.name}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1 mt-1 border-t border-white/5">
                      <span className="text-xs font-extrabold text-[#ffbe24]">
                        {item.price == null || item.price === 0
                          ? "Free"
                          : `$${item.price.toFixed(2)}`}
                      </span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Direct Access
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Summary & Checkout */}
            <div className="p-5 border-t border-white/10 bg-[#071120] flex flex-col gap-4">
              {/* Promo Code Section */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold min-w-0">
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      Promo <strong className="text-white font-mono">{appliedCoupon.code}</strong> applied ({appliedCoupon.label})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors ml-2 shrink-0"
                    title="Remove promo code"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Promo code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        className="w-full pl-8 pr-3 py-2 bg-[#0a1628] border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 uppercase tracking-wider focus:outline-none focus:border-[#ffbe24]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      disabled={validatingCoupon || !couponCode.trim()}
                      className="px-3 py-2 bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
                    >
                      {validatingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-red-400 pl-1">{couponError}</p>}
                </div>
              )}

              {/* Total Calculation */}
              <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-white/5">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">${total.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Discount {appliedCoupon ? `(${appliedCoupon.label})` : ""}</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-white pt-1.5 border-t border-white/10">
                  <span>Total Due</span>
                  <span className="text-base text-[#ffbe24]">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loadingCheckout || hasOwnItems || hasMultipleSellers}
                style={{ color: "#0a1628" }}
                className="w-full bg-[#ffbe24] hover:bg-[#f0b01c] !text-[#0a1628] font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-[#ffbe24]/20 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingCheckout ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0a1628]" />
                    <span className="text-[#0a1628]">Preparing Checkout…</span>
                  </>
                ) : hasOwnItems ? (
                  <span className="text-[#0a1628]">Remove Own Listing to Proceed</span>
                ) : hasMultipleSellers ? (
                  <span className="text-[#0a1628]">Select One Seller to Proceed</span>
                ) : finalTotal === 0 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0a1628]" />
                    <span className="text-[#0a1628]">Claim Free Listing{items.length > 1 ? "s" : ""} &rarr;</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-[#0a1628]" />
                    <span className="text-[#0a1628]">Checkout with Stripe &rarr;</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10.5px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-[#ffbe24]" />
                <span>Secure Stripe Checkout · Instant Download &amp; Receipt</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (typeof document !== "undefined" && document.body) {
    return createPortal(drawerContent, document.body);
  }

  return drawerContent;
}
