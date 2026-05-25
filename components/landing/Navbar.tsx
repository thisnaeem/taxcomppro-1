"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser, clearUser } from "@/store/slices/authSlice";
import type { AuthUser } from "@/store/slices/authSlice";
import {
  JusticeScale01Icon, Menu01Icon, Cancel01Icon, Layout01Icon, Logout01Icon, UserCircleIcon,
  ArrowDown01Icon, Home01Icon, Notification01Icon, Search01Icon, ShoppingBag01Icon,
  UserGroupIcon, Message01Icon, UserAdd01Icon, BookOpen01Icon,
  Store01Icon, Rocket01Icon, Radio01Icon,
} from "hugeicons-react";
import { Gift, Shield, GraduationCap, ChevronDown, Megaphone, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

type NavItem =
  | { type: "link";     label: string; href: string;  icon: React.ElementType }
  | { type: "dropdown"; label: string; icon: React.ElementType; items: { label: string; href: string; icon: React.ElementType; desc: string }[] };

const navItems: NavItem[] = [
  { type: "link",     label: "Home",        href: "/feed",        icon: Home01Icon },
  { type: "link",     label: "Courses",     href: "/courses",    icon: BookOpen01Icon },
  { type: "link",     label: "Toolkits",    href: "/toolkits",   icon: GraduationCap },
  { type: "link",     label: "Marketplace", href: "/marketplace",icon: ShoppingBag01Icon },
  {
    type: "dropdown", label: "Pros", icon: UserGroupIcon,
    items: [
      { label: "Find a Pro",    href: "/find-a-pro",   icon: UserGroupIcon, desc: "" },
      { label: "Pro Talks",    href: "/pro-talks",    icon: Radio01Icon,   desc: "" },
      { label: "Communities",  href: "/communities",  icon: Rocket01Icon,  desc: "" },
      { label: "Pro Hub",      href: "/pro-hub",      icon: UserGroupIcon, desc: "" },
      { label: "Pro Marketing",href: "/pro-marketing",icon: Megaphone,     desc: "" },
    ],
  },
];

// Flat list for mobile menu — links + all dropdown sub-items
const navLinks: { label: string; href: string; icon: React.ElementType }[] = navItems.flatMap(item =>
  item.type === "link"
    ? [{ label: item.label, href: item.href, icon: item.icon }]
    : item.items.map(sub => ({ label: sub.label, href: sub.href, icon: sub.icon }))
);


export default function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [openMenu, setOpenMenu]         = useState<string | null>(null);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
  const [unreadCount, setUnreadCount]   = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const dropdownRef    = useRef<HTMLDivElement>(null);
  const navMenuRef     = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: session, isPending } = useSession();
  const dispatch = useAppDispatch();
  const storeUser = useAppSelector(s => s.auth.user);
  const user = session?.user;
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === "dark";

  // Directly set nav item colors — beats all CSS specificity issues
  useEffect(() => {
    if (!mounted) return;
    const items = document.querySelectorAll<HTMLElement>("[data-nav-item]");
    items.forEach(el => {
      el.style.color = resolvedTheme === "dark" ? "#ffffff" : "";
      el.onmouseenter = () => { el.style.color = resolvedTheme === "dark" ? "#f0c040" : ""; };
      el.onmouseleave = () => { el.style.color = resolvedTheme === "dark" ? "#ffffff" : ""; };
    });
  }, [mounted, resolvedTheme]);

  // Seed Redux auth state so feed components work in (landing) pages
  useEffect(() => {
    if (isPending) return;
    if (!session) { dispatch(clearUser()); return; }

    fetch("/api/user/me")
      .then(r => r.ok ? r.json() : null)
      .then((u: AuthUser | null) => {
        if (u) dispatch(setUser({
          id: u.id, email: u.email, name: u.name,
          role: u.role ?? "MEMBER", tier: u.tier ?? "FREE",
          image: u.image ?? null, coverImage: u.coverImage ?? null,
          bio: u.bio ?? null, headline: u.headline ?? null,
          hasDueDiligenceBadge: u.hasDueDiligenceBadge ?? false,
        }));
      })
      .catch(() => {
        if (session?.user) {
          const u = session.user as unknown as AuthUser & Record<string, unknown>;
          dispatch(setUser({
            id: u.id, email: u.email, name: u.name,
            role: (u.role as AuthUser["role"]) ?? "MEMBER",
            tier: (u.tier as AuthUser["tier"]) ?? "FREE",
            image: u.image as string | null,
            coverImage: u.coverImage as string | null,
            bio: u.bio as string | null,
            headline: u.headline as string | null,
          }));
        }
      });
  }, [session, isPending, dispatch]);

  // Fetch unread notification count when logged in
  useEffect(() => {
    if (!session) { setUnreadCount(0); setUnreadMessages(0); return; }
    fetch("/api/notifications")
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setUnreadCount(list.filter((n: { isRead: boolean }) => !n.isRead).length);
      })
      .catch(() => {});
    fetch("/api/messages/unread")
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(d => setUnreadMessages(d.count ?? 0))
      .catch(() => {});
  }, [session]);

  // Close user dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (navMenuRef.current && !navMenuRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
    setSearchOpen(false);
  };

  return (
    <>
      <style>{`
        @keyframes atlas-shine {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes atlas-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.4), 0 0 0 0 rgba(59,130,246,0.3); }
          50%       { box-shadow: 0 0 0 6px rgba(139,92,246,0), 0 0 16px 4px rgba(59,130,246,0.2); }
        }
        .atlas-btn {
          background: linear-gradient(270deg,#d4a017,#f0c040,#f59e0b,#d4a017);
          background-size: 300% 300%;
          animation: atlas-shine 4s ease infinite, atlas-pulse 2.5s ease-in-out infinite;
        }
        .atlas-btn:hover { animation: atlas-shine 1.5s ease infinite; }
      `}</style>
      <header className="sticky top-0 z-50 bg-white dark:bg-[#172135] border-b border-slate-200 dark:border-[#243550] shadow-sm dark:shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-6 h-[80px] flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 relative z-50">
          <img src="/logo.webp"      alt="TaxComPro" className="h-16 w-auto dark:hidden" />
          <img src="/logo_dark.webp" alt="TaxComPro" className="h-16 w-auto hidden dark:block" />
        </Link>

        {/* Search bar (expanded) */}
        {searchOpen ? (
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 max-w-lg mx-auto">
            <div className="flex-1 flex items-center bg-slate-100 border border-slate-200 rounded-full px-4 py-2 gap-2 focus-within:border-[#0a1628]/20 focus-within:ring-2 focus-within:ring-[#0a1628]/5 transition-all">
              <Search01Icon className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search marketplace, communities…"
                className="flex-1 bg-transparent text-sm text-[#0a1628] placeholder-slate-400 outline-none font-[inherit]"
              />
            </div>
            <button type="submit"
              className="text-xs font-bold bg-[#f0c040] text-[#0a1628] px-4 py-2 rounded-full hover:bg-[#d4a017] transition-all shrink-0">
              Search
            </button>
            <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              className="text-slate-500 hover:text-[#0a1628] p-1.5 rounded-full hover:bg-slate-100 transition-all shrink-0">
              <Cancel01Icon className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <>
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 flex-1" ref={navMenuRef}>
              {navItems.map(item => {
                if (item.type === "link") {
                  const Icon = item.icon;
                  return (
                    <Link key={item.label} href={item.href}
                      data-nav-item
                      className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#0a1628] hover:bg-slate-50 dark:hover:bg-white/10 px-3.5 py-2 rounded-lg transition-all">
                      <Icon className="w-3.5 h-3.5" />{item.label}
                    </Link>
                  );
                }
                // dropdown
                const Icon = item.icon;
                const isOpen = openMenu === item.label;
                return (
                  <div key={item.label} className="relative">
                    <button onClick={() => setOpenMenu(isOpen ? null : item.label)}
                      data-nav-item
                      className={`flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg transition-all ${
                        isOpen
                          ? "bg-slate-100 dark:bg-white/10 text-[#0a1628]"
                          : "text-slate-500 hover:text-[#0a1628] hover:bg-slate-50 dark:hover:bg-white/10"
                      }`}>
                      <Icon className="w-3.5 h-3.5" />{item.label}
                      <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="absolute top-full left-0 mt-1.5 w-52 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-50">
                        {item.items.map(sub => {
                          const SubIcon = sub.icon;
                          return (
                            <Link key={sub.label} href={sub.href}
                              onClick={() => setOpenMenu(null)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                              <div className="w-7 h-7 rounded-lg bg-[#0a1628]/8 flex items-center justify-center shrink-0">
                                <SubIcon className="w-3.5 h-3.5 text-[#0a1628]" />
                              </div>
                              <p className="text-sm font-bold text-[#0a1628]">{sub.label}</p>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Atlas AI promo button — square, black text */}
            <a
              href="https://atlas-ai-iota.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="atlas-btn hidden md:flex items-center gap-2 text-[#0a1628] font-black text-xs px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shrink-0 ml-2"
            >
              <img src="/icon.webp" alt="Atlas AI" className="w-5 h-5 rounded-sm object-contain" />
              <span>Try Atlas AI</span>
            </a>

            {/* Desktop right */}
            <div className="hidden md:flex items-center gap-1 ml-auto">
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 text-slate-500 hover:text-[#0a1628] hover:bg-slate-50 rounded-full transition-all"
                title={mounted ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
              >
                {mounted && (theme === "dark"
                  ? <Sun className="w-5 h-5" />
                  : <Moon className="w-5 h-5" />)
                }
              </button>

              {/* Search icon */}
              <button onClick={() => setSearchOpen(true)}
                className="p-2 text-slate-500 hover:text-[#0a1628] hover:bg-slate-50 rounded-full transition-all">
                <Search01Icon className="w-5 h-5" />
              </button>

              {/* Notification bell */}
              {user && (
                <Link href="/notifications"
                  className="relative p-2 text-slate-500 hover:text-[#0a1628] hover:bg-slate-50 rounded-full transition-all">
                  <Notification01Icon className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#f0c040] text-[#0a1628] text-[10px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Messages icon */}
              {user && (
                <Link href="/messages"
                  className="relative p-2 text-slate-500 hover:text-[#0a1628] hover:bg-slate-50 rounded-full transition-all">
                  <Message01Icon className="w-5 h-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-blue-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </Link>
              )}

              {isPending ? (
                <div className="flex items-center gap-2 ml-1">
                  {/* Skeleton: icon button placeholders */}
                  <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
                  <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
                  {/* Skeleton: user pill */}
                  <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full pl-2 pr-4 py-1.5 animate-pulse ml-1">
                    <div className="w-7 h-7 rounded-full bg-slate-200" />
                    <div className="w-16 h-3.5 rounded-full bg-slate-200" />
                  </div>
                </div>
              ) : user ? (
                <div className="relative ml-1" ref={dropdownRef}>
                <button
                    onClick={() => setDropdownOpen(o => !o)}
                    className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-2 pr-3.5 py-1.5 transition-all">
                    <div className="w-7 h-7 rounded-xl bg-[#1a3a6b] overflow-hidden flex items-center justify-center shrink-0">
                      {user.image
                        ? <img src={user.image as string} alt={user.name ?? ""} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        : <span className="text-white font-bold text-xs">{user.name?.[0]?.toUpperCase()}</span>}
                    </div>
                    <span className="font-semibold text-[#0a1628] text-sm max-w-[100px] truncate">{user.name?.split(" ")[0]}</span>
                    <ArrowDown01Icon className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-[calc(100%+8px)] bg-white border border-slate-200 rounded-2xl shadow-2xl min-w-[230px] p-2 z-50">
                      {/* User info */}
                      <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                        <div className="font-bold text-[#0a1628] text-sm">{user.name}</div>
                        <div className="text-xs text-slate-400 truncate">{user.email}</div>
                        {storeUser?.tier && storeUser.tier !== "FREE" && (
                          <span className="text-[10px] font-bold bg-[#d4a017]/15 text-[#a07810] px-2 py-0.5 rounded-full mt-1 inline-block">
                            {storeUser.tier === "MARKETPLACE_PLUS" ? "Marketplace Plus" : storeUser.tier === "MARKETPLACE" ? "Marketplace" : "VIP"}
                          </span>
                        )}
                      </div>

                      {/* Admin: Admin Panel only */}
                      {storeUser?.role === "ADMIN" ? (
                        <Link href="/admin" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 text-sm font-medium text-slate-600 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
                          <Shield className="w-4 h-4 text-[#d4a017]" /> Admin Panel
                        </Link>
                      ) : (
                        <>
                          <Link href="/profile" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 text-sm font-medium text-slate-600 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
                            <UserCircleIcon className="w-4 h-4 text-slate-400" /> My Profile
                          </Link>
                          <Link href="/marketplace?mine=true" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 text-sm font-medium text-slate-600 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
                            <Store01Icon className="w-4 h-4 text-slate-400" /> My Listings
                          </Link>
                          {(storeUser?.tier === "MARKETPLACE" || storeUser?.tier === "MARKETPLACE_PLUS") && (
                            <Link href="/seller-dashboard" onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 text-sm font-medium text-slate-600 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
                              <Rocket01Icon className="w-4 h-4 text-[#d4a017]" /> Seller Dashboard
                            </Link>
                          )}
                          <Link href="/my-courses" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 text-sm font-medium text-slate-600 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
                            <BookOpen01Icon className="w-4 h-4 text-slate-400" /> My Courses
                          </Link>
                          <Link href="/connections" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 text-sm font-medium text-slate-600 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
                            <UserAdd01Icon className="w-4 h-4 text-slate-400" /> Connections
                          </Link>
                          <Link href="/affiliate" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 text-sm font-medium text-slate-600 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
                            <Gift className="w-4 h-4 text-slate-400" /> Affiliate Program
                          </Link>
                          <Link href="/upgrade" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 text-sm font-medium text-[#d4a017] px-3 py-2.5 rounded-xl hover:bg-amber-50 transition-all">
                            <Rocket01Icon className="w-4 h-4" /> Upgrade Plan
                          </Link>
                        </>
                      )}

                      <div className="h-px bg-slate-100 my-1" />
                      <button onClick={async () => { setDropdownOpen(false); await signOut(); dispatch(clearUser()); window.location.href = "/"; }}
                        className="flex items-center gap-2.5 text-sm font-medium text-red-500 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-all w-full text-left">
                        <Logout01Icon className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-1">
                  <Link href="/login"
                    className="text-sm font-semibold text-[#0a1628] hover:text-[#d4a017] px-4 py-2 rounded-full transition-all">
                    Sign In
                  </Link>
                  <Link href="/register"
                    className="text-sm font-bold bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(212,160,23,0.4)] transition-all">
                    Get Started Free
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-[#0a1628] relative z-50 p-2 -mr-2">
              {mobileOpen ? <Cancel01Icon className="w-6 h-6" /> : <Menu01Icon className="w-6 h-6" />}
            </button>
          </>
        )}
      </div>

      {/* Mobile menu */}
      {mobileOpen && !searchOpen && (
        <div className="border-t border-white/10 p-4 flex flex-col gap-1">
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 mb-2">
            <Search01Icon className="w-4 h-4 text-white/50 shrink-0" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none font-[inherit]" />
          </form>

          {navLinks.map(l => (
            <Link key={l.label} href={l.href}
              className="flex items-center gap-2 text-white/80 px-4 py-3 rounded-lg hover:bg-white/8 font-medium"
              onClick={() => setMobileOpen(false)}>
              <l.icon className="w-4 h-4" />
              {l.label}
            </Link>
          ))}
          <div className="pt-3 mt-1 border-t border-white/10">
            {user ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 px-4 py-2 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-[#1a3a6b] overflow-hidden flex items-center justify-center">
                    {user.image
                      ? <img src={user.image as string} alt={user.name ?? ""} className="w-full h-full object-cover" />
                      : <span className="text-white font-bold">{user.name?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{user.name}</div>
                    <div className="text-white/40 text-xs truncate">{user.email}</div>
                  </div>
                </div>
                
                <div className="flex justify-around items-center bg-white/5 py-3 rounded-xl">
                  <button className="flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors">
                    <Search01Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Search</span>
                  </button>
                  <button className="flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors">
                    <Notification01Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Alerts</span>
                  </button>
                  <Link href="/messages" onClick={() => setMobileOpen(false)} className="flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors">
                    <Message01Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Chat</span>
                  </Link>
                </div>

                <Link href="/profile" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-white/80 px-4 py-3 rounded-lg hover:bg-white/8 font-medium">
                  <UserCircleIcon className="w-4 h-4" /> My Profile
                </Link>
                {storeUser?.role === "ADMIN" ? (
                  <Link href="/admin" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-amber-300 px-4 py-3 rounded-lg hover:bg-white/8 font-medium">
                    <Shield className="w-4 h-4" /> Admin Panel
                  </Link>
                ) : (
                  <>
                    <Link href="/marketplace?mine=true" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-white/80 px-4 py-3 rounded-lg hover:bg-white/8 font-medium">
                      <Store01Icon className="w-4 h-4" /> My Listings
                    </Link>
                    <Link href="/my-courses" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-white/80 px-4 py-3 rounded-lg hover:bg-white/8 font-medium">
                      <BookOpen01Icon className="w-4 h-4" /> My Courses
                    </Link>
                    <Link href="/connections" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-white/80 px-4 py-3 rounded-lg hover:bg-white/8 font-medium">
                      <UserAdd01Icon className="w-4 h-4" /> Connections
                    </Link>
                    <Link href="/affiliate" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-white/80 px-4 py-3 rounded-lg hover:bg-white/8 font-medium">
                      <Gift className="w-4 h-4" /> Affiliate Program
                    </Link>
                    <Link href="/upgrade" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-amber-300 px-4 py-3 rounded-lg hover:bg-white/8 font-medium">
                      <Rocket01Icon className="w-4 h-4" /> Upgrade Plan
                    </Link>
                  </>
                )}
                <button onClick={async () => { setMobileOpen(false); await signOut(); dispatch(clearUser()); window.location.href = "/"; }}
                  className="flex items-center gap-2 text-red-400 px-4 py-3 rounded-lg hover:bg-red-400/10 font-medium text-left w-full">
                  <Logout01Icon className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link href="/login" className="flex-1 text-center text-sm font-semibold text-white border border-white/20 py-2.5 rounded-full">Sign In</Link>
                <Link href="/register" className="flex-1 text-center text-sm font-bold bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] py-2.5 rounded-full">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
    </>
  );
}
