"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import {
  Home01Icon,
  Briefcase02Icon,
  ShoppingBag01Icon,
  Message01Icon,
  UserCircleIcon,
  Login01Icon,
} from "hugeicons-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const user = useAppSelector((s) => s.auth.user);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch unread messages count if logged in
  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      return;
    }

    const checkUnread = () => {
      fetch("/api/messages/unread")
        .then((r) => (r.ok ? r.json() : { count: 0 }))
        .then((d) => setUnreadMessages(d.count ?? 0))
        .catch(() => {});
    };

    checkUnread();
    // Check every 45 seconds
    const interval = setInterval(checkUnread, 45_000);
    return () => clearInterval(interval);
  }, [user]);

  // Don't show in admin, auth, or full-screen immersive spaces if desired
  if (
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    return null;
  }

  const navItems = [
    {
      label: "Feed",
      href: "/feed",
      icon: Home01Icon,
      isActive: pathname === "/feed" || pathname === "/",
    },
    {
      label: "Toolkits",
      href: "/toolkits",
      icon: Briefcase02Icon,
      isActive: pathname.startsWith("/toolkits"),
    },
    {
      label: "Marketplace",
      href: "/marketplace",
      icon: ShoppingBag01Icon,
      isActive: pathname.startsWith("/marketplace") || pathname.startsWith("/courses"),
    },
    {
      label: "Messages",
      href: user ? "/messages" : "/login?redirect=/messages",
      icon: Message01Icon,
      badge: unreadMessages > 0 ? (unreadMessages > 99 ? "99+" : unreadMessages) : null,
      isActive: pathname.startsWith("/messages"),
    },
    {
      label: user ? "Profile" : "Sign In",
      href: user ? "/profile" : "/login",
      icon: user ? UserCircleIcon : Login01Icon,
      isAvatar: !!user?.image,
      avatarUrl: user?.image,
      isActive: pathname.startsWith("/profile") || pathname.startsWith("/my-profile"),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0a1628]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.45)] pb-[max(env(safe-area-inset-bottom),10px)] pt-1 px-2"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 min-w-[56px] transition-all duration-200 active:scale-90 ${
                active ? "text-[#f0c040]" : "text-slate-400 hover:text-white"
              }`}
            >
              {/* Active Indicator Top Bar */}
              {active && (
                <span className="absolute -top-1 w-6 h-[2.5px] bg-gradient-to-r from-[#f0c040] to-[#d4a017] rounded-full shadow-[0_0_10px_#f0c040]" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center h-6 w-6 mb-0.5">
                {item.isAvatar && item.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt=""
                    className={`w-6 h-6 rounded-full object-cover border transition-all ${
                      active ? "border-[#f0c040] shadow-[0_0_8px_rgba(240,192,64,0.5)]" : "border-white/30"
                    }`}
                  />
                ) : (
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      active ? "scale-110" : ""
                    }`}
                  />
                )}

                {/* Notification / Message Badge */}
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white font-extrabold text-[9px] flex items-center justify-center border-2 border-[#0a1628] shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] tracking-tight leading-tight transition-colors ${
                  active ? "font-black text-[#f0c040]" : "font-semibold text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
