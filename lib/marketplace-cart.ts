"use client";

import { useState, useEffect, useCallback } from "react";

export interface MarketplaceCartSeller {
  id: string;
  name: string;
  image?: string | null;
}

export interface MarketplaceCartItem {
  id: string;
  slug: string | null;
  title: string;
  price: number | null;
  category: string;
  image: string;
  seller: MarketplaceCartSeller;
  isDemo?: boolean;
}

const STORAGE_KEY = "tcp_marketplace_cart";
const COUPON_STORAGE_KEY = "tcp_marketplace_coupon";
const CART_EVENT = "tcp-marketplace-cart-change";
const COUPON_EVENT = "tcp-marketplace-coupon-change";
const DRAWER_EVENT = "tcp-marketplace-cart-drawer-toggle";

export function getMarketplaceCoupon(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(COUPON_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function saveMarketplaceCoupon(code: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (code && code.trim()) {
      localStorage.setItem(COUPON_STORAGE_KEY, code.toUpperCase().trim());
      window.dispatchEvent(new CustomEvent(COUPON_EVENT, { detail: code.toUpperCase().trim() }));
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(COUPON_EVENT, { detail: null }));
    }
  } catch (err) {
    console.error("Failed to save marketplace coupon:", err);
  }
}

let globalMarketplaceDrawerOpen = false;

export function openMarketplaceCartDrawer() {
  globalMarketplaceDrawerOpen = true;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DRAWER_EVENT, { detail: true }));
  }
}

export function closeMarketplaceCartDrawer() {
  globalMarketplaceDrawerOpen = false;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DRAWER_EVENT, { detail: false }));
  }
}

export function toggleMarketplaceCartDrawer(open?: boolean) {
  globalMarketplaceDrawerOpen = typeof open === "boolean" ? open : !globalMarketplaceDrawerOpen;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DRAWER_EVENT, { detail: globalMarketplaceDrawerOpen }));
  }
}

export type AddToCartResult =
  | { success: true }
  | { success: false; reason: "ALREADY_IN_CART" }
  | { success: false; reason: "NETWORK_NOT_ALLOWED"; message: string }
  | { success: false; reason: "OWN_LISTING"; message: string }
  | {
      success: false;
      reason: "DIFFERENT_SELLER";
      currentSeller: MarketplaceCartSeller;
      newSeller: MarketplaceCartSeller;
      message: string;
    };

export function getMarketplaceCart(): MarketplaceCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: MarketplaceCartItem[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Sanitize: filter out networks (they have dedicated monthly join checkout)
    const valid = parsed.filter(
      (item) => item.category !== "NETWORK" && !item.id?.startsWith("network-")
    );
    if (valid.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
}

export function saveMarketplaceCart(items: MarketplaceCartItem[]) {
  if (typeof window === "undefined") return;
  try {
    // Ensure no networks enter cart
    const cleanItems = items.filter(
      (i) => i.category !== "NETWORK" && !i.id?.startsWith("network-")
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanItems));
    window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: cleanItems }));
  } catch (err) {
    console.error("Failed to save marketplace cart:", err);
  }
}

export function addToMarketplaceCart(
  item: MarketplaceCartItem,
  currentUserId?: string,
  forceReplace?: boolean
): AddToCartResult {
  if (item.category === "NETWORK" || item.id?.startsWith("network-")) {
    return {
      success: false,
      reason: "NETWORK_NOT_ALLOWED",
      message: "Pro Networks are monthly memberships and cannot be added to the product cart. Please join directly from the Network page.",
    };
  }

  if (currentUserId && item.seller?.id && item.seller.id === currentUserId) {
    return {
      success: false,
      reason: "OWN_LISTING",
      message: "You cannot purchase your own listing.",
    };
  }

  const current = getMarketplaceCart();
  if (!forceReplace && current.some((i) => i.id === item.id)) {
    return { success: false, reason: "ALREADY_IN_CART" };
  }

  // Check if current cart has items from a different seller
  const existingSellerItem = current.find(
    (i) => i.seller?.id && item.seller?.id && i.seller.id !== item.seller.id
  );

  if (existingSellerItem && !forceReplace) {
    return {
      success: false,
      reason: "DIFFERENT_SELLER",
      currentSeller: existingSellerItem.seller,
      newSeller: item.seller,
      message: `Your cart contains items from ${existingSellerItem.seller.name}. Direct Stripe payouts require checking out one seller at a time.`,
    };
  }

  if (forceReplace) {
    saveMarketplaceCart([item]);
  } else {
    saveMarketplaceCart([...current, item]);
  }

  return { success: true };
}

export function removeFromMarketplaceCart(id: string) {
  const current = getMarketplaceCart();
  const next = current.filter((i) => i.id !== id);
  saveMarketplaceCart(next);
}

export function clearMarketplaceCart() {
  saveMarketplaceCart([]);
}

export function isInMarketplaceCart(id: string): boolean {
  const current = getMarketplaceCart();
  return current.some((i) => i.id === id);
}

export function getMarketplaceCartTotal(): number {
  return getMarketplaceCart().reduce((sum, item) => sum + (item.price || 0), 0);
}

export function useMarketplaceCart() {
  const [items, setItems] = useState<MarketplaceCartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(globalMarketplaceDrawerOpen);

  useEffect(() => {
    setItems(getMarketplaceCart());
    setIsLoaded(true);

    const handleUpdate = () => {
      setItems(getMarketplaceCart());
    };

    const handleDrawer = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setIsOpen(Boolean(customEvent.detail));
    };

    window.addEventListener(CART_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener(DRAWER_EVENT, handleDrawer as EventListener);
    return () => {
      window.removeEventListener(CART_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener(DRAWER_EVENT, handleDrawer as EventListener);
    };
  }, []);

  const add = useCallback((item: MarketplaceCartItem, currentUserId?: string, forceReplace?: boolean) => {
    const result = addToMarketplaceCart(item, currentUserId, forceReplace);
    if (result.success) {
      openMarketplaceCartDrawer();
    }
    return result;
  }, []);

  const remove = useCallback((id: string) => {
    removeFromMarketplaceCart(id);
  }, []);

  const clear = useCallback(() => {
    clearMarketplaceCart();
  }, []);

  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const distinctSellerIds = Array.from(new Set(items.map((i) => i.seller?.id).filter(Boolean)));
  const hasMultipleSellers = distinctSellerIds.length > 1;
  const currentSeller = items[0]?.seller || null;

  return {
    items,
    isLoaded,
    count: items.length,
    total,
    add,
    remove,
    clear,
    isInCart: (id: string) => items.some((i) => i.id === id),
    isOpen,
    openCart: () => openMarketplaceCartDrawer(),
    closeCart: () => closeMarketplaceCartDrawer(),
    setIsOpen: (open: boolean) => toggleMarketplaceCartDrawer(open),
    currentSeller,
    hasMultipleSellers,
    distinctSellerIds,
  };
}
