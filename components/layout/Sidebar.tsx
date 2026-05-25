"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import Image from "next/image";
import {
  LayoutDashboard, CheckSquare, BarChart2, BookOpen, Gift, Bot, Calendar, Images, Package,
} from "lucide-react";

type NavLink = { icon: React.ElementType; label: string; href: string; exact?: boolean };

const tierStyle: Record<string, string> = {
  FREE:             "bg-slate-100 text-slate-500",
  VIP:              "bg-amber-100 text-amber-700",
  MARKETPLACE:      "bg-blue-100 text-blue-700",
  MARKETPLACE_PLUS: "bg-emerald-100 text-emerald-700",
};
const tierLabel: Record<string, string> = {
  FREE: "Free", VIP: "VIP", MARKETPLACE: "Marketplace", MARKETPLACE_PLUS: "Plus",
};

/* Member: Dashboard only */
const memberLinks: NavLink[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", exact: true },
];

/* Admin: clean set */
const adminLinks: NavLink[] = [
  { icon: LayoutDashboard, label: "Dashboard",          href: "/admin",                    exact: true },
  { icon: CheckSquare,     label: "Users",               href: "/admin/users" },
  { icon: CheckSquare,     label: "Approvals",           href: "/admin/approvals" },
  { icon: BookOpen,        label: "Courses",             href: "/admin/courses" },
  { icon: BarChart2,       label: "Analytics",           href: "/admin/analytics" },
  { icon: Calendar,        label: "Content Calendar",    href: "/admin/content-calendar" },
  { icon: Images,          label: "Media Gallery",      href: "/admin/media-gallery" },
  { icon: Package,         label: "Toolkit Downloads",   href: "/admin/toolkit-assets" },
  { icon: Gift,            label: "Affiliate",           href: "/admin/affiliate" },
  { icon: Bot,             label: "Atlas AI",            href: "/admin/atlas" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user     = useAppSelector(s => s.auth.user);
  if (!user) return null;

  const links: NavLink[] = user.role === "ADMIN" ? adminLinks : memberLinks;

  return (
    <aside className="w-[220px] shrink-0 h-screen sticky top-0 bg-white flex flex-col border-r border-slate-100 z-10">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.webp"      alt="TaxComPro" width={120} height={36} className="object-contain dark:hidden" priority />
          <Image src="/logo_dark.webp" alt="TaxComPro" width={120} height={36} className="object-contain hidden dark:block" priority />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {links.map(l => {
          const isActive = pathname === l.href || (!l.exact && l.href !== "/" && pathname.startsWith(l.href + "/"));
          return (
            <Link key={l.href + l.label} href={l.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[#0a1628] text-white"
                  : "text-slate-500 hover:bg-slate-50 hover:text-[#0a1628]"
              }`}>
              <l.icon className="w-4 h-4 shrink-0" />
              {l.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#0a1628] flex items-center justify-center shrink-0 overflow-hidden">
          {user.image
            ? <img src={user.image} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            : <span className="text-white font-bold text-sm">{user.name?.[0]?.toUpperCase()}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[#0a1628] text-xs font-bold truncate">{user.name}</div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 inline-block ${tierStyle[user.tier ?? "FREE"] ?? tierStyle.FREE}`}>
            {tierLabel[user.tier ?? "FREE"]}
          </span>
        </div>
      </div>
    </aside>
  );
}
