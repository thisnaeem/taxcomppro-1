"use client";

import { useState, useEffect, useCallback } from "react";

export interface MarketplaceCartItem {
  id: string;
  slug: string | null;
  title: string;
  price: number | null;
  category: string;
  image: string;
  seller: {
    id: string;
    name: string;
    image?: string | null;
  };
  isDemo?: boolean;
}

const STORAGE_KEY = "tcp_marketplace_cart";
const CART_EVENT = "tcp-marketplace-cart-change";
const DRAWER_EVENT = "tcp-marketplace-cart-drawer-toggle";

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

export function getMarketplaceCart(): MarketplaceCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveMarketplaceCart(items: MarketplaceCartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: items }));
  } catch (err) {
    console.error("Failed to save marketplace cart:", err);
  }
}

export function addToMarketplaceCart(item: MarketplaceCartItem): boolean {
  const current = getMarketplaceCart();
  if (current.some((i) => i.id === item.id)) {
    return false; // Already in cart
  }
  saveMarketplaceCart([...current, item]);
  return true;
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

  const add = useCallback((item: MarketplaceCartItem) => {
    const success = addToMarketplaceCart(item);
    openMarketplaceCartDrawer();
    return success;
  }, []);

  const remove = useCallback((id: string) => {
    removeFromMarketplaceCart(id);
  }, []);

  const clear = useCallback(() => {
    clearMarketplaceCart();
  }, []);

  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);

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
  };
}
