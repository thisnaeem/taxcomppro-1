"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMarketplaceCart, MarketplaceCartItem } from "@/lib/marketplace-cart";
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

  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          listingId: items[0]?.id,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscountPercent(data.discountValue || 10);
      } else {
        setCouponError(data.error || "Invalid promo code");
      }
    } catch {
      setCouponError("Could not validate promo code");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoadingCheckout(true);
    setCheckoutError(null);

    try {
      const res = await fetch("/api/stripe/marketplace-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingIds: items.map((i) => i.id),
          couponCode: couponCode || undefined,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.isFree || data.success) {
        clear();
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

  if (!isOpen) return null;

  const discountAmount = discountPercent ? (total * discountPercent) / 100 : 0;
  const finalTotal = Math.max(0, total - discountAmount);

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex justify-end transition-opacity duration-200"
      onClick={closeCart}
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
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-slate-300">
                          {item.category}
                        </span>
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
              {/* Promo code input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Promo code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full pl-8 pr-3 py-2 bg-[#0a1628] border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 uppercase tracking-wider focus:outline-none focus:border-[#ffbe24]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="px-3 py-2 bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
                >
                  {validatingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                </button>
              </div>

              {couponError && <p className="text-[11px] text-red-400">{couponError}</p>}
              {discountPercent && (
                <p className="text-[11px] text-emerald-400 font-semibold">
                  ✓ {discountPercent}% discount applied!
                </p>
              )}

              {/* Total Calculation */}
              <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-white/5">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">${total.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Discount</span>
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
                disabled={loadingCheckout}
                className="w-full bg-[#ffbe24] hover:bg-[#f0b01c] text-[#0a1628] font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-[#ffbe24]/20 transition-all hover:-translate-y-0.5 disabled:opacity-60"
              >
                {loadingCheckout ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing Stripe Checkout…</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Checkout with Stripe &rarr;</span>
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
}
