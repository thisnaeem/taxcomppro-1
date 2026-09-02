"use client";

import { useState, useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { markAllRead } from "@/store/slices/notificationSlice";
import { signOut } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  LogOut,
  UserCircle,
  ArrowUpCircle,
  ChevronDown,
  Gift,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
} from "lucide-react";
import { useSidebar } from "@/components/layout/SidebarContext";
import { useTheme } from "next-themes";

const pageTitles: Record<string, string> = {
  "/feed":                   "Feed",
  "/dashboard":              "Dashboard",
  "/marketplace":            "Marketplace",
  "/marketplace/create":     "Create Listing",
  "/communities":            "Communities",
  "/notifications":          "Notifications",
  "/profile":                "My Profile",
  "/upgrade":                "Upgrade Plan",
  "/courses":                "Courses",
  "/my-courses":             "My Courses",
  "/admin":                  "Admin Dashboard",
  "/admin/users":            "User Management",
  "/admin/approvals":        "Approvals",
  "/admin/analytics":        "Analytics",
  "/admin/settings":         "Settings",
  "/admin/courses":          "Course Management",
  "/admin/courses/create":   "Create Course",
  "/admin/payments":         "Payments & Revenue",
  "/admin/coupons":          "Coupons & Promotions",
  "/admin/affiliate":        "Affiliate Program",
  "/admin/media-gallery":    "Media Gallery",
  "/admin/content-calendar": "Content Calendar",
  "/admin/atlas":            "Atlas AI Settings",
  "/admin/support":          "Support Tickets",
};

export default function Topbar() {
  const user     = useAppSelector((s) => s.auth.user);
  const unread   = useAppSelector((s) => s.notifications.unreadCount);
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const pathname = usePathname();

  const { collapsed, toggleCollapsed } = useSidebar();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === "dark";

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const title = pageTitles[pathname] ?? "";

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    router.push("/");
  };

  const isAdmin = pathname ? pathname.startsWith("/admin") : false;

  return (
    <header
      className={`h-16 flex items-center justify-between px-5 sm:px-7 border-b sticky top-0 z-40 transition-colors duration-200 ${
        isAdmin
          ? "bg-white/95 dark:bg-[#0a1628]/85 backdrop-blur-md border-slate-200 dark:border-white/10"
          : "bg-white dark:bg-[#0a1628] border-slate-200 dark:border-white/10"
      }`}
    >
      {/* Left section: Collapse Button + Page Title */}
      <div className="flex items-center gap-3">
        {isAdmin && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-amber-500" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-500 dark:text-slate-300" />
            )}
          </button>
        )}

        {title && (
          <h1
            className={`text-lg sm:text-xl font-bold tracking-tight transition-colors ${
              isAdmin
                ? "text-slate-900 dark:text-white"
                : "text-[#0a1628] dark:text-white"
            }`}
          >
            {title}
          </h1>
        )}
      </div>

      {/* Right section: Theme Toggle + Notifications + User profile */}
      <div className="flex items-center gap-2">
        {/* Dark / Light Mode Toggle Pill Switch */}
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="relative inline-flex h-8 w-[58px] shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 bg-slate-200 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700 shadow-inner mx-1"
          title={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
          aria-label="Toggle theme switch"
        >
          {/* Left slot indicator */}
          <span className="flex items-center justify-center w-6 h-6 shrink-0 z-0">
            <Sun className={`w-3.5 h-3.5 transition-opacity ${isDark ? "text-amber-500/40" : "opacity-0"}`} />
          </span>

          {/* Right slot indicator */}
          <span className="flex items-center justify-center w-6 h-6 shrink-0 z-0 ml-auto">
            <Moon className={`w-3.5 h-3.5 transition-opacity ${isDark ? "opacity-0" : "text-blue-400/50"}`} />
          </span>

          {/* Sliding Thumb containing active centered icon */}
          <span
            className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white dark:bg-slate-900 shadow-md ring-1 ring-black/5 flex items-center justify-center transition-transform duration-300 ease-in-out z-10 ${
              isDark ? "translate-x-[26px]" : "translate-x-0"
            }`}
          >
            {isDark ? (
              <Moon className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
            )}
          </span>
        </button>

        {/* Notifications bell */}
        <Link
          href="/notifications"
          className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
            isAdmin
              ? "text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
              : "text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10"
          }`}
          title="Notifications"
          onClick={() => dispatch(markAllRead())}
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full px-1 animate-pulse">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        {/* User dropdown — click-based */}
        <div className="relative ml-0.5" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border transition-all cursor-pointer ${
              isAdmin
                ? "border-slate-200 dark:border-white/15 hover:border-slate-300 dark:hover:border-white/30 hover:bg-slate-100 dark:hover:bg-white/8 text-slate-800 dark:text-white"
                : "border-slate-200 dark:border-white/15 hover:border-slate-300 dark:hover:border-white/30 hover:bg-slate-50 dark:hover:bg-white/8 text-slate-800 dark:text-white"
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-amber-400/30">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user?.name ?? ""}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[#0a1628] font-black text-xs">
                  {user?.name?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-sm font-semibold max-w-[100px] truncate hidden sm:block">
              {user?.name?.split(" ")[0]}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              } opacity-60`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] bg-white dark:bg-[#0f1d33] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl min-w-[210px] p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* User info */}
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-white/10 mb-1">
                <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                  {user?.name}
                </div>
                <div className="text-xs text-slate-400 truncate">{user?.email}</div>
              </div>

              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                <UserCircle className="w-4 h-4 text-slate-400" /> Profile
              </Link>
              <a
                href="https://affiliate.taxcomppro.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                <Gift className="w-4 h-4 text-slate-400" /> Become an Affiliate
              </a>
              <Link
                href="/upgrade"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                <ArrowUpCircle className="w-4 h-4 text-slate-400" /> Upgrade Plan
              </Link>
              <div className="h-px bg-slate-100 dark:bg-white/10 my-1" />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 text-sm font-medium text-red-500 hover:text-red-600 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all w-full text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
