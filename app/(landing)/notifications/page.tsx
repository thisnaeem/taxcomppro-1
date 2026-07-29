"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppDispatch } from "@/store/hooks";
import { setNotifications, markAllRead as markAllReadSlice } from "@/store/slices/notificationSlice";
import { Loader2 } from "lucide-react";
import {
  Notification01Icon, Notification02Icon, Tick02Icon,
  UserGroupIcon, ShoppingBag01Icon, School01Icon,
  ArrowUp05Icon, Settings01Icon, UserAdd01Icon,
} from "hugeicons-react";

interface Notification {
  id: string; type: string; title: string;
  message: string; link?: string | null;
  isRead: boolean; createdAt: string;
}

/* Icon + colour per type */
const TYPE_CONFIG: Record<string, { Icon: React.ElementType; bg: string; iconCls: string }> = {
  listing:     { Icon: ShoppingBag01Icon, bg: "bg-amber-100",   iconCls: "text-amber-600" },
  marketplace: { Icon: ShoppingBag01Icon, bg: "bg-amber-100",   iconCls: "text-amber-600" },
  community:   { Icon: UserGroupIcon,     bg: "bg-purple-100",  iconCls: "text-purple-600" },
  connection:  { Icon: UserAdd01Icon,     bg: "bg-blue-100",    iconCls: "text-blue-600" },
  session:     { Icon: School01Icon,      bg: "bg-emerald-100", iconCls: "text-emerald-600" },
  upgrade:     { Icon: ArrowUp05Icon,       bg: "bg-rose-100",    iconCls: "text-rose-600" },
  system:      { Icon: Settings01Icon,    bg: "bg-slate-100",   iconCls: "text-slate-500" },
};
const DEFAULT_CFG = { Icon: Notification01Icon, bg: "bg-slate-100", iconCls: "text-slate-500" };

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

/* ─── Skeleton ─────────────────────────────────────────────── */
function SkeletonNotif() {
  return (
    <div className="flex items-start gap-4 bg-white rounded-2xl p-4 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-2/5" />
        <div className="h-3 bg-slate-200 rounded w-4/5" />
        <div className="h-3 bg-slate-200 rounded w-1/4" />
      </div>
    </div>
  );
}

/* ─── Single notification row ───────────────────────────────── */
function NotifRow({ n }: { n: Notification }) {
  const cfg  = TYPE_CONFIG[n.type] ?? DEFAULT_CFG;
  const Icon = cfg.Icon;

  const content = (
    <div className={`flex items-start gap-4 bg-white rounded-2xl p-4 transition-all hover:-translate-y-0.5 ${!n.isRead ? "ring-1 ring-[#0a1628]/10" : "opacity-75 hover:opacity-100"}`}>
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Icon className={`w-5 h-5 ${cfg.iconCls}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm leading-snug ${n.isRead ? "font-semibold text-slate-600" : "font-black text-[#0a1628]"}`}>
          {n.title}
        </div>
        <div className="text-slate-500 text-xs mt-0.5 leading-relaxed">{n.message}</div>
        <div className="text-slate-400 text-xs mt-1.5">{timeAgo(n.createdAt)}</div>
      </div>

      {/* Unread dot */}
      {!n.isRead && (
        <div className="w-2 h-2 rounded-full bg-[#0a1628] shrink-0 mt-2" />
      )}
    </div>
  );

  return n.link ? (
    <Link href={n.link} className="block">
      {content}
    </Link>
  ) : content;
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const [notifications, setNotifs] = useState<Notification[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [marking,  setMarking]  = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch("/api/notifications")
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setNotifs(list);
        dispatch(setNotifications(list));
      })
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, [dispatch]);

  const handleMarkAll = async () => {
    setMarking(true);
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    dispatch(markAllReadSlice());
    setMarking(false);
  };

  const unread = notifications.filter(n => !n.isRead);
  const read   = notifications.filter(n =>  n.isRead);

  return (
    <div className="min-h-screen bg-slate-100 pt-4 pb-12">
      <div className="max-w-2xl mx-auto px-4 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#0a1628]">Notifications</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {loading ? "Loading…" : unread.length > 0 ? `${unread.length} unread` : "All caught up"}
            </p>
          </div>
          {unread.length > 0 && (
            <button onClick={handleMarkAll} disabled={marking}
              className="flex items-center gap-2 text-sm font-semibold text-[#0a1628] bg-white px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50">
              {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tick02Icon className="w-4 h-4" />}
              Mark all read
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <SkeletonNotif key={i} />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl text-center py-24">
            <Notification02Icon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="font-bold text-slate-400 text-lg">No notifications yet</p>
            <p className="text-slate-400 text-sm mt-1">We'll let you know when something happens</p>
          </div>
        ) : (
          <>
            {/* Unread */}
            {unread.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Unread</p>
                {unread.map(n => <NotifRow key={n.id} n={n} />)}
              </div>
            )}

            {/* Read / Earlier */}
            {read.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 mt-2">Earlier</p>
                {read.map(n => <NotifRow key={n.id} n={n} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
