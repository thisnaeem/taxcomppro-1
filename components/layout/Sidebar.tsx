"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import Image from "next/image";
import {
  LayoutDashboard, Users, CheckSquare, BookOpen,
  BarChart2, Calendar, Images, Package, Gift, Bot,
  CreditCard, ChevronRight, LifeBuoy,
} from "lucide-react";

type NavLink = { icon: React.ElementType; label: string; href: string; exact?: boolean };

const tierStyle: Record<string, string> = {
  FREE:             "bg-white/10 text-white/60",
  VIP:              "bg-amber-400/20 text-amber-300",
  MARKETPLACE:      "bg-blue-400/20 text-blue-300",
  MARKETPLACE_PLUS: "bg-emerald-400/20 text-emerald-300",
};
const tierLabel: Record<string, string> = {
  FREE: "Free", VIP: "VIP", MARKETPLACE: "Marketplace", MARKETPLACE_PLUS: "Plus",
};

const memberLinks: NavLink[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", exact: true },
];

const adminLinks: NavLink[] = [
  { icon: LayoutDashboard, label: "Dashboard",        href: "/admin",                 exact: true },
  { icon: Users,           label: "Users",             href: "/admin/users" },
  { icon: CreditCard,      label: "Payments",          href: "/admin/payments" },
  { icon: CheckSquare,     label: "Approvals",         href: "/admin/approvals" },
  { icon: BookOpen,        label: "Courses",           href: "/admin/courses" },
  { icon: BarChart2,       label: "Analytics",         href: "/admin/analytics" },
  { icon: Calendar,        label: "Content Calendar",  href: "/admin/content-calendar" },
  { icon: Images,          label: "Media Gallery",     href: "/admin/media-gallery" },
  { icon: Package,         label: "Toolkit Downloads", href: "/admin/toolkit-assets" },
  { icon: Gift,            label: "Affiliate",         href: "/admin/affiliate" },
  { icon: Bot,             label: "Atlas AI",          href: "/admin/atlas" },
  { icon: LifeBuoy,        label: "Support Tickets",   href: "/admin/support" },
];


const navGroups = [
  { label: "Overview",   items: adminLinks.slice(0, 3) },
  { label: "Management", items: adminLinks.slice(3, 7) },
  { label: "Tools",      items: adminLinks.slice(7) },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user     = useAppSelector(s => s.auth.user);
  if (!user) return null;

  const isAdmin = user.role === "ADMIN";
  const links: NavLink[] = isAdmin ? adminLinks : memberLinks;

  return (
    <aside className="w-[230px] shrink-0 h-screen sticky top-0 bg-[#0a1628] flex flex-col z-10 shadow-2xl">
      {/* Logo area */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-white rounded-xl px-2 py-1.5">
            <Image
              src="/logo.webp"
              alt="TaxCompPro"
              width={110}
              height={32}
              className="object-contain"
              style={{ width: "auto", height: "auto" }}
              priority
            />
          </div>
        </Link>
        {isAdmin && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 bg-amber-400/15 text-amber-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Admin Panel
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-5 overflow-y-auto">
        {isAdmin ? navGroups.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/25 px-2.5 mb-1.5">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(l => {
                const isActive =
                  l.exact
                    ? pathname === l.href
                    : pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <Link
                    key={l.href + l.label}
                    href={l.href}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-[#f0c040] text-[#0a1628] shadow-lg shadow-amber-400/20"
                        : "text-white/55 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    <l.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#0a1628]" : "text-white/40 group-hover:text-white/70"}`} />
                    <span className="flex-1">{l.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#0a1628]/60" />}
                  </Link>
                );
              })}
            </div>
          </div>
        )) : (
          <div className="flex flex-col gap-0.5">
            {links.map(l => {
              const isActive = l.exact ? pathname === l.href : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive ? "bg-[#f0c040] text-[#0a1628]" : "text-white/55 hover:text-white hover:bg-white/8"
                  }`}
                >
                  <l.icon className="w-4 h-4 shrink-0" />
                  {l.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-amber-400/30">
          {user.image
            ? <img src={user.image} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            : <span className="text-[#0a1628] font-black text-sm">{user.name?.[0]?.toUpperCase()}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-bold truncate">{user.name}</div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 inline-block ${tierStyle[user.tier ?? "FREE"] ?? tierStyle.FREE}`}>
            {tierLabel[user.tier ?? "FREE"]}
          </span>
        </div>
      </div>
    </aside>
  );
}
