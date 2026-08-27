"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUser, clearUser, type AuthUser } from "@/store/slices/authSlice";
import { authClient, useSession } from "@/lib/auth-client";
import {
  LayoutDashboard,
  User,
  Crown,
  Briefcase,
  GraduationCap,
  Award,
  Radio,
  Users,
  Search,
  ShoppingCart,
  Contact2,
  FileText,
  HelpCircle,
  Settings,
  LogOut,
  Bell,
  MessageSquare,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface ProfileDashboardShellProps {
  children: React.ReactNode;
  activeNav?: string;
}

export default function ProfileDashboardShell({
  children,
  activeNav = "MY PROFILE",
}: ProfileDashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const storeUser = useAppSelector((s) => s.auth.user);
  const { data: session, isPending } = useSession();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ensure user session is always loaded & synced with Redux
  useEffect(() => {
    if (isPending) return;
    if (!session) {
      // User is not logged in
      return;
    }

    fetch("/api/user/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u: AuthUser | null) => {
        if (u) {
          dispatch(
            setUser({
              id: u.id,
              email: u.email,
              name: u.name,
              role: u.role ?? "MEMBER",
              tier: u.tier ?? "FREE",
              image: u.image ?? null,
              coverImage: u.coverImage ?? null,
              bio: u.bio ?? null,
              headline: u.headline ?? null,
              location: u.location ?? null,
              yearsExperience: u.yearsExperience ?? null,
              mission: u.mission ?? null,
              website: u.website ?? null,
              linkedIn: u.linkedIn ?? null,
              twitter: u.twitter ?? null,
              facebook: u.facebook ?? null,
              specialties: u.specialties ?? [],
              certifications: u.certifications ?? [],
              languages: u.languages ?? [],
              mediaPhotos: u.mediaPhotos ?? [],
              voiceMemoUrl: u.voiceMemoUrl ?? null,
              hasDueDiligenceBadge: u.hasDueDiligenceBadge ?? false,
            })
          );
        }
      })
      .catch(() => {
        if (session?.user) {
          const u = session.user as unknown as AuthUser & Record<string, unknown>;
          dispatch(
            setUser({
              id: u.id,
              email: u.email,
              name: u.name,
              role: (u.role as AuthUser["role"]) ?? "MEMBER",
              tier: (u.tier as AuthUser["tier"]) ?? "FREE",
              image: (u.image as string | null) ?? null,
              coverImage: (u.coverImage as string | null) ?? null,
              bio: (u.bio as string | null) ?? null,
              headline: (u.headline as string | null) ?? null,
            })
          );
        }
      });
  }, [session, isPending, dispatch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch {
      // fallback
    }
    dispatch(clearUser());
    router.push("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const currentUser = storeUser || session?.user;

  const navItems = [
    { label: "DASHBOARD", icon: LayoutDashboard, href: "/seller-dashboard" },
    { label: "MY PROFILE", icon: User, href: "/profile" },
    { label: "MY MEMBERSHIP", icon: Crown, href: "/upgrade" },
    { label: "MY TOOLKITS", icon: Briefcase, href: "/toolkits" },
    { label: "MY COURSES", icon: GraduationCap, href: "/my-courses" },
    { label: "MY CERTIFICATES", icon: Award, href: "/my-courses" },
    { label: "PRO TALKS", icon: Radio, href: "/courses" },
    { label: "COMMUNITIES", icon: Users, href: "/communities" },
    { label: "FIND A PRO", icon: Search, href: "/find-a-pro" },
    { label: "MARKETPLACE", icon: ShoppingCart, href: "/marketplace", badge: "PLUS" },
    { label: "PRO CONNECT CARD", icon: Contact2, href: "/profile?tab=card" },
    { label: "RESOURCES", icon: FileText, href: "/training-center" },
    { label: "SUPPORT", icon: HelpCircle, href: "/contact" },
    { label: "SETTINGS", icon: Settings, href: "/profile?tab=settings" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#0A1628] font-sans antialiased flex flex-col">
      {/* ── TOPBAR HEADER ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Mobile Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] flex items-center justify-center shadow-md shadow-[#0a1628]/10 group-hover:scale-105 transition-transform">
                <span className="text-amber-400 font-black text-xs tracking-wider">TCP</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-black tracking-tight text-[#0a1628] leading-tight">
                  TAX COMPLIANCE <span className="text-red-600">PRO</span>
                </span>
                <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                  PROTECT. EMPOWER. ELEVATE.
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Search Bar */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-xl mx-4 hidden md:block"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Tax Compliance Pro..."
                className="w-full bg-[#f8fafc] hover:bg-slate-100 focus:bg-white text-xs font-medium text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-full border border-slate-200 focus:border-[#1E56A0] focus:ring-2 focus:ring-[#1E56A0]/10 outline-none transition-all"
              />
            </div>
          </form>

          {/* Right: Actions & User Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Messages */}
            <Link
              href="/messages"
              className="relative p-2.5 text-slate-600 hover:text-[#1E56A0] hover:bg-slate-100 rounded-full transition-colors"
              title="Messages"
            >
              <MessageSquare className="w-5 h-5" />
            </Link>

            {/* Notifications with Badge */}
            <Link
              href="/notifications"
              className="relative p-2.5 text-slate-600 hover:text-[#1E56A0] hover:bg-slate-100 rounded-full transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-sm">
                3
              </span>
            </Link>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#0A1628] ring-2 ring-slate-200 flex items-center justify-center shrink-0">
                  {currentUser?.image ? (
                    <img
                      src={currentUser.image}
                      alt={currentUser.name ?? "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-xs font-bold">
                      {currentUser?.name?.[0]?.toUpperCase() ?? "U"}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800 hidden sm:inline-block max-w-[120px] truncate">
                  {currentUser?.name ?? "Account"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline-block" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-[#0A1628] truncate">{currentUser?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {currentUser && "role" in currentUser && currentUser.role === "PROFESSIONAL"
                        ? "Verified Pro"
                        : currentUser && "role" in currentUser && currentUser.role === "ADMIN"
                        ? "Admin"
                        : "Member"}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1E56A0]"
                    >
                      <User className="w-4 h-4 text-slate-400" /> My Profile
                    </Link>
                    <Link
                      href="/upgrade"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-amber-600"
                    >
                      <Crown className="w-4 h-4 text-amber-500" /> Membership Plan
                    </Link>
                    {currentUser && "role" in currentUser && currentUser.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> Admin Dashboard
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── CONTAINED MAIN BODY CONTAINER WITH PADDING ──────────────────────────── */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* ── LEFT SIDEBAR NAVIGATION ─────────────────────────────────────────── */}
        <aside
          className={`fixed lg:static top-20 left-4 h-[calc(100vh-6rem)] lg:h-auto w-64 bg-white rounded-3xl border border-slate-200 shadow-xs shrink-0 z-30 flex flex-col justify-between overflow-y-auto transition-transform duration-200 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Navigation Links */}
          <div className="p-3.5 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.label === activeNav ||
                (item.label === "MY PROFILE" && pathname === "/profile") ||
                (item.label === "DASHBOARD" && pathname === "/seller-dashboard");

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isActive
                      ? "bg-[#EAF2FC] text-[#1E56A0] shadow-xs"
                      : "text-slate-600 hover:text-[#0A1628] hover:bg-slate-100/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={`w-4 h-4 ${
                        isActive ? "text-[#1E56A0]" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-400 text-[#0A1628]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Log Out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide text-slate-500 hover:text-red-600 hover:bg-red-50/80 transition-all text-left mt-2"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>LOG OUT</span>
            </button>
          </div>

          {/* Bottom Upgrade CTA Box */}
          <div className="p-3.5 pt-1">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A1628] via-[#0E2038] to-[#122A4A] p-4 text-white shadow-lg shadow-[#0a1628]/20 border border-slate-800">
              {/* Gold watermark icon */}
              <div className="absolute -right-3 -bottom-4 w-24 h-24 opacity-10 pointer-events-none">
                <Sparkles className="w-full h-full text-amber-400" />
              </div>

              <div className="relative z-10">
                <span className="inline-block text-[9px] font-black uppercase tracking-widest text-amber-400 mb-1">
                  TAX PROFESSIONAL?
                </span>
                <h4 className="text-xs font-extrabold text-white leading-snug mb-3">
                  UPGRADE YOUR EXPERIENCE
                </h4>

                <ul className="space-y-1.5 text-[11px] text-slate-300 font-medium mb-4">
                  <li className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">✓</span> Exclusive Toolkits
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">✓</span> Advanced Training
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">✓</span> Priority Support
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">✓</span> More Connections
                  </li>
                </ul>

                <Link
                  href="/upgrade"
                  className="w-full block text-center py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#0A1628] font-black text-xs uppercase tracking-wider shadow-md hover:shadow-amber-400/20 transition-all active:scale-[0.98]"
                >
                  UPGRADE NOW
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile navigation */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-20 lg:hidden"
          />
        )}

        {/* ── MAIN CONTENT AREA ───────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
